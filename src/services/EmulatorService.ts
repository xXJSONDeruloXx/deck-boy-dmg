// Service for managing Game Boy emulator instance
import { Gameboy } from '@neil-morrison44/gameboy-emulator';

export class EmulatorService {
  private emulator: Gameboy | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private isRunning = false;
  private isInitialized = false;

  constructor() {
    console.log(`[EmulatorService] 🎮 Creating EmulatorService instance...`);
    console.log(`[EmulatorService] Initializing Gameboy emulator with sound enabled`);
    
    // Initialize emulator service
    this.emulator = new Gameboy({ sound: true });
    
    console.log(`[EmulatorService] ✅ EmulatorService constructor completed`);
  }

  /**
   * Initialize the emulator with a canvas element
   */
  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    console.log(`[EmulatorService] 🖼️ Initializing emulator with canvas...`);
    console.log(`[EmulatorService] Canvas dimensions: ${canvas.width}x${canvas.height}`);
    console.log(`[EmulatorService] Canvas context type: 2d`);
    
    try {
      this.canvas = canvas;
      this.context = canvas.getContext('2d');
      
      if (!this.context) {
        console.error(`[EmulatorService] ❌ Failed to get canvas 2D context`);
        throw new Error('Failed to get canvas 2D context');
      }
      
      console.log(`[EmulatorService] ✅ Canvas 2D context obtained`);

      if (!this.emulator) {
        console.log(`[EmulatorService] 🔄 Re-creating Gameboy emulator instance`);
        this.emulator = new Gameboy({ sound: true });
      }

      console.log(`[EmulatorService] 🖥️ Setting up frame rendering callback...`);
      
      // Set up the frame callback to render to canvas
      this.emulator.onFrameFinished((imageData: ImageData) => {
        if (this.context) {
          this.context.putImageData(imageData, 0, 0);
        }
      });

      this.isInitialized = true;
      console.log(`[EmulatorService] ✅ Emulator initialization completed`);
      console.log(`[EmulatorService] Canvas reference stored:`, !!this.canvas);
      console.log(`[EmulatorService] Context reference stored:`, !!this.context);
      console.log(`[EmulatorService] Emulator instance ready:`, !!this.emulator);
    } catch (error) {
      console.error(`[EmulatorService] ❌ Failed to initialize emulator:`, error);
      console.error(`[EmulatorService] Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: typeof error
      });
      throw error;
    }
  }

  /**
   * Load ROM data into the emulator
   */
  async loadROM(romData: Uint8Array, romName: string): Promise<void> {
    console.log(`[EmulatorService] 📂 Loading ROM into emulator...`);
    console.log(`[EmulatorService] ROM name: ${romName}`);
    console.log(`[EmulatorService] ROM data size: ${romData.length} bytes`);
    console.log(`[EmulatorService] ROM data size: ${(romData.length / 1024).toFixed(2)} KB`);
    
    try {
      if (!this.emulator) {
        console.error(`[EmulatorService] ❌ Emulator instance not found`);
        throw new Error('Emulator not created. This should not happen.');
      }
      
      console.log(`[EmulatorService] ✅ Emulator instance available`);

      if (!this.isInitialized) {
        console.error(`[EmulatorService] ❌ Emulator not initialized`);
        throw new Error('Emulator not initialized. Call initialize() first.');
      }
      
      console.log(`[EmulatorService] ✅ Emulator is initialized`);
      console.log(`[EmulatorService] 🔄 Converting Uint8Array to ArrayBuffer...`);

      // Convert Uint8Array to ArrayBuffer as required by the emulator
      const arrayBuffer = new ArrayBuffer(romData.length);
      const view = new Uint8Array(arrayBuffer);
      view.set(romData);
      
      console.log(`[EmulatorService] ArrayBuffer created: ${arrayBuffer.byteLength} bytes`);
      console.log(`[EmulatorService] First 16 bytes:`, Array.from(new Uint8Array(arrayBuffer.slice(0, 16))).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));

      console.log(`[EmulatorService] 🎮 Loading ROM into Game Boy emulator...`);
      
      // Load the ROM into the emulator
      this.emulator.loadGame(arrayBuffer);
      
      console.log(`[EmulatorService] ✅ ROM loaded into emulator successfully`);
      
      // Enable audio (if supported by browser environment)
      console.log(`[EmulatorService] 🔊 Attempting to enable audio...`);
      try {
        this.emulator.apu?.enableSound();
        console.log(`[EmulatorService] ✅ Audio enabled successfully`);
      } catch (audioError) {
        console.warn(`[EmulatorService] ⚠️ Failed to enable audio (continuing without audio):`, audioError);
        // Continue without audio if it fails
      }

      this.isRunning = false;
      console.log(`[EmulatorService] 🎉 ROM loading completed successfully!`);
      console.log(`[EmulatorService] ROM: ${romName}`);
      console.log(`[EmulatorService] Size: ${romData.length} bytes`);
      console.log(`[EmulatorService] Emulator ready to run: ${this.isInitialized}`);
    } catch (error) {
      console.error('Failed to load ROM:', error);
      throw error;
    }
  }

  /**
   * Start emulator execution
   */
  play(): void {
    console.log(`[EmulatorService] 🚀 Starting play() method...`);
    
    try {
      console.log(`[EmulatorService] Pre-flight checks:`);
      console.log(`[EmulatorService]   - Emulator instance exists: ${!!this.emulator}`);
      console.log(`[EmulatorService]   - Is initialized: ${this.isInitialized}`);
      console.log(`[EmulatorService]   - Is running: ${this.isRunning}`);
      
      if (!this.emulator) {
        console.error(`[EmulatorService] ❌ No emulator instance available`);
        throw new Error('No emulator instance');
      }

      if (!this.isInitialized) {
        console.error(`[EmulatorService] ❌ Emulator not initialized`);
        throw new Error('Emulator not initialized');
      }
      
      console.log(`[EmulatorService] Calling emulator.run()...`);
      this.emulator.run();
      this.isRunning = true;
      console.log(`[EmulatorService] ✅ Emulator started successfully!`);
      console.log(`[EmulatorService] Current state: isRunning = ${this.isRunning}`);
    } catch (error) {
      console.error(`[EmulatorService] ❌ Failed to start emulator:`, error);
      throw error;
    }
  }

  /**
   * Pause emulator execution
   */
  pause(): void {
    console.log(`[EmulatorService] ⏸️  Starting pause() method...`);
    
    try {
      console.log(`[EmulatorService] Pre-pause checks:`);
      console.log(`[EmulatorService]   - Emulator instance exists: ${!!this.emulator}`);
      console.log(`[EmulatorService]   - Is running: ${this.isRunning}`);
      
      if (!this.emulator) {
        console.error(`[EmulatorService] ❌ No emulator instance available`);
        throw new Error('No emulator instance');
      }

      console.log(`[EmulatorService] Calling emulator.stop()...`);
      this.emulator.stop();
      this.isRunning = false;
      console.log(`[EmulatorService] ✅ Emulator paused successfully!`);
      console.log(`[EmulatorService] Current state: isRunning = ${this.isRunning}`);
    } catch (error) {
      console.error(`[EmulatorService] ❌ Failed to pause emulator:`, error);
      throw error;
    }
  }

  /**
   * Reset the emulator
   */
  reset(): void {
    console.log(`[EmulatorService] 🔄 Starting reset() method...`);
    
    try {
      console.log(`[EmulatorService] Pre-reset checks:`);
      console.log(`[EmulatorService]   - Emulator instance exists: ${!!this.emulator}`);
      console.log(`[EmulatorService]   - Is running: ${this.isRunning}`);
      console.log(`[EmulatorService]   - Is initialized: ${this.isInitialized}`);
      
      if (!this.emulator) {
        console.error(`[EmulatorService] ❌ No emulator instance available`);
        throw new Error('No emulator instance');
      }

      console.log(`[EmulatorService] Stopping emulator for reset...`);
      // Stop the emulator
      this.emulator.stop();
      
      // For a proper reset, we might need to reload the ROM
      // The gameboy emulator doesn't seem to have a built-in reset method
      console.log(`[EmulatorService] ⚠️  Reset functionality may require ROM reload`);
      console.log(`[EmulatorService] Emulator library may not have built-in reset method`);
      console.log(`[EmulatorService] Consider implementing ROM reload for full reset`);
      this.isRunning = false;
      console.log(`[EmulatorService] ✅ Reset completed (emulator stopped)`);
      console.log(`[EmulatorService] Current state: isRunning = ${this.isRunning}`);
    } catch (error) {
      console.error(`[EmulatorService] ❌ Failed to reset emulator:`, error);
      throw error;
    }
  }

  /**
   * Save current emulator state (cartridge SRAM)
   */
  saveState(): Uint8Array | null {
    console.log(`[EmulatorService] 💾 Starting saveState() method...`);
    
    try {
      console.log(`[EmulatorService] Pre-save checks:`);
      console.log(`[EmulatorService]   - Emulator instance exists: ${!!this.emulator}`);
      console.log(`[EmulatorService]   - Is initialized: ${this.isInitialized}`);
      
      if (!this.emulator) {
        console.error(`[EmulatorService] ❌ No emulator instance available`);
        throw new Error('No emulator instance');
      }

      console.log(`[EmulatorService] Attempting to get cartridge save RAM...`);
      // Get cartridge save RAM (for games that support saves)
      const saveRam = this.emulator.getCartridgeSaveRam();
      
      if (saveRam) {
        console.log(`[EmulatorService] ✅ Cartridge save data retrieved successfully!`);
        console.log(`[EmulatorService] Save data size: ${saveRam.byteLength} bytes`);
        const uint8Array = new Uint8Array(saveRam);
        console.log(`[EmulatorService] Converted to Uint8Array: ${uint8Array.length} bytes`);
        return uint8Array;
      }
      
      console.log(`[EmulatorService] ⚠️  No save data available from cartridge`);
      console.log(`[EmulatorService] This ROM may not support save functionality`);
      return null;
    } catch (error) {
      console.error(`[EmulatorService] ❌ Failed to save state:`, error);
      throw error;
    }
  }

  /**
   * Load emulator state (cartridge SRAM)
   */
  loadState(stateData: Uint8Array): void {
    console.log(`[EmulatorService] 📂 Starting loadState() method...`);
    console.log(`[EmulatorService] State data size: ${stateData.length} bytes`);
    
    try {
      console.log(`[EmulatorService] Pre-load checks:`);
      console.log(`[EmulatorService]   - Emulator instance exists: ${!!this.emulator}`);
      console.log(`[EmulatorService]   - Is initialized: ${this.isInitialized}`);
      console.log(`[EmulatorService]   - State data valid: ${stateData instanceof Uint8Array}`);
      
      if (!this.emulator) {
        console.error(`[EmulatorService] ❌ No emulator instance available`);
        throw new Error('No emulator instance');
      }

      console.log(`[EmulatorService] Converting Uint8Array to ArrayBuffer...`);
      // Convert Uint8Array to ArrayBuffer
      const arrayBuffer = new ArrayBuffer(stateData.length);
      const view = new Uint8Array(arrayBuffer);
      view.set(stateData);
      console.log(`[EmulatorService] ArrayBuffer created: ${arrayBuffer.byteLength} bytes`);

      console.log(`[EmulatorService] Setting cartridge save RAM...`);
      this.emulator.setCartridgeSaveRam(arrayBuffer);
      console.log(`[EmulatorService] ✅ Save data loaded successfully!`);
      console.log(`[EmulatorService] Loaded ${stateData.length} bytes of save data`);
    } catch (error) {
      console.error(`[EmulatorService] ❌ Failed to load state:`, error);
      throw error;
    }
  }

  /**
   * Check if emulator is currently running
   */
  get running(): boolean {
    const isRunning = this.isRunning && !this.emulator?.stopped;
    console.log(`[EmulatorService] 🔍 Checking running state: ${isRunning} (isRunning: ${this.isRunning}, emulator.stopped: ${this.emulator?.stopped})`);
    return isRunning;
  }

  /**
   * Check if emulator is initialized
   */
  get initialized(): boolean {
    console.log(`[EmulatorService] 🔍 Checking initialized state: ${this.isInitialized}`);
    return this.isInitialized;
  }

  /**
   * Get the GameBoy instance for advanced operations
   */
  get gameboy(): Gameboy | null {
    console.log(`[EmulatorService] 🔍 Getting gameboy instance: ${!!this.emulator}`);
    return this.emulator;
  }

  /**
   * Cleanup emulator resources
   */
  dispose(): void {
    console.log(`[EmulatorService] 🧹 Starting dispose() method...`);
    
    try {
      console.log(`[EmulatorService] Pre-disposal state:`);
      console.log(`[EmulatorService]   - Emulator exists: ${!!this.emulator}`);
      console.log(`[EmulatorService]   - Is running: ${this.isRunning}`);
      console.log(`[EmulatorService]   - Is initialized: ${this.isInitialized}`);
      console.log(`[EmulatorService]   - Canvas exists: ${!!this.canvas}`);
      console.log(`[EmulatorService]   - Context exists: ${!!this.context}`);
      
      if (this.emulator && this.isRunning) {
        console.log(`[EmulatorService] Stopping running emulator...`);
        this.emulator.stop();
        console.log(`[EmulatorService] Emulator stopped`);
      }
      
      console.log(`[EmulatorService] Cleaning up state variables...`);
      this.isRunning = false;
      this.isInitialized = false;
      this.context = null;
      this.canvas = null;
      // Note: We don't set emulator to null as it might be needed for cleanup
      
      console.log(`[EmulatorService] ✅ Emulator service disposed successfully!`);
      console.log(`[EmulatorService] Final state:`);
      console.log(`[EmulatorService]   - Is running: ${this.isRunning}`);
      console.log(`[EmulatorService]   - Is initialized: ${this.isInitialized}`);
      console.log(`[EmulatorService]   - Canvas: ${this.canvas}`);
      console.log(`[EmulatorService]   - Context: ${this.context}`);
    } catch (error) {
      console.error(`[EmulatorService] ❌ Error during emulator disposal:`, error);
    }
  }
}
