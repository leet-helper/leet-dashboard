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

const MainProblemViewer = ({
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
  renderHighlightableText,
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
  toggleProblemBookmarkMember
}: any) => {
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
            {selectedSources.map((s) => s.name ? s.name.replace(" 추리논증 기출", "") : s.id).join(" + ")}
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
          <div className="problem-list">
            {filteredProblems.length === 0 ? (
              <div className="glass-card empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                <p>조건과 일치하는 추리논증 문제가 없습니다.</p>
              </div>
            ) : (
              filteredProblems.map((prob) => (
                <ProblemCard
                  key={`${prob.year}-${prob.number}`}
                  prob={prob}
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
              ))
            )}
          </div>
        </>
      )}

    </main>
  );
};

export default MainProblemViewer;
