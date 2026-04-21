const paymentHistoryService = require("../services/paymentHistoryService");

const getPayments = async (req, res) => {
  try {
    const { page, limit, startDate, endDate, patientId } = req.query;
    
    const filters = {};
    
    if (page) filters.page = parseInt(page);
    if (limit) filters.limit = parseInt(limit);
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (patientId) filters.patientId = patientId;
    
    const result = await paymentHistoryService.getPayments(filters);
    
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
    console.error("Error en getPayments:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

module.exports = {
  getPayments
};