# Deck Boy DMG - Game Boy Emulator Plugin for Decky

A minimal Decky plugin that runs Game Boy ROMs using WasmBoy emulator.

## Setup

### 1. Add a ROM file

Place a Game Boy ROM file named `tetris.gb` in the plugin's root directory. The plugin will automatically load this ROM when opened.

**Important:** The ROM file must be named exactly `tetris.gb` and placed in the plugin folder after deployment.

For example, after deploying the plugin, place the ROM at:
```
~/.local/share/Steam/homebrew/plugins/deck-boy-dmg/tetris.gb
```

### 2. Build and Deploy

Build the plugin:
```bash
pnpm run build
```

Or build and deploy to your Steam Deck:
```bash
# Make sure settings.json is configured with your Deck's IP and credentials
pnpm run builddeploy
```

## Controls

- **Arrow Keys** - D-pad (Up, Down, Left, Right)
- **Z** - A button
- **X** - B button
- **Enter** - Start button
- **Shift** - Select button

## Features

- Full Game Boy emulation via WasmBoy
- Automatic ROM loading on plugin open
- Real-time video and audio
- Keyboard controls for gameplay
- Error handling with user-friendly messages

## Development

The plugin is entirely frontend-based (React + TypeScript). No backend logic is required.

### Project Structure

```
src/
  index.tsx         - Main plugin code with WasmBoy integration
  wasmboy.d.ts      - TypeScript declarations for WasmBoy
  types.d.ts        - Additional type definitions
```

### Dependencies

- `wasmboy` - Game Boy emulator library
- `@decky/ui` - Decky UI components
- `@decky/api` - Decky plugin API

## Legal Notice

This plugin is an emulator only. You must own the original cartridge or have legal rights to any ROM files you use. The plugin author does not provide or endorse ROM piracy.
