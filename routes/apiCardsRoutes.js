// En cardRoutes.js
const express = require("express");
const router = express.Router();
const apiCardsController = require("../controllers/apiCardsController");

// Ruta para obtener las cartas de un usuario
router.post("/createApiCard", apiCardsController.createApiCard);
router.get("/getAllCards", apiCardsController.getAllCards);
router.get("/getCardById/:id", apiCardsController.getCardById);
router.post("/boostCard", apiCardsController.boostCard);
router.get("/getTopCards", apiCardsController.getTopCards);
router.get("/sortedByCoins/:page", apiCardsController.getAllCardsSortedByCoins);
router.get("/exploredCards/:page", apiCardsController.exploredCards);
router.get(
  "/searchCards/:email/:page/:searchQuery",
  apiCardsController.searchCards
);
router.post(
  "/addCardToFavorites/:id/:email",
  apiCardsController.addApiCardToFavorites
);
router.get(
  "/getFavoriteApiCards/:email",
  apiCardsController.getFavoriteApiCards
);

module.exports = router;
