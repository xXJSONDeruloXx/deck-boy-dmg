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
import { ROMService } from "./services/ROMService";

// Import types
import { EmulatorState } from "./types/emulator";

function Content() {
  console.log(`[Plugin] 🚀 Content component initializing...`);
  
  const [emulatorState, setEmulatorState] = useState<EmulatorState>({
    isPlaying: false,
    isLoaded: false
  });
  const [currentROMData, setCurrentROMData] = useState<Uint8Array | undefined>();
  const [currentROMName, setCurrentROMName] = useState<string | undefined>();
  const [emulatorService] = useState(() => {
    console.log(`[Plugin] Creating EmulatorService instance...`);
    const service = new EmulatorService();
    console.log(`[Plugin] EmulatorService created successfully`);
    return service;
  });
  const [romService] = useState(() => {
    console.log(`[Plugin] Creating ROMService instance...`);
    const service = new ROMService();
    console.log(`[Plugin] ROMService created successfully`);
    return service;
  });

  useEffect(() => {
    console.log(`[Plugin] 🎮 useEffect hook triggered - initializing plugin...`);
    console.log(`[Plugin] Plugin state:`);
    console.log(`[Plugin]   - EmulatorService: ${!!emulatorService}`);
    console.log(`[Plugin]   - ROMService: ${!!romService}`);
    console.log(`[Plugin]   - EmulatorState:`, emulatorState);
    
    // Initialize plugin
    console.log(`[Plugin] Deck Boy DMG plugin initializing...`);
    
    // Test emulator service
    try {
      console.log(`[Plugin] Testing emulator service initialization...`);
      console.log(`[Plugin] ✅ Emulator service created successfully`);
      
      console.log(`[Plugin] Showing success toast notification...`);
      toaster.toast({
        title: "Deck Boy DMG",
        body: "Plugin loaded successfully!"
      });
      console.log(`[Plugin] Toast notification sent`);
    } catch (error) {
      console.error(`[Plugin] ❌ Failed to initialize emulator:`, error);
      setEmulatorState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Initialization failed"
      }));
      console.log(`[Plugin] Error state updated`);
    }
    
    return () => {
      console.log(`[Plugin] 🧹 useEffect cleanup - disposing emulator service...`);
      emulatorService.dispose();
      console.log(`[Plugin] Cleanup completed`);
    };
  }, [emulatorService]);

  const handleROMSelected = async (romData: Uint8Array, romName: string) => {
    console.log(`[Plugin] 📦 handleROMSelected called...`);
    console.log(`[Plugin] ROM name: ${romName}`);
    console.log(`[Plugin] ROM data size: ${romData.length} bytes`);
    
    try {
      console.log(`[Plugin] Setting current ROM data and name...`);
      setCurrentROMData(romData);
      setCurrentROMName(romName);
      
      console.log(`[Plugin] Updating emulator state...`);
      setEmulatorState(prev => ({
        ...prev,
        currentROM: romName,
        isLoaded: false, // Will be set to true when ROM is actually loaded
        error: undefined
      }));
      console.log(`[Plugin] Emulator state updated`);
      
      console.log(`[Plugin] Showing ROM selection toast...`);
      toaster.toast({
        title: "ROM Selected",
        body: `${romName} selected for loading`
      });
      console.log(`[Plugin] ✅ ROM selection completed successfully`);
    } catch (error) {
      console.error(`[Plugin] ❌ Failed to select ROM:`, error);
      setEmulatorState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to select ROM"
      }));
      console.log(`[Plugin] Error state updated after ROM selection failure`);
    }
  };

  const handleROMLoaded = () => {
    console.log(`[Plugin] 🎯 handleROMLoaded called - ROM successfully loaded!`);
    console.log(`[Plugin] Current ROM: ${currentROMName}`);
    
    console.log(`[Plugin] Updating emulator state to loaded...`);
    setEmulatorState(prev => ({
      ...prev,
      isLoaded: true
    }));
    console.log(`[Plugin] Emulator state updated to loaded`);
    
    console.log(`[Plugin] Showing ROM loaded toast...`);
    toaster.toast({
      title: "ROM Loaded",
      body: `${currentROMName} loaded successfully`
    });
    console.log(`[Plugin] ✅ ROM loaded notification sent`);
  };

  const handlePlayPause = () => {
    console.log(`[Plugin] ⏯️  handlePlayPause called...`);
    console.log(`[Plugin] Current playing state: ${emulatorState.isPlaying}`);
    console.log(`[Plugin] Emulator loaded: ${emulatorState.isLoaded}`);
    
    try {
      console.log(`[Plugin] Checking emulator state before play/pause...`);
      console.log(`[Plugin]   - Emulator initialized: ${emulatorService.initialized}`);
      console.log(`[Plugin]   - ROM loaded: ${emulatorState.isLoaded}`);
      console.log(`[Plugin]   - Emulator running: ${emulatorService.running}`);
      
      if (!emulatorService.initialized) {
        console.error(`[Plugin] ❌ Emulator not initialized`);
        throw new Error("Emulator not initialized");
      }

      if (!emulatorState.isLoaded) {
        console.error(`[Plugin] ❌ No ROM loaded`);
        throw new Error("No ROM loaded");
      }

      if (emulatorService.running) {
        console.log(`[Plugin] Pausing emulator...`);
        emulatorService.pause();
        console.log(`[Plugin] Updating state to paused...`);
        setEmulatorState(prev => ({ ...prev, isPlaying: false }));
        console.log(`[Plugin] Showing pause toast...`);
        toaster.toast({ title: "Emulator", body: "Paused" });
        console.log(`[Plugin] ✅ Emulator paused successfully`);
      } else {
        console.log(`[Plugin] Starting emulator...`);
        emulatorService.play();
        console.log(`[Plugin] Updating state to playing...`);
        setEmulatorState(prev => ({ ...prev, isPlaying: true }));
        console.log(`[Plugin] Showing play toast...`);
        toaster.toast({ title: "Emulator", body: "Playing" });
        console.log(`[Plugin] ✅ Emulator started successfully`);
      }
    } catch (error) {
      console.error(`[Plugin] ❌ Failed to toggle play state:`, error);
      setEmulatorState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to toggle playback"
      }));
      console.log(`[Plugin] Error state updated after play/pause failure`);
    }
  };

  const handleReset = () => {
    console.log(`[Plugin] 🔄 handleReset called...`);
    console.log(`[Plugin] Current state: playing=${emulatorState.isPlaying}, loaded=${emulatorState.isLoaded}`);
    
    try {
      console.log(`[Plugin] Calling emulator service reset...`);
      emulatorService.reset();
      console.log(`[Plugin] Updating state to stopped...`);
      setEmulatorState(prev => ({ ...prev, isPlaying: false }));
      console.log(`[Plugin] Showing reset toast...`);
      toaster.toast({ title: "Emulator", body: "Reset" });
      console.log(`[Plugin] ✅ Reset completed successfully`);
    } catch (error) {
      console.error(`[Plugin] ❌ Failed to reset emulator:`, error);
      console.log(`[Plugin] Reset failed but continuing...`);
    }
  };

  const handleSaveState = () => {
    console.log(`[Plugin] 💾 handleSaveState called...`);
    
    try {
      console.log(`[Plugin] Calling emulator service saveState...`);
      const saveData = emulatorService.saveState();
      
      if (saveData) {
        console.log(`[Plugin] ✅ Save data retrieved: ${saveData.length} bytes`);
        console.log(`[Plugin] Showing save success toast...`);
        toaster.toast({ title: "Save State", body: "State saved successfully" });
        console.log(`[Plugin] Save state completed successfully`);
      } else {
        console.log(`[Plugin] ⚠️  No save data available from emulator`);
        console.log(`[Plugin] Showing no save data toast...`);
        toaster.toast({ title: "Save State", body: "No save data available" });
      }
    } catch (error) {
      console.error(`[Plugin] ❌ Failed to save state:`, error);
      console.log(`[Plugin] Showing save failure toast...`);
      toaster.toast({ title: "Save State", body: "Failed to save state" });
    }
  };

  const handleLoadState = () => {
    console.log(`[Plugin] 📂 handleLoadState called...`);
    
    try {
      console.log(`[Plugin] Load state feature not yet implemented`);
      // TODO: Implement state loading UI
      console.log(`[Plugin] Showing coming soon toast...`);
      toaster.toast({ title: "Load State", body: "Feature coming soon" });
      console.log(`[Plugin] Load state placeholder completed`);
    } catch (error) {
      console.error(`[Plugin] ❌ Failed to load state:`, error);
      console.log(`[Plugin] Showing load failure toast...`);
      toaster.toast({ title: "Load State", body: "Failed to load state" });
    }
  };

  const handleEmulatorError = (error: string) => {
    console.log(`[Plugin] 🚨 handleEmulatorError called...`);
    console.log(`[Plugin] Error message: ${error}`);
    
    console.log(`[Plugin] Updating emulator state with error...`);
    setEmulatorState(prev => ({ ...prev, error }));
    console.log(`[Plugin] Showing error toast...`);
    toaster.toast({ title: "Emulator Error", body: error });
    console.log(`[Plugin] Error handling completed`);
  };

  console.log(`[Plugin] 🎨 Rendering Content component...`);
  console.log(`[Plugin] Current state:`, emulatorState);
  console.log(`[Plugin] Current ROM: ${currentROMName}`);
  
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
        romService={romService}
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
  console.log(`[Plugin] 🔌 definePlugin called - Deck Boy DMG plugin initializing...`);
  console.log(`[Plugin] This is called once on frontend startup`);

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
      console.log(`[Plugin] 🔌 onDismount called - Deck Boy DMG plugin unloading...`);
      console.log(`[Plugin] Plugin cleanup completed`);
    },
  };
});
