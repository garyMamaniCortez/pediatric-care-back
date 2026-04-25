const { query } = require("../../db");
const { HEIGHT_FOR_AGE_GIRLS_UP_TO_5_YEARS, HEIGHT_FOR_AGE_GIRLS_UP_TO_19_YEARS, HEIGHT_FOR_AGE_BOYS_UP_TO_5_YEARS, HEIGHT_FOR_AGE_BOYS_UP_TO_19_YEARS } = require('../data/heightForAge');
const { WEIGHT_FOR_AGE_GIRLS_UP_TO_5_YEARS, WEIGHT_FOR_AGE_GIRLS_UP_TO_10_YEARS, WEIGHT_FOR_AGE_BOYS_UP_TO_5_YEARS, WEIGHT_FOR_AGE_BOYS_UP_TO_10_YEARS } = require('../data/weightForAge');
const { WEIGHT_FOR_HEIGHT_GIRLS_UP_TO_5_YEARS, WEIGHT_FOR_HEIGHT_BOYS_UP_TO_5_YEARS, BMI_GIRLS_UP_TO_19_YEARS, BMI_BOYS_UP_TO_19_YEARS } = require('../data/weightForHeight');

const calculateAge = (birthDate, referenceDate) => {
  const birth = new Date(birthDate);
  const reference = new Date(referenceDate);
  
  const diffTime = Math.abs(reference - birth);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = (reference.getFullYear() - birth.getFullYear()) * 12 + 
                     (reference.getMonth() - birth.getMonth());
  
  if (diffDays < 730) {
    return { value: diffDays, unit: 'days' };
  }
  
  // Para mayores de 2 años, devolvemos edad en meses
  return { value: diffMonths, unit: 'months' };
};

/**
 * Encuentra el registro más cercano por interpolación
 */
const findClosestRecord = (data, ageValue, valueKey = 'age') => {
  if (!data || data.length === 0) return null;
  
  // Ordenar datos por edad
  const sortedData = [...data].sort((a, b) => a[valueKey] - b[valueKey]);
  
  // Buscar coincidencia exacta o el más cercano
  let closest = sortedData[0];
  let minDiff = Math.abs(sortedData[0][valueKey] - ageValue);
  
  for (let i = 1; i < sortedData.length; i++) {
    const diff = Math.abs(sortedData[i][valueKey] - ageValue);
    if (diff < minDiff) {
      minDiff = diff;
      closest = sortedData[i];
    }
  }
  
  return closest;
};

/**
 * Interpola valores entre dos puntos
 */
const interpolate = (record1, record2, ageValue, valueKey = 'age') => {
  if (!record1 || !record2) return record1 || record2;
  if (record1[valueKey] === record2[valueKey]) return record1;
  
  const ratio = (ageValue - record1[valueKey]) / (record2[valueKey] - record1[valueKey]);
  
  const result = { age: ageValue };
  const fields = ['SD3neg', 'SD2neg', 'SD1neg', 'SD0', 'SD1', 'SD2', 'SD3'];
  
  fields.forEach(field => {
    if (record1[field] !== undefined && record2[field] !== undefined) {
      result[field] = record1[field] + (record2[field] - record1[field]) * ratio;
    }
  });
  
  return result;
};

/**
 * Obtiene referencia de peso para la edad
 */
const getWeightForAge = (gender, ageInDays, ageInMonths, isUnder2Years) => {
  let reference = null;
  let ageValue = isUnder2Years ? ageInDays : ageInMonths;
  let valueKey = 'age';
  
  if (isUnder2Years) {
    // Menor de 2 años: usar tablas hasta 5 años (edad en días)
    reference = gender === 'femenino' 
      ? WEIGHT_FOR_AGE_GIRLS_UP_TO_5_YEARS 
      : WEIGHT_FOR_AGE_BOYS_UP_TO_5_YEARS;
  } else {
    // Mayor de 2 años: usar tablas hasta 10 años (edad en meses)
    if (ageInMonths <= 120) { // Hasta 10 años
      reference = gender === 'femenino' 
        ? WEIGHT_FOR_AGE_GIRLS_UP_TO_10_YEARS 
        : WEIGHT_FOR_AGE_BOYS_UP_TO_10_YEARS;
      valueKey = 'months';
      // Convertir ageInMonths al formato de la tabla (puede ser 'months' o 'age')
      if (reference[0] && reference[0].months !== undefined) {
        valueKey = 'months';
      }
    } else {
      // Para mayores de 10 años, usará BMI
      return null;
    }
  }
  
  if (!reference) return null;
  
  // Encontrar registros para interpolación
  const sortedRef = [...reference].sort((a, b) => a[valueKey] - b[valueKey]);
  let lower = null;
  let upper = null;
  
  for (let i = 0; i < sortedRef.length; i++) {
    if (sortedRef[i][valueKey] <= ageValue) {
      lower = sortedRef[i];
    }
    if (sortedRef[i][valueKey] >= ageValue && !upper) {
      upper = sortedRef[i];
    }
  }
  
  if (lower && upper && lower !== upper) {
    return interpolate(lower, upper, ageValue, valueKey);
  }
  
  return lower || upper;
};

/**
 * Obtiene referencia de talla para la edad
 */
const getHeightForAge = (gender, ageInDays, ageInMonths, isUnder2Years) => {
  let reference = null;
  let ageValue = isUnder2Years ? ageInDays : ageInMonths;
  
  if (isUnder2Years) {
    // Menor de 2 años: usar tablas hasta 5 años (edad en días)
    reference = gender === 'femenino' 
      ? HEIGHT_FOR_AGE_GIRLS_UP_TO_5_YEARS 
      : HEIGHT_FOR_AGE_BOYS_UP_TO_5_YEARS;
  } else if (ageInMonths <= 228) { // Hasta 19 años (228 meses)
    reference = gender === 'femenino' 
      ? HEIGHT_FOR_AGE_GIRLS_UP_TO_19_YEARS 
      : HEIGHT_FOR_AGE_BOYS_UP_TO_19_YEARS;
  }
  
  if (!reference) return null;
  
  // Encontrar registros para interpolación
  const sortedRef = [...reference].sort((a, b) => a.age - b.age);
  let lower = null;
  let upper = null;
  
  for (let i = 0; i < sortedRef.length; i++) {
    if (sortedRef[i].age <= ageValue) {
      lower = sortedRef[i];
    }
    if (sortedRef[i].age >= ageValue && !upper) {
      upper = sortedRef[i];
    }
  }
  
  if (lower && upper && lower !== upper) {
    return interpolate(lower, upper, ageValue);
  }
  
  return lower || upper;
};

/**
 * Obtiene referencia de peso para la talla
 */
const getWeightForHeight = (gender, height) => {
  // Solo aplica para menores de 5 años y talla entre 65-120 cm
  if (height < 65 || height > 120) return null;
  
  const reference = gender === 'femenino' 
    ? WEIGHT_FOR_HEIGHT_GIRLS_UP_TO_5_YEARS 
    : WEIGHT_FOR_HEIGHT_BOYS_UP_TO_5_YEARS;
  
  if (!reference) return null;
  
  // Encontrar registros para interpolación
  const sortedRef = [...reference].sort((a, b) => a.Height - b.Height);
  let lower = null;
  let upper = null;
  
  for (let i = 0; i < sortedRef.length; i++) {
    if (sortedRef[i].Height <= height) {
      lower = sortedRef[i];
    }
    if (sortedRef[i].Height >= height && !upper) {
      upper = sortedRef[i];
    }
  }
  
  if (lower && upper && lower !== upper) {
    const ratio = (height - lower.Height) / (upper.Height - lower.Height);
    const result = { Height: height };
    const fields = ['SD3neg', 'SD2neg', 'SD1neg', 'SD0', 'SD1', 'SD2', 'SD3'];
    
    fields.forEach(field => {
      if (lower[field] !== undefined && upper[field] !== undefined) {
        result[field] = lower[field] + (upper[field] - lower[field]) * ratio;
      }
    });
    
    return result;
  }
  
  return lower || upper;
};

/**
 * Obtiene referencia de BMI
 */
const getBMIReference = (gender, ageInMonths) => {
  if (ageInMonths < 24 || ageInMonths > 228) return null; // 2-19 años
  
  const reference = gender === 'femenino' 
    ? BMI_GIRLS_UP_TO_19_YEARS 
    : BMI_BOYS_UP_TO_19_YEARS;
  
  if (!reference) return null;
  
  // Encontrar registros para interpolación
  const sortedRef = [...reference].sort((a, b) => a.months - b.months);
  let lower = null;
  let upper = null;
  
  for (let i = 0; i < sortedRef.length; i++) {
    if (sortedRef[i].months <= ageInMonths) {
      lower = sortedRef[i];
    }
    if (sortedRef[i].months >= ageInMonths && !upper) {
      upper = sortedRef[i];
    }
  }
  
  if (lower && upper && lower !== upper) {
    const ratio = (ageInMonths - lower.months) / (upper.months - lower.months);
    const result = { months: ageInMonths };
    const fields = ['SD3neg', 'SD2neg', 'SD1neg', 'SD0', 'SD1', 'SD2', 'SD3'];
    
    fields.forEach(field => {
      if (lower[field] !== undefined && upper[field] !== undefined) {
        result[field] = lower[field] + (upper[field] - lower[field]) * ratio;
      }
    });
    
    return result;
  }
  
  return lower || upper;
};

/**
 * Calcula el BMI
 */
const calculateBMI = (weight, height) => {
  if (!weight || !height) return null;
  // height en cm, convertir a metros
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

/**
 * Función principal para obtener referencias de crecimiento
 */
const getGrowthReferences = (patient, recordDate, weight, height) => {
  const { birth_date, gender } = patient;
  const age = calculateAge(birth_date, recordDate);
  const isUnder2Years = age.unit === 'days' && age.value < 730;
  const ageInDays = age.unit === 'days' ? age.value : null;
  const ageInMonths = age.unit === 'months' ? age.value : null;
  
  const references = {};
  
  if (isUnder2Years) {
    // Menor de 2 años: peso para edad y talla para edad
    references.weight_for_age = getWeightForAge(gender, ageInDays, null, true);
    references.height_for_age = getHeightForAge(gender, ageInDays, null, true);
  } else {
    // Mayor de 2 años: peso para talla y talla para edad
    references.height_for_age = getHeightForAge(gender, null, ageInMonths, false);
    
    // Intentar peso para talla (solo si está en rango)
    if (height && height >= 65 && height <= 120) {
      references.weight_for_height = getWeightForHeight(gender, height);
    }
    
    // Si no se encontró peso para talla, usar BMI
    if (!references.weight_for_height && weight && height) {
      const bmi = calculateBMI(weight, height);
      references.bmi = getBMIReference(gender, ageInMonths);
      
      if (references.bmi && bmi) {
        references.bmi.current_value = bmi;
      }
    }
  }
  
  return references;
};

const getClinicalRecords = async (patientId) => {
  try {
    const patientResult = await query(
      `SELECT id, name, birth_date, gender FROM patients WHERE id = $1`,
      [patientId]
    );
    
    if (patientResult.rows.length === 0) {
      throw new Error('Paciente no encontrado');
    }
    
    const patient = patientResult.rows[0];
    
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
    
    const enrichedData = result.rows.map(record => {
      const recordDate = record.date || record.appointmentDate;
      const references = getGrowthReferences(
        patient,
        recordDate,
        record.weight,
        record.height
      );
      
      return {
        ...record,
        growth_references: references
      };
    });
    
    return {
      success: true,
      data: enrichedData,
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