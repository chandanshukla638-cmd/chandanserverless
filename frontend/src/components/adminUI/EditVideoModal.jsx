import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaCheck, FaVideo, FaUpload, FaFileVideo, FaLink, FaYoutube } from 'react-icons/fa';
import api from '../../services/api';
import { toast } from 'react-toastify';
import '../../styles/QRDownloadModal.css';

const EditVideoModal = ({ show, video, onClose }) => {
  const [videoName, setVideoName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoDuration, setVideoDuration] = useState('');
  
  const [replaceMode, setReplaceMode] = useState(false);
  const [uploadType, setUploadType] = useState('file');
  const [urlType, setUrlType] = useState('youtube');
  const [videoUrl, setVideoUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (video) {
      setVideoName(video.name?.replace(/\.[^/.]+$/, '') || '');
      setSelectedFile(null);
      setVideoDuration('');
      setReplaceMode(false);
      setVideoUrl('');
      setUploadType('file');
      setUrlType('youtube');
    }
  }, [video, show]);

  if (!show || !video) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file && (file.type === 'video/mp4' || file.type === 'video/quicktime')) {
      setSelectedFile(file);
      
      const videoNode = document.createElement('video');
      videoNode.preload = 'metadata';
      videoNode.onloadedmetadata = () => {
        window.URL.revokeObjectURL(videoNode.src);
        const totalSeconds = videoNode.duration;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
        setVideoDuration(`${minutes}:${seconds}`);
      };
      videoNode.src = URL.createObjectURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (replaceMode && uploadType === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('name', videoName);
        if (videoDuration) formData.append('duration', videoDuration);
        
        await api.put(`/video/${video.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else if (replaceMode && uploadType === 'url' && videoUrl) {
        let finalUrl = videoUrl;
        
        if (urlType === 'youtube') {
          const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
          if (ytMatch && ytMatch[1]) {
            finalUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
          }
        } else if (urlType === 'vimeo') {
          const vimeoMatch = videoUrl.match(/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/i);
          if (vimeoMatch && vimeoMatch[1]) {
            finalUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
          }
        }

        const payload = {
          name: videoName,
          video_url: finalUrl,
          video_type: urlType,
          size: 'Streaming',
          duration: '--:--'
        };
        await api.put(`/video/${video.id}`, payload);
      } else {
        await api.put(`/video/${video.id}`, { name: videoName });
      }
      
      setSaving(false);
      setSaved(true);
      toast.success('Video updated successfully');
      setTimeout(() => {
        onClose(true);
        setSaved(false);
      }, 1000);
    } catch(err) {
       console.error(err);
       setSaving(false);
       toast.error(err.response?.data?.error || err.message || 'Failed to update video');
    }
  };

  const handleClose = () => {
    onClose();
    setSaved(false);
  };

  const isSaveDisabled = saving || saved || !videoName.trim() || 
    (replaceMode && uploadType === 'file' && !selectedFile) || 
    (replaceMode && uploadType === 'url' && !videoUrl.trim());

  return (
    <div className="qrd-modal-overlay">
      <div className="qrd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="qrd-modal-header">
          <div>
            <h5 className="qrd-modal-title">Edit Video</h5>
            <p className="qrd-modal-subtitle">Update video details or replace media</p>
          </div>
          <button className="cmp-back-btn" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>

        <div className="qrd-modal-body">
          <div className="evm-preview mb-3">
            <div className="evm-preview-icon">
              {(replaceMode && selectedFile) ? <FaFileVideo /> : (replaceMode && videoUrl) ? <FaLink /> : <FaVideo />}
            </div>
            <div className="evm-preview-info">
              <span className="evm-preview-name">{(replaceMode && selectedFile) ? selectedFile.name : (replaceMode && videoUrl) ? videoUrl : video.name}</span>
              <span className="evm-preview-meta">
                {(replaceMode && selectedFile) ? `${videoDuration} • ${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB (New)` : (replaceMode && videoUrl) ? `--:-- • Streaming (New)` : `${video.duration} • ${video.size}`}
              </span>
            </div>
            {!replaceMode ? (
               <button className="thm-btn outline" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setReplaceMode(true)}>
                 <FaUpload className="me-1" /> Replace Media
               </button>
            ) : (
               <button className="thm-btn outline" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => { setReplaceMode(false); setSelectedFile(null); setVideoUrl(''); }}>
                 <FaTimes className="me-1" /> Cancel Replace
               </button>
            )}
          </div>

          {replaceMode && (
            <div className="evm-replace-section mb-3" >
              <div className="vum-tabs mb-3">
                <button
                  className={`vum-tab ${uploadType === 'file' ? 'active' : ''}`}
                  onClick={() => setUploadType('file')}
                >
                  <FaUpload /> Upload File
                </button>
                <button
                  className={`vum-tab ${uploadType === 'url' ? 'active' : ''}`}
                  onClick={() => setUploadType('url')}
                >
                  <FaLink /> Paste URL
                </button>
              </div>

              {uploadType === 'file' ? (
                <div className="mt-3">
                  <div
                    className={`vum-upload-zone ${dragActive ? 'drag-active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="vum-upload-icon">
                      <FaVideo />
                    </div>
                    <p className="vum-upload-text">Click to upload or drag and drop</p>
                    <span className="vum-upload-hint">MP4, MOV up to 500 MB</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="video/mp4,video/quicktime"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFile(e.target.files[0])}
                    />
                  </div>
                  {selectedFile && <div className="mt-2 text-success text-center"><small><FaCheck /> {selectedFile.name} selected</small></div>}
                </div>
              ) : (
                <div className="mt-3">
                  <div className="custom-frm-bx mb-3">
                    <label className="dq-label">Video URL</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder={
                        urlType === 'youtube' ? 'https://youtube.com/watch?v=...' :
                        urlType === 'vimeo' ? 'https://vimeo.com/...' :
                        'https://example.com/video.mp4'
                      }
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                  </div>
                  <div className="vum-platforms">
                    <button
                      className={`vum-platform ${urlType === 'youtube' ? 'active' : ''}`}
                      onClick={() => setUrlType('youtube')}
                      type="button"
                    >
                      <FaYoutube className="vum-platform-icon youtube" /> YouTube
                    </button>
                    <button
                      className={`vum-platform ${urlType === 'vimeo' ? 'active' : ''}`}
                      onClick={() => setUrlType('vimeo')}
                      type="button"
                    >
                      <FaVideo className="vum-platform-icon vimeo" /> Vimeo
                    </button>
                    <button
                      className={`vum-platform ${urlType === 'direct' ? 'active' : ''}`}
                      onClick={() => setUrlType('direct')}
                      type="button"
                    >
                      <FaLink className="vum-platform-icon direct" /> Direct URL
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="custom-frm-bx">
            <label className="dq-label">Video Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., Product Demo 2026"
              value={videoName}
              onChange={(e) => setVideoName(e.target.value)}
            />
          </div>
          <small className="evm-field-hint">
            Changing the name or replacing the media will not break linked QR codes
          </small>
        </div>

        <div className="qrd-modal-footer">
          <button className="thm-btn outline" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="thm-btn"
            onClick={handleSave}
            disabled={isSaveDisabled}
          >
            {saving ? (
              <>Saving...</>
            ) : saved ? (
              <><FaCheck className="me-2" /> Saved!</>
            ) : (
              <><FaCheck className="me-2" /> Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditVideoModal;
