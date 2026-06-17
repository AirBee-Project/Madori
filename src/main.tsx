import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./root.css";

// 注意: deck.gl(luma.gl) は React StrictMode の二重マウントと相性が悪く、
// dev で GL デバイス/ResizeObserver が破棄済みコンテキストを参照して
// "maxTextureDimension2D undefined" / "primcount < 0" を起こすため StrictMode は使わない。
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

createRoot(rootElement).render(<App />);
