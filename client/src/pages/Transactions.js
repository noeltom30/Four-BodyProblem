import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-toastify';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    transactionType: 'credit',
    amount: '',
    description: '',
    merchantName: '',
    category: '',
    transactionDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data.data.transactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast.error('Failed to load transactions');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transactions', formData);
      toast.success('Transaction added successfully');
      setShowAddForm(false);
      setFormData({
        transactionType: 'credit',
        amount: '',
        description: '',
        merchantName: '',
        category: '',
        transactionDate: new Date().toISOString().split('T')[0]
      });
      fetchTransactions();
    } catch (error) {
      console.error('Failed to add transaction:', error);
      toast.error('Failed to add transaction');
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Transactions</h1>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary">
          {showAddForm ? 'Cancel' : 'Add Transaction'}
        </button>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Add New Transaction</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="transactionType" className="form-label">Type</label>
                <select 
                  id="transactionType"
                  className="form-input"
                  value={formData.transactionType}
                  onChange={(e) => setFormData({...formData, transactionType: e.target.value})}
                >
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="amount" className="form-label">Amount</label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="transactionDate" className="form-label">Date</label>
                <input
                  id="transactionDate"
                  type="date"
                  className="form-input"
                  value={formData.transactionDate}
                  onChange={(e) => setFormData({...formData, transactionDate: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="description" className="form-label">Description</label>
              <input
                id="description"
                type="text"
                className="form-input"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <button type="submit" className="btn btn-success">Add Transaction</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Transaction History</h2>
        {transactions.length === 0 ? (
          <p style={{ color: '#718096' }}>No transactions yet. Add your first transaction!</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Date</th>
                  <th style={{ padding: '0.75rem' }}>Type</th>
                  <th style={{ padding: '0.75rem' }}>Amount</th>
                  <th style={{ padding: '0.75rem' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.75rem' }}>
                      {new Date(txn.transaction_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge badge-${txn.transaction_type === 'credit' ? 'approved' : 'rejected'}`}>
                        {txn.transaction_type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '0.75rem',
                      color: txn.transaction_type === 'credit' ? '#27ae60' : '#e74c3c',
                      fontWeight: 600
                    }}>
                      {txn.transaction_type === 'credit' ? '+' : '-'}₹{Number.parseFloat(txn.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem' }}>{txn.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
