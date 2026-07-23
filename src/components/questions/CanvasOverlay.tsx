import React from "react";

// Canvas Overlay Component for Tablet/Pencil Drawing with Touch Scroll, Eraser Preview & Undo/Redo
const CanvasOverlay = ({ probKey, isDrawMode, brushColor, brushWidth, brushType, canvasDrawings, setCanvasDrawings }) => {
  const canvasRef = React.useRef(null);
  const parentRef = React.useRef(null);
  const isDrawing = React.useRef(false);
  const lastPos = React.useRef({ x: 0, y: 0 });

  // State variables for Eraser Preview and Undo/Redo History
  const [eraserPos, setEraserPos] = React.useState(null);
  const [undoStack, setUndoStack] = React.useState([]);
  const [redoStack, setRedoStack] = React.useState([]);

  const undoRef = React.useRef(null);
  const redoRef = React.useRef(null);

  // Sync undoStack with probKey changes
  React.useEffect(() => {
    const initialImg = canvasDrawings[probKey] || null;
    setUndoStack([initialImg]);
    setRedoStack([]);
  }, [probKey]);

  // Load drawing when probKey or modal state changes
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    parentRef.current = parent;

    const ctx = canvas.getContext('2d');

    // Resize canvas to match the scroll dimensions of the problem article card
    const resizeCanvas = () => {
      if (!parent) return;
      if (isDrawing.current) return;
      
      const width = parent.offsetWidth;
      const height = parent.scrollHeight;
      
      // Optimize: Only resize if dimensions actually changed.
      // This saves CPU/GPU overhead and prevents resetting line styles mid-stroke.
      if (canvas.width === width && canvas.height === height) {
        return;
      }
      
      // Temporarily save current canvas content
      const tempImage = canvas.toDataURL();
      
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Restore drawing after resize
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = tempImage;
    };

    // Initialize dimensions
    resizeCanvas();

    // Use ResizeObserver to dynamically track dimensions of the problem article card
    const resizeObserver = new ResizeObserver(() => {
      if (isDrawing.current) return;
      setTimeout(() => {
        if (isDrawing.current) return;
        resizeCanvas();
      }, 50);
    });
    resizeObserver.observe(parent);

    // Load initial drawings if exists
    if (canvasDrawings[probKey]) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = canvasDrawings[probKey];
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [probKey]);

  // Save drawing state to parent React state
  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setUndoStack(prev => [...prev, dataUrl]);
    setRedoStack([]); // Clear redo stack on new action
    setCanvasDrawings(prev => ({ ...prev, [probKey]: dataUrl }));
  };

  const drawStateOnCanvas = (stateDataUrl) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (stateDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = stateDataUrl;
    }
  };

  const handleUndo = () => {
    if (undoStack.length <= 1) return; // Nothing to undo
    
    const newUndo = [...undoStack];
    const currentState = newUndo.pop(); // Remove current state
    const prevState = newUndo[newUndo.length - 1]; // Previous state is now top
    
    setUndoStack(newUndo);
    setRedoStack(prev => [...prev, currentState]);
    
    drawStateOnCanvas(prevState);
    setCanvasDrawings(prev => ({ ...prev, [probKey]: prevState }));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return; // Nothing to redo
    
    const newRedo = [...redoStack];
    const nextState = newRedo.pop();
    
    setUndoStack(prev => [...prev, nextState]);
    setRedoStack(newRedo);
    
    drawStateOnCanvas(nextState);
    setCanvasDrawings(prev => ({ ...prev, [probKey]: nextState }));
  };

  // Keep refs synchronized to guarantee closures are updated
  React.useEffect(() => {
    undoRef.current = handleUndo;
    redoRef.current = handleRedo;
  });

  const getPointerPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handlePointerDown = (e) => {
    if (!isDrawMode) return;
    const isPenOrMouse = e.pointerType === 'pen' || e.pointerType === 'mouse';
    if (!isPenOrMouse) return; // Bypass finger touching to allow scrolling
    
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {
      console.log("Canvas setPointerCapture failed", err);
    }
    isDrawing.current = true;
    
    const pos = getPointerPos(e);
    lastPos.current = pos;
  };

  const handlePointerMove = (e) => {
    if (!isDrawMode) return;

    const pos = getPointerPos(e);
    const isPenOrMouse = e.pointerType === 'pen' || e.pointerType === 'mouse';
    
    // Eraser cursor circle indicator tracking (not on touch events)
    if (brushType === "eraser" && isPenOrMouse) {
      setEraserPos(pos);
    } else {
      if (eraserPos) setEraserPos(null);
    }

    if (!isDrawing.current) return;
    if (!isPenOrMouse) return; // Ignore finger drag for drawing
    
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    
    if (brushType === "eraser") {
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 24;
    } else if (brushType === "highlighter") {
      ctx.strokeStyle = brushColor;
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = 14;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';
      ctx.globalAlpha = 0.45;
    } else { // normal pen
      ctx.strokeStyle = brushColor;
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = brushWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 1.0;
    }
    
    ctx.stroke();
    lastPos.current = pos;
  };

  const handlePointerUp = (e) => {
    const isPenOrMouse = e.pointerType === 'pen' || e.pointerType === 'mouse';
    if (!isPenOrMouse) return;
    if (eraserPos) setEraserPos(null);

    if (!isDrawing.current) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
    isDrawing.current = false;
    saveDrawing();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL();
    setUndoStack(prev => [...prev, dataUrl]);
    setRedoStack([]);
    setCanvasDrawings(prev => ({ ...prev, [probKey]: dataUrl }));
  };

  // Expose clear trigger to window for external control buttons
  React.useEffect(() => {
    window.clearCurrentCanvas = clearCanvas;
    window.undoCurrentCanvas = () => {
      if (undoRef.current) undoRef.current();
    };
    window.redoCurrentCanvas = () => {
      if (redoRef.current) redoRef.current();
    };
    return () => {
      delete window.clearCurrentCanvas;
      delete window.undoCurrentCanvas;
      delete window.redoCurrentCanvas;
    };
  }, [probKey]);

  return (
    <>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => setEraserPos(null)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: isDrawMode ? 10 : -1,
          pointerEvents: isDrawMode ? 'auto' : 'none',
          background: 'transparent',
          touchAction: 'auto' // Enable gesture scrolling/dragging with finger
        }}
      />
      {isDrawMode && brushType === "eraser" && eraserPos && (
        <div
          style={{
            position: "absolute",
            left: `${eraserPos.x}px`,
            top: `${eraserPos.y}px`,
            width: "24px",
            height: "24px",
            border: "1.5px solid rgba(244, 63, 94, 0.8)",
            borderRadius: "50%",
            background: "rgba(244, 63, 94, 0.15)",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 11
          }}
        />
      )}
    </>
  );
};

export default CanvasOverlay;
