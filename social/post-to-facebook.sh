#!/bin/bash
# Handy Beaver Co - Facebook Auto-Poster
# Posts as Lil Beaver with generated images and varied captions

set -e
source /home/flo/clawd/.env

PAGE_ID="1040910635768535"
TOKEN="$FACEBOOK_PAGE_TOKEN_HANDYBEAVER_WORKING"
R2_BUCKET="atlas-collab-pub"
R2_PREFIX="handy-beaver"

# Get theme from arg or random
THEME="${1:-random}"
if [ "$THEME" = "random" ]; then
  THEMES=("deck" "flooring" "trim" "general")
  THEME="${THEMES[$RANDOM % ${#THEMES[@]}]}"
fi

echo "🦫 Posting Lil Beaver content - Theme: $THEME"

# Generate unique image
TIMESTAMP=$(date +%s)
IMAGE_FILE="/tmp/lilbeaver-${THEME}-${TIMESTAMP}.png"

case $THEME in
  deck)
    PROMPT="Cute cartoon beaver mascot in yellow hard hat and red flannel shirt standing proudly on a freshly stained wooden deck overlooking scenic Oklahoma forest, professional home improvement, warm lighting, photorealistic background with cartoon character overlay"
    ;;
  flooring)
    PROMPT="Cute cartoon beaver mascot in yellow hard hat and flannel shirt installing beautiful dark hardwood flooring in modern living room, kneeling with tools, professional renovation, photorealistic interior"
    ;;
  trim)
    PROMPT="Cute cartoon beaver mascot in hard hat installing crisp white baseboards in elegant living room, measuring tape, professional carpentry, photorealistic setting"
    ;;
  *)
    PROMPT="Cute cartoon beaver mascot in yellow hard hat and red flannel shirt holding toolbox, standing in front of beautiful Oklahoma home, friendly confident pose, photorealistic background"
    ;;
esac

# Generate image
python3 /home/flo/.openclaw/skills/frontend/atlas-warhol/scripts/generate.py \
  --prompt "$PROMPT" \
  --output "$IMAGE_FILE" \
  --steps 8

# Upload to R2
R2_PATH="${R2_PREFIX}/posts/lilbeaver-${THEME}-${TIMESTAMP}.png"
wrangler r2 object put "${R2_BUCKET}/${R2_PATH}" --file="$IMAGE_FILE" --remote

IMAGE_URL="https://pub-30a843d7499b4062bd2f2e9cde157bd0.r2.dev/${R2_PATH}"

echo "✅ Image ready: $IMAGE_URL"
echo "$IMAGE_URL"
