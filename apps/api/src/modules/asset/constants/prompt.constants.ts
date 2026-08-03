export const DEFAULT_PROMPT_TEMPLATE = `
You are an expert graphic designer and asset extractor.
Analyze this slide presentation image. Identify the primary commercial design asset, character design, background, vector illustration, or template graphics.
Isolate and extract the core design element. Describe its coordinates, shape, background removal constraints, and export details.
Format the output as a clean, structured JSON containing:
{
  "assetName": "Short descriptive name of the asset",
  "category": "Estimated category (e.g. Sticker, T-shirt Design, Pattern, Illustration)",
  "extractedProperties": {
    "dominantColors": ["#hex1", "#hex2"],
    "backgroundType": "transparent/white/gradient",
    "theme": "Minimalist/Vintage/Modern"
  },
  "extractionMethod": "vision-crop / svg-generation / transparency-mask",
  "costEstimation": 0.015
}
`;
