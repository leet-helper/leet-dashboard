import React from "react";
import { IconClose } from "../Icons";
import { EXAM_SOURCES, DETAILED_CATEGORIES } from "../../constants";

const GeneratorModal = ({
  isOpen,
  onClose,
  refYear,
  setRefYear,
  refNumber,
  setRefNumber,
  selectedRefProblems,
  handleAddRefProblem,
  handleRemoveRefProblem,
  genCategory,
  setGenCategory,
  genPrompt,
  setGenPrompt,
  isGenerating,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.5rem" }}>
          <h2 style={{ fontSize: "1.15rem", display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--accent-purple)" }}>
            ✨ AI 신규 논증 문제 생성기
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
          기출문제 데이터베이스 혹은 **지정하신 참고 문항(Few-shot)**을 주입하여, 리트 특유의 조밀한 형식논리학적 엄밀성을 모사한 새 문제를 자동 출제합니다.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1rem" }}>
          {/* Reference Problems Selector */}
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>참고 기출문제 지정 (선택)</div>
            <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem" }}>
              <select 
                className="modern-select" 
                style={{ flex: 2 }}
                value={refYear} 
                onChange={(e) => setRefYear(e.target.value)}
              >
                {EXAM_SOURCES.map(src => (
                  <option key={src.file} value={src.file}>{src.name.replace(" 추리논증 기출", "")}</option>
                ))}
              </select>
              <select 
                className="modern-select" 
                style={{ flex: 1 }}
                value={refNumber} 
                onChange={(e) => setRefNumber(parseInt(e.target.value))}
              >
                {Array.from({ length: 40 }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>{num}번</option>
                ))}
              </select>
              <button 
                className="btn-secondary" 
                style={{ padding: "0 0.75rem", fontSize: "1.1rem" }}
                onClick={handleAddRefProblem}
              >
                +
              </button>
            </div>
            {/* List of currently selected reference problems */}
            {selectedRefProblems.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", maxHeight: "100px", overflowY: "auto", padding: "0.4rem", borderRadius: "6px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-glass)" }}>
                {selectedRefProblems.map((p, index) => {
                  const yearName = p.year ? p.year.toString().replace(/학년도.*/g, "") : "";
                  return (
                    <span 
                      key={index} 
                      className="badge" 
                      style={{ background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.3)", color: "#60a5fa", gap: "0.2rem", padding: "0.15rem 0.4rem", fontSize: "11px", display: "inline-flex", alignItems: "center" }}
                    >
                      📖 {yearName}년 {p.number}번
                      <span 
                        style={{ cursor: "pointer", marginLeft: "4px", color: "var(--accent-rose)", fontWeight: "bold" }}
                        onClick={() => handleRemoveRefProblem(index)}
                      >
                        ×
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>출제 카테고리</div>
            <select 
              className="modern-select" 
              value={genCategory} 
              onChange={(e) => setGenCategory(e.target.value)}
            >
              {DETAILED_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>추가적인 출제 요구사항 (선택)</div>
            <textarea 
              className="modern-input" 
              style={{ minHeight: "100px", fontFamily: "var(--font-sans)", resize: "vertical" }}
              placeholder="예: '양자역학 관련 지문을 활용해줘', '법률 조문에 예외 조항을 까다롭게 2개 이상 배치해줘' 등..."
              value={genPrompt}
              onChange={(e) => setGenPrompt(e.target.value)}
            />
          </div>
        </div>

        <button 
          className="btn-primary" 
          style={{ width: "100%", justifyContent: "center", padding: "0.75rem" }}
          onClick={onSubmit}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <div style={{ width: "14px", height: "14px", border: "2px solid #ffffff", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginRight: "6px" }}></div>
              기출문제 Few-shot 분석 및 출제 중... (약 10~20초 소요)
            </>
          ) : (
            "ChatGPT 기반 극악 난이도 리트 문제 생성하기"
          )}
        </button>
      </div>
    </div>
  );
};

export default GeneratorModal;
