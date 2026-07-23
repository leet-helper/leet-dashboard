import React, { useState, useEffect } from "react";
import RelationshipArrowsOverlay from "../questions/RelationshipArrowsOverlay";
import CanvasOverlay from "../questions/CanvasOverlay";
import { IconTrash, IconEdit } from "../Icons";

export default function FreeNoteViewer({
  theme = "dark",
  freeNotes = [],
  setFreeNotes = (_val?: any) => {},
  activeNoteId = "default",
  setActiveNoteId = (_val?: any) => {}
}: any) {
  const activeNote = freeNotes.find(n => n.id === activeNoteId) || freeNotes[0] || {
    id: "default",
    title: "새 분석 노트",
    text: "",
    highlights: {},
    arrows: [],
    drawing: null,
    fontSize: 16,
    lineHeight: 1.8,
    isTwoColumn: false
  };

  const [isAnalyzeMode, setIsAnalyzeMode] = useState(false);
  const [localText, setLocalText] = useState(activeNote.text);
  const [highlightColor, setHighlightColor] = useState("yellow"); // 'yellow' | 'pink' | 'green' | 'blue'

  // Draw modes
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [brushColor, setBrushColor] = useState("#22d3ee"); // cyan default
  const [brushWidth, setBrushWidth] = useState(3);
  const [brushType, setBrushType] = useState("pen"); // 'pen' or 'eraser'

  // Drag states for arrows
  const [dragStartKey, setDragStartKey] = useState(null);
  const [dragCurrentCoords, setDragCurrentCoords] = useState(null);
  const [dragTargetKey, setDragTargetKey] = useState(null);

  // Sync activeNote text to localText when activeNote changes
  useEffect(() => {
    setLocalText(activeNote.text);
    if (activeNote.text && activeNote.text.trim() !== "") {
      setIsAnalyzeMode(true);
    } else {
      setIsAnalyzeMode(false);
    }
    setIsDrawMode(false);
  }, [activeNoteId, activeNote.text]);

  const updateActiveNote = (updates) => {
    setFreeNotes(prev => prev.map(note => 
      note.id === activeNote.id ? { ...note, ...updates } : note
    ));
  };



  const handleCreateArrow = (fromKey, toKey) => {
    const id = `arrow_${Date.now()}`;
    const isDuplicate = activeNote.arrows.some(a => a.fromKey === fromKey && a.toKey === toKey);
    if (isDuplicate) return;
    updateActiveNote({ arrows: [...activeNote.arrows, { id, fromKey, toKey }] });
  };

  const handleClearHighlights = () => {
    updateActiveNote({ highlights: {} });
  };

  const handleClearArrows = () => {
    updateActiveNote({ arrows: [] });
  };

  const handleClearDrawing = () => {
    updateActiveNote({ drawing: null });
    // Also trigger the clear function of the CanvasOverlay if available
    if (window.clearCurrentCanvas) {
      window.clearCurrentCanvas();
    }
  };

  const handleClearAll = () => {
    if (window.confirm("노트의 모든 텍스트, 형광펜, 연결선, 필기 데이터를 초기화하시겠습니까?")) {
      setLocalText("");
      updateActiveNote({
        text: "",
        highlights: {},
        arrows: [],
        drawing: null
      });
      setIsAnalyzeMode(false);
      setIsDrawMode(false);
    }
  };

  const handleStartAnalysis = () => {
    if (!localText.trim()) {
      alert("텍스트를 입력해 주세요.");
      return;
    }
    updateActiveNote({ text: localText });
    setIsAnalyzeMode(true);
  };

  const handleEditText = () => {
    setIsAnalyzeMode(false);
    setIsDrawMode(false);
  };

  // Expose bridge for CanvasOverlay drawings
  const bridgeCanvasDrawings = {
    [activeNote.id]: activeNote.drawing || null
  };
  const handleBridgeSetCanvasDrawings = (updater) => {
    const updated = typeof updater === "function" ? updater(bridgeCanvasDrawings) : updater;
    const dataUrl = updated[activeNote.id];
    updateActiveNote({ drawing: dataUrl });
  };

  // Stats calculation
  const charCount = localText.length;
  const charCountNoSpace = localText.replace(/\s/g, "").length;
  const wordCount = localText.trim() ? localText.trim().split(/\s+/).length : 0;
  const readTimeEst = Math.max(1, Math.round(charCount / 400)); // ~400 chars per min reading speed

  const renderHighlightableText = (text, currentProbKey, textType) => {
    if (!text) return "";
    const cleanText = text.replace(/\\n/g, "\n");
    const lines = cleanText.split("\n");
    
    return lines.map((line, lineIdx) => {
      const words = line.split(" ");
      return (
        <div key={lineIdx} style={{ display: "block", minHeight: line.trim() === "" ? "1.2em" : "auto", lineHeight: activeNote.lineHeight || 1.8, margin: "6px 0" }}>
          {words.map((word, wordIdx) => {
            const wordKey = `${currentProbKey}_${textType}_${lineIdx}_${wordIdx}`;
            const isHighlighted = !!activeNote.highlights?.[wordKey];
            
            return (
              <span key={wordIdx} style={{ display: "inline", whiteSpace: "normal" }}>
                <span
                  id={wordKey}
                  className="highlightable-word-span"
                  data-word-key={wordKey}
                  onPointerDown={(e) => {
                    if (isDrawMode) return; // Ignore word highlights while drawing
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
                    }
                  }}
                  onPointerMove={(e) => {
                    if (isDrawMode || !dragStartKey) return;
                    const isPenOrMouse = e.pointerType === 'pen' || e.pointerType === 'mouse';
                    if (!isPenOrMouse) return;

                    e.preventDefault();
                    
                    const svgEl = document.getElementById(`relationship-arrows-svg-${currentProbKey}`);
                    if (svgEl) {
                      const rect = svgEl.getBoundingClientRect();
                      setDragCurrentCoords({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
                      });
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
                    if (isDrawMode) return;
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
                        const newHighlights = { ...activeNote.highlights };
                        const currentVal = newHighlights[dragStartKey];
                        const activeVal = highlightColor;
                        if (currentVal === activeVal || (currentVal === true && activeVal === "yellow")) {
                          delete newHighlights[dragStartKey];
                        } else {
                          newHighlights[dragStartKey] = activeVal;
                        }
                        updateActiveNote({ highlights: newHighlights });
                      }
                    } else {
                      setDragTargetKey(null);
                    }
                    setDragStartKey(null);
                    setDragCurrentCoords(null);
                  }}
                  style={{
                    backgroundColor: isHighlighted 
                      ? (activeNote.highlights[wordKey] === true || activeNote.highlights[wordKey] === "yellow" ? "rgba(234, 179, 8, 0.45)"
                        : activeNote.highlights[wordKey] === "pink" ? "rgba(244, 63, 94, 0.4)"
                        : activeNote.highlights[wordKey] === "green" ? "rgba(16, 185, 129, 0.4)"
                        : activeNote.highlights[wordKey] === "blue" ? "rgba(14, 165, 233, 0.4)"
                        : "rgba(234, 179, 8, 0.45)") // fallback
                      : "transparent",
                    borderRadius: "4px",
                    padding: "2px 2px",
                    margin: "0 1px",
                    cursor: isDrawMode ? "default" : "pointer",
                    transition: "background-color 0.1s ease",
                    fontSize: `${activeNote.fontSize || 16}px`,
                    fontWeight: isHighlighted ? "700" : "400",
                    color: "var(--text-primary)"
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
    <div style={{ display: "flex", flex: 1, height: "100vh", overflow: "hidden" }}>
      {/* 🖨️ PDF/인쇄 최적화 스타일링 */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide all UI elements except the document sheet */
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          nav, 
          header,
          .sidebar,
          div[style*="width: 250px"], /* Sidebar Note List Manager */
          .glass-header, /* Header toolbar */
          div[style*="padding: 0.5rem 1.5rem"], /* Stats footer */
          .problems-header,
          .viewer-tabs,
          .floating-toolbar,
          button,
          .btn-primary,
          .btn-secondary {
            display: none !important;
          }
          .main-content {
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            overflow: visible !important;
            height: auto !important;
          }
          #freenote-print-area {
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 1.5cm !important; /* Elegant A4 print margins */
            border-radius: 0 !important;
          }
          .highlightable-word-span {
            color: #000000 !important;
          }
          /* Ensure SVGs and Canvas drawings are printed correctly */
          canvas, svg {
            display: block !important;
          }
        }
      `}} />
      
      

      {/* 2. Main Workspace: A4 Document Layout */}
      <main className="main-content" style={{ display: "flex", flexDirection: "column", flex: 1, height: "100vh", overflow: "hidden", position: "relative" }}>
        
        {/* Header toolbar */}
        <div 
          className="glass-header" 
          style={{ 
            padding: "0.85rem 1.5rem", 
            borderBottom: "1px solid var(--border-glass)", 
            flexShrink: 0, 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            background: "rgba(0,0,0,0.15)"
          }}
        >
          {/* Note Title & Mode Switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>
              {activeNote.title}
            </span>
            
            {isAnalyzeMode ? (
              <button 
                className="btn-secondary" 
                onClick={handleEditText} 
                style={{ padding: "4px 10px", fontSize: "11px", borderRadius: "6px" }}
              >
                ✏️ 텍스트 편집
              </button>
            ) : (
              <button 
                className="btn-primary" 
                onClick={handleStartAnalysis}
                disabled={!localText.trim()}
                style={{ padding: "4px 10px", fontSize: "11px", borderRadius: "6px" }}
              >
                ⚡ 분석 모드 시작
              </button>
            )}
          </div>

          {/* Reading settings and clear actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            
            {/* 2단 보기 및 필기모드 토글 (분석 모드에서만 활성화) */}
            {isAnalyzeMode && (
              <>
                <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "11.5px", cursor: "pointer", color: "var(--text-secondary)" }}>
                  <input
                    type="checkbox"
                    checked={!!activeNote.isTwoColumn}
                    onChange={(e) => updateActiveNote({ isTwoColumn: e.target.checked })}
                    style={{ accentColor: "var(--accent-blue)" }}
                  />
                  <span>📖 2단 보기</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "11.5px", cursor: "pointer", color: "var(--text-secondary)" }}>
                  <input
                    type="checkbox"
                    checked={isDrawMode}
                    onChange={(e) => setIsDrawMode(e.target.checked)}
                    style={{ accentColor: "var(--accent-cyan)" }}
                  />
                  <span>✏️ 필기 모드</span>
                </label>

                {/* 형광펜 색상 선택 (필기 모드가 아닐 때 노출) */}
                {!isDrawMode && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", borderRight: "1px solid var(--border-glass)", paddingRight: "0.5rem", marginLeft: "0.25rem" }}>
                    <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginRight: "0.2rem" }}>🖍️ 형광펜:</span>
                    {[
                      { name: "노랑", value: "yellow", color: "#eab308" },
                      { name: "분홍", value: "pink", color: "#f43f5e" },
                      { name: "초록", value: "green", color: "#10b981" },
                      { name: "하늘", value: "blue", color: "#0ea5e9" }
                    ].map(item => (
                      <button
                        key={item.value}
                        onClick={() => setHighlightColor(item.value)}
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          background: item.color,
                          border: highlightColor === item.value ? "2px solid white" : "1px solid rgba(255,255,255,0.2)",
                          cursor: "pointer",
                          padding: 0,
                          boxShadow: highlightColor === item.value ? "0 0 6px rgba(255,255,255,0.6)" : "none",
                          transition: "all 0.15s ease"
                        }}
                        title={`${item.name} 형광펜`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* 글자 크기 조절 */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", borderRight: "1px solid var(--border-glass)", paddingRight: "0.5rem" }}>
              <button 
                onClick={() => updateActiveNote({ fontSize: Math.max(5, (activeNote.fontSize || 16) - 1) })}
                style={{ background: "transparent", border: "1px solid var(--border-glass)", color: "white", padding: "2px 6px", fontSize: "11px", cursor: "pointer", borderRadius: "4px" }}
                title="글자 크기 축소"
              >
                A-
              </button>
              <span style={{ fontSize: "11px", minWidth: "28px", textAlign: "center", color: "var(--text-secondary)" }}>{(activeNote.fontSize || 16)}px</span>
              <button 
                onClick={() => updateActiveNote({ fontSize: Math.min(24, (activeNote.fontSize || 16) + 1) })}
                style={{ background: "transparent", border: "1px solid var(--border-glass)", color: "white", padding: "2px 6px", fontSize: "11px", cursor: "pointer", borderRadius: "4px" }}
                title="글자 크기 확대"
              >
                A+
              </button>
            </div>

            {/* 줄 간격 조절 */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", borderRight: "1px solid var(--border-glass)", paddingRight: "0.5rem" }}>
              <button 
                onClick={() => updateActiveNote({ lineHeight: Math.max(0.5, (activeNote.lineHeight || 1.8) - 0.1) })}
                style={{ background: "transparent", border: "1px solid var(--border-glass)", color: "white", padding: "2px 6px", fontSize: "11px", cursor: "pointer", borderRadius: "4px" }}
                title="줄간격 축소"
              >
                줄-
              </button>
              <span style={{ fontSize: "11px", minWidth: "32px", textAlign: "center", color: "var(--text-secondary)" }}>{(activeNote.lineHeight || 1.8).toFixed(1)}</span>
              <button 
                onClick={() => updateActiveNote({ lineHeight: Math.min(2.2, (activeNote.lineHeight || 1.8) + 0.1) })}
                style={{ background: "transparent", border: "1px solid var(--border-glass)", color: "white", padding: "2px 6px", fontSize: "11px", cursor: "pointer", borderRadius: "4px" }}
                title="줄간격 확대"
              >
                줄+
              </button>
            </div>

            {/* Action buttons */}
            {isAnalyzeMode && (
              <div style={{ display: "flex", gap: "0.25rem" }}>
                <button className="btn-secondary" onClick={handleClearHighlights} style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "4px" }} title="형광펜 지우기">
                  🖍️ 펜 지우기
                </button>
                <button className="btn-secondary" onClick={handleClearArrows} style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "4px" }} title="연결선 지우기">
                  🔄 선 지우기
                </button>
                {activeNote.drawing && (
                  <button className="btn-secondary" onClick={handleClearDrawing} style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "4px" }} title="필기 캔버스 지우기">
                    🎨 필기 지우기
                  </button>
                )}
              </div>
            )}
            
            <button className="btn-secondary" onClick={handleClearAll} style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "4px", color: "var(--accent-rose)", borderColor: "rgba(244, 63, 94, 0.3)" }}>
              🧹 전체 비우기
            </button>
            <button className="btn-secondary" onClick={() => window.print()} style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "4px", display: "inline-flex", alignItems: "center", gap: "0.25rem" }} title="A4 레이아웃 PDF 저장 / 인쇄">
              🖨️ PDF / 인쇄
            </button>
          </div>
        </div>

        {/* 🖌️ Floating Stylus/Pen Settings Toolbar */}
        {isAnalyzeMode && isDrawMode && (
          <div 
            className="glass-card" 
            style={{ 
              position: "absolute", 
              top: "60px", 
              right: "30px", 
              zIndex: 100, 
              padding: "0.75rem", 
              display: "flex", 
              flexDirection: "column", 
              gap: "0.6rem",
              background: "rgba(10, 10, 10, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)" 
            }}
          >
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>🖌️ 브러시 설정</span>
            
            {/* Brush Type Toggle */}
            <div style={{ display: "flex", gap: "2px", background: "rgba(0,0,0,0.4)", padding: "2px", borderRadius: "6px" }}>
              <button 
                onClick={() => setBrushType("pen")} 
                style={{ flex: 1, padding: "4px 8px", fontSize: "10.5px", border: "none", borderRadius: "4px", background: brushType === "pen" ? "var(--accent-blue)" : "transparent", color: "white", cursor: "pointer", fontWeight: 600 }}
              >
                펜
              </button>
              <button 
                onClick={() => setBrushType("eraser")} 
                style={{ flex: 1, padding: "4px 8px", fontSize: "10.5px", border: "none", borderRadius: "4px", background: brushType === "eraser" ? "var(--accent-blue)" : "transparent", color: "white", cursor: "pointer", fontWeight: 600 }}
              >
                지우개
              </button>
            </div>

            {brushType === "pen" && (
              <>
                {/* Brush Colors */}
                <div style={{ display: "flex", gap: "0.3rem", padding: "2px 0" }}>
                  {[
                    { name: "Cyan", value: "#22d3ee" },
                    { name: "Rose", value: "#f43f5e" },
                    { name: "Yellow", value: "#eab308" },
                    { name: "Green", value: "#10b981" },
                    { name: "White", value: "#ffffff" }
                  ].map(color => (
                    <button
                      key={color.value}
                      onClick={() => setBrushColor(color.value)}
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: color.value,
                        border: brushColor === color.value ? "2px solid white" : "1px solid rgba(255,255,255,0.2)",
                        cursor: "pointer",
                        padding: 0
                      }}
                      title={color.name}
                    />
                  ))}
                </div>

                {/* Brush Thickness */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                  <span style={{ fontSize: "9px", color: "var(--text-secondary)" }}>두께: {brushWidth}px</span>
                  <input 
                    type="range" 
                    min="1" 
                    max="8" 
                    value={brushWidth} 
                    onChange={(e) => setBrushWidth(parseInt(e.target.value))} 
                    style={{ width: "90px", accentColor: "var(--accent-blue)", cursor: "pointer" }}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* 3. Document Workspace Area (A4/Google Docs Style Centered Page) */}
        <div 
          style={{ 
            flex: 1, 
            overflowY: "auto", 
            padding: "2.5rem 1rem", 
            background: "rgba(0,0,0,0.35)", 
            display: "flex", 
            justifyContent: "center", 
            position: "relative" 
          }}
        >
          {/* Centered Document Page Sheet */}
          <div 
            id="freenote-print-area"
            className="glass-card" 
            style={{ 
              width: "100%", 
              maxWidth: "850px", 
              minHeight: "1080px", 
              background: theme === "light" ? "#ffffff" : "rgba(20, 20, 20, 0.75)",
              border: "1px solid var(--border-glass)",
              boxShadow: "0 15px 30px rgba(0,0,0,0.3)",
              display: "flex", 
              flexDirection: "column",
              padding: "3.5rem 3rem",
              boxSizing: "border-box",
              position: "relative",
              borderRadius: "12px",
              color: "var(--text-primary)"
            }}
          >
            {!isAnalyzeMode ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <textarea
                  value={localText}
                  onChange={(e) => setLocalText(e.target.value)}
                  placeholder="분석하고 싶은 텍스트(예: 제미나이 대화 내용, 법학 지문 등)를 입력해 주세요.&#10;&#10;상단의 '⚡ 분석 모드 시작' 버튼을 누르면 형광펜 칠하기, 드래그 연결선 긋기, 펜 필기가 가능한 수험 독해 시험지 모드로 변환됩니다."
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontFamily: "inherit",
                    fontSize: `${activeNote.fontSize || 16}px`,
                    lineHeight: activeNote.lineHeight || 1.8,
                    color: "var(--text-primary)",
                    resize: "none",
                    width: "100%",
                    height: "100%",
                    minHeight: "400px"
                  }}
                />
                <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid var(--border-glass)", paddingTop: "1rem" }}>
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      navigator.clipboard.readText()
                        .then(text => {
                          if (text) {
                            setLocalText(text);
                          } else {
                            alert("클립보드가 비어 있거나 권한이 없습니다.");
                          }
                        })
                        .catch(() => {
                          alert("클립보드 읽기 권한이 없습니다. Ctrl+V (Cmd+V) 단축키를 이용해 직접 붙여넣어 주세요.");
                        });
                    }}
                    style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                  >
                    📋 클립보드 붙여넣기
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      const samplePassage = `[학술 지문 분석 샘플: 오컴의 면도날과 과학적 실재론]

‘오컴의 면도날(Ockham’s Razor)’은 동일한 현상을 설명하는 여러 가설이 존재할 때, 필요 이상의 가설이나 가정(hypothesis)을 도입해서는 안 된다는 ‘사유의 경제성 원리’를 의미한다. 이는 흔히 "단순한 설명이 더 좋은 설명이다"라는 명제로 정리가 되기도 하지만, 논리학적이고 인식론적인 관점에서의 본질은 단순성 자체가 아니라 '불필요한 존재론적 개입의 최소화'에 있다.

예를 들어, 어떤 현상 P를 설명하기 위해 이론 A와 이론 B가 경쟁하고 있다고 하자. 이론 A는 독립적인 인과적 실체인 X와 Y를 모두 필요로 하는 반면, 이론 B는 이미 관측 가능한 실체 X만으로 P의 인과적 경로를 완결되게 설명해 낸다. 이 경우 오컴의 면도날은 이론 B를 선택할 것을 지시한다. 왜냐하면 이론 A가 요구하는 실체 Y의 존재는 현상을 설명하는 데 어تقد 추가적인 예측적 우위나 설명력을 제공하지 못하면서도, 이론의 형이상학적 부담만을 가중시키기 때문이다.

그러나 과학철학사에서 오컴의 면도날은 언제나 정당화될 수 있는 절대적 진리로 받아들여진 것은 아니다. 반실재론자(Anti-realist)들은 이 원리를 도구주의적 유용성이나 주관적 선호의 차원으로 격하하며, 자연 자체가 반드시 단순한 구조로 조직되어 있다는 형이상학적 보장은 존재하지 않는다고 반박한다. 반면 실재론자(Realist)들은 더 단순하고 정량적으로 깔끔한 가설이 실제 자연의 심층 구조와 부합할 확률이 높다는 귀납적 성공 사례들을 제시하며 이를 옹호한다. 결국 오컴의 면도날은 단순한 방법론적 규칙을 넘어, 과학적 진리가 세계를 반영하는 방식에 대한 깊은 철학적 함의를 담고 있다.`;
                      setLocalText(samplePassage);
                    }}
                    style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                  >
                    📖 샘플 분석 지문 불러오기
                  </button>
                </div>
              </div>
            ) : (
              <div 
                id="single-view-card-freenote" 
                style={{ 
                  position: "relative", 
                  width: "100%", 
                  height: "100%", 
                  flex: 1 
                }}
              >
                {/* 🎨 Pencil Drawing Canvas Overlay Layer */}
                <CanvasOverlay
                  key={activeNote.id}
                  probKey={activeNote.id}
                  isDrawMode={isDrawMode}
                  brushColor={brushColor}
                  brushWidth={brushWidth}
                  brushType={brushType}
                  canvasDrawings={bridgeCanvasDrawings}
                  setCanvasDrawings={handleBridgeSetCanvasDrawings}
                />

                {/* 🔄 Word Relationship SVG Connectors Layer */}
                <RelationshipArrowsOverlay
                  probKey="freenote"
                  arrows={activeNote.arrows || []}
                  setArrows={(updatedArrows) => {
                    const nextArrows = typeof updatedArrows === "function" ? updatedArrows(activeNote.arrows) : updatedArrows;
                    updateActiveNote({ arrows: nextArrows });
                  }}
                  dragStartKey={dragStartKey}
                  dragTargetKey={dragTargetKey}
                  dragCurrentCoords={dragCurrentCoords}
                />

                {/* 2-Column or standard text container */}
                <div 
                  style={{ 
                    position: "relative", 
                    zIndex: 1, 
                    userSelect: "none",
                    columnCount: activeNote.isTwoColumn ? 2 : 1,
                    columnGap: activeNote.isTwoColumn ? "2.5rem" : "0",
                    columnRule: activeNote.isTwoColumn ? "1px dashed var(--border-glass)" : "none",
                    textAlign: "justify"
                  }}
                >
                  {renderHighlightableText(activeNote.text, "freenote", "note")}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Document Footer Stats Bar (Word counts & estimated read times) */}
        <div 
          style={{ 
            padding: "0.5rem 1.5rem", 
            borderTop: "1px solid var(--border-glass)", 
            background: "rgba(0,0,0,0.2)", 
            color: "var(--text-secondary)", 
            fontSize: "11px",
            display: "flex",
            justifyContent: "space-between",
            flexShrink: 0
          }}
        >
          <div>
            <span>글자 수: <strong>{charCount}자</strong> (공백 제외: {charCountNoSpace}자)</span>
            <span style={{ margin: "0 0.75rem", color: "var(--border-glass)" }}>|</span>
            <span>단어 수: <strong>{wordCount}개</strong></span>
          </div>
          <div>
            <span>독해 예상 시간: <strong>약 {readTimeEst}분</strong></span>
          </div>
        </div>

      </main>
    </div>
  );
}
