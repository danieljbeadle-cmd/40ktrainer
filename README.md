# ⚔️ Codex Trainer — Warhammer 40,000

A Duolingo-style trainer for Warhammer 40k 10th Edition.

## Contents

- **Core Rules** — Flashcard decks for every phase + Common Mistakes quiz
- **Factions** — Adepta Sororitas, Orks, Necrons, Tyranids, Dark Angels
  - Detachments, stratagems, unit datasheets, stat recall quizzes
- **Combat Trainer** — Wound rolls, AP/saves, hit probability, edge cases, dice calculator
- **Weapon Keywords** — Match modifier descriptions to keyword names (Lethal Hits, Torrent, FNP, Blast, Melta, Precision & more)
- **Did You Know?** — 18 tips on synergies, anti-synergies and rules surprises

---

## 🚀 Deploy to Vercel (free, ~5 mins)

**Step 1 — Install Node.js** (if you haven't already)
Download the LTS version from https://nodejs.org and run the installer.

**Step 2 — Build the project**
Open a terminal, navigate to this folder, then run:
```
npm install
npm run build
```
This creates a `dist/` folder.

**Step 3 — Deploy**
- Go to https://vercel.com and create a free account
- From the dashboard, drag and drop the `dist/` folder
- You'll get a live public URL immediately (e.g. `codex-trainer-abc.vercel.app`)

---

## 🌐 Deploy to Netlify (also free)

1. Run `npm install && npm run build`
2. Go to https://app.netlify.com/drop
3. Drag and drop the `dist/` folder — done

---

## 💻 Run locally

```bash
npm install
npm run dev
```
Open http://localhost:5173

---

## 📁 Structure

```
codex-trainer/
├── index.html          # Entry point (fonts loaded here)
├── vite.config.js      # Build config
├── package.json
└── src/
    ├── main.jsx        # React entry
    ├── index.css       # Global styles
    └── App.jsx         # Full app (~1380 lines)
```

No backend needed — runs entirely in the browser.
