import React from "react";
import {
  IconCart,
  IconPrinter,
  IconPlus,
  IconCheck,
  IconClose,
  IconAlert,
  IconEdit,
  IconTrash
} from "../Icons";
import ProblemCard from "./ProblemCard";

const VerbalProblemViewer = ({
  selectedSources,
  examData,
  isLoading,
  loadError,
  filteredProblems,
  cart,
  toggleCart,
  addAllFilteredToCart,
  setIsCartOpen,
  isFullscreen,
  toggleFullscreen,
  isSingleView,
  setIsSingleView,
  singleViewType,
  setSingleViewType,
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
  currentUser,
  setEditProblem,
  setIsEditModalOpen,
  setSelectedOrigImage,
  setIsOrigImageModalOpen,
  handleDeleteGenerated,
  problemBookmarkLists = [],
  activeProblemBookmarkDropdownKey,
  setActiveProblemBookmarkDropdownKey,
  createProblemBookmarkList,
  toggleProblemBookmarkMember,
  setCart
}: any) => {
  const [activePassageId, setActivePassageId] = React.useState("");

  // Smooth scroll sync when activePassageId changes
  React.useEffect(() => {
    if (activePassageId) {
      const el = document.getElementById(`set-${activePassageId}`);
      if (el) {
        // Use timeout to let the DOM settle if layout is rendering
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 50);
      }
    }
  }, [activePassageId]);

  // Compute filtered sets based on filtered problems
  const filteredSets = React.useMemo(() => {
    if (!examData || !examData.sets) return [];

    const filteredKeys = new Set(filteredProblems.map(p => `${p.year}-${p.number}`));

    return examData.sets.map((set) => {
      const matchedProbs = set.problems.filter(p => filteredKeys.has(`${p.year}-${p.number}`));
      if (matchedProbs.length === 0) return null;
      return {
        ...set,
        problems: matchedProbs
      };
    }).filter(Boolean);
  }, [examData.sets, filteredProblems]);

  // Sync activePassageId when filtered sets change
  React.useEffect(() => {
    if (filteredSets.length > 0) {
      // Keep active if still in filtered sets, otherwise default to first
      const exists = filteredSets.some(s => s.passage_id === activePassageId);
      if (!exists) {
        setActivePassageId(filteredSets[0].passage_id);
      }
    } else {
      setActivePassageId("");
    }
  }, [filteredSets, activePassageId]);

  const activeSet = examData?.sets?.find(s => s.passage_id === activePassageId);
  const activePassageText = activeSet?.passage || "";
  const activePassageYear = activeSet?.year || "연도 정보 없음";
  const activePassageCategory = activeSet?.category_content || "기타";

  const activeIndex = filteredSets.findIndex(s => s.passage_id === activePassageId);

  const handlePrevPassage = () => {
    if (filteredSets.length === 0) return;
    const newIndex = activeIndex <= 0 ? filteredSets.length - 1 : activeIndex - 1;
    setActivePassageId(filteredSets[newIndex].passage_id);
  };

  const handleNextPassage = () => {
    if (filteredSets.length === 0) return;
    const newIndex = activeIndex >= filteredSets.length - 1 ? 0 : activeIndex + 1;
    setActivePassageId(filteredSets[newIndex].passage_id);
  };

  const isSetFullyInCart = (set) => {
    if (!set || !set.problems) return false;
    return set.problems.every(p => cart.some(item => item.year === p.year && item.number === p.number));
  };

  const isSetPartiallyInCart = (set) => {
    if (!set || !set.problems) return false;
    return set.problems.some(p => cart.some(item => item.year === p.year && item.number === p.number));
  };

  const toggleSetInCart = (set) => {
    if (!set || !set.problems) return;
    const fullyIn = isSetFullyInCart(set);
    if (fullyIn) {
      const probKeysToRemove = new Set(set.problems.map(p => `${p.year}-${p.number}`));
      setCart(prev => prev.filter(item => !probKeysToRemove.has(`${item.year}-${item.number}`)));
    } else {
      const currentKeys = new Set(cart.map(item => `${item.year}-${item.number}`));
      const toAdd = set.problems.filter(p => !currentKeys.has(`${p.year}-${p.number}`));
      setCart(prev => [...prev, ...toAdd]);
    }
  };

  const getPassageTitle = (pId) => {
    if (!pId) return "지문 정보 없음";
    const parts = pId.split("-");
    if (parts.length < 2) return "세트 지문";
    // Format: 2026-verbal-set-1-3  =>  "2026 1 ~ 3"
    const year = parts[0];
    const start = parts[parts.length - 2];
    const end = parts[parts.length - 1];
    return `${year} ${start} ~ ${end}`;
  };

  return (
    <main className="main-content">
      {/* Floating Cart Indicator */}
      <div className="cart-indicator" onClick={() => setIsCartOpen(true)}>
        <button className="btn-secondary" style={{ borderRadius: "50%", padding: "12px", border: "1px solid var(--accent-blue)" }}>
          <IconCart count={cart.length} />
        </button>
      </div>

      <div className="problems-header">
        <div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800 }}>
            {selectedSources.map((s) => s.name ? s.name.replace(" 기출", "") : s.id).join(" + ")}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.25rem" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              {isLoading ? "문항을 불러오는 중..." : `총 ${examData?.problems?.length || 0}개 중 필터링된 문항 ${filteredProblems.length}개`}
            </p>
            {!isLoading && filteredProblems.length > 0 && (
              <button
                className="btn-secondary"
                style={{ padding: "0.3rem 0.7rem", fontSize: "0.8rem", borderRadius: "6px", gap: "0.35rem" }}
                onClick={addAllFilteredToCart}
              >
                <IconPlus /> 필터된 문제 모두 담기
              </button>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn-secondary"
            style={{
              padding: "0.4rem 0.8rem",
              fontSize: "0.8rem",
              gap: "0.35rem",
              border: isFullscreen ? "1.5px solid var(--accent-blue)" : "1px solid var(--border-glass)",
              background: isFullscreen ? "rgba(59,130,246,0.12)" : "transparent",
              color: isFullscreen ? "var(--accent-blue)" : "var(--text-primary)",
              fontWeight: isFullscreen ? 700 : 500
            }}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? "📴 창 모드" : "📺 전체화면"}
          </button>

          {cart.length > 0 && (
            <button
              className="btn-secondary"
              style={{
                padding: "0.4rem 0.8rem",
                fontSize: "0.8rem",
                gap: "0.35rem",
                border: (isSingleView && singleViewType === "cart") ? "1.5px solid var(--accent-cyan)" : "1px solid var(--border-glass)",
                background: (isSingleView && singleViewType === "cart") ? "rgba(34,211,238,0.12)" : "transparent",
                color: (isSingleView && singleViewType === "cart") ? "var(--accent-cyan)" : "var(--text-primary)",
                fontWeight: (isSingleView && singleViewType === "cart") ? 700 : 500
              }}
              onClick={() => {
                setIsSingleView(true);
                if (singleViewIndex >= cart.length) {
                  setSingleViewIndex(0);
                }
                setSingleViewType("cart");
              }}
            >
              🛒 담은 문제만 풀기 ({cart.length})
            </button>
          )}
          <button className="btn-primary" onClick={() => setIsCartOpen(true)}>
            <IconPrinter />
            조합된 문제 시험지 제작하기 ({cart.length})
          </button>
        </div>
      </div>

      {loadError && (
        <div className="glass-card" style={{ borderLeft: "4px solid var(--accent-rose)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <h3 style={{ color: "var(--accent-rose)", display: "flex", alignItems: "center" }}>
            <IconAlert /> JSON 데이터를 불러올 수 없습니다
          </h3>
          <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", whiteSpace: "pre-line" }}>
            {loadError}
          </p>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
          <div style={{
            width: "40px", height: "40px",
            border: "4px solid rgba(59, 130, 246, 0.1)", borderTop: "4px solid var(--accent-blue)",
            borderRadius: "50%", animation: "spin 1s linear infinite"
          }}></div>
        </div>
      )}

      {/* Problems List */}
      {!isLoading && examData && (
        <>
          <div style={{
            background: "rgba(245, 158, 11, 0.06)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            borderRadius: "10px",
            padding: "0.85rem 1.25rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            fontSize: "0.875rem",
            color: "var(--text-secondary)"
          }}>
            <span style={{ fontSize: "1.25rem" }}>⚠️</span>
            <div>
              시험의 실제 지문을 비워서 배포드립니다. 시험지 pdf 를 모아 ai 에게 채워달라고 하면 사용이 가능합니다.
              <a href="https://github.com/leet-helper/leet-dashboard" target="_blank" rel="noopener noreferrer">
                (GitHub 레포)
              </a>
            </div>
          </div>

          {filteredSets.length > 0 && (
            <div className="glass-card" style={{ padding: "0.85rem 1.25rem", marginBottom: "1.25rem", border: "1px solid var(--border-glass)" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                📂 검색 및 필터 매칭 지문 목록 ({filteredSets.length}개)
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {filteredSets.map((set) => {
                  const isCurrent = set.passage_id === activePassageId;
                  return (
                    <button
                      key={set.passage_id}
                      className="btn-secondary"
                      style={{
                        padding: "0.3rem 0.6rem",
                        fontSize: "0.8rem",
                        borderRadius: "6px",
                        borderColor: isCurrent ? "var(--accent-blue)" : "var(--border-glass)",
                        background: isCurrent ? "rgba(59,130,246,0.08)" : "transparent",
                        color: isCurrent ? "var(--accent-blue)" : "var(--text-secondary)",
                        fontWeight: isCurrent ? 700 : 500
                      }}
                      onClick={() => setActivePassageId(set.passage_id)}
                    >
                      📖 {getPassageTitle(set.passage_id)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="verbal-split-layout">
            {/* Left Column: Sticky Passage Panel */}
            <div className="verbal-passage-pane glass-card">
              <div className="passage-pane-header" style={{ display: "flex", flexDirection: "column", gap: "0.6rem", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    className="btn-secondary"
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", borderRadius: "6px" }}
                    onClick={handlePrevPassage}
                    disabled={filteredSets.length <= 1}
                  >
                    ◀ 이전 지문
                  </button>
                  <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                    <span className="badge badge-year">{activePassageYear}</span>
                    <span className="badge badge-eval" style={{ background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.3)", color: "var(--accent-blue)" }}>
                      {getPassageTitle(activePassageId)}
                    </span>
                  </div>
                  <button
                    className="btn-secondary"
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", borderRadius: "6px" }}
                    onClick={handleNextPassage}
                    disabled={filteredSets.length <= 1}
                  >
                    다음 지문 ▶
                  </button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="badge" style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "var(--accent-emerald)" }}>
                    분야: {activePassageCategory}
                  </span>
                  {activeSet && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        ({filteredSets.length}개 중 {activeIndex + 1}번째)
                      </span>
                      <button
                        className={isSetFullyInCart(activeSet) ? "btn-primary" : "btn-secondary"}
                        style={{
                          padding: "0.25rem 0.5rem",
                          fontSize: "0.72rem",
                          borderRadius: "6px",
                          borderColor: isSetFullyInCart(activeSet)
                            ? "var(--accent-cyan)"
                            : isSetPartiallyInCart(activeSet)
                              ? "var(--accent-amber)"
                              : "var(--border-glass)",
                          color: isSetFullyInCart(activeSet)
                            ? "#fff"
                            : isSetPartiallyInCart(activeSet)
                              ? "var(--accent-amber)"
                              : "var(--text-secondary)",
                          background: isSetFullyInCart(activeSet)
                            ? "var(--accent-cyan)"
                            : isSetPartiallyInCart(activeSet)
                              ? "rgba(245, 158, 11, 0.08)"
                              : "transparent",
                          fontWeight: (isSetFullyInCart(activeSet) || isSetPartiallyInCart(activeSet)) ? 700 : 500
                        }}
                        onClick={() => toggleSetInCart(activeSet)}
                      >
                        🛒 {isSetFullyInCart(activeSet) ? "세트 담김" : isSetPartiallyInCart(activeSet) ? "일부 담김 (전체 채우기)" : "지문 세트 전체 담기"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="passage-pane-body" style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto", paddingRight: "6px" }}>
                {activePassageText ? (
                  activePassageText.split("\n").map((line, idx) => (
                    <p key={idx} style={{ margin: "0 0 0.8rem 0", lineHeight: "1.85", fontSize: "1.02rem", color: "var(--text-primary)" }}>{line}</p>
                  ))
                ) : (
                  <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: "5rem" }}>우측 문항 카드의 [📖 지문 보기] 버튼을 클릭해 지문을 로딩하십시오.</p>
                )}
              </div>
            </div>

            {/* Right Column: Problem Cards (grouped by set, passage omitted in cards) */}
            <div className="verbal-problems-pane">
              {filteredSets.length === 0 ? (
                <div className="glass-card empty-state">
                  <p>조건과 일치하는 언어이해 문제가 없습니다.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {filteredSets
                    .filter((set) => set.passage_id === activePassageId)
                    .map((set) => {
                      const isCurrentSet = set.passage_id === activePassageId;
                      return (
                        <div
                          key={set.passage_id}
                          style={{
                            border: isCurrentSet ? "1.5px solid var(--accent-blue)" : "1.5px solid var(--border-glass)",
                            borderRadius: "14px",
                            padding: "1rem",
                            background: isCurrentSet ? "rgba(59, 130, 246, 0.02)" : "rgba(255, 255, 255, 0.01)",
                            boxShadow: isCurrentSet ? "0 0 15px rgba(59, 130, 246, 0.08)" : "none",
                            transition: "all 0.25s ease",
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem"
                          }}
                        >
                          {/* Set Header with title */}
                          <div
                            id={`set-${set.passage_id}`}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              borderBottom: "1px dashed var(--border-glass)",
                              paddingBottom: "0.5rem"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--accent-blue)" }}>
                                {getPassageTitle(set.passage_id)} 문제 목록 ({set.problems.length}문항)
                              </span>
                              <span className="badge" style={{ fontSize: "10px", padding: "2px 5px", background: "rgba(255,255,255,0.03)" }}>
                                {set.year}
                              </span>
                            </div>
                          </div>

                          {/* List of problems in this set */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            {set.problems.map((prob) => {
                              return (
                                <ProblemCard
                                  key={`${prob.year}-${prob.number}`}
                                  prob={prob}
                                  hidePassage={true}
                                  viewMode="list"
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
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default VerbalProblemViewer;
