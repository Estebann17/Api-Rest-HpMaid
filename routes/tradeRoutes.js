const express = require('express');
const tradeController = require('../controllers/tradeController');
const router = express.Router();

router.post('/sendTradeRequest', tradeController.sendTradeRequest);
router.post('/getTradeRequests', tradeController.getTradeRequests);
router.get('/getTradeRequests/:id', tradeController.viewTradeRequestsbyId);
router.post('/editTradeRequest', tradeController.editTradeRequest);
router.post('/getAwaitingRequests', tradeController.getAwaitingRequests);
router.post('/acceptTradeRequest', tradeController.acceptTradeRequest);
router.delete('/deleteTrade/:id', tradeController.deleteTrade);
module.exports = router;