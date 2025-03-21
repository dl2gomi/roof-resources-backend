const express = require('express');
const router = express.Router();

const userRouter = require('./user');
const branchRouter = require('./branch');
const adminRouter = require('./admin');
const proposalRouter = require('./proposal');
const invoiceRouter = require('./invoice');

// subpaths
router.use('/users', userRouter); // /api/v1/users/*
router.use('/branches', branchRouter); // /api/v1/branches/*
router.use('/admins', adminRouter); // /api/v1/admins/*
router.use('/proposals', proposalRouter); // /api/v1/proposals/*
router.use('/invoices', invoiceRouter); // /api/v1/invoices/*

module.exports = router;
