import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { registerSchema } from "../schemas/registerSchema";
import { useAuth } from "../context/useAuth";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LegalModal from "../../../components/UI/modals/LegalModal";
import remoteLogger from '../../../utils/remoteLogger';
import { useLanguage } from '../../../context/useLanguage';
import { formatPhoneNumber } from '../../../utils/phoneFormatter';
import { toast } from 'react-toastify';

const RegisterForm = () => {
  const { t, language } = useLanguage();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(registerSchema(t)),
    mode: "onChange", // Real-time validation
  });

  // Show toast notifications for validation errors
  const showErrorToast = (message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const onSubmit = async (data) => {
    setPendingData(data);
    setShowLegalModal(true);
  };

  const handleLegalAccept = async () => {
    try {
      setLoading(true);
      setShowLegalModal(false);
      const result = await registerUser({
        username: `${pendingData.firstName} ${pendingData.lastName}`,
        email: pendingData.email,
        password: pendingData.password,
        tcIdentity: pendingData.tcIdentity,
        phoneNumber: pendingData.phoneNumber,
        address: pendingData.address,
        birthDate: pendingData.birthDate
      });
      if (result.success) {
        // Success toast already shown by AuthContext
        setTimeout(() => navigate('/login'), 1500);
      } else if (result.error) {
        // Error toast already shown by AuthContext
        remoteLogger.error('Register failed', { error: result.error });
      }
    } catch (error) {
      // Unexpected error - show toast here
      showErrorToast(
        language === 'tr'
          ? 'Kayıt sırasında beklenmeyen bir hata oluştu.'
          : 'An unexpected error occurred during registration.'
      );
      remoteLogger.error('Register unexpected error', { error: error?.message || String(error), stack: error?.stack });
    } finally {
      setLoading(false);
      setPendingData(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-slate-100">
          {t.auth.registerTitle}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
              {t.auth.firstName} <span className="text-red-500">*</span>
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
              {t.auth.lastName} <span className="text-red-500">*</span>
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
              {t.auth.email} <span className="text-red-500">*</span>
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
              {t.auth.password} <span className="text-red-500">*</span>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
              {t.auth.tcIdentity} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("tcIdentity")}
              maxLength="11"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400"
              placeholder={t.auth.tcIdentityPlaceholder}
            />
            {errors.tcIdentity && (
              <p className="text-red-500 text-sm mt-1">
                {errors.tcIdentity.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
              {t.auth.phoneNumber} <span className="text-red-500">*</span>
            </label>
            <Controller
              name="phoneNumber"
              control={control}
              defaultValue="+90 "
              render={({ field: { onChange, value, ...field } }) => (
                <input
                  {...field}
                  type="tel"
                  value={value}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    onChange(formatted);
                  }}
                  placeholder={t.auth.phoneNumberPlaceholder}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400"
                />
              )}
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-sm mt-1">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
              {t.auth.address} <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("address")}
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400"
              placeholder={t.auth.addressPlaceholder}
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">
                {errors.address.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
              {t.auth.birthDate} <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 ml-2">{t.auth.birthDateNote}</span>
            </label>
            <input
              type="date"
              {...register("birthDate")}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-slate-800 dark:text-slate-100"
            />
            {errors.birthDate && (
              <p className="text-red-500 text-sm mt-1">
                {errors.birthDate.message}
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

      <LegalModal
        isOpen={showLegalModal}
        onClose={() => {
          setShowLegalModal(false);
          setPendingData(null);
        }}
        onAccept={handleLegalAccept}
        type="register"
      />
    </div>
  );
};

export default RegisterForm;
