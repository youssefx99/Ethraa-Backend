const express = require("express");
const router = express.Router();
const contractController = require("../controller/contractController");
const { body } = require("express-validator");
const {
  authenticateToken,
  authorizeRoles,
} = require("../controller/roleMiddleware");

// Super Admin only routes
router.post(
  "/",
  authenticateToken,
  authorizeRoles("super_admin"),
  contractController.createContractVariables
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("super_admin"),
  contractController.updateContractVariables
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("super_admin"),
  contractController.deleteContractVariables
);

// Both Admin and Super Admin routes
router.get(
  "/",
  contractController.getAllContractVariables
);

module.exports = router; 