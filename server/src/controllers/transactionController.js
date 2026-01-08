const db = require('../config/database');
const cibilService = require('../services/cibilService');

class TransactionController {
  // Add transaction
  async addTransaction(req, res) {
    try {
      const { transactionType, amount, description, merchantName, category, transactionDate } = req.body;

      const result = await db.query(
        `INSERT INTO transactions (user_id, transaction_type, amount, description, merchant_name, category, transaction_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, transaction_type, amount, description, merchant_name, category, transaction_date, created_at`,
        [
          req.user.id,
          transactionType,
          amount,
          description || null,
          merchantName || null,
          category || null,
          transactionDate || new Date()
        ]
      );

      // Recalculate credit score
      const newScore = await cibilService.calculateCreditScore(req.user.id);

      res.status(201).json({
        success: true,
        message: 'Transaction added successfully',
        data: {
          transaction: result.rows[0],
          newCreditScore: newScore
        }
      });
    } catch (error) {
      console.error('Add transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding transaction',
        error: error.message
      });
    }
  }

  // Get user transactions
  async getTransactions(req, res) {
    try {
      const { limit = 50, offset = 0, type } = req.query;

      let query = `
        SELECT id, transaction_type, amount, description, merchant_name, 
               category, transaction_date, created_at
        FROM transactions
        WHERE user_id = $1
      `;
      
      const params = [req.user.id];

      if (type && ['credit', 'debit'].includes(type)) {
        query += ' AND transaction_type = $2';
        params.push(type);
      }

      query += ' ORDER BY transaction_date DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(parseInt(limit), parseInt(offset));

      const result = await db.query(query, params);

      // Get total count
      const countResult = await db.query(
        'SELECT COUNT(*) as total FROM transactions WHERE user_id = $1',
        [req.user.id]
      );

      res.json({
        success: true,
        data: {
          transactions: result.rows,
          pagination: {
            total: parseInt(countResult.rows[0].total),
            limit: parseInt(limit),
            offset: parseInt(offset)
          }
        }
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching transactions',
        error: error.message
      });
    }
  }

  // Get credit score
  async getCreditScore(req, res) {
    try {
      const details = await cibilService.getCreditScoreDetails(req.user.id);

      res.json({
        success: true,
        data: details
      });
    } catch (error) {
      console.error('Get credit score error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching credit score',
        error: error.message
      });
    }
  }

  // Recalculate credit score (manual trigger)
  async recalculateCreditScore(req, res) {
    try {
      const newScore = await cibilService.calculateCreditScore(req.user.id);

      res.json({
        success: true,
        message: 'Credit score recalculated successfully',
        data: {
          creditScore: newScore
        }
      });
    } catch (error) {
      console.error('Recalculate credit score error:', error);
      res.status(500).json({
        success: false,
        message: 'Error recalculating credit score',
        error: error.message
      });
    }
  }

  // Add bulk transactions (for demo/testing)
  async addBulkTransactions(req, res) {
    const client = await db.getClient();
    
    try {
      const { transactions } = req.body;

      if (!Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Transactions array is required'
        });
      }

      await client.query('BEGIN');

      const insertedTransactions = [];
      
      for (const txn of transactions) {
        const result = await client.query(
          `INSERT INTO transactions (user_id, transaction_type, amount, description, merchant_name, category, transaction_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, transaction_type, amount, transaction_date`,
          [
            req.user.id,
            txn.transactionType,
            txn.amount,
            txn.description || null,
            txn.merchantName || null,
            txn.category || null,
            txn.transactionDate || new Date()
          ]
        );
        insertedTransactions.push(result.rows[0]);
      }

      await client.query('COMMIT');

      // Recalculate credit score
      const newScore = await cibilService.calculateCreditScore(req.user.id);

      res.status(201).json({
        success: true,
        message: `${insertedTransactions.length} transactions added successfully`,
        data: {
          count: insertedTransactions.length,
          newCreditScore: newScore
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Add bulk transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding bulk transactions',
        error: error.message
      });
    } finally {
      client.release();
    }
  }
}

module.exports = new TransactionController();
