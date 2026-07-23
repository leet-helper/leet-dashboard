import React, { useState, useEffect, useRef, useMemo } from "react";
import { EXAM_SOURCES, DETAILED_CATEGORIES } from "../constants";
import { getProblemKey } from "../utils";

// Helper function to parse complex question numbers like "1, 2, 4-8"
const parseNumberFilter = (text) => {
  if (!text) return [];
  const parts = text.split(",");
  const nums = new Set();
  parts.forEach((part) => {
    const trimmed = part.trim();
    if (trimmed.includes("-")) {
      const rangeParts = trimmed.split("-").map(p => parseInt(p.trim(), 10));
      if (rangeParts.length === 2 && !isNaN(rangeParts[0]) && !isNaN(rangeParts[1])) {
        const start = Math.min(rangeParts[0], rangeParts[1]);
        const end = Math.max(rangeParts[0], rangeParts[1]);
        for (let i = start; i <= end; i++) {
          nums.add(i);
        }
      }
    } else {
      const val = parseInt(trimmed, 10);
      if (!isNaN(val)) {
        nums.add(val);
      }
    }
  });
  return Array.from(nums);
};

export default function useDashboard() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  
  // Reasoning-specific selection
  const [reasoningSelectedSources, setReasoningSelectedSources] = useState(() => {
    try {
      const saved = localStorage.getItem("leet_selectedSources_reasoning");
      if (saved) return JSON.parse(saved);
      const legacy = localStorage.getItem("leet_selectedSources");
      if (legacy) {
        const parsed = JSON.parse(legacy).filter(s => s.subject === "추리논증");
        if (parsed.length > 0) return parsed;
      }
      const firstReasoning = EXAM_SOURCES.find(s => s.subject === "추리논증");
      return firstReasoning ? [firstReasoning] : [];
    } catch {
      const firstReasoning = EXAM_SOURCES.find(s => s.subject === "추리논증");
      return firstReasoning ? [firstReasoning] : [];
    }
  });

  // Verbal-specific selection
  const [verbalSelectedSources, setVerbalSelectedSources] = useState(() => {
    try {
      const saved = localStorage.getItem("leet_selectedSources_verbal");
      if (saved) return JSON.parse(saved);
      const legacy = localStorage.getItem("leet_selectedSources");
      if (legacy) {
        const parsed = JSON.parse(legacy).filter(s => s.subject === "언어이해");
        if (parsed.length > 0) return parsed;
      }
      const firstVerbal = EXAM_SOURCES.find(s => s.subject === "언어이해");
      return firstVerbal ? [firstVerbal] : [];
    } catch {
      const firstVerbal = EXAM_SOURCES.find(s => s.subject === "언어이해");
      return firstVerbal ? [firstVerbal] : [];
    }
  });

  const [examData, setExamData] = useState({ year: "선택 연도", problems: [] });

  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // User Auth & Saved Combos states
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem("leet_user") || "게스트");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // 'login' or 'register'
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [savedWorkbooks, setSavedWorkbooks] = useState([]);
  
  // Advanced State variables (notes, solved, generated, api-key, etc.)
  const [notes, setNotes] = useState({});
  const [solvedRecords, setSolvedRecords] = useState({});
  const [generatedProblems, setGeneratedProblems] = useState([]);
  const [openaiApiKey, setOpenaiApiKey] = useState(() => localStorage.getItem("openai_api_key") || "");
  
  // AI Generator Reference Problems
  const [selectedRefProblems, setSelectedRefProblems] = useState([]);
  const [refYear, setRefYear] = useState("2026.json");
  const [refNumber, setRefNumber] = useState(1);

  // Split onlyWrong / onlyStatute
  const [reasoningOnlyWrong, setReasoningOnlyWrong] = useState(false);
  const [verbalOnlyWrong, setVerbalOnlyWrong] = useState(false);

  const [reasoningOnlyStatute, setReasoningOnlyStatute] = useState(false);
  const [verbalOnlyStatute, setVerbalOnlyStatute] = useState(false);

  const [activeMemos, setActiveMemos] = useState({}); // Toggled memo inputs by probKey
  const [visibleAnswers, setVisibleAnswers] = useState({}); // Toggled answers by probKey
  const [visibleHints, setVisibleHints] = useState({}); // Toggled hints by probKey
  
  // Pencil Drawing Focus Mode states
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [canvasDrawings, setCanvasDrawings] = useState({});
  const [brushColor, setBrushColor] = useState("rgba(239, 68, 68, 0.85)"); // soft red
  const [brushWidth, setBrushWidth] = useState(3);
  const [brushType, setBrushType] = useState("pen"); // 'pen' or 'highlighter' or 'eraser'
  const [reasoningSingleViewType, setReasoningSingleViewType] = useState(() => {
    try {
      const saved = localStorage.getItem("leet_singleViewType");
      return saved ? saved : "cart";
    } catch {
      return "cart";
    }
  });
  const [verbalSingleViewType, setVerbalSingleViewType] = useState(() => {
    try {
      const saved = localStorage.getItem("leet_verbal_singleViewType");
      return saved ? saved : "cart";
    } catch {
      return "cart";
    }
  });

  const [isCartShuffled, setIsCartShuffled] = useState(() => {
    try {
      const saved = localStorage.getItem("leet_isCartShuffled");
      return saved === "true";
    } catch {
      return false;
    }
  });
  const [shuffledCartIndices, setShuffledCartIndices] = useState(() => {
    try {
      const saved = localStorage.getItem("leet_shuffledCartIndices");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals state
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isWeaknessOpen, setIsWeaknessOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // AI Generator state
  const [genCategory, setGenCategory] = useState(DETAILED_CATEGORIES[0]);
  const [genPrompt, setGenPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [editProblem, setEditProblem] = useState(null);

  // Weakness Analyst state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [weaknessPrompt, setWeaknessPrompt] = useState("저의 오답 패턴과 약점을 정밀하게 분석해주고 구체적인 극복 훈련 가이드를 작성해주세요.");
  const [weaknessReport, setWeaknessReport] = useState("");

  // Split Search and Filters
  const [reasoningSearchQuery, setReasoningSearchQuery] = useState("");
  const [verbalSearchQuery, setVerbalSearchQuery] = useState("");

  const [reasoningSelectedEvals, setReasoningSelectedEvals] = useState([]);
  const [verbalSelectedEvals, setVerbalSelectedEvals] = useState([]);

  const [reasoningSelectedContents, setReasoningSelectedContents] = useState([]);
  const [verbalSelectedContents, setVerbalSelectedContents] = useState([]);

  const [reasoningSelectedDetailTypes, setReasoningSelectedDetailTypes] = useState([]);
  const [verbalSelectedDetailTypes, setVerbalSelectedDetailTypes] = useState([]);
  
  // Question Number Filters Split
  const [reasoningNumberFilterMode, setReasoningNumberFilterMode] = useState("all");
  const [verbalNumberFilterMode, setVerbalNumberFilterMode] = useState("all");

  const [reasoningNumberFilterStart, setReasoningNumberFilterStart] = useState(1);
  const [verbalNumberFilterStart, setVerbalNumberFilterStart] = useState(1);

  const [reasoningNumberFilterEnd, setReasoningNumberFilterEnd] = useState(40);
  const [verbalNumberFilterEnd, setVerbalNumberFilterEnd] = useState(30);

  const [reasoningNumberFilterSpecificText, setReasoningNumberFilterSpecificText] = useState("");
  const [verbalNumberFilterSpecificText, setVerbalNumberFilterSpecificText] = useState("");

  // Reasoning Cartesian Problem Cart
  const [reasoningCart, setReasoningCart] = useState(() => {
    try {
      const saved = localStorage.getItem("leet_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  // Verbal Cartesian Problem Cart
  const [verbalCart, setVerbalCart] = useState(() => {
    try {
      const saved = localStorage.getItem("leet_verbal_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Reasoning Single View Mode states
  const [reasoningIsSingleView, setReasoningIsSingleView] = useState(() => {
    try {
      const saved = localStorage.getItem("leet_isSingleView");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [reasoningSingleViewIndex, setReasoningSingleViewIndex] = useState(() => {
    try {
      const saved = localStorage.getItem("leet_singleViewIndex");
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Verbal Single View Mode states
  const [verbalIsSingleView, setVerbalIsSingleView] = useState(() => {
    try {
      const saved = localStorage.getItem("leet_verbal_isSingleView");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [verbalSingleViewIndex, setVerbalSingleViewIndex] = useState(() => {
    try {
      const saved = localStorage.getItem("leet_verbal_singleViewIndex");
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });


  const [isCartOpen, setIsCartOpen] = useState(false);
  const [examTitle, setExamTitle] = useState("나만의 추리논증 기출 모음집");
  const [compactPages, setCompactPages] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedOrigImage, setSelectedOrigImage] = useState(null);
  const [isOrigImageModalOpen, setIsOrigImageModalOpen] = useState(false);
  const [officialEdits, setOfficialEdits] = useState({});
  const [highlightedWords, setHighlightedWords] = useState({});
  const [arrows, setArrows] = useState([]);
  const [dragStartKey, setDragStartKey] = useState(null);
  const dragStartKeyRef = useRef(null);
  const [dragCurrentCoords, setDragCurrentCoords] = useState(null);
  const [dragTargetKey, setDragTargetKey] = useState(null);

  
  // Free Note states
  const [freeNotes, setFreeNotes] = useState([
    {
      id: "default",
      title: "새 분석 노트",
      text: "",
      highlights: {},
      arrows: [],
      drawing: null,
      fontSize: 16,
      lineHeight: 1.8,
      isTwoColumn: false
    }
  ]);
  const [activeNoteId, setActiveNoteId] = useState("default");
  
  // Background Knowledge states
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem("leet_activeTab");
      return saved ? saved : "problems";
    } catch {
      return "problems";
    }
  }); // 'problems' or 'knowledge'
  const [selectedCategory, setSelectedCategory] = useState(() => {
    try {
      const saved = localStorage.getItem("leet_selectedCategory");
      return saved ? saved : "전체";
    } catch {
      return "전체";
    }
  });
  const [activeConceptId, setActiveConceptId] = useState(() => {
    try {
      const saved = localStorage.getItem("leet_activeConceptId");
      return saved ? saved : "";
    } catch {
      return "";
    }
  });
  const [knowledgeData, setKnowledgeData] = useState([]);
  const [isKnowledgeLoading, setIsKnowledgeLoading] = useState(false);
  const [completedConceptIds, setCompletedConceptIds] = useState([]);
  const [bookmarkLists, setBookmarkLists] = useState([]);
  const [problemBookmarkLists, setProblemBookmarkLists] = useState(() => {
    try {
      const saved = localStorage.getItem("leet_problem_bookmark_lists");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [reasoningSelectedProblemBookmarkListId, setReasoningSelectedProblemBookmarkListId] = useState(null);
  const [verbalSelectedProblemBookmarkListId, setVerbalSelectedProblemBookmarkListId] = useState(null);

  const isVerbal = activeTab === "verbal_problems";

  const selectedSources = isVerbal ? verbalSelectedSources : reasoningSelectedSources;
  const setSelectedSources = (val) => {
    if (isVerbal) {
      setVerbalSelectedSources(val);
    } else {
      setReasoningSelectedSources(val);
    }
  };

  const onlyWrong = isVerbal ? verbalOnlyWrong : reasoningOnlyWrong;
  const setOnlyWrong = (val) => {
    if (isVerbal) {
      setVerbalOnlyWrong(val);
    } else {
      setReasoningOnlyWrong(val);
    }
  };

  const onlyStatute = isVerbal ? verbalOnlyStatute : reasoningOnlyStatute;
  const setOnlyStatute = (val) => {
    if (isVerbal) {
      setVerbalOnlyStatute(val);
    } else {
      setReasoningOnlyStatute(val);
    }
  };

  const searchQuery = isVerbal ? verbalSearchQuery : reasoningSearchQuery;
  const setSearchQuery = (val) => {
    if (isVerbal) {
      setVerbalSearchQuery(val);
    } else {
      setReasoningSearchQuery(val);
    }
  };

  const selectedEvals = isVerbal ? verbalSelectedEvals : reasoningSelectedEvals;
  const setSelectedEvals = (val) => {
    if (isVerbal) {
      setVerbalSelectedEvals(val);
    } else {
      setReasoningSelectedEvals(val);
    }
  };

  const selectedContents = isVerbal ? verbalSelectedContents : reasoningSelectedContents;
  const setSelectedContents = (val) => {
    if (isVerbal) {
      setVerbalSelectedContents(val);
    } else {
      setReasoningSelectedContents(val);
    }
  };

  const selectedDetailTypes = isVerbal ? verbalSelectedDetailTypes : reasoningSelectedDetailTypes;
  const setSelectedDetailTypes = (val) => {
    if (isVerbal) {
      setVerbalSelectedDetailTypes(val);
    } else {
      setReasoningSelectedDetailTypes(val);
    }
  };

  const numberFilterMode = isVerbal ? verbalNumberFilterMode : reasoningNumberFilterMode;
  const setNumberFilterMode = (val) => {
    if (isVerbal) {
      setVerbalNumberFilterMode(val);
    } else {
      setReasoningNumberFilterMode(val);
    }
  };

  const numberFilterStart = isVerbal ? verbalNumberFilterStart : reasoningNumberFilterStart;
  const setNumberFilterStart = (val) => {
    if (isVerbal) {
      setVerbalNumberFilterStart(val);
    } else {
      setReasoningNumberFilterStart(val);
    }
  };

  const numberFilterEnd = isVerbal ? verbalNumberFilterEnd : reasoningNumberFilterEnd;
  const setNumberFilterEnd = (val) => {
    if (isVerbal) {
      setVerbalNumberFilterEnd(val);
    } else {
      setReasoningNumberFilterEnd(val);
    }
  };

  const numberFilterSpecificText = isVerbal ? verbalNumberFilterSpecificText : reasoningNumberFilterSpecificText;
  const setNumberFilterSpecificText = (val) => {
    if (isVerbal) {
      setVerbalNumberFilterSpecificText(val);
    } else {
      setReasoningNumberFilterSpecificText(val);
    }
  };

  const selectedProblemBookmarkListId = isVerbal ? verbalSelectedProblemBookmarkListId : reasoningSelectedProblemBookmarkListId;
  const setSelectedProblemBookmarkListId = (val) => {
    if (isVerbal) {
      setVerbalSelectedProblemBookmarkListId(val);
    } else {
      setReasoningSelectedProblemBookmarkListId(val);
    }
  };

  const [cartExtraProblems, setCartExtraProblems] = useState<any[]>([]);

  // Silent background fetch for Cart items whose year filters are currently unselected
  useEffect(() => {
    const activeCart = isVerbal ? verbalCart : reasoningCart;
    if (!activeCart || activeCart.length === 0) return;

    const missingSources: any[] = [];
    activeCart.forEach(cp => {
      if (cp.year && cp.year !== "생성된 문제") {
        const cpYearNum = cp.year.toString().replace(/[^0-9]/g, "");
        const matchSrc = EXAM_SOURCES.find(src => {
          const baseFile = src.file.replace(".json", "");
          const isVerbalSrc = baseFile.endsWith("_verbal");
          const srcYearNum = baseFile.replace("_verbal", "");
          return srcYearNum === cpYearNum && isVerbalSrc === isVerbal;
        });
        if (matchSrc && !selectedSources.some(s => s.id === matchSrc.id)) {
          if (!missingSources.some(s => s.id === matchSrc.id)) {
            missingSources.push(matchSrc);
          }
        }
      }
    });

    if (missingSources.length === 0) return;

    const fetchPromises = missingSources.map(src =>
      fetch(`./data/${src.file}?t=${new Date().getTime()}`).then(res => res.json())
    );

    Promise.all(fetchPromises).then(results => {
      let extraProbs: any[] = [];
      results.forEach(res => {
        const yearTitle = res.year ? res.year.toString() : "";
        const isVerbalFile = res.sets && Array.isArray(res.sets);
        if (isVerbalFile) {
          res.sets.forEach((s: any) => {
            const sProblems = s.problems.map((p: any) => ({
              ...p,
              year: yearTitle,
              subject: "언어이해",
              passage_id: s.passage_id,
              passage: s.passage,
              category_content: s.category_content
            }));
            extraProbs = [...extraProbs, ...sProblems];
          });
        } else if (res.problems) {
          const probsWithYear = res.problems.map((p: any) => ({
            ...p,
            year: yearTitle,
            subject: "추리논증"
          }));
          extraProbs = [...extraProbs, ...probsWithYear];
        }
      });
      setCartExtraProblems(prev => {
        const existingKeys = new Set(prev.map(p => `${p.year}-${p.number}-${p.subject}`));
        const newOnly = extraProbs.filter(p => !existingKeys.has(`${p.year}-${p.number}-${p.subject}`));
        return [...prev, ...newOnly];
      });
    }).catch(err => console.error("Cart background fetch error:", err));
  }, [reasoningCart, verbalCart, isVerbal, selectedSources]);

  const resolvedVerbalCart = useMemo(() => {
    return verbalCart.map(item => {
      if (item.year === "생성된 문제") return item;
      const allPool = [...(examData?.problems || []), ...cartExtraProblems];
      const official = allPool.find(p => p.number === item.number && p.year === item.year && p.subject === "언어이해");
      if (official) {
        return {
          ...item,
          question: official.question,
          options: official.options,
          box_content: official.box_content,
          passage: official.passage,
          passage_id: official.passage_id,
          image_path: official.image_path,
          answer: official.answer,
          category_eval: official.category_eval,
          category_content: official.category_content
        };
      }
      return item;
    });
  }, [verbalCart, examData, cartExtraProblems]);

  const resolvedReasoningCart = useMemo(() => {
    return reasoningCart.map(item => {
      if (item.year === "생성된 문제") return item;
      const allPool = [...(examData?.problems || []), ...cartExtraProblems];
      const official = allPool.find(p => p.number === item.number && p.year === item.year && p.subject === "추리논증");
      if (official) {
        return {
          ...item,
          question: official.question,
          options: official.options,
          box_content: official.box_content,
          passage: official.passage,
          passage_id: official.passage_id,
          image_path: official.image_path,
          answer: official.answer,
          category_eval: official.category_eval,
          category_content: official.category_content
        };
      }
      return item;
    });
  }, [reasoningCart, examData, cartExtraProblems]);

  const cart = isVerbal ? resolvedVerbalCart : resolvedReasoningCart;
  const setCart = (val) => {
    if (isVerbal) {
      setVerbalCart(val);
    } else {
      setReasoningCart(val);
    }
  };

  const isSingleView = isVerbal ? verbalIsSingleView : reasoningIsSingleView;
  const setIsSingleView = (val) => {
    if (isVerbal) {
      setVerbalIsSingleView(val);
    } else {
      setReasoningIsSingleView(val);
    }
  };

  const singleViewIndex = isVerbal ? verbalSingleViewIndex : reasoningSingleViewIndex;
  const setSingleViewIndex = (val) => {
    if (isVerbal) {
      setVerbalSingleViewIndex(val);
    } else {
      setReasoningSingleViewIndex(val);
    }
  };

  const singleViewType = isVerbal ? verbalSingleViewType : reasoningSingleViewType;
  const setSingleViewType = (val) => {
    if (isVerbal) {
      setVerbalSingleViewType(val);
    } else {
      setReasoningSingleViewType(val);
    }
  };

  const [activeProblemBookmarkDropdownKey, setActiveProblemBookmarkDropdownKey] = useState(null);

  // Background Knowledge AI Features States
  const [quizState, setQuizState] = useState(null);
  const [podcastState, setPodcastState] = useState(null);
  const [debateState, setDebateState] = useState(null);
  const [selectedConceptIds, setSelectedConceptIds] = useState([]);
  const [fusionPassageState, setFusionPassageState] = useState(null);

  useEffect(() => {
    setIsKnowledgeLoading(true);
    fetch(`./data/background_knowledge.json?t=${new Date().getTime()}`)
      .then((res) => {
        if (!res.ok) throw new Error("배경지식 데이터를 불러오지 못했습니다.");
        return res.json();
      })
      .then((data) => {
        setKnowledgeData(data);
        setIsKnowledgeLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load background knowledge:", err);
        setIsKnowledgeLoading(false);
      });
  }, []);

  // Pre-load SpeechSynthesis voices for PC/Chrome
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || document["webkitFullscreenElement"]));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("msfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Reset shuffle when cart length changes after initial mount
  const prevCartLengthRef = useRef(cart.length);
  useEffect(() => {
    if (prevCartLengthRef.current !== cart.length) {
      setIsCartShuffled(false);
      setShuffledCartIndices([]);
      prevCartLengthRef.current = cart.length;
    }
  }, [cart.length]);

  // Persist shuffle state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("leet_isCartShuffled", JSON.stringify(isCartShuffled));
      localStorage.setItem("leet_shuffledCartIndices", JSON.stringify(shuffledCartIndices));
    } catch (e) {
      console.error(e);
    }
  }, [isCartShuffled, shuffledCartIndices]);

  // Synchronize dragStartKey with ref for scroll locking
  useEffect(() => {
    dragStartKeyRef.current = dragStartKey;
  }, [dragStartKey]);

  // Touch scroll lock using a permanent non-passive touchmove event listener
  useEffect(() => {
    const handlePreventScroll = (e) => {
      if (dragStartKeyRef.current) {
        e.preventDefault();
      }
    };

    window.addEventListener('touchmove', handlePreventScroll, { passive: false });

    return () => {
      window.removeEventListener('touchmove', handlePreventScroll);
    };
  }, []);

  // Persist session states in localStorage
  useEffect(() => {
    localStorage.setItem("leet_selectedSources", JSON.stringify(selectedSources));
  }, [selectedSources]);

  useEffect(() => {
    const lightCart = reasoningCart.map(item => ({
      year: item.year,
      number: item.number,
      subject: "추리논증",
      passage_id: item.passage_id
    }));
    localStorage.setItem("leet_cart", JSON.stringify(lightCart));
  }, [reasoningCart]);

  useEffect(() => {
    localStorage.setItem("leet_isSingleView", JSON.stringify(reasoningIsSingleView));
  }, [reasoningIsSingleView]);

  useEffect(() => {
    localStorage.setItem("leet_singleViewIndex", reasoningSingleViewIndex.toString());
  }, [reasoningSingleViewIndex]);

  useEffect(() => {
    localStorage.setItem("leet_singleViewType", reasoningSingleViewType);
  }, [reasoningSingleViewType]);

  useEffect(() => {
    const lightCart = verbalCart.map(item => ({
      year: item.year,
      number: item.number,
      subject: "언어이해",
      passage_id: item.passage_id
    }));
    localStorage.setItem("leet_verbal_cart", JSON.stringify(lightCart));
  }, [verbalCart]);

  useEffect(() => {
    localStorage.setItem("leet_verbal_isSingleView", JSON.stringify(verbalIsSingleView));
  }, [verbalIsSingleView]);

  useEffect(() => {
    localStorage.setItem("leet_verbal_singleViewIndex", verbalSingleViewIndex.toString());
  }, [verbalSingleViewIndex]);

  useEffect(() => {
    localStorage.setItem("leet_verbal_singleViewType", verbalSingleViewType);
  }, [verbalSingleViewType]);

  useEffect(() => {
    localStorage.setItem("leet_problem_bookmark_lists", JSON.stringify(problemBookmarkLists));
  }, [problemBookmarkLists]);

  useEffect(() => {
    localStorage.setItem("leet_activeTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("leet_selectedCategory", selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    localStorage.setItem("leet_activeConceptId", activeConceptId);
  }, [activeConceptId]);


  const toggleFullscreen = () => {
    const docEl = document.documentElement;
    const docAny = document as any;
    const docElAny = docEl as any;
    if (!document.fullscreenElement && !docAny.webkitFullscreenElement) {
      const requestFS = docEl.requestFullscreen || docElAny.webkitRequestFullscreen || docElAny.msRequestFullscreen;
      if (requestFS) {
        requestFS.call(docEl).catch((err: any) => {
          console.error(`전체화면 진입 에러: ${err.message}`);
        });
      }
    } else {
      const exitFS = document.exitFullscreen || docAny.webkitExitFullscreen || docAny.msExitFullscreen;
      if (exitFS) {
        exitFS.call(document);
      }
    }
  };

  // Apply CSS theme class
  useEffect(() => {
    document.body.classList.toggle("light-theme", theme === "light");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const loadOfficialEdits = () => {
    try {
      const saved = localStorage.getItem("leet_official_edits");
      setOfficialEdits(saved ? JSON.parse(saved) : {});
    } catch {
      setOfficialEdits({});
    }
  };

  useEffect(() => {
    loadOfficialEdits();
    loadUserData();
    loadSavedWorkbooks();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadSavedWorkbooks();
    }
  }, [activeTab, currentUser]);

  useEffect(() => {
    const subject = isVerbal ? "언어이해" : "추리논증";
    if (examTitle && examTitle.trim()) {
      document.title = `${examTitle} - LEET ${subject}`;
    } else {
      document.title = `LEET ${subject} 기출문제 조합기`;
    }
  }, [isVerbal, examTitle]);

  useEffect(() => {
    if (examTitle === "나만의 추리논증 기출 모음집" || examTitle === "나만의 언어이해 기출 모음집") {
      setExamTitle(isVerbal ? "나만의 언어이해 기출 모음집" : "나만의 추리논증 기출 모음집");
    }
  }, [isVerbal]);

  const loadBookmarkLists = () => {
    try {
      const saved = localStorage.getItem("leet_bookmark_lists");
      const parsed = saved ? JSON.parse(saved) : [];
      const normalized = parsed.map((l: any) => {
        const ids = l.concept_ids || l.concepts || [];
        return { ...l, concepts: ids, concept_ids: ids };
      });
      setBookmarkLists(normalized);
    } catch {
      setBookmarkLists([]);
    }
  };

  const loadProblemBookmarkLists = () => {
    try {
      const saved = localStorage.getItem("leet_problem_bookmark_lists");
      setProblemBookmarkLists(saved ? JSON.parse(saved) : []);
    } catch {
      setProblemBookmarkLists([]);
    }
  };

  // Fetch local data on load
  const loadUserData = () => {
    try {
      const savedNotes = localStorage.getItem("leet_notes");
      setNotes(savedNotes ? JSON.parse(savedNotes) : {});

      const savedSolved = localStorage.getItem("leet_solved");
      setSolvedRecords(savedSolved ? JSON.parse(savedSolved) : {});

      const savedGen = localStorage.getItem("leet_generated_problems");
      setGeneratedProblems(savedGen ? JSON.parse(savedGen) : []);

      const savedCompleted = localStorage.getItem("leet_completed_concepts");
      setCompletedConceptIds(savedCompleted ? JSON.parse(savedCompleted) : []);

      loadBookmarkLists();
      loadProblemBookmarkLists();
    } catch (e) {
      console.error("Failed loading local user data:", e);
    }
  };

  useEffect(() => {
    loadProblemBookmarkLists();
  }, [activeTab]);

  const toggleConceptCompleted = (conceptId) => {
    setCompletedConceptIds(prev => {
      const next = prev.includes(conceptId) ? prev.filter(id => id !== conceptId) : [...prev, conceptId];
      localStorage.setItem("leet_completed_concepts", JSON.stringify(next));
      return next;
    });
  };


  // Load Exam JSON data dynamically & MERGE multi-year selections
  useEffect(() => {
    let sourcesToLoad = [...selectedSources];
    if (selectedProblemBookmarkListId) {
      const activeFolder = problemBookmarkLists.find(l => l.id === selectedProblemBookmarkListId);
      if (activeFolder) {
        activeFolder.problems.forEach(bp => {
          if (bp.year !== "생성된 문제") {
            const bpYearNum = bp.year ? bp.year.toString().replace(/[^0-9]/g, "") : "";
            const isVerbalBp = bp.year ? (bp.year.toString().includes("언어이해") || bp.subject === "언어이해" || bp.year.toString().includes("verbal")) : false;
            const matchSrc = EXAM_SOURCES.find(src => {
              const baseFile = src.file.replace(".json", "");
              const isVerbalSrc = baseFile.endsWith("_verbal");
              const srcYearNum = baseFile.replace("_verbal", "");
              return srcYearNum === bpYearNum && isVerbalSrc === isVerbalBp;
            });
            if (matchSrc && !sourcesToLoad.some(s => s.id === matchSrc.id)) {
              sourcesToLoad.push(matchSrc);
            }
          } else {
            // Ensure generated problems is also in sourcesToLoad
            if (!sourcesToLoad.some(s => s.file === "generated")) {
              sourcesToLoad.push({ id: "생성된문제", name: "AI 생성 문제", file: "generated" });
            }
          }
        });
      }
    }

    if (sourcesToLoad.length === 0) {
      setExamData({ year: "선택 없음", problems: [] });
      return;
    }
    
    setIsLoading(true);
    setLoadError(null);
    
    // Fetch all selected actual JSON sources
    const realSources = sourcesToLoad.filter(src => src.file !== "generated");
    const fetchPromises = realSources.map((src) =>
      fetch(`./data/${src.file}?t=${new Date().getTime()}`).then((res) => {
        if (!res.ok) {
          throw new Error(`파일을 불러오지 못했습니다. (${src.file})`);
        }
        return res.json();
      })
    );
    
    Promise.all(fetchPromises)
      .then((results) => {
        let mergedProblems = [];
        let mergedSets = [];
        results.forEach((res) => {
          const yearTitle = res.year ? res.year.toString() : "";
          const yearNum = yearTitle.replace(/[^0-9]/g, "");
          const isVerbalFile = res.sets && Array.isArray(res.sets);
          
          if (isVerbalFile) {
            // Verbal sets logic
            const processedSets = res.sets.map((s) => {
              const sProblems = s.problems.map((p) => ({
                ...p,
                year: yearTitle,
                subject: "언어이해",
                passage_id: s.passage_id,
                passage: s.passage,
                category_content: s.category_content
              }));
              return {
                ...s,
                year: yearTitle,
                problems: sProblems
              };
            });
            mergedSets = [...mergedSets, ...processedSets];
            
            // Flatten problems for compatibility
            processedSets.forEach((s) => {
              mergedProblems = [...mergedProblems, ...s.problems];
            });
          } else if (res.problems && Array.isArray(res.problems)) {
            // Reasoning problems logic
            const problemsWithYear = res.problems.map((p) => {
              const pKey = getProblemKey({ year: yearTitle, number: p.number, subject: "추리논증" });
              const edit = officialEdits[pKey];
              if (edit) {
                return {
                  ...p,
                  year: yearTitle,
                  subject: "추리논증",
                  question: edit.question,
                  passage: edit.passage,
                  box_content: edit.box_content,
                  options: edit.options,
                  answer: edit.answer
                };
              }
              return {
                ...p,
                year: yearTitle,
                subject: "추리논증",
              };
            });
            mergedProblems = [...mergedProblems, ...problemsWithYear];
          }
        });
        
        // Append user generated problems from state if 'generated' chip is toggled active
        const hasGenerated = sourcesToLoad.some(src => src.file === "generated");
        if (hasGenerated) {
          const formattedGen = generatedProblems.map(p => ({
            ...p,
            year: "생성된 문제"
          }));
          mergedProblems = [...mergedProblems, ...formattedGen];
        }
        
        // Sort: '생성된 문제' -> '2026학년도' -> '2025학년도' descending, then problem number ascending
        mergedProblems.sort((a, b) => {
          if (a.year !== b.year) {
            if (a.year === "생성된 문제") return -1;
            if (b.year === "생성된 문제") return 1;
            return b.year.localeCompare(a.year);
          }
          return a.number - b.number;
        });

        // Sort sets descending by year, and ascending by first problem number in set
        mergedSets.sort((a, b) => {
          if (a.year !== b.year) {
            return b.year.localeCompare(a.year);
          }
          const aFirst = a.problems[0]?.number || 999;
          const bFirst = b.problems[0]?.number || 999;
          return aFirst - bFirst;
        });
        
        setExamData({
          year: selectedSources.map((s) => s.id).join(", "),
          problems: mergedProblems,
          sets: mergedSets
        } as any);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadError(err.message || "문제를 불러오는 도중 오류가 발생했습니다.");
        setIsLoading(false);
      });
  }, [selectedSources, generatedProblems, officialEdits, reasoningCart, verbalCart, isVerbal]);

  // Toggle detail category chip filter
  const toggleDetailCategory = (cat) => {
    if (selectedDetailTypes.includes(cat)) {
      setSelectedDetailTypes(selectedDetailTypes.filter(c => c !== cat));
    } else {
      setSelectedDetailTypes([...selectedDetailTypes, cat]);
    }
  };

  // Filtered problems list
  const getFilteredProblems = () => {
    if (!examData || !examData.problems) return [];
    
    return examData.problems.filter((p) => {
      const probKey = getProblemKey(p);

      const matchSearch = searchQuery
        ? p.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.passage.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.box_content && p.box_content.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (notes[probKey] && notes[probKey].toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
        
      const matchEval = selectedEvals.length > 0 ? selectedEvals.includes(p.category_eval) : true;
      const matchContent = selectedContents.length > 0 ? selectedContents.includes(p.category_content) : true;
      const matchDetail = selectedDetailTypes.length > 0
        ? (p.category_detail_types && p.category_detail_types.some(t => selectedDetailTypes.includes(t)))
        : true;

      const matchWrong = onlyWrong
        ? (solvedRecords[probKey] && solvedRecords[probKey].is_correct === false)
        : true;
        
      const matchStatute = onlyStatute ? p.has_statute === true : true;
        
      const matchFolder = selectedProblemBookmarkListId
        ? (() => {
            const activeFolder = problemBookmarkLists.find(l => l.id === selectedProblemBookmarkListId);
            return activeFolder ? activeFolder.problems.some(bp => bp.year === p.year && bp.number === p.number) : false;
          })()
        : true;
        
      // Match question number filters
      let matchNumber = true;
      const num = Number(p.number);
      if (numberFilterMode === "range") {
        matchNumber = num >= numberFilterStart && num <= numberFilterEnd;
      } else if (numberFilterMode === "specific") {
        const specificNums = parseNumberFilter(numberFilterSpecificText);
        matchNumber = specificNums.length > 0 ? specificNums.includes(num) : true;
      }
        
      return matchSearch && matchEval && matchContent && matchDetail && matchWrong && matchNumber && matchStatute && matchFolder;
    });
  };

  const filteredProblems = getFilteredProblems();
  const problemsToSolve = useMemo(() => {
    if (singleViewType === "cart") {
      const base = cart.map(item => {
        // Find the latest problem data from examData.problems using year and number
        const match = examData.problems.find(
          p => p.year === item.year && p.number === item.number
        );
        if (match) {
          return {
            ...item,
            question: match.question,
            passage: match.passage,
            box_content: match.box_content,
            options: match.options,
            answer: match.answer
          };
        }
        return item;
      });
      if (isCartShuffled && shuffledCartIndices.length === base.length) {
        return shuffledCartIndices.map(idx => base[idx]).filter(Boolean);
      }
      return base;
    }
    return filteredProblems;
  }, [singleViewType, cart, filteredProblems, examData.problems, isCartShuffled, shuffledCartIndices]);

  // Ensure singleViewIndex stays in-bounds when filtered results change
  // Ensure Reasoning singleViewIndex stays in-bounds when filtered results change
  useEffect(() => {
    if (reasoningSingleViewType === "cart") {
      if (reasoningCart.length === 0 && reasoningIsSingleView) {
        setReasoningIsSingleView(false);
        setReasoningSingleViewIndex(0);
      } else if (reasoningSingleViewIndex >= reasoningCart.length && reasoningCart.length > 0) {
        setReasoningSingleViewIndex(Math.max(0, reasoningCart.length - 1));
      }
    } else {
      if (filteredProblems.length === 0 && reasoningIsSingleView) {
        setReasoningIsSingleView(false);
        setReasoningSingleViewIndex(0);
      } else if (reasoningSingleViewIndex >= filteredProblems.length && filteredProblems.length > 0) {
        setReasoningSingleViewIndex(Math.max(0, filteredProblems.length - 1));
      }
    }
  }, [reasoningCart.length, filteredProblems.length, reasoningSingleViewType, reasoningIsSingleView, reasoningSingleViewIndex]);

  // Ensure Verbal singleViewIndex stays in-bounds when filtered results change
  useEffect(() => {
    if (verbalSingleViewType === "cart") {
      if (verbalCart.length === 0 && verbalIsSingleView) {
        setVerbalIsSingleView(false);
        setVerbalSingleViewIndex(0);
      } else if (verbalSingleViewIndex >= verbalCart.length && verbalCart.length > 0) {
        setVerbalSingleViewIndex(Math.max(0, verbalCart.length - 1));
      }
    } else {
      if (filteredProblems.length === 0 && verbalIsSingleView) {
        setVerbalIsSingleView(false);
        setVerbalSingleViewIndex(0);
      } else if (verbalSingleViewIndex >= filteredProblems.length && filteredProblems.length > 0) {
        setVerbalSingleViewIndex(Math.max(0, filteredProblems.length - 1));
      }
    }
  }, [verbalCart.length, filteredProblems.length, verbalSingleViewType, verbalIsSingleView, verbalSingleViewIndex]);


  // Toggle Cart Shuffle Mode
  const toggleCartShuffle = () => {
    if (isCartShuffled) {
      const currentProbIndex = shuffledCartIndices[singleViewIndex];
      const currentProb = cart[currentProbIndex];
      setIsCartShuffled(false);
      setShuffledCartIndices([]);
      if (currentProb) {
        const origIdx = cart.findIndex(p => p.year === currentProb.year && p.number === currentProb.number);
        if (origIdx !== -1) {
          setSingleViewIndex(origIdx);
        }
      }
    } else {
      const len = cart.length;
      if (len === 0) return;
      const indices = Array.from({ length: len }, (_, i) => i);
      for (let i = len - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      const currentProb = cart[singleViewIndex];
      setShuffledCartIndices(indices);
      setIsCartShuffled(true);
      if (currentProb) {
        const newIdx = indices.indexOf(singleViewIndex);
        if (newIdx !== -1) {
          setSingleViewIndex(newIdx);
        }
      } else {
        setSingleViewIndex(0);
      }
    }
  };

  // Add problem to Cart
  const toggleCart = (problem) => {
    const itemInCart = cart.find(
      (c) => c.number === problem.number && c.year === problem.year
    );
    
    if (itemInCart) {
      const newCart = cart.filter((c) => !(c.number === problem.number && c.year === problem.year));
      setCart(newCart);
      if (singleViewType === "cart") {
        if (newCart.length === 0) {
          setIsSingleView(false);
          setSingleViewIndex(0);
        } else if (singleViewIndex >= newCart.length) {
          setSingleViewIndex(newCart.length - 1);
        }
      }
    } else {
      const refItem = {
        year: problem.year,
        number: problem.number,
        subject: problem.subject || (isVerbal ? "언어이해" : "추리논증"),
        passage_id: problem.passage_id
      };
      setCart([...cart, refItem]);
    }
  };

  const clearCart = () => {
    if (window.confirm("카트에 담긴 모든 문제를 비우시겠습니까?")) {
      setCart([]);
      setSingleViewIndex(0);
      if (singleViewType === "cart") {
        setIsSingleView(false);
      }
    }
  };

  const addAllFilteredToCart = () => {
    if (!examData) return;
    const newItems = [];
    filteredProblems.forEach((p) => {
      const alreadyIn = cart.find(
        (c) => c.number === p.number && c.year === p.year
      );
      if (!alreadyIn) {
        newItems.push({
          year: p.year,
          number: p.number,
          subject: p.subject || (isVerbal ? "언어이해" : "추리논증"),
          passage_id: p.passage_id
        });
      }
    });
    
    if (newItems.length > 0) {
      setCart([...cart, ...newItems]);
    }
  };

  // A4 layout measurement compact auto-fitting
  useEffect(() => {
    if (cart.length === 0) {
      setCompactPages({});
      return;
    }

    const timer = setTimeout(() => {
      const pageElements = document.querySelectorAll(".compiled-exam .print-page");
      const newCompactPages = {};

      pageElements.forEach((pageEl, pageIdx) => {
        const problems = pageEl.querySelectorAll(".compiled-problem-item");
        let hasOverflow = false;

        problems.forEach((probEl: any) => {
          if (probEl.offsetHeight > 950) {
            hasOverflow = true;
          }
        });

        if (!hasOverflow && problems.length === 2) {
          const h1 = (problems[0] as HTMLElement).offsetHeight;
          const h2 = (problems[1] as HTMLElement).offsetHeight;
          if (h1 + h2 > 1750) {
            hasOverflow = true;
          }
        }

        newCompactPages[pageIdx] = hasOverflow;
      });

      setCompactPages(newCompactPages);
    }, 150);

    return () => clearTimeout(timer);
  }, [cart, examData]);

  const handlePrint = () => {
    if (!cart || cart.length === 0) {
      alert("장바구니에 담긴 문제가 없습니다.");
      return;
    }
    window.print();
  };

  // Grading interactive options handler
  const handleSelectOption = (prob, optionIdx) => {
    const probKey = getProblemKey(prob);
    const selected = optionIdx + 1;

    setSolvedRecords(prev => {
      const copy = { ...prev };
      if (copy[probKey] && copy[probKey].selected_option === selected) {
        delete copy[probKey];
        setVisibleAnswers(v => {
          const vc = { ...v };
          delete vc[probKey];
          return vc;
        });
      } else {
        const correct = prob.answer === selected;
        copy[probKey] = { selected_option: selected, is_correct: correct };
      }
      localStorage.setItem("leet_solved", JSON.stringify(copy));
      return copy;
    });
  };

  // Memo saving handler
  const handleSaveMemo = (prob, text) => {
    const probKey = getProblemKey(prob);
    setNotes(prev => {
      const next = { ...prev, [probKey]: text };
      localStorage.setItem("leet_notes", JSON.stringify(next));
      return next;
    });
    alert("메모가 저장되었습니다.");
  };

  // Helper functions for custom reference problems
  const handleAddRefProblem = async () => {
    try {
      const res = await fetch(`./data/${refYear}?t=${new Date().getTime()}`);
      if (!res.ok) throw new Error("기출문제를 불러오지 못했습니다.");
      const data = await res.json();
      const found = data.problems.find(p => p.number === parseInt(String(refNumber)));
      if (!found) {
        alert("해당 번호의 문제를 찾을 수 없습니다.");
        return;
      }
      
      const yearNum = refYear.replace(".json", "");
      if (selectedRefProblems.some(p => {
        const pYearNum = p.year ? p.year.toString().replace(/[^0-9]/g, "") : "";
        return pYearNum === yearNum && p.number === found.number;
      })) {
        alert("이미 추가된 참고 문제입니다.");
        return;
      }
      
      const pKey = `${yearNum}-${found.number}`;
      const edit = officialEdits[pKey];
      const finalProb = edit ? {
        ...found,
        year: data.year,
        question: edit.question,
        passage: edit.passage,
        box_content: edit.box_content,
        options: edit.options,
        answer: edit.answer
      } : {
        ...found,
        year: data.year
      };

      setSelectedRefProblems(prev => [...prev, finalProb]);
    } catch (err) {
      console.error(err);
      alert("참고 문제를 추가하는 중 에러가 발생했습니다.");
    }
  };

  const handleRemoveRefProblem = (index) => {
    setSelectedRefProblems(prev => prev.filter((_, idx) => idx !== index));
  };

  // AI-based Problem generator (uses ChatGPT/GPT-4o)
  const handleGenerateAIProblem = async () => {
    if (!openaiApiKey) {
      alert("ChatGPT (OpenAI) API 키가 설정되지 않았습니다. 사이드바 하단에서 API 설정을 먼저 완료해 주세요.");
      setIsApiKeyOpen(true);
      return;
    }

    setIsGenerating(true);

    // Build Few-shot examples
    let fewShotExamples = "";
    if (selectedRefProblems.length > 0) {
      fewShotExamples = selectedRefProblems.map((p, idx) => {
        return `[기출 예시 ${idx + 1}]
연도: ${p.year}
문항 번호: 문 ${p.number}
질문 발문: ${p.question}
${p.passage ? `지문:\n${p.passage}\n` : ""}
${p.box_content ? `<보 기>:\n${p.box_content}\n` : ""}
선지:
${p.options.join("\n")}
정답: ${p.answer}번
출제 함정 유형: ${p.trap_category || ""}
함정 주의 키워드: ${(p.trap_keywords || []).join(", ")}
`;
      }).join("\n\n");
    } else {
      const matchingProbs = examData.problems.filter(p => 
        p.year !== "생성된 문제" && 
        p.category_detail_types && 
        p.category_detail_types.includes(genCategory)
      );

      fewShotExamples = matchingProbs.slice(0, 2).map((p, idx) => {
        return `[기출 예시 ${idx + 1}]
연도: ${p.year}
문항 번호: 문 ${p.number}
질문 발문: ${p.question}
${p.passage ? `지문:\n${p.passage}\n` : ""}
${p.box_content ? `<보 기>:\n${p.box_content}\n` : ""}
선지:
${p.options.join("\n")}
정답: ${p.answer}번
출제 함정 유형: ${p.trap_category || ""}
함정 주의 키워드: ${(p.trap_keywords || []).join(", ")}
`;
      }).join("\n\n");
    }

    const systemPrompt = `당신은 대한민국 최고 수준의 로스쿨 입시 시험인 LEET(법학적성시험) 추리논증 수석 출제위원입니다. 
다음 지침에 부합하며 수험생들이 걸려 넘어지기 쉬운 엄밀한 논리를 포함하는 고난도 신규 문항을 한국어로 단 하나만 출제해주십시오.

[지문 출제 지침]
1. 단순한 상식 수준이 아니라, 인문학, 사회학, 자연과학기술, 법규 조항 등 논쟁적이거나 정밀한 원리를 담은 지문을 만드십시오.
2. 기출문제를 참고하여 논리적으로 매우 엄밀한 문장 체계를 갖춰주십시오.
3. 보기(<보 기>)가 포함되는 경우, 보기 내 ㄱ, ㄴ, ㄷ 선택지가 완벽한 연역적 추론을 요구해야 합니다.
4. 오답 선지는 '반대해석의 남용', '필요조건과 충분조건의 혼동', '단서 조항 간과' 등의 전형적인 LEET적 오류 요소를 의도적으로 반영해 수험생을 유도해야 합니다.

출제할 세부 카테고리: ${genCategory}
${genPrompt ? `학생의 추가 요구사항: ${genPrompt}` : ""}

${fewShotExamples ? `[참고용 기존 기출 예시]\n${fewShotExamples}` : ""}

형식:
반드시 다음 JSON Schema에 완벽히 매칭되는 하나의 JSON 객체만을 반환하십시오. 백틱(\`\`\`json) 기호 등 추가 텍스트를 절대로 덧붙이지 말고 순수한 JSON 텍스트만 출력하십시오:
{
  "year": "생성된 문제",
  "number": 1,
  "question": "문제의 발문 (예: 다음 글로부터 추론한 것으로 옳은 것만을 <보기>에서 있는 대로 고른 것은?)",
  "passage": "지문 전체 텍스트 (줄바꿈 기호는 \\n)",
  "has_box": true,
  "box_content": "ㄱ. ...\\nㄴ. ...\\nㄷ. ...",
  "options": [
    "① ㄱ",
    "② ㄷ",
    "③ ㄱ, ㄴ",
    "④ ㄴ, ㄷ",
    "⑤ ㄱ, ㄴ, ㄷ"
  ],
  "category_eval": "분석 및 재구성, 추론, 논증 평가 중 택1",
  "category_content": "법학·규범, 인문학, 사회과학, 자연과학·기술, 논리학·수학 중 택1",
  "subcategory": "세부 소재 (예: 개념 적용, 법률 해석 등)",
  "keywords": ["키워드1", "키워드2"],
  "category_detail_types": ["${genCategory}"],
  "trap_category": "핵심 함정 요소 (예: '단서조항 간과')",
  "trap_keywords": ["세부 함정 방지 팁 1", "세부 함정 방지 팁 2"],
  "answer": 3
}`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: systemPrompt
            }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) throw new Error("OpenAI API 호출 중 서버 에러가 발생했습니다.");
      const jsonRes = await response.json();
      const rawText = jsonRes.choices[0].message.content;
      const cleanJson = JSON.parse(rawText.trim());

      const confirmed = window.confirm(`[문제 생성 완료]\n발문: ${cleanJson.question}\n\n이 문제를 로컬 보관소에 저장하시겠습니까?`);
      if (confirmed) {
        const newProb = {
          ...cleanJson,
          id: Date.now().toString()
        };
        setGeneratedProblems(prev => {
          const next = [...prev, newProb];
          localStorage.setItem("leet_generated_problems", JSON.stringify(next));
          return next;
        });
        alert("생성된 문제가 보관소에 성공적으로 저장되었습니다.");
        setIsGeneratorOpen(false);
        setGenPrompt("");
        setSelectedRefProblems([]);
      }
    } catch (err) {
      console.error(err);
      alert("문제 생성에 실패했습니다: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete generated problem
  const handleDeleteGenerated = (probId) => {
    if (window.confirm("생성된 이 문제를 정말로 삭제하시겠습니까?")) {
      setGeneratedProblems(prev => {
        const next = prev.filter(p => p.id !== probId);
        localStorage.setItem("leet_generated_problems", JSON.stringify(next));
        return next;
      });
      alert("삭제 완료되었습니다.");
    }
  };

  // Edit generated problem submit
  const handleEditGeneratedSubmit = () => {
    if (!editProblem) return;

    const isGenerated = editProblem.year === "생성된 문제";

    if (isGenerated) {
      setGeneratedProblems(prev => {
        const next = prev.map(p => p.id === editProblem.id ? editProblem : p);
        localStorage.setItem("leet_generated_problems", JSON.stringify(next));
        return next;
      });
      alert("수정 완료되었습니다.");
      setIsEditModalOpen(false);
      setEditProblem(null);
    } else {
      const pKey = getProblemKey(editProblem);
      setOfficialEdits(prev => {
        const next = { ...prev, [pKey]: editProblem };
        localStorage.setItem("leet_official_edits", JSON.stringify(next));
        return next;
      });
      alert("공식 기출문제가 성공적으로 수정되었습니다.");
      setIsEditModalOpen(false);
      setEditProblem(null);
    }
  };

  // AI Weakness analysis report generator (uses ChatGPT/GPT-4o)
  const handleGenerateWeaknessReport = async () => {
    if (!openaiApiKey) {
      alert("ChatGPT (OpenAI) API 키가 입력되지 않았습니다. API 설정을 먼저 마쳐주세요.");
      setIsApiKeyOpen(true);
      return;
    }

    const wrongKeys = Object.keys(solvedRecords).filter(k => solvedRecords[k].is_correct === false);
    if (wrongKeys.length === 0) {
      alert("오답(틀린 기록)으로 저장된 문항이 없습니다. 대시보드에서 문제를 채점한 뒤 분석을 요청해 주세요.");
      return;
    }

    setIsAnalyzing(true);

    const wrongProblemsText = wrongKeys.map((key) => {
      const match = examData.problems.find(p => `${p.year}-${p.number}` === key);
      if (!match) return `[오답 문항 키: ${key}] 정보 없음`;
      
      const userNotesText = notes[key] ? `\n- 학생이 작성한 오답 메모: ${notes[key]}` : "";
      return `- 연도/출처: ${match.year}, ${match.number}번
  - 발문: ${match.question}
  - 유형: ${match.category_eval} / ${match.category_content}
  - 다중 카테고리: ${(match.category_detail_types || []).join(", ")}
  - 출제 함정: ${match.trap_category || "분석되지 않음"}
  - 함정 방지 조언: ${(match.trap_keywords || []).join(", ")}${userNotesText}`;
    }).join("\n\n");

    const systemPrompt = `당신은 대한민국 대표적인 로스쿨 진학 적성시험(LEET 추리논증) 학원의 대표 강사이자 인지적 평가 전문가입니다.
학생이 풀어서 틀린 오답 세트와 직접 적은 학습 메모를 토대로 강점과 약점을 해부하여 취약 부문 극복을 위한 분석 리포트를 작성해 주십시오.

[학생의 오답 이력 및 메모]
${wrongProblemsText}

[학생의 추가 분석 요구사항]
${weaknessPrompt}

작성 양식:
반드시 마크다운(Markdown) 문법을 준수하여 가독성 있게 한국어로 다음 제목들을 포함하여 심층적으로 작성하십시오:
### 1. 오답 분포에 나타난 인지적 취약점 해부
### 2. 주로 걸려 넘어지는 출제 함정(Trap) 유형 분석
### 3. 실수를 극복하고 독해력을 보강하기 위한 단기 실천 플랜
### 4. 수험생을 위한 행동 지침 및 극복 다짐`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: systemPrompt
            }
          ]
        })
      });

      if (!response.ok) throw new Error("OpenAI API 서버 응답 실패");
      const jsonRes = await response.json();
      setWeaknessReport(jsonRes.choices[0].message.content);
    } catch (err) {
      console.error(err);
      alert("약점 리포트 생성에 실패했습니다: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadSavedWorkbooks = () => {
    try {
      const saved = localStorage.getItem("leet_saved_workbooks");
      setSavedWorkbooks(saved ? JSON.parse(saved) : []);
    } catch {
      setSavedWorkbooks([]);
    }
  };

  const handleAuthSubmit = () => {
    setAuthError("");
    if (!authUsername) {
      setAuthError("사용자 이름을 입력해 주세요.");
      return;
    }
    setCurrentUser(authUsername);
    localStorage.setItem("leet_user", authUsername);
    setIsAuthOpen(false);
    alert(`${authUsername}님으로 프로필이 설정되었습니다.`);
  };

  // 1) Navigate to Problem from Background Knowledge Link
  const handleNavigateToProblem = (problemKey) => {
    if (!problemKey) return;
    const [year, numStr] = problemKey.split("-");
    const num = parseInt(numStr);
    
    // Find problem index in examData.problems
    const idx = examData.problems.findIndex(p => p.year && p.year.toString().replace(/[^0-9]/g, "") === year && p.number === num);
    if (idx !== -1) {
      setSingleViewIndex(idx);
      setSingleViewType("official");
      setIsSingleView(true);
    } else {
      // Look in generatedProblems
      const genIdx = generatedProblems.findIndex(p => p.year === year && p.number === num);
      if (genIdx !== -1) {
        setSingleViewIndex(genIdx);
        setSingleViewType("generated");
        setIsSingleView(true);
      } else {
        alert("해당 기출문제를 대시보드 데이터에서 찾을 수 없습니다.");
      }
    }
  };

  // 2) Local Algorithmic Background Knowledge Quiz (Offline & Instant)
  const handleGenerateQuiz = (concept) => {
    setQuizState({ loading: true, question: "", options: [], answer: 0, explanation: "", selectedAnswer: null });

    const distractorsCount = 3;
    const otherConcepts = knowledgeData.filter(c => c.id !== concept.id);
    
    // Shuffle helper
    const shuffleArray = (array) => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    // Get 3 random distractors
    const randomDistractors = shuffleArray(otherConcepts).slice(0, distractorsCount);

    const isModeA = Math.random() < 0.5; // 50% chance for Mode A or Mode B
    let question = "";
    let options = [];
    let correctAnswer = "";
    let explanation = "";

    if (isModeA) {
      question = `다음 중 '${concept.title}'에 대한 올바른 학술적 정의(설명)는 무엇일까요?`;
      options = [
        concept.definition,
        ...randomDistractors.map(d => d.definition)
      ];
      correctAnswer = concept.definition;
      explanation = `'${concept.title}'의 올바른 학술 정의는 다음과 같습니다.\n\n📚 정의: ${concept.definition}\n\n💡 예시: ${concept.example || "기재된 예시가 없습니다."}\n\n🎯 LEET 출제 맥락: ${concept.leet_context || "기재된 출제 맥락이 없습니다."}`;
    } else {
      // Mask occurrences of the concept title in the definition to prevent giving away the answer
      let maskedDef = concept.definition;
      const titleEscaped = concept.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(titleEscaped, 'g');
      maskedDef = maskedDef.replace(regex, '「 ○○○○ 」');
      
      question = `다음 학술적 정의가 설명하는 올바른 개념명은 무엇일까요?\n\n"${maskedDef}"`;
      options = [
        concept.title,
        ...randomDistractors.map(d => d.title)
      ];
      correctAnswer = concept.title;
      explanation = `설명이 가리키는 학술 개념은 바로 '${concept.title}'입니다.\n\n📚 정의: ${concept.definition}\n\n💡 예시: ${concept.example || "기재된 예시가 없습니다."}\n\n🎯 LEET 출제 맥락: ${concept.leet_context || "기재된 출제 맥락이 없습니다."}`;
    }

    // Shuffle options and find index of the correct answer
    const shuffledOptions = shuffleArray(options);
    const answerIndex = shuffledOptions.indexOf(correctAnswer);

    setQuizState({
      loading: false,
      question: question,
      options: shuffledOptions,
      answer: answerIndex,
      explanation: explanation,
      selectedAnswer: null
    });
  };

  const handleSelectQuizOption = (optionIdx) => {
    if (quizState) {
      setQuizState(prev => ({ ...prev, selectedAnswer: optionIdx }));
    }
  };

  // 3) AI-based Podcast Generator
  const handleGeneratePodcast = async (conceptsInput) => {
    if (!openaiApiKey) {
      alert("팟캐스트 대본 생성을 위해 사이드바 하단에서 OpenAI API 키를 먼저 설정해 주세요.");
      setIsApiKeyOpen(true);
      return;
    }
    setPodcastState({ loading: true, script: [], playing: false, currentIdx: 0 });

    const isArray = Array.isArray(conceptsInput);
    const concepts = isArray ? conceptsInput : [conceptsInput];
    
    let subjectText = "";
    if (isArray) {
      const titles = concepts.map(c => c.title).join(", ");
      const details = concepts.map(c => `- ${c.title} (${c.english_title || ''}): ${c.definition}`).join("\n");
      subjectText = `multiple related concepts: ${titles}. Below are their details:\n${details}\n\nPlease explain these concepts and discuss how they relate, connect, or conflict with each other.`;
    } else {
      const c = concepts[0];
      subjectText = `the following concept:\nConcept: ${c.title} (${c.english_title || ''})\nDefinition: ${c.definition}\nLEET Context: ${c.leet_context || ''}`;
    }

    const systemPrompt = `You are an expert academic podcast producer.
Generate a dynamic, engaging dialogue (podcast script) in Korean explaining ${subjectText}

The dialogue should be between:
1. "민우" (A curious student/host who asks smart questions and represents the listener's perspective)
2. "지혜 교수" (An expert academic who explains the concepts using clear real-world analogies, legal context, and intellectual depth)

Generate a script with 10-14 lines of dialogue. It must be easy to understand but highly informative for LEET preparation.
Your output MUST be a JSON object with a single "script" array matching this schema:
{
  "script": [
    { "speaker": "민우", "text": "첫 번째 대사" },
    { "speaker": "지혜 교수", "text": "두 번째 대사" },
    ...
  ]
}`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "system", content: systemPrompt }],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) throw new Error("API call failed");
      const jsonRes = await response.json();
      const rawText = jsonRes.choices[0].message.content;
      const data = JSON.parse(rawText.trim());
      setPodcastState({
        loading: false,
        script: data.script || [],
        playing: false,
        currentIdx: 0
      });
    } catch (err) {
      console.error(err);
      alert("팟캐스트 대본을 생성하는 도중 오류가 발생했습니다.");
      setPodcastState(null);
    }
  };

  const handlePlayPodcast = () => {
    if (!podcastState || podcastState.script.length === 0) return;
    
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("이 브라우저/기기는 음성 합성(TTS) 기능을 지원하지 않습니다. Chrome, Safari 등의 최신 브라우저를 이용해 주세요.");
      return;
    }

    window.speechSynthesis.cancel();
    setPodcastState(prev => ({ ...prev, playing: true }));
    
    const speakLine = (idx) => {
      if (idx >= podcastState.script.length) {
        setPodcastState(prev => ({ ...prev, playing: false, currentIdx: 0 }));
        return;
      }
      
      setPodcastState(prev => ({ ...prev, currentIdx: idx }));
      
      const line = podcastState.script[idx];
      const utterance = new SpeechSynthesisUtterance(line.text);
      utterance.lang = "ko-KR"; // Force Korean locale to prevent speech errors on PC
      
      const voices = window.speechSynthesis.getVoices() || [];
      if (line.speaker === "민우") {
        const maleVoice = voices.find(v => v.lang.startsWith("ko") && (v.name.includes("Minho") || v.name.includes("Google 한국어") || v.name.includes("male") || v.name.includes("남성")));
        if (maleVoice) utterance.voice = maleVoice;
        utterance.rate = 1.05;
        utterance.pitch = 0.95;
      } else {
        const femaleVoice = voices.find(v => v.lang.startsWith("ko") && (v.name.includes("Suri") || v.name.includes("Google") || v.name.includes("female") || v.name.includes("여성")));
        if (femaleVoice) utterance.voice = femaleVoice;
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
      }
      
      utterance.onend = () => {
        setPodcastState(prev => {
          if (!prev.playing) return prev;
          const nextIdx = prev.currentIdx + 1;
          setTimeout(() => speakLine(nextIdx), 400);
          return { ...prev, currentIdx: nextIdx };
        });
      };
      
      utterance.onerror = (e) => {
        console.error("SpeechSynthesis error:", e);
        setPodcastState(prev => ({ ...prev, playing: false }));
      };
      
      window.speechSynthesis.speak(utterance);
    };

    speakLine(podcastState.currentIdx);
  };

  const handleStopPodcast = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPodcastState(prev => ({ ...prev, playing: false }));
  };

  // 4) AI-based Debate Arena
  const handleStartDebate = async (concept, userRole) => {
    if (!openaiApiKey) {
      alert("토론 시뮬레이터 구동을 위해 사이드바 하단에서 OpenAI API 키를 먼저 설정해 주세요.");
      setIsApiKeyOpen(true);
      return;
    }
    
    const opponentPersona = `You are a prominent scholar challenging the concept of ${concept.title}. 
If the concept is 'utilitarianism', you are Immanuel Kant defending deontological ethics.
If the concept is 'legal positivism', you are Lon Fuller defending natural law theory.
Generally, take the opposite philosophical or logical stance to ${concept.title} with high intellectual rigor, citing counter-arguments, exceptions, or alternative frameworks.
Write in Korean, using polite but sharp and argumentative academic language. Keep responses concise (under 3 sentences) to maintain a fast-paced debate.`;

    setDebateState({
      loading: true,
      messages: [],
      ended: false,
      feedback: "",
      concept: concept,
      userRole: userRole, // 'pro' (agree with concept) or 'con' (disagree)
      opponentPersona: opponentPersona
    });

    const initPrompt = `The topic of our debate is the validity of the academic concept: "${concept.title}".
The user takes the role of "${userRole === 'pro' ? '옹호자 (Proponent)' : '비판자 (Critic)'}".
You must take the opposite side.
Start the debate by proposing your initial strong stance or a challenging question to the user regarding "${concept.title}". Keep it under 3 sentences, in Korean, polite but logically demanding.`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: opponentPersona },
            { role: "user", content: initPrompt }
          ]
        })
      });

      if (!response.ok) throw new Error("API call failed");
      const jsonRes = await response.json();
      const rawText = jsonRes.choices[0].message.content;
      
      setDebateState(prev => ({
        ...prev,
        loading: false,
        messages: [{ role: "assistant", content: rawText }]
      }));
    } catch (err) {
      console.error(err);
      alert("토론을 시작하는 도중 오류가 발생했습니다.");
      setDebateState(null);
    }
  };

  const handleSendDebateMessage = async (userMessageText) => {
    if (!debateState || !openaiApiKey) return;

    const updatedMessages = [...debateState.messages, { role: "user", content: userMessageText }];
    setDebateState(prev => ({ ...prev, loading: true, messages: updatedMessages }));

    const isEndingTurn = updatedMessages.filter(m => m.role === "user").length >= 3;

    let apiMessages = [
      { role: "system", content: debateState.opponentPersona },
      ...updatedMessages.map(m => ({ role: m.role, content: m.content }))
    ];

    if (isEndingTurn) {
      apiMessages.push({
        role: "user",
        content: `[DEBATE WRAP UP]
We have finished our 3-turn debate. Now, as an objective academic evaluator:
1. Provide a score out of 100 for the user's logical consistency, counter-arguing quality, and understanding of "${debateState.concept.title}".
2. Write a brief feedback report in Korean (4-5 sentences) highlighting their logical strengths, weaknesses, and a tip on how they can improve for LEET reasoning.
Your output MUST be a JSON object with "score" and "report" matching this schema:
{
  "score": 85,
  "report": "Detailed feedback in Korean..."
}`
      });
    } else {
      apiMessages.push({
        role: "user",
        content: "Respond to my argument. Point out any logical flaws or counter with a new sharp point. Keep it under 3 sentences, in Korean, polite and academic."
      });
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: apiMessages,
          response_format: isEndingTurn ? { type: "json_object" } : undefined
        })
      });

      if (!response.ok) throw new Error("API call failed");
      const jsonRes = await response.json();
      const rawText = jsonRes.choices[0].message.content;

      if (isEndingTurn) {
        const data = JSON.parse(rawText.trim());
        setDebateState(prev => ({
          ...prev,
          loading: false,
          ended: true,
          feedback: `[종합 점수: ${data.score}점]\n\n${data.report}`
        }));
      } else {
        setDebateState(prev => ({
          ...prev,
          loading: false,
          messages: [...updatedMessages, { role: "assistant", content: rawText }]
        }));
      }
    } catch (err) {
      console.error(err);
      alert("토론 중 AI 답변을 가져오는 도중 오류가 발생했습니다.");
      setDebateState(prev => ({ ...prev, loading: false }));
    }
  };

  // 5) AI-based LEET Fusion Passage Generator
  const toggleSelectConcept = (conceptId) => {
    setSelectedConceptIds(prev => 
      prev.includes(conceptId) ? prev.filter(id => id !== conceptId) : [...prev, conceptId]
    );
  };

  const handleGenerateFusionPassage = async () => {
    if (selectedConceptIds.length < 2) {
      alert("융합 지문 생성을 위해 최소 2개 이상의 개념을 선택해 주세요.");
      return;
    }
    if (!openaiApiKey) {
      alert("융합 지문 생성을 위해 사이드바 하단에서 OpenAI API 키를 먼저 설정해 주세요.");
      setIsApiKeyOpen(true);
      return;
    }

    const conceptsToUse = knowledgeData.filter(c => selectedConceptIds.includes(c.id));
    const conceptTitles = conceptsToUse.map(c => c.title).join(", ");
    
    setFusionPassageState({ loading: true, passage: "", question: "", options: [], answer: 0, explanation: "", selectedOption: null, correct: false, showExplanation: false });

    const systemPrompt = `You are a high-level test designer for LEET (Legal Education Eligibility Test).
Create a unified academic passage (지문) in Korean by fusing the following concepts: ${conceptTitles}.
The passage must read like a real LEET exam passage (approx. 1000-1200 characters, written in academic, dense, high-register Korean). It should explore the logical connection, tension, or application of these concepts.

Also, design ONE 5-choice multiple choice question (5지선다형 문제) based on the passage to test logical inference or application.
Provide a detailed explanation.

Your output MUST be a JSON object matching this schema:
{
  "passage": "Fused academic passage in Korean...",
  "question": "Question asking for the most logical inference or application of the passage...",
  "options": [
    "① Option 1",
    "② Option 2",
    "③ Option 3",
    "④ Option 4",
    "⑤ Option 5"
  ],
  "answer": 0, 1, 2, 3, or 4 (0-indexed correct answer),
  "explanation": "Detailed explanation of why the correct option is right and other options are wrong."
}`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "system", content: systemPrompt }],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) throw new Error("API call failed");
      const jsonRes = await response.json();
      const rawText = jsonRes.choices[0].message.content;
      const data = JSON.parse(rawText.trim());

      setFusionPassageState({
        loading: false,
        passage: data.passage,
        question: data.question,
        options: data.options,
        answer: data.answer,
        explanation: data.explanation,
        selectedOption: null,
        correct: false,
        showExplanation: false
      });
    } catch (err) {
      console.error(err);
      alert("융합 지문을 생성하는 도중 오류가 발생했습니다.");
      setFusionPassageState(null);
    }
  };

  const handleSelectFusionOption = (optionIdx) => {
    if (fusionPassageState) {
      const isCorrect = optionIdx === fusionPassageState.answer;
      setFusionPassageState(prev => ({
        ...prev,
        selectedOption: optionIdx,
        correct: isCorrect,
        showExplanation: true
      }));
    }
  };

  const createBookmarkList = (name) => {
    const newList = { id: Date.now().toString(), name, concepts: [], concept_ids: [] };
    setBookmarkLists(prev => {
      const next = [...prev, newList];
      localStorage.setItem("leet_bookmark_lists", JSON.stringify(next));
      return next;
    });
    return Promise.resolve(true);
  };

  const deleteBookmarkList = (listId) => {
    setBookmarkLists(prev => {
      const next = prev.filter(l => l.id !== listId);
      localStorage.setItem("leet_bookmark_lists", JSON.stringify(next));
      return next;
    });
    return Promise.resolve(true);
  };

  const toggleBookmarkMember = (listId, conceptId) => {
    setBookmarkLists(prev => {
      const next = prev.map(l => {
        if (l.id === listId) {
          const concepts = l.concept_ids || l.concepts || [];
          const has = concepts.includes(conceptId);
          const nextConcepts = has ? concepts.filter(c => c !== conceptId) : [...concepts, conceptId];
          return { ...l, concepts: nextConcepts, concept_ids: nextConcepts };
        }
        return l;
      });
      localStorage.setItem("leet_bookmark_lists", JSON.stringify(next));
      return next;
    });
    return Promise.resolve(true);
  };

  const createProblemBookmarkList = (name) => {
    const subject = activeTab === "verbal_problems" ? "언어이해" : "추리논증";
    const newList = { id: Date.now().toString(), name, subject, problems: [] };
    setProblemBookmarkLists(prev => {
      const next = [...prev, newList];
      localStorage.setItem("leet_problem_bookmark_lists", JSON.stringify(next));
      return next;
    });
    return Promise.resolve(true);
  };

  const deleteProblemBookmarkList = (listId) => {
    setProblemBookmarkLists(prev => {
      const next = prev.filter(l => l.id !== listId);
      localStorage.setItem("leet_problem_bookmark_lists", JSON.stringify(next));
      return next;
    });
    if (selectedProblemBookmarkListId === listId) {
      setSelectedProblemBookmarkListId(null);
    }
    return Promise.resolve(true);
  };

  const toggleProblemBookmarkMember = (listId, year, number) => {
    setProblemBookmarkLists(prev => {
      const next = prev.map(l => {
        if (l.id === listId) {
          const problems = l.problems || [];
          const has = problems.some(p => String(p.year) === String(year) && String(p.number) === String(number));
          const nextProbs = has
            ? problems.filter(p => !(String(p.year) === String(year) && String(p.number) === String(number)))
            : [...problems, { year, number }];
          return { ...l, problems: nextProbs };
        }
        return l;
      });
      localStorage.setItem("leet_problem_bookmark_lists", JSON.stringify(next));
      return next;
    });
    return Promise.resolve(true);
  };

  return {
    theme, setTheme,
    selectedSources, setSelectedSources,
    examData, setExamData,
    isLoading, setIsLoading,
    loadError, setLoadError,
    currentUser, setCurrentUser,
    isAuthOpen, setIsAuthOpen,
    authMode, setAuthMode,
    authUsername, setAuthUsername,
    authPassword, setAuthPassword,
    authError, setAuthError,
    savedWorkbooks, setSavedWorkbooks,
    notes, setNotes,
    solvedRecords, setSolvedRecords,
    generatedProblems, setGeneratedProblems,
    openaiApiKey, setOpenaiApiKey,
    selectedRefProblems, setSelectedRefProblems,
    refYear, setRefYear,
    refNumber, setRefNumber,
    onlyWrong, setOnlyWrong,
    onlyStatute, setOnlyStatute,
    problemBookmarkLists, setProblemBookmarkLists,
    selectedProblemBookmarkListId, setSelectedProblemBookmarkListId,
    activeProblemBookmarkDropdownKey, setActiveProblemBookmarkDropdownKey,
    activeMemos, setActiveMemos,
    visibleAnswers, setVisibleAnswers,
    visibleHints, setVisibleHints,
    isDrawMode, setIsDrawMode,
    canvasDrawings, setCanvasDrawings,
    brushColor, setBrushColor,
    brushWidth, setBrushWidth,
    brushType, setBrushType,
    singleViewType, setSingleViewType,
    isApiKeyOpen, setIsApiKeyOpen,
    isGeneratorOpen, setIsGeneratorOpen,
    isWeaknessOpen, setIsWeaknessOpen,
    isEditModalOpen, setIsEditModalOpen,
    genCategory, setGenCategory,
    genPrompt, setGenPrompt,
    isGenerating, setIsGenerating,
    editProblem, setEditProblem,
    isAnalyzing, setIsAnalyzing,
    weaknessPrompt, setWeaknessPrompt,
    weaknessReport, setWeaknessReport,
    reasoningCart: resolvedReasoningCart,
    verbalCart: resolvedVerbalCart,

    searchQuery, setSearchQuery,
    selectedEvals, setSelectedEvals,
    selectedContents, setSelectedContents,
    selectedDetailTypes, setSelectedDetailTypes,
    numberFilterMode, setNumberFilterMode,
    numberFilterStart, setNumberFilterStart,
    numberFilterEnd, setNumberFilterEnd,
    numberFilterSpecificText, setNumberFilterSpecificText,
    cart, setCart,
    isSingleView, setIsSingleView,
    singleViewIndex, setSingleViewIndex,
    isCartOpen, setIsCartOpen,
    examTitle, setExamTitle,
    compactPages, setCompactPages,
    isFullscreen, setIsFullscreen,
    selectedOrigImage, setSelectedOrigImage,
    isOrigImageModalOpen, setIsOrigImageModalOpen,
    officialEdits, setOfficialEdits,
    highlightedWords, setHighlightedWords,
    arrows, setArrows,
    dragStartKey, setDragStartKey,
    dragCurrentCoords, setDragCurrentCoords,
    dragTargetKey, setDragTargetKey,
    activeTab, setActiveTab,
    freeNotes, setFreeNotes,
    activeNoteId, setActiveNoteId,
    selectedCategory, setSelectedCategory,
    activeConceptId, setActiveConceptId,
    knowledgeData, setKnowledgeData,
    isKnowledgeLoading, setIsKnowledgeLoading,
    quizState, setQuizState,
    podcastState, setPodcastState,
    debateState, setDebateState,
    selectedConceptIds, setSelectedConceptIds,
    fusionPassageState, setFusionPassageState,
    completedConceptIds, setCompletedConceptIds,
    toggleConceptCompleted,
    bookmarkLists,
    createBookmarkList,
    deleteBookmarkList,
    toggleBookmarkMember,
    createProblemBookmarkList,
    deleteProblemBookmarkList,
    toggleProblemBookmarkMember,
    
    // Handlers & helpers
    toggleFullscreen,
    loadOfficialEdits,
    loadUserData,
    toggleDetailCategory,
    filteredProblems,
    problemsToSolve,
    toggleCart,
    clearCart,
    addAllFilteredToCart,
    handlePrint,
    handleSelectOption,
    handleSaveMemo,
    handleAddRefProblem,
    handleRemoveRefProblem,
    handleGenerateAIProblem,
    handleDeleteGenerated,
    handleEditGeneratedSubmit,
    handleGenerateWeaknessReport,
    loadSavedWorkbooks,
    handleAuthSubmit,
    handleNavigateToProblem,
    handleGenerateQuiz,
    handleSelectQuizOption,
    handleGeneratePodcast,
    handlePlayPodcast,
    handleStopPodcast,
    handleStartDebate,
    handleSendDebateMessage,
    toggleSelectConcept,
    handleGenerateFusionPassage,
    handleSelectFusionOption,
    isCartShuffled,
    toggleCartShuffle,
    isVerbal
  };
}
