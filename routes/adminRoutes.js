const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/getAllReports', adminController.getAllReports);
router.post('/changeRole', adminController.changeRole);
router.post('/temporalBan', adminController.temporalBan);
router.post('/chekauth', adminController.chekauth);
router.post('/unBan', adminController.unBan);
router.delete('/deleteReport', adminController.deleteReport)

module.exports = router;