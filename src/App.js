import { useState, useCallback, useEffect } from "react";

// ── SM-2 ─────────────────────────────────────────────────────────────────────
function sm2(card, quality) {
  let { easeFactor, interval, repetitions } = card;
  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions++;
  } else { repetitions = 0; interval = 1; }
  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  return { ...card, easeFactor, interval, repetitions, dueDate: Date.now() + interval * 86400000 };
}

function makeCard(front, back, category) {
  return {
    id: Date.now() + Math.random(),
    front, back,
    category: category || "Other",
    interval: 1, easeFactor: 2.5, dueDate: Date.now(), repetitions: 0
  };
}

function stripHtml(html) {
  const d = document.createElement("div");
  d.innerHTML = html;
  return (d.textContent || d.innerText || "").replace(/\s+/g, " ").trim();
}

const CATEGORIES = ["Science","History","Literature","Fine Arts","Geography","Religion","Mythology","Philosophy","Social Science","Other"];

const SEED_DECKS = {
  "Python Basics": [
    makeCard("Name the concept where a named container stores a value that can be reused throughout a program.", "Variable", "Other"),
    makeCard("Name the Python function that returns the number of items in a list or string.", "len()", "Other"),
    makeCard("Name the Python data structure that stores ordered, mutable items in square brackets.", "List", "Other"),
    makeCard("Name the anonymous one-line function in Python defined with a keyword instead of 'def'.", "Lambda", "Other"),
    makeCard("Name the Python library built on C arrays that makes numerical computing significantly faster.", "NumPy", "Other"),
    makeCard("Name the NumPy function used to compute the inverse of a square matrix.", "np.linalg.inv()", "Other"),
    makeCard("Name the algorithm that finds a matrix inverse by augmenting it with an identity matrix and row-reducing.", "Gauss-Jordan Elimination", "Other"),
    makeCard("Name the Python data structure that stores key-value pairs in curly braces.", "Dictionary", "Other"),
    makeCard("Name the Python library that provides DataFrame objects for data analysis, similar to a spreadsheet.", "Pandas", "Other"),
    makeCard("Name the Python library built on Matplotlib that creates polished statistical charts with less code.", "Seaborn", "Other"),
  ],
  "Quizbowl": [],
};

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  app: { minHeight: "100vh", minHeight: "100dvh", background: "#0c0c10", color: "#e4e0d8", fontFamily: "'Source Serif 4', Georgia, serif", display: "flex", flexDirection: "column" },
  header: { borderBottom: "1px solid #252535", padding: "14px 28px", paddingTop: "max(14px, env(safe-area-inset-top))", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#13131c", flexWrap: "wrap", gap: "10px", position: "sticky", top: 0, zIndex: 100 },
  logo: { fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "21px", letterSpacing: "3px", color: "#c9a96e", cursor: "pointer" },
  nav: { display: "flex", gap: "6px", flexWrap: "wrap" },
  nb: (a) => ({ background: a ? "#c9a96e" : "transparent", color: a ? "#0c0c10" : "#6a6880", border: "1px solid " + (a ? "#c9a96e" : "#252535"), borderRadius: "6px", padding: "6px 14px", cursor: "pointer", fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "'Source Serif 4', Georgia, serif", transition: "all 0.2s" }),
  main: { flex: 1, maxWidth: "860px", margin: "0 auto", padding: "36px 24px 80px", width: "100%", boxSizing: "border-box" },
  title: { fontFamily: "'Playfair Display', serif", fontSize: "30px", fontWeight: 700, color: "#c9a96e", marginBottom: "6px" },
  sub: { color: "#6a6880", fontSize: "13px", marginBottom: "32px", fontStyle: "italic" },
  deckGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px", marginBottom: "32px" },
  deckCard: (due) => ({ background: "#1a1a26", border: "1px solid " + (due ? "#c9a96e44" : "#252535"), borderRadius: "14px", padding: "20px", cursor: due ? "pointer" : "default", transition: "all 0.2s" }),
  newDeckCard: { background: "transparent", border: "1px dashed #252535", borderRadius: "14px", padding: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6a6880", fontSize: "13px", minHeight: "100px" },
  badge: { display: "inline-block", marginTop: "8px", background: "#c9a96e", color: "#0c0c10", borderRadius: "20px", padding: "2px 10px", fontSize: "11px", fontWeight: 700 },
  flashcard: (flipped) => ({ width: "100%", maxWidth: "600px", minHeight: "260px", background: "#1a1a26", border: "1px solid " + (flipped ? "#c9a96e66" : "#252535"), borderRadius: "18px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "44px 40px", cursor: flipped ? "default" : "pointer", textAlign: "center", position: "relative", transition: "all 0.3s", userSelect: "none" }),
  cardLabel: { position: "absolute", top: "14px", left: "18px", fontSize: "10px", color: "#6a6880", letterSpacing: "2px", textTransform: "uppercase" },
  cardCat: { position: "absolute", top: "14px", right: "18px", fontSize: "10px", color: "#c9a96e66" },
  cardHint: { position: "absolute", bottom: "14px", fontSize: "11px", color: "#333" },
  cardText: (answer) => ({ fontSize: answer ? "26px" : "19px", lineHeight: 1.75, color: answer ? "#c9a96e" : "#e4e0d8", fontWeight: answer ? 700 : 300, fontFamily: answer ? "'Playfair Display', serif" : "'Source Serif 4', Georgia, serif" }),
  ratingRow: { display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" },
  rb: (c) => ({ background: c, border: "none", borderRadius: "8px", padding: "14px 20px", color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: 700, fontFamily: "'Source Serif 4', Georgia, serif" }),
  flipBtn: { background: "#c9a96e", color: "#0c0c10", border: "none", borderRadius: "10px", padding: "13px 34px", cursor: "pointer", fontSize: "15px", fontWeight: 700, fontFamily: "'Source Serif 4', Georgia, serif" },
  btn: { background: "#c9a96e", color: "#0c0c10", border: "none", borderRadius: "8px", padding: "11px 22px", cursor: "pointer", fontSize: "13px", fontWeight: 700, fontFamily: "'Source Serif 4', Georgia, serif" },
  btnSm: { background: "transparent", color: "#c9a96e", border: "1px solid #c9a96e44", borderRadius: "6px", padding: "8px 14px", cursor: "pointer", fontSize: "12px", fontFamily: "'Source Serif 4', Georgia, serif" },
  btnDanger: { background: "#200a0a", color: "#e05555", border: "1px solid #5a2a2a", borderRadius: "6px", padding: "5px 12px", cursor: "pointer", fontSize: "11px", fontFamily: "'Source Serif 4', Georgia, serif" },
  input: { width: "100%", background: "#1a1a26", border: "1px solid #252535", borderRadius: "8px", padding: "11px 14px", color: "#e4e0d8", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "'Source Serif 4', Georgia, serif" },
  textarea: { width: "100%", background: "#1a1a26", border: "1px solid #252535", borderRadius: "8px", padding: "11px 14px", color: "#e4e0d8", fontSize: "14px", outline: "none", resize: "vertical", minHeight: "80px", boxSizing: "border-box", fontFamily: "'Source Serif 4', Georgia, serif" },
  select: { width: "100%", background: "#1a1a26", border: "1px solid #252535", borderRadius: "8px", padding: "11px 14px", color: "#e4e0d8", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "'Source Serif 4', Georgia, serif" },
  label: { display: "block", fontSize: "10px", color: "#6a6880", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "7px" },
  section: { marginBottom: "22px" },
  doneBox: { textAlign: "center", background: "#1a1a26", border: "1px solid #252535", borderRadius: "18px", padding: "52px 40px", maxWidth: "420px", margin: "48px auto" },
  catTag: (sel) => ({ background: sel ? "#c9a96e22" : "#1a1a26", border: "1px solid " + (sel ? "#c9a96e" : "#252535"), borderRadius: "20px", padding: "5px 14px", fontSize: "11px", color: sel ? "#c9a96e" : "#6a6880", cursor: "pointer", fontFamily: "'Source Serif 4', Georgia, serif", transition: "all 0.2s" }),
  statusBox: (type) => ({ marginTop: "16px", padding: "13px 16px", borderRadius: "10px", fontSize: "13px", background: type === "success" ? "#0a2010" : type === "error" ? "#200a0a" : "#1a1a26", border: "1px solid " + (type === "success" ? "#27ae6055" : type === "error" ? "#e0555555" : "#252535"), color: type === "success" ? "#2ecc71" : type === "error" ? "#e05555" : "#9a96a8" }),
  fetchCard: { background: "#1a1a26", border: "1px solid #252535", borderRadius: "14px", padding: "26px", marginBottom: "22px" },
  tipBox: { background: "#13131c", border: "1px solid #c9a96e22", borderRadius: "12px", padding: "18px 22px" },
  progressWrap: { width: "100%", maxWidth: "600px", height: "3px", background: "#252535", borderRadius: "2px", overflow: "hidden" },
  progressBar: (pct) => ({ height: "100%", width: pct + "%", background: "#c9a96e", borderRadius: "2px", transition: "width 0.4s ease" }),
};

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [decks, setDecks] = useState(() => {
    try {
      const saved = localStorage.getItem("ankipy_decks");
      return saved ? JSON.parse(saved) : SEED_DECKS;
    } catch { return SEED_DECKS; }
  });

  const [view, setView] = useState("home");
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [newCard, setNewCard] = useState({ front: "", back: "", category: "Other" });
  const [addToDeck, setAddToDeck] = useState("Quizbowl");
  const [newDeckName, setNewDeckName] = useState("");
  const [showNewDeck, setShowNewDeck] = useState(false);
  const [fetchCat, setFetchCat] = useState("Science");
  const [fetchCount, setFetchCount] = useState(20);
  const [fetchDeck, setFetchDeck] = useState("Quizbowl");
  const [fetchDifficulty, setFetchDifficulty] = useState("novice");
  const [fetchStatus, setFetchStatus] = useState(null);
  const [fetching, setFetching] = useState(false);

  // Save to localStorage whenever decks change
  useEffect(() => {
    try { localStorage.setItem("ankipy_decks", JSON.stringify(decks)); } catch {}
  }, [decks]);

  const deckNames = Object.keys(decks);
  const getDue = (name) => (decks[name] || []).filter(c => c.dueDate <= Date.now());

  // ── Study ──────────────────────────────────────────────────────────────────
  const startStudy = (name) => {
    const due = getDue(name);
    if (!due.length) return;
    setQueue([...due].sort(() => Math.random() - 0.5));
    setIdx(0); setFlipped(false); setCorrect(0);
    setSelectedDeck(name); setView("study");
  };

  const rateCard = (quality) => {
    const card = queue[idx];
    const updated = sm2(card, quality);
    setDecks(prev => ({ ...prev, [selectedDeck]: prev[selectedDeck].map(c => c.id === card.id ? updated : c) }));
    if (quality >= 3) setCorrect(c => c + 1);
    if (idx + 1 < queue.length) { setIdx(i => i + 1); setFlipped(false); }
    else setView("done");
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const DIFFICULTY_MAP = { novice: "1,2", intermediate: "3,4", hard: "5,6,7" };

  const fetchCards = useCallback(async () => {
    setFetching(true);
    setFetchStatus({ type: "loading", msg: `Fetching ${fetchCount} ${fetchCat} bonus questions...` });
    try {
      const diffs = DIFFICULTY_MAP[fetchDifficulty] || "1,2";
      const qbUrl = `/api/qbreader?endpoint=bonus&difficulties=${diffs}&number=${fetchCount}&categories=${encodeURIComponent(fetchCat)}&standardOnly=true`;
      const res = await fetch(qbUrl);
      if (!res.ok) throw new Error(`qbreader returned HTTP ${res.status}`);
      const data = await res.json();
      const bonuses = data.bonuses || [];
      if (!bonuses.length) throw new Error(`No bonuses found for "${fetchCat}" — try Science or History`);

      const existing = new Set((decks[fetchDeck] || []).map(c => c.front));
      const newCards = [];

      bonuses.forEach(b => {
        const leadin = stripHtml(b.leadin_sanitized || b.leadin || "").replace(/\[.*?\]/g, "").trim();
        const parts = b.parts_sanitized || b.parts || [];
        const answers = b.answers_sanitized || b.answers || [];
        const subcat = b.subcategory || fetchCat;

        parts.forEach((part, i) => {
          const clue = stripHtml(part).replace(/\[.*?\]/g, "").trim();
          const rawAns = stripHtml(answers[i] || "").replace(/\[.*?\]/g, "").replace(/\(.*?\)/g, "").trim();
          const answer = rawAns.split("\n")[0].trim();

          // Build question: leadin gives context, part is the specific clue
          const question = leadin
            ? `${leadin} — ${clue}`
            : clue;

          if (question && answer && !existing.has(question)) {
            newCards.push(makeCard(question, answer, subcat));
          }
        });
      });

      setDecks(prev => ({ ...prev, [fetchDeck]: [...(prev[fetchDeck] || []), ...newCards] }));
      const skipped = (bonuses.length * 3) - newCards.length;
      setFetchStatus({ type: "success", msg: `✓ Added ${newCards.length} card${newCards.length !== 1 ? "s" : ""} to "${fetchDeck}"!${skipped > 0 ? ` (${skipped} duplicates skipped)` : ""}` });
    } catch (err) {
      setFetchStatus({ type: "error", msg: "✗ " + err.message });
    }
    setFetching(false);
  }, [fetchCat, fetchCount, fetchDeck, fetchDifficulty, decks]);
  // ── Add card ───────────────────────────────────────────────────────────────
  const addCard = () => {
    if (!newCard.front.trim() || !newCard.back.trim()) return;
    setDecks(prev => ({ ...prev, [addToDeck]: [...(prev[addToDeck] || []), makeCard(newCard.front, newCard.back, newCard.category)] }));
    setNewCard({ front: "", back: "", category: "Other" });
  };

  const createDeck = () => {
    if (!newDeckName.trim() || decks[newDeckName]) return;
    setDecks(prev => ({ ...prev, [newDeckName]: [] }));
    setNewDeckName(""); setShowNewDeck(false);
  };

  const deleteCard = (deckName, id) =>
    setDecks(prev => ({ ...prev, [deckName]: prev[deckName].filter(c => c.id !== id) }));

  const card = queue[idx];
  const pct = queue.length ? (idx / queue.length) * 100 : 0;

  const NavBar = ({ current }) => (
    <div style={S.header}>
      <div style={S.logo} onClick={() => setView("home")}>ANKIPY</div>
      <div style={S.nav}>
        {["home","fetch","add","manage"].map(v =>
          <button key={v} style={S.nb(current === v)} onClick={() => setView(v)}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        )}
      </div>
    </div>
  );

  // ── Study ──────────────────────────────────────────────────────────────────
  if (view === "study" && card) return (
    <div style={S.app}>
      <div style={S.header}>
        <div style={S.logo}>ANKIPY</div>
        <button style={S.nb(false)} onClick={() => setView("home")}>← Back</button>
      </div>
      <div style={S.main}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "22px", paddingTop: "10px" }}>
          <div style={{ fontSize: "12px", color: "#6a6880", letterSpacing: "1px" }}>{idx + 1} / {queue.length} — {selectedDeck}</div>
          <div style={S.progressWrap}><div style={S.progressBar(pct)} /></div>
          <div style={S.flashcard(flipped)} onClick={!flipped ? () => setFlipped(true) : undefined}>
            <span style={S.cardLabel}>{flipped ? "Answer" : "Question"}</span>
            {card.category && <span style={S.cardCat}>{card.category}</span>}
            <div style={S.cardText(flipped)}>{flipped ? card.back : card.front}</div>
            {!flipped && <span style={S.cardHint}>click to reveal</span>}
          </div>
          {!flipped
            ? <button style={S.flipBtn} onClick={() => setFlipped(true)}>Show Answer</button>
            : <div style={S.ratingRow}>
                <button style={S.rb("#e74c3c")} onClick={() => rateCard(0)}>😵 Again</button>
                <button style={S.rb("#e67e22")} onClick={() => rateCard(2)}>😬 Hard</button>
                <button style={S.rb("#27ae60")} onClick={() => rateCard(4)}>😊 Good</button>
                <button style={S.rb("#3498db")} onClick={() => rateCard(5)}>🚀 Easy</button>
              </div>
          }
        </div>
      </div>
    </div>
  );

  // ── Done ───────────────────────────────────────────────────────────────────
  if (view === "done") return (
    <div style={S.app}>
      <NavBar current="home" />
      <div style={S.main}>
        <div style={S.doneBox}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", color: "#c9a96e", marginBottom: "8px" }}>Session Complete!</div>
          <div style={{ fontSize: "40px", fontWeight: 700, marginBottom: "6px" }}>{correct} / {queue.length}</div>
          <div style={{ color: "#6a6880", fontSize: "13px", fontStyle: "italic", marginBottom: "28px" }}>Cards rescheduled with SM-2. Come back tomorrow!</div>
          <button style={S.btn} onClick={() => setView("home")}>Back to Decks</button>
        </div>
      </div>
    </div>
  );

  // ── Fetch ──────────────────────────────────────────────────────────────────
  if (view === "fetch") return (
    <div style={S.app}>
      <NavBar current="fetch" />
      <div style={S.main}>
        <div style={S.title}>Fetch Quizbowl Cards</div>
        <div style={S.sub}>Pull novice questions from qbreader.org — AI rewrites each into a clean flashcard</div>
        <div style={S.fetchCard}>
          <div style={{ fontSize: "13px", color: "#9a96a8", marginBottom: "20px", lineHeight: 1.7, fontStyle: "italic" }}>
            Fetches bonus questions from qbreader.org. Each bonus has 3 parts — each becomes its own flashcard with the leadin as context.
          </div>
          <div style={S.section}>
            <label style={S.label}>Category</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {CATEGORIES.map(c => (
                <div key={c} style={S.catTag(fetchCat === c)} onClick={() => setFetchCat(c)}>{c}</div>
              ))}
            </div>
          </div>
          <div style={S.section}>
            <label style={S.label}>Difficulty</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[
                { key: "novice", label: "Novice", sub: "Levels 1-2" },
                { key: "intermediate", label: "Intermediate", sub: "Levels 3-4" },
                { key: "hard", label: "Hard", sub: "Levels 5-7" },
              ].map(d => (
                <div key={d.key} onClick={() => setFetchDifficulty(d.key)}
                  style={{ ...S.catTag(fetchDifficulty === d.key), padding: "8px 18px", textAlign: "center" }}>
                  <div style={{ fontWeight: 600 }}>{d.label}</div>
                  <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "2px" }}>{d.sub}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={S.section}>
              <label style={S.label}>Number of Bonuses</label>
              <select style={S.select} value={fetchCount} onChange={e => setFetchCount(Number(e.target.value))}>
                {[5, 10, 20, 30].map(n => <option key={n} value={n}>{n} bonuses ({n*3} cards)</option>)}
              </select>
            </div>
            <div style={S.section}>
              <label style={S.label}>Add to Deck</label>
              <select style={S.select} value={fetchDeck} onChange={e => setFetchDeck(e.target.value)}>
                {deckNames.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>
        <button style={{ ...S.btn, fontSize: "15px", padding: "13px 28px", opacity: fetching ? 0.6 : 1 }}
          onClick={fetchCards} disabled={fetching}>
          {fetching ? "⏳ Fetching..." : `⬇ Fetch ${fetchCount} ${fetchDifficulty} ${fetchCat} bonuses`}
        </button>
        {fetchStatus && <div style={S.statusBox(fetchStatus.type)}>{fetchStatus.msg}</div>}
      </div>
    </div>
  );

  // ── Add ────────────────────────────────────────────────────────────────────
  if (view === "add") return (
    <div style={S.app}>
      <NavBar current="add" />
      <div style={S.main}>
        <div style={S.title}>Add Cards</div>
        <div style={S.sub}>Manually create flashcards for any deck</div>
        <div style={S.section}>
          <label style={S.label}>Deck</label>
          <select style={S.select} value={addToDeck} onChange={e => setAddToDeck(e.target.value)}>
            {deckNames.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div style={S.section}>
          <label style={S.label}>Front — Question</label>
          <textarea style={S.textarea} value={newCard.front}
            onChange={e => setNewCard(n => ({ ...n, front: e.target.value }))}
            placeholder="e.g. Name the scientist who discovered penicillin." />
        </div>
        <div style={S.section}>
          <label style={S.label}>Back — Answer</label>
          <textarea style={S.textarea} value={newCard.back}
            onChange={e => setNewCard(n => ({ ...n, back: e.target.value }))}
            placeholder="e.g. Alexander Fleming" />
        </div>
        <div style={S.section}>
          <label style={S.label}>Category</label>
          <select style={S.select} value={newCard.category}
            onChange={e => setNewCard(n => ({ ...n, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button style={S.btn} onClick={addCard}>Add Card</button>
        <div style={{ borderTop: "1px solid #252535", marginTop: "32px", paddingTop: "28px" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "17px", color: "#c9a96e", marginBottom: "14px" }}>Create New Deck</div>
          {showNewDeck
            ? <div style={{ display: "flex", gap: "10px" }}>
                <input style={{ ...S.input, flex: 1 }} value={newDeckName}
                  onChange={e => setNewDeckName(e.target.value)} placeholder="Deck name..." />
                <button style={S.btn} onClick={createDeck}>Create</button>
                <button style={S.btnSm} onClick={() => setShowNewDeck(false)}>Cancel</button>
              </div>
            : <button style={S.btnSm} onClick={() => setShowNewDeck(true)}>+ New Deck</button>
          }
        </div>
      </div>
    </div>
  );

  // ── Manage ─────────────────────────────────────────────────────────────────
  if (view === "manage") return (
    <div style={S.app}>
      <NavBar current="manage" />
      <div style={S.main}>
        <div style={S.title}>Manage Cards</div>
        <div style={S.sub}>Browse and delete cards from any deck</div>
        {deckNames.map(name => (
          <div key={name} style={{ marginBottom: "30px" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "17px", color: "#c9a96e" }}>
              {name} <span style={{ color: "#444", fontSize: "13px", fontWeight: "normal" }}>({decks[name].length} cards)</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
              {decks[name].slice(0, 30).map(c => (
                <div key={c.id} style={{ background: "#1a1a26", border: "1px solid #252535", borderRadius: "8px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", color: "#ddd" }}>{c.front.slice(0, 100)}{c.front.length > 100 ? "…" : ""}</div>
                    <div style={{ fontSize: "11px", color: "#6a6880", marginTop: "3px" }}>
                      {c.back.slice(0, 60)}{c.back.length > 60 ? "…" : ""}
                      {c.category && <span style={{ color: "#c9a96e44", marginLeft: "6px" }}>· {c.category}</span>}
                    </div>
                  </div>
                  <button style={S.btnDanger} onClick={() => deleteCard(name, c.id)}>Delete</button>
                </div>
              ))}
              {decks[name].length > 30 && <div style={{ fontSize: "12px", color: "#444", padding: "6px" }}>…and {decks[name].length - 30} more</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Home ───────────────────────────────────────────────────────────────────
  return (
    <div style={S.app}>
      <NavBar current="home" />
      <div style={S.main}>
        <div style={S.title}>Your Decks</div>
        <div style={S.sub}>Spaced repetition via SM-2 · Quizbowl cards from qbreader.org</div>
        <div style={S.deckGrid}>
          {deckNames.map(name => {
            const due = getDue(name).length;
            return (
              <div key={name} style={S.deckCard(due)} onClick={() => due > 0 && startStudy(name)}>
                <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "6px" }}>{name}</div>
                <div style={{ fontSize: "12px", color: "#6a6880" }}>{decks[name].length} cards total</div>
                {due > 0
                  ? <div style={S.badge}>{due} due now</div>
                  : <div style={{ fontSize: "12px", color: "#2ecc71", marginTop: "8px" }}>✓ All caught up</div>}
              </div>
            );
          })}
          <div style={S.newDeckCard} onClick={() => { setView("add"); setShowNewDeck(true); }}>+ New Deck</div>
        </div>
        <div style={S.tipBox}>
          <div style={{ color: "#c9a96e", fontWeight: 600, marginBottom: "6px", fontSize: "13px" }}>💡 Tip</div>
          <div style={{ color: "#6a6880", fontSize: "12px", lineHeight: 1.7 }}>
            Go to <b style={{ color: "#9a96a8" }}>Fetch</b> to pull quizbowl questions from qbreader.org.
            AI rewrites each one into a clear "Name the X who did Y" question with the answer on the back.
          </div>
        </div>
      </div>
    </div>
  );
}
