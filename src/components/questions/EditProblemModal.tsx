import React from "react";
import { IconClose } from "../Icons";

const EditProblemModal = ({
  isOpen,
  onClose,
  problem,
  setProblem,
  onSubmit
}) => {
  if (!isOpen || !problem) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.5rem" }}>
          <h2 style={{ fontSize: "1.15rem" }}>
            ✏️ 생성된 문제 편집 수정
          </h2>
          <button 
            className="btn-secondary" 
            style={{ borderRadius: "50%", padding: "4px", display: "flex" }}
            onClick={onClose}
          >
            <IconClose />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.95rem" }}>
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>질문 (발문)</div>
            <input 
              type="text" 
              className="modern-input" 
              value={problem.question} 
              onChange={(e) => setProblem({ ...problem, question: e.target.value })}
            />
          </div>

          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>지문</div>
            <textarea 
              className="modern-input" 
              style={{ minHeight: "150px", fontFamily: "var(--font-sans)", resize: "vertical" }}
              value={problem.passage} 
              onChange={(e) => setProblem({ ...problem, passage: e.target.value })}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input 
              type="checkbox" 
              checked={problem.has_box} 
              id="edit-has-box"
              onChange={(e) => setProblem({ ...problem, has_box: e.target.checked })} 
            />
            <label htmlFor="edit-has-box" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>&lt;보 기&gt; 사용 유무</label>
          </div>

          {problem.has_box && (
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>&lt;보 기&gt; 내용</div>
              <textarea 
                className="modern-input" 
                style={{ minHeight: "80px", fontFamily: "var(--font-sans)", resize: "vertical" }}
                value={problem.box_content} 
                onChange={(e) => setProblem({ ...problem, box_content: e.target.value })}
              />
            </div>
          )}

          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>선지 (①~⑤)</div>
            {problem.options.map((opt, oIdx) => (
              <input 
                key={oIdx} 
                type="text" 
                className="modern-input" 
                style={{ marginBottom: "0.25rem" }}
                value={opt} 
                onChange={(e) => {
                  const newOpts = [...problem.options];
                  newOpts[oIdx] = e.target.value;
                  setProblem({ ...problem, options: newOpts });
                }}
              />
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>정답 번호 (1~5)</div>
              <select 
                className="modern-select" 
                value={problem.answer} 
                onChange={(e) => setProblem({ ...problem, answer: parseInt(e.target.value) })}
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>함정 카테고리</div>
              <input 
                type="text" 
                className="modern-input" 
                value={problem.trap_category || ""} 
                onChange={(e) => setProblem({ ...problem, trap_category: e.target.value })}
              />
            </div>
          </div>
        </div>

        <button 
          className="btn-primary" 
          style={{ width: "100%", justifyContent: "center", padding: "0.75rem", marginTop: "0.5rem" }}
          onClick={onSubmit}
        >
          수정 변경 사항 저장하기
        </button>
      </div>
    </div>
  );
};

export default EditProblemModal;
