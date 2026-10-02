import React from 'react';

/**
 * StateHUD — Live Data Structure & Memory Inspector
 * Displays live animated Stacks, Queues, Visited Sets, and Algorithm Metrics
 */
export default function StateHUD({ visualization, steps = [], currentStep = -1 }) {
  if (!visualization || steps.length === 0 || currentStep < 0) return null;

  const step = steps[currentStep] || {};
  const algo = visualization.algorithm || visualization.type;

  const stack = step.stack || [];
  const queue = step.queue || [];
  const visited = step.visited || [];
  const sorted = step.sorted || [];
  const pass = step.pass !== undefined ? step.pass : null;

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-sm pointer-events-none">
      {/* Call Stack Visualizer */}
      {(algo === 'dfs' || stack.length > 0) && (
        <div className="p-3 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl shadow-xl text-xs text-zinc-200 pointer-events-auto">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
            <span>CALL STACK (LIFO)</span>
            <span className="text-emerald-400">{stack.length} frames</span>
          </div>
          <div className="space-y-1">
            {stack.length === 0 ? (
              <div className="text-zinc-600 italic text-[11px]">Stack empty</div>
            ) : (
              [...stack].reverse().map((item, i) => (
                <div
                  key={`${item}-${i}`}
                  className={`px-2 py-1 rounded bg-zinc-900 border border-zinc-800 flex justify-between items-center ${i === 0 ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300 font-bold' : ''}`}
                >
                  <span>dfs({item})</span>
                  {i === 0 && <span className="text-[9px] px-1 bg-emerald-500/20 text-emerald-300 rounded font-mono">TOP</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Queue Visualizer */}
      {(algo === 'bfs' || queue.length > 0) && (
        <div className="p-3 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl shadow-xl text-xs text-zinc-200 pointer-events-auto">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
            <span>QUEUE (FIFO)</span>
            <span className="text-emerald-400">{queue.length} items</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto py-1">
            {queue.length === 0 ? (
              <div className="text-zinc-600 italic text-[11px]">Queue empty</div>
            ) : (
              queue.map((item, i) => (
                <div
                  key={`${item}-${i}`}
                  className={`px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono flex items-center gap-1 ${i === 0 ? 'border-emerald-500 text-emerald-300 font-bold' : ''}`}
                >
                  <span>{item}</span>
                  {i === 0 && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 rounded">F</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Visited / Traversal Order */}
      {visited.length > 0 && (
        <div className="p-3 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl shadow-xl text-xs text-zinc-200 pointer-events-auto">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
            VISITED ORDER ({visited.length})
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            {visited.map((v, i) => (
              <React.Fragment key={`${v}-${i}`}>
                <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${i === visited.length - 1 ? 'bg-emerald-500 text-black font-bold' : 'bg-zinc-900 border border-zinc-800 text-zinc-300'}`}>
                  {v}
                </span>
                {i < visited.length - 1 && <span className="text-zinc-600 text-[10px]">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
