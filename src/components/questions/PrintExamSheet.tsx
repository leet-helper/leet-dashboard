import React from "react";

/**
 * 1. 언어이해 (Verbal) 전용 인쇄 컴포넌트
 * - 1개 지문에 3개 문항이 연결되는 세트형 구조
 * - passage_id별로 그룹핑하여 지문 상단 배치 후 하단에 문항 배치
 */
function VerbalPrintSheet({ cart }) {
  // Group cart items by passage_id
  const printGroups = React.useMemo(() => {
    const groups = [];
    cart.forEach((item) => {
      const groupId = item.passage_id || `single-${item.year}-${item.number}`;
      let group = groups.find(g => g.groupId === groupId);
      if (!group) {
        group = {
          groupId,
          year: item.year,
          passage: item.passage,
          passage_id: item.passage_id,
          problems: []
        };
        groups.push(group);
      }
      group.problems.push(item);
    });
    return groups;
  }, [cart]);

  // Pre-calculate sequential global index (문 1, 문 2, 문 3...)
  const problemGlobalIndexes = React.useMemo(() => {
    const indexes = {};
    let idx = 1;
    printGroups.forEach(group => {
      group.problems.forEach(prob => {
        const key = `${prob.year}-${prob.number}`;
        indexes[key] = idx++;
      });
    });
    return indexes;
  }, [printGroups]);

  const getPassageHeader = (group) => {
    const yearStr = group.year ? (group.year.toString().includes("학년도") ? group.year.toString() : `${group.year}학년도`) : "";
    const probNums = group.problems.map(p => p.number).join(", ");
    return `${yearStr} 문제 ${probNums}`;
  };

  return (
    <div className="compiled-exam verbal-print-exam">
      <div className="print-page-all">
        {printGroups.map((group) => (
          <div key={group.groupId} className="print-group">
            {/* Shared Passage Box for Verbal */}
            {group.passage && (
              <div className="print-passage-section">
                <div style={{ marginBottom: "10px" }}>
                  <span style={{ fontSize: "9.5pt", fontWeight: "bold", fontFamily: "sans-serif" }}>
                    [{getPassageHeader(group)}]
                  </span>
                </div>
                <div className="passage-box" style={{ whiteSpace: "pre-wrap", fontSize: "9pt", lineHeight: "1.65", fontFamily: "serif" }}>
                  {(() => {
                    let text = group.passage;
                    text = text.replace(/\\n/g, "\n");
                    text = text.replace(/(.)(<법안|<규정|<조항|<견해|\[사례|\[조건|A:|B:|C:)/g, (match, p1, p2) => {
                      if (p1 === "\n") return match;
                      return p1 + "\n\n" + p2;
                    });
                    return text;
                  })()}
                </div>
              </div>
            )}

            {/* Questions under Shared Passage */}
            <div className="print-problems-grid">
              {group.problems.map((prob, probIdx) => {
                const isLastProblem = probIdx === group.problems.length - 1;
                const globalIdx = problemGlobalIndexes[`${prob.year}-${prob.number}`];
                return (
                  <div
                    key={`${prob.year}-${prob.number}`}
                    className="compiled-problem-item"
                    style={{
                      breakInside: "avoid",
                      breakBefore: "auto",
                      marginBottom: isLastProblem ? "0" : "36px",
                    }}
                  >
                    <h3 style={{ fontSize: "9pt", fontWeight: "bold", marginBottom: "6px", fontFamily: "serif", lineHeight: "1.4" }}>
                      {(() => {
                        const cleanYear = prob.year ? prob.year.toString().replace(/[^0-9]/g, "") : "";
                        const tag = cleanYear && prob.number ? `(${cleanYear}-${prob.number})` : "";
                        return `문 ${globalIdx}${tag}. ${prob.question}`;
                      })()}
                    </h3>

                    {!group.passage && prob.passage && (
                      <div className="passage-box" style={{ whiteSpace: "pre-wrap", fontSize: "8.5pt", lineHeight: "1.5", marginBottom: "8px", fontFamily: "serif" }}>
                        {prob.passage.replace(/\\n/g, "\n")}
                      </div>
                    )}

                    {prob.has_box && prob.box_content && (
                      <div className="box-container" style={{ whiteSpace: "pre-wrap", fontSize: "8.5pt", padding: "6px", border: "1px solid #000", margin: "6px 0" }}>
                        <div className="box-title" style={{ fontWeight: "bold", textAlign: "center", marginBottom: "4px" }}>&lt;보 기&gt;</div>
                        {prob.box_content.replace(/\\n/g, "\n").replace(/([^\n])\s*(ㄴ\.|ㄷ\.|ㄹ\.|ㅁ\.)/g, "$1\n$2")}
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "6px" }}>
                      {prob.options && prob.options.map((opt, oIdx) => (
                        <div key={oIdx} className="option-item" style={{ fontSize: "8.5pt", lineHeight: "1.4" }}>
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 2. 추리논증 (Reasoning) 전용 인쇄 컴포넌트
 * - 1개 문항이 독립적인 단위 (1문항 = 1지문+보상자+선지)
 * - 이미지 출력을 완전히 제거하고 2단(좌/우 분할, 반페이지) 정밀 텍스트 레이아웃으로 렌더링
 * - 2단 A4 페이지 내에서 1개 문항이 반페이지(1컬럼) 단위를 차지하도록 breakInside: avoid 적용
 */
function ReasoningPrintSheet({ cart }) {
  return (
    <div className="compiled-exam reasoning-print-exam">
      <div className="print-page-all">
        {cart.map((prob, idx) => (
          <div
            key={`${prob.year}-${prob.number}-${idx}`}
            className="compiled-problem-item reasoning-problem-item"
            style={{
              breakInside: "avoid",
              pageBreakInside: "avoid",
              marginBottom: "28px",
            }}
          >
            {/* 문항 번호 및 질문 발문 */}
            <h3 style={{ fontSize: "9.0pt", fontWeight: "bold", marginBottom: "6px", fontFamily: '"KoPubDotum", "NanumGothic", "Malgun Gothic", serif', lineHeight: "1.4" }}>
              {(() => {
                const cleanYear = prob.year ? prob.year.toString().replace(/[^0-9]/g, "") : "";
                const tag = cleanYear && prob.number ? `(${cleanYear}-${prob.number})` : "";
                return `문 ${idx + 1}${tag}. ${prob.question}`;
              })()}
            </h3>

            {/* 추리논증 제시문 / 지문 (실제 LEET 규격 1px 박스 처리) */}
            {prob.passage && (
              <div className="passage-box reasoning-passage-box" style={{ whiteSpace: "pre-wrap", fontSize: "8.5pt", lineHeight: "1.5", padding: "6px 8px", border: "0.75px solid #000000", margin: "6px 0", fontFamily: '"KoPubBatang", "Nanum Myeongjo", "Batang", serif' }}>
                {prob.passage.replace(/\\n/g, "\n")}
              </div>
            )}

            {/* <보 기> 상자 (0.75px 박스) */}
            {prob.box_content && prob.box_content.trim() !== "" && (
              <div className="box-container reasoning-box-container" style={{ whiteSpace: "pre-wrap", fontSize: "8.5pt", padding: "6px 8px", border: "0.75px solid #000000", margin: "6px 0", fontFamily: '"KoPubBatang", "Nanum Myeongjo", "Batang", serif' }}>
                <div className="box-title" style={{ fontWeight: "bold", textAlign: "center", marginBottom: "4px", fontFamily: '"KoPubDotum", "NanumGothic", sans-serif' }}>&lt;보 기&gt;</div>
                {prob.box_content.replace(/\\n/g, "\n").replace(/([^\n])\s*(ㄴ\.|ㄷ\.|ㄹ\.|ㅁ\.)/g, "$1\n$2")}
              </div>
            )}

            {/* 선택지 ① ~ ⑤ */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "6px" }}>
              {prob.options && prob.options.map((opt, oIdx) => (
                <div key={oIdx} className="option-item" style={{ fontSize: "8.5pt", lineHeight: "1.4", fontFamily: '"KoPubBatang", "Nanum Myeongjo", "Batang", serif' }}>
                  {opt}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Main PrintExamSheet Component
 * - isVerbal 값에 따라 완전히 분리된 렌더러 호출
 */
function PrintExamSheet({ cart, compactPages = {}, isVerbal }: any) {
  if (!cart || cart.length === 0) return null;

  if (isVerbal) {
    return <VerbalPrintSheet cart={cart} />;
  }

  return <ReasoningPrintSheet cart={cart} />;
}

export default PrintExamSheet;
