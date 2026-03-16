# Pending Gallery Images

**Created:** 2026-03-16
**Status:** Waiting for Minte's PC to come online

## Source Folders (on Minte's Windows PC)

All images are at `C:\Users\Minte\Pictures\Handybeaver\`:

- `Barndo/` - Barndominium project
- `Burke-residence/` - Burke residence project  
- `Decking/` - Deck work
- `office-space/` - Office space project
- `Rustic-Cabin/` - Rustic cabin work
- `T&G/` - Tongue and groove work
- `Tiny-Home/` - Tiny home build
- `Stairs-Decking-Railing/` - Stairs, decking, railing work
- `Siding/` - Siding projects
- `bath-remodel/` - Bathroom remodel photos
- `Flooring/` - Flooring installations

## Upload Process

When PC is online (`ssh Minte@100.84.133.97`):

1. List all images with metadata:
```bash
ssh Minte@100.84.133.97 "dir /s /b C:\Users\Minte\Pictures\Handybeaver"
```

2. For each folder, get file dates for ordering:
```bash
ssh Minte@100.84.133.97 "forfiles /p C:\Users\Minte\Pictures\Handybeaver\Decking /c \"cmd /c echo @file @fdate\""
```

3. Download images to VPS:
```bash
scp -r Minte@100.84.133.97:"C:/Users/Minte/Pictures/Handybeaver/*" /tmp/handy-beaver-images/
```

4. Process and resize (if needed):
```bash
# Resize to max 1920px wide, optimize for web
for f in /tmp/handy-beaver-images/**/*.jpg; do
  convert "$f" -resize 1920x -quality 85 "$f"
done
```

5. Upload to R2 bucket `handy-beaver-images`:
```bash
cd /home/flo/handy-beaver
for folder in /tmp/handy-beaver-images/*/; do
  name=$(basename "$folder")
  for img in "$folder"/*.{jpg,jpeg,png,JPG,JPEG,PNG}; do
    [ -f "$img" ] && npx wrangler r2 object put handy-beaver-images/portfolio/$name/$(basename "$img") --file="$img"
  done
done
```

6. Update `config/portfolio-manifest.ts` with new entries

7. Redeploy worker

## Category Mapping

| PC Folder | Website Category |
|-----------|-----------------|
| Barndo | specialty-wood or tiny-home |
| Burke-residence | trim-carpentry or bathroom-remodels |
| Decking | decks-outdoor |
| office-space | trim-carpentry |
| Rustic-Cabin | specialty-wood |
| T&G | trim-carpentry |
| Tiny-Home | tiny-home |
| Stairs-Decking-Railing | stairs-railings, decks-outdoor |
| Siding | decks-outdoor (outdoor work) |
| bath-remodel | bathroom-remodels |
| Flooring | flooring |

## Notes

- Check image dates for project timeline ordering
- Look for before/after pairs
- Mark best shots as featured
- Keep file sizes reasonable (< 500KB per image ideally)

## Social Media Use

These images also serve as **reference material for AI-generated social content**:
- Use real project photos as input for image generation models
- Generate fresh variations for Facebook/Instagram posts
- Maintains authentic style based on actual work
- Better than stock photos for showcasing real craftsmanship

Store originals in a separate folder for social generation:
```bash
# Copy best shots to social reference folder
npx wrangler r2 object put handy-beaver-images/social-reference/[category]/[filename] --file="[path]"
```

## Monitoring PC Status

```bash
# Quick check
ssh -o ConnectTimeout=5 Minte@100.84.133.97 "echo online" 2>/dev/null && echo "PC is online!" || echo "PC offline"
```

---

**Next check:** During next heartbeat or when Minte confirms PC is on
