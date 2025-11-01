import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { registerSchema } from "../schemas/registerSchema";
import { useAuth } from "../context/useAuth";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import remoteLogger from '../../../utils/remoteLogger';
import { useLanguage } from '../../../context/useLanguage';

const RegisterForm = () => {
  const { t } = useLanguage();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(registerSchema(t)),
    mode: "onBlur",
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const result = await registerUser({
        username: `${data.firstName} ${data.lastName}`,
        email: data.email,
        password: data.password
      });
      if (result.success) {
        navigate('/login');
      }
    } catch (error) {
      remoteLogger.error('Register error', { error: error?.message || String(error), stack: error?.stack });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-slate-100">
          {t.auth.registerTitle}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
              {t.auth.firstName}
            </label>
            <input
              type="text"
              {...register("firstName")}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400"
              placeholder={t.auth.firstNamePlaceholder}
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm mt-1">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
              {t.auth.lastName}
            </label>
            <input
              type="text"
              {...register("lastName")}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400"
              placeholder={t.auth.lastNamePlaceholder}
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm mt-1">
                {errors.lastName.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
              {t.auth.email}
            </label>
            <input
              type="email"
              {...register("email")}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400"
              placeholder={t.auth.emailPlaceholder}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
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
              {...register("password")}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400"
              placeholder={t.auth.passwordPlaceholder}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t.auth.registering : t.auth.registerButton}
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-gray-600 dark:text-slate-300 mt-4">
          {t.auth.alreadyHaveAccount}{" "}
          <Link to="/login" className="text-blue-600 hover:underline dark:text-blue-400">
            {t.auth.loginLink}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
