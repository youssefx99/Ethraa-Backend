const mongoose = require("mongoose");

const contractVariablesSchema = new mongoose.Schema({
  // Contract Year Information
  contractYear: {
    type: String,

  },
  contractYearHijri: {
    type: String,

  },

  // Clause Four
  clausesFour: {
    type: String,
  },

  // Kindergarten Prices
  KinderPrice_Number: {
    type: String,
  },
  KinderPrice_Text: {
    type: String,
  },

  // Elementary Prices
  ElementaryPrice_Number: {
    type: String,
  },
  ElementaryPrice_Text: {
    type: String,
  },

  // Middle School Prices
  MiddlePrice_Number: {
    type: String,
  },
  MiddlePrice_Text: {
    type: String,
  },

  // High School Prices
  HighPrice_Number: {
    type: String,
  },
  HighPrice_Text: {
    type: String,
  },

  // Transportation Prices
  TwoPath_Price: {
    type: String,
  },
  OnePath_Price: {
    type: String,
  },
  OnePathTax_Price: {
    type: String,
  },
  TwoPathTax_Price: {
    type: String,
  },

  // Clause Seven
  ClauseSeven_One: {
    type: String,
  },
  ClauseSeven_Two: {
    type: String,
  },
  ClauseSeven_Three: {
    type: String,
  },
  ClauseSeven_Four: {
    type: String,
  },
  ClauseSeven_Five: {
    type: String,
  },
  ClauseSeven_Six: {
    type: String,
  },
  ClauseSeven_Seven: {
    type: String,
  },
  ClauseSeven_Eight: {
    type: String,
  },
  ClauseSeven_Nine: {
    type: String,
  },
  ClauseSeven_Ten: {
    type: String,
  },
  ClauseSeven_Eleven: {
    type: String,
  },
  ClauseSeven_Twelve: {
    type: String,
  },

  // Clause Eight
  ClauseEight_One: {
    type: String,
  },
  ClauseEight_Two: {
    type: String,
  },
  ClauseEight_Three: {
    type: String,
  },
  ClauseEight_CaseOne_Price: {
    type: String,
  },
  ClauseEight_caseThree_Percentage: {
    type: String,
  },
  ClauseEight_caseFour_Percentage: {
    type: String,
  },
  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

const ContractVariables = mongoose.model("ContractVariables", contractVariablesSchema);

module.exports = ContractVariables;