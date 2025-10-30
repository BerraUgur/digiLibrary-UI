import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Heart, TrendingUp, Award, Clock } from 'lucide-react';
import { bookService } from '../../../services';

const AboutPage = () => {
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
        console.error('Failed to fetch stats:', error);
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
      <h1 className="text-3xl font-bold mb-6">About Us</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">🏛️ DigiLibrary</h2>
        <p className="mb-4">
          We started our journey in 2024 as DigiLibrary. Our aim is to provide book lovers 
          with easy and fast access to thousands of books. From classics to contemporaries, 
          science to literature, our extensive book collection caters to readers of all ages 
          and interests.
        </p>
        <p className="mb-4">
          With our modern library system, you can find, borrow, and start reading your desired 
          book in seconds. We aim to elevate your reading experience by combining the charm of 
          physical libraries with the convenience of the digital world.
        </p>
        <p>
          With our free membership system, you can borrow books, add them to your favorites, 
          read reviews from other readers, and share your own evaluations. We are here to 
          support reading habits and popularize book culture.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <BookOpen className="text-blue-600 mr-3" size={28} />
            <h2 className="text-xl font-semibold">Our Mission</h2>
          </div>
          <p>
            To create a society where everyone has access to quality books and reading culture is 
            widespread. By bringing technology together with reading, we aim to facilitate access 
            to books for people of all ages and backgrounds, and to support the habit of reading.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="text-blue-600 mr-3" size={28} />
            <h2 className="text-xl font-semibold">Our Vision</h2>
          </div>
          <p>
            To be Turkey's most comprehensive and beloved digital library. With our constantly 
            expanding book collection and innovative features, we aim to provide readers with 
            the best digital reading experience and to carry the understanding of librarianship 
            into the future.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">💎 Our Values</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <Heart className="text-red-500 mr-3 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold mb-1">Accessibility</h3>
              <p className="text-gray-600">We ensure that everyone can access thousands of books for free.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Award className="text-yellow-500 mr-3 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold mb-1">Quality</h3>
              <p className="text-gray-600">We offer carefully selected quality works from prestigious publishers.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Users className="text-green-500 mr-3 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold mb-1">Community</h3>
              <p className="text-gray-600">We create a community where readers share their opinions about books.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Clock className="text-purple-500 mr-3 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold mb-1">User-Friendly</h3>
              <p className="text-gray-600">We provide easy usage, fast search, and practical borrowing system.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6 text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">
            {stats.loading ? '...' : formatNumber(stats.totalBooks)}
          </div>
          <div className="text-gray-700 font-medium">Book Collection</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-6 text-center">
          <div className="text-4xl font-bold text-green-600 mb-2">
            {stats.loading ? '...' : formatNumber(stats.totalUsers)}
          </div>
          <div className="text-gray-700 font-medium">Active Users</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-md p-6 text-center">
          <div className="text-4xl font-bold text-purple-600 mb-2">7/24</div>
          <div className="text-gray-700 font-medium">Uninterrupted Service</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">📚 How It Works?</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600 font-bold text-xl">
              1
            </div>
            <h3 className="font-semibold mb-2">Sign Up</h3>
            <p className="text-gray-600 text-sm">Create a free account and get started immediately</p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600 font-bold text-xl">
              2
            </div>
            <h3 className="font-semibold mb-2">Choose a Book</h3>
            <p className="text-gray-600 text-sm">Find what you want among thousands of books</p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-purple-600 font-bold text-xl">
              3
            </div>
            <h3 className="font-semibold mb-2">Borrow</h3>
            <p className="text-gray-600 text-sm">Borrow the book with one click</p>
          </div>
          
          <div className="text-center">
            <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-orange-600 font-bold text-xl">
              4
            </div>
            <h3 className="font-semibold mb-2">Read and Return</h3>
            <p className="text-gray-600 text-sm">Easily return the book after reading</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;