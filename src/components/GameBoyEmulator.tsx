import React, { useRef, useEffect, useState } from "react";
import { PanelSection, PanelSectionRow } from "@decky/ui";

interface GameBoyEmulatorProps {
  romData?: Uint8Array;
  onError?: (error: string) => void;
}

export const GameBoyEmulator: React.FC<GameBoyEmulatorProps> = ({
  romData,
  onError
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [emulatorInstance, setEmulatorInstance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // TODO: Initialize gameboy emulator instance
    console.log("GameBoy emulator component mounted");
  }, []);

  useEffect(() => {
    if (romData && canvasRef.current) {
      // TODO: Load ROM data into emulator
      console.log("Loading ROM data:", romData.length, "bytes");
    }
  }, [romData]);

  return (
    <PanelSection title="Game Boy Display">
      <PanelSectionRow>
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          padding: "10px",
          backgroundColor: "#2a2a2a",
          borderRadius: "8px"
        }}>
          <canvas
            ref={canvasRef}
            width={160}
            height={144}
            style={{
              border: "2px solid #444",
              imageRendering: "pixelated",
              transform: "scale(2)", // 2x scaling for better visibility
              transformOrigin: "center"
            }}
          />
        </div>
      </PanelSectionRow>
      {isLoading && (
        <PanelSectionRow>
          <div style={{ textAlign: "center", color: "#999" }}>
            Loading ROM...
          </div>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
};
