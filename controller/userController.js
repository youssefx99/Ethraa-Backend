const Contract = require("../models/contract"); // Import your Contract model
const ContractVariables = require("../models/contractVariables"); // Add this import
const jwt = require("jsonwebtoken");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const moment = require("moment");
require("moment/locale/ar");
const Hmoment = require("moment-hijri");
const nodemailer = require("nodemailer");
const request = require("request");
const fs = require("fs");
const path = require("path");
const User = require("../models/user");
const { generateContractDocument } = require("./contractController"); // Add this import

const API_URL = "http://localhost:3000";

// Initialize Super Admin (run once)
const initializeSuperAdmin = async () => {
  try {
    const existingSuperAdmin = await User.findOne({ role: "super_admin" });

    if (!existingSuperAdmin) {
      const superAdmin = new User({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: "super_admin",
      });
      await superAdmin.save();
      console.log("Super admin created successfully");
    }
  } catch (error) {
    console.error("Error initializing super admin:", error);
  }
};

// Call this when server starts
initializeSuperAdmin();

const convertToArabicNumerals = (num) => {
  const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(num).replace(/\d/g, (digit) => arabicNumbers[digit]);
};

// Function to check if nationality indicates Saudi student
const isSaudiStudent = (nationality) => {
  if (!nationality) return false;

  // Convert to lowercase and remove any extra spaces
  const normalizedNationality = nationality.toLowerCase().trim();

  // Array of possible Saudi nationality variations
  const saudiVariations = [
    // Arabic variations
    "السعودي",
    "السعودية",
    "سعودي",
    "سعودية",
    "سعودى",
    "السعودى",
    "سعودي الجنسية",
    "سعودية الجنسية",
    "الجنسية السعودية",
    "الجنسية سعودية",
    "مواطن سعودي",
    "مواطنة سعودية",
    "من المملكة العربية السعودية",
    "من السعودية",
    "مملكة سعودية",
    "مملكة السعودية",

    // English variations
    "saudi",
    "saudi arabian",
    "saudi arabia",
    "saudi national",
    "saudi nationality",
    "kingdom of saudi arabia",
    "ksa",
    "k.s.a",
    "saudi citizen",
    "from saudi arabia",
    "from ksa",
    "saudi passport",
    "saudi resident",
  ];

  return saudiVariations.some((variation) =>
    normalizedNationality.includes(variation.toLowerCase())
  );
};

// Function to extract creation date from MongoDB ObjectId
const getDateFromObjectId = (objectId) => {
  // Extract the first 8 characters (timestamp in hex)
  const timestamp = objectId.substring(0, 8);
  // Convert hex to decimal (Unix timestamp in seconds)
  const unixTimestamp = parseInt(timestamp, 16);
  // Convert to JavaScript Date object (multiply by 1000 for milliseconds)
  return new Date(unixTimestamp * 1000);
};

const authCheck = async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    console.log("no fucken token");
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret"
    );

    // Get user details from database
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Authenticated",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// Updated Login Controller
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("email ::::::: ", email);
    console.log("password ::::::: ", password);
    // Find user in database
    const user = await User.findOne({ email });
    console.log("user ::::::: ", user);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    // Generate JWT Token with user ID and role
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || "default_secret",
      {
        expiresIn: "7d",
      }
    );

    // Set HTTP-Only cookie with corrected settings
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Set to false for localhost development
      sameSite: "lax", // Changed from "none" to "lax" for localhost
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/", // Explicitly set the path
    });

    console.log("Cookie set:", res.getHeader("Set-Cookie"));

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Create Admin (Super Admin Only)
const createAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Create new admin
    const admin = new User({
      email,
      password,
      role: "admin",
      createdBy: req.user.userId,
    });

    await admin.save();

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Create Admin Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Edit Admin (Super Admin Only)
const editAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password } = req.body;

    // Check if the user is a super admin
    if (req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Only super admin can edit admin users",
      });
    }

    // Find the admin user
    const admin = await User.findOne({ _id: id, role: "admin" });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found",
      });
    }

    // Update admin details
    if (email) admin.email = email;
    if (password) admin.password = password; // Password will be hashed by the pre-save middleware

    await admin.save();

    res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Edit Admin Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete Admin (Super Admin Only)
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the user is a super admin
    if (req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Only super admin can delete admin users",
      });
    }

    // Find and delete the admin user
    const admin = await User.findOneAndDelete({ _id: id, role: "admin" });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Delete Admin Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get All Admins (Super Admin Only)
const getAdmins = async (req, res) => {
  try {
    // Check if the user is a super admin
    if (req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Only super admin can view admin users",
      });
    }

    // Find all admin users, excluding password field
    const admins = await User.find({ role: "admin" })
      .select("-password")
      .sort({ createdAt: -1 }); // Sort by creation date, newest first

    res.status(200).json({
      success: true,
      data: admins,
    });
  } catch (error) {
    console.error("Get Admins Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getContractById = async (req, res) => {
  try {
    const { id } = req.params; // Get contract ID from URL

    // Find the contract by ID
    const contract = await Contract.findById(id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    res.status(200).json({
      success: true,
      data: contract,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch contract",
      error: error.message,
    });
  }
};

// Get all contracts
const getAllContracts = async (req, res) => {
  try {
    const contracts = await Contract.find(); // Fetch all contracts from the database
    res.status(200).json({
      success: true,
      data: contracts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch contracts",
      error: error.message,
    });
  }
};

// Create a new contract
const createContract = async (req, res) => {
  try {
    const { contractYear, guardian, contractEditor, student, payment } =
      req.body;

    console.log("=== Payment Object Details ===");
    console.log("Payment Type:", payment.paymentType);
    console.log("Transportation Required:", payment.transportation.required);
    console.log("Transportation Path:", payment.transportation.path);
    console.log(
      "Transportation Neighborhood:",
      payment.transportation.neighborhood
    );
    console.log("Full Payment Object:", JSON.stringify(payment, null, 2));
    console.log("=== End Payment Object Details ===");

    if (!contractYear) {
      return res.status(400).json({
        success: false,
        message: "Contract year is required",
      });
    }

    // ✅ Normalize `hasSiblingsInIthraa` to false if it's empty
    student.hasSiblingsInIthraa =
      student.hasSiblingsInIthraa === "true" ? true : false;

    // Create a new contract document
    const newContract = new Contract({
      contractYear,
      guardian,
      contractEditor,
      student,
      payment,
    });

    await newContract.save(); // Save the contract to the database
    res.status(201).json({
      success: true,
      message: "Contract created successfully",
      data: newContract,
    });
  } catch (error) {
    console.error("Error creating contract:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create contract",
      error: error.message,
    });
  }
};

// Controller to get contracts without querying, returning only required fields
const getContractDetails = async (req, res) => {
  try {
    // Fetch contracts and select only the required fields
    const contracts = await Contract.find(
      {},
      {
        "guardian.name": 1,
        "guardian.idNumber": 1,
        "guardian.relationship": 1,
        "guardian.absherMobileNumber": 1,
        "guardian.additionalMobileNumber": 1,
        "guardian.residentialAddress": 1,
        "contractEditor.name": 1,
        "contractEditor.idNumber": 1,
        "student.name": 1,
        "student.idNumber": 1,
      }
    );

    // Return the results
    res.status(200).json({
      success: true,
      data: contracts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch contract details",
      error: error.message,
    });
  }
};

const deleteContract = async (req, res) => {
  try {
    const { id } = req.params; // Get contract ID from request parameters

    // Find and delete the contract by ID
    const deletedContract = await Contract.findByIdAndDelete(id);

    if (!deletedContract) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Contract deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete contract",
      error: error.message,
    });
  }
};

const editContract = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log("updateData ::::::: ", updateData);

    // ✅ Normalize `hasSiblingsInIthraa` to false if it's empty
    if (
      updateData.student &&
      updateData.student.hasSiblingsInIthraa !== undefined
    ) {
      updateData.student.hasSiblingsInIthraa =
        updateData.student.hasSiblingsInIthraa === "true" ? true : false;
    }

    // If contractYear is being updated, verify the contract variables exist
    if (updateData.contractYear) {
      // Extract Gregorian year from the combined contract year (e.g., "2024-2025" from "2024-2025_1446-1447")
      const gregorianYear = updateData.contractYear.split("_")[0];

      const contractVars = await ContractVariables.findOne({
        contractYear: gregorianYear,
      });

      if (!contractVars) {
        return res.status(400).json({
          success: false,
          message: `Contract variables for year ${gregorianYear} not found. Please ensure contract variables are set up for this year.`,
        });
      }
    }

    // Find and update the contract by ID
    const updatedContract = await Contract.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedContract) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Contract updated successfully",
      data: updatedContract,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update contract",
      error: error.message,
    });
  }
};

// Function to replace placeholders in the Word template
const replaceWordFields = async (contract, id, doc) => {
  // Log the entire contract object to see its structure
  // Get the contract year and construct the template path
  const contractYear = contract.contractYear; // Get the full contract year (e.g., "2024-2025_1446-1447_v1")

  // Extract Hijri year with version from the combined contract year
  const contractYearHijri = contractYear.split("_").slice(1).join("_"); // This will get "1446-1447_v1" from "2024-2025_1446-1447_v1"

  // Fetch contract variables for the current year using the exact Hijri year with version
  const contractVars = await ContractVariables.findOne({
    contractYearHijri: contractYearHijri,
  });
  if (!contractVars) {
    throw new Error(
      `Contract variables for year ${contractYearHijri} not found. Please ensure contract variables are set up for this year.`
    );
  }

  // Log contract variables data

  // ✅ 1. Extract raw document XML content
  let docText = doc.getZip().files["word/document.xml"].asText();

  // Log the first 500 characters of the document XML to check placeholders
  // ✅ 2. Conditional replacement: Only change "الطالب" → "الطالبة" if school is "girls"
  if (contract.student.requiredSchool === "girls") {
    docText = docText.replace(/الطالب(?!ـ\/ـة)/g, "الطالبة");
  }

  // ✅ 3. Save the modified text back into the document
  doc.getZip().file("word/document.xml", docText);

  moment.locale("ar");

  // ✅ Get contract creation date from ObjectId instead of current date
  const contractCreationDate = getDateFromObjectId(id);
  const currentDate = moment(contractCreationDate); // Use creation date instead of now()
  const currentDateH = Hmoment(contractCreationDate); // Use creation date for Hijri too

  // Extract Hijri components
  const hijri = {
    Hyear: currentDateH.iYear(), // Hijri year
    Hmonth: currentDateH.iMonth() + 1, // Hijri month (zero-indexed, so +1)
    Hday: currentDateH.iDate(), // Hijri day
  };

  // Extract Gregorian components
  const gregorian = {
    dayName: currentDate.format("dddd"), // Day name (e.g., Monday)
    Myear: currentDate.format("YYYY"), // Gregorian year
    Mmonth: currentDate.format("M"), // Gregorian month
    Mday: currentDate.format("D"), // Gregorian day
  };

  // Convert birth date to Gregorian & Hijri formats
  const birthDateGregorian = moment(contract.student.birthDate);
  const birthDateHijri = Hmoment(contract.student.birthDate);

  // Extract Hijri components
  const birthDateHijriFormatted = {
    Hyear: birthDateHijri.iYear(),
    Hmonth: birthDateHijri.iMonth() + 1, // Hijri month is zero-indexed
    Hday: birthDateHijri.iDate(),
  };

  // Extract Gregorian components
  const birthDateGregorianFormatted = {
    Myear: birthDateGregorian.format("YYYY"),
    Mmonth: birthDateGregorian.format("M"),
    Mday: birthDateGregorian.format("D"),
  };

  // Define a mapping for stage names
  const stageMapping = {
    Kindergarten: "رياض الأطفال",
    Elementary: "الابتدائية",
    Middle: "المتوسطة",
    High: "الثانوية",
  };

  const studentStage = contract.student.requiredStage;
  const studentStageArabic = stageMapping[studentStage] || studentStage;
  const studentGrade = contract.student.requiredGrade
    .replace("الصف ", "")
    .trim();

  const wantsTransportation = contract.payment.transportation.required;

  let transportationPath = contract.payment.transportation.path;
  const paymentType = contract.payment.paymentType || "N/A"; // Default to "N/A" if undefined

  // School Money Based on Stage
  let SchoolMoneyRequired = 0;
  if (studentStage === "Elementary") {
    SchoolMoneyRequired = parseInt(contractVars.ElementaryPrice_Number) || 0;
  } else if (studentStage === "Middle") {
    SchoolMoneyRequired = parseInt(contractVars.MiddlePrice_Number) || 0;
  } else if (studentStage === "High") {
    SchoolMoneyRequired = parseInt(contractVars.HighPrice_Number) || 0;
  } else if (studentStage === "Kindergarten") {
    SchoolMoneyRequired = parseInt(contractVars.KinderPrice_Number) || 0;
  }

  let TotalSchoolMoneyRequired = 0;
  // Transportation Money Based on Path
  let TransportaionMoneyRequired = 0;
  let transTaxes = 0;
  let TotalTransportationMoneyRequired = 0;

  let None_saudiStudnet_Tax = isSaudiStudent(contract.student.nationality)
    ? 1
    : 1.15;

  // Calculate base school money with tax and round to avoid floating point issues
  TotalSchoolMoneyRequired = Math.round(
    SchoolMoneyRequired * None_saudiStudnet_Tax
  );

  if (transportationPath === "One path") {
    TransportaionMoneyRequired = parseInt(contractVars.OnePath_Price) || 0;
    transTaxes = parseInt(contractVars.OnePathTax_Price) || 0;
    TotalTransportationMoneyRequired = TransportaionMoneyRequired + transTaxes;

    transportationPath = "مسار واحد";
    TotalSchoolMoneyRequired += TotalTransportationMoneyRequired;
  } else if (transportationPath === "Two paths") {
    TransportaionMoneyRequired = parseInt(contractVars.TwoPath_Price) || 0;
    transTaxes = parseInt(contractVars.TwoPathTax_Price) || 0;
    TotalTransportationMoneyRequired = TransportaionMoneyRequired + transTaxes;

    transportationPath = "مسارين";
    TotalSchoolMoneyRequired += TotalTransportationMoneyRequired;
  }

  const idIssueDateGregorian = moment(contract.student.idIssueDate);
  const idIssueDateHijri = Hmoment(contract.student.idIssueDate);
  // Extract Hijri components for ID issue date
  const idIssueDateHijriFormatted = {
    Hyear: idIssueDateHijri.iYear(),
    Hmonth: idIssueDateHijri.iMonth() + 1, // Hijri months are zero-based, so add +1
    Hday: idIssueDateHijri.iDate(),
  };

  // Extract Gregorian components for ID issue date (if needed)
  const idIssueDateGregorianFormatted = {
    Myear: idIssueDateGregorian.format("YYYY"),
    Mmonth: idIssueDateGregorian.format("M"),
    Mday: idIssueDateGregorian.format("D"),
  };

  // Mapping the contract fields to the Word placeholders
  const placeholders = {
    // Contract Variables
    clausesFour: contractVars.clausesFour || "",
    KinderPrice_Number: contractVars.KinderPrice_Number || "",
    KinderPrice_Text: contractVars.KinderPrice_Text || "",
    ElementaryPrice_Number: contractVars.ElementaryPrice_Number || "",
    ElementaryPrice_Text: contractVars.ElementaryPrice_Text || "",
    MiddlePrice_Number: contractVars.MiddlePrice_Number || "",
    MiddlePrice_Text: contractVars.MiddlePrice_Text || "",
    HighPrice_Number: contractVars.HighPrice_Number || "",
    HighPrice_Text: contractVars.HighPrice_Text || "",
    TwoPath_Price: contractVars.TwoPath_Price || "",
    OnePath_Price: contractVars.OnePath_Price || "",
    OnePathTax_Price: contractVars.OnePathTax_Price || "",
    TwoPathTax_Price: contractVars.TwoPathTax_Price || "",
    ClauseSeven_One: contractVars.ClauseSeven_One || "",
    ClauseSeven_Two: contractVars.ClauseSeven_Two || "",
    ClauseSeven_Three: contractVars.ClauseSeven_Three || "",
    ClauseSeven_Four: contractVars.ClauseSeven_Four || "",
    ClauseSeven_Five: contractVars.ClauseSeven_Five || "",
    ClauseSeven_Six: contractVars.ClauseSeven_Six || "",
    ClauseSeven_Seven: contractVars.ClauseSeven_Seven || "",
    ClauseSeven_Eight: contractVars.ClauseSeven_Eight || "",
    ClauseSeven_Nine: contractVars.ClauseSeven_Nine || "",
    ClauseSeven_Ten: contractVars.ClauseSeven_Ten || "",
    ClauseSeven_Eleven: contractVars.ClauseSeven_Eleven || "",
    ClauseSeven_Twelve: contractVars.ClauseSeven_Twelve || "",
    ClauseEight_One: contractVars.ClauseEight_One || "",
    ClauseEight_Two: contractVars.ClauseEight_Two || "",
    ClauseEight_CaseOne_Price: contractVars.ClauseEight_CaseOne_Price || "",
    ClauseEight_caseThree_Percentage:
      contractVars.ClauseEight_caseThree_Percentage || "",
    ClauseEight_caseFour_Percentage:
      contractVars.ClauseEight_caseFour_Percentage || "",

    // Student-specific data
    isAnnual: paymentType === "Annual",
    isQuarterly: paymentType === "Quarterly",

    SchoolMoneyRequired: SchoolMoneyRequired || "0",
    TotalSchoolMoneyRequired: TotalSchoolMoneyRequired,
    TransportaionMoneyRequired: TotalTransportationMoneyRequired || "0",

    // Student Information
    student_name: contract.student.name,
    student_nationality: contract.student.nationality,
    student_birth_place: contract.student.birthPlace,

    // Birth Date (Gregorian)
    birthDate_G_Mday: birthDateGregorianFormatted.Mday,
    birthDate_G_Mmonth: birthDateGregorianFormatted.Mmonth,
    birthDate_G_Myear: birthDateGregorianFormatted.Myear,

    // Birth Date (Hijri)
    birthDate_H_Hday: birthDateHijriFormatted.Hday,
    birthDate_H_Hmonth: birthDateHijriFormatted.Hmonth,
    birthDate_H_Hyear: birthDateHijriFormatted.Hyear,

    student_previously_enrolled: contract.student.previouslyEnrolled,
    previousSchoolName: contract.student.previousSchoolName || "............",
    previousSchoolCity: contract.student.previousSchoolCity || "............",
    previousSchoolType: contract.student.previousSchoolType || "............",

    student_id_number: contract.student.idNumber,
    student_id_issue_date: contract.student.idIssueDate
      .toISOString()
      .split("T")[0],
    student_id_issue_place: contract.student.idIssuePlace,

    student_required_school: contract.student.requiredSchool,
    student_required_stage: studentStageArabic,
    schoolSexType:
      contract.student.requiredSchool === "girls" ? "بنات" : "بنين",

    // Conditional flags for stages
    isElementary: studentStage == "Elementary",
    isMiddle: studentStage == "Middle",
    isHigh: studentStage == "High",
    isKindergarten: studentStage == "Kindergarten",

    student_required_grade: studentGrade,
    student_has_siblings_in_ithraa: contract.student.hasSiblingsInIthraa
      ? "Yes"
      : "No",
    hasPayment: !!studentStage,
    wantsTransportation: !!wantsTransportation,

    // Check if there are contact persons
    hasContactPersons: contract.guardian.contactPersons.length > 0,

    // Prepare contact persons array for looping
    contactPersons: contract.guardian.contactPersons.map((person) => ({
      name: person.name,
      relationship: person.relationship,
      mobileNumber: person.mobileNumber,
    })),

    // Guardian Information
    guardian_name: contract.guardian.name,
    guardian_id_number: contract.guardian.idNumber,
    guardian_relationship: contract.guardian.relationship,
    guardian_absher_mobile: contract.guardian.absherMobileNumber,
    guardian_additional_mobile:
      contract.guardian.additionalMobileNumber || "............",
    guardian_residential_address: contract.guardian.residentialAddress,
    guardian_profession: contract.guardian.profession,
    guardian_work_address: contract.guardian.workAddress,
    guardian_work_phone: contract.guardian.workPhoneNumber || "............",
    guardian_extension: contract.guardian.extension || "............",

    // Contract Editor Information
    editor_name: contract.contractEditor.name,
    editor_id_number: contract.contractEditor.idNumber,
    editor_relationship: contract.contractEditor.relationship,
    editor_absher_mobile: contract.contractEditor.absherMobileNumber,
    editor_additional_mobile: contract.contractEditor.additionalMobileNumber,
    editor_residential_address: contract.contractEditor.residentialAddress,
    editor_profession: contract.contractEditor.profession,
    editor_work_address: contract.contractEditor.workAddress,
    editor_work_phone:
      contract.contractEditor.workPhoneNumber || "............",
    editor_extension: contract.contractEditor.extension || "............",

    // Payment Information
    payment_type: contract.payment.paymentType,
    payment_transportation_required: wantsTransportation ? "Yes" : "No",
    payment_transportation_neighborhood:
      contract.payment.transportation.neighborhood || "............",
    payment_transportation_path: transportationPath,

    // Contact Persons
    siblings: contract.student.siblings.map((sibling) => ({
      name: sibling.name,
      stage: stageMapping[sibling.stage] || sibling.stage,
      grade: sibling.grade.replace("الصف ", "").trim(),
    })),

    // Siblings Information
    hasSiblings: contract.student.siblings.length > 0,

    siblings: contract.student.siblings.map((sibling) => ({
      name: sibling.name,
      stage: stageMapping[sibling.stage] || sibling.stage,
      grade: sibling.grade,
    })),

    isNeedTrans: contract.payment.transportation.required,

    // ID Issue Date (Hijri)
    idIssueDate_H_Hday: convertToArabicNumerals(idIssueDateHijriFormatted.Hday),
    idIssueDate_H_Hmonth: convertToArabicNumerals(
      idIssueDateHijriFormatted.Hmonth
    ),
    idIssueDate_H_Hyear: convertToArabicNumerals(
      idIssueDateHijriFormatted.Hyear
    ),

    // ID Issue Date (Gregorian)
    idIssueDate_M_Mday: convertToArabicNumerals(
      idIssueDateGregorianFormatted.Mday
    ),
    idIssueDate_M_Mmonth: convertToArabicNumerals(
      idIssueDateGregorianFormatted.Mmonth
    ),
    idIssueDate_M_Myear: convertToArabicNumerals(
      idIssueDateGregorianFormatted.Myear
    ),

    // Dates
    idIssueDate_dayName: convertToArabicNumerals(gregorian.dayName),
    idIssueDate_Hday: convertToArabicNumerals(hijri.Hday),
    idIssueDate_Hmonth: convertToArabicNumerals(hijri.Hmonth),
    idIssueDate_Hyear: convertToArabicNumerals(hijri.Hyear),
    idIssueDate_Mday: convertToArabicNumerals(gregorian.Mday),
    idIssueDate_Mmonth: convertToArabicNumerals(gregorian.Mmonth),
    idIssueDate_Myear: convertToArabicNumerals(gregorian.Myear),
  };

  // Replace all placeholders in the document
  doc.render(placeholders);

  // Generate the final document buffer
  const buffer = doc.getZip().generate({ type: "nodebuffer" });
  return buffer;
};

const printContract = async (req, res) => {
  try {
    const printedType = "docx";
    const { id } = req.params;

    const contract = await Contract.findById(id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    // Load the template
    const templatePath = path.join(__dirname, "../files/boysContract.docx");
    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);
    let doc = new Docxtemplater(zip, {
      delimiters: {
        start: "{%",
        end: "%}",
      },
    });

    // Replace all placeholders (both contract variables and student data)
    const finalDocBuffer = await replaceWordFields(contract, id, doc);

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="contract.docx"'
    );
    return res.send(finalDocBuffer);
  } catch (error) {
    console.error("Error in printContract:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate contract",
      error: error.message,
    });
  }
};

const sendEmail = async (req, res) => {
  try {
    const { name, email, subject, message, contractId } = req.body;

    if (!email || !message || !contractId) {
      return res.status(400).json({
        error: "Email, message, and contract ID are required.",
      });
    }

    // Get contract file from request
    const contractFile = req.file;
    if (!contractFile) {
      return res.status(400).json({ error: "Contract file is missing." });
    }

    // Determine the correct file type (PDF or DOCX)
    // let fileExtension = contractFile.originalname.split(".").pop(); // Get the file extension
    let fileExtension = "pdf"; // Get the file extension
    let filename = `contract.${fileExtension}`; // Dynamically set filename

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject || "Contract Details",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h2 style="color: #4CAF50;">📄 Contract Details</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p style="margin-top: 10px; padding: 10px; background: #f9f9f9; border-left: 4px solid #4CAF50;">
            ${message}
          </p>
          <p style="color: #888;">Please review the attached contract document.</p>
          <hr style="border: 0; height: 1px; background: #ddd; margin-top: 20px;">
          <p style="font-size: 12px; color: #888;">This email was sent automatically. Please do not reply.</p>
        </div>
      `,
      attachments: [
        {
          filename: filename, // ✅ Dynamically use correct file type
          content: contractFile.buffer,
          encoding: "base64",
        },
      ],
    };

    let info = await transporter.sendMail(mailOptions);
    res.status(200).json({
      success: true,
      message: "✅ Email sent successfully with contract!",
      info,
    });
  } catch (error) {
    console.error("❌ Error in sendEmail:", error);
    res.status(500).json({
      error: "Failed to send email",
      details: error.message,
    });
  }
};

// 🔹 Function to Upload Contract to UltraMsg
const uploadToUltraMsg = async (filePath) => {
  return new Promise((resolve, reject) => {
    const options = {
      method: "POST",
      url: `https://api.ultramsg.com/instance117962/media/upload`,
      headers: { "content-type": "multipart/form-data" },
      formData: {
        token: process.env.ULTRAMSG_TOKEN,
        file: fs.createReadStream(filePath),
      },
    };

    request(options, (error, response, body) => {
      if (error) {
        console.error("❌ UltraMsg Upload Request Error:", error);
        return reject("Failed to upload file to UltraMsg.");
      }

      try {
        const responseBody = JSON.parse(body);
        if (responseBody.success) {
          console.log("✅ Uploaded to UltraMsg:", responseBody.success);
          resolve(responseBody.success); // ✅ Use responseBody.success instead of responseBody.url
        } else {
          reject(`❌ UltraMsg Upload Failed: ${JSON.stringify(responseBody)}`);
        }
      } catch (err) {
        reject("❌ Error parsing UltraMsg response.");
      }
    });
  });
};

// 🔹 Function to Delete Contract from UltraMsg
const deleteFromUltraMsg = async (fileUrl) => {
  return new Promise((resolve, reject) => {
    const options = {
      method: "POST",
      url: `https://api.ultramsg.com/instance117962/media/delete`,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      form: {
        token: process.env.ULTRAMSG_TOKEN,
        url: fileUrl, // ✅ File URL to delete
      },
    };

    request(options, (error, response, body) => {
      if (error) {
        console.error("❌ Error deleting file from UltraMsg:", error);
        return reject("Failed to delete file from UltraMsg.");
      }

      console.log("✅ UltraMsg File Deleted:", body);
      resolve(true);
    });
  });
};

// 🔹 Function to Delete Contract from Local Server
const deleteFromServer = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log("✅ Contract deleted from server:", filePath);
  } else {
    console.log("⚠️ Contract file not found on server:", filePath);
  }
};

// 🔹 Function to Send WhatsApp Contract via UltraMsg
const sendWhatsAppContract = async (req, res) => {
  try {
    const { whatsapp, contractId, name } = req.body;
    const contractFile = req.file;

    if (!whatsapp || !whatsapp.startsWith("+")) {
      return res.status(400).json({ error: "❌ رقم واتساب غير صالح." });
    }

    if (!contractFile) {
      return res.status(400).json({ error: "❌ لم يتم تحميل ملف العقد." });
    }

    // ✅ Move file to 'uploads' directory
    const filePath = `./uploads/${contractFile.filename}.docx`;
    fs.renameSync(contractFile.path, filePath);

    // ✅ Upload contract to UltraMsg
    console.log("📤 Uploading contract to UltraMsg...");
    const ultraMsgFileUrl = await uploadToUltraMsg(filePath);
    console.log("✅ UltraMsg File URL:", ultraMsgFileUrl);

    // ✅ Send contract via WhatsApp
    const options = {
      method: "POST",
      url: "https://api.ultramsg.com/instance117962/messages/document",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      form: {
        token: process.env.ULTRAMSG_TOKEN,
        to: whatsapp,
        filename: `contract_${contractId}.docx`,
        document: ultraMsgFileUrl, // ✅ Use UltraMsg File URL
        caption: `📄 Hello ${name}, this is your contract. Please review it.`,
      },
    };

    const sendWhatsApp = await new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (error) {
          console.error("❌ Error sending WhatsApp contract:", error);
          reject("Failed to send contract via WhatsApp");
        } else {
          console.log("✅ WhatsApp contract sent:", body);
          resolve(true);
        }
      });
    });

    if (sendWhatsApp) {
      // ✅ Delete the contract only if sending was successful
      console.log("🗑️ Deleting contract...");
      deleteFromServer(filePath); // ✅ Delete from local server
      await deleteFromUltraMsg(ultraMsgFileUrl); // ✅ Delete from UltraMsg

      res
        .status(200)
        .json({ success: true, message: "✅ العقد أُرسل بنجاح وتم حذفه!" });
    }
  } catch (error) {
    console.error("❌ Error processing WhatsApp contract:", error);
    res.status(500).json({
      error: "❌ فشل في إرسال العقد عبر واتساب",
      details: error.message,
    });
  }
};

module.exports = {
  getAllContracts,
  createContract,
  getContractDetails,
  loginUser,
  authCheck,
  createAdmin,
  editAdmin,
  deleteAdmin,
  getAdmins,
  deleteContract,
  editContract,
  getContractById,
  printContract,
  sendEmail,
  sendWhatsAppContract,
};
