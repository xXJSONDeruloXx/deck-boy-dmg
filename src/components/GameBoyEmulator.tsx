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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [canvasInitialized, setCanvasInitialized] = useState(false);

  // Initialize emulator service with canvas when canvas is ready
  useEffect(() => {
    if (canvasRef.current && emulatorService && !canvasInitialized) {
      const initializeEmulator = async () => {
        try {
          await emulatorService.initialize(canvasRef.current!);
          setCanvasInitialized(true);
          console.log("GameBoy emulator canvas initialized");
        } catch (error) {
          console.error("Failed to initialize emulator canvas:", error);
          onError?.(error instanceof Error ? error.message : "Failed to initialize emulator");
        }
      };

      initializeEmulator();
    }
  }, [canvasRef.current, emulatorService, canvasInitialized, onError]);

  // Load ROM when ROM data is available and emulator is initialized
  useEffect(() => {
    if (romData && romName && emulatorService && canvasInitialized) {
      const loadROM = async () => {
        setIsLoading(true);
        try {
          await emulatorService.loadROM(romData, romName);
          console.log(`ROM loaded: ${romName}`);
          onROMLoaded?.();
        } catch (error) {
          console.error("Failed to load ROM:", error);
          onError?.(error instanceof Error ? error.message : "Failed to load ROM");
        } finally {
          setIsLoading(false);
        }
      };

      loadROM();
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
