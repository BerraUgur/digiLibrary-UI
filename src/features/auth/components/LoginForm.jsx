import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "../schemas/loginSchema";
import { useAuth } from "../context/useAuth";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import remoteLogger from '../../../utils/remoteLogger';
import { useLanguage } from '../../../context/useLanguage';

const LoginForm = () => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema(t)),
    mode: "onBlur",
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const result = await login(data);
      if (result.success) {
        navigate('/books');
      }
    } catch (error) {
      remoteLogger.error('Login error', { error: error?.message || String(error), stack: error?.stack });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-slate-100">
          {t.auth.loginTitle}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
              {t.auth.email}
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400"
              {...register("email")}
              placeholder={t.auth.emailPlaceholder}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500 font-bold">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
              {t.auth.password}
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400"
              {...register("password")}
              placeholder={t.auth.passwordPlaceholder}
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500 font-bold">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="flex items-center justify-end">
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              {t.auth.forgotPasswordLink}
            </Link>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t.auth.loggingIn : t.auth.loginButton}
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-gray-600 dark:text-slate-300 mt-4">
          {t.auth.dontHaveAccount}{" "}
          <Link to="/register" className="text-blue-600 hover:underline dark:text-blue-400">
            {t.auth.signUp}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
