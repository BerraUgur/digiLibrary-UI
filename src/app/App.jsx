import { ToastContainer } from "react-toastify";
import AppRoutes from "./routes";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";


import { useContext } from "react";
import ThemeContext from "../context/ThemeContext";

function App() {
  const { darkMode } = useContext(ThemeContext);
  return (
    <div className={`app container mx-auto min-h-screen transition-colors duration-300 ${darkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"}`}>
      <ToastContainer />
      <Header />
      <div className="pt-4">
        <AppRoutes />
      </div>
      <Footer />
    </div>
  );
}

export default App;
