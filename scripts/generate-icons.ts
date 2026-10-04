/**
 * Gera os ícones PNG do PWA a partir do logo em src/app/icon.svg.
 *
 *   npm run icons
 */
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const BACKGROUND = "#ffffff";

/** Conteúdo interno do SVG do logo (viewBox 0 0 32 32), sem a tag <svg> externa. */
async function logoContent() {
  const svg = await readFile("src/app/icon.svg", "utf8");
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
}

/** SVG quadrado com o logo centralizado ocupando `scale` do lado, com ou sem fundo. */
function composeSvg(content: string, size: number, scale: number, background?: string) {
  const logo = size * scale;
  const offset = (size - logo) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : ""}
    <svg x="${offset}" y="${offset}" width="${logo}" height="${logo}" viewBox="0 0 32 32" fill="none">${content}</svg>
  </svg>`;
}

const ICONS = [
  // "any": instalação no desktop e navegadores que respeitam transparência.
  { file: "public/icons/icon-192.png", size: 192, scale: 0.9 },
  { file: "public/icons/icon-512.png", size: 512, scale: 0.9 },
  // "maskable": Android recorta em círculo/squircle; o logo fica dentro da zona segura (80%).
  { file: "public/icons/icon-maskable-512.png", size: 512, scale: 0.6, background: BACKGROUND },
  // iOS não aceita transparência na tela inicial.
  { file: "src/app/apple-icon.png", size: 180, scale: 0.72, background: BACKGROUND },
];

async function main() {
  const content = await logoContent();
  for (const icon of ICONS) {
    const png = await sharp(Buffer.from(composeSvg(content, icon.size, icon.scale, icon.background)))
      .png()
      .toBuffer();
    await writeFile(icon.file, png);
    console.log(`✓ ${icon.file} (${icon.size}x${icon.size})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
