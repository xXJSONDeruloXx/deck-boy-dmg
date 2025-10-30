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
    UP: boolean;
    DOWN: boolean;
    LEFT: boolean;
    RIGHT: boolean;
    A: boolean;
    B: boolean;
    START: boolean;
    SELECT: boolean;
  }

  interface WasmBoyAPI {
    config(config: WasmBoyConfig, canvas?: HTMLCanvasElement): Promise<void>;
    loadROM(rom: ArrayBuffer | Uint8Array): Promise<void>;
    play(): Promise<void>;
    pause(): Promise<void>;
    reset(): Promise<void>;
    setJoypadState(state: WasmBoyGamepadState): void;
  }

  export const WasmBoy: WasmBoyAPI;
}
