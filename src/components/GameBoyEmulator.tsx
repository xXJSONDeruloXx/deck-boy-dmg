import React, { useRef, useEffect, useState } from "react";
import { PanelSection, PanelSectionRow } from "@decky/ui";
import { EmulatorService } from "../services/EmulatorService";

interface GameBoyEmulatorProps {
  romData?: Uint8Array;
  romName?: string;
  emulatorService?: EmulatorService;
  onError?: (error: string) => void;
  onROMLoaded?: () => void;
}

export const GameBoyEmulator: React.FC<GameBoyEmulatorProps> = ({
  romData,
  romName,
  emulatorService,
  onError,
  onROMLoaded
}) => {
  console.log(`[GameBoyEmulator] 🖥️  Component rendering...`);
  console.log(`[GameBoyEmulator] Props: romData=${!!romData} (${romData?.length} bytes), romName=${romName}, emulatorService=${!!emulatorService}`);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [canvasInitialized, setCanvasInitialized] = useState(false);

  // Initialize emulator service with canvas when canvas is ready
  useEffect(() => {
    console.log(`[GameBoyEmulator] 🎨 Canvas initialization useEffect triggered...`);
    console.log(`[GameBoyEmulator] Canvas exists: ${!!canvasRef.current}`);
    console.log(`[GameBoyEmulator] EmulatorService exists: ${!!emulatorService}`);
    console.log(`[GameBoyEmulator] Canvas initialized: ${canvasInitialized}`);
    
    if (canvasRef.current && emulatorService && !canvasInitialized) {
      console.log(`[GameBoyEmulator] Initializing emulator with canvas...`);
      
      const initializeEmulator = async () => {
        try {
          console.log(`[GameBoyEmulator] Calling emulatorService.initialize()...`);
          await emulatorService.initialize(canvasRef.current!);
          console.log(`[GameBoyEmulator] Setting canvas initialized to true...`);
          setCanvasInitialized(true);
          console.log(`[GameBoyEmulator] ✅ GameBoy emulator canvas initialized successfully`);
        } catch (error) {
          console.error(`[GameBoyEmulator] ❌ Failed to initialize emulator canvas:`, error);
          onError?.(error instanceof Error ? error.message : "Failed to initialize emulator");
        }
      };

      initializeEmulator();
    } else {
      console.log(`[GameBoyEmulator] Skipping canvas initialization - conditions not met`);
    }
  }, [canvasRef.current, emulatorService, canvasInitialized, onError]);

  // Load ROM when ROM data is available and emulator is initialized
  useEffect(() => {
    console.log(`[GameBoyEmulator] 📦 ROM loading useEffect triggered...`);
    console.log(`[GameBoyEmulator] ROM data exists: ${!!romData} (${romData?.length} bytes)`);
    console.log(`[GameBoyEmulator] ROM name: ${romName}`);
    console.log(`[GameBoyEmulator] EmulatorService exists: ${!!emulatorService}`);
    console.log(`[GameBoyEmulator] Canvas initialized: ${canvasInitialized}`);
    
    if (romData && romName && emulatorService && canvasInitialized) {
      console.log(`[GameBoyEmulator] All conditions met - loading ROM...`);
      
      const loadROM = async () => {
        console.log(`[GameBoyEmulator] Setting loading state to true...`);
        setIsLoading(true);
        try {
          console.log(`[GameBoyEmulator] Calling emulatorService.loadROM()...`);
          await emulatorService.loadROM(romData, romName);
          console.log(`[GameBoyEmulator] ✅ ROM loaded successfully: ${romName}`);
          console.log(`[GameBoyEmulator] Calling onROMLoaded callback...`);
          onROMLoaded?.();
        } catch (error) {
          console.error(`[GameBoyEmulator] ❌ Failed to load ROM:`, error);
          onError?.(error instanceof Error ? error.message : "Failed to load ROM");
        } finally {
          console.log(`[GameBoyEmulator] Setting loading state to false...`);
          setIsLoading(false);
          console.log(`[GameBoyEmulator] ROM loading process completed`);
        }
      };

      loadROM();
    } else {
      console.log(`[GameBoyEmulator] Skipping ROM loading - conditions not met`);
    }
  }, [romData, romName, emulatorService, canvasInitialized, onError, onROMLoaded]);

  return (
    <PanelSection title="Game Boy Display">
      <PanelSectionRow>
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          padding: "16px",
          backgroundColor: "#1a1a1a",
          borderRadius: "8px",
          border: "2px solid #333"
        }}>
          <div style={{ position: "relative" }}>
            <canvas
              ref={canvasRef}
              width={160}
              height={144}
              style={{
                border: "2px solid #666",
                imageRendering: "pixelated",
                transform: "scale(2.5)", // Scale for better visibility on Steam Deck
                transformOrigin: "center",
                backgroundColor: "#8BAC0F" // Game Boy green background
              }}
            />
            {isLoading && (
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) scale(0.4)",
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                color: "white",
                padding: "8px 12px",
                borderRadius: "4px",
                fontSize: "12px",
                whiteSpace: "nowrap"
              }}>
                Loading ROM...
              </div>
            )}
          </div>
        </div>
      </PanelSectionRow>
      
      {!canvasInitialized && (
        <PanelSectionRow>
          <div style={{ textAlign: "center", color: "#999", fontSize: "12px" }}>
            Initializing emulator...
          </div>
        </PanelSectionRow>
      )}
      
      {canvasInitialized && !romData && (
        <PanelSectionRow>
          <div style={{ textAlign: "center", color: "#999", fontSize: "12px" }}>
            Select a ROM to start playing
          </div>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
};
