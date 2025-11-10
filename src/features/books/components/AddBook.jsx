import { useState, useRef } from "react";
import Button from "../../../components/UI/buttons/Button";
import { bookService } from "../../../services";
import { useAuth } from "../../auth/context/useAuth";
import { useLanguage } from "../../../context/useLanguage";
import { BOOK_CATEGORIES } from "../../../constants/bookConstants";
import { toast } from "react-toastify";
import { X, Plus } from "lucide-react";
import "../styles/AddBook.css";

const AddBook = ({ onAddBook, setIsShowModal }) => {
  const { user } = useAuth();
  const { t, translateCategory } = useLanguage();
  const [book, setBook] = useState({
    title_tr: "",
    title_en: "",
    description_tr: "",
    description_en: "",
    authors: [""],
    categories: [],
    imageUrl: "",
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  function handleChange({ target: { name, value } }) {
    // If imageUrl is being set, clear file
    if (name === 'imageUrl' && value.trim()) {
      setFile(null);
      setPreview(null);
    }
    setBook({ ...book, [name]: value });
  }

  function handleAuthorChange(index, value) {
    const newAuthors = [...book.authors];
    newAuthors[index] = value;
    setBook({ ...book, authors: newAuthors });
  }

  function addAuthorField() {
    setBook({ ...book, authors: [...book.authors, ""] });
  }

  function removeAuthorField(index) {
    if (book.authors.length > 1) {
      setBook({ ...book, authors: book.authors.filter((_, i) => i !== index) });
    }
  }

  function handleCategoryToggle(category) {
    const isSelected = book.categories.includes(category);
    if (isSelected) {
      setBook({ ...book, categories: book.categories.filter(c => c !== category) });
    } else {
      setBook({ ...book, categories: [...book.categories, category] });
    }
  }

  function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
    if (f) {
      // Clear imageUrl when file is selected
      setBook({ ...book, imageUrl: '' });
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!user) {
      toast.error(t.books.mustBeLoggedIn);
      return;
    }

    const validAuthors = book.authors.filter(a => a.trim() !== "");
    if (!book.title_tr.trim() || !book.title_en.trim() || !book.description_tr.trim() || !book.description_en.trim() || validAuthors.length === 0 || book.categories.length === 0) {
      toast.error(t.books.fillAllFields);
      return;
    }

    // Check if image is provided (either file or URL)
    if (!file && !book.imageUrl.trim()) {
      toast.error(t.books.imageRequired || 'Kitap resmi zorunludur. Lütfen bir resim yükleyin veya URL girin.');
      return;
    }

    try {
      setLoading(true);
      let newBook;
      
      if (file) {
        const form = new FormData();
        form.append('title_tr', book.title_tr.trim());
        form.append('title_en', book.title_en.trim());
        form.append('description_tr', book.description_tr.trim());
        form.append('description_en', book.description_en.trim());
        validAuthors.forEach(author => form.append('author', author.trim()));
        book.categories.forEach(cat => form.append('category', cat));
        form.append('image', file);
        newBook = await bookService.createBook(form);
      } else {
        newBook = await bookService.createBook({
          title_tr: book.title_tr.trim(),
          title_en: book.title_en.trim(),
          description_tr: book.description_tr.trim(),
          description_en: book.description_en.trim(),
          author: validAuthors.map(a => a.trim()),
          category: book.categories,
          imageUrl: book.imageUrl.trim(),
        });
      }

      onAddBook(newBook);
      setBook({ title_tr: "", title_en: "", description_tr: "", description_en: "", authors: [""], categories: [], imageUrl: "" });
      setFile(null);
      setPreview(null);
      toast.success(t.books.bookAddedSuccess);
    } catch (error) {
      toast.error(error.message || t.books.bookAddError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="add-book-form" onSubmit={handleSubmit}>
      <h2 className="text-xl font-semibold mb-4">{t.books.addNewBook}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label>{t.books.title} (TR)</label>
          <input
            type="text"
            name="title_tr"
            value={book.title_tr}
            onChange={handleChange}
            placeholder="Türkçe başlık"
            className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100"
            required
          />
        </div>

        <div className="form-group">
          <label>{t.books.title} (EN)</label>
          <input
            type="text"
            name="title_en"
            value={book.title_en}
            onChange={handleChange}
            placeholder="English title"
            className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label>Description (TR)</label>
          <textarea
            name="description_tr"
            value={book.description_tr}
            onChange={handleChange}
            placeholder="Türkçe açıklama"
            rows="3"
            className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100"
            required
          />
        </div>

        <div className="form-group">
          <label>Description (EN)</label>
          <textarea
            name="description_en"
            value={book.description_en}
            onChange={handleChange}
            placeholder="English description"
            rows="3"
            className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>{t.books.authors}</label>
        {book.authors.map((author, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={author}
              onChange={(e) => handleAuthorChange(index, e.target.value)}
              placeholder={`${t.books.authorPlaceholder} ${index + 1}`}
              className="flex-1 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100"
            />
            {book.authors.length > 1 && (
              <button
                type="button"
                onClick={() => removeAuthorField(index)}
                className="bg-red-600 hover:bg-red-700 text-white rounded-md p-2 flex items-center justify-center transition-colors flex-shrink-0"
                style={{ width: '36px', height: '36px' }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addAuthorField}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 transition-colors w-auto"
        >
          <Plus size={18} />
          {t.books.addAuthor}
        </button>
      </div>

      <div className="form-group">
        <label>{t.books.bookCategories} {t.books.categoriesSubtext}</label>
        <div className="category-checkboxes">
          {BOOK_CATEGORIES.map((category) => (
            <label key={category} className="checkbox-label">
              <input
                type="checkbox"
                checked={book.categories.includes(category)}
                onChange={() => handleCategoryToggle(category)}
              />
              <span>{translateCategory(category)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>{t.books.bookImageUrl}</label>
        <input
          type="text"
          name="imageUrl"
          value={book.imageUrl}
          onChange={handleChange}
          placeholder={t.books.enterImageUrl}
          className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div className="form-group">
        <label>{t.books.newImageFile}</label>
        <input
          ref={fileInputRef}
          id="imageFileHidden"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <button
          type="button"
          className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors w-auto"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
        >
          {t.books.selectImage}
        </button>
        
        {(preview || book.imageUrl) && (
          <div className="mt-3">
            {preview ? (
              <img src={preview} alt="preview" className="h-40 w-32 object-cover rounded-md border dark:border-slate-600" />
            ) : book.imageUrl ? (
              <img src={book.imageUrl} alt="book" className="h-40 w-32 object-cover rounded-md border dark:border-slate-600" />
            ) : null}
          </div>
        )}
      </div>

      <div className="form-actions">
        <Button
          color="secondary"
          type="button"
          onClick={() => setIsShowModal(false)}
          disabled={loading}
        >
          {t.books.cancel}
        </Button>
        <Button
          color="success"
          type="submit"
          disabled={loading}
        >
          {loading ? t.books.adding : t.books.addBook}
        </Button>
      </div>
    </form>
  );
};

export default AddBook;