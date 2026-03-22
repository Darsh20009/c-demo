export type PartnerCategory =
  | 'payment'
  | 'delivery'
  | 'accounting'
  | 'erp'
  | 'government'
  | 'cloud'
  | 'hardware'
  | 'loyalty'
  | 'communication'
  | 'analytics'
  | 'food_aggregator'
  | 'marketplace'
  | 'hr'
  | 'security'
  | 'reservation';

export interface TechPartner {
  id: string;
  nameEn: string;
  nameAr: string;
  category: PartnerCategory;
  description: string;
  descriptionAr: string;
  color: string;
  badge: string;
  badgeAr: string;
  region?: 'ksa' | 'gcc' | 'global';
  featured?: boolean;
}

export const PARTNER_CATEGORIES: Record<PartnerCategory, { nameAr: string; nameEn: string; icon: string; color: string }> = {
  payment:        { nameAr: 'بوابات الدفع', nameEn: 'Payment Gateways', icon: '💳', color: 'emerald' },
  delivery:       { nameAr: 'خدمات التوصيل', nameEn: 'Delivery Services', icon: '🛵', color: 'orange' },
  accounting:     { nameAr: 'المحاسبة والمالية', nameEn: 'Accounting & Finance', icon: '📊', color: 'blue' },
  erp:            { nameAr: 'أنظمة ERP', nameEn: 'ERP Systems', icon: '🏭', color: 'purple' },
  government:     { nameAr: 'الجهات الحكومية', nameEn: 'Government & Compliance', icon: '🏛️', color: 'green' },
  cloud:          { nameAr: 'الخدمات السحابية', nameEn: 'Cloud & Infrastructure', icon: '☁️', color: 'sky' },
  hardware:       { nameAr: 'شركاء الأجهزة', nameEn: 'Hardware Partners', icon: '🖨️', color: 'slate' },
  loyalty:        { nameAr: 'الولاء والتسويق', nameEn: 'Loyalty & Marketing', icon: '⭐', color: 'yellow' },
  communication:  { nameAr: 'التواصل والإشعارات', nameEn: 'Communication & Notifications', icon: '📱', color: 'indigo' },
  analytics:      { nameAr: 'التحليلات والتقارير', nameEn: 'Analytics & Reporting', icon: '📈', color: 'rose' },
  food_aggregator:{ nameAr: 'منصات التوصيل', nameEn: 'Food Aggregators', icon: '🍔', color: 'red' },
  marketplace:    { nameAr: 'المتاجر الإلكترونية', nameEn: 'B2B Marketplace', icon: '🛒', color: 'amber' },
  hr:             { nameAr: 'الموارد البشرية', nameEn: 'HR & Payroll', icon: '👥', color: 'teal' },
  security:       { nameAr: 'الأمن والحماية', nameEn: 'Security & Compliance', icon: '🔐', color: 'gray' },
  reservation:    { nameAr: 'الحجوزات والمطاعم', nameEn: 'Reservations & Dining', icon: '📅', color: 'pink' },
};

export const TECH_PARTNERS: TechPartner[] = [
  // ─── PAYMENT GATEWAYS ───
  { id: 'geidea', nameEn: 'Geidea', nameAr: 'جيدية', category: 'payment', description: 'Saudi payment terminal & gateway', descriptionAr: 'بوابة دفع وأجهزة POS السعودية', color: '#1B4FBB', badge: '100% Integrated', badgeAr: 'متكامل 100%', region: 'ksa', featured: true },
  { id: 'mada', nameEn: 'Mada Pay', nameAr: 'مدى', category: 'payment', description: 'Saudi national payment network', descriptionAr: 'شبكة مدى الوطنية للدفع', color: '#00A651', badge: 'Full Support', badgeAr: 'دعم كامل', region: 'ksa', featured: true },
  { id: 'stcpay', nameEn: 'STC Pay', nameAr: 'STC Pay', category: 'payment', description: 'Digital wallet & payments', descriptionAr: 'محفظة STC الرقمية', color: '#7B2D8B', badge: 'Full Support', badgeAr: 'دعم كامل', region: 'ksa', featured: true },
  { id: 'tamara', nameEn: 'Tamara', nameAr: 'تمارا', category: 'payment', description: 'Buy Now Pay Later (BNPL)', descriptionAr: 'اشتر الآن وادفع لاحقاً', color: '#2DB8A0', badge: 'Full Support', badgeAr: 'دعم كامل', region: 'ksa', featured: true },
  { id: 'tabby', nameEn: 'Tabby', nameAr: 'تابي', category: 'payment', description: 'Installment payments', descriptionAr: 'الدفع بالتقسيط', color: '#3D3D3D', badge: 'Full Support', badgeAr: 'دعم كامل', region: 'ksa' },
  { id: 'paytabs', nameEn: 'PayTabs', nameAr: 'بي تابز', category: 'payment', description: 'Online payment gateway', descriptionAr: 'بوابة الدفع الإلكتروني', color: '#0072BC', badge: 'Full Support', badgeAr: 'دعم كامل', region: 'ksa' },
  { id: 'moyasar', nameEn: 'Moyasar', nameAr: 'ميسر', category: 'payment', description: 'Saudi payment gateway API', descriptionAr: 'بوابة دفع سعودية', color: '#FF6B35', badge: 'Full Support', badgeAr: 'دعم كامل', region: 'ksa' },
  { id: 'checkout', nameEn: 'Checkout.com', nameAr: 'Checkout', category: 'payment', description: 'Global payment processing', descriptionAr: 'معالجة المدفوعات العالمية', color: '#0033A0', badge: 'API Ready', badgeAr: 'API جاهز', region: 'global' },
  { id: 'hyperpay', nameEn: 'HyperPay', nameAr: 'هايبر باي', category: 'payment', description: 'MENA payment gateway', descriptionAr: 'بوابة دفع منطقة MENA', color: '#E63946', badge: 'Full Support', badgeAr: 'دعم كامل', region: 'gcc' },
  { id: 'payfort', nameEn: 'Amazon Payment Services', nameAr: 'Amazon Payment', category: 'payment', description: 'Formerly PayFort', descriptionAr: 'باي فورت سابقاً', color: '#FF9900', badge: 'API Ready', badgeAr: 'API جاهز', region: 'gcc' },
  { id: 'apple-pay', nameEn: 'Apple Pay', nameAr: 'Apple Pay', category: 'payment', description: 'Contactless mobile payment', descriptionAr: 'دفع لا تلامسي بالجوال', color: '#000000', badge: 'Full Support', badgeAr: 'دعم كامل', region: 'global', featured: true },
  { id: 'google-pay', nameEn: 'Google Pay', nameAr: 'Google Pay', category: 'payment', description: 'Digital wallet payments', descriptionAr: 'محفظة Google الرقمية', color: '#4285F4', badge: 'Full Support', badgeAr: 'دعم كامل', region: 'global' },
  { id: 'visa', nameEn: 'Visa', nameAr: 'فيزا', category: 'payment', description: 'Card payment acceptance', descriptionAr: 'قبول بطاقات فيزا', color: '#1A1F71', badge: 'Full Support', badgeAr: 'دعم كامل', region: 'global' },
  { id: 'mastercard', nameEn: 'Mastercard', nameAr: 'ماستركارد', category: 'payment', description: 'Card payment acceptance', descriptionAr: 'قبول بطاقات ماستركارد', color: '#EB001B', badge: 'Full Support', badgeAr: 'دعم كامل', region: 'global' },

  // ─── FOOD AGGREGATORS / DELIVERY ───
  { id: 'hungerstation', nameEn: 'HungerStation', nameAr: 'هنقرستيشن', category: 'food_aggregator', description: '#1 food delivery in Saudi Arabia', descriptionAr: 'الأول في توصيل الطعام بالسعودية', color: '#E8001C', badge: 'Full Sync', badgeAr: 'تزامن كامل', region: 'ksa', featured: true },
  { id: 'jahez', nameEn: 'Jahez', nameAr: 'جاهز', category: 'food_aggregator', description: 'Saudi food delivery platform', descriptionAr: 'منصة توصيل الطعام السعودية', color: '#F5A623', badge: 'Full Sync', badgeAr: 'تزامن كامل', region: 'ksa', featured: true },
  { id: 'mrsool', nameEn: 'Mrsool', nameAr: 'مرسول', category: 'food_aggregator', description: 'On-demand delivery service', descriptionAr: 'خدمة التوصيل عند الطلب', color: '#FFB800', badge: 'Full Sync', badgeAr: 'تزامن كامل', region: 'ksa' },
  { id: 'deliveroo', nameEn: 'Deliveroo', nameAr: 'ديليفرو', category: 'food_aggregator', description: 'Global food delivery', descriptionAr: 'توصيل طعام عالمي', color: '#00CCBC', badge: 'API Ready', badgeAr: 'API جاهز', region: 'gcc' },
  { id: 'careem', nameEn: 'Careem Now', nameAr: 'كريم ناو', category: 'food_aggregator', description: 'Food delivery by Careem', descriptionAr: 'توصيل طعام كريم', color: '#6CCA98', badge: 'API Ready', badgeAr: 'API جاهز', region: 'gcc' },
  { id: 'noon-food', nameEn: 'Noon Food', nameAr: 'نون فود', category: 'food_aggregator', description: 'Noon food delivery service', descriptionAr: 'خدمة توصيل طعام نون', color: '#FEEE00', badge: 'Full Sync', badgeAr: 'تزامن كامل', region: 'gcc' },
  { id: 'toyou', nameEn: 'ToYou', nameAr: 'توصيلك', category: 'delivery', description: 'Last-mile logistics', descriptionAr: 'خدمة توصيل المرحلة الأخيرة', color: '#FF4500', badge: 'Full Support', badgeAr: 'دعم كامل', region: 'ksa' },
  { id: 'aramex', nameEn: 'Aramex', nameAr: 'أرامكس', category: 'delivery', description: 'Express delivery & logistics', descriptionAr: 'الشحن والخدمات اللوجستية', color: '#E03A28', badge: 'API Ready', badgeAr: 'API جاهز', region: 'gcc' },
  { id: 'smsa', nameEn: 'SMSA Express', nameAr: 'SMSA إكسبرس', category: 'delivery', description: 'Saudi express delivery', descriptionAr: 'الشحن السريع السعودي', color: '#003087', badge: 'API Ready', badgeAr: 'API جاهز', region: 'ksa' },
  { id: 'naqel', nameEn: 'Naqel Express', nameAr: 'ناقل إكسبرس', category: 'delivery', description: 'Saudi courier service', descriptionAr: 'البريد السريع السعودي', color: '#FF6B00', badge: 'API Ready', badgeAr: 'API جاهز', region: 'ksa' },

  // ─── ACCOUNTING ───
  { id: 'quickbooks', nameEn: 'QuickBooks', nameAr: 'كويك بوكس', category: 'accounting', description: 'Online accounting software', descriptionAr: 'برنامج المحاسبة الإلكتروني', color: '#2CA01C', badge: 'Full Sync', badgeAr: 'تزامن كامل', region: 'global', featured: true },
  { id: 'zoho-books', nameEn: 'Zoho Books', nameAr: 'زوهو بوكس', category: 'accounting', description: 'Cloud accounting platform', descriptionAr: 'منصة المحاسبة السحابية', color: '#E42527', badge: 'Full Sync', badgeAr: 'تزامن كامل', region: 'global' },
  { id: 'odoo', nameEn: 'Odoo Accounting', nameAr: 'أودو محاسبة', category: 'accounting', description: 'Open source ERP & accounting', descriptionAr: 'محاسبة وERP مفتوح المصدر', color: '#714B67', badge: 'Full Sync', badgeAr: 'تزامن كامل', region: 'global' },
  { id: 'xero', nameEn: 'Xero', nameAr: 'زيرو', category: 'accounting', description: 'Cloud-based accounting', descriptionAr: 'محاسبة سحابية', color: '#13B5EA', badge: 'API Ready', badgeAr: 'API جاهز', region: 'global' },
  { id: 'wave', nameEn: 'Wave Accounting', nameAr: 'ويف للمحاسبة', category: 'accounting', description: 'Free accounting software', descriptionAr: 'برنامج محاسبة مجاني', color: '#0066FF', badge: 'API Ready', badgeAr: 'API جاهز', region: 'global' },
  { id: 'dafater', nameEn: 'Dafater', nameAr: 'دفاتر', category: 'accounting', description: 'Arabic accounting for SMEs', descriptionAr: 'محاسبة عربية للمنشآت الصغيرة', color: '#2563EB', badge: 'Full Sync', badgeAr: 'تزامن كامل', region: 'ksa' },
  { id: 'alfarabi', nameEn: 'Al-Farabi ERP', nameAr: 'الفارابي', category: 'accounting', description: 'Saudi accounting system', descriptionAr: 'نظام محاسبة سعودي', color: '#10B981', badge: 'Full Sync', badgeAr: 'تزامن كامل', region: 'ksa' },

  // ─── ERP SYSTEMS ───
  { id: 'sap', nameEn: 'SAP Business One', nameAr: 'SAP بيزنس ون', category: 'erp', description: 'Enterprise resource planning', descriptionAr: 'تخطيط موارد المؤسسات', color: '#0070F2', badge: 'API Ready', badgeAr: 'API جاهز', region: 'global' },
  { id: 'oracle', nameEn: 'Oracle NetSuite', nameAr: 'أوراكل نيت سويت', category: 'erp', description: 'Cloud ERP platform', descriptionAr: 'منصة ERP سحابية', color: '#F80000', badge: 'API Ready', badgeAr: 'API جاهز', region: 'global' },
  { id: 'ms-dynamics', nameEn: 'Microsoft Dynamics 365', nameAr: 'مايكروسوفت دايناميكس', category: 'erp', description: 'Integrated business applications', descriptionAr: 'تطبيقات أعمال متكاملة', color: '#0078D4', badge: 'API Ready', badgeAr: 'API جاهز', region: 'global' },
  { id: 'odoo-erp', nameEn: 'Odoo ERP', nameAr: 'أودو ERP', category: 'erp', description: 'All-in-one ERP solution', descriptionAr: 'حل ERP متكامل', color: '#714B67', badge: 'Full Sync', badgeAr: 'تزامن كامل', region: 'global' },
  { id: 'mena-erp', nameEn: 'MENA ERP', nameAr: 'مينا ERP', category: 'erp', description: 'Arabic ERP for Middle East', descriptionAr: 'ERP عربي للشرق الأوسط', color: '#1D4ED8', badge: 'Full Sync', badgeAr: 'تزامن كامل', region: 'gcc' },

  // ─── GOVERNMENT & COMPLIANCE ───
  { id: 'zatca', nameEn: 'ZATCA (Fatoorah)', nameAr: 'هيئة الزكاة والضريبة', category: 'government', description: 'Saudi e-invoicing compliance (Phase 1 & 2)', descriptionAr: 'الفاتورة الإلكترونية - المرحلة 1 و2', color: '#006C35', badge: '✅ Certified', badgeAr: '✅ معتمد', region: 'ksa', featured: true },
  { id: 'gosi', nameEn: 'GOSI', nameAr: 'التأمينات الاجتماعية', category: 'government', description: 'Social insurance organization', descriptionAr: 'المؤسسة العامة للتأمينات الاجتماعية', color: '#006600', badge: 'API Ready', badgeAr: 'API جاهز', region: 'ksa', featured: true },
  { id: 'mol', nameEn: 'Ministry of Labor (Qiwa)', nameAr: 'وزارة الموارد البشرية', category: 'government', description: 'Qiwa labor platform', descriptionAr: 'منصة قوى للعمل', color: '#005B96', badge: 'Full Support', badgeAr: 'دعم كامل', region: 'ksa', featured: true },
  { id: 'mudad', nameEn: 'Mudad (WPS)', nameAr: 'مدد حماية الأجور', category: 'government', description: 'Wage protection system', descriptionAr: 'نظام حماية الأجور', color: '#1A3A6E', badge: 'Full Support', badgeAr: 'دعم كامل', region: 'ksa', featured: true },
  { id: 'absher', nameEn: 'Absher Business', nameAr: 'أبشر أعمال', category: 'government', description: 'Government services platform', descriptionAr: 'منصة الخدمات الحكومية', color: '#005F87', badge: 'API Ready', badgeAr: 'API جاهز', region: 'ksa' },
  { id: 'maroof', nameEn: 'Maroof', nameAr: 'معروف', category: 'government', description: 'Business verification platform', descriptionAr: 'منصة التحقق من الأعمال', color: '#2D6A4F', badge: 'API Ready', badgeAr: 'API جاهز', region: 'ksa' },

  // ─── CLOUD & INFRASTRUCTURE ───
  { id: 'aws', nameEn: 'Amazon Web Services', nameAr: 'Amazon AWS', category: 'cloud', description: 'Cloud computing platform', descriptionAr: 'منصة الحوسبة السحابية', color: '#FF9900', badge: 'Hosted', badgeAr: 'مستضاف', region: 'global', featured: true },
  { id: 'gcp', nameEn: 'Google Cloud', nameAr: 'Google Cloud', category: 'cloud', description: 'Cloud platform & services', descriptionAr: 'خدمات وحوسبة سحابية', color: '#4285F4', badge: 'Hosted', badgeAr: 'مستضاف', region: 'global' },
  { id: 'azure', nameEn: 'Microsoft Azure', nameAr: 'مايكروسوفت أزور', category: 'cloud', description: 'Cloud computing services', descriptionAr: 'خدمات الحوسبة السحابية', color: '#0078D4', badge: 'Hosted', badgeAr: 'مستضاف', region: 'global' },
  { id: 'cloudflare', nameEn: 'Cloudflare', nameAr: 'كلاودفلير', category: 'cloud', description: 'CDN & security services', descriptionAr: 'CDN وخدمات الأمان', color: '#F48120', badge: 'Active', badgeAr: 'نشط', region: 'global' },
  { id: 'mongodb-atlas', nameEn: 'MongoDB Atlas', nameAr: 'MongoDB أطلس', category: 'cloud', description: 'Cloud database service', descriptionAr: 'قاعدة بيانات سحابية', color: '#00ED64', badge: 'Active DB', badgeAr: 'قاعدة البيانات', region: 'global', featured: true },

  // ─── HARDWARE PARTNERS ───
  { id: 'sunmi-hw', nameEn: 'Sunmi Technology', nameAr: 'سونمي تكنولوجي', category: 'hardware', description: 'POS terminals & Android devices', descriptionAr: 'أجهزة POS وأندرويد', color: '#1E3A5F', badge: '100% Compatible', badgeAr: 'متوافق 100%', region: 'global', featured: true },
  { id: 'epson-hw', nameEn: 'Epson', nameAr: 'إبسون', category: 'hardware', description: 'Thermal receipt & label printers', descriptionAr: 'طابعات حرارية وملصقات', color: '#004B96', badge: '100% Compatible', badgeAr: 'متوافق 100%', region: 'global', featured: true },
  { id: 'zkteco-hw', nameEn: 'ZKTeco', nameAr: 'ZK تيكو', category: 'hardware', description: 'Fingerprint & access control', descriptionAr: 'بصمة والتحكم بالدخول', color: '#0066CC', badge: '100% Compatible', badgeAr: 'متوافق 100%', region: 'global', featured: true },
  { id: 'star-hw', nameEn: 'Star Micronics', nameAr: 'ستار مايكرونكس', category: 'hardware', description: 'POS receipt printers', descriptionAr: 'طابعات إيصالات POS', color: '#003087', badge: '100% Compatible', badgeAr: 'متوافق 100%', region: 'global' },
  { id: 'bixolon-hw', nameEn: 'Bixolon', nameAr: 'بيكسولون', category: 'hardware', description: 'POS printers & scanners', descriptionAr: 'طابعات POS وماسحات', color: '#003366', badge: '100% Compatible', badgeAr: 'متوافق 100%', region: 'global' },
  { id: 'imin-hw', nameEn: 'IMIN Technology', nameAr: 'إيمن تكنولوجي', category: 'hardware', description: 'Smart POS terminals', descriptionAr: 'أجهزة POS الذكية', color: '#FF4E00', badge: '100% Compatible', badgeAr: 'متوافق 100%', region: 'global' },
  { id: 'zebra-hw', nameEn: 'Zebra Technologies', nameAr: 'زيبرا تكنولوجيز', category: 'hardware', description: 'Scanners & label printers', descriptionAr: 'ماسحات وطابعات ملصقات', color: '#1F6B75', badge: '100% Compatible', badgeAr: 'متوافق 100%', region: 'global' },
  { id: 'honeywell-hw', nameEn: 'Honeywell', nameAr: 'هانيول', category: 'hardware', description: 'Barcode scanners & handheld', descriptionAr: 'ماسحات باركود ومحمولة', color: '#ED2024', badge: '100% Compatible', badgeAr: 'متوافق 100%', region: 'global' },

  // ─── COMMUNICATION ───
  { id: 'whatsapp', nameEn: 'WhatsApp Business API', nameAr: 'واتساب بيزنس', category: 'communication', description: 'Customer notifications via WhatsApp', descriptionAr: 'إشعارات العملاء بالواتساب', color: '#25D366', badge: 'Full Support', badgeAr: 'دعم كامل', region: 'global', featured: true },
  { id: 'twilio', nameEn: 'Twilio SMS', nameAr: 'تويليو SMS', category: 'communication', description: 'SMS & voice communications', descriptionAr: 'رسائل SMS واتصالات', color: '#F22F46', badge: 'Full Support', badgeAr: 'دعم كامل', region: 'global' },
  { id: 'firebase', nameEn: 'Firebase Cloud Messaging', nameAr: 'Firebase FCM', category: 'communication', description: 'Push notifications platform', descriptionAr: 'منصة الإشعارات الفورية', color: '#FFA000', badge: 'Active', badgeAr: 'نشط', region: 'global', featured: true },
  { id: 'sendgrid', nameEn: 'SendGrid', nameAr: 'SendGrid', category: 'communication', description: 'Transactional email service', descriptionAr: 'خدمة البريد الإلكتروني', color: '#1A82E2', badge: 'Active', badgeAr: 'نشط', region: 'global' },
  { id: 'unifonic', nameEn: 'Unifonic', nameAr: 'يونيفونيك', category: 'communication', description: 'Saudi SMS & WhatsApp platform', descriptionAr: 'منصة رسائل سعودية', color: '#FF6B35', badge: 'Full Support', badgeAr: 'دعم كامل', region: 'ksa', featured: true },
  { id: 'msegat', nameEn: 'Msegat', nameAr: 'مسجات', category: 'communication', description: 'Arabic SMS platform', descriptionAr: 'منصة رسائل عربية', color: '#E74C3C', badge: 'Full Support', badgeAr: 'دعم كامل', region: 'ksa' },

  // ─── ANALYTICS ───
  { id: 'google-analytics', nameEn: 'Google Analytics 4', nameAr: 'Google Analytics', category: 'analytics', description: 'Web & app analytics', descriptionAr: 'تحليلات الويب والتطبيقات', color: '#E37400', badge: 'Active', badgeAr: 'نشط', region: 'global', featured: true },
  { id: 'meta-business', nameEn: 'Meta Business Suite', nameAr: 'Meta أعمال', category: 'analytics', description: 'Facebook & Instagram insights', descriptionAr: 'إحصاءات فيسبوك وإنستغرام', color: '#1877F2', badge: 'Active', badgeAr: 'نشط', region: 'global' },
  { id: 'mixpanel', nameEn: 'Mixpanel', nameAr: 'ميكس بانل', category: 'analytics', description: 'Product analytics platform', descriptionAr: 'منصة تحليل المنتج', color: '#7856FF', badge: 'API Ready', badgeAr: 'API جاهز', region: 'global' },
  { id: 'powerbi', nameEn: 'Microsoft Power BI', nameAr: 'Power BI', category: 'analytics', description: 'Business intelligence & reports', descriptionAr: 'ذكاء الأعمال والتقارير', color: '#F2C811', badge: 'Export Ready', badgeAr: 'تصدير جاهز', region: 'global' },
  { id: 'looker', nameEn: 'Google Looker Studio', nameAr: 'Looker Studio', category: 'analytics', description: 'Data visualization & reports', descriptionAr: 'تصور البيانات والتقارير', color: '#4285F4', badge: 'Export Ready', badgeAr: 'تصدير جاهز', region: 'global' },

  // ─── LOYALTY & MARKETING ───
  { id: 'mailchimp', nameEn: 'Mailchimp', nameAr: 'ميل شيمب', category: 'loyalty', description: 'Email marketing automation', descriptionAr: 'أتمتة التسويق بالبريد', color: '#FFE01B', badge: 'Full Sync', badgeAr: 'تزامن كامل', region: 'global' },
  { id: 'hubspot', nameEn: 'HubSpot CRM', nameAr: 'هاب سبوت CRM', category: 'loyalty', description: 'Customer relationship management', descriptionAr: 'إدارة علاقات العملاء', color: '#FF7A59', badge: 'API Ready', badgeAr: 'API جاهز', region: 'global' },
  { id: 'smile-io', nameEn: 'Smile.io', nameAr: 'سمايل Loyalty', category: 'loyalty', description: 'Loyalty & rewards program', descriptionAr: 'برنامج الولاء والمكافآت', color: '#FF7C4C', badge: 'API Ready', badgeAr: 'API جاهز', region: 'global' },
  { id: 'braze', nameEn: 'Braze', nameAr: 'بريز', category: 'loyalty', description: 'Customer engagement platform', descriptionAr: 'منصة تفاعل العملاء', color: '#F26625', badge: 'API Ready', badgeAr: 'API جاهز', region: 'global' },

  // ─── HR & PAYROLL ───
  { id: 'qiwa', nameEn: 'Qiwa Platform', nameAr: 'منصة قوى', category: 'hr', description: 'Saudi labor portal', descriptionAr: 'بوابة العمل السعودية', color: '#006B77', badge: 'Full Support', badgeAr: 'دعم كامل', region: 'ksa', featured: true },
  { id: 'hrdf', nameEn: 'HRDF (Hadaf)', nameAr: 'هدف', category: 'hr', description: 'Human resources development fund', descriptionAr: 'صندوق تنمية الموارد البشرية', color: '#005B96', badge: 'API Ready', badgeAr: 'API جاهز', region: 'ksa' },
  { id: 'bayzat', nameEn: 'Bayzat', nameAr: 'بيزات', category: 'hr', description: 'HR & payroll management', descriptionAr: 'إدارة الموارد البشرية والرواتب', color: '#0056B3', badge: 'API Ready', badgeAr: 'API جاهز', region: 'gcc' },
  { id: 'mawared', nameEn: 'Mawared', nameAr: 'موارد', category: 'hr', description: 'Saudi HR management system', descriptionAr: 'نظام إدارة الموارد البشرية', color: '#1D4ED8', badge: 'Full Sync', badgeAr: 'تزامن كامل', region: 'ksa' },

  // ─── B2B MARKETPLACE ───
  { id: 'nupco', nameEn: 'Nupco', nameAr: 'نوبكو', category: 'marketplace', description: 'Saudi B2B procurement', descriptionAr: 'المشتريات B2B السعودية', color: '#005B96', badge: 'Full Sync', badgeAr: 'تزامن كامل', region: 'ksa', featured: true },
  { id: 'noon-business', nameEn: 'Noon Business', nameAr: 'نون بيزنس', category: 'marketplace', description: 'B2B marketplace platform', descriptionAr: 'منصة B2B التجارية', color: '#FEEE00', badge: 'API Ready', badgeAr: 'API جاهز', region: 'gcc' },
  { id: 'amazon-business', nameEn: 'Amazon Business', nameAr: 'أمازون بيزنس', category: 'marketplace', description: 'B2B procurement marketplace', descriptionAr: 'سوق المشتريات B2B', color: '#FF9900', badge: 'API Ready', badgeAr: 'API جاهز', region: 'global' },
  { id: 'alibaba', nameEn: 'Alibaba.com', nameAr: 'علي بابا', category: 'marketplace', description: 'Global B2B marketplace', descriptionAr: 'سوق B2B العالمي', color: '#FF6A00', badge: 'API Ready', badgeAr: 'API جاهز', region: 'global' },
  { id: 'salla', nameEn: 'Salla', nameAr: 'سلة', category: 'marketplace', description: 'Saudi e-commerce platform', descriptionAr: 'منصة التجارة الإلكترونية السعودية', color: '#5B4FBE', badge: 'Full Sync', badgeAr: 'تزامن كامل', region: 'ksa' },
  { id: 'zid', nameEn: 'Zid', nameAr: 'زد', category: 'marketplace', description: 'Saudi online store builder', descriptionAr: 'منشئ المتاجر الإلكترونية', color: '#1D4ED8', badge: 'Full Sync', badgeAr: 'تزامن كامل', region: 'ksa' },

  // ─── SECURITY ───
  { id: 'veeam', nameEn: 'Veeam Backup', nameAr: 'Veeam نسخ احتياطي', category: 'security', description: 'Data backup & recovery', descriptionAr: 'النسخ الاحتياطي واستعادة البيانات', color: '#00B336', badge: 'Active', badgeAr: 'نشط', region: 'global' },
  { id: 'fortinet', nameEn: 'Fortinet', nameAr: 'فورتي نت', category: 'security', description: 'Network security solutions', descriptionAr: 'حلول أمن الشبكات', color: '#DA1F26', badge: 'Certified', badgeAr: 'معتمد', region: 'global' },
  { id: 'ssl-comodo', nameEn: 'SSL / TLS Encryption', nameAr: 'تشفير SSL/TLS', category: 'security', description: '256-bit encrypted connections', descriptionAr: 'اتصالات مشفرة 256-bit', color: '#00843D', badge: 'Active', badgeAr: 'نشط', region: 'global', featured: true },
  { id: 'pci-dss', nameEn: 'PCI DSS Compliance', nameAr: 'معايير PCI DSS', category: 'security', description: 'Payment card security standard', descriptionAr: 'معيار أمان بطاقات الدفع', color: '#003087', badge: 'Compliant', badgeAr: 'ممتثل', region: 'global', featured: true },

  // ─── RESERVATIONS ───
  { id: 'eat', nameEn: 'Eat App', nameAr: 'Eat تطبيق', category: 'reservation', description: 'Restaurant reservation platform', descriptionAr: 'منصة حجز مطاعم', color: '#FF4444', badge: 'Full Sync', badgeAr: 'تزامن كامل', region: 'gcc', featured: true },
  { id: 'thefork', nameEn: 'TheFork (TripAdvisor)', nameAr: 'ذا فورك', category: 'reservation', description: 'Restaurant booking & reviews', descriptionAr: 'حجز مطاعم وتقييمات', color: '#00B050', badge: 'API Ready', badgeAr: 'API جاهز', region: 'global' },
  { id: 'tablecheck', nameEn: 'TableCheck', nameAr: 'تيبل تشيك', category: 'reservation', description: 'Restaurant management & reservations', descriptionAr: 'إدارة مطاعم وحجوزات', color: '#1A1A2E', badge: 'API Ready', badgeAr: 'API جاهز', region: 'global' },
  { id: 'sevenrooms', nameEn: 'SevenRooms', nameAr: 'سيفن رومز', category: 'reservation', description: 'Reservation & guest management', descriptionAr: 'إدارة الحجوزات والضيوف', color: '#2C3E50', badge: 'API Ready', badgeAr: 'API جاهز', region: 'global' },
];

export function getPartnersByCategory(cat: PartnerCategory): TechPartner[] {
  return TECH_PARTNERS.filter(p => p.category === cat);
}

export function getFeaturedPartners(): TechPartner[] {
  return TECH_PARTNERS.filter(p => p.featured);
}

export function getKsaPartners(): TechPartner[] {
  return TECH_PARTNERS.filter(p => p.region === 'ksa');
}
