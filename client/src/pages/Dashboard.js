import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [creditScore, setCreditScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, scoreRes] = await Promise.all([
        api.get('/auth/profile'),
        api.get('/transactions/credit-score')
      ]);
      
      setProfile(profileRes.data.data);
      setCreditScore(scoreRes.data.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  const kycStatus = profile?.kyc?.status || 'pending';
  const score = creditScore?.creditScore || 0;

  const getScoreColor = (score) => {
    if (score >= 750) return '#27ae60';
    if (score >= 650) return '#f39c12';
    return '#e74c3c';
  };

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}>Dashboard</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* KYC Status Card */}
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>KYC Status</h2>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
          }}>
            <span className={`badge badge-${kycStatus.replace('_', '-')}`}>
              {kycStatus.replace('_', ' ').toUpperCase()}
            </span>
            {kycStatus === 'pending' && (
              <Link to="/documents" className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                Upload Documents
              </Link>
            )}
          </div>
          {profile?.kyc?.rejectionReason && (
            <div style={{ marginTop: '1rem', color: '#e74c3c' }}>
              <strong>Rejection Reason:</strong> {profile.kyc.rejectionReason}
            </div>
          )}
        </div>

        {/* Credit Score Card */}
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Credit Score</h2>
          <div style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            color: getScoreColor(score),
            textAlign: 'center'
          }}>
            {score}
          </div>
          <div style={{
            textAlign: 'center',
            color: '#718096',
            marginTop: '0.5rem'
          }}>
            Range: 300 - 900
          </div>
          <Link to="/transactions" className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem' }}>
            View Transactions
          </Link>
        </div>

        {/* Profile Info Card */}
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Profile Info</h2>
          <div style={{ lineHeight: '1.8' }}>
            <p><strong>Name:</strong> {profile?.fullName}</p>
            <p><strong>Email:</strong> {profile?.email}</p>
            {profile?.phone && <p><strong>Phone:</strong> {profile.phone}</p>}
            {profile?.kyc?.city && <p><strong>City:</strong> {profile.kyc.city}</p>}
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      {creditScore && (
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Financial Summary</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <div style={{ color: '#718096', fontSize: '0.875rem' }}>Total Transactions</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{creditScore.totalTransactions}</div>
            </div>
            <div>
              <div style={{ color: '#718096', fontSize: '0.875rem' }}>Total Credits</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#27ae60' }}>
                ₹{creditScore.totalCredits?.toFixed(2) || 0}
              </div>
            </div>
            <div>
              <div style={{ color: '#718096', fontSize: '0.875rem' }}>Total Debits</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e74c3c' }}>
                ₹{creditScore.totalDebits?.toFixed(2) || 0}
              </div>
            </div>
            <div>
              <div style={{ color: '#718096', fontSize: '0.875rem' }}>Net Balance</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                ₹{creditScore.netBalance?.toFixed(2) || 0}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
