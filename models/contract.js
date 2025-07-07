const mongoose = require("mongoose");

// Contact Person Schema
const contactPersonSchema = new mongoose.Schema({
  name: { type: String, required: false },
  relationship: { type: String, required: false },
  mobileNumber: { type: String, required: false },
});

// Sibling Schema
const siblingSchema = new mongoose.Schema({
  name: { type: String, required: false },
  school: { type: String, required: false },
  stage: { type: String, required: false }, // e.g., "Kindergarten", "Primary"
  grade: { type: String, required: false }, // e.g., "First", "Second"
});

// Guardian Schema
const guardianSchema = new mongoose.Schema({
  name: { type: String, required: false },
  idNumber: { type: String, required: false },
  relationship: { type: String, required: false },
  absherMobileNumber: { type: String, required: false },
  additionalMobileNumber: { type: String },
  residentialAddress: { type: String, required: false },
  profession: { type: String, required: false },
  workAddress: { type: String, required: false },
  workPhoneNumber: { type: String },
  extension: { type: String },
  contactPersons: [contactPersonSchema], // Array of contact persons
});

// Contract Editor Schema
const contractEditorSchema = new mongoose.Schema({
  name: { type: String, required: false },
  idNumber: { type: String, required: false },
  relationship: { type: String, required: false },
  absherMobileNumber: { type: String, required: false },
  additionalMobileNumber: { type: String, required: false },
  residentialAddress: { type: String, required: false },
  profession: { type: String, require: false },
  workAddress: { type: String, required: false },
  workPhoneNumber: { type: String },
  extension: { type: String },
});

// Student Schema
const studentSchema = new mongoose.Schema({
  name: { type: String },
  nationality: { type: String, required: false },
  birthPlace: { type: String, required: false },
  birthDate: { type: Date, required: false },
  idNumber: { type: String, required: false },
  idIssueDate: { type: Date, required: false },
  idIssuePlace: { type: String, required: false },
  previouslyEnrolled: { type: Boolean, required: false },
  previousSchoolName: { type: String, required: false },
  previousSchoolCity: { type: String, required: false },
  previousSchoolType: {
    type: String,
    required: false,
  },
  requiredSchool: { type: String, required: false },
  requiredStage: {
    type: String,
    required: false,
    // enum: ["Kindergarten", "Primary", "Intermediate", "Secondary"],
  },
  requiredGrade: {
    type: String,
    required: false,
    // enum: ["First", "Second", "Third"],
  },
  hasSiblingsInIthraa: { type: Boolean, required: false },
  siblings: [siblingSchema], // Array of siblings
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
  paymentType: {
    type: String,
    required: false,
    // enum: ["Annual", "Semester"],
  },
  transportation: {
    required: { type: Boolean, required: false },
    neighborhood: { type: String },
    path: { type: String },
  },
});

// Main Contract Schema
const contractSchema = new mongoose.Schema({
  contractYear: {
    type: String,
    required: true,
    description: "The academic year of the contract (e.g., '2024-2025_1446-1447')"
  },
  guardian: { type: guardianSchema, required: false },
  contractEditor: { type: contractEditorSchema, required: false },
  student: { type: studentSchema, required: false },
  payment: { type: paymentSchema, required: false },
});

// Export the Model
module.exports = mongoose.model("Contract", contractSchema);
