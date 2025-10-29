import "./BookInput.css";

function BookInput({ label, type, name, placeholder, value, handleChange, options }) {
  return (
    <div className="book-input">
      <label htmlFor={name}>{label}</label>
      
      {type === "select" ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          className="book-input-field"
        >
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          className="book-input-field"
        />
      )}
    </div>
  );
}

export default BookInput; 