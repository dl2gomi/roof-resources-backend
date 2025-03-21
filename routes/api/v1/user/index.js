const express = require('express');
const router = express.Router();

const { userController } = require('@/controllers/v1');
const { auth } = require('@/middlewares');

router.post('/login', userController.login); // /api/v1/users/login
router.get('/info', auth, userController.info); // /api/v1/users/info
router.post('/update', auth, userController.update); // /api/v1/users/update
router.post('/passwordchange', auth, userController.change); // /api/v1/users/passwordchange

module.exports = router;
