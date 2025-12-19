#!/bin/bash
# Regenerate documentation screenshots
# Requires: Chrome, ImageMagick (magick), local server running (npm start)

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE="http://localhost:8080/#autostart=1"
OUT="screenshots"

echo "Taking screenshots..."

"$CHROME" --headless --screenshot="$OUT/dark-25min-controls.png" \
  --window-size=1300,1000 "$BASE&dark=1&time=25&mode=ccw&marks=15"

"$CHROME" --headless --screenshot="$OUT/light-5min.png" \
  --window-size=1000,1000 "$BASE&time=5&mode=ccw&controls=0"

"$CHROME" --headless --screenshot="$OUT/digital-82min.png" \
  --window-size=1000,1000 "$BASE&time=82&mode=ccw&controls=0&display=digital"

# END mode: calculate target time 25 mins from now
END_TIME=$(date -v+25M +%H:%M)
"$CHROME" --headless --screenshot="$OUT/end-mode-25min.png" \
  --window-size=1000,1000 "$BASE&time=$END_TIME&mode=end&controls=0"

echo "Cropping..."

# Trim and add 10px border (dark bg for dark mode, white for light)
magick "$OUT/dark-25min-controls.png" -trim -bordercolor "#111" -border 10 "$OUT/dark-25min-controls.png"
magick "$OUT/light-5min.png" -trim -bordercolor white -border 10 "$OUT/light-5min.png"
magick "$OUT/digital-82min.png" -trim -bordercolor white -border 10 "$OUT/digital-82min.png"
magick "$OUT/end-mode-25min.png" -trim -bordercolor white -border 10 "$OUT/end-mode-25min.png"

echo "Done. Screenshots saved to $OUT/"
