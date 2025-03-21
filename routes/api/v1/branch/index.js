const express = require('express');
const router = express.Router();

const { auth, onlySuper } = require('@/middlewares');
const { branchController } = require('@/controllers/v1');

router.post('/', auth, onlySuper, branchController.store); // POST /api/v1/branches/
router.put('/:id', auth, onlySuper, branchController.update); // PUT /api/v1/branches/:id
router.get('/', auth, onlySuper, branchController.list); // GET /api/v1/branches/
router.get('/:id', auth, onlySuper, branchController.show); // GET /api/v1/branches/:id
router.delete('/:id', auth, onlySuper, branchController.destroy); // DELETE /api/v1/branches/:id

module.exports = router;
