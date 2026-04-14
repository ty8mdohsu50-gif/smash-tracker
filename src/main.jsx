import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import OverlayPage from "./components/overlay/OverlayPage";
import { I18nProvider } from "./i18n/index.jsx";
import { ToastProvider } from "./contexts/ToastContext";
import "./index.css";

const isOverlay = window.location.pathname.replace(/\/$/, "").endsWith("/overlay");

ReactDOM.createRoot(document.getElementById("root")).render(
  <I18nProvider>
    <ToastProvider>
      {isOverlay ? <OverlayPage /> : <App />}
    </ToastProvider>
  </I18nProvider>
);
