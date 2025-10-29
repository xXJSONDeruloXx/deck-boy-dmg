declare module "wasmboy" {
  interface WasmBoyConfig {
    headless?: boolean;
    isGBC?: boolean;
    gameboySpeed?: number;
    frameSkip?: number;
    audioBatchProcessing?: boolean;
    audioAccumulateSamples?: boolean;
    timersBatchProcessing?: boolean;
    graphicsBatchProcessing?: boolean;
    disableSmoothScaling?: boolean;
    updateGraphicsCallback?: boolean | ((imageDataArray: Uint8Array) => void);
    updateAudioCallback?: boolean | ((audioBuffer: Float32Array) => void);
    saveStateCallback?: boolean | ((saveState: any) => void);
  }

  interface WasmBoyGamepadState {
    UP: number;
    DOWN: number;
    LEFT: number;
    RIGHT: number;
    A: number;
    B: number;
    START: number;
    SELECT: number;
  }

  const WasmBoy: {
    config(config: WasmBoyConfig, canvas?: HTMLCanvasElement): Promise<void>;
    loadROM(rom: ArrayBuffer | Uint8Array): Promise<void>;
    play(): Promise<void>;
    pause(): Promise<void>;
    reset(): Promise<void>;
    setJoypadState(key: number, pressed: boolean): void;
    GAMEPAD_STATE: WasmBoyGamepadState;
  };

  export default WasmBoy;
}
