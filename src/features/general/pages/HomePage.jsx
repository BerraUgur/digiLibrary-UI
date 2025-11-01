import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookService } from '../../../services';
import { LOAN_DURATION_DAYS } from '../../../constants/loanConstants';
import { BookOpen, Users, Clock, Shield } from 'lucide-react';
import { useAuth } from '../../auth/context/useAuth';
import { useLanguage } from '../../../context/useLanguage';
import remoteLogger from '../../../utils/remoteLogger';

const HomePage = () => {
  const [popular, setPopular] = useState([]);
  const [popularLoading, setPopularLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t, translateCategory } = useLanguage();

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setPopularLoading(true);
        const data = await bookService.getPopularBooks(6, 30);
        if (!ignore) setPopular(Array.isArray(data) ? data : []);
      } catch (e) {
        remoteLogger.warn('[HomePage] popular fetch error', { error: e?.message || String(e), stack: e?.stack });
      } finally {
        if (!ignore) setPopularLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

  return (
    <div className="home-page container mx-auto py-6 px-4">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-2xl p-8 mb-10 shadow-lg">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t.home.heroTitle}</h1>
          <p className="text-lg mb-6">
            {t.home.heroDescription}
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex flex-col items-center text-center">
          <BookOpen className="text-blue-600 mb-3 dark:text-blue-300" size={32} />
          <h3 className="font-bold text-lg mb-2 dark:text-slate-100">{t.home.extensiveCollection}</h3>
          <p className="text-gray-800 dark:text-slate-200">{t.home.extensiveCollectionDesc}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex flex-col items-center text-center">
          <Clock className="text-blue-600 mb-3 dark:text-blue-300" size={32} />
          <h3 className="font-bold text-lg mb-2 dark:text-slate-100">{t.home.easyBorrowing}</h3>
          <p className="text-gray-800 dark:text-slate-200">{t.home.easyBorrowingDesc.replace('{{days}}', LOAN_DURATION_DAYS)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex flex-col items-center text-center">
          <Shield className="text-blue-600 mb-3 dark:text-blue-300" size={32} />
          <h3 className="font-bold text-lg mb-2 dark:text-slate-100">{t.home.secureSystem}</h3>
          <p className="text-gray-800 dark:text-slate-200">{t.home.secureSystemDesc}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex flex-col items-center text-center">
          <Users className="text-blue-600 mb-3 dark:text-blue-300" size={32} />
          <h3 className="font-bold text-lg mb-2 dark:text-slate-100">{t.home.communityReviews}</h3>
          <p className="text-gray-800 dark:text-slate-200">{t.home.communityReviewsDesc}</p>
        </div>
      </div>

      {/* Popular Books Section */}
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-6 dark:text-slate-100">{t.home.popularBooks}</h2>
        <div className="border-b border-gray-200 dark:border-slate-700 mb-6"></div>
        {popularLoading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">{t.general.loading}</div>
        ) : popular.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-gray-500">{t.home.noPopularBooks}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {popular.map((b) => (
              <div key={b._id} className="bg-white dark:bg-slate-800 rounded-xl shadow hover:shadow-md transition p-4 flex flex-col items-center text-center">
                <div className="mb-3 cursor-pointer" onClick={() => navigate(`/books/${b._id}`)}>
                  <img
                    src={b.imageUrl || '/book-placeholder.jpg'}
                    alt={b.title}
                    className="h-40 w-full object-cover rounded"
                    onError={(e) => { e.target.src = '/book-placeholder.jpg'; }}
                  />
                </div>
                <h3 className="font-semibold text-lg mb-1 line-clamp-1 dark:text-slate-100">{b.title}</h3>
                <p className="text-sm text-gray-600 dark:text-slate-300 mb-1 line-clamp-1">{b.author}</p>
                <p className="text-xs inline-flex w-fit bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200 px-2 py-1 rounded mb-2">{translateCategory(b.category)}</p>
                <div className="flex items-center justify-center gap-2 text-xs flex-wrap mb-1">
                  <span className="bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-200 px-2 py-1 rounded">{b.borrowCount} {t.home.borrows}</span>
                  {typeof b.reviewCount === 'number' && (
                    <span className="bg-purple-50 dark:bg-slate-700 text-purple-700 dark:text-purple-200 px-2 py-1 rounded">{b.reviewCount} {t.books.reviews}</span>
                  )}
                  {b.avgRating != null && (
                    <span className="bg-amber-50 dark:bg-slate-700 text-amber-700 dark:text-amber-200 px-2 py-1 rounded flex items-center gap-1">
                      <span className="text-amber-500">★</span>{b.avgRating}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="text-center mt-8">
          <Link to="/books">
            <button className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition">
              {t.home.viewDetails}
            </button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-bold mb-2">{t.home.whyUs || 'Why Us?'}</h3>
          <p>
            {t.home.whyUsDesc || 'Our platform, which combines traditional library experience with modern technology, increases reading pleasure with its user-friendly interface and extensive collection.'}
          </p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-700 text-white rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-bold mb-2">{LOAN_DURATION_DAYS} {t.home.daysFree || 'Days Free Borrowing'}</h3>
          <p>{t.home.daysFreeDesc ? t.home.daysFreeDesc.replace('{{days}}', LOAN_DURATION_DAYS) : `You can borrow all our books for free for ${LOAN_DURATION_DAYS} days.`}</p>
        </div>
      </div>

      {/* Membership Call-to-Action (for guests only) */}
      {!isAuthenticated && (
        <div className="bg-blue-100 dark:bg-slate-700 rounded-xl p-8 text-center mb-6">
          <h3 className="text-2xl font-bold mb-3 text-blue-800 dark:text-blue-300">{t.home.signUpNow || 'Sign Up Now, Start Reading!'}</h3>
          <p className="mb-6 text-blue-700 dark:text-blue-200">{t.home.signUpDesc || 'Sign up now for free access to thousands of books and exclusive benefits.'}</p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Link to="/register">
              <button className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 transition">
                {t.header.register}
              </button>
            </Link>
            <Link to="/login">
              <button className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-lg border border-blue-600 hover:bg-blue-50 transition">
                {t.header.login}
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
