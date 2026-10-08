import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FaDownload, FaEye, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaWifi, FaAddressCard, FaLink, FaEnvelope, FaPhone, FaQrcode, FaChevronDown } from 'react-icons/fa';
import { QRCodeCanvas } from 'qrcode.react';
import QRDownloadModal from '../../components/adminUI/QRDownloadModal';
import ViewQRModal from '../../components/adminUI/ViewQRModal';
import EditQRModal from '../../components/adminUI/EditQRModal';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Loader from './Loader';
import '../../styles/DynamicQR.css';
import '../../styles/StaticQR.css';

const StaticQRCodes = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedQR, setSelectedQR] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [qrList, setQrList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchQRs = async () => {
    try {
      const res = await api.get('/static-qr');
      setQrList(res.data);
    } catch (err) {
      toast.error('Failed to load static QR codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQRs();
  }, []);

  const filteredList = qrList.filter(qr => {
    const matchesSearch = !searchTerm || qr.name.toLowerCase().includes(searchTerm.toLowerCase()) || qr.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All Types' || qr.type === typeFilter.toLowerCase();
    return matchesSearch && matchesType;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

  const toggleActive = async (id) => {
    try {
      const res = await api.put(`/static-qr/${id}/toggle`);
      setQrList(prev => prev.map(qr => qr.id === id ? { ...qr, status: res.data.status } : qr));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this QR code?')) return;
    try {
      await api.delete(`/static-qr/${id}`);
      setQrList(prev => prev.filter(qr => qr.id !== id));
      toast.success('QR code deleted');
    } catch {
      toast.error('Failed to delete QR code');
    }
    setOpenDropdown(null);
  };

  const handleView = (qr) => {
    setSelectedQR(qr);
    setShowViewModal(true);
    setOpenDropdown(null);
  };

  const handleDownload = (qr) => {
    setSelectedQR(qr);
    setShowDownloadModal(true);
    setOpenDropdown(null);
  };

  const handleEdit = (qr) => {
    setSelectedQR(qr);
    setShowEditModal(true);
    setOpenDropdown(null);
  };

  const handleSaveEdit = (updatedQR) => {
    setQrList(prev => prev.map(qr => qr.id === updatedQR.id ? updatedQR : qr));
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

  const getTypeIcon = (type) => {
    switch (type) {
      case 'wifi': return <FaWifi />;
      case 'vcard': return <FaAddressCard />;
      case 'url': return <FaLink />;
      case 'email': return <FaEnvelope />;
      case 'phone': return <FaPhone />;
      default: return <FaQrcode />;
    }
  };

  const getQrUrl = (qr) => {
    if (!qr) return 'akksys.io/s/static';
    return qr.data?.url || qr.data?.wifi_network || qr.data?.email || qr.data?.phone || 'akksys.io/s/static';
  };

  const getDetails = (qr) => {
    if (!qr || !qr.data) return '';
    switch (qr.type) {
      case 'wifi': return `Network: ${qr.data.wifi_network || ''}`;
      case 'vcard': return qr.data.vcard_name || '';
      case 'url': return qr.data.url || '';
      case 'email': return qr.data.email || '';
      case 'phone': return qr.data.phone || '';
      default: return '';
    }
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) return <Loader />;

  return (
    <>
      <div className="dq-page-wrapper">
        <div className="dq-header">
          <div>
            <h4 className="dq-page-title">Static QR Codes</h4>
            <p className="dq-page-subtitle">{dateStr}</p>
          </div>
          <div className="dq-header-actions">
            <button
              className="thm-btn"
              onClick={() => navigate('/admin/static-qr/create')}
            >
              + Create New Static QR
            </button>
          </div>
        </div>

        <div className="dq-controls mb-0 mb-lg-3">
          <div className="row align-items-center">
            <div className="col-md-6 col-lg-4">
              <div className="custom-frm-bx mb-3 mb-md-0">
                <input
                  type="text"
                  placeholder="Search static QR codes..."
                  className="form-control"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3 col-lg-2">
              <div className="custom-frm-bx mb-3 mb-md-0">
                <select
                  className="form-select"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option>All Types</option>
                  <option>WiFi</option>
                  <option>vCard</option>
                  <option>URL</option>
                  <option>Email</option>
                  <option>Phone</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="dq-card">
          <div className="dq-table-wrapper">
            <table className="dq-table table-responsive">
              <thead>
                <tr>
                  <th className="dq-th">SR. No.</th>
                  <th className="dq-th">QR Code</th>
                  <th className="dq-th dq-col-type">Type</th>
                  <th className="dq-th dq-col-date">Created Date</th>
                  <th className="dq-th dq-col-status">Status</th>
                  <th className="dq-th dq-col-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center" style={{ color: '#ddd', height : "250px" }}>
                      No static QR codes found.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((qr, index) => {
                    const qrUrl = getQrUrl(qr);
                    const details = getDetails(qr);
                    const isActive = qr.status === 'active';
                    return (
                      <tr key={qr.id} className="dq-tr">
                        <td>{indexOfFirstItem + index + 1}</td>
                        <td>
                          <div className="dq-qr-cell">
                            <div className="dq-qr-thumb">
                              <QRCodeCanvas
                                value={`https://${qrUrl}`}
                                size={44}
                                level="M"
                                bgColor="#ffffff"
                                fgColor="#0f1629"
                              />
                              <div className="dq-qr-logo">
                                <div className="dq-qr-logo-inner">AK</div>
                              </div>
                            </div>
                            <div className="dq-qr-info">
                              <span className="dq-qr-name">{qr.name}</span>
                              <span className="dq-qr-url">{details}</span>
                            </div>
                          </div>
                        </td>
                        <td className="dq-col-type">
                          <span className={`sq-type-badge sq-type-${qr.type}`}>
                            {getTypeIcon(qr.type)} {qr.type}
                          </span>
                        </td>
                        <td className="dq-col-date">
                          {new Date(qr.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="dq-col-status">
                          <span className={`dq-status-badge ${isActive ? 'active' : 'paused'}`}>
                            {isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="dq-col-action">
                          <div className="dq-action-cell">
                            <button
                              className="dq-edit-btn"
                              onClick={(e) => toggleDropdown(qr.id, e)}
                            >
                              Edit <FaChevronDown size={10} />
                            </button>
                            {openDropdown === qr.id && createPortal(
                              <div
                                className="dq-dropdown-menu"
                                style={{
                                  position: 'absolute',
                                  top: dropdownPos.top + 5 + 'px',
                                  right: dropdownPos.right + 'px',
                                  zIndex: 1050,
                                  minWidth: '170px'
                                }}
                              >
                                <button onClick={() => { setOpenDropdown(null); handleView(qr); }}>
                                  <FaEye size={16} /> View Details
                                </button>
                                <button onClick={() => { setOpenDropdown(null); handleDownload(qr); }}>
                                  <FaDownload size={16} /> Download QR
                                </button>
                                <button onClick={() => { setOpenDropdown(null); handleEdit(qr); }}>
                                  <FaEdit size={16} /> Edit QR
                                </button>
                                <button onClick={() => { toggleActive(qr.id); setOpenDropdown(null); }}>
                                  {qr.status === 'active'
                                    ? <><FaToggleOff size={12} /> Deactivate</>
                                    : <><FaToggleOn size={16} /> Activate</>}
                                </button>
                                <button className="sq-dropdown-danger" onClick={() => { setOpenDropdown(null); handleDelete(qr.id); }}>
                                  <FaTrash size={14} /> Delete
                                </button>
                              </div>,
                              document.body
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
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

      <QRDownloadModal
        show={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        qrName={selectedQR?.name}
        qrUrl={getQrUrl(selectedQR)}
      />

      <ViewQRModal
        show={showViewModal}
        onClose={() => setShowViewModal(false)}
        qr={selectedQR ? { ...selectedQR, url: getQrUrl(selectedQR), details: getDetails(selectedQR), typeLabel: selectedQR.type, active: selectedQR.status === 'active', createdDate: new Date(selectedQR.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) } : null}
      />

      <EditQRModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        qr={selectedQR ? { ...selectedQR, url: getQrUrl(selectedQR), details: getDetails(selectedQR), typeLabel: selectedQR.type, active: selectedQR.status === 'active' } : null}
        onSave={handleSaveEdit}
      />
    </>
  );
};

export default StaticQRCodes;
