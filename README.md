# Deck Boy DMG - Game Boy Emulator Plugin [![Chat](https://img.shields.io/badge/chat-on%20discord-7289da.svg)](https://deckbrew.xyz/discord)

A Steam Deck plugin that brings Game Boy emulation directly to your Steam Deck's plugin panel. Built with [decky-frontend-lib](https://github.com/SteamDeckHomebrew/decky-frontend-lib) and powered by the [@neil-morrison44/gameboy-emulator](https://www.npmjs.com/package/@neil-morrison44/gameboy-emulator) library.

## Features

- **Integrated Game Boy Emulator**: Full Game Boy emulation running directly in the plugin interface
- **Native Canvas Rendering**: Authentic 160x144 Game Boy resolution with pixelated scaling
- **ROM Management**: Load Game Boy ROMs from your filesystem (in development)
- **Save State Support**: Save and load your game progress (in development)
- **Steam Deck Optimized**: Designed specifically for Steam Deck's interface and controls

## Current Status

✅ **Completed**: Core emulator integration, UI components, canvas rendering pipeline  
🚧 **In Progress**: ROM file loading, filesystem integration  
⏳ **Planned**: Steam Deck input mapping, save state persistence, ROM directory scanning  

## Architecture

**Frontend**: React + TypeScript with @decky/ui components  
**Backend**: Python with decky plugin system  
**Emulator**: @neil-morrison44/gameboy-emulator library  
**Build**: Rollup bundler with @decky/rollup configuration  

### Key Components

- **EmulatorService**: Manages Game Boy emulator instance and canvas rendering
- **GameBoyEmulator Component**: Handles the 160x144 canvas display
- **ROMSelector Component**: ROM file selection interface
- **EmulatorControls Component**: Play/pause/reset and save state controls

## Installation

### For Users

1. Install [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) on your Steam Deck
2. Download the latest release zip from the releases page
3. Install via Decky Loader's plugin installer

### For Developers

#### Dependencies

This project relies on Node.js v16.14+ and `pnpm` (v9) installed on your system.  
Please make sure to install pnpm v9 to prevent issues with CI during plugin submission.  

#### Linux

```bash
sudo npm i -g pnpm@9
```

#### Setup & Development

1. Clone this repository:
   ```bash
   git clone https://github.com/xXJSONDeruloXx/deck-boy-dmg.git
   cd deck-boy-dmg
   ```

2. Install dependencies and build:
   ```bash
   pnpm i
   pnpm run build
   ```

3. For development with file watching:
   ```bash
   pnpm run watch
   ```

4. If using VSCode/VSCodium, run the `setup`, `build` and `deploy` tasks for streamlined development.

### Game Boy ROMs

Place your Game Boy ROM files (.gb, .gbc) in:
```
/home/deck/GameBoyROMs/
```

The plugin will scan this directory for available ROMs to load.

### Development Notes

Everytime you change the frontend code (`src/index.tsx`, components, etc.) you will need to rebuild using `pnpm run build` or the build task if you're using VSCode.

If you encounter build errors due to an out of date library, run:
```bash
pnpm update @decky/ui --latest
```

### Project Structure

```
src/
├── index.tsx              # Main plugin entry point
├── services/
│   └── EmulatorService.ts # Core emulator integration
├── components/
│   ├── GameBoyEmulator.tsx    # Canvas rendering component
│   ├── ROMSelector.tsx        # ROM selection interface
│   └── EmulatorControls.tsx   # Control buttons
└── types/
    └── emulator.ts        # TypeScript interfaces
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GPL-2.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [decky-loader](https://github.com/SteamDeckHomebrew/decky-loader) - Steam Deck plugin framework
- [@neil-morrison44/gameboy-emulator](https://www.npmjs.com/package/@neil-morrison44/gameboy-emulator) - Game Boy emulator library
- [decky-frontend-lib](https://github.com/SteamDeckHomebrew/decky-frontend-lib) - UI components for Steam Deck
