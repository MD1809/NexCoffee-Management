import "./Button.css";

function Button({ buttonName="Button", leftIcon, rightIcon, onClick, className = ""}) {
  return (
    <button className={`Button ${className}`} onClick={onClick}>
      {leftIcon && <span className="icon-wrapper">{leftIcon}</span>}
      <span className="textButton">{buttonName}</span>
      {rightIcon && <span className="icon-wrapper">{rightIcon}</span>}
    </button>
  );
}

export default Button;
