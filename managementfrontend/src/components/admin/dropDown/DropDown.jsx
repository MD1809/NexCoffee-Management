import React, { useState, useEffect, useRef } from "react";
import "./Dropdown.css";


const Dropdown = ({ options, placeholder = "Chọn một tùy chọn", defaultValue, onChange }) => {
  
  const [selectedOption, setSelectedOption] = useState(() => {
    if (defaultValue) {
      return options.find(opt => opt.value === defaultValue) || null;
    }
    return null;
  });

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (defaultValue && options.length > 0) {
      const matchedOption = options.find(opt => opt.value === defaultValue);
      setSelectedOption(matchedOption || null);
    }
  }, [defaultValue, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    setIsOpen(false);
    if (onChange) {
      onChange(option);
    }
  };

  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <button 
        type="button" 
        className={`dropdown-toggle ${isOpen ? "active" : ""}`} 
        onClick={toggleDropdown}
      >
        <span className={selectedOption ? "text-selected" : "text-placeholder"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="dropdown-arrow"></span>
      </button>

      {isOpen && (
        <ul className="dropdown-menu">
          {options.map((option) => (
            <li
              key={option.value}
              className={`dropdown-item ${
                selectedOption?.value === option.value ? "selected" : ""
              }`}
              onClick={() => handleOptionClick(option)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;