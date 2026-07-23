import React from "react";
import { IconClose } from "./Icons";

const AuthModal = ({
  isOpen,
  onClose,
  authMode,
  setAuthMode,
  authUsername,
  setAuthUsername,
  authPassword,
  setAuthPassword,
  authError,
  setAuthError,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)" }}>
            {authMode === "login" ? "🔒 로그인" : "📝 회원가입"}
          </h2>
          <button 
            className="btn-secondary" 
            style={{ borderRadius: "50%", padding: "4px", display: "flex" }}
            onClick={onClose}
          >
            <IconClose />
          </button>
        </div>
        
        {authError && (
          <div style={{ color: "var(--accent-rose)", fontSize: "12px", background: "rgba(244, 63, 94, 0.1)", padding: "0.5rem", borderRadius: "6px" }}>
            ⚠️ {authError}
          </div>
        )}
        
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>아이디</div>
            <input 
              type="text" 
              className="modern-input" 
              value={authUsername} 
              onChange={(e) => setAuthUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
            />
          </div>
          
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>비밀번호</div>
            <input 
              type="password" 
              className="modern-input" 
              value={authPassword} 
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmit();
              }}
            />
          </div>
        </div>
        
        <button 
          className="btn-primary" 
          style={{ width: "100%", justifyContent: "center", padding: "0.75rem" }}
          onClick={onSubmit}
        >
          {authMode === "login" ? "로그인하기" : "가입하고 시작하기"}
        </button>
        
        <div style={{ textAlign: "center", fontSize: "12px" }}>
          {authMode === "login" ? (
            <p style={{ color: "var(--text-secondary)" }}>
              아직 계정이 없으신가요?{" "}
              <button 
                onClick={() => { setAuthMode("register"); setAuthError(""); }}
                style={{ background: "transparent", border: "none", color: "var(--accent-blue)", fontWeight: 600, cursor: "pointer" }}
              >회원가입</button>
            </p>
          ) : (
            <p style={{ color: "var(--text-secondary)" }}>
              이미 계정이 있으신가요?{" "}
              <button 
                onClick={() => { setAuthMode("login"); setAuthError(""); }}
                style={{ background: "transparent", border: "none", color: "var(--accent-blue)", fontWeight: 600, cursor: "pointer" }}
              >로그인</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
