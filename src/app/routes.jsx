import { Routes, Route } from "react-router-dom";
import HomePage from "../features/general/pages/HomePage";
import AboutPage from "../features/general/pages/AboutPage";
import ContactPage from "../features/general/pages/ContactPage";
import Books from "../features/books/components/Books";
import BookDetailPage from "../features/books/pages/BookDetailPage";
import EditBookPage from "../features/books/pages/EditBookPage";
import { MyLoansPage, FavoritesPage, MessagesPage, ProfilePage, LateFeeHistoryPage } from "../features/user";
import LoginForm from "../features/auth/components/LoginForm";
import RegisterForm from "../features/auth/components/RegisterForm";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/pages/ResetPasswordPage";
import { AdminLoansPage, AdminUsersPage } from "../features/admin";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/books" element={<Books />} />
      <Route path="/books/:id" element={<BookDetailPage />} />
      <Route path="/books/:id/edit" element={<EditBookPage />} />
      <Route path="/my-loans" element={<MyLoansPage />} />
      <Route path="/favorites" element={<FavoritesPage />} />
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
  );
}
