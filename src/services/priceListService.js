const { query } = require("../../db");

const getServices = async (page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    
    const countResult = await query(
      `SELECT COUNT(*) as total FROM services WHERE active = true`
    );
    
    const total = parseInt(countResult.rows[0].total);
    
    const servicesResult = await query(
      `SELECT 
        id, 
        name, 
        price
      FROM services 
      WHERE active = true
      ORDER BY name ASC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    return {
      success: true,
      data: {
        services: servicesResult.rows,
        total: total,
        page: page,
        limit: limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error("Error en getServices:", error);
    throw error;
  }
};

const addService = async (serviceData) => {
  const { name, price } = serviceData;
  
  try {
    const existingService = await query(
      `SELECT id FROM services WHERE name = $1 AND active = true`,
      [name]
    );
    
    if (existingService.rows.length > 0) {
      return {
        success: false,
        message: "Ya existe un servicio con este nombre"
      };
    }
    
    const result = await query(
      `INSERT INTO services (name, price)
       VALUES ($1, $2)
       RETURNING id, name, price`,
      [name, price]
    );
    
    return {
      success: true,
      data: result.rows[0],
      message: "Servicio creado exitosamente"
    };
  } catch (error) {
    console.error("Error en addService:", error);
    throw error;
  }
};

const updateService = async (id, serviceData) => {
  const { name, price } = serviceData;
  
  try {
    const existingService = await query(
      `SELECT id FROM services WHERE id = $1 AND active = true`,
      [id]
    );
    
    if (existingService.rows.length === 0) {
      return {
        success: false,
        message: "Servicio no encontrado"
      };
    }
    
    if (name) {
      const duplicateService = await query(
        `SELECT id FROM services WHERE name = $1 AND id != $2 AND active = true`,
        [name, id]
      );
      
      if (duplicateService.rows.length > 0) {
        return {
          success: false,
          message: "Ya existe otro servicio con este nombre"
        };
      }
    }
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    
    if (price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      values.push(price);
    }
    
    if (updates.length === 0) {
      return {
        success: false,
        message: "No hay datos para actualizar"
      };
    }
    
    values.push(id);
    
    const queryText = `
      UPDATE services 
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex} AND active = true
      RETURNING id, name, price
    `;
    
    const result = await query(queryText, values);
    
    return {
      success: true,
      data: result.rows[0],
      message: "Servicio actualizado exitosamente"
    };
  } catch (error) {
    console.error("Error en updateService:", error);
    throw error;
  }
};

const deleteService = async (id) => {
  try {
    const existingService = await query(
      `SELECT id FROM services WHERE id = $1 AND active = true`,
      [id]
    );
    
    if (existingService.rows.length === 0) {
      return {
        success: false,
        message: "Servicio no encontrado"
      };
    }
    
    await query(
      `UPDATE services 
       SET active = false
       WHERE id = $1 AND active = true`,
      [id]
    );
    
    return {
      success: true,
      message: "Servicio eliminado exitosamente"
    };
  } catch (error) {
    console.error("Error en deleteService:", error);
    throw error;
  }
};

module.exports = {
  getServices,
  addService,
  updateService,
  deleteService
};