const patientListService = require("../services/patientListService");

const getPatients = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      gender,
      minAge,
      maxAge,
      relationship,
      search
    } = req.query;

    const result = await patientListService.getPatients({
      page: parseInt(page),
      limit: parseInt(limit),
      gender,
      minAge: minAge ? parseInt(minAge) : undefined,
      maxAge: maxAge ? parseInt(maxAge) : undefined,
      relationship,
      search
    });

    res.json({
      success: true,
      data: result.patients,
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Error en getPatients:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const result = await patientListService.updatePatient(id, updateData);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: "Paciente actualizado exitosamente",
      data: result.patient
    });
  } catch (error) {
    console.error("Error en updatePatient:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await patientListService.deletePatient(id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: "Paciente eliminado exitosamente"
    });
  } catch (error) {
    console.error("Error en deletePatient:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getPatients,
  updatePatient,
  deletePatient
};