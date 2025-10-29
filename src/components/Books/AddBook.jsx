import { useState, useRef } from "react";
import Button from "../UI/Button";
import BookInput from "./BookInput";
import { bookService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import "./AddBook.css";

const bookInputs = [
  {
    label: "Kitap Başlığı",
    type: "text",
    name: "title",
    placeholder: "Kitap başlığını giriniz.",
  },
  {
    label: "Yazar",
    type: "text",
    name: "author",
    placeholder: "Yazar adını giriniz.",
  },
  {
    label: "Kategori",
    type: "select",
    name: "category",
    placeholder: "Kategori seçiniz.",
    options: [
      { value: "", label: "Kategori Seçin" },
      { value: "roman", label: "Roman" },
      { value: "bilim", label: "Bilim" },
      { value: "tarih", label: "Tarih" },
      { value: "felsefe", label: "Felsefe" },
      { value: "edebiyat", label: "Edebiyat" },
      { value: "biyografi", label: "Biyografi" },
      { value: "çocuk", label: "Çocuk" },
      { value: "diğer", label: "Diğer" },
    ]
  },
  {
    label: "Kitap Görseli URL",
    type: "text",
    name: "imageUrl",
    placeholder: "Kitap görseli URL'sini giriniz (opsiyonel).",
  },
];

const AddBook = ({ onAddBook, setIsShowModal }) => {
  const { user } = useAuth();
  const [book, setBook] = useState({
    title: "",
    author: "",
    category: "",
    imageUrl: "",
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  function handleChange({ target: { name, value } }) {
    setBook({ ...book, [name]: value });
  }

  function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // Giriş kontrolü
    if (!user) {
      toast.error('Kitap eklemek için giriş yapmalısınız');
      return;
    }

    // Form validasyonu
    const requiredFields = ['title', 'author', 'category'];
    const isFormValid = requiredFields.every(
      (field) => book[field].trim() !== ""
    );

    if (!isFormValid) {
      setIsShowModal(true);
      return;
    }

    try {
      setLoading(true);
      // Backend'e kitap ekleme
      let newBook;
      // If a file is selected, use multipart/form-data
      if (file) {
        const form = new FormData();
        form.append('title', book.title.trim());
        form.append('author', book.author.trim());
        form.append('category', book.category);
        form.append('image', file);
        newBook = await bookService.createBook(form);
      } else {
        newBook = await bookService.createBook({
          title: book.title.trim(),
          author: book.author.trim(),
          category: book.category,
          imageUrl: book.imageUrl.trim() || undefined,
        });
      }

      // Başarılı ekleme
      onAddBook(newBook);

      // Form temizleme
      setBook({
        title: "",
        author: "",
        category: "",
        imageUrl: "",
      });
      setFile(null);
      setPreview(null);

      toast.success("Kitap başarıyla eklendi!");
    } catch (error) {
      toast.error(error.message || 'Kitap eklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="add-book-form" onSubmit={handleSubmit}>
      <h2 className="text-xl font-semibold mb-4">Yeni Kitap Ekle</h2>
      
      {bookInputs.map((input, index) => (
        <BookInput
          key={index}
          {...input}
          value={book[input.name]}
          handleChange={handleChange}
        />
      ))}

      <div className="image-upload">
          {/* hidden file input triggered by buttons */}
          <input
            ref={fileInputRef}
            id="imageFileHidden"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

        <div className="image-actions">
          <button
            type="button"
            className="select-image-btn"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            Görsel Seç
          </button>
          {file || book.imageUrl ? (
            <button
              type="button"
              className="remove-image-btn"
              onClick={() => {
                setFile(null);
                setPreview(null);
                setBook({ ...book, imageUrl: '' });
              }}
            >
              Görseli Kaldır
            </button>
          ) : null}
        </div>

        <div className="image-preview">
          {preview ? (
            <img src={preview} alt="preview" />
          ) : book.imageUrl ? (
            <img src={book.imageUrl} alt="book" />
          ) : (
            <div className="image-placeholder">Görsel yok</div>
          )}
        </div>

        <div className="image-note">veya görsel URL'sini kullanabilirsiniz</div>
      </div>
      
      <div className="form-actions">
        <Button 
          color="secondary"
          type="button"
          onClick={() => setIsShowModal(false)}
          disabled={loading}
        >
          Vazgeç
        </Button>
        <Button 
          color="success" 
          type="submit"
          disabled={loading}
        >
          {loading ? 'Ekleniyor...' : 'Kitap Ekle'}
        </Button>
      </div>
    </form>
  );
};

export default AddBook; 