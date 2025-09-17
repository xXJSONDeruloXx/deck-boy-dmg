import React, { useState, useEffect } from "react";
import { 
  PanelSection, 
  PanelSectionRow, 
  Dropdown,
  SingleDropdownOption 
} from "@decky/ui";

interface ROMSelectorProps {
  onROMSelected: (romData: Uint8Array, romName: string) => void;
  onError?: (error: string) => void;
}

export const ROMSelector: React.FC<ROMSelectorProps> = ({
  onROMSelected,
  onError
}) => {
  const [romList, setRomList] = useState<string[]>([]);
  const [selectedROM, setSelectedROM] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // TODO: Scan ROM directory for available ROMs
    loadROMList();
  }, []);

  const loadROMList = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement ROM directory scanning
      // Placeholder ROM list for now
      setRomList(["tetris.gb", "pokemon-red.gb", "mario.gb"]);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Failed to load ROM list");
    } finally {
      setIsLoading(false);
    }
  };

  const handleROMSelection = async (option: SingleDropdownOption) => {
    const romName = option.data as string;
    setSelectedROM(romName);
    
    try {
      // TODO: Load actual ROM file data
      // Placeholder for now
      const placeholderData = new Uint8Array([0x31, 0xFE, 0xFF]); // Placeholder ROM header
      onROMSelected(placeholderData, romName);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Failed to load ROM");
    }
  };

  const romOptions = romList.map(romName => ({
    data: romName,
    label: romName.replace('.gb', '').replace('.gbc', '').toUpperCase()
  }));

  return (
    <PanelSection title="ROM Selection">
      <PanelSectionRow>
        {isLoading ? (
          <div style={{ textAlign: "center", color: "#999" }}>
            Scanning for ROMs...
          </div>
        ) : romOptions.length > 0 ? (
          <Dropdown
            rgOptions={romOptions}
            selectedOption={romOptions.find(opt => opt.data === selectedROM) || romOptions[0]}
            onChange={handleROMSelection}
          />
        ) : (
          <div style={{ color: "#ff6b6b", textAlign: "center" }}>
            No ROMs found. Place .gb files in ~/GameBoyROMs/
          </div>
        )}
      </PanelSectionRow>
    </PanelSection>
  );
};
