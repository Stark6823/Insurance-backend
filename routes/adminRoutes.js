const express = require('express');
const router = express.Router();
const { checkRole } = require('../middleware/roleMiddleware');
const { promoteToAgent } = require('../controllers/adminController');

// Only admins can promote users to agents/admins
router.patch('/promote/:userId', checkRole(['ADMIN']), promoteToAgent);

module.exports = router;