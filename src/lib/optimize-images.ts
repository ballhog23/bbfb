// src/lib/optimize-images.ts
import sharp from "sharp";
import fs from "fs";
import path from "node:path";

const inputDir = path.join(process.cwd(), "public/assets");
const outputDir = path.join(inputDir, "optimized");

// Breakpoints for responsive images
const BREAKPOINTS = [400, 600, 800, 1200];

function isStale(sourcePath: string, outputPath: string): boolean {
    if (!fs.existsSync(outputPath)) return true;
    const srcMtime = fs.statSync(sourcePath).mtimeMs;
    const outMtime = fs.statSync(outputPath).mtimeMs;
    return srcMtime > outMtime;
}

type ImageEntry = NonNullable<Awaited<ReturnType<typeof processImage>>>;

async function processImage(file: string) {
    const inputPath = path.join(inputDir, file);
    const metadata = await sharp(inputPath).metadata();

    if (!metadata.width || !metadata.height) return null;

    const originalWidth = metadata.width;
    const originalHeight = metadata.height;
    const aspectRatio = originalHeight / originalWidth;

    // Only keep breakpoints smaller than original
    const validWidths = BREAKPOINTS.filter(w => w <= originalWidth);

    const variants: { width: number; height: number; path: string; }[] = [];

    // If original image is smaller than smallest breakpoint, just copy it
    if (validWidths.length === 0) {
        const outputName = file;
        const outputPath = path.join(outputDir, outputName);

        if (isStale(inputPath, outputPath)) {
            fs.copyFileSync(inputPath, outputPath);
            console.log(`  copied ${file}`);
        } else {
            console.log(`  skipped ${file} (unchanged)`);
        }

        variants.push({
            width: originalWidth,
            height: originalHeight,
            path: `/assets/optimized/${outputName}`
        });

        return { variants };
    }

    // Generate variants
    for (const width of validWidths) {
        const height = Math.round(width * aspectRatio);
        const baseName = file.replace(/\.[^/.]+$/, "");
        const outputName = `${baseName}-${width}.webp`;
        const outputPath = path.join(outputDir, outputName);

        if (isStale(inputPath, outputPath)) {
            await sharp(inputPath).resize(width, height).webp({ quality: 75 }).toFile(outputPath);
            console.log(`  generated ${outputName}`);
        } else {
            console.log(`  skipped ${outputName} (unchanged)`);
        }

        variants.push({
            width,
            height,
            path: `/assets/optimized/${outputName}`
        });
    }

    return { variants };
}

async function run() {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const files = fs.readdirSync(inputDir).filter(file =>
        /\.(jpg|jpeg|png|webp)$/i.test(file)
    );

    const manifest: Record<string, ImageEntry> = {};

    for (const file of files) {
        const result = await processImage(file);
        if (result) {
            manifest[file] = result;
        }
    }

    fs.writeFileSync(
        path.join(inputDir, "image-manifest.json"),
        JSON.stringify(manifest, null, 2)
    );

    console.log(`Image optimization complete. ${Object.keys(manifest).length} images processed.`);
}

run();
