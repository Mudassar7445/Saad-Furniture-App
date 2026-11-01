const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const brandingDir = path.join(__dirname, '..', 'public', 'assets', 'branding');
const publicDir = path.join(__dirname, '..', 'public');

if (!fs.existsSync(brandingDir)) {
  fs.mkdirSync(brandingDir, { recursive: true });
}

// 1. Master Luxury SVG Definition (1024x1024)
// Design: Deep Matte Black (#0B0D11) + Regal Champagne Gold Furniture Emblem (#FFF5DF, #D4AF37, #B99A68, #7A5C28)
// Recognizable at 48px on an Android phone and breathtaking at 1024px.
const createLuxuryIconSvg = (paddingRatio = 0.12) => {
  const size = 1024;
  const padding = size * paddingRatio; // padding for safe zone (maskable)

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <!-- Metallic Champagne Gold Gradients -->
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF5DF" />
      <stop offset="25%" stop-color="#E5C278" />
      <stop offset="50%" stop-color="#D4AF37" />
      <stop offset="75%" stop-color="#B99A68" />
      <stop offset="100%" stop-color="#7A5C28" />
    </linearGradient>

    <linearGradient id="goldSpecular" x1="0%" y1="30%" x2="100%" y2="70%">
      <stop offset="0%" stop-color="#D4AF37" />
      <stop offset="45%" stop-color="#FFFFFF" />
      <stop offset="55%" stop-color="#FFF2D6" />
      <stop offset="100%" stop-color="#93753E" />
    </linearGradient>

    <linearGradient id="goldAccent" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#B99A68" />
      <stop offset="50%" stop-color="#EADBBA" />
      <stop offset="100%" stop-color="#7A5C28" />
    </linearGradient>

    <radialGradient id="charcoalVignette" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#181A20" />
      <stop offset="60%" stop-color="#0E1015" />
      <stop offset="100%" stop-color="#07080B" />
    </radialGradient>

    <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="goldDropShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.85" />
    </filter>
  </defs>

  <!-- Deep Matte Black Luxury Canvas Background -->
  <rect width="${size}" height="${size}" rx="220" fill="url(#charcoalVignette)" />

  <!-- Outer Architectural Framing (Double Gold Filigree) -->
  <rect x="36" y="36" width="952" height="952" rx="192" fill="none" stroke="url(#goldGradient)" stroke-width="4.5" opacity="0.85" />
  <rect x="52" y="52" width="920" height="920" rx="176" fill="none" stroke="url(#goldAccent)" stroke-width="1.5" opacity="0.35" />

  <!-- Corner Ornamental Chevron Accents -->
  <g stroke="url(#goldSpecular)" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.75">
    <path d="M 100,160 L 100,100 L 160,100" />
    <path d="M 924,160 L 924,100 L 864,100" />
    <path d="M 100,864 L 100,924 L 160,924" />
    <path d="M 924,864 L 924,924 L 864,924" />
  </g>

  <!-- Central Luxury Emblem: Regal Architectural Sofa & Atelier Crown -->
  <g transform="translate(512, 500) scale(1.05)" filter="url(#goldDropShadow)">

    <!-- 1. The Royal 5-Point Atelier Crown (Jewel of Craftsmanship) -->
    <g transform="translate(0, -220)">
      <path d="M -90,40 L -120,-30 L -50,-10 L 0,-60 L 50,-10 L 120,-30 L 90,40 Z"
            fill="url(#goldGradient)" stroke="url(#goldSpecular)" stroke-width="3" stroke-linejoin="round" />
      <!-- Crown Pearls / Finials -->
      <circle cx="0" cy="-68" r="10" fill="#FFFFFF" stroke="url(#goldGradient)" stroke-width="3" />
      <circle cx="-120" cy="-38" r="8" fill="#FFF5DF" stroke="url(#goldGradient)" stroke-width="2.5" />
      <circle cx="120" cy="-38" r="8" fill="#FFF5DF" stroke="url(#goldGradient)" stroke-width="2.5" />
      <circle cx="-50" cy="-18" r="6" fill="#FFF5DF" stroke="url(#goldGradient)" stroke-width="2" />
      <circle cx="50" cy="-18" r="6" fill="#FFF5DF" stroke="url(#goldGradient)" stroke-width="2" />

      <!-- Crown Base Arch -->
      <path d="M -90,40 Q 0,55 90,40 Q 0,48 -90,40 Z" fill="url(#goldSpecular)" />
    </g>

    <!-- 2. Master Sculpted Luxury Sofa (Clean, Iconic, High-Impact Silhouette) -->
    <!-- Sovereign Backrest with Regal Sweeping Curves -->
    <path d="M -240,-90 C -200,-150 -100,-175 0,-175 C 100,-175 200,-150 240,-90 C 265,-50 260,10 230,50 C 190,40 100,35 0,35 C -100,35 -190,40 -230,50 C -260,10 -265,-50 -240,-90 Z"
          fill="url(#goldGradient)" stroke="url(#goldSpecular)" stroke-width="4" stroke-linejoin="round" />

    <!-- Interior Tufting & Fluting Accent Lines -->
    <g stroke="url(#goldSpecular)" stroke-width="2.5" stroke-linecap="round" opacity="0.6">
      <path d="M 0,-175 L 0,35" />
      <path d="M -75,-168 C -65,-100 -55,-20 -55,36" />
      <path d="M 75,-168 C 65,-100 55,-20 55,36" />
      <path d="M -150,-145 C -135,-85 -115,-10 -110,38" />
      <path d="M 150,-145 C 135,-85 115,-10 110,38" />
    </g>

    <!-- Deep Plump Seat Cushion (White-Glove Comfort) -->
    <path d="M -225,50 C -150,42 -50,38 0,38 C 50,38 150,42 225,50 C 245,55 250,90 235,115 C 160,130 50,135 0,135 C -50,135 -160,130 -235,115 C -250,90 -245,55 -225,50 Z"
          fill="url(#goldAccent)" stroke="url(#goldSpecular)" stroke-width="4.5" stroke-linejoin="round" />

    <!-- Highlight Edge on Seat Cushion Rim -->
    <path d="M -220,58 Q 0,44 220,58" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.65" stroke-linecap="round" />

    <!-- Sculpted Rolling Armrests (Classic Chesterfield / Parisian Curves) -->
    <!-- Left Armrest -->
    <path d="M -230,45 C -265,30 -290,-5 -280,-45 C -270,-80 -235,-95 -205,-80 C -185,-70 -195,-45 -215,-40 C -240,-35 -245,-15 -230,45 Z"
          fill="url(#goldGradient)" stroke="url(#goldSpecular)" stroke-width="3" />
    <!-- Right Armrest -->
    <path d="M 230,45 C 265,30 290,-5 280,-45 C 270,-80 235,-95 205,-80 C 185,-70 195,-45 215,-40 C 240,-35 245,-15 230,45 Z"
          fill="url(#goldGradient)" stroke="url(#goldSpecular)" stroke-width="3" />

    <!-- Solid Plinth & Tapered Architectural Legs -->
    <!-- Front Plinth Apron -->
    <path d="M -210,118 Q 0,132 210,118 L 205,148 Q 0,160 -205,148 Z"
          fill="url(#goldGradient)" stroke="url(#goldSpecular)" stroke-width="2" />

    <!-- 4 Tapered Brass-Capped Legs with Ground Shadows -->
    <!-- Left Outer Leg -->
    <polygon points="-200,148 -225,210 -195,210 -175,148" fill="url(#goldSpecular)" />
    <!-- Right Outer Leg -->
    <polygon points="200,148 225,210 195,210 175,148" fill="url(#goldSpecular)" />
    <!-- Left Inner Center Leg -->
    <polygon points="-65,155 -75,212 -55,212 -45,155" fill="url(#goldGradient)" />
    <!-- Right Inner Center Leg -->
    <polygon points="65,155 75,212 55,212 45,155" fill="url(#goldGradient)" />

    <!-- Interlocking Refined Monogram Seal in Center -->
    <g transform="translate(0, -65)">
      <circle cx="0" cy="0" r="42" fill="#0C0E12" stroke="url(#goldSpecular)" stroke-width="3" />
      <!-- Letter S -->
      <path d="M 12,-18 C 6,-23 -3,-24 -9,-21 C -16,-18 -18,-9 -12,-3 C -4,3 13,6 13,16 C 13,25 4,28 -3,28 C -12,28 -18,22 -20,16" 
            fill="none" stroke="url(#goldSpecular)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Letter F -->
      <path d="M -2,-20 L 16,-20 M -2,-20 L -2,24 M -2,2 L 12,2" 
            fill="none" stroke="url(#goldGradient)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </g>
</svg>
`;
};

// 2. Android Maskable Icon (Scaled down to 80% to fit within the 66% circle safe zone)
const createMaskableIconSvg = () => {
  const size = 1024;
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="mGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF5DF" />
      <stop offset="30%" stop-color="#E5C278" />
      <stop offset="55%" stop-color="#D4AF37" />
      <stop offset="85%" stop-color="#B99A68" />
      <stop offset="100%" stop-color="#7A5C28" />
    </linearGradient>
    <linearGradient id="mGoldSpecular" x1="0%" y1="30%" x2="100%" y2="70%">
      <stop offset="0%" stop-color="#D4AF37" />
      <stop offset="50%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#93753E" />
    </linearGradient>
    <radialGradient id="mCharcoalVignette" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#181A20" />
      <stop offset="70%" stop-color="#0E1015" />
      <stop offset="100%" stop-color="#07080B" />
    </radialGradient>
  </defs>

  <!-- Full Bleed Background for Adaptive Masks -->
  <rect width="${size}" height="${size}" fill="url(#mCharcoalVignette)" />

  <!-- Safe Zone Circular Accent -->
  <circle cx="512" cy="512" r="390" fill="none" stroke="url(#mGoldGrad)" stroke-width="3" opacity="0.4" />

  <!-- Center Emblem Scaled into Safe Zone (65% of size) -->
  <g transform="translate(512, 512) scale(0.72)">
    <!-- Crown -->
    <g transform="translate(0, -220)">
      <path d="M -90,40 L -120,-30 L -50,-10 L 0,-60 L 50,-10 L 120,-30 L 90,40 Z"
            fill="url(#mGoldGrad)" stroke="url(#mGoldSpecular)" stroke-width="4" stroke-linejoin="round" />
      <circle cx="0" cy="-68" r="14" fill="#FFFFFF" stroke="url(#mGoldGrad)" stroke-width="4" />
      <circle cx="-120" cy="-38" r="11" fill="#FFF5DF" stroke="url(#mGoldGrad)" stroke-width="3" />
      <circle cx="120" cy="-38" r="11" fill="#FFF5DF" stroke="url(#mGoldGrad)" stroke-width="3" />
    </g>

    <!-- Sofa Backrest -->
    <path d="M -240,-90 C -200,-150 -100,-175 0,-175 C 100,-175 200,-150 240,-90 C 265,-50 260,10 230,50 C 190,40 100,35 0,35 C -100,35 -190,40 -230,50 C -260,10 -265,-50 -240,-90 Z"
          fill="url(#mGoldGrad)" stroke="url(#mGoldSpecular)" stroke-width="6" stroke-linejoin="round" />

    <!-- Sofa Cushion -->
    <path d="M -225,50 C -150,42 -50,38 0,38 C 50,38 150,42 225,50 C 245,55 250,90 235,115 C 160,130 50,135 0,135 C -50,135 -160,130 -235,115 C -250,90 -245,55 -225,50 Z"
          fill="url(#mGoldGrad)" stroke="url(#mGoldSpecular)" stroke-width="6" stroke-linejoin="round" />

    <!-- Rolling Arms -->
    <path d="M -230,45 C -265,30 -290,-5 -280,-45 C -270,-80 -235,-95 -205,-80 C -185,-70 -195,-45 -215,-40 C -240,-35 -245,-15 -230,45 Z"
          fill="url(#mGoldGrad)" stroke="url(#mGoldSpecular)" stroke-width="4" />
    <path d="M 230,45 C 265,30 290,-5 280,-45 C 270,-80 235,-95 205,-80 C 185,-70 195,-45 215,-40 C 240,-35 245,-15 230,45 Z"
          fill="url(#mGoldGrad)" stroke="url(#mGoldSpecular)" stroke-width="4" />

    <!-- Plinth & Legs -->
    <path d="M -210,118 Q 0,132 210,118 L 205,148 Q 0,160 -205,148 Z" fill="url(#mGoldGrad)" />
    <polygon points="-200,148 -225,210 -195,210 -175,148" fill="url(#mGoldSpecular)" />
    <polygon points="200,148 225,210 195,210 175,148" fill="url(#mGoldSpecular)" />
    <polygon points="-65,155 -75,212 -55,212 -45,155" fill="url(#mGoldGrad)" />
    <polygon points="65,155 75,212 55,212 45,155" fill="url(#mGoldGrad)" />

    <!-- Center Monogram -->
    <g transform="translate(0, -65)">
      <circle cx="0" cy="0" r="44" fill="#0C0E12" stroke="url(#mGoldSpecular)" stroke-width="4" />
      <path d="M 12,-18 C 6,-23 -3,-24 -9,-21 C -16,-18 -18,-9 -12,-3 C -4,3 13,6 13,16 C 13,25 4,28 -3,28 C -12,28 -18,22 -20,16" 
            fill="none" stroke="url(#mGoldSpecular)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M -2,-20 L 16,-20 M -2,-20 L -2,24 M -2,2 L 12,2" 
            fill="none" stroke="url(#mGoldGrad)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </g>
</svg>
`;
};

async function buildAllIcons() {
  console.log('Generating master luxury SVG definitions...');
  const masterSvg = createLuxuryIconSvg(0.12);
  const maskableSvg = createMaskableIconSvg();

  // Save SVGs
  fs.writeFileSync(path.join(brandingDir, 'app-dp.svg'), masterSvg.trim());
  fs.writeFileSync(path.join(brandingDir, 'app-icon-master.svg'), masterSvg.trim());
  fs.writeFileSync(path.join(brandingDir, 'app-icon-maskable.svg'), maskableSvg.trim());
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), masterSvg.trim());

  console.log('Rendering high-DPI raster PNGs using sharp...');

  // 1. Master 1024x1024
  await sharp(Buffer.from(masterSvg))
    .resize(1024, 1024)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(brandingDir, 'icon-1024x1024.png'));
  console.log('✓ Created 1024x1024 Master Icon');

  // 2. 512x512 PWA & Store Icon
  await sharp(Buffer.from(masterSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(brandingDir, 'icon-512x512.png'));
  await sharp(Buffer.from(masterSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(brandingDir, 'app-dp.png'));
  await sharp(Buffer.from(masterSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✓ Created 512x512 Icons');

  // 3. 192x192 PWA Mobile Icon
  await sharp(Buffer.from(masterSvg))
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(brandingDir, 'icon-192x192.png'));
  await sharp(Buffer.from(masterSvg))
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✓ Created 192x192 Icons');

  // 4. Maskable Icons (192 & 512)
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(brandingDir, 'icon-maskable-512x512.png'));
  await sharp(Buffer.from(maskableSvg))
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(brandingDir, 'icon-maskable-192x192.png'));
  console.log('✓ Created Maskable Icons');

  // 5. Apple Touch Icon (180x180)
  await sharp(Buffer.from(masterSvg))
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(brandingDir, 'apple-touch-icon.png'));
  await sharp(Buffer.from(masterSvg))
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Created Apple Touch Icon (180x180)');

  // 6. Android Adaptive Foreground & Background
  const adaptiveBgSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
    <rect width="1024" height="1024" fill="#0B0D11" />
  </svg>`;
  await sharp(Buffer.from(adaptiveBgSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(brandingDir, 'adaptive-icon-background.png'));

  const adaptiveFgSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
    <g transform="translate(0, 0)">
      ${maskableSvg.slice(maskableSvg.indexOf('<g transform='), maskableSvg.lastIndexOf('</svg>'))}
    </g>
  </svg>`;
  await sharp(Buffer.from(adaptiveFgSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(brandingDir, 'adaptive-icon-foreground.png'));
  console.log('✓ Created Android Adaptive Foreground & Background');

  // 7. Android Circular Launcher Icon
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(brandingDir, 'android-launcher-icon.png'));
  console.log('✓ Created Android Launcher Icon');

  console.log('All luxury icon assets generated successfully!');
}

buildAllIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
