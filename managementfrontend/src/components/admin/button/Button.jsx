import "./Button.css";

function Button({ buttonName, onClick }) {
  return (
    <button className="button" onClick={onClick}>
      <span>{buttonName}</span>
    </button>
  );
}

export default Button;
