import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBox, FaQrcode, FaPlus, FaTrash, FaLock, FaChevronDown, FaEye, FaTimes } from 'react-icons/fa';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Loader from './Loader';
import '../../styles/DynamicQR.css';
import CreateBoxModal from '../../components/adminUI/CreateBoxModal';

const PackMode = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [boxes, setBoxes] = useState([]);
  const [selectedBox, setSelectedBox] = useState(null);
  const [showCreateBox, setShowCreateBox] = useState(false);
  const [newBoxNumber, setNewBoxNumber] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [scanInput, setScanInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const scanInputRef = useRef(null);
  const itemsPerPage = 10;

  const fetchBoxes = useCallback(async () => {
    try {
      const res = await api.get('/pack/boxes');
      setBoxes(res.data);
    } catch (err) {
      console.error('Failed to fetch boxes', err);
      toast.error('Failed to load boxes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoxes();
  }, [fetchBoxes]);

  useEffect(() => {
    if (selectedBox && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [selectedBox]);

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

  const handleCreateBox = async (e) => {
    e.preventDefault();
    if (!newBoxNumber.trim()) return;
    try {
      const res = await api.post('/pack/boxes', {
        box_number: newBoxNumber.trim(),
        product_name: newProductName.trim() || null,
      });
      setBoxes(prev => [res.data, ...prev]);
      setNewBoxNumber('');
      setNewProductName('');
      setShowCreateBox(false);
      toast.success('Box created successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create box');
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!scanInput.trim() || scanning) return;
    setScanning(true);
    try {
      const res = await api.post('/pack/scan-pack', {
        qr_serial_number: scanInput.trim(),
      });
      toast.success(`QR assigned to Box: ${res.data.box_number}`);
      setScanInput('');
      fetchBoxes();
      if (selectedBox) {
        const boxRes = await api.get(`/pack/boxes/${selectedBox.id}`);
        setSelectedBox(boxRes.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign QR');
    } finally {
      setScanning(false);
      if (scanInputRef.current) scanInputRef.current.focus();
    }
  };

  const handleSealBox = async (boxId) => {
    if (!window.confirm('Seal this box? QR codes can no longer be added.')) return;
    try {
      await api.put(`/pack/boxes/${boxId}/seal`);
      setBoxes(prev => prev.map(b => b.id === boxId ? { ...b, status: 'sealed' } : b));
      if (selectedBox?.id === boxId) {
        setSelectedBox(prev => ({ ...prev, status: 'sealed' }));
      }
      toast.success('Box sealed');
      setOpenDropdown(null);
    } catch (err) {
      toast.error('Failed to seal box');
    }
  };

  const handleDeleteBox = async (boxId) => {
    if (!window.confirm('Delete this box? QR codes will be unassigned.')) return;
    try {
      await api.delete(`/pack/boxes/${boxId}`);
      setBoxes(prev => prev.filter(b => b.id !== boxId));
      if (selectedBox?.id === boxId) setSelectedBox(null);
      toast.success('Box deleted');
      setOpenDropdown(null);
    } catch (err) {
      toast.error('Failed to delete box');
    }
  };

  const handleSelectBox = async (box) => {
    try {
      const res = await api.get(`/pack/boxes/${box.id}`);
      setSelectedBox(res.data);
    } catch (err) {
      toast.error('Failed to load box details');
    }
    setOpenDropdown(null);
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

  const filteredList = boxes.filter(box => {
    const matchSearch = box.box_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (box.product_name && box.product_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === 'All Status' ||
                        (statusFilter === 'Open' && box.status === 'open') ||
                        (statusFilter === 'Sealed' && box.status === 'sealed');
    return matchSearch && matchStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) return <Loader />;

  return (
    <div className="dq-page-wrapper">
      <div className="dq-header">
        <div className="d-flex align-items-center gap-3">
          <button className="cmp-back-btn" onClick={() => navigate('/admin/dynamic-qr')}>
            <FaArrowLeft />
          </button>
          <div>
            <h4 className="dq-page-title mt-2">Pack Mode</h4>
            <p className="dq-page-subtitle">{dateStr}</p>
          </div>
        </div>
        <div className="dq-header-actions">
          <button className="thm-btn" onClick={() => setShowCreateBox(true)}>
            <FaPlus className="me-2" /> New Box
          </button>
        </div>
      </div>

      {/* Create Box Modal */}
      <CreateBoxModal
        show={showCreateBox}
        onClose={() => setShowCreateBox(false)}
        onSubmit={handleCreateBox}
        newBoxNumber={newBoxNumber}
        setNewBoxNumber={setNewBoxNumber}
        newProductName={newProductName}
        setNewProductName={setNewProductName}
      />

      <div className="row">
        {/* Boxes Table */}
        <div className={selectedBox ? 'col-lg-5' : 'col-lg-12'}>
          <div className="dq-controls mb-0 mb-lg-3">
            <div className="row align-items-center">
              <div className="col-md-6 col-lg-4">
                <div className="custom-frm-bx mb-3 mb-md-0">
                  <input
                    type="text"
                    placeholder="Search boxes..."
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
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option>All Status</option>
                    <option>Open</option>
                    <option>Sealed</option>
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
                    <th className="dq-th">Box Number</th>
                    <th className="dq-th">Product Name</th>
                    <th className="dq-th">QR Codes</th>
                    <th className="dq-th dq-col-status">Status</th>
                    <th className="dq-th dq-col-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center" style={{ color: '#ddd', height: '250px' }}>
                        No boxes found
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((box, index) => (
                      <tr
                        key={box.id}
                        className={`dq-tr ${selectedBox?.id === box.id ? '' : ''}`}
                        style={selectedBox?.id === box.id ? { background: 'rgba(0,200,255,0.08)' } : {}}
                        onClick={() => handleSelectBox(box)}
                      >
                        <td>{indexOfFirstItem + index + 1}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="dq-qr-thumb" style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,200,255,0.1)', borderRadius: '10px' }}>
                              <FaBox size={20} style={{ color: 'var(--admin-primary)' }} />
                            </div>
                            <div className="dq-qr-info">
                              <span className="dq-qr-name">{box.box_number}</span>
                            </div>
                          </div>
                        </td>
                        <td>{box.product_name || '—'}</td>
                        <td>{box.qr_count || 0}</td>
                        <td className="dq-col-status">
                          <span className={`dq-status-badge ${box.status === 'open' ? 'active' : 'paused'}`}>
                            {box.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="dq-col-action">
                          <div className="dq-action-cell" style={{ position: 'relative' }}>
                            <button
                              className="dq-edit-btn"
                              onClick={(e) => toggleDropdown(box.id, e)}
                            >
                              Edit <FaChevronDown size={10} />
                            </button>

                            {openDropdown === box.id && createPortal(
                              <div
                                className="dq-dropdown-menu"
                                style={{
                                  position: 'absolute',
                                  top: dropdownPos.top + 5 + 'px',
                                  right: dropdownPos.right + 'px',
                                  zIndex: 1050,
                                  minWidth: '160px'
                                }}
                              >
                                <button onClick={() => { setOpenDropdown(null); handleSelectBox(box); }}>
                                  <FaEye size={16} /> View QRs
                                </button>
                                {box.status === 'open' && (
                                  <button onClick={() => { setOpenDropdown(null); handleSealBox(box.id); }}>
                                    <FaLock size={14} /> Seal Box
                                  </button>
                                )}
                                <button style={{ color: '#ef4444' }} onClick={() => { setOpenDropdown(null); handleDeleteBox(box.id); }}>
                                  <FaTrash size={14} /> Delete
                                </button>
                              </div>,
                              document.body
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
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

        {/* Scan Panel */}
        {selectedBox && (
          <div className="col-lg-7">
            <div className="dq-card mb-3">
              <div className="dq-card-header d-flex justify-content-between align-items-center">
                <h6 className="dq-card-title">
                  <FaQrcode className="me-2" /> Scan to Pack — {selectedBox.box_number}
                </h6>
                <span className={`dq-status-badge ${selectedBox.status === 'sealed' ? 'paused' : 'active'}`}>
                  {selectedBox.status.toUpperCase()}
                </span>
              </div>
              <div className="dq-card-body">
                {selectedBox.status === 'open' ? (
                  <form onSubmit={handleScan}>
                    <div className="custom-frm-bx mb-3">
                      <label className="dq-label">Scan or Type QR Serial Number</label>
                      <div className="d-flex gap-2">
                        <input
                          ref={scanInputRef}
                          type="text"
                          className="form-control"
                          placeholder="e.g. AKK0001"
                          value={scanInput}
                          onChange={(e) => setScanInput(e.target.value)}
                          disabled={scanning}
                          autoFocus
                        />
                        <button type="submit" className="thm-btn" disabled={!scanInput.trim() || scanning}>
                          {scanning ? 'Assigning...' : 'Assign'}
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-3" style={{ color: '#ddd' }}>
                    <FaLock size={20} className="mb-2" />
                    <p className="mb-0" style={{ color: '#ddd' }}>This box is sealed. No more QR codes can be added.</p>
                  </div>
                )}

                {/* QR codes in this box - table design */}
                <div className="mt-3">
                  <h6 className="dq-label">QR Codes in this box ({selectedBox.qr_codes?.length || 0})</h6>
                  {selectedBox.qr_codes?.length > 0 ? (
                    <div className="dq-table-wrapper">
                      <table className="dq-table">
                        <thead>
                          <tr>
                            <th className="dq-th">SR. No.</th>
                            <th className="dq-th">Serial No.</th>
                            <th className="dq-th">Name</th>
                            <th className="dq-th">Scans</th>
                            <th className="dq-th">Lifecycle</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBox.qr_codes.map((qr, idx) => (
                            <tr key={qr.id} className="dq-tr">
                              <td>{idx + 1}</td>
                              <td style={{ fontWeight: 600 }}>{qr.qr_serial_number}</td>
                              <td>{qr.name}</td>
                              <td>{parseInt(qr.total_scans) || 0}</td>
                              <td>
                                <span className={`dq-status-badge ${qr.lifecycle_status === 'sold' ? 'active' : qr.lifecycle_status === 'packed' ? 'paused' : qr.lifecycle_status === 'printed' ? '' : ''}`}
                                  style={qr.lifecycle_status === 'printed' ? { backgroundColor: '#f59e0b', color: '#fff' } : qr.lifecycle_status === 'generated' ? { backgroundColor: '#6b7280', color: '#fff' } : {}}>
                                  {qr.lifecycle_status?.toUpperCase() || 'GENERATED'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-3" style={{ color: '#8892a4' }}>
                      <p className="mb-0">No QR codes in this box yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PackMode;
