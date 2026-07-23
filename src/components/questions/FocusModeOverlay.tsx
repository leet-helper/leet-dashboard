import React from "react";
import CanvasOverlay from "./CanvasOverlay";
import RelationshipArrowsOverlay from "./RelationshipArrowsOverlay";
import { IconClose, IconPlus, IconCheck, IconEdit } from "../Icons";
import ProblemCard from "./ProblemCard";
import { getProblemKey } from "../../utils";

const FocusModeOverlay = ({
  isOpen,
  onClose,
  problemsToSolve,
  singleViewIndex,
  setSingleViewIndex,
  solvedRecords,
  handleSelectOption,
  notes,
  handleSaveMemo,
  activeMemos,
  setActiveMemos,
  visibleAnswers,
  setVisibleAnswers,
  visibleHints,
  setVisibleHints,
  cart,
  toggleCart,
  isDrawMode,
  setIsDrawMode,
  canvasDrawings,
  setCanvasDrawings,
  brushColor,
  setBrushColor,
  brushWidth,
  setBrushWidth,
  brushType,
  setBrushType,
  arrows,
  setArrows,
  dragStartKey,
  setDragStartKey,
  dragCurrentCoords,
  setDragCurrentCoords,
  dragTargetKey,
  setDragTargetKey,
  highlightedWords,
  setHighlightedWords,
  currentUser,
  setEditProblem,
  setIsEditModalOpen,
  setSelectedOrigImage,
  setIsOrigImageModalOpen,
  isFullscreen,
  toggleFullscreen,
  problemBookmarkLists = [],
  activeProblemBookmarkDropdownKey,
  setActiveProblemBookmarkDropdownKey,
  createProblemBookmarkList,
  toggleProblemBookmarkMember,
  isCartShuffled,
  toggleCartShuffle,
  isVerbal,
  singleViewType
}: any) => {
  const [stopwatchTime, setStopwatchTime] = React.useState(0);
  const [questionStopwatchTime, setQuestionStopwatchTime] = React.useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = React.useState(false);


  // Auto-start and reset when opening Focus Mode
  React.useEffect(() => {
    if (isOpen) {
      setStopwatchTime(0);
      setQuestionStopwatchTime(0);
      setIsStopwatchRunning(true);
      setIsDrawMode(false); // Force drawing mode off in Single View mode
    } else {
      setIsStopwatchRunning(false);
    }
  }, [isOpen]);

  // Reset per-question stopwatch when switching questions
  React.useEffect(() => {
    if (isOpen) {
      setQuestionStopwatchTime(0);
    }
  }, [singleViewIndex]);

  React.useEffect(() => {
    let interval = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchTime(prev => prev + 1);
        setQuestionStopwatchTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleEscKey = (e) => {
    if (!isOpen || problemsToSolve.length === 0) return;
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowLeft") {
      setSingleViewIndex(prev => Math.max(0, prev - 1));
    } else if (e.key === "ArrowRight") {
      setSingleViewIndex(prev => Math.min(problemsToSolve.length - 1, prev + 1));
    }
  };

  React.useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [problemsToSolve.length, isOpen]);

  if (!isOpen || problemsToSolve.length === 0) return null;

  const prob = problemsToSolve[singleViewIndex];
  if (!prob) return null;
  const probKey = getProblemKey(prob);


  const handleCreateArrow = (fromKey, toKey) => {
    const id = Math.random().toString(36).substring(2, 9);
    const isDuplicate = arrows.some(a => a.fromKey === fromKey && a.toKey === toKey);
    if (isDuplicate) return;
    setArrows(prev => [...prev, { id, fromKey, toKey }]);
  };

  const renderHighlightableText = (text, currentProbKey, textType) => {
    if (!text) return "";
    const cleanText = text.replace(/\\n/g, "\n");
    const lines = cleanText.split("\n");
    
    return lines.map((line, lineIdx) => {
      const words = line.split(" ");
      return (
        <div key={lineIdx} style={{ display: "block", minHeight: line.trim() === "" ? "1.2em" : "auto" }}>
          {words.map((word, wordIdx) => {
            const wordKey = `${currentProbKey}_${textType}_${lineIdx}_${wordIdx}`;
            const isHighlighted = !!highlightedWords[wordKey];
            
            return (
              <span key={wordIdx} style={{ display: "inline", whiteSpace: "normal" }}>
                <span
                  id={wordKey}
                  className="highlightable-word-span"
                  data-word-key={wordKey}
                  onPointerDown={(e) => {
                    const isPenOrMouse = e.pointerType === 'pen' || e.pointerType === 'mouse';
                    if (!isPenOrMouse) return;

                    e.preventDefault();
                    setDragStartKey(wordKey);
                    setDragTargetKey(null);
                    
                    try {
                      e.currentTarget.setPointerCapture(e.pointerId);
                    } catch (err) {
                      console.log("setPointerCapture failed", err);
                    }

                    const svgEl = document.getElementById(`relationship-arrows-svg-${currentProbKey}`);
                    if (svgEl) {
                      const rect = svgEl.getBoundingClientRect();
                      setDragCurrentCoords({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
                      });
                    } else {
                      const parentCard = document.getElementById(`single-view-card-${currentProbKey}`);
                      if (parentCard) {
                        const rect = parentCard.getBoundingClientRect();
                        setDragCurrentCoords({
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top
                        });
                      }
                    }
                  }}
                  onPointerMove={(e) => {
                    const isPenOrMouse = e.pointerType === 'pen' || e.pointerType === 'mouse';
                    if (!isPenOrMouse || !dragStartKey) return;

                    e.preventDefault();
                    
                    const svgEl = document.getElementById(`relationship-arrows-svg-${currentProbKey}`);
                    if (svgEl) {
                      const rect = svgEl.getBoundingClientRect();
                      setDragCurrentCoords({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
                      });
                    } else {
                      const parentCard = document.getElementById(`single-view-card-${currentProbKey}`);
                      if (parentCard) {
                        const rect = parentCard.getBoundingClientRect();
                        setDragCurrentCoords({
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top
                        });
                      }
                    }

                    const element = document.elementFromPoint(e.clientX, e.clientY);
                    const wordSpan = element?.closest('.highlightable-word-span');
                    if (wordSpan) {
                      const toKey = wordSpan.getAttribute('data-word-key');
                      if (toKey && toKey !== dragStartKey && toKey.startsWith(currentProbKey)) {
                        setDragTargetKey(toKey);
                      } else {
                        setDragTargetKey(null);
                      }
                    } else {
                      setDragTargetKey(null);
                    }
                  }}
                  onPointerUp={(e) => {
                    const isPenOrMouse = e.pointerType === 'pen' || e.pointerType === 'mouse';
                    if (!isPenOrMouse) return;

                    e.preventDefault();
                    try {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                    } catch (err) {
                      // ignore
                    }

                    if (!dragStartKey) return;

                    const element = document.elementFromPoint(e.clientX, e.clientY);
                    const wordSpan = element?.closest('.highlightable-word-span');
                    
                    if (wordSpan) {
                      const toKey = wordSpan.getAttribute('data-word-key');
                      if (toKey && toKey !== dragStartKey) {
                        handleCreateArrow(dragStartKey, toKey);
                      } else if (toKey === dragStartKey) {
                        setHighlightedWords(prev => ({
                          ...prev,
                          [dragStartKey]: !prev[dragStartKey]
                        }));
                      }
                    } else {
                      setDragTargetKey(null);
                    }
                    setDragStartKey(null);
                    setDragCurrentCoords(null);
                  }}
                  style={{
                    backgroundColor: isHighlighted ? "rgba(234, 179, 8, 0.45)" : "transparent",
                    borderRadius: "4px",
                    padding: "2px 0",
                    margin: "0 1px",
                    cursor: "pointer",
                    userSelect: "none",
                    display: "inline-block",
                    whiteSpace: "nowrap"
                  }}
                >
                  {word}
                </span>
                {" "}
              </span>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="single-view-overlay">
      <div className="single-view-container">

        {/* Header Controls */}
        <div className="single-view-header" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "stretch", padding: "0.75rem 1.5rem" }}>
          {/* Row 1: Progress & Stopwatch */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span className="single-view-progress" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                문항
                <select
                  value={singleViewIndex}
                  onChange={(e) => setSingleViewIndex(parseInt(e.target.value))}
                  className="focus-question-select"
                >
                  {problemsToSolve.map((p, idx) => {
                    const label = p.year === "생성된 문제"
                      ? `${idx + 1} (생성 ${p.number}번)`
                      : `${idx + 1} (${p.year} ${p.number}번)`;
                    return (
                      <option key={idx} value={idx} style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                        {label}
                      </option>
                    );
                  })}
                </select>
                / {problemsToSolve.length}
              </span>

              {!isVerbal && singleViewType === "cart" && (
                <button
                  className="btn-secondary"
                  style={{
                    padding: "0.35rem 0.75rem",
                    fontSize: "0.8rem",
                    borderRadius: "6px",
                    gap: "0.35rem",
                    border: isCartShuffled ? "1.5px solid var(--accent-cyan)" : "1px solid var(--border-glass)",
                    background: isCartShuffled ? "rgba(34,211,238,0.12)" : "transparent",
                    color: isCartShuffled ? "var(--accent-cyan)" : "var(--text-primary)",
                    fontWeight: isCartShuffled ? 700 : 500,
                    transition: "all 0.15s ease"
                  }}
                  onClick={toggleCartShuffle}
                  title="장바구니 풀기 순서를 랜덤하게 뒤섞습니다."
                >
                  {isCartShuffled ? "🔀 랜덤 순서" : "🔢 원래 순서"}
                </button>
              )}
            </div>

            {/* Stopwatch Widget */}
            <div className="stopwatch-container focus-stopwatch-container" style={{ margin: 0 }}>
              <span style={{ fontSize: "1rem", lineHeight: "1" }}>⏱️</span>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: "1.2" }}>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>전체 누적</span>
                <span style={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 700 }}>
                  {formatTime(stopwatchTime)}
                </span>
              </div>
              <div style={{ width: "1px", height: "20px", background: "var(--border-glass)" }}></div>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: "1.2" }}>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>현재 문항</span>
                <span style={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-cyan)" }}>
                  {formatTime(questionStopwatchTime)}
                </span>
              </div>
              <button
                className="btn-secondary"
                style={{ padding: "2px 6px", fontSize: "0.7rem", borderRadius: "6px", minWidth: "40px", marginLeft: "0.25rem" }}
                onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
              >
                {isStopwatchRunning ? "일시정지" : "시작"}
              </button>
              <button
                className="btn-secondary"
                style={{ padding: "2px 6px", fontSize: "0.7rem", borderRadius: "6px", minWidth: "40px" }}
                onClick={() => {
                  setIsStopwatchRunning(false);
                  setStopwatchTime(0);
                  setQuestionStopwatchTime(0);
                }}
              >
                초기화
              </button>
          </div>

          {/* Row 2: Drawing Tools & Editing controls (Temporarily blocked by user request) */}
          {/*
          <div className="pencil-toolbar" style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap", width: "100%" }}>
            <button 
              className={`btn-secondary ${isDrawMode ? "active" : ""}`}
              style={isDrawMode ? { border: "1.5px solid var(--accent-blue)", background: "rgba(59,130,246,0.12)" } : {}}
              onClick={() => setIsDrawMode(!isDrawMode)}
            >
              ✍️ 필기모드 {isDrawMode ? "켜짐" : "꺼짐"}
            </button>
            
            {isDrawMode && (
              <>
                <div style={{ display: "flex", gap: "0.2rem", background: "rgba(255,255,255,0.03)", padding: "2px", borderRadius: "8px", border: "1px solid var(--border-glass)", marginRight: "0.25rem" }}>
                  <button
                    className={`btn-tool-chip ${brushType === 'pen' ? 'active' : ''}`}
                    onClick={() => setBrushType('pen')}
                    style={{
                      padding: "4px 8px",
                      fontSize: "11px",
                      border: "none",
                      borderRadius: "6px",
                      background: brushType === 'pen' ? 'var(--accent-blue)' : 'transparent',
                      color: brushType === 'pen' ? '#fff' : 'var(--text-secondary)',
                      cursor: "pointer",
                      fontWeight: brushType === 'pen' ? 700 : 500,
                      transition: "all 0.15s ease"
                    }}
                  >
                    🖊️ 펜
                  </button>
                  <button
                    className={`btn-tool-chip ${brushType === 'highlighter' ? 'active' : ''}`}
                    onClick={() => setBrushType('highlighter')}
                    style={{
                      padding: "4px 8px",
                      fontSize: "11px",
                      border: "none",
                      borderRadius: "6px",
                      background: brushType === 'highlighter' ? 'var(--accent-blue)' : 'transparent',
                      color: brushType === 'highlighter' ? '#fff' : 'var(--text-secondary)',
                      cursor: "pointer",
                      fontWeight: brushType === 'highlighter' ? 700 : 500,
                      transition: "all 0.15s ease"
                    }}
                  >
                    🖍️ 형광펜
                  </button>
                  <button
                    className={`btn-tool-chip ${brushType === 'eraser' ? 'active' : ''}`}
                    onClick={() => setBrushType('eraser')}
                    style={{
                      padding: "4px 8px",
                      fontSize: "11px",
                      border: "none",
                      borderRadius: "6px",
                      background: brushType === 'eraser' ? 'var(--accent-blue)' : 'transparent',
                      color: brushType === 'eraser' ? '#fff' : 'var(--text-secondary)',
                      cursor: "pointer",
                      fontWeight: brushType === 'eraser' ? 700 : 500,
                      transition: "all 0.15s ease"
                    }}
                  >
                    🧹 지우개
                  </button>
                </div>

                {brushType !== "eraser" && (
                  <>
                    <input 
                      type="color" 
                      value={brushColor.startsWith("rgba") ? "#ef4444" : brushColor} 
                      onChange={(e) => setBrushColor(e.target.value)}
                      style={{ width: "24px", height: "24px", border: "none", cursor: "pointer", borderRadius: "50%", background: "transparent" }}
                      title="펜 색상 선택"
                    />
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={brushWidth} 
                      onChange={(e) => setBrushWidth(parseInt(e.target.value))}
                      style={{ width: "70px", accentColor: "var(--accent-blue)" }}
                      title="펜 굵기 조절"
                    />
                  </>
                )}

                <button 
                  className="btn-secondary" 
                  style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem", marginLeft: "0.25rem" }}
                  onClick={() => {
                    if (window.undoCurrentCanvas) window.undoCurrentCanvas();
                  }}
                  title="필기 뒤로가기"
                >
                  ↩️ 실행 취소
                </button>
                <button 
                  className="btn-secondary" 
                  style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem" }}
                  onClick={() => {
                    if (window.redoCurrentCanvas) window.redoCurrentCanvas();
                  }}
                  title="필기 앞으로가기"
                >
                  ↪️ 다시 실행
                </button>
                
                <button 
                  className="btn-secondary" 
                  style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem", color: "var(--accent-rose)", borderColor: "rgba(244,63,94,0.2)" }}
                  onClick={() => {
                    if (window.clearCurrentCanvas) window.clearCurrentCanvas();
                  }}
                >
                  🧹 필기 전체 지우기
                </button>
              </>
            )}
          </div>
          */}

            {/* Clear all arrows connection on this problem button */}
            {arrows.some(a => a.fromKey.startsWith(probKey)) && (
              <button
                className="btn-secondary"
                style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem", color: "var(--accent-yellow)", borderColor: "rgba(234,179,8,0.2)" }}
                onClick={() => setArrows(prev => prev.filter(a => !a.fromKey.startsWith(probKey)))}
              >
                🔗 선 전체 삭제
              </button>
            )}
            
            {/* Clear highlight words button */}
            {Object.keys(highlightedWords).some(k => k.startsWith(probKey) && highlightedWords[k]) && (
              <button
                className="btn-secondary"
                style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem", color: "var(--accent-yellow)", borderColor: "rgba(234,179,8,0.2)" }}
                onClick={() => {
                  setHighlightedWords(prev => {
                    const copy = { ...prev };
                    Object.keys(copy).forEach(k => {
                      if (k.startsWith(probKey)) delete copy[k];
                    });
                    return copy;
                  });
                }}
              >
                ✨ 하이라이트 해제
              </button>
            )}
          </div>

          {/* Row 3: Action & Navigation Buttons */}
          <div style={{ display: "flex", gap: "0.4rem", width: "100%", justifyContent: "flex-end" }}>
            <button 
              className="btn-secondary nav-btn"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? "📴 창 모드" : "📺 전체화면"}
            </button>
            <button 
              className="btn-secondary nav-btn" 
              onClick={() => setSingleViewIndex(prev => Math.max(0, prev - 1))}
              disabled={singleViewIndex === 0}
            >
              ◀ 이전 (←)
            </button>
            <button 
              className="btn-secondary nav-btn" 
              onClick={() => setSingleViewIndex(prev => Math.min(problemsToSolve.length - 1, prev + 1))}
              disabled={singleViewIndex === problemsToSolve.length - 1}
            >
              다음 (→) ▶
            </button>
            <button className="btn-primary close-btn" onClick={onClose} style={{ background: "var(--accent-rose)", borderColor: "var(--accent-rose)" }}>
              종료 (ESC)
            </button>
          </div>
        </div>
        
        {/* Guide Banner */}
        <div className="single-view-guide-banner" style={{
          background: "rgba(6, 182, 212, 0.05)",
          border: "1px solid rgba(6, 182, 212, 0.15)",
          borderLeft: "4px solid var(--accent-cyan)",
          borderRadius: "10px",
          padding: "0.6rem 1rem",
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
          display: "flex",
          alignItems: "flex-start",
          gap: "0.6rem",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          lineHeight: "1.4"
        }}>
          <span style={{ fontSize: "1.1rem", lineHeight: "1" }}>💡</span>
          <span>
            마우스나 애플펜슬, s펜 등으로 단어끼리 드래그하면 연결선이 표시됩니다. 단어를 클릭하면 단어 하이라이트가 가능합니다.
          </span>
        </div>
        
        {/* Main Card Wrapper */}
        <div className="single-view-card-wrapper">
          <ProblemCard
            prob={prob}
            viewMode="focus"
            solvedRecords={solvedRecords}
            handleSelectOption={handleSelectOption}
            notes={notes}
            handleSaveMemo={handleSaveMemo}
            activeMemos={activeMemos}
            setActiveMemos={setActiveMemos}
            visibleAnswers={visibleAnswers}
            setVisibleAnswers={setVisibleAnswers}
            visibleHints={visibleHints}
            setVisibleHints={setVisibleHints}
            cart={cart}
            toggleCart={toggleCart}
            setSelectedOrigImage={setSelectedOrigImage}
            setIsOrigImageModalOpen={setIsOrigImageModalOpen}
            problemBookmarkLists={problemBookmarkLists}
            activeProblemBookmarkDropdownKey={activeProblemBookmarkDropdownKey}
            setActiveProblemBookmarkDropdownKey={setActiveProblemBookmarkDropdownKey}
            createProblemBookmarkList={createProblemBookmarkList}
            toggleProblemBookmarkMember={toggleProblemBookmarkMember}
            renderHighlightableText={renderHighlightableText}
          >
            {/* Pencil drawing canvas overlay layer */}
            <CanvasOverlay
              key={probKey}
              probKey={probKey}
              isDrawMode={isDrawMode}
              brushColor={brushColor}
              brushWidth={brushWidth}
              brushType={brushType}
              canvasDrawings={canvasDrawings}
              setCanvasDrawings={setCanvasDrawings}
            />

            {/* Word relationship connectors (Arrows) layer */}
            <RelationshipArrowsOverlay
              probKey={probKey}
              arrows={arrows}
              setArrows={setArrows}
              dragStartKey={dragStartKey}
              dragCurrentCoords={dragCurrentCoords}
              dragTargetKey={dragTargetKey}
            />
          </ProblemCard>
        </div>
      </div>
    </div>
  );
};

export default FocusModeOverlay;
