const express = require("express");
const router = express.Router();
const viewController = require("../controllers/viewController");

router.get("/createView/:viewerEmail/:targetUserId", viewController.createView);
router.get("/getView/:userEmail", viewController.getView);

module.exports = router;
