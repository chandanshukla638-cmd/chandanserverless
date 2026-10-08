import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaDownload, FaEye, FaToggleOn, FaToggleOff, FaQrcode, FaChevronDown, FaTrash, FaPen, FaArrowLeft, FaFolderOpen, FaEdit } from 'react-icons/fa';
import { QRCodeCanvas } from 'qrcode.react';
import QRDownloadModal from '../../components/adminUI/QRDownloadModal';
import CategoryDropdown from '../../components/CategoryDropdown';
import CreateCategoryModal from '../../components/CreateCategoryModal';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Loader from './Loader';
import '../../styles/DynamicQR.css';

const DynamicQRCodes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedQR, setSelectedQR] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [lifecycleFilter, setLifecycleFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [categories, setCategories] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editFolderItem, setEditFolderItem] = useState(null);
  const [qrList, setQrList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [folderCurrentPage, setFolderCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchQRs = useCallback(async () => {
    try {
      const res = await api.get('/qr');
      const mapped = res.data.map(qr => ({
        id: qr.id,
        qrId: qr.qr_id,
        qrSerialNumber: qr.qr_serial_number,
        name: qr.name,
        categoryName: qr.category_name || null,
        categoryId: qr.category_id || null,
        url: `${window.location.host}/r/${qr.qr_id}`,
        scans: parseInt(qr.total_scans) || 0,
        unique: parseInt(qr.unique_scans) || 0,
        ctaClicks: parseInt(qr.cta_clicks) || 0,
        ctr: qr.total_scans > 0 ? ((parseInt(qr.cta_clicks) / parseInt(qr.total_scans)) * 100).toFixed(1) : '0.0',
        ctaDestination: qr.cta_destination || '—',
        status: qr.status,
        active: qr.status === 'active',
        logoUrl: qr.logo_url || null,
        formEnabled: qr.form_enabled || false,
        campaignId: qr.campaign_id || null,
        videoUrl: qr.current_video_url || null,
        videoType: qr.video_type || null,
        ctaText: qr.cta_text || null,
        lifecycleStatus: qr.lifecycle_status || 'generated',
        boxNumber: qr.box_number || null,
      }));
      setQrList(mapped);
    } catch (err) {
      console.error('Failed to fetch QR codes', err);
      toast.error('Failed to load QR codes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQRs();
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        const fetchedCategories = res.data.flat || [];
        setCategories(fetchedCategories);
        if (location.state?.folderId) {
          const targetFolder = fetchedCategories.find(c => String(c.id) === String(location.state.folderId));
          if (targetFolder) {
            setCurrentFolder(targetFolder);
          }
        }
      } catch { /* empty */ }
    };
    fetchCategories();
  }, [fetchQRs, location.state?.folderId]);

  const toggleActive = async (id) => {
    try {
      await api.put(`/qr/${id}/toggle`);
      setQrList(prev => prev.map(qr =>
        qr.id === id ? { ...qr, active: !qr.active, status: qr.active ? 'paused' : 'active' } : qr
      ));
      toast.success('Status updated');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this QR code?')) return;
    try {
      await api.delete(`/qr/${id}`);
      setQrList(prev => prev.filter(qr => qr.id !== id));
      toast.success('QR code deleted successfully');
      setOpenDropdown(null);
    } catch (err) {
      toast.error('Failed to delete QR code');
    }
  };

  const handleDeleteFolder = async (id) => {
    if (!window.confirm('Are you sure you want to delete this folder? QR codes in it will become uncategorized.')) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Folder deleted successfully');
      setOpenDropdown(null);
    } catch (err) {
      toast.error('Failed to delete folder');
    }
  };

  const handleDownload = (qr) => {
    setSelectedQR(qr);
    setShowDownloadModal(true);
    setOpenDropdown(null);
  };

  const toggleDropdown = (id, e) => {
    e.stopPropagation();
    if (openDropdown === id) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(id);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openDropdown && !e.target.closest('.dq-action-cell') && !e.target.closest('.dq-dropdown-menu')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const filteredList = qrList.filter(qr => {
    const matchSearch = qr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qr.qrId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (qr.qrSerialNumber && qr.qrSerialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (qr.boxNumber && qr.boxNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === 'All Status' ||
      (statusFilter === 'Active' && qr.active) ||
      (statusFilter === 'Paused' && !qr.active);
    const matchLifecycle = lifecycleFilter === 'All' ||
      qr.lifecycleStatus === lifecycleFilter.toLowerCase();
    const matchCategory = currentFolder
      ? String(qr.categoryId) === String(currentFolder.id)
      : (!categoryFilter || String(qr.categoryId) === String(categoryFilter));
    return matchSearch && matchStatus && matchLifecycle && matchCategory;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  const indexOfLastFolder = folderCurrentPage * itemsPerPage;
  const indexOfFirstFolder = indexOfLastFolder - itemsPerPage;
  const currentFolders = categories.slice(indexOfFirstFolder, indexOfLastFolder);
  const totalFolderPages = Math.ceil(categories.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <div className="dq-page-wrapper">
        <div className="dq-header">
          <div className="d-flex align-items-center gap-3">
            {currentFolder && (
              <button className="cmp-back-btn" onClick={() => setCurrentFolder(null)}>
                <FaArrowLeft />
              </button>
            )}
            <div>
              <h4 className="dq-page-title mt-2">{currentFolder ? currentFolder.name : 'Dynamic QR Codes'}</h4>
              <p className="dq-page-subtitle">{currentFolder ? 'Manage QR codes in this folder' : 'Manage your folders'}</p>
            </div>
          </div>
          <div className="dq-header-actions">
            {!currentFolder && (
              <button
                className="thm-btn"
                onClick={() => { setEditFolderItem(null); setShowCategoryModal(true); }}
              >
                + New Folder
              </button>
            )}
            {currentFolder && (
              <>
                <button
                  className="thm-btn outline"
                  onClick={() => navigate('/admin/dynamic-qr/bulk', { state: { categoryId: currentFolder.id } })}
                >
                  <FaQrcode className="me-2" /> Bulk Generate
                </button>
                <button
                  className="thm-btn"
                  style={{ marginLeft: '10px' }}
                  onClick={() => navigate('/admin/dynamic-qr/create', { state: { categoryId: currentFolder.id } })}
                >
                  + New QR Code
                </button>
              </>
            )}
          </div>
        </div>


        <div className="row">
          {currentFolder === null ? (
            <div className="col-lg-12">
              <div className="dq-card">
                <div className="dq-table-wrapper">
                  <table className="dq-table table-responsive">
                    <thead>
                      <tr>
                        <th className="dq-th">Sr. No.</th>
                        <th className="dq-th">Folder Name</th>
                        <th className="dq-th">QR Codes</th>
                        <th className="dq-th dq-col-action text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="4" className="text-center" style={{ height: "150px", verticalAlign: "middle" }}>
                            <div className="spinner-border text-info" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <p style={{ color: '#ddd', marginTop: '10px' }}>Loading folders...</p>
                          </td>
                        </tr>
                      ) : currentFolders.length === 0 ? (
                        <tr><td colSpan="4" className="text-center" style={{ color: '#ddd', height: "150px" }}>No folders found. Create one to get started.</td></tr>
                      ) : (
                        currentFolders.map((cat, index) => (
                          <tr key={cat.id} className="dq-tr" onClick={() => setCurrentFolder(cat)} style={{ cursor: 'pointer' }}>
                            <td>{indexOfFirstFolder + index + 1}</td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="dq-qr-thumb" style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,200,255,0.1)', borderRadius: '10px' }}>
                                  <FaFolderOpen size={20} style={{ color: 'var(--admin-primary)' }} />
                                </div>
                                <span className="dq-qr-name">{cat.name}</span>
                              </div>
                            </td>
                            <td>{cat.qr_count || 0}</td>
                            <td className="dq-col-action text-end">
                              <div className="dq-action-cell" style={{ position: 'relative', display: 'inline-block' }}>
                                <button
                                  className="dq-edit-btn"
                                  onClick={(e) => toggleDropdown(`folder_${cat.id}`, e)}
                                >
                                  Edit <FaChevronDown size={10} />
                                </button>
                                {openDropdown === `folder_${cat.id}` && (
                                  <div
                                    className="dq-dropdown-menu"
                                    style={{
                                      position: 'absolute',
                                      top: 'calc(100% + 5px)',
                                      right: 0,
                                      zIndex: 1050,
                                      minWidth: '120px'
                                    }}
                                  >
                                    <button onClick={(e) => { e.stopPropagation(); setOpenDropdown(null); setCurrentFolder(cat); }}>
                                      <FaFolderOpen size={14} /> Open
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setOpenDropdown(null); setEditFolderItem(cat); setShowCategoryModal(true); }}>
                                      <FaEdit size={14} /> Edit
                                    </button>
                                    <button style={{ color: '#ef4444' }} onClick={(e) => { e.stopPropagation(); handleDeleteFolder(cat.id); }}>
                                      <FaTrash size={14} /> Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {totalFolderPages > 1 && (
                  <div className="d-flex justify-content-end pagination-main-box" style={{ padding: '15px' }}>
                    <ul className="pagination custom-pagination mb-0">
                      <li className={`page-item ${folderCurrentPage === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setFolderCurrentPage(p => Math.max(1, p - 1))}>Previous</button>
                      </li>
                      {(() => {
                        const pages = [];
                        if (totalFolderPages <= 7) {
                          for (let i = 1; i <= totalFolderPages; i++) pages.push(i);
                        } else {
                          pages.push(1);
                          if (folderCurrentPage > 3) pages.push('...');
                          const start = Math.max(2, folderCurrentPage - 1);
                          const end = Math.min(totalFolderPages - 1, folderCurrentPage + 1);
                          for (let i = start; i <= end; i++) pages.push(i);
                          if (folderCurrentPage < totalFolderPages - 2) pages.push('...');
                          pages.push(totalFolderPages);
                        }
                        return pages.map((page, idx) =>
                          page === '...' ? (
                            <li key={`ellipsis-${idx}`} className="page-item disabled">
                              <span className="page-link pagination-ellipsis">...</span>
                            </li>
                          ) : (
                            <li key={page} className={`page-item ${folderCurrentPage === page ? 'active' : ''}`}>
                              <button className="page-link" onClick={() => setFolderCurrentPage(page)}>{page}</button>
                            </li>
                          )
                        );
                      })()}
                      <li className={`page-item ${folderCurrentPage === totalFolderPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setFolderCurrentPage(p => Math.min(totalFolderPages, p + 1))}>Next</button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="col-lg-12">
                <div className="dq-controls mb-0 mb-lg-3 mt-3">
                  <div className="row align-items-center">
                    <div className="col-md-6 col-lg-4">
                      <div className="custom-frm-bx mb-3 mb-md-0">
                        <input
                          type="text"
                          placeholder="Search QR codes..."
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
                          <option>Active</option>
                          <option>Paused</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-3 col-lg-2">
                      <div className="custom-frm-bx mb-3 mb-md-0">
                        <select
                          className="form-select"
                          value={lifecycleFilter}
                          onChange={(e) => setLifecycleFilter(e.target.value)}
                        >
                          <option>All</option>
                          <option>Generated</option>
                          <option>Printed</option>
                          <option>Packed</option>
                          <option>Sold</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-3 col-lg-2">
                      <div className="custom-frm-bx mb-3 mb-md-0">
                        <CategoryDropdown
                          value={categoryFilter}
                          onChange={setCategoryFilter}
                          defaultOptionText="All Categories"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-12">
                <div className="dq-card">
                  <div className="dq-table-wrapper" >
                    <table className="dq-table table-responsive">
                      <thead>
                        <tr>
                          <th className="dq-th">SR. No.</th>
                          <th className="dq-th">QR Code</th>
                          <th className="dq-th">Category</th>
                          <th className="dq-th">QR Serial No.</th>
                          <th className="dq-th dq-col-scans">Scans</th>
                          <th className="dq-th dq-col-unique">Unique</th>
                          <th className="dq-th dq-col-clicks">CTA Clicks</th>
                          <th className="dq-th dq-col-ctr">CTR</th>
                          <th className="dq-th dq-col-dest">CTA Destination</th>
                          <th className="dq-th">Lifecycle</th>
                          <th className="dq-th">Box</th>
                          <th className="dq-th dq-col-status">Status</th>
                          <th className="dq-th dq-col-action">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="13" className="text-center" style={{ height: "250px", verticalAlign: "middle" }}>
                              <div className="spinner-border text-info" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              <p style={{ color: '#ddd', marginTop: '10px' }}>Loading QR codes...</p>
                            </td>
                          </tr>
                        ) : currentItems.length === 0 ? (
                          <tr>
                            <td colSpan="13" className="text-center" style={{ color: '#ddd', height: "250px" }}>
                              No QR codes found
                            </td>
                          </tr>
                        ) : (
                          currentItems.map((qr, index) => (
                            <tr key={qr.id} className="dq-tr">
                              <td>{indexOfFirstItem + index + 1}</td>

                              <td>
                                <div className="dq-qr-cell">
                                  <div className="dq-qr-thumb">
                                    <QRCodeCanvas
                                      value={`https://${qr.url}`}
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
                                    <a
                                      href={`https://${qr.url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="dq-qr-url"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {qr.url}
                                    </a>
                                  </div>
                                </div>
                              </td>
                              <td >
                                {qr.categoryName || <span style={{ color: '#ddd' }}>—</span>}
                              </td>
                              <td>{qr.qrSerialNumber || '—'}</td>
                              <td className="dq-col-scans">{qr.scans.toLocaleString()}</td>
                              <td className="dq-col-unique">{qr.unique.toLocaleString()}</td>
                              <td className="dq-col-clicks">{qr.ctaClicks.toLocaleString()}</td>
                              <td className="dq-ctr dq-col-ctr">{qr.ctr}%</td>
                              <td className="dq-cta-dest dq-col-dest">{qr.ctaDestination}</td>
                              <td>
                                <span className={`dq-status-badge ${qr.lifecycleStatus === 'sold' ? 'active' : qr.lifecycleStatus === 'packed' ? 'paused' : qr.lifecycleStatus === 'printed' ? '' : ''}`}
                                  style={qr.lifecycleStatus === 'printed' ? { backgroundColor: '#f59e0b', color: '#fff' } : qr.lifecycleStatus === 'generated' ? { backgroundColor: '#6b7280', color: '#fff' } : {}}>
                                  {qr.lifecycleStatus?.toUpperCase() || 'GENERATED'}
                                </span>
                              </td>
                              <td>{qr.boxNumber || '—'}</td>
                              <td className="dq-col-status">
                                <span className={`dq-status-badge ${qr.active ? 'active' : 'paused'}`}>
                                  {qr.active ? 'ACTIVE' : 'PAUSED'}
                                </span>
                              </td>
                              <td className="dq-col-action">
                                <div className="dq-action-cell" style={{ position: 'relative' }}>
                                  <button
                                    className="dq-edit-btn"
                                    onClick={(e) => toggleDropdown(qr.id, e)}
                                  >
                                    Edit <FaChevronDown size={10} />
                                  </button>

                                  {openDropdown === qr.id && (
                                    <div
                                      className="dq-dropdown-menu"
                                      style={{
                                        position: 'absolute',
                                        ...(currentItems.length > 2 && index >= currentItems.length - 2 ? { bottom: 'calc(100% + 5px)' } : { top: 'calc(100% + 5px)' }),
                                        right: 0,
                                        zIndex: 1050,
                                        minWidth: '160px'
                                      }}
                                    >
                                      <button onClick={() => navigate(`/admin/dynamic-qr/${qr.qrId}`)}>
                                        <FaEye size={16} /> View Details
                                      </button>
                                      <button onClick={() => {
                                        setOpenDropdown(null);
                                        navigate('/admin/dynamic-qr/create', { state: { editQR: qr } });
                                      }}>
                                        <FaPen size={14} /> Edit QR
                                      </button>
                                      <button onClick={() => handleDownload(qr)}>
                                        <FaDownload size={16} /> Download QR
                                      </button>
                                      <button onClick={() => { toggleActive(qr.id); setOpenDropdown(null); }}>
                                        {qr.active
                                          ? <><FaToggleOff size={12} /> Deactivate</>
                                          : <><FaToggleOn size={16} /> Activate</>}
                                      </button>
                                      <button style={{ color: '#ef4444' }} onClick={() => handleDelete(qr.id)}>
                                        <FaTrash size={14} /> Delete
                                      </button>
                                    </div>
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
            </>
          )}
        </div>




      </div>

      <QRDownloadModal
        show={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        qrName={selectedQR?.name}
        qrUrl={selectedQR?.url}
        logoUrl={selectedQR?.logoUrl}
        qrSerialNumber={selectedQR?.qrSerialNumber}
      />
      <CreateCategoryModal
        show={showCategoryModal}
        editItem={editFolderItem}
        onClose={() => setShowCategoryModal(false)}
        onSuccess={(newCategory) => {
          setShowCategoryModal(false);
          api.get('/categories').then(res => setCategories(res.data.flat || []));
          if (newCategory && !editFolderItem) {
            setCurrentFolder(newCategory);
          }
        }}
      />
    </>
  );
};

export default DynamicQRCodes;
