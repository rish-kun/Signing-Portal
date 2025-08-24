import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { SignInProvider } from "./assets/store/SignInContext.jsx";
import "./global.scss";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SignInProvider>
      <App />
    </SignInProvider>
  </StrictMode>
);
