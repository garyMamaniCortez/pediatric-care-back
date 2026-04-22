const clinicalHistoryService = require("../services/clinicalHistoryService");

const getClinicalRecords = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "ID del paciente es requerido",
      });
    }

    const result = await clinicalHistoryService.getClinicalRecords(patientId);

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
    console.error("Error en getClinicalRecords:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createClinicalRecord = async (req, res) => {
  try {
    const recordData = req.body;

    const result = await clinicalHistoryService.createClinicalRecord(recordData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.status(201).json({
      success: true,
      message: "Registro clínico creado exitosamente",
      data: result.data,
    });
  } catch (error) {
    console.error("Error en createClinicalRecord:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateClinicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const result = await clinicalHistoryService.updateClinicalRecord(id, updateData);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: "Registro clínico actualizado exitosamente",
      data: result.data,
    });
  } catch (error) {
    console.error("Error en updateClinicalRecord:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "ID del paciente es requerido",
      });
    }

    const result = await clinicalHistoryService.getPrescriptions(patientId);

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
    console.error("Error en getPrescriptions:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createPrescription = async (req, res) => {
  try {
    const prescriptionData = req.body;

    const result = await clinicalHistoryService.createPrescription(prescriptionData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.status(201).json({
      success: true,
      message: "Receta creada exitosamente",
      data: result.data,
    });
  } catch (error) {
    console.error("Error en createPrescription:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getCertificates = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "ID del paciente es requerido",
      });
    }

    const result = await clinicalHistoryService.getCertificates(patientId);

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
    console.error("Error en getCertificates:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createCertificate = async (req, res) => {
  try {
    const certificateData = req.body;

    const result = await clinicalHistoryService.createCertificate(certificateData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.status(201).json({
      success: true,
      message: "Certificado creado exitosamente",
      data: result.data,
    });
  } catch (error) {
    console.error("Error en createCertificate:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getIndications = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "ID del paciente es requerido",
      });
    }

    const result = await clinicalHistoryService.getIndications(patientId);

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
    console.error("Error en getIndications:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createIndication = async (req, res) => {
  try {
    const indicationData = req.body;

    const result = await clinicalHistoryService.createIndication(indicationData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.status(201).json({
      success: true,
      message: "Indicación creada exitosamente",
      data: result.data,
    });
  } catch (error) {
    console.error("Error en createIndication:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getClinicalRecords,
  createClinicalRecord,
  updateClinicalRecord,
  getPrescriptions,
  createPrescription,
  getCertificates,
  createCertificate,
  getIndications,
  createIndication,
};