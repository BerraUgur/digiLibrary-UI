# 📚 DigiLibrary UI

A modern, responsive React-based web application for digital library management with multi-language support and dark mode.

## ✨ Features

- 🌍 **Multi-Language Support** - Full Turkish/English translation with dynamic language switching
- 🌓 **Dark/Light Mode** - Seamless theme switching with persistent preferences
- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control
- 📖 **Book Management** - Browse, search, filter books with advanced features
- ⭐ **Favorites System** - Save and manage favorite books
- 📝 **Reviews & Ratings** - Add reviews with 1-5 star ratings
- 📚 **Loan Management** - Borrow books, track loans, view due dates
- 💳 **Payment Integration** - Stripe checkout for late fee payments
- 👥 **User Profile** - Manage profile, view loan history, late fees
- 📊 **Admin Dashboard** - User management, loan management, statistics
- 📧 **Contact System** - Send messages with email notifications
- 🎨 **Modern UI/UX** - Tailwind CSS with smooth animations and transitions
- 📱 **Responsive Design** - Mobile-first approach, works on all devices
- ✅ **Form Validation** - Client-side validation with Yup
- 🔔 **Toast Notifications** - Real-time feedback for all actions
- 🌐 **Remote Logging** - Production error tracking and monitoring

## 🚀 Tech Stack

- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS
- **State Management:** React Context API
- **Routing:** React Router v6
- **Form Handling:** React Hook Form
- **Validation:** Yup
- **HTTP Client:** Axios
- **Icons:** Lucide React
- **Notifications:** React Toastify
- **Animations:** CSS Transitions
- **Code Quality:** ESLint
- **Build Tool:** Vite

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- DigiLibrary API running (backend server)

## ⚙️ Installation

1. **Clone the repository**
```bash
git clone https://github.com/BerraUgur/digiLibrary-UI.git
cd digiLibrary-UI
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
```bash
cp .env.example .env
```

4. **Configure environment variables**

Create `.env` file in the root directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api

5. **Start development server**
```bash
npm run dev
```

6. **Build for production**
```bash
npm run build
```

7. **Preview production build**
```bash
npm run preview
```

## 🌐 Application Structure

```
digiLibrary-UI/
├── src/
│   ├── app/                    # Application core
│   │   ├── App.jsx            # Main app component
│   │   ├── main.jsx           # Entry point
│   │   ├── routes.jsx         # Route configuration
│   │   └── index.css          # Global styles
│   ├── assets/                # Static assets
│   ├── components/            # Reusable components
│   │   ├── Layout/           # Layout components
│   │   │   ├── Header.jsx    # Navigation header
│   │   │   └── Footer.jsx    # Site footer
│   │   └── UI/               # UI components
│   │       ├── buttons/      # Button components
│   │       │   ├── Button.jsx
│   │       │   └── ThemeToggle.jsx
│   │       └── modals/       # Modal components
│   │           ├── Modal.jsx
│   │           └── ConfirmModal.jsx
│   ├── constants/             # Application constants
│   │   ├── bookConstants.js  # Book categories, status
│   │   ├── loanConstants.js  # Loan duration, status
│   │   └── rolesConstants.js # User roles
│   ├── context/              # React Context providers
│   │   ├── ThemeContext.js   # Theme state
│   │   ├── ThemeProvider.jsx # Theme provider
│   │   ├── LanguageContext.js # Language state
│   │   ├── LanguageProvider.jsx # Language provider
│   │   ├── useLanguage.js    # Language hook
│   │   └── translations.js   # Translation dictionary
│   ├── features/             # Feature modules
│   │   ├── auth/            # Authentication
│   │   │   ├── components/  # Login/Register forms
│   │   │   ├── context/     # Auth context
│   │   │   ├── pages/       # Auth pages
│   │   │   └── schemas/     # Validation schemas
│   │   ├── books/           # Books feature
│   │   │   ├── components/  # Book components
│   │   │   ├── pages/       # Book pages
│   │   │   └── styles/      # Feature styles
│   │   ├── user/            # User features
│   │   │   ├── pages/       # Profile, loans, fees
│   │   │   └── styles/      # Feature styles
│   │   ├── admin/           # Admin features
│   │   │   ├── pages/       # Admin dashboards
│   │   │   └── styles/      # Admin styles
│   │   └── general/         # General pages
│   │       └── pages/       # Home, About, Contact
│   ├── services/            # API services
│   │   └── features/       # Feature services
│   │       ├── authService.js
│   │       ├── booksService.js
│   │       ├── loanService.js
│   │       ├── userService.js
│   │       ├── reviewService.js
│   │       ├── favoriteService.js
│   │       ├── paymentService.js
│   │       ├── messageService.js
│   │       ├── contactService.js
│   │       └── http.js      # Axios configuration
│   └── utils/               # Utility functions
│       ├── clearStorage.js  # Storage helpers
│       └── remoteLogger.js  # Error logging
├── .env.example             # Environment template
├── .gitignore              # Git ignore rules
├── eslint.config.js        # ESLint configuration
├── index.html              # HTML entry point
├── package.json            # Dependencies
├── postcss.config.js       # PostCSS config
├── tailwind.config.js      # Tailwind config
├── vite.config.js          # Vite configuration
└── README.md               # Documentation
```

## 🎯 Key Features Explained

### 🌍 Multi-Language System
- **Languages:** Turkish (TR) and English (EN)
- **Coverage:** All UI text, forms, validation messages, toasts, error messages
- **Switching:** Flag icon in header for instant language change
- **Persistence:** Language preference saved in localStorage
- **1500+ translations** across the entire application

### 🌓 Theme System
- **Modes:** Light and Dark mode
- **Toggle:** Sun/Moon icon in header
- **Persistence:** Theme preference saved in localStorage
- **Scope:** All components, forms, modals styled for both themes
- **Smooth transitions** between modes

### 🔐 Authentication & Authorization
- **Login/Register:** Form validation with Yup
- **JWT Tokens:** Access and refresh token management
- **Protected Routes:** Role-based access control
- **Auto-logout:** Expired token handling
- **Password Reset:** Email-based password recovery

### 📚 Book Features
- **Browse Books:** Grid view with pagination
- **Search & Filter:** By title, author, category, availability
- **Book Details:** Full information, reviews, ratings
- **Favorites:** Add/remove books from favorites
- **Reviews:** Add, edit, delete reviews with ratings
- **Borrow System:** Check availability, borrow books

### 👤 User Dashboard
- **Profile Management:** Update personal information
- **My Loans:** View active and past loans
- **Late Fees:** View fee history and make payments
- **Messages:** Receive admin notifications
- **Password Change:** Update password securely

### 👑 Admin Dashboard
- **User Management:** 
  - View all users with filtering
  - Ban/unban users with duration
  - Grant/remove admin privileges
  - Delete users
  - Send direct emails
- **Loan Management:**
  - View all loans
  - Filter by status, date, user
  - Return books manually
  - Waive late fees
  - Export to PDF reports
- **Statistics:** User counts, active loans, revenue

### 💳 Payment System
- **Stripe Integration:** Secure checkout for late fees
- **Payment Success/Cancel:** Redirect handling
- **Payment History:** Track all transactions
- **Automatic Calculations:** Late fees calculated by backend

### 📧 Contact System
- **Contact Form:** Send messages to admins
- **Email Notifications:** Automated email sending
- **Message Management:** Admin can view all messages

## 🔗 Main Routes

### Public Routes
- `/` - Home page
- `/about` - About page
- `/contact` - Contact form
- `/books` - Browse books (limited features)
- `/books/:id` - Book details
- `/login` - Login page
- `/register` - Register page
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset confirmation

### Protected User Routes
- `/profile` - User profile
- `/my-loans` - User's borrowed books
- `/late-fees` - Late fee history
- `/messages` - User messages

### Protected Admin Routes
- `/admin/users` - User management
- `/admin/loans` - Loan management

## 🎨 UI Components

### Layout Components
- **Header:** Navigation, language toggle, theme toggle, user menu
- **Footer:** Links, copyright information

### Reusable Components
- **Button:** Primary, secondary, danger variants
- **Modal:** Customizable modal dialogs
- **ConfirmModal:** Confirmation dialogs with actions
- **ThemeToggle:** Dark/light mode switcher
- **BookItem:** Book card component
- **BookInput:** Add/edit book form

## 🛡️ Security Features

- **XSS Protection:** All user inputs sanitized
- **CSRF Protection:** Token-based form submissions
- **Secure Storage:** Tokens in localStorage with proper cleanup
- **Input Validation:** Client-side validation before API calls
- **Error Handling:** Global error boundary and logging
- **Rate Limiting:** Handled by backend API

### Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules
rm package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
npm run dev
```

### Language Not Switching
- Check browser console for errors
- Verify translations.js has both TR and EN sections
- Clear localStorage: `localStorage.clear()`

### Theme Not Persisting
- Check localStorage permissions
- Verify ThemeProvider is wrapping App
- Clear cache and reload

## 📄 License

This project is licensed under the MIT License.
