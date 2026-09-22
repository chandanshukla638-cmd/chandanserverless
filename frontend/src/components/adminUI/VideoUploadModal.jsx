import React, { useState, useRef } from 'react';
import { FaTimes, FaUpload, FaVideo, FaLink, FaYoutube, FaCheck, FaSpinner, FaFileVideo } from 'react-icons/fa';
import api from '../../services/api';
import { toast } from 'react-toastify';
import '../../styles/QRDownloadModal.css';

const VideoUploadModal = ({ show, onClose }) => {
  const fileInputRef = useRef(null);
  const [uploadType, setUploadType] = useState('file');
  const [videoName, setVideoName] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [urlType, setUrlType] = useState('youtube');

  const [videoDuration, setVideoDuration] = useState('');

  if (!show) return null;

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
      setVideoName(file.name.replace(/\.[^/.]+$/, ''));
      
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

  const handleUpload = async () => {
    setUploading(true);
    try {
      if (uploadType === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('name', videoName || selectedFile.name.replace(/\.[^/.]+$/, ''));
        if (videoDuration) formData.append('duration', videoDuration);
        
        await api.post('/video/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
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
          name: videoName || 'Untitled',
          video_url: finalUrl,
          video_type: urlType,
          size: 'Streaming',
          duration: '--:--'
        };
        await api.post('/video/upload', payload);
      }
      
      setUploading(false);
      setUploaded(true);
      toast.success('Video uploaded successfully!');
      setTimeout(() => {
        onClose(true);
        setUploaded(false);
        setSelectedFile(null);
        setVideoName('');
        setVideoUrl('');
        setVideoDuration('');
      }, 1500);
    } catch (err) {
      console.error(err);
      setUploading(false);
      const errMsg = err.response?.data?.error || err.message || 'Upload failed';
      toast.error(errMsg);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedFile(null);
    setVideoName('');
    setVideoUrl('');
    setUploaded(false);
    setVideoDuration('');
  };

  return (
    <div className="qrd-modal-overlay">
      <div className="qrd-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="qrd-modal-header">
          <div>
            <h5 className="qrd-modal-title">Upload Video</h5>
            <p className="qrd-modal-subtitle">Add videos for your QR code landing pages</p>
          </div>
          <button className="cmp-back-btn" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="qrd-modal-body">
          {/* Upload Type Tabs */}
          <div className="vum-tabs">
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
            <>
              {!selectedFile ? (
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
              ) : (
                <div className="vum-file-card">
                  <div className="vum-file-icon">
                    <FaFileVideo />
                  </div>
                  <div className="vum-file-info">
                    <span className="vum-file-name">{selectedFile.name}</span>
                    <span className="vum-file-size">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                  </div>
                  <button className="vum-file-remove" onClick={() => setSelectedFile(null)}>
                    <FaTimes /> Remove
                  </button>
                </div>
              )}
            </>
          ) : (
            <div>
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
                <small className="vum-field-hint">
                  {urlType === 'youtube' && 'Paste YouTube video URL'}
                  {urlType === 'vimeo' && 'Paste Vimeo video URL'}
                  {urlType === 'direct' && 'Paste direct MP4 video URL'}
                </small>
              </div>
              <div className="vum-platforms mb-3">
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

          {/* Video Name */}
          <div className="custom-frm-bx mt-3">
            <label className="dq-label">Video Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., Product Demo 2026"
              value={videoName}
              onChange={(e) => setVideoName(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="qrd-modal-footer">
          <button className="thm-btn outline" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="thm-btn"
            onClick={handleUpload}
            disabled={uploading || uploaded || (!selectedFile && !videoUrl)}
          >
            {uploading ? (
              <>
                <FaSpinner className="spin me-2" /> Uploading...
              </>
            ) : uploaded ? (
              <>
                <FaCheck className="me-2" /> Uploaded!
              </>
            ) : (
              <>
                <FaUpload className="me-2" /> Upload Video
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoUploadModal;
