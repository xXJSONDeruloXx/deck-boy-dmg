import {
  PanelSection,
  PanelSectionRow,
  staticClasses
} from "@decky/ui";
import {
  definePlugin,
  toaster,
  callable
} from "@decky/api";
import { useState, useEffect, useRef } from "react";
import { FaGamepad } from "react-icons/fa";
import { WasmBoy } from "wasmboy";

// Status type for the emulator
type EmulatorStatus = "loading" | "running" | "error";

// WasmBoy key constants (defined as numbers matching WasmBoy's internal values)
type JoypadKey = "UP" | "DOWN" | "LEFT" | "RIGHT" | "A" | "B" | "START" | "SELECT";

const GAMEPAD_KEYS: Record<string, JoypadKey> = {
  ArrowUp: "UP",
  ArrowDown: "DOWN",
  ArrowLeft: "LEFT",
  ArrowRight: "RIGHT",
  z: "A",
  x: "B",
  Enter: "START",
  Shift: "SELECT"
};

function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const getRom = callable<[], { rom?: string; error?: string }>("get_rom");

function GameBoyEmulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<EmulatorStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const keyListenersRef = useRef<{
    handleKeyDown: (e: KeyboardEvent) => void;
    handleKeyUp: (e: KeyboardEvent) => void;
  } | null>(null);

  const controllerStateRef = useRef<Record<JoypadKey, boolean>>({
    UP: false,
    DOWN: false,
    LEFT: false,
    RIGHT: false,
    A: false,
    B: false,
    START: false,
    SELECT: false
  });

  const updateJoypadState = (eventKey: string, pressed: boolean) => {
    const normalizedKey = eventKey.length === 1 ? eventKey.toLowerCase() : eventKey;
    const joypadKey = GAMEPAD_KEYS[normalizedKey];
    if (!joypadKey) {
      return false;
    }

    controllerStateRef.current[joypadKey] = pressed;

    // WasmBoy expects the full controller state object rather than individual key codes.
    WasmBoy.setJoypadState({ ...controllerStateRef.current });
    return true;
  };

  useEffect(() => {
    let mounted = true;

    const initEmulator = async () => {
      try {
        if (!canvasRef.current) {
          throw new Error("Canvas element not found");
        }

        setStatus("loading");

        // Initialize WasmBoy with the canvas
        await WasmBoy.config({
          headless: false,
          isGBC: false,
          gameboySpeed: 1,
          frameSkip: 0,
          audioBatchProcessing: true,
          audioAccumulateSamples: true,
          timersBatchProcessing: false,
          graphicsBatchProcessing: false,
          disableSmoothScaling: false,
          updateGraphicsCallback: false,
          updateAudioCallback: false,
          saveStateCallback: false,
        }, canvasRef.current);

        const response = await getRom();
        const romBase64 = response?.rom;
        if (!romBase64) {
          throw new Error(response?.error ?? "ROM data missing");
        }

  const romBuffer = base64ToUint8Array(romBase64);
        
        if (!mounted) return;

        // Load and play the ROM
        await WasmBoy.loadROM(romBuffer);
        await WasmBoy.play();

        if (mounted) {
          setStatus("running");
          toaster.toast({
            title: "Deck Boy DMG",
            body: "Tetris loaded successfully!"
          });
        }
      } catch (error) {
        console.error("Failed to initialize WasmBoy:", error);
        if (mounted) {
          setStatus("error");
          setErrorMessage(error instanceof Error ? error.message : "Unknown error");
          toaster.toast({
            title: "Deck Boy DMG Error",
            body: error instanceof Error ? error.message : "Failed to load ROM"
          });
        }
      }
    };

    initEmulator();

    return () => {
      mounted = false;
      // Cleanup WasmBoy on unmount
      WasmBoy.pause().catch(console.error);
    };
  }, []);

  // Setup keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (updateJoypadState(e.key, true)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (updateJoypadState(e.key, false)) {
        e.preventDefault();
      }
    };

    keyListenersRef.current = { handleKeyDown, handleKeyUp };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const getStatusText = () => {
    switch (status) {
      case "loading":
        return "Loading ROM…";
      case "running":
        return "Running Tetris";
      case "error":
        return `Error: ${errorMessage}`;
      default:
        return "";
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      gap: "15px"
    }}>
      <canvas
        ref={canvasRef}
        width={160}
        height={144}
        style={{
          border: "2px solid #333",
          borderRadius: "4px",
          imageRendering: "pixelated",
          backgroundColor: "#000",
          maxWidth: "100%",
          height: "auto"
        }}
      />
      <div style={{
        fontSize: "14px",
        color: status === "error" ? "#ff5555" : "#aaa",
        textAlign: "center"
      }}>
        {getStatusText()}
      </div>
      {status === "running" && (
        <div style={{
          fontSize: "11px",
          color: "#666",
          textAlign: "center",
          marginTop: "10px"
        }}>
          Controls: Arrows (D-pad) • Z (A) • X (B) • Enter (Start) • Shift (Select)
        </div>
      )}
    </div>
  );
}

function Content() {
  return (
    <PanelSection title="Deck Boy DMG">
      <PanelSectionRow>
        <GameBoyEmulator />
      </PanelSectionRow>
    </PanelSection>
  );
}

export default definePlugin(() => {
  console.log("Deck Boy DMG plugin initializing");

  return {
    name: "Deck Boy DMG",
    titleView: <div className={staticClasses.Title}>Deck Boy DMG</div>,
    content: <Content />,
    icon: <FaGamepad />,
    onDismount() {
      console.log("Deck Boy DMG plugin unloading");
    },
  };
});
