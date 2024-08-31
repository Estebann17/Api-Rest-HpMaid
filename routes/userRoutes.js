const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const multer = require("multer");

// Configura multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post(
  "/update",
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  userController.update
);
router.post("/profile", userController.getProfile);
router.get("/profileWithEmail/:email", userController.getProfileWithEmail);
router.get("/getAllUsers/:page", userController.getAllUsers);
router.get("/getAllUsersForAdmins", userController.getAllUsersForAdmins);
router.get("/searchUsers/:page/:searchQuery", userController.searchUsers);
router.get("/getProfileById/:id", userController.getProfileById);
router.post("/reportUser", userController.reportUser);
router.post("/reportOfficial", userController.reportOfficial);
router.post("/getAvatar", userController.getAvatar);
router.get("/getPossibleCheaters", userController.getPossibleCheaters);
router.post("/create", userController.createApiCard);
router.post("/getProfileRank", userController.getProfileRank);
router.get("/getUsersRank", userController.getUsersRank);

module.exports = router;
