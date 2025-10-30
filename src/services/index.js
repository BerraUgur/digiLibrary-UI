// Re-export per-feature services from the features/ folder
export { default as apiRequest } from './features/http';
export { authService } from './features/authService';
export { bookService } from './features/booksService';
export { userService } from './features/userService';
export { loanService } from './features/loanService';
export { reviewService } from './features/reviewService';
export { favoriteService } from './features/favoriteService';
export { contactService } from './features/contactService';
export { messageService } from './features/messageService';
export { paymentService } from './features/paymentService';

// Default export kept for backward compatibility (most files import default apiRequest)
import apiRequestDefault from './features/http';
export default apiRequestDefault;