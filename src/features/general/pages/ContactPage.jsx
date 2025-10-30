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

// Form validation schema
const contactSchema = yup.object({
  name: yup.string().required('Name and surname are required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  subject: yup.string().required('Subject is required'),
  message: yup.string().required('Message is required').min(10, 'Message must be at least 10 characters long')
});

const ContactPage = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      toast.success('Your message has been successfully sent!', {
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
      console.error('Error sending message:', error);
      toast.error('Failed to send your message. Please try again later.', {
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
      <h1 className="text-3xl font-bold mb-6">📞 Contact</h1>

      {/* Contact Info and Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Contact Info */}
        <div>
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
            <p className="text-gray-600 mb-6">
              For questions, book suggestions, or feedback about DigiLibrary, you can contact us. We will get back to you as soon as possible.
            </p>

            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <MapPin className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-medium">Address</h3>
                  <p className="text-gray-600">DigiLibrary Street, No: 23, Kadıköy, Istanbul</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Phone className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-medium">Phone</h3>
                  <p className="text-gray-600">+90 (216) 555 12 34</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Mail className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-medium">Email</h3>
                  <p className="text-gray-600">info@digitallibrary.com</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Clock className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-medium">Service Hours</h3>
                  <p className="text-gray-600">24/7 Digital Access</p>
                  <p className="text-gray-600 text-sm mt-1">Support: Monday - Friday 09:00 - 18:00</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">📱 Find Us on Social Media</h2>
            <p className="text-gray-600 text-sm mb-4">
              Follow us for new books, reading suggestions, and updates on our events!
            </p>
            <div className="flex space-x-4">
              <a href="#" className="bg-blue-100 hover:bg-blue-200 p-3 rounded-full transition duration-300" title="Facebook">
                <Facebook className="text-blue-600" size={24} />
              </a>
              <a href="#" className="bg-blue-100 hover:bg-blue-200 p-3 rounded-full transition duration-300" title="Twitter">
                <Twitter className="text-blue-600" size={24} />
              </a>
              <a href="#" className="bg-blue-100 hover:bg-blue-200 p-3 rounded-full transition duration-300" title="Instagram">
                <Instagram className="text-blue-600" size={24} />
              </a>
              <a href="#" className="bg-blue-100 hover:bg-blue-200 p-3 rounded-full transition duration-300" title="LinkedIn">
                <Linkedin className="text-blue-600" size={24} />
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-2">✉️ Send a Message</h2>

          {/* Admin warning message */}
          {user?.role === ROLES.ADMIN ? (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
              <div className="flex items-start">
                <div className="text-blue-500 text-3xl mr-4">🔒</div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Admin Account</h3>
                  <p className="text-blue-700 mb-3">
                    Admins cannot use the contact form. To view and manage all incoming messages, use the <strong>Messages</strong> page.
                  </p>
                  <a
                    href="/admin/messages"
                    className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200 font-medium"
                  >
                    <Mail className="mr-2" size={18} />
                    Go to Messages
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-600 text-sm mb-6">
                {user
                  ? '👤 You are sending a message as a logged-in user. Your information has been auto-filled.'
                  : 'You can contact us by filling out the form. Membership is not required, anyone can send a message.'}
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📝 Name Surname <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("name")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Your name and surname"
                    disabled={!!user}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠️</span> {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📧 Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="example@email.com"
                    disabled={!!user}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠️</span> {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🏷️ Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("subject")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Subject of your message"
                  />
                  {errors.subject && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠️</span> {errors.subject.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    💬 Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register("message")}
                    rows="6"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                    placeholder="Write your message here..."
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
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2" size={18} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">📍 Our Location</h2>
        <div className="rounded-lg overflow-hidden border border-gray-200 h-[400px] bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
          {/* In a real application, you can integrate Google Maps or another map service here */}
          <div className="text-center text-gray-500">
            <MapPin size={64} className="mx-auto mb-4 text-blue-500" />
            <p className="text-xl font-semibold text-gray-700 mb-2">DigiLibrary Center</p>
            <p className="text-sm text-gray-600">DigiLibrary Street, No: 23, Kadıköy, Istanbul</p>
            <p className="text-xs text-gray-500 mt-4">You can visit our physical branch or benefit from our 24/7 digital service</p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">❓ Frequently Asked Questions</h2>
        <div className="space-y-4">
          {/* Book Borrowing */}
          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-blue-700">📚 How many books can I borrow at once?</h3>
            <p className="text-gray-600">
              <strong>Only 1 book!</strong> To help you focus and keep books in fast rotation, you can borrow only 1 book at a time. You can borrow a new book after returning your current one.
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-blue-700">⏰ How long can I borrow books?</h3>
              <p className="text-gray-600">
              You can borrow books for <strong>{LOAN_DURATION_DAYS} days</strong> ({Math.round(LOAN_DURATION_DAYS/7)} weeks). The return date is set automatically and you can see it in your profile.
              </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-blue-700">🔔 Will I get a reminder if I forget the return date?</h3>
              <p className="text-gray-600">
              Yes! On the <strong>{REMINDER_DAY}th day</strong> (1 day before the return date), you will receive a reminder by email.
              </p>
          </div>

          {/* Penalty System */}
          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-red-700">💰 How much is the late return penalty?</h3>
              <p className="text-gray-600">
              For each day late, a <strong>{LATE_FEE_PER_DAY} TL</strong> penalty is applied. For example:
              </p>
            <ul className="list-disc list-inside text-gray-600 mt-2 ml-4">
              <li>1 day late: {LATE_FEE_PER_DAY} TL</li>
              <li>2 days late: {LATE_FEE_PER_DAY * 2} TL</li>
              <li>5 days late: {LATE_FEE_PER_DAY * 5} TL</li>
            </ul>
            <p className="text-gray-600 mt-2">
              The penalty is calculated automatically and can be viewed in your profile.
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-red-700">🚫 How does the ban system work?</h3>
            <p className="text-gray-600">
              If you return a book late, you will be banned for <strong>twice the number of days you were late</strong>:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-2 ml-4">
              <li>1 day late return → {1 * BAN_MULTIPLIER} days ban</li>
              <li>2 days late return → {2 * BAN_MULTIPLIER} days ban</li>
              <li>7 days late return → {7 * BAN_MULTIPLIER} days ban</li>
            </ul>
            <p className="text-gray-600 mt-2">
              During the ban period, you cannot borrow new books. The ban starts automatically and is lifted when the period ends.
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-red-700">⚠️ Example late return scenario?</h3>
            <p className="text-gray-600">
              <strong>Scenario:</strong> You borrowed a book on January 1; the return date will be {LOAN_DURATION_DAYS} days later (e.g. January 15).
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mt-2 space-y-2 text-sm">
              <p>📅 <strong>Reminder day ({REMINDER_DAY}th day):</strong> You receive a reminder email</p>
              <p>⏰ <strong>Return date:</strong> The due date (last day)</p>
              <p>🚨 <strong>Next day after due:</strong> 1 day late → {LATE_FEE_PER_DAY} TL penalty is calculated automatically</p>
              <p>🚨 <strong>2 days late:</strong> {LATE_FEE_PER_DAY * 2} TL penalty (updated nightly)</p>
              <p>📖 <strong>Returned:</strong> You returned the book</p>
              <p>💰 <strong>Result:</strong> {LATE_FEE_PER_DAY * 2} TL penalty + {2 * BAN_MULTIPLIER} days ban (example)</p>
            </div>
          </div>

          {/* Payment and Return */}
          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-green-700">💳 How can I pay penalties?</h3>
            <p className="text-gray-600">
              You can pay late return penalties online by credit card from the <strong>"Late Return Fees"</strong> tab in your profile. After payment, your penalty record is deleted and you can borrow books again.
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-green-700">🔄 How do I return a book?</h3>
            <p className="text-gray-600">
              From the <strong>"My Loans"</strong> page, simply click the <strong>"Return"</strong> button next to your book. The return process is completed instantly and the book becomes available again.
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-purple-700">🆓 Is DigiLibrary free to use?</h3>
            <p className="text-gray-600">
              <strong>Completely free!</strong> Membership, borrowing, and reading services are free. Only if you miss the return date, a daily {LATE_FEE_PER_DAY} TL penalty is applied.
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2">📖 Do I receive physical books?</h3>
            <p className="text-gray-600">
              No, our library is completely digital. You borrow and read books online. No physical delivery is made.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-2">💡 Can I suggest a book?</h3>
            <p className="text-gray-600">
              Absolutely! You can suggest books to add to our collection via the contact form. We will review all suggestions and get back to you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
