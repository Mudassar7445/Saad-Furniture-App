const fs = require('fs');
const path = require('path');

const brandingDir = path.join(__dirname, '..', 'public', 'assets', 'branding');
if (!fs.existsSync(brandingDir)) {
  fs.mkdirSync(brandingDir, { recursive: true });
}

// 1. Core Emblem Defs & Paths
const sharedDefs = `
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EADBBA" />
      <stop offset="35%" stop-color="#D4AF37" />
      <stop offset="70%" stop-color="#B99A68" />
      <stop offset="100%" stop-color="#846533" />
    </linearGradient>
    <linearGradient id="goldShine" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#B99A68" />
      <stop offset="50%" stop-color="#FFF2D6" />
      <stop offset="100%" stop-color="#846533" />
    </linearGradient>
    <linearGradient id="charcoalDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#262421" />
      <stop offset="100%" stop-color="#141312" />
    </linearGradient>
    <filter id="luxuryGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
`;

// Beautiful Furniture Armchair Crest + SF Monogram Vector
const crestMonogramPath = (cx, cy, scale = 1) => `
  <g transform="translate(${cx}, ${cy}) scale(${scale})">
    <!-- Outer Octagonal Luxury Shield -->
    <path d="M 0,-68 L 48,-48 L 68,0 L 48,48 L 0,68 L -48,48 L -68,0 L -48,-48 Z" 
          fill="none" stroke="url(#goldGrad)" stroke-width="2.5" stroke-linejoin="round" />
    <!-- Inner Fine Border -->
    <path d="M 0,-62 L 44,-44 L 62,0 L 44,44 L 0,62 L -44,44 L -62,0 L -44,-44 Z" 
          fill="none" stroke="url(#goldGrad)" stroke-width="0.8" opacity="0.6" stroke-linejoin="round" />

    <!-- Royal 3-Point Crown Top -->
    <path d="M -16,-62 L -22,-74 L -9,-70 L 0,-77 L 9,-70 L 22,-74 L 16,-62 Z" 
          fill="url(#goldGrad)" />
    <circle cx="0" cy="-80" r="2.5" fill="#FFF2D6" />
    <circle cx="-22" cy="-76" r="1.8" fill="#FFF2D6" />
    <circle cx="22" cy="-76" r="1.8" fill="#FFF2D6" />

    <!-- Stylized Architectural Furniture Chair Silhouette in Crest -->
    <!-- Chair Crown Backrest -->
    <path d="M -30,-34 C -15,-46 15,-46 30,-34 C 26,-20 22,-6 24,12 C 16,14 -16,14 -24,12 C -22,-6 -26,-20 -30,-34 Z" 
          fill="none" stroke="url(#goldGrad)" stroke-width="1.2" opacity="0.35" />
    <!-- Carved Furniture Legs / Plinth Base -->
    <path d="M -24,38 L -32,54 M 24,38 L 32,54 M -12,42 L -14,52 M 12,42 L 14,52" 
          stroke="url(#goldGrad)" stroke-width="1.8" stroke-linecap="round" />

    <!-- Master Monogram SF -->
    <!-- Letter S (Sweeping Calligraphic Luxury Curves) -->
    <path d="M 12,-26 C 6,-32 -4,-33 -12,-30 C -22,-26 -24,-14 -16,-6 C -6,2 18,6 18,20 C 18,32 6,36 -4,36 C -16,36 -24,28 -26,20" 
          fill="none" stroke="url(#goldGrad)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
    
    <!-- Letter F (Interlocking Architectural Serif) -->
    <path d="M -2,-28 L 24,-28 M -2,-28 L -2,32 M -2,1 L 18,1" 
          fill="none" stroke="url(#goldShine)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Monogram Serifs & Terminals -->
    <circle cx="-26" cy="20" r="2" fill="url(#goldGrad)" />
    <circle cx="12" cy="-26" r="2" fill="url(#goldGrad)" />
    <path d="M -7,32 L 3,32" stroke="url(#goldShine)" stroke-width="2.5" stroke-linecap="round" />
    <path d="M 23,-31 L 23,-25" stroke="url(#goldShine)" stroke-width="2" stroke-linecap="round" />
    <path d="M 17,-2 L 17,4" stroke="url(#goldShine)" stroke-width="1.8" stroke-linecap="round" />
  </g>
`;

// 1. Main Logo (Vertical Brand Presentation)
const mainLogoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  ${sharedDefs}
  <!-- Dark Luxury Canvas Background -->
  <rect width="500" height="500" rx="24" fill="url(#charcoalDark)" />
  <rect x="12" y="12" width="476" height="476" rx="16" fill="none" stroke="url(#goldGrad)" stroke-width="1" opacity="0.2" />

  <!-- Crest & Monogram -->
  ${crestMonogramPath(250, 165, 1.4)}

  <!-- Typography -->
  <g text-anchor="middle">
    <!-- SAAD -->
    <text x="250" y="325" 
          font-family="'Playfair Display', 'Cinzel', 'Baskerville', 'Times New Roman', serif" 
          font-size="44" 
          font-weight="700" 
          letter-spacing="14" 
          fill="url(#goldShine)">
      SAAD
    </text>

    <!-- FURNITURE -->
    <text x="250" y="365" 
          font-family="'Montserrat', 'Helvetica Neue', Arial, sans-serif" 
          font-size="16" 
          font-weight="500" 
          letter-spacing="12" 
          fill="#DFCA9B" 
          opacity="0.95">
      FURNITURE
    </text>

    <!-- Fine Gold Dividing Rule -->
    <line x1="160" y1="390" x2="340" y2="390" stroke="url(#goldGrad)" stroke-width="1" opacity="0.5" />
    <polygon points="250,387 253,390 250,393 247,390" fill="url(#goldGrad)" />

    <!-- Heritage Subtext -->
    <text x="250" y="420" 
          font-family="'Montserrat', 'Helvetica Neue', Arial, sans-serif" 
          font-size="10" 
          font-weight="400" 
          letter-spacing="6" 
          fill="#A8A39D">
      HANDCRAFTED ATELIER • EST. 1998
    </text>
  </g>
</svg>
`;

// 2. Horizontal Logo (For Desktop Headers, Invoices, Top Bars)
const horizontalLogoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 140" width="100%" height="100%">
  ${sharedDefs}
  <g transform="translate(10, 0)">
    <!-- Crest Emblem on Left -->
    ${crestMonogramPath(70, 70, 0.75)}

    <!-- Vertical separator line -->
    <line x1="150" y1="25" x2="150" y2="115" stroke="url(#goldGrad)" stroke-width="1.2" opacity="0.35" />

    <!-- Typography on Right -->
    <g transform="translate(175, 0)">
      <text x="0" y="65" 
            font-family="'Playfair Display', 'Cinzel', 'Baskerville', 'Times New Roman', serif" 
            font-size="38" 
            font-weight="700" 
            letter-spacing="10" 
            fill="url(#goldShine)">
        SAAD
      </text>
      <text x="0" y="96" 
            font-family="'Montserrat', 'Helvetica Neue', Arial, sans-serif" 
            font-size="14" 
            font-weight="600" 
            letter-spacing="9" 
            fill="#DFCA9B">
        FURNITURE
      </text>
      <text x="0" y="118" 
            font-family="'Montserrat', 'Helvetica Neue', Arial, sans-serif" 
            font-size="8.5" 
            font-weight="400" 
            letter-spacing="4.5" 
            fill="#89847C">
        LUXURY BESPOKE CRAFTSMANSHIP
      </text>
    </g>
  </g>
</svg>
`;

// 3. Application DP / Profile Picture (512x512 Square with Luxury Framing)
const appDpSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  ${sharedDefs}
  <!-- Deep Charcoal Radial Background -->
  <rect width="512" height="512" rx="110" fill="url(#charcoalDark)" />
  
  <!-- Outer Gold Border -->
  <rect x="18" y="18" width="476" height="476" rx="96" fill="none" stroke="url(#goldGrad)" stroke-width="3" />
  <!-- Inner Subtle Inset Border -->
  <rect x="28" y="28" width="456" height="456" rx="88" fill="none" stroke="url(#goldGrad)" stroke-width="1" opacity="0.4" />

  <!-- Corner Ornamental Accent Brackets -->
  <path d="M 60,90 L 60,60 L 90,60" fill="none" stroke="url(#goldShine)" stroke-width="2.5" />
  <path d="M 452,90 L 452,60 L 422,60" fill="none" stroke="url(#goldShine)" stroke-width="2.5" />
  <path d="M 60,422 L 60,452 L 90,452" fill="none" stroke="url(#goldShine)" stroke-width="2.5" />
  <path d="M 452,422 L 452,452 L 422,452" fill="none" stroke="url(#goldShine)" stroke-width="2.5" />

  <!-- Center Crest Emblem & Monogram -->
  ${crestMonogramPath(256, 210, 1.8)}

  <!-- Brand Typography -->
  <g text-anchor="middle">
    <text x="256" y="390" 
          font-family="'Playfair Display', 'Cinzel', serif" 
          font-size="34" 
          font-weight="700" 
          letter-spacing="10" 
          fill="url(#goldShine)">
      SAAD
    </text>
    <text x="256" y="420" 
          font-family="'Montserrat', sans-serif" 
          font-size="13" 
          font-weight="600" 
          letter-spacing="7" 
          fill="#DFCA9B">
      FURNITURE
    </text>
  </g>
</svg>
`;

// 4. Android Adaptive Launcher Icon (Safe Margin Circle 192x192 & 512x512)
const androidLauncherSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  ${sharedDefs}
  <!-- Circular Mask Background (Safe 66% Inner Area) -->
  <circle cx="256" cy="256" r="256" fill="url(#charcoalDark)" />
  <circle cx="256" cy="256" r="236" fill="none" stroke="url(#goldGrad)" stroke-width="4" />
  <circle cx="256" cy="256" r="226" fill="none" stroke="url(#goldGrad)" stroke-width="1.2" opacity="0.5" />

  <!-- High-Contrast Golden Emblem in Safe Zone -->
  ${crestMonogramPath(256, 215, 1.85)}

  <!-- Subtle Text in Safe Zone -->
  <text x="256" y="395" 
        text-anchor="middle"
        font-family="'Playfair Display', serif" 
        font-size="32" 
        font-weight="700" 
        letter-spacing="9" 
        fill="url(#goldShine)">
    SAAD
  </text>
  <text x="256" y="422" 
        text-anchor="middle"
        font-family="'Montserrat', sans-serif" 
        font-size="12" 
        font-weight="600" 
        letter-spacing="7" 
        fill="#DFCA9B">
    FURNITURE
  </text>
</svg>
`;

// 5. Splash Screen Logo
const splashLogoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  ${sharedDefs}
  <rect width="600" height="600" fill="#1C1A18" />
  
  <g filter="url(#luxuryGlow)">
    <circle cx="300" cy="250" r="140" fill="#B99A68" opacity="0.08" />
  </g>

  ${crestMonogramPath(300, 240, 2.0)}

  <g text-anchor="middle">
    <text x="300" y="430" 
          font-family="'Playfair Display', serif" 
          font-size="46" 
          font-weight="700" 
          letter-spacing="14" 
          fill="url(#goldShine)">
      SAAD
    </text>
    <text x="300" y="470" 
          font-family="'Montserrat', sans-serif" 
          font-size="16" 
          font-weight="500" 
          letter-spacing="11" 
          fill="#DFCA9B">
      FURNITURE
    </text>
    <text x="300" y="520" 
          font-family="'Montserrat', sans-serif" 
          font-size="11" 
          font-weight="400" 
          letter-spacing="6" 
          fill="#89847C">
      HANDCRAFTED LUXURY BUILT FOR GENERATIONS
    </text>
  </g>
</svg>
`;

// 6. Login & Signup Screen Branding Logo
const authBrandLogoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
  ${sharedDefs}
  ${crestMonogramPath(200, 85, 1.05)}
  <g text-anchor="middle">
    <text x="200" y="175" 
          font-family="'Playfair Display', serif" 
          font-size="28" 
          font-weight="700" 
          letter-spacing="8" 
          fill="url(#goldShine)">
      SAAD FURNITURE
    </text>
    <text x="200" y="202" 
          font-family="'Montserrat', sans-serif" 
          font-size="10.5" 
          font-weight="500" 
          letter-spacing="4" 
          fill="#DFCA9B">
      PATRON & STAFF SECURE ACCESS
    </text>
  </g>
</svg>
`;

// 7. Notification Icon (Monochrome / High-contrast gold on transparent)
const notificationIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="100%" height="100%">
  ${sharedDefs}
  ${crestMonogramPath(64, 64, 0.72)}
</svg>
`;

// 8. Super Admin Dashboard Logo
const adminLogoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 120" width="100%" height="100%">
  ${sharedDefs}
  <g transform="translate(10, 0)">
    ${crestMonogramPath(60, 60, 0.65)}
    <line x1="125" y1="20" x2="125" y2="100" stroke="url(#goldGrad)" stroke-width="1" opacity="0.4" />
    <g transform="translate(145, 0)">
      <text x="0" y="52" 
            font-family="'Playfair Display', serif" 
            font-size="28" 
            font-weight="700" 
            letter-spacing="7" 
            fill="url(#goldShine)">
        SAAD FURNITURE
      </text>
      <text x="0" y="80" 
            font-family="'Montserrat', sans-serif" 
            font-size="12" 
            font-weight="700" 
            letter-spacing="5" 
            fill="#B99A68">
        SUPER ADMIN CONSOLE
      </text>
      <text x="0" y="98" 
            font-family="'Montserrat', sans-serif" 
            font-size="9" 
            font-weight="500" 
            letter-spacing="3" 
            fill="#89847C">
        EXECUTIVE WORKSHOP & ATELIER OPERATIONS
      </text>
    </g>
  </g>
</svg>
`;

// 9. Customer Dashboard Logo
const customerLogoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 120" width="100%" height="100%">
  ${sharedDefs}
  <g transform="translate(10, 0)">
    ${crestMonogramPath(60, 60, 0.65)}
    <line x1="125" y1="20" x2="125" y2="100" stroke="url(#goldGrad)" stroke-width="1" opacity="0.4" />
    <g transform="translate(145, 0)">
      <text x="0" y="52" 
            font-family="'Playfair Display', serif" 
            font-size="28" 
            font-weight="700" 
            letter-spacing="7" 
            fill="url(#goldShine)">
        SAAD FURNITURE
      </text>
      <text x="0" y="80" 
            font-family="'Montserrat', sans-serif" 
            font-size="12" 
            font-weight="700" 
            letter-spacing="5" 
            fill="#DFCA9B">
        VIP PATRON PORTAL
      </text>
      <text x="0" y="98" 
            font-family="'Montserrat', sans-serif" 
            font-size="9" 
            font-weight="500" 
            letter-spacing="3" 
            fill="#89847C">
        BESPOKE COMMISSIONS & LIVE CRAFT TRACKING
      </text>
    </g>
  </g>
</svg>
`;

// 10. Clean Favicon SVG
const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="100%" height="100%">
  ${sharedDefs}
  <rect width="128" height="128" rx="28" fill="#1C1A18" />
  <rect x="4" y="4" width="120" height="120" rx="24" fill="none" stroke="url(#goldGrad)" stroke-width="2" />
  ${crestMonogramPath(64, 64, 0.72)}
</svg>
`;

// Write all SVG assets to public/assets/branding
console.log('Writing luxury SVG branding assets...');
fs.writeFileSync(path.join(brandingDir, 'logo.svg'), mainLogoSvg.trim());
fs.writeFileSync(path.join(brandingDir, 'logo-horizontal.svg'), horizontalLogoSvg.trim());
fs.writeFileSync(path.join(brandingDir, 'app-dp.svg'), appDpSvg.trim());
fs.writeFileSync(path.join(brandingDir, 'android-launcher-icon.svg'), androidLauncherSvg.trim());
fs.writeFileSync(path.join(brandingDir, 'splash-logo.svg'), splashLogoSvg.trim());
fs.writeFileSync(path.join(brandingDir, 'auth-brand-logo.svg'), authBrandLogoSvg.trim());
fs.writeFileSync(path.join(brandingDir, 'notification-icon.svg'), notificationIconSvg.trim());
fs.writeFileSync(path.join(brandingDir, 'admin-logo.svg'), adminLogoSvg.trim());
fs.writeFileSync(path.join(brandingDir, 'customer-logo.svg'), customerLogoSvg.trim());
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), faviconSvg.trim());

console.log('All luxury SVG branding assets written successfully!');
