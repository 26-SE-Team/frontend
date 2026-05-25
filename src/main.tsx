import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { GoogleSdkProvider } from "./contexts/GoogleSdkContext";
import { publicEnv } from "./config/publicEnv";
import { initKakao } from "./lib/kakao";
import "./styles/global.css";
import "./index.css";

initKakao();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleSdkProvider clientId={publicEnv.googleClientId}>
      <BrowserRouter basename={publicEnv.routerBasename}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </GoogleSdkProvider>
  </React.StrictMode>
);
