import React, { useState, useEffect, useRef } from "react";

export default function TimerViewer({ theme, activeTimerMode }) {
  // State variables
  const [customTotalSec, setCustomTotalSec] = useState(60 * 60); // Default 60 minutes (3600 sec)
  const [realTime, setRealTime] = useState(new Date());

  // Real-time clock updater for current time mode
  useEffect(() => {
    if (activeTimerMode === "current") {
      setRealTime(new Date());
      const interval = setInterval(() => {
        setRealTime(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeTimerMode]);

  // Configs for the modes
  const modeConfigs = {
    language: {
      title: "언어이해 시험 모드",
      badge: "📖 언어이해",
      startSec: 9 * 3600, // 09:00:00
      totalSec: 70 * 60,  // 70 minutes (4200 sec)
      description: "본 시험은 09:00부터 10:10까지 70분간 진행됩니다. 지문당 약 7분 이내의 시간 조율이 핵심입니다."
    },
    reasoning: {
      title: "추리논증 시험 모드",
      badge: "🧩 추리논증",
      startSec: 10 * 3600 + 45 * 60, // 10:45:00
      totalSec: 125 * 60, // 125 minutes (7500 sec)
      description: "본 시험은 10:45부터 12:50까지 125분간 진행됩니다. 문제당 약 3분의 시간 분배를 연습해 보세요."
    },
    full: {
      title: "언어이해 & 추리논증 전체 시험 모드",
      badge: "🏆 전체 모드",
      startSec: 9 * 3600, // 09:00:00
      totalSec: (3 * 3600) + (50 * 60), // 9:00 ~ 12:50 = 230 minutes (13800 sec)
      description: "언어이해 시험, 쉬는 시간(35분), 추리논증 시험을 모두 합쳐 실전과 동일하게 연습하는 모드입니다."
    },
    custom: {
      title: "커스텀 타이머 모드",
      badge: "⏱️ 커스텀",
      startSec: 0, // Starts at 00:00:00
      totalSec: customTotalSec,
      description: "사용자가 지정한 시간 동안 타이머가 흘러갑니다. 직접 목표 시간을 설정하여 훈련하세요."
    },
    stopwatch: {
      title: "스톱워치 모드",
      badge: "⏱️ 스톱워치",
      startSec: 0,
      totalSec: 36000, // up to 10 hours
      description: "0초부터 순차적으로 시간이 흘러갑니다. 구간 기록(Lap) 버튼을 터치하여 문제/지문별 풀이 소요 시간을 기록해 보세요."
    },
    current: {
      title: "현재 시각 모드",
      badge: "⏰ 현재 시각",
      startSec: 0,
      totalSec: 0,
      description: "현재 컴퓨터의 실시간 시스템 시각이 아날로그 및 디지털 시계로 표시됩니다. 시간 목표 설정이나 시작/정지 작동이 필요 없습니다."
    }
  };

  const currentConfig = modeConfigs[activeTimerMode] || modeConfigs.language;

  // State variables
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [clockMode, setClockMode] = useState("digital"); // "digital" or "analog"
  const [showSeconds, setShowSeconds] = useState(false); // Default hidden
  const [showProgress, setShowProgress] = useState(false); // Default hidden
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [laps, setLaps] = useState([]);
  
  // Timer tick ref
  const timerRef = useRef(null);

  // Sync browser fullscreen status
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isBrowserFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isBrowserFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // Screen Wake Lock API to prevent screen sleep while running or in current time mode
  useEffect(() => {
    let wakeLock = null;

    const isCurrent = activeTimerMode === "current";
    const shouldWakeLock = isRunning || isCurrent;

    const requestWakeLock = async () => {
      if ("wakeLock" in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request("screen");
        } catch (err) {
          console.warn("Screen Wake Lock API request failed:", err);
        }
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLock) {
        try {
          await wakeLock.release();
          wakeLock = null;
        } catch (err) {
          console.warn("Screen Wake Lock API release failed:", err);
        }
      }
    };

    if (shouldWakeLock) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    // Re-acquire wake lock if page visibility changes and timer is active
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && shouldWakeLock) {
        await requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      releaseWakeLock();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isRunning, activeTimerMode]);

  const handleEnterFullscreen = () => {
    setIsFullscreen(true);
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen().catch(() => {});
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen().catch(() => {});
    }
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen().catch(() => {});
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen().catch(() => {});
    }
  };

  // Sync state when mode changes
  useEffect(() => {
    setIsRunning(false);
    setTimeElapsed(0);
    setLaps([]);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [activeTimerMode]);

  // Timer runner
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => {
          if (prev >= currentConfig.totalSec) {
            setIsRunning(false);
            clearInterval(timerRef.current);
            return currentConfig.totalSec;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, currentConfig.totalSec]);

  // Start / Stop / Reset handlers
  const handleTogglePlay = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeElapsed(0);
    setLaps([]);
  };

  const handleAddLap = () => {
    setLaps((prev) => {
      const currentElapsed = timeElapsed;
      const previousElapsed = prev.length > 0 ? prev[prev.length - 1].elapsed : 0;
      const lapTime = currentElapsed - previousElapsed;
      return [
        ...prev,
        {
          id: prev.length + 1,
          elapsed: currentElapsed,
          lapTime: lapTime
        }
      ];
    });
  };

  // Time jumps for practice convenience
  const handleTimeJump = (minutes) => {
    setTimeElapsed((prev) => {
      const target = prev + minutes * 60;
      if (target < 0) return 0;
      if (target > currentConfig.totalSec) return currentConfig.totalSec;
      return target;
    });
  };

  // Time calculation helper
  const simTotalSeconds = currentConfig.startSec + timeElapsed;
  const simHours = Math.floor(simTotalSeconds / 3600) % 24;
  const simMinutes = Math.floor((simTotalSeconds % 3600) / 60);
  const simSeconds = simTotalSeconds % 60;

  const isCurrentMode = activeTimerMode === "current";
  const isStopwatchMode = activeTimerMode === "stopwatch";
  const displayHours = isCurrentMode ? realTime.getHours() : simHours;
  const displayMinutes = isCurrentMode ? realTime.getMinutes() : simMinutes;
  const displaySeconds = isCurrentMode ? realTime.getSeconds() : simSeconds;

  // Digital clock padding
  const padZero = (num) => String(num).padStart(2, "0");

  // SVG Analog hand rotation angles
  const secondAngle = displaySeconds * 6; // 360 / 60 = 6 deg
  const minuteAngle = displayMinutes * 6 + displaySeconds * 0.1; // 360 / 60 = 6 deg + fractional
  const hourAngle = (displayHours % 12) * 30 + displayMinutes * 0.5; // 360 / 12 = 30 deg + fractional

  // Remaining time details
  const totalRemaining = (isCurrentMode || isStopwatchMode) ? 0 : Math.max(0, currentConfig.totalSec - timeElapsed);
  const remMinutes = Math.floor(totalRemaining / 60);
  const remSeconds = totalRemaining % 60;
  const progressPercent = (isCurrentMode || isStopwatchMode) ? 0 : Math.min(100, Math.round((timeElapsed / currentConfig.totalSec) * 100));

  // Full Mode Stage Analyzer
  const getFullModeStage = () => {
    if (activeTimerMode !== "full") return null;

    const langEnd = 10 * 3600 + 10 * 60; // 10:10
    const reasStart = 10 * 3600 + 45 * 60; // 10:45
    const reasEnd = 12 * 3600 + 50 * 60; // 12:50

    if (simTotalSeconds < langEnd) {
      const remainingInLang = Math.floor((langEnd - simTotalSeconds) / 60);
      return {
        label: "1교시 언어이해 진행 중 📖",
        subLabel: `종료까지 약 ${remainingInLang}분 남았습니다. (목표: 10:10 퇴실)`,
        stage: "language",
        color: "var(--accent-blue)"
      };
    } else if (simTotalSeconds < reasStart) {
      const remainingInBreak = Math.floor((reasStart - simTotalSeconds) / 60);
      return {
        label: "쉬는 시간 ☕ (추리논증 준비)",
        subLabel: `추리논증 개시까지 ${remainingInBreak}분 남았습니다. (10:45 시작)`,
        stage: "break",
        color: "var(--accent-emerald)"
      };
    } else if (simTotalSeconds < reasEnd) {
      const remainingInReas = Math.floor((reasEnd - simTotalSeconds) / 60);
      return {
        label: "2교시 추리논증 진행 중 🧩",
        subLabel: `시험 종료까지 약 ${remainingInReas}분 남았습니다. (12:50 종료)`,
        stage: "reasoning",
        color: "var(--accent-rose)"
      };
    } else {
      return {
        label: "실전 모의고사 종료 🎉",
        subLabel: "수고하셨습니다! 대시보드 오답노트에서 문항을 복습해 보세요.",
        stage: "ended",
        color: "var(--text-muted)"
      };
    }
  };

  const stageInfo = getFullModeStage();

  return (
    <div className="timer-viewer-outer">
      <style>{`
        .timer-viewer-outer {
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

        .timer-viewer-outer::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: 
            radial-gradient(white, rgba(255,255,255,.12) 1.5px, transparent 30px),
            radial-gradient(white, rgba(255,255,255,.05) 1px, transparent 20px);
          background-size: 400px 400px, 250px 250px;
          background-position: 0 0, 80px 120px;
          opacity: 0.12;
          pointer-events: none;
          z-index: 0;
        }

        body.light-theme .timer-viewer-outer::before {
          background-image: 
            radial-gradient(black, rgba(0,0,0,.04) 1.5px, transparent 30px),
            radial-gradient(black, rgba(0,0,0,.02) 1px, transparent 20px);
          opacity: 0.15;
        }

        .timer-header {
          text-align: center;
          margin-bottom: 2rem;
          z-index: 1;
          max-width: 700px;
        }

        .timer-title {
          font-family: var(--font-title);
          font-size: 2rem;
          font-weight: 800;
          background: linear-gradient(135deg, var(--text-primary) 30%, var(--accent-blue) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }

        .timer-desc {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .timer-main-layout {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 2rem;
          width: 100%;
          max-width: 1000px;
          z-index: 1;
        }

        @media (max-width: 850px) {
          .timer-main-layout {
            grid-template-columns: 1fr;
          }
        }

        .timer-glass-panel {
          background: var(--bg-glass, rgba(255, 255, 255, 0.04));
          border: 1px solid var(--border-glass, rgba(255, 255, 255, 0.08));
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
        }

        body.light-theme .timer-glass-panel {
          background: rgba(255, 255, 255, 0.55);
          box-shadow: var(--card-shadow);
        }

        /* SVG Analog Clock Face Styling */
        .analog-clock-svg {
          width: 260px;
          height: 260px;
          filter: drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3));
        }

        .clock-rim {
          fill: var(--bg-secondary);
          stroke: var(--accent-blue);
          stroke-width: 2.2;
          filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.25));
        }

        body.light-theme .clock-rim {
          fill: #f8fafc;
          stroke: #3b82f6;
          filter: none;
        }

        .clock-ticks {
          stroke: var(--text-muted);
          stroke-width: 0.8;
          opacity: 0.65;
        }

        .clock-ticks-major {
          stroke: var(--text-secondary);
          stroke-width: 1.6;
        }

        .clock-number {
          fill: var(--text-secondary);
          font-family: var(--font-body, system-ui);
          font-size: 13px;
          font-weight: 500;
          text-anchor: middle;
          dominant-baseline: middle;
        }

        .hand-hour-left {
          fill: #737373;
          transition: fill 0.3s ease;
        }

        .hand-hour-right {
          fill: #e5e5e5;
          transition: fill 0.3s ease;
        }

        .hand-minute-left {
          fill: #525252;
          transition: fill 0.3s ease;
        }

        .hand-minute-right {
          fill: #d4d4d4;
          transition: fill 0.3s ease;
        }

        .hand-second {
          stroke: var(--accent-rose);
          stroke-width: 1.2;
          stroke-linecap: round;
        }

        .hand-second-cap {
          fill: var(--accent-rose);
        }

        body.light-theme .hand-hour-left {
          fill: #404040;
        }

        body.light-theme .hand-hour-right {
          fill: #171717;
        }

        body.light-theme .hand-minute-left {
          fill: #525252;
        }

        body.light-theme .hand-minute-right {
          fill: #262626;
        }

        .clock-center-hub {
          fill: #d4d4d4;
          stroke: #737373;
          stroke-width: 1;
        }

        body.light-theme .clock-center-hub {
          fill: #171717;
          stroke: #404040;
        }

        /* Digital Clock display panel */
        .digital-clock-panel {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 1.5rem 2.5rem;
          font-family: monospace;
          font-size: 2.75rem;
          font-weight: 700;
          color: var(--accent-cyan);
          text-shadow: 0 0 15px rgba(6, 182, 212, 0.6);
          letter-spacing: 2px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        body.light-theme .digital-clock-panel {
          background: #0f172a;
          color: #22d3ee;
          text-shadow: none;
        }

        /* View Mode switch toggles */
        .clock-toggle-switch {
          display: flex;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-glass);
          border-radius: 30px;
          padding: 0.25rem;
        }

        .toggle-tab {
          border: none;
          background: transparent;
          color: var(--text-secondary);
          padding: 0.5rem 1.25rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .toggle-tab.active {
          background: var(--accent-blue);
          color: white;
          box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
        }

        /* Status & Stage Banner styling */
        .stage-indicator-banner {
          width: 100%;
          border-radius: 12px;
          padding: 1rem;
          text-align: center;
          animation: pulseBanner 3s infinite alternate;
        }

        @keyframes pulseBanner {
          0% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.05); }
          100% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.15); }
        }

        .stage-label {
          font-size: 1.15rem;
          font-weight: 800;
          margin-bottom: 0.25rem;
        }

        .stage-sublabel {
          font-size: 0.8rem;
          opacity: 0.8;
        }

        /* Progress indicator bar styling */
        .progress-box {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .progress-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .progress-bg-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          overflow: hidden;
          position: relative;
        }

        body.light-theme .progress-bg-bar {
          background: rgba(0, 0, 0, 0.06);
        }

        .progress-fill-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-blue) 0%, var(--accent-cyan) 100%);
          border-radius: 10px;
          transition: width 0.3s ease;
        }

        /* Controller layout */
        .control-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          gap: 1.25rem;
        }

        .main-timer-buttons {
          display: flex;
          gap: 1rem;
          width: 100%;
        }

        .btn-timer-primary {
          flex: 2;
          padding: 0.85rem;
          font-size: 1rem;
          font-weight: 700;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-timer-primary.start {
          background: var(--accent-emerald);
          color: white;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }

        .btn-timer-primary.start:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
        }

        .btn-timer-primary.pause {
          background: var(--accent-rose);
          color: white;
          box-shadow: 0 4px 15px rgba(244, 63, 94, 0.3);
        }

        .btn-timer-primary.pause:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(244, 63, 94, 0.45);
        }

        .btn-timer-secondary {
          flex: 1;
          padding: 0.85rem;
          font-size: 0.9rem;
          font-weight: 700;
          border: 1px solid var(--border-glass);
          background: var(--option-bg, rgba(255,255,255,0.03));
          color: var(--text-secondary);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-timer-secondary:hover {
          background: var(--border-glass);
          color: var(--text-primary);
        }

        .time-jump-container {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
          width: 100%;
        }

        .btn-jump-action {
          padding: 0.5rem 0.25rem;
          border-radius: 6px;
          border: 1px solid var(--border-glass);
          background: rgba(255, 255, 255, 0.02);
          color: var(--text-secondary);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-jump-action:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
          border-color: var(--border-focus);
        }

        /* Tips layout */
        .tips-panel-box {
          background: var(--bg-glass, rgba(255, 255, 255, 0.03));
          border: 1px solid var(--border-glass, rgba(255, 255, 255, 0.08));
          border-radius: 20px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        body.light-theme .tips-panel-box {
          background: rgba(255, 255, 255, 0.45);
          box-shadow: var(--card-shadow);
        }

        .tips-header-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border-glass);
          padding-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .tips-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          font-size: 0.85rem;
          line-height: 1.6;
          color: var(--text-secondary);
        }

        body.light-theme .tips-list {
          color: var(--text-primary);
        }

        .tip-item-bullet {
          display: flex;
          gap: 0.5rem;
          align-items: flex-start;
        }

        .tip-bullet-icon {
          color: var(--accent-blue);
          font-weight: 800;
          flex-shrink: 0;
        }

        /* Fullscreen clock layout */
        .timer-fullscreen-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at 50% 50%, var(--bg-secondary) 0%, var(--bg-primary) 100%);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 2rem 2rem;
          overflow-y: auto;
        }

        body.light-theme .timer-fullscreen-overlay {
          background: radial-gradient(circle at 50% 50%, #f1f5f9 0%, #cbd5e1 100%);
        }

        .fullscreen-top-bar {
          width: 100%;
          max-width: 1000px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-glass);
          padding-bottom: 1rem;
        }

        .fullscreen-badge {
          font-family: var(--font-title);
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .fullscreen-clock-body {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 1rem 0;
          width: 100%;
          gap: min(4rem, 5vw);
          flex-wrap: wrap;
        }

        .analog-clock-svg.fullscreen {
          width: min(720px, 80vw, 70vh);
          height: min(720px, 80vw, 70vh);
        }

        .digital-clock-panel.fullscreen {
          font-size: min(13rem, 20vw, 18vh);
          padding: min(2.5rem, 3vh) min(5rem, 6vw);
          border-radius: 20px;
          box-shadow: 0 0 35px rgba(6, 182, 212, 0.4);
        }

        body.light-theme .digital-clock-panel.fullscreen {
          box-shadow: none;
        }

        .stage-indicator-banner.fullscreen {
          max-width: 800px;
          margin-bottom: 1.5rem;
        }

        .progress-box.fullscreen {
          max-width: 800px;
        }

        .control-panel.fullscreen {
          max-width: 600px;
        }

        .toggle-tab.exit {
          background: var(--accent-rose);
          color: white;
        }

        .toggle-tab.exit:hover {
          background: #e11d48;
        }
      `}</style>

      {isFullscreen && (
        <div className="timer-fullscreen-overlay">
          <div className="fullscreen-top-bar">
            <div className="fullscreen-badge">{currentConfig.badge} - {currentConfig.title}</div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className={`toggle-tab ${clockMode === "digital" ? "active" : ""}`}
                onClick={() => setClockMode("digital")}
              >
                📟 디지털
              </button>
              <button
                className={`toggle-tab ${clockMode === "analog" ? "active" : ""}`}
                onClick={() => setClockMode("analog")}
              >
                🕰️ 아날로그
              </button>
              <button
                className={`toggle-tab ${showSeconds ? "active" : ""}`}
                onClick={() => setShowSeconds(!showSeconds)}
              >
                {showSeconds ? "⏱️ 초 숨기기" : "⏱️ 초 보이기"}
              </button>
              <button
                className={`toggle-tab ${showProgress ? "active" : ""}`}
                onClick={() => setShowProgress(!showProgress)}
              >
                {showProgress ? "📊 진행률 숨기기" : "📊 진행률 보이기"}
              </button>
              <button className="toggle-tab exit" onClick={handleExitFullscreen}>
                🚪 전체화면 종료 (Esc)
              </button>
            </div>
          </div>

          {/* Timer controls (Moved to Top) */}
          {!isCurrentMode ? (
            <div className="control-panel fullscreen" style={{ margin: "1.5rem 0 0.5rem 0" }}>
              <div className="main-timer-buttons">
                <button
                  className={`btn-timer-primary ${isRunning ? "pause" : "start"}`}
                  onClick={handleTogglePlay}
                >
                  {isRunning ? "⏸️ 일시 정지" : "▶️ 타이머 시작"}
                </button>
                {isStopwatchMode && (
                  <button 
                    className="btn-timer-secondary" 
                    onClick={handleAddLap}
                    disabled={!isRunning}
                    style={{ background: "rgba(6, 182, 212, 0.15)", color: "var(--accent-cyan)", border: "1px solid rgba(6, 182, 212, 0.3)" }}
                  >
                    🚩 구간 기록
                  </button>
                )}
                <button className="btn-timer-secondary" onClick={handleReset}>
                  🔄 초기화
                </button>
              </div>
              {!isStopwatchMode && (
                <div className="time-jump-container">
                  <button className="btn-jump-action" onClick={() => handleTimeJump(-10)}>◀ -10분</button>
                  <button className="btn-jump-action" onClick={() => handleTimeJump(-1)}>◀ -1분</button>
                  <button className="btn-jump-action" onClick={() => handleTimeJump(1)}>+1분 ▶</button>
                  <button className="btn-jump-action" onClick={() => handleTimeJump(10)}>+10분 ▶</button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", fontSize: "14px", color: "var(--text-muted)", margin: "1.5rem 0" }}>
              ⏰ 현재 시각 모드가 실행 중입니다. (시작/정지 조작이 필요 없습니다)
            </div>
          )}

          {activeTimerMode === "full" && stageInfo && (
            <div
              className="stage-indicator-banner fullscreen"
              style={{
                background: `rgba(${stageInfo.stage === "break" ? "16,185,129" : stageInfo.stage === "language" ? "59,130,246" : stageInfo.stage === "reasoning" ? "244,63,94" : "100,116,139"}, 0.08)`,
                border: `1px solid ${stageInfo.color}`
              }}
            >
              <div className="stage-label" style={{ color: stageInfo.color }}>
                {stageInfo.label}
              </div>
              <div className="stage-sublabel" style={{ color: "var(--text-secondary)" }}>
                {stageInfo.subLabel}
              </div>
            </div>
          )}

          {/* Remaining countdown / progress bar */}
          {showProgress && !isCurrentMode && (
            <div className="progress-box fullscreen" style={{ width: "100%" }}>
              <div className="progress-meta">
                <span>🕒 남은 시간: {remMinutes}분 {showSeconds ? `${remSeconds}초` : ""}</span>
                <span>{progressPercent}% 완료</span>
              </div>
              <div className="progress-bg-bar">
                <div className="progress-fill-bar" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
          )}

          <div className="fullscreen-clock-body">
            {clockMode === "analog" ? (
              <svg viewBox="0 0 200 200" className="analog-clock-svg fullscreen">
                {/* Outer rim */}
                <circle cx="100" cy="100" r="95" className="clock-rim" />
                
                {/* Center crosshair markers (mock exam style layout) */}
                <line x1="100" y1="12" x2="100" y2="188" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                <line x1="12" y1="100" x2="188" y2="100" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />

                {/* Draw minute ticks (60 ticks) */}
                {Array.from({ length: 60 }).map((_, i) => {
                  const angle = i * 6;
                  const isMajor = i % 5 === 0;
                  const r1 = isMajor ? 82 : 86;
                  const r2 = 90;
                  const rad = (angle * Math.PI) / 180;
                  const x1 = 100 + r1 * Math.sin(rad);
                  const y1 = 100 - r1 * Math.cos(rad);
                  const x2 = 100 + r2 * Math.sin(rad);
                  const y2 = 100 - r2 * Math.cos(rad);

                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      className={isMajor ? "clock-ticks-major" : "clock-ticks"}
                    />
                  );
                })}

                {/* Major hour text markers (12, 3, 6, 9) */}
                <text x="100" y="28" className="clock-number">12</text>
                <text x="174" y="101" className="clock-number">3</text>
                <text x="100" y="174" className="clock-number">6</text>
                <text x="27" y="101" className="clock-number">9</text>

                {/* Hour hand */}
                <g transform={`rotate(${hourAngle}, 100, 100)`}>
                  <polygon points="100,60 97.5,95 98.5,100 100,110 100,60" className="hand-hour-left" />
                  <polygon points="100,60 100,110 101.5,100 102.5,95 100,60" className="hand-hour-right" />
                  <line x1="100" y1="60" x2="100" y2="110" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                </g>

                {/* Minute hand */}
                <g transform={`rotate(${minuteAngle}, 100, 100)`}>
                  <polygon points="100,32 98.2,95 98.8,100 100,112 100,32" className="hand-minute-left" />
                  <polygon points="100,32 100,112 101.2,100 101.8,95 100,32" className="hand-minute-right" />
                  <line x1="100" y1="32" x2="100" y2="112" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                </g>

                {/* Second hand */}
                {showSeconds && (
                  <g transform={`rotate(${secondAngle}, 100, 100)`}>
                    <line x1="100" y1="122" x2="100" y2="20" className="hand-second" />
                    <polygon points="100,110 98,116 100,122 102,116 100,110" className="hand-second-cap" />
                  </g>
                )}

                {/* Center cap / hub */}
                <circle cx="100" cy="100" r="4.5" className="clock-center-hub" />
              </svg>
            ) : (
              /* 2. LED Digital Clock Display */
              <div className="digital-clock-panel fullscreen">
                <span>{padZero(displayHours)}</span>
                <span className="colon-blink">:</span>
                <span>{padZero(displayMinutes)}</span>
                {showSeconds && (
                  <>
                    <span className="colon-blink">:</span>
                    <span>{padZero(displaySeconds)}</span>
                  </>
                )}
              </div>
            )}

            {/* Laps records list (Moved to Side) */}
            {isStopwatchMode && laps.length > 0 && (
              <div className="laps-container fullscreen" style={{
                width: "320px",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border-glass)",
                borderRadius: "12px",
                padding: "1rem",
                boxSizing: "border-box"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--accent-cyan)" }}>⏱️ 구간 기록 (최근 5개)</span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>총 {laps.length}개</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {laps.slice(-5).reverse().map((lap, index) => {
                    const displayIndex = laps.length - index;
                    return (
                      <div key={lap.id} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "6px 12px",
                        background: "rgba(255,255,255,0.01)",
                        border: "1px solid var(--border-glass)",
                        borderRadius: "6px",
                        fontSize: "13px"
                      }}>
                        <span style={{ fontWeight: "600", color: "var(--accent-cyan)" }}>구간 {displayIndex}</span>
                        <span style={{ color: "var(--text-secondary)" }}>
                          +{padZero(Math.floor(lap.lapTime / 60))}:{padZero(lap.lapTime % 60)}
                        </span>
                        <span style={{ fontWeight: "bold", color: "var(--text-primary)" }}>
                          {padZero(Math.floor(lap.elapsed / 3600))}:{padZero(Math.floor((lap.elapsed % 3600) / 60))}:{padZero(lap.elapsed % 60)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="timer-header">
        <h1 className="timer-title">⏰ LEET 실전 시간 감각 훈련</h1>
        <p className="timer-desc">
          실제 기출/모의고사 시간 스케줄에 맞춰 흐르는 시험 타이머 위젯입니다.<br />
          아날로그 시계의 바늘 각도와 남은 시간 한도를 주시하며 논리 배틀 감각을 습득해 보세요.
        </p>
      </div>

      <div className="timer-main-layout">
        {/* Left Side: Clock Display Panel */}
        <div className="timer-glass-panel">
          
          {/* Real-time Toggle for Clock views */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", width: "100%" }}>
            <div className="clock-toggle-switch">
              <button
                className={`toggle-tab ${clockMode === "digital" ? "active" : ""}`}
                onClick={() => setClockMode("digital")}
              >
                📟 디지털 모드
              </button>
              <button
                className={`toggle-tab ${clockMode === "analog" ? "active" : ""}`}
                onClick={() => setClockMode("analog")}
              >
                🕰️ 아날로그 모드
              </button>
            </div>
            
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className={`toggle-tab ${showSeconds ? "active" : ""}`}
                onClick={() => setShowSeconds(!showSeconds)}
                style={{ padding: "0.35rem 0.85rem", fontSize: "0.75rem", borderRadius: "15px" }}
              >
                {showSeconds ? "⏱️ 초 숨기기" : "⏱️ 초 보이기"}
              </button>
              <button
                className={`toggle-tab ${showProgress ? "active" : ""}`}
                onClick={() => setShowProgress(!showProgress)}
                style={{ padding: "0.35rem 0.85rem", fontSize: "0.75rem", borderRadius: "15px" }}
              >
                {showProgress ? "📊 진행률 숨기기" : "📊 진행률 보이기"}
              </button>
              <button
                className="toggle-tab"
                onClick={handleEnterFullscreen}
                style={{ padding: "0.35rem 0.85rem", fontSize: "0.75rem", borderRadius: "15px" }}
              >
                🖥️ 전체화면
              </button>
            </div>
          </div>

          {/* Timer controls (Moved to Top) */}
          {!isCurrentMode ? (
            <div className="control-panel" style={{ width: "100%", maxWidth: "450px" }}>
              <div className="main-timer-buttons">
                <button
                  className={`btn-timer-primary ${isRunning ? "pause" : "start"}`}
                  onClick={handleTogglePlay}
                >
                  {isRunning ? "⏸️ 일시 정지" : "▶️ 타이머 시작"}
                </button>
                {isStopwatchMode && (
                  <button 
                    className="btn-timer-secondary" 
                    onClick={handleAddLap}
                    disabled={!isRunning}
                    style={{ background: "rgba(6, 182, 212, 0.15)", color: "var(--accent-cyan)", border: "1px solid rgba(6, 182, 212, 0.3)" }}
                  >
                    🚩 구간 기록
                  </button>
                )}
                <button className="btn-timer-secondary" onClick={handleReset}>
                  🔄 초기화
                </button>
              </div>

              {/* Time jump buttons for practice control */}
              {!isStopwatchMode && (
                <div className="time-jump-container">
                  <button className="btn-jump-action" onClick={() => handleTimeJump(-10)}>◀ -10분</button>
                  <button className="btn-jump-action" onClick={() => handleTimeJump(-1)}>◀ -1분</button>
                  <button className="btn-jump-action" onClick={() => handleTimeJump(1)}>+1분 ▶</button>
                  <button className="btn-jump-action" onClick={() => handleTimeJump(10)}>+10분 ▶</button>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              textAlign: "center",
              fontSize: "13px",
              color: "var(--text-muted)",
              background: "rgba(255, 255, 255, 0.01)",
              border: "1px solid var(--border-glass)",
              borderRadius: "8px",
              padding: "10px 12px",
              width: "100%",
              maxWidth: "450px",
              boxSizing: "border-box"
            }}>
              ⏰ 현재 시각 모드가 활성화되어 작동 중입니다.
            </div>
          )}

          {/* 1. SVG Analog Clock Face Display */}
          {clockMode === "analog" ? (
            <svg viewBox="0 0 200 200" className="analog-clock-svg">
              {/* Outer rim */}
              <circle cx="100" cy="100" r="95" className="clock-rim" />
              
              {/* Center crosshair markers (mock exam style layout) */}
              <line x1="100" y1="12" x2="100" y2="188" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
              <line x1="12" y1="100" x2="188" y2="100" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />

              {/* Draw minute ticks (60 ticks) */}
              {Array.from({ length: 60 }).map((_, i) => {
                const angle = i * 6;
                const isMajor = i % 5 === 0;
                const r1 = isMajor ? 82 : 86;
                const r2 = 90;
                const rad = (angle * Math.PI) / 180;
                const x1 = 100 + r1 * Math.sin(rad);
                const y1 = 100 - r1 * Math.cos(rad);
                const x2 = 100 + r2 * Math.sin(rad);
                const y2 = 100 - r2 * Math.cos(rad);

                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    className={isMajor ? "clock-ticks-major" : "clock-ticks"}
                  />
                );
              })}

              {/* Major hour text markers (12, 3, 6, 9) */}
              <text x="100" y="28" className="clock-number">12</text>
              <text x="174" y="101" className="clock-number">3</text>
              <text x="100" y="174" className="clock-number">6</text>
              <text x="27" y="101" className="clock-number">9</text>

              {/* Hour hand */}
              <g transform={`rotate(${hourAngle}, 100, 100)`}>
                <polygon points="100,60 97.5,95 98.5,100 100,110 100,60" className="hand-hour-left" />
                <polygon points="100,60 100,110 101.5,100 102.5,95 100,60" className="hand-hour-right" />
                <line x1="100" y1="60" x2="100" y2="110" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
              </g>

              {/* Minute hand */}
              <g transform={`rotate(${minuteAngle}, 100, 100)`}>
                <polygon points="100,32 98.2,95 98.8,100 100,112 100,32" className="hand-minute-left" />
                <polygon points="100,32 100,112 101.2,100 101.8,95 100,32" className="hand-minute-right" />
                <line x1="100" y1="32" x2="100" y2="112" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
              </g>

              {/* Second hand */}
              {showSeconds && (
                <g transform={`rotate(${secondAngle}, 100, 100)`}>
                  <line x1="100" y1="122" x2="100" y2="20" className="hand-second" />
                  <polygon points="100,110 98,116 100,122 102,116 100,110" className="hand-second-cap" />
                </g>
              )}

              {/* Center cap / hub */}
              <circle cx="100" cy="100" r="4.5" className="clock-center-hub" />
            </svg>
          ) : (
            /* 2. LED Digital Clock Display */
            <div className="digital-clock-panel">
              <span>{padZero(displayHours)}</span>
              <span className="colon-blink">:</span>
              <span>{padZero(displayMinutes)}</span>
              {showSeconds && (
                <>
                  <span className="colon-blink">:</span>
                  <span>{padZero(displaySeconds)}</span>
                </>
              )}
            </div>
          )}

          {/* Full Mode Current Stage Indicator Banner */}
          {activeTimerMode === "full" && stageInfo && (
            <div
              className="stage-indicator-banner"
              style={{
                background: `rgba(${stageInfo.stage === "break" ? "16,185,129" : stageInfo.stage === "language" ? "59,130,246" : stageInfo.stage === "reasoning" ? "244,63,94" : "100,116,139"}, 0.08)`,
                border: `1px solid ${stageInfo.color}`
              }}
            >
              <div className="stage-label" style={{ color: stageInfo.color }}>
                {stageInfo.label}
              </div>
              <div className="stage-sublabel" style={{ color: "var(--text-secondary)" }}>
                {stageInfo.subLabel}
              </div>
            </div>
          )}

          {/* Custom Timer setup controls */}
          {activeTimerMode === "custom" && (
            <div className="custom-timer-setup-box" style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border-glass)",
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              <div style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "6px" }}>
                ⏱️ 목표 시간 설정 (최대 300분)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={Math.floor(customTotalSec / 60)}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(300, parseInt(e.target.value) || 1));
                    setCustomTotalSec(val * 60);
                    if (!isRunning) {
                      setTimeElapsed(0);
                    }
                  }}
                  disabled={isRunning}
                  style={{
                    width: "80px",
                    background: "rgba(0, 0, 0, 0.25)",
                    border: "1px solid var(--border-glass)",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    color: "var(--text-primary)",
                    fontSize: "16px",
                    fontWeight: "bold",
                    textAlign: "center",
                    outline: "none"
                  }}
                />
                <span style={{ fontSize: "15px", fontWeight: "500", color: "var(--text-secondary)" }}>분</span>
              </div>

              {/* Preset buttons */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {[3, 7, 10, 30, 50, 70, 90, 120, 125].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      setCustomTotalSec(mins * 60);
                      if (!isRunning) {
                        setTimeElapsed(0);
                      }
                    }}
                    disabled={isRunning}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "500",
                      background: Math.floor(customTotalSec / 60) === mins ? "rgba(59, 130, 246, 0.15)" : "rgba(255, 255, 255, 0.03)",
                      color: Math.floor(customTotalSec / 60) === mins ? "var(--accent-blue)" : "var(--text-secondary)",
                      border: "1px solid " + (Math.floor(customTotalSec / 60) === mins ? "rgba(59, 130, 246, 0.4)" : "var(--border-glass)"),
                      cursor: isRunning ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {mins}분
                  </button>
                ))}
              </div>

              {/* Adjust buttons */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {[-10, -5, -1, 1, 5, 10].map((adj) => (
                  <button
                    key={adj}
                    onClick={() => {
                      const currentMins = Math.floor(customTotalSec / 60);
                      const targetMins = Math.max(1, Math.min(300, currentMins + adj));
                      setCustomTotalSec(targetMins * 60);
                      if (!isRunning) {
                        setTimeElapsed(0);
                      }
                    }}
                    disabled={isRunning}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      background: "rgba(255, 255, 255, 0.02)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-glass)",
                      cursor: isRunning ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {adj > 0 ? `+${adj}` : adj}분
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Remaining countdown / progress bar */}
          {showProgress && !isCurrentMode && (
            <div className="progress-box">
              <div className="progress-meta">
                <span>🕒 남은 시간: {remMinutes}분 {showSeconds ? `${remSeconds}초` : ""}</span>
                <span>{progressPercent}% 완료</span>
              </div>
              <div className="progress-bg-bar">
                <div className="progress-fill-bar" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
          )}

          {/* Bottom spacing */}
          <div style={{ height: "4px" }} />

        </div>

        {/* Right Side: Mode Specifications & Time management tips */}
        <div className="tips-panel-box">
          <div className="tips-header-title">
            <span>💡 {currentConfig.title} 안내</span>
          </div>

          <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
            {currentConfig.description}
          </div>

          <div className="tips-header-title" style={{ marginTop: "1rem" }}>
            <span>{activeTimerMode === "stopwatch" ? "🚩 스톱워치 랩타임(구간) 기록" : "📝 시간 감각(Time Management) 트레이닝 팁"}</span>
          </div>

          <div className="tips-list">
            {activeTimerMode === "stopwatch" ? (
              <div className="laps-container" style={{ width: "100%", boxSizing: "border-box" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>기록된 구간 수: {laps.length}개</span>
                  {laps.length > 0 && (
                    <button 
                      onClick={() => setLaps([])}
                      style={{ background: "transparent", border: "none", color: "var(--accent-rose)", fontSize: "11px", cursor: "pointer", padding: 0 }}
                    >기록 전체 삭제</button>
                  )}
                </div>
                <div className="laps-list-scroll" style={{ maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {laps.length === 0 ? (
                    <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                      🏁 아직 기록된 구간이 없습니다.<br />스톱워치를 작동한 뒤 '구간 기록' 버튼을 눌러보세요.
                    </div>
                  ) : (
                    laps.slice().reverse().map((lap, index) => {
                      const displayIndex = laps.length - index;
                      return (
                        <div key={lap.id} style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 12px",
                          background: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid var(--border-glass)",
                          borderRadius: "6px",
                          fontSize: "13px"
                        }}>
                          <span style={{ fontWeight: "600", color: "var(--accent-cyan)" }}>구간 {displayIndex}</span>
                          <span style={{ color: "var(--text-secondary)" }}>
                            +{padZero(Math.floor(lap.lapTime / 60))}:{padZero(lap.lapTime % 60)}
                          </span>
                          <span style={{ fontWeight: "bold", color: "var(--text-primary)" }}>
                            {padZero(Math.floor(lap.elapsed / 3600))}:{padZero(Math.floor((lap.elapsed % 3600) / 60))}:{padZero(lap.elapsed % 60)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : activeTimerMode === "current" ? (
              <>
                <div className="tip-item-bullet">
                  <span className="tip-bullet-icon">✓</span>
                  <span>
                    <strong>실시간 페이스 관리</strong>: 개인 스터디 플래너와 연동하여 현 시각 기준의 계획 달성률을 체크하고 공부 패턴을 교정하세요.
                  </span>
                </div>
                <div className="tip-item-bullet">
                  <span className="tip-bullet-icon">✓</span>
                  <span>
                    <strong>모의고사 리얼 타임 동기화</strong>: 실제 시험장의 교실 시계처럼 모니터 옆에 두고, 09:00 언어이해 개시 혹은 10:45 추리논증 개시에 수동 타이머 조작 없이 실제 시간대와 완전히 일치하는 실전 감각을 유지하십시오.
                  </span>
                </div>
                <div className="tip-item-bullet">
                  <span className="tip-bullet-icon">✓</span>
                  <span>
                    <strong>아날로그 시간 감각 강화</strong>: 디지털 숫자가 주는 조바심을 줄이고, 정교한 세이코 칼침 바늘의 각도를 주시하며 현재 가용한 남은 시간의 물리적 양을 체득하세요.
                  </span>
                </div>
              </>
            ) : activeTimerMode === "custom" ? (
              <>
                <div className="tip-item-bullet">
                  <span className="tip-bullet-icon">✓</span>
                  <span>
                    <strong>개인 맞춤형 시간 분배</strong>: LEET 비문학 1지문당 목표 7분, 혹은 추리논증 매칭 퍼즐 1세트당 15분 등 플레이하고 싶은 구간에 맞춰 목표 시간을 세밀하게 세팅하여 시간 장악력을 확보하십시오.
                  </span>
                </div>
                <div className="tip-item-bullet">
                  <span className="tip-bullet-icon">✓</span>
                  <span>
                    <strong>0시 0분 최적화 정독훈련</strong>: 시뮬레이션 개시 시점 기준의 경과 시간을 직관적으로 분석(0분 기준 시계바늘)할 수 있으므로, 매 지문 독해 시 시간 모니터링이 한층 편리해집니다.
                  </span>
                </div>
                <div className="tip-item-bullet">
                  <span className="tip-bullet-icon">✓</span>
                  <span>
                    <strong>모의고사 미니 테스트</strong>: 3문항 10분, 10문항 30분 등 자신만의 단기 집중 사이클을 구성하여 문제 풀이에 소요되는 물리적인 절대 감각을 습득하세요.
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="tip-item-bullet">
                  <span className="tip-bullet-icon">✓</span>
                  <span>
                    <strong>09:00 정각 개시훈련</strong>: 언어이해는 아침 뇌 활성화 여부가 점수를 좌우합니다. 9시 바늘이 움직이기 시작하자마자 첫 비문학 지문을 차분히 읽어나가는 심리적 긴장감을 습득하십시오.
                  </span>
                </div>
                
                <div className="tip-item-bullet">
                  <span className="tip-bullet-icon">✓</span>
                  <span>
                    <strong>10:10 종료 직전 마킹</strong>: 아날로그 초침이 10시를 가리키면(종료 10분 전) 바로 마킹 루틴에 진입해 마킹 실수나 밀려쓰는 리스크를 예방하는 법을 단련해야 합니다.
                  </span>
                </div>

                <div className="tip-item-bullet">
                  <span className="tip-bullet-icon">✓</span>
                  <span>
                    <strong>10:45 ~ 12:50 페이스 컨트롤</strong>: 추리논증은 125분이라는 초장기 레이스입니다. 초반 조건추리나 매칭 퍼즐에서 3분 이상 지체되면 뒤의 법학·규범형 문제를 읽지도 못하고 찍게 됩니다. 3분 타이머 감각을 익혀서 과감히 패스하는 훈련을 하세요.
                  </span>
                </div>

                <div className="tip-item-bullet">
                  <span className="tip-bullet-icon">✓</span>
                  <span>
                    <strong>전체 모드 집중력 분배</strong>: 시험 사이 35분 대기시간 동안 머리를 환기하고 추리논증 시작하자마자 다시 집중력을 급격하게 끌어올리는 바이오리듬 조율은 오직 전체 모드 시뮬레이션으로만 훈련이 가능합니다.
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
