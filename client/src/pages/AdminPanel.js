import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-toastify';

const AdminPanel = () => {
  const [pendingKYC, setPendingKYC] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingKYC();
  }, []);

  const fetchPendingKYC = async () => {
    try {
      const res = await api.get('/kyc/admin/pending');
      setPendingKYC(res.data.data);
    } catch (error) {
      toast.error('Failed to load pending KYC requests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocuments = async (userId) => {
    try {
      const res = await api.get(`/kyc/admin/documents/${userId}`);
      setDocuments(res.data.data);
      setSelectedUser(userId);
    } catch (error) {
      toast.error('Failed to load documents');
    }
  };

  const handleReview = async (userId, action) => {
    if (action === 'reject' && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await api.post(`/kyc/admin/review/${userId}`, {
        action,
        rejectionReason: action === 'reject' ? rejectionReason : null
      });
      toast.success(`KYC ${action}d successfully`);
      setSelectedUser(null);
      setRejectionReason('');
      fetchPendingKYC();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} KYC`);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}>Admin Panel - KYC Management</h1>

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>
          Pending KYC Requests ({pendingKYC.length})
        </h2>

        {pendingKYC.length === 0 ? (
          <p style={{ color: '#718096' }}>No pending KYC requests</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {pendingKYC.map((request) => (
              <div key={request.user_id} className="card" style={{
                background: '#f7fafc',
                boxShadow: 'none'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>{request.full_name}</h3>
                    <p style={{ margin: '0.25rem 0', color: '#718096' }}>
                      <strong>Email:</strong> {request.email}
                    </p>
                    <p style={{ margin: '0.25rem 0', color: '#718096' }}>
                      <strong>Phone:</strong> {request.phone || 'N/A'}
                    </p>
                    <p style={{ margin: '0.25rem 0', color: '#718096' }}>
                      <strong>Location:</strong> {request.city || 'N/A'}, {request.state || 'N/A'}
                    </p>
                    <p style={{ margin: '0.25rem 0', color: '#718096' }}>
                      <strong>Documents:</strong> {request.document_count}
                    </p>
                    <p style={{ margin: '0.25rem 0', color: '#718096' }}>
                      <strong>Submitted:</strong> {new Date(request.submitted_at).toLocaleString()}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                    <button
                      onClick={() => handleViewDocuments(request.user_id)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                      View Documents
                    </button>
                  </div>
                </div>

                {selectedUser === request.user_id && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '6px'
                  }}>
                    <h4 style={{ marginBottom: '1rem' }}>Documents</h4>
                    {documents.map((doc) => (
                      <div key={doc.id} style={{
                        padding: '0.75rem',
                        background: '#f7fafc',
                        borderRadius: '4px',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{ fontWeight: 600 }}>
                          {doc.document_type.replace('_', ' ').toUpperCase()}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                          {doc.file_name} • {(doc.file_size / 1024).toFixed(2)} KB
                        </div>
                        {doc.document_number && (
                          <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                            Number: {doc.document_number}
                          </div>
                        )}
                      </div>
                    ))}

                    <div style={{ marginTop: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Rejection Reason (if rejecting)</label>
                        <textarea
                          className="form-input"
                          rows="3"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Provide reason for rejection..."
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                          onClick={() => handleReview(request.user_id, 'approve')}
                          className="btn btn-success"
                        >
                          ✓ Approve KYC
                        </button>
                        <button
                          onClick={() => handleReview(request.user_id, 'reject')}
                          className="btn btn-danger"
                        >
                          ✗ Reject KYC
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(null);
                            setRejectionReason('');
                          }}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
