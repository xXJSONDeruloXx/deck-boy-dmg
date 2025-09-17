// Service for managing Game Boy emulator instance
import { Gameboy } from '@neil-morrison44/gameboy-emulator';

export class EmulatorService {
  private emulator: Gameboy | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private isRunning = false;
  private isInitialized = false;

  constructor() {
    // Initialize emulator service
    this.emulator = new Gameboy({ sound: true });
  }

  /**
   * Initialize the emulator with a canvas element
   */
  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    try {
      this.canvas = canvas;
      this.context = canvas.getContext('2d');
      
      if (!this.context) {
        throw new Error('Failed to get canvas 2D context');
      }

      if (!this.emulator) {
        this.emulator = new Gameboy({ sound: true });
      }

      // Set up the frame callback to render to canvas
      this.emulator.onFrameFinished((imageData: ImageData) => {
        if (this.context) {
          this.context.putImageData(imageData, 0, 0);
        }
      });

      this.isInitialized = true;
      console.log('Emulator service initialized with canvas:', canvas);
    } catch (error) {
      console.error('Failed to initialize emulator:', error);
      throw error;
    }
  }

  /**
   * Load ROM data into the emulator
   */
  async loadROM(romData: Uint8Array, romName: string): Promise<void> {
    try {
      if (!this.emulator) {
        throw new Error('Emulator not created. This should not happen.');
      }

      if (!this.isInitialized) {
        throw new Error('Emulator not initialized. Call initialize() first.');
      }

      // Convert Uint8Array to ArrayBuffer as required by the emulator
      const arrayBuffer = new ArrayBuffer(romData.length);
      const view = new Uint8Array(arrayBuffer);
      view.set(romData);

      // Load the ROM into the emulator
      this.emulator.loadGame(arrayBuffer);
      
      // Enable audio (if supported by browser environment)
      try {
        this.emulator.apu?.enableSound();
      } catch (audioError) {
        console.warn('Failed to enable audio:', audioError);
        // Continue without audio if it fails
      }

      console.log(`ROM loaded successfully: ${romName} (${romData.length} bytes)`);
      this.isRunning = false;
    } catch (error) {
      console.error('Failed to load ROM:', error);
      throw error;
    }
  }

  /**
   * Start emulator execution
   */
  play(): void {
    try {
      if (!this.emulator) {
        throw new Error('No emulator instance');
      }

      if (!this.isInitialized) {
        throw new Error('Emulator not initialized');
      }
      
      this.emulator.run();
      this.isRunning = true;
      console.log('Emulator started');
    } catch (error) {
      console.error('Failed to start emulator:', error);
      throw error;
    }
  }

  /**
   * Pause emulator execution
   */
  pause(): void {
    try {
      if (!this.emulator) {
        throw new Error('No emulator instance');
      }

      this.emulator.stop();
      this.isRunning = false;
      console.log('Emulator paused');
    } catch (error) {
      console.error('Failed to pause emulator:', error);
      throw error;
    }
  }

  /**
   * Reset the emulator
   */
  reset(): void {
    try {
      if (!this.emulator) {
        throw new Error('No emulator instance');
      }

      // Stop the emulator
      this.emulator.stop();
      
      // For a proper reset, we might need to reload the ROM
      // The gameboy emulator doesn't seem to have a built-in reset method
      console.log('Emulator stopped (reset functionality may require ROM reload)');
      this.isRunning = false;
    } catch (error) {
      console.error('Failed to reset emulator:', error);
      throw error;
    }
  }

  /**
   * Save current emulator state (cartridge SRAM)
   */
  saveState(): Uint8Array | null {
    try {
      if (!this.emulator) {
        throw new Error('No emulator instance');
      }

      // Get cartridge save RAM (for games that support saves)
      const saveRam = this.emulator.getCartridgeSaveRam();
      if (saveRam) {
        console.log('Cartridge save data retrieved:', saveRam.byteLength, 'bytes');
        return new Uint8Array(saveRam);
      }
      
      console.log('No save data available');
      return null;
    } catch (error) {
      console.error('Failed to save state:', error);
      throw error;
    }
  }

  /**
   * Load emulator state (cartridge SRAM)
   */
  loadState(stateData: Uint8Array): void {
    try {
      if (!this.emulator) {
        throw new Error('No emulator instance');
      }

      // Convert Uint8Array to ArrayBuffer
      const arrayBuffer = new ArrayBuffer(stateData.length);
      const view = new Uint8Array(arrayBuffer);
      view.set(stateData);

      this.emulator.setCartridgeSaveRam(arrayBuffer);
      console.log('Save data loaded:', stateData.length, 'bytes');
    } catch (error) {
      console.error('Failed to load state:', error);
      throw error;
    }
  }

  /**
   * Check if emulator is currently running
   */
  get running(): boolean {
    return this.isRunning && !this.emulator?.stopped;
  }

  /**
   * Check if emulator is initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get the GameBoy instance for advanced operations
   */
  get gameboy(): Gameboy | null {
    return this.emulator;
  }

  /**
   * Cleanup emulator resources
   */
  dispose(): void {
    try {
      if (this.emulator && this.isRunning) {
        this.emulator.stop();
      }
      
      this.isRunning = false;
      this.isInitialized = false;
      this.context = null;
      this.canvas = null;
      // Note: We don't set emulator to null as it might be needed for cleanup
      
      console.log('Emulator service disposed');
    } catch (error) {
      console.error('Error during emulator disposal:', error);
    }
  }
}
