import { useState, useRef, useCallback, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// ─── API base (muda para seu endereço se necessário) ───────────────────────
const API = "http://localhost:5000/api";

// ─── Dados locais de fallback (iguais ao backend) ──────────────────────────
const ITEMS_FALLBACK = [
  { name: "Saco de Dormir", icon: "🛌", weight: 15, score: 15 },
  { name: "Corda", icon: "🪢", weight: 3, score: 7 },
  { name: "Canivete", icon: "🔪", weight: 2, score: 10 },
  { name: "Tocha", icon: "🔦", weight: 5, score: 5 },
  { name: "Garrafa", icon: "🍶", weight: 9, score: 8 },
  { name: "Comida", icon: "🥫", weight: 20, score: 17 },
];
const CAPACITY = 30;

// ─── Estilos globais injetados ──────────────────────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Syne', sans-serif;
    background: #07090f;
    color: #e8eaf0;
    min-height: 100vh;
    overflow-x: hidden;
  }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1e2a3a; border-radius: 4px; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(56,189,248,0); }
    50%       { box-shadow: 0 0 24px 4px rgba(56,189,248,.25); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .fade-up { animation: fadeUp .5s ease both; }
  .fade-up-1 { animation: fadeUp .5s .1s ease both; }
  .fade-up-2 { animation: fadeUp .5s .2s ease both; }
  .fade-up-3 { animation: fadeUp .5s .3s ease both; }
`;

// ─── Paleta ─────────────────────────────────────────────────────────────────
const c = {
  bg: "#07090f",
  surface: "#0d1117",
  card: "#111827",
  border: "#1e2d3e",
  accent: "#38bdf8",   // sky-400
  green: "#34d399",   // emerald-400
  orange: "#fb923c",
  red: "#f87171",
  muted: "#4b6175",
  dim: "#94a3b8",
  text: "#e8eaf0",
};

// ─── Componentes base ────────────────────────────────────────────────────────

const Mono = ({ children, style = {}, ...p }) => (
  <span style={{ fontFamily: "'JetBrains Mono', monospace", ...style }} {...p}>
    {children}
  </span>
);

const Card = ({ children, style = {}, className = "" }) => (
  <div
    className={className}
    style={{
      background: c.card,
      border: `1px solid ${c.border}`,
      borderRadius: 14,
      padding: 24,
      ...style,
    }}
  >
    {children}
  </div>
);

const CardTitle = ({ icon, children }) => (
  <div style={{
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: c.accent,
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    gap: 8,
  }}>
    <span style={{ fontSize: 15 }}>{icon}</span>
    {children}
  </div>
);

// ─── Slider customizado ──────────────────────────────────────────────────────
const Slider = ({ label, id, min, max, step, value, onChange, format }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 8,
      alignItems: "baseline",
    }}>
      <label style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        letterSpacing: "0.1em",
        color: c.muted,
        textTransform: "uppercase",
      }}>
        {label}
      </label>
      <Mono style={{ fontSize: 14, color: c.accent, fontWeight: 500 }}>
        {format ? format(value) : value}
      </Mono>
    </div>
    <div style={{ position: "relative" }}>
      <input
        type="range"
        id={id}
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          WebkitAppearance: "none",
          height: 4,
          background: `linear-gradient(to right, ${c.accent} 0%, ${c.accent} ${((value - min) / (max - min)) * 100}%, #1e2d3e ${((value - min) / (max - min)) * 100}%, #1e2d3e 100%)`,
          borderRadius: 4,
          outline: "none",
          cursor: "pointer",
        }}
      />
    </div>
  </div>
);

// ─── Barra de capacidade ──────────────────────────────────────────────────────
const CapacityBar = ({ weight, capacity = CAPACITY }) => {
  const pct = Math.min((weight / capacity) * 100, 100);
  const over = weight > capacity;
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <Mono style={{ fontSize: 10, color: c.muted, letterSpacing: "0.08em" }}>CAPACIDADE</Mono>
        <Mono style={{ fontSize: 11, color: over ? c.red : c.green }}>
          {weight} / {capacity} kg {over ? "⚠ EXCEDIDO" : ""}
        </Mono>
      </div>
      <div style={{
        background: "#0d1117", borderRadius: 6, height: 8, overflow: "hidden",
        border: `1px solid ${c.border}`,
      }}>
        <div style={{
          height: "100%", borderRadius: 6,
          width: `${pct}%`,
          background: over
            ? c.red
            : `linear-gradient(90deg, ${c.green}, ${c.accent})`,
          transition: "width .6s cubic-bezier(.4,0,.2,1), background .3s",
        }} />
      </div>
    </div>
  );
};

// ─── Gene visual ──────────────────────────────────────────────────────────────
const Gene = ({ value, item, index }) => (
  <div style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  }}>
    <div style={{
      width: 48, height: 48,
      borderRadius: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 22,
      background: value
        ? "rgba(52,211,153,.12)"
        : "rgba(30,45,62,.3)",
      border: `1px solid ${value ? "rgba(52,211,153,.35)" : c.border}`,
      boxShadow: value ? "0 0 16px rgba(52,211,153,.15)" : "none",
      transition: "all .3s",
      position: "relative",
    }}>
      {item.icon}
      <div style={{
        position: "absolute",
        bottom: 2, right: 4,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        color: value ? c.green : c.muted,
        fontWeight: 700,
      }}>
        {value}
      </div>
    </div>
    <Mono style={{
      fontSize: 8,
      color: value ? c.green : c.muted,
      textAlign: "center",
      maxWidth: 48,
      lineHeight: 1.2,
    }}>
      {item.name.split(" ")[0]}
    </Mono>
  </div>
);

// ─── Custom Tooltip do gráfico ────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#111827",
      border: `1px solid ${c.border}`,
      borderRadius: 8,
      padding: "10px 14px",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
    }}>
      <div style={{ color: c.dim, marginBottom: 4 }}>Geração {label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  // Config do AG
  const [params, setParams] = useState({
    pop_size: 50,
    n_generations: 100,
    mutation_rate: 5,    // armazenado como %, convertido na chamada
    crossover_rate: 80,   // idem
    elite_n: 2,
  });

  const [items, setItems] = useState(ITEMS_FALLBACK);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [backendOk, setBackendOk] = useState(null); // null=verificando, true/false

  const resultRef = useRef(null);

  // Verifica conexão com backend
  useEffect(() => {
    fetch(`${API}/health`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => {
        setBackendOk(true);
        return fetch(`${API}/items`);
      })
      .then(r => r.json())
      .then(d => setItems(d.items))
      .catch(() => setBackendOk(false));
  }, []);

  const set = (key) => (val) => setParams(p => ({ ...p, [key]: val }));

  const runGA = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const body = {
      pop_size: params.pop_size,
      n_generations: params.n_generations,
      mutation_rate: params.mutation_rate / 100,
      crossover_rate: params.crossover_rate / 100,
      elite_n: params.elite_n,
    };

    try {
      const res = await fetch(`${API}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      setError("Não foi possível conectar ao backend. Verifique se o servidor Flask está rodando em localhost:5000.");
    } finally {
      setLoading(false);
    }
  }, [params]);

  // Thinning do histórico para o gráfico (máx 120 pontos)
  const chartData = result?.history
    ? (result.history.length <= 120
      ? result.history
      : result.history.filter((_, i) =>
        i === 0 ||
        i === result.history.length - 1 ||
        i % Math.ceil(result.history.length / 120) === 0
      ))
    : [];

  return (
    <>
      <style>{globalStyles}</style>
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: ${c.accent};
          cursor: pointer;
          box-shadow: 0 0 10px rgba(56,189,248,.5);
        }
        input[type=range]::-moz-range-thumb {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: ${c.accent};
          cursor: pointer;
          border: none;
        }
      `}</style>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* ── Header ── */}
        <header style={{
          padding: "52px 0 32px",
          borderBottom: `1px solid ${c.border}`,
          marginBottom: 40,
          display: "flex",
          alignItems: "flex-end",
          gap: 20,
          flexWrap: "wrap",
        }}>
          <div style={{ fontSize: 60, lineHeight: 1, filter: "drop-shadow(0 0 20px rgba(52,211,153,.4))" }}>
            🎒
          </div>
          <div>
            <h1 style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2.2rem, 6vw, 4rem)",
              lineHeight: 0.9,
              color: c.text,
              letterSpacing: "-0.02em",
            }}>
              Knapsack<br />
              <span style={{ color: c.accent }}>Genético</span>
            </h1>
            <p style={{ marginTop: 10, color: c.dim, fontSize: 13, fontWeight: 400 }}>
              Problema da Mochila resolvido com Algoritmo Genético · Python + React
            </p>
          </div>

          {/* Badge de conexão */}
          <div style={{ marginLeft: "auto" }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.1em",
              padding: "6px 12px",
              borderRadius: 6,
              border: `1px solid ${backendOk === false ? c.red : backendOk ? c.green : c.border}`,
              color: backendOk === false ? c.red : backendOk ? c.green : c.dim,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: backendOk === false ? c.red : backendOk ? c.green : c.muted,
                boxShadow: backendOk ? `0 0 6px ${c.green}` : "none",
              }} />
              {backendOk === null ? "VERIFICANDO..." : backendOk ? "BACKEND CONECTADO" : "BACKEND OFFLINE"}
            </div>
          </div>
        </header>

        {/* Aviso se backend offline */}
        {backendOk === false && (
          <div style={{
            background: "rgba(248,113,113,.08)",
            border: `1px solid rgba(248,113,113,.3)`,
            borderRadius: 10,
            padding: "14px 20px",
            marginBottom: 24,
            fontSize: 13,
            color: "#fca5a5",
            lineHeight: 1.6,
          }}>
            ⚠️ <strong>Backend não encontrado.</strong> Inicie o servidor Flask com:
            <Mono style={{ display: "block", marginTop: 8, background: "#0d1117", padding: "8px 12px", borderRadius: 6, fontSize: 12 }}>
              cd backend && pip install -r requirements.txt && python app.py
            </Mono>
          </div>
        )}

        {/* ── Grid principal ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 20,
          marginBottom: 20,
        }}>

          {/* Itens */}
          <Card className="fade-up">
            <CardTitle icon="📦">Itens Disponíveis</CardTitle>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["ITEM", "PESO", "PONTOS"].map(h => (
                    <th key={h} style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      letterSpacing: "0.12em",
                      color: c.muted,
                      textAlign: "left",
                      padding: "0 0 12px",
                      borderBottom: `1px solid ${c.border}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ padding: "11px 0", borderBottom: `1px solid rgba(30,45,62,.5)`, fontSize: 14 }}>
                      <span style={{ marginRight: 8 }}>{item.icon}</span>
                      <span style={{ fontWeight: 600 }}>{item.name}</span>
                    </td>
                    <td style={{ padding: "11px 0", borderBottom: `1px solid rgba(30,45,62,.5)` }}>
                      <span style={{
                        background: "rgba(251,146,60,.1)", color: c.orange,
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                        padding: "3px 8px", borderRadius: 5,
                      }}>{item.weight} kg</span>
                    </td>
                    <td style={{ padding: "11px 0", borderBottom: `1px solid rgba(30,45,62,.5)` }}>
                      <span style={{
                        background: "rgba(52,211,153,.1)", color: c.green,
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                        padding: "3px 8px", borderRadius: 5,
                      }}>+{item.score}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <CapacityBar weight={0} />
          </Card>

          {/* Configurações */}
          <Card className="fade-up-1">
            <CardTitle icon="⚙️">Configurações do AG</CardTitle>

            <Slider
              label="Tamanho da População"
              id="pop_size" min={10} max={200} step={10}
              value={params.pop_size}
              onChange={set("pop_size")}
            />
            <Slider
              label="Número de Gerações"
              id="n_generations" min={20} max={500} step={10}
              value={params.n_generations}
              onChange={set("n_generations")}
            />
            <Slider
              label="Taxa de Mutação"
              id="mutation_rate" min={1} max={30} step={1}
              value={params.mutation_rate}
              onChange={set("mutation_rate")}
              format={v => `${v}%`}
            />
            <Slider
              label="Taxa de Crossover"
              id="crossover_rate" min={50} max={100} step={5}
              value={params.crossover_rate}
              onChange={set("crossover_rate")}
              format={v => `${v}%`}
            />
            <Slider
              label="Elitismo — top N preservados"
              id="elite_n" min={0} max={10} step={1}
              value={params.elite_n}
              onChange={set("elite_n")}
            />

            <button
              onClick={runGA}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                border: "none",
                borderRadius: 10,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 15,
                letterSpacing: "0.1em",
                background: loading ? "#1e2d3e" : `linear-gradient(135deg, ${c.accent}, #818cf8)`,
                color: loading ? c.muted : "#07090f",
                marginTop: 8,
                transition: "all .2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              {loading
                ? (<><div style={{
                  width: 16, height: 16, border: `2px solid ${c.muted}`,
                  borderTopColor: c.accent,
                  borderRadius: "50%",
                  animation: "spin .8s linear infinite",
                }} /> EXECUTANDO...</>)
                : "▶ EXECUTAR ALGORITMO"
              }
            </button>

            {error && (
              <div style={{
                marginTop: 12, padding: "10px 14px",
                background: "rgba(248,113,113,.08)",
                border: `1px solid rgba(248,113,113,.25)`,
                borderRadius: 8, fontSize: 12, color: "#fca5a5", lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}
          </Card>
        </div>

        {/* ── Resultados ── */}
        {result && (
          <div ref={resultRef}>

            {/* Separador */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              margin: "40px 0 20px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, letterSpacing: "0.15em", color: c.muted,
            }}>
              RESULTADO
              <div style={{ flex: 1, height: 1, background: c.border }} />
              <Mono style={{ fontSize: 10, color: c.dim }}>
                {result.elapsed_seconds}s · pop={result.params.pop_size} · gen={result.params.n_generations}
              </Mono>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: 20, marginBottom: 20,
            }}>

              {/* Melhor cromossomo */}
              <Card className="fade-up">
                <CardTitle icon="🧬">Melhor Cromossomo</CardTitle>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                  {result.best_chromosome.map((g, i) => (
                    <Gene key={i} value={g} item={items[i]} index={i} />
                  ))}
                </div>

                <Mono style={{
                  display: "block",
                  fontSize: 20,
                  letterSpacing: "0.2em",
                  color: c.accent,
                  marginBottom: 20,
                  textAlign: "center",
                }}>
                  [{result.best_chromosome.join(" ")}]
                </Mono>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {[
                    { label: "PESO", value: `${result.best_weight} kg`, color: c.orange },
                    { label: "PONTUAÇÃO", value: result.best_score, color: c.green },
                    { label: "FITNESS", value: result.best_fitness, color: c.accent },
                  ].map(s => (
                    <div key={s.label} style={{
                      background: c.surface, border: `1px solid ${c.border}`,
                      borderRadius: 10, padding: "14px 10px", textAlign: "center",
                    }}>
                      <div style={{
                        fontFamily: "'Syne', sans-serif", fontWeight: 800,
                        fontSize: 26, color: s.color, lineHeight: 1,
                      }}>{s.value}</div>
                      <Mono style={{ fontSize: 9, color: c.muted, letterSpacing: "0.1em", marginTop: 4 }}>
                        {s.label}
                      </Mono>
                    </div>
                  ))}
                </div>

                <CapacityBar weight={result.best_weight} />

                {/* Itens selecionados */}
                <div style={{ marginTop: 16 }}>
                  <Mono style={{ fontSize: 9, color: c.muted, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>
                    ITENS SELECIONADOS
                  </Mono>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {result.selected_items.length === 0
                      ? <span style={{ fontSize: 12, color: c.muted }}>Nenhum item selecionado</span>
                      : result.selected_items.map((item, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 6,
                          background: "rgba(52,211,153,.07)",
                          border: "1px solid rgba(52,211,153,.2)",
                          borderRadius: 7, padding: "5px 10px", fontSize: 12,
                        }}>
                          {item.icon} <span style={{ fontWeight: 600 }}>{item.name}</span>
                          <Mono style={{ fontSize: 10, color: c.muted }}>
                            {item.weight}kg · +{item.score}
                          </Mono>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </Card>

              {/* Log de gerações */}
              <Card className="fade-up-1">
                <CardTitle icon="📋">Log de Gerações</CardTitle>
                <div style={{
                  maxHeight: 380,
                  overflowY: "auto",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  lineHeight: 1.8,
                }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["GEN", "BEST", "AVG", "PESO", "PTS"].map(h => (
                          <th key={h} style={{
                            fontSize: 9, letterSpacing: "0.1em", color: c.muted,
                            textAlign: "left", padding: "0 8px 8px 0",
                            borderBottom: `1px solid ${c.border}`,
                            position: "sticky", top: 0, background: c.card,
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.generation_log.map((row, i) => (
                        <tr key={i} style={{
                          borderBottom: `1px solid rgba(30,45,62,.4)`,
                          background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,.01)",
                        }}>
                          <td style={{ padding: "5px 8px 5px 0", color: c.dim }}>{row.generation}</td>
                          <td style={{ padding: "5px 8px 5px 0", color: c.accent, fontWeight: 500 }}>{row.best_fitness}</td>
                          <td style={{ padding: "5px 8px 5px 0", color: c.muted }}>{row.avg_fitness}</td>
                          <td style={{ padding: "5px 8px 5px 0", color: c.orange }}>{row.weight}kg</td>
                          <td style={{ padding: "5px 8px 5px 0", color: c.green }}>{row.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Gráfico de evolução */}
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, letterSpacing: "0.15em", color: c.muted,
              display: "flex", alignItems: "center", gap: 12,
              margin: "0 0 16px",
            }}>
              EVOLUÇÃO DO FITNESS
              <div style={{ flex: 1, height: 1, background: c.border }} />
            </div>

            <Card className="fade-up-2">
              <CardTitle icon="📈">Fitness por Geração</CardTitle>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.border} />
                  <XAxis
                    dataKey="generation"
                    stroke={c.muted}
                    tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: c.muted }}
                    label={{ value: "Geração", position: "insideBottom", offset: -2, fill: c.muted, fontSize: 10 }}
                  />
                  <YAxis
                    stroke={c.muted}
                    tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: c.muted }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="best_fitness"
                    name="Melhor Fitness"
                    stroke={c.green}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, fill: c.green }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_fitness"
                    name="Fitness Médio"
                    stroke={c.accent}
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{ r: 4, fill: c.accent }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

          </div>
        )}
      </div>
    </>
  );
}