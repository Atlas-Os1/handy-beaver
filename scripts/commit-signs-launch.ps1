# Run this from the project root once any other agents are done working
# Usage: powershell -File scripts\commit-signs-launch.ps1

Set-Location "C:\Users\Minte\dev-code\handy-beaver-main"

# Remove any stale lock files
if (Test-Path ".git\index.lock") {
    Remove-Item ".git\index.lock" -Force
    Write-Host "Removed stale index.lock"
}

# Configure identity if not set
git config user.email "mintedmaterial@gmail.com"
git config user.name "Minte"

# Stage everything
Write-Host "Staging all files..."
git add -A

# Show what's being committed
Write-Host "`nFiles to commit:"
git status --short

# Commit
Write-Host "`nCommitting..."
git commit -m "feat: launch cabin signs department

- New /signs page with pricing tiers, gallery, FAQ, and Square order buttons
- Signs added to nav, services page (NEW badge), sitemap
- Quote calculator: cabin_sign service type with cabin name / size fields
- content-templates.json: cabin_signs theme, captions, image prompts, Marketplace listing, hashtags_by_theme
- social-media-content-plan.md: Sign Wednesday rotation + full signs strategy section
- AI Visualizer: cabin sign mockup added to Best For list and Examples section
- Square catalog API: POST /api/signs/setup-catalog seeds all 7 sign products
- Static sign photos served from public/portfolio/signs/ via wrangler [assets] binding
- r2-portfolio.ts: 4 sign photos catalogued for future R2 upload
- AGENTS.md: full cabin signs pricing + Square SKUs documented for Hermes
- scripts/upload-signs-to-r2.sh: one-shot R2 upload script for when account is ready"

Write-Host "`nDone! Commit created."
Write-Host "To deploy: npm run deploy"
