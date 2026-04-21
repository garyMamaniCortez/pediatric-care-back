const billingService = require("../services/billingService");

const getPendingPayments = async (req, res) => {
  try {
    const { search, date, patientId } = req.query;
    
    const filters = {};
    if (search) filters.search = search;
    if (date) filters.date = date;
    if (patientId) filters.patientId = patientId;
    
    const result = await billingService.getPendingPayments(filters);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error("Error en getPendingPayments:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const registerPayment = async (req, res) => {
  try {
    const { appointmentId, patientId, date, concept, amount, method } = req.body;
    
    if (!appointmentId || !patientId || !date || !concept || !amount || !method) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos: appointmentId, patientId, date, concept, amount, method"
      });
    }
    
    const result = await billingService.registerPayment({
      appointmentId,
      patientId,
      date,
      concept,
      amount,
      method
    });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    res.status(201).json({
      success: true,
      message: "Pago registrado exitosamente",
      data: result.data
    });
  } catch (error) {
    console.error("Error en registerPayment:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

module.exports = {
  getPendingPayments,
  registerPayment
};