// Type definitions for Game Boy emulator plugin

export interface EmulatorState {
  isPlaying: boolean;
  isLoaded: boolean;
  currentROM?: string;
  error?: string;
}

export interface GameBoyControls {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  a: boolean;
  b: boolean;
  start: boolean;
  select: boolean;
}

export interface SaveState {
  timestamp: number;
  romName: string;
  data: Uint8Array;
  screenshot?: ImageData;
}

export interface PluginSettings {
  romDirectory: string;
  volume: number;
  displayScale: number;
  autoSave: boolean;
  keyMappings?: { [key: string]: keyof GameBoyControls };
}

// Event types for emulator communication
export type EmulatorEvent = 
  | { type: 'rom_loaded'; romName: string }
  | { type: 'rom_error'; error: string }
  | { type: 'state_changed'; state: EmulatorState }
  | { type: 'save_created'; saveState: SaveState }
  | { type: 'frame_rendered' };

export interface EmulatorEventHandler {
  (event: EmulatorEvent): void;
}
