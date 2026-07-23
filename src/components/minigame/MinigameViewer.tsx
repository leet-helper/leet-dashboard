import React from "react";

export default function MinigameViewer(_props?: any) {
  return (
    <main className="main-content" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "65vh" }}>
      <div 
        className="glass-card" 
        style={{ 
          maxWidth: "480px", 
          padding: "3.5rem 2rem", 
          textAlign: "center", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          gap: "1.25rem",
          borderRadius: "16px",
          border: "1px solid var(--border-glass)",
          boxShadow: "var(--card-shadow)"
        }}
      >
        <div style={{ fontSize: "3.5rem", filter: "drop-shadow(0 4px 12px rgba(245,158,11,0.3))" }}>🚧</div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          미니게임 서비스 준비 중
        </h2>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.65, fontSize: "0.95rem", margin: 0 }}>
          보강된 논리 진단 및 독해 클리닉 콘텐츠 제공을 위해
          <br />
          현재 서비스 개편이 진행 중입니다.
          <br />
          빠른 시일 내에 새로워진 미니게임으로 찾아뵙겠습니다!
        </p>
      </div>
    </main>
  );
}
