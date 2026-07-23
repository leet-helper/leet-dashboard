import React from "react";
import { 
  IconMoon, 
  IconSun, 
  IconCheck, 
  IconSearch, 
  IconSettings, 
  IconBrain,
  IconTrash
} from "./Icons";
import { EXAM_SOURCES, DETAILED_CATEGORIES, VERBAL_DETAILED_CATEGORIES } from "../constants";

const Sidebar = ({
  theme,
  setTheme,
  currentUser,
  setCurrentUser,
  openaiApiKey,
  setIsApiKeyOpen,
  setIsGeneratorOpen,
  onlyWrong,
  setOnlyWrong,
  onlyStatute,
  setOnlyStatute,
  setWeaknessReport,
  setIsWeaknessOpen,
  selectedSources,
  setSelectedSources,
  generatedProblems,
  searchQuery,
  setSearchQuery,
  selectedEvals,
  setSelectedEvals,
  selectedContents,
  setSelectedContents,
  selectedDetailTypes,
  setSelectedDetailTypes,
  numberFilterMode,
  setNumberFilterMode,
  numberFilterStart,
  setNumberFilterStart,
  numberFilterEnd,
  setNumberFilterEnd,
  numberFilterSpecificText,
  setNumberFilterSpecificText,
  setIsAuthOpen,
  setAuthError,
  toggleDetailCategory,
  activeTab,
  setActiveTab,
  problemBookmarkLists = [],
  selectedProblemBookmarkListId,
  setSelectedProblemBookmarkListId,
  createProblemBookmarkList,
  deleteProblemBookmarkList,
  selectedCategory,
  setSelectedCategory,
  knowledgeData,
  freeNotes = [],
  setFreeNotes = (_val?: any) => {},
  activeNoteId = "",
  setActiveNoteId = (_val?: any) => {},
  activeSubGame = "misreading",
  setActiveSubGame = (_val?: any) => {},
  activeTimerMode = "language",
  setActiveTimerMode = (_val?: any) => {}
}: any) => {
  const [editingTitleId, setEditingTitleId] = React.useState(null);
  const [titleInput, setTitleInput] = React.useState("");
  const [newSidebarListName, setNewSidebarListName] = React.useState("");

  const handleCreateNote = () => {
    const newId = `note_${Date.now()}`;
    const newNote = {
      id: newId,
      title: `분석 노트 ${freeNotes.length + 1}`,
      text: "",
      highlights: {},
      arrows: [],
      drawing: null,
      fontSize: 16,
      lineHeight: 1.8,
      isTwoColumn: false
    };
    setFreeNotes(prev => [...prev, newNote]);
    setActiveNoteId(newId);
  };

  const handleDeleteNote = (noteId, e) => {
    e.stopPropagation();
    if (freeNotes.length === 1) {
      alert("최소 한 개의 노트는 유지되어야 합니다.");
      return;
    }
    if (window.confirm("이 노트를 삭제하시겠습니까?")) {
      const remainingNotes = freeNotes.filter(n => n.id !== noteId);
      setFreeNotes(remainingNotes);
      if (activeNoteId === noteId) {
        setActiveNoteId(remainingNotes[0].id);
      }
    }
  };

  const handleStartRename = (note, e) => {
    e.stopPropagation();
    setEditingTitleId(note.id);
    setTitleInput(note.title);
  };

  const handleSaveRename = (noteId) => {
    if (titleInput.trim()) {
      setFreeNotes(prev => prev.map(n => 
        n.id === noteId ? { ...n, title: titleInput.trim() } : n
      ));
    }
    setEditingTitleId(null);
  };

  return (
    <aside className="glass-sidebar">
      <div className="logo-area" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          <div>
            <h1 className="logo-title" style={{ fontSize: "1.25rem" }}>LEET 대시보드</h1>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>Smart Study Dashboard</span>
          </div>
        </div>

        {/* Theme switcher toggle button */}
        <div className="theme-switch-container">
          <button 
            className="btn-theme-toggle" 
            onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
            title={theme === "light" ? "다크 모드로 전환" : "라이트 모드로 전환"}
          >
            {theme === "light" ? <IconMoon /> : <IconSun />}
          </button>
        </div>
      </div>

      {/* Tab Switcher (3 Rows x 2 Columns Grid) */}
      <div className="tab-switcher" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.25rem", background: "rgba(255,255,255,0.03)", padding: "0.25rem", borderRadius: "8px", border: "1px solid var(--border-glass)", marginBottom: "0.5rem" }}>
        <button 
          className={`tab-btn ${activeTab === 'reasoning_problems' || activeTab === 'problems' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('reasoning_problems');
          }}
          style={{
            padding: "8px 4px",
            fontSize: "11px",
            fontWeight: activeTab === 'reasoning_problems' || activeTab === 'problems' ? 700 : 500,
            borderRadius: "6px",
            border: "none",
            background: activeTab === 'reasoning_problems' || activeTab === 'problems' ? 'var(--accent-blue)' : 'transparent',
            color: activeTab === 'reasoning_problems' || activeTab === 'problems' ? '#ffffff' : 'var(--text-secondary)',
            cursor: "pointer",
            transition: "all 0.2s ease",
            whiteSpace: "nowrap"
          }}
        >
          📝 추리논증 기출
        </button>
        <button 
          className={`tab-btn ${activeTab === 'verbal_problems' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('verbal_problems');
          }}
          style={{
            padding: "8px 4px",
            fontSize: "11px",
            fontWeight: activeTab === 'verbal_problems' ? 700 : 500,
            borderRadius: "6px",
            border: "none",
            background: activeTab === 'verbal_problems' ? 'var(--accent-blue)' : 'transparent',
            color: activeTab === 'verbal_problems' ? '#ffffff' : 'var(--text-secondary)',
            cursor: "pointer",
            transition: "all 0.2s ease",
            whiteSpace: "nowrap"
          }}
        >
          📖 언어이해 기출
        </button>
        <button 
          className={`tab-btn ${activeTab === 'knowledge' ? 'active' : ''}`}
          onClick={() => setActiveTab('knowledge')}
          style={{
            padding: "8px 4px",
            fontSize: "11px",
            fontWeight: activeTab === 'knowledge' ? 700 : 500,
            borderRadius: "6px",
            border: "none",
            background: activeTab === 'knowledge' ? 'var(--accent-blue)' : 'transparent',
            color: activeTab === 'knowledge' ? '#ffffff' : 'var(--text-secondary)',
            cursor: "pointer",
            transition: "all 0.2s ease",
            whiteSpace: "nowrap"
          }}
        >
          📚 배경지식
        </button>
        <button 
          className={`tab-btn ${activeTab === 'freenote' ? 'active' : ''}`}
          onClick={() => setActiveTab('freenote')}
          style={{
            padding: "8px 4px",
            fontSize: "11px",
            fontWeight: activeTab === 'freenote' ? 700 : 500,
            borderRadius: "6px",
            border: "none",
            background: activeTab === 'freenote' ? 'var(--accent-blue)' : 'transparent',
            color: activeTab === 'freenote' ? '#ffffff' : 'var(--text-secondary)',
            cursor: "pointer",
            transition: "all 0.2s ease",
            whiteSpace: "nowrap"
          }}
        >
          📓 자유노트
        </button>
        <button 
          className={`tab-btn ${activeTab === 'minigame' ? 'active' : ''}`}
          onClick={() => setActiveTab('minigame')}
          style={{
            padding: "8px 4px",
            fontSize: "11px",
            fontWeight: activeTab === 'minigame' ? 700 : 500,
            borderRadius: "6px",
            border: "none",
            background: activeTab === 'minigame' ? 'var(--accent-blue)' : 'transparent',
            color: activeTab === 'minigame' ? '#ffffff' : 'var(--text-secondary)',
            cursor: "pointer",
            transition: "all 0.2s ease",
            whiteSpace: "nowrap"
          }}
        >
          🎮 미니게임
        </button>
        <button 
          className={`tab-btn ${activeTab === 'timer' ? 'active' : ''}`}
          onClick={() => setActiveTab('timer')}
          style={{
            padding: "8px 4px",
            fontSize: "11px",
            fontWeight: activeTab === 'timer' ? 700 : 500,
            borderRadius: "6px",
            border: "none",
            background: activeTab === 'timer' ? 'var(--accent-blue)' : 'transparent',
            color: activeTab === 'timer' ? '#ffffff' : 'var(--text-secondary)',
            cursor: "pointer",
            transition: "all 0.2s ease",
            whiteSpace: "nowrap"
          }}
        >
          ⏰ 타이머
        </button>
      </div>

      {/* Local Data Reset Widget */}
      <div className="auth-header-widget" style={{ borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <button 
          className="btn-secondary" 
          style={{ width: "100%", justifyContent: "center", padding: "0.45rem", borderRadius: "8px", fontSize: "11px", color: "var(--accent-rose)", borderColor: "rgba(244, 63, 94, 0.3)" }}
          onClick={() => {
            if (window.confirm("모든 오답 기록, 장바구니, 저장된 시험지 및 북마크 데이터를 완전히 초기화하시겠습니까?\n\n(이 작업은 되돌릴 수 없으니 필요시 미리 JSON 내보내기로 백업해 두세요.)")) {
              localStorage.removeItem("leet_solved");
              localStorage.removeItem("leet_cart");
              localStorage.removeItem("leet_verbal_cart");
              localStorage.removeItem("leet_saved_workbooks");
              localStorage.removeItem("leet_notes");
              localStorage.removeItem("leet_problem_bookmark_lists");
              localStorage.removeItem("leet_bookmark_lists");
              localStorage.removeItem("leet_completed_concepts");
              alert("모든 데이터가 성공적으로 초기화되었습니다.");
              window.location.reload();
            }
          }}
        >
          🗑️ 모든 학습 데이터 초기화
        </button>
      </div>

      {/* Local Data Export / Import Widget */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>
          💾 학습 데이터 백업 & 복구 (.json)
        </div>
        <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-muted)", lineHeight: 1.35 }}>
          * 데이터는 브라우저에 자동 저장되지만, 장기 보관하거나 다른 기기/브라우저로 옮길 때 내보내기/가져오기를 활용하세요.
        </p>
        <div style={{ display: "flex", gap: "0.35rem" }}>
          <button
            className="btn-secondary"
            style={{ flex: 1, padding: "0.4rem", fontSize: "0.75rem", borderRadius: "6px", justifyContent: "center" }}
            onClick={() => {
              try {
                const backupData = {
                  version: "1.0",
                  exportedAt: new Date().toISOString(),
                  solvedRecords: JSON.parse(localStorage.getItem("leet_solved") || "{}"),
                  reasoningCart: JSON.parse(localStorage.getItem("leet_cart") || "[]"),
                  verbalCart: JSON.parse(localStorage.getItem("leet_verbal_cart") || "[]"),
                  savedWorkbooks: (JSON.parse(localStorage.getItem("leet_saved_workbooks") || "[]")).map(wb => ({
                    ...wb,
                    cart_data: (wb.cart_data || []).map(item => ({
                      year: item.year,
                      number: item.number,
                      subject: wb.subject || item.subject || "추리논증",
                      passage_id: item.passage_id
                    }))
                  })),
                  problemBookmarkLists: JSON.parse(localStorage.getItem("leet_problem_bookmark_lists") || "[]"),
                  conceptBookmarkLists: JSON.parse(localStorage.getItem("leet_bookmark_lists") || "[]"),
                  notes: JSON.parse(localStorage.getItem("leet_notes") || "{}"),
                  completedConceptIds: JSON.parse(localStorage.getItem("leet_completed_concepts") || "[]"),
                };
                const jsonStr = JSON.stringify(backupData);
                const blob = new Blob([jsonStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `leet_dashboard_backup_${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              } catch (e) {
                alert("백업 파일 생성 중 오류가 발생했습니다.");
              }
            }}
            title="현재 내 장바구니, 오답 기록 및 백업 데이터를 JSON 파일로 다운로드"
          >
            📥 내보내기
          </button>

          <label
            className="btn-secondary"
            style={{ flex: 1, padding: "0.4rem", fontSize: "0.75rem", borderRadius: "6px", justifyContent: "center", cursor: "pointer", margin: 0 }}
            title="JSON 백업 파일을 올려 내 데이터 복구"
          >
            📤 가져오기
            <input
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  try {
                    const data = JSON.parse(ev.target?.result as string);
                    let count = 0;
                    if (data.solvedRecords) {
                      localStorage.setItem("leet_solved", JSON.stringify(data.solvedRecords));
                      count++;
                    }
                    if (data.reasoningCart) {
                      localStorage.setItem("leet_cart", JSON.stringify(data.reasoningCart));
                      count++;
                    }
                    if (data.verbalCart) {
                      localStorage.setItem("leet_verbal_cart", JSON.stringify(data.verbalCart));
                      count++;
                    }
                    if (data.savedWorkbooks) {
                      localStorage.setItem("leet_saved_workbooks", JSON.stringify(data.savedWorkbooks));
                      count++;
                    }
                    if (data.problemBookmarkLists) {
                      localStorage.setItem("leet_problem_bookmark_lists", JSON.stringify(data.problemBookmarkLists));
                      count++;
                    }
                    if (data.conceptBookmarkLists || data.bookmarkLists) {
                      localStorage.setItem("leet_bookmark_lists", JSON.stringify(data.conceptBookmarkLists || data.bookmarkLists));
                      count++;
                    }
                    if (data.notes) {
                      localStorage.setItem("leet_notes", JSON.stringify(data.notes));
                      count++;
                    }
                    if (data.completedConceptIds) {
                      localStorage.setItem("leet_completed_concepts", JSON.stringify(data.completedConceptIds));
                      count++;
                    }
                    if (count > 0) {
                      alert("장바구니 및 학습 데이터 복구가 완료되었습니다! 페이지를 새로고침합니다.");
                      window.location.reload();
                    } else {
                      alert("유효한 백업 데이터 항목을 찾을 수 없습니다.");
                    }
                  } catch (err) {
                    alert("JSON 파일을 읽는 중 오류가 발생했습니다.");
                  }
                };
                reader.readAsText(file);
              }}
            />
          </label>
        </div>
      </div>

      {(activeTab === "reasoning_problems" || activeTab === "verbal_problems" || activeTab === "problems") && (
        <>
          {/* Special Filter Chips: 오답 모아보기 및 법 규정 필터 */}
          <div>
            <div className="section-title">특수 문항 필터</div>
            <div className="multi-chip-container" style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <button
                className={`filter-chip ${onlyWrong ? "active" : ""}`}
                onClick={() => setOnlyWrong(!onlyWrong)}
                style={{
                  width: "100%",
                  justifyContent: "flex-start",
                  fontSize: "12px",
                  padding: "0.45rem 0.65rem",
                  borderRadius: "8px",
                  border: onlyWrong ? "1px solid rgba(244, 63, 94, 0.4)" : "1px solid var(--border-glass)",
                  background: onlyWrong ? "rgba(244, 63, 94, 0.15)" : "transparent",
                  color: onlyWrong ? "var(--accent-rose)" : "var(--text-secondary)",
                  fontWeight: onlyWrong ? 700 : 500
                }}
              >
                {onlyWrong ? <IconCheck /> : "⚠️"} 틀린 오답 문항만 모아보기
              </button>

              {activeTab !== "verbal_problems" && (
                <button
                  className={`filter-chip ${onlyStatute ? "active" : ""}`}
                  onClick={() => setOnlyStatute(!onlyStatute)}
                  style={{
                    width: "100%",
                    justifyContent: "flex-start",
                    fontSize: "12px",
                    padding: "0.45rem 0.65rem",
                    borderRadius: "8px",
                    border: onlyStatute ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid var(--border-glass)",
                    background: onlyStatute ? "rgba(16, 185, 129, 0.15)" : "transparent",
                    color: onlyStatute ? "var(--accent-emerald)" : "var(--text-secondary)",
                    fontWeight: onlyStatute ? 700 : 500
                  }}
                >
                  {onlyStatute ? <IconCheck /> : "⚖️"} 법 규정 활용 문항만 보기
                </button>
              )}
            </div>
          </div>

          {/* Bookmark Folders (Favorites) section */}
          <div>
            <div className="section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>⭐ {activeTab === "verbal_problems" ? "언어이해" : "추리논증"} 즐겨찾기 폴더</span>
            </div>
            
            {/* New folder creation input */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "0.5rem" }}>
              <input
                type="text"
                placeholder={`${activeTab === "verbal_problems" ? "언어이해" : "추리논증"} 폴더 생성...`}
                value={newSidebarListName}
                onChange={(e) => setNewSidebarListName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newSidebarListName.trim()) {
                    createProblemBookmarkList(newSidebarListName.trim()).then((success) => {
                      if (success) setNewSidebarListName("");
                    });
                  }
                }}
                style={{
                  flex: 1,
                  fontSize: "0.8rem",
                  padding: "6px 8px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-glass)",
                  background: "rgba(255,255,255,0.03)",
                  color: "var(--text-primary)",
                  outline: "none"
                }}
              />
              <button
                className="btn-primary"
                style={{ padding: "4px 10px", fontSize: "0.75rem", borderRadius: "8px" }}
                onClick={() => {
                  if (newSidebarListName.trim()) {
                    createProblemBookmarkList(newSidebarListName.trim()).then((success) => {
                      if (success) setNewSidebarListName("");
                    });
                  }
                }}
              >
                +
              </button>
            </div>

            {/* Folder list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "150px", overflowY: "auto", paddingRight: "4px" }}>
              {/* "All Problems" virtual folder */}
              <div
                onClick={() => setSelectedProblemBookmarkListId(null)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.45rem 0.65rem",
                  borderRadius: "8px",
                  background: selectedProblemBookmarkListId === null ? "rgba(59, 130, 246, 0.12)" : "transparent",
                  border: selectedProblemBookmarkListId === null ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid transparent",
                  color: selectedProblemBookmarkListId === null ? "var(--accent-blue)" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  transition: "all 0.2s ease"
                }}
              >
                <span style={{ fontWeight: selectedProblemBookmarkListId === null ? 700 : 500 }}>📂 전체 기출문제 보기</span>
              </div>

              {(() => {
                const currentSub = activeTab === "verbal_problems" ? "언어이해" : "추리논증";
                const subjectLists = problemBookmarkLists.filter(lst => (lst.subject || "추리논증") === currentSub);
                return subjectLists.map((lst) => {
                  const isSelected = selectedProblemBookmarkListId === lst.id;
                  return (
                    <div
                      key={lst.id}
                      onClick={() => {
                        if (selectedProblemBookmarkListId === lst.id) {
                          setSelectedProblemBookmarkListId(null);
                        } else {
                          setSelectedProblemBookmarkListId(lst.id);
                        }
                      }}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.45rem 0.65rem",
                        borderRadius: "8px",
                        background: isSelected ? "rgba(245, 158, 11, 0.12)" : "transparent",
                        border: isSelected ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid transparent",
                        color: isSelected ? "var(--accent-amber)" : "var(--text-secondary)",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <span style={{ fontWeight: isSelected ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>
                        📁 {lst.name}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ fontSize: "0.7rem", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "10px", color: "var(--text-muted)", fontWeight: "bold" }}>
                          {(lst.problems || []).length}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`'${lst.name}' 폴더를 삭제하시겠습니까?`)) {
                              deleteProblemBookmarkList(lst.id);
                            }
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--accent-rose)",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            padding: "2px",
                            display: "flex",
                            alignItems: "center"
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Selected Year Multi-Select Chips (Including Generated Problems virtual option) */}
          <div>
            {(() => {
              const activeSubj = activeTab === "verbal_problems" ? "언어이해" : "추리논증";
              const subjectSources = EXAM_SOURCES.filter(s => s.subject === activeSubj);
              
              return (
                <>
                  <div className="section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>기출 연도 다중 선택 ({activeSubj})</span>
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                      <button 
                        onClick={() => setSelectedSources(subjectSources)}
                        style={{ background: "transparent", border: "none", color: "var(--accent-blue)", fontSize: "10px", cursor: "pointer", padding: 0 }}
                      >전체</button>
                      <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>|</span>
                      <button 
                        onClick={() => setSelectedSources([subjectSources[0]])}
                        style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "10px", cursor: "pointer", padding: 0 }}
                      >초기화</button>
                    </div>
                  </div>
                  <div className="multi-chip-container">
                    {subjectSources.map((src) => {
                      const isActive = selectedSources.some((s) => s.id === src.id);
                      return (
                        <button
                          key={src.id}
                          className={`filter-chip ${isActive ? "active" : ""}`}
                          onClick={() => {
                            if (isActive) {
                              if (selectedSources.length > 1) {
                                setSelectedSources(selectedSources.filter((s) => s.id !== src.id));
                              }
                            } else {
                              setSelectedSources([...selectedSources.filter(s => s.id === "생성된문제" || s.subject === activeSubj), src]);
                            }
                          }}
                        >
                          {isActive && <IconCheck />}
                          {src.id.replace("추리논증", "").replace("언어이해", "")}
                        </button>
                      );
                    })}
                    {/* Virtual generated problems toggler chip (only for Legal Reasoning) */}
                    {activeSubj === "추리논증" && generatedProblems.length > 0 && (
                      <button
                        className={`filter-chip ${selectedSources.some((s) => s.file === "generated") ? "active" : ""}`}
                        onClick={() => {
                          const isActive = selectedSources.some((s) => s.file === "generated");
                          if (isActive) {
                            if (selectedSources.length > 1) {
                              setSelectedSources(selectedSources.filter((s) => s.file !== "generated"));
                            }
                          } else {
                            setSelectedSources([...selectedSources, { id: "생성된문제", name: "AI 생성 문제", file: "generated" }]);
                          }
                        }}
                        style={{ border: "1px dashed var(--accent-purple)", color: "var(--accent-purple)" }}
                      >
                        {selectedSources.some((s) => s.file === "generated") && <IconCheck />}
                        ✨ 생성된 문제 ({generatedProblems.length})
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Question Number Filter (Range / Specific List) */}
          <div>
            <div className="section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>문항 번호 필터</span>
              {numberFilterMode !== "all" && (
                <button 
                  onClick={() => {
                    setNumberFilterMode("all");
                    setNumberFilterStart(1);
                    setNumberFilterEnd(40);
                    setNumberFilterSpecificText("");
                  }}
                  style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "10px", cursor: "pointer", padding: 0 }}
                >초기화</button>
              )}
            </div>
            
            {/* Mode selection buttons */}
            <div className="multi-chip-container" style={{ display: "flex", gap: "0.25rem", marginBottom: "0.5rem" }}>
              {[
                { id: "all", label: "전체 문항" },
                { id: "range", label: "범위 지정" },
                { id: "specific", label: "개별 지정" }
              ].map((m) => {
                const isActive = numberFilterMode === m.id;
                return (
                  <button
                    key={m.id}
                    className={`filter-chip ${isActive ? "active" : ""}`}
                    onClick={() => setNumberFilterMode(m.id)}
                    style={{ fontSize: "11px", padding: "0.25rem 0.5rem", flex: 1, justifyContent: "center" }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Range Mode Input Fields */}
            {numberFilterMode === "range" && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem" }}>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={numberFilterStart}
                  onChange={(e) => setNumberFilterStart(Math.max(1, Math.min(40, parseInt(e.target.value) || 1)))}
                  className="modern-input"
                  style={{ width: "55px", textAlign: "center", padding: "4px 8px", fontSize: "12px", height: "auto" }}
                />
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>번 ~</span>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={numberFilterEnd}
                  onChange={(e) => setNumberFilterEnd(Math.max(1, Math.min(40, parseInt(e.target.value) || 40)))}
                  className="modern-input"
                  style={{ width: "55px", textAlign: "center", padding: "4px 8px", fontSize: "12px", height: "auto" }}
                />
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>번</span>
              </div>
            )}

            {/* Specific Mode Input Fields */}
            {numberFilterMode === "specific" && (
              <div style={{ marginTop: "0.4rem" }}>
                <input
                  type="text"
                  placeholder="예: 1, 2, 4-8, 33"
                  value={numberFilterSpecificText}
                  onChange={(e) => setNumberFilterSpecificText(e.target.value)}
                  className="modern-input"
                  style={{ padding: "6px 12px", fontSize: "12px", width: "100%", boxSizing: "border-box" }}
                />
                <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginTop: "4px" }}>
                  쉼표(,) 및 대시(-) 범위 형태를 지원합니다. (예: 1, 2, 4-8)
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Minigame Sub-menu */}
      {activeTab === "minigame" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div className="section-title">미니게임 모드</div>
          <div 
            style={{
              padding: "1rem",
              borderRadius: "8px",
              background: "rgba(245, 158, 11, 0.06)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              color: "var(--text-secondary)",
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <span>🚧</span>
            <span>콘텐츠 서비스 준비 중입니다.</span>
          </div>
        </div>
      )}

      {/* Timer Sub-menu */}
      {activeTab === "timer" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div className="section-title">타이머 모드 선택</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <button
              onClick={() => setActiveTimerMode("language")}
              className={`filter-chip ${activeTimerMode === "language" ? "active" : ""}`}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                fontSize: "12px",
                fontWeight: activeTimerMode === "language" ? 700 : 500,
                textAlign: "left",
                background: activeTimerMode === "language" ? "var(--accent-blue)" : "rgba(255,255,255,0.03)",
                color: activeTimerMode === "language" ? "#fff" : "var(--text-secondary)",
                border: "1px solid var(--border-glass)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              📖 &nbsp; 언어이해 모드 (09:00~10:10)
            </button>
            <button
              onClick={() => setActiveTimerMode("reasoning")}
              className={`filter-chip ${activeTimerMode === "reasoning" ? "active" : ""}`}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                fontSize: "12px",
                fontWeight: activeTimerMode === "reasoning" ? 700 : 500,
                textAlign: "left",
                background: activeTimerMode === "reasoning" ? "var(--accent-blue)" : "rgba(255,255,255,0.03)",
                color: activeTimerMode === "reasoning" ? "#fff" : "var(--text-secondary)",
                border: "1px solid var(--border-glass)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              🧩 &nbsp; 추리논증 모드 (10:45~12:50)
            </button>
            <button
              onClick={() => setActiveTimerMode("full")}
              className={`filter-chip ${activeTimerMode === "full" ? "active" : ""}`}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                fontSize: "12px",
                fontWeight: activeTimerMode === "full" ? 700 : 500,
                textAlign: "left",
                background: activeTimerMode === "full" ? "var(--accent-blue)" : "rgba(255,255,255,0.03)",
                color: activeTimerMode === "full" ? "#fff" : "var(--text-secondary)",
                border: "1px solid var(--border-glass)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              🏆 &nbsp; 전체 모드 (09:00~12:50)
            </button>
            <button
              onClick={() => setActiveTimerMode("custom")}
              className={`filter-chip ${activeTimerMode === "custom" ? "active" : ""}`}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                fontSize: "12px",
                fontWeight: activeTimerMode === "custom" ? 700 : 500,
                textAlign: "left",
                background: activeTimerMode === "custom" ? "var(--accent-blue)" : "rgba(255,255,255,0.03)",
                color: activeTimerMode === "custom" ? "#fff" : "var(--text-secondary)",
                border: "1px solid var(--border-glass)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              ⏱️ &nbsp; 커스텀 타이머 모드 (00:00~)
            </button>
            <button
              onClick={() => setActiveTimerMode("stopwatch")}
              className={`filter-chip ${activeTimerMode === "stopwatch" ? "active" : ""}`}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                fontSize: "12px",
                fontWeight: activeTimerMode === "stopwatch" ? 700 : 500,
                textAlign: "left",
                background: activeTimerMode === "stopwatch" ? "var(--accent-blue)" : "rgba(255,255,255,0.03)",
                color: activeTimerMode === "stopwatch" ? "#fff" : "var(--text-secondary)",
                border: "1px solid var(--border-glass)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              ⏱️ &nbsp; 스톱워치 모드 (시간 측정)
            </button>
            <button
              onClick={() => setActiveTimerMode("current")}
              className={`filter-chip ${activeTimerMode === "current" ? "active" : ""}`}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                fontSize: "12px",
                fontWeight: activeTimerMode === "current" ? 700 : 500,
                textAlign: "left",
                background: activeTimerMode === "current" ? "var(--accent-blue)" : "rgba(255,255,255,0.03)",
                color: activeTimerMode === "current" ? "#fff" : "var(--text-secondary)",
                border: "1px solid var(--border-glass)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              ⏰ &nbsp; 현재 시각 모드 (실시간)
            </button>
          </div>
        </div>
      )}

      {/* Text Search Box */}
      {activeTab !== "freenote" && activeTab !== "minigame" && activeTab !== "timer" && (
        <div>
          <div className="section-title">
            {(activeTab === "reasoning_problems" || activeTab === "verbal_problems" || activeTab === "problems") ? "문제 & 지문 검색" : "배경지식 개념 검색"}
          </div>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder={(activeTab === "reasoning_problems" || activeTab === "verbal_problems" || activeTab === "problems") ? "문제, 지문 키워드 검색..." : "개념명, 설명, 키워드 검색..."}
              className="modern-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "2.5rem" }}
            />
            <div style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>
              <IconSearch />
            </div>
          </div>
        </div>
      )}

      {activeTab === "knowledge" && (
        <>
          {/* Background Knowledge Category Filter */}
          <div>
            <div className="section-title" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>배경지식 분야 선택</span>
              {selectedCategory !== "전체" && (
                <button 
                  onClick={() => setSelectedCategory("전체")}
                  style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "10px", cursor: "pointer", padding: 0 }}
                >초기화</button>
              )}
            </div>
            <div className="multi-chip-container" style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
              {["전체", "인문·철학", "사회과학·법학", "자연과학·기술", "경제·경영", "논리학·수학"].map((cat) => {
                const isActive = selectedCategory === cat;
                const count = knowledgeData ? knowledgeData.filter((concept) => {
                  const matchSearch = searchQuery
                    ? concept.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (concept.english_title && concept.english_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      concept.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (concept.leet_context && concept.leet_context.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      concept.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
                    : true;
                  const matchCategory = cat === "전체" ? true : concept.category === cat;
                  return matchSearch && matchCategory;
                }).length : 0;

                return (
                  <button
                    key={cat}
                    className={`filter-chip ${isActive ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat)}
                    style={{ fontSize: "11px", padding: "0.25rem 0.5rem" }}
                  >
                    {isActive && <IconCheck />}
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {(activeTab === "reasoning_problems" || activeTab === "verbal_problems" || activeTab === "problems") && (
        <>
          {/* Cognitive Type Filter & Content Area Filter (Only for Reasoning, not needed in Verbal) */}
          {activeTab !== "verbal_problems" && (
            <>
              {/* Cognitive Type Filter (Multi-Select) */}
              <div>
                <div className="section-title" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>인지 활동 유형 필터 (다중)</span>
                  {selectedEvals.length > 0 && (
                    <button 
                      onClick={() => setSelectedEvals([])}
                      style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "10px", cursor: "pointer" }}
                    >초기화</button>
                  )}
                </div>
                <div className="multi-chip-container" style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", maxHeight: "110px", overflowY: "auto" }}>
                  {["분석 및 재구성", "추론", "논증 평가"].map((item) => {
                    const isActive = selectedEvals.includes(item);
                    return (
                      <button
                        key={item}
                        className={`filter-chip ${isActive ? "active" : ""}`}
                        onClick={() => {
                          setSelectedEvals(prev => 
                            prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
                          );
                        }}
                        style={{ fontSize: "11px", padding: "0.25rem 0.5rem" }}
                      >
                        {isActive && <IconCheck />}
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content Area Filter (Multi-Select) */}
              <div>
                <div className="section-title" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>내용 영역 필터 (다중)</span>
                  {selectedContents.length > 0 && (
                    <button 
                      onClick={() => setSelectedContents([])}
                      style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "10px", cursor: "pointer" }}
                    >초기화</button>
                  )}
                </div>
                <div className="multi-chip-container" style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", maxHeight: "150px", overflowY: "auto" }}>
                  {["법학·규범", "인문학", "사회과학", "자연과학·기술", "논리학·수학"].map((item) => {
                    const isActive = selectedContents.includes(item);
                    return (
                      <button
                        key={item}
                        className={`filter-chip ${isActive ? "active" : ""}`}
                        onClick={() => {
                          setSelectedContents(prev => 
                            prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
                          );
                        }}
                        style={{ fontSize: "11px", padding: "0.25rem 0.5rem" }}
                      >
                        {isActive && <IconCheck />}
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Detailed Category Chip Multi-Selector */}
          <div>
            <div className="section-title" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{activeTab === "verbal_problems" ? "지문 주제 (다중 선택)" : "세부 출제 유형 (다중 선택)"}</span>
              {selectedDetailTypes.length > 0 && (
                <button 
                  onClick={() => setSelectedDetailTypes([])}
                  style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "10px", cursor: "pointer" }}
                >초기화</button>
              )}
            </div>
            <div className="multi-chip-container" style={{ maxHeight: "160px" }}>
              {(activeTab === "verbal_problems" ? VERBAL_DETAILED_CATEGORIES : DETAILED_CATEGORIES).map((cat) => {
                const isActive = selectedDetailTypes.includes(cat);
                const label = (activeTab !== "verbal_problems" && cat.includes(" ")) ? cat.substring(cat.indexOf(" ") + 1) : cat;
                return (
                  <button
                    key={cat}
                    className={`filter-chip ${isActive ? "active" : ""}`}
                    onClick={() => toggleDetailCategory(cat)}
                    style={{ fontSize: "11px", padding: "0.25rem 0.5rem" }}
                  >
                    {isActive && <IconCheck />}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {activeTab === "freenote" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1, overflow: "hidden" }}>
          <div className="section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
            <span>📓 나의 분석 노트</span>
            <button 
              className="btn-primary" 
              onClick={handleCreateNote} 
              style={{ padding: "4px 8px", fontSize: "11.5px", borderRadius: "6px" }}
            >
              + 새 노트
            </button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", overflowY: "auto", flex: 1, paddingRight: "4px" }}>
            {freeNotes.map(note => {
              const isEditing = editingTitleId === note.id;
              const isActive = activeNoteId === note.id;
              
              return (
                <div 
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.5rem 0.65rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    background: isActive ? "rgba(59, 130, 246, 0.12)" : "rgba(255, 255, 255, 0.02)",
                    border: isActive ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid rgba(255, 255, 255, 0.05)",
                    transition: "all 0.2s ease"
                  }}
                >
                  {isEditing ? (
                    <input
                      type="text"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      onBlur={() => handleSaveRename(note.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRename(note.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      style={{
                        width: "110px",
                        fontSize: "12px",
                        background: "rgba(0,0,0,0.3)",
                        color: "white",
                        border: "1px solid var(--accent-blue)",
                        borderRadius: "4px",
                        padding: "2px 4px"
                      }}
                    />
                  ) : (
                    <span 
                      style={{ 
                        fontSize: "12.5px", 
                        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                        fontWeight: isActive ? 700 : 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "130px"
                      }}
                    >
                      {note.title}
                    </span>
                  )}

                  <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
                    <button 
                      onClick={(e) => handleStartRename(note, e)}
                      style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px" }}
                      title="이름 바꾸기"
                    >
                      ✏️
                    </button>
                    {freeNotes.length > 1 && (
                      <button 
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        style={{ background: "transparent", border: "none", color: "var(--accent-rose)", cursor: "pointer", padding: "2px" }}
                        title="노트 삭제"
                      >
                        <IconTrash />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GitHub Issues & Inquiry Footer */}
      <div 
        style={{
          marginTop: "1.5rem",
          paddingTop: "1rem",
          borderTop: "1px solid var(--border-glass)",
          fontSize: "0.8rem",
          color: "var(--text-secondary)",
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 700, color: "var(--text-primary)" }}>
          💬 오류 및 건의사항 문의
        </div>
        <p style={{ margin: 0, lineHeight: 1.45, fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          오류, 건의 등의 문의사항은 아래 GitHub Issues에 등록해 주세요.<br />
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "inline-block", marginTop: "2px" }}>
            * 본업이 따로 있어 답변 및 피드백 대응이 빠르지 않을 수 있습니다.
          </span>
        </p>
        <a 
          href="https://github.com/leet-helper/leet-dashboard/issues" 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-secondary"
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center", 
            gap: "0.35rem", 
            padding: "0.4rem 0.6rem", 
            fontSize: "0.75rem", 
            borderRadius: "6px", 
            color: "var(--accent-blue)", 
            borderColor: "rgba(59,130,246,0.3)",
            background: "rgba(59,130,246,0.06)",
            textDecoration: "none",
            fontWeight: 600,
            marginTop: "0.2rem"
          }}
        >
          🐙 GitHub Issues 등록하기
        </a>

        {/* Visitor Counter Widget */}
        <div style={{ marginTop: "0.75rem", paddingTop: "0.6rem", borderTop: "1px solid var(--border-glass)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            📊 방문자 카운터
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img 
              src="https://hitscounter.dev/api/hit?url=https%3A%2F%2Fleet-helper.github.io%2Fleet-dashboard&label=VISITS&color=%233b82f6&labelColor=%231e293b&style=flat" 
              alt="Total Visits Counter" 
              style={{ height: "20px", borderRadius: "4px", opacity: 0.9 }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
