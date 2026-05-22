import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { CartProvider } from "@/context/CartContext";
import "./index.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container 'root' not found in document.");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <CartProvider>
      <App />
    </CartProvider>
  </React.StrictMode>
);

// Register Service Worker in production to prevent caching conflicts during development
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("Service Worker registered successfully:", reg.scope);
      })
      .catch((err) => {
        console.error("Service Worker registration failed:", err);
      });
  });
}
