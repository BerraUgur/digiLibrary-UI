import { useState, useRef } from "react";
import Button from "../../../components/UI/buttons/Button";
import BookInput from "./BookInput";
import { bookService } from "../../../services";
import { useAuth } from "../../auth/context/useAuth";
import { useLanguage } from "../../../context/useLanguage";
import { toast } from "react-toastify";
import "../styles/AddBook.css";

const AddBook = ({ onAddBook, setIsShowModal }) => {
  const { user } = useAuth();
  const { t, translateCategory } = useLanguage();
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

  const bookInputs = [
    {
      label: t.books.bookTitle,
      type: "text",
      name: "title",
      placeholder: t.books.enterBookTitle,
    },
    {
      label: t.books.author,
      type: "text",
      name: "author",
      placeholder: t.books.enterAuthorName,
    },
    {
      label: t.books.category,
      type: "select",
      name: "category",
      placeholder: t.books.selectCategory,
      options: [
        { value: "", label: t.books.selectCategory },
        { value: "novel", label: translateCategory("Novel") },
        { value: "science", label: translateCategory("Science") },
        { value: "history", label: translateCategory("History") },
        { value: "philosophy", label: translateCategory("Philosophy") },
        { value: "literature", label: translateCategory("Literature") },
        { value: "biography", label: translateCategory("Biography") },
        { value: "children", label: translateCategory("Children") },
        { value: "other", label: translateCategory("Other") },
      ]
    },
    {
      label: t.books.bookImageUrl,
      type: "text",
      name: "imageUrl",
      placeholder: t.books.enterImageUrl,
    },
  ];

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

    // Check if the user is logged in
    if (!user) {
      toast.error(t.books.mustBeLoggedIn);
      return;
    }

    // Form validation
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
      // Add the book to the backend
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

      // Successful addition
      onAddBook(newBook);

      // Clear the form
      setBook({
        title: "",
        author: "",
        category: "",
        imageUrl: "",
      });
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

      {bookInputs.map((input, index) => (
        <BookInput
          key={index}
          {...input}
          value={book[input.name]}
          handleChange={handleChange}
        />
      ))}

      <div className="image-upload">
        {/* Hidden file input triggered by buttons */}
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
            {t.books.selectImage}
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
              {t.books.removeImage}
            </button>
          ) : null}
        </div>

        <div className="image-preview">
          {preview ? (
            <img src={preview} alt="preview" />
          ) : book.imageUrl ? (
            <img src={book.imageUrl} alt="book" />
          ) : (
            <div className="image-placeholder">{t.books.noImage}</div>
          )}
        </div>

        <div className="image-note">{t.books.orUseImageUrl}</div>
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