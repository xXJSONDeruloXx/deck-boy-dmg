import {
  PanelSection,
  PanelSectionRow,
  staticClasses
} from "@decky/ui";
import {
  definePlugin,
  toaster
} from "@decky/api"
import { useState, useEffect } from "react";
import { FaGamepad } from "react-icons/fa";

// Import our components
import { GameBoyEmulator } from "./components/GameBoyEmulator";
import { ROMSelector } from "./components/ROMSelector";
import { EmulatorControls } from "./components/EmulatorControls";

// Import services
import { EmulatorService } from "./services/EmulatorService";

// Import types
import { EmulatorState } from "./types/emulator";

function Content() {
  const [emulatorState, setEmulatorState] = useState<EmulatorState>({
    isPlaying: false,
    isLoaded: false
  });
  const [currentROMData, setCurrentROMData] = useState<Uint8Array | undefined>();
  const [currentROMName, setCurrentROMName] = useState<string | undefined>();
  const [emulatorService] = useState(() => new EmulatorService());

  useEffect(() => {
    // Initialize plugin
    console.log("Deck Boy DMG plugin initializing...");
    
    // Test emulator service
    try {
      console.log("Emulator service created successfully");
      toaster.toast({
        title: "Deck Boy DMG",
        body: "Plugin loaded successfully!"
      });
    } catch (error) {
      console.error("Failed to initialize emulator:", error);
      setEmulatorState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Initialization failed"
      }));
    }
    
    return () => {
      // Cleanup
      emulatorService.dispose();
    };
  }, [emulatorService]);

  const handleROMSelected = async (romData: Uint8Array, romName: string) => {
    try {
      setCurrentROMData(romData);
      setCurrentROMName(romName);
      setEmulatorState(prev => ({
        ...prev,
        currentROM: romName,
        isLoaded: false, // Will be set to true when ROM is actually loaded
        error: undefined
      }));
      
      toaster.toast({
        title: "ROM Selected",
        body: `${romName} selected for loading`
      });
    } catch (error) {
      console.error("Failed to select ROM:", error);
      setEmulatorState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to select ROM"
      }));
    }
  };

  const handleROMLoaded = () => {
    setEmulatorState(prev => ({
      ...prev,
      isLoaded: true
    }));
    
    toaster.toast({
      title: "ROM Loaded",
      body: `${currentROMName} loaded successfully`
    });
  };

  const handlePlayPause = () => {
    try {
      if (!emulatorService.initialized) {
        throw new Error("Emulator not initialized");
      }

      if (!emulatorState.isLoaded) {
        throw new Error("No ROM loaded");
      }

      if (emulatorService.running) {
        emulatorService.pause();
        setEmulatorState(prev => ({ ...prev, isPlaying: false }));
        toaster.toast({ title: "Emulator", body: "Paused" });
      } else {
        emulatorService.play();
        setEmulatorState(prev => ({ ...prev, isPlaying: true }));
        toaster.toast({ title: "Emulator", body: "Playing" });
      }
    } catch (error) {
      console.error("Failed to toggle play state:", error);
      setEmulatorState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to toggle playback"
      }));
    }
  };

  const handleReset = () => {
    try {
      emulatorService.reset();
      setEmulatorState(prev => ({ ...prev, isPlaying: false }));
      toaster.toast({ title: "Emulator", body: "Reset" });
    } catch (error) {
      console.error("Failed to reset emulator:", error);
    }
  };

  const handleSaveState = () => {
    try {
      const saveData = emulatorService.saveState();
      if (saveData) {
        toaster.toast({ title: "Save State", body: "State saved successfully" });
      }
    } catch (error) {
      console.error("Failed to save state:", error);
      toaster.toast({ title: "Save State", body: "Failed to save state" });
    }
  };

  const handleLoadState = () => {
    try {
      // TODO: Implement state loading UI
      toaster.toast({ title: "Load State", body: "Feature coming soon" });
    } catch (error) {
      console.error("Failed to load state:", error);
      toaster.toast({ title: "Load State", body: "Failed to load state" });
    }
  };

  const handleEmulatorError = (error: string) => {
    setEmulatorState(prev => ({ ...prev, error }));
    toaster.toast({ title: "Emulator Error", body: error });
  };

  return (
    <>
      <PanelSection title="Status">
        <PanelSectionRow>
          <div style={{ 
            padding: "8px", 
            backgroundColor: emulatorState.error ? "#ff6b6b22" : "#51cf6622",
            borderRadius: "4px",
            border: `1px solid ${emulatorState.error ? "#ff6b6b" : "#51cf66"}`
          }}>
            {emulatorState.error ? (
              <span style={{ color: "#ff6b6b" }}>❌ {emulatorState.error}</span>
            ) : emulatorState.isLoaded ? (
              <span style={{ color: "#51cf66" }}>
                ✅ ROM: {emulatorState.currentROM} | 
                {emulatorState.isPlaying ? " ▶️ Playing" : " ⏸️ Paused"}
              </span>
            ) : (
              <span style={{ color: "#ffd93d" }}>⚠️ No ROM loaded</span>
            )}
          </div>
        </PanelSectionRow>
      </PanelSection>

      <ROMSelector
        onROMSelected={handleROMSelected}
        onError={handleEmulatorError}
      />

      <GameBoyEmulator
        romData={currentROMData}
        romName={currentROMName}
        emulatorService={emulatorService}
        onError={handleEmulatorError}
        onROMLoaded={handleROMLoaded}
      />

      <EmulatorControls
        isPlaying={emulatorState.isPlaying}
        onPlayPause={handlePlayPause}
        onReset={handleReset}
        onSaveState={handleSaveState}
        onLoadState={handleLoadState}
      />
    </>
  );
};

export default definePlugin(() => {
  console.log("Deck Boy DMG plugin initializing, this is called once on frontend startup")

  return {
    // The name shown in various decky menus
    name: "Deck Boy DMG",
    // The element displayed at the top of your plugin's menu
    titleView: <div className={staticClasses.Title}>Deck Boy DMG</div>,
    // The content of your plugin's menu
    content: <Content />,
    // The icon displayed in the plugin list
    icon: <FaGamepad />,
    // The function triggered when your plugin unloads
    onDismount() {
      console.log("Deck Boy DMG plugin unloading")
    },
  };
});
