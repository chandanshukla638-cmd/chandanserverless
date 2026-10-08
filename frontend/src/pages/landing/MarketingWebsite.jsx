import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  FaQrcode, FaVideo, FaMousePointer, FaChartLine, FaSync, FaShieldAlt,
  FaCheck, FaChevronDown, FaChevronUp, FaStar, FaArrowRight,
  FaTwitter, FaLinkedin, FaGithub, FaEnvelope, FaPhone,
  FaPlay, FaUsers, FaGlobe, FaRocket, FaBolt, FaCrown,
  FaBuilding, FaHome, FaShoppingBag, FaHeartbeat, FaIndustry, FaStore,
  FaLayerGroup, FaCrosshairs, FaWaveSquare, FaLightbulb, FaChartBar, FaChartPie,
  FaHistory, FaFileAlt, FaSearch, FaBell, FaFacebook, FaInstagram, FaYoutube,
  FaCog, FaSyncAlt, FaChartBar as FaChartBarIcon, FaImage, FaLink, FaBriefcase
} from 'react-icons/fa';
import Splide from '@splidejs/splide';
import '@splidejs/splide/css';
import Loader from '../dashboard/Loader';
import Footer from '../../components/landing/Footer';
import './MarketingWebsite.css';

const iconMap = { 
  'layer-group': <FaLayerGroup />,
  'users': <FaUsers />,
  'chart-line': <FaChartLine />,
  'sync-alt': <FaSyncAlt />,
  'bullseye': <FaCrosshairs />,
  'shield-alt': <FaShieldAlt />,
  'building': <FaBuilding />,
  'home': <FaHome />,
  'shopping-cart': <FaShoppingBag />,
  'heartbeat': <FaHeartbeat />,
  'store': <FaStore />,
  'industry': <FaIndustry />,
  'rocket': <FaRocket />,
  'bolt': <FaBolt />,
  'crown': <FaCrown />,
  'briefcase': <FaBriefcase />,
  'chart-bar': <FaChartBarIcon />,
  'video': <FaVideo />,
  'palette': <FaCog />,
  'plus': <FaCheck />,
  'qrcode': <FaQrcode />,
  'globe': <FaGlobe />,
  'image': <FaImage />,
  'link': <FaLink />,
  'facebook': <FaFacebook />,
  'twitter': <FaTwitter />,
  'instagram': <FaInstagram />,
  'youtube': <FaYoutube />,
  'linkedin': <FaLinkedin />,
  'github': <FaGithub />,
};

const Features = ({ features = [] }) => { 
  return (
    <section className="mk-section mk-section-alt" id="features">
      <div className="container">
        <div className="text-center mb-4">
          <span className="mk-badge">SOLUTIONS</span>
          <h2 className="mk-heading">Everything You Need for<br/><span className="mk-gradient-text">Smart Business Engagement</span></h2>
          <p className="mk-subtext">Powerful tools to create, manage, and measure your <span className='d-lg-block d-sm-inline'>digital campaigns</span></p>
        </div>
        <div className="row">
          {features.map((f, i) => (
            <div key={i} className="col-md-6 col-lg-4 col-sm-12 mb-3">
              <div className="mk-feature-card">
                <div className="mk-feature-icon">{iconMap[f.icon] || <FaCheck />}</div>
                <h5 className="mk-feature-title">{f.title}</h5>
                <p className="mk-feature-desc">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HowItWorks = ({ steps = [] }) => {
  return (
    <section className="mk-section mk-section-alt" id="how-it-works">
      <div className="container">
        <div className="text-center mb-4">
          <span className="mk-badge">HOW IT WORKS</span>
          <h2 className="mk-heading">Simple <span className="mk-gradient-text">4-Step</span> Process</h2>
          <p className="mk-subtext">From connection to optimization, everything is streamlined</p>
        </div>
        <div className="row">
          {steps.map((s, i) => (
            <div key={i} className="col-md-6 col-lg-3 col-sm-12 mb-3">
              <div className="mk-step-card">
                <div className="mk-step-num">{s.num}</div>
                <div className="mk-step-line"></div>
                <h5 className="mk-step-title">{s.title}</h5>
                <p className="mk-step-desc">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Stats = ({ impactStats = [], stats = {} }) => {
  const iconMap = {
    'building': <FaBuilding />,
    'users': <FaUsers />,
    'chart-line': <FaChartLine />,
    'star': <FaStar />,
    'bolt': <FaBolt />,
    'check': <FaCheck />
  };

  const defaultCards = [
    { icon: 'building', label: 'Businesses Empowered', staticValue: '500+' },
    { icon: 'users', label: 'Customer Engagements', staticValue: '2.4M+' },
    { icon: 'chart-line', label: 'Average CTR', staticValue: '31.2%' },
    { icon: 'star', label: 'Customer Rating', staticValue: '4.9/5' }
  ];

  const cards = impactStats && impactStats.length > 0 ? impactStats : defaultCards;

  return (
    <section className="mk-section mk-stats-section">
      <div className="container">
        <div className="text-center mb-4">
          <span className="mk-badge">OUR IMPACT</span>
          <h2 className="mk-heading">Metrics that <span className="mk-gradient-text">Matter</span></h2>
          <p className="mk-subtext">Join businesses transforming their customer engagement with AKKSYS</p>
        </div>
        <div className="row text-center justify-content-center">
          {cards.map((s, i) => {
             const valueStr = String(s.staticValue || s.value || '0');
             const numberMatch = valueStr.match(/[\d.]+/);
             const number = numberMatch ? parseFloat(numberMatch[0]) : 0;
             const suffix = valueStr.replace(numberMatch ? numberMatch[0] : '', '');
             const hasDecimals = number.toString().includes('.');

             return (
               <div key={i} className="col-md-6 col-sm-12 col-lg-3 mb-3 mb-lg-0">
                 <div className="mk-stat-card">
                   <div className="mk-stat-icon">{iconMap[s.icon] || <FaCheck />}</div>
                   <h3 className="mk-stat-number">
                     <CountUp end={number} decimals={hasDecimals ? 1 : 0} />{suffix}
                   </h3>
                   <p className="mk-stat-label">{s.label}</p>
                 </div>
               </div>
             );
          })}
        </div>
      </div>
    </section>
  );
};

const DashboardPreview = () => {
  return (
    <section className="mk-section " id="dashboard-preview">
      <div className="container">
        <div className="text-center mb-5">
          <span className="mk-badge">PLATFORM PREVIEW</span>
          <h2 className="mk-heading">Your Business <span className="mk-gradient-text">Command Center</span></h2>
          <p className="mk-subtext">Everything you need to manage campaigns, track performance, and optimize engagement — all in one dashboard</p>
        </div>
        <div className="mk-dashboard-preview">
          {/* Browser Topbar */}
          {/* <div className="mk-dash-browser-bar">
            <div className="mk-dash-dots">
              <span className="mk-dash-dot mk-dash-dot-red"></span>
              <span className="mk-dash-dot mk-dash-dot-yellow"></span>
              <span className="mk-dash-dot mk-dash-dot-green"></span>
            </div>
            <div className="mk-dash-url-bar">
              <FaQrcode size={10} />
              <span>app.akksys.com/admin</span>
            </div>
            <div className="mk-dash-browser-right"></div>
          </div> */}
          <div className="mk-dash-app-layout">
            {/* Sidebar */}
            <div className="mk-dash-sidebar">
              <div className="mk-dash-sidebar-logo">
                <div className="mk-dash-sidebar-logo-icon">AK</div>
                <div className="mk-dash-sidebar-logo-text">
                  <span className="mk-dash-sidebar-brand">AKKSYS</span>
                  <span className="mk-dash-sidebar-version">Admin Panel v1.0</span>
                </div>
              </div>
              <div className="mk-dash-sidebar-nav">
                <div className="mk-dash-sidebar-section-title">Main</div>
                <div className="mk-dash-sidebar-link active">
                  <FaChartPie className="mk-dash-sidebar-icon" />
                  <span>Dashboard</span>
                </div>
                <div className="mk-dash-sidebar-link">
                  <FaQrcode className="mk-dash-sidebar-icon" />
                  <span>Dynamic QR</span>
                </div>
                <div className="mk-dash-sidebar-link">
                  <FaQrcode className="mk-dash-sidebar-icon" />
                  <span>Static QR</span>
                </div>
                <div className="mk-dash-sidebar-section-title">Manage</div>
                <div className="mk-dash-sidebar-link">
                  <FaVideo className="mk-dash-sidebar-icon" />
                  <span>Videos</span>
                </div>
                <div className="mk-dash-sidebar-link">
                  <FaMousePointer className="mk-dash-sidebar-icon" />
                  <span>CTA Manager</span>
                </div>
                <div className="mk-dash-sidebar-link">
                  <FaChartLine className="mk-dash-sidebar-icon" />
                  <span>Analytics</span>
                </div>
                <div className="mk-dash-sidebar-link">
                  <FaHistory className="mk-dash-sidebar-icon" />
                  <span>Campaign History</span>
                </div>
                <div className="mk-dash-sidebar-link">
                  <FaFileAlt className="mk-dash-sidebar-icon" />
                  <span>Landing Content</span>
                </div>
                <div className="mk-dash-sidebar-link">
                  <FaCog className="mk-dash-sidebar-icon" />
                  <span>Settings</span>
                </div>
              </div>
              <div className="mk-dash-sidebar-profile">
                <div className="mk-dash-sidebar-avatar">AD</div>
                <div className="mk-dash-sidebar-profile-info">
                  <span className="mk-dash-sidebar-profile-name">Admin</span>
                  <span className="mk-dash-sidebar-profile-email">admin@akksys.com</span>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="mk-dash-main">
              {/* Topbar */}
              <div className="mk-dash-topbar">
                <div className="mk-dash-topbar-left">
                  <div className="mk-dash-search">
                    <FaSearch size={13} />
                    <span>Search...</span>
                  </div>
                </div>
                <div className="mk-dash-topbar-right">
                  <div className="mk-dash-notif-bell">
                    <FaBell size={16} />
                    <span className="mk-dash-notif-badge">3</span>
                  </div>
                  <div className="mk-dash-topbar-profile">
                    <div className="mk-dash-topbar-avatar">AD</div>
                    <div className="mk-dash-topbar-profile-info">
                      <span className="mk-dash-topbar-name">Admin User</span>
                      <span className="mk-dash-topbar-role">Superadmin</span>
                    </div>
                    <FaChevronDown size={12} />
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="mk-dash-content">
                <div className="mk-dash-page-header">
                  <div>
                    <h4 className="mk-dash-page-title">Dashboard Overview</h4>
                    <p className="mk-dash-page-subtitle">Track your QR code performance and analytics</p>
                  </div>
                  <select
  className="mk-dash-date-select"
  onMouseDown={(e) => e.preventDefault()}
  onClick={(e) => e.preventDefault()}
>
  <option>Last 7 Days</option>
  <option>Last 30 Days</option>
</select>

                </div>
            {/* Stat Cards - Exact match with Overview.jsx */}
            <div className="row ">
              <div className="col-md-3  col-6 mb-3">
                <div className="mk-dash-stat-card">
                  <div className="mk-dash-stat-icon mk-dash-stat-primary"><FaChartLine /></div>
                  <div className="mk-dash-stat-info">
                    <span className="mk-dash-stat-label-sm">CUSTOMER INTERACTIONS</span>
                    <span className="mk-dash-stat-value">6,071</span>
                    <span className="mk-dash-stat-change mk-dash-change-up">+12.4%</span>
                  </div>
                </div>
              </div>
              <div className="col-md-3  col-6 mb-3">
                <div className="mk-dash-stat-card">
                  <div className="mk-dash-stat-icon mk-dash-stat-blue"><FaUsers /></div>
                  <div className="mk-dash-stat-info">
                    <span className="mk-dash-stat-label-sm">UNIQUE USERS</span>
                    <span className="mk-dash-stat-value">3,891</span>
                    <span className="mk-dash-stat-change mk-dash-change-up">+8.1%</span>
                  </div>
                </div>
              </div>
              <div className="col-md-3  col-6 mb-3">
                <div className="mk-dash-stat-card">
                  <div className="mk-dash-stat-icon mk-dash-stat-orange"><FaMousePointer /></div>
                  <div className="mk-dash-stat-info">
                    <span className="mk-dash-stat-label-sm">ACTIONS TRIGGERED</span>
                    <span className="mk-dash-stat-value">1,924</span>
                    <span className="mk-dash-stat-change mk-dash-change-up">+18.3%</span>
                  </div>
                </div>
              </div>
              <div className="col-md-3  col-6 mb-3">
                <div className="mk-dash-stat-card">
                  <div className="mk-dash-stat-icon mk-dash-stat-green"><FaQrcode /></div>
                  <div className="mk-dash-stat-info">
                    <span className="mk-dash-stat-label-sm">ACTIVE QR CODES</span>
                    <span className="mk-dash-stat-value">4/5</span>
                    <span className="mk-dash-stat-change mk-dash-change-neutral">80%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row - Bar Chart + Donut */}
            <div className="row ">
              <div className="col-lg-6 mb-3">
                <div className="mk-dash-chart-card">
                  <div className="mk-dash-chart-header">
                    <div>
                      <span className="mk-dash-chart-title">Interactions & Actions</span>
                      <span className="mk-dash-chart-subtitle">Last 7 Days Performance</span>
                    </div>
                    <div className="mk-dash-legend">
                      <span className="mk-dash-legend-item"><span className="mk-dash-legend-dot" style={{background: '#00C8FF'}}></span>Interactions</span>
                      <span className="mk-dash-legend-item"><span className="mk-dash-legend-dot" style={{background: '#0077FF'}}></span>Actions</span>
                    </div>
                  </div>
                  <div className="mk-dash-chart-bars">
                    <div className="mk-dash-bar-group">
                      <div className="mk-dash-bar-pair">
                        <div className="mk-dash-bar mk-dash-bar-scans" style={{height: '49%'}}></div>
                        <div className="mk-dash-bar mk-dash-bar-clicks" style={{height: '47%'}}></div>
                      </div>
                      <span className="mk-dash-bar-label">Mon</span>
                    </div>
                    <div className="mk-dash-bar-group">
                      <div className="mk-dash-bar-pair">
                        <div className="mk-dash-bar mk-dash-bar-scans" style={{height: '68%'}}></div>
                        <div className="mk-dash-bar mk-dash-bar-clicks" style={{height: '65%'}}></div>
                      </div>
                      <span className="mk-dash-bar-label">Tue</span>
                    </div>
                    <div className="mk-dash-bar-group">
                      <div className="mk-dash-bar-pair">
                        <div className="mk-dash-bar mk-dash-bar-scans" style={{height: '58%'}}></div>
                        <div className="mk-dash-bar mk-dash-bar-clicks" style={{height: '55%'}}></div>
                      </div>
                      <span className="mk-dash-bar-label">Wed</span>
                    </div>
                    <div className="mk-dash-bar-group">
                      <div className="mk-dash-bar-pair">
                        <div className="mk-dash-bar mk-dash-bar-scans" style={{height: '77%'}}></div>
                        <div className="mk-dash-bar mk-dash-bar-clicks" style={{height: '75%'}}></div>
                      </div>
                      <span className="mk-dash-bar-label">Thu</span>
                    </div>
                    <div className="mk-dash-bar-group">
                      <div className="mk-dash-bar-pair">
                        <div className="mk-dash-bar mk-dash-bar-scans" style={{height: '100%'}}></div>
                        <div className="mk-dash-bar mk-dash-bar-clicks" style={{height: '95%'}}></div>
                      </div>
                      <span className="mk-dash-bar-label">Fri</span>
                    </div>
                    <div className="mk-dash-bar-group">
                      <div className="mk-dash-bar-pair">
                        <div className="mk-dash-bar mk-dash-bar-scans" style={{height: '68%'}}></div>
                        <div className="mk-dash-bar mk-dash-bar-clicks" style={{height: '63%'}}></div>
                      </div>
                      <span className="mk-dash-bar-label">Sat</span>
                    </div>
                    <div className="mk-dash-bar-group">
                      <div className="mk-dash-bar-pair">
                        <div className="mk-dash-bar mk-dash-bar-scans" style={{height: '46%'}}></div>
                        <div className="mk-dash-bar mk-dash-bar-clicks" style={{height: '43%'}}></div>
                      </div>
                      <span className="mk-dash-bar-label">Sun</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-6 mb-3">
                <div className="mk-dash-chart-card">
                  <div className="mk-dash-chart-header">
                    <div>
                      <span className="mk-dash-chart-title">Device Split</span>
                      <span className="mk-dash-chart-subtitle">By Platform</span>
                    </div>
                  </div>
                  <div className="mk-dash-donut">
                    <div className="mk-dash-donut-ring">
                      <div className="mk-dash-donut-center">
                        <span className="mk-dash-donut-value">6,071</span>
                        <span className="mk-dash-donut-label">Interactions</span>
                      </div>
                    </div>
                    <div className="mk-dash-donut-legend">
                      <div className="mk-dash-legend-item"><span className="mk-dash-legend-dot" style={{background: '#00C8FF'}}></span>Android 64%</div>
                      <div className="mk-dash-legend-item"><span className="mk-dash-legend-dot" style={{background: '#0077FF'}}></span>iOS 31%</div>
                      <div className="mk-dash-legend-item"><span className="mk-dash-legend-dot" style={{background: '#4DDCFF'}}></span>Other 5%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row - Locations + QR Type Breakdown */}
            <div className="row">
              <div className="col-lg-6 mb-3">
                <div className="mk-dash-chart-card">
                  <div className="mk-dash-chart-header">
                    <div>
                      <span className="mk-dash-chart-title"><FaGlobe className="me-2" />Top Locations</span>
                      <span className="mk-dash-chart-subtitle">Where your scans are coming from</span>
                    </div>
                  </div>
                  <div className="mk-dash-locations">
                    <div className="mk-dash-loc-item">
                      <span className="mk-dash-loc-name">Mumbai</span>
                      <div className="mk-dash-loc-bar-wrap"><div className="mk-dash-loc-bar" style={{width: '30%'}}></div></div>
                      <span className="mk-dash-loc-val">1,840</span>
                      <span className="mk-dash-loc-percent">30%</span>
                    </div>
                    <div className="mk-dash-loc-item">
                      <span className="mk-dash-loc-name">Delhi</span>
                      <div className="mk-dash-loc-bar-wrap"><div className="mk-dash-loc-bar" style={{width: '23%'}}></div></div>
                      <span className="mk-dash-loc-val">1,411</span>
                      <span className="mk-dash-loc-percent">23%</span>
                    </div>
                    <div className="mk-dash-loc-item">
                      <span className="mk-dash-loc-name">Bengaluru</span>
                      <div className="mk-dash-loc-bar-wrap"><div className="mk-dash-loc-bar" style={{width: '16%'}}></div></div>
                      <span className="mk-dash-loc-val">982</span>
                      <span className="mk-dash-loc-percent">16%</span>
                    </div>
                    <div className="mk-dash-loc-item">
                      <span className="mk-dash-loc-name">Hyderabad</span>
                      <div className="mk-dash-loc-bar-wrap"><div className="mk-dash-loc-bar" style={{width: '11%'}}></div></div>
                      <span className="mk-dash-loc-val">674</span>
                      <span className="mk-dash-loc-percent">11%</span>
                    </div>
                    <div className="mk-dash-loc-item">
                      <span className="mk-dash-loc-name">Pune</span>
                      <div className="mk-dash-loc-bar-wrap"><div className="mk-dash-loc-bar" style={{width: '8%'}}></div></div>
                      <span className="mk-dash-loc-val">487</span>
                      <span className="mk-dash-loc-percent">8%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-6 mb-3">
                <div className="mk-dash-chart-card">
                  <div className="mk-dash-chart-header">
                    <div>
                      <span className="mk-dash-chart-title"><FaQrcode className="me-2" />QR Type Breakdown</span>
                      <span className="mk-dash-chart-subtitle">Distribution of QR code types</span>
                    </div>
                  </div>
                  <div className="mk-dash-qr-types">
                    <div className="mk-dash-qr-type-item">
                      <div className="mk-dash-qr-type-icon"><FaQrcode /></div>
                      <div className="mk-dash-qr-type-info">
                        <div className="mk-dash-qr-type-header">
                          <span className="mk-dash-qr-type-name">Dynamic QR</span>
                          <span className="mk-dash-qr-type-desc">Updatable</span>
                        </div>
                        <div className="mk-dash-qr-type-bar-wrap"><div className="mk-dash-qr-type-bar" style={{width: '62.5%'}}></div></div>
                      </div>
                      <div className="mk-dash-qr-type-count">
                        <span className="mk-dash-qr-type-value">5</span>
                        <span className="mk-dash-qr-type-percent">62.5%</span>
                      </div>
                    </div>
                    <div className="mk-dash-qr-type-item">
                      <div className="mk-dash-qr-type-icon"><FaQrcode /></div>
                      <div className="mk-dash-qr-type-info">
                        <div className="mk-dash-qr-type-header">
                          <span className="mk-dash-qr-type-name">Static QR</span>
                          <span className="mk-dash-qr-type-desc">Fixed</span>
                        </div>
                        <div className="mk-dash-qr-type-bar-wrap"><div className="mk-dash-qr-type-bar" style={{width: '37.5%'}}></div></div>
                      </div>
                      <div className="mk-dash-qr-type-count">
                        <span className="mk-dash-qr-type-value">3</span>
                        <span className="mk-dash-qr-type-percent">37.5%</span>
                      </div>
                    </div>
                  </div>
                  <div className="mk-dash-quick-actions">
                    <div className="mk-dash-action-btns">
                      <button className="thm-btn"><FaChartLine /> New Campaign</button>
                      <button className="thm-btn outline"><FaChartLine /> View Analytics</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
  );
};

const IndustrySolutions = ({ industries = [] }) => {
  return (
    <section className="mk-section" id="industry-solutions">
      <div className="container">
        <div className="text-center mb-5">
          <span className="mk-badge">INDUSTRY SOLUTIONS</span>
          <h2 className="mk-heading">Built for <span className="mk-gradient-text">Every Industry</span></h2>
          <p className="mk-subtext">AKKSYS adapts to your specific business challenges, not the other way around</p>
        </div>
        <div className="row">
          {industries.map((ind, i) => (
            <div key={i} className="col-md-6 col-lg-4 col-sm-12 mb-3">
              <div className="mk-industry-card">
                <div className="mk-industry-icon">{iconMap[ind.icon] || <FaBuilding />}</div>
                <h5 className="mk-industry-title">{ind.title}</h5>
                <p className="mk-industry-desc">{ind.description}</p>
                <div className="mk-industry-stat">
                  <FaChartLine className="mk-industry-stat-icon" />
                  <span>{ind.stats}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Pricing = ({ plans = [] }) => {
  return (
    <section className="mk-section mk-section-alt" id="pricing">
      <div className="container">
        <div className="text-center mb-5">
          <span className="mk-badge">PRICING</span>
          <h2 className="mk-heading">Simple, Transparent <span className="mk-gradient-text">Pricing</span></h2>
          <p className="mk-subtext">Choose the plan that fits your business</p>
        </div>
        <div className="row justify-content-center">
          {plans.map((p, i) => (
            <div key={i} className="col-md-6 col-lg-4 col-sm-12 mb-3">
              <div className={`mk-pricing-card ${p.popular ? 'mk-popular' : ''}`}>
                <div>
                  {p.popular && <div className="mk-popular-badge">MOST POPULAR</div>}
                <div className="mk-pricing-icon">{iconMap[p.icon] || <FaRocket />}</div>
                <h5 className="mk-plan-name">{p.name}</h5>
                <div className="mk-price">
                  <span className="mk-price-amount">{p.price === 'Free' ? 'Free' : p.price === 'Custom' ? 'Custom' : `₹${p.price}`}</span>
                  <span className="mk-price-period">{p.period}</span>
                </div>
                <p className="mk-plan-desc">{p.description}</p>
                <ul className="mk-plan-features"> 
                  {p.features.map((f, j) => <li key={j}><FaCheck className="mk-check" /> {f}</li>)}
                </ul>
                </div>

                <div>
                  <button style={{padding : "14px 0"}} className={`thm-btn w-100 ${p.popular ? 'thm-btn' : 'thm-btn outline'}`}>{p.cta}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Testimonials = ({ testimonials = [] }) => {
  React.useEffect(() => {
    const splide = new Splide('.mk-testimonial-slider', {
      type: 'loop',
      perPage: 3,
      focus: 'center',
      perMove: 1,
      gap: '24px',
      autoplay: true,
      interval: 3000,
      pauseOnHover: true,
      pagination: true,
      arrows: false,
      breakpoints: {
        992: { perPage: 2 },
        576: { perPage: 1, gap: '16px' }
      }
    });
    splide.mount();
    return () => splide.destroy();
  }, [testimonials]);

  return (
    <section className="mk-section" id="testimonials">
      <div className="container">
        <div className="text-center mb-4">
          <span className="mk-badge">TESTIMONIALS</span>
          <h2 className="mk-heading">Trusted by <span className="mk-gradient-text">Industry Leaders</span></h2>
          <p className="mk-subtext">See how businesses are transforming their customer engagement</p>
        </div>
        <div className="mk-testimonial-slider splide">
          <div className="splide__track">
            <ul className="splide__list">
              {testimonials.map((t, i) => (
                <li key={i} className="splide__slide">
                  <div className="mk-testimonial-card">
                    <div className="mk-testimonial-stars">
                      <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                    </div>
                    <p className="mk-testimonial-text">"{t.text}"</p>
                    <div className="mk-testimonial-author">
                      <div className="mk-testimonial-avatar">{t.avatar}</div>
                      <div>
                        <div className="mk-testimonial-name">{t.name}</div>
                        <div className="mk-testimonial-role">{t.role}</div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

const FAQ = ({ faqs = [] }) => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="mk-section mk-section-alt" id="faq">
      <div className="container">
        <div className="text-center mb-4">
          <span className="mk-badge">FAQ</span>
          <h2 className="mk-heading">Frequently Asked <span className="mk-gradient-text">Questions</span></h2>
          <p className="mk-subtext">Got questions? We've got answers</p>
        </div>
        <div className="row justify-content-center">
          <div className="col-lg-10">
            {faqs.map((faq, i) => (
              <div key={i} className={`mk-faq-item ${openIndex === i ? 'active' : ''}`} onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                <div className="mk-faq-question">
                  <span>{faq.question}</span>
                  {openIndex === i ? <FaChevronUp /> : <FaChevronDown />}
                </div>
                {openIndex === i && <div className="mk-faq-answer">{faq.answer}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const CTASection = ({ ctaData = {} }) => {
  const navigate = useNavigate();

  return (
    <section className="mk-section mk-cta-section">
      <div className="container">
        <div className="mk-cta-box">
          <div className="mk-cta-content">
            <h2 className="mk-cta-title">{ctaData.title || 'Ready to Transform Your Business Engagement?'}</h2>
            <p className="mk-cta-desc">{ctaData.description || 'Join 500+ businesses using AKKSYS to create measurable, data-driven customer experiences'}</p>
            <div className="mk-cta-buttons">
              <button className="thm-btn" style={{ padding: '12px 25px', fontSize: '16px' }} onClick={() => navigate(ctaData.primaryButton?.link || '/demo')}>
                {ctaData.primaryButton?.text || 'Book a Demo'} <FaArrowRight className="ms-2" />
              </button>
              {ctaData.showSecondaryButton !== false && (
                <button className="thm-btn outline" style={{ padding: '12px 25px', fontSize: '16px' }} onClick={() => {
                  if (ctaData.secondaryButton?.link?.startsWith('#')) {
                    document.getElementById(ctaData.secondaryButton.link.slice(1))?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    navigate(ctaData.secondaryButton?.link || '/demo');
                  }
                }}>
                  {ctaData.secondaryButton?.text || 'See Industry Use Cases'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};



const CountUp = ({ end, duration = 2000, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = Date.now();
          const numEnd = parseFloat(end.toString().replace(/,/g, ''));
          const isDecimal = end.toString().includes('.');

          const update = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * numEnd;

            if (isDecimal) {
              setCount(current.toFixed(1));
            } else {
              setCount(Math.floor(current).toLocaleString());
            }

            if (progress < 1) {
              requestAnimationFrame(update);
            }
          };
          requestAnimationFrame(update);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {prefix}{count}{suffix}
    </span>
  );
};

const MarketingWebsite = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [landingContent, setLandingContent] = useState(null);
  const [stats, setStats] = useState({});
  const [contentLoading, setContentLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contentRes, statsRes] = await Promise.all([
          api.get('/landing-content/content'),
          api.get('/landing-content/stats')
        ]);
        setLandingContent(contentRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error('Failed to load landing content:', err);
      } finally {
        setContentLoading(false);
      }
    };
    fetchData();
  }, []);

  const hero = landingContent?.hero || {};
  const brandData = landingContent?.brand || {};
  const ctaData = landingContent?.cta || {};
  const footerData = landingContent?.footer || {};

  if (contentLoading) return <Loader />;

  if (brandData.favicon) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = brandData.favicon;
  }

  return (
    <div className="mk-container" style={brandData.primaryColor ? {
      '--thm-primary': brandData.primaryColor,
      '--mk-primary': brandData.primaryColor,
      '--mk-new-color': brandData.primaryColor,
      '--mk-secondary': brandData.secondaryColor || brandData.primaryColor,
      '--mk-accent': brandData.primaryColor
    } : {}}>
      {/* Navbar */}
      <nav className="mk-nav">
        <div className="container d-flex justify-content-between align-items-center py-3">
          <NavLink to="/" className="d-flex align-items-center gap-2 text-decoration-none">
  {brandData.logo ? (
    <img src={brandData.logo} alt="Logo" style={{ maxHeight: '44px', objectFit: 'contain' }} />
  ) : (
    <div className="mk-nav-logo" >
      <FaQrcode />
    </div>
  )}
  <span className="mk-nav-brand" >{footerData.brandName || 'AKKSYS'}</span>
</NavLink>

          <div className="d-none d-md-flex gap-4">
            <a href="#features" className="mk-nav-link">Solutions</a>
            <a href="#industry-solutions" className="mk-nav-link">Use Cases</a>
            <a href="#pricing" className="mk-nav-link">Pricing</a>
            <a href="#faq" className="mk-nav-link">FAQ</a>
          </div>
          <div className="d-flex align-items-center gap-2">
            {!loading && (
              user ? (
                <button className="thm-btn" onClick={() => navigate('/admin')}>Admin</button>
              ) : (
                <>
                  <button className="thm-btn outline" onClick={() => navigate('/login')}>Login</button>
                  <button className="thm-btn" onClick={() => navigate(hero.primaryButton?.link || '/preview')}>{hero.primaryButton?.text || 'Book a Demo'}</button>
                </>
              )
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mk-hero">
        <div className="container">
          <div className="row align-items-center justify-content-center">
            <div className="col-lg-10 text-center">
              <span className="mk-badge mk-badge-hero mb-3">
                <span className="mk-dot"></span> {hero.badge || 'Business Solutions Platform'}
              </span>
              <h1 className="mk-hero-title mb-3"> 
                {(() => {
                  const text = hero.headline || 'Transform physical touchpoints into smart business assets.';
                  const target = 'smart business assets.';
                  const target2 = 'smart business assets';
                  if (text.includes(target)) {
                    const parts = text.split(target);
                    return <>{parts[0]}<span className="mk-gradient-text">{target}</span>{parts[1]}</>;
                  } else if (text.includes(target2)) {
                    const parts = text.split(target2);
                    return <>{parts[0]}<span className="mk-gradient-text">{target2}</span>{parts[1]}</>;
                  }
                  return text;
                })()} 
              </h1>
              {/* <p className="mk-hero-subtitle mx-auto mb-3">
                {hero.subheadline || 'Every interaction becomes a measurable step toward business growth.'}
              </p> */}

                   <p className="mk-hero-subtitle mx-auto mb-3">
                      {(hero.subheadline || 'Every interaction becomes a measurable step toward business growth.')
                        .split(' growth.')
                        .map((text, index) => (
                          <React.Fragment key={index}>
                            {text}
                            {index === 0 && <br />}
                            {index === 0 && 'growth.'}
                          </React.Fragment>
                        ))}
                    </p>

              
              <div className="row justify-content-center mb-3">
                {(hero.featurePills || ['Customer Engagement', 'Business Insights', 'Smart Automation']).map((pill, i) => (
                  <div key={i} className="col-auto">
                     <div className="mk-hero-feature-card">
                       {i === 0 ? <FaUsers className="mk-hero-feature-icon" /> : i === 1 ? <FaChartLine className="mk-hero-feature-icon" /> : <FaBolt className="mk-hero-feature-icon" />}
                       <span>{pill}</span>
                     </div>
                  </div>
                ))}
              </div>

              <div className="d-flex justify-content-center flex-column flex-sm-row gap-3 mb-4">
                <button className="thm-btn fz-16" onClick={() => navigate(hero.primaryButton?.link || '/preview')} style={{padding : "12px 25px"}}>
                  {hero.primaryButton?.text || 'Book a Demo'}
                </button> 
                {hero.showSecondaryButton !== false && (
                  <button className="thm-btn fz-16 outline" onClick={() => {
                    if (hero.secondaryButton?.link?.startsWith('#')) {
                      document.getElementById(hero.secondaryButton.link.slice(1))?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      navigate(hero.secondaryButton?.link || '/preview');
                    }
                  }} style={{padding : "12px 25px"}}>
                    {hero.secondaryButton?.text || 'Explore Solutions'}
                  </button>
                )}
              </div>
              
              {hero.showStats !== false && (
                <div className="mk-hero-stats-box">
                  <div className="row ">
                    <div className="col-6 col-lg-3">
                      <h3 className="mk-hero-stat"><CountUp end={stats?.totalScans ?? 0} /></h3>
                      <p className="mk-hero-stat-label">Customer Interactions</p>
                    </div>

                    <div className="col-6 col-lg-3">
                      <h3 className="mk-hero-stat"><CountUp end={stats?.ctaClicks ?? 0} /></h3>
                      <p className="mk-hero-stat-label">Actions Triggered</p>
                    </div>

                    <div className="col-6 col-lg-3">
                      <h3 className="mk-hero-stat"><CountUp end={stats?.avgCTR ?? 0} decimals={1} suffix="%" /></h3>
                      <p className="mk-hero-stat-label">Engagement Rate</p>
                    </div>

                    <div className="col-6 col-lg-3">
                      <h3 className="mk-hero-stat"><CountUp end={stats?.businesses ?? 0} suffix="+" /></h3>
                      <p className="mk-hero-stat-label">Connected Businesses</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      <DashboardPreview />
      <Features features={landingContent?.features || []} />
      <IndustrySolutions industries={landingContent?.industry_solutions || []} />
      <HowItWorks steps={landingContent?.how_it_works || []} />
      <Stats impactStats={landingContent?.impact_stats || []} stats={stats} />
      <Pricing plans={landingContent?.pricing || []} />
      <Testimonials testimonials={landingContent?.testimonials || []} />
      <FAQ faqs={landingContent?.faq || []} />
      <CTASection ctaData={ctaData} />
      <Footer footerData={footerData} />
    </div>
  );
};

export default MarketingWebsite;
