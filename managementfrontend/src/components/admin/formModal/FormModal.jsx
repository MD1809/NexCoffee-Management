import React from "react";
import ReactDOM from "react-dom";
import "./FormModal.css";

const FormModal = ({
  isOpen,
  onClose,
  title,
  onSubmit,
  submitText,
  children,
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="form-modal">
      <div className="form-modal__overlay" onClick={onClose}></div>

      <div className="form-modal__content">
        <div className="form-modal__header">
          <h3 className="form-modal__title">{title}</h3>
          <i
            className="fa-solid fa-xmark form-modal__close"
            onClick={onClose}
            title="Đóng"
          ></i>
        </div>

        <form
          className="form-modal__form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(e);
          }}
        >
          {/* nội dung form */}
          <div className="form-modal__body">{children}</div>

          <div className="form-modal__footer">
            <button
              type="button"
              className="form-modal__btn form-modal__btn--cancel"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="form-modal__btn form-modal__btn--submit"
            >
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default FormModal;
