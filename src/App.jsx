import { useEffect, useRef, useState } from "react";

const BLOCK_W = 140;
const BLOCK_H = 140;

function randPos() {
  const padding = 20;
  const w = Math.max(window.innerWidth - BLOCK_W - padding, BLOCK_W);
  const h = Math.max(window.innerHeight - BLOCK_H - padding, BLOCK_H);

  return {
    x: Math.floor(Math.random() * w) + padding / 2,
    y: Math.floor(Math.random() * h) + padding / 2,
  };
}

let nextId = 1;

function App() {
  const [blocks, setBlocks] = useState([]); // {id, parentId, x , y}
  const [draggingId, setDraggingId] = useState(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  // create initial block on mount
  useEffect(() => {
    const p = randPos();
    setBlocks([{ id: nextId++, parentId: null, x: p.x, y: p.y }]);
  }, []);

  useEffect(() => {
    const onResize = () => {
      setBlocks((prev) =>
        prev.map((b) => ({
          ...b,
          x: Math.min(b.x, Math.max(0, window.innerWidth - BLOCK_W)),
          y: Math.min(b.y, Math.max(0, window.innerHeight - BLOCK_H)),
        }))
      );
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });

  function addChild(parentId) {
    const p = randPos();
    const child = { id: nextId++, parentId, x: p.x, y: p.y };
    setBlocks((s) => [...s, child]);
  }

  function onMouseDown(e, id) {
    const block = blocks.find((b) => b.id === id);
    if (!block) return;
    setDraggingId(id);
    offsetRef.current = {
      x: e.clientX - block.x,
      y: e.clientY - block.y,
    };
  }

  function onMouseMove(e) {
    if (draggingId === null) return;
    e.preventDefault();
    const { x: offsetX, y: offsetY } = offsetRef.current;
    const nx = e.clientX - offsetX;
    const ny = e.clientY - offsetY;
    const clampedX = Math.max(0, Math.min(nx, window.innerWidth - BLOCK_W));
    const clampedY = Math.max(0, Math.min(ny, window.innerHeight - BLOCK_H));
    setBlocks((prev) =>
      prev.map((b) => (b.id === draggingId ? { ...b, x: clampedX, y: clampedY } : b))
    );
  }

  function onMouseUp() {
    setDraggingId(null);
  }

  // helper to compute center coords for svg lines
  function centerOf(b) {
    return { cx: b.x + BLOCK_W / 2, cy: b.y + BLOCK_H / 2 };
  }

  // map of blocks for quick find
  const byId = Object.fromEntries(blocks.map((b) => [b.id, b]));

  return (
    <div
      className="w-screen h-screen relative bg-slate-50 overflow-hidden"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {/* SVG overlay for dashed connectors - placed behind blocks */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        {blocks.map((b) => {
          if (!b.parentId) return null;
          const parent = byId[b.parentId];
          if (!parent) return null;
          const p1 = centerOf(parent);
          const p2 = centerOf(b);
          return (
            <line
              key={`line-${b.id}`}
              x1={p1.cx}
              y1={p1.cy}
              x2={p2.cx}
              y2={p2.cy}
              strokeWidth={2}
              strokeDasharray="6 6"
              stroke="rgba(100,116,139,0.9)"
            />
          );
        })}
      </svg>
      {/* Blocks */}
      <div className="absolute inset-0 z-10">
        {blocks.map((b) => (
          <div
            key={b.id}
            onMouseDown={(e) => onMouseDown(e, b.id)}
            className="absolute cursor-grab active:cursor-grabbing"
            style={{ left: b.x, top: b.y, width: BLOCK_W, height: BLOCK_H }}
          >
            <div
              className="w-full h-full rounded-2xl shadow-lg relative select-none flex flex-col"
              style={{ background: `linear-gradient(135deg, #f8fafc, #eef2ff)` }}
            >
              <div className="px-3 py-2 flex items-center justify-between">
                <div className="text-sm font-medium text-slate-700">Block #{b.id}</div>
                <button
                  title="Add child"
                  onClick={(e) => {
                    e.stopPropagation();
                    addChild(b.id);
                  }}
                  className="w-7 h-7 rounded bg-white/80 border border-slate-200 flex items-center justify-center text-lg font-bold shadow-sm"
                >
                  +
                </button>
              </div>
              <div className="flex-1 px-3 pb-2 text-xs text-slate-500">Click and hold to drag.</div>
              <div className="absolute right-2 bottom-2 text-xs text-slate-400">
                {b.parentId ? `parent: ${b.parentId}` : "root"}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Controls */}
      <div className="absolute left-4 bottom-4 z-20 flex gap-2">
        <button
          className="px-3 py-2 rounded bg-white/90 border shadow text-sm"
          onClick={() => {
            // add another root block
            const p = randPos();
            setBlocks((s) => [...s, { id: nextId++, parentId: null, x: p.x, y: p.y }]);
          }}
        >
          Add root block
        </button>
        <button
          className="px-3 py-2 rounded bg-white/90 border shadow text-sm"
          onClick={() => setBlocks([])}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export default App;
