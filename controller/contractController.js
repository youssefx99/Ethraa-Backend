const ContractVariables = require("../models/contractVariables");
const { validationResult } = require("express-validator");
const PizZip = require("pizzip");
const fs = require("fs");
const path = require("path");

// Helper function to generate contract document
const generateContractDocument = async (contractData) => {
  try {
    // Load the Word template
    const templatePath = path.join(__dirname, "../files/boysContract.docx");
    const outputPath = path.join(__dirname, `../files/${contractData.contractYear}_${contractData.contractYearHijri}.docx`);

    if (!fs.existsSync(templatePath)) {
      throw new Error("Template file not found");
    }

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    // Get the document XML content
    const xmlFile = zip.files["word/document.xml"];
    if (!xmlFile) {
      throw new Error("Invalid template format");
    }

    let docText = xmlFile.asText();

    // Define the placeholders we want to update and their values
    const updates = {
      "{%clausesFour%}": contractData.clausesFour,
      "{%KinderPrice_Number%}": contractData.KinderPrice_Number,
      "{%KinderPrice_Text%}": contractData.KinderPrice_Text,
      "{%ElementaryPrice_Number%}": contractData.ElementaryPrice_Number,
      "{%ElementaryPrice_Text%}": contractData.ElementaryPrice_Text,
      "{%MiddlePrice_Number%}": contractData.MiddlePrice_Number,
      "{%MiddlePrice_Text%}": contractData.MiddlePrice_Text,
      "{%HighPrice_Number%}": contractData.HighPrice_Number,
      "{%HighPrice_Text%}": contractData.HighPrice_Text,
      "{%TwoPath_Price%}": contractData.TwoPath_Price,
      "{%OnePath_Price%}": contractData.OnePath_Price,
      "{%OnePathTax_Price%}": contractData.OnePathTax_Price,
      "{%TwoPathTax_Price%}": contractData.TwoPathTax_Price,
      "{%ClauseSeven_One%}": contractData.ClauseSeven_One,
      "{%ClauseSeven_Two%}": contractData.ClauseSeven_Two,
      "{%ClauseSeven_Three%}": contractData.ClauseSeven_Three,
      "{%ClauseSeven_Four%}": contractData.ClauseSeven_Four,
      "{%ClauseSeven_Five%}": contractData.ClauseSeven_Five,
      "{%ClauseSeven_Six%}": contractData.ClauseSeven_Six,
      "{%ClauseSeven_Seven%}": contractData.ClauseSeven_Seven,
      "{%ClauseSeven_Eight%}": contractData.ClauseSeven_Eight,
      "{%ClauseSeven_Nine%}": contractData.ClauseSeven_Nine,
      "{%ClauseSeven_Ten%}": contractData.ClauseSeven_Ten,
      "{%ClauseSeven_Eleven%}": contractData.ClauseSeven_Eleven,
      "{%ClauseSeven_Twelve%}": contractData.ClauseSeven_Twelve,
      "{%ClauseEight_One%}": contractData.ClauseEight_One,
      "{%ClauseEight_Two%}": contractData.ClauseEight_Two,
      "{%ClauseEight_Three%}": contractData.ClauseEight_Three,
      "{%ClauseEight_CaseOne_Price%}": contractData.ClauseEight_CaseOne_Price,
      "{%ClauseEight_caseThree_Percentage%}": contractData.ClauseEight_caseThree_Percentage,
      "{%ClauseEight_caseFour_Percentage%}": contractData.ClauseEight_caseFour_Percentage
    };

    let replacementsCount = 0;

    // Replace only the specified placeholders
    Object.entries(updates).forEach(([placeholder, value]) => {
      if (value !== undefined) {
        if (docText.includes(placeholder)) {
          const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          const beforeCount = (docText.match(regex) || []).length;
          docText = docText.replace(regex, value);
          replacementsCount += beforeCount;
        }
      }
    });

    // Update the document XML with our changes
    zip.file("word/document.xml", docText);

    // Generate the final document buffer
    const buffer = zip.generate({ type: "nodebuffer" });
    return buffer;
  } catch (error) {
    console.error("Error generating contract document:", error);
    throw error;
  }
};

// Create new contract variables
const createContractVariables = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check for existing contracts with the same years
    const existingContracts = await ContractVariables.find({
      contractYear: req.body.contractYear,
      contractYearHijri: { $regex: new RegExp(`^${req.body.contractYearHijri}(_v\\d+)?$`) }
    }).sort({ contractYearHijri: -1 });

    let contractYearHijri = req.body.contractYearHijri;

    // If there are existing contracts, add version number
    if (existingContracts.length > 0) {
      const lastContract = existingContracts[0];
      const lastVersion = lastContract.contractYearHijri.match(/_v(\d+)$/);
      
      if (lastVersion) {
        // Increment the version number
        const newVersion = parseInt(lastVersion[1]) + 1;
        contractYearHijri = `${req.body.contractYearHijri}_v${newVersion}`;
      } else {
        // First version, add _v1
        contractYearHijri = `${req.body.contractYearHijri}_v1`;
      }
    }

    // Create new contract variables with potentially modified contractYearHijri
    const contractVars = new ContractVariables({
      ...req.body,
      contractYearHijri,
      updatedBy: req.user._id
    });

    await contractVars.save();

    res.status(201).json({
      message: "Contract variables created successfully",
      data: contractVars
    });
  } catch (error) {
    console.error("Error creating contract variables:", error);
    res.status(500).json({
      message: "Error creating contract variables",
      error: error.message
    });
  }
};

// Get all contract variables (with optional year filter)
const getAllContractVariables = async (req, res) => {
  try {
    const { year } = req.query;
    let query = {};

    // Filter by year if provided
    if (year) {
      query.contractYear = year;
    }

    const contractVars = await ContractVariables.find(query)
      .sort({ contractYear: -1, createdAt: -1 })
      .populate("updatedBy", "name email");

    res.status(200).json({
      message: "Contract variables retrieved successfully",
      data: contractVars
    });
  } catch (error) {
    console.error("Error retrieving contract variables:", error);
    res.status(500).json({
      message: "Error retrieving contract variables",
      error: error.message
    });
  }
};

// Update contract variables
const updateContractVariables = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Find the contract variables
    const contractVars = await ContractVariables.findById(id);
    if (!contractVars) {
      return res.status(404).json({
        message: "Contract variables not found"
      });
    }

    // Update the contract variables
    Object.assign(contractVars, {
      ...req.body,
      updatedBy: req.user._id
    });

    await contractVars.save();

    res.status(200).json({
      message: "Contract variables updated successfully",
      data: contractVars
    });
  } catch (error) {
    console.error("Error updating contract variables:", error);
    res.status(500).json({
      message: "Error updating contract variables",
      error: error.message
    });
  }
};

// Delete contract variables
const deleteContractVariables = async (req, res) => {
  try {
    const { id } = req.params;

    const contractVars = await ContractVariables.findById(id);
    if (!contractVars) {
      return res.status(404).json({
        message: "Contract variables not found"
      });
    }

    // Delete the associated document
    const docPath = path.join(__dirname, `../files/${contractVars.contractYear}_${contractVars.contractYearHijri}.docx`);
    if (fs.existsSync(docPath)) {
      fs.unlinkSync(docPath);
    }

    await ContractVariables.findByIdAndDelete(id);

    res.status(200).json({
      message: "Contract variables deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting contract variables:", error);
    res.status(500).json({
      message: "Error deleting contract variables",
      error: error.message
    });
  }
};

// Export all functions
module.exports = {
  createContractVariables,
  getAllContractVariables,
  updateContractVariables,
  deleteContractVariables,
  generateContractDocument
}; 