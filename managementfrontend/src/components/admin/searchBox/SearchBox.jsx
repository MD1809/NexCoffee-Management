import "./searchBox.css";

function searchBox({value, onChange}) {
  return (
    <div className="search-box">
      <i className="fa-solid fa-magnifying-glass search-box__icon"></i>
      <input
        type="text"
        name="search"
        className="search-box__input"
        value={value}
        onChange={onChange}
        placeholder="Tìm kiếm..."
      />
    </div>
  );
}

export default searchBox;
