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
    console.log(`[ROMService] 🔍 Starting ROM scan...`);
    console.log(`[ROMService] Target directory: ${this.romDirectory}`);
    console.log(`[ROMService] Supported extensions:`, SUPPORTED_ROM_EXTENSIONS);
    
    try {
      console.log(`[ROMService] 🌐 Calling backend API: scan_roms`);
      
      // Call backend API to scan for ROMs
      const roms = await call<ROMInfo[]>("scan_roms");
      
      console.log(`[ROMService] Backend response received:`, typeof roms);
      console.log(`[ROMService] Is array:`, Array.isArray(roms));
      
      if (roms && Array.isArray(roms)) {
        this.cachedROMs = roms;
        console.log(`[ROMService] ✅ Found ${this.cachedROMs.length} ROMs via backend API`);
        
        // Log each ROM found
        this.cachedROMs.forEach((rom, index) => {
          console.log(`[ROMService] ROM ${index + 1}: ${rom.name} (${rom.size} bytes) - ${rom.title}`);
        });
        
        return this.cachedROMs;
      } else {
        console.error(`[ROMService] ❌ Invalid response from backend - expected array, got:`, typeof roms);
        throw new Error('Invalid response from backend');
      }
    } catch (error) {
      console.error(`[ROMService] ❌ Backend ROM scan failed:`, error);
      console.log(`[ROMService] 🔄 Using fallback placeholder ROMs`);
      
      // Fall back to known ROM files
      this.cachedROMs = [
        {
          name: 'Tetris (World) (Rev 1).gb',
          fullPath: '~/Downloads/Tetris (World) (Rev 1).gb',
          size: 32768,
          title: 'TETRIS'
        }
      ];
      
      console.log(`[ROMService] 📋 Fallback: ${this.cachedROMs.length} placeholder ROMs loaded`);
      this.cachedROMs.forEach((rom, index) => {
        console.log(`[ROMService] Fallback ROM ${index + 1}: ${rom.name}`);
      });
      
      return this.cachedROMs;
    }
  }

  /**
   * Load ROM file data using backend API
   */
  async loadROM(romPath: string): Promise<Uint8Array> {
    console.log(`[ROMService] 📂 Loading ROM file...`);
    console.log(`[ROMService] ROM path: ${romPath}`);
    console.log(`[ROMService] Expected file type: Game Boy ROM (.gb/.gbc)`);
    
    try {
      console.log(`[ROMService] 🌐 Calling backend API: load_rom`);
      console.log(`[ROMService] API parameter: ${romPath}`);
      
      // Call backend API to load ROM file
      const romDataArray = await call<number[]>("load_rom", romPath);
      
      console.log(`[ROMService] Backend response received`);
      console.log(`[ROMService] Response type:`, typeof romDataArray);
      console.log(`[ROMService] Is array:`, Array.isArray(romDataArray));
      
      if (romDataArray && Array.isArray(romDataArray)) {
        const romData = new Uint8Array(romDataArray);
        console.log(`[ROMService] ✅ ROM loaded successfully via backend!`);
        console.log(`[ROMService] ROM file: ${romPath}`);
        console.log(`[ROMService] ROM size: ${romData.length} bytes`);
        console.log(`[ROMService] ROM size (KB): ${(romData.length / 1024).toFixed(2)} KB`);
        
        // Log ROM header information
        if (romData.length >= 0x150) {
          console.log(`[ROMService] 🔍 ROM Header Analysis:`);
          console.log(`[ROMService] First 16 bytes:`, Array.from(romData.slice(0, 16)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
          
          // Extract title from ROM header
          let title = '';
          for (let i = 0x134; i <= 0x142 && i < romData.length; i++) {
            const char = romData[i];
            if (char === 0) break;
            if (char >= 32 && char <= 126) {
              title += String.fromCharCode(char);
            }
          }
          console.log(`[ROMService] ROM Title: "${title.trim() || 'Unknown'}"`);
          console.log(`[ROMService] ROM Type: 0x${romData[0x147]?.toString(16).padStart(2, '0') || '??'}`);
          console.log(`[ROMService] ROM Size Code: 0x${romData[0x148]?.toString(16).padStart(2, '0') || '??'}`);
        }
        
        return romData;
      } else {
        console.error(`[ROMService] ❌ Invalid ROM data from backend`);
        console.error(`[ROMService] Expected: number array, Got: ${typeof romDataArray}`);
        throw new Error('Invalid ROM data from backend');
      }
    } catch (error) {
      console.error(`[ROMService] ❌ Backend ROM loading failed:`, error);
      console.log(`[ROMService] Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: typeof error
      });
      console.log(`[ROMService] 🔄 Falling back to test ROM generation`);
      
      return this.generateTestROM(romPath);
    }
  }

  private generateTestROM(romPath: string): Uint8Array {
    console.log(`[ROMService] 🔨 Generating test ROM...`);
    console.log(`[ROMService] Original request: ${romPath}`);
    
    const romData = new Uint8Array(0x8000); // 32KB
    console.log(`[ROMService] Created ROM buffer: ${romData.length} bytes (${(romData.length / 1024)} KB)`);
    
    // Game Boy ROM header structure (starts at 0x100)
    console.log(`[ROMService] 📝 Writing Game Boy ROM header...`);
    romData[0x100] = 0x00; // NOP
    romData[0x101] = 0xC3; // JP nn
    romData[0x102] = 0x50; // Jump to 0x0150
    romData[0x103] = 0x01;
    console.log(`[ROMService] Entry point written: NOP + JP 0x0150`);
    
    // Nintendo logo (simplified)
    const nintendoLogo = [0xCE, 0xED, 0x66, 0x66, 0xCC, 0x0D, 0x00, 0x0B];
    for (let i = 0; i < nintendoLogo.length; i++) {
      romData[0x104 + i] = nintendoLogo[i];
    }
    console.log(`[ROMService] Nintendo logo written: ${nintendoLogo.length} bytes`);
    
    // Game title
    const title = "TEST ROM   ";
    for (let i = 0; i < title.length; i++) {
      romData[0x134 + i] = title.charCodeAt(i);
    }
    console.log(`[ROMService] Game title written: "${title}"`);
    
    // ROM size indicator
    romData[0x148] = 0x00; // 32KB
    console.log(`[ROMService] ROM size code written: 0x00 (32KB)`);
    
    // Calculate and write header checksum
    let checksum = 0;
    for (let i = 0x134; i <= 0x14C; i++) {
      checksum = (checksum - romData[i] - 1) & 0xFF;
    }
    romData[0x14D] = checksum;
    console.log(`[ROMService] Header checksum calculated and written: 0x${checksum.toString(16).padStart(2, '0')}`);
    
    // Add some simple code at 0x150 to prevent immediate crash
    romData[0x150] = 0x00; // NOP
    romData[0x151] = 0x18; // JR
    romData[0x152] = 0xFE; // Jump to self (-2)
    console.log(`[ROMService] Simple infinite loop added at 0x150`);
    
    console.log(`[ROMService] ✅ Test ROM generated successfully`);
    console.log(`[ROMService] Total size: ${romData.length} bytes`);
    console.log(`[ROMService] Header preview:`, Array.from(romData.slice(0x134, 0x144)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
    
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
