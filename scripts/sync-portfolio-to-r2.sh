#!/bin/bash
#
# Sync portfolio images from public/portfolio/ to R2
# Run this once after adding new images

set -e

BUCKET="handy-beaver-images"
LOCAL_DIR="public/portfolio"

if [ ! -d "$LOCAL_DIR" ]; then
    echo "Error: Directory '$LOCAL_DIR' not found"
    echo "Run from repo root: ./scripts/sync-portfolio-to-r2.sh"
    exit 1
fi

echo "📦 Syncing portfolio images to R2..."
echo ""

# Counter
UPLOADED=0
SKIPPED=0

# Find all files recursively
for file in $(find "$LOCAL_DIR" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.webp" -o -name "*.mov" -o -name "*.mp4" \)); do
    # Get relative path from public/portfolio/
    rel_path="${file#$LOCAL_DIR/}"
    key="portfolio/$rel_path"
    
    # Get mime type
    mime_type=$(file --mime-type -b "$file")
    
    echo "⬆️  $rel_path → $key"
    wrangler r2 object put "$BUCKET/$key" --file "$file" --content-type "$mime_type" 2>/dev/null || {
        echo "   ⚠️ Failed to upload $file"
        continue
    }
    ((UPLOADED++))
done

echo ""
echo "✅ Synced $UPLOADED files to R2"
echo ""
echo "🔗 Images available at:"
echo "   https://handybeaver.co/api/assets/portfolio/<folder>/<filename>"
echo ""
echo "📋 List all portfolio images:"
echo "   wrangler r2 object list $BUCKET --prefix portfolio/"
