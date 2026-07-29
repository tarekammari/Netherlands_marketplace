const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'netherlands_hero_visual_1785126740232.png');
const dest = path.join(__dirname, 'public', 'hero-netherlands.png');

fs.copyFileSync(src, dest);
console.log('SUCCESS: Copied image to public/hero-netherlands.png');
