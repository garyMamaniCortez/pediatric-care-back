const { query } = require("../../db");

const createPatient = async (patientData) => {
  const client = await query('BEGIN');
  
  try {
    const {
      name,
      birthDate,
      gender,
      bloodType,
      allergies = 'Ninguna',
      baseCondition = 'Ninguna',
      guardians
    } = patientData;
    
    const patientResult = await query(
      `INSERT INTO patients (name, birth_date, gender, blood_type, allergies, base_condition)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, birth_date as "birthDate", gender, blood_type as "bloodType", 
                 allergies, base_condition as "baseCondition"`,
      [name, birthDate, gender, bloodType, allergies, baseCondition]
    );
    
    const patient = patientResult.rows[0];
    
    const savedGuardians = [];
    
    for (const guardian of guardians) {
      let guardianResult = await query(
        `SELECT id, name, phone, relationship 
         FROM guardians 
         WHERE name = $1 AND phone = $2`,
        [guardian.name, guardian.phone]
      );
      
      let guardianId;
      
      if (guardianResult.rows.length === 0) {
        const relationshipValue = guardian.relationship === 'otro' 
          ? guardian.relationshipOther || 'otro' 
          : guardian.relationship;
        
        guardianResult = await query(
          `INSERT INTO guardians (name, phone, relationship, relationship_other)
           VALUES ($1, $2, $3, $4)
           RETURNING id, name, phone, relationship`,
          [guardian.name, guardian.phone, guardian.relationship, 
           guardian.relationship === 'otro' ? guardian.relationshipOther : null]
        );
        
        guardianId = guardianResult.rows[0].id;
        savedGuardians.push({
          id: guardianId,
          name: guardian.name,
          phone: guardian.phone,
          relationship: guardian.relationship,
          relationshipOther: guardian.relationshipOther
        });
      } else {
        guardianId = guardianResult.rows[0].id;
        savedGuardians.push(guardianResult.rows[0]);
      }
      
      await query(
        `INSERT INTO patient_guardians (patient_id, guardian_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [patient.id, guardianId]
      );
    }
    
    const completePatientResult = await query(
      `SELECT 
         p.id, p.name, p.birth_date as "birthDate", p.gender, 
         p.blood_type as "bloodType", p.allergies, p.base_condition as "baseCondition",
         json_agg(
           json_build_object(
             'id', g.id,
             'name', g.name,
             'phone', g.phone,
             'relationship', g.relationship,
             'relationshipOther', g.relationship_other
           )
         ) as guardians
       FROM patients p
       LEFT JOIN patient_guardians pg ON p.id = pg.patient_id
       LEFT JOIN guardians g ON pg.guardian_id = g.id
       WHERE p.id = $1
       GROUP BY p.id`,
      [patient.id]
    );
    
    await query('COMMIT');
    
    return {
      success: true,
      data: completePatientResult.rows[0]
    };
  } catch (error) {
    await query('ROLLBACK');
    console.error("Error en createPatient:", error);
    return {
      success: false,
      message: error.message || "Error al crear el paciente"
    };
  }
};

const searchPatient = async (searchTerm) => {
  try {
    const result = await query(
      `SELECT 
         p.id, p.name, p.birth_date as "birthDate", p.gender, 
         p.blood_type as "bloodType", p.allergies, p.base_condition as "baseCondition",
         COALESCE(
           json_agg(
             DISTINCT jsonb_build_object(
               'id', g.id,
               'name', g.name,
               'phone', g.phone,
               'relationship', g.relationship,
               'relationshipOther', g.relationship_other
             )
           ) FILTER (WHERE g.id IS NOT NULL), 
           '[]'::json
         ) as guardians
       FROM patients p
       LEFT JOIN patient_guardians pg ON p.id = pg.patient_id
       LEFT JOIN guardians g ON pg.guardian_id = g.id
       WHERE p.name ILIKE $1 OR p.id::text ILIKE $1
       GROUP BY p.id
       ORDER BY p.name
       LIMIT 20`,
      [`%${searchTerm}%`]
    );
    
    return {
      success: true,
      data: result.rows
    };
  } catch (error) {
    console.error("Error en searchPatient:", error);
    return {
      success: false,
      message: error.message || "Error al buscar pacientes"
    };
  }
};

const scheduleAppointment = async (appointmentData) => {
  const client = await query('BEGIN');
  
  try {
    const { patientId, serviceId, date, time } = appointmentData;
    
    const patientCheck = await query(
      'SELECT id FROM patients WHERE id = $1',
      [patientId]
    );
    
    if (patientCheck.rows.length === 0) {
      await query('ROLLBACK');
      return {
        success: false,
        message: "El paciente no existe"
      };
    }
    
    const serviceCheck = await query(
      'SELECT id, name, price FROM services WHERE id = $1',
      [serviceId]
    );
    
    if (serviceCheck.rows.length === 0) {
      await query('ROLLBACK');
      return {
        success: false,
        message: "El servicio no existe"
      };
    }
    
    const existingAppointment = await query(
      `SELECT id FROM appointments 
       WHERE date = $1 AND time = $2`,
      [date, time]
    );
    
    if (existingAppointment.rows.length > 0) {
      await query('ROLLBACK');
      return {
        success: false,
        message: `Ya existe una cita agendada para el ${date} a las ${time}`
      };
    }
    
    const appointmentResult = await query(
      `INSERT INTO appointments (patient_id, service_id, date, time, status)
       VALUES ($1, $2, $3, $4, 'pendiente')
       RETURNING id, patient_id as "patientId", service_id as "serviceId", 
                 date, time, status`,
      [patientId, serviceId, date, time]
    );
    
    await query('COMMIT');
    
    return {
      success: true,
      data: appointmentResult.rows[0]
    };
  } catch (error) {
    await query('ROLLBACK');
    console.error("Error en scheduleAppointment:", error);
    return {
      success: false,
      message: error.message || "Error al agendar la cita"
    };
  }
};

const getBusyTimes = async (date) => {
  try {
    const result = await query(
      `SELECT time 
       FROM appointments 
       WHERE date = $1 AND status != 'cancelada'
       ORDER BY time`,
      [date]
    );
    
    const busyTimes = result.rows.map(row => row.time);
    
    return {
      success: true,
      data: busyTimes
    };
  } catch (error) {
    console.error("Error en getBusyTimes:", error);
    return {
      success: false,
      message: error.message || "Error al obtener horarios ocupados"
    };
  }
};

const getServices = async () => {
  try {
    const result = await query(
      `SELECT id, name, price 
       FROM services 
       WHERE active = true
       ORDER BY name`
    );
    
    return {
      success: true,
      data: result.rows
    };
  } catch (error) {
    console.error("Error en getServices:", error);
    return {
      success: false,
      message: error.message || "Error al obtener servicios"
    };
  }
};

const updateAppointment = async (appointmentId, updateData) => {
  const client = await query('BEGIN');
  
  try {
    const updates = [];
    const values = [];
    let paramCounter = 1;
    
    if (updateData.status) {
      updates.push(`status = $${paramCounter++}`);
      values.push(updateData.status);
    }
    
    if (updateData.date) {
      updates.push(`date = $${paramCounter++}`);
      values.push(updateData.date);
    }
    
    if (updateData.time) {
      if (updateData.date || updateData.time) {
        const checkDate = updateData.date || (await getCurrentAppointmentDate(appointmentId));
        const checkTime = updateData.time;
        
        if (checkTime) {
          const conflictCheck = await query(
            `SELECT id FROM appointments 
             WHERE date = $1 AND time = $2 AND id != $3 AND status != 'cancelada'`,
            [checkDate, checkTime, appointmentId]
          );
          
          if (conflictCheck.rows.length > 0) {
            await query('ROLLBACK');
            return {
              success: false,
              message: `El horario ${checkTime} ya está ocupado para la fecha ${checkDate}`
            };
          }
        }
      }
      
      updates.push(`time = $${paramCounter++}`);
      values.push(updateData.time);
    }
    
    if (updates.length === 0) {
      await query('ROLLBACK');
      return {
        success: false,
        message: "No hay datos para actualizar"
      };
    }
    
    values.push(appointmentId);
    
    const result = await query(
      `UPDATE appointments 
       SET ${updates.join(', ')}
       WHERE id = $${paramCounter}
       RETURNING id, patient_id as "patientId", service_id as "serviceId", 
                 date, time, status`,
      values
    );
    
    if (result.rows.length === 0) {
      await query('ROLLBACK');
      return {
        success: false,
        message: "Cita no encontrada"
      };
    }
    
    await query('COMMIT');
    
    return {
      success: true,
      data: result.rows[0]
    };
  } catch (error) {
    await query('ROLLBACK');
    console.error("Error en updateAppointment:", error);
    return {
      success: false,
      message: error.message || "Error al actualizar la cita"
    };
  }
};

const getCurrentAppointmentDate = async (appointmentId) => {
  const result = await query(
    'SELECT date FROM appointments WHERE id = $1',
    [appointmentId]
  );
  return result.rows[0]?.date;
};

module.exports = {
  createPatient,
  searchPatient,
  scheduleAppointment,
  getBusyTimes,
  getServices,
  updateAppointment
};