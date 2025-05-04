const express = require('express');
const router = express.Router();
const { deleteAgent, getAllAgents } = require('../controllers/adminController');

router.get('/agents',getAllAgents);
  
  
router.delete('/agents/:id',deleteAgent);


module.exports = router;