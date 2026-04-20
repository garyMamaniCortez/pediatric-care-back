const { query } = require("../../db");

const getPatients = async (filters) => {
  try {
    const {
      page = 1,
      limit = 10,
      gender,
      minAge,
      maxAge,
      relationship,
      search
    } = filters;

    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (gender && gender !== 'todos') {
      conditions.push(`p.gender = $${paramIndex}`);
      params.push(gender);
      paramIndex++;
    }

    if (search) {
      conditions.push(`p.name ILIKE $${paramIndex}`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (relationship && relationship !== 'todos') {
      conditions.push(`g.relationship = $${paramIndex}`);
      params.push(relationship);
      paramIndex++;
    }

    if (minAge !== undefined && !isNaN(minAge)) {
      conditions.push(`EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.birth_date)) >= $${paramIndex}`);
      params.push(minAge);
      paramIndex++;
    }

    if (maxAge !== undefined && !isNaN(maxAge)) {
      conditions.push(`EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.birth_date)) <= $${paramIndex}`);
      params.push(maxAge);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';

    const patientsQuery = `
      SELECT 
        p.id,
        p.name,
        p.birth_date as "birthDate",
        p.gender,
        p.blood_type as "bloodType",
        p.allergies,
        p.base_condition as "baseCondition",
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
          '[]'
        ) as guardians
      FROM patients p
      LEFT JOIN patient_guardians pg ON p.id = pg.patient_id
      LEFT JOIN guardians g ON pg.guardian_id = g.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.name
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const patientsParams = [...params, limit, offset];
    const patientsResult = await query(patientsQuery, patientsParams);

    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM patients p
      LEFT JOIN patient_guardians pg ON p.id = pg.patient_id
      LEFT JOIN guardians g ON pg.guardian_id = g.id
      ${whereClause}
    `;

    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || 0);

    return {
      patients: patientsResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error("Error en getPatients:", error);
    throw error;
  }
};

const updatePatient = async (id, updateData) => {
  try {
    const checkQuery = `
      SELECT id FROM patients WHERE id = $1
    `;
    const checkResult = await query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return {
        success: false,
        message: "Paciente no encontrado"
      };
    }

    const allowedFields = ['name', 'birth_date', 'gender', 'blood_type', 'allergies', 'base_condition'];
    const updates = [];
    const params = [id];
    let paramIndex = 2;

    for (const field of allowedFields) {
      const dbField = field === 'birth_date' ? 'birth_date' : field;
      const value = updateData[field === 'birth_date' ? 'birthDate' : field];
      
      if (value !== undefined) {
        updates.push(`${dbField} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return {
        success: true,
        patient: await getPatientById(id)
      };
    }

    const updateQuery = `
      UPDATE patients 
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING 
        id,
        name,
        birth_date as "birthDate",
        gender,
        blood_type as "bloodType",
        allergies,
        base_condition as "baseCondition"
    `;

    const result = await query(updateQuery, params);

    const updatedPatient = await getPatientById(id);

    return {
      success: true,
      patient: updatedPatient
    };
  } catch (error) {
    console.error("Error en updatePatient:", error);
    throw error;
  }
};

const deletePatient = async (id) => {
  try {
    const checkQuery = `
      SELECT id, name FROM patients WHERE id = $1
    `;
    const checkResult = await query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return {
        success: false,
        message: "Paciente no encontrado"
      };
    }

    const appointmentsQuery = `
      SELECT COUNT(*) as count FROM appointments WHERE patient_id = $1
    `;
    const appointmentsResult = await query(appointmentsQuery, [id]);
    const appointmentsCount = parseInt(appointmentsResult.rows[0]?.count || 0);

    if (appointmentsCount > 0) {
      return {
        success: false,
        message: `No se puede eliminar el paciente porque tiene ${appointmentsCount} cita(s) asociada(s). Primero elimine las citas.`
      };
    }

    const deleteQuery = `
      DELETE FROM patients WHERE id = $1
    `;
    await query(deleteQuery, [id]);

    return {
      success: true,
      message: "Paciente eliminado exitosamente"
    };
  } catch (error) {
    console.error("Error en deletePatient:", error);
    throw error;
  }
};

const getPatientById = async (id) => {
  const queryText = `
    SELECT 
      p.id,
      p.name,
      p.birth_date as "birthDate",
      p.gender,
      p.blood_type as "bloodType",
      p.allergies,
      p.base_condition as "baseCondition",
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
        '[]'
      ) as guardians
    FROM patients p
    LEFT JOIN patient_guardians pg ON p.id = pg.patient_id
    LEFT JOIN guardians g ON pg.guardian_id = g.id
    WHERE p.id = $1
    GROUP BY p.id
  `;
  
  const result = await query(queryText, [id]);
  return result.rows[0] || null;
};

module.exports = {
  getPatients,
  updatePatient,
  deletePatient,
  getPatientById
};