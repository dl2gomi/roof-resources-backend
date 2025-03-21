const express = require('express');
const router = express.Router();

const { auth, onlyAdmin } = require('@/middlewares');
const { proposalController } = require('@/controllers/v1');

router.put('/:id', auth, onlyAdmin, proposalController.update); // PUT /api/v1/proposals/:id
router.get('/', auth, proposalController.list); // GET /api/v1/proposals/
router.get('/:id', auth, proposalController.show); // GET /api/v1/proposals/:id
router.delete('/:id', auth, onlyAdmin, proposalController.destroy); // DELETE /api/v1/proposals/:id

module.exports = router;
