const loginService = require("../services/loginService");
const { generateToken } = require("../utils/jwtUtils");

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Usuario y contraseña son requeridos",
      });
    }

    const result = await loginService.authenticateUser(username, password);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.message,
      });
    }

    const { user } = result;

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role
    });

    const response = {
      success: true,
      message: "Autenticación exitosa",
      data: {
        token,
        user
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const verifyToken = (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
};

const logout = (req, res) => {
  res.json({
    success: true,
    message: "Sesión cerrada exitosamente",
  });
};

module.exports = {
  login,
  verifyToken,
  logout,
};
