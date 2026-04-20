const scheduleAppointmentService = require("../services/scheduleAppointmentService");

const createPatient = async (req, res) => {
  try {
    const patientData = req.body;
    
    const result = await scheduleAppointmentService.createPatient(patientData);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    res.status(201).json({
      success: true,
      message: "Paciente creado exitosamente",
      data: result.data
    });
  } catch (error) {
    console.error("Error en createPatient:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const searchPatient = async (req, res) => {
  try {
    const { q: searchTerm } = req.query;
    
    const result = await scheduleAppointmentService.searchPatient(searchTerm);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    res.json({
      success: true,
      message: "Búsqueda realizada exitosamente",
      data: result.data
    });
  } catch (error) {
    console.error("Error en searchPatient:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const scheduleAppointment = async (req, res) => {
  try {
    const appointmentData = req.body;
    
    const result = await scheduleAppointmentService.scheduleAppointment(appointmentData);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    res.status(201).json({
      success: true,
      message: "Cita agendada exitosamente",
      data: result.data
    });
  } catch (error) {
    console.error("Error en scheduleAppointment:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const getBusyTimes = async (req, res) => {
  try {
    const { date } = req.query;
    
    const result = await scheduleAppointmentService.getBusyTimes(date);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    res.json({
      success: true,
      message: "Horarios obtenidos exitosamente",
      data: result.data
    });
  } catch (error) {
    console.error("Error en getBusyTimes:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const getServices = async (req, res) => {
  try {
    const result = await scheduleAppointmentService.getServices();
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    res.json({
      success: true,
      message: "Servicios obtenidos exitosamente",
      data: result.data
    });
  } catch (error) {
    console.error("Error en getServices:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const updateData = req.body;
    
    const result = await scheduleAppointmentService.updateAppointment(appointmentId, updateData);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    res.json({
      success: true,
      message: "Cita actualizada exitosamente",
      data: result.data
    });
  } catch (error) {
    console.error("Error en updateAppointment:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

module.exports = {
  createPatient,
  searchPatient,
  scheduleAppointment,
  getBusyTimes,
  getServices,
  updateAppointment
};