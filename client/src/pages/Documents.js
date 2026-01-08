import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-toastify';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [kycStatus, setKycStatus] = useState('pending');
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('aadhaar');
  const [documentNumber, setDocumentNumber] = useState('');

  useEffect(() => {
    fetchDocuments();
    fetchKYCStatus();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/kyc/documents');
      setDocuments(res.data.data);
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error('Failed to load documents');
    }
  };

  const fetchKYCStatus = async () => {
    try {
      const res = await api.get('/kyc/status');
      setKycStatus(res.data.data.kyc_status);
    } catch (error) {
      console.error('Failed to load KYC status');
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);
    formData.append('documentNumber', documentNumber);

    try {
      await api.post('/kyc/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Document uploaded successfully');
      setFile(null);
      setDocumentNumber('');
      fetchDocuments();
    } catch (error) {
      console.error('Document upload failed:', error);
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitKYC = async () => {
    if (documents.length === 0) {
      toast.error('Please upload at least one document');
      return;
    }

    try {
      await api.post('/kyc/submit');
      toast.success('KYC submitted for review');
      fetchKYCStatus();
    } catch (error) {
      console.error('KYC submission failed:', error);
      toast.error(error.response?.data?.message || 'Submission failed');
    }
  };

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}>Documents & KYC</h1>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>KYC Status</h2>
            <span className={`badge badge-${kycStatus.replace('_', '-')}`}>
              {kycStatus.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          {kycStatus === 'pending' && documents.length > 0 && (
            <button onClick={handleSubmitKYC} className="btn btn-success">
              Submit for Review
            </button>
          )}
        </div>
      </div>

      {kycStatus === 'pending' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Upload Document</h2>
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label htmlFor="documentType" className="form-label">Document Type</label>
              <select 
                id="documentType"
                className="form-input" 
                value={documentType} 
                onChange={(e) => setDocumentType(e.target.value)}
              >
                <option value="aadhaar">Aadhaar Card</option>
                <option value="pan">PAN Card</option>
                <option value="passport">Passport</option>
                <option value="driving_license">Driving License</option>
                <option value="voter_id">Voter ID</option>
                <option value="utility_bill">Utility Bill</option>
                <option value="bank_statement">Bank Statement</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="documentNumber" className="form-label">Document Number (Optional)</label>
              <input
                id="documentNumber"
                type="text"
                className="form-input"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="Enter document number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="documentFile" className="form-label">Select File (Max 5MB)</label>
              <input
                id="documentFile"
                type="file"
                className="form-input"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Uploaded Documents ({documents.length})</h2>
        {documents.length === 0 ? (
          <p style={{ color: '#718096' }}>No documents uploaded yet</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {documents.map((doc) => (
              <div key={doc.id} style={{
                padding: '1rem',
                background: '#f7fafc',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {doc.document_type.replace('_', ' ').toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                    {doc.file_name} • {(doc.file_size / 1024).toFixed(2)} KB
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                    Uploaded: {new Date(doc.uploaded_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Documents;
