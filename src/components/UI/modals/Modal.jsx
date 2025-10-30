import React from "react";
import { createPortal } from "react-dom";
import "./Modal.css";

const Modal = ({ setIsShowModal, title, desc }) => {
  // Close modal when overlay or close button is clicked
  function handleModalClose() {
    if (typeof setIsShowModal === "function") setIsShowModal(false);
  }

  // Render modal using React Portal
  return createPortal(
    <div className="modal">
      <div className="modal-overlay" onClick={handleModalClose}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">{title}</h5>
          <span className="close-button" onClick={handleModalClose}>&times;</span>
        </div>
        <div className="modal-body">
          <p>{desc}</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={handleModalClose}>
            Close
          </button>
          <button type="button" className="btn btn-primary">Save</button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default Modal;
