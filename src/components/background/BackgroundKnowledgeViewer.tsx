import React, { useState, useEffect, useRef } from "react";
import { IconSearch, IconClose, IconCheck } from "../Icons";
import KnowledgeGraph from "./KnowledgeGraph";

const CATEGORY_COLORS = {
  "인문·철학": { bg: "rgba(244, 63, 94, 0.15)", border: "rgba(244, 63, 94, 0.3)", color: "var(--accent-rose)" },
  "사회과학·법학": { bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.3)", color: "var(--accent-emerald)" },
  "자연과학·기술": { bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.3)", color: "var(--accent-blue)" },
  "경제·경영": { bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.3)", color: "var(--accent-amber)" },
  "논리학·수학": { bg: "rgba(168, 85, 247, 0.15)", border: "rgba(168, 85, 247, 0.3)", color: "var(--accent-purple)" }
};

export default function BackgroundKnowledgeViewer({
  theme = "dark",
  knowledgeData = [],
  isKnowledgeLoading = false,
  searchQuery = "",
  setSearchQuery = (_val?: any) => { },
  quizState = null,
  setQuizState = (_val?: any) => { },
  podcastState = null,
  setPodcastState = (_val?: any) => { },
  debateState = null,
  setDebateState = (_val?: any) => { },
  selectedConceptIds = [],
  setSelectedConceptIds = (_val?: any) => { },
  fusionPassageState = null,
  setFusionPassageState = (_val?: any) => { },
  handleNavigateToProblem = (_val?: any) => { },
  handleGenerateQuiz = (_val?: any) => { },
  handleSelectQuizOption = (_val?: any) => { },
  handleGeneratePodcast = (_val?: any) => { },
  handlePlayPodcast = (_val?: any) => { },
  handleStopPodcast = (_val?: any) => { },
  handleStartDebate = (_a?: any, _b?: any) => Promise.resolve(),
  handleSendDebateMessage = (_val?: any) => Promise.resolve(),
  toggleSelectConcept = (_val?: any) => { },
  handleGenerateFusionPassage = (_val?: any) => { },
  handleSelectFusionOption = (_val?: any) => { },
  setActiveTab = (_val?: any) => { },
  selectedCategory = "전체",
  setSelectedCategory = (_val?: any) => { },
  activeConceptId = "",
  setActiveConceptId = (_val?: any) => { },
  completedConceptIds = [],
  toggleConceptCompleted = (_val?: any) => { },
  currentUser = null,
  bookmarkLists = [],
  createBookmarkList = (_val?: any) => Promise.resolve(false),
  deleteBookmarkList = (_val?: any) => Promise.resolve(false),
  toggleBookmarkMember = (_a?: any, _b?: any) => Promise.resolve(false)
}: any) {
  const [viewerTab, setViewerTab] = useState("list"); // 'list', 'map', 'quiz', 'bookmarks', 'shuffle'
  const selectedConcept = activeConceptId ? knowledgeData.find(c => c.id === activeConceptId) : null;
  const setSelectedConcept = (concept) => {
    setActiveConceptId(concept ? concept.id : "");
  };
  const [modalTab, setModalTab] = useState("definition"); // 'definition', 'mapping'

  // Local states
  const [debateInput, setDebateInput] = useState("");
  const [debateUserRole, setDebateUserRole] = useState("pro");
  const [seconds, setSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  // Bookmarks feature local states
  const [activeBookmarkDropdownConceptId, setActiveBookmarkDropdownConceptId] = useState(null);
  const [newBookmarkListName, setNewBookmarkListName] = useState("");
  const [newBookmarkListNameTab, setNewBookmarkListNameTab] = useState("");
  const [selectedBookmarkListId, setSelectedBookmarkListId] = useState(null);

  // Shuffled view states
  const [shuffledConceptsList, setShuffledConceptsList] = useState([]);

  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const getOrInitializeShuffledList = (data) => {
    if (!data || data.length === 0) return [];

    const savedOrderStr = localStorage.getItem("background_knowledge_shuffle_order");
    if (savedOrderStr) {
      try {
        const savedIds = JSON.parse(savedOrderStr);
        if (Array.isArray(savedIds) && savedIds.length > 0) {
          const conceptMap = new Map(data.map(c => [c.id, c]));
          const orderedList = [];

          savedIds.forEach(id => {
            if (conceptMap.has(id)) {
              orderedList.push(conceptMap.get(id));
              conceptMap.delete(id);
            }
          });

          if (conceptMap.size > 0) {
            const newConcepts = Array.from(conceptMap.values());
            orderedList.push(...shuffleArray(newConcepts));
          }

          return orderedList;
        }
      } catch (e) {
        console.error("Failed to parse saved shuffle order:", e);
      }
    }

    const shuffled = shuffleArray(data);
    const shuffledIds = shuffled.map(c => c.id);
    localStorage.setItem("background_knowledge_shuffle_order", JSON.stringify(shuffledIds));
    return shuffled;
  };

  const handleReshuffleConcepts = () => {
    if (knowledgeData && knowledgeData.length > 0) {
      const shuffled = shuffleArray(knowledgeData);
      setShuffledConceptsList(shuffled);
      const shuffledIds = shuffled.map(c => c.id);
      localStorage.setItem("background_knowledge_shuffle_order", JSON.stringify(shuffledIds));
    }
  };

  const handleShuffleTabClick = () => {
    setViewerTab("shuffle");
    if (shuffledConceptsList.length === 0 && knowledgeData.length > 0) {
      setShuffledConceptsList(getOrInitializeShuffledList(knowledgeData));
    }
  };

  // Sync shuffled concepts when knowledgeData changes
  useEffect(() => {
    if (knowledgeData && knowledgeData.length > 0) {
      setShuffledConceptsList(getOrInitializeShuffledList(knowledgeData));
    }
  }, [knowledgeData]);

  // Auto-close bookmark dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".bookmark-btn") && !e.target.closest(".bookmark-dropdown")) {
        setActiveBookmarkDropdownConceptId(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  // Auto-select the first bookmark list if none is selected
  useEffect(() => {
    if (bookmarkLists.length > 0) {
      if (!selectedBookmarkListId || !bookmarkLists.some(l => l.id === selectedBookmarkListId)) {
        setSelectedBookmarkListId(bookmarkLists[0].id);
      }
    } else {
      setSelectedBookmarkListId(null);
    }
  }, [bookmarkLists, selectedBookmarkListId]);

  // Past Exam Mapping Inline States
  const [selectedMappingExam, setSelectedMappingExam] = useState(null);
  const [mappingProblem, setMappingProblem] = useState(null);
  const [mappingProblemLoading, setMappingProblemLoading] = useState(false);
  const [selectedMappingOption, setSelectedMappingOption] = useState(null);
  const [showMappingExplanation, setShowMappingExplanation] = useState(false);

  // Main Tab Concept Quiz States
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [selectedQuizOption, setSelectedQuizOption] = useState(null);
  const [showQuizExplanation, setShowQuizExplanation] = useState(false);

  const categories = ["전체", "인문·철학", "사회과학·법학", "자연과학·기술", "경제·경영", "논리학·수학"];

  // Auto-scroll refs
  const chatBottomRef = useRef(null);
  const transcriptRefs = useRef([]);

  // Reset mapping and modal states when selected concept changes
  useEffect(() => {
    if (selectedConcept) {
      setModalTab("definition");
      setSelectedMappingExam(null);
      setMappingProblem(null);
      setSelectedMappingOption(null);
      setShowMappingExplanation(false);
    }
  }, [selectedConcept]);

  // Generate a random concept quiz locally (no API key required)
  const generateRandomQuiz = () => {
    if (!knowledgeData || knowledgeData.length === 0) return;

    // 1. Pick a random concept
    const randomIdx = Math.floor(Math.random() * knowledgeData.length);
    const correctConcept = knowledgeData[randomIdx];

    // 2. Decide quiz type (50% Type A: definition to title, 50% Type B: title to definition)
    const type = Math.random() < 0.5 ? "A" : "B";

    // 3. Select 4 incorrect concepts as distractors
    let candidates = knowledgeData.filter(c => c.id !== correctConcept.id);
    const sameCategoryCandidates = candidates.filter(c => c.category === correctConcept.category);
    const distractorsPool = sameCategoryCandidates.length >= 4 ? sameCategoryCandidates : candidates;

    const shuffledPool = [...distractorsPool].sort(() => 0.5 - Math.random());
    const selectedDistractors = shuffledPool.slice(0, 4);

    let question = "";
    let options = [];
    let answerIdx = 0;
    let explanation = "";

    if (type === "A") {
      question = `다음 학술적 설명이 가리키는 올바른 학술 개념은 무엇입니까?\n\n"${correctConcept.definition}"\n\n${correctConcept.example ? `• 예시: ${correctConcept.example}` : ""}`;

      const allOptions = [correctConcept.title, ...selectedDistractors.map(d => d.title)];
      const shuffled = allOptions
        .map((value, idx) => ({ value, sort: Math.random(), originalIdx: idx }))
        .sort((a, b) => a.sort - b.sort);

      options = shuffled.map(s => s.value);
      answerIdx = shuffled.findIndex(s => s.originalIdx === 0);
      explanation = `정답은 '${correctConcept.title}'입니다.\n\n${correctConcept.definition}\n\n• 예시: ${correctConcept.example || "없음"}\n• LEET 대비: ${correctConcept.leet_context || "없음"}`;
    } else {
      question = `학술 개념 '${correctConcept.title}' (${correctConcept.english_title || ""})에 대한 올바른 학술적 설명이나 정의를 고르세요.`;

      const allOptions = [correctConcept.definition, ...selectedDistractors.map(d => d.definition)];
      const shuffled = allOptions
        .map((value, idx) => ({ value, sort: Math.random(), originalIdx: idx }))
        .sort((a, b) => a.sort - b.sort);

      options = shuffled.map(s => s.value);
      answerIdx = shuffled.findIndex(s => s.originalIdx === 0);
      explanation = `정답은 '${correctConcept.title}'의 정의인 '${correctConcept.definition}'입니다.\n\n• 예시: ${correctConcept.example || "없음"}\n• LEET 대비: ${correctConcept.leet_context || "없음"}`;
    }

    setCurrentQuiz({
      concept: correctConcept,
      type,
      question,
      options,
      answerIdx,
      explanation
    });
    setSelectedQuizOption(null);
    setShowQuizExplanation(false);
  };

  // Populate first quiz when knowledgeData is ready
  useEffect(() => {
    if (knowledgeData.length > 0 && !currentQuiz) {
      generateRandomQuiz();
    }
  }, [knowledgeData, currentQuiz]);

  // Load a mapped exam problem directly inside the modal
  const loadMappingProblem = async (examKey) => {
    const [year, numStr] = examKey.split("-");
    const problemNumber = parseInt(numStr, 10);
    setMappingProblemLoading(true);
    setSelectedMappingOption(null);
    setShowMappingExplanation(false);
    try {
      const res = await fetch(`/data/${year}.json?t=${new Date().getTime()}`);
      if (!res.ok) throw new Error("문제를 불러오지 못했습니다.");
      const data = await res.json();
      const problem = data.problems.find(p => p.number === problemNumber);
      if (problem) {
        setMappingProblem({ ...problem, year: data.year });
        setSelectedMappingExam(examKey);
      } else {
        alert("해당 번호의 문제를 찾을 수 없습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("문제를 가져오는 중에 오류가 발생했습니다.");
    } finally {
      setMappingProblemLoading(false);
    }
  };

  // Debate chat auto-scroll
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [debateState?.messages?.length, debateState?.loading]);

  // Podcast transcript auto-scroll
  useEffect(() => {
    if (podcastState?.playing && podcastState?.currentIdx !== undefined) {
      const activeEl = transcriptRefs.current[podcastState.currentIdx];
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [podcastState?.currentIdx, podcastState?.playing]);

  // Stopwatch Timer for Fusion Passage
  useEffect(() => {
    let interval;
    if (timerRunning) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Start timer when fusion passage loads
  useEffect(() => {
    if (fusionPassageState && !fusionPassageState.loading && fusionPassageState.passage) {
      setSeconds(0);
      setTimerRunning(true);
    } else {
      setTimerRunning(false);
    }
  }, [fusionPassageState?.passage, fusionPassageState?.loading]);

  // Stop timer when option is selected
  useEffect(() => {
    if (fusionPassageState?.selectedOption !== null) {
      setTimerRunning(false);
    }
  }, [fusionPassageState?.selectedOption]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleConceptLinkClick = (title) => {
    const found = knowledgeData.find(c => c.title === title || c.id === title);
    if (found) {
      setSelectedConcept(found);
    }
  };

  const handleExamClick = (examKey) => {
    handleNavigateToProblem(examKey);
    setActiveTab("problems");
    setSelectedConcept(null);
  };

  const handleSendDebate = (e) => {
    e.preventDefault();
    if (!debateInput.trim() || debateState?.loading) return;
    handleSendDebateMessage(debateInput);
    setDebateInput("");
  };

  // Filter based on search query, category, completed status, and bookmark list
  const baseConcepts = viewerTab === "shuffle" ? shuffledConceptsList : knowledgeData;

  const filteredConcepts = baseConcepts.filter((concept) => {
    const matchSearch = searchQuery
      ? concept.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (concept.english_title && concept.english_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      concept.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (concept.leet_context && concept.leet_context.toLowerCase().includes(searchQuery.toLowerCase())) ||
      concept.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    const matchCategory = selectedCategory === "전체" ? true : concept.category === selectedCategory;
    const matchCompleted = viewerTab === "completed" ? (completedConceptIds && completedConceptIds.includes(concept.id)) : true;

    const activeList = bookmarkLists.find(l => l.id === selectedBookmarkListId);
    const matchBookmark = viewerTab === "bookmarks"
      ? (activeList && (activeList.concept_ids || activeList.concepts || []).includes(concept.id))
      : true;

    return matchSearch && matchCategory && matchCompleted && matchBookmark;
  });

  const currentIndex = selectedConcept ? filteredConcepts.findIndex(c => c.id === selectedConcept.id) : -1;
  const totalIndexInData = selectedConcept ? (viewerTab === "shuffle" ? shuffledConceptsList.findIndex(c => c.id === selectedConcept.id) : knowledgeData.findIndex(c => c.id === selectedConcept.id)) : -1;
  const listToNavigate = currentIndex !== -1 ? filteredConcepts : (viewerTab === "shuffle" ? shuffledConceptsList : knowledgeData);
  const activeIndex = currentIndex !== -1 ? currentIndex : totalIndexInData;

  const handlePrevCard = () => {
    if (activeIndex > 0) {
      setSelectedConcept(listToNavigate[activeIndex - 1]);
      handleStopPodcast();
    }
  };

  const handleNextCard = () => {
    if (activeIndex < listToNavigate.length - 1) {
      setSelectedConcept(listToNavigate[activeIndex + 1]);
      handleStopPodcast();
    }
  };

  return (
    <main className="main-content">
      {/* Header and main navigation tabs */}
      <div className="problems-header" style={{ marginBottom: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800 }}>📚 알아두면 좋은 LEET 배경지식 사전</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "0.25rem" }}>
            {isKnowledgeLoading ? "데이터를 로드하는 중..." : `추리논증과 언어이해 고득점을 위한 핵심 학술 개념집 (${knowledgeData.length}개 탑재)`}
          </p>
          <div style={{
            marginTop: "0.75rem",
            padding: "0.6rem 1rem",
            borderRadius: "8px",
            background: "rgba(59, 130, 246, 0.08)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            color: "var(--accent-blue)",
            fontSize: "0.85rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            fontWeight: 500
          }}>
            💡 <strong>안내:</strong> 영단어처럼 단순 암기해야 하는 대상이 아닙니다. 실제 지문을 만났을 때 빠르고 원활한 세계 구축(맥락 파악)이 가능하도록 논리 구조를 친숙하게 이해해두는 용도입니다. 심심할 때 읽어보세요.
          </div>
        </div>
      </div>

      {/* Main Feature Tabs */}
      <div className="viewer-tabs">
        <button
          onClick={() => setViewerTab("list")}
          className={`viewer-tab-btn ${viewerTab === "list" ? "active" : ""}`}
        >
          📖 개념 백과사전
        </button>
        <button
          onClick={handleShuffleTabClick}
          className={`viewer-tab-btn ${viewerTab === "shuffle" ? "active" : ""}`}
        >
          🔀 셔플해서 보기
        </button>
        <button
          onClick={() => setViewerTab("completed")}
          className={`viewer-tab-btn ${viewerTab === "completed" ? "active" : ""}`}
        >
          ✔️ 완료 목록
        </button>
        <button
          onClick={() => setViewerTab("bookmarks")}
          className={`viewer-tab-btn ${viewerTab === "bookmarks" ? "active" : ""}`}
        >
          🔖 즐겨찾기
        </button>
        <button
          onClick={() => setViewerTab("map")}
          className={`viewer-tab-btn ${viewerTab === "map" ? "active" : ""}`}
        >
          🕸️ 지식 네트워크 맵
        </button>
        <button
          onClick={() => setViewerTab("quiz")}
          className={`viewer-tab-btn ${viewerTab === "quiz" ? "active" : ""}`}
        >
          📝 개념 퀴즈
        </button>
      </div>


      {isKnowledgeLoading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
          <div style={{
            width: "40px", height: "40px",
            border: "4px solid rgba(59, 130, 246, 0.1)", borderTop: "4px solid var(--accent-blue)",
            borderRadius: "50%", animation: "spin 1s linear infinite"
          }}></div>
        </div>
      ) : (
        <>
          {/* TAB 1: CONCEPT LIST VIEW / COMPLETED / BOOKMARKS / SHUFFLE */}
          {(viewerTab === "list" || viewerTab === "completed" || viewerTab === "bookmarks" || viewerTab === "shuffle") && (
            <div className={viewerTab === "bookmarks" ? "bookmarks-layout" : ""} style={viewerTab === "bookmarks" ? {} : {}}>
              {/* Left sidebar for bookmark lists */}
              {viewerTab === "bookmarks" && (
                <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", padding: "1.25rem", height: "fit-content", minWidth: "200px" }}>
                  <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.3rem" }}>🔖 즐겨찾기 폴더</h4>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", overflowY: "auto", maxHeight: "300px" }}>
                    {bookmarkLists.length === 0 ? (
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic", padding: "1rem 0", textAlign: "center" }}>
                        생성된 폴더가 없습니다.
                      </div>
                    ) : (
                      bookmarkLists.map((lst) => {
                        const isSelected = selectedBookmarkListId === lst.id;
                        return (
                          <div
                            key={lst.id}
                            onClick={() => setSelectedBookmarkListId(lst.id)}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "0.5rem 0.75rem",
                              borderRadius: "8px",
                              background: isSelected ? "rgba(59, 130, 246, 0.12)" : "transparent",
                              border: isSelected ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid transparent",
                              color: isSelected ? "var(--accent-blue)" : "var(--text-secondary)",
                              cursor: "pointer",
                              transition: "all 0.2s ease"
                            }}
                          >
                            <span style={{ fontSize: "0.88rem", fontWeight: isSelected ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "90px" }}>
                              {lst.name}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              <span style={{ fontSize: "0.7rem", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "10px", color: "var(--text-muted)", fontWeight: "bold" }}>
                                {(lst.concept_ids || lst.concepts || []).length}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`'${lst.name}' 즐겨찾기 폴더를 삭제하시겠습니까?`)) {
                                    deleteBookmarkList(lst.id);
                                  }
                                }}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "var(--accent-rose)",
                                  cursor: "pointer",
                                  fontSize: "0.85rem",
                                  padding: "2px",
                                  display: "flex",
                                  alignItems: "center",
                                  opacity: 0.6
                                }}
                                onMouseEnter={(e) => (e.currentTarget as any).style.opacity = "1"}
                                onMouseLeave={(e) => (e.currentTarget as any).style.opacity = "0.6"}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "4px", marginTop: "0.5rem", borderTop: "1px solid var(--border-glass)", paddingTop: "0.75rem" }}>
                    <input
                      type="text"
                      placeholder="새 폴더명..."
                      value={newBookmarkListNameTab}
                      onChange={(e) => setNewBookmarkListNameTab(e.target.value)}
                      style={{
                        flex: 1,
                        fontSize: "0.75rem",
                        padding: "0.35rem 0.5rem",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid var(--border-glass)",
                        color: "var(--text-primary)"
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (newBookmarkListNameTab.trim()) {
                            createBookmarkList(newBookmarkListNameTab.trim()).then((success) => {
                              if (success) setNewBookmarkListNameTab("");
                            });
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (newBookmarkListNameTab.trim()) {
                          createBookmarkList(newBookmarkListNameTab.trim()).then((success) => {
                            if (success) setNewBookmarkListNameTab("");
                          });
                        }
                      }}
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.35rem 0.6rem",
                        borderRadius: "6px",
                        background: "var(--accent-blue)",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: "bold"
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <div style={{ flex: 1 }}>
                {/* Reshuffle button for shuffle tab */}
                {viewerTab === "shuffle" && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
                    <button
                      onClick={handleReshuffleConcepts}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem 1rem",
                        borderRadius: "8px",
                        background: "rgba(59, 130, 246, 0.1)",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                        color: "var(--accent-blue)",
                        fontSize: "0.85rem",
                        fontWeight: "bold",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--accent-blue)";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
                        e.currentTarget.style.color = "var(--accent-blue)";
                      }}
                    >
                      🔀 카드 순서 다시 섞기
                    </button>
                  </div>
                )}

                {/* Grid of Concept Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem", paddingBottom: "2rem" }}>
                  {filteredConcepts.length === 0 ? (
                    <div className="glass-card empty-state" style={{ gridColumn: "1 / -1", minHeight: "240px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                      <p style={{ marginTop: "1rem", color: "var(--text-secondary)", textAlign: "center", padding: "0 1rem" }}>
                        {viewerTab === "bookmarks" && bookmarkLists.length === 0
                          ? "생성된 즐겨찾기 폴더가 없습니다. 카드 우측의 별표(★) 아이콘을 눌러 새 폴더를 생성하고 추가해 보세요."
                          : viewerTab === "bookmarks"
                            ? "이 즐겨찾기 폴더에 추가된 학술 개념이 없습니다. 개념 백과사전에서 카드의 즐겨찾기를 지정해 주세요."
                            : "검색 조건과 일치하는 학술 개념이 없습니다."}
                      </p>
                    </div>
                  ) : (
                    filteredConcepts.map((concept) => {
                      const colors = CATEGORY_COLORS[concept.category] || { bg: "rgba(255,255,255,0.05)", border: "var(--border-glass)", color: "var(--text-secondary)" };
                      const isCompleted = completedConceptIds.includes(concept.id);
                      return (
                        <article
                          key={concept.id}
                          className={`glass-card ${isCompleted ? "completed" : ""}`}
                          onClick={() => setSelectedConcept(concept)}
                          style={{
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            padding: "1.5rem",
                            transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease, border-color 0.25s ease",
                            borderLeft: `4px solid ${colors.color}`,
                            height: "100%",
                            borderColor: isCompleted ? (theme === "light" ? "rgba(5, 150, 105, 0.3)" : "rgba(16, 185, 129, 0.3)") : "var(--border-glass)"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-4px)";
                            e.currentTarget.style.boxShadow = `0 12px 24px -10px ${colors.color}25`;
                            e.currentTarget.style.borderColor = colors.color;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.borderColor = isCompleted
                              ? (theme === "light" ? "rgba(5, 150, 105, 0.3)" : "rgba(16, 185, 129, 0.3)")
                              : "var(--border-glass)";
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                              <span
                                className="badge"
                                style={{
                                  background: colors.bg,
                                  borderColor: colors.border,
                                  color: colors.color,
                                  fontWeight: 700
                                }}
                              >
                                {concept.category}
                              </span>
                              <div style={{ display: "flex", gap: "0.25rem", alignItems: "center", position: "relative" }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleConceptCompleted(concept.id);
                                  }}
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.3rem",
                                    fontSize: "0.8rem",
                                    outline: "none",
                                    transition: "all 0.2s ease"
                                  }}
                                >
                                  {isCompleted ? (
                                    <span style={{ color: "var(--accent-emerald)", fontWeight: 700, display: "flex", alignItems: "center", gap: "2px" }}>
                                      <IconCheck /> 완료
                                    </span>
                                  ) : (
                                    <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "2px" }}>
                                      ⬜ 완료체크
                                    </span>
                                  )}
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveBookmarkDropdownConceptId(
                                      activeBookmarkDropdownConceptId === concept.id ? null : concept.id
                                    );
                                  }}
                                  className="bookmark-btn"
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                    fontSize: "0.8rem",
                                    outline: "none",
                                    transition: "all 0.2s ease",
                                    color: bookmarkLists.some(l => (l.concept_ids || l.concepts || []).includes(concept.id)) ? "var(--accent-amber)" : "var(--text-muted)"
                                  }}
                                >
                                  {bookmarkLists.some(l => (l.concept_ids || l.concepts || []).includes(concept.id)) ? (
                                    <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "2px" }}>
                                      ★ 즐겨찾기
                                    </span>
                                  ) : (
                                    <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                                      ☆ 즐겨찾기
                                    </span>
                                  )}
                                </button>

                                {activeBookmarkDropdownConceptId === concept.id && (
                                  <div
                                    className="bookmark-dropdown glass-card"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      position: "absolute",
                                      bottom: "100%",
                                      right: 0,
                                      marginBottom: "8px",
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
                                      즐겨찾기 폴더 지정
                                    </div>
                                    <div style={{ maxHeight: "120px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem", padding: "2px 0" }}>
                                      {bookmarkLists.length === 0 ? (
                                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", padding: "4px 0" }}>생성된 폴더가 없습니다.</span>
                                      ) : (
                                        bookmarkLists.map(lst => {
                                          const isInList = (lst.concept_ids || lst.concepts || []).includes(concept.id);
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
                                                onChange={() => toggleBookmarkMember(lst.id, concept.id)}
                                                style={{ cursor: "pointer" }}
                                              />
                                              {lst.name}
                                            </label>
                                          );
                                        })
                                      )}
                                    </div>
                                    <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "6px", display: "flex", gap: "4px" }}>
                                      <input
                                        type="text"
                                        placeholder="새 폴더..."
                                        value={newBookmarkListName}
                                        onChange={(e) => setNewBookmarkListName(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                          flex: 1,
                                          fontSize: "0.75rem",
                                          padding: "4px 6px",
                                          borderRadius: "4px",
                                          background: "rgba(255,255,255,0.05)",
                                          border: "1px solid var(--border-glass)",
                                          color: "var(--text-primary)"
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            if (newBookmarkListName.trim()) {
                                              createBookmarkList(newBookmarkListName.trim()).then((success) => {
                                                if (success) {
                                                  setNewBookmarkListName("");
                                                }
                                              });
                                            }
                                          }
                                        }}
                                      />
                                      <button
                                        onClick={() => {
                                          if (newBookmarkListName.trim()) {
                                            createBookmarkList(newBookmarkListName.trim()).then((success) => {
                                              if (success) {
                                                setNewBookmarkListName("");
                                              }
                                            });
                                          }
                                        }}
                                        style={{
                                          fontSize: "0.75rem",
                                          padding: "2px 6px",
                                          borderRadius: "4px",
                                          background: "var(--accent-blue)",
                                          color: "white",
                                          border: "none",
                                          cursor: "pointer"
                                        }}
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem", color: "var(--text-primary)" }}>
                              {concept.title}
                            </h3>
                            {concept.english_title && (
                              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic", marginBottom: "1rem" }}>
                                {concept.english_title}
                              </p>
                            )}

                            <p style={{
                              fontSize: "0.9rem",
                              color: "var(--text-secondary)",
                              lineHeight: 1.5,
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              marginBottom: "1.25rem"
                            }}>
                              {concept.definition}
                            </p>
                          </div>

                          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "auto" }}>
                            {concept.keywords.slice(0, 3).map((kw) => (
                              <span
                                key={kw}
                                style={{
                                  fontSize: "10px",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  background: "rgba(255,255,255,0.03)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  color: "var(--text-muted)"
                                }}
                              >
                                #{kw}
                              </span>
                            ))}
                            {concept.keywords.length > 3 && (
                              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>+{concept.keywords.length - 3}</span>
                            )}
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GEOMETRIC KNOWLEDGE GRAPH MAP */}
          {viewerTab === "map" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingBottom: "2rem" }}>
              <div className="glass-card" style={{ padding: "1rem", background: "rgba(59, 130, 246, 0.03)", border: "1px solid rgba(59, 130, 246, 0.15)" }}>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  💡 <strong>지식 네트워크 안내:</strong> 각 개념들은 관련성이 높은 연관 개념들과 스프링 물리 모델을 통해 상호 유기적으로 결합되어 있습니다. 노드를 마우스로 드래그하여 배치하거나, 휠 스크롤로 확대/축소할 수 있으며, 더블클릭/클릭 시 상세 모달창을 열어 AI 대화 및 퀴즈 기능을 실행할 수 있습니다.
                </p>
              </div>
              <KnowledgeGraph
                knowledgeData={knowledgeData}
                onSelectConcept={(concept: any) => setSelectedConcept(concept)}
                activeTab={viewerTab}
                theme={theme}
              />
            </div>
          )}

          {/* TAB 3: CONCEPT RANDOM CONTINUOUS QUIZ */}
          {viewerTab === "quiz" && (
            <div style={{ maxWidth: "680px", margin: "0 auto", paddingBottom: "3rem" }}>
              <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem", background: "rgba(168, 85, 247, 0.03)", border: "1px solid rgba(168, 85, 247, 0.15)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.4, flex: 1 }}>
                    ✍️ <strong>연속 무한 개념 퀴즈:</strong> 리트 핵심 학술 개념을 무작위로 추출하여 객관식 문제를 로컬에서 상시 자동 출제합니다. 문제를 풀며 습득한 지식을 복습해 보세요.
                  </p>
                  <div style={{ background: "rgba(168, 85, 247, 0.08)", padding: "0.5rem 1rem", borderRadius: "12px", border: "1px solid rgba(168, 85, 247, 0.2)", textAlign: "center", minWidth: "110px" }}>
                    <span style={{ fontSize: "10px", color: "var(--accent-purple)", fontWeight: "bold", display: "block", marginBottom: "2px" }}>현재 스코어</span>
                    <strong style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}>{quizScore.correct} / {quizScore.total}</strong>
                  </div>
                </div>
              </div>

              {currentQuiz ? (
                <div className="glass-card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {/* 카테고리 정보 */}
                  <div>
                    <span
                      className="badge"
                      style={{
                        background: CATEGORY_COLORS[currentQuiz.concept.category]?.bg || "rgba(255,255,255,0.05)",
                        borderColor: CATEGORY_COLORS[currentQuiz.concept.category]?.border || "var(--border-glass)",
                        color: CATEGORY_COLORS[currentQuiz.concept.category]?.color || "var(--text-secondary)",
                        fontWeight: 700
                      }}
                    >
                      {currentQuiz.concept.category} 분야
                    </span>
                  </div>

                  {/* 발문 */}
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, lineHeight: 1.6, margin: 0, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
                    {currentQuiz.question}
                  </h3>

                  {/* 보기 리스트 */}
                  <div className="quiz-options" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {currentQuiz.options.map((opt, idx) => {
                      const isSelected = selectedQuizOption === idx;
                      const isCorrect = currentQuiz.answerIdx === idx;
                      const showFeedback = selectedQuizOption !== null;

                      let optClass = "quiz-option";
                      if (isSelected) optClass += " selected";
                      if (showFeedback) {
                        if (isCorrect) optClass += " correct";
                        else if (isSelected) optClass += " incorrect";
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            if (selectedQuizOption === null) {
                              setSelectedQuizOption(idx);
                              setShowQuizExplanation(true);
                              setQuizScore(prev => ({
                                correct: prev.correct + (idx === currentQuiz.answerIdx ? 1 : 0),
                                total: prev.total + 1
                              }));
                            }
                          }}
                          disabled={showFeedback}
                          className={optClass}
                          style={{ textAlign: "left", padding: "12px 16px", fontSize: "0.9rem", width: "100%", cursor: showFeedback ? "default" : "pointer" }}
                        >
                          {idx + 1}. {opt}
                        </button>
                      );
                    })}
                  </div>

                  {/* 해설 피드백 */}
                  {showQuizExplanation && (
                    <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "1.5rem", marginTop: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        <span style={{
                          fontSize: "12px", fontWeight: "bold", padding: "4px 10px", borderRadius: "4px",
                          background: selectedQuizOption === currentQuiz.answerIdx ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
                          color: selectedQuizOption === currentQuiz.answerIdx ? "var(--accent-emerald)" : "var(--accent-rose)"
                        }}>
                          {selectedQuizOption === currentQuiz.answerIdx ? "🟢 정답입니다!" : "🔴 오답입니다."}
                        </span>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          정답: {currentQuiz.answerIdx + 1}번
                        </span>
                      </div>

                      <div className="quiz-explanation" style={{ padding: "1.25rem", background: "rgba(6, 182, 212, 0.03)", borderRadius: "8px", whiteSpace: "pre-wrap" }}>
                        <h5 style={{ fontWeight: 700, color: "var(--accent-cyan)", margin: "0 0 0.5rem 0", fontSize: "0.95rem" }}>💡 개념 상세 해설</h5>
                        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                          {currentQuiz.explanation}
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                        <button
                          onClick={() => {
                            setQuizScore({ correct: 0, total: 0 });
                          }}
                          className="btn-secondary"
                          style={{ padding: "10px 16px", fontSize: "0.88rem" }}
                        >
                          스코어 초기화
                        </button>
                        <button
                          onClick={generateRandomQuiz}
                          className="btn-primary"
                          style={{ flex: 1, justifyContent: "center", padding: "10px", fontSize: "0.88rem" }}
                        >
                          다음 문제 풀기 ➔
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="glass-card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                  개념 데이터를 로딩 중이거나 문제가 설정되지 않았습니다.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Concept Detail Overlay Modal */}
      {selectedConcept && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setSelectedConcept(null);
            handleStopPodcast();
          }}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0, 0, 0, 0.65)", backdropFilter: "blur(8px)",
            display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
          }}
        >
          <div
            className="glass-card modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: "720px",
              display: "flex", flexDirection: "column",
              maxHeight: "90vh", border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: `0 20px 40px -15px ${CATEGORY_COLORS[selectedConcept.category]?.color || "rgba(0,0,0,0.5)"}20`,
              overflow: "hidden",
              padding: 0,
              position: "relative"
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", borderBottom: "1px solid var(--border-glass)", padding: "1.5rem 2rem 0.75rem 2rem" }}>
              <div>
                <span
                  className="badge"
                  style={{
                    background: CATEGORY_COLORS[selectedConcept.category]?.bg,
                    borderColor: CATEGORY_COLORS[selectedConcept.category]?.border,
                    color: CATEGORY_COLORS[selectedConcept.category]?.color,
                    fontWeight: 700,
                    marginBottom: "0.5rem"
                  }}
                >
                  {selectedConcept.category}
                </span>
                <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
                  {selectedConcept.title}
                  {selectedConcept.english_title && (
                    <span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 500, fontStyle: "italic" }}>
                      ({selectedConcept.english_title})
                    </span>
                  )}
                </h3>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <button
                  onClick={() => toggleConceptCompleted(selectedConcept.id)}
                  className="btn-secondary"
                  style={{
                    padding: "6px 12px",
                    fontSize: "0.8rem",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    borderColor: completedConceptIds.includes(selectedConcept.id) ? "var(--accent-emerald)" : "var(--border-glass)",
                    color: completedConceptIds.includes(selectedConcept.id) ? "var(--accent-emerald)" : "var(--text-secondary)",
                    background: completedConceptIds.includes(selectedConcept.id) ? "rgba(16, 185, 129, 0.08)" : "transparent",
                    transition: "all 0.2s ease"
                  }}
                >
                  {completedConceptIds.includes(selectedConcept.id) ? (
                    <>
                      <IconCheck /> 학습 완료됨
                    </>
                  ) : (
                    <>
                      ⬜ 학습 완료 체크
                    </>
                  )}
                </button>

                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setActiveBookmarkDropdownConceptId(activeBookmarkDropdownConceptId === selectedConcept.id ? null : selectedConcept.id)}
                    className="bookmark-btn btn-secondary"
                    style={{
                      padding: "6px 12px",
                      fontSize: "0.8rem",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      borderColor: bookmarkLists.some(l => (l.concept_ids || l.concepts || []).includes(selectedConcept.id)) ? "var(--accent-amber)" : "var(--border-glass)",
                      color: bookmarkLists.some(l => (l.concept_ids || l.concepts || []).includes(selectedConcept.id)) ? "var(--accent-amber)" : "var(--text-secondary)",
                      background: bookmarkLists.some(l => (l.concept_ids || l.concepts || []).includes(selectedConcept.id)) ? "rgba(245, 158, 11, 0.08)" : "transparent",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {bookmarkLists.some(l => (l.concept_ids || l.concepts || []).includes(selectedConcept.id)) ? "★ 즐겨찾기" : "☆ 즐겨찾기"}
                  </button>
                  {activeBookmarkDropdownConceptId === selectedConcept.id && (
                    <div
                      className="bookmark-dropdown glass-card"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        marginTop: "8px",
                        zIndex: 2000,
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
                        즐겨찾기 폴더 지정
                      </div>
                      <div style={{ maxHeight: "120px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem", padding: "2px 0" }}>
                        {bookmarkLists.length === 0 ? (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", padding: "4px 0" }}>생성된 폴더가 없습니다.</span>
                        ) : (
                          bookmarkLists.map(lst => {
                            const isInList = (lst.concept_ids || lst.concepts || []).includes(selectedConcept.id);
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
                                  onChange={() => toggleBookmarkMember(lst.id, selectedConcept.id)}
                                  style={{ cursor: "pointer" }}
                                />
                                {lst.name}
                              </label>
                            );
                          })
                        )}
                      </div>
                      <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "6px", display: "flex", gap: "4px" }}>
                        <input
                          type="text"
                          placeholder="새 폴더..."
                          value={newBookmarkListName}
                          onChange={(e) => setNewBookmarkListName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            flex: 1,
                            fontSize: "0.75rem",
                            padding: "4px 6px",
                            borderRadius: "4px",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid var(--border-glass)",
                            color: "var(--text-primary)"
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.stopPropagation();
                              e.preventDefault();
                              if (newBookmarkListName.trim()) {
                                createBookmarkList(newBookmarkListName.trim()).then((success) => {
                                  if (success) {
                                    setNewBookmarkListName("");
                                  }
                                });
                              }
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            if (newBookmarkListName.trim()) {
                              createBookmarkList(newBookmarkListName.trim()).then((success) => {
                                if (success) {
                                  setNewBookmarkListName("");
                                }
                              });
                            }
                          }}
                          style={{
                            fontSize: "0.75rem",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "var(--accent-blue)",
                            color: "white",
                            border: "none",
                            cursor: "pointer"
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedConcept(null);
                    handleStopPodcast();
                  }}
                  className="btn-secondary"
                  style={{ padding: "8px", borderRadius: "50%" }}
                >
                  <IconClose />
                </button>
              </div>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="modal-tabs" style={{ padding: "0 2rem 0.25rem 2rem", margin: 0 }}>
              <button
                onClick={() => { setModalTab("definition"); handleStopPodcast(); }}
                className={`modal-tab-btn ${modalTab === "definition" ? "active" : ""}`}
              >
                📖 학술 정의
              </button>
              <button
                onClick={() => { setModalTab("mapping"); handleStopPodcast(); }}
                className={`modal-tab-btn ${modalTab === "mapping" ? "active" : ""}`}
              >
                🎯 기출 매핑
              </button>
            </div>

            {/* Modal Body Contents */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 2rem", minHeight: "260px", position: "relative", zIndex: 1 }}>

              {/* SUB-TAB 1: DEFINITION */}
              {modalTab === "definition" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-cyan)", marginBottom: "0.4rem" }}>
                      📌 학술적 정의
                    </h4>
                    <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.6, background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
                      {selectedConcept.definition}
                    </p>
                  </div>

                  {selectedConcept.example && (
                    <div>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-emerald)", marginBottom: "0.4rem" }}>
                        💡 실생활 예시
                      </h4>
                      <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.5, background: "rgba(16, 185, 129, 0.02)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.08)" }}>
                        {selectedConcept.example}
                      </p>
                    </div>
                  )}

                  {selectedConcept.leet_context && (
                    <div>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-purple)", marginBottom: "0.4rem" }}>
                        🎯 LEET 출제 맥락 & 대비법
                      </h4>
                      <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.5, background: "rgba(168, 85, 247, 0.03)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(168, 85, 247, 0.1)" }}>
                        {selectedConcept.leet_context}
                      </p>
                    </div>
                  )}

                  {/* Keywords */}
                  <div>
                    <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                      핵심 태그
                    </h4>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                      {selectedConcept.keywords.map((kw) => (
                        <span
                          key={kw}
                          style={{
                            fontSize: "11px",
                            padding: "4px 8px",
                            borderRadius: "20px",
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            color: "var(--text-secondary)"
                          }}
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Related Concepts (Cross References) */}
                  {selectedConcept.related_concepts && selectedConcept.related_concepts.length > 0 && (
                    <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "1rem", marginTop: "0.5rem" }}>
                      <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                        연계 학술 개념
                      </h4>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {selectedConcept.related_concepts.map((relName) => (
                          <button
                            key={relName}
                            onClick={() => handleConceptLinkClick(relName)}
                            className="btn-secondary"
                            style={{
                              fontSize: "11px",
                              padding: "6px 10px",
                              borderRadius: "6px",
                              borderColor: "var(--border-glass)",
                              color: "var(--accent-blue)",
                              cursor: "pointer"
                            }}
                          >
                            🔗 {relName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 2: PAST EXAM MAPPING */}
              {modalTab === "mapping" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {mappingProblemLoading ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3rem 0" }}>
                      <div className="spinner" style={{ marginBottom: "1rem" }} />
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>기출문제를 가져오는 중...</p>
                    </div>
                  ) : mappingProblem ? (
                    /* 인라인 문제 풀이 UI */
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-blue)" }}>
                          🎯 {mappingProblem.year} 추리논증 {mappingProblem.number}번
                        </span>
                        <button
                          onClick={() => {
                            setMappingProblem(null);
                            setSelectedMappingExam(null);
                          }}
                          className="btn-secondary"
                          style={{ padding: "4px 8px", fontSize: "0.75rem", borderRadius: "4px" }}
                        >
                          목록으로 돌아가기
                        </button>
                      </div>

                      {/* 제시문 */}
                      <div>
                        <div className="passage-paper" style={{ maxHeight: "250px", overflowY: "auto", fontSize: "0.85rem", padding: "0.75rem", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-glass)" }}>
                          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>{mappingProblem.passage}</pre>
                        </div>
                      </div>

                      {/* 보기 박스 (있는 경우) */}
                      {mappingProblem.has_box && mappingProblem.box_content && (
                        <div className="glass-card" style={{ padding: "0.75rem", fontSize: "0.82rem", background: "rgba(255,255,255,0.01)" }}>
                          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>{mappingProblem.box_content}</pre>
                        </div>
                      )}

                      {/* 발문 */}
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                        문. {mappingProblem.question}
                      </h4>

                      {/* 오지선다 보기 */}
                      <div className="quiz-options" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {mappingProblem.options.map((opt, idx) => {
                          const isSelected = selectedMappingOption === idx;
                          const isCorrect = mappingProblem.answer === (idx + 1);
                          const showFeedback = selectedMappingOption !== null;

                          let optClass = "quiz-option";
                          if (isSelected) optClass += " selected";
                          if (showFeedback) {
                            if (isCorrect) optClass += " correct";
                            else if (isSelected) optClass += " incorrect";
                          }

                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                if (selectedMappingOption === null) {
                                  setSelectedMappingOption(idx);
                                  setShowMappingExplanation(true);
                                }
                              }}
                              disabled={showFeedback}
                              className={optClass}
                              style={{ padding: "10px 14px", fontSize: "0.88rem", textAlign: "left", width: "100%", cursor: showFeedback ? "default" : "pointer" }}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {/* 풀이 해설 및 피드백 */}
                      {showMappingExplanation && (
                        <div style={{ marginTop: "0.5rem", borderTop: "1px solid var(--border-glass)", paddingTop: "0.75rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                            <span style={{
                              fontSize: "11px", fontWeight: "bold", padding: "2px 6px", borderRadius: "4px",
                              background: (selectedMappingOption + 1) === mappingProblem.answer ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
                              color: (selectedMappingOption + 1) === mappingProblem.answer ? "var(--accent-emerald)" : "var(--accent-rose)"
                            }}>
                              {(selectedMappingOption + 1) === mappingProblem.answer ? "정답입니다!" : "오답입니다."}
                            </span>
                            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                              정답: {mappingProblem.answer}번
                            </span>
                          </div>

                          {/* 해설 텍스트 */}
                          <div className="quiz-explanation" style={{ padding: "0.75rem", background: "rgba(6, 182, 212, 0.02)", borderRadius: "6px" }}>
                            <h5 style={{ fontWeight: 700, color: "var(--accent-cyan)", margin: "0 0 0.25rem 0", fontSize: "0.85rem" }}>💡 함정 분석 & 해설</h5>
                            {mappingProblem.trap_category && (
                              <p style={{ margin: "0 0 0.4rem 0", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                <strong>출제 함정:</strong> {mappingProblem.trap_category}
                              </p>
                            )}
                            {mappingProblem.trap_keywords && mappingProblem.trap_keywords.length > 0 && (
                              <p style={{ margin: "0 0 0.4rem 0", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                <strong>주의 키워드:</strong> {mappingProblem.trap_keywords.join(", ")}
                              </p>
                            )}
                            {mappingProblem.explanation ? (
                              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4, whiteSpace: "pre-wrap" }}>
                                {mappingProblem.explanation}
                              </p>
                            ) : (
                              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                                공식 해설이 등록되어 있지 않습니다. 제시문의 핵심 원리와 선지의 논리 관계를 차분히 대조해 보시기 바랍니다.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* 기출 목록 */
                    <>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-blue)", marginBottom: "0.25rem" }}>
                        🎯 연계 기출문제 바로 풀기
                      </h4>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        이 배경지식이 실제로 출제된 LEET 기출 연도와 문항 번호 리스트입니다. 클릭 시 모달 내에서 격리된 상태로 즉시 문제를 풀며 개념을 응용할 수 있습니다.
                      </p>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                        {selectedConcept.related_exams && selectedConcept.related_exams.length > 0 ? (
                          selectedConcept.related_exams.map((examKey) => {
                            const [year, num] = examKey.split("-");
                            return (
                              <button
                                key={examKey}
                                onClick={() => loadMappingProblem(examKey)}
                                className="btn-primary"
                                style={{
                                  justifyContent: "space-between",
                                  padding: "1rem 1.25rem",
                                  borderRadius: "8px",
                                  background: "rgba(59, 130, 246, 0.08)",
                                  borderColor: "rgba(59, 130, 246, 0.25)"
                                }}
                              >
                                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>📝 {year}학년도 추리논증 {num}번 문항</span>
                                <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>문제 풀기 ➔</span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="glass-card" style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                            📭 이 개념은 이론적 중요도가 높은 신규 출제 예상 개념으로, 직접 매핑된 기출문제는 없으나 출제 1순위 후보입니다.
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>

            {/* Modal Navigation Footer */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid var(--border-glass)",
              padding: "1rem 2rem",
              background: "var(--bg-secondary)",
              flexShrink: 0,
              position: "relative",
              zIndex: 10
            }}>
              <button
                className="btn-secondary"
                onClick={handlePrevCard}
                disabled={activeIndex <= 0}
                style={{
                  opacity: activeIndex <= 0 ? 0.4 : 1,
                  cursor: activeIndex <= 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                ◀ 이전 카드
              </button>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                {activeIndex + 1} / {listToNavigate.length}
              </span>
              <button
                className="btn-primary"
                onClick={handleNextCard}
                disabled={activeIndex >= listToNavigate.length - 1}
                style={{
                  opacity: activeIndex >= listToNavigate.length - 1 ? 0.4 : 1,
                  cursor: activeIndex >= listToNavigate.length - 1 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                다음 카드 ▶
              </button>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}
