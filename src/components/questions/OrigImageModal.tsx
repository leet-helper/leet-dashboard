import React from "react";
import { IconClose } from "../Icons";

const OrigImageModal = ({
  isOpen,
  onClose,
  imageUrl
}) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" style={{ maxWidth: "800px", width: "95%", background: "var(--bg-secondary)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.5rem", marginBottom: "0.75rem" }}>
          <h2 style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            🖼️ 문제 원본 이미지 확인
          </h2>
          <button
            className="btn-secondary"
            style={{ borderRadius: "50%", padding: "4px", display: "flex" }}
            onClick={onClose}
          >
            <IconClose />
          </button>
        </div>

        <div style={{ background: "rgba(244, 63, 94, 0.08)", borderLeft: "4px solid var(--accent-rose)", borderRadius: "6px", padding: "0.6rem 0.85rem", fontSize: "0.825rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
          추리논증 시험지를 반으로 잘라 순서대로 배치된 이미지입니다.
        </div>

        <div style={{ overflow: "auto", maxHeight: "70vh", textAlign: "center", background: "#fff", borderRadius: "8px", padding: "1rem" }}>
          <img
            src={imageUrl.startsWith('/') ? `.${imageUrl}` : imageUrl}
            alt="LEET Original Question Crop"
            style={{ maxWidth: "100%", height: "auto", display: "block", margin: "0 auto" }}
          />
        </div>
      </div>
    </div>
  );
};

export default OrigImageModal;
