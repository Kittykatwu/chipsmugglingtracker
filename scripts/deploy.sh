#!/bin/sh
# Build the site (runs the headline check) and publish dist/ to the gh-pages branch.
# GitHub Pages serves that branch at https://chipsmugglingtracker.org
set -e
cd "$(dirname "$0")/.."
npm run build
REMOTE=$(git remote get-url origin)
cd dist
rm -rf .git
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy $(date -u +%Y-%m-%dT%H:%MZ)"
git push -q -f "$REMOTE" gh-pages
rm -rf .git
echo "Deployed. Live in a minute or two at https://chipsmugglingtracker.org"
