import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FaArrowLeft, FaSave, FaVideo, FaMousePointer, FaLink, 
  FaCalendarAlt, FaQrcode, FaPlay
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../../styles/CreateCampaign.css';

const EditCampaign = () => {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qrOptions, setQrOptions] = useState([]);
  const [videoOptions, setVideoOptions] = useState([]);
  const [formData, setFormData] = useState({
    campaignName: '',
    qrCode: '',
    startDate: '',
    endDate: '',
    videoType: 'library',
    videoUrl: '',
    ctaText: 'Buy Now',
    ctaDestination: '',
    headline: '',
    tagline: '',
    badge: '',
    rating: '',
    reviews: '',
    status: 'active'
  });

  const [selectedVideo, setSelectedVideo] = useState(null);

  const fetchCampaign = useCallback(async () => {
    try {
      const res = await api.get(`/campaign/${campaignId}`);
      const camp = res.data;
      const activeVersion = camp.versions?.find(v => v.is_active) || camp.versions?.[0] || {};
      
      setFormData({
        campaignName: camp.name || '',
        qrCode: camp.qr_id ? String(camp.qr_id) : '',
        startDate: camp.start_date ? camp.start_date.split('T')[0] : '',
        endDate: camp.end_date ? camp.end_date.split('T')[0] : '',
        videoType: activeVersion.video_type || 'library',
        videoUrl: activeVersion.video_url || '',
        ctaText: activeVersion.cta_text || 'Buy Now',
        ctaDestination: activeVersion.cta_destination || '',
        headline: camp.headline || '',
        tagline: camp.tagline || '',
        badge: camp.badge || '',
        rating: camp.rating != null ? String(parseFloat(camp.rating)) : '',
        reviews: camp.reviews != null ? String(camp.reviews) : '',
        status: camp.status || 'active'
      });
      
      if (activeVersion.video_type === 'library') {
        // We can't easily auto-select the library video without searching all videos, but the user can re-select if they want to change it.
      }
    } catch {
      toast.error('Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  const fetchQRs = useCallback(async () => {
    try {
      const res = await api.get('/qr');
      setQrOptions(res.data);
    } catch {
      toast.error('Failed to load QR codes');
    }
  }, []);

  const fetchVideos = useCallback(async () => {
    try {
      const res = await api.get('/video');
      setVideoOptions(res.data);
    } catch {
      toast.error('Failed to load videos');
    }
  }, []);

  useEffect(() => {
    fetchQRs();
    fetchVideos();
    fetchCampaign();
  }, [fetchQRs, fetchVideos, fetchCampaign]);

  const ctaPresets = [
    'Buy Now', 'Shop Now', 'Explore', 'Apply Now', 
    'Learn More', 'Download', 'Visit Website', 'Register'
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.campaignName.trim()) {
      toast.error('Campaign name is required');
      return;
    }
    if (formData.rating !== '') {
      const r = Number(formData.rating);
      if (!Number.isFinite(r) || r < 0 || r > 5) {
        toast.error('Rating must be between 0 and 5');
        return;
      }
    }
    if (formData.reviews !== '') {
      const rv = Number(formData.reviews);
      if (!Number.isInteger(rv) || rv < 0) {
        toast.error('Reviews must be a whole number (0 or more)');
        return;
      }
    }
    setSaving(true);
    try {
      const selectedVid = videoOptions.find(v => v.id === selectedVideo);
      await api.put(`/campaign/${campaignId}`, {
        name: formData.campaignName,
        headline: formData.headline,
        tagline: formData.tagline,
        badge: formData.badge,
        rating: formData.rating === '' ? undefined : Number(formData.rating),
        reviews: formData.reviews === '' ? undefined : Number(formData.reviews),
        status: formData.status,
        video_type: formData.videoType,
        video_url: formData.videoType === 'library' ? (selectedVid?.url || selectedVid?.video_url || null) : formData.videoUrl,
        cta_text: formData.ctaText,
        cta_destination: formData.ctaDestination,
      });
      toast.success('Campaign updated successfully');
      navigate('/admin/campaign-history');
    } catch {
      toast.error('Failed to update campaign');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
                    <div className="spinner-border text-info" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
    );
  }

  return (
    <div className="ov-wrapper">
      {/* Header */}
      <div className="cmp-header">
        <div className="cmp-header-left">
          <button className="cmp-back-btn" onClick={() => navigate('/admin/campaign-history')}>
            <FaArrowLeft />
          </button>
          <div>
            <h4 className="cmp-header-title">Edit Campaign</h4>
            <p className="cmp-header-subtitle">Update your existing campaign</p>
          </div>
        </div>
        <div className="cmp-header-actions">
          <button className="thm-btn outline" onClick={() => navigate('/admin/campaign-history')}>
            Cancel
          </button>
          <button className="thm-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : <><FaSave className="me-1" /> Save Campaign</>}
          </button>
        </div>
      </div>

      <div className="row">
        {/* Left Column */}
        <div className="col-lg-8 col-md-12 mb-0 mb-lg-3">
          {/* Campaign Details */}
          <div className="ov-card h-auto mb-3">
            <div className="ov-card-header">
              <div>
                <h6 className="ov-card-title"><FaQrcode className="me-2" />Campaign Details</h6>
                <p className="ov-card-subtitle">Basic information about your campaign</p>
              </div>
            </div>
            <div className="ov-card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="cmp-label">Campaign Name</label>
                  <input 
                    type="text" 
                    className="cmp-input" 
                    placeholder="e.g., Festive Offer 2026"
                    value={formData.campaignName}
                    onChange={(e) => handleChange('campaignName', e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="cmp-label"><span className="cmp-label-icon"><FaQrcode /></span> Link to QR Code</label>
                  <select 
                    className="cmp-select"
                    value={formData.qrCode}
                    onChange={(e) => handleChange('qrCode', e.target.value)}
                    disabled
                  >
                    <option value="">Select QR Code</option>
                    {qrOptions.map(qr => (
                      <option key={qr.id} value={qr.id}>{qr.name} ({qr.qr_id})</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="cmp-label">Status</label>
                  <select 
                    className="cmp-select"
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="cmp-label"><span className="cmp-label-icon"><FaCalendarAlt /></span> Start Date</label>
                  <input 
                    type="date" 
                    className="cmp-input"
                    value={formData.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    disabled
                  />
                </div>
                <div className="col-md-6">
                  <label className="cmp-label"><span className="cmp-label-icon"><FaCalendarAlt /></span> End Date (Optional)</label>
                  <input 
                    type="date" 
                    className="cmp-input"
                    value={formData.endDate}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                    disabled
                  />
                  <p className="cmp-helper">Cannot change dates in edit mode</p>
                </div>
              </div>
            </div>
          </div>

          {/* Video Content */}
          <div className="ov-card h-auto mb-3">
            <div className="ov-card-header">
              <div>
                <h6 className="ov-card-title"><FaVideo className="me-2" />Video Content</h6>
                <p className="ov-card-subtitle">Choose video type and source</p>
              </div>
            </div>
            <div className="ov-card-body">
              {/* Video Type Tabs */}
              <div className="cmp-video-tabs">
                <button 
                  className={`cmp-video-tab ${formData.videoType === 'library' ? 'active' : ''}`}
                  onClick={() => handleChange('videoType', 'library')}
                >
                  <FaVideo /> From Library
                </button>
                <button 
                  className={`cmp-video-tab ${formData.videoType === 'youtube' ? 'active' : ''}`}
                  onClick={() => handleChange('videoType', 'youtube')}
                >
                  <FaPlay /> YouTube URL
                </button>
                <button 
                  className={`cmp-video-tab ${formData.videoType === 'vimeo' ? 'active' : ''}`}
                  onClick={() => handleChange('videoType', 'vimeo')}
                >
                  <FaPlay /> Vimeo URL
                </button>
              </div>

              {formData.videoType === 'library' && (
                <div className="cmp-video-scroll">
                  {videoOptions.length === 0 && (
                    <p className="cmp-helper" style={{ padding: '12px' }}>No videos in library. Add videos first.</p>
                  )}
                  <div className="row">
                    {videoOptions.map(video => (
                      <div className="col-md-4 col-sm-6" key={video.id}>
                        <div 
                          className={`cmp-video-card ${selectedVideo === video.id ? 'selected' : ''}`}
                          onClick={() => setSelectedVideo(video.id)}
                        >
                          <div className={`cmp-video-icon`}>
                            <FaPlay />
                          </div>
                          <div className="cmp-video-info">
                            <p className="cmp-video-name">{video.title || video.name}</p>
                            <p className="cmp-video-duration">{video.duration || video.source_type || ''}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(formData.videoType === 'youtube' || formData.videoType === 'vimeo') && (
                <div>
                  <label className="cmp-label">
                    {formData.videoType === 'youtube' ? 'YouTube' : 'Vimeo'} Video URL
                  </label>
                  <input 
                    type="url" 
                    className="cmp-input" 
                    placeholder={`Paste ${formData.videoType === 'youtube' ? 'YouTube' : 'Vimeo'} URL here`}
                    value={formData.videoUrl}
                    onChange={(e) => handleChange('videoUrl', e.target.value)}
                  />
                  <p className="cmp-helper">Supports regular and unlisted videos</p>
                </div>
              )}
            </div>
          </div>

          {/* Landing Page Content */}
          <div className="ov-card h-auto">
            <div className="ov-card-header">
              <div>
                <h6 className="ov-card-title"><FaLink className="me-2" />Landing Page Content</h6>
                <p className="ov-card-subtitle">Customize what users see after scanning</p>
              </div>
            </div>
            <div className="ov-card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="cmp-label">Headline</label>
                  <input 
                    type="text" 
                    className="cmp-input" 
                    placeholder="e.g., Introducing Pro X1"
                    value={formData.headline}
                    onChange={(e) => handleChange('headline', e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="cmp-label">Badge Text</label>
                  <input 
                    type="text" 
                    className="cmp-input" 
                    placeholder="e.g., HOT DEAL / LIMITED TIME"
                    value={formData.badge}
                    onChange={(e) => handleChange('badge', e.target.value)}
                  />
                </div>
                <div className="col-12">
                  <label className="cmp-label">Tagline</label>
                  <input 
                    type="text" 
                    className="cmp-input" 
                    placeholder="e.g., The Future of Smart Living"
                    value={formData.tagline}
                    onChange={(e) => handleChange('tagline', e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="cmp-label">Rating (0 - 5)</label>
                  <input
                    type="number"
                    className="cmp-input"
                    placeholder="e.g., 4.5"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => handleChange('rating', e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="cmp-label">Reviews Count</label>
                  <input
                    type="number"
                    className="cmp-input"
                    placeholder="e.g., 120"
                    min="0"
                    step="1"
                    value={formData.reviews}
                    onChange={(e) => handleChange('reviews', e.target.value)}
                  />
                  <p className="cmp-helper">Shown on the scan page next to the stars</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-lg-4 col-md-12 ">
          {/* CTA Configuration */}
          <div className="ov-card h-auto mb-3">
            <div className="ov-card-header">
              <div>
                <h6 className="ov-card-title"><FaMousePointer className="me-2" />Call to Action</h6>
                <p className="ov-card-subtitle">Set up your CTA button</p>
              </div>
            </div>
            <div className="ov-card-body">
              <label className="cmp-label">Button Text</label>
              <div className="cmp-btn-options">
                {ctaPresets.map(preset => (
                  <button 
                    key={preset}
                    className={`cmp-btn-option ${formData.ctaText === preset ? 'active' : ''}`}
                    onClick={() => handleChange('ctaText', preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input 
                type="text" 
                className="cmp-input" 
                placeholder="Or type custom text"
                value={formData.ctaText}
                onChange={(e) => handleChange('ctaText', e.target.value)}
              />

              <label className="cmp-label" style={{ marginTop: '16px' }}><span className="cmp-label-icon"><FaLink /></span> Destination URL</label>
              <input 
                type="url" 
                className="cmp-input" 
                placeholder="https://amazon.in/your-product"
                value={formData.ctaDestination}
                onChange={(e) => handleChange('ctaDestination', e.target.value)}
              />
              <p className="cmp-helper">User will be redirected here after clicking the CTA</p>
            </div>
          </div>

          {/* Live Preview */}
          <div className="ov-card h-auto mb-3">
            <div className="ov-card-header">
              <div>
                <h6 className="ov-card-title">Live Preview</h6>
              </div>
            </div>
            <div className="ov-card-body">
              <div className="cmp-preview-box">
                {formData.badge && (
                  <span className="cmp-preview-badge">{formData.badge}</span>
                )}
                {formData.headline && (
                  <p className="cmp-preview-headline">{formData.headline}</p>
                )}
                {formData.tagline && (
                  <p className="cmp-preview-tagline">{formData.tagline}</p>
                )}
                {formData.ctaText && (
                  <div className="cmp-preview-cta">
                    <button className="thm-btn">{formData.ctaText}</button>
                  </div>
                )}
                {!formData.headline && !formData.tagline && !formData.badge && (
                  <p className="cmp-preview-empty">Fill in the details to see preview</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="ov-card h-auto">
            <div className="ov-card-header">
              <div>
                <h6 className="ov-card-title">Quick Tips</h6>
              </div>
            </div>
            <div className="ov-card-body">
              <ul className="cmp-tips-list">
                <li>Campaign will replace the current active version on the QR</li>
                <li>Previous campaign data will be preserved in history</li>
                <li>You can set an end date or leave it open-ended</li>
                <li>QR code remains unchanged - only content updates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCampaign;
