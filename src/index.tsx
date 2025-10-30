import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { FaGamepad } from "react-icons/fa";
import { WasmBoy } from "wasmboy/dist/wasmboy.wasm.esm.js";

import { definePlugin, callable, toaster } from "@decky/api";
import { Focusable, PanelSection, PanelSectionRow, staticClasses } from "@decky/ui";

type EmulatorStatus = "loading" | "running" | "error";
type JoypadKey = "UP" | "DOWN" | "LEFT" | "RIGHT" | "A" | "B" | "START" | "SELECT";

type RomResponse = { rom?: string; error?: string };

type JoypadState = Record<JoypadKey, boolean>;

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

const CONTROL_PAD_STYLES = `
.deckboy-pad-button {
  border-radius: 6px;
  background-color: #2b3137;
  border: 2px solid #1b1f23;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 9px;
  font-weight: 600;
  color: #f4f7fb;
  box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.08);
  cursor: pointer;
  user-select: none;
  transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
}

.deckboy-pad-button--focused {
  background-color: #f4f7fb;
  color: #121417;
  border-color: #f4f7fb;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.28), inset 0 2px 0 rgba(0, 0, 0, 0.06);
}
`;

const ControlPadButton = ({
  label,
  onPress,
  width = 48,
  height = 48,
  style,
}: {
  label: string;
  onPress: () => void;
  width?: number;
  height?: number;
  style?: CSSProperties;
}) => {
  const dynamicStyle: CSSProperties = {
    width,
    height,
    ...(style ?? {}),
  };

  return (
    <Focusable
      className="deckboy-pad-button"
      focusWithinClassName="gpfocuswithin deckboy-pad-button deckboy-pad-button--focused"
      onActivate={onPress}
      onClick={onPress}
      style={dynamicStyle}
    >
      {label}
    </Focusable>
  );
};

const useGameBoyEmulator = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerStateRef = useRef<JoypadState>(createInitialJoypadState());
  const pendingTimeoutsRef = useRef<number[]>([]);
  const isReadyRef = useRef(false);

  const [status, setStatus] = useState<EmulatorStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const hasLoggedNotReadyRef = useRef(false);
  const hasLoggedNotLoadedRef = useRef(false);
  const joypadProbeCountRef = useRef(0);

  const applyJoypadState = useCallback((joypadKey: JoypadKey, pressed: boolean) => {
    if (!isReadyRef.current) {
      if (!hasLoggedNotReadyRef.current) {
        console.debug("[DeckBoy] Skipping joypad update; emulator not ready", {
          joypadKey,
          pressed,
        });
        hasLoggedNotReadyRef.current = true;
      }
      return;
    }

    hasLoggedNotReadyRef.current = false;

    const nextState: JoypadState = {
      ...controllerStateRef.current,
      [joypadKey]: pressed,
    };

    controllerStateRef.current = nextState;

    const isCoreLoaded = typeof WasmBoy.isLoadedAndStarted === "function" ? WasmBoy.isLoadedAndStarted() : undefined;
    if (isCoreLoaded === false) {
      if (!hasLoggedNotLoadedRef.current) {
        console.debug("[DeckBoy] Joypad update queued before core finished loading", {
          joypadKey,
          pressed,
        });
        hasLoggedNotLoadedRef.current = true;
      }
    } else {
      hasLoggedNotLoadedRef.current = false;
    }

    try {
      WasmBoy.setJoypadState(nextState);
      console.debug("[DeckBoy] Joypad state dispatched", {
        joypadKey,
        pressed,
        isCoreLoaded,
        state: nextState,
      });

      if (typeof WasmBoy._runWasmExport === "function" && joypadProbeCountRef.current < 10) {
        const probeId = joypadProbeCountRef.current + 1;
        joypadProbeCountRef.current = probeId;

        WasmBoy._runWasmExport("getJoypadState", [])
          .then((value: unknown) => {
            console.debug("[DeckBoy] Joypad register probe", {
              joypadKey,
              pressed,
              probeId,
              registerValue: value,
            });
          })
          .catch((probeError: unknown) => {
            console.debug("[DeckBoy] Joypad register probe failed", {
              joypadKey,
              pressed,
              probeId,
              probeError,
            });
          });
      }
    } catch (error) {
      console.warn("[DeckBoy] Failed to set joypad state", {
        error,
        joypadKey,
        pressed,
        isCoreLoaded,
      });
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
            frameSkip: 1,
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
      
      // Clean up WasmBoy to prevent memory leaks
      WasmBoy.pause().catch((error: unknown) => console.warn("Failed to pause WasmBoy", error));
      WasmBoy.enableDefaultJoypad?.();
      
      // Reset the emulator state to free memory
      WasmBoy.reset().catch((error: unknown) => console.warn("Failed to reset WasmBoy", error));
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
        </div>
      )}
    </div>
  );
};

const ControlButtons = ({ onPress }: { onPress: (joypadKey: JoypadKey) => void }) => {
  const handlePress = useCallback(
    (joypadKey: JoypadKey) => () => {
      onPress(joypadKey);
    },
    [onPress]
  );

  const dpadCellStyle: CSSProperties = { width: 48, height: 48 };

  return (
    <PanelSection title="">
      <PanelSectionRow>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            gap: "28px",
            padding: "14px 0",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 48px)",
              gridTemplateRows: "repeat(3, 48px)",
              gap: "6px",
              alignItems: "center",
              justifyItems: "center",
            }}
          >
            <span style={dpadCellStyle} />
            <ControlPadButton label="↑" onPress={handlePress("UP")} style={{ gridColumn: "2 / 3" }} />
            <span style={dpadCellStyle} />
            <ControlPadButton label="←" onPress={handlePress("LEFT")} style={{ gridColumn: "1 / 2", gridRow: "2 / 3" }} />
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                backgroundColor: "#1c2024",
                boxShadow: "inset 0 2px 0 rgba(255, 255, 255, 0.05)",
              }}
            />
            <ControlPadButton label="→" onPress={handlePress("RIGHT")} style={{ gridColumn: "3 / 4", gridRow: "2 / 3" }} />
            <span style={dpadCellStyle} />
            <ControlPadButton label="↓" onPress={handlePress("DOWN")} style={{ gridColumn: "2 / 3", gridRow: "3 / 4" }} />
            <span style={dpadCellStyle} />
          </div>

          <div
            style={{
              position: "relative",
              width: 120,
              height: 120,
            }}
          >
            <ControlPadButton
              label="A"
              onPress={handlePress("A")}
              style={{ position: "absolute", top: 6, right: 0 }}
            />
            <ControlPadButton
              label="B"
              onPress={handlePress("B")}
              style={{ position: "absolute", bottom: 6, left: 0 }}
            />
          </div>
        </div>
      </PanelSectionRow>

      <PanelSectionRow>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            gap: "14px",
            paddingBottom: "14px",
          }}
        >
          <ControlPadButton
            label="SELECT"
            onPress={handlePress("SELECT")}
            width={102}
            height={32}
            style={{ borderRadius: "16px" }}
          />
          <ControlPadButton
            label="START"
            onPress={handlePress("START")}
            width={102}
            height={32}
            style={{ borderRadius: "16px" }}
          />
        </div>
      </PanelSectionRow>
    </PanelSection>
  );
};

const Content = () => {
  const { canvasRef, status, errorMessage, triggerVirtualPress } = useGameBoyEmulator();

  return (
    <>
      <style>{CONTROL_PAD_STYLES}</style>
      <PanelSection title="">
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
