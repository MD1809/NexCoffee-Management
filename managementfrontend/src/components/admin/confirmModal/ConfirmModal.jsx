function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="ConfirmModal-overlay">
      <div className="ConfirmModal-content">
        <div className="ConfirmModal-header">{title}</div>
        <p>{message}</p>
        
        <div className="ConfirmModal-actions">
          <button onClick={onClose}>Hủy</button>
          <button onClick={onConfirm} className="ConfirmModal-btn">
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
