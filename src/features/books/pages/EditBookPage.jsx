import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookService } from '../../../services';
import { toast } from 'react-toastify';
import Button from '../../../components/UI/buttons/Button';
import { useLanguage } from '../../../context/useLanguage';
import { BOOK_CATEGORIES } from '../../../constants/bookConstants';
import { X, Plus } from 'lucide-react';
import remoteLogger from '../../../utils/remoteLogger';
import '../styles/AddBook.css';

export default function EditBookPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, translateCategory } = useLanguage();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [book, setBook] = useState({ 
    title_tr: '',
    title_en: '',
    description_tr: '',
    description_en: '',
    authors: [''], 
    categories: [], 
    imageUrl: '', 
    available: true 
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        const data = await bookService.getBookById(id);
        if (!data) {
          toast.error(t.books.bookNotFound);
          navigate('/books');
          return;
        }
        if (!ignore) {
          // Convert author/category to arrays if they're not already
          const authors = Array.isArray(data.author) ? data.author : [data.author || ''];
          const categories = Array.isArray(data.category) ? data.category : (data.category ? [data.category] : []);
          
          setBook({
            title_tr: data.title_tr || '',
            title_en: data.title_en || '',
            description_tr: data.description_tr || '',
            description_en: data.description_en || '',
            authors: authors.length > 0 ? authors : [''],
            categories: categories,
            imageUrl: data.imageUrl || '',
            available: data.available,
          });
        }
      } catch (e) {
        remoteLogger.error('[EditBookPage] load error', { error: e?.message || String(e), stack: e?.stack });
        toast.error(e.message || t.books.bookAddError);
        navigate('/books');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [id, navigate, t.books.bookNotFound, t.books.bookAddError]);

  function handleChange(e) {
    const { name, value } = e.target;
    setBook(b => ({ ...b, [name]: value }));
    // Clear file if imageUrl is entered
    if (name === 'imageUrl' && value.trim()) {
      setFile(null);
      setPreview(null);
    }
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

  async function handleSubmit(e) {
    e.preventDefault();

    const validAuthors = book.authors.filter(a => a.trim() !== "");
    if (!book.title_tr.trim() || !book.title_en.trim() || !book.description_tr.trim() || !book.description_en.trim() || validAuthors.length === 0 || book.categories.length === 0) {
      toast.error(t.books.fillAllFields);
      return;
    }

    // Check if image is provided (file, existing imageUrl, or new imageUrl)
    if (!file && !book.imageUrl.trim()) {
      toast.error(t.books.imageRequired || 'Kitap resmi zorunludur. Lütfen bir resim yükleyin veya URL girin.');
      return;
    }

    try {
      setSaving(true);
      let payload;
      if (file) {
        payload = new FormData();
        payload.append('title_tr', book.title_tr.trim());
        payload.append('title_en', book.title_en.trim());
        payload.append('description_tr', book.description_tr.trim());
        payload.append('description_en', book.description_en.trim());
        validAuthors.forEach(author => payload.append('author', author.trim()));
        book.categories.forEach(cat => payload.append('category', cat));
        payload.append('available', String(book.available));
        if (book.imageUrl && !preview) payload.append('imageUrl', book.imageUrl.trim());
        payload.append('image', file);
      } else {
        payload = {
          title_tr: book.title_tr.trim(),
          title_en: book.title_en.trim(),
          description_tr: book.description_tr.trim(),
          description_en: book.description_en.trim(),
          author: validAuthors.map(a => a.trim()),
          category: book.categories,
          imageUrl: book.imageUrl.trim() || '',
          available: book.available,
        };
      }
      const updated = await bookService.updateBook(id, payload);
      toast.success(t.books.bookUpdated);
      navigate(`/books/${updated._id}`);
    } catch (err) {
      remoteLogger.error('[EditBookPage] update error', { error: err?.message || String(err), stack: err?.stack });
      toast.error(err?.details?.message || err.message || t.books.updateFailed);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-center">{t.books.loadingBook}</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto mt-8">
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-semibold mb-6">{t.books.editBook}</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-200">{t.books.title} (TR)</label>
              <input name="title_tr" value={book.title_tr} onChange={handleChange} placeholder="Türkçe başlık" className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-200">{t.books.title} (EN)</label>
              <input name="title_en" value={book.title_en} onChange={handleChange} placeholder="English title" className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-200">Description (TR)</label>
              <textarea name="description_tr" value={book.description_tr} onChange={handleChange} placeholder="Türkçe açıklama" rows="3" className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-200">Description (EN)</label>
              <textarea name="description_en" value={book.description_en} onChange={handleChange} placeholder="English description" rows="3" className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-200">{t.books.authors}</label>
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
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 transition-colors mt-2"
            >
              <Plus size={18} />
              {t.books.addAuthor}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-200">{t.books.bookCategories} {t.books.categoriesSubtext}</label>
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

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-200">{t.books.bookImageUrl}</label>
            <input 
              name="imageUrl" 
              value={book.imageUrl} 
              onChange={handleChange} 
              placeholder={t.books.enterImageUrl}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-200">{t.books.newImageFile}</label>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              {t.books.selectImage}
            </button>
            <div className="mt-3">
              {preview ? (
                <img src={preview} alt="preview" className="h-40 w-32 object-cover rounded-md border dark:border-slate-600" />
              ) : book.imageUrl ? (
                <img src={book.imageUrl} alt="book" className="h-40 w-32 object-cover rounded-md border dark:border-slate-600" />
              ) : (
                <span className="text-sm text-gray-500 dark:text-slate-400">{t.books.noPreviewAvailable}</span>
              )}
            </div>
          </div>

          <div>
            <label className="inline-flex items-center gap-3 text-sm font-medium">
              <input type="checkbox" checked={book.available} onChange={(e) => setBook(b => ({ ...b, available: e.target.checked }))} className="h-4 w-4" />
              <span>{t.books.availableLendable}</span>
            </label>
          </div>

          <div className="flex gap-3 justify-center mt-4">
            <Button type="submit" color="success" disabled={saving} className="px-6">{saving ? t.books.saving : t.books.save}</Button>
            <Button type="button" color="secondary" onClick={() => navigate(-1)} className="px-6">{t.books.cancel}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
