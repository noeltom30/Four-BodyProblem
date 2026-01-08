const express = require('express');
const { body, param } = require('express-validator');
const kycController = require('../controllers/kycController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');
const { validate } = require('../middleware/validator');

const router = express.Router();

// Validation rules
const uploadDocumentValidation = [
  body('documentType')
    .isIn(['aadhaar', 'pan', 'passport', 'driving_license', 'voter_id', 'utility_bill', 'bank_statement'])
    .withMessage('Invalid document type'),
  body('documentNumber').optional().trim(),
];

const reviewKYCValidation = [
  param('userId').isUUID().withMessage('Invalid user ID'),
  body('action').isIn(['approve', 'reject']).withMessage('Invalid action'),
  body('rejectionReason').optional().trim(),
];

// User routes
router.post(
  '/documents/upload',
  authMiddleware,
  authorize('user'),
  upload.single('document'),
  handleMulterError,
  uploadDocumentValidation,
  validate,
  kycController.uploadDocument
);

router.get(
  '/documents',
  authMiddleware,
  authorize('user'),
  kycController.getDocuments
);

router.post(
  '/submit',
  authMiddleware,
  authorize('user'),
  kycController.submitKYC
);

router.get(
  '/status',
  authMiddleware,
  authorize('user'),
  kycController.getKYCStatus
);

// Admin routes
router.get(
  '/admin/pending',
  authMiddleware,
  authorize('admin'),
  kycController.getPendingKYC
);

router.get(
  '/admin/all',
  authMiddleware,
  authorize('admin'),
  kycController.getAllKYC
);

router.get(
  '/admin/documents/:userId',
  authMiddleware,
  authorize('admin'),
  param('userId').isUUID(),
  validate,
  kycController.getUserDocuments
);

router.post(
  '/admin/review/:userId',
  authMiddleware,
  authorize('admin'),
  reviewKYCValidation,
  validate,
  kycController.reviewKYC
);

module.exports = router;
