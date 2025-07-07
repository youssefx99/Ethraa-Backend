const express = require("express");
const multer = require("multer");

const {
  getAllContracts,
  createContract,
  getContractDetails,
  loginUser,
  authCheck,
  deleteContract,
  editContract,
  getContractById,
  printContract,
  sendEmail,
  sendWhatsAppContract,
  editContractWordDocument,
  createAdmin,
  editAdmin,
  deleteAdmin,
  getAdmins
} = require("../controller/userController");

// ✅ Fixed path
const {
  authenticateToken,
  authorizeRoles,
} = require("../controller/roleMiddleware");

const router = express.Router();

// ✅ Multer configuration
const storage = multer.memoryStorage();
const mailupload = multer({ storage });
const whatsAppupload = multer({ dest: "uploads/" });

// ✅ Public routes (no authentication needed)
router.post("/admin/loginforadmin", loginUser);
router.get("/auth-check", authCheck);

// ✅ Super Admin only routes
router.post(
  "/admin/create-admin",
  authenticateToken,
  authorizeRoles("super_admin"),
  createAdmin
);

router.get(
  "/admin/get-admins",
  authenticateToken,
  authorizeRoles("super_admin"),
  getAdmins
);

router.put(
  "/admin/edit-admin/:id",
  authenticateToken,
  authorizeRoles("super_admin"),
  editAdmin
);

router.delete(
  "/admin/delete-admin/:id",
  authenticateToken,
  authorizeRoles("super_admin"),
  deleteAdmin
);


router.put(
  "/admin/edit/:id",
  authenticateToken,
  authorizeRoles("super_admin"),
  editContract
);

router.delete(
  "/admin/delete/:id",
  authenticateToken,
  authorizeRoles("super_admin"),
  deleteContract
);



router.post(
  "/user/create",
  createContract
);

// ✅ Both Admin and Super Admin routes
router.get(
  "/admin/print/:id",
  authenticateToken,
  authorizeRoles("admin", "super_admin"),
  (req, res) => printContract(req, res)
);

router.get(
  "/admin/ViewContarcts",
  authenticateToken,
  authorizeRoles("admin", "super_admin"),
  getContractDetails
);

router.get(
  "/admin/get/:id",
  authenticateToken,
  authorizeRoles("admin", "super_admin"),
  getContractById
);

// ✅ Email/WhatsApp routes (determine access level as needed)
// router.post(
//   "/send-email",
//   authenticateToken,
//   authorizeRoles("admin", "super_admin"),
//   mailupload.single("contractFile"),
//   sendEmail
// );

// router.post(
//   "/send-whatsapp",
//   authenticateToken,
//   authorizeRoles("admin", "super_admin"),
//   whatsAppupload.single("contractFile"),
//   sendWhatsAppContract
// );

// ✅ Consider if this should be protected
router.get("/getAll", getAllContracts); // You might want to protect this too

module.exports = router;
