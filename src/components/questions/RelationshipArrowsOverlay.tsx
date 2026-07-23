import React from "react";

// SVG Overlay Component for Word Relationship Connectors (Arrows)
const RelationshipArrowsOverlay = ({ 
  probKey, 
  arrows, 
  setArrows, 
  dragStartKey, 
  dragCurrentCoords, 
  dragTargetKey 
}) => {
  const [svgSize, setSvgSize] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const parent = document.getElementById(`single-view-card-${probKey}`);
    if (!parent) return;

    const updateSize = () => {
      setSvgSize({
        width: parent.offsetWidth,
        height: parent.scrollHeight
      });
    };

    updateSize();
    const observer = new ResizeObserver(() => {
      setTimeout(updateSize, 50);
    });
    observer.observe(parent);
    return () => observer.disconnect();
  }, [probKey]);

  const getCoords = (wordKey) => {
    const el = document.getElementById(wordKey);
    if (!el) return null;
    
    const svgEl = document.getElementById(`relationship-arrows-svg-${probKey}`);
    if (svgEl) {
      const elRect = el.getBoundingClientRect();
      const svgRect = svgEl.getBoundingClientRect();
      return {
        x: elRect.left - svgRect.left + elRect.width / 2,
        y: elRect.top - svgRect.top + elRect.height / 2
      };
    }
    
    // Fallback if SVG not mounted yet
    const parent = document.getElementById(`single-view-card-${probKey}`);
    if (!parent) return null;
    
    const elRect = el.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    
    const x = elRect.left - parentRect.left + elRect.width / 2;
    const y = elRect.top - parentRect.top + elRect.height / 2;
    
    return { x, y };
  };

  // Filter arrows that belong to this specific problem
  const currentArrows = arrows.filter(a => a.fromKey.startsWith(probKey) && a.toKey.startsWith(probKey));

  // Determine active dragging coords for this problem
  const isDraggingForThisProb = dragStartKey && dragStartKey.startsWith(probKey);
  const fromCoords = isDraggingForThisProb ? getCoords(dragStartKey) : null;
  
  let toCoords = null;
  if (fromCoords && dragCurrentCoords) {
    if (dragTargetKey && dragTargetKey.startsWith(probKey)) {
      toCoords = getCoords(dragTargetKey);
    } else {
      toCoords = dragCurrentCoords;
    }
  }

  return (
    <svg
      id={`relationship-arrows-svg-${probKey}`}
      width={svgSize.width}
      height={svgSize.height}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: `${svgSize.width}px`,
        height: `${svgSize.height}px`,
        pointerEvents: "none", // Let mouse events pass through to text
        zIndex: 5 // Above text, below canvas drawing overlay
      }}
    >
      <style>
        {`
          @keyframes preview-dash-move {
            to {
              stroke-dashoffset: -20;
            }
          }
          .preview-arrow-line {
            animation: preview-dash-move 0.6s linear infinite;
          }
        `}
      </style>
      <defs>
        <marker
          id={`arrow-head-${probKey}`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--accent-cyan)" />
        </marker>
        
        {/* Preview Arrow Head */}
        <marker
          id={`arrow-head-preview-${probKey}`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--accent-yellow, #eab308)" />
        </marker>
      </defs>

      {/* Render the temporary preview line while dragging */}
      {fromCoords && toCoords && (
        <line
          className="preview-arrow-line"
          x1={fromCoords.x}
          y1={fromCoords.y}
          x2={toCoords.x}
          y2={toCoords.y}
          stroke="var(--accent-yellow, #eab308)"
          strokeWidth="2.5"
          strokeDasharray="5 5"
          markerEnd={`url(#arrow-head-preview-${probKey})`}
          style={{
            opacity: 0.85
          }}
        />
      )}

      {currentArrows.map(arrow => {
        const from = getCoords(arrow.fromKey);
        const to = getCoords(arrow.toKey);
        if (!from || !to) return null;

        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;

        return (
          <g key={arrow.id} className="arrow-group">
            {/* Visual thin line with arrowhead marker */}
            <line
              className="arrow-line"
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="var(--accent-cyan)"
              strokeWidth="2.5"
              strokeDasharray="4 3"
              markerEnd={`url(#arrow-head-${probKey})`}
            />
            {/* Delete badge group */}
            <g
              className="arrow-delete-btn"
              style={{ cursor: "pointer", pointerEvents: "auto" }}
              onClick={(e) => {
                e.stopPropagation();
                setArrows(prev => prev.filter(a => a.id !== arrow.id));
              }}
            >
              <title>클릭하여 연결선 지우기</title>
              {/* Invisible large touch target */}
              <circle
                cx={midX}
                cy={midY}
                r="16"
                fill="transparent"
              />
              {/* Visual small delete circle */}
              <circle
                cx={midX}
                cy={midY}
                r="7"
                fill="var(--accent-rose)"
                stroke="#ffffff"
                strokeWidth="1.2"
                className="arrow-delete-circle"
                style={{
                  opacity: 0.35,
                  transition: "opacity 0.2s ease, fill 0.2s ease",
                  filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.2))"
                }}
              />
              {/* Small "×" character */}
              <text
                x={midX}
                y={midY + 3}
                fill="#ffffff"
                fontSize="9"
                fontWeight="800"
                textAnchor="middle"
                className="arrow-delete-text"
                style={{
                  opacity: 0.6,
                  transition: "opacity 0.2s ease",
                  pointerEvents: "none"
                }}
              >
                ×
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};

export default RelationshipArrowsOverlay;
