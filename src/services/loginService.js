const { query } = require("../../db");
const bcrypt = require("bcrypt");

const authenticateUser = async (username, password) => {
  try {
    const userResult = await query(
      ``,
      [username],
    );

    if (userResult.rows.length === 0) {
      console.log("Usuario no encontrado o inactivo");
      return {
        success: false,
        message: "Usuario o contraseña incorrectos",
      };
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.contrasenia);

    if (!isMatch) {
      console.log("Contraseña no coincide");
      return {
        success: false,
        message: "Usuario o contraseña incorrectos",
      };
    }

    delete user.contrasenia;

    return {
      success: true,
      user
    };
  } catch (error) {
    console.error("Error en authenticateUser:", error);
    throw error;
  }
};

module.exports = {
  authenticateUser,
};
