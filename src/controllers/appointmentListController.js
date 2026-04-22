const appointmentListService = require("../services/appointmentListService");

const getAppointments = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    
    let result;
    if (date) {
      result = await appointmentListService.getAppointmentsByDate(date);
    } else if (startDate && endDate) {
      result = await appointmentListService.getAppointmentsByDateRange(startDate, endDate);
    } else {
      return res.status(400).json({
        success: false,
        message: "Se requiere especificar una fecha o rango de fechas",
      });
    }

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: "Citas obtenidas exitosamente",
      data: result.data,
    });
  } catch (error) {
    console.error("Error en getAppointments:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID de la cita es requerido",
      });
    }

    const result = await appointmentListService.getAppointmentById(id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error en getAppointmentById:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createAppointment = async (req, res) => {
  try {
    const { patientId, serviceId, date, time } = req.body;

    const availabilityCheck = await appointmentListService.checkAvailability(date, time);
    if (!availabilityCheck.success) {
      return res.status(409).json({
        success: false,
        message: availabilityCheck.message,
      });
    }

    const patientCheck = await appointmentListService.checkPatientExists(patientId);
    if (!patientCheck.success) {
      return res.status(404).json({
        success: false,
        message: patientCheck.message,
      });
    }

    const serviceCheck = await appointmentListService.checkServiceExists(serviceId);
    if (!serviceCheck.success) {
      return res.status(404).json({
        success: false,
        message: serviceCheck.message,
      });
    }

    const result = await appointmentListService.createAppointment({
      patientId,
      serviceId,
      date,
      time,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.status(201).json({
      success: true,
      message: "Cita creada exitosamente",
      data: result.data,
    });
  } catch (error) {
    console.error("Error en createAppointment:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { patientId, serviceId, date, time, status } = req.body;

    const appointmentCheck = await appointmentListService.checkAppointmentExists(id);
    if (!appointmentCheck.success) {
      return res.status(404).json({
        success: false,
        message: appointmentCheck.message,
      });
    }

    if (date || time) {
      const newDate = date || appointmentCheck.data.date;
      const newTime = time || appointmentCheck.data.time;
      
      const availabilityCheck = await appointmentListService.checkAvailability(newDate, newTime, id);
      if (!availabilityCheck.success) {
        return res.status(409).json({
          success: false,
          message: availabilityCheck.message,
        });
      }
    }

    if (patientId) {
      const patientCheck = await appointmentListService.checkPatientExists(patientId);
      if (!patientCheck.success) {
        return res.status(404).json({
          success: false,
          message: patientCheck.message,
        });
      }
    }

    if (serviceId) {
      const serviceCheck = await appointmentListService.checkServiceExists(serviceId);
      if (!serviceCheck.success) {
        return res.status(404).json({
          success: false,
          message: serviceCheck.message,
        });
      }
    }

    const result = await appointmentListService.updateAppointment(id, {
      patientId,
      serviceId,
      date,
      time,
      status,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: "Cita actualizada exitosamente",
      data: result.data,
    });
  } catch (error) {
    console.error("Error en updateAppointment:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await appointmentListService.cancelAppointment(id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: "Cita cancelada exitosamente",
    });
  } catch (error) {
    console.error("Error en cancelAppointment:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getAppointments,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getAppointmentById,
};