const fs = require("fs");
const path = require("path");

const publicImagesDir = path.join(__dirname, "public", "images");
if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true });
}

const imagesToCopy = [
  {
    src: "C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\8929ef63-a204-4606-bde9-20ee6f6e1949\\about_hero_visual_1785407832717.png",
    dest: path.join(publicImagesDir, "about_hero.png"),
  },
  {
    src: "C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\8929ef63-a204-4606-bde9-20ee6f6e1949\\contact_hq_office_1785407851220.png",
    dest: path.join(publicImagesDir, "contact_hq.png"),
  },
  {
    src: "C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\8929ef63-a204-4606-bde9-20ee6f6e1949\\pricing_escrow_security_1785407871388.png",
    dest: path.join(publicImagesDir, "pricing_escrow.png"),
  },
];

imagesToCopy.forEach(({ src, dest }) => {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Successfully copied ${path.basename(src)} -> ${dest}`);
  } else {
    console.warn(`Source image not found: ${src}`);
  }
});
