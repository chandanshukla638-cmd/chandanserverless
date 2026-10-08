-- Landing page content table
CREATE TABLE IF NOT EXISTS landing_content (
  id INTEGER PRIMARY KEY DEFAULT 1,
  hero JSONB DEFAULT '{
    "badge": "Business Solutions Platform",
    "headline": "Transform physical touchpoints into smart business assets.",
    "subheadline": "Every interaction becomes a measurable step toward business growth.",
    "featurePills": ["Customer Engagement", "Business Insights", "Smart Automation"],
    "primaryButton": {"text": "Book a Demo", "link": "/preview"},
    "secondaryButton": {"text": "Explore Solutions", "link": "#industry-solutions"},
    "showSecondaryButton": true,
    "heroImage": null
  }',
  features JSONB DEFAULT '[
    {"icon": "layer-group", "title": "Campaign Intelligence", "description": "Track every campaign across QR codes, videos, and CTAs with unified analytics dashboards."},
    {"icon": "users", "title": "Customer Engagement", "description": "Turn physical touchpoints into interactive digital experiences that captivate your audience."},
    {"icon": "chart-line", "title": "Real-Time Analytics", "description": "Live insights on scans, clicks, and conversions with geographic and device breakdowns."},
    {"icon": "sync-alt", "title": "Dynamic Content", "description": "Update videos, CTAs, and landing pages anytime without reprinting a single QR code."},
    {"icon": "bullseye", "title": "Precision Targeting", "description": "Segment audiences by location, device, and behavior for personalized marketing campaigns."},
    {"icon": "shield-alt", "title": "Enterprise Security", "description": "Bank-grade encryption with SOC2 compliance and role-based access controls."}
  ]',
  how_it_works JSONB DEFAULT '[
    {"num": "01", "title": "Connect", "description": "Link physical products, packaging, or displays to your digital campaign with a single QR code."},
    {"num": "02", "title": "Engage", "description": "Customers interact with personalized content, videos, and offers through their smartphones."},
    {"num": "03", "title": "Track", "description": "Real-time analytics capture every scan, click, and conversion across all touchpoints."},
    {"num": "04", "title": "Optimize", "description": "Update content and CTAs based on performance data to maximize engagement and ROI."}
  ]',
  industry_solutions JSONB DEFAULT '[
    {"icon": "building", "title": "Banking & Finance", "description": "Streamline customer onboarding with QR-based KYC, digital account opening, and secure document sharing.", "stats": "45% faster customer onboarding"},
    {"icon": "home", "title": "Real Estate", "description": "Let buyers scan QR codes on properties to instantly view virtual tours, floor plans, and pricing details.", "stats": "3x more property inquiries"},
    {"icon": "shopping-cart", "title": "FMCG & Packaging", "description": "Turn product packaging into engagement channels with dynamic content and loyalty programs.", "stats": "60% repeat purchase rate"},
    {"icon": "heartbeat", "title": "Healthcare", "description": "Simplify patient check-ins, medical record access, and appointment scheduling with smart QR codes.", "stats": "50% reduction in wait times"},
    {"icon": "store", "title": "Retail & E-commerce", "description": "Bridge offline and online shopping with QR-powered product info, reviews, and instant purchase options.", "stats": "2.8x online conversion boost"},
    {"icon": "industry", "title": "Industrial", "description": "Optimize supply chain visibility with QR-coded inventory tracking and equipment maintenance logs.", "stats": "35% operational efficiency gain"}
  ]',
  pricing JSONB DEFAULT '[
    {"name": "Starter", "price": "Free", "period": "forever", "description": "Perfect for small businesses exploring QR marketing", "features": ["5 Dynamic QR Codes", "Basic Analytics", "Video Embedding", "Email Support", "1 User"], "cta": "Get Started Free", "popular": false, "icon": "rocket"},
    {"name": "Professional", "price": "999", "period": "/month", "description": "For growing businesses that need advanced features", "features": ["50 Dynamic QR Codes", "Advanced Analytics & Insights", "Custom Branding", "Campaign Management", "Priority Support", "5 Team Members", "API Access"], "cta": "Start Free Trial", "popular": true, "icon": "briefcase"},
    {"name": "Enterprise", "price": "Custom", "period": "", "description": "For large organizations with custom requirements", "features": ["Unlimited QR Codes", "Enterprise Analytics Suite", "White-Label Solution", "Dedicated Account Manager", "24/7 Phone Support", "Unlimited Team Members", "Custom Integrations"], "cta": "Contact Sales", "popular": false, "icon": "building"}
  ]',
  testimonials JSONB DEFAULT '[
    {"name": "Rahul Sharma", "role": "Marketing Head, TechIndia", "text": "AKKSYS transformed how we track our print campaigns. The real-time analytics are incredible!", "avatar": "RS"},
    {"name": "Priya Patel", "role": "E-commerce Manager, ShopLocal", "text": "We saw a 3x increase in customer engagement after switching to dynamic QR codes.", "avatar": "PP"},
    {"name": "Amit Kumar", "role": "Founder, StartupHub", "text": "The ability to update QR content without reprinting saved us thousands in marketing costs.", "avatar": "AK"},
    {"name": "Neha Gupta", "role": "CEO, FashionHub", "text": "Our packaging now drives direct online sales. AKKSYS made it seamless to set up.", "avatar": "NG"},
    {"name": "Vikram Singh", "role": "Marketing Lead, TechCorp", "text": "The campaign tracking features give us insights we never had before. Highly recommended!", "avatar": "VS"}
  ]',
  faq JSONB DEFAULT '[
    {"question": "How does AKKSYS help businesses?", "answer": "AKKSYS is a business engagement and intelligence platform that transforms physical touchpoints into smart, trackable digital assets through dynamic QR codes."},
    {"question": "What industries can use AKKSYS?", "answer": "AKKSYS serves Banking, Real Estate, FMCG, Healthcare, Retail, and Industrial sectors with tailored QR solutions for each industry."},
    {"question": "How does campaign tracking work?", "answer": "Every QR scan and CTA click is tracked in real-time with device, location, and demographic data, giving you complete campaign visibility."},
    {"question": "Can I update content without reprinting?", "answer": "Yes! That is the core advantage of dynamic QR codes. Update videos, CTAs, and landing pages anytime while keeping the same QR code."},
    {"question": "What analytics are available?", "answer": "Full analytics suite including scan counts, unique visitors, geographic heatmaps, device breakdown, time-based trends, and conversion funnels."},
    {"question": "How is AKKSYS different from regular QR tools?", "answer": "AKKSYS is not just a QR generator. It is a complete engagement platform with campaign management, analytics, team collaboration, and enterprise-grade security."}
  ]',
  cta JSONB DEFAULT '{
    "title": "Ready to Transform Your Business Engagement?",
    "description": "Join 500+ businesses using AKKSYS to create measurable, data-driven customer experiences",
    "primaryButton": {"text": "Book a Demo", "link": "/preview"},
    "secondaryButton": {"text": "See Industry Use Cases", "link": "#industry-solutions"},
    "showSecondaryButton": true
  }',
  footer JSONB DEFAULT '{
    "brandName": "AKKSYS",
    "description": "Business engagement and intelligence platform helping brands create measurable, data-driven customer experiences.",
    "socialLinks": [
      {"platform": "twitter", "url": ""},
      {"platform": "linkedin", "url": ""},
      {"platform": "github", "url": ""}
    ],
    "columns": [
      {"heading": "Product", "links": [{"label": "Solutions", "url": "#features"}, {"label": "Pricing", "url": "#pricing"}, {"label": "Dashboard", "url": "/admin"}, {"label": "Industry Solutions", "url": "#industry-solutions"}]},
      {"heading": "Company", "links": [{"label": "About Us", "url": "/about"}, {"label": "Contact", "url": "/contact"}, {"label": "Blog", "url": "/blog"}, {"label": "Careers", "url": "/careers"}]},
      {"heading": "Support", "links": [{"label": "Help Center", "url": "/help"}, {"label": "Documentation", "url": "/docs"}, {"label": "API Reference", "url": "/api-docs"}, {"label": "Status", "url": "/status"}]},
      {"heading": "Legal", "links": [{"label": "Privacy Policy", "url": "/privacy"}, {"label": "Terms of Service", "url": "/terms"}, {"label": "Cookie Policy", "url": "/cookies"}, {"label": "GDPR", "url": "/gdpr"}]}
    ],
    "copyright": "2026 AKKSYS. All rights reserved.",
    "email": "hello@akksys.com",
    "phone": "+91 98765 43210"
  }',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure only one row exists
INSERT INTO landing_content (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
