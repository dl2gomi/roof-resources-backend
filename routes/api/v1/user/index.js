const express = require('express');
const router = express.Router();

const { userController } = require('@/controllers/v1');
const { auth } = require('@/middlewares');

router.post('/login', userController.login); // /api/v1/users/login
router.get('/info', auth, userController.info); // /api/v1/users/info
router.post('/update', auth, userController.update); // /api/v1/users/update
router.post('/passwordchange', auth, userController.change); // /api/v1/users/passwordchange
router.post('/avatar', auth, userController.updateAvatar); // /api/v1/users/avatar
router.get('/avatar', auth, userController.serveAvatar); // /api/v1/users/avatar

module.exports = router;
