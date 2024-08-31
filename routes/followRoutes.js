const express = require("express");
const router = express.Router();
const followController = require("../controllers/followController");

// Ruta para seguir a un usuario
router.post("/getFollowData", followController.getFollowData);
router.post("/getFollowDataById", followController.getFollowDataById);
router.post("/saveFollow", followController.saveFollow);
router.delete("/deleteFollow", followController.deleteFollow);
router.post("/isFollowing", followController.isFollowing);
router.post("/Itsme", followController.Itsme);

module.exports = router;
