import React, { useState, useEffect } from "react";
import { 
  PanelSection, 
  PanelSectionRow, 
  Dropdown,
  SingleDropdownOption,
  ButtonItem 
} from "@decky/ui";
import { ROMService, ROMInfo } from "../services/ROMService";

interface ROMSelectorProps {
  onROMSelected: (romData: Uint8Array, romName: string) => void;
  onError?: (error: string) => void;
  romService?: ROMService;
}

export const ROMSelector: React.FC<ROMSelectorProps> = ({
  onROMSelected,
  onError,
  romService
}) => {
  const [romList, setRomList] = useState<ROMInfo[]>([]);
  const [selectedROM, setSelectedROM] = useState<ROMInfo | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingROM, setIsLoadingROM] = useState(false);

  // Create a default ROM service if none provided
  const service = romService || new ROMService();

  useEffect(() => {
    loadROMList();
  }, []);

  const loadROMList = async () => {
    setIsLoading(true);
    try {
      console.log("Loading ROM list from Downloads directory...");
      const roms = await service.scanROMs();
      setRomList(roms);
      
      // Auto-select first ROM if available and none selected
      if (roms.length > 0 && !selectedROM) {
        setSelectedROM(roms[0]);
      }
      
      console.log(`Loaded ${roms.length} ROMs`);
    } catch (error) {
      console.error("Failed to load ROM list:", error);
      onError?.(error instanceof Error ? error.message : "Failed to load ROM list");
    } finally {
      setIsLoading(false);
    }
  };

  const handleROMSelection = async (option: SingleDropdownOption) => {
    const romInfo = option.data as ROMInfo;
    setSelectedROM(romInfo);
    
    setIsLoadingROM(true);
    try {
      console.log(`Loading ROM: ${romInfo.name}`);
      const romData = await service.loadROM(romInfo.fullPath);
      console.log(`ROM loaded: ${romInfo.name} (${romData.length} bytes)`);
      onROMSelected(romData, romInfo.name);
    } catch (error) {
      console.error("Failed to load ROM:", error);
      onError?.(error instanceof Error ? error.message : "Failed to load ROM");
    } finally {
      setIsLoadingROM(false);
    }
  };

  const handleRefresh = async () => {
    console.log("Refreshing ROM list...");
    service.clearCache();
    await loadROMList();
  };

  const romOptions = romList.map(rom => ({
    data: rom,
    label: rom.title || rom.name.replace('.gb', '').replace('.gbc', '').toUpperCase()
  }));

  return (
    <PanelSection title="ROM Selection">
      <PanelSectionRow>
        {isLoading ? (
          <div style={{ textAlign: "center", color: "#999" }}>
            Scanning ~/Downloads for ROMs...
          </div>
        ) : romOptions.length > 0 ? (
          <>
            <Dropdown
              rgOptions={romOptions}
              selectedOption={romOptions.find(opt => opt.data === selectedROM) || romOptions[0]}
              onChange={handleROMSelection}
              disabled={isLoadingROM}
            />
            {isLoadingROM && (
              <div style={{ 
                textAlign: "center", 
                color: "#999", 
                fontSize: "12px", 
                marginTop: "8px" 
              }}>
                Loading ROM...
              </div>
            )}
          </>
        ) : (
          <div style={{ color: "#ff6b6b", textAlign: "center", fontSize: "14px" }}>
            No ROMs found. Place .gb or .gbc files in ~/Downloads
          </div>
        )}
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem 
          layout="below" 
          onClick={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? "Scanning..." : "Refresh ROM List"}
        </ButtonItem>
      </PanelSectionRow>
      {selectedROM && (
        <PanelSectionRow>
          <div style={{ fontSize: "12px", color: "#ccc" }}>
            <div><strong>File:</strong> {selectedROM.name}</div>
            <div><strong>Size:</strong> {(selectedROM.size / 1024).toFixed(1)} KB</div>
            {selectedROM.title && <div><strong>Title:</strong> {selectedROM.title}</div>}
          </div>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
};
