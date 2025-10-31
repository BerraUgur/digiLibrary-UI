import { createContext } from "react";

// ThemeContext for dark/light mode
const ThemeContext = createContext({
	darkMode: false,
	toggleTheme: () => {},
});

export default ThemeContext;
