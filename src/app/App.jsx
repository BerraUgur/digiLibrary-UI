import { ToastContainer } from "react-toastify";
import AppRoutes from "./routes";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";

function App() {
  return (
    <div className="app flex flex-col min-h-screen">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-4">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
}

export default App;
