import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';
import {
  FaDownload, FaEdit, FaTrash, FaArrowLeft, FaCopy, FaEye,
  FaChartLine, FaMousePointer, FaGlobeAsia,
  FaHistory, FaToggleOn, FaToggleOff, FaArrowUp, FaBox, FaCalendarAlt
} from 'react-icons/fa';
import { QRCodeCanvas } from 'qrcode.react';
import QRDownloadModal from '../../components/adminUI/QRDownloadModal';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Loader from './Loader';
import '../../styles/Overview.css';
import '../../styles/QRDetail.css';
import '../../styles/DynamicQR.css';

const QRDetail = () => {
  const { qrId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analytics');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [versionHistory, setVersionHistory] = useState([]);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [analyticsData, setAnalyticsData] = useState({ weeklyData: [], deviceData: [], locations: [] });
  const [dailyRange, setDailyRange] = useState('30');
  const [dailyData, setDailyData] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const logoInputRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [qrRes, campRes] = await Promise.all([
        api.get('/qr'),
        api.get('/campaign'),
      ]);

      const qr = qrRes.data.find(q => q.qr_id === qrId);
      if (!qr) {
        toast.error('QR code not found');
        navigate('/admin/dynamic-qr');
        return;
      }

      const totalScans = parseInt(qr.total_scans) || 0;
      const uniqueScans = parseInt(qr.unique_scans) || 0;
      const ctaClicks = parseInt(qr.cta_clicks) || 0;
      const ctr = totalScans > 0 ? ((ctaClicks / totalScans) * 100).toFixed(1) : '0.0';

      const scansLast7 = parseInt(qr.scans_last_7) || 0;
      const scansPrev7 = parseInt(qr.scans_prev_7) || 0;
      const uniqueLast7 = parseInt(qr.unique_last_7) || 0;
      const uniquePrev7 = parseInt(qr.unique_prev_7) || 0;
      const ctaLast7 = parseInt(qr.cta_last_7) || 0;
      const ctaPrev7 = parseInt(qr.cta_prev_7) || 0;

      const calcChange = (curr, prev) => {
        if (prev === 0) return curr > 0 ? { change: '+100.0%', trend: 'up' } : { change: '0.0%', trend: 'up' };
        const diff = curr - prev;
        const pct = (diff / prev) * 100;
        return { change: `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`, trend: pct >= 0 ? 'up' : 'down' };
      };

      const scansStats = calcChange(scansLast7, scansPrev7);
      const uniqueStats = calcChange(uniqueLast7, uniquePrev7);
      const ctaStats = calcChange(ctaLast7, ctaPrev7);

      const ctrLast7 = scansLast7 > 0 ? (ctaLast7 / scansLast7) * 100 : 0;
      const ctrPrev7 = scansPrev7 > 0 ? (ctaPrev7 / scansPrev7) * 100 : 0;
      const ctrDiff = ctrLast7 - ctrPrev7;
      const ctrStats = {
        change: `${ctrDiff > 0 ? '+' : ''}${ctrDiff.toFixed(1)}%`,
        trend: ctrDiff >= 0 ? 'up' : 'down'
      };

      setQrData({
        id: qr.id,
        qrId: qr.qr_id,
        name: qr.name,
        url: `${window.location.host}/r/${qr.qr_id}`,
        created: new Date(qr.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: qr.status,
        totalScans,
        uniqueScans,
        ctaClicks,
        ctr,
        scansChange: scansStats.change,
        scansTrend: scansStats.trend,
        uniqueChange: uniqueStats.change,
        uniqueTrend: uniqueStats.trend,
        ctaChange: ctaStats.change,
        ctaTrend: ctaStats.trend,
        ctrChange: ctrStats.change,
        ctrTrend: ctrStats.trend,
        currentVideoUrl: qr.current_video_url || '—',
        ctaDestination: qr.cta_destination || '—',
        logoUrl: qr.logo_url || null,
        lifecycleStatus: qr.lifecycle_status || 'generated',
        firstScanAt: qr.first_scan_at || null,
        printedAt: qr.printed_at || null,
        packedAt: qr.packed_at || null,
        soldAt: qr.sold_at || null,
        boxNumber: qr.box_number || null,
        qrSerialNumber: qr.qr_serial_number || null,
      });
      setNewName(qr.name);

      const qrCampaigns = campRes.data.filter(c => c.qr_id === qrId || c.qr_id === qr.id);
      setCampaigns(qrCampaigns);

      try {
        const analyticsRes = await api.get(`/analytics/qr/${qr.id}`);
        setAnalyticsData(analyticsRes.data);
      } catch (err) {
        console.error('Failed to fetch detailed analytics', err);
      }

      if (qrCampaigns.length > 0) {
        const versionsPromises = qrCampaigns.map(c => api.get(`/campaign/${c.id}`));
        const versionsRes = await Promise.all(versionsPromises);
        const allVersions = [];
        versionsRes.forEach((res) => {
          const camp = res.data;
          (camp.versions || []).forEach(v => {
            allVersions.push({
              version: `v${v.version_number}`,
              campaign: camp.name,
              date: new Date(v.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              video: v.video_url || '—',
              cta: v.cta_text ? `${v.cta_text} → ${v.cta_destination || ''}` : '—',
              scans: parseInt(v.total_scans) || 0,
              status: v.is_active ? 'active' : 'completed',
            });
          });
        });
        allVersions.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
        setVersionHistory(allVersions);
      }
    } catch (err) {
      console.error('Failed to fetch QR detail', err);
      toast.error('Failed to load QR data');
    } finally {
      setLoading(false);
    }
  }, [qrId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const qrInternalId = qrData?.id;
  useEffect(() => {
    if (!qrInternalId) return;
    let cancelled = false;
    setDailyLoading(true);
    api.get(`/analytics/qr/${qrInternalId}/daily`, { params: { days: dailyRange } })
      .then(res => { if (!cancelled) setDailyData(res.data || []); })
      .catch(err => {
        console.error('Failed to fetch date-wise scans', err);
        if (!cancelled) setDailyData([]);
      })
      .finally(() => { if (!cancelled) setDailyLoading(false); });
    return () => { cancelled = true; };
  }, [qrInternalId, dailyRange]);

  const handleToggle = async () => {
    if (!qrData) return;
    try {
      await api.put(`/qr/${qrData.id}/toggle`);
      setQrData(prev => ({
        ...prev,
        status: prev.status === 'active' ? 'paused' : 'active',
      }));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!qrData) return;
    if (!window.confirm('Are you sure you want to delete this QR code? This action cannot be undone.')) return;
    try {
      await api.delete(`/qr/${qrData.id}`);
      toast.success('QR code deleted');
      navigate('/admin/dynamic-qr');
    } catch {
      toast.error('Failed to delete QR code');
    }
  };

  const handleSaveName = async () => {
    if (!qrData || !newName.trim()) return;
    try {
      await api.put(`/qr/${qrData.id}`, { name: newName.trim() });
      setQrData(prev => ({ ...prev, name: newName.trim() }));
      setEditingName(false);
      toast.success('Name updated');
    } catch {
      toast.error('Failed to update name');
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`https://${qrData?.url}`);
    toast.success('URL copied!');
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      try {
        await api.put(`/qr/${qrData.id}`, { logo_url: dataUrl });
        setQrData(prev => ({ ...prev, logoUrl: dataUrl }));
        toast.success('Logo updated');
      } catch {
        toast.error('Failed to update logo');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleLogoRemove = async () => {
    try {
      await api.put(`/qr/${qrData.id}`, { logo_url: null });
      setQrData(prev => ({ ...prev, logoUrl: null }));
      toast.success('Logo removed');
    } catch {
      toast.error('Failed to remove logo');
    }
  };

  const handleLifecycleUpdate = async (newStatus) => {
    if (!qrData) return;
    try {
      await api.put(`/pack/lifecycle/${qrData.id}`, { status: newStatus });
      setQrData(prev => ({
        ...prev,
        lifecycleStatus: newStatus,
        ...(newStatus === 'printed' ? { printedAt: new Date().toISOString() } : {}),
        ...(newStatus === 'packed' ? { packedAt: new Date().toISOString() } : {}),
        ...(newStatus === 'sold' ? { soldAt: new Date().toISOString() } : {}),
      }));
      toast.success(`Status updated to ${newStatus.toUpperCase()}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  if (loading) return <Loader />;
  if (!qrData) return null;

  const weeklyData = analyticsData.weeklyData.length > 0 ? analyticsData.weeklyData : [
    { day: 'Mon', scans: 0, clicks: 0 },
    { day: 'Tue', scans: 0, clicks: 0 },
    { day: 'Wed', scans: 0, clicks: 0 },
    { day: 'Thu', scans: 0, clicks: 0 },
    { day: 'Fri', scans: 0, clicks: 0 },
    { day: 'Sat', scans: 0, clicks: 0 },
    { day: 'Sun', scans: 0, clicks: 0 },
  ];

  const chartOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: 'Poppins, sans-serif',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4,
        borderRadiusApplication: 'end',
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 0 },
    xaxis: {
      categories: weeklyData.map(d => d.date || d.day),
      labels: { style: { fontSize: '12px', fontWeight: 500, colors: '#49636F' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { fontSize: '12px', fontWeight: 500, colors: '#49636F' } },
    },
    grid: {
      borderColor: '#B8EEFF',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: -10, bottom: -5 },
    },
    colors: ['#00C8FF', '#0077FF'],
    legend: { show: false },
    tooltip: {
      theme: 'light',
      style: { fontSize: '12px', fontFamily: 'Poppins, sans-serif' },
    },
  };

  const chartSeries = [
    { name: 'Scans', data: weeklyData.map(d => d.scans) },
    { name: 'CTA Clicks', data: weeklyData.map(d => d.clicks) },
  ];

  const deviceData = analyticsData.deviceData.length > 0 ? analyticsData.deviceData : [
    { type: 'No Data', percent: 100, color: '#e0e0e0' }
  ];

  const donutOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'Poppins, sans-serif',
    },
    plotOptions: {
      donut: {
        size: '72%',
        donut: { size: '60%' },
      },
    },
    dataLabels: { enabled: false },
    labels: deviceData.map(d => d.type),
    colors: ['#00C8FF', '#0077FF', '#4DDCFF'],
    legend: { show: false },
    tooltip: {
      theme: 'light',
      style: { fontSize: '12px', fontFamily: 'Poppins, sans-serif' },
      y: { formatter: (val) => `${val}%` },
    },
    stroke: { width: 2, colors: ['#E6F9FF'] },
    states: { hover: { filter: { type: 'none' } } },
  };

  const donutSeries = deviceData.map(d => d.percent);

  const locations = analyticsData.locations.length > 0 ? analyticsData.locations : [];

  const stats = [
    {
      title: 'TOTAL SCANS',
      value: qrData.totalScans.toLocaleString(),
      change: qrData.scansChange,
      trend: qrData.scansTrend,
      color: 'primary',
      icon: <FaChartLine />,
    },
    {
      title: 'UNIQUE SCANS',
      value: qrData.uniqueScans.toLocaleString(),
      change: qrData.uniqueChange,
      trend: qrData.uniqueTrend,
      color: 'blue',
      icon: <FaGlobeAsia />,
    },
    {
      title: 'CTA CLICKS',
      value: qrData.ctaClicks.toLocaleString(),
      change: qrData.ctaChange,
      trend: qrData.ctaTrend,
      color: 'orange',
      icon: <FaMousePointer />,
    },
    {
      title: 'CTR',
      value: `${qrData.ctr}%`,
      change: qrData.ctrChange,
      trend: qrData.ctrTrend,
      color: 'green',
      icon: <FaChartLine />,
    },
  ];

  const currentCampaign = campaigns.find(c => c.status === 'active') || campaigns[0] || null;

  return (
    <>
      <div className="ov-wrapper">
        {/* Header */}
        <div className="ov-header">
          <div className="d-flex align-items-center gap-3">
            <button className="cmp-back-btn" onClick={() => navigate('/admin/dynamic-qr')}>
              <FaArrowLeft />
            </button>
            <div>
              {editingName ? (
                <div className="d-flex align-items-center gap-2">
                  <div className='custom-frm-bx mb-2'>
                    <input
                    type="text"
                    className="form-control"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setEditingName(false); setNewName(qrData.name); } }}
                    autoFocus
                    style={{ maxWidth: '300px' }}
                  />
                  </div>
                  <button className="thm-btn" style={{ padding: '6px 12px' }} onClick={handleSaveName}>Save</button>
                  <button className="thm-btn outline" style={{ padding: '6px 12px' }} onClick={() => { setEditingName(false); setNewName(qrData.name); }}>Cancel</button>
                </div>
              ) : (
                <h4 className="ov-page-title">
                  {qrData.name}
                  <FaEdit
                    size={14}
                    style={{ cursor: 'pointer', marginLeft: '8px', opacity: 0.6 }}
                    onClick={() => setEditingName(true)}
                  />
                </h4>
              )}
              <div className="ov-page-subtitle">
                <span className="ov-url-badge" onClick={handleCopyUrl}>
                  <FaCopy size={10} /> {qrData.url}
                </span>
              </div>
            </div>
          </div>
          <div className="ov-header-actions qr-ov-section">
            <button className="thm-btn outline" onClick={() => setShowDownloadModal(true)}>
              <FaDownload /> Download QR
            </button>
            <a
              href={`https://${qrData.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="thm-btn outline"
              style={{ textDecoration: 'none' }}
            >
              <FaEye /> Preview
            </a>
            {qrData.status === 'active' ? (
              <button className="thm-lg-btn ov-btn-danger" onClick={handleToggle}>
                <FaToggleOff /> Deactivate
              </button>
            ) : (
              <button className="thm-lg-btn ov-btn-success" onClick={handleToggle}>
                <FaToggleOn /> Activate
              </button>
            )}
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
                <div className="ov-stat-footer">
                  <span className={`ov-stat-change ${stat.trend}`}>
                    <FaArrowUp /> {stat.change}
                  </span>
                  <span className="ov-stat-label">vs last week</span>
                </div>
                <div className={`ov-stat-bar ${stat.color}`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Lifecycle Status */}
        <div className="ov-card mb-3 h-auto">
          <div className="ov-card-header">
            <div>
              <h6 className="ov-card-title"><FaBox className="me-2" /> Lifecycle Status</h6>
              <div className="lc-info-row">
                {qrData.qrSerialNumber && (
                  <span className="lc-info-item">Serial: <strong>{qrData.qrSerialNumber}</strong></span>
                )}
                {qrData.boxNumber && (
                  <span className="lc-info-item">Box: <strong>{qrData.boxNumber}</strong></span>
                )}
              </div>
            </div>
          </div>
          <div className="ov-card-body">
            <div className="lc-stages">
              {['generated', 'printed', 'packed', 'sold'].map((stage, i) => {
                const stageOrder = ['generated', 'printed', 'packed', 'sold'];
                const currentIdx = stageOrder.indexOf(qrData.lifecycleStatus);
                const isActive = i <= currentIdx;
                const isCurrent = stageOrder[i] === qrData.lifecycleStatus;
                const timestamps = {
                  generated: null,
                  printed: qrData.printedAt,
                  packed: qrData.packedAt,
                  sold: qrData.soldAt,
                };
                return (
                  <React.Fragment key={stage}>

                    

                    <div className="lc-stage">
                       {/* {timestamps[stage] && (
                        <span className="lc-stage-time">
                          {new Date(timestamps[stage]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </span>
                      )} */}

                      <div className={`lc-stage-circle ${isCurrent ? 'current' : isActive ? 'active' : ''}`}>
                        {i + 1}
                      </div>
                      <span className={`lc-stage-label ${isCurrent ? 'current' : isActive ? 'active' : ''}`}>
                        {stage.toUpperCase()}
                      </span>
                      {/* {timestamps[stage] && (
                        <span className="lc-stage-time">
                          {new Date(timestamps[stage]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </span>
                      )} */}
                    </div>
                    {i < 3 && (
                      <div className={`lc-connector ${i < currentIdx ? 'active' : ''}`}></div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            <div className="lc-actions">
              {qrData.lifecycleStatus === 'generated' && (
                <button className="thm-btn" onClick={() => handleLifecycleUpdate('printed')}>
                  Mark as Printed
                </button>
              )}
              {qrData.lifecycleStatus === 'printed' && (
                <button className="thm-btn" onClick={() => handleLifecycleUpdate('packed')}>
                  Mark as Packed
                </button>
              )}
              {qrData.lifecycleStatus === 'packed' && (
                <button className="thm-btn" onClick={() => handleLifecycleUpdate('sold')}>
                  Mark as Sold
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="ov-tabs mb-3">
          <button
            className={`ov-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <FaChartLine /> Analytics
          </button>
          <button
            className={`ov-tab ${activeTab === 'versions' ? 'active' : ''}`}
            onClick={() => setActiveTab('versions')}
          >
            <FaHistory /> Version History
          </button>
          <button
            className={`ov-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <FaEdit /> Settings
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'analytics' && (
          <div className="row">
            {/* Daily Scans Chart */}
            <div className="col-md-6 col-lg-6 col-sm-12 mb-3">
              <div className="ov-card ov-chart-card">
                <div className="ov-card-header">
                  <div>
                    <h6 className="ov-card-title">Daily Scans & CTA Clicks</h6>
                    <p className="ov-card-subtitle">Last 7 Days Performance</p>
                  </div>
                  <div className="ov-legend">
                    <span className="ov-legend-item">
                      <span className="ov-dot primary"></span>Scans
                    </span>
                    <span className="ov-legend-item">
                      <span className="ov-dot accent"></span>CTA Clicks
                    </span>
                  </div>
                </div>
                <div className="ov-apex-chart">
                  <Chart
                    options={chartOptions}
                    series={chartSeries}
                    type="bar"
                    height={270}
                  />
                </div>
              </div>
            </div>

            {/* Device Split */}
            <div className="col-md-6 col-lg-6 col-sm-12 mb-3">
              <div className="ov-card ov-chart-card">
                <div className="ov-card-header">
                  <div>
                    <h6 className="ov-card-title">Device Split</h6>
                    <p className="ov-card-subtitle">By Platform</p>
                  </div>
                </div>
                <div className="ov-apex-chart">
                  <Chart
                    options={donutOptions}
                    series={donutSeries}
                    type="donut"
                    height={180}
                  />
                  <div className="ov-donut-total">
                    <span className="ov-donut-total-value">{qrData.totalScans.toLocaleString()}</span>
                    <span className="ov-donut-total-label">Total Scans</span>
                  </div>
                </div>
                <div className="ov-device-list">
                  {deviceData.map((device, i) => (
                    <div key={i} className="ov-device-item">
                      <div className="ov-device-info">
                        <span className="ov-dot" style={{ background: device.color }}></span>
                        <span className="ov-device-name">{device.type}</span>
                      </div>
                      <span className="ov-device-percent">{device.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Locations */}
            <div className="col-12 col-lg-6 mb-3">
              <div className="ov-card">
                <div className="ov-card-header">
                  <div>
                    <h6 className="ov-card-title"><FaGlobeAsia className="me-2" /> Top Locations</h6>
                    <p className="ov-card-subtitle">Where your scans are coming from</p>
                  </div>
                </div>
                <div className="ov-locations-list">
                  {locations.length === 0 ? (
                    <div className="text-center py-4" >
                      <p style={{color : "#eee"}}>No location data available yet.</p>
                    </div>
                  ) : (
                    locations.map((loc, i) => (
                      <div key={i} className="ov-location-item">
                        <div className="ov-location-info">
                          <span className="ov-location-city">{loc.city}</span>
                          <span className="ov-location-badge">IN</span>
                        </div>
                        <div className="ov-location-stats">
                          <div className="ov-location-bar-bg">
                            <div className="ov-location-bar" style={{ width: `${loc.percent}%` }}></div>
                          </div>
                          <div className="ov-location-numbers">
                            <span className="ov-location-scans">{loc.scans.toLocaleString()}</span>
                            <span className="ov-location-percent">{loc.percent}%</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* CTA Performance */}
            <div className="col-12 col-lg-6 mb-3">
              <div className="ov-card ov-chart-card">
                <div className="ov-card-header">
                  <div>
                    <h6 className="ov-card-title"><FaMousePointer className="me-2" /> CTA Performance</h6>
                    <p className="ov-card-subtitle">Click-through Analysis</p>
                  </div>
                </div>
                <div className="ov-cta-info">
                  <div className="ov-cta-logo">{(currentCampaign?.name || 'B').charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="ov-cta-text">{currentCampaign?.name || 'No Campaign'} →</div>
                    <div className="ov-cta-dest">{qrData.ctaDestination}</div>
                  </div>
                  <div className="ov-cta-clicks">
                    <span className="ov-cta-clicks-value">{qrData.ctaClicks}</span>
                    <span className="ov-cta-clicks-label">clicks</span>
                  </div>
                </div>
                <div className="ov-apex-chart" style={{ height: '150px' }}>
                  <Chart
                    options={{
                      ...chartOptions,
                      colors: ['#00C8FF'],
                      xaxis: {
                        ...chartOptions.xaxis,
                        categories: weeklyData.map(d => d.date || d.day),
                      },
                    }}
                    series={[{ name: 'Clicks', data: weeklyData.map(d => d.clicks) }]}
                    type="bar"
                    height={120}
                  />
                </div>
              </div>
            </div>

            {/* Date-wise Scans */}
            <div className="col-12 mb-3">
              <div className="ov-card h-auto">
                <div className="ov-card-header">
                  <div>
                    <h6 className="ov-card-title"><FaCalendarAlt className="me-2" /> Date-wise Scans</h6>
                    <p className="ov-card-subtitle">
                      {dailyData.reduce((sum, d) => sum + d.scans, 0).toLocaleString()} scans in selected range
                    </p>
                  </div>
                  <select className="ov-date-select" value={dailyRange} onChange={(e) => setDailyRange(e.target.value)}>
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 90 Days</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
                <div className="dq-table-wrapper" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                  <table className="dq-table" style={{ minWidth: '480px' }}>
                    <thead>
                      <tr>
                        <th className="dq-th" style={{ position: 'sticky', top: 0, zIndex: 1 }}>Date</th>
                        <th className="dq-th" style={{ position: 'sticky', top: 0, zIndex: 1 }}>Scans</th>
                        <th className="dq-th" style={{ position: 'sticky', top: 0, zIndex: 1 }}>Unique</th>
                        <th className="dq-th" style={{ position: 'sticky', top: 0, zIndex: 1 }}>CTA Clicks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyLoading ? (
                        <tr><td colSpan="4" className="text-center" style={{ color: '#ddd', height: '120px' }}>Loading...</td></tr>
                      ) : dailyData.length === 0 ? (
                        <tr><td colSpan="4" className="text-center" style={{ color: '#ddd', height: '120px' }}>No scan data available yet.</td></tr>
                      ) : (
                        dailyData.map((d) => (
                          <tr key={d.date} className="dq-tr" style={d.scans === 0 ? { opacity: 0.5 } : undefined}>
                            <td>{new Date(`${d.date}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td>{d.scans.toLocaleString()}</td>
                            <td>{d.unique.toLocaleString()}</td>
                            <td>{d.clicks.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'versions' && (
          <div className="ov-card h-auto">
            <div className="ov-card-header">
              <div>
                <h6 className="ov-card-title"><FaHistory className="me-2" /> Campaign & Version History</h6>
                <p className="ov-card-subtitle">QR ID remains permanent across all versions</p>
              </div>
            </div>
            {versionHistory.length === 0 ? (
              <div className="ov-card-body text-center py-4" style={{ color: '#8892a4' }}>
                <FaHistory size={32} className="mb-2" style={{ opacity: 0.4 }} />
                <p>No version history yet. Create a campaign to get started.</p>
              </div>
            ) : (
              <div className="ov-timeline">
                {versionHistory.map((version, i) => (
                  <div key={i} className={`ov-timeline-item ${version.status === 'active' ? 'active' : ''}`}>
                    <div className="ov-timeline-marker">
                      <div className={`ov-timeline-dot ${version.status === 'active' ? 'active' : ''}`}></div>
                      {i < versionHistory.length - 1 && <div className="ov-timeline-line"></div>}
                    </div>
                    <div className="ov-timeline-content">
                      <div className="ov-timeline-header">
                        <div>
                          <span className={`ov-timeline-badge ${version.status === 'active' ? 'current' : 'past'}`}>
                            {version.status === 'active' ? 'CURRENT' : 'PAST'}
                          </span>
                          <div className="ov-timeline-title">{version.campaign}</div>
                        </div>
                        <span className="ov-timeline-date">{version.date}</span>
                      </div>
                      <div className="ov-timeline-details">
                        <span className="ov-timeline-detail">
                          Video: <strong>{version.video}</strong>
                        </span>
                        <span className="ov-timeline-detail">
                          CTA: <strong>{version.cta}</strong>
                        </span>
                        <span className="ov-timeline-detail">
                          Scans: <strong>{version.scans.toLocaleString()}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="row">
            <div className="col-lg-6 col-md-6 col-sm-12 mb-3">
              <div className="ov-card mb-3 h-auto">
                <div className="ov-card-header">
                  <div>
                    <h6 className="ov-card-title">QR Code Details</h6>
                    <p className="ov-card-subtitle">Manage your QR code settings</p>
                  </div>
                </div>
                <div className="ov-card-body">
                  <div className="custom-frm-bx">
                    <label className="">QR Name</label>
                    <div className="d-flex gap-2">
                      <input
                        type="text"
                        className="form-control"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={() => { if (newName !== qrData.name) handleSaveName(); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' && newName !== qrData.name) handleSaveName(); }}
                      />
                    </div>
                  </div>
                  <div className="custom-frm-bx">
                    <label className="">QR Short URL</label>
                    <div className="input-group">
                      <span className="input-group-text qr-short-title border-0">https://</span>
                      <input type="text" className="form-control" value={qrData.url} readOnly />
                    </div>
                  </div>
                  <div className="custom-frm-bx mb-0">
                    <label className="">Brand Logo</label>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleLogoUpload}
                    />
                    <div className="d-flex align-items-center gap-3">
                      {qrData.logoUrl ? (
                        <img
                          src={qrData.logoUrl}
                          alt="Logo"
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', background: '#fff', padding: '4px' }}
                        />
                      ) : (
                        <div className="ov-logo-box">AK</div>
                      )}
                      <button className="thm-btn outline" onClick={() => logoInputRef.current?.click()}>Change Logo</button>
                      {qrData.logoUrl && (
                        <button className="thm-lg-btn ov-btn-danger" onClick={handleLogoRemove}>Remove</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="ov-card h-auto">
                <div className="ov-card-header">
                  <div>
                    <h6 className="ov-card-title">Current Campaign</h6>
                    <p className="ov-card-subtitle">Video and CTA settings</p>
                  </div>
                </div>
                <div className="ov-card-body">
                  <div className="custom-frm-bx">
                    <label className="">Video Source</label>
                    <input type="text" className="form-control" value={qrData.currentVideoUrl} readOnly />
                  </div>
                  <div className="custom-frm-bx mb-0">
                    <label className="">Current Campaign</label>
                    <input type="text" className="form-control" value={currentCampaign?.name || 'No campaign'} readOnly />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6 col-md-6 col-sm-12 mb-3">
              <div className="ov-card mb-3 h-auto">
                <div className="ov-card-header">
                  <div>
                    <h6 className="ov-card-title">QR Preview</h6>
                    <p className="ov-card-subtitle">Your QR code</p>
                  </div>
                </div>
                <div className="ov-card-body">
                  <div className="ov-qr-preview">
                    <div className="ov-qr-preview-inner">
                      <QRCodeCanvas
                        value={`https://${qrData.url}`}
                        size={150}
                        level="H"
                        bgColor="#ffffff"
                        fgColor="#0f1629"
                        imageSettings={qrData.logoUrl ? {
                          src: qrData.logoUrl,
                          height: 30,
                          width: 30,
                          excavate: true,
                        } : undefined}
                      />
                      {!qrData.logoUrl && (
                        <div className="ov-qr-preview-logo">
                          <div className="ov-qr-preview-logo-inner">AK</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="d-grid gap-2">
                    <button className="thm-btn outline w-100" onClick={() => setShowDownloadModal(true)}>
                      <FaDownload /> Download QR
                    </button>
                    <a
                      href={`https://${qrData.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="thm-btn outline w-100"
                      style={{ textDecoration: 'none', textAlign: 'center' }}
                    >
                      <FaEye /> Preview Landing Page
                    </a>
                  </div>
                </div>
              </div>

              <div className="ov-card ov-danger-zone h-auto">
                <div className="ov-card-header">
                  <div>
                    <h6 className="ov-card-title ov-danger-title"><FaTrash className="me-2" /> Danger Zone</h6>
                    <p className="ov-card-subtitle">Irreversible action</p>
                  </div>
                </div>
                <div className="ov-card-body">
                  <p className="small mb-3 text-white">Permanently delete this QR code and all its data.</p>
                  <button className="thm-lg-btn ov-btn-danger w-100" onClick={handleDelete}>
                    <FaTrash /> Delete QR Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <QRDownloadModal
        show={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        qrName={qrData.name}
        qrUrl={qrData.url}
        logoUrl={qrData.logoUrl}
        qrSerialNumber={qrData.qrSerialNumber}
      />
    </>
  );
};

export default QRDetail;
