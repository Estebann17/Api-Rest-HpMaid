// En cardRoutes.js

const express = require("express");
const router = express.Router();
const cardController = require("../controllers/cardController");

// Ruta para obtener las cartas de un usuario
router.post("/saveCard", cardController.saveCard);
router.get("/findUserCards/:email", cardController.findUserCards);
router.get("/findUserCardsById/:userId", cardController.findUserCardsById);
router.post("/existCard", cardController.existCard);
router.delete("/deleteCards", cardController.deleteCards);
router.get("/ViewUserCards/:id", cardController.ViewUserCards);
router.get("/findCharacter/:id", cardController.findCharacterById);
router.delete(
  "/deleteIndividualCard/:mal_id/:email",
  cardController.deleteIndividualCard
);

module.exports = router;
