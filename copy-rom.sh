#!/bin/bash

# Script to copy a Tetris ROM to the deployed plugin directory
# Usage: ./copy-rom.sh /path/to/your/tetris.gb

ROM_FILE="$1"
DECK_USER="${DECK_USER:-deck}"
DECK_IP="${DECK_IP:-steamdeck}"
DECK_PORT="${DECK_PORT:-22}"
PLUGIN_DIR="\$HOME/.local/share/Steam/homebrew/plugins/deck-boy-dmg"

if [ -z "$ROM_FILE" ]; then
    echo "Usage: $0 <path-to-tetris.gb>"
    echo ""
    echo "Example: $0 ~/roms/tetris.gb"
    echo ""
    echo "This script copies a Game Boy ROM to the deployed plugin directory on your Steam Deck."
    exit 1
fi

if [ ! -f "$ROM_FILE" ]; then
    echo "Error: ROM file '$ROM_FILE' not found"
    exit 1
fi

echo "Copying ROM to Steam Deck..."
echo "Target: ${DECK_USER}@${DECK_IP}:${PLUGIN_DIR}/tetris.gb"

# Copy the ROM file
scp -P "$DECK_PORT" "$ROM_FILE" "${DECK_USER}@${DECK_IP}:${PLUGIN_DIR}/tetris.gb"

if [ $? -eq 0 ]; then
    echo "✓ ROM copied successfully!"
    echo ""
    echo "The plugin will now load this ROM automatically."
    echo "Restart the plugin or reopen the Decky menu to see changes."
else
    echo "✗ Failed to copy ROM"
    exit 1
fi
