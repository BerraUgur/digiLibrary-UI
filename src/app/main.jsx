import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ThemeProvider from "../context/ThemeProvider";
import LanguageProvider from "../context/LanguageProvider";
import { AuthProvider } from "../features/auth/context/AuthContext.jsx";
import "./index.css";
import remoteLogger from "../utils/remoteLogger";

remoteLogger.installConsoleShim({ forward: true });

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <LanguageProvider>
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  </BrowserRouter>
);
