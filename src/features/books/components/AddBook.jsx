import { useState, useRef } from "react";
import Button from "../../../components/UI/buttons/Button";
import BookInput from "./BookInput";
import { bookService } from "../../../services";
import { useAuth } from "../../auth/context/useAuth";
import { toast } from "react-toastify";
import "../styles/AddBook.css";

const bookInputs = [
  {
    label: "Book Title",
    type: "text",
    name: "title",
    placeholder: "Enter the book title.",
  },
  {
    label: "Author",
    type: "text",
    name: "author",
    placeholder: "Enter the author's name.",
  },
  {
    label: "Category",
    type: "select",
    name: "category",
    placeholder: "Select a category.",
    options: [
      { value: "", label: "Select Category" },
      { value: "novel", label: "Novel" },
      { value: "science", label: "Science" },
      { value: "history", label: "History" },
      { value: "philosophy", label: "Philosophy" },
      { value: "literature", label: "Literature" },
      { value: "biography", label: "Biography" },
      { value: "children", label: "Children" },
      { value: "other", label: "Other" },
    ]
  },
  {
    label: "Book Image URL",
    type: "text",
    name: "imageUrl",
    placeholder: "Enter the book image URL.",
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

    // Check if the user is logged in
    if (!user) {
      toast.error('You must be logged in to add a book');
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

      toast.success("Book added successfully!");
    } catch (error) {
      toast.error(error.message || 'An error occurred while adding the book');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="add-book-form" onSubmit={handleSubmit}>
      <h2 className="text-xl font-semibold mb-4">Add New Book</h2>

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
            Select Image
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
              Remove Image
            </button>
          ) : null}
        </div>

        <div className="image-preview">
          {preview ? (
            <img src={preview} alt="preview" />
          ) : book.imageUrl ? (
            <img src={book.imageUrl} alt="book" />
          ) : (
            <div className="image-placeholder">No image</div>
          )}
        </div>

        <div className="image-note">or you can use an image URL</div>
      </div>

      <div className="form-actions">
        <Button
          color="secondary"
          type="button"
          onClick={() => setIsShowModal(false)}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          color="success"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Book'}
        </Button>
      </div>
    </form>
  );
};

export default AddBook;