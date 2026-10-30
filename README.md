# Saad Furniture – Premium Customer Order Tracking & Showroom Management Application

A complete, production-grade enterprise furniture showroom management, artisan craftsmanship tracking, and client portal built for **Saad Furniture**.

---

## 🌟 Architecture & Technology Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) + React 19 + TypeScript
- **Styling**: Tailwind CSS + Custom Saad Luxury Atelier Design System (Warm Gold `#c5a880`, Slate Noir `#0b0d11`, `#141822`, Deep Emerald)
- **Database & ORM**: LibSQL / [Turso](https://turso.tech/) Cloud + [Drizzle ORM](https://orm.drizzle.team/)
- **Media Vault**: Google Drive 5TB API integration with secure server-side authenticated proxying (zero external redirects)
- **Notifications**: Firebase Cloud Messaging (FCM HTTP v1) + Native In-App Notification Center + Sound/Vibration Channels
- **Multi-Channel Communications**: Automated Email, SMS & WhatsApp Business messaging with template engine and patron opt-in preferences
- **Mobile & Desktop**: Responsive PWA (`manifest.json` + Service Worker `sw.js`) + [Capacitor](https://capacitorjs.com/) for native Android APK generation

---

## 🔐 Credentials & Default Accounts

### 👑 Super Admin (Full Unrestricted System Authority)
- **Portal URL**: `http://localhost:3000/admin`
- **Email**: `admin@saadfurniture.com`
- **Password**: `Admin@Saad2026`
- **Role & Capabilities**: Complete executive overview, create/edit/suspend customer accounts, manage staff & fine-grained permissions, unlimited orders & bespoke specifications, custom stage builder, delivery fleet tracking, customer financial ledgers, audit reversals, catalog management, broadcast announcements, protected settings.

### 👥 Staff Accounts (Permission-Based Roles)
- **Portal URL**: `http://localhost:3000/staff`
- **Password (All Staff)**: `Staff@Saad2026`
- **Staff Accounts**:
  1. **Order Manager**: `tariq.orders@saadfurniture.com` (Orders permission)
  2. **Media Manager**: `layla.media@saadfurniture.com` (Media permission)
  3. **Delivery Manager**: `omar.delivery@saadfurniture.com` (Delivery fleet permission)
  4. **Accounts Manager**: `zayn.finance@saadfurniture.com` (Financial ledger & payments permission)
  5. **Product Manager**: `samira.catalog@saadfurniture.com` (Showroom catalog & custom inquiries)

### 🛋️ VIP Patrons / Customers
- **Portal URL**: `http://localhost:3000/portal`
- **Password (All Patrons)**: `Customer@2026`
- **Patron Accounts**:
  1. **Alexander Vance**: `alexander.vance@example.com` (Penthouse 18B study commission)
  2. **Eleanor Montgomery**: `eleanor.montgomery@example.com`
  3. **Dr. Hamza Malik**: `hamza.malik@example.com`

---

## 🚀 Key Modules Implemented

### 1. Advanced 11-Stage Order Management
- Every order features a dedicated details page at `/orders/[id]`
- **11 Default Artisanal Stages**:
  1. `order_confirmed` (Order Confirmed)
  2. `design_measurements` (Design & Measurements)
  3. `material_selection` (Material Selection)
  4. `manufacturing_started` (Manufacturing Started)
  5. `frame_preparation` (Frame Preparation)
  6. `foam_upholstery` (Foam & Upholstery)
  7. `polishing_finishing` (Polishing & Finishing)
  8. `quality_inspection` (Quality Inspection)
  9. `ready_for_delivery` (Ready for Delivery)
  10. `out_for_delivery` (Out for Delivery)
  11. `delivered` (Successfully Delivered)
- **Custom Stage Builder**: Super Admin can add, rename, re-weight, or reorder stages per commission.
- Delay warning banner with reason and revised expected completion date.
- Cancelled order support with customer notification.

### 2. Google Drive 5TB Media Storage Vault
- Original files stored safely in Google Drive cloud storage.
- File metadata, Google Drive IDs, order references, stage, and titles stored in LibSQL.
- Authenticated streaming endpoint `/api/media/[id]/stream` with zero redirection to external URLs.
- In-app media player supporting pinch-to-zoom images and streaming video playback with seeking controls.

### 3. White-Glove Delivery Management (Section 5)
- Dedicated 6-stage delivery progression:
  1. `preparing_for_dispatch` (Preparing for Dispatch)
  2. `packing_completed` (Packing Completed - Custom Wooden Crating)
  3. `ready_for_dispatch` (Ready for Dispatch - Dock Passed)
  4. `dispatched` (Dispatched from Showroom Hub)
  5. `out_for_delivery` (Out for White-Glove Delivery)
  6. `delivered_successfully` (Delivered Successfully & Certified)
- Destination address, contact phone, delivery charges, assigned driver and direct phone.
- Delivery photograph proof upload and patron confirmation notes.

### 4. Customer Financial Ledger & Multi-Method Payments (Section 6)
- Server-side calculated financial balances (Grand Total Business, Total Cleared, Outstanding Receivables).
- Supported payment channels:
  - **Bank Transfer (Wire)**
  - **Cash at Showroom Desk**
  - **JazzCash Mobile Wallet**
  - **EasyPaisa Mobile Wallet**
  - **Other Certified Channels**
- Audit Reversal module with mandatory compliance reason, ledger debit adjustment, and patron notification.
- Printable luxury HTML payment receipts generated at `/api/receipts/[paymentNumber]`.

### 5. Multi-Channel Notifications & Communications (Sections 7 & 8)
- Firebase Cloud Messaging (FCM) integration with sound and vibration notification channels.
- Real-time in-app notification center with read/unread tracking.
- Automated email and SMS / WhatsApp message dispatch for:
  - Order Confirmations
  - Manufacturing Stage Milestones
  - White-Glove Dispatch & Delivery Notices
  - Payment Receipts
  - Showroom Broadcast Announcements (with opt-in / opt-out compliance checks)

### 6. Showroom Product Catalogue & Custom Inquiries (Section 9)
- 8 Categories:
  - `Sofas`
  - `Double Beds`
  - `Single Beds`
  - `Wardrobes`
  - `Center Tables`
  - `Mattresses`
  - `Room Chairs`
  - `Custom Furniture`
- Interactive custom quote inquiry modal submitting to `/api/products/inquiries`.
- Inquiries manager in Super Admin dashboard for responding and updating inquiry status.

### 7. Executive Analytics Dashboard with Date Range Filters (Section 10)
- Horizon filters:
  - `All Records`
  - `Today`
  - `This Week`
  - `This Month`
  - `This Year`
  - `Custom Date Range`
- Global real-time search bar filtering across order numbers, customer names, phone numbers, and products.

### 8. Customer Mobile App & Bottom Navigation Bar (Sections 11 & 12)
- Bottom navigation bar on mobile viewports:
  - `Tracking` (Home)
  - `My Orders`
  - `Catalogue` (Products)
  - `Ledger` (Financials)
  - `Alerts` (Notifications)
- Mobile-optimized touch gestures and card progression indicators.

---

## 📱 Future Android Packaging (Capacitor)

The project includes `capacitor.config.ts`. To package into an Android Studio project:

```bash
# 1. Build the production web bundle
npm run build

# 2. Add Android platform
npx cap add android

# 3. Synchronize assets
npx cap sync android

# 4. Open in Android Studio
npx cap open android
```

---

## 🚢 Deployment to Vercel & Turso Cloud

1. Create a Turso LibSQL database:
   ```bash
   turso db create saad-furniture
   turso db tokens create saad-furniture
   ```
2. Set Environment Variables in `.env` / Vercel Project Settings:
   ```env
   TURSO_DATABASE_URL="libsql://saad-furniture-[user].turso.io"
   TURSO_AUTH_TOKEN="your_turso_token"
   JWT_SECRET="your_production_secret"
   GOOGLE_SERVICE_ACCOUNT_EMAIL="your_service_account@gserviceaccount.com"
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
   GOOGLE_DRIVE_FOLDER_ID="your_5tb_folder_id"
   FCM_SERVER_KEY="your_firebase_server_key"
   ```
3. Deploy to Vercel:
   ```bash
   npx vercel --prod
   ```

---
*Crafted for Saad Furniture – Luxury Handcrafted Furniture & Architectural Commissions.*
