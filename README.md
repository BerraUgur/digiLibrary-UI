# 📚 DigiLibrary UI

A modern, responsive React-based web application for digital library management with multi-language support, dark mode, and production-ready logging.

## ✨ Features

### Core Features
- 🌍 **Multi-Language Support** - Full Turkish/English translation with 1500+ translations and dynamic language switching
- 🌓 **Dark/Light Mode** - Seamless theme switching with persistent preferences
- 🔐 **Authentication & Authorization** - JWT-based auth with access/refresh tokens and role-based access control
- 📖 **Book Management** - Browse, search, filter books with pagination and advanced filters
- ⭐ **Favorites System** - Save and manage favorite books
- 📝 **Reviews & Ratings** - Add, edit, delete reviews with 1-5 star ratings
- 📚 **Loan Management** - Borrow books, track loans, view due dates, automated reminders

### Payment & Financial
- 💳 **Payment Integration** - Stripe checkout for late fee payments
- 💰 **Late Fee System** - Automatic calculation (5 TL/day), payment tracking
- 📊 **Financial Tracking** - View payment history, pending fees

### User Features
- 👤 **User Profile** - Manage profile, change password, view statistics
- 📧 **User Messages** - Receive admin notifications and system messages
- 🔔 **Email Notifications** - Automated reminders for due dates and system updates
- 🚫 **Ban System** - Automatic temporary bans for late returns (2x days late)

### Admin Features
- 📊 **Admin Dashboard** - Comprehensive statistics, user management, loan management
- 📚 **Book Administration** - Add, edit, delete books with image upload (GridFS)
- 👥 **User Management** - View users, manage bans, track activity
- 📋 **Loan Management** - Monitor all loans, process returns, export to PDF
- 💬 **Message System** - View contact messages, reply to users, send notifications

### Technical Features
- 🎨 **Modern UI/UX** - Tailwind CSS with smooth animations and transitions
- 📱 **Responsive Design** - Mobile-first approach, works on all devices
- ✅ **Form Validation** - Client-side validation with Yup and React Hook Form
- 🔔 **Toast Notifications** - Real-time feedback for all user actions
- 🌐 **Remote Logging** - Production error tracking with automatic log forwarding
- 🛡️ **Security** - Automatic token refresh, secure storage, XSS protection
- ⚡ **Performance** - Code splitting, lazy loading, optimized bundle

## 🚀 Tech Stack

### Core Framework & Build
- **Framework:** React 19
- **Build Tool:** Vite 6.3
- **Language:** JavaScript (ES2022+)

### Routing & State
- **Routing:** React Router v6.30
- **State Management:** React Context API (Theme, Language, Auth)

### Styling & UI
- **CSS Framework:** Tailwind CSS 3.4
- **Icons:** Lucide React 0.511
- **Notifications:** React Toastify 11.0
- **Animations:** CSS Transitions

### Forms & Validation
- **Form Handling:** React Hook Form 7.56
- **Validation:** Yup 1.6
- **Resolver:** @hookform/resolvers 5.0

### Code Quality
- **Linting:** ESLint 9.22 with React plugins
- **PostCSS:** Autoprefixer for browser compatibility

### Build & Dev Tools
- **Package Manager:** npm
- **Dev Server:** Vite with Hot Module Replacement
- **Production:** Optimized builds with code splitting

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

# Remote Logging (Optional)
VITE_ENABLE_REMOTE_LOGS=false
VITE_LOG_API_KEY=optional-secret-key

# Build Configuration
VITE_APP_NAME=DigiLibrary
VITE_APP_VERSION=1.0.0
```

**Environment Variables Explained:**
- `VITE_API_BASE_URL` - Backend API URL (required)
- `VITE_ENABLE_REMOTE_LOGS` - Enable remote logging to backend (set to `true` for production)
- `VITE_LOG_API_KEY` - Optional API key for remote logging endpoint
- Variables prefixed with `VITE_` are exposed to the frontend code

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
digiLibrary-ui/
├── src/
│   ├── app/                     # Application core
│   │   ├── App.jsx             # Main app component with routing
│   │   ├── main.jsx            # Entry point with providers
│   │   ├── routes.jsx          # Centralized route configuration
│   │   └── index.css           # Global styles & Tailwind imports
│   │
│   ├── assets/                 # Static assets (images, fonts)
│   │
│   ├── components/             # Reusable components
│   │   ├── Layout/            # Layout components
│   │   │   ├── Header.jsx     # Navigation with auth, theme, language
│   │   │   └── Footer.jsx     # Site footer
│   │   └── UI/                # UI components
│   │       ├── buttons/       # Button components
│   │       │   ├── Button.jsx            # Generic button
│   │       │   └── ThemeToggle.jsx       # Dark/Light toggle
│   │       └── modals/        # Modal components
│   │           └── ConfirmModal.jsx      # Confirmation dialog
│   │
│   ├── constants/              # Application constants
│   │   ├── bookConstants.js   # Book categories, status enums
│   │   ├── loanConstants.js   # Loan duration (14 days), late fees (5 TL/day), ban rules
│   │   └── rolesConstants.js  # User roles (USER, ADMIN)
│   │
│   ├── context/               # React Context providers
│   │   ├── ThemeContext.js    # Theme state management
│   │   ├── ThemeProvider.jsx  # Theme provider with localStorage
│   │   ├── LanguageContext.js # Language state management
│   │   ├── LanguageProvider.jsx # Language provider with persistence
│   │   ├── useLanguage.js     # Language hook for components
│   │   └── translations.js    # 1500+ TR/EN translations
│   │
│   ├── features/              # Feature modules (domain-driven)
│   │   ├── auth/             # Authentication & Authorization
│   │   │   ├── components/   # LoginForm, RegisterForm
│   │   │   ├── context/      # AuthContext, useAuth hook
│   │   │   ├── pages/        # Login, Register, ForgotPassword, ResetPassword
│   │   │   └── schemas/      # Yup validation schemas
│   │   │
│   │   ├── books/            # Books feature
│   │   │   ├── components/   # BookCard, BookList, BookFilters
│   │   │   ├── pages/        # BooksPage, BookDetailPage
│   │   │   └── styles/       # Feature-specific styles
│   │   │
│   │   ├── user/             # User features
│   │   │   ├── pages/        # ProfilePage, MyLoansPage, LateFeesPage, FavoritesPage
│   │   │   └── styles/       # User feature styles
│   │   │
│   │   ├── admin/            # Admin features
│   │   │   ├── pages/        # AdminDashboard, AdminUsers, AdminLoans, AdminBooks, AdminMessages
│   │   │   └── styles/       # Admin styles
│   │   │
│   │   └── general/          # General pages
│   │       └── pages/        # HomePage, AboutPage, ContactPage
│   │
│   ├── services/             # API services
│   │   ├── index.js          # Service exports
│   │   └── features/         # Feature-specific services
│   │       ├── http.js              # Axios instance with interceptors
│   │       ├── authService.js       # Login, register, refresh token, logout
│   │       ├── booksService.js      # Get books, book details, add/edit/delete
│   │       ├── loanService.js       # Borrow, return, get loans
│   │       ├── userService.js       # Profile, password change
│   │       ├── reviewService.js     # Add, delete reviews
│   │       ├── favoriteService.js   # Add, remove favorites
│   │       ├── paymentService.js    # Stripe checkout session
│   │       ├── messageService.js    # Admin messages (unused - deleted)
│   │       └── contactService.js    # Contact form submission
│   │
│   └── utils/                # Utility functions
│       ├── errorTranslator.js # Backend error message translator
│       └── remoteLogger.js    # Production logging with console shim
│
├── public/                   # Public assets (served directly)
├── .env.example             # Environment template
├── .gitignore              # Git ignore rules
├── eslint.config.js        # ESLint configuration
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── postcss.config.js       # PostCSS config for Tailwind
├── tailwind.config.js      # Tailwind CSS configuration
├── vite.config.js          # Vite build configuration
└── README.md               # This file
```

## 🎯 Key Features Explained

### 🌍 Multi-Language System
- **Languages:** Turkish (TR) and English (EN)
- **Coverage:** 1500+ translations across the entire application
  - All UI text, forms, validation messages
  - Toast notifications, error messages
  - Email content, system messages
- **Switching:** Flag icon in header for instant language change
- **Persistence:** Language preference saved in localStorage
- **Structure:** Centralized translation dictionary in `translations.js`

### 🌓 Theme System
- **Modes:** Light and Dark mode
- **Toggle:** Sun/Moon icon in header for instant switching
- **Persistence:** Theme preference saved in localStorage
- **Coverage:** All components, forms, modals styled for both themes
- **Smooth Transitions:** Seamless animations between themes
- **Tailwind Integration:** Uses `dark:` prefix for dark mode styles

### 🔐 Authentication & Authorization
- **Login/Register:** Form validation with Yup schemas
- **JWT Tokens:** Access token (15min) + Refresh token (7 days)
- **Auto Token Refresh:** Automatic token renewal before expiration
- **Protected Routes:** Role-based access control (USER, ADMIN)
- **Auto Logout:** Automatic logout on token expiration or invalid refresh
- **Password Reset:** Email-based password recovery with secure tokens
- **Secure Storage:** Tokens stored in localStorage with auto-cleanup

### 📚 Book Features
- **Browse Books:** Grid view with pagination (12 per page)
- **Search & Filter:** By title, author, category, availability
- **Categories:** Fiction, Science, History, Art, Technology
- **Book Details:** Full information with reviews and ratings
- **Favorites:** Add/remove books from favorites list
- **Reviews:** Add, edit, delete reviews with 1-5 star ratings
- **Borrow System:** Check availability, borrow with due date calculation
- **Image Upload:** Book covers stored in GridFS (backend)

### 📋 Loan System
- **Loan Duration:** 14 days from borrow date
- **Email Reminders:** Automated reminder 1 day before due date
- **Late Fee Calculation:** 5 TL per day, calculated automatically at midnight
- **Ban System:** Temporary ban = 2x days late (e.g., 3 days late = 6 days ban)
- **Payment:** Stripe integration for late fee payments
- **Return Process:** Admin-managed with automatic fee calculation

### 👤 User Dashboard
- **Profile Management:** Update username, email, view statistics
- **Password Change:** Secure password update with validation
- **My Loans:** View active and past loans with status
- **Late Fees:** View pending fees, payment history, pay via Stripe
- **Favorites:** Manage favorite books collection
- **Ban Status:** View ban expiration if applicable

### 📊 Admin Dashboard
- **Statistics:** Total users, books, active loans, late fees
- **User Management:** View all users, ban/unban, view activity
- **Book Management:** Add, edit, delete books with image upload
- **Loan Management:** View all loans, process returns, export to PDF
- **Message System:** View contact messages, reply to users, send notifications
- **PDF Export:** Export loan reports with filters

### 💳 Payment System
- **Provider:** Stripe Checkout
- **Currency:** Turkish Lira (TL)
- **Process:**
  1. User selects late fees to pay
  2. Redirected to Stripe Checkout
  3. Payment processed securely
  4. Success/Cancel redirects handled
  5. Late fee status updated automatically
- **Security:** No card data stored locally
- **Receipt:** Stripe provides payment receipt

### 🌐 Remote Logging System
- **Console Shim:** Intercepts all console.log/warn/error calls
- **Automatic Forwarding:** Sends logs to backend `/api/logs` endpoint
- **Log Levels:** info, warn, error, debug
- **User Context:** Includes user ID, username in logs
- **Error Details:** Stack traces, error messages, metadata
- **Rate Limiting:** 60 requests per minute per IP
- **Storage:** Backend persists logs inside the shared MongoDB `logs` collection
- **Production Only:** Enabled via `VITE_ENABLE_REMOTE_LOGS=true`

### 🔔 Email Notifications
- **Automated Reminders:** Daily cron job at 09:00 sends reminders for books due tomorrow
- **Late Fee Alerts:** Email notifications when late fees are calculated
- **Contact Confirmations:** User receives confirmation when contact message is sent
- **Password Reset:** Secure link sent via email for password reset
- **Admin Replies:** Email sent when admin replies to contact message

---

## 🔧 Additional Features & Technical Details

### Authentication Flow
1. User registers/logs in → Receives access token (15min) + refresh token (7 days)
2. Access token stored in localStorage, sent in Authorization header
3. Before expiration, frontend automatically refreshes using refresh token
4. On token refresh failure → User logged out, redirected to login
5. Refresh token rotated on each use for security

### Remote Logger Details
- **Console Shim:** Intercepts `console.log()`, `console.warn()`, `console.error()`
- **Forward Mode:** `{ forward: true }` logs to both console AND remote server
- **Batching:** Logs buffered and sent in batches every 4 seconds (max 12 per batch)
- **Retry Queue:** Failed logs queued and retried with exponential backoff
- **Offline Support:** Logs persisted in localStorage (max 200 items) when offline
- **User Context:** Automatically includes userId and username from localStorage
- **Production Only:** Enabled via `VITE_ENABLE_REMOTE_LOGS=true`

### Form Validation
- **Library:** React Hook Form + Yup schemas
- **Modes:** `onBlur` for better UX (validates on field blur)
- **Real-time Errors:** Error messages displayed immediately
- **Translation Support:** Error messages fully translated (TR/EN)
- **Common Validations:**
  - Email format validation
  - Password strength (min 6 chars)
  - Required fields
  - String length constraints
  - Pattern matching (username, etc.)

### Theme System Implementation
- **Context API:** ThemeContext provides theme state globally
- **localStorage:** Theme persisted as `theme` (light/dark)
- **Tailwind CSS:** Uses `dark:` prefix for dark mode styles
- **Body Class:** `<html>` element gets `dark` class when dark mode active
- **Smooth Transition:** CSS transitions for seamless theme changes

### Routing Architecture
- **Centralized Routes:** All routes defined in `routes.jsx`
- **Protected Routes:** `ProtectedRoute` component checks authentication
- **Role-Based Routes:** `AdminRoute` component checks for ADMIN role
- **Lazy Loading:** Route components loaded on-demand for performance
- **Route Guards:**
  - Unauthenticated users redirected to `/login`
  - Non-admin users redirected to `/` when accessing admin routes
  - Already authenticated users can't access `/login` or `/register`

### State Management
- **Context Providers:** Theme, Language, Auth contexts
- **Local State:** Component-specific state with `useState`
- **Form State:** Managed by React Hook Form
- **No Redux:** Context API sufficient for this application size

### Build & Deployment
- **Production Build:** `npm run build` creates optimized bundle in `dist/`
- **Code Splitting:** Automatic code splitting by route
- **Asset Optimization:** Images optimized, CSS minified
- **Bundle Size:** ~500KB gzipped (with all dependencies)
- **Browser Support:** Modern browsers (ES2020+)
- **Deploy:** Can be deployed to Vercel, Netlify, or any static host

### Performance Optimizations
- **Vite HMR:** Hot Module Replacement for instant updates in dev
- **Lazy Loading:** Routes loaded on demand
- **Memoization:** React.memo for expensive components (if needed)
- **Debouncing:** Search inputs debounced to reduce API calls
- **Pagination:** All lists paginated to reduce data transfer

## 📚 Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run ESLint for code quality
npm run lint

# Fix ESLint errors automatically
npm run lint:fix
```

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📦 Dependencies Overview

### Production Dependencies (12)
- `react` & `react-dom` - Core framework
- `react-router-dom` - Routing
- `react-hook-form` - Form handling
- `@hookform/resolvers` - Form validation resolver
- `yup` - Schema validation
- `lucide-react` - Icon library
- `react-toastify` - Toast notifications

### Dev Dependencies (11)
- `vite` - Build tool
- `@vitejs/plugin-react` - React plugin for Vite
- `tailwindcss` & `autoprefixer` & `postcss` - Styling
- `eslint` & plugins - Code quality
- TypeScript types for better IDE support

Total bundle size: ~150KB (gzipped, without code splitting)

## 🔒 Security Considerations

- **XSS Protection:** React escapes all rendered content by default
- **CSRF Protection:** JWT tokens in Authorization header (not cookies)
- **Input Sanitization:** All inputs validated before sending to API
- **Secure Storage:** No sensitive data in localStorage except tokens
- **HTTPS Required:** Use HTTPS in production
- **Environment Variables:** Never commit `.env` to git
- **Token Expiration:** Short-lived access tokens, long-lived refresh tokens
- **Auto Logout:** Users logged out on token expiration

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
