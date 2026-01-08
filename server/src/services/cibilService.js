const db = require('../config/database');
const config = require('../config');

class CibilService {
  /**
   * Calculate credit score based on transaction history
   * Score range: 300-900 (similar to actual CIBIL scores)
   */
  async calculateCreditScore(userId) {
    try {
      // Get all transactions for the user
      const transactionsResult = await db.query(
        `SELECT transaction_type, amount, transaction_date
         FROM transactions
         WHERE user_id = $1
         ORDER BY transaction_date DESC`,
        [userId]
      );

      const transactions = transactionsResult.rows;

      if (transactions.length === 0) {
        // No transaction history - give minimum score
        return 300;
      }

      // Calculate components
      const totalTransactionsScore = this.calculateTotalTransactionsScore(transactions);
      const avgAmountScore = this.calculateAvgAmountScore(transactions);
      const creditDebitRatioScore = this.calculateCreditDebitRatioScore(transactions);
      const frequencyScore = this.calculateFrequencyScore(transactions);
      const recentActivityScore = this.calculateRecentActivityScore(transactions);

      // Weighted calculation
      const weights = config.creditScoreWeights;
      const rawScore =
        totalTransactionsScore * weights.totalTransactions +
        avgAmountScore * weights.avgTransactionAmount +
        creditDebitRatioScore * weights.creditToDebitRatio +
        frequencyScore * weights.transactionFrequency +
        recentActivityScore * weights.recentActivity;

      // Normalize to 300-900 range
      const finalScore = Math.round(300 + rawScore * 600);

      // Update the score in database
      await db.query(
        'UPDATE kyc_profiles SET credit_score = $1 WHERE user_id = $2',
        [finalScore, userId]
      );

      return finalScore;
    } catch (error) {
      console.error('Calculate credit score error:', error);
      throw error;
    }
  }

  calculateTotalTransactionsScore(transactions) {
    const count = transactions.length;
    // More transactions = better score
    // Normalize: 0 txns = 0, 100+ txns = 1
    return Math.min(count / 100, 1);
  }

  calculateAvgAmountScore(transactions) {
    const totalAmount = transactions.reduce((sum, t) => sum + Number.parseFloat(t.amount), 0);
    const avgAmount = totalAmount / transactions.length;
    
    // Average transaction amount scoring
    // Higher average = better score (indicates financial activity)
    // Normalize: 0-10000 range
    return Math.min(avgAmount / 10000, 1);
  }

  calculateCreditDebitRatioScore(transactions) {
    const credits = transactions.filter(t => t.transaction_type === 'credit');
    const debits = transactions.filter(t => t.transaction_type === 'debit');
    
    const totalCredit = credits.reduce((sum, t) => sum + Number.parseFloat(t.amount), 0);
    const totalDebit = debits.reduce((sum, t) => sum + Number.parseFloat(t.amount), 0);

    if (totalDebit === 0) {
      return 1; // Only credits, excellent
    }

    // Ratio > 1 means more credits than debits (good)
    const ratio = totalCredit / totalDebit;
    return Math.min(ratio / 2, 1); // Normalize: ratio of 2 or more = perfect score
  }

  calculateFrequencyScore(transactions) {
    if (transactions.length === 0) return 0;

    // Calculate days between first and last transaction
    const firstDate = new Date(transactions[transactions.length - 1].transaction_date);
    const lastDate = new Date(transactions[0].transaction_date);
    const daysDiff = Math.max((lastDate - firstDate) / (1000 * 60 * 60 * 24), 1);

    // Transactions per day
    const frequency = transactions.length / daysDiff;

    // Normalize: 0.5 transactions per day or more = perfect score
    return Math.min(frequency / 0.5, 1);
  }

  calculateRecentActivityScore(transactions) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Count transactions in last 30 days
    const recentTransactions = transactions.filter(
      t => new Date(t.transaction_date) >= thirtyDaysAgo
    );

    // Normalize: 10+ recent transactions = perfect score
    return Math.min(recentTransactions.length / 10, 1);
  }

  /**
   * Get detailed credit score breakdown
   */
  async getCreditScoreDetails(userId) {
    try {
      const transactionsResult = await db.query(
        `SELECT transaction_type, amount, transaction_date, description, category
         FROM transactions
         WHERE user_id = $1
         ORDER BY transaction_date DESC
         LIMIT 100`,
        [userId]
      );

      const transactions = transactionsResult.rows;

      const totalCredits = transactions
        .filter(t => t.transaction_type === 'credit')
        .reduce((sum, t) => sum + Number.parseFloat(t.amount), 0);

      const totalDebits = transactions
        .filter(t => t.transaction_type === 'debit')
        .reduce((sum, t) => sum + Number.parseFloat(t.amount), 0);

      const scoreResult = await db.query(
        'SELECT credit_score FROM kyc_profiles WHERE user_id = $1',
        [userId]
      );

      return {
        creditScore: scoreResult.rows[0]?.credit_score || 0,
        totalTransactions: transactions.length,
        totalCredits,
        totalDebits,
        netBalance: totalCredits - totalDebits,
        recentTransactions: transactions.slice(0, 10),
      };
    } catch (error) {
      console.error('Get credit score details error:', error);
      throw error;
    }
  }
}

module.exports = new CibilService();
