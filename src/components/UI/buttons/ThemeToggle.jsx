import React, { useContext } from "react";
import { Sun, Moon } from "lucide-react";
import ThemeContext from "../../../context/ThemeContext";

const ThemeToggle = () => {
  const { darkMode, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
    >
      {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-gray-700" />}
    </button>
  );
};

export default ThemeToggle;
