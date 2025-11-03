import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Heart, TrendingUp, Award, Clock } from 'lucide-react';
import { bookService } from '../../../services';
import { useLanguage } from '../../../context/useLanguage';
import remoteLogger from '../../../utils/remoteLogger';

const AboutPage = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalUsers: 0,
    totalLoans: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await bookService.getLibraryStats();
        setStats({
          totalBooks: data.totalBooks,
          totalUsers: data.totalUsers,
          totalLoans: data.totalLoans,
          loading: false
        });
      } catch (error) {
        remoteLogger.error('Failed to fetch stats', { error: error?.message || String(error), stack: error?.stack });
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K+`;
    }
    return `${num}+`;
  };

  return (
    <div className="about-page container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">{t.about.title}</h1>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">🏛️ {t.about.digiLibrary}</h2>
        <p className="mb-4 dark:text-slate-300">
          {t.about.digiLibraryDesc1}
        </p>
        <p className="mb-4 dark:text-slate-300">
          {t.about.digiLibraryDesc2}
        </p>
        <p className="dark:text-slate-300">
          {t.about.digiLibraryDesc3}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <BookOpen className="text-blue-600 mr-3" size={28} />
            <h2 className="text-xl font-semibold">{t.about.ourMission}</h2>
          </div>
          <p className="dark:text-slate-300">
            {t.about.ourMissionDesc}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="text-blue-600 mr-3" size={28} />
            <h2 className="text-xl font-semibold">{t.about.ourVision}</h2>
          </div>
          <p className="dark:text-slate-300">
            {t.about.ourVisionDesc}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">💎 {t.about.ourValues}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <Heart className="text-red-500 mr-3 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold mb-1">{t.about.accessibility}</h3>
              <p className="text-gray-600 dark:text-slate-300">{t.about.accessibilityDesc}</p>
            </div>
          </div>

          <div className="flex items-start">
            <Award className="text-yellow-500 mr-3 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold mb-1">{t.about.quality}</h3>
              <p className="text-gray-600 dark:text-slate-300">{t.about.qualityDesc}</p>
            </div>
          </div>

          <div className="flex items-start">
            <Users className="text-green-500 mr-3 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold mb-1">{t.about.community}</h3>
              <p className="text-gray-600 dark:text-slate-300">{t.about.communityDesc}</p>
            </div>
          </div>

          <div className="flex items-start">
            <TrendingUp className="text-orange-500 mr-3 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold mb-1">{t.about.innovation}</h3>
              <p className="text-gray-600 dark:text-slate-300">{t.about.innovationDesc}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">📊 {t.about.ourNumbers}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Blue stat - keeps bluish gradient in dark mode */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-200 mb-2">
              {stats.loading ? '...' : formatNumber(stats.totalBooks)}
            </div>
            <div className="text-gray-700 dark:text-white font-medium">{t.about.totalBooks}</div>
          </div>

          {/* Green stat - keeps greenish gradient in dark mode */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-green-600 dark:text-green-200 mb-2">
              {stats.loading ? '...' : formatNumber(stats.totalUsers)}
            </div>
            <div className="text-gray-700 dark:text-white font-medium">{t.about.totalUsers}</div>
          </div>

          {/* Purple stat - keeps purpleish gradient in dark mode */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-purple-600 dark:text-purple-200 mb-2">
              {stats.loading ? '...' : formatNumber(stats.totalLoans)}
            </div>
            <div className="text-gray-700 dark:text-white font-medium">{t.about.totalLoans}</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">📚 {t.about.howItWorks}</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="bg-blue-100 dark:bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600 dark:text-blue-300 font-bold text-xl">
              1
            </div>
            <h3 className="font-semibold mb-2">{t.about.step1}</h3>
            <p className="text-gray-600 dark:text-slate-300 text-sm">{t.about.step1Desc}</p>
          </div>

          <div className="text-center">
            <div className="bg-green-100 dark:bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600 dark:text-green-300 font-bold text-xl">
              2
            </div>
            <h3 className="font-semibold mb-2">{t.about.step2}</h3>
            <p className="text-gray-600 dark:text-slate-300 text-sm">{t.about.step2Desc}</p>
          </div>

          <div className="text-center">
            <div className="bg-purple-100 dark:bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-purple-600 dark:text-purple-300 font-bold text-xl">
              3
            </div>
            <h3 className="font-semibold mb-2">{t.about.step3}</h3>
            <p className="text-gray-600 dark:text-slate-300 text-sm">{t.about.step3Desc}</p>
          </div>

          <div className="text-center">
            <div className="bg-orange-100 dark:bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-orange-600 dark:text-orange-300 font-bold text-xl">
              4
            </div>
            <h3 className="font-semibold mb-2">{t.about.step4}</h3>
            <p className="text-gray-600 dark:text-slate-300 text-sm">{t.about.step4Desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;