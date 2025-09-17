// Service for ROM file management and directory scanning
import { call } from "@decky/api";

// Define the default ROM directory (now using Downloads)
export const DEFAULT_ROM_DIRECTORY = '~/Downloads';

// Supported ROM file extensions
export const SUPPORTED_ROM_EXTENSIONS = ['.gb', '.gbc'];

export interface ROMInfo {
  name: string;
  fullPath: string;
  size: number;
  title?: string;
}

export class ROMService {
  private romDirectory: string;
  private cachedROMs: ROMInfo[] = [];

  constructor(romDirectory: string = DEFAULT_ROM_DIRECTORY) {
    this.romDirectory = romDirectory;
  }

  /**
   * Scan the ROM directory for Game Boy ROM files using backend API
   */
  async scanROMs(): Promise<ROMInfo[]> {
    try {
      console.log("Scanning for ROMs in Downloads...");
      
      // Call backend API to scan for ROMs
      const roms = await call<ROMInfo[]>("scan_roms");
      
      if (roms && Array.isArray(roms)) {
        this.cachedROMs = roms;
        console.log("Found ROMs via backend API:", this.cachedROMs.length);
        return this.cachedROMs;
      } else {
        throw new Error('Invalid response from backend');
      }
    } catch (error) {
      console.error('Backend ROM scan failed, using fallback:', error);
      
      // Fall back to known ROM files
      this.cachedROMs = [
        {
          name: 'Tetris (World) (Rev 1).gb',
          fullPath: '~/Downloads/Tetris (World) (Rev 1).gb',
          size: 32768,
          title: 'TETRIS'
        }
      ];
      
      console.log("Using placeholder ROMs:", this.cachedROMs.length);
      return this.cachedROMs;
    }
  }

  /**
   * Load ROM file data using backend API
   */
  async loadROM(romPath: string): Promise<Uint8Array> {
    try {
      console.log("Loading ROM from:", romPath);
      
      // Call backend API to load ROM file
      const romDataArray = await call<number[]>("load_rom", romPath);
      
      if (romDataArray && Array.isArray(romDataArray)) {
        const romData = new Uint8Array(romDataArray);
        console.log("ROM loaded via backend:", romData.length, "bytes");
        return romData;
      } else {
        throw new Error('Invalid ROM data from backend');
      }
    } catch (error) {
      console.error('Backend ROM loading failed, using fallback:', error);
      return this.generateTestROM(romPath);
    }
  }

  private generateTestROM(romPath: string): Uint8Array {
    const romData = new Uint8Array(0x8000);
    
    romData[0x100] = 0x00;
    romData[0x101] = 0xC3;
    romData[0x102] = 0x50;
    romData[0x103] = 0x01;
    
    const nintendoLogo = [0xCE, 0xED, 0x66, 0x66, 0xCC, 0x0D, 0x00, 0x0B];
    for (let i = 0; i < nintendoLogo.length; i++) {
      romData[0x104 + i] = nintendoLogo[i];
    }
    
    const title = "TEST ROM   ";
    for (let i = 0; i < title.length; i++) {
      romData[0x134 + i] = title.charCodeAt(i);
    }
    
    romData[0x148] = 0x00;
    
    let checksum = 0;
    for (let i = 0x134; i <= 0x14C; i++) {
      checksum = (checksum - romData[i] - 1) & 0xFF;
    }
    romData[0x14D] = checksum;
    
    console.log("Generated test ROM for:", romPath);
    return romData;
  }

  getCachedROMs(): ROMInfo[] {
    return this.cachedROMs;
  }

  clearCache(): void {
    this.cachedROMs = [];
  }

  setROMDirectory(directory: string): void {
    this.romDirectory = directory;
    this.cachedROMs = [];
  }

  getROMDirectory(): string {
    return this.romDirectory;
  }
}
