import bcrypt from 'bcryptjs';
import { db, initializeDatabase } from './index';
import {
  users,
  productCategories,
  products,
  orders,
  orderItems,
  mediaFiles,
  deliveryRecords,
  deliveryStatusHistory,
  payments,
  customerLedger,
  orderTimelineEvents,
  settings,
  notifications,
  notificationPreferences,
  coupons,
} from './schema';
import { eq } from 'drizzle-orm';

export async function seedDatabase() {
  await initializeDatabase();

  const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@saadfurniture.com')).limit(1);
  if (existingAdmin.length > 0) {
    return; // Already initialized
  }

  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('Admin@Saad2026', saltRounds);
  const staffPasswordHash = await bcrypt.hash('Staff@Saad2026', saltRounds);
  const customerPasswordHash = await bcrypt.hash('Customer@2026', saltRounds);

  const now = new Date().toISOString();

  // 1. Settings
  await db.insert(settings).values({
    id: 'system_settings',
    companyName: 'Saad Furniture',
    currencySymbol: '$',
    googleDriveFolderId: '1_saad_furniture_vault_root_5tb',
    googleDriveServiceAccountEmail: 'storage-service@saad-furniture-storage.iam.gserviceaccount.com',
    googleDriveKeyConfigured: 1,
    fcmServerKeyConfigured: 1,
    emailProvider: 'smtp',
    smsProvider: 'twilio',
    showroomAddress: 'Saad Grand Showroom, 742 Prestige Avenue, Luxury Design District',
    supportPhone: '+1 (800) 555-SAAD',
    supportEmail: 'concierge@saadfurniture.com',
    websiteAnnouncementBanner: 'Saad Furniture Private Exhibition: New Bespoke Handcrafted Collection Now on Display.',
  }).onConflictDoNothing();

  // 2. Product Categories (Section 9)
  const categoriesList = [
    { id: 'cat_sofas', name: 'Sofas', slug: 'sofas', description: 'Handcrafted luxury velvet and leather sectional suites and chesterfields.' },
    { id: 'cat_double_beds', name: 'Double Beds', slug: 'double-beds', description: 'Architectural canopy beds, solid teak and upholstered master suites.' },
    { id: 'cat_single_beds', name: 'Single Beds', slug: 'single-beds', description: 'Artisan carved single and daybed collections.' },
    { id: 'cat_wardrobes', name: 'Wardrobes', slug: 'wardrobes', description: 'Custom walk-in armoires, fluted walnut and brass fitted closets.' },
    { id: 'cat_center_tables', name: 'Center Tables', slug: 'center-tables', description: 'Sculptural marble, solid black walnut, and smoked glass coffee tables.' },
    { id: 'cat_mattresses', name: 'Mattresses', slug: 'mattresses', description: 'Multi-zone orthopedic cashmere and natural latex master bedding.' },
    { id: 'cat_room_chairs', name: 'Room Chairs', slug: 'room-chairs', description: 'Ergonomic executive armchairs, velvet club seating and accent pieces.' },
    { id: 'cat_custom_furniture', name: 'Custom Furniture', slug: 'custom-furniture', description: 'Bespoke one-of-a-kind architectural interior commissions.' },
  ];

  for (const c of categoriesList) {
    await db.insert(productCategories).values(c).onConflictDoNothing();
  }

  // 3. Super Admin
  await db.insert(users).values({
    id: 'usr_super_admin',
    name: 'Saad Al-Khatib (Principal Architect & Owner)',
    email: 'admin@saadfurniture.com',
    phone: '+1 (555) 777-0100',
    passwordHash: adminPasswordHash,
    role: 'super_admin',
    permissions: JSON.stringify(['orders', 'media', 'delivery', 'accounts', 'products']),
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    address: 'Executive Suite 1, Saad Furniture Headquarters',
    city: 'New York',
    firstBusinessDate: '2018-01-01',
    marketingOptIn: 1,
    createdAt: now,
    updatedAt: now,
  });

  // 4. Staff Members
  const staffMembers = [
    { id: 'usr_staff_orders', name: 'Tariq Mansour', email: 'tariq.orders@saadfurniture.com', phone: '+1 (555) 777-0101', permissions: ['orders'], avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
    { id: 'usr_staff_media', name: 'Layla Al-Sayed', email: 'layla.media@saadfurniture.com', phone: '+1 (555) 777-0102', permissions: ['media'], avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' },
    { id: 'usr_staff_delivery', name: 'Omar Farooq', email: 'omar.delivery@saadfurniture.com', phone: '+1 (555) 777-0103', permissions: ['delivery'], avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80' },
    { id: 'usr_staff_accounts', name: 'Zayn Kassam', email: 'zayn.finance@saadfurniture.com', phone: '+1 (555) 777-0104', permissions: ['accounts'], avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80' },
    { id: 'usr_staff_products', name: 'Samira Haddad', email: 'samira.catalog@saadfurniture.com', phone: '+1 (555) 777-0105', permissions: ['products'], avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80' },
  ];

  for (const s of staffMembers) {
    await db.insert(users).values({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      passwordHash: staffPasswordHash,
      role: 'staff',
      permissions: JSON.stringify(s.permissions),
      status: 'active',
      avatarUrl: s.avatar,
      address: 'Saad Operations Center',
      city: 'New York',
      firstBusinessDate: '2022-04-10',
      marketingOptIn: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  // 5. VIP Customers
  const customer1Id = 'usr_cust_vance';
  const customer2Id = 'usr_cust_eleanor';
  const customer3Id = 'usr_cust_malik';

  await db.insert(users).values([
    {
      id: customer1Id,
      name: 'Alexander Vance',
      email: 'alexander.vance@example.com',
      phone: '+1 (555) 234-8901',
      passwordHash: customerPasswordHash,
      role: 'customer',
      permissions: '[]',
      status: 'active',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
      address: '740 Park Avenue, Penthouse 18B',
      city: 'Manhattan, New York',
      firstBusinessDate: '2024-03-15',
      marketingOptIn: 1,
      createdAt: '2024-03-15T10:00:00Z',
      updatedAt: now,
    },
    {
      id: customer2Id,
      name: 'Eleanor Montgomery',
      email: 'eleanor.montgomery@example.com',
      phone: '+1 (555) 876-5432',
      passwordHash: customerPasswordHash,
      role: 'customer',
      permissions: '[]',
      status: 'active',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      address: '22 Ocean Drive, Villa Bellissima',
      city: 'Greenwich, Connecticut',
      firstBusinessDate: '2023-11-10',
      marketingOptIn: 1,
      createdAt: '2023-11-10T14:30:00Z',
      updatedAt: now,
    },
    {
      id: customer3Id,
      name: 'Dr. Hamza Malik',
      email: 'hamza.malik@example.com',
      phone: '+1 (555) 432-1098',
      passwordHash: customerPasswordHash,
      role: 'customer',
      permissions: '[]',
      status: 'active',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      address: '15 Crescent Hill Road',
      city: 'Boston, Massachusetts',
      firstBusinessDate: '2025-01-20',
      marketingOptIn: 1,
      createdAt: '2025-01-20T09:15:00Z',
      updatedAt: now,
    },
  ]);

  // Seed notification preferences
  for (const cid of [customer1Id, customer2Id, customer3Id]) {
    await db.insert(notificationPreferences).values({
      id: `pref_${cid}`,
      userId: cid,
      emailNotifications: 1,
      smsNotifications: 1,
      pushNotifications: 1,
      marketingOptIn: 1,
      updatedAt: now,
    }).onConflictDoNothing();
  }

  // 6. Products across all 8 categories
  const fullCatalogue = [
    {
      id: 'prod_sof_01',
      title: 'Aura Curved Emerald Velvet Modular Sectional',
      sku: 'SF-SOF-001',
      category: 'Sofas',
      description: 'An architectural statement piece enveloped in stain-resistant emerald Italian mohair velvet with multi-density goose down cushioning.',
      price: 12500,
      priceOnRequest: 0,
      discountPrice: 11800,
      material: 'Italian Mohair Velvet & Kiln-Dried European Beechwood',
      dimensions: '380cm W x 240cm D x 82cm H',
      availableColours: JSON.stringify(['Emerald Green', 'Cognac Saddle', 'Royal Navy', 'Ivory Boucle']),
      availableDesigns: JSON.stringify(['Left-Hand Chaise', 'Right-Hand Chaise', 'Symmetrical U-Shape']),
      stockQuantity: 3,
      status: 'available',
      showroomLocation: 'Atrium Salon 1',
      featured: 1,
      images: JSON.stringify(['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80']),
      createdAt: now,
    },
    {
      id: 'prod_bed_02',
      title: 'Monarch Teak & Champagne Brass Canopy Bed',
      sku: 'SF-BED-002',
      category: 'Double Beds',
      description: 'Hand-turned aged teak pillars crowned with champagne brushed brass finials and fluted boucle upholstered headboard.',
      price: 9800,
      priceOnRequest: 0,
      discountPrice: null,
      material: 'Grade-A Burmese Teak, Brushed Brass & High-Performance Boucle',
      dimensions: 'King Size: 215cm W x 225cm L x 230cm H',
      availableColours: JSON.stringify(['Natural Golden Teak', 'Aged Smoked Teak', 'Espresso Matte']),
      availableDesigns: JSON.stringify(['King Size', 'Super King Size', 'California King']),
      stockQuantity: 2,
      status: 'available',
      showroomLocation: 'Master Sanctuary Bay 3',
      featured: 1,
      images: JSON.stringify(['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80']),
      createdAt: now,
    },
    {
      id: 'prod_sgl_03',
      title: 'Atelier Artisan Carved Daybed & Single Suite',
      sku: 'SF-SGL-003',
      category: 'Single Beds',
      description: 'Hand-carved French walnut daybed with upholstered bolster cushions in hand-spun wool and concealed trundle drawer.',
      price: 4900,
      priceOnRequest: 0,
      discountPrice: null,
      material: 'Solid French Walnut & Hand-Spun Wool',
      dimensions: '110cm W x 210cm L x 90cm H',
      availableColours: JSON.stringify(['French Walnut', 'Oatmeal Wool']),
      availableDesigns: JSON.stringify(['With Bolster Pillows', 'With Storage Trundle']),
      stockQuantity: 4,
      status: 'available',
      showroomLocation: 'Studio Salon 2',
      featured: 0,
      images: JSON.stringify(['https://images.unsplash.com/photo-1540518614846-7ede433c4ef4?auto=format&fit=crop&w=1200&q=80']),
      createdAt: now,
    },
    {
      id: 'prod_war_04',
      title: 'Grand Palais Fluted Walnut 4-Door Armoire',
      sku: 'SF-WAR-004',
      category: 'Wardrobes',
      description: 'Solid American black walnut with rhythmic vertical fluting, illuminated cedar-lined interior, integrated sensor LED lighting, and Italian brass handles.',
      price: 14200,
      priceOnRequest: 0,
      discountPrice: 13500,
      material: 'Solid American Walnut, Spanish Cedar & Brass Hardware',
      dimensions: '280cm W x 65cm D x 240cm H',
      availableColours: JSON.stringify(['Black Walnut', 'Bleached Oak']),
      availableDesigns: JSON.stringify(['4-Door Configuration', '6-Door Custom Extension']),
      stockQuantity: 2,
      status: 'available',
      showroomLocation: 'Grand Dressing Pavilion',
      featured: 1,
      images: JSON.stringify(['https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80']),
      createdAt: now,
    },
    {
      id: 'prod_tbl_05',
      title: 'Solstice Calacatta Marble & Walnut Coffee Table',
      sku: 'SF-TBL-005',
      category: 'Center Tables',
      description: 'Bookmatched Italian Calacatta Oro marble slab floating over a sculptural solid walnut base with brushed gold brass inlay.',
      price: 4200,
      priceOnRequest: 0,
      discountPrice: null,
      material: 'Calacatta Oro Marble, American Walnut & Solid Brass',
      dimensions: '160cm L x 90cm W x 42cm H',
      availableColours: JSON.stringify(['Calacatta White / Gold', 'Nero Marquina / Walnut']),
      availableDesigns: JSON.stringify(['Oval Silhouette', 'Architectural Rectangle']),
      stockQuantity: 5,
      status: 'available',
      showroomLocation: 'Main Floor Promenade',
      featured: 1,
      images: JSON.stringify(['https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=80']),
      createdAt: now,
    },
    {
      id: 'prod_mat_06',
      title: 'Elysian 7-Zone Cashmere & Natural Latex Master Mattress',
      sku: 'SF-MAT-006',
      category: 'Mattresses',
      description: 'Hand-tufted organic cashmere, New Zealand wool, Talalay natural latex, and 3,200 pocketed micro-coils for weightless ergonomic support.',
      price: 3800,
      priceOnRequest: 0,
      discountPrice: null,
      material: 'Mongolian Cashmere, Organic Latex & Pocketed Coils',
      dimensions: 'King Size: 200cm W x 200cm L x 36cm H',
      availableColours: JSON.stringify(['Natural Ivory Damask']),
      availableDesigns: JSON.stringify(['Medium Firm Luxury', 'Plush Pillowtop']),
      stockQuantity: 8,
      status: 'available',
      showroomLocation: 'Sleep Suite A',
      featured: 0,
      images: JSON.stringify(['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80']),
      createdAt: now,
    },
    {
      id: 'prod_chr_07',
      title: 'The Sovereign Executive High-Back Leather Armchair',
      sku: 'SF-CHR-007',
      category: 'Room Chairs',
      description: 'Full-grain Italian cognac leather, hand-rubbed aniline finish, synchronous tilt mechanism with walnut timber arms.',
      price: 3600,
      priceOnRequest: 0,
      discountPrice: 3200,
      material: 'Full-Grain Italian Aniline Leather & Solid Walnut',
      dimensions: '75cm W x 82cm D x 115cm H',
      availableColours: JSON.stringify(['Cognac Saddle', 'Obsidian Black', 'British Racing Green']),
      availableDesigns: JSON.stringify(['Executive High-Back', 'Lounge Low-Back']),
      stockQuantity: 6,
      status: 'available',
      showroomLocation: 'Gentleman Lounge Bay',
      featured: 1,
      images: JSON.stringify(['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80']),
      createdAt: now,
    },
    {
      id: 'prod_cst_08',
      title: 'Bespoke Presidential Conference & Dining Suite',
      sku: 'SF-CST-008',
      category: 'Custom Furniture',
      description: 'Commissioned 16-seater live-edge rare Claro walnut table with custom cast bronze monolithic pedestals.',
      price: 28000,
      priceOnRequest: 1,
      discountPrice: null,
      material: 'Rare Claro Walnut & Cast Bronze Monoliths',
      dimensions: '520cm L x 140cm W x 76cm H',
      availableColours: JSON.stringify(['Custom Commission']),
      availableDesigns: JSON.stringify(['Tailored to Architectural Brief']),
      stockQuantity: 1,
      status: 'custom_only',
      showroomLocation: 'VIP Private Commission Chamber',
      featured: 1,
      images: JSON.stringify(['https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80']),
      createdAt: now,
    },
  ];

  for (const p of fullCatalogue) {
    await db.insert(products).values(p).onConflictDoNothing();
  }

  // 7. Orders for Alexander Vance
  const order1Id = 'ord_sf_2026_101';
  await db.insert(orders).values({
    id: order1Id,
    orderNumber: 'SF-2026-101',
    customerId: customer1Id,
    customerName: 'Alexander Vance',
    customerPhone: '+1 (555) 234-8901',
    customerEmail: 'alexander.vance@example.com',
    deliveryAddress: '740 Park Avenue, Penthouse 18B, Manhattan, NY',

    productName: 'The Sovereign Executive Mahogany Desk Suite',
    productCategory: 'Executive Office',
    productDescription: 'Master carved Honduran mahogany with top-grain Italian leather writing pad and wireless charging bay.',
    customDesignDetails: 'Custom Monogram "AV", Dark Espresso High Lustre finish with antique brass drawer pulls.',
    dimensions: '220cm W x 105cm D x 78cm H',
    fabricInfo: 'Top-Grain Italian Saddle Leather Pad',
    colourInfo: 'Dark Espresso Polish & Cognac Saddle',
    quantity: 1,

    totalAmount: 8500,
    paidAmount: 5000,
    remainingBalance: 3500,
    currency: 'USD',

    expectedCompletionDate: '2026-11-20',
    assignedStaffId: 'usr_staff_orders',
    assignedStaffName: 'Tariq Mansour',

    orderStatus: 'in_production',
    productionStage: 'foam_upholstery',
    productionProgress: 65,
    customStages: '[]',

    deliveryStatus: 'preparing_for_dispatch',
    estimatedDeliveryDate: '2026-11-22',
    deliveryDriverName: 'Marcus Vance Transport Specialists',
    deliveryDriverPhone: '+1 (555) 300-8812',
    specialInstructions: 'White glove delivery required. Service elevator reserved between 10 AM - 1 PM. Use shoe covers.',
    createdAt: '2026-10-10T09:00:00Z',
    updatedAt: now,
  });

  await db.insert(orderItems).values({
    id: 'item_101_1',
    orderId: order1Id,
    productId: 'prod_chr_07',
    productTitle: 'The Sovereign Executive Mahogany Desk (Custom Monogrammed)',
    customDetails: 'Custom Monogram "AV", Dark Espresso Finish',
    quantity: 1,
    unitPrice: 8500,
    totalPrice: 8500,
  });

  // 8. Media Files (Google Drive 5TB storage integration with video/photos)
  await db.insert(mediaFiles).values([
    {
      id: 'med_file_101_1',
      orderId: order1Id,
      customerId: customer1Id,
      googleDriveFileId: 'gdrive_slab_inspect_101_5tb',
      fileName: 'mahogany_timber_selection.jpg',
      mimeType: 'image/jpeg',
      fileSize: 4200000,
      mediaType: 'photo',
      title: 'Centuries-Old Honduran Mahogany Slab Selection',
      description: 'Grain orientation and moisture content tested at 8.2% in kiln drying facility.',
      stage: 'material_selection',
      thumbnailUrl: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=400&q=80',
      webViewLink: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=1200&q=80',
      webContentLink: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=1200&q=80',
      uploadedBy: 'Layla Al-Sayed (Media Manager)',
      uploadedAt: '2026-10-14T11:20:00Z',
      isPublic: 0,
    },
    {
      id: 'med_file_101_2',
      orderId: order1Id,
      customerId: customer1Id,
      googleDriveFileId: 'gdrive_joinery_101_5tb',
      fileName: 'dovetail_joinery_carving.jpg',
      mimeType: 'image/jpeg',
      fileSize: 5100000,
      mediaType: 'photo',
      title: 'Hand-Cut Dovetail Joinery & Secret Compartment Crafting',
      description: 'Senior cabinetmaker completed mortise-and-tenon structural joints.',
      stage: 'frame_preparation',
      thumbnailUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80',
      webViewLink: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80',
      webContentLink: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80',
      uploadedBy: 'Layla Al-Sayed (Media Manager)',
      uploadedAt: '2026-10-18T14:45:00Z',
      isPublic: 0,
    },
    {
      id: 'med_file_101_3',
      orderId: order1Id,
      customerId: customer1Id,
      googleDriveFileId: 'gdrive_video_leather_101_5tb',
      fileName: 'artisan_leather_stitching.mp4',
      mimeType: 'video/mp4',
      fileSize: 48500000,
      mediaType: 'video',
      title: 'Artisan Video: Hand-Stitching Full-Grain Italian Leather Pad',
      description: 'Master leather artisan saddle-stitching cognac aniline hide with bonded wax thread.',
      stage: 'foam_upholstery',
      videoDuration: 42.5,
      thumbnailUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
      webViewLink: 'https://assets.mixkit.co/videos/preview/mixkit-carpenter-measuring-a-piece-of-wood-41584-large.mp4',
      webContentLink: 'https://assets.mixkit.co/videos/preview/mixkit-carpenter-measuring-a-piece-of-wood-41584-large.mp4',
      uploadedBy: 'Layla Al-Sayed (Media Manager)',
      uploadedAt: '2026-10-28T10:30:00Z',
      isPublic: 0,
    },
  ]);

  // 9. Delivery Records & History for Order 1 (Section 5)
  const delivRecordId = 'deliv_sf_101';
  await db.insert(deliveryRecords).values({
    id: delivRecordId,
    orderId: order1Id,
    customerId: customer1Id,
    deliveryAddress: '740 Park Avenue, Penthouse 18B, Manhattan, NY',
    customerContactNumber: '+1 (555) 234-8901',
    expectedDeliveryDate: '2026-11-22',
    deliveryTimeWindow: '10:00 AM - 01:00 PM',
    deliveryCharges: 350,
    assignedDeliveryStaff: 'Marcus Vance & White Glove Team 2',
    assignedDeliveryStaffPhone: '+1 (555) 300-8812',
    deliveryNotes: 'Building super clearance required. Freight elevator padded protection confirmed.',
    deliveryStage: 'preparing_for_dispatch',
    dispatchDate: null,
    deliveredDate: null,
    deliveryPhotographs: '[]',
    deliveryConfirmationSignature: null,
    createdAt: '2026-10-10T09:30:00Z',
    updatedAt: now,
  });

  await db.insert(deliveryStatusHistory).values([
    {
      id: 'deliv_hist_1',
      deliveryRecordId: delivRecordId,
      orderId: order1Id,
      stage: 'preparing_for_dispatch',
      notes: 'Custom protective timber crate commissioned for transatlantic and penthouse lift standards.',
      updatedBy: 'Omar Farooq (Delivery Manager)',
      createdAt: '2026-10-25T10:00:00Z',
    },
  ]);

  // 10. Financial Payments & Customer Ledger (Section 6)
  // Payment 1
  const payment1Id = 'pay_rec_9031';
  await db.insert(payments).values({
    id: payment1Id,
    paymentNumber: 'REC-9031',
    orderId: order1Id,
    customerId: customer1Id,
    amount: 5000,
    paymentMethod: 'Bank Transfer',
    paymentType: 'Initial Deposit',
    transactionReference: 'WIRE-US-99882190',
    receiptUrl: '/api/receipts/REC-9031',
    notes: 'Advance commitment deposit for bespoke manufacturing.',
    receivedBy: 'Zayn Kassam (Accounts)',
    isReversed: 0,
    createdAt: '2026-10-11T09:30:00Z',
  });

  // Ledger entry: Sale debit
  await db.insert(customerLedger).values([
    {
      id: 'ledg_101_sale',
      customerId: customer1Id,
      orderId: order1Id,
      entryType: 'sale_debit',
      amount: 8500,
      balanceAfter: 8500,
      description: 'Commission: The Sovereign Executive Mahogany Desk Suite (#SF-2026-101)',
      paymentMethod: null,
      reference: 'ORDER-SF-2026-101',
      recordedBy: 'Saad Al-Khatib',
      isReversed: 0,
      createdAt: '2026-10-10T09:00:00Z',
    },
    {
      id: 'ledg_101_pay1',
      customerId: customer1Id,
      orderId: order1Id,
      entryType: 'payment_credit',
      amount: 5000,
      balanceAfter: 3500,
      description: 'Advance Deposit Received (Receipt #REC-9031)',
      paymentMethod: 'Bank Transfer',
      reference: 'WIRE-US-99882190',
      recordedBy: 'Zayn Kassam (Accounts)',
      isReversed: 0,
      createdAt: '2026-10-11T09:30:00Z',
    },
  ]);

  // Order timeline events
  await db.insert(orderTimelineEvents).values([
    {
      id: 'tl_101_1',
      orderId: order1Id,
      title: 'Order Confirmed',
      description: 'Commission officially verified and advance deposit credited.',
      stage: 'order_confirmed',
      eventType: 'production',
      performedBy: 'Saad Al-Khatib (Super Admin)',
      createdAt: '2026-10-10T09:00:00Z',
    },
    {
      id: 'tl_101_2',
      orderId: order1Id,
      title: 'Design & Measurements',
      description: 'Architectural schematics and CAD tolerances finalized for Penthouse 18B study.',
      stage: 'design_measurements',
      eventType: 'production',
      performedBy: 'Tariq Mansour (Order Manager)',
      createdAt: '2026-10-12T14:00:00Z',
    },
    {
      id: 'tl_101_3',
      orderId: order1Id,
      title: 'Material Selection',
      description: 'Century-old Honduran mahogany slabs selected and acclimated.',
      stage: 'material_selection',
      eventType: 'production',
      performedBy: 'Tariq Mansour',
      createdAt: '2026-10-14T11:00:00Z',
    },
    {
      id: 'tl_101_4',
      orderId: order1Id,
      title: 'Frame Preparation',
      description: 'Hand-cut dovetail joinery and concealed soft-close drawer compartments assembled.',
      stage: 'frame_preparation',
      eventType: 'production',
      performedBy: 'Saad Atelier Studio',
      createdAt: '2026-10-18T16:00:00Z',
    },
    {
      id: 'tl_101_5',
      orderId: order1Id,
      title: 'Foam & Upholstery (65%)',
      description: 'Italian leather central writing pad saddle-stitched and inlaid with monogram AV.',
      stage: 'foam_upholstery',
      eventType: 'production',
      performedBy: 'Layla Al-Sayed (Media & QA)',
      createdAt: '2026-10-28T14:00:00Z',
    },
  ]);

  // Notifications
  await db.insert(notifications).values([
    {
      id: 'notif_1',
      userId: customer1Id,
      title: 'Milestone Progress: Foam & Upholstery (65%)',
      message: 'Your Sovereign Executive Desk has reached the Italian leather inlay stage. High-definition artisan video and photo proof have been uploaded to your personal vault.',
      type: 'stage_completed',
      relatedOrderId: order1Id,
      isRead: 0,
      createdAt: '2026-10-28T14:05:00Z',
    },
    {
      id: 'notif_2',
      userId: 'all',
      title: 'Private Winter Salon Showcase',
      message: 'Exclusive invitation: Preview our hand-carved sculptural walnut consoles at the Saad Grand Showroom this weekend.',
      type: 'announcement',
      relatedOrderId: null,
      isRead: 0,
      createdAt: '2026-10-25T08:00:00Z',
    },
  ]);

  // Seed coupons
  try {
    await db.insert(coupons).values([
      {
        id: 'cpn_saad10',
        code: 'SAAD10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 1000,
        maxDiscountAmount: 500,
        validUntil: '2028-12-31',
        usageLimit: 500,
        usedCount: 0,
        isActive: 1,
        createdAt: '2026-10-01T00:00:00Z',
      },
      {
        id: 'cpn_welcome100',
        code: 'WELCOME100',
        discountType: 'fixed',
        discountValue: 100,
        minOrderAmount: 800,
        maxDiscountAmount: 100,
        validUntil: '2028-12-31',
        usageLimit: 500,
        usedCount: 0,
        isActive: 1,
        createdAt: '2026-10-01T00:00:00Z',
      },
    ]);
  } catch {}

  console.log('✅ Saad Furniture Database fully seeded with complete 26-table architecture!');
}
