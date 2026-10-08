import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaUser, FaTrash, FaDownload, FaChevronDown } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../../styles/DynamicQR.css';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchLeads = async () => {
    try {
      const res = await api.get('/leads');
      setLeads(res.data);
    } catch (err) {
      console.error('Failed to load leads', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const deleteLead = async (id) => {
    setOpenDropdown(null);
    if (!window.confirm('Delete this lead?')) return;
    try {
      await api.delete(`/leads/${id}`);
      setLeads(prev => prev.filter(l => l.id !== id));
      toast.success('Lead deleted');
    } catch {
      toast.error('Failed to delete lead');
    }
  };

  const toggleDropdown = (id, e) => {
    e.stopPropagation();
    if (openDropdown === id) {
      setOpenDropdown(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        right: window.innerWidth - rect.right
      });
      setOpenDropdown(id);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openDropdown && !e.target.closest('.dq-action-cell') && !e.target.closest('.dq-dropdown-menu')) {
        setOpenDropdown(null);
      }
    };
    const handleScroll = () => {
      if (openDropdown) setOpenDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [openDropdown]);

  const exportCSV = () => {
    if (filteredLeads.length === 0) return;
    const headers = ['Name', 'Phone', 'QR Code', 'QR Name', 'Device', 'Date'];
    const rows = filteredLeads.map(l => [
      l.name, l.phone || '',
      l.qr_code_id || '', l.qr_name || '', l.device_type || '',
      new Date(l.created_at).toLocaleString()
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLeads = leads.filter(l => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (l.name && l.name.toLowerCase().includes(term)) ||
           (l.phone && l.phone.toLowerCase().includes(term)) ||
           (l.qr_name && l.qr_name.toLowerCase().includes(term));
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLeads.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="dq-page-wrapper">
      <div className="dq-header">
        <div>
          <h4 className="dq-page-title">Leads</h4>
          <p className="dq-page-subtitle">{dateStr}</p>
        </div>
        <div className="dq-header-actions">
          {filteredLeads.length > 0 && (
            <button className="thm-btn outline" onClick={exportCSV}>
              <FaDownload className="me-2" /> Export CSV
            </button>
          )}
        </div>
      </div>

      <div className="row">
        <div className="col-lg-12">
          <div className="dq-controls mb-0 mb-lg-3">
            <div className="row align-items-center">
              <div className="col-md-6 col-lg-4">
                <div className="custom-frm-bx mb-3 mb-md-0">
                  <input
                    type="text"
                    placeholder="Search leads..."
                    className="form-control"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-12">
          <div className="dq-card">
            <div className="dq-table-wrapper">
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#ddd' }}>
                  <div className="spinner-border text-info" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : currentItems.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#ddd', height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
                  <FaUser style={{ fontSize: '32px' , color : "#ddd" }} />
                  <p style={{ color : "#ddd" }}>No leads found</p>
                </div>
              ) : (
                <table className="dq-table table-responsive">
                  <thead>
                    <tr>
                      <th className="dq-th">SR. No.</th>
                      <th className="dq-th">Name</th>
                      <th className="dq-th">Phone</th>
                      <th className="dq-th">QR Code</th>
                      <th className="dq-th">Device</th>
                      <th className="dq-th">Date</th>
                      <th className="dq-th">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((lead, index) => (
                      <tr key={lead.id} className="dq-tr">
                        <td className="dq-td">{indexOfFirstItem + index + 1}</td>
                        <td className="dq-td">
                          <div className="dq-qr-cell">
                            <div className="dq-qr-info">
                              <span className="dq-qr-name">{lead.name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="dq-td">{lead.phone || '—'}</td>
                        <td className="dq-td">
                          <div className="dq-qr-cell">
                            <div className="dq-qr-info">
                              <span className="dq-qr-name">{lead.qr_name || '—'}</span>
                              <span className="dq-qr-url">{lead.qr_code_id || ''}</span>
                            </div>
                          </div>
                        </td>
                        <td className="dq-td">
                          <span className={`dq-status-badge ${lead.device_type === 'mobile' ? 'active' : ''}`}>{lead.device_type || '—'}</span>
                        </td>
                        <td className="dq-td">
                          {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="dq-col-action">
                          <div className="dq-action-cell" style={{ position: 'relative' }}>
                            <button
                              className="dq-edit-btn"
                              onClick={(e) => toggleDropdown(lead.id, e)}
                            >
                              Action <FaChevronDown size={10} />
                            </button>
                            
                            {openDropdown === lead.id && createPortal(
                              <div
                                className="dq-dropdown-menu"
                                style={{
                                  position: 'absolute',
                                  top: dropdownPos.top + 5 + 'px',
                                  right: dropdownPos.right + 'px',
                                  zIndex: 1050,
                                  minWidth: '120px'
                                }}
                              >
                                <button style={{ color: '#ef4444' }} onClick={() => deleteLead(lead.id)}>
                                  <FaTrash size={14} /> Delete
                                </button>
                              </div>,
                              document.body
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {totalPages > 1 && (
              <div className="d-flex justify-content-end pagination-main-box">
                <ul className="pagination custom-pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Previous</button>
                  </li>
                  {(() => {
                    const pages = [];
                    if (totalPages <= 7) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      if (currentPage > 3) pages.push('...');
                      const start = Math.max(2, currentPage - 1);
                      const end = Math.min(totalPages - 1, currentPage + 1);
                      for (let i = start; i <= end; i++) pages.push(i);
                      if (currentPage < totalPages - 2) pages.push('...');
                      pages.push(totalPages);
                    }
                    return pages.map((page, idx) =>
                      page === '...' ? (
                        <li key={`ellipsis-${idx}`} className="page-item disabled">
                          <span className="page-link pagination-ellipsis">...</span>
                        </li>
                      ) : (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => setCurrentPage(page)}>{page}</button>
                        </li>
                      )
                    );
                  })()}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Next</button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leads;
