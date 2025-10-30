import "./Button.css";

function Button({ color = "primary", size = "md", className = "", children, onClick, disabled = false, type = "button" }) {
  const classNames = `btn btn-${color} btn-${size} ${className} ${disabled ? "btn-disabled" : ""}`;
  return (
    <button
      onClick={onClick}
      className={classNames}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
}

export default Button;
