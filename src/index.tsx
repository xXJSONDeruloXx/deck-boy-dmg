import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { FaGamepad } from "react-icons/fa";
import { WasmBoy } from "wasmboy";

import { definePlugin, callable, toaster } from "@decky/api";
import { ButtonItem, PanelSection, PanelSectionRow, staticClasses } from "@decky/ui";

type EmulatorStatus = "loading" | "running" | "error";
type JoypadKey = "UP" | "DOWN" | "LEFT" | "RIGHT" | "A" | "B" | "START" | "SELECT";

type RomResponse = { rom?: string; error?: string };

type JoypadState = Record<JoypadKey, boolean>;

type KeyMapping = {
  readonly label: string;
  readonly joypadKey: JoypadKey;
};

const JOYPAD_KEYS: JoypadKey[] = [
  "UP",
  "DOWN",
  "LEFT",
  "RIGHT",
  "A",
  "B",
  "START",
  "SELECT",
];

const KEYBOARD_TO_JOYPAD: Record<string, JoypadKey> = {
  ArrowUp: "UP",
  arrowup: "UP",
  ArrowDown: "DOWN",
  arrowdown: "DOWN",
  ArrowLeft: "LEFT",
  arrowleft: "LEFT",
  ArrowRight: "RIGHT",
  arrowright: "RIGHT",
  KeyZ: "A",
  z: "A",
  Z: "A",
  KeyX: "B",
  x: "B",
  X: "B",
  Enter: "START",
  NumpadEnter: "START",
  Shift: "SELECT",
  ShiftLeft: "SELECT",
  ShiftRight: "SELECT",
};

const CONTROL_MAPPINGS: KeyMapping[] = [
  { label: "D-Pad Up", joypadKey: "UP" },
  { label: "D-Pad Down", joypadKey: "DOWN" },
  { label: "D-Pad Left", joypadKey: "LEFT" },
  { label: "D-Pad Right", joypadKey: "RIGHT" },
  { label: "A Button", joypadKey: "A" },
  { label: "B Button", joypadKey: "B" },
  { label: "Start", joypadKey: "START" },
  { label: "Select", joypadKey: "SELECT" },
];

const getRom = callable<[], RomResponse>("get_rom");

const createInitialJoypadState = (): JoypadState => {
  const state: Partial<JoypadState> = {};
  for (const key of JOYPAD_KEYS) {
    state[key] = false;
  }
  return state as JoypadState;
};

const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);
  for (let index = 0; index < length; index += 1) {
    bytes[index] = binaryString.charCodeAt(index);
  }
  return bytes;
};

const getJoypadKeyFromEvent = (event: KeyboardEvent): JoypadKey | null => {
  return (
    KEYBOARD_TO_JOYPAD[event.code] ??
    KEYBOARD_TO_JOYPAD[event.key] ??
    KEYBOARD_TO_JOYPAD[event.key.toLowerCase()] ??
    null
  );
};

const useGameBoyEmulator = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerStateRef = useRef<JoypadState>(createInitialJoypadState());
  const pendingTimeoutsRef = useRef<number[]>([]);
  const isReadyRef = useRef(false);

  const [status, setStatus] = useState<EmulatorStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const applyJoypadState = useCallback((joypadKey: JoypadKey, pressed: boolean) => {
    if (!isReadyRef.current) {
      return;
    }

    const nextState: JoypadState = {
      ...controllerStateRef.current,
      [joypadKey]: pressed,
    };

    controllerStateRef.current = nextState;

    try {
      WasmBoy.setJoypadState(nextState);
    } catch (error) {
      console.warn("Failed to set joypad state", error);
    }
  }, []);

  const triggerVirtualPress = useCallback(
    (joypadKey: JoypadKey) => {
      applyJoypadState(joypadKey, true);
      const timeoutId = window.setTimeout(() => {
        applyJoypadState(joypadKey, false);
        pendingTimeoutsRef.current = pendingTimeoutsRef.current.filter((id) => id !== timeoutId);
      }, 140);
      pendingTimeoutsRef.current.push(timeoutId);
    },
    [applyJoypadState]
  );

  useEffect(() => {
    let cancelled = false;

    const initializeEmulator = async () => {
      if (!canvasRef.current) {
        setStatus("error");
        setErrorMessage("Canvas element not found");
        return;
      }

      setStatus("loading");
      setErrorMessage("");

      try {
        await WasmBoy.config(
          {
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
          },
          canvasRef.current
        );

        const response = await getRom();
        if (!response?.rom) {
          throw new Error(response?.error ?? "ROM data missing");
        }

        const romBuffer = base64ToUint8Array(response.rom);

        if (cancelled) {
          return;
        }

        await WasmBoy.loadROM(romBuffer);

        if (cancelled) {
          return;
        }

        WasmBoy.disableDefaultJoypad?.();

        await WasmBoy.play();

        if (cancelled) {
          return;
        }

        controllerStateRef.current = createInitialJoypadState();
        WasmBoy.setJoypadState(controllerStateRef.current);
        isReadyRef.current = true;

        setStatus("running");
        toaster.toast({
          title: "Deck Boy DMG",
          body: "ROM loaded successfully",
        });
      } catch (error) {
        console.error("Failed to initialize WasmBoy", error);
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Unknown error";
          setStatus("error");
          setErrorMessage(message);
          toaster.toast({
            title: "Deck Boy DMG Error",
            body: message,
          });
        }
      }
    };

    initializeEmulator();

    return () => {
      cancelled = true;
      isReadyRef.current = false;
      for (const timeoutId of pendingTimeoutsRef.current) {
        window.clearTimeout(timeoutId);
      }
      pendingTimeoutsRef.current = [];
      WasmBoy.pause().catch((error) => console.warn("Failed to pause WasmBoy", error));
      WasmBoy.enableDefaultJoypad?.();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      const joypadKey = getJoypadKeyFromEvent(event);
      if (!joypadKey) {
        return;
      }

      event.preventDefault();
      applyJoypadState(joypadKey, true);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const joypadKey = getJoypadKeyFromEvent(event);
      if (!joypadKey) {
        return;
      }

      event.preventDefault();
      applyJoypadState(joypadKey, false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [applyJoypadState]);

  return {
    canvasRef,
    status,
    errorMessage,
    triggerVirtualPress,
  };
};

const GameBoyCanvas = ({
  canvasRef,
  status,
  errorMessage,
}: {
  canvasRef: RefObject<HTMLCanvasElement>;
  status: EmulatorStatus;
  errorMessage: string;
}) => {
  const getStatusText = (): string => {
    switch (status) {
      case "loading":
        return "Loading ROM...";
      case "running":
        return "Running";
      case "error":
        return `Error: ${errorMessage}`;
      default:
        return "";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        gap: "15px",
      }}
    >
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
          height: "auto",
        }}
      />
      <div
        style={{
          fontSize: "14px",
          color: status === "error" ? "#ff5555" : "#aaa",
          textAlign: "center",
        }}
      >
        {getStatusText()}
      </div>
      {status === "running" && (
        <div
          style={{
            fontSize: "11px",
            color: "#666",
            textAlign: "center",
            marginTop: "10px",
          }}
        >
          Controls: Use the on-screen buttons or keyboard (Arrows, Z, X, Enter, Shift)
        </div>
      )}
    </div>
  );
};

const ControlButtons = ({ onPress }: { onPress: (joypadKey: JoypadKey) => void }) => (
  <PanelSection title="CONTROLS">
    {CONTROL_MAPPINGS.map(({ joypadKey, label }) => (
      <PanelSectionRow key={joypadKey}>
        <ButtonItem layout="below" onClick={() => onPress(joypadKey)}>
          {label}
        </ButtonItem>
      </PanelSectionRow>
    ))}
  </PanelSection>
);

const Content = () => {
  const { canvasRef, status, errorMessage, triggerVirtualPress } = useGameBoyEmulator();

  return (
    <>
      <PanelSection title="GAME BOY EMULATOR">
        <PanelSectionRow>
          <GameBoyCanvas canvasRef={canvasRef} status={status} errorMessage={errorMessage} />
        </PanelSectionRow>
      </PanelSection>

      <ControlButtons onPress={triggerVirtualPress} />
    </>
  );
};

export default definePlugin(() => ({
  name: "Deck Boy DMG",
  titleView: <div className={staticClasses.Title}>Deck Boy DMG</div>,
  content: <Content />,
  icon: <FaGamepad />,
  onDismount() {
    console.log("Deck Boy DMG plugin unloading");
  },
}));
