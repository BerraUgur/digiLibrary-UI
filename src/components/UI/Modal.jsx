import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import "./Modal.css";

const Modal = ({ setIsShowModal, title, desc }) => {
  const [count, setCount] = useState(0);

  function handleModalClose() {
    if (typeof setIsShowModal === 'function') setIsShowModal(false);
  }

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setCount(i);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return createPortal(
    <div className="modal">
      <div className="modal-overlay" onClick={handleModalClose}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">{title}</h5>
          <h5 className="modal-title">{count}</h5>
          <span className="close-button" onClick={handleModalClose}>&times;</span>
        </div>
        <div className="modal-body">
          <p>{desc}</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={handleModalClose}>
            Kapat
          </button>
          <button type="button" className="btn btn-primary">Kaydet</button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default Modal;
