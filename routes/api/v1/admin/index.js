const express = require('express');
const router = express.Router();

const { auth } = require('@/middlewares');
const { adminController } = require('@/controllers/v1');

router.post('/', auth, adminController.store); // POST /api/v1/admins/

module.exports = router;
