import React from "react";
import { IconClose } from "../Icons";
import { renderMarkdown } from "../../utils";

const WeaknessModal = ({
  isOpen,
  onClose,
  isAnalyzing,
  weaknessPrompt,
  setWeaknessPrompt,
  weaknessReport,
  setWeaknessReport,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.5rem" }}>
          <h2 style={{ fontSize: "1.15rem", display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--accent-rose)" }}>
            🔍 AI 오답 약점 분석 리포터
          </h2>
          <button 
            className="btn-secondary" 
            style={{ borderRadius: "50%", padding: "4px", display: "flex" }}
            onClick={onClose}
          >
            <IconClose />
          </button>
        </div>

        <div className="weakness-modal-content">
          {weaknessReport ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div 
                className="report-markdown"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(weaknessReport) }}
              />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button 
                  className="btn-secondary" 
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => setWeaknessReport("")}
                >
                  다시 분석하기
                </button>
                <button 
                  className="btn-primary" 
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => window.print()}
                >
                  리포트 인쇄 / PDF 저장
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                현재까지 대시보드에 축적된 <strong>학생의 오답 이력과 각 문항별 함정 유형, 작성하신 개인 메모</strong>를 기반으로 논리적 약점의 공통 분모를 찾아 극복 전략 마크다운 리포트를 즉시 생성합니다.
              </p>

              <div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>AI 분석 프롬프트 (요청 사항)</div>
                <textarea 
                  className="modern-input" 
                  style={{ minHeight: "80px", resize: "vertical", fontFamily: "var(--font-sans)" }}
                  value={weaknessPrompt}
                  onChange={(e) => setWeaknessPrompt(e.target.value)}
                />
              </div>

              <button 
                className="btn-primary" 
                style={{ width: "100%", justifyContent: "center", padding: "0.75rem" }}
                onClick={onSubmit}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <div style={{ width: "14px", height: "14px", border: "2px solid #ffffff", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginRight: "6px" }}></div>
                    오답 빅데이터 정밀 진단 분석 중...
                  </>
                ) : (
                  "AI 정밀 약점 리포트 발급하기"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeaknessModal;
