import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem 0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '2rem'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link to="/" style={{
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          textDecoration: 'none'
        }}>
          🔐 Converge
        </Link>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {user ? (
            <>
              <span style={{ color: 'white' }}>
                Welcome, {user.fullName}
                {user.role === 'admin' && ' (Admin)'}
              </span>
              
              {user.role === 'user' ? (
                <>
                  <Link to="/dashboard" className="btn btn-secondary" style={{ margin: 0 }}>
                    Dashboard
                  </Link>
                  <Link to="/documents" className="btn btn-secondary" style={{ margin: 0 }}>
                    Documents
                  </Link>
                  <Link to="/transactions" className="btn btn-secondary" style={{ margin: 0 }}>
                    Transactions
                  </Link>
                </>
              ) : user.role === 'admin' ? (
                <>
                  <Link to="/admin" className="btn btn-secondary" style={{ margin: 0 }}>
                    Admin Panel
                  </Link>
                </>
              ) : null}
              
              <button onClick={handleLogout} className="btn btn-danger" style={{ margin: 0 }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" style={{ margin: 0 }}>
                Login
              </Link>
              <Link to="/register" className="btn" style={{ 
                margin: 0,
                background: 'white',
                color: '#667eea'
              }}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
