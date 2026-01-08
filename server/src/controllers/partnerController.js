const crypto = require('crypto');
const db = require('../config/database');

class PartnerController {
  // Partner: Initiate account linking (OAuth-like flow)
  async initiateLink(req, res) {
    try {
      const { partnerCode, userId } = req.body;

      // Verify partner exists
      const partnerResult = await db.query(
        'SELECT id, partner_name, is_active FROM partner_integrations WHERE partner_code = $1',
        [partnerCode]
      );

      if (partnerResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Partner not found'
        });
      }

      const partner = partnerResult.rows[0];

      if (!partner.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Partner integration is disabled'
        });
      }

      // Verify user exists and KYC is approved
      const userResult = await db.query(
        `SELECT u.id, u.email, u.full_name, k.kyc_status
         FROM users u
         INNER JOIN kyc_profiles k ON u.id = k.user_id
         WHERE u.id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = userResult.rows[0];

      if (user.kyc_status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: 'User KYC is not approved. Cannot link account.'
        });
      }

      // Generate access token
      const accessToken = crypto.randomBytes(32).toString('hex');
      const refreshToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

      // Check if link already exists
      const existingLink = await db.query(
        'SELECT id FROM user_partner_links WHERE user_id = $1 AND partner_id = $2',
        [userId, partner.id]
      );

      if (existingLink.rows.length > 0) {
        // Update existing link
        await db.query(
          `UPDATE user_partner_links 
           SET access_token = $1, refresh_token = $2, expires_at = $3, 
               is_active = true, linked_at = CURRENT_TIMESTAMP
           WHERE user_id = $4 AND partner_id = $5`,
          [accessToken, refreshToken, expiresAt, userId, partner.id]
        );
      } else {
        // Create new link
        await db.query(
          `INSERT INTO user_partner_links (user_id, partner_id, access_token, refresh_token, 
                                           granted_scopes, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            userId,
            partner.id,
            accessToken,
            refreshToken,
            ['kyc_status', 'credit_score', 'transaction_history'],
            expiresAt
          ]
        );
      }

      res.json({
        success: true,
        message: 'Account linked successfully',
        data: {
          accessToken,
          refreshToken,
          expiresAt,
          partnerName: partner.partner_name
        }
      });
    } catch (error) {
      console.error('Initiate link error:', error);
      res.status(500).json({
        success: false,
        message: 'Error linking account',
        error: error.message
      });
    }
  }

  // Partner: Verify KYC status
  async verifyKYCStatus(req, res) {
    try {
      const { apiKey } = req.headers;
      const accessToken = req.headers.authorization?.replace('Bearer ', '');

      if (!apiKey || !accessToken) {
        return res.status(401).json({
          success: false,
          message: 'API key and access token are required'
        });
      }

      // Verify partner API key
      const partnerResult = await db.query(
        'SELECT id, partner_name, is_active FROM partner_integrations WHERE api_key = $1',
        [apiKey]
      );

      if (partnerResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid API key'
        });
      }

      const partner = partnerResult.rows[0];

      if (!partner.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Partner access is disabled'
        });
      }

      // Verify access token and get user
      const linkResult = await db.query(
        `SELECT upl.user_id, upl.expires_at, upl.is_active,
                u.email, u.full_name,
                k.kyc_status, k.credit_score
         FROM user_partner_links upl
         INNER JOIN users u ON upl.user_id = u.id
         INNER JOIN kyc_profiles k ON u.id = k.user_id
         WHERE upl.access_token = $1 AND upl.partner_id = $2`,
        [accessToken, partner.id]
      );

      if (linkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Account link not found'
        });
      }

      const link = linkResult.rows[0];

      // Check if token is expired
      if (new Date(link.expires_at) < new Date()) {
        return res.status(401).json({
          success: false,
          message: 'Access token expired'
        });
      }

      if (!link.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Account link is inactive'
        });
      }

      res.json({
        success: true,
        data: {
          userId: link.user_id,
          email: link.email,
          fullName: link.full_name,
          kycStatus: link.kyc_status,
          kycApproved: link.kyc_status === 'approved'
        }
      });
    } catch (error) {
      console.error('Verify KYC status error:', error);
      res.status(500).json({
        success: false,
        message: 'Error verifying KYC status',
        error: error.message
      });
    }
  }

  // Partner: Get user data (credit score + transaction history)
  async getUserData(req, res) {
    try {
      const { apiKey } = req.headers;
      const accessToken = req.headers.authorization?.replace('Bearer ', '');

      if (!apiKey || !accessToken) {
        return res.status(401).json({
          success: false,
          message: 'API key and access token are required'
        });
      }

      // Verify partner and access token
      const linkResult = await db.query(
        `SELECT upl.user_id, upl.expires_at, upl.is_active, upl.granted_scopes,
                u.email, u.full_name,
                k.kyc_status, k.credit_score
         FROM user_partner_links upl
         INNER JOIN users u ON upl.user_id = u.id
         INNER JOIN kyc_profiles k ON u.id = k.user_id
         INNER JOIN partner_integrations p ON upl.partner_id = p.id
         WHERE upl.access_token = $1 AND p.api_key = $2 AND p.is_active = true`,
        [accessToken, apiKey]
      );

      if (linkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Invalid access token or API key'
        });
      }

      const link = linkResult.rows[0];

      // Check expiration and active status
      if (new Date(link.expires_at) < new Date()) {
        return res.status(401).json({
          success: false,
          message: 'Access token expired'
        });
      }

      if (!link.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Account link is inactive'
        });
      }

      // Verify KYC is approved
      if (link.kyc_status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: 'User KYC is not approved'
        });
      }

      // Get transaction history (last 50 transactions)
      const transactionsResult = await db.query(
        `SELECT transaction_type, amount, description, merchant_name, 
                category, transaction_date
         FROM transactions
         WHERE user_id = $1
         ORDER BY transaction_date DESC
         LIMIT 50`,
        [link.user_id]
      );

      // Calculate summary
      const transactions = transactionsResult.rows;
      const totalCredit = transactions
        .filter(t => t.transaction_type === 'credit')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const totalDebit = transactions
        .filter(t => t.transaction_type === 'debit')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      res.json({
        success: true,
        data: {
          user: {
            userId: link.user_id,
            email: link.email,
            fullName: link.full_name
          },
          kyc: {
            status: link.kyc_status,
            approved: true
          },
          creditScore: link.credit_score,
          financialSummary: {
            totalTransactions: transactions.length,
            totalCredit,
            totalDebit,
            netBalance: totalCredit - totalDebit
          },
          recentTransactions: transactions.slice(0, 10)
        }
      });
    } catch (error) {
      console.error('Get user data error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user data',
        error: error.message
      });
    }
  }

  // User: Get linked partners
  async getLinkedPartners(req, res) {
    try {
      const result = await db.query(
        `SELECT p.partner_name, p.partner_code, upl.linked_at, upl.expires_at, upl.is_active
         FROM user_partner_links upl
         INNER JOIN partner_integrations p ON upl.partner_id = p.id
         WHERE upl.user_id = $1
         ORDER BY upl.linked_at DESC`,
        [req.user.id]
      );

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Get linked partners error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching linked partners',
        error: error.message
      });
    }
  }

  // User: Revoke partner access
  async revokePartnerAccess(req, res) {
    try {
      const { partnerCode } = req.params;

      const result = await db.query(
        `UPDATE user_partner_links upl
         SET is_active = false
         FROM partner_integrations p
         WHERE upl.partner_id = p.id 
         AND p.partner_code = $1 
         AND upl.user_id = $2
         RETURNING p.partner_name`,
        [partnerCode, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Partner link not found'
        });
      }

      res.json({
        success: true,
        message: `Access revoked for ${result.rows[0].partner_name}`
      });
    } catch (error) {
      console.error('Revoke partner access error:', error);
      res.status(500).json({
        success: false,
        message: 'Error revoking partner access',
        error: error.message
      });
    }
  }
}

module.exports = new PartnerController();
