"use client";
import { useState, useMemo } from "react";
import { BankersInput, BankersResult, bankersSafe, bankersDemo, createRAG, detectCycle, RAGState } from "@/lib/deadlock";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { AlertTriangle, CheckCircle, Plus, RotateCcw, ShieldCheck } from "lucide-react";

// ── RAG Tab ─────────────────────────────────────────────────
function RAGTab() {
  // ── LOGIC — DO NOT MODIFY ──────────────────────────────────
  const [rag, setRag]     = useState<RAGState>(createRAG());
  const [nextP, setNextP] = useState(0);
  const [nextR, setNextR] = useState(0);
  const [reqPid, setReqPid] = useState(0);
  const [reqRid, setReqRid] = useState(0);
  const [asgPid, setAsgPid] = useState(0);
  const [asgRid, setAsgRid] = useState(0);

  const cycle = useMemo(() => detectCycle(rag), [rag]);

  const addProcess = () => {
    setRag(prev => {
      const s: RAGState = { ...prev, processes: [...prev.processes, nextP], requests: new Map(prev.requests), assignments: new Map(prev.assignments) };
      setNextP(nextP + 1);
      return s;
    });
  };
  const addResource = () => {
    setRag(prev => {
      const s: RAGState = { ...prev, resources: [...prev.resources, nextR], requests: new Map(prev.requests), assignments: new Map(prev.assignments) };
      setNextR(nextR + 1);
      return s;
    });
  };
  const addRequest = () => {
    setRag(prev => {
      const s: RAGState = { ...prev, processes: [...prev.processes], resources: [...prev.resources], requests: new Map(prev.requests), assignments: new Map(prev.assignments) };
      if (!s.requests.has(reqPid)) s.requests.set(reqPid, new Set());
      s.requests.get(reqPid)!.add(reqRid);
      return s;
    });
  };
  const addAssignment = () => {
    setRag(prev => {
      const s: RAGState = { ...prev, processes: [...prev.processes], resources: [...prev.resources], requests: new Map(prev.requests), assignments: new Map(prev.assignments) };
      s.assignments.set(asgRid, asgPid);
      return s;
    });
  };
  const loadDemo = () => {
    const s: RAGState = { processes: [0, 1, 2], resources: [0, 1, 2], assignments: new Map([[0, 1], [1, 2], [2, 0]]), requests: new Map([[0, new Set([0])], [1, new Set([1])], [2, new Set([2])]]) };
    setRag(s); setNextP(3); setNextR(3);
  };
  const reset = () => { setRag(createRAG()); setNextP(0); setNextR(0); };

  const radius = 130, cx = 200, cy = 180;
  const all = [...rag.processes.map(p => ({ id: p, type: "P" as const })), ...rag.resources.map(r => ({ id: r, type: "R" as const }))];
  const positions = new Map<string, { x: number; y: number }>();
  all.forEach((n, i) => {
    const a = (2 * Math.PI * i) / Math.max(all.length, 1) - Math.PI / 2;
    positions.set(`${n.type}${n.id}`, { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) });
  });
  // ── END LOGIC ────────────────────────────────────────────

  const inputCls = "w-16 px-1.5 py-1 rounded-lg border border-border bg-background text-xs text-center focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Add nodes */}
        <div className="section-card">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Add Nodes</h3>
          <div className="flex flex-wrap gap-2">
            <Button onClick={addProcess} variant="primary" size="sm">
              <Plus size={12} />
              Process P{nextP}
            </Button>
            <Button onClick={addResource} variant="secondary" size="sm">
              <Plus size={12} />
              Resource R{nextR}
            </Button>
          </div>
        </div>

        {/* Add edges */}
        <div className="section-card">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Add Edges</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground w-4">P</span>
              <input type="number" min={0} value={reqPid} onChange={e => setReqPid(+e.target.value)} className={inputCls} aria-label="Request from process" />
              <span className="text-muted-foreground">→ R</span>
              <input type="number" min={0} value={reqRid} onChange={e => setReqRid(+e.target.value)} className={inputCls} aria-label="Request to resource" />
              <Button onClick={addRequest} variant="outline" size="sm">Request</Button>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground w-4">R</span>
              <input type="number" min={0} value={asgRid} onChange={e => setAsgRid(+e.target.value)} className={inputCls} aria-label="Assignment from resource" />
              <span className="text-muted-foreground">→ P</span>
              <input type="number" min={0} value={asgPid} onChange={e => setAsgPid(+e.target.value)} className={inputCls} aria-label="Assignment to process" />
              <Button onClick={addAssignment} variant="outline" size="sm">Assign</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo / Reset */}
      <div className="flex gap-2">
        <Button onClick={loadDemo} variant="secondary" size="sm">Load Demo (Cycle)</Button>
        <Button onClick={reset} variant="destructive" size="sm">
          <RotateCcw size={12} />
          Reset
        </Button>
      </div>

      {/* Status banner */}
      {cycle && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive bg-destructive/10">
          <AlertTriangle size={18} className="text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-destructive text-sm">Deadlock detected!</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cycle: {cycle.map(p => `P${p}`).join(" → ")}
            </p>
          </div>
        </div>
      )}
      {!cycle && rag.processes.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-success bg-success-subtle">
          <ShieldCheck size={18} className="text-success shrink-0" />
          <p className="font-semibold text-success text-sm">No deadlock — system is safe</p>
        </div>
      )}

      {/* RAG SVG — responsive via viewBox */}
      <div className="section-card p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Resource Allocation Graph
        </h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-primary inline-block" /> Process</span>
          <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-warning inline-block" /> Resource</span>
          <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 border-t-2 border-dashed border-primary inline-block" /> Assigned</span>
          <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 border-t-2 border-slate-400 inline-block" /> Requested</span>
        </div>
        <svg
          viewBox="0 0 400 360"
          width="100%"
          className="rounded-xl border border-border bg-muted/20 max-h-[360px]"
          aria-label="Resource Allocation Graph"
        >
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
            </marker>
            <marker id="arrowhead-red" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
            </marker>
          </defs>

          {/* Request edges (P -> R) */}
          {rag.processes.map(pid => {
            const reqs = rag.requests.get(pid);
            if (!reqs) return null;
            return Array.from(reqs).map(rid => {
              const from = positions.get(`P${pid}`);
              const to   = positions.get(`R${rid}`);
              if (!from || !to) return null;
              const inCycle = cycle && cycle.includes(pid);
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const dist = Math.hypot(dx, dy) || 1;
              const x1 = from.x + (dx / dist) * 20;
              const y1 = from.y + (dy / dist) * 20;
              const x2 = to.x - (dx / dist) * 22;
              const y2 = to.y - (dy / dist) * 22;
              return (
                <line
                  key={`req-${pid}-${rid}`}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={inCycle ? "#ef4444" : "#94a3b8"}
                  strokeWidth={inCycle ? 2.5 : 1.5}
                  markerEnd={inCycle ? "url(#arrowhead-red)" : "url(#arrowhead)"}
                />
              );
            });
          })}

          {/* Assignment edges (R -> P) */}
          {Array.from(rag.assignments.entries()).map(([rid, pid]) => {
            const from = positions.get(`R${rid}`);
            const to   = positions.get(`P${pid}`);
            if (!from || !to) return null;
            const inCycle = cycle && cycle.includes(pid);
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const dist = Math.hypot(dx, dy) || 1;
            const x1 = from.x + (dx / dist) * 20;
            const y1 = from.y + (dy / dist) * 20;
            const x2 = to.x - (dx / dist) * 22;
            const y2 = to.y - (dy / dist) * 22;
            return (
              <line
                key={`asg-${rid}-${pid}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={inCycle ? "#ef4444" : "var(--primary)"}
                strokeWidth={inCycle ? 2.5 : 1.5}
                strokeDasharray={inCycle ? "" : "5 3"}
                markerEnd={inCycle ? "url(#arrowhead-red)" : "url(#arrowhead)"}
              />
            );
          })}

          {/* Process circles */}
          {rag.processes.map(p => {
            const pos = positions.get(`P${p}`);
            if (!pos) return null;
            const inCycle = cycle?.includes(p);
            return (
              <g key={`P${p}`}>
                <circle cx={pos.x} cy={pos.y} r={20}
                  fill={inCycle ? "#ef4444" : "var(--primary)"}
                  stroke={inCycle ? "#ef4444" : "var(--primary)"}
                  strokeWidth={2}
                  style={{ filter: inCycle ? "drop-shadow(0 0 6px #ef4444aa)" : undefined }}
                />
                <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">
                  P{p}
                </text>
              </g>
            );
          })}

          {/* Resource squares */}
          {rag.resources.map(r => {
            const pos = positions.get(`R${r}`);
            if (!pos) return null;
            return (
              <g key={`R${r}`}>
                <rect x={pos.x - 18} y={pos.y - 18} width={36} height={36}
                  fill="var(--warning)" rx={6}
                />
                <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">
                  R{r}
                </text>
              </g>
            );
          })}

          {all.length === 0 && (
            <text x="200" y="180" textAnchor="middle" fill="#64748b" fontSize={13}>
              Add processes and resources to build the graph
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}

// ── Banker's Tab ─────────────────────────────────────────────
function BankersTab() {
  // ── LOGIC — DO NOT MODIFY ──────────────────────────────────
  const [input, setInput] = useState<BankersInput>(bankersDemo);
  const result: BankersResult = useMemo(() => bankersSafe(input), [input]);

  const updateCell = (matrix: "allocation" | "max", i: number, j: number, val: number) => {
    setInput(prev => {
      const next = { ...prev, [matrix]: prev[matrix].map((row, ri) => ri === i ? row.map((c, ci) => ci === j ? val : c) : [...row]) };
      return next;
    });
  };
  const updateAvail = (j: number, val: number) => {
    setInput(prev => ({ ...prev, available: prev.available.map((v, i) => i === j ? val : v) }));
  };
  const addProcess = () => {
    setInput(prev => ({
      ...prev, n: prev.n + 1,
      allocation: [...prev.allocation, new Array(prev.m).fill(0)],
      max: [...prev.max, new Array(prev.m).fill(0)],
    }));
  };
  const vec = (v: number[]) => `[${v.join(", ")}]`;
  // ── END LOGIC ────────────────────────────────────────────

  const cellCls = "w-14 px-1.5 py-1 rounded-lg border border-border bg-background text-xs text-center focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-5">
      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => setInput(bankersDemo)} variant="secondary" size="sm">Load Demo</Button>
        <Button onClick={addProcess} variant="primary" size="sm">
          <Plus size={12} />
          Add Process
        </Button>
      </div>

      {/* Status */}
      <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm font-semibold
        ${result.safe
          ? "bg-success-subtle border-success text-success"
          : "bg-destructive-subtle border-destructive text-destructive"}`}>
        {result.safe
          ? <CheckCircle size={18} className="shrink-0 mt-0.5" />
          : <AlertTriangle size={18} className="shrink-0 mt-0.5" />
        }
        <span>
          {result.safe
            ? `Safe state. Safe sequence: ${result.sequence.map(i => `P${i}`).join(" → ")}`
            : "Unsafe state — deadlock possible!"}
        </span>
      </div>

      {/* Matrices */}
      <div className="grid md:grid-cols-2 gap-4">
        {(["allocation", "max"] as const).map(m => (
          <div key={m} className="section-card">
            <h4 className="text-sm font-semibold mb-3 capitalize">{m} Matrix</h4>
            <div className="overflow-x-auto">
              <table className="text-xs border border-border w-full rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-2 py-2 text-left text-muted-foreground">Proc</th>
                    {Array.from({ length: input.m }, (_, j) => (
                      <th key={j} className="px-2 py-2 text-muted-foreground">R{j}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {input[m].map((row, i) => (
                    <tr key={i} className="hover:bg-muted/40">
                      <td className="px-2 py-1.5 font-mono font-bold">P{i}</td>
                      {row.map((v, j) => (
                        <td key={j} className="px-2 py-1.5">
                          <input type="number" min={0} value={v}
                            onChange={e => updateCell(m, i, j, +e.target.value)}
                            className={cellCls}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Available */}
      <div className="section-card">
        <h4 className="text-sm font-semibold mb-3">Available Resources</h4>
        <div className="flex flex-wrap gap-4">
          {input.available.map((v, j) => (
            <label key={j} className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium">R{j}</span>
              <input type="number" min={0} value={v}
                onChange={e => updateAvail(j, +e.target.value)}
                className={cellCls}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Need matrix */}
      <div className="section-card">
        <h4 className="text-sm font-semibold mb-3">Need Matrix (Max − Allocation)</h4>
        <div className="overflow-x-auto">
          <table className="text-xs border border-border rounded-lg overflow-hidden">
            <thead className="bg-muted">
              <tr>
                <th className="px-2 py-2 text-left text-muted-foreground">Proc</th>
                {Array.from({ length: input.m }, (_, j) => (
                  <th key={j} className="px-2 py-2 text-muted-foreground">R{j}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {input.allocation.map((row, i) => (
                <tr key={i} className="hover:bg-muted/40">
                  <td className="px-2 py-1.5 font-mono font-bold">P{i}</td>
                  {row.map((v, j) => (
                    <td key={j} className="px-2 py-1.5 text-center font-mono">
                      {input.max[i][j] - v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Walkthrough */}
      <div className="section-card">
        <h4 className="text-sm font-semibold mb-2">Algorithm Walkthrough</h4>
        <div className="text-xs text-muted-foreground space-y-0.5 mb-4 p-3 bg-muted/30 rounded-lg">
          <p><span className="font-semibold text-foreground">How Banker&apos;s Algorithm works:</span></p>
          <p>1. Compute <span className="font-mono">Need = Max − Allocation</span> for each process.</p>
          <p>2. Initialize <span className="font-mono">Work = Available</span> (resources the system can hand out right now).</p>
          <p>3. Find any unfinished process P<sub>i</sub> where <span className="font-mono">Need[i] ≤ Work</span>.</p>
          <p className="pl-3">— Found: pretend P<sub>i</sub> finishes → <span className="font-mono">Work = Work + Allocation[i]</span>. Add P<sub>i</sub> to safe sequence.</p>
          <p className="pl-3">— Not found: <span className="font-bold text-destructive">UNSAFE</span> (deadlock possible).</p>
          <p>4. Repeat until all processes finish (<span className="font-bold text-success">SAFE</span>) or stuck.</p>
        </div>

        <div className="space-y-2">
          {result.steps.map(step => (
            <div
              key={step.round}
              className={`p-3 rounded-xl border text-xs font-mono space-y-1.5
                ${step.selected
                  ? "bg-success-subtle border-success/40"
                  : "bg-destructive-subtle border-destructive/30"}`}
            >
              <div className="flex items-center gap-2 font-sans">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white
                  ${step.selected ? "bg-success" : "bg-destructive"}`}>
                  {step.round}
                </span>
                <span className="font-semibold text-sm">Round {step.round}</span>
              </div>
              <p>Work = {vec(step.work)}</p>
              {step.skippedProcesses.length > 0 && (
                <div className="space-y-0.5 text-muted-foreground">
                  {step.skippedProcesses.map(s => (
                    <p key={s.pid}>
                      <span className="text-destructive">✗</span> P{s.pid}: Need={vec(s.need)} → <span className="text-destructive">{s.reason}</span>
                    </p>
                  ))}
                </div>
              )}
              {step.selected ? (
                <div className="space-y-0.5">
                  <p><span className="text-success">✓</span> P{step.process}: Need={vec(step.need)} ≤ Work={vec(step.work)} → <span className="text-success font-sans font-semibold">can run</span></p>
                  <p>P{step.process} finishes → releases Allocation[{step.process}]={vec(input.allocation[step.process])}</p>
                  <p>Work = {vec(step.work)} + {vec(input.allocation[step.process])} = <span className="font-semibold text-foreground">{vec(step.workAfter)}</span></p>
                </div>
              ) : (
                <p className="text-destructive font-sans font-semibold">No process can proceed — UNSAFE!</p>
              )}
            </div>
          ))}
        </div>

        {result.safe && (
          <p className="mt-3 text-sm font-semibold text-success">
            All processes finished. Safe sequence: {result.sequence.map(i => `P${i}`).join(" → ")}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────
export default function DeadlockPage() {
  const [tab, setTab] = useState<"rag" | "bankers">("rag");
  return (
    <div className="module-page">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={20} className="text-destructive" />
          <h1 className="text-2xl font-bold">Deadlock Analyzer</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Detect deadlock via Resource Allocation Graphs or verify safety with Banker&apos;s Algorithm.
        </p>
      </div>

      <Tabs
        tabs={[
          { id: "rag",     label: "Resource Allocation Graph" },
          { id: "bankers", label: "Banker's Algorithm" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />

      {tab === "rag" ? <RAGTab /> : <BankersTab />}
    </div>
  );
}
