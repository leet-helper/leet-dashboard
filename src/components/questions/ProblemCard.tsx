import React from "react";
import { IconPlus, IconCheck, IconEdit } from "../Icons";
import { getProblemKey } from "../../utils";

const ProblemCard = ({
  prob,
  viewMode = "list", // "list" | "focus"
  solvedRecords = {},
  handleSelectOption,
  notes = {},
  handleSaveMemo,
  activeMemos = {},
  setActiveMemos,
  visibleAnswers = {},
  setVisibleAnswers,
  visibleHints = {},
  setVisibleHints,
  cart = [],
  toggleCart,
  setSelectedOrigImage,
  setIsOrigImageModalOpen,
  problemBookmarkLists = [],
  activeProblemBookmarkDropdownKey,
  setActiveProblemBookmarkDropdownKey,
  createProblemBookmarkList,
  toggleProblemBookmarkMember,
  renderHighlightableText = null,
  hidePassage = false,
  children = null
}) => {
  const probKey = getProblemKey(prob);
  const solved = solvedRecords[probKey];
  const hasMemo = !!notes[probKey];
  const isMemoToggled = activeMemos[probKey] !== undefined ? activeMemos[probKey] : hasMemo;
  const isAnswerToggled = visibleAnswers[probKey];
  const isHintToggled = visibleHints[probKey];
  const isGenerated = prob.year === "생성된 문제";

  const probSubject = prob.subject || (prob.year && prob.year.toString().includes("verbal") ? "언어이해" : "추리논증");
  const subjectBookmarkLists = problemBookmarkLists.filter(l => (l.subject || "추리논증") === probSubject);
  const isBookmarkedInAnyList = subjectBookmarkLists.some(l => l.problems && l.problems.some(bp => String(bp.year) === String(prob.year) && String(bp.number) === String(prob.number)));

  const [newListName, setNewListName] = React.useState("");

  const isItemInCart = (p) => {
    if (!cart || !Array.isArray(cart) || !p) return false;
    return cart.some(item => String(item.year) === String(p.year) && String(item.number) === String(p.number));
  };

  const renderText = (text, textType) => {
    if (!text) return null;
    if (renderHighlightableText) {
      return renderHighlightableText(text, probKey, textType);
    }
    const cleanText = text.replace(/\\n/g, "\n");
    return cleanText.split("\n").map((line, idx) => (
      <p key={idx} style={{ margin: "0 0 0.5rem 0" }}>{line}</p>
    ));
  };

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".bookmark-btn") && !e.target.closest(".bookmark-dropdown")) {
        if (activeProblemBookmarkDropdownKey === probKey) {
          setActiveProblemBookmarkDropdownKey(null);
        }
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [activeProblemBookmarkDropdownKey, probKey, setActiveProblemBookmarkDropdownKey]);

  return (
    <article 
      id={viewMode === "focus" ? `single-view-card-${probKey}` : undefined}
      className={`glass-card problem-item ${viewMode === "focus" ? "single-view-card" : ""}`} 
      style={{ 
        borderLeft: isGenerated ? "4px solid var(--accent-purple)" : "1px solid var(--border-glass)",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        padding: viewMode === "focus" ? "2rem" : "1.25rem",
        margin: viewMode === "focus" ? 0 : undefined,
        minHeight: viewMode === "focus" ? "100%" : undefined,
        position: "relative"
      }}
    >
      {/* Header Row: Badge Metadata on Top, Control Buttons on Next Line */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "0.4rem" }}>
        <div className="problem-meta-row" style={{ margin: 0, display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          <span className={`badge ${isGenerated ? "badge-eval" : "badge-year"}`} style={isGenerated ? {background:"rgba(168,85,247,0.15)", color:"var(--accent-purple)"} : {}}>{prob.year}</span>
          <span className="badge badge-num">문 {prob.number}</span>
          <span className="badge badge-eval">{prob.category_eval}</span>
          <span className="badge badge-content">{prob.category_content}</span>
          
          {prob.category_detail_types && prob.category_detail_types.map((catType) => (
            <span key={catType} className="badge" style={{ background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.3)", color: "var(--accent-blue)" }}>
              🎯 {catType.substring(catType.indexOf(" ") + 1)}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end" }}>
          {prob.image_path && (
            <button
              className="btn-secondary"
              style={{ padding: "0.3rem 0.5rem", fontSize: "0.75rem", borderRadius: "6px", display: "flex", alignItems: "center", gap: "0.2rem" }}
              onClick={() => {
                const imgUrl = prob.image_path.startsWith('/') ? `.${prob.image_path}` : prob.image_path;
                setSelectedOrigImage(imgUrl);
                setIsOrigImageModalOpen(true);
              }}
            >
              🖼️ 원본 사진 확인하기
            </button>
          )}

          {/* Bookmark / Folder button */}
          <div style={{ position: "relative" }}>
            <button
              className="btn-secondary bookmark-btn"
              style={{
                padding: "0.3rem 0.5rem",
                fontSize: "0.75rem",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "0.2rem",
                border: isBookmarkedInAnyList
                  ? "1.5px solid var(--accent-amber)"
                  : "1px solid var(--border-glass)",
                color: isBookmarkedInAnyList
                  ? "var(--accent-amber)"
                  : "var(--text-secondary)",
                background: isBookmarkedInAnyList
                  ? "rgba(245, 158, 11, 0.08)"
                  : "transparent",
                fontWeight: isBookmarkedInAnyList
                  ? 700
                  : 500
              }}
              onClick={(e) => {
                e.stopPropagation();
                setActiveProblemBookmarkDropdownKey(
                  activeProblemBookmarkDropdownKey === probKey ? null : probKey
                );
              }}
            >
              {isBookmarkedInAnyList
                ? "★ 즐겨찾기"
                : "☆ 즐겨찾기"}
            </button>

            {activeProblemBookmarkDropdownKey === probKey && (
              <div
                className="bookmark-dropdown glass-card"
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "8px",
                  zIndex: 100,
                  width: "220px",
                  padding: "0.75rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-glass)",
                  boxShadow: "var(--card-shadow)",
                  borderRadius: "12px",
                  textAlign: "left"
                }}
              >
                <div style={{ fontSize: "0.8rem", fontWeight: 700, borderBottom: "1px solid var(--border-glass)", paddingBottom: "4px", color: "var(--text-primary)" }}>
                  {probSubject} 즐겨찾기 폴더
                </div>
                <div style={{ maxHeight: "120px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem", padding: "2px 0" }}>
                  {subjectBookmarkLists.length === 0 ? (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", padding: "4px 0" }}>생성된 폴더가 없습니다.</span>
                  ) : (
                    subjectBookmarkLists.map(lst => {
                      const isInList = lst.problems.some(bp => String(bp.year) === String(prob.year) && String(bp.number) === String(prob.number));
                      return (
                        <label
                          key={lst.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            color: "var(--text-secondary)",
                            userSelect: "none"
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isInList}
                            onChange={() => toggleProblemBookmarkMember(lst.id, prob.year, prob.number)}
                            style={{ accentColor: "var(--accent-amber)" }}
                          />
                          <span>{lst.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
                <div style={{ display: "flex", gap: "4px", borderTop: "1px solid var(--border-glass)", paddingTop: "6px", marginTop: "2px" }}>
                  <input
                    type="text"
                    placeholder="새 폴더 이름..."
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newListName.trim()) {
                        createProblemBookmarkList(newListName.trim()).then((success) => {
                          if (success) setNewListName("");
                        });
                      }
                    }}
                    style={{
                      flex: 1,
                      fontSize: "0.75rem",
                      padding: "3px 6px",
                      borderRadius: "4px",
                      border: "1px solid var(--border-glass)",
                      background: "rgba(255,255,255,0.03)",
                      color: "var(--text-primary)",
                      outline: "none"
                    }}
                  />
                  <button
                    className="btn-primary"
                    style={{ padding: "2px 8px", fontSize: "0.75rem", borderRadius: "4px" }}
                    onClick={() => {
                      if (newListName.trim()) {
                        createProblemBookmarkList(newListName.trim()).then((success) => {
                          if (success) setNewListName("");
                        });
                      }
                    }}
                  >
                    추가
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            className={isItemInCart(prob) ? "btn-primary" : "btn-secondary"}
            style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", gap: "0.25rem", borderRadius: "6px" }}
            onClick={() => toggleCart(prob)}
          >
            {isItemInCart(prob) ? (
              <>
                <IconCheck /> 카트 담김
              </>
            ) : (
              <>
                <IconPlus /> 담기
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Question Body Area */}
      <div className="problem-body" style={{ position: "relative" }}>
        {/* Children overlays (Canvas, Arrows etc. will overlay this element relative container) */}
        {children}

        {/* Question Title */}
        <h3 className="problem-header" style={{ fontSize: viewMode === "focus" ? "1.35rem" : "1.15rem", marginTop: "1rem", color: "var(--text-primary)" }}>
          문 {prob.number}. {renderText(prob.question, "question")}
        </h3>

        {/* Passage (지문) */}
        {!hidePassage && prob.passage && (
          <div className="passage-box" style={{ fontSize: viewMode === "focus" ? "1.05rem" : "0.95rem", lineHeight: viewMode === "focus" ? "1.7" : "1.6", padding: viewMode === "focus" ? "1.25rem 1.5rem" : "1rem 1.2rem", marginBottom: "1rem" }}>
            {renderText(prob.passage, "passage")}
          </div>
        )}

        {/* Box Content (<보기> 박스) */}
        {prob.box_content && (
          <div className="box-container" style={{ fontSize: viewMode === "focus" ? "1.05rem" : "0.92rem", lineHeight: viewMode === "focus" ? "1.6" : "1.5", padding: viewMode === "focus" ? "1.25rem 1.5rem" : "1rem 1.2rem", marginBottom: "1rem" }}>
            <div className="box-title">&lt;보 기&gt;</div>
            {renderText(prob.box_content, "box")}
          </div>
        )}
      </div>

      {/* 5지선다 선지 (Options) */}
      <div className="options-list" style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
        {prob.options && prob.options.map((opt, idx) => {
          const optNumber = idx + 1;
          const isSelected = solved && solved.selected_option === optNumber;
          const isCorrectAnswer = prob.answer === optNumber;
          
          let optClass = "option-item";
          if (isAnswerToggled) {
            if (isCorrectAnswer) optClass += " correct";
            else if (isSelected) optClass += " incorrect";
          } else if (isSelected) {
            optClass += " selected";
          }

          return (
            <div 
              key={idx} 
              className={optClass}
              style={{ 
                fontSize: viewMode === "focus" ? "1.05rem" : "0.95rem", 
                padding: viewMode === "focus" ? "0.8rem 1.2rem" : "0.6rem 0.95rem",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              onClick={() => handleSelectOption(prob, idx)}
            >
              {opt}
            </div>
          );
        })}
      </div>

      {/* Show/Hide answer toggler */}
      <div className="memo-area" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {prob.trap_category && (
            <button
              className="memo-toggle-btn"
              onClick={() => setVisibleHints(prev => ({ ...prev, [probKey]: !prev[probKey] }))}
              style={isHintToggled ? { color: "var(--accent-purple)", fontWeight: 600 } : {}}
            >
              💡 {isHintToggled ? "힌트 가리기" : "힌트 확인하기"}
            </button>
          )}
          <button
            className="memo-toggle-btn"
            onClick={() => setVisibleAnswers(prev => ({ ...prev, [probKey]: !isAnswerToggled }))}
            style={isAnswerToggled ? { color: "var(--accent-green)", fontWeight: 600 } : {}}
          >
            {isAnswerToggled ? "🙈 정답 가리기" : "👁️ 정답 확인"}
          </button>
        </div>
      </div>

      {/* Hint panel */}
      {isHintToggled && prob.trap_category && (
        <div 
          className="hint-panel glass-card" 
          style={{ 
            marginTop: "0.5rem", 
            padding: "0.85rem 1.1rem", 
            borderLeft: "3.5px solid var(--accent-purple)",
            background: "rgba(168, 85, 247, 0.05)",
            fontSize: "0.9rem",
            color: "var(--text-secondary)",
            borderRadius: "8px"
          }}
        >
          <strong style={{ color: "var(--accent-purple)" }}>함정 유형:</strong> {prob.trap_category}
          {prob.trap_hint && (
            <div style={{ marginTop: "0.4rem" }}>
              <strong>클릭 힌트:</strong> {prob.trap_hint}
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export default ProblemCard;
