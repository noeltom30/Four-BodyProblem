const express = require('express');
const { body, query } = require('express-validator');
const transactionController = require('../controllers/transactionController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

// Validation rules
const addTransactionValidation = [
  body('transactionType').isIn(['credit', 'debit']).withMessage('Invalid transaction type'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').optional().trim(),
  body('merchantName').optional().trim(),
  body('category').optional().trim(),
  body('transactionDate').optional().isISO8601().withMessage('Invalid date format'),
];

const bulkTransactionValidation = [
  body('transactions').isArray({ min: 1 }).withMessage('Transactions array is required'),
  body('transactions.*.transactionType').isIn(['credit', 'debit']),
  body('transactions.*.amount').isFloat({ min: 0.01 }),
];

// Routes
router.post(
  '/',
  authMiddleware,
  authorize('user'),
  addTransactionValidation,
  validate,
  transactionController.addTransaction
);

router.post(
  '/bulk',
  authMiddleware,
  authorize('user'),
  bulkTransactionValidation,
  validate,
  transactionController.addBulkTransactions
);

router.get(
  '/',
  authMiddleware,
  authorize('user'),
  transactionController.getTransactions
);

router.get(
  '/credit-score',
  authMiddleware,
  authorize('user'),
  transactionController.getCreditScore
);

router.post(
  '/recalculate-score',
  authMiddleware,
  authorize('user'),
  transactionController.recalculateCreditScore
);

module.exports = router;
