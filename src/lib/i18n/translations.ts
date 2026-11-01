export type LanguageCode = 'en' | 'ur';

export interface TranslationDictionary {
  // Navigation & Common
  home: string;
  showroom: string;
  workshop: string;
  orders: string;
  cart: string;
  profile: string;
  settings: string;
  help: string;
  search: string;
  searchPlaceholder: string;
  viewAll: string;
  back: string;
  save: string;
  cancel: string;
  close: string;
  copy: string;
  copied: string;
  loading: string;
  inStock: string;
  outOfStock: string;
  price: string;
  addToCart: string;
  buyNow: string;
  checkout: string;
  total: string;
  subtotal: string;
  discount: string;
  quantity: string;
  active: string;
  status: string;

  // Categories
  all: string;
  sofas: string;
  doubleBeds: string;
  singleBeds: string;
  centerTables: string;
  wardrobes: string;
  mattresses: string;
  roomChairs: string;
  customFurniture: string;

  // Product Details
  productDetails: string;
  material: string;
  dimensions: string;
  finishColour: string;
  carvingStyle: string;
  customNotes: string;
  customNotesPlaceholder: string;
  warranty: string;
  whiteGlove: string;

  // Orders & Tracking
  myOrders: string;
  trackOrder: string;
  orderNumber: string;
  totalAmount: string;
  paidAmount: string;
  remainingBalance: string;
  orderStatus: string;
  craftingGallery: string;
  viewDetails: string;
  noOrders: string;

  // Workshop
  insideWorkshop: string;
  workshopMilestone: string;
  handcrafted: string;
  craftsmanshipTour: string;

  // Profile & Settings
  personalInfo: string;
  appLock: string;
  security: string;
  touchToUnlock: string;
  enterPin: string;
  forgotPin: string;
  biometricUnlock: string;
  theme: string;
  lightMode: string;
  darkMode: string;
  systemDefault: string;
  language: string;
  english: string;
  urdu: string;
  logOut: string;

  // Checkout & Payment
  paymentMethod: string;
  bankTransfer: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  paymentInstructions: string;
  uploadReceipt: string;
  receiptAttached: string;
  refNumber: string;
  refPlaceholder: string;
  deliveryAddress: string;
  contactDetails: string;
  fullName: string;
  phone: string;
  city: string;
  address: string;
  confirmOrder: string;
  orderSuccess: string;
  thankYou: string;
}

export const translations: Record<LanguageCode, TranslationDictionary> = {
  en: {
    home: 'Home',
    showroom: 'Showroom',
    workshop: 'Workshop',
    orders: 'Orders',
    cart: 'Cart',
    profile: 'Profile',
    settings: 'Settings',
    help: 'Help & Support',
    search: 'Search',
    searchPlaceholder: 'Search products, materials, SKU...',
    viewAll: 'View All',
    back: 'Back',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    copy: 'Copy',
    copied: 'Copied!',
    loading: 'Loading...',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',
    price: 'Price',
    addToCart: 'Add to Cart',
    buyNow: 'Buy Now',
    checkout: 'Checkout',
    total: 'Total',
    subtotal: 'Subtotal',
    discount: 'Discount',
    quantity: 'Quantity',
    active: 'Active',
    status: 'Status',

    all: 'All Pieces',
    sofas: 'Luxury Sofas',
    doubleBeds: 'Double Beds',
    singleBeds: 'Single Beds',
    centerTables: 'Center Tables',
    wardrobes: 'Wardrobes',
    mattresses: 'Mattresses',
    roomChairs: 'Room Chairs',
    customFurniture: 'Custom Furniture',

    productDetails: 'Product Details',
    material: 'Material',
    dimensions: 'Dimensions',
    finishColour: 'Finish / Colour',
    carvingStyle: 'Carving Style',
    customNotes: 'Custom Instructions / Notes',
    customNotesPlaceholder: 'e.g. Specific fabric color, height modifications...',
    warranty: '10-Year Frame Warranty',
    whiteGlove: 'White-Glove Placement',

    myOrders: 'My Orders & Crafting',
    trackOrder: 'Track Crafting',
    orderNumber: 'Order Number',
    totalAmount: 'Total Amount',
    paidAmount: 'Paid Amount',
    remainingBalance: 'Remaining Balance',
    orderStatus: 'Order Status',
    craftingGallery: 'Order Crafting Gallery',
    viewDetails: 'View Details',
    noOrders: 'No orders recorded yet.',

    insideWorkshop: 'Inside Our Workshop',
    workshopMilestone: 'Production Milestone',
    handcrafted: 'Handcrafted Bespoke Furniture',
    craftsmanshipTour: 'Workshop Tour & Milestones',

    personalInfo: 'Personal Information',
    appLock: 'App Lock & Biometrics',
    security: 'Security & Privacy',
    touchToUnlock: 'Touch Sensor to Unlock',
    enterPin: 'Enter Security PIN to Unlock',
    forgotPin: 'Forgot PIN? Unlock with password',
    biometricUnlock: 'Biometric Unlock',
    theme: 'Theme & Atmosphere',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    systemDefault: 'System Default',
    language: 'Display Language',
    english: 'English',
    urdu: 'اردو (Urdu)',
    logOut: 'Log Out',

    paymentMethod: 'Payment Method',
    bankTransfer: 'Direct Bank Transfer / Raast',
    bankName: 'Bank Name',
    accountTitle: 'Account Title',
    accountNumber: 'Account Number',
    iban: 'IBAN',
    paymentInstructions: 'Payment Instructions',
    uploadReceipt: 'Upload Transfer Screenshot / Receipt',
    receiptAttached: 'Receipt Attached ✓ (Tap to change)',
    refNumber: 'Transaction Reference ID',
    refPlaceholder: 'e.g. TRX-982341 or Bank Ref Number',
    deliveryAddress: 'Delivery Address',
    contactDetails: 'Contact Details',
    fullName: 'Full Name',
    phone: 'Phone Number',
    city: 'City',
    address: 'Street Address',
    confirmOrder: 'Place Order & Submit Payment',
    orderSuccess: 'Order Received Successfully',
    thankYou: 'Thank you for choosing Saad Furniture Atelier.',
  },

  ur: {
    home: 'ہوم',
    showroom: 'شو روم',
    workshop: 'ورکشاپ',
    orders: 'میرے آرڈرز',
    cart: 'ٹوکری',
    profile: 'پروفائل',
    settings: 'سیٹنگز',
    help: 'مدد اور رہنمائی',
    search: 'تلاش کریں',
    searchPlaceholder: 'فرنیچر، لکڑی یا کوڈ تلاش کریں...',
    viewAll: 'سب دیکھیں',
    back: 'واپس',
    save: 'محفوظ کریں',
    cancel: 'منسوخ کریں',
    close: 'بند کریں',
    copy: 'کاپی کریں',
    copied: 'کاپی ہو گیا!',
    loading: 'لوڈ ہو رہا ہے...',
    inStock: 'دستیاب ہے',
    outOfStock: 'ختم ہو چکا',
    price: 'قیمت',
    addToCart: 'ٹوکری میں ڈالیں',
    buyNow: 'ابھی خریدیں',
    checkout: 'چیک آؤٹ',
    total: 'کل رقم',
    subtotal: 'میزان',
    discount: 'رعایت',
    quantity: 'تعداد',
    active: 'فعال',
    status: 'صورتحال',

    all: 'تمام ورائٹی',
    sofas: 'شاہی صوفے',
    doubleBeds: 'ڈبل بیڈز',
    singleBeds: 'سنگل بیڈز',
    centerTables: 'سینٹر ٹیبلز',
    wardrobes: 'الماریاں',
    mattresses: 'گدے',
    roomChairs: 'کمرے کی کرسیاں',
    customFurniture: 'کسٹم فرنیچر',

    productDetails: 'پروڈکٹ کی تفصیلات',
    material: 'لکڑی و میٹریل',
    dimensions: 'پیمائش / سائز',
    finishColour: 'پالش و رنگ',
    carvingStyle: 'نقاشی کا انداز',
    customNotes: 'خصوصی فرمائش و ہدایات',
    customNotesPlaceholder: 'مثلاً کپڑے کا مخصوص رنگ یا اونچائی کی تبدیلی...',
    warranty: '10 سال لکڑی و فریم وارنٹی',
    whiteGlove: 'محفوظ گھر ترسیل و سیٹنگ',

    myOrders: 'میرے آرڈرز اور تیاری',
    trackOrder: 'آرڈر کی تیاری دیکھیں',
    orderNumber: 'آرڈر نمبر',
    totalAmount: 'کل رقم',
    paidAmount: 'ادا شدہ رقم',
    remainingBalance: 'بقایا رقم',
    orderStatus: 'آرڈر کی صورتحال',
    craftingGallery: 'تیاری کی لائیو گیلری',
    viewDetails: 'تفصیلات دیکھیں',
    noOrders: 'ابھی تک کوئی آرڈر موجود نہیں ہے۔',

    insideWorkshop: 'ہماری ورکشاپ کی جھلکیاں',
    workshopMilestone: 'تیاری کا مرحلہ',
    handcrafted: 'خالص لکڑی کا نفیس شاہکار',
    craftsmanshipTour: 'ورکشاپ کی لائیو ویڈیوز',

    personalInfo: 'ذاتی معلومات',
    appLock: 'ایپ لاک اور بائیومیٹرک',
    security: 'سیکیورٹی اور پرائیویسی',
    touchToUnlock: 'فنگر پرنٹ سینسر لگائیں',
    enterPin: 'ایپ کھولنے کے لیے پن درج کریں',
    forgotPin: 'پن بھول گئے؟ پاس ورڈ سے کھولیں',
    biometricUnlock: 'فنگر پرنٹ سے انلاک',
    theme: 'تھیم اور انداز',
    lightMode: 'لائٹ موڈ',
    darkMode: 'ڈارک موڈ',
    systemDefault: 'سسٹم ڈیفالٹ',
    language: 'زبان منتخب کریں',
    english: 'English (انگریزی)',
    urdu: 'اردو',
    logOut: 'لاگ آؤٹ',

    paymentMethod: 'طریقہ ادائیگی',
    bankTransfer: 'بینک ٹرانسفر / راست',
    bankName: 'بینک کا نام',
    accountTitle: 'اکاؤنٹ کا عنوان',
    accountNumber: 'اکاؤنٹ نمبر',
    iban: 'آئی بی اے این (IBAN)',
    paymentInstructions: 'ادائیگی کی ہدایات',
    uploadReceipt: 'رسید یا اسکرین شاٹ اپلوڈ کریں',
    receiptAttached: 'رسید منسلک ہو چکی ہے ✓ (تبدیل کرنے کے لیے دبائیں)',
    refNumber: 'ٹرانزیکشن ریفرنس نمبر',
    refPlaceholder: 'مثلاً TRX-982341 یا بینک ریفرنس نمبر',
    deliveryAddress: 'ڈیلیوری کا پتہ',
    contactDetails: 'رابطہ نمبر',
    fullName: 'پورا نام',
    phone: 'موبائل نمبر',
    city: 'شہر',
    address: 'مکمل گلی / محلہ پتہ',
    confirmOrder: 'آرڈر کنفرم کریں اور رسید بھیجیں',
    orderSuccess: 'آپ کا آرڈر کامیابی سے موصول ہو گیا ہے',
    thankYou: 'سعد فرنیچر کا انتخاب کرنے کا بے حد شکریہ۔',
  },
};

