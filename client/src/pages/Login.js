import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password);
      toast.success('Login successful!');
      
      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{
        maxWidth: '450px',
        margin: '2rem auto'
      }}>
        <div className="card">
          <h1 style={{
            fontSize: '2rem',
            marginBottom: '0.5rem',
            textAlign: 'center'
          }}>
            Sign In
          </h1>
          <p style={{
            textAlign: 'center',
            color: '#718096',
            marginBottom: '2rem'
          }}>
            Welcome back to Converge
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            color: '#718096'
          }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#667eea', fontWeight: 600 }}>
              Register here
            </Link>
          </p>

          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: '#f7fafc',
            borderRadius: '6px',
            fontSize: '0.875rem'
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Demo Credentials:</p>
            <p style={{ margin: '0.25rem 0' }}>Admin: admin@converge.com / Admin@123456</p>
            <p style={{ margin: '0.25rem 0' }}>User: Create new account or use existing</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
