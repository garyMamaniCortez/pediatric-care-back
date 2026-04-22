const { query } = require("../../db");

const getClinicalRecords = async (patientId) => {
  try {
    const result = await query(
      `
      SELECT 
        cr.id,
        cr.appointment_id as "appointmentId",
        cr.patient_id as "patientId",
        cr.date,
        cr.weight,
        cr.height,
        cr.notes,
        cr.diagnosis,
        a.date as "appointmentDate",
        a.time as "appointmentTime",
        s.name as "serviceName"
      FROM clinical_records cr
      JOIN appointments a ON cr.appointment_id = a.id
      JOIN services s ON a.service_id = s.id
      WHERE cr.patient_id = $1
      ORDER BY cr.date DESC, a.time DESC
      `,
      [patientId]
    );

    return {
      success: true,
      data: result.rows,
    };
  } catch (error) {
    console.error("Error en getClinicalRecords:", error);
    throw error;
  }
};

const createClinicalRecord = async (recordData) => {
  
  try {
    await query("BEGIN");

    const { appointmentId, patientId, date, weight, height, notes, diagnosis } = recordData;

    // Verificar que la cita existe y pertenece al paciente
    const appointmentCheck = await query(
      `
      SELECT id, status 
      FROM appointments 
      WHERE id = $1 AND patient_id = $2
      `,
      [appointmentId, patientId]
    );

    if (appointmentCheck.rows.length === 0) {
      await query("ROLLBACK");
      return {
        success: false,
        message: "La cita no existe o no pertenece al paciente",
      };
    }

    if (appointmentCheck.rows[0].status !== "completada") {
      await query("ROLLBACK");
      return {
        success: false,
        message: "Solo se pueden crear registros clínicos para citas completadas",
      };
    }

    // Verificar que no exista ya un registro clínico para esta cita
    const existingRecord = await query(
      `
      SELECT id FROM clinical_records WHERE appointment_id = $1
      `,
      [appointmentId]
    );

    if (existingRecord.rows.length > 0) {
      await query("ROLLBACK");
      return {
        success: false,
        message: "Ya existe un registro clínico para esta cita",
      };
    }

    const result = await query(
      `
      INSERT INTO clinical_records (
        appointment_id,
        patient_id,
        date,
        weight,
        height,
        notes,
        diagnosis
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id,
        appointment_id as "appointmentId",
        patient_id as "patientId",
        date,
        weight,
        height,
        notes,
        diagnosis
      `,
      [appointmentId, patientId, date, weight, height, notes || null, diagnosis || null]
    );

    await query("COMMIT");

    return {
      success: true,
      data: result.rows[0],
    };
  } catch (error) {
    await query("ROLLBACK");
    console.error("Error en createClinicalRecord:", error);
    throw error;
  }
};

const updateClinicalRecord = async (id, updateData) => {
  try {
    const { weight, height, notes, diagnosis } = updateData;

    const result = await query(
      `
      UPDATE clinical_records
      SET 
        weight = COALESCE($1, weight),
        height = COALESCE($2, height),
        notes = COALESCE($3, notes),
        diagnosis = COALESCE($4, diagnosis)
      WHERE id = $5
      RETURNING 
        id,
        appointment_id as "appointmentId",
        patient_id as "patientId",
        date,
        weight,
        height,
        notes,
        diagnosis
      `,
      [weight, height, notes || null, diagnosis || null, id]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        message: "Registro clínico no encontrado",
      };
    }

    return {
      success: true,
      data: result.rows[0],
    };
  } catch (error) {
    console.error("Error en updateClinicalRecord:", error);
    throw error;
  }
};

const getPrescriptions = async (patientId) => {
  try {
    const result = await query(
      `
      SELECT 
        p.id,
        p.clinical_record_id as "clinicalRecordId",
        p.patient_id as "patientId",
        p.date,
        json_agg(
          json_build_object(
            'name', pd.medication_name,
            'presentation', pd.presentation,
            'instructions', pd.instructions
          )
        ) as medications
      FROM prescriptions p
      LEFT JOIN prescription_details pd ON p.id = pd.prescription_id
      WHERE p.patient_id = $1
      GROUP BY p.id
      ORDER BY p.date DESC
      `,
      [patientId]
    );

    return {
      success: true,
      data: result.rows,
    };
  } catch (error) {
    console.error("Error en getPrescriptions:", error);
    throw error;
  }
};

const createPrescription = async (prescriptionData) => {
  
  try {
    await query("BEGIN");

    const { clinicalRecordId, patientId, date, medications } = prescriptionData;

    // Verificar que el registro clínico existe y pertenece al paciente
    const recordCheck = await query(
      `
      SELECT id FROM clinical_records 
      WHERE id = $1 AND patient_id = $2
      `,
      [clinicalRecordId, patientId]
    );

    if (recordCheck.rows.length === 0) {
      await query("ROLLBACK");
      return {
        success: false,
        message: "El registro clínico no existe o no pertenece al paciente",
      };
    }

    // Crear la receta
    const prescriptionResult = await query(
      `
      INSERT INTO prescriptions (
        clinical_record_id,
        patient_id,
        date
      ) VALUES ($1, $2, $3)
      RETURNING id, clinical_record_id as "clinicalRecordId", patient_id as "patientId", date
      `,
      [clinicalRecordId, patientId, date]
    );

    const prescription = prescriptionResult.rows[0];

    // Crear los detalles de la receta
    for (const medication of medications) {
      await query(
        `
        INSERT INTO prescription_details (
          prescription_id,
          medication_name,
          presentation,
          instructions
        ) VALUES ($1, $2, $3, $4)
        `,
        [prescription.id, medication.name, medication.presentation, medication.instructions]
      );
    }

    await query("COMMIT");

    return {
      success: true,
      data: {
        ...prescription,
        medications,
      },
    };
  } catch (error) {
    await query("ROLLBACK");
    console.error("Error en createPrescription:", error);
    throw error;
  }
};

const getCertificates = async (patientId) => {
  try {
    const result = await query(
      `
      SELECT 
        id,
        patient_id as "patientId",
        clinical_record_id as "clinicalRecordId",
        date,
        content
      FROM medical_certificates
      WHERE patient_id = $1
      ORDER BY date DESC
      `,
      [patientId]
    );

    return {
      success: true,
      data: result.rows,
    };
  } catch (error) {
    console.error("Error en getCertificates:", error);
    throw error;
  }
};

const createCertificate = async (certificateData) => {
  try {
    const { patientId, clinicalRecordId, date, content } = certificateData;

    // Verificar que el registro clínico existe y pertenece al paciente
    const recordCheck = await query(
      `
      SELECT id FROM clinical_records 
      WHERE id = $1 AND patient_id = $2
      `,
      [clinicalRecordId, patientId]
    );

    if (recordCheck.rows.length === 0) {
      return {
        success: false,
        message: "El registro clínico no existe o no pertenece al paciente",
      };
    }

    const result = await query(
      `
      INSERT INTO medical_certificates (
        patient_id,
        clinical_record_id,
        date,
        content
      ) VALUES ($1, $2, $3, $4)
      RETURNING 
        id,
        patient_id as "patientId",
        clinical_record_id as "clinicalRecordId",
        date,
        content
      `,
      [patientId, clinicalRecordId, date, content]
    );

    return {
      success: true,
      data: result.rows[0],
    };
  } catch (error) {
    console.error("Error en createCertificate:", error);
    throw error;
  }
};

const getIndications = async (patientId) => {
  try {
    const result = await query(
      `
      SELECT 
        id,
        clinical_record_id as "clinicalRecordId",
        patient_id as "patientId",
        date,
        content
      FROM indications
      WHERE patient_id = $1
      ORDER BY date DESC
      `,
      [patientId]
    );

    return {
      success: true,
      data: result.rows,
    };
  } catch (error) {
    console.error("Error en getIndications:", error);
    throw error;
  }
};

const createIndication = async (indicationData) => {
  try {
    const { clinicalRecordId, patientId, date, content } = indicationData;

    // Verificar que el registro clínico existe y pertenece al paciente
    const recordCheck = await query(
      `
      SELECT id FROM clinical_records 
      WHERE id = $1 AND patient_id = $2
      `,
      [clinicalRecordId, patientId]
    );

    if (recordCheck.rows.length === 0) {
      return {
        success: false,
        message: "El registro clínico no existe o no pertenece al paciente",
      };
    }

    const result = await query(
      `
      INSERT INTO indications (
        clinical_record_id,
        patient_id,
        date,
        content
      ) VALUES ($1, $2, $3, $4)
      RETURNING 
        id,
        clinical_record_id as "clinicalRecordId",
        patient_id as "patientId",
        date,
        content
      `,
      [clinicalRecordId, patientId, date, content]
    );

    return {
      success: true,
      data: result.rows[0],
    };
  } catch (error) {
    console.error("Error en createIndication:", error);
    throw error;
  }
};

module.exports = {
  getClinicalRecords,
  createClinicalRecord,
  updateClinicalRecord,
  getPrescriptions,
  createPrescription,
  getCertificates,
  createCertificate,
  getIndications,
  createIndication,
};