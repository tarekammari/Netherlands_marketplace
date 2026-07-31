const fs = require('fs');
const path = require('path');

const artifactsDir = 'C:\\Users\\TAREK\\.gemini\\antigravity-ide\\brain\\cb84f133-6884-4b18-8b64-3df56c2921e2';
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const mappings = [
  { prefix: 'hero_netherlands_visual', target: 'hero-netherlands.png' },
  { prefix: 'about_hero_visual', target: 'about-hero.png' },
  { prefix: 'contact_hq_office', target: 'contact-hq.png' },
  { prefix: 'pricing_escrow_security', target: 'pricing-escrow.png' },
];

if (fs.existsSync(artifactsDir)) {
  const files = fs.readdirSync(artifactsDir);
  for (const map of mappings) {
    const file = files.find(f => f.startsWith(map.prefix) && f.endsWith('.png'));
    if (file) {
      const src = path.join(artifactsDir, file);
      const dest = path.join(publicDir, map.target);
      fs.copyFileSync(src, dest);
      console.log(`Successfully copied ${file} to public/${map.target}`);
    }
  }
}
