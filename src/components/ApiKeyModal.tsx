import React from "react";
import { IconClose } from "./Icons";

const ApiKeyModal = ({
  isOpen,
  onClose,
  openaiApiKey,
  setOpenaiApiKey
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.5rem" }}>
          <h2 style={{ fontSize: "1.15rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            🔑 AI API Key 설정
          </h2>
          <button 
            className="btn-secondary" 
            style={{ borderRadius: "50%", padding: "4px", display: "flex" }}
            onClick={onClose}
          >
            <IconClose />
          </button>
        </div>
        
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          본 대시보드의 <strong>AI 문제 생성</strong> 및 <strong>오답 취약 분석 리포트</strong> 기능은 ChatGPT (OpenAI GPT-4o) API를 활용해 작동합니다.<br />
          입력하신 API 키는 브라우저의 <code>localStorage</code>에 안전하게 보존됩니다.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1rem" }}>
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>ChatGPT (OpenAI) API Key</div>
            <input 
              type="password" 
              className="modern-input" 
              placeholder="sk-proj-..."
              defaultValue={openaiApiKey}
              id="openai-key-input"
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button 
            className="btn-primary" 
            style={{ flex: 1, justifyContent: "center" }}
            onClick={() => {
              const openaiEl = document.getElementById("openai-key-input") as HTMLInputElement;
              const openaiVal = openaiEl ? openaiEl.value.trim() : "";
              
              if (!openaiVal) {
                alert("OpenAI API 키를 입력해 주세요.");
                return;
              }
              
              setOpenaiApiKey(openaiVal);
              localStorage.setItem("openai_api_key", openaiVal);
              
              onClose();
              alert("API 키가 성공적으로 저장되었습니다!");
            }}
          >
            저장하기
          </button>
          <button 
            className="btn-secondary" 
            style={{ flex: 1, justifyContent: "center", color: "var(--accent-rose)" }}
            onClick={() => {
              setOpenaiApiKey("");
              localStorage.removeItem("openai_api_key");
              onClose();
              alert("저장된 API 키가 삭제되었습니다.");
            }}
          >
            키 삭제
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
