import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUpload, FaVideo, FaMousePointer, FaLink, FaArrowLeft, FaSpinner, FaCheck, FaTimes, FaClipboardList } from 'react-icons/fa';
import api from '../../services/api';
import CategoryDropdown from '../../components/CategoryDropdown';
import { toast } from 'react-toastify';
import '../../styles/DynamicQR.css';

const CreateDynamicQR = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editQR = location.state?.editQR || null;
  const isEditMode = !!editQR;
  const fileInputRef = useRef(null);
  const [qrName, setQrName] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [videoSource, setVideoSource] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [formEnabled, setFormEnabled] = useState(false);
  const [categoryId, setCategoryId] = useState(editQR?.categoryId || location.state?.categoryId || null);
  const [videos, setVideos] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await api.get('/video');
        setVideos(res.data);
      } catch {
        // silently fail — dropdown will be empty
      }
    };
    fetchVideos();
  }, []);

  // Pre-fill form in edit mode
  useEffect(() => {
    if (editQR) {
      setQrName(editQR.name || '');
      setLogoPreview(editQR.logoUrl || '');
      if (editQR.formEnabled !== undefined) setFormEnabled(editQR.formEnabled);
      if (editQR.ctaDestination && editQR.ctaDestination !== '—') setCtaUrl(editQR.ctaDestination);
      if (editQR.ctaText) setCtaText(editQR.ctaText);
      if (editQR.videoUrl) {
        const matchingVideo = videos.find(v => v.video_url === editQR.videoUrl);
        if (matchingVideo) {
          setVideoSource(editQR.videoUrl);
        } else {
          setVideoUrl(editQR.videoUrl);
        }
      }
    }
  }, [editQR, videos]);

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error('File size must be less than 1MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Only JPG and PNG files are allowed');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = (e) => {
    e.stopPropagation();
    setLogoFile(null);
    setLogoPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!qrName.trim()) {
      toast.error('Please enter a QR campaign name');
      return;
    }

    const finalVideoUrl = videoSource || videoUrl.trim();
    if (!finalVideoUrl) {
      toast.error('Please select a video from library or paste a URL');
      return;
    }

    setSaving(true);
    try {
      if (isEditMode) {
        // Edit mode: update existing QR + campaign
        await api.put(`/qr/${editQR.id}`, {
          name: qrName.trim(),
          logo_url: logoPreview,
          form_enabled: formEnabled,
          category_id: categoryId,
        });
        if (editQR.campaignId) {
          await api.put(`/campaign/${editQR.campaignId}`, {
            name: qrName.trim(),
            video_type: videoSource ? 'library' : (videoUrl.includes('youtube') ? 'youtube' : videoUrl.includes('vimeo') ? 'vimeo' : 'mp4'),
            video_url: finalVideoUrl,
            cta_text: ctaText.trim() || null,
            cta_destination: ctaUrl.trim() || null,
            headline: qrName.trim(),
          });
        }
        toast.success('QR code updated successfully!');
      } else {
        // Create mode: new QR + campaign
        const qrRes = await api.post('/qr/create', {
          name: qrName.trim(),
          logo_url: logoPreview || null,
          form_enabled: formEnabled,
          category_id: categoryId,
        });
        const newQR = qrRes.data;
        const videoType = videoSource ? 'library' : (videoUrl.includes('youtube') ? 'youtube' : videoUrl.includes('vimeo') ? 'vimeo' : 'mp4');
        await api.post('/campaign/create', {
          qr_id: newQR.id,
          name: qrName.trim(),
          video_type: videoType,
          video_url: finalVideoUrl,
          cta_text: ctaText.trim() || null,
          cta_destination: ctaUrl.trim() || null,
          headline: qrName.trim(),
          tagline: '',
          badge: '',
        });
        toast.success('QR code created successfully!');
      }
      navigate('/admin/dynamic-qr');
    } catch (err) {
      console.error('Failed to save QR', err);
      toast.error(err.response?.data?.error || 'Failed to save QR code');
    } finally {
      setSaving(false);
    }
  };

  const selectedVideo = videos.find(v => String(v.id) === videoSource);

  return (
    <div className="dq-page-wrapper">
      <div className="dq-header">
        <div className='cd-header-left'>
          <button
            className="cmp-back-btn"
            onClick={() => navigate('/admin/dynamic-qr')}
          >
            <FaArrowLeft  />
          </button>
          <div>
            <h4 className="dq-page-title ">{isEditMode ? 'Edit Dynamic QR' : 'Create New Dynamic QR'}</h4>
          <p className="dq-page-subtitle">{isEditMode ? 'Update your QR code settings' : 'Set up your QR code with video and CTA'}</p>
          </div>
        </div>
        <div className="dq-header-actions">
          <button
            className="thm-btn outline"
            onClick={() => navigate('/admin/dynamic-qr')}
          >
            Cancel
          </button>
          <button className="thm-btn" onClick={handleGenerate} disabled={saving}>
            {saving ? (
              <><FaSpinner className="spin me-2" /> {isEditMode ? 'Updating...' : 'Creating...'}</>
            ) : (
              <><FaCheck className="me-2" /> {isEditMode ? 'Update QR' : 'Generate & Save QR'}</>
            )}
          </button>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8 col-md-12 col-sm-12 mb-3 mb-lg-0">
          <div className="dq-card mb-3">
            <div className="dq-card-header">
              <h6 className="dq-card-title">Basic Details</h6>
            </div>
            <div className="dq-card-body">
              <div className="custom-frm-bx">
                <label className="dq-label">QR Campaign Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Summer Promo Video"
                  value={qrName}
                  onChange={(e) => setQrName(e.target.value)}
                />
              </div>
              <div className="custom-frm-bx">
                <label className="dq-label">Category / Folder</label>
                <CategoryDropdown
                  value={categoryId}
                  onChange={(id) => setCategoryId(id)}
                />
              </div>
              <div className="custom-frm-bx mb-0">
                <label className="dq-label">QR Logo Branding (Center Logo)</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".jpg,.jpeg,.png"
                  onChange={handleLogoChange}
                  style={{ display: 'none' }}
                />
                <div className="dq-upload-zone" onClick={handleLogoClick}>
                  {logoPreview ? (
                    <>
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="dq-logo-preview"
                      />
                      <p className="dq-upload-text mt-2">{logoFile?.name || 'Current logo'}</p>
                      <span className="dq-upload-hint">Click to change</span>
                      <button
                        type="button"
                        className="thm-btn outline mt-2"
                        style={{ padding: '4px 12px', fontSize: '12px' }}
                        onClick={handleRemoveLogo}
                      >
                        <FaTimes className="me-1" /> Remove Logo
                      </button>
                    </>
                  ) : (
                    <>
                      <FaUpload className="dq-upload-icon" size={24} />
                      <p className="dq-upload-text">Upload brand logo to center inside QR</p>
                      <span className="dq-upload-hint">Supports JPG, PNG (Max 1MB)</span>
                    </>
                  )}
                </div>
              </div>

              {/* <div className="custom-frm-bx mb-0">
                <label className="dq-label"><FaClipboardList className="me-1" /> Lead Capture Form</label>
                <div className="dq-toggle-row">
                  <span className="dq-toggle-label">Show form after QR scan</span>
                  <label className="dq-toggle-switch">
                    <input type="checkbox" checked={formEnabled} onChange={(e) => setFormEnabled(e.target.checked)} />
                    <span className="dq-toggle-slider"></span>
                  </label>
                </div>
                <small className="dq-field-hint">When enabled, users will see an optional form before landing page. They can skip or submit.</small>
              </div> */}
            </div>
          </div>
 
          <div className='dq-card mb-3'>
            <div className='dq-card-header'>
              <h6 className="dq-card-title">
                <FaClipboardList className="me-1" /> Lead Capture Form
              </h6>
            </div>
            <div className='dq-card-body'>
               <div className="custom-frm-bx mb-0">
                <div className="dq-toggle-row py-0">
                  <lable className="dq-toggle-label">Show form after QR scan</lable>
                  <label className="dq-toggle-switch">
                    <input type="checkbox" checked={formEnabled} onChange={(e) => setFormEnabled(e.target.checked)} />
                    <span className="dq-toggle-slider"></span>
                  </label>
                </div>
                <small className="dq-field-hint">When enabled, users will see an optional form before landing page. They can skip or submit.</small>
              </div>
            </div>


          </div>

          {/* Video Card */}
          <div className="dq-card">
            <div className="dq-card-header">
              <h6 className="dq-card-title">
                <FaVideo className="me-2" /> Attach Video (Mobile Landing Page)
              </h6>
            </div>
            <div className="dq-card-body">
              <div className="custom-frm-bx">
                <label className="dq-label">Select from Library or Enter URL</label>
                <select
                  className="form-select"
                  value={videoSource}
                  onChange={(e) => { setVideoSource(e.target.value); if (e.target.value) setVideoUrl(''); }}
                >
                  <option value="">-- Choose an uploaded video --</option>
                  {videos.map(v => (
                    <option key={v.id} value={v.video_url}>{v.name}</option>
                  ))}
                </select>
                {selectedVideo && (
                  <small className="dq-field-hint text-success">
                    <FaCheck className="me-1" /> {selectedVideo.name} selected ({selectedVideo.duration || 'Streaming'})
                  </small>
                )}
              </div>
              <div className="dq-or-divider">
                <span>OR</span>
              </div>
              <div className="custom-frm-bx mb-0">
                <label className="dq-label">Paste YouTube/Vimeo URL</label>
                <input
                  type="text"
                  className="form-control bg-transparent"
                  placeholder="https://youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => { setVideoUrl(e.target.value); if (e.target.value) setVideoSource(''); }}
                  disabled={!!videoSource}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4 col-md-12 col-sm-12">
          <div className="dq-card dq-card-sticky">
            <div className="dq-card-header">
              <h6 className="dq-card-title">
                <FaMousePointer className="me-2" /> Call to Action (CTA)
              </h6>
            </div>
            <div className="dq-card-body">
              <div className="custom-frm-bx">
                <label className="dq-label">CTA Button Text</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Buy Now"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                />
              </div>
              <div className="custom-frm-bx">
                <label className="dq-label">
                  <FaLink className="me-1" /> Destination URL (Redirect)
                </label>
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://amazon.in/your-product"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                />

              </div>

              <small className="dq-field-hint">
                  User will be redirected here after clicking the CTA button below the video.
                </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateDynamicQR;
