#!/bin/bash
# Checks all index.html files for proper footer.js inclusion.
# Run before pushing: bash scripts/check-footer.sh
# With --fix flag, auto-fixes missing footers.

FIX=false
if [ "$1" = "--fix" ]; then FIX=true; fi

ERRORS=0
FIXED=0

while IFS= read -r file; do
    if ! grep -q "footer.js" "$file"; then
        dir=$(dirname "$file")
        depth=$(echo "$dir" | sed 's|^\./||' | tr '/' '\n' | grep -c .)
        rel=""
        for ((i=0; i<depth; i++)); do rel="../$rel"; done
        if [ -z "$rel" ]; then rel="./"; fi

        if [ "$FIX" = true ]; then
            sed -i '' "s|</body>|    <div id=\"footer-placeholder\"></div>\n    <script src=\"${rel}js/footer.js\"></script>\n</body>|" "$file"
            echo "  ✅ Fixed: $file"
            FIXED=$((FIXED + 1))
        else
            echo "  ❌ Missing footer.js: $file"
            ERRORS=$((ERRORS + 1))
        fi
    fi
done < <(find . -name "index.html" -not -path "./node_modules/*")

if [ "$FIX" = true ] && [ $FIXED -gt 0 ]; then
    echo ""
    echo "Fixed $FIXED file(s)."
elif [ $ERRORS -gt 0 ]; then
    echo ""
    echo "$ERRORS file(s) missing footer.js. Run with --fix to auto-fix."
    exit 1
else
    echo "  ✅ All pages have footer.js"
fi
