#!/bin/bash
#
# Upload portfolio images to R2
# Usage: ./scripts/upload-portfolio-images.sh <directory> <category>
#
# Example:
#   ./scripts/upload-portfolio-images.sh ./photos/bathrooms bathroom-remodels
#
# Categories:
#   - bathroom-remodels
#   - specialty-wood
#   - trim-carpentry
#   - flooring
#   - stairs-railings
#   - decks-outdoor
#   - doors
#   - about

set -e

DIR="${1:-.}"
CATEGORY="${2:-gallery}"
BUCKET="handy-beaver-images"

if [ ! -d "$DIR" ]; then
    echo "Error: Directory '$DIR' not found"
    exit 1
fi

echo "📦 Uploading images from '$DIR' to R2 bucket '$BUCKET'"
echo "📁 Category: $CATEGORY"
echo ""

# Find all image files
for file in "$DIR"/*.{jpg,jpeg,png,gif,webp,mp4} 2>/dev/null; do
    [ -f "$file" ] || continue
    
    filename=$(basename "$file")
    key="portfolio/$CATEGORY/$filename"
    
    echo "⬆️  Uploading: $filename -> $key"
    wrangler r2 object put "$BUCKET/$key" --file "$file" --content-type "$(file --mime-type -b "$file")"
done

echo ""
echo "✅ Done! Images available at:"
echo "   https://handybeaver.co/api/images/portfolio/$CATEGORY/<filename>"
echo ""
echo "🔍 List uploaded files:"
echo "   wrangler r2 object list $BUCKET --prefix portfolio/$CATEGORY/"
