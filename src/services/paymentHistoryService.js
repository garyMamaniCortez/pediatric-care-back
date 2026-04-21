const { query } = require("../../db");

const getPayments = async (filters = {}) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, patientId } = filters;
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    const params = [];
    let paramIndex = 1;
    
    if (patientId) {
      whereConditions.push(`p.patient_id = $${paramIndex}`);
      params.push(patientId);
      paramIndex++;
    }
    
    if (startDate) {
      whereConditions.push(`p.date >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      whereConditions.push(`p.date <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM payments p
      ${whereClause}
    `;
    
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    const paymentsQuery = `
      SELECT 
        p.id,
        p.appointment_id,
        p.patient_id,
        p.date,
        p.concept,
        p.amount,
        p.method,
        pat.name as patient_name,
        s.name as service_name,
        a.date as appointment_date,
        a.time as appointment_time
      FROM payments p
      INNER JOIN patients pat ON p.patient_id = pat.id
      INNER JOIN appointments a ON p.appointment_id = a.id
      INNER JOIN services s ON a.service_id = s.id
      ${whereClause}
      ORDER BY p.date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const paymentsParams = [...params, limit, offset];
    const paymentsResult = await query(paymentsQuery, paymentsParams);
    
    const totalsQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN method = 'efectivo' THEN amount ELSE 0 END), 0) as total_efectivo,
        COALESCE(SUM(CASE WHEN method = 'qr' THEN amount ELSE 0 END), 0) as total_qr,
        COALESCE(SUM(amount), 0) as total_general
      FROM payments p
      ${whereClause}
    `;
    
    const totalsResult = await query(totalsQuery, params);
    
    const payments = paymentsResult.rows.map(row => ({
      id: row.id,
      appointmentId: row.appointment_id,
      patientId: row.patient_id,
      date: row.date,
      concept: row.concept,
      amount: parseFloat(row.amount),
      method: row.method,
      patientName: row.patient_name,
      serviceName: row.service_name,
      appointmentDate: row.appointment_date,
      appointmentTime: row.appointment_time
    }));
    
    return {
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        },
        totals: {
          total: parseFloat(totalsResult.rows[0].total_general),
          totalEfectivo: parseFloat(totalsResult.rows[0].total_efectivo),
          totalQr: parseFloat(totalsResult.rows[0].total_qr)
        }
      }
    };
  } catch (error) {
    console.error("Error en getPayments:", error);
    throw error;
  }
};

module.exports = {
  getPayments
};