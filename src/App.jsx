import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Layout/Header";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import Books from "./components/Books/Books";
import BookDetailPage from "./pages/BookDetailPage";
import MyLoansPage from "./pages/MyLoansPage";
import LoginForm from "./components/Auth/LoginForm";
import RegisterForm from "./components/Auth/RegisterForm";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import EditBookPage from "./pages/EditBookPage";
import MessagesPage from "./pages/MessagesPage";
import ProfilePage from "./pages/ProfilePage";
import LateFeeHistoryPage from "./pages/LateFeeHistoryPage";
import AdminLoansPage from "./pages/AdminLoansPage";
import AdminUsersPage from "./pages/AdminUsersPage";

console.log('📱 App.jsx loaded');

function App() {
  console.log('🎨 App component rendering');
  return (
      <AuthProvider>
        <div className="app container mx-auto">
          <ToastContainer />
          <Header />
          <div className="pt-4">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/books" element={<Books />} />
              <Route path="/books/:id" element={<BookDetailPage />} />
              <Route path="/books/:id/edit" element={<EditBookPage />} />
              <Route path="/my-loans" element={<MyLoansPage />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/late-fees" element={<LateFeeHistoryPage />} />
              <Route path="/admin/messages" element={<MessagesPage />} />
              <Route path="/admin/loans" element={<AdminLoansPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
  );
}

export default App;
