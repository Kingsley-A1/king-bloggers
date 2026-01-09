// scripts/compress-og.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputPath = path.join(__dirname, '../public/icons/og.png');
const outputPath = path.join(__dirname, '../public/icons/og.png');

// WhatsApp recommends < 300KB for OG images
// We'll resize to 1200x630 and compress as PNG with maximum compression
await sharp(inputPath)
  .resize(1200, 630, { fit: 'cover' })
  .png({ 
    compressionLevel: 9,
    palette: true, // Use palette-based PNG for smaller size
    quality: 80,
    effort: 10 // Maximum compression effort
  })
  .toFile(outputPath.replace('.png', '_temp.png'));

// Replace original with compressed
import fs from 'fs';
fs.renameSync(outputPath.replace('.png', '_temp.png'), outputPath);

const stats = fs.statSync(outputPath);
console.log(`Compressed OG image: ${(stats.size / 1024).toFixed(1)} KB`);
