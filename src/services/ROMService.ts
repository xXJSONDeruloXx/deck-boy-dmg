// Service for ROM file management and directory scanning

// Define the default ROM directory
export const DEFAULT_ROM_DIRECTORY = '/home/deck/GameBoyROMs';

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
   * Scan the ROM directory for Game Boy ROM files
   */
  async scanROMs(): Promise<ROMInfo[]> {
    try {
      // TODO: Implement actual directory scanning
      // For now, return placeholder ROMs for testing
      this.cachedROMs = [
        {
          name: 'tetris.gb',
          fullPath: `${this.romDirectory}/tetris.gb`,
          size: 32768,
          title: 'TETRIS'
        },
        {
          name: 'pokemon-red.gb',
          fullPath: `${this.romDirectory}/pokemon-red.gb`,
          size: 1048576,
          title: 'POKEMON RED'
        },
        {
          name: 'mario.gb',
          fullPath: `${this.romDirectory}/mario.gb`,
          size: 131072,
          title: 'MARIO'
        }
      ];

      console.log(`Found ${this.cachedROMs.length} ROM files in ${this.romDirectory}`);
      return this.cachedROMs;
    } catch (error) {
      console.error('Failed to scan ROM directory:', error);
      throw new Error(`Failed to scan ROM directory: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Load ROM file data
   */
  async loadROM(romPath: string): Promise<Uint8Array> {
    try {
      // TODO: Implement actual file loading
      // For now, return minimal Game Boy ROM header for testing
      console.log(`Loading ROM from: ${romPath}`);
      
      // Create a minimal valid Game Boy ROM header
      const romData = new Uint8Array(0x8000); // 32KB minimum
      
      // Game Boy ROM header structure (starts at 0x100)
      romData[0x100] = 0x00; // NOP
      romData[0x101] = 0xC3; // JP nn
      romData[0x102] = 0x50; // Jump to 0x0150
      romData[0x103] = 0x01;
      
      // Nintendo logo (simplified)
      const nintendoLogo = [
        0xCE, 0xED, 0x66, 0x66, 0xCC, 0x0D, 0x00, 0x0B,
        0x03, 0x73, 0x00, 0x83, 0x00, 0x0C, 0x00, 0x0D,
        // ... (truncated for brevity)
      ];
      
      for (let i = 0; i < Math.min(nintendoLogo.length, 48); i++) {
        romData[0x104 + i] = nintendoLogo[i] || 0;
      }
      
      // Game title (11 characters max)
      const title = "TEST ROM   ";
      for (let i = 0; i < title.length; i++) {
        romData[0x134 + i] = title.charCodeAt(i);
      }
      
      // ROM size (0 = 32KB)
      romData[0x148] = 0x00;
      
      // Calculate header checksum
      let checksum = 0;
      for (let i = 0x134; i <= 0x14C; i++) {
        checksum = (checksum - romData[i] - 1) & 0xFF;
      }
      romData[0x14D] = checksum;
      
      return romData;
    } catch (error) {
      console.error('Failed to load ROM:', error);
      throw new Error(`Failed to load ROM: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Validate if a file is a valid Game Boy ROM
   */
  validateROM(romData: Uint8Array): boolean {
    try {
      // Check minimum ROM size
      if (romData.length < 0x8000) {
        return false;
      }

      // Check for Nintendo logo checksum (simplified validation)
      // In a real implementation, we'd verify the actual Nintendo logo
      const logoEnd = 0x133;
      
      if (romData.length <= logoEnd) {
        return false;
      }

      // Verify header checksum
      let checksum = 0;
      for (let i = 0x134; i <= 0x14C; i++) {
        if (i < romData.length) {
          checksum = (checksum - romData[i] - 1) & 0xFF;
        }
      }

      const expectedChecksum = romData[0x14D] || 0;
      return checksum === expectedChecksum;
    } catch (error) {
      console.error('ROM validation error:', error);
      return false;
    }
  }

  /**
   * Extract ROM metadata from ROM data
   */
  extractROMMetadata(romData: Uint8Array): { title: string; size: number } {
    try {
      // Extract game title (at 0x134-0x143)
      let title = '';
      for (let i = 0x134; i <= 0x142 && i < romData.length; i++) {
        const char = romData[i];
        if (char === 0) break; // Null terminator
        if (char >= 32 && char <= 126) { // Printable ASCII
          title += String.fromCharCode(char);
        }
      }
      title = title.trim() || 'Unknown Game';

      return {
        title,
        size: romData.length
      };
    } catch (error) {
      console.error('Failed to extract ROM metadata:', error);
      return {
        title: 'Unknown Game',
        size: romData.length
      };
    }
  }

  /**
   * Get cached ROM list (avoids rescanning directory)
   */
  getCachedROMs(): ROMInfo[] {
    return [...this.cachedROMs];
  }

  /**
   * Set ROM directory path
   */
  setROMDirectory(directory: string): void {
    this.romDirectory = directory;
    this.cachedROMs = []; // Clear cache when directory changes
  }

  /**
   * Get current ROM directory path
   */
  getROMDirectory(): string {
    return this.romDirectory;
  }
}
