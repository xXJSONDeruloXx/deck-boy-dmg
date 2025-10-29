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
const GAMEPAD_KEYS = {
  UP: 0,
  DOWN: 1,
  LEFT: 2,
  RIGHT: 3,
  A: 4,
  B: 5,
  START: 6,
  SELECT: 7
};

function base64ToArrayBuffer(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
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

  // Keyboard to Game Boy button mapping
  const keyMap: { [key: string]: number } = {
    ArrowUp: GAMEPAD_KEYS.UP,
    ArrowDown: GAMEPAD_KEYS.DOWN,
    ArrowLeft: GAMEPAD_KEYS.LEFT,
    ArrowRight: GAMEPAD_KEYS.RIGHT,
    z: GAMEPAD_KEYS.A,
    x: GAMEPAD_KEYS.B,
    Enter: GAMEPAD_KEYS.START,
    Shift: GAMEPAD_KEYS.SELECT
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

        const romBuffer = base64ToArrayBuffer(romBase64);
        
        if (!mounted) return;

        // Load and play the ROM
        await WasmBoy.loadROM(romBuffer);
        await WasmBoy.play();

        if (mounted) {
          setStatus("running");
          toaster.toast({
            title: "Game Boy Emulator",
            body: "Tetris loaded successfully!"
          });
        }
      } catch (error) {
        console.error("Failed to initialize WasmBoy:", error);
        if (mounted) {
          setStatus("error");
          setErrorMessage(error instanceof Error ? error.message : "Unknown error");
          toaster.toast({
            title: "Game Boy Emulator Error",
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
      const gameboyKey = keyMap[e.key];
      if (gameboyKey !== undefined) {
        e.preventDefault();
        WasmBoy.setJoypadState(gameboyKey, true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const gameboyKey = keyMap[e.key];
      if (gameboyKey !== undefined) {
        e.preventDefault();
        WasmBoy.setJoypadState(gameboyKey, false);
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
    <PanelSection title="Game Boy Emulator">
      <PanelSectionRow>
        <GameBoyEmulator />
      </PanelSectionRow>
    </PanelSection>
  );
}

export default definePlugin(() => {
  console.log("Game Boy Emulator plugin initializing");

  return {
    name: "Deck Boy DMG",
    titleView: <div className={staticClasses.Title}>Game Boy Emulator</div>,
    content: <Content />,
    icon: <FaGamepad />,
    onDismount() {
      console.log("Game Boy Emulator plugin unloading");
    },
  };
});
