const { query } = require("../../db");
const bcrypt = require("bcrypt");

const authenticateUser = async (username, password) => {
  try {
    const userResult = await query(
      `
      SELECT 
        id, 
        username, 
        password_hash as contrasenia, 
        role
      FROM users 
      WHERE username = $1
      `,
      [username]
    );

    if (userResult.rows.length === 0) {
      console.log("Usuario no encontrado");
      return {
        success: false,
        message: "Usuario o contraseña incorrectos",
      };
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.contrasenia);

    if (!isMatch) {
      console.log("Contraseña incorrecta para usuario:", username);
      return {
        success: false,
        message: "Usuario o contraseña incorrectos",
      };
    }

    delete user.contrasenia;
    
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    };
  } catch (error) {
    console.error("Error en authenticateUser:", error);
    throw error;
  }
};

module.exports = {
  authenticateUser,
};