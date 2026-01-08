import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="container">
      <div style={{
        textAlign: 'center',
        padding: '4rem 0',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Welcome to Converge
        </h1>
        
        <p style={{
          fontSize: '1.25rem',
          color: '#718096',
          marginBottom: '2rem'
        }}>
          Centralized KYC Service for the FinTech Domain
        </p>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          marginBottom: '3rem'
        }}>
          <Link to="/register" className="btn btn-primary">
            Get Started
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Sign In
          </Link>
        </div>

        <div className="card" style={{ textAlign: 'left', marginTop: '3rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Features</h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem'
          }}>
            <div>
              <h3 style={{ color: '#667eea', marginBottom: '0.5rem' }}>
                🔐 Secure KYC
              </h3>
              <p style={{ color: '#718096' }}>
                Upload and manage your identity documents securely
              </p>
            </div>
            
            <div>
              <h3 style={{ color: '#667eea', marginBottom: '0.5rem' }}>
                📊 Credit Score
              </h3>
              <p style={{ color: '#718096' }}>
                Track your CIBIL score based on transaction history
              </p>
            </div>
            
            <div>
              <h3 style={{ color: '#667eea', marginBottom: '0.5rem' }}>
                🤝 Partner Integration
              </h3>
              <p style={{ color: '#718096' }}>
                Share verified data with trusted lending partners
              </p>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: '2rem', textAlign: 'left' }}>
          <h2 style={{ marginBottom: '1rem' }}>How It Works</h2>
          <ol style={{ lineHeight: '2', color: '#4a5568' }}>
            <li><strong>Register:</strong> Create your account with basic details</li>
            <li><strong>Upload Documents:</strong> Submit your identity proofs</li>
            <li><strong>Get Verified:</strong> Admin reviews and approves your KYC</li>
            <li><strong>Build History:</strong> Add transactions to generate credit score</li>
            <li><strong>Connect Partners:</strong> Link with lending partners like Slice</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Home;
