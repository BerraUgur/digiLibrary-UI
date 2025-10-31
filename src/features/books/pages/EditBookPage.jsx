import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookService } from '../../../services';
import { toast } from 'react-toastify';
import Button from '../../../components/UI/buttons/Button';
import remoteLogger from '../../../utils/remoteLogger';

export default function EditBookPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [book, setBook] = useState({ title: '', author: '', category: '', imageUrl: '', available: true });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        const data = await bookService.getBookById(id);
        if (!data) {
          toast.error('Book not found');
          navigate('/books');
          return;
        }
        if (!ignore) {
          setBook({
            title: data.title || '',
            author: data.author || '',
            category: data.category || '',
            imageUrl: data.imageUrl || '',
            available: data.available,
          });
        }
      } catch (e) {
        remoteLogger.error('[EditBookPage] load error', { error: e?.message || String(e), stack: e?.stack });
        toast.error(e.message || 'Error loading book');
        navigate('/books');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [id, navigate]);

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
      toast.success('Book updated');
      navigate(`/books/${updated._id}`);
    } catch (err) {
      remoteLogger.error('[EditBookPage] update error', { error: err?.message || String(err), stack: err?.stack });
      toast.error(err?.details?.message || err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto mt-8">
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-semibold mb-6">Edit Book</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-200">Title</label>
            <input name="title" value={book.title} onChange={handleChange} className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-200">Author</label>
            <input name="author" value={book.author} onChange={handleChange} className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-200">Category</label>
            <input name="category" value={book.category} onChange={handleChange} className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-200">Image URL (optional)</label>
            <input name="imageUrl" value={book.imageUrl} onChange={handleChange} className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">New Image (file)</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="block" />
            <div className="mt-3">
              {preview ? (
                <img src={preview} alt="preview" className="h-40 w-32 object-cover rounded-md border dark:border-slate-600" />
              ) : book.imageUrl ? (
                <img src={book.imageUrl} alt="book" className="h-40 w-32 object-cover rounded-md border dark:border-slate-600" />
              ) : (
                <span className="text-sm text-gray-500 dark:text-slate-400">No preview available</span>
              )}
            </div>
          </div>

          <div>
            <label className="inline-flex items-center gap-3 text-sm font-medium">
              <input type="checkbox" checked={book.available} onChange={(e) => setBook(b => ({ ...b, available: e.target.checked }))} className="h-4 w-4" />
              <span>Available (lendable)</span>
            </label>
          </div>

          <div className="flex gap-3 justify-center mt-4">
            <Button type="submit" color="success" disabled={saving} className="px-6">{saving ? 'Saving...' : 'Save'}</Button>
            <Button type="button" color="secondary" onClick={() => navigate(-1)} className="px-6">Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
