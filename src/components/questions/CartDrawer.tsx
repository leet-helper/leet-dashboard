import React from "react";
import { IconCart, IconClose, IconTrash, IconPrinter } from "../Icons";

const CartDrawer = ({
  isOpen,
  onClose,
  cart,
  toggleCart,
  examTitle,
  setExamTitle,
  savedWorkbooks,
  setSavedWorkbooks,
  clearCart,
  setIsSingleView,
  singleViewIndex,
  setSingleViewIndex,
  setSingleViewType,
  setIsAuthOpen,
  setAuthError,
  handlePrint,
  setCart,
  isVerbal
}) => {
  // Group cart items by passage_id
  const groupedCart = React.useMemo<any[]>(() => {
    const groups = {};
    cart.forEach((item) => {
      const groupId = item.passage_id || `single-${item.year}-${item.number}`;
      if (!groups[groupId]) {
        groups[groupId] = {
          groupId,
          year: item.year,
          passage_id: item.passage_id,
          items: []
        };
      }
      groups[groupId].items.push(item);
    });
    return Object.values(groups);
  }, [cart]);

  const getGroupTitle = (group) => {
    if (!group.passage_id) {
      return `${group.year} 문 ${group.items[0]?.number}`;
    }
    const parts = group.passage_id.split("-");
    if (parts.length >= 2) {
      const year = parts[0];
      const start = parts[parts.length - 2];
      const end = parts[parts.length - 1];
      return `${year} ${start} ~ ${end}`;
    }
    return `${group.year} 세트 지문`;
  };

  const removeGroup = (group) => {
    const keysToRemove = new Set(group.items.map(item => `${item.year}-${item.number}`));
    setCart(prev => prev.filter(item => !keysToRemove.has(`${item.year}-${item.number}`)));
  };

  return (
    <div className={`cart-drawer ${isOpen ? "open" : ""}`}>
      <div className="cart-drawer-header">
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <IconCart count={cart.length} />
          <span>나만의 시험지 조합기</span>
        </h2>
        <button
          className="btn-secondary"
          style={{ borderRadius: "50%", padding: "6px", display: "flex" }}
          onClick={onClose}
        >
          <IconClose />
        </button>
      </div>

      <div>
        <div className="section-title">시험지 표지 제목</div>
        <input
          type="text"
          className="modern-input"
          value={examTitle}
          onChange={(e) => setExamTitle(e.target.value)}
        />
      </div>

      <div className="cart-item-list">
        {cart.length === 0 ? (
          <div className="empty-state" style={{ height: "100%" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <p style={{ textAlign: "center", fontSize: "0.9rem" }}>
              아직 카트에 담긴 문제가 없습니다.<br />
              왼쪽 문제 리스트에서 [담기] 버튼을 눌러 문제를 골라 담아보세요!
            </p>
          </div>
        ) : (
          groupedCart.map((group, idx) => (
            <div key={group.groupId} className="cart-item-card" style={{ flexDirection: "column", alignItems: "stretch", gap: "0.5rem", padding: "0.85rem 1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "var(--accent-blue)", fontWeight: 600 }}>
                  {idx + 1}번째 지문 그룹
                </span>
                <button
                  className="btn-remove"
                  style={{ padding: "4px" }}
                  onClick={() => removeGroup(group)}
                  title="세트 전체 삭제"
                >
                  <IconTrash />
                </button>
              </div>
              <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                {getGroupTitle(group)}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.25rem" }}>
                {group.items.map((item) => (
                  <div 
                    key={`${item.year}-${item.number}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid var(--border-glass)",
                      borderRadius: "6px",
                      padding: "3px 8px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)"
                    }}
                  >
                    <span>
                      문 {item.number}{item.year ? ` (${item.year.toString().replace(/[^0-9]/g, "")}-${item.number})` : ""}
                    </span>
                    <button 
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--accent-rose)",
                        cursor: "pointer",
                        padding: "0 2px",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center"
                      }}
                      onClick={() => toggleCart(item)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {cart.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", borderTop: "1px solid var(--border-glass)", paddingTop: "1.25rem" }}>
          <button 
            className="btn-secondary" 
            style={{ 
              width: "100%", 
              justifyContent: "center", 
              padding: "0.8rem", 
              color: "var(--accent-cyan)", 
              borderColor: "rgba(34,211,238,0.3)", 
              background: "rgba(34,211,238,0.06)", 
              fontWeight: 700 
            }}
            onClick={() => {
              setIsSingleView(true);
              if (singleViewIndex >= cart.length) {
                setSingleViewIndex(0);
              }
              setSingleViewType("cart");
              onClose();
            }}
          >
            🖥️ 이 조합으로 한 문제씩 풀기
          </button>
          <button className="btn-primary" onClick={handlePrint} style={{ width: "100%", justifyContent: "center", padding: "0.8rem" }}>
            <IconPrinter />
            실제 리트 포맷 인쇄 / PDF 저장하기
          </button>
          <button 
            className="btn-secondary" 
            style={{ width: "100%", justifyContent: "center", color: "var(--accent-cyan)" }}
            onClick={() => {
              if (!examTitle || examTitle.trim() === "") {
                alert("시험지 제목을 입력해 주세요.");
                return;
              }
              const lightCartData = cart.map(item => ({
                year: item.year,
                number: item.number,
                subject: isVerbal ? "언어이해" : "추리논증",
                passage_id: item.passage_id
              }));
              const newWorkbook = {
                id: Date.now().toString(),
                title: examTitle,
                cart_data: lightCartData,
                subject: isVerbal ? "언어이해" : "추리논증",
                updated_at: new Date().toISOString()
              };
              setSavedWorkbooks(prev => {
                const next = [newWorkbook, ...prev];
                localStorage.setItem("leet_saved_workbooks", JSON.stringify(next));
                return next;
              });
              alert("시험지 조합이 보관소에 저장되었습니다!");
            }}
          >
            💾 내 보관소에 조합 저장
          </button>
          <button className="btn-secondary" onClick={clearCart} style={{ width: "100%", justifyContent: "center", color: "var(--accent-rose)" }}>
            조합 비우기
          </button>
        </div>
      )}

      {/* Saved Combinations Drawer Section */}
      <div className="saved-combos-section">
        <div className="section-title">
          📁 나의 {isVerbal ? "언어이해" : "추리논증"} 조합 보관소
        </div>
        {(() => {
          const currentSubject = isVerbal ? "언어이해" : "추리논증";
          const filteredWorkbooks = savedWorkbooks.filter(
            (w) => (w.subject || "추리논증") === currentSubject
          );

          if (filteredWorkbooks.length === 0) {
            return (
              <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", padding: "1rem" }}>
                {currentSubject} 보관소에 저장된 조합이 아직 없습니다.
              </p>
            );
          }

          return (
            <div className="combo-list">
              {filteredWorkbooks.map((combo) => (
                <div key={combo.id} className="combo-card" onClick={() => {
                  setCart(combo.cart_data);
                  setExamTitle(combo.title);
                  setSingleViewIndex(0);
                  onClose();
                  alert(`'${combo.title}' (${currentSubject}) 조합을 카트에 복구했습니다!`);
                }}>
                  <div className="combo-info">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {combo.title}
                      </span>
                      <span className="badge" style={{ fontSize: "10px", padding: "1px 5px", background: isVerbal ? "rgba(59,130,246,0.15)" : "rgba(168,85,247,0.15)", color: isVerbal ? "var(--accent-blue)" : "var(--accent-purple)", borderRadius: "4px" }}>
                        {currentSubject}
                      </span>
                    </div>
                    <span className="date">문항 {(combo.cart_data || []).length}개 · {(combo.updated_at || "").split("T")[0]}</span>
                  </div>
                  <button
                    className="btn-remove"
                    style={{ padding: "4px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("이 보관 조합을 완전히 삭제하시겠습니까?")) {
                        setSavedWorkbooks(prev => {
                          const next = prev.filter(w => w.id !== combo.id);
                          localStorage.setItem("leet_saved_workbooks", JSON.stringify(next));
                          return next;
                        });
                      }
                    }}
                  >
                    <IconTrash />
                  </button>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default CartDrawer;
