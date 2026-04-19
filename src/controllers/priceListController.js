const { validationResult } = require('express-validator');
const priceListService = require("../services/priceListService");

const validateRequest = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  return null;
};

const getServices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await priceListService.getServices(page, limit);
    
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
    console.error("Error en getServices:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const addService = async (req, res) => {
  try {
    const validationError = validateRequest(req, res);
    if (validationError) return validationError;
    
    const { name, price } = req.body;
    
    const result = await priceListService.addService({
      name: name.trim(),
      price: price
    });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    res.status(201).json({
      success: true,
      data: result.data,
      message: result.message
    });
  } catch (error) {
    console.error("Error en addService:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const updateService = async (req, res) => {
  try {
    const validationError = validateRequest(req, res);
    if (validationError) return validationError;
    
    const { id } = req.params;
    const { name, price } = req.body;
    
    const result = await priceListService.updateService(id, {
      name: name,
      price: price
    });
    
    if (!result.success) {
      const statusCode = result.message === "Servicio no encontrado" ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        message: result.message
      });
    }
    
    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  } catch (error) {
    console.error("Error en updateService:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

const deleteService = async (req, res) => {
  try {
    const validationError = validateRequest(req, res);
    if (validationError) return validationError;
    
    const { id } = req.params;
    
    const result = await priceListService.deleteService(id);
    
    if (!result.success) {
      const statusCode = result.message === "Servicio no encontrado" ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        message: result.message
      });
    }
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error("Error en deleteService:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

module.exports = {
  getServices,
  addService,
  updateService,
  deleteService
};