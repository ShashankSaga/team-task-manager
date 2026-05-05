const express = require('express');
const router = express.Router();
const { getDashboardStats, getAllUsers } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getDashboardStats);
router.get('/users', authenticate, getAllUsers);

module.exports = router;
