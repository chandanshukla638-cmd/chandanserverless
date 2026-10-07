import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';
import {
  FaQrcode, FaChartLine, FaMousePointer, FaUsers,
  FaGlobeAsia, FaArrowUp, FaArrowDown
} from 'react-icons/fa';
import api from '../../services/api';
import Loader from './Loader';
import '../../styles/Overview.css';

const Overview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState([
    { title: 'TOTAL SCANS', value: '0', change: '0%', trend: 'up', color: 'primary', icon: <FaChartLine /> },
    { title: 'UNIQUE SCANS', value: '0', change: '0%', trend: 'up', color: 'blue', icon: <FaUsers /> },
    { title: 'CTA CLICKS', value: '0', change: '0%', trend: 'up', color: 'orange', icon: <FaMousePointer /> },
    { title: 'ACTIVE QR CODES', value: '0/0', change: '0%', trend: 'neutral', color: 'green', icon: <FaQrcode /> },
  ]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [deviceData, setDeviceData] = useState([]);
  const [locations, setLocations] = useState([]);
  const [qrTypes, setQrTypes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, overviewDailyRes, devicesRes, locationsRes, qrRes, staticQrRes] = await Promise.all([
          api.get(`/analytics/overview?days=${days}`),
          api.get(`/analytics/overview/daily?days=${days}`),
          api.get('/analytics/devices'),
          api.get('/analytics/locations'),
          api.get('/qr'),
          api.get('/static-qr'),
        ]);

        const curr = overviewRes.data;
        const qrData = qrRes.data || [];
        const staticQrData = staticQrRes.data || [];
        
        const dynamicCount = qrData.length;
        const staticCount = staticQrData.length;
        const totalQr = dynamicCount + staticCount;
        
        const activeDynamicQr = qrData.filter(q => q.status === 'active').length;
        const activeStaticQr = staticQrData.filter(q => q.status === 'active').length;
        const activeQr = activeDynamicQr + activeStaticQr;

        const dynamicPercent = totalQr > 0 ? Math.round((dynamicCount / totalQr) * 100) : 0;
        const staticPercent = totalQr > 0 ? 100 - dynamicPercent : 0;

        setStats([
          {
            title: 'TOTAL SCANS',
            value: (curr.totalScans || 0).toLocaleString(),
            change: '—',
            trend: 'up',
            color: 'primary',
            icon: <FaChartLine />,
          },
          {
            title: 'UNIQUE SCANS',
            value: (curr.uniqueScans || 0).toLocaleString(),
            change: '—',
            trend: 'up',
            color: 'blue',
            icon: <FaUsers />,
          },
          {
            title: 'CTA CLICKS',
            value: (curr.ctaClicks || 0).toLocaleString(),
            change: '—',
            trend: 'up',
            color: 'orange',
            icon: <FaMousePointer />,
          },
          {
            title: 'ACTIVE QR CODES',
            value: `${activeQr}/${totalQr}`,
            change: totalQr > 0 ? `${Math.round((activeQr / totalQr) * 100)}%` : '0%',
            trend: 'neutral',
            color: 'green',
            icon: <FaQrcode />,
          },
        ]);

        setWeeklyData(overviewDailyRes.data);

        // Aggregate daily data into weekly buckets for 30/90 days to avoid overcrowded chart
        if (days > 7 && overviewDailyRes.data.length > 0) {
          const daily = overviewDailyRes.data;
          const weekSize = days <= 30 ? 7 : 15;
          const aggregated = [];
          for (let i = 0; i < daily.length; i += weekSize) {
            const chunk = daily.slice(i, i + weekSize);
            const scans = chunk.reduce((sum, d) => sum + d.scans, 0);
            const clicks = chunk.reduce((sum, d) => sum + d.clicks, 0);
            const firstDay = chunk[0].day;
            const lastDay = chunk[chunk.length - 1].day;
            aggregated.push({
              day: `${firstDay}-${lastDay}`,
              scans,
              clicks,
            });
          }
          setWeeklyData(aggregated);
        }

        const totalDevices = devicesRes.data.reduce((sum, d) => sum + parseInt(d.count), 0);
        const devData = devicesRes.data.map(d => ({
          type: d.device_type || 'Unknown',
          percent: totalDevices > 0 ? Math.round((parseInt(d.count) / totalDevices) * 100) : 0,
          color: d.device_type === 'mobile' ? '#00C8FF' : d.device_type === 'desktop' ? '#0077FF' : '#4DDCFF',
        }));
        setDeviceData(devData.length > 0 ? devData : [{ type: 'No Data', percent: 100, color: '#e0e0e0' }]);

        const totalLoc = locationsRes.data.reduce((sum, l) => sum + parseInt(l.count), 0);
        const locData = locationsRes.data.slice(0, 5).map(l => ({
          city: l.city || 'Unknown',
          country: l.country || '',
          scans: parseInt(l.count),
          percent: totalLoc > 0 ? Math.round((parseInt(l.count) / totalLoc) * 100) : 0,
        }));
        setLocations(locData);

        setQrTypes([
          { type: 'Dynamic QR', desc: 'Updatable', count: dynamicCount, percent: dynamicPercent },
          { type: 'Static QR', desc: 'Fixed', count: staticCount, percent: staticPercent },
        ]);
      } catch (err) {
        console.error('Failed to fetch overview data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days]);

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
      categories: weeklyData.map(d => d.day),
      labels: {
        style: { fontSize: '12px', fontWeight: 500, colors: '#49636F' },
        rotate: days > 30 ? -30 : 0,
        rotateAlways: false,
        hideOverlappingLabels: true,
      },
      tickPlacement: 'on',
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

  const donutOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'Poppins, sans-serif',
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
        },
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
  const totalScans = stats[0].value;

  if (loading) return <Loader />;

  return (
    <>
    <div className="ov-wrapper">
        {/* Page Header */}
        <div className="ov-header">
          <div>
            <h4 className="ov-page-title">Dashboard Overview</h4>
            <p className="ov-page-subtitle">Track your QR code performance and analytics</p>
          </div>
          <div className="ov-header-actions">
            <select className="ov-date-select" value={days} onChange={(e) => { setDays(Number(e.target.value)); setLoading(true); }}>
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row ">
          {stats.map((stat, index) => (
            <div className="col-sm-12 col-md-6 col-lg-3 mb-3" key={index}>
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
                    {stat.trend === 'up' ? <FaArrowUp /> : stat.trend === 'down' ? <FaArrowDown /> : null}
                    {stat.change}
                  </span>
                  <span className="ov-stat-label">vs last week</span>
                </div>
                <div className={`ov-stat-bar ${stat.color}`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="row ">
          <div className="col-sm-12 col-md-6 col-lg-6 mb-3">
            <div className="ov-card ov-chart-card">
              <div className="ov-card-header">
                <div>
                  <h6 className="ov-card-title">Scans & CTA Clicks</h6>
                  <p className="ov-card-subtitle">Last {days} Days Performance</p>
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
                  height={days > 30 ? 320 : 270}
                />
              </div>
            </div>
          </div>

          {/* Donut Chart */}
          <div className="col-sm-12 col-md-6 col-lg-6 mb-3">
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
                  height={200}
                />
                <div className="ov-donut-total">
                  <span className="ov-donut-total-value">{totalScans}</span>
                  <span className="ov-donut-total-label">Total Scans</span>
                </div>
              </div>
              <div className="ov-device-list">
                {deviceData.map((device, i) => (
                  <div key={i} className="ov-device-item">
                    <div className="ov-device-info">
                      <span className="ov-device-dot" style={{ background: device.color }}></span>
                      <span className="ov-device-name">{device.type}</span>
                    </div>
                    <span className="ov-device-percent">{device.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-12 col-md-6 col-lg-6 mb-3">
            <div className="ov-card">
              <div className="ov-card-header">
                <div>
                  <h6 className="ov-card-title"><FaGlobeAsia className="me-2" />Top Locations</h6>
                  <p className="ov-card-subtitle">Where your scans are coming from</p>
                </div>
              </div>
              <div className="ov-locations-list">
                {locations.length === 0 ? (
                  <div className="text-center py-4">
                    <p style={{ color: '#8892a4' }}>No location data available yet.</p>
                  </div>
                ) : (
                  locations.map((loc, i) => (
                    <div key={i} className="ov-location-item">
                      <div className="ov-location-info">
                        <span className="ov-location-city">{loc.city}</span>
                        {loc.country && <span className="ov-location-badge">{loc.country}</span>}
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

          {/* QR Type Breakdown */}
          <div className="col-sm-12 col-md-6 col-lg-6">
            <div className="ov-card">
              <div className="ov-card-header">
                <div>
                  <h6 className="ov-card-title"><FaQrcode className="me-2" />QR Type Breakdown</h6>
                  <p className="ov-card-subtitle">Distribution of QR code types</p>
                </div>
              </div>
              <div className="ov-qr-types">
                {qrTypes.map((type, i) => (
                  <div key={i} className="ov-qr-type-item">
                    <div className="ov-qr-type-icon">
                      <FaQrcode />
                    </div>
                    <div className="ov-qr-type-info">
                      <div className="ov-qr-type-header">
                        <span className="ov-qr-type-name">{type.type}</span>
                        <span className="ov-qr-type-desc">{type.desc}</span>
                      </div>
                      <div className="ov-qr-type-bar-bg">
                        <div className="ov-qr-type-bar" style={{ width: `${type.percent}%` }}></div>
                      </div>
                    </div>
                    <div className="ov-qr-type-count">
                      <span className="ov-qr-type-value">{type.count}</span>
                      <span className="ov-qr-type-percent">{type.percent}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="ov-quick-actions">
                <h6 className="ov-card-title mb-3">Quick Actions</h6>
                <div className="ov-action-buttons">
                  <button className="thm-btn w-100" onClick={() => navigate('/admin/dynamic-qr/create')}>
                    <FaQrcode /> Create QR
                  </button>
                  <button className="thm-btn outline w-100" onClick={() => navigate('/admin/analytics')}>
                    <FaChartLine /> View Analytics
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Overview;
