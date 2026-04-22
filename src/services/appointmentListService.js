const { query } = require("../../db");

const getAppointmentsByDate = async (date) => {
  try {
    const result = await query(
      `
      SELECT 
        a.id,
        a.patient_id as "patientId",
        a.service_id as "serviceId",
        a.date,
        a.time,
        a.status,
        p.name as "patientName",
        s.name as "serviceName",
        s.price as "servicePrice"
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN services s ON a.service_id = s.id
      WHERE a.date = $1
      ORDER BY a.time
      `,
      [date]
    );

    return {
      success: true,
      data: result.rows,
    };
  } catch (error) {
    console.error("Error en getAppointmentsByDate:", error);
    throw error;
  }
};

const getAppointmentById = async (id) => {
  try {
    const result = await query(
      `
      SELECT 
        a.id,
        a.patient_id as "patientId",
        a.service_id as "serviceId",
        a.date,
        a.time,
        a.status,
        p.name as "patientName",
        s.name as "serviceName",
        s.price as "servicePrice"
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN services s ON a.service_id = s.id
      WHERE a.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        message: "Cita no encontrada",
        data: null,
      };
    }

    return {
      success: true,
      data: result.rows[0],
    };
  } catch (error) {
    console.error("Error en getAppointmentById:", error);
    throw error;
  }
};

const getAppointmentsByDateRange = async (startDate, endDate) => {
  try {
    const result = await query(
      `
      SELECT 
        a.id,
        a.patient_id as "patientId",
        a.service_id as "serviceId",
        a.date,
        a.time,
        a.status,
        p.name as "patientName",
        s.name as "serviceName",
        s.price as "servicePrice"
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN services s ON a.service_id = s.id
      WHERE a.date BETWEEN $1 AND $2
      ORDER BY a.date, a.time
      `,
      [startDate, endDate]
    );

    return {
      success: true,
      data: result.rows,
    };
  } catch (error) {
    console.error("Error en getAppointmentsByDateRange:", error);
    throw error;
  }
};

const checkAvailability = async (date, time, excludeAppointmentId = null) => {
  try {
    let queryText = `
      SELECT id FROM appointments 
      WHERE date = $1 AND time = $2
    `;
    let params = [date, time];

    if (excludeAppointmentId) {
      queryText += ` AND id != $3`;
      params.push(excludeAppointmentId);
    }

    const result = await query(queryText, params);

    if (result.rows.length > 0) {
      return {
        success: false,
        message: "Ya existe una cita programada en esta fecha y hora",
      };
    }

    return {
      success: true,
      message: "Horario disponible",
    };
  } catch (error) {
    console.error("Error en checkAvailability:", error);
    throw error;
  }
};

const checkPatientExists = async (patientId) => {
  try {
    const result = await query(
      `
      SELECT id, name FROM patients WHERE id = $1
      `,
      [patientId]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        message: "Paciente no encontrado",
      };
    }

    return {
      success: true,
      data: result.rows[0],
    };
  } catch (error) {
    console.error("Error en checkPatientExists:", error);
    throw error;
  }
};

const checkServiceExists = async (serviceId) => {
  try {
    const result = await query(
      `
      SELECT id, name, price FROM services WHERE id = $1
      `,
      [serviceId]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        message: "Servicio no encontrado",
      };
    }

    return {
      success: true,
      data: result.rows[0],
    };
  } catch (error) {
    console.error("Error en checkServiceExists:", error);
    throw error;
  }
};

const checkAppointmentExists = async (appointmentId) => {
  try {
    const result = await query(
      `
      SELECT 
        id, 
        patient_id as "patientId", 
        service_id as "serviceId", 
        date, 
        time, 
        status 
      FROM appointments 
      WHERE id = $1
      `,
      [appointmentId]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        message: "Cita no encontrada",
      };
    }

    return {
      success: true,
      data: result.rows[0],
    };
  } catch (error) {
    console.error("Error en checkAppointmentExists:", error);
    throw error;
  }
};

const createAppointment = async (appointmentData) => {
  try {
    const { patientId, serviceId, date, time } = appointmentData;

    const result = await query(
      `
      INSERT INTO appointments (patient_id, service_id, date, time, status)
      VALUES ($1, $2, $3, $4, 'pendiente')
      RETURNING 
        id,
        patient_id as "patientId",
        service_id as "serviceId",
        date,
        time,
        status
      `,
      [patientId, serviceId, date, time]
    );

    return {
      success: true,
      data: result.rows[0],
    };
  } catch (error) {
    console.error("Error en createAppointment:", error);
    throw error;
  }
};

const updateAppointment = async (id, updateData) => {
  try {
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (updateData.patientId !== undefined) {
      updates.push(`patient_id = $${paramIndex++}`);
      params.push(updateData.patientId);
    }
    if (updateData.serviceId !== undefined) {
      updates.push(`service_id = $${paramIndex++}`);
      params.push(updateData.serviceId);
    }
    if (updateData.date !== undefined) {
      updates.push(`date = $${paramIndex++}`);
      params.push(updateData.date);
    }
    if (updateData.time !== undefined) {
      updates.push(`time = $${paramIndex++}`);
      params.push(updateData.time);
    }
    if (updateData.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(updateData.status);
    }

    if (updates.length === 0) {
      return {
        success: false,
        message: "No se proporcionaron datos para actualizar",
      };
    }

    params.push(id);
    const queryText = `
      UPDATE appointments 
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        patient_id as "patientId",
        service_id as "serviceId",
        date,
        time,
        status
    `;

    const result = await query(queryText, params);

    return {
      success: true,
      data: result.rows[0],
    };
  } catch (error) {
    console.error("Error en updateAppointment:", error);
    throw error;
  }
};

const cancelAppointment = async (id) => {
  try {
    const result = await query(
      `
      UPDATE appointments 
      SET status = 'cancelada'
      WHERE id = $1 AND status != 'cancelada'
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        message: "Cita no encontrada o ya está cancelada",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error en cancelAppointment:", error);
    throw error;
  }
};

module.exports = {
  getAppointmentsByDate,
  getAppointmentsByDateRange,
  getAppointmentById,
  checkAvailability,
  checkPatientExists,
  checkServiceExists,
  checkAppointmentExists,
  createAppointment,
  updateAppointment,
  cancelAppointment,
};