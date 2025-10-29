import "./Button.css";

function Button({ color, size, addClass, title, children, onClick, disabled, type }) {
  /*   const { color, size, addClass, title } = props; */
  const classNames = `btn btn-${color} btn-${size} ${addClass} ${disabled ? 'btn-disabled' : ''}`;

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
