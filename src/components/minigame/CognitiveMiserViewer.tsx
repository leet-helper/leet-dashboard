import React, { useState, useEffect } from "react";

export default function CognitiveMiserViewer({ theme }) {
  const [questions, setQuestions] = useState([]);
  const [activePool, setActivePool] = useState([]); // Questions for the current session
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 is Start Screen
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  
  // Storage states
  const [history, setHistory] = useState({});
  const [excluded, setExcluded] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [playMode, setPlayMode] = useState("all"); // "all" or "favorites"
  
  // Game states
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review states
  const [showFavList, setShowFavList] = useState(false);
  const [expandedFavId, setExpandedFavId] = useState(null);

  const fetchQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch index file
      const indexRes = await fetch(`/data/cognitive_miser_index.json?t=${new Date().getTime()}`);
      if (!indexRes.ok) throw new Error("인지적 구두쇠 인덱스 데이터를 불러오지 못했습니다.");
      const miserFiles = await indexRes.json();
      
      // 2. Fetch all files in parallel
      const fetchPromises = miserFiles.map(async (fileName) => {
        const res = await fetch(`/data/${fileName}?t=${new Date().getTime()}`);
        if (!res.ok) throw new Error(`${fileName} 데이터를 불러오지 못했습니다.`);
        return res.json();
      });
      
      const results = await Promise.all(fetchPromises);
      
      // 3. Combine questions
      const combined = results.flat();
      setQuestions(combined);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLocalStorage = () => {
    try {
      setHistory(JSON.parse(localStorage.getItem("leet_miser_history") || "{}"));
      setExcluded(JSON.parse(localStorage.getItem("leet_miser_excluded") || "[]"));
      setFavorites(JSON.parse(localStorage.getItem("leet_miser_favorites") || "[]"));
    } catch (e) {
      console.error("Failed to load local storage state", e);
    }
  };

  useEffect(() => {
    fetchQuestions();
    loadLocalStorage();
  }, []);

  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const handleStartGame = (mode) => {
    setPlayMode(mode);
    let pool = [];
    if (mode === "favorites") {
      pool = questions.filter(q => favorites.includes(q.id));
    } else {
      pool = questions.filter(q => !excluded.includes(q.id));
    }

    if (pool.length === 0) {
      alert("해당하는 문항이 없습니다.");
      return;
    }

    const shuffledPool = shuffleArray(pool);
    setActivePool(shuffledPool);
    setCurrentIndex(0);
    setSelectedOptionIdx(null);
    setSubmitted(false);
    setScore(0);
  };

  const handleSelectOption = (idx) => {
    if (submitted) return;
    setSelectedOptionIdx(idx);
  };

  const handleSubmit = () => {
    if (selectedOptionIdx === null || submitted) return;
    setSubmitted(true);
    
    const currentQuestion = activePool[currentIndex];
    const correctIdx = currentQuestion.correct_index;
    const isCorrect = selectedOptionIdx === correctIdx;
    
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    // Save to history
    const newHistory = {
      ...history,
      [currentQuestion.id]: { answered: true, isCorrect }
    };
    setHistory(newHistory);
    localStorage.setItem("leet_miser_history", JSON.stringify(newHistory));
  };

  const handleNext = () => {
    setSelectedOptionIdx(null);
    setSubmitted(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleRestart = () => {
    setCurrentIndex(-1);
    setSelectedOptionIdx(null);
    setSubmitted(false);
    setScore(0);
    // Reload local storage state in case of updates during the session
    loadLocalStorage();
  };

  // Toggle Favorite
  const handleToggleFavorite = (id, e) => {
    if (e) e.stopPropagation();
    let newFavorites;
    if (favorites.includes(id)) {
      newFavorites = favorites.filter(favId => favId !== id);
    } else {
      newFavorites = [...favorites, id];
    }
    setFavorites(newFavorites);
    localStorage.setItem("leet_miser_favorites", JSON.stringify(newFavorites));
  };

  // Exclude Question
  const handleExcludeQuestion = (id, e) => {
    if (e) e.stopPropagation();
    
    if (!window.confirm("이 문제를 앞으로 훈련에서 제외하시겠습니까?\n(제외 시 즉시 문제에서 제외되며, 인트로 화면에서 다시 복원할 수 있습니다.)")) {
      return;
    }

    const newExcluded = [...excluded];
    if (!newExcluded.includes(id)) {
      newExcluded.push(id);
    }
    setExcluded(newExcluded);
    localStorage.setItem("leet_miser_excluded", JSON.stringify(newExcluded));

    // If currently playing
    if (currentIndex >= 0 && currentIndex < activePool.length) {
      setSelectedOptionIdx(null);
      setSubmitted(false);
      
      const updatedPool = activePool.filter(q => q.id !== id);
      setActivePool(updatedPool);

      // If the excluded item was the last item in the pool
      if (currentIndex >= updatedPool.length) {
        setCurrentIndex(updatedPool.length); // Trigger results screen
      }
    }
  };

  const handleResetExcluded = () => {
    if (window.confirm("제외된 모든 문항을 초기화하고 다시 훈련 풀에 포함하시겠습니까?")) {
      setExcluded([]);
      localStorage.removeItem("leet_miser_excluded");
      alert("제외 목록이 초기화되었습니다.");
    }
  };

  const handleResetHistory = () => {
    if (window.confirm("모든 문제 풀이 이력(맞춤/틀림)을 초기화하시겠습니까?")) {
      setHistory({});
      localStorage.setItem("leet_miser_history", "{}");
      alert("풀이 이력이 초기화되었습니다.");
    }
  };

  // Analyze rank/level
  const getRankInfo = (finalScore, totalCount) => {
    const rate = totalCount > 0 ? (finalScore / totalCount) * 100 : 0;
    if (rate >= 90) {
      return {
        badge: "🏆 철벽의 합리주의자 (System 2 마스터)",
        color: "var(--accent-emerald)",
        desc: "직관(System 1)의 지배에서 벗어나 매사 엄밀하고 차분하게 논리를 분석하는 이성 제어의 대가입니다. LEET 추리논증 및 언어이해 시험에서 함정 지문을 격파하는 실전 감각이 고도로 발달되어 있습니다."
      };
    } else if (rate >= 60) {
      return {
        badge: "🔍 이성적 수사관 (논리 제어 1단계)",
        color: "var(--accent-blue)",
        desc: "대부분의 직관적 덫을 훌륭히 간파해냈으나, 간혹 뇌가 편한 지름길을 택해 매몰되는 경향이 있습니다. 선지 분석 단계에서 조금 더 의심해보고 수학적/논리적 전제를 꼼꼼히 확인하는 습관을 단련하십시오."
      };
    } else if (rate >= 30) {
      return {
        badge: "🌱 잠재적 사색가 (의심 유망주)",
        color: "var(--accent-amber)",
        desc: "첫눈에 그럴싸해 보이는 오답 함정에 쉽게 낚이는 스타일입니다. 인지적 구두쇠 성향이 강해 지문을 속독하면서 '느낌상 맞다'고 넘어가기 쉽습니다. 오독을 방지하기 위해 문장의 엄밀한 수식 관계를 정독하는 연습이 필요합니다."
      };
    } else {
      return {
        badge: "🎣 철저한 직관주의자 (System 1 과의존형)",
        color: "var(--accent-rose)",
        desc: "뇌가 에너지를 너무 아끼려다 보니 매번 덫인 줄 모르고 함정으로 직진하고 있습니다. LEET 공부를 본격적으로 시작하기에 앞서, '첫 직관은 일단 무조건 의심하고 보류한다'는 논리 철벽 방어 태세부터 단련해야 합니다."
      };
    }
  };

  if (isLoading) {
    return (
      <div className="miser-loading-container">
        <div className="spinner"></div>
        <p>인지적 구두쇠 자극 퀴즈 세트를 준비하는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="miser-error-container">
        <h2>⚠️ 에러가 발생했습니다</h2>
        <p>{error}</p>
        <button className="btn-primary" onClick={fetchQuestions}>다시 시도</button>
      </div>
    );
  }

  const isStart = currentIndex === -1;
  const isEnd = currentIndex >= activePool.length && currentIndex !== -1;
  const currentQuestion = !isStart && !isEnd ? activePool[currentIndex] : null;

  // Compute accumulated stats for start screen
  const totalQuestionsCount = questions.length;
  const answeredCount = Object.keys(history).length;
  const correctCount = Object.values(history).filter((h: any) => h.isCorrect).length;
  const wrongCount = answeredCount - correctCount;
  const totalAccuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  return (
    <div className="miser-outer-container">
      <style>{`
        .miser-outer-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          width: 100%;
          min-height: 100vh;
          padding: 2.5rem 1.5rem;
          background: radial-gradient(circle at 50% 50%, var(--bg-secondary) 0%, var(--bg-primary) 100%);
          color: var(--text-primary);
          overflow-y: auto;
          position: relative;
        }

        .miser-outer-container::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: 
            radial-gradient(white, rgba(255,255,255,.12) 1.5px, transparent 35px),
            radial-gradient(white, rgba(255,255,255,.05) 1px, transparent 25px);
          background-size: 500px 500px, 300px 300px;
          background-position: 0 0, 50px 100px;
          opacity: 0.15;
          pointer-events: none;
          z-index: 0;
        }

        body.light-theme .miser-outer-container::before {
          background-image: 
            radial-gradient(black, rgba(0,0,0,.04) 1.5px, transparent 35px),
            radial-gradient(black, rgba(0,0,0,.02) 1px, transparent 25px);
          opacity: 0.12;
        }

        .miser-header {
          text-align: center;
          margin-bottom: 2rem;
          z-index: 1;
          max-width: 800px;
        }

        .miser-title {
          font-family: var(--font-title);
          font-size: 2.2rem;
          font-weight: 800;
          background: linear-gradient(135deg, var(--text-primary) 30%, var(--accent-purple) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
          text-shadow: 0 0 30px rgba(168, 85, 247, 0.15);
        }

        .miser-desc {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        /* Glass Cards */
        .miser-glass-card {
          background: var(--bg-glass, rgba(255, 255, 255, 0.04));
          border: 1px solid var(--border-glass, rgba(255, 255, 255, 0.08));
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 20px;
          padding: 2.5rem;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25);
          width: 100%;
          max-width: 760px;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        body.light-theme .miser-glass-card {
          background: rgba(255, 255, 255, 0.55);
          box-shadow: var(--card-shadow);
        }

        /* Progress box */
        .progress-box {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
        }

        .progress-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .progress-bar-bg {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          overflow: hidden;
        }

        body.light-theme .progress-bar-bg {
          background: rgba(0, 0, 0, 0.06);
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-purple) 0%, var(--accent-blue) 100%);
          border-radius: 10px;
          transition: width 0.3s ease;
        }

        /* MCQ Options Grid */
        .miser-options-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          width: 100%;
        }

        .miser-option-btn {
          width: 100%;
          padding: 1.1rem 1.5rem;
          font-size: 0.95rem;
          font-weight: 600;
          text-align: left;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-glass);
          color: var(--text-primary);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        body.light-theme .miser-option-btn {
          background: rgba(255, 255, 255, 0.4);
        }

        .miser-option-btn:hover:not(:disabled) {
          background: rgba(168, 85, 247, 0.08);
          border-color: var(--accent-purple);
          transform: translateX(4px);
        }

        .miser-option-btn.selected {
          background: rgba(168, 85, 247, 0.15);
          border-color: var(--accent-purple);
          color: var(--accent-purple);
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.1);
        }

        .miser-option-btn.correct-highlight {
          background: rgba(16, 185, 129, 0.15);
          border-color: var(--accent-emerald);
          color: var(--accent-emerald);
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.1);
        }

        .miser-option-btn.wrong-highlight {
          background: rgba(244, 63, 94, 0.15);
          border-color: var(--accent-rose);
          color: var(--accent-rose);
          box-shadow: 0 0 15px rgba(244, 63, 94, 0.1);
        }

        .miser-option-btn:disabled {
          cursor: not-allowed;
        }

        .option-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-glass);
          font-size: 0.8rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        body.light-theme .option-badge {
          background: rgba(0, 0, 0, 0.05);
        }

        /* Debunking Box */
        .debunking-box {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-glass);
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          animation: slideUp 0.3s ease-out;
        }

        body.light-theme .debunking-box {
          background: rgba(0, 0, 0, 0.03);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .debunk-label {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--accent-purple);
          background: rgba(168, 85, 247, 0.1);
          padding: 0.25rem 0.6rem;
          border-radius: 4px;
          width: fit-content;
        }

        /* Action Buttons */
        .btn-miser-primary {
          background: linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-blue) 100%);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 1.1rem 2rem;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 4px 15px rgba(168, 85, 247, 0.3);
        }

        .btn-miser-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(168, 85, 247, 0.45);
        }

        .btn-miser-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Loading / Error */
        .miser-loading-container,
        .miser-error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 50vh;
          gap: 1rem;
          z-index: 1;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(168, 85, 247, 0.1);
          border-left-color: var(--accent-purple);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Toolbar styles */
        .card-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          margin-bottom: 0.2rem;
        }

        .badge-container {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .miser-history-badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.6rem;
          border-radius: 20px;
          border: 1px solid transparent;
        }

        .miser-history-badge.new {
          background: rgba(168, 85, 247, 0.1);
          border-color: rgba(168, 85, 247, 0.3);
          color: var(--accent-purple);
        }

        .miser-history-badge.correct {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.3);
          color: var(--accent-emerald);
        }

        .miser-history-badge.wrong {
          background: rgba(244, 63, 94, 0.1);
          border-color: rgba(244, 63, 94, 0.3);
          color: var(--accent-rose);
        }

        .toolbar-actions {
          display: flex;
          gap: 0.6rem;
        }

        .tool-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-glass);
          color: var(--text-secondary);
          width: 34px;
          height: 34px;
          border-radius: 50%;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        body.light-theme .tool-btn {
          background: rgba(0, 0, 0, 0.03);
        }

        .tool-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-focus);
          transform: scale(1.08);
        }

        .tool-btn.fav-active {
          color: #fbbf24;
          background: rgba(251, 191, 36, 0.15);
          border-color: #fbbf24;
          text-shadow: 0 0 10px rgba(251, 191, 36, 0.3);
        }

        .tool-btn.exclude-btn:hover {
          color: var(--accent-rose);
          background: rgba(244, 63, 94, 0.1);
          border-color: var(--accent-rose);
        }

        /* Stats Grid */
        .stats-summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          width: 100%;
          margin: 1rem 0;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-glass);
          border-radius: 12px;
          padding: 1rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        body.light-theme .stat-card {
          background: rgba(0, 0, 0, 0.02);
        }

        .stat-card-val {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--accent-purple);
        }

        .stat-card-label {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        /* Favorites Collapsible Review list */
        .fav-review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          cursor: pointer;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-glass);
          border-radius: 12px;
          font-weight: 700;
          transition: all 0.2s ease;
        }

        body.light-theme .fav-review-header {
          background: rgba(0, 0, 0, 0.02);
        }

        .fav-review-header:hover {
          border-color: var(--accent-purple);
          background: rgba(168, 85, 247, 0.05);
        }

        .fav-list {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          width: 100%;
          max-height: 280px;
          overflow-y: auto;
          margin-top: 0.5rem;
          padding-right: 0.25rem;
        }

        .fav-item {
          border: 1px solid var(--border-glass);
          border-radius: 10px;
          overflow: hidden;
          background: rgba(255,255,255, 0.01);
        }

        .fav-item-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.8rem 1rem;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .fav-item-summary:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .fav-item-body {
          padding: 1.2rem;
          background: rgba(0, 0, 0, 0.15);
          border-top: 1px solid var(--border-glass);
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          text-align: left;
        }

        body.light-theme .fav-item-body {
          background: rgba(0, 0, 0, 0.02);
        }

        /* Utilities */
        .btn-action-group {
          display: flex;
          gap: 0.75rem;
          width: 100%;
          justify-content: center;
          margin-top: 0.5rem;
        }

        .btn-miser-secondary {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-glass);
          color: var(--text-secondary);
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
        }

        body.light-theme .btn-miser-secondary {
          background: rgba(0, 0, 0, 0.03);
        }

        .btn-miser-secondary:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
          border-color: var(--border-focus);
        }

        body.light-theme .btn-miser-secondary:hover {
          background: rgba(0, 0, 0, 0.06);
        }

        .btn-miser-secondary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .reset-buttons-container {
          display: flex;
          justify-content: space-between;
          width: 100%;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px dashed var(--border-glass);
        }

        .btn-reset-danger {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.75rem;
          cursor: pointer;
          text-decoration: underline;
          transition: color 0.2s ease;
        }

        .btn-reset-danger:hover {
          color: var(--accent-rose);
        }
      `}</style>

      {/* Header */}
      <div className="miser-header">
        <h1 className="miser-title">🧠 인지적 구두쇠 탈출 훈련</h1>
        <p className="miser-desc">
          우리의 뇌는 직관적으로 생각하고 에너지를 아끼려는 '인지적 구두쇠' 성향이 있습니다.<br />
          언어이해와 추리논증 고득점을 위해, 뇌의 1차 직관(System 1)을 의도적으로 누르고 2차 이성(System 2)을 발동하여 교묘한 함정들을 회피하는 훈련을 하세요!
        </p>
      </div>

      {/* 1. Start Screen */}
      {isStart && (
        <div className="miser-glass-card" style={{ alignItems: "center" }}>
          <div style={{ fontSize: "4rem", animation: "pulse 2s infinite", textAlign: "center" }}>🧠</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, textAlign: "center" }}>인지적 구두쇠 편향성 자극 테스트 (총 {totalQuestionsCount}문항)</h2>
          
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.7", maxWidth: "640px", textAlign: "center", margin: "0.5rem 0" }}>
            본 훈련은 인지 반사 시험(CRT), 대표성 휴리스틱, 도박사의 오류, 프레이밍 효과 등 <strong>인간이 무의식중에 직관의 지름길을 택하며 범하는 120가지 논리 함정</strong>을 진단합니다.
            <br />
            문제를 대충 훑어보고 생각나는 '그럴싸한 대답'은 함정 선지입니다. 엄밀한 논리를 증명하십시오!
          </p>

          {/* Cumulative Stats Card */}
          <div className="stats-summary-grid">
            <div className="stat-card">
              <span className="stat-card-val">{answeredCount} / {totalQuestionsCount}</span>
              <span className="stat-card-label">누적 학습 진행도</span>
            </div>
            <div className="stat-card">
              <span className="stat-card-val" style={{ color: totalAccuracy >= 60 ? "var(--accent-emerald)" : "var(--accent-amber)" }}>
                {totalAccuracy}% ({correctCount}개)
              </span>
              <span className="stat-card-label">누적 합리성 간파율</span>
            </div>
          </div>

          {/* Action buttons to start training */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", width: "100%", maxWidth: "420px", marginTop: "0.5rem" }}>
            <button className="btn-miser-primary" onClick={() => handleStartGame("all")}>
              전체 무작위 훈련 시작 🚀
            </button>
            <button 
              className="btn-miser-secondary" 
              onClick={() => handleStartGame("favorites")}
              disabled={favorites.length === 0}
            >
              ⭐ 즐겨찾기 문항만 훈련 ({favorites.length}개)
            </button>
          </div>

          {/* Favorites Collapsible Review */}
          {favorites.length > 0 && (
            <div style={{ width: "100%", marginTop: "1rem" }}>
              <div className="fav-review-header" onClick={() => setShowFavList(!showFavList)}>
                <span>⭐ 즐겨찾기 문항 오답노트 복습</span>
                <span>{showFavList ? "▲" : "▼"}</span>
              </div>
              
              {showFavList && (
                <div className="fav-list">
                  {questions.filter(q => favorites.includes(q.id)).map((fav) => {
                    const isExpanded = expandedFavId === fav.id;
                    return (
                      <div key={fav.id} className="fav-item">
                        <div className="fav-item-summary" onClick={() => setExpandedFavId(isExpanded ? null : fav.id)}>
                          <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>[{fav.category}] {fav.title}</span>
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <button 
                              className="tool-btn fav-active" 
                              style={{ width: "24px", height: "24px", fontSize: "0.75rem" }}
                              onClick={(e) => handleToggleFavorite(fav.id, e)}
                            >
                              ★
                            </button>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{isExpanded ? "접기" : "보기"}</span>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="fav-item-body">
                            <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", whiteSpace: "pre-line" }}>
                              {fav.question}
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                              {fav.options.map((opt, oIdx) => (
                                <div 
                                  key={oIdx}
                                  style={{
                                    padding: "0.5rem 0.8rem",
                                    borderRadius: "6px",
                                    fontSize: "0.85rem",
                                    background: fav.correct_index === oIdx ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.02)",
                                    border: fav.correct_index === oIdx ? "1px solid var(--accent-emerald)" : "1px solid var(--border-glass)",
                                    color: fav.correct_index === oIdx ? "var(--accent-emerald)" : "var(--text-secondary)"
                                  }}
                                >
                                  <strong>{String.fromCharCode(65 + oIdx)}.</strong> {opt}
                                </div>
                              ))}
                            </div>
                            <div className="debunking-box" style={{ marginTop: "0.4rem" }}>
                              <span className="debunk-label">{fav.category}</span>
                              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: 0 }}>
                                {fav.explanation}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Reset buttons */}
          <div className="reset-buttons-container">
            <button className="btn-reset-danger" onClick={handleResetHistory}>
              ♻️ 누적 학습이력 초기화
            </button>
            {excluded.length > 0 && (
              <button className="btn-reset-danger" onClick={handleResetExcluded}>
                ♻️ 제외된 문제 복원 ({excluded.length}개)
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Active Quiz Screen */}
      {currentQuestion && (
        <div className="miser-glass-card">
          {/* Card Top Toolbar */}
          <div className="card-toolbar">
            <div className="badge-container">
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-purple)", textTransform: "uppercase" }}>
                {currentQuestion.category}
              </span>
              {/* History Badge */}
              {history[currentQuestion.id] ? (
                history[currentQuestion.id].isCorrect ? (
                  <span className="miser-history-badge correct">✅ 이전에 맞춤</span>
                ) : (
                  <span className="miser-history-badge wrong">❌ 이전에 틀림</span>
                )
              ) : (
                <span className="miser-history-badge new">🆕 처음 푸는 문제</span>
              )}
            </div>
            
            <div className="toolbar-actions">
              <button 
                className={`tool-btn ${favorites.includes(currentQuestion.id) ? "fav-active" : ""}`}
                title="즐겨찾기 추가/해제"
                onClick={(e) => handleToggleFavorite(currentQuestion.id, e)}
              >
                {favorites.includes(currentQuestion.id) ? "★" : "☆"}
              </button>
              <button 
                className="tool-btn exclude-btn"
                title="이 문제를 훈련에서 영구 제외"
                onClick={(e) => handleExcludeQuestion(currentQuestion.id, e)}
              >
                🚫
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="progress-box">
            <div className="progress-meta">
              <span>진행률: {currentIndex + 1} / {activePool.length} 문항 {playMode === "favorites" && " (즐겨찾기 복습)"}</span>
              <span>🧠 현재 점수: {score}</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${((currentIndex + 1) / activePool.length) * 100}%` }}></div>
            </div>
          </div>

          {/* Question Text */}
          <div style={{ borderLeft: "4px solid var(--accent-purple)", paddingLeft: "1rem", margin: "0.2rem 0" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "0.2rem", lineHeight: "1.6", wordBreak: "keep-all" }}>
              {currentQuestion.question}
            </h3>
          </div>

          {/* Options Grid */}
          <div className="miser-options-grid">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOptionIdx === idx;
              const isCorrect = currentQuestion.correct_index === idx;
              
              let btnClass = "miser-option-btn";
              if (submitted) {
                if (isCorrect) btnClass += " correct-highlight";
                else if (isSelected) btnClass += " wrong-highlight";
              } else {
                if (isSelected) btnClass += " selected";
              }

              return (
                <button
                  key={idx}
                  className={btnClass}
                  onClick={() => handleSelectOption(idx)}
                  disabled={submitted}
                >
                  <span className="option-badge">{String.fromCharCode(65 + idx)}</span>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>

          {/* Debunking Explanation after submission */}
          {submitted && (
            <div className="debunking-box">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="debunk-label">{currentQuestion.category}</span>
                <span style={{ 
                  fontSize: "0.9rem", 
                  fontWeight: "bold", 
                  color: selectedOptionIdx === currentQuestion.correct_index ? "var(--accent-emerald)" : "var(--accent-rose)"
                }}>
                  {selectedOptionIdx === currentQuestion.correct_index ? "🧠 간파 성공!" : `🎣 낚임! (함정: ${currentQuestion.intuitive_answer})`}
                </span>
              </div>
              <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: "1.6", wordBreak: "keep-all", margin: 0 }}>
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* Bottom Action buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            {!submitted ? (
              <button 
                className="btn-miser-primary" 
                onClick={handleSubmit} 
                disabled={selectedOptionIdx === null}
              >
                답안 제출하기 🔍
              </button>
            ) : (
              <button className="btn-miser-primary" onClick={handleNext}>
                {currentIndex + 1 < activePool.length ? "다음 문항 이동 ➡️" : "결과 확인하기 🏆"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Results Summary Screen */}
      {isEnd && (
        <div className="miser-glass-card" style={{ alignItems: "center", textAlign: "center" }}>
          <div style={{ fontSize: "4.5rem" }}>📊</div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800 }}>종합 인지 진단 결과</h2>
          
          <div style={{ margin: "1.5rem 0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.1rem", color: "var(--text-secondary)" }}>
              최종 맞춘 개수: <strong style={{ color: "var(--accent-purple)", fontSize: "1.6rem" }}>{score}</strong> / {activePool.length}
            </span>
            <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>
              합리성 지수(System 2 정합성): <strong>{activePool.length > 0 ? Math.round((score / activePool.length) * 100) : 0}%</strong>
            </span>
          </div>

          {/* Level evaluation */}
          <div style={{ 
            background: "rgba(255,255,255,0.02)", 
            border: `2px solid ${getRankInfo(score, activePool.length).color}`,
            borderRadius: "12px",
            padding: "1.5rem",
            maxWidth: "600px",
            marginBottom: "1.5rem"
          }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: getRankInfo(score, activePool.length).color, marginBottom: "0.75rem" }}>
              {getRankInfo(score, activePool.length).badge}
            </h3>
            <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: "1.7", wordBreak: "keep-all", margin: 0 }}>
              {getRankInfo(score, activePool.length).desc}
            </p>
          </div>

          <button className="btn-miser-primary" style={{ width: "100%", maxWidth: "300px" }} onClick={handleRestart}>
            처음부터 다시 도전 ♻️
          </button>
        </div>
      )}
    </div>
  );
}
