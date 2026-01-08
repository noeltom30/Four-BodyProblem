const express = require('express');
const { body, param } = require('express-validator');
const partnerController = require('../controllers/partnerController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

// Validation rules
const initiateLinkValidation = [
  body('partnerCode').trim().notEmpty().withMessage('Partner code is required'),
  body('userId').isUUID().withMessage('Valid user ID is required'),
];

// User routes
router.get(
  '/linked',
  authMiddleware,
  authorize('user'),
  partnerController.getLinkedPartners
);

router.delete(
  '/revoke/:partnerCode',
  authMiddleware,
  authorize('user'),
  param('partnerCode').trim().notEmpty(),
  validate,
  partnerController.revokePartnerAccess
);

// Partner API routes (no auth middleware, uses API key)
router.post(
  '/link',
  initiateLinkValidation,
  validate,
  partnerController.initiateLink
);

router.get(
  '/verify-kyc',
  partnerController.verifyKYCStatus
);

router.get(
  '/user-data',
  partnerController.getUserData
);

module.exports = router;
