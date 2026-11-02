const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. MASTER LUXURY ICON SVG (House / Roof + Elegant Curved Sofa + "SAAD FURNITURE")
// Designed strictly within the safe 66% zone (central diameter ~660px out of 1024px)
// Guaranteed NO CROWN, pure architectural luxury furniture aesthetic.
function getMasterSvg({ background = true, maskable = false } = {}) {
  const scale = maskable ? 0.82 : 0.95;
  const transform = `translate(512, 512) scale(${scale}) translate(-512, -512)`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <!-- Ultra-Luxurious Multi-Stop Champagne Gold Gradient -->
    <linearGradient id="goldSheen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFDF5" />
      <stop offset="18%" stop-color="#F5E4B5" />
      <stop offset="42%" stop-color="#D4AF37" />
      <stop offset="70%" stop-color="#B68E38" />
      <stop offset="100%" stop-color="#7A561E" />
    </linearGradient>

    <!-- Warm Horizontal Specular Sheen for Sofa & Roof Ridge -->
    <linearGradient id="goldRidge" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#B68E38" />
      <stop offset="25%" stop-color="#E9D198" />
      <stop offset="50%" stop-color="#FFF8E1" />
      <stop offset="75%" stop-color="#E9D198" />
      <stop offset="100%" stop-color="#B68E38" />
    </linearGradient>

    <!-- Rich Accent Gold for Pillows & Legs -->
    <linearGradient id="goldAccent" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#916B25" />
      <stop offset="50%" stop-color="#EAD5A3" />
      <stop offset="100%" stop-color="#724F18" />
    </linearGradient>

    <!-- Deep Matte Charcoal Vignette Canvas Background -->
    <radialGradient id="matteCanvas" cx="50%" cy="46%" r="62%">
      <stop offset="0%" stop-color="#161B26" />
      <stop offset="55%" stop-color="#0E121B" />
      <stop offset="100%" stop-color="#07090E" />
    </radialGradient>

    <!-- Subtle Metallic Drop Shadow -->
    <filter id="softGlowShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.85" />
    </filter>
  </defs>

  ${
    background
      ? `
  <!-- Matte Black Premium Canvas -->
  <rect width="1024" height="1024" rx="${maskable ? 0 : 220}" fill="url(#matteCanvas)" />
  ${
    !maskable
      ? `
  <!-- Subtle Outer Gold Filigree Accent Frame -->
  <rect x="44" y="44" width="936" height="936" rx="180" fill="none" stroke="url(#goldRidge)" stroke-width="2.5" opacity="0.35" />
  `
      : ''
  }
  `
      : ''
  }

  <!-- Master Center Content Group -->
  <g transform="${transform}">

    <!-- ========================================== -->
    <!-- 1. ARCHITECTURAL ROOF / HOME CANOPY (SUBTLE GABLE) -->
    <!-- ========================================== -->
    <g filter="url(#softGlowShadow)">
      <!-- Peak House / Roof Gable Silhouette -->
      <!-- Smooth apex with elegant cantilevered eaves -->
      <path d="M 512,185 L 755,340 L 740,360 L 512,215 L 284,360 L 269,340 Z"
            fill="url(#goldSheen)" stroke="url(#goldRidge)" stroke-width="1.5" stroke-linejoin="round" />

      <!-- Delicate Inner Arch Ridge Line -->
      <path d="M 330,345 Q 512,240 694,345"
            fill="none" stroke="url(#goldRidge)" stroke-width="2.5" opacity="0.45" stroke-linecap="round" />

      <!-- Geometric Atelier Living Apex Finial (Pure Geometry, Not a Crown) -->
      <circle cx="512" cy="180" r="8" fill="#FFFDF5" />
      <circle cx="512" cy="180" r="14" fill="none" stroke="url(#goldSheen)" stroke-width="2" opacity="0.8" />
    </g>

    <!-- ========================================== -->
    <!-- 2. LUXURY SCULPTED SOFA (MODERN ATELIER SILHOUETTE) -->
    <!-- ========================================== -->
    <g transform="translate(512, 455)" filter="url(#softGlowShadow)">

      <!-- Main Contoured Backrest (Graceful Sweeping Curves) -->
      <path d="M -235,-75 C -185,-115 -85,-125 0,-125 C 85,-125 185,-115 235,-75 C 255,-35 250,15 220,50 C 170,42 90,38 0,38 C -90,38 -170,42 -220,50 C -250,15 -255,-35 -235,-75 Z"
            fill="url(#goldSheen)" stroke="url(#goldRidge)" stroke-width="3.5" stroke-linejoin="round" />

      <!-- Vertical Artisan Fluting Lines on Backrest -->
      <g stroke="url(#goldRidge)" stroke-width="2.5" stroke-linecap="round" opacity="0.75">
        <line x1="0" y1="-123" x2="0" y2="38" />
        <path d="M -75,-120 Q -70,-40 -65,40" />
        <path d="M 75,-120 Q 70,-40 65,40" />
        <path d="M -150,-102 Q -140,-35 -130,42" />
        <path d="M 150,-102 Q 140,-35 130,42" />
      </g>

      <!-- Ergonomic Left Track Armrest (Clean Roll) -->
      <path d="M -225,48 C -255,35 -280,0 -270,-35 C -260,-65 -230,-75 -205,-62 C -185,-52 -190,-30 -210,-24 C -230,-18 -238,0 -225,48 Z"
            fill="url(#goldRidge)" stroke="url(#goldSheen)" stroke-width="2.5" />

      <!-- Ergonomic Right Track Armrest (Clean Roll) -->
      <path d="M 225,48 C 255,35 280,0 270,-35 C 260,-65 230,-75 205,-62 C 185,-52 190,-30 210,-24 C 230,-18 238,0 225,48 Z"
            fill="url(#goldRidge)" stroke="url(#goldSheen)" stroke-width="2.5" />

      <!-- Deep Continuous Luxury Seating Cushion (High Density Comfort) -->
      <path d="M -220,48 C -145,40 -45,36 0,36 C 45,36 145,40 220,48 C 238,55 240,88 226,112 C 150,126 50,130 0,130 C -50,130 -150,126 -226,112 C -240,88 -238,55 -220,48 Z"
            fill="url(#goldAccent)" stroke="url(#goldRidge)" stroke-width="3.5" stroke-linejoin="round" />

      <!-- High-Specular Light Rim on Front Edge of Cushion -->
      <path d="M -210,56 Q 0,44 210,56" fill="none" stroke="#FFFDF5" stroke-width="2.5" opacity="0.8" stroke-linecap="round" />

      <!-- Solid Architectural Plinth Bar -->
      <path d="M -200,114 Q 0,126 200,114 L 195,138 Q 0,150 -195,138 Z"
            fill="url(#goldSheen)" />

      <!-- 4 Tapered Minimalist Brass Legs with Angled Stance -->
      <polygon points="-190,138 -212,194 -186,194 -168,138" fill="url(#goldRidge)" />
      <polygon points="190,138 212,194 186,194 168,138" fill="url(#goldRidge)" />
      <polygon points="-60,144 -70,195 -50,195 -40,144" fill="url(#goldAccent)" />
      <polygon points="60,144 70,195 50,195 40,144" fill="url(#goldAccent)" />

      <!-- Polished Brass Floor Glides / Ferrules -->
      <rect x="-214" y="190" width="30" height="6" rx="2" fill="#FFFDF5" />
      <rect x="184" y="190" width="30" height="6" rx="2" fill="#FFFDF5" />
      <rect x="-72" y="191" width="24" height="5" rx="1.5" fill="#FFFDF5" />
      <rect x="48" y="191" width="24" height="5" rx="1.5" fill="#FFFDF5" />
    </g>

    <!-- ========================================== -->
    <!-- 3. BRAND IDENTITY TYPOGRAPHY ("SAAD FURNITURE") -->
    <!-- ========================================== -->
    <g transform="translate(512, 725)" filter="url(#softGlowShadow)">
      <!-- Primary Logotype: SAAD -->
      <text x="0" y="0"
            font-family="'Playfair Display', 'Cinzel', 'Baskerville', 'Georgia', serif"
            font-size="64"
            font-weight="800"
            letter-spacing="18"
            fill="url(#goldRidge)"
            stroke="url(#goldSheen)"
            stroke-width="1.2"
            text-anchor="middle">
        SAAD
      </text>

      <!-- Subtle Accent Separator Flanked with Geometric Lozenges -->
      <g transform="translate(0, 22)">
        <line x1="-160" y1="0" x2="-20" y2="0" stroke="url(#goldRidge)" stroke-width="1.5" opacity="0.6" />
        <polygon points="0,-4 4,0 0,4 -4,0" fill="#FFFDF5" />
        <line x1="20" y1="0" x2="160" y2="0" stroke="url(#goldRidge)" stroke-width="1.5" opacity="0.6" />
      </g>

      <!-- Subtitle Logotype: FURNITURE -->
      <text x="0" y="52"
            font-family="'Montserrat', 'Cinzel', 'Helvetica Neue', 'Arial', sans-serif"
            font-size="20"
            font-weight="600"
            letter-spacing="14"
            fill="url(#goldSheen)"
            opacity="0.95"
            text-anchor="middle">
        FURNITURE
      </text>

      <!-- Quality Descriptor: LUXURY ATELIER -->
      <text x="0" y="80"
            font-family="'Montserrat', 'Cinzel', 'Helvetica Neue', sans-serif"
            font-size="11"
            font-weight="500"
            letter-spacing="8"
            fill="#EAD5A3"
            opacity="0.65"
            text-anchor="middle">
        BESPOKE LIVING
      </text>
    </g>
  </g>
</svg>`;
}

async function main() {
  const brandingDir = path.join(__dirname, '..', 'public', 'assets', 'branding');
  if (!fs.existsSync(brandingDir)) {
    fs.mkdirSync(brandingDir, { recursive: true });
  }

  console.log('Generating luxury master SVG assets...');
  const masterSvg = getMasterSvg({ background: true, maskable: false });
  const maskableSvg = getMasterSvg({ background: true, maskable: true });
  const foregroundSvg = getMasterSvg({ background: false, maskable: true });
  const backgroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <radialGradient id="matteCanvas" cx="50%" cy="46%" r="62%">
      <stop offset="0%" stop-color="#161B26" />
      <stop offset="55%" stop-color="#0E121B" />
      <stop offset="100%" stop-color="#07090E" />
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#matteCanvas)" />
</svg>`;

  fs.writeFileSync(path.join(brandingDir, 'app-icon-master.svg'), masterSvg);
  fs.writeFileSync(path.join(brandingDir, 'app-dp.svg'), masterSvg);
  fs.writeFileSync(path.join(brandingDir, 'app-icon-maskable.svg'), maskableSvg);

  console.log('Exporting ultra-high-resolution PNG suite via sharp...');

  // 1. 1024x1024 Master PNG
  await sharp(Buffer.from(masterSvg))
    .resize(1024, 1024)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(brandingDir, 'icon-1024x1024.png'));
  fs.copyFileSync(path.join(brandingDir, 'icon-1024x1024.png'), path.join(brandingDir, 'app-icon-1024.png'));

  // 2. 512x512 PWA Standard Icon & App DP
  await sharp(Buffer.from(masterSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(brandingDir, 'icon-512x512.png'));
  fs.copyFileSync(path.join(brandingDir, 'icon-512x512.png'), path.join(brandingDir, 'app-dp.png'));
  fs.copyFileSync(path.join(brandingDir, 'icon-512x512.png'), path.join(brandingDir, 'android-launcher-icon.png'));

  // 3. 512x512 Maskable PWA Icon
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(brandingDir, 'icon-maskable-512x512.png'));

  // 4. 192x192 PWA Standard Icon
  await sharp(Buffer.from(masterSvg))
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(brandingDir, 'icon-192x192.png'));

  // 5. 192x192 Maskable PWA Icon
  await sharp(Buffer.from(maskableSvg))
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(brandingDir, 'icon-maskable-192x192.png'));

  // 6. 180x180 Apple Touch Icon
  await sharp(Buffer.from(masterSvg))
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(brandingDir, 'apple-touch-icon.png'));

  // Copy to public root for default Apple Touch Icon crawler discovery
  fs.copyFileSync(
    path.join(brandingDir, 'apple-touch-icon.png'),
    path.join(__dirname, '..', 'public', 'apple-touch-icon.png')
  );

  // 7. Android Adaptive Icon Background & Foreground
  await sharp(Buffer.from(backgroundSvg))
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile(path.join(brandingDir, 'adaptive-icon-background.png'));

  await sharp(Buffer.from(foregroundSvg))
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile(path.join(brandingDir, 'adaptive-icon-foreground.png'));

  // 8. Generate 48x48 Favicon PNG / ICO source
  await sharp(Buffer.from(masterSvg))
    .resize(48, 48)
    .png()
    .toFile(path.join(__dirname, '..', 'public', 'favicon-48x48.png'));

  console.log('Successfully generated complete luxury icon suite!');
}

main().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});

