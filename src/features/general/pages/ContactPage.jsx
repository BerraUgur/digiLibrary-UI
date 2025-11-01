import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { MapPin, Phone, Mail, Clock, Send, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { toast, Zoom } from 'react-toastify';
import { contactService } from '../../../services';
import { LOAN_DURATION_DAYS, REMINDER_DAY, LATE_FEE_PER_DAY, BAN_MULTIPLIER } from '../../../constants/loanConstants';
import { ROLES } from '../../../constants/rolesConstants';
import { useAuth } from '../../auth/context/useAuth';
import { useLanguage } from '../../../context/useLanguage';
import remoteLogger from '../../../utils/remoteLogger';

const ContactPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation schema
  const contactSchema = yup.object({
    name: yup.string().required(t.contact.nameRequired),
    email: yup.string().email(t.contact.emailInvalid).required(t.contact.emailRequired),
    subject: yup.string().required(t.contact.subjectRequired),
    message: yup.string().required(t.contact.messageRequired).min(10, t.contact.messageMinLength)
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(contactSchema),
    mode: 'onBlur'
  });

  // Autofill user information if logged in
  useEffect(() => {
    if (user) {
      setValue('name', user.username || '');
      setValue('email', user.email || '');
    }
  }, [user, setValue]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      await contactService.send(data);
      toast.success(t.contact.messageSent, {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Zoom,
      });

      // Clear the form fields after successful submission
      reset();
    } catch (error) {
      remoteLogger.error('Error sending message', { error: error?.message || String(error), stack: error?.stack });
      toast.error(t.contact.messageFailed, {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Zoom,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">📞 {t.contact.title}</h1>

      {/* Contact Info and Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Contact Info */}
        <div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">{t.contact.getInTouch}</h2>
            <p className="text-gray-600 dark:text-white mb-6">
              {t.contact.getInTouchDesc}
            </p>

            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-blue-100 dark:bg-slate-700 p-3 rounded-full mr-4">
                  <MapPin className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-medium">{t.contact.address}</h3>
                  <p className="text-gray-600 dark:text-white">{t.contact.addressValue}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-blue-100 dark:bg-slate-700 p-3 rounded-full mr-4">
                  <Phone className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-medium">{t.contact.phone}</h3>
                  <p className="text-gray-600 dark:text-white">{t.contact.phoneValue}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-blue-100 dark:bg-slate-700 p-3 rounded-full mr-4">
                  <Mail className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-medium">{t.contact.emailLabel}</h3>
                  <p className="text-gray-600 dark:text-white">{t.contact.emailValue}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-blue-100 dark:bg-slate-700 p-3 rounded-full mr-4">
                  <Clock className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-medium">{t.contact.serviceHours}</h3>
                  <p className="text-gray-600 dark:text-white">{t.contact.serviceHoursValue}</p>
                  <p className="text-gray-600 dark:text-white text-sm mt-1">{t.contact.supportHours}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">📱 {t.contact.findUsOnSocial}</h2>
            <p className="text-gray-600 dark:text-white text-sm mb-4">
              {t.contact.findUsOnSocialDesc}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="bg-blue-100 dark:bg-slate-700 hover:bg-blue-200 dark:hover:bg-slate-600 p-3 rounded-full transition duration-300" title="Facebook">
                <Facebook className="text-blue-600" size={24} />
              </a>
              <a href="#" className="bg-blue-100 dark:bg-slate-700 hover:bg-blue-200 dark:hover:bg-slate-600 p-3 rounded-full transition duration-300" title="Twitter">
                <Twitter className="text-blue-600" size={24} />
              </a>
              <a href="#" className="bg-blue-100 dark:bg-slate-700 hover:bg-blue-200 dark:hover:bg-slate-600 p-3 rounded-full transition duration-300" title="Instagram">
                <Instagram className="text-blue-600" size={24} />
              </a>
              <a href="#" className="bg-blue-100 dark:bg-slate-700 hover:bg-blue-200 dark:hover:bg-slate-600 p-3 rounded-full transition duration-300" title="LinkedIn">
                <Linkedin className="text-blue-600" size={24} />
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-2">✉️ {t.contact.sendMessage}</h2>

          {/* Admin warning message */}
          {user?.role === ROLES.ADMIN ? (
            <div className="bg-blue-50 dark:bg-slate-700 border-l-4 border-blue-500 p-6 rounded-lg">
              <div className="flex items-start">
                <div className="text-blue-500 text-3xl mr-4">🔒</div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">{t.contact.adminAccount || 'Admin Account'}</h3>
                  <p className="text-blue-700 dark:text-blue-200 mb-3">
                    {t.contact.adminCannotSend || 'Admins cannot use the contact form. To view and manage all incoming messages, use the'} <strong>{t.header.messages}</strong> {t.contact.page || 'page'}.
                  </p>
                  <a
                    href="/admin/messages"
                    className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200 font-medium"
                  >
                    <Mail className="mr-2" size={18} />
                    {t.contact.goToMessages || 'Go to Messages'}
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-600 dark:text-white text-sm mb-6">
                {t.contact.sendMessageDesc}
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
                    📝 {t.contact.name} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("name")}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed dark:bg-slate-900 dark:text-slate-100"
                    placeholder={t.contact.namePlaceholder}
                    disabled={!!user}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠️</span> {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
                    📧 {t.contact.email} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed dark:bg-slate-900 dark:text-slate-100"
                    placeholder={t.contact.emailPlaceholder}
                    disabled={!!user}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠️</span> {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
                    🏷️ {t.contact.subject} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("subject")}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition dark:bg-slate-900 dark:text-slate-100"
                    placeholder={t.contact.subjectPlaceholder}
                  />
                  {errors.subject && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠️</span> {errors.subject.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
                    💬 {t.contact.message} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register("message")}
                    rows="6"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none dark:bg-slate-900 dark:text-slate-100"
                    placeholder={t.contact.messagePlaceholder}
                  ></textarea>
                  {errors.message && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠️</span> {errors.message.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t.contact.sending}
                    </>
                  ) : (
                    <>
                      <Send className="mr-2" size={18} />
                      {t.contact.send}
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">📍 {t.about.ourLocation}</h2>
        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 h-[400px] bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900">
          {/* Embedded live map centered on Kadıköy, Istanbul (OpenStreetMap) */}
          <iframe
            title="Kadikoy Map"
            src="https://www.openstreetmap.org/export/embed.html?bbox=29.0120%2C40.9860%2C29.0400%2C40.9960&layer=mapnik&marker=40.9903%2C29.0260"
            style={{ width: '100%', height: '100%', border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-xl shadow-md p-6 dark:bg-slate-800 dark:text-slate-200">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">❓ {t.about.faq}</h2>
        <div className="space-y-4">
          {/* Book Borrowing */}
          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-blue-700 dark:text-blue-300">📚 {t.about.faqQ1}</h3>
            <p className="text-gray-600 dark:text-white">
              <strong>{t.about.faqA1Only}</strong> {t.about.faqA1}
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-blue-700 dark:text-blue-300">⏰ {t.about.faqQ2}</h3>
            <p className="text-gray-600 dark:text-white">
              {t.about.faqA2.replace('{{days}}', LOAN_DURATION_DAYS).replace('{{weeks}}', Math.round(LOAN_DURATION_DAYS / 7))}
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-blue-700 dark:text-blue-300">🔔 {t.about.faqQ3}</h3>
            <p className="text-gray-600 dark:text-white">
              {t.about.faqA3.replace('{{day}}', REMINDER_DAY)}
            </p>
          </div>

          {/* Penalty System */}
          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-red-700 dark:text-red-300">💰 {t.about.faqQ4}</h3>
            <p className="text-gray-600 dark:text-white">
              {t.about.faqA4.replace('{{fee}}', LATE_FEE_PER_DAY)}
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-white mt-2 ml-4">
              <li>1 {t.about.faqA4DayLate}: {LATE_FEE_PER_DAY} TL</li>
              <li>2 {t.about.faqA4DayLate}: {LATE_FEE_PER_DAY * 2} TL</li>
              <li>5 {t.about.faqA4DayLate}: {LATE_FEE_PER_DAY * 5} TL</li>
            </ul>
            <p className="text-gray-600 dark:text-white mt-2">
              {t.about.faqPenaltyAuto}
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-red-700 dark:text-red-300">🚫 {t.about.faqQ5}</h3>
            <p className="text-gray-600 dark:text-white">
              {t.about.faqA5}
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-white mt-2 ml-4">
              <li>1 {t.about.faqA5DayLateReturn} → {1 * BAN_MULTIPLIER} {t.about.faqA5DaysBan}</li>
              <li>2 {t.about.faqA5DayLateReturn} → {2 * BAN_MULTIPLIER} {t.about.faqA5DaysBan}</li>
              <li>7 {t.about.faqA5DayLateReturn} → {7 * BAN_MULTIPLIER} {t.about.faqA5DaysBan}</li>
            </ul>
            <p className="text-gray-600 dark:text-white mt-2">
              {t.about.faqA5BanPeriod}
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-red-700 dark:text-red-300">⚠️ {t.about.faqQ6}</h3>
            <p className="text-gray-600 dark:text-white">
              <strong>{t.about.faqA6Scenario}</strong> {t.about.faqA6ScenarioText.replace('{{days}}', LOAN_DURATION_DAYS)}
            </p>
            <div className="bg-gray-50 dark:bg-slate-700 dark:text-white p-4 rounded-lg mt-2 space-y-2 text-sm">
              <p>📅 <strong>{t.about.faqA6ReminderDay.replace('{{day}}', REMINDER_DAY)}</strong> {t.about.faqA6ReminderText}</p>
              <p>⏰ <strong>{t.about.faqA6ReturnDate}</strong> {t.about.faqA6ReturnDateText}</p>
              <p>🚨 <strong>{t.about.faqA6NextDay}</strong> {t.about.faqA6NextDayText.replace('{{fee}}', LATE_FEE_PER_DAY)}</p>
              <p>🚨 <strong>{t.about.faqA62DaysLate}</strong> {t.about.faqA62DaysLateText.replace('{{fee}}', LATE_FEE_PER_DAY * 2)}</p>
              <p>📖 <strong>{t.about.faqA6Returned}</strong> {t.about.faqA6ReturnedText}</p>
              <p>💰 <strong>{t.about.faqA6Result}</strong> {t.about.faqA6ResultText.replace('{{penalty}}', LATE_FEE_PER_DAY * 2).replace('{{ban}}', 2 * BAN_MULTIPLIER)}</p>
            </div>
          </div>

          {/* Payment and Return */}
          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-green-700 dark:text-green-300">💳 {t.about.faqQ7}</h3>
            <p className="text-gray-600 dark:text-white">
              {t.about.faqA7}
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-green-700 dark:text-green-300">🔄 {t.about.faqQ8}</h3>
            <p className="text-gray-600 dark:text-white">
              {t.about.faqA8}
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-purple-700 dark:text-purple-300">🆓 {t.about.faqQ9}</h3>
            <p className="text-gray-600 dark:text-white">
              <strong>{t.about.faqA9Free}</strong> {t.about.faqA9.replace('{{fee}}', LATE_FEE_PER_DAY)}
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-emerald-400 dark:text-emerald-400">📖 {t.about.faqQ10}</h3>
            <p className="text-gray-600 dark:text-white">
              {t.about.faqA10}
            </p>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-2 text-emerald-400 dark:text-emerald-400">💡 {t.about.faqQ11}</h3>
            <p className="text-gray-600 dark:text-white">
              <strong>{t.about.faqA11Yes}</strong> {t.about.faqA11}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
