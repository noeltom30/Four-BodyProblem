const db = require('../config/database');

class KYCController {
  // Upload document
  async uploadDocument(req, res) {
    try {
      const { documentType, documentNumber } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Save document info to database
      const result = await db.query(
        `INSERT INTO documents (user_id, document_type, file_name, file_path, file_size, mime_type, document_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, document_type, file_name, uploaded_at`,
        [
          req.user.id,
          documentType,
          file.originalname,
          file.path,
          file.size,
          file.mimetype,
          documentNumber || null
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Upload document error:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading document',
        error: error.message
      });
    }
  }

  // Get user's documents
  async getDocuments(req, res) {
    try {
      const result = await db.query(
        `SELECT id, document_type, file_name, file_size, mime_type, document_number, uploaded_at
         FROM documents
         WHERE user_id = $1
         ORDER BY uploaded_at DESC`,
        [req.user.id]
      );

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching documents',
        error: error.message
      });
    }
  }

  // Submit KYC for review
  async submitKYC(req, res) {
    try {
      // Check if user has uploaded at least one document
      const docResult = await db.query(
        'SELECT COUNT(*) as doc_count FROM documents WHERE user_id = $1',
        [req.user.id]
      );

      if (Number.parseInt(docResult.rows[0].doc_count) === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please upload at least one document before submitting KYC'
        });
      }

      // Update KYC status to under_review
      const result = await db.query(
        `UPDATE kyc_profiles 
         SET kyc_status = 'under_review', 
             submitted_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND kyc_status = 'pending'
         RETURNING kyc_status, submitted_at`,
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'KYC already submitted or not in pending state'
        });
      }

      res.json({
        success: true,
        message: 'KYC submitted for review successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Submit KYC error:', error);
      res.status(500).json({
        success: false,
        message: 'Error submitting KYC',
        error: error.message
      });
    }
  }

  // Get KYC status
  async getKYCStatus(req, res) {
    try {
      const result = await db.query(
        `SELECT k.kyc_status, k.credit_score, k.submitted_at, k.reviewed_at, k.rejection_reason,
                u.full_name as reviewed_by_name
         FROM kyc_profiles k
         LEFT JOIN users u ON k.reviewed_by = u.id
         WHERE k.user_id = $1`,
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'KYC profile not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Get KYC status error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching KYC status',
        error: error.message
      });
    }
  }

  // Admin: Get all pending KYC requests
  async getPendingKYC(req, res) {
    try {
      const result = await db.query(
        `SELECT u.id as user_id, u.email, u.full_name, u.phone,
                k.id as kyc_id, k.kyc_status, k.submitted_at, k.date_of_birth,
                k.address, k.city, k.state, k.postal_code,
                COUNT(d.id) as document_count
         FROM users u
         INNER JOIN kyc_profiles k ON u.id = k.user_id
         LEFT JOIN documents d ON u.id = d.user_id
         WHERE k.kyc_status = 'under_review'
         GROUP BY u.id, u.email, u.full_name, u.phone, k.id, k.kyc_status, 
                  k.submitted_at, k.date_of_birth, k.address, k.city, k.state, k.postal_code
         ORDER BY k.submitted_at ASC`
      );

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Get pending KYC error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching pending KYC requests',
        error: error.message
      });
    }
  }

  // Admin: Get user documents for review
  async getUserDocuments(req, res) {
    try {
      const { userId } = req.params;

      const result = await db.query(
        `SELECT id, document_type, file_name, file_path, file_size, 
                mime_type, document_number, uploaded_at
         FROM documents
         WHERE user_id = $1
         ORDER BY uploaded_at DESC`,
        [userId]
      );

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Get user documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user documents',
        error: error.message
      });
    }
  }

  // Admin: Review KYC (approve/reject)
  async reviewKYC(req, res) {
    const client = await db.getClient();
    
    try {
      const { userId } = req.params;
      const { action, rejectionReason } = req.body; // action: 'approve' or 'reject'

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Must be "approve" or "reject"'
        });
      }

      if (action === 'reject' && !rejectionReason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required when rejecting KYC'
        });
      }

      await client.query('BEGIN');

      // Get current KYC status
      const currentStatus = await client.query(
        'SELECT id, kyc_status FROM kyc_profiles WHERE user_id = $1',
        [userId]
      );

      if (currentStatus.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'KYC profile not found'
        });
      }

      const kycProfile = currentStatus.rows[0];
      const newStatus = action === 'approve' ? 'approved' : 'rejected';

      // Update KYC status
      await client.query(
        `UPDATE kyc_profiles 
         SET kyc_status = $1, 
             reviewed_at = CURRENT_TIMESTAMP,
             reviewed_by = $2,
             rejection_reason = $3
         WHERE user_id = $4`,
        [newStatus, req.user.id, rejectionReason || null, userId]
      );

      // Add to review history
      await client.query(
        `INSERT INTO kyc_review_history (kyc_profile_id, reviewed_by, previous_status, new_status, comments)
         VALUES ($1, $2, $3, $4, $5)`,
        [kycProfile.id, req.user.id, kycProfile.kyc_status, newStatus, rejectionReason || null]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `KYC ${action}d successfully`,
        data: {
          userId,
          status: newStatus,
          reviewedBy: req.user.full_name,
          reviewedAt: new Date()
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Review KYC error:', error);
      res.status(500).json({
        success: false,
        message: 'Error reviewing KYC',
        error: error.message
      });
    } finally {
      client.release();
    }
  }

  // Admin: Get all KYC requests with filters
  async getAllKYC(req, res) {
    try {
      const { status } = req.query;

      let query = `
        SELECT u.id as user_id, u.email, u.full_name, u.phone,
               k.kyc_status, k.credit_score, k.submitted_at, k.reviewed_at,
               k.rejection_reason,
               reviewer.full_name as reviewed_by_name
        FROM users u
        INNER JOIN kyc_profiles k ON u.id = k.user_id
        LEFT JOIN users reviewer ON k.reviewed_by = reviewer.id
        WHERE u.role = 'user'
      `;

      const params = [];
      if (status) {
        query += ' AND k.kyc_status = $1';
        params.push(status);
      }

      query += ' ORDER BY k.submitted_at DESC';

      const result = await db.query(query, params);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Get all KYC error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching KYC requests',
        error: error.message
      });
    }
  }
}

module.exports = new KYCController();
