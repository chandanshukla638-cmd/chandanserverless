import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FaQrcode, FaEnvelope, FaPhone, FaTwitter, FaLinkedin, FaGithub, FaFacebook, FaInstagram, FaYoutube, FaGlobe } from 'react-icons/fa';

const Footer = ({ footerData = {} }) => {
  const socialIcons = {
    twitter: <FaTwitter />,
    linkedin: <FaLinkedin />,
    github: <FaGithub />,
    facebook: <FaFacebook />,
    instagram: <FaInstagram />,
    youtube: <FaYoutube />,
  };

  const defaultColumns = [
    {
      heading: 'Product',
      links: [
        { label: 'Solutions', url: '#features' },
        { label: 'Pricing', url: '#pricing' },
        { label: 'Dashboard', url: '/login' },
        { label: 'Industry Solutions', url: '#industry-solutions' },
      ]
    },
    {
      heading: 'Company',
      links: [
        { label: 'About Us', url: '#' },
        { label: 'Contact', url: '/contact' },
        { label: 'Blog', url: '#' },
        { label: 'Careers', url: '#' },
      ]
    },
    {
      heading: 'Support',
      links: [
        { label: 'Help Center', url: '#' },
        { label: 'Documentation', url: '#' },
        { label: 'API Reference', url: '#' },
        { label: 'Status', url: '#' },
      ]
    },
    {
      heading: 'Legal',
      links: [
        { label: 'Privacy Policy', url: '/privacy-policy' },
        { label: 'Terms of Service', url: '/terms-and-conditions' },
        { label: 'Cookie Policy', url: '#' },
        { label: 'GDPR', url: '#' },
      ]
    }
  ];

  const columns = defaultColumns;

  return (
    <footer className="mk-footer">
      <div className="container">
        <div className="row">
          <div className="col-lg-4 mb-lg-4 mb-0">
            <div className="d-flex align-items-center gap-2 mb-3">
              <NavLink to="/" className="d-flex align-items-center gap-2">
                <div className="mk-footer-logo"><FaQrcode /></div>
              <span className="mk-footer-brand">{footerData.brandName || 'AKKSYS'}</span>
              </NavLink>
            </div>
            <p className="mk-footer-desc">{footerData.description || 'Business engagement and intelligence platform helping brands create measurable, data-driven customer experiences.'}</p>
            <div className="d-flex gap-3 mb-3 mb-lg-0">
              {(footerData.socialLinks || []).map((link, i) => (
                <a key={i} href={link.url || '#'} className="mk-social" target="_blank" rel="noopener noreferrer">
                  {socialIcons[link.platform] || <FaGlobe />}
                </a>
              ))}
            </div>
          </div>
          {columns.map((col, i) => (
            <div key={i} className="col-6 col-md-6 col-lg-2">
              <h6 className="mk-footer-heading">{col.heading}</h6>
              <ul className="mk-footer-links">
                {(col.links || []).map((link, j) => (
                  <li key={j}>
                    {link.url?.startsWith('/') ? (
                      <Link to={link.url}>{link.label}</Link>
                    ) : (
                      <a href={link.url || '#'}>{link.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mk-footer-bottom">
          <div className="row align-items-center">
            <div className="col-md-6">
              <p className="mk-footer-copy">&copy; {footerData.copyright || '2026 AKKSYS. All rights reserved.'}</p>
            </div>
            <div className="col-md-6 text-md-end">
              <a href={`mailto:${footerData.email || 'hello@akksys.com'}`} className="mk-footer-contact"><FaEnvelope className="me-1" /> {footerData.email || 'hello@akksys.com'}</a>
              <a href={`tel:${footerData.phone || '+919876543210'}`} className="mk-footer-contact ms-3"><FaPhone className="me-1" /> {footerData.phone || '+91 98765 43210'}</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
