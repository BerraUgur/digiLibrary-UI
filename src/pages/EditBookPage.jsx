import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookService } from '../services/api';
import { toast } from 'react-toastify';
import Button from '../components/UI/Button';

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
          toast.error('Kitap bulunamadı');
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
        toast.error(e.message || 'Kitap yüklenirken hata');
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
      // If yeni dosya seçildiyse manuel URL'yi temizleyelim (karışmasın)
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
      toast.success('Kitap güncellendi');
      navigate(`/books/${updated._id}`);
    } catch (err) {
      console.error('[EditBookPage] update error', err);
      toast.error(err?.details?.message || err.message || 'Güncelleme başarısız');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-4">Yükleniyor...</div>;

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Kitabı Düzenle</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Başlık</label>
          <input name="title" value={book.title} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Yazar</label>
          <input name="author" value={book.author} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Kategori</label>
          <input name="category" value={book.category} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Görsel URL (opsiyonel)</label>
          <input name="imageUrl" value={book.imageUrl} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Yeni Görsel (dosya)</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <div className="mt-2">
            {preview ? <img src={preview} alt="preview" className="h-32 object-cover" /> : book.imageUrl ? <img src={book.imageUrl} alt="book" className="h-32 object-cover" /> : <span>Önizleme yok</span>}
          </div>
        </div>
        <div>
          <label className="inline-flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={book.available} onChange={(e)=>setBook(b=>({...b, available: e.target.checked}))} />
            Mevcut (ödünç verilebilir)
          </label>
        </div>
        <div className="flex gap-2">
          <Button type="submit" color="success" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
          <Button type="button" color="secondary" onClick={() => navigate(-1)}>Vazgeç</Button>
        </div>
      </form>
    </div>
  );
}
