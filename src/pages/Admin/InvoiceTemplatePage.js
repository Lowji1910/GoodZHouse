import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api'; // Assuming api service exists

const InvoiceTemplatePage = () => {
  const { notify } = useToast();
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const data = await api.getInvoiceTemplate();
        setHtml(data.html);
      } catch (error) {
        notify('Failed to fetch template', 'danger');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [notify]);

  const handleSave = async () => {
    try {
      await api.updateInvoiceTemplate({ html });
      notify('Template saved successfully!', 'success');
    } catch (error) {
      notify('Failed to save template', 'danger');
    }
  };

  if (loading) {
    return <div>Loading template...</div>;
  }

  return (
    <div>
      <h2>Edit Invoice Template</h2>
      <p>Use placeholders like {"{{orderNumber}}"}, {"{{customerName}}"}, etc.</p>
      <textarea
        className="form-control"
        rows="20"
        value={html}
        onChange={(e) => setHtml(e.target.value)}
      ></textarea>
      <button className="btn btn-primary mt-3" onClick={handleSave}>
        Save Template
      </button>
    </div>
  );
};

// You'll need to add these functions to your api service
// api.getInvoiceTemplate = () => apiGet('/api/invoices/template');
// api.updateInvoiceTemplate = (data) => apiPut('/api/invoices/template', data);

export default InvoiceTemplatePage;
