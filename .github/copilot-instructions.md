# Deck Boy DMG - Game Boy Emulator Plugin

This is a Steam Deck plugin built with the Decky Loader framework that integrates Game Boy emulation via the `@neil-morrison44/gameboy-emulator` library.

## Architecture Overview

**Frontend**: React + TypeScript using `@decky/ui` components, bundled with Rollup
**Backend**: Python with decky plugin system (currently minimal, mainly for potential ROM file access)
**Build**: `pnpm build` creates `dist/index.js` consumed by Steam Deck's plugin loader

### Key Components & Data Flow

1. **Plugin Entry** (`src/index.tsx`): Main plugin definition with `definePlugin()` - exports name, icon, content
2. **EmulatorService** (`src/services/EmulatorService.ts`): Singleton managing Gameboy instance, canvas rendering, ROM loading
3. **GameBoyEmulator Component**: Renders 160x144 canvas, handles emulator initialization and ROM display
4. **ROMSelector Component**: Manages ROM file selection (currently placeholder data, needs filesystem integration)
5. **EmulatorControls Component**: Play/pause/reset/save state UI

**Critical Data Flow**: ROM data (Uint8Array) → EmulatorService.loadROM() → Gameboy.loadGame(ArrayBuffer) → onFrameFinished callback → Canvas.putImageData()

### Decky Plugin Patterns

- Use `@decky/ui` components (PanelSection, PanelSectionRow, ButtonItem, Dropdown) for consistent Steam Deck styling
- Plugin state managed via React hooks in main Content component
- Toast notifications via `toaster.toast()` for user feedback
- Plugin lifecycle: `definePlugin()` returns object with content, onDismount cleanup

### Emulator Integration Specifics

**Canvas Setup**: 160x144 native Game Boy resolution, 2x CSS scaling, `image-rendering: pixelated`
**ROM Loading**: Convert Uint8Array to ArrayBuffer using `new ArrayBuffer()` + `Uint8Array.set()` (not .buffer.slice() due to TypeScript SharedArrayBuffer issues)
**Rendering**: Gameboy instance uses `onFrameFinished(imageData => context.putImageData(imageData, 0, 0))` callback
**Audio**: Enable with `emulator.apu?.enableSound()` wrapped in try/catch (may fail in some environments)

### Development Commands

```bash
pnpm i              # Install dependencies  
pnpm build          # Build for production
pnpm watch          # Build with file watching
```

### Current Implementation Status

**✅ Completed**: Project setup, EmulatorService integration, UI components, canvas rendering pipeline
**🚧 In Progress**: ROM file loading (currently uses placeholder test ROMs), filesystem integration
**❌ TODO**: Steam Deck input mapping, actual ROM directory scanning (`/home/deck/GameBoyROMs/`), save state persistence

### Common Patterns

**Error Handling**: Services throw errors, components catch and call `onError?.(message)` prop, main component shows in status panel
**State Management**: EmulatorState interface tracks `isPlaying`, `isLoaded`, `currentROM`, `error` - single source of truth in main Content component
**Service Injection**: Pass EmulatorService instance down through props rather than creating multiple instances

### File System Integration (Needed)

ROMs need loading from `/home/deck/GameBoyROMs/` - likely requires backend Python API calls via `@decky/api` callable functions or direct filesystem access investigation.

### Key Files for Understanding

- `src/index.tsx` - Plugin structure and state management
- `src/services/EmulatorService.ts` - Core emulator integration logic  
- `src/components/GameBoyEmulator.tsx` - Canvas handling and rendering
- `DEVELOPMENT_PLAN.md` - Detailed project roadmap and current progress
- `plugin.json` - Plugin metadata for Steam Deck
