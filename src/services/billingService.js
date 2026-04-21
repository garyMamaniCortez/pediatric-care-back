const { query } = require("../../db");

const getPendingPayments = async (filters = {}) => {
  try {
    const { search, date, patientId } = filters;
    
    let sql = `
      SELECT 
        a.id as appointment_id,
        a.date as appointment_date,
        a.time as appointment_time,
        a.status as appointment_status,
        p.id as patient_id,
        p.name as patient_name,
        p.birth_date as patient_birth_date,
        p.gender as patient_gender,
        p.blood_type as patient_blood_type,
        p.allergies as patient_allergies,
        p.base_condition as patient_base_condition,
        s.id as service_id,
        s.name as service_name,
        s.price as service_price,
        COALESCE(SUM(pay.amount), 0) as total_paid
      FROM appointments a
      INNER JOIN patients p ON a.patient_id = p.id
      INNER JOIN services s ON a.service_id = s.id
      LEFT JOIN payments pay ON a.id = pay.appointment_id
      WHERE a.status != 'cancelada'
      GROUP BY a.id, p.id, s.id
      HAVING COALESCE(SUM(pay.amount), 0) < s.price
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (patientId) {
      sql += ` AND a.patient_id = $${paramIndex}`;
      params.push(patientId);
      paramIndex++;
    }
    
    if (date) {
      sql += ` AND a.date = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }
    
    if (search) {
      sql += ` AND (p.name ILIKE $${paramIndex} OR s.name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    sql += ` ORDER BY a.date ASC, a.time ASC`;
    
    const result = await query(sql, params);
    
    const pendingPayments = result.rows.map(row => ({
      appointment: {
        id: row.appointment_id,
        patientId: row.patient_id,
        serviceId: row.service_id,
        date: row.appointment_date,
        time: row.appointment_time,
        status: row.appointment_status
      },
      patient: {
        id: row.patient_id,
        name: row.patient_name,
        birthDate: row.patient_birth_date,
        gender: row.patient_gender,
        bloodType: row.patient_blood_type,
        allergies: row.patient_allergies,
        baseCondition: row.patient_base_condition
      },
      service: {
        id: row.service_id,
        name: row.service_name,
        price: parseFloat(row.service_price)
      },
      pendingAmount: parseFloat(row.service_price) - parseFloat(row.total_paid)
    }));
    
    return {
      success: true,
      data: pendingPayments
    };
  } catch (error) {
    console.error("Error en getPendingPayments:", error);
    throw error;
  }
};

const registerPayment = async (paymentData) => {
  try {
    const { appointmentId, patientId, date, concept, amount, method } = paymentData;
    
    await query('BEGIN');
    
    const appointmentCheck = await query(
      `SELECT id, status FROM appointments WHERE id = $1`,
      [appointmentId]
    );
    
    if (appointmentCheck.rows.length === 0) {
      await query('ROLLBACK');
      return {
        success: false,
        message: "La cita no existe"
      };
    }
    
    if (appointmentCheck.rows[0].status === 'cancelada') {
      await query('ROLLBACK');
      return {
        success: false,
        message: "No se puede registrar pago para una cita cancelada"
      };
    }
    
    const servicePriceResult = await query(
      `SELECT s.price 
       FROM appointments a 
       INNER JOIN services s ON a.service_id = s.id 
       WHERE a.id = $1`,
      [appointmentId]
    );
    
    const totalPaidResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_paid 
       FROM payments 
       WHERE appointment_id = $1`,
      [appointmentId]
    );
    
    const servicePrice = parseFloat(servicePriceResult.rows[0].price);
    const totalPaid = parseFloat(totalPaidResult.rows[0].total_paid);
    const newTotal = totalPaid + amount;
    
    if (newTotal > servicePrice) {
      await query('ROLLBACK');
      return {
        success: false,
        message: `El monto excede el valor del servicio. Monto pendiente: ${(servicePrice - totalPaid).toFixed(2)}`
      };
    }
    
    const paymentResult = await query(
      `INSERT INTO payments (appointment_id, patient_id, date, concept, amount, method)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, appointment_id, patient_id, date, concept, amount, method`,
      [appointmentId, patientId, date, concept, amount, method]
    );
    
    if (newTotal >= servicePrice) {
      await query(
        `UPDATE appointments SET status = 'completada' WHERE id = $1`,
        [appointmentId]
      );
    }
    
    await query('COMMIT');
    
    const payment = paymentResult.rows[0];
    
    return {
      success: true,
      data: {
        id: payment.id,
        appointmentId: payment.appointment_id,
        patientId: payment.patient_id,
        date: payment.date,
        concept: payment.concept,
        amount: parseFloat(payment.amount),
        method: payment.method
      }
    };
  } catch (error) {
    await query('ROLLBACK');
    console.error("Error en registerPayment:", error);
    throw error;
  }
};

module.exports = {
  getPendingPayments,
  registerPayment
};