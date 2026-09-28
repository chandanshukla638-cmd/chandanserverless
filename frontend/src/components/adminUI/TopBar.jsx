import React, { useState, useRef, useEffect } from 'react';
import { FaSearch, FaBell, FaAngleDown, FaBars, FaTruck, FaQrcode, FaCalendarCheck, FaChartLine, FaUserPlus, FaUser, FaCog, FaSignOutAlt, FaQuestionCircle } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const TopBar = ({ _title, onToggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const loadAvatar = () => {
      setAvatar(localStorage.getItem('akksys_avatar') || null);
    };
    loadAvatar();

    window.addEventListener('avatarUpdated', loadAvatar);
    window.addEventListener('focus', loadAvatar);
    return () => {
      window.removeEventListener('avatarUpdated', loadAvatar);
      window.removeEventListener('focus', loadAvatar);
    };
  }, []);

  const [notifications, setNotifications] = useState([]);

  const getSeenIds = () => {
    try {
      return JSON.parse(localStorage.getItem('akksys_seen_notifs') || '[]');
    } catch {
      return [];
    }
  };

  const markAsSeen = (id) => {
    setSeenIds(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      localStorage.setItem('akksys_seen_notifs', JSON.stringify(updated));
      return updated;
    });
  };

  const [seenIds, setSeenIds] = useState(() => getSeenIds());

  // Refetch on every admin page change so the badge stays current
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/user/admin-notifications?limit=50');
        setSeenIds(getSeenIds());
        const formatted = res.data.map((item) => {
          let icon, iconBg, text;
          if (item.type === 'scan') {
            icon = <FaQrcode />;
            iconBg = '#00C8FF';
            text = `New scan on "${item.qr_name}" QR code${item.city ? ` from ${item.city}` : ''}`;
          } else {
            icon = <FaCalendarCheck />;
            iconBg = '#10b981';
            text = `New Campaign "${item.qr_name}" was created`;
          }

          const diffMs = Date.now() - new Date(item.time).getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMins / 60);
          const diffDays = Math.floor(diffHours / 24);

          let timeStr = 'Just now';
          if (diffMins > 0 && diffMins < 60) timeStr = `${diffMins} min ago`;
          else if (diffHours > 0 && diffHours < 24) timeStr = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
          else if (diffDays > 0) timeStr = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

          return {
            id: `${item.type}-${item.id}`,
            icon,
            iconBg,
            text,
            time: timeStr
          };
        });
        setNotifications(formatted);
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    };
    fetchNotifs();
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim() === '') {
        setSearchResults([]);
        setShowResults(false);
        return;
      }
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data);
        setShowResults(true);
      } catch (err) {
        console.error('Search failed', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogout = () => {
    setShowProfile(false);
    logout();
    navigate('/login');
  };

  const visibleNotifications = notifications.filter(n => !seenIds.includes(n.id));
  const unreadCount = visibleNotifications.length;
  const dropdownNotifications = visibleNotifications.slice(0, 6);

  return (
    <header className="admin-topbar d-flex justify-content-between align-items-center sticky-top topbar-header">
      
      {/* Left: Page Title & Mobile Menu Toggle */}
      <div className="d-flex align-items-center gap-3">
        <button 
          className=" mobile-sidebar-toggle-btn"
          onClick={onToggleSidebar}
        >
          <FaBars />
        </button>
           <div className="topbar-search-wrapper d-none d-md-block" ref={searchRef}>
          <FaSearch className="topbar-search-icon" size={14} />
          <input 
            type="text" 
            className="topbar-search-input" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchQuery.trim()) setShowResults(true); }}
          />
          {showResults && (
            <div className="search-dropdown-menu">
              {searchResults.length > 0 ? (
                searchResults.map(res => (
                  <div key={`${res.type}-${res.id}`} 
                       className="search-dropdown-item" 
                       onClick={() => {
                         setShowResults(false);
                         setSearchQuery('');
                         if (res.type === 'campaign') navigate('/admin/campaign-history');
                         else if (res.type === 'box') navigate('/admin/pack-mode');
                         else navigate(`/admin/dynamic-qr/${res.id}`);
                       }}
                       >
                    <div className="topbar-search-item-info">
                      <div className="topbar-search-item-name">{res.name}</div>
                      <div className="topbar-search-item-type">{res.type}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="search-dropdown-empty">
                  No results found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Right: Actions, Search, Profile */}
      <div className="d-flex align-items-center gap-3">
        
        <div className="d-flex align-items-center gap-2">
          {/* Notification Bell Dropdown */}
          <div className="notif-bell-wrapper" ref={notifRef}>
            <div className="notif-bell" onClick={() => {
              setShowNotifications(!showNotifications);
            }}>
              <FaBell size={18} className="text-white" />
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </div>

            {showNotifications && (
              <div className="notif-dropdown">
                <div className="notif-dropdown-header">
                  <h6 className="notif-dropdown-title">Notifications</h6>
                  <span className="notif-dropdown-count">{unreadCount} New</span>
                </div>
                <div className="notif-dropdown-list">
                  {dropdownNotifications.length === 0 ? (
                    <div className="notif-dropdown-empty">No new notifications</div>
                  ) : (
                    dropdownNotifications.map((notif) => (
                      <div key={notif.id} className="notif-dropdown-item notif-dropdown-item-unread" onClick={() => markAsSeen(notif.id)}>
                        <span className="notif-dropdown-unread-dot"></span>
                        <div className="notif-item-icon" style={{ background: `${notif.iconBg}15`, color: notif.iconBg }}>
                          {notif.icon}
                        </div>
                        <div className="notif-item-content">
                          <p className="notif-item-text">{notif.text}</p>
                          <span className="notif-item-time">{notif.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="notif-dropdown-footer">
                  <button 
                    className="thm-btn w-100"
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/admin/notifications');
                    }}
                  >
                    See All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="profile-dropdown-wrapper" ref={profileRef}>
            <div className="d-flex align-items-center gap-2 topbar-profile-container" onClick={() => setShowProfile(!showProfile)}>
              {avatar ? (
                <img src={avatar} alt="Avatar" className="rounded-circle topbar-profile-avatar" style={{ objectFit: 'cover' }} />
              ) : (
                <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white topbar-profile-avatar">
                  {getInitials(user?.name)}
                </div>
              )}
              <div className="d-none d-sm-block text-start">
                <div className="fw-semibold topbar-profile-name">{user?.name || 'User'}</div>
                <div className="topbar-profile-role">{user?.role === 'superadmin' ? 'Superadmin' : 'Admin'}</div>
              </div>
              <FaAngleDown size={14} className={`text-white profile-arrow ${showProfile ? 'rotate' : ''}`} />
            </div>

            {showProfile && (
              <div className="profile-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="profile-dropdown-header">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="profile-dropdown-avatar" style={{ objectFit: 'cover' }} />
                  ) : (
                    <div className="profile-dropdown-avatar">{getInitials(user?.name)}</div>
                  )}
                  <div className="profile-dropdown-info">
                    <div className="profile-dropdown-name">{user?.name || 'User'}</div>
                    <div className="profile-dropdown-email">{user?.email || ''}</div>
                  </div>
                </div>
                <div className="profile-dropdown-divider"></div>
                <div className="profile-dropdown-menu">
                  <button className="profile-dropdown-item" onClick={() => { navigate('/admin/settings'); setShowProfile(false); }}>
                    <FaUser className="profile-dropdown-icon" />
                    <span>My Profile</span>
                  </button>
                  <button className="profile-dropdown-item" onClick={() => { navigate('/admin/settings'); setShowProfile(false); }}>
                    <FaCog className="profile-dropdown-icon" />
                    <span>Account Settings</span>
                  </button>
                  <button className="profile-dropdown-item" onClick={() => setShowProfile(false)}>
                    <FaQuestionCircle className="profile-dropdown-icon" />
                    <span>Help & Support</span>
                  </button>
                </div>
                <div className="profile-dropdown-divider"></div>
                <div className="profile-dropdown-menu">
                  <button className="profile-dropdown-item logout" onClick={handleLogout}>
                    <FaSignOutAlt className="profile-dropdown-icon" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};

export default TopBar;
