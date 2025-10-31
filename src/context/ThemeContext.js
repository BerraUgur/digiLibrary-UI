import { createContext } from "react";

// ThemeContext for dark/light mode
// Provide a default shape for easier consumption and tooling
const ThemeContext = createContext({
	darkMode: false,
	toggleTheme: () => {},
});

export default ThemeContext;
