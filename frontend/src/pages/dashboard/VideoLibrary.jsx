import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaPlus, FaTrash, FaEdit, FaLink, FaEye, FaEllipsisV, FaVideo, FaDatabase, FaQrcode, FaHdd, FaTimes, FaExternalLinkAlt, FaPause } from 'react-icons/fa';
import VideoUploadModal from '../../components/adminUI/VideoUploadModal';
import EditVideoModal from '../../components/adminUI/EditVideoModal';
import LinkQRModal from '../../components/adminUI/LinkQRModal';
import api, { BACKEND_URL } from '../../services/api';
import Loader from './Loader';
import { toast } from 'react-toastify';
import '../../styles/VideoLibrary.css';

const VideoLibrary = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [hoveredVideo, setHoveredVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const videoRefs = useRef({});

  const fetchVideos = async () => {
    try {
      const res = await api.get('/video');
      const formatted = res.data.map(v => ({
        id: v.id,
        name: v.name,
        duration: (!v.duration || v.duration === 'null') ? '--:--' : v.duration,
        size: (!v.size || v.size === 'null') ? 'Streaming' : v.size,
        linkedQR: v.linked_qrs || 0,
        status: 'active',
        uploadedDate: new Date(v.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        thumbnail: v.thumbnail || 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=250&fit=crop',
        videoUrl: v.video_url?.startsWith('/uploads/') ? `${BACKEND_URL}${v.video_url}` : v.video_url,
        videoType: v.video_type
      }));
      setVideos(formatted);
    } catch (err) {
      console.error('Failed to fetch videos', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    if (!openDropdown) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.vl-dropdown')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const totalSize = videos.reduce((acc, curr) => {
    if (!curr.size || typeof curr.size !== 'string') return acc;
    const mb = parseFloat(curr.size);
    return isNaN(mb) ? acc : acc + mb;
  }, 0);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVideos = videos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(videos.length / itemsPerPage);

  const MAX_STORAGE_MB = 10240;
  const storagePercent = Math.min((totalSize / MAX_STORAGE_MB) * 100, 100).toFixed(1);

  const stats = [
    { title: 'TOTAL VIDEOS', value: videos.length, color: 'primary', icon: <FaVideo /> },
    { title: 'TOTAL SIZE', value: `${totalSize.toFixed(1)} MB`, color: 'blue', icon: <FaDatabase /> },
    { title: 'LINKED TO QR', value: videos.reduce((acc, curr) => acc + (curr.linkedQR > 0 ? 1 : 0), 0), color: 'orange', icon: <FaQrcode /> },
    { title: 'STORAGE USED', value: `${storagePercent}%`, color: 'green', icon: <FaHdd /> },
  ];

  const toggleDropdown = (id) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const handlePreview = (video) => {
    setSelectedVideo(video);
    setShowPreviewModal(true);
    setOpenDropdown(null);
  };

  const handleEdit = (video) => {
    setSelectedVideo(video);
    setShowEditModal(true);
    setOpenDropdown(null);
  };

  const handleLinkQR = (video) => {
    setSelectedVideo(video);
    setShowLinkModal(true);
    setOpenDropdown(null);
  };

  const handleMouseEnter = (videoId) => {
    setHoveredVideo(videoId);
    const videoEl = videoRefs.current[videoId];
    if (videoEl && typeof videoEl.play === 'function') {
      videoEl.play().catch(() => {});
    }
  };

  const handleMouseLeave = (videoId) => {
    setHoveredVideo(null);
    const videoEl = videoRefs.current[videoId];
    if (videoEl && typeof videoEl.pause === 'function') {
      videoEl.pause();
      videoEl.currentTime = 0;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    try {
      await api.delete(`/video/${id}`);
      setVideos(videos.filter(v => v.id !== id));
      setOpenDropdown(null);
      toast.success('Video deleted successfully');
    } catch (err) {
      toast.error('Failed to delete video');
    }
  };

  if (loading) return <Loader />;

  return (
    <>
      <div className="ov-wrapper">
        {/* Header */}
        <div className="ov-header">
          <div>
            <h4 className="ov-page-title">Video Library</h4>
            <p className="ov-page-subtitle">Manage videos for your QR code landing pages</p>
          </div>
          <div className="ov-header-actions">
            <button
              className="thm-btn"
              onClick={() => setShowUploadModal(true)}
            >
              <FaPlus /> Upload Video
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row">
          {stats.map((stat, index) => (
            <div className="col-sm-6 col-lg-3 mb-3" key={index}>
              <div className="ov-stat-card">
                <div className="ov-stat-header">
                  <span className="ov-stat-title">{stat.title}</span>
                  <div className={`ov-stat-icon ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
                <div className="ov-stat-value">{stat.value}</div>
                <div className={`ov-stat-bar ${stat.color}`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Video Grid */}
        <div className="row">
          {currentVideos.map(video => (
            <div className="col-sm-12 col-md-6 col-lg-3 mb-4" key={video.id}>
              <div className="vl-video-card">
                {/* Thumbnail */}
                <div
                  className="vl-thumbnail"
                  onMouseEnter={() => handleMouseEnter(video.id)}
                  onMouseLeave={() => handleMouseLeave(video.id)}
                >
                  {/* Image */}
                  <img
                    src={video.thumbnail}
                    alt={video.name}
                    className={`vl-thumbnail-img ${hoveredVideo === video.id ? 'hide' : ''}`}
                  />

                  {/* Video on hover */}
                  {video.videoType === 'youtube' || video.videoType === 'vimeo' ? (
                    <iframe
                      className={`vl-thumbnail-video ${hoveredVideo === video.id ? 'show' : ''}`}
                      src={`${video.videoUrl}?autoplay=1&mute=1&controls=0`}
                      frameBorder="0"
                      allow="autoplay; encrypted-media"
                      style={{ pointerEvents: 'none' }}
                    />
                  ) : (
                    <video
                      className={`vl-thumbnail-video ${hoveredVideo === video.id ? 'show' : ''}`}
                      ref={(el) => (videoRefs.current[video.id] = el)}
                      muted
                      loop
                      playsInline
                      src={video.videoUrl}
                    />
                  )}

                  {/* Play/Pause Icon */}
                  <div className="vl-play-btn">
                    {hoveredVideo === video.id ? <FaPause /> : <FaPlay />}
                  </div>

                  <div className="vl-duration">{video.duration}</div>
                  <div className="vl-status-badge">
                    <span className={`vl-badge ${video.status}`}>
                      {video.status === 'active' ? 'ACTIVE' : 'DRAFT'}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="vl-video-info">
                  <div className="vl-video-header">
                    <h6 className="vl-video-name">{video.name}</h6>
                    <div className="vl-dropdown">
                      <button
                        className="vl-dropdown-btn"
                        onClick={() => toggleDropdown(video.id)}
                      >
                        <FaEllipsisV />
                      </button>
                      {openDropdown === video.id && (
                        <div className="vl-dropdown-menu">
                          <button onClick={() => handlePreview(video)}>
                            <FaEye /> Preview
                          </button>
                          <button onClick={() => handleEdit(video)}>
                            <FaEdit /> Edit
                          </button>
                          <button onClick={() => handleLinkQR(video)}>
                            <FaLink /> Link to QR
                          </button>
                          <button className="vl-danger" onClick={() => handleDelete(video.id)}>
                            <FaTrash /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="vl-video-meta">
                    <span>{video.size}</span>
                    <span className="vl-dot">•</span>
                    <span>{video.uploadedDate}</span>
                  </div>
                  <div className="vl-linked-info">
                    <FaLink className="vl-link-icon" />
                    <span>{video.linkedQR} QR Linked</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="vl-video-actions">
                  <button className="thm-btn outline w-50" onClick={() => handleEdit(video)}>Replace</button>
                  <button className="thm-btn w-50" onClick={() => handleLinkQR(video)}>Link to QR</button>
                </div>
              </div>
            </div>
          ))}

          {/* Upload Card */}
          <div className="col-sm-12 col-md-6 col-lg-3 mb-4">
            <div className="vl-upload-card" onClick={() => setShowUploadModal(true)}>
              <div className="vl-upload-icon">
                <FaPlus />
              </div>
              <h6 className="vl-upload-title">Upload New Video</h6>
              <p className="vl-upload-desc">MP4, MOV up to 500 MB or paste YouTube/Vimeo URL</p>
            </div>
          </div>
        </div>

        {/* Pagination */}
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

      {/* Video Preview Modal */}
      {showPreviewModal && selectedVideo && (
        <div className="vl-preview-overlay">
          <div className="vl-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vl-preview-header">
              <h5 className="vl-preview-title">{selectedVideo.name}</h5>
              <button className="cmp-back-btn" onClick={() => setShowPreviewModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="vl-preview-body">
              {selectedVideo.videoType === 'youtube' || selectedVideo.videoType === 'vimeo' ? (
                <iframe
                  className="vl-preview-video"
                  src={`${selectedVideo.videoUrl}?autoplay=1`}
                  frameBorder="0"
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                  style={{ width: '100%', height: '100%', borderRadius: '12px' }}
                />
              ) : (
                <video
                  className="vl-preview-video"
                  controls
                  autoPlay
                  src={selectedVideo.videoUrl}
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
            <div className="vl-preview-footer">
              <div className="vl-preview-info">
                <span>{selectedVideo.duration}</span>
                <span className="vl-dot">•</span>
                <span>{selectedVideo.size}</span>
                <span className="vl-dot">•</span>
                <span>{selectedVideo.linkedQR} QR Linked</span>
              </div>
              <div className="vl-preview-actions">
                <button className="thm-btn outline" onClick={() => window.open(selectedVideo.videoUrl, '_blank')}>
                  <FaExternalLinkAlt /> Open in New Tab
                </button>
                <button className="thm-btn" onClick={() => handleLinkQR(selectedVideo)}>
                  <FaLink /> Link to QR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <VideoUploadModal
        show={showUploadModal}
        onClose={(success) => {
          setShowUploadModal(false);
          if (success) fetchVideos();
        }}
      />

      <EditVideoModal
        show={showEditModal}
        video={selectedVideo}
        onClose={(success) => {
          setShowEditModal(false);
          if (success) fetchVideos();
        }}
      />

      <LinkQRModal
        show={showLinkModal}
        video={selectedVideo}
        onClose={() => setShowLinkModal(false)}
      />
    </>
  );
};

export default VideoLibrary;
