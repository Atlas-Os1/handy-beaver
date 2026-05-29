#!/bin/bash
# Upload sign portfolio photos to R2 (handy-beaver-images bucket)
# Run this once from the project root after adding new sign photos to public/portfolio/signs/
#
# Usage: bash scripts/upload-signs-to-r2.sh

SIGNS_DIR="public/portfolio/signs"
R2_BUCKET="handy-beaver-images"
R2_PREFIX="portfolio/Signs"

if [ ! -d "$SIGNS_DIR" ]; then
  echo "ERROR: $SIGNS_DIR directory not found. Run from project root."
  exit 1
fi

echo "Uploading sign photos to R2 bucket: $R2_BUCKET/$R2_PREFIX"
echo ""

for file in "$SIGNS_DIR"/*.{jpeg,jpg,png}; do
  [ -f "$file" ] || continue
  filename=$(basename "$file")
  echo "Uploading: $filename ..."
  npx wrangler r2 object put "$R2_BUCKET/$R2_PREFIX/$filename" \
    --file="$file" \
    --content-type="$(file --mime-type -b "$file")"
  echo "  Done: $R2_PREFIX/$filename"
done

echo ""
echo "All sign photos uploaded. They will be available at:"
echo "  https://handybeaver.co/api/assets/portfolio/Signs/<filename>"
echo ""
echo "Next: redeploy the worker to pick up r2-portfolio.ts changes:"
echo "  npm run deploy"
