import React, { useEffect, useState } from "react";
import ThemeContext from "./ThemeContext";
import logger from "../utils/remoteLogger";

const STORAGE_KEY = "theme"; // 'dark' or 'light'

const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return saved === "dark";
      // fallback to system preference
      if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
    } catch (err) {
      logger.warn("ThemeProvider:init: failed to read theme from storage or system preference", { err });
    }
    return false;
  });

  // Apply class on <html> and persist choice
  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add("dark");
        localStorage.setItem(STORAGE_KEY, "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem(STORAGE_KEY, "light");
      }
    } catch (err) {
      logger.warn("ThemeProvider:apply: failed to persist/apply theme", { err, darkMode });
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
