import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// 1. Users Table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('customer'), // 'super_admin' | 'staff' | 'customer'
  permissions: text('permissions').default('[]'), // ['orders', 'media', 'delivery', 'accounts', 'products']
  status: text('status').notNull().default('active'), // 'active' | 'suspended'
  avatarUrl: text('avatar_url'),
  address: text('address'),
  city: text('city'),
  firstBusinessDate: text('first_business_date'), // Date when customer first started doing business with Saad Furniture
  marketingOptIn: integer('marketing_opt_in').notNull().default(1),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 2. Product Categories Table
export const productCategories = sqliteTable('product_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  imageUrl: text('image_url'),
});

// 3. Products Table
export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  sku: text('sku').notNull().unique(),
  category: text('category').notNull(), // Sofas, Double Beds, Single Beds, Wardrobes, Center Tables, Mattresses, Room Chairs, Custom Furniture
  description: text('description').notNull(),
  price: real('price').notNull(),
  priceOnRequest: integer('price_on_request').notNull().default(0),
  discountPrice: real('discount_price'),
  material: text('material').notNull(),
  dimensions: text('dimensions').notNull(),
  availableColours: text('available_colours').default('[]'), // JSON array
  availableDesigns: text('available_designs').default('[]'), // JSON array
  stockQuantity: integer('stock_quantity').notNull().default(1),
  status: text('status').notNull().default('available'), // 'available' | 'made_to_order' | 'out_of_stock' | 'custom_only'
  showroomLocation: text('showroom_location'), // e.g., 'Main Gallery A-14', 'VIP Salon 2'
  featured: integer('featured').notNull().default(0),
  images: text('images').notNull().default('[]'), // JSON array of URLs
  specs: text('specs').default('{}'), // JSON key-value
  createdAt: text('created_at').notNull(),
});

// 4. Orders Table
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(), // e.g. "SF-2026-101"
  customerId: text('customer_id').notNull().references(() => users.id),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  customerEmail: text('customer_email'),
  deliveryAddress: text('delivery_address'),

  // Product & Specification Details
  productName: text('product_name').notNull().default('Bespoke Furniture Commission'),
  productCategory: text('product_category').notNull().default('Living Room'),
  productDescription: text('product_description'),
  customDesignDetails: text('custom_design_details'),
  dimensions: text('dimensions'),
  fabricInfo: text('fabric_info'),
  colourInfo: text('colour_info'),
  quantity: integer('quantity').notNull().default(1),

  // Financials
  totalAmount: real('total_amount').notNull(),
  paidAmount: real('paid_amount').notNull().default(0), // Advance payment
  remainingBalance: real('remaining_balance').notNull().default(0), // Remaining balance
  currency: text('currency').notNull().default('USD'),

  // Dates
  expectedCompletionDate: text('expected_completion_date'),
  actualDeliveryDate: text('actual_delivery_date'),

  // Staff Assignment
  assignedStaffId: text('assigned_staff_id'),
  assignedStaffName: text('assigned_staff_name'),

  // Status & Progress Tracking
  orderStatus: text('order_status').notNull().default('in_production'), 
  // 'pending' | 'in_production' | 'quality_check' | 'ready_for_delivery' | 'out_for_delivery' | 'delivered' | 'delayed' | 'cancelled' | custom
  customStatus: text('custom_status'),
  isDelayed: integer('is_delayed').notNull().default(0),
  delayReason: text('delay_reason'),

  productionStage: text('production_stage').notNull().default('order_confirmed'),
  productionProgress: integer('production_progress').notNull().default(10), // 0 to 100
  customStages: text('custom_stages').default('[]'), // JSON array

  deliveryStatus: text('delivery_status').notNull().default('pending'),
  estimatedDeliveryDate: text('estimated_delivery_date'),
  deliveryDriverName: text('delivery_driver_name'),
  deliveryDriverPhone: text('delivery_driver_phone'),
  specialInstructions: text('special_instructions'),
  customSpecifications: text('custom_specifications').default('{}'), // JSON

  // E-Commerce Additions
  orderType: text('order_type').notNull().default('showroom'), // 'showroom' | 'online'
  paymentMethod: text('payment_method'), // 'card' | 'jazzcash' | 'bank_transfer' | 'cod'
  paymentStatus: text('payment_status').default('unpaid'), // 'paid' | 'pending_verification' | 'unpaid' | 'failed' | 'refunded'
  paymentTransactionId: text('payment_transaction_id'),
  bankReceiptUrl: text('bank_receipt_url'),

  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 5. Order Items Table
export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id),
  productId: text('product_id'),
  productTitle: text('product_title').notNull(),
  customDetails: text('custom_details'),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: real('unit_price').notNull(),
  totalPrice: real('total_price').notNull(),
});

// 6. Media Files Table (Google Drive 5TB storage integration with secure server-side token)
export const mediaFiles = sqliteTable('media_files', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id),
  customerId: text('customer_id').notNull().references(() => users.id),
  googleDriveFileId: text('google_drive_file_id').notNull(),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').default(0), // bytes
  mediaType: text('media_type').notNull(), // 'photo' | 'video' | 'drawing'
  title: text('title').notNull(),
  description: text('description'),
  stage: text('stage').notNull().default('frame_preparation'),
  thumbnailUrl: text('thumbnail_url'),
  videoDuration: real('video_duration'), // seconds
  webViewLink: text('web_view_link'),
  webContentLink: text('web_content_link'),
  uploadedBy: text('uploaded_by').notNull(),
  uploadedAt: text('uploaded_at').notNull(),
  isPublic: integer('is_public').notNull().default(0),
});

export const orderMedia = mediaFiles;

// 7. Delivery Records Table (Section 5)
export const deliveryRecords = sqliteTable('delivery_records', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id),
  customerId: text('customer_id').notNull().references(() => users.id),
  deliveryAddress: text('delivery_address').notNull(),
  customerContactNumber: text('customer_contact_number').notNull(),
  expectedDeliveryDate: text('expected_delivery_date'),
  deliveryTimeWindow: text('delivery_time_window'), // e.g. "10:00 AM - 01:00 PM"
  deliveryCharges: real('delivery_charges').notNull().default(0),
  assignedDeliveryStaff: text('assigned_delivery_staff'),
  assignedDeliveryStaffPhone: text('assigned_delivery_staff_phone'),
  deliveryNotes: text('delivery_notes'),
  deliveryStage: text('delivery_stage').notNull().default('preparing_for_dispatch'),
  // 'preparing_for_dispatch' | 'packing_completed' | 'ready_for_dispatch' | 'dispatched' | 'out_for_delivery' | 'delivered_successfully'
  dispatchDate: text('dispatch_date'),
  deliveredDate: text('delivered_date'),
  deliveryPhotographs: text('delivery_photographs').default('[]'), // JSON array of photo URLs
  deliveryConfirmationSignature: text('delivery_confirmation_signature'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 8. Delivery Status History Table
export const deliveryStatusHistory = sqliteTable('delivery_status_history', {
  id: text('id').primaryKey(),
  deliveryRecordId: text('delivery_record_id').notNull(),
  orderId: text('order_id').notNull().references(() => orders.id),
  stage: text('stage').notNull(),
  notes: text('notes'),
  updatedBy: text('updated_by').notNull(),
  createdAt: text('created_at').notNull(),
});

// 9. Payments Table
export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  paymentNumber: text('payment_number').notNull().unique(), // e.g. "REC-9031"
  orderId: text('order_id').notNull().references(() => orders.id),
  customerId: text('customer_id').notNull().references(() => users.id),
  amount: real('amount').notNull(),
  paymentMethod: text('payment_method').notNull().default('Bank Transfer'), 
  // 'Cash' | 'Bank Transfer' | 'JazzCash' | 'EasyPaisa' | 'Other'
  paymentType: text('payment_type').notNull().default('Initial Deposit'), 
  // 'Initial Deposit' | 'Progress Installment' | 'Final Balance' | 'Full Payment'
  transactionReference: text('transaction_reference'),
  receiptUrl: text('receipt_url'),
  notes: text('notes'),
  receivedBy: text('received_by').notNull(),
  isReversed: integer('is_reversed').notNull().default(0),
  reversalReason: text('reversal_reason'),
  createdAt: text('created_at').notNull(),
});

// 10. Customer Ledger Table (Section 6)
export const customerLedger = sqliteTable('customer_ledger', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull().references(() => users.id),
  orderId: text('order_id'),
  entryType: text('entry_type').notNull(), // 'sale_debit' | 'payment_credit' | 'adjustment' | 'reversal'
  amount: real('amount').notNull(),
  balanceAfter: real('balance_after').notNull(),
  description: text('description').notNull(),
  paymentMethod: text('payment_method'), // 'Cash' | 'Bank Transfer' | 'JazzCash' | 'EasyPaisa' | 'Other'
  reference: text('reference'),
  recordedBy: text('recorded_by').notNull(),
  isReversed: integer('is_reversed').notNull().default(0),
  reversalReason: text('reversal_reason'),
  createdAt: text('created_at').notNull(),
});

// 11. Order Timeline Events Table
export const orderTimelineEvents = sqliteTable('order_timeline_events', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  stage: text('stage').notNull(),
  eventType: text('event_type').notNull().default('production'), // 'production' | 'delivery' | 'payment' | 'note'
  performedBy: text('performed_by').notNull(),
  createdAt: text('created_at').notNull(),
});

// 12. Notifications Table
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(), // Specific user ID or 'all' for announcements
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().default('order_update'), // 'order_update' | 'payment_received' | 'stage_completed' | 'delivery_update' | 'media_uploaded' | 'announcement' | 'product_update'
  relatedOrderId: text('related_order_id'),
  isRead: integer('is_read').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

// 13. Notification Preferences Table (Section 7)
export const notificationPreferences = sqliteTable('notification_preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id),
  emailNotifications: integer('email_notifications').notNull().default(1),
  smsNotifications: integer('sms_notifications').notNull().default(1),
  pushNotifications: integer('push_notifications').notNull().default(1),
  marketingOptIn: integer('marketing_opt_in').notNull().default(1),
  updatedAt: text('updated_at').notNull(),
});

// 14. Push Subscriptions Table (FCM)
export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  fcmToken: text('fcm_token').notNull(),
  deviceType: text('device_type').notNull().default('desktop'), // 'android' | 'desktop' | 'ios' | 'pwa'
  createdAt: text('created_at').notNull(),
});

// 15. Communication Logs Table (Section 8: Email & SMS / WhatsApp)
export const communicationLogs = sqliteTable('communication_logs', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull().references(() => users.id),
  channel: text('channel').notNull(), // 'email' | 'sms' | 'whatsapp'
  recipient: text('recipient').notNull(),
  subject: text('subject'),
  messageBody: text('message_body').notNull(),
  status: text('status').notNull().default('sent'), // 'sent' | 'failed' | 'pending'
  errorMessage: text('error_message'),
  relatedOrderId: text('related_order_id'),
  retryCount: integer('retry_count').notNull().default(0),
  sentAt: text('sent_at').notNull(),
});

// 16. Product Inquiries Table (Section 9)
export const productInquiries = sqliteTable('product_inquiries', {
  id: text('id').primaryKey(),
  productId: text('product_id'),
  productTitle: text('product_title').notNull(),
  customerId: text('customer_id'),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  customerEmail: text('customer_email'),
  inquiryType: text('inquiry_type').notNull().default('quotation'), // 'quotation' | 'custom_order' | 'showroom_viewing'
  message: text('message').notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'responded' | 'closed'
  createdAt: text('created_at').notNull(),
});

// 17. Security & Activity Audit Logs Table
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  action: text('action').notNull(),
  details: text('details').notNull(),
  ipAddress: text('ip_address'),
  createdAt: text('created_at').notNull(),
});

// 18. Settings Table
export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(), // 'system_settings'
  companyName: text('company_name').notNull().default('Saad Furniture'),
  currencySymbol: text('currency_symbol').notNull().default('$'),
  googleDriveFolderId: text('google_drive_folder_id'),
  googleDriveServiceAccountEmail: text('google_drive_service_account_email'),
  googleDriveKeyConfigured: integer('google_drive_key_configured').notNull().default(0),
  fcmServerKeyConfigured: integer('fcm_server_key_configured').notNull().default(0),
  emailProvider: text('email_provider').default('smtp'), // 'smtp' | 'resend' | 'sendgrid'
  smsProvider: text('sms_provider').default('twilio'), // 'twilio' | 'whatsapp_business' | 'local_gateway'
  showroomAddress: text('showroom_address').default('Saad Luxury Showroom, Boulevard Prestige, Suite 400'),
  supportPhone: text('support_phone').default('+1 (800) 555-SAAD'),
  supportEmail: text('support_email').default('concierge@saadfurniture.com'),
  websiteAnnouncementBanner: text('website_announcement_banner').default('Welcome to Saad Furniture – Handcrafted Luxury for Discerning Spaces.'),
});

// 19. Shopping Carts Table
export const shoppingCarts = sqliteTable('shopping_carts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  sessionToken: text('session_token'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 20. Cart Items Table
export const cartItems = sqliteTable('cart_items', {
  id: text('id').primaryKey(),
  cartId: text('cart_id').notNull().references(() => shoppingCarts.id),
  productId: text('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull().default(1),
  selectedColour: text('selected_colour'),
  selectedDesign: text('selected_design'),
  customNotes: text('custom_notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 21. Wishlists Table
export const wishlists = sqliteTable('wishlists', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  productId: text('product_id').notNull().references(() => products.id),
  createdAt: text('created_at').notNull(),
});

// 22. Customer Addresses Table
export const customerAddresses = sqliteTable('customer_addresses', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title').notNull().default('Home'), // 'Home' | 'Office' | 'Villa'
  recipientName: text('recipient_name').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  area: text('area'),
  postalCode: text('postal_code'),
  isDefault: integer('is_default').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

// 23. Payment Transactions Table
export const paymentTransactions = sqliteTable('payment_transactions', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id),
  userId: text('user_id').notNull().references(() => users.id),
  gateway: text('gateway').notNull(), // 'card' | 'jazzcash' | 'bank_transfer' | 'cod'
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull().default('initiated'), // 'initiated' | 'pending' | 'success' | 'failed' | 'refunded'
  gatewayTransactionRef: text('gateway_transaction_ref'),
  gatewayResponse: text('gateway_response'),
  createdAt: text('created_at').notNull(),
  verifiedAt: text('verified_at'),
});

// 24. Bank Transfer Receipts Table
export const bankTransferReceipts = sqliteTable('bank_transfer_receipts', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id),
  userId: text('user_id').notNull().references(() => users.id),
  bankName: text('bank_name').notNull(),
  senderAccountTitle: text('sender_account_title').notNull(),
  senderAccountNumber: text('sender_account_number'),
  transactionReference: text('transaction_reference').notNull(),
  amountPaid: real('amount_paid').notNull(),
  receiptImageUrl: text('receipt_image_url').notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  reviewNotes: text('review_notes'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: text('reviewed_at'),
  createdAt: text('created_at').notNull(),
});

// 25. Coupons Table
export const coupons = sqliteTable('coupons', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  discountType: text('discount_type').notNull().default('percentage'), // 'percentage' | 'fixed'
  discountValue: real('discount_value').notNull(),
  minOrderAmount: real('min_order_amount').notNull().default(0),
  maxDiscountAmount: real('max_discount_amount'),
  validUntil: text('valid_until'),
  usageLimit: integer('usage_limit').notNull().default(100),
  usedCount: integer('used_count').notNull().default(0),
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at').notNull(),
});

// 26. Product Reviews Table
export const productReviews = sqliteTable('product_reviews', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id),
  userId: text('user_id').notNull().references(() => users.id),
  userName: text('user_name').notNull(),
  rating: integer('rating').notNull(), // 1 to 5
  comment: text('comment').notNull(),
  createdAt: text('created_at').notNull(),
});

// 27. Shop Profile Settings Table (Section 4)
export const shopSettings = sqliteTable('shop_settings', {
  id: text('id').primaryKey(), // 'default'
  shopName: text('shop_name').notNull().default('SAAD FURNITURE'),
  displayName: text('display_name').notNull().default('Saad Furniture & Interior Studio'),
  logoUrl: text('logo_url').default('/assets/branding/logo.svg'),
  appIconUrl: text('app_icon_url').default('/assets/branding/app-dp.svg'),
  splashLogoUrl: text('splash_logo_url').default('/assets/branding/splash-logo.svg'),
  description: text('description').default('Premium handcrafted furniture atelier creating bespoke architectural woodcraft, royal bedroom suites, executive sofas, and master living room furniture built for generations.'),
  tagline: text('tagline').default('Handcrafted Luxury Built For Generations'),
  primaryPhone: text('primary_phone').default('+92 300 0000000'),
  secondaryPhone: text('secondary_phone').default('+92 321 0000000'),
  whatsappNumber: text('whatsapp_number').default('+92 300 0000000'),
  officialEmail: text('official_email').default('info@saadfurniture.com'),
  supportEmail: text('support_email').default('concierge@saadfurniture.com'),
  completeAddress: text('complete_address').default('Main Boulevard, Gulberg III / Defense Phase 6, Lahore, Pakistan'),
  city: text('city').default('Lahore'),
  socialLinks: text('social_links').default(
    JSON.stringify({
      facebook: { url: 'https://facebook.com/saadfurniture', enabled: true },
      instagram: { url: 'https://instagram.com/saadfurniture', enabled: true },
      tiktok: { url: 'https://tiktok.com/@saadfurniture', enabled: true },
      youtube: { url: 'https://youtube.com/@saadfurniture', enabled: true },
      whatsapp: { url: 'https://wa.me/923000000000', enabled: true },
      website: { url: 'https://saadfurniture-iota.vercel.app', enabled: true }
    })
  ),
  openingHours: text('opening_hours').default('Mon - Sat: 10:00 AM - 10:00 PM | Sunday: 02:00 PM - 10:00 PM'),
  currency: text('currency').notNull().default('PKR'),
  warrantyInformation: text('warranty_information').default('10-Year Lifetime Structural Warranty on Seasoned Teak & Sheesham Timber with 5-Year High-Density Foam Assurance.'),
  deliveryInformation: text('delivery_information').default('White-Glove Nationwide Secure Transport with Protective Double-Corrugated Foam Packing and Complimentary In-Room Assembly in Lahore, Islamabad, & Karachi.'),
  updatedAt: text('updated_at').notNull(),
  updatedBy: text('updated_by').notNull().default('super_admin'),
});

export type User = typeof users.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type MediaFile = typeof mediaFiles.$inferSelect;
export type DeliveryRecord = typeof deliveryRecords.$inferSelect;
export type CustomerLedger = typeof customerLedger.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type ShoppingCart = typeof shoppingCarts.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type Wishlist = typeof wishlists.$inferSelect;
export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type BankTransferReceipt = typeof bankTransferReceipts.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type ProductReview = typeof productReviews.$inferSelect;
export type ShopSettings = typeof shopSettings.$inferSelect;
