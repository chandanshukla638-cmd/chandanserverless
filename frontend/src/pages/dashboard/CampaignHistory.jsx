import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHistory, FaEye, FaUndo, FaCalendarAlt, FaSearch, FaPlus, FaChevronDown, FaPlay, FaLink, FaChartLine, FaCheck, FaPause, FaArrowUp } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../../styles/CampaignHistory.css';
import { BsPencil, BsTrash } from 'react-icons/bs';

const CampaignHistory = () => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, paused: 0, change: { total: 0, active: 0, completed: 0, paused: 0 } });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await api.get('/campaign');
      setCampaigns(res.data);
    } catch {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/campaign/stats');
      setStats({ ...res.data.current, change: res.data.change });
    } catch {}
  }, []);

  useEffect(() => {
    fetchCampaigns();
    fetchStats();
  }, [fetchCampaigns, fetchStats]);

  const filteredCampaigns = campaigns.filter(c => {
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.qr_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCampaigns.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const toggleDropdown = (id) => {
    setOpenDropdown(prev => prev === id ? null : id);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openDropdown && !e.target.closest('.ch-action-cell') && !e.target.closest('.ch-dropdown-menu')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="ch-page-wrapper">
      {/* Header — dq-header */}
      <div className="ch-header">
        <div>
          <h4 className="ch-page-title">Campaign History</h4>
          <p className="ch-page-subtitle">{dateStr}</p>
        </div>
        <div className="ch-header-actions">
          <button 
            className="thm-btn"
            onClick={() => navigate('/admin/campaign/create')}
          >
            <FaPlus /> Create Campaign
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="row ">
        <div className="col-md-6 col-sm-12 col-lg-3 mb-3">
          <div className="ch-stat-card">
            <div className="ch-stat-header">
              <span className="ch-stat-label">TOTAL</span>
              <div className="ch-stat-icon purple"><FaChartLine /></div>
            </div>
            <p className="ch-stat-value">{stats.total}</p>
            <div className="ch-stat-footer">
              <span className={`ch-stat-change ${stats.change.total >= 0 ? 'up' : 'down'}`}>
                <FaArrowUp style={stats.change.total < 0 ? { transform: 'rotate(90deg)' } : {}} /> {Math.abs(stats.change.total)}%
              </span>
              <span className="ch-stat-period">vs last month</span>
            </div>
            <div className="ch-stat-bar purple"></div>
          </div>
        </div>
        <div className="col-md-6 col-sm-12 col-lg-3 mb-3">
          <div className="ch-stat-card">
            <div className="ch-stat-header">
              <span className="ch-stat-label">ACTIVE</span>
              <div className="ch-stat-icon green"><FaCheck /></div>
            </div>
            <p className="ch-stat-value">{stats.active}</p>
            <div className="ch-stat-footer">
              <span className={`ch-stat-change ${stats.change.active >= 0 ? 'up' : 'down'}`}>
                <FaArrowUp style={stats.change.active < 0 ? { transform: 'rotate(90deg)' } : {}} /> {Math.abs(stats.change.active)}%
              </span>
              <span className="ch-stat-period">vs last month</span>
            </div>
            <div className="ch-stat-bar green"></div>
          </div>
        </div>
        <div className="col-md-6 col-sm-12 col-lg-3 mb-3">
          <div className="ch-stat-card">
            <div className="ch-stat-header">
              <span className="ch-stat-label">COMPLETED</span>
              <div className="ch-stat-icon blue"><FaHistory /></div>
            </div>
            <p className="ch-stat-value">{stats.completed}</p>
            <div className="ch-stat-footer">
              <span className={`ch-stat-change ${stats.change.completed >= 0 ? 'up' : 'down'}`}>
                <FaArrowUp style={stats.change.completed < 0 ? { transform: 'rotate(90deg)' } : {}} /> {Math.abs(stats.change.completed)}%
              </span>
              <span className="ch-stat-period">vs last month</span>
            </div>
            <div className="ch-stat-bar blue"></div>
          </div>
        </div>
        <div className="col-md-6 col-sm-12 col-lg-3 mb-3">
          <div className="ch-stat-card">
            <div className="ch-stat-header">
              <span className="ch-stat-label">PAUSED</span>
              <div className="ch-stat-icon red"><FaPause /></div>
            </div>
            <p className="ch-stat-value">{stats.paused}</p>
            <div className="ch-stat-footer">
              <span className={`ch-stat-change ${stats.change.paused >= 0 ? 'up' : 'down'}`}>
                <FaArrowUp style={stats.change.paused < 0 ? { transform: 'rotate(90deg)' } : {}} /> {Math.abs(stats.change.paused)}
              </span>
              <span className="ch-stat-period">vs last month</span>
            </div>
            <div className="ch-stat-bar red"></div>
          </div>
        </div>
      </div>

      <div className="row ">
        <div className="col-lg-12  ">
   <div className="ch-controls an-card ">
        <div className="ch-search-box custom-frm-bx mb-0">
          <FaSearch className="ch-search-icon" />
          <input 
            type="text" 
            className="ch-search-input form-control  ps-5"
            placeholder="Search campaigns or QR codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="ch-filter-tabs">
          <button 
            className={`ch-filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All
          </button>
          <button 
            className={`ch-filter-tab ${filterStatus === 'active' ? 'active' : ''}`}
            onClick={() => setFilterStatus('active')}
          >
            Active
          </button>
          <button 
            className={`ch-filter-tab ${filterStatus === 'completed' ? 'active' : ''}`}
            onClick={() => setFilterStatus('completed')}
          >
            Completed
          </button>
          <button 
            className={`ch-filter-tab ${filterStatus === 'paused' ? 'active' : ''}`}
            onClick={() => setFilterStatus('paused')}
          >
            Paused
          </button>
        </div>
      </div>
        </div>

      </div>

      <div className="row mb-3">
        <div className="col-lg-12  ">
      <div className="ch-table-card">
        <div className="ch-table-wrapper">
          <table className="ch-table">
            <thead>
              <tr>
                <th className="ch-th">SR. No.</th>
                <th className="ch-th">Campaign</th>
                <th className="ch-th">QR Code</th>
                <th className="ch-th">Duration</th>
                <th className="ch-th">Video</th>
                <th className="ch-th">CTA</th>
                <th className="ch-th">Scans</th>
                <th className="ch-th">CTA Clicks</th>
                <th className="ch-th">Versions</th>
                <th className="ch-th">Status</th>
                <th className="ch-th">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((campaign, index) => (
                <tr key={campaign.id} className="ch-tr">
                  <td className="ch-td">{indexOfFirstItem + index + 1}</td>
                  <td className="ch-td">
                    <span className="ch-td-title">{campaign.name}</span>
                    <span className="ch-td-subtitle">ID: {campaign.id}</span>
                  </td>
                  <td className="ch-td">
                    <span className="ch-td-title">{campaign.qr_name || '—'}</span>
                    <span className="ch-td-subtitle">{campaign.qr_id}</span>
                  </td>
                  <td className="ch-td">
                    <div className="ch-td-meta">
                      <FaCalendarAlt className="ch-td-meta-icon" />
                      <div>
                        <span className="ch-td-meta-text">{(campaign.start_date || campaign.created_at) ? new Date(campaign.start_date || campaign.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                        <span className="ch-td-meta-sub">{campaign.end_date ? new Date(campaign.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Present'}</span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="ch-td">
                    <div className="ch-td-meta">
                      <FaPlay className="ch-td-meta-icon" size={10} />
                      <span className="ch-td-meta-text">{campaign.video_type || '—'}</span>
                    </div>
                  </td>
                  <td className="ch-td">
                    <div className="ch-td-meta">
                      <FaLink className="ch-td-meta-icon" size={10} />
                      <span className="ch-td-meta-text">{campaign.cta_text || '—'}</span>
                    </div>
                  </td>

                  <td className="ch-td ch-td-number">{parseInt(campaign.total_scans || 0).toLocaleString()}</td>
                  <td className="ch-td ch-td-number">{parseInt(campaign.cta_clicks || 0).toLocaleString()}</td>
                  <td className="ch-td">
                    <span className="ch-version-badge">{campaign.version_count || 0} versions</span>
                  </td>
                  <td className="ch-td">
                    <span className={`ch-status-badge ${campaign.status}`}>
                      {(campaign.status || 'active').toUpperCase()}
                    </span>
                  </td>
                  <td className="ch-td">
                    <div className="ch-action-cell" style={{ position: 'relative' }}>
                      <button 
                        className="ch-edit-btn"
                        onClick={() => toggleDropdown(campaign.id)}
                      >
                        Edit <FaChevronDown size={10} />
                      </button>
                      {openDropdown === campaign.id && (
                        <div
                          className="ch-dropdown-menu"
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 5px)',
                            right: 0,
                            zIndex: 1050,
                            minWidth: '170px'
                          }}
                        >
                          <button onClick={() => { setOpenDropdown(null); navigate(`/admin/campaign/${campaign.id}`); }}>
                            <FaEye size={16} /> View Details
                          </button>
                          <button onClick={() => { setOpenDropdown(null); navigate(`/admin/campaign/${campaign.id}/version/create`); }}>
                            <FaPlus size={16} /> New Version
                          </button>
                          <button onClick={() => { setOpenDropdown(null); navigate(`/admin/campaign/edit/${campaign.id}`); }}>
                            <BsPencil size={16} /> Edit 
                          </button>
                          <button className="ch-dropdown-danger" style={{color : "#ef4444"}} onClick={async () => {
                            if (!window.confirm('Are you sure you want to delete this campaign?')) return;
                            try {
                              await api.delete(`/campaign/${campaign.id}`);
                              setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
                              toast.success('Campaign deleted');
                            } catch {
                              toast.error('Failed to delete campaign');
                            }
                            setOpenDropdown(null);
                          }}>
                            <BsTrash size={16} /> Delete 
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="d-flex justify-content-end pagination-main-box p-3">
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

        {filteredCampaigns.length === 0 && (
          <div className="ch-empty">
            <FaHistory className="ch-empty-icon" />
            <p className="ch-empty-text">No campaigns found matching your filters</p>
          </div>
        )}
      </div>
        </div>

      </div>

      
   

      {/* Table — dq-card + dq-table */}
     
    </div>
  );
};

export default CampaignHistory;
