import { ToastContainer } from "react-toastify";
import AppRoutes from "./routes";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";

function App() {
  return (
    <div className="app container mx-auto">
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
