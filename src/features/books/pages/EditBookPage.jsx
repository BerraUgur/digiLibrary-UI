import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookService } from '../../../services';
import { toast } from 'react-toastify';
import Button from '../../../components/UI/buttons/Button';
import { useLanguage } from '../../../context/useLanguage';
import remoteLogger from '../../../utils/remoteLogger';

export default function EditBookPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, translateCategory } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [book, setBook] = useState({ title: '', author: '', category: '', imageUrl: '', available: true });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const categoryOptions = [
    { value: 'novel', labelKey: 'Novel' },
    { value: 'science', labelKey: 'Science' },
    { value: 'history', labelKey: 'History' },
    { value: 'philosophy', labelKey: 'Philosophy' },
    { value: 'literature', labelKey: 'Literature' },
    { value: 'biography', labelKey: 'Biography' },
    { value: 'children', labelKey: 'Children' },
    { value: 'other', labelKey: 'Other' },
  ];

  // Category from backend data (TR/EN → lowercase value)
  const normalizeCategoryValue = useCallback((categoryFromBackend) => {
    if (!categoryFromBackend) return '';

    const categoryLower = categoryFromBackend.toLowerCase();

    // If value is already lowercase, return it directly
    const validValues = ['novel', 'science', 'history', 'philosophy', 'literature', 'biography', 'children', 'other'];
    if (validValues.includes(categoryLower)) {
      return categoryLower;
    }

    // Category mapping (TR/EN → value)
    const categoryMap = {
      'roman': 'novel',
      'novel': 'novel',
      'bilim': 'science',
      'science': 'science',
      'tarih': 'history',
      'history': 'history',
      'felsefe': 'philosophy',
      'philosophy': 'philosophy',
      'edebiyat': 'literature',
      'literature': 'literature',
      'biyografi': 'biography',
      'biography': 'biography',
      'çocuk': 'children',
      'children': 'children',
      'diğer': 'other',
      'other': 'other',
    };

    return categoryMap[categoryLower] || 'other';
  }, []);

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
          setBook({
            title: data.title || '',
            author: data.author || '',
            category: normalizeCategoryValue(data.category),
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
  }, [id, navigate, t.books.bookNotFound, t.books.bookAddError, normalizeCategoryValue]);

  function handleChange(e) {
    const { name, value } = e.target;
    setBook(b => ({ ...b, [name]: value }));
  }

  function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
    if (f) {
      // If a new file is selected, keep the current imageUrl (do not overwrite) and show preview
      setBook(b => ({ ...b, imageUrl: b.imageUrl }));
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setSaving(true);
      let payload;
      if (file) {
        payload = new FormData();
        payload.append('title', book.title.trim());
        payload.append('author', book.author.trim());
        payload.append('category', book.category.trim());
        payload.append('available', String(book.available));
        if (book.imageUrl && !preview) payload.append('imageUrl', book.imageUrl.trim());
        payload.append('image', file);
      } else {
        payload = {
          title: book.title.trim(),
          author: book.author.trim(),
          category: book.category.trim(),
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
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-200">{t.books.title}</label>
            <input name="title" value={book.title} onChange={handleChange} className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-200">{t.books.author}</label>
            <input name="author" value={book.author} onChange={handleChange} className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-200">{t.books.category}</label>
            <select name="category" value={book.category} onChange={handleChange} className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100" required>
              <option value="">{t.books.selectCategory}</option>
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {translateCategory(option.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-200">{t.books.imageUrlOptional}</label>
            <input name="imageUrl" value={book.imageUrl} onChange={handleChange} className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t.books.newImageFile}</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="block" />
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
