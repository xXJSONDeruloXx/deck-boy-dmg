import React from "react";
import { 
  PanelSection, 
  PanelSectionRow, 
  ButtonItem 
} from "@decky/ui";

interface EmulatorControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onSaveState: () => void;
  onLoadState: () => void;
}

export const EmulatorControls: React.FC<EmulatorControlsProps> = ({
  isPlaying,
  onPlayPause,
  onReset,
  onSaveState,
  onLoadState
}) => {
  return (
    <PanelSection title="Emulator Controls">
      <PanelSectionRow>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <ButtonItem
            layout="below"
            onClick={onPlayPause}
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </ButtonItem>
          <ButtonItem
            layout="below"
            onClick={onReset}
          >
            🔄 Reset
          </ButtonItem>
        </div>
      </PanelSectionRow>
      <PanelSectionRow>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <ButtonItem
            layout="below"
            onClick={onSaveState}
          >
            💾 Save State
          </ButtonItem>
          <ButtonItem
            layout="below"
            onClick={onLoadState}
          >
            📁 Load State
          </ButtonItem>
        </div>
      </PanelSectionRow>
    </PanelSection>
  );
};
