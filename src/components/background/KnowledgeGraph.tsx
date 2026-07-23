import React, { useEffect, useRef, useState } from "react";

const CATEGORY_COLORS = {
  "인문·철학": "#f43f5e",   // Rose
  "사회과학·법학": "#10b981", // Emerald
  "자연과학·기술": "#3b82f6", // Blue
  "경제·경영": "#f59e0b",     // Amber
  "논리학·수학": "#a855f7"    // Purple
};

const LIGHT_CATEGORY_COLORS = {
  "인문·철학": "#e11d48",   // Darker Rose
  "사회과학·법학": "#047857", // Darker Emerald
  "자연과학·기술": "#1d4ed8", // Darker Blue
  "경제·경영": "#b45309",     // Darker Amber
  "논리학·수학": "#7c3aed"    // Darker Purple
};

export default function KnowledgeGraph({ theme = "dark", knowledgeData = [], onSelectConcept = (_val?: any) => {}, activeTab }: any) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Physical Simulation States stored in ref to prevent re-renders on animation frames
  const simRef = useRef({
    nodes: [],
    links: [],
    panX: 0,
    panY: 0,
    zoom: 1.0,
    isDraggingCanvas: false,
    draggedNode: null,
    lastMouseX: 0,
    lastMouseY: 0,
    isClick: false,
    width: 800,
    height: 600,
    initialized: false
  });

  // Initialize nodes and links when knowledgeData changes
  useEffect(() => {
    if (knowledgeData.length === 0) return;

    const sim = simRef.current;
    
    // Create node objects with physical properties
    const nodesMap = {};
    const initializedNodes = knowledgeData.map((c) => {
      // Preserve positions if already initialized
      const existing = sim.nodes.find(n => n.id === c.id);
      const node = {
        id: c.id,
        title: c.title,
        category: c.category,
        x: existing ? existing.x : Math.random() * 600 + 100,
        y: existing ? existing.y : Math.random() * 400 + 100,
        vx: existing ? existing.vx : 0,
        vy: existing ? existing.vy : 0,
        radius: 26,
        concept: c
      };
      nodesMap[c.id] = node;
      return node;
    });

    // Create link objects from related_concepts
    const links = [];
    knowledgeData.forEach((c) => {
      if (c.related_concepts) {
        c.related_concepts.forEach((rel) => {
          // Find by id or title
          const targetNode = initializedNodes.find(n => n.id === rel || n.title === rel);
          const sourceNode = nodesMap[c.id];
          if (sourceNode && targetNode && sourceNode.id !== targetNode.id) {
            // Avoid duplicates
            const exists = links.some(l => 
              (l.source.id === sourceNode.id && l.target.id === targetNode.id) ||
              (l.source.id === targetNode.id && l.target.id === sourceNode.id)
            );
            if (!exists) {
              links.push({ source: sourceNode, target: targetNode });
            }
          }
        });
      }
    });

    sim.nodes = initializedNodes;
    sim.links = links;
    sim.initialized = true;

    // Center the graph initially
    if (!existingNodesExist(sim.nodes)) {
      centerGraph();
    }
  }, [knowledgeData]);

  const existingNodesExist = (nodes) => {
    return nodes.some(n => n.vx !== 0 || n.vy !== 0);
  };

  const centerGraph = () => {
    const sim = simRef.current;
    if (sim.nodes.length === 0) return;
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    sim.nodes.forEach(n => {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    sim.panX = sim.width / 2 - centerX;
    sim.panY = sim.height / 2 - centerY;
    sim.zoom = 0.85;
  };

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const sim = simRef.current;
      sim.width = rect.width;
      sim.height = rect.height || 550;
      
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = sim.width * dpr;
      canvas.height = sim.height * dpr;
      canvas.style.width = `${sim.width}px`;
      canvas.style.height = `${sim.height}px`;
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    
    // Trigger resize after tab mount animation
    const timer = setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [activeTab]);

  // Animation Loop (Spring-Force Physics)
  useEffect(() => {
    let animationId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");

    const updatePhysics = () => {
      const sim = simRef.current;
      if (!sim.initialized || sim.nodes.length === 0) return;

      const kRepulsion = 5000;    // Coulombs constant for push
      const kAttraction = 0.04;   // Hookes constant for pull
      const springLength = 120;   // Default rest length
      const centralGravity = 0.002; // Pull towards center (reduced from 0.015)
      const damping = 0.82;       // Friction deceleration (reduced from 0.88 to damp faster)

      const centerPointX = sim.width / 2;
      const centerPointY = sim.height / 2;

      // 1. Central Gravity & Boundary Restraint
      sim.nodes.forEach((n) => {
        if (n === sim.draggedNode) return;
        
        // Central Gravity
        n.vx += (centerPointX - n.x) * centralGravity;
        n.vy += (centerPointY - n.y) * centralGravity;
      });

      // 2. Coulomb Repulsion (between all node pairs)
      for (let i = 0; i < sim.nodes.length; i++) {
        const n1 = sim.nodes[i];
        for (let j = i + 1; j < sim.nodes.length; j++) {
          const n2 = sim.nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          // Add small offset to prevent division by zero
          const distSq = dx * dx + dy * dy + 0.1;
          const dist = Math.sqrt(distSq);

          if (dist < 500) { // Repulse range
            const force = kRepulsion / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (n1 !== sim.draggedNode) {
              n1.vx -= fx;
              n1.vy -= fy;
            }
            if (n2 !== sim.draggedNode) {
              n2.vx += fx;
              n2.vy += fy;
            }
          }
        }
      }

      // 3. Hooke Attraction (between linked nodes)
      sim.links.forEach((l) => {
        const dx = l.target.x - l.source.x;
        const dy = l.target.y - l.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
        
        const force = kAttraction * (dist - springLength);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (l.source !== sim.draggedNode) {
          l.source.vx += fx;
          l.source.vy += fy;
        }
        if (l.target !== sim.draggedNode) {
          l.target.vx -= fx;
          l.target.vy -= fy;
        }
      });

      // 4. Update position & Apply Damping
      sim.nodes.forEach((n) => {
        if (n === sim.draggedNode) return;
        
        // Apply micro-velocity threshold cutoff to prevent perpetual wiggling
        if (Math.abs(n.vx) < 0.03) n.vx = 0;
        if (Math.abs(n.vy) < 0.03) n.vy = 0;

        n.x += n.vx;
        n.y += n.vy;
        
        // Damp velocity
        n.vx *= damping;
        n.vy *= damping;
        
        // Cap speed to prevent explosive unstable states
        const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (speed > 15) {
          n.vx = (n.vx / speed) * 15;
          n.vy = (n.vy / speed) * 15;
        }
      });
    };

    const drawGraph = () => {
      const sim = simRef.current;
      if (!ctx || !canvas) return;

      const dpr = window.devicePixelRatio || 1;
      
      // Clear Screen
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      ctx.scale(dpr, dpr);
      
      // Apply Pan & Zoom
      ctx.translate(sim.panX, sim.panY);
      ctx.scale(sim.zoom, sim.zoom);

      const isLight = theme === "light";

      // 1. Draw Links
      sim.links.forEach((l) => {
        const isHoveredLink = hoveredNode && (l.source.id === hoveredNode.id || l.target.id === hoveredNode.id);
        ctx.lineWidth = isHoveredLink ? 2.25 : 1.5;
        ctx.strokeStyle = isHoveredLink 
          ? (isLight ? "rgba(37, 99, 235, 0.9)" : "rgba(59, 130, 246, 0.8)") 
          : (isLight ? "rgba(15, 23, 42, 0.28)" : "rgba(255, 255, 255, 0.35)");
        
        ctx.beginPath();
        ctx.moveTo(l.source.x, l.source.y);
        ctx.lineTo(l.target.x, l.target.y);
        ctx.stroke();
      });

      // 2. Draw Nodes
      sim.nodes.forEach((n) => {
        const isHovered = hoveredNode && n.id === hoveredNode.id;
        const isRelated = hoveredNode && sim.links.some(l => 
          (l.source.id === n.id && l.target.id === hoveredNode.id) ||
          (l.target.id === n.id && l.source.id === hoveredNode.id)
        );

        const color = isLight 
          ? (LIGHT_CATEGORY_COLORS[n.category] || "#0f172a") 
          : (CATEGORY_COLORS[n.category] || "#ffffff");
        
        ctx.save();
        ctx.translate(n.x, n.y);

        // Apply drop shadow on nodes to pop them out from the canvas
        if (isLight) {
          ctx.shadowColor = "rgba(15, 23, 42, 0.12)";
          ctx.shadowBlur = 6;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2;
        } else {
          ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 4;
        }

        // Outer glow on hover or relation
        if (isHovered) {
          ctx.beginPath();
          ctx.arc(0, 0, n.radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = isLight ? "rgba(37, 99, 235, 0.08)" : `${color}15`;
          ctx.fill();
        }

        // Main Node Circle
        ctx.beginPath();
        ctx.arc(0, 0, n.radius, 0, Math.PI * 2);
        
        // Background Glass Fill (adjusted for better contrast against canvas background)
        ctx.fillStyle = isHovered 
          ? (isLight ? "rgba(219, 234, 254, 0.98)" : "rgba(30, 41, 59, 0.95)") 
          : (isRelated 
              ? (isLight ? "rgba(239, 246, 255, 0.95)" : "rgba(20, 30, 54, 0.9)") 
              : (isLight ? "rgba(238, 243, 248, 0.96)" : "rgba(15, 23, 42, 0.75)"));
        ctx.fill();
        
        // Colored Border (stronger alpha on light mode to prevent looking washed out)
        ctx.lineWidth = isHovered ? 2.5 : (isRelated ? 1.75 : 1.25);
        ctx.strokeStyle = isHovered || isRelated ? color : (isLight ? "rgba(15, 23, 42, 0.38)" : "rgba(255, 255, 255, 0.2)");
        ctx.stroke();

        // Disable shadow before rendering text to prevent text blurring
        ctx.shadowColor = "transparent";

        // Node Title Text (higher font size and darker colors in light mode for crisp readability)
        ctx.fillStyle = isHovered || isRelated 
          ? (isLight ? "#1e3a8a" : "#ffffff") 
          : (isLight ? "#0f172a" : "rgba(255, 255, 255, 0.85)");
        ctx.font = "bold 9.5px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // Wrap text if title is long (e.g. over 5 chars)
        if (n.title.length > 5) {
          const part1 = n.title.slice(0, 5);
          const part2 = n.title.slice(5);
          ctx.fillText(part1, 0, -5);
          ctx.fillText(part2, 0, 5);
        } else {
          ctx.fillText(n.title, 0, 0);
        }

        ctx.restore();
      });

      ctx.restore();
    };

    const loop = () => {
      updatePhysics();
      drawGraph();
      animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [hoveredNode]);

  // Mouse coordinate converter taking current pan & zoom into account
  const getSimCoords = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const sim = simRef.current;
    return {
      x: (x - sim.panX) / sim.zoom,
      y: (y - sim.panY) / sim.zoom
    };
  };

  // Interaction Handlers
  const handleMouseDown = (e) => {
    const sim = simRef.current;
    const { x, y } = getSimCoords(e.clientX, e.clientY);

    // Check if clicked a node
    let clickedNode = null;
    for (let i = sim.nodes.length - 1; i >= 0; i--) {
      const n = sim.nodes[i];
      const dx = n.x - x;
      const dy = n.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < n.radius + 3) {
        clickedNode = n;
        break;
      }
    }

    if (clickedNode) {
      sim.draggedNode = clickedNode;
      clickedNode.vx = 0;
      clickedNode.vy = 0;
      sim.isClick = true;
    } else {
      // Clicked background, trigger canvas pan
      sim.isDraggingCanvas = true;
      sim.isClick = false;
    }

    sim.lastMouseX = e.clientX;
    sim.lastMouseY = e.clientY;
  };

  const handleMouseMove = (e) => {
    const sim = simRef.current;
    const dx = e.clientX - sim.lastMouseX;
    const dy = e.clientY - sim.lastMouseY;

    // Detect if mouse moved enough to cancel pure click
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      sim.isClick = false;
    }

    if (sim.draggedNode) {
      // Update dragged node position in sim coordinates
      const { x, y } = getSimCoords(e.clientX, e.clientY);
      sim.draggedNode.x = x;
      sim.draggedNode.y = y;
    } else if (sim.isDraggingCanvas) {
      // Pan canvas
      sim.panX += dx;
      sim.panY += dy;
    } else {
      // Check node hovering
      const { x, y } = getSimCoords(e.clientX, e.clientY);
      let hovered = null;
      for (let i = sim.nodes.length - 1; i >= 0; i--) {
        const n = sim.nodes[i];
        const distance = Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2);
        if (distance < n.radius) {
          hovered = n;
          break;
        }
      }
      if (hovered !== hoveredNode) {
        setHoveredNode(hovered);
      }
    }

    sim.lastMouseX = e.clientX;
    sim.lastMouseY = e.clientY;
  };

  const handleMouseUp = () => {
    const sim = simRef.current;
    if (sim.isClick && sim.draggedNode) {
      // Pure click on node without dragging: select concept
      onSelectConcept(sim.draggedNode.concept);
    }
    
    sim.draggedNode = null;
    sim.isDraggingCanvas = false;
    sim.isClick = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const sim = simRef.current;
    
    // Zoom factor scaling
    const zoomIntensity = 0.08;
    const mouseCoords = getSimCoords(e.clientX, e.clientY);
    
    const zoomFactor = e.deltaY < 0 ? 1 + zoomIntensity : 1 - zoomIntensity;
    const nextZoom = Math.max(0.15, Math.min(4.0, sim.zoom * zoomFactor));
    
    // Zoom centered at mouse cursor position
    sim.panX = e.clientX - canvasRef.current.getBoundingClientRect().left - mouseCoords.x * nextZoom;
    sim.panY = e.clientY - canvasRef.current.getBoundingClientRect().top - mouseCoords.y * nextZoom;
    sim.zoom = nextZoom;
  };

  return (
    <div 
      ref={containerRef} 
      className="glass-card" 
      style={{ 
        width: "100%", 
        height: "550px", 
        position: "relative", 
        overflow: "hidden", 
        background: theme === "light" ? "rgba(248, 250, 252, 0.95)" : "rgba(10, 15, 30, 0.4)",
        border: theme === "light" ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid var(--border-glass)",
        cursor: simRef.current.isDraggingCanvas ? "grabbing" : "grab"
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ display: "block" }}
      />

      {/* Floating Graph UI Help Overlay */}
      <div 
        style={{ 
          position: "absolute", 
          bottom: "1rem", 
          left: "1rem", 
          pointerEvents: "none", 
          fontSize: "11px", 
          color: "var(--text-muted)",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem"
        }}
      >
        <span>💡 휠 스크롤: 지식맵 확대 / 축소</span>
        <span>💡 마우스 드래그: 맵 화면 이동 & 노드 드래그</span>
        <span>💡 노드 클릭: 상세 배경지식 모달 실행</span>
      </div>

      {/* Floating Active Node Preview */}
      {hoveredNode && (
        <div 
          style={{ 
            position: "absolute", 
            top: "1rem", 
            right: "1rem", 
            background: "var(--bg-glass)", 
            border: `1px solid ${CATEGORY_COLORS[hoveredNode.category]}40`,
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            maxWidth: "240px",
            pointerEvents: "none",
            boxShadow: "0 10px 20px rgba(0,0,0,0.4)"
          }}
        >
          <span 
            className="badge" 
            style={{ 
              fontSize: "9px", 
              background: `${CATEGORY_COLORS[hoveredNode.category]}15`, 
              color: CATEGORY_COLORS[hoveredNode.category], 
              borderColor: `${CATEGORY_COLORS[hoveredNode.category]}30`,
              padding: "2px 6px"
            }}
          >
            {hoveredNode.category}
          </span>
          <h4 style={{ margin: "4px 0 2px 0", fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {hoveredNode.title}
          </h4>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.3 }}>
            {hoveredNode.concept.definition.slice(0, 45)}...
          </p>
        </div>
      )}
    </div>
  );
}
