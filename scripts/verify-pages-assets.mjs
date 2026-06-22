import { copyFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const distRoot = join(process.cwd(), "dist");
const indexHtmlPath = join(distRoot, "index.html");
const fallbackHtmlPath = join(distRoot, "404.html");
const requiredDemoFiles = [
  "demo/room0/models/room0.splat",
  "demo/room0/photos/room0_3dgs_preview.webp",
  "demo/apartment_0/models/apartment_0.splat",
  "demo/apartment_1/models/apartment_1.splat",
  "demo/apartment_2/models/apartment_2.splat",
  "demo/hotel_0/models/hotel_0.splat",
  "demo/room_1/models/room_1.splat",
  "demo/room_2/models/room_2.splat",
  "404.html",
];

if (existsSync(indexHtmlPath) && !existsSync(fallbackHtmlPath)) {
  copyFileSync(indexHtmlPath, fallbackHtmlPath);
}

const missingFiles = [];

for (const filePath of requiredDemoFiles) {
  const absolutePath = join(distRoot, filePath);

  if (!existsSync(absolutePath) || statSync(absolutePath).size === 0) {
    missingFiles.push(filePath);
  }
}

if (missingFiles.length > 0) {
  console.error(
    [
      "GitHub Pages asset verification failed.",
      "The following files are missing from dist/:",
      ...missingFiles.map((filePath) => `- ${filePath}`),
    ].join("\n")
  );
  process.exit(1);
}

console.log(
  `GitHub Pages asset verification passed (${requiredDemoFiles.length} files).`
);
