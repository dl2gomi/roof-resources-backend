const express = require('express');
const router = express.Router();

const { auth } = require('@/middlewares');
const { invoiceController } = require('@/controllers/v1');

router.get('/', auth, invoiceController.list); // GET /api/v1/invoices/
router.get('/:id', auth, invoiceController.show); // GET /api/v1/invoices/:id

module.exports = router;
