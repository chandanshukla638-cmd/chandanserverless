import React, { useState } from 'react';
import { FaTimes, FaCheck, FaQrcode, FaLink, FaSearch, FaVideo } from 'react-icons/fa';
import api from '../../services/api';
import { toast } from 'react-toastify';
import '../../styles/QRDownloadModal.css';

const LinkQRModal = ({ show, video, onClose }) => {
  const [search, setSearch] = useState('');
  const [qrCodes, setQrCodes] = useState([]);
  const [selectedQRs, setSelectedQRs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (show && video) {
      fetchQRs();
    } else {
      setSelectedQRs([]);
      setSearch('');
      setQrCodes([]);
    }
  }, [show, video]);

  const normalizeUrl = (url) => {
    if (!url) return '';
    try {
      const u = new URL(url);
      return u.origin + u.pathname.replace(/\/+$/, '');
    } catch {
      return url.replace(/\/+$/, '').split('?')[0];
    }
  };

  const fetchQRs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/qr');
      const videoUrlNorm = normalizeUrl(video.videoUrl);
      const mapped = res.data.map(qr => ({
        id: qr.id,
        qr_id: qr.qr_id,
        name: qr.name,
        type: 'dynamic',
        status: qr.status,
        linked: normalizeUrl(qr.current_video_url) === videoUrlNorm
      }));
      setQrCodes(mapped);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load QR codes');
    } finally {
      setLoading(false);
    }
  };

  if (!show || !video) return null;

  const filteredQRs = qrCodes.filter(qr =>
    qr.name.toLowerCase().includes(search.toLowerCase())
  );

  const unlinkedQRs = filteredQRs.filter(qr => !qr.linked);
  const isAllSelected = unlinkedQRs.length > 0 && unlinkedQRs.every(qr => selectedQRs.includes(qr.id));

  const handleToggleQR = (qrId) => {
    setSelectedQRs(prev =>
      prev.includes(qrId)
        ? prev.filter(id => id !== qrId)
        : [...prev, qrId]
    );
  };

  const handleSelectAllToggle = () => {
    const availableQRs = filteredQRs.filter(qr => !qr.linked);
    const availableIds = availableQRs.map(qr => qr.id);
    const allSelected = availableIds.length > 0 && availableIds.every(id => selectedQRs.includes(id));
    
    if (allSelected) {
      setSelectedQRs(prev => prev.filter(id => !availableIds.includes(id)));
    } else {
      setSelectedQRs(prev => {
        const newSelected = new Set([...prev, ...availableIds]);
        return Array.from(newSelected);
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/video/${video.id}/link`, { qr_ids: selectedQRs });
      setSaving(false);
      setSaved(true);
      toast.success(`Successfully linked ${selectedQRs.length} QR code(s)`);

      const links = selectedQRs.map(id => {
        const qr = qrCodes.find(q => q.id === id);
        return qr && qr.qr_id ? `https://${window.location.host}/r/${qr.qr_id}` : '';
      }).filter(Boolean);

      if (links.length > 0) {
        navigator.clipboard.writeText(links.join('\n'));
        toast.info('QR Link(s) copied to clipboard!');
      }

      setTimeout(() => {
        onClose(true); // pass true to refresh
        setSaved(false);
        setSelectedQRs([]);
        setSearch('');
      }, 1000);
    } catch (err) {
      console.error(err);
      setSaving(false);
      toast.error(err.response?.data?.error || 'Failed to link QR codes');
    }
  };

  const handleClose = () => {
    onClose();
    setSaved(false);
    setSelectedQRs([]);
    setSearch('');
  };

  return (
    <div className="qrd-modal-overlay">
      <div className="qrd-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="qrd-modal-header">
          <div>
            <h5 className="qrd-modal-title">Link to QR Code</h5>
            <p className="qrd-modal-subtitle">Select QR codes to link with this video</p>
          </div>
          <button className="cmp-back-btn" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="qrd-modal-body">
          {/* Video Info */}
          <div className="lqm-video-info">
            <FaVideo className="lqm-video-icon" />
            <div>
              <span className="lqm-video-name">{video.name}</span>
              <span className="lqm-video-meta">{video.duration} • {video.size}</span>
            </div>
          </div>

          {/* Search */}
          <div className="custom-frm-bx mb-3">
            <label className="dq-label">Search QR Codes</label>
            <div className="lqm-search-wrapper">
              <FaSearch className="lqm-search-icon" />
              <input
                type="text"
                className="form-control"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-2 px-1">
            <span style={{ fontSize: '14px', color: '#eee' }}>
              {unlinkedQRs.length} available to link
            </span>
            <button 
              className={isAllSelected ? 'lqm-selected-badge' : 'lqm-select-badge'}
              style={{ border: 'none', cursor: 'pointer' }}
              onClick={handleSelectAllToggle}
              disabled={loading || unlinkedQRs.length === 0}
            >
              {isAllSelected ? <><FaCheck /> Unselect All</> : 'Select All'}
            </button>
          </div>

          {/* QR List */}
          <div className="lqm-qr-list">
            {loading ? (
              <div className="lqm-empty" style={{ padding: '40px 0' }}>
                <div className="spinner-border text-info mb-2" role="status">
                  <span className="visually-hidden" >Loading...</span>
                </div>
                <p style={{color : "#ddd"}}>Loading QR codes...</p>
              </div>
            ) : filteredQRs.length === 0 ? (
              <div className="lqm-empty" >
                <FaQrcode style={{color : "#00b8e8"}} />
                <p style={{color : "#ddd"}}>No QR codes found</p>
              </div>
            ) : (
              filteredQRs.map(qr => (
                <div
                  key={qr.id}
                  className={`lqm-qr-item ${qr.linked ? 'linked' : ''} ${selectedQRs.includes(qr.id) ? 'selected' : ''}`}
                  onClick={() => !qr.linked && handleToggleQR(qr.id)}
                >
                  <div className="lqm-qr-icon">
                    <FaQrcode />
                  </div>
                  <div className="lqm-qr-info">
                    <span className="lqm-qr-name">{qr.name}</span>
                    <span className="lqm-qr-type">
                      {qr.type === 'dynamic' ? 'Dynamic' : 'Static'} • {qr.status}
                    </span>
                  </div>
                  <div className="lqm-qr-action">
                    {qr.linked ? (
                      <span className="lqm-linked-badge">
                        <FaLink /> Linked
                      </span>
                    ) : selectedQRs.includes(qr.id) ? (
                      <span className="lqm-selected-badge">
                        <FaCheck /> Selected
                      </span>
                    ) : (
                      <span className="lqm-select-badge">Select</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Selected Count */}
          {selectedQRs.length > 0 && (
            <div className="lqm-selected-info">
              <FaLink className="lqm-selected-icon" />
              <span>{selectedQRs.length} QR code(s) selected to link</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="qrd-modal-footer">
          <button className="thm-btn outline" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="thm-btn"
            onClick={handleSave}
            disabled={saving || saved || selectedQRs.length === 0}
          >
            {saving ? (
              <>Linking...</>
            ) : saved ? (
              <>
                <FaCheck className="me-2" /> Linked!
              </>
            ) : (
              <>
                <FaLink className="me-2" /> Link {selectedQRs.length} QR Code(s)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkQRModal;
