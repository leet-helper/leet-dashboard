/// <reference types="vite/client" />

interface Window {
  clearCurrentCanvas?: () => void;
  undoCurrentCanvas?: () => void;
  redoCurrentCanvas?: () => void;
}

interface Document {
  webkitFullscreenElement?: Element;
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
}

interface HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}
