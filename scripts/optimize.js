import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const images = [
    'ceo.png',
    'ceo2.png',
    'edunaukri.png',
    'logo.jpg',
    'logo.png',
    'nextorapos.png',
    'sevajobs.png',
    'shoebsir.png'
];

async function optimizeImages() {
    for (const image of images) {
        const inputPath = path.join(projectRoot, image);
        if (fs.existsSync(inputPath)) {
            const ext = path.extname(image);
            const basename = path.basename(image, ext);
            const outputPath = path.join(projectRoot, 'public', `${basename}.webp`);
            
            try {
                await sharp(inputPath)
                    .webp({ quality: 80, effort: 6 })
                    .toFile(outputPath);
                console.log(`Optimized ${image} to ${basename}.webp`);
            } catch (err) {
                console.error(`Error optimizing ${image}:`, err);
            }
        } else {
            console.warn(`Warning: ${image} not found.`);
        }
    }
}

optimizeImages();
