#!/bin/bash
cat << 'EOF' > "eslint.config.js"
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
EOF
cat << 'EOF' > "extract_pdf.cjs"
const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('sample oneline.pdf');

pdf(dataBuffer).then(function (data) {
    console.log(data.text);
});
EOF
cat << 'EOF' > "extract_pdf.js"
import fs from 'fs';
import pdf from 'pdf-parse';

const dataBuffer = fs.readFileSync('sample oneline.pdf');

pdf(dataBuffer).then(function (data) {
    console.log(data.text);
});
EOF
cat << 'EOF' > "extract_pdf_debug.cjs"
// Polyfill for DOMMatrix
global.DOMMatrix = class DOMMatrix {
    constructor() {
        this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    }
};

const fs = require('fs');
const pdfLib = require('pdf-parse');

console.log('Type of pdfLib:', typeof pdfLib);
console.log('Keys:', Object.keys(pdfLib));
if (typeof pdfLib !== 'function') {
    if (pdfLib.default) {
        console.log('Has default export');
        const pdf = pdfLib.default;
        const dataBuffer = fs.readFileSync('sample oneline.pdf');
        pdf(dataBuffer).then(function (data) {
            console.log(data.text);
        }).catch(console.error);
    } else {
        console.log('No default export found');
    }
} else {
    const dataBuffer = fs.readFileSync('sample oneline.pdf');
    pdfLib(dataBuffer).then(function (data) {
        console.log(data.text);
    }).catch(console.error);
}
EOF
cat << 'EOF' > "extract_pdf_debug_2.cjs"
// Polyfill for DOMMatrix
global.DOMMatrix = class DOMMatrix {
    constructor() {
        this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    }
};

const fs = require('fs');
const pdfLib = require('pdf-parse');

console.log('Type of PDFParse:', typeof pdfLib.PDFParse);
if (typeof pdfLib.PDFParse === 'function') {
    console.log('Trying PDFParse function...');
    const dataBuffer = fs.readFileSync('sample oneline.pdf');
    try {
        // It might be a class or a function
        const result = pdfLib.PDFParse(dataBuffer);
        if (result && result.then) {
            result.then(data => console.log(data.text));
        } else {
            console.log('Result:', result);
        }
    } catch (e) {
        console.error('Error calling PDFParse:', e);
    }
}
EOF
cat << 'EOF' > "extract_pdf_poly.cjs"
// Polyfill for DOMMatrix
global.DOMMatrix = class DOMMatrix {
    constructor() {
        this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    }
};

const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('sample oneline.pdf');

pdf(dataBuffer).then(function (data) {
    console.log(data.text);
}).catch(err => {
    console.error(err);
});
EOF
cat << 'EOF' > "index.html"
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>scratch</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF
cat << 'EOF' > "package.json"
{
  "name": "scratch",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.554.0",
    "pdf-parse": "^1.1.1",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@tailwindcss/postcss": "^4.1.17",
    "@types/node": "^24.10.0",
    "@types/react": "^19.2.2",
    "@types/react-dom": "^19.2.2",
    "@vitejs/plugin-react": "^5.1.0",
    "autoprefixer": "^10.4.22",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.17",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.46.3",
    "vite": "^7.2.2"
  }
}
EOF
cat << 'EOF' > "parse_oneline.cjs"
const fs = require('fs');
const pdf = require('pdf-parse');

const parseOneLine = async () => {
    const dataBuffer = fs.readFileSync('sample oneline.pdf');
    const data = await pdf(dataBuffer);
    const text = data.text;

    // Simple heuristic parser
    const days = [];
    let currentDay = null;

    // Split text into lines for easier processing
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    let buffer = [];

    // Regex to find "END DAY X"
    const endDayRegex = /END DAY (\d+) — (.*?) — (.*?) Total Pages/i;

    // Regex to find Scene Start (INT/EXT)
    // Note: PDF text might merge INT/EXT with the location, e.g. "INTJOHN"
    const sceneStartRegex = /^(INT|EXT|I\/E)/;

    let sceneBuffer = [];

    // We'll iterate and try to group by Day
    // Since "END DAY" is at the end, we collect lines until we hit it.

    let currentScenes = [];

    // Fix slugline spacing (e.g. INTJOHN -> INT. JOHN or INT JOHN)
    // We'll just add a space after INT/EXT/I/E if followed immediately by a letter
    const fixSlugline = (slug) => {
        return slug.replace(/^(INT|EXT|I\/E)(?=[A-Z0-9])/, '$1 ');
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for End of Day
        const endDayMatch = line.match(endDayRegex);
        if (endDayMatch) {
            const dayNum = parseInt(endDayMatch[1]);
            const dateStr = endDayMatch[2];

            days.push({
                dayNumber: dayNum,
                date: dateStr,
                scenes: [...currentScenes],
                rawContent: sceneBuffer.join('\n')
            });

            currentScenes = [];
            sceneBuffer = [];
            continue;
        }

        sceneBuffer.push(line);

        // Try to identify scenes within the buffer
        // This is tricky with raw text, but let's try to find Sluglines
        if (sceneStartRegex.test(line)) {
            // This is likely a slugline.
            // The lines following it are Description, Cast, Scene #, etc.
            // Let's grab the next few lines as a "Scene Block"

            // Heuristic: 
            // Line 1: Slugline (e.g. INTJOHN...)
            // Line 2: Day/Night
            // Line 3: Description
            // Line 4: Cast
            // Line 5: Scene Number

            // We can look ahead if possible, or just store the index
            const slugline = fixSlugline(line);
            const timeOfDay = lines[i + 1] || '';
            const description = lines[i + 2] || '';
            const cast = lines[i + 3] || '';
            const sceneNum = lines[i + 4] || '';

            // Only add if it looks like a scene (has Day/Night)
            if (['Day', 'Night', 'Morning', 'Evening', 'D4N'].some(t => timeOfDay.includes(t))) {
                currentScenes.push({
                    slugline,
                    timeOfDay,
                    description,
                    cast,
                    sceneNum
                });
            }
        }
    }

    return days;
};

parseOneLine().then(days => {
    const outputPath = './src/data/schedule.json';
    // Ensure directory exists
    const dir = outputPath.substring(0, outputPath.lastIndexOf('/'));
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(days, null, 2));
    console.log(`Successfully wrote schedule to ${outputPath}`);
}).catch(console.error);
EOF
cat << 'EOF' > "postcss.config.js"
export default {
    plugins: {
        '@tailwindcss/postcss': {},
        autoprefixer: {},
    },
}
EOF
cat << 'EOF' > "README.md"
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
EOF
cat << 'EOF' > "tailwind.config.js"
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}
EOF
cat << 'EOF' > "tsconfig.app.json"
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "types": ["vite/client"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
EOF
cat << 'EOF' > "tsconfig.json"
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
EOF
cat << 'EOF' > "tsconfig.node.json"
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "types": ["node"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
EOF
cat << 'EOF' > "vite.config.ts"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
EOF
mkdir -p "public"
cat << 'EOF' > "public/vite.svg"
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--logos" width="31.88" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 256 257"><defs><linearGradient id="IconifyId1813088fe1fbc01fb466" x1="-.828%" x2="57.636%" y1="7.652%" y2="78.411%"><stop offset="0%" stop-color="#41D1FF"></stop><stop offset="100%" stop-color="#BD34FE"></stop></linearGradient><linearGradient id="IconifyId1813088fe1fbc01fb467" x1="43.376%" x2="50.316%" y1="2.242%" y2="89.03%"><stop offset="0%" stop-color="#FFEA83"></stop><stop offset="8.333%" stop-color="#FFDD35"></stop><stop offset="100%" stop-color="#FFA800"></stop></linearGradient></defs><path fill="url(#IconifyId1813088fe1fbc01fb466)" d="M255.153 37.938L134.897 252.976c-2.483 4.44-8.862 4.466-11.382.048L.875 37.958c-2.746-4.814 1.371-10.646 6.827-9.67l120.385 21.517a6.537 6.537 0 0 0 2.322-.004l117.867-21.483c5.438-.991 9.574 4.796 6.877 9.62Z"></path><path fill="url(#IconifyId1813088fe1fbc01fb467)" d="M185.432.063L96.44 17.501a3.268 3.268 0 0 0-2.634 3.014l-5.474 92.456a3.268 3.268 0 0 0 3.997 3.378l24.777-5.718c2.318-.535 4.413 1.507 3.936 3.838l-7.361 36.047c-.495 2.426 1.782 4.5 4.151 3.78l15.304-4.649c2.372-.72 4.652 1.36 4.15 3.788l-11.698 56.621c-.732 3.542 3.979 5.473 5.943 2.437l1.313-2.028l72.516-144.72c1.215-2.423-.88-5.186-3.54-4.672l-25.505 4.922c-2.396.462-4.435-1.77-3.759-4.114l16.646-57.705c.677-2.35-1.37-4.583-3.769-4.113Z"></path></svg>
EOF
mkdir -p "src"
cat << 'EOF' > "src/App.css"
#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.react:hover {
  filter: drop-shadow(0 0 2em #61dafbaa);
}

@keyframes logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: no-preference) {
  a:nth-of-type(2) .logo {
    animation: logo-spin infinite 20s linear;
  }
}

.card {
  padding: 2em;
}

.read-the-docs {
  color: #888;
}
EOF
mkdir -p "src"
cat << 'EOF' > "src/App.tsx"
import { useState } from 'react';
import { FileText, Users, Lightbulb, Layout, Clock, Package, Menu, Plus, Search } from 'lucide-react';
import { ShootDaysView } from './features/ShootDays/ShootDaysView';

export default function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const modules = [
    { id: 'dashboard', name: 'Dashboard', icon: Layout },
    { id: 'gear', name: 'Gear Lists', icon: Package },
    { id: 'schedule', name: 'Shoot Schedule', icon: Clock },
    { id: 'crew', name: 'Crew List', icon: Users },
    { id: 'manpower', name: 'Man Power', icon: Users },
    { id: 'lighting', name: 'Lighting Plot', icon: Lightbulb },
    { id: 'stage', name: 'Stage Plot', icon: Layout },
  ];

  const recentItems = [
    { name: 'Summer Campaign 2025', date: 'Active' },
    { name: 'Music Video Production', date: 'In Progress' },
    { name: 'Commercial Shoot', date: 'Completed' },
  ];

  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Active Projects', value: '3', color: 'from-blue-500 to-blue-600' },
                { label: 'Scheduled Shoots', value: '12', color: 'from-purple-500 to-purple-600' },
                { label: 'Crew Members', value: '24', color: 'from-emerald-500 to-emerald-600' },
                { label: 'Equipment Items', value: '156', color: 'from-orange-500 to-orange-600' },
              ].map((stat, i) => (
                <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-lg p-6 text-white shadow-lg`}>
                  <p className="text-sm opacity-90">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Projects</h3>
                <div className="space-y-3">
                  {recentItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-700/50 rounded hover:bg-slate-700 transition">
                      <span className="text-slate-100">{item.name}</span>
                      <span className="text-xs px-2 py-1 bg-blue-500/30 text-blue-300 rounded">{item.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:shadow-lg transition">
                    <Plus size={18} />
                    <span>New Project</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-slate-700 text-slate-100 rounded-lg hover:bg-slate-600 transition">
                    <FileText size={18} />
                    <span>Import Template</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'schedule':
        return <ShootDaysView />;
      default:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none" />
              </div>
              <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition">
                <Plus size={20} />
              </button>
            </div>
            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
              <p className="text-slate-400">Select a module to view details</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col`}>
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">B</span>
            </div>
            {sidebarOpen && <span className="font-bold text-lg">Best Bot</span>}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeModule === module.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-700'
                  }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="flex-1 text-left text-sm">{module.name}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-3 text-slate-400 hover:bg-slate-700 rounded-lg transition"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{modules.find(m => m.id === activeModule)?.name}</h1>
            <p className="text-slate-400 text-sm mt-1">Manage your production assets</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition text-sm">Settings</button>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full"></div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
EOF
mkdir -p "src"
cat << 'EOF' > "src/index.css"
@import "tailwindcss";

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;

  /* Premium Dark Theme Palette */
  --bg-app: #09090b;
  --bg-surface: #18181b;
  --bg-card: #27272a;
  --bg-hover: #3f3f46;

  --text-primary: #f4f4f5;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;

  --accent-primary: #3b82f6;
  --accent-glow: rgba(59, 130, 246, 0.5);

  --border-subtle: #27272a;
  --border-highlight: #3f3f46;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background-color: var(--bg-app);
  color: var(--text-primary);
}

/* Utility Classes */
.glass-panel {
  background: rgba(24, 24, 27, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.text-primary {
  color: var(--text-primary);
}

.text-secondary {
  color: var(--text-secondary);
}

.bg-accent-primary {
  background-color: var(--accent-primary);
}
EOF
mkdir -p "src"
cat << 'EOF' > "src/main.tsx"
import { StrictMode, Component, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
EOF
mkdir -p "src/assets"
cat << 'EOF' > "src/assets/react.svg"
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--logos" width="35.93" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 256 228"><path fill="#00D8FF" d="M210.483 73.824a171.49 171.49 0 0 0-8.24-2.597c.465-1.9.893-3.777 1.273-5.621c6.238-30.281 2.16-54.676-11.769-62.708c-13.355-7.7-35.196.329-57.254 19.526a171.23 171.23 0 0 0-6.375 5.848a155.866 155.866 0 0 0-4.241-3.917C100.759 3.829 77.587-4.822 63.673 3.233C50.33 10.957 46.379 33.89 51.995 62.588a170.974 170.974 0 0 0 1.892 8.48c-3.28.932-6.445 1.924-9.474 2.98C17.309 83.498 0 98.307 0 113.668c0 15.865 18.582 31.778 46.812 41.427a145.52 145.52 0 0 0 6.921 2.165a167.467 167.467 0 0 0-2.01 9.138c-5.354 28.2-1.173 50.591 12.134 58.266c13.744 7.926 36.812-.22 59.273-19.855a145.567 145.567 0 0 0 5.342-4.923a168.064 168.064 0 0 0 6.92 6.314c21.758 18.722 43.246 26.282 56.54 18.586c13.731-7.949 18.194-32.003 12.4-61.268a145.016 145.016 0 0 0-1.535-6.842c1.62-.48 3.21-.974 4.76-1.488c29.348-9.723 48.443-25.443 48.443-41.52c0-15.417-17.868-30.326-45.517-39.844Zm-6.365 70.984c-1.4.463-2.836.91-4.3 1.345c-3.24-10.257-7.612-21.163-12.963-32.432c5.106-11 9.31-21.767 12.459-31.957c2.619.758 5.16 1.557 7.61 2.4c23.69 8.156 38.14 20.213 38.14 29.504c0 9.896-15.606 22.743-40.946 31.14Zm-10.514 20.834c2.562 12.94 2.927 24.64 1.23 33.787c-1.524 8.219-4.59 13.698-8.382 15.893c-8.067 4.67-25.32-1.4-43.927-17.412a156.726 156.726 0 0 1-6.437-5.87c7.214-7.889 14.423-17.06 21.459-27.246c12.376-1.098 24.068-2.894 34.671-5.345a134.17 134.17 0 0 1 1.386 6.193ZM87.276 214.515c-7.882 2.783-14.16 2.863-17.955.675c-8.075-4.657-11.432-22.636-6.853-46.752a156.923 156.923 0 0 1 1.869-8.499c10.486 2.32 22.093 3.988 34.498 4.994c7.084 9.967 14.501 19.128 21.976 27.15a134.668 134.668 0 0 1-4.877 4.492c-9.933 8.682-19.886 14.842-28.658 17.94ZM50.35 144.747c-12.483-4.267-22.792-9.812-29.858-15.863c-6.35-5.437-9.555-10.836-9.555-15.216c0-9.322 13.897-21.212 37.076-29.293c2.813-.98 5.757-1.905 8.812-2.773c3.204 10.42 7.406 21.315 12.477 32.332c-5.137 11.18-9.399 22.249-12.634 32.792a134.718 134.718 0 0 1-6.318-1.979Zm12.378-84.26c-4.811-24.587-1.616-43.134 6.425-47.789c8.564-4.958 27.502 2.111 47.463 19.835a144.318 144.318 0 0 1 3.841 3.545c-7.438 7.987-14.787 17.08-21.808 26.988c-12.04 1.116-23.565 2.908-34.161 5.309a160.342 160.342 0 0 1-1.76-7.887Zm110.427 27.268a347.8 347.8 0 0 0-7.785-12.803c8.168 1.033 15.994 2.404 23.343 4.08c-2.206 7.072-4.956 14.465-8.193 22.045a381.151 381.151 0 0 0-7.365-13.322Zm-45.032-43.861c5.044 5.465 10.096 11.566 15.065 18.186a322.04 322.04 0 0 0-30.257-.006c4.974-6.559 10.069-12.652 15.192-18.18ZM82.802 87.83a323.167 323.167 0 0 0-7.227 13.238c-3.184-7.553-5.909-14.98-8.134-22.152c7.304-1.634 15.093-2.97 23.209-3.984a321.524 321.524 0 0 0-7.848 12.897Zm8.081 65.352c-8.385-.936-16.291-2.203-23.593-3.793c2.26-7.3 5.045-14.885 8.298-22.6a321.187 321.187 0 0 0 7.257 13.246c2.594 4.48 5.28 8.868 8.038 13.147Zm37.542 31.03c-5.184-5.592-10.354-11.779-15.403-18.433c4.902.192 9.899.29 14.978.29c5.218 0 10.376-.117 15.453-.343c-4.985 6.774-10.018 12.97-15.028 18.486Zm52.198-57.817c3.422 7.8 6.306 15.345 8.596 22.52c-7.422 1.694-15.436 3.058-23.88 4.071a382.417 382.417 0 0 0 7.859-13.026a347.403 347.403 0 0 0 7.425-13.565Zm-16.898 8.101a358.557 358.557 0 0 1-12.281 19.815a329.4 329.4 0 0 1-23.444.823c-7.967 0-15.716-.248-23.178-.732a310.202 310.202 0 0 1-12.513-19.846h.001a307.41 307.41 0 0 1-10.923-20.627a310.278 310.278 0 0 1 10.89-20.637l-.001.001a307.318 307.318 0 0 1 12.413-19.761c7.613-.576 15.42-.876 23.31-.876H128c7.926 0 15.743.303 23.354.883a329.357 329.357 0 0 1 12.335 19.695a358.489 358.489 0 0 1 11.036 20.54a329.472 329.472 0 0 1-11 20.722Zm22.56-122.124c8.572 4.944 11.906 24.881 6.52 51.026c-.344 1.668-.73 3.367-1.15 5.09c-10.622-2.452-22.155-4.275-34.23-5.408c-7.034-10.017-14.323-19.124-21.64-27.008a160.789 160.789 0 0 1 5.888-5.4c18.9-16.447 36.564-22.941 44.612-18.3ZM128 90.808c12.625 0 22.86 10.235 22.86 22.86s-10.235 22.86-22.86 22.86s-22.86-10.235-22.86-22.86s10.235-22.86 22.86-22.86Z"></path></svg>
EOF
mkdir -p "src/components/Layout"
cat << 'EOF' > "src/components/Layout/AppShell.css"
.app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--bg-app);
    color: var(--text-primary);
}

.app-header {
    position: sticky;
    top: 0;
    z-index: 50;
    background-color: rgba(24, 24, 27, 0.8);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-subtle);
}

.header-content {
    max-width: 80rem;
    /* 7xl equivalent */
    margin: 0 auto;
    padding: 0 1.5rem;
    height: 4rem;
    /* 16 */
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.brand-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.brand-icon {
    padding: 0.5rem;
    background-color: rgba(59, 130, 246, 0.1);
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.brand-icon svg {
    color: var(--accent-primary);
}

.brand-name {
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.025em;
}

.nav-section {
    display: flex;
    gap: 0.25rem;
}

.nav-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-secondary);
}

.nav-btn:hover {
    color: var(--text-primary);
    background-color: rgba(255, 255, 255, 0.05);
}

.nav-btn.active {
    background-color: rgba(59, 130, 246, 0.1);
    color: var(--accent-primary);
}

.user-section {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.user-avatar {
    width: 2rem;
    height: 2rem;
    border-radius: 9999px;
    background-color: var(--bg-card);
    border: 1px solid var(--border-highlight);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-secondary);
}

.main-content {
    flex: 1;
    width: 100%;
    max-width: 80rem;
    margin: 0 auto;
    padding: 2rem 1.5rem;
}

.fade-in {
    animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
EOF
mkdir -p "src/components/Layout"
cat << 'EOF' > "src/components/Layout/AppShell.tsx"
import React from 'react';
import { Calendar, Package, Users, Clock, LayoutDashboard } from 'lucide-react';
import './AppShell.css';

export type TabId = 'shoot-days' | 'packages' | 'manpower' | 'time-cards';

interface AppShellProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
    children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ activeTab, onTabChange, children }) => {
    const navItems = [
        { id: 'shoot-days', label: 'Shoot Days', icon: Calendar },
        { id: 'packages', label: 'Packages', icon: Package },
        { id: 'manpower', label: 'Manpower', icon: Users },
        { id: 'time-cards', label: 'Time Cards', icon: Clock },
    ] as const;

    return (
        <div className="app-shell">
            {/* Top Navigation Bar */}
            <header className="app-header">
                <div className="header-content">
                    <div className="brand-section">
                        <div className="brand-icon">
                            <LayoutDashboard size={24} />
                        </div>
                        <span className="brand-name">Best Boy</span>
                    </div>

                    <nav className="nav-section">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onTabChange(item.id)}
                                    className={`nav-btn ${isActive ? 'active' : ''}`}
                                >
                                    <Icon size={16} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="user-section">
                        <div className="user-avatar">
                            KP
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="main-content">
                <div className="fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
};
EOF
mkdir -p "src/data"
cat << 'EOF' > "src/data/mockData.ts"
import { type ShootDay } from '../types';

export const MOCK_SHOOT_DAYS: ShootDay[] = [
    {
        id: '1',
        dayNumber: 1,
        date: '2025-11-20',
        title: 'Principal Photography - Day 1',
        location: 'Studio A - Soundstage 3',
        callTime: '06:00 AM',
        status: 'completed',
        scenes: [
            { id: 's1', sceneNumber: '1A', description: 'Hero enters the bar', location: 'Bar Set' },
            { id: 's2', sceneNumber: '1B', description: 'Hero orders a drink', location: 'Bar Set' },
        ],
        notes: 'Heavy equipment load-in at 5am.'
    },
    {
        id: '2',
        dayNumber: 2,
        date: '2025-11-21',
        title: 'Exterior Night Shoot',
        location: 'Downtown Alley (Permit #4421)',
        callTime: '04:00 PM',
        status: 'scheduled',
        scenes: [
            { id: 's3', sceneNumber: '14', description: 'Chase sequence start', location: 'Alley' },
            { id: 's4', sceneNumber: '15', description: 'Hero hides in dumpster', location: 'Alley' },
        ],
        notes: 'Rain towers needed. Extra generator power required.'
    },
    {
        id: '3',
        dayNumber: 3,
        date: '2025-11-22',
        title: 'Interior Apartment',
        location: 'Location House - 123 Maple St',
        callTime: '08:00 AM',
        status: 'scheduled',
        scenes: [
            { id: 's5', sceneNumber: '4', description: 'Breakfast conversation', location: 'Kitchen' },
        ],
    },
    {
        id: '4',
        dayNumber: 4,
        date: '2025-11-25',
        title: 'Stunt Prep & Rehearsal',
        location: 'Warehouse B',
        callTime: '09:00 AM',
        status: 'scouting',
        scenes: [],
        notes: 'Safety meeting at 09:00 sharp.'
    }
];
EOF
mkdir -p "src/data"
cat << 'EOF' > "src/data/parsedSchedule.ts"
export const PARSED_SCHEDULE = [
    {
        "dayNumber": 1,
        "date": "Tuesday, October 21, 2025",
        "scenes": [
            {
                "slugline": "INT JOHN & CAROLYN'S LOFT - LIVING ROOM",
                "timeOfDay": "Day",
                "description": "John and Carolyn talk about what happpended",
                "cast": "1.9, 2.9",
                "sceneNum": "9-12, 13"
            },
            {
                "slugline": "INT JOHN & CAROLYN'S LOFT",
                "timeOfDay": "Day",
                "description": "John and Carolyn tear off their clothes",
                "cast": "1.9, 2.9",
                "sceneNum": "9-4"
            },
            {
                "slugline": "INT JOHN & CAROLYN'S LOFT - BEDROOM",
                "timeOfDay": "Day",
                "description": "Carolyn gets on top of John",
                "cast": "1.9, 2.9",
                "sceneNum": "9-5"
            },
            {
                "slugline": "INT JOHN & CAROLYN'S LOFT - BEDROOM",
                "timeOfDay": "Day",
                "description": "Carolyn and John talk about their best kiss",
                "cast": "1.9, 2.9",
                "sceneNum": "9-6, 8, 10"
            },
            {
                "slugline": "INT JOHN & CAROLINE'S LOFT",
                "timeOfDay": "Day",
                "description": "Carolyn finds a bouquet of white orchids",
                "cast": "1.9",
                "sceneNum": "9-21"
            }
        ],
        "rawContent": "WHITE PLAINS\nEPISODE 109 WHITE ONE LINE SCHEDULE - 10.20.25 (6p)\nBased on Episode 109 Production Draft - 10.19.25\nSunrise: 7:14a    Sunset: 6:06p\nApproximate Call Time: 8a\nINTJOHN & CAROLYN'S LOFT - LIVING ROOM\nDay\nJohn and Carolyn talk about what happpended\n1.9, 2.9\n9-12, 13\nScenes:\n2 2/8\npgs.\n63STAGE\nINTJOHN & CAROLYN'S LOFT\nDay\nJohn and Carolyn tear off their clothes\n1.9, 2.9\n9-4\nScenes:\n1/8\npgs.\n62STAGE\nCLOSED SET\nINTJOHN & CAROLYN'S LOFT - BEDROOM\nDay\nCarolyn gets on top of John\n1.9, 2.9\n9-5\nScenes:\n1/8\npgs.\n62STAGE\nCLOSED SET\nINTJOHN & CAROLYN'S LOFT - BEDROOM\nDay\nCarolyn and John talk about their best kiss\n1.9, 2.9\n9-6, 8, 10\nScenes:\n1 7/8\npgs.\n62STAGE\nCLOSED SET\nIF TIME PERMITS\nINTJOHN & CAROLINE'S LOFT\nDay\nCarolyn finds a bouquet of white orchids\n1.9\n9-21\nScenes:\n1/8\npgs.\n66STAGE"
    },
    {
        "dayNumber": 2,
        "date": "Wednesday, October 22, 2025",
        "scenes": [
            {
                "slugline": "INT GEORGE - BULLPEN & JOHN'S OFFICE",
                "timeOfDay": "Day",
                "description": "John tells Rosemarie that he refuses to let them go under",
                "cast": "2.9, 71.9",
                "sceneNum": "9-14"
            },
            {
                "slugline": "INT GEORGE - JOHN'S OFFICE",
                "timeOfDay": "Day",
                "description": "John calls the national weather service",
                "cast": "2.9",
                "sceneNum": "9-27"
            }
        ],
        "rawContent": "Approximate Call Time: 8a\nINTGEORGE - BULLPEN & JOHN'S OFFICE\nDay\nJohn tells Rosemarie that he refuses to let them go under\n2.9, 71.9\n9-14\nScenes:\n2\npgs.\n64237 Park\nAvenue\nINTGEORGE - JOHN'S OFFICE\nDay\nJohn calls the national weather service\n2.9\n9-27\nScenes:\n2/8\npgs.\n67237 Park\nAvenue\nPlus To Be Written Scene of Phone Ringing at empty George Office\nPLUS ART DEPARTMENT STILLS SHOOT WITH CAST 2, 7"
    },
    {
        "dayNumber": 3,
        "date": "Thursday, October 23, 2025",
        "scenes": [
            {
                "slugline": "INT THERAPIST'S OFFICE",
                "timeOfDay": "Day",
                "description": "Carolyn talks about her dream",
                "cast": "1.9, 2.9, 145.9",
                "sceneNum": "9-1"
            },
            {
                "slugline": "EXT STREET",
                "timeOfDay": "Day",
                "description": "Carolyn needs a drink",
                "cast": "1.9, 2.9",
                "sceneNum": "9-2"
            },
            {
                "slugline": "EXT STREET",
                "timeOfDay": "Late Day",
                "description": "Carolyn walks past a woman styled in her likeness",
                "cast": "1.9",
                "sceneNum": "9-22pt2"
            }
        ],
        "rawContent": "Approximate Call Time: 730a\nINTTHERAPIST'S OFFICE\nDay\nCarolyn talks about her dream\n1.9, 2.9, 145.9\n9-1\nScenes:\n4 2/8\npgs.\n62352 West\n20th Street\nEXTSTREET\nDay\nCarolyn needs a drink\n1.9, 2.9\n9-2\nScenes:\n2/8\npgs.\n6220th Street\nEXTSTREET\nLate Day\nCarolyn walks past a woman styled in her likeness\n1.9\n9-22pt2\nScenes:\n2/8\npgs.\n6620th Street"
    },
    {
        "dayNumber": 4,
        "date": "Friday, October 24, 2025",
        "scenes": [
            {
                "slugline": "INT INDIAN RESTAURANT",
                "timeOfDay": "D4N",
                "description": "Carolyn asks John why he left",
                "cast": "1.9, 2.9",
                "sceneNum": "9-24"
            },
            {
                "slugline": "I/E INDIAN RESTAURANT",
                "timeOfDay": "Evening",
                "description": "John checks his watch, Carolyn arrives",
                "cast": "2.9",
                "sceneNum": "9-23"
            },
            {
                "slugline": "EXT INDIAN RESTAURANT",
                "timeOfDay": "Evening",
                "description": "Carolyn walks past a woman styled in her likeness",
                "cast": "1.9",
                "sceneNum": "9-22pt4"
            },
            {
                "slugline": "EXT CAROLYN'S OLD APARTMENT",
                "timeOfDay": "Evening",
                "description": "John and Carolyn talk about the wedding",
                "cast": "1.9, 2.9",
                "sceneNum": "9-25"
            }
        ],
        "rawContent": "Approximate Call Time: 2p\nINTINDIAN RESTAURANT\nD4N\nCarolyn asks John why he left\n1.9, 2.9\n9-24\nScenes:\n2 2/8\npgs.\n6693 First Ave\nI/EINDIAN RESTAURANT\nEvening\nJohn checks his watch, Carolyn arrives\n2.9\n9-23\nScenes:\n3/8\npgs.\n6693 First Ave\nEXTINDIAN RESTAURANT\nEvening\nCarolyn walks past a woman styled in her likeness\n1.9\n9-22pt4\nScenes:\n2/8\npgs.\n66First Ave\nEQUIPMENT TRUCK MOVE\nEXTCAROLYN'S OLD APARTMENT\nEvening\nJohn and Carolyn talk about the wedding\n1.9, 2.9\n9-25\nScenes:\n5/8\npgs.\n6648\nStuyvesant"
    },
    {
        "dayNumber": 5,
        "date": "Monday, October 27, 2025",
        "scenes": [
            {
                "slugline": "EXT CENTRAL PARK",
                "timeOfDay": "Day",
                "description": "Caroline asks John if he loves Carolyn enough to forge an equitable life with her",
                "cast": "2.9, 5.9",
                "sceneNum": "9-20"
            },
            {
                "slugline": "EXT CENTRAL PARK",
                "timeOfDay": "Day",
                "description": "The moment John realized he wanted to spend the rest of his life with Carolyn",
                "cast": "1.9, 2.9, 149.9",
                "sceneNum": "9-9"
            }
        ],
        "rawContent": "COMPANY OFF - Saturday, October 25 & Sunday, October 26\nSunrise: 7:20a    Sunset: 5:58p\nApproximate Call Time: 7a\nEXTCENTRAL PARK\nDay\nCaroline asks John if he loves Carolyn enough to forge an equitable life with her\n2.9, 5.9\n9-20\nScenes:\n2 1/8\npgs.\n65Central Park\nEXTCENTRAL PARK\nDay\nThe moment John realized he wanted to spend the rest of his life with Carolyn\n1.9, 2.9, 149.9\n9-9\nScenes:\n3/8\npgs.\nFB1Central Park\nPLUS TBD Part 2 Scenes"
    },
    {
        "dayNumber": 6,
        "date": "Tuesday, October 28, 2025",
        "scenes": [
            {
                "slugline": "INT WALKER'S",
                "timeOfDay": "Day",
                "description": "John and Carolyn reminisce about their relationship",
                "cast": "1.9, 2.9",
                "sceneNum": "9-3"
            },
            {
                "slugline": "INT WALKER'S",
                "timeOfDay": "Day",
                "description": "Lauren tells Carolyn that she spoke to John",
                "cast": "1.9, 7.9",
                "sceneNum": "9-15"
            },
            {
                "slugline": "INT JOHN & CAROLYN'S VESTIBULE",
                "timeOfDay": "Day",
                "description": "Carolyn's best kiss",
                "cast": "1.9, 2.9",
                "sceneNum": "9-7pt"
            },
            {
                "slugline": "EXT JOHN & CAROLYN'S LOFT",
                "timeOfDay": "Late Day",
                "description": "Carolyn walks past a woman styled in her likeness",
                "cast": "1.9",
                "sceneNum": "9-22pt1"
            },
            {
                "slugline": "EXT JOHN & CAROLYN'S LOFT",
                "timeOfDay": "Day",
                "description": "Carolyn's POV of a sea of paparazzi",
                "cast": "9-26pt",
                "sceneNum": "Scenes:"
            }
        ],
        "rawContent": "INTWALKER'S\nDay\nJohn and Carolyn reminisce about their relationship\n1.9, 2.9\n9-3\nScenes:\n2 4/8\npgs.\n6216 N Moore\nStreet\nINTWALKER'S\nDay\nLauren tells Carolyn that she spoke to John\n1.9, 7.9\n9-15\nScenes:\n1 5/8\npgs.\n6416 N Moore\nStreet\nINTJOHN & CAROLYN'S VESTIBULE\nDay\nCarolyn's best kiss\n1.9, 2.9\n9-7pt\nScenes:\n1/8\npgs.\nFB1STAGE\nEXTJOHN & CAROLYN'S LOFT\nLate Day\nCarolyn walks past a woman styled in her likeness\n1.9\n9-22pt1\nScenes:\n1/8\npgs.\n6620 N Moore\nStreet\nC CAMERA SHOOTS\nEXTJOHN & CAROLYN'S LOFT\nDay\nCarolyn's POV of a sea of paparazzi\n9-26pt\nScenes:\n1/8\npgs.\n67STAGE\nPLUS TBD Part 2  North Moore Street Scenes"
    },
    {
        "dayNumber": 7,
        "date": "Wednesday, October 29, 2025",
        "scenes": [],
        "rawContent": "Part 2 BEACH SCENES - TO BE WRITTEN"
    },
    {
        "dayNumber": 8,
        "date": "Thursday, October 30, 2025",
        "scenes": [
            {
                "slugline": "INT HOSPITAL - ANTHONY'S ROOM",
                "timeOfDay": "Night",
                "description": "John and Carolyn visit Anthony",
                "cast": "1.9, 2.9, 10.9, 148.9, 151.9",
                "sceneNum": "9-18"
            },
            {
                "slugline": "INT HOSPITAL - HALLWAY",
                "timeOfDay": "Night",
                "description": "Carolyn finds John crying in the hallway",
                "cast": "1.9, 2.9",
                "sceneNum": "9-19"
            },
            {
                "slugline": "INT JOHN & CAROLYN'S LOFT",
                "timeOfDay": "Day",
                "description": "Carolyn's best kiss",
                "cast": "1.9, 2.9",
                "sceneNum": "9-7"
            },
            {
                "slugline": "INT JOHN & CAROLYN'S LOFT",
                "timeOfDay": "Day",
                "description": "Carolyn is worried her and John are jumping the gun",
                "cast": "1.9, 7a.9",
                "sceneNum": "9-26"
            },
            {
                "slugline": "INT JOHN & CAROLYN'S LOFT",
                "timeOfDay": "Day",
                "description": "Carolyn finds a bouquet of white orchids",
                "cast": "1.9",
                "sceneNum": "9-21"
            }
        ],
        "rawContent": "INTHOSPITAL - ANTHONY'S ROOM\nNight\nJohn and Carolyn visit Anthony\n1.9, 2.9, 10.9, 148.9, 151.9\n9-18\nScenes:\n2 2/8\npgs.\n64STAGE\nINTHOSPITAL - HALLWAY\nNight\nCarolyn finds John crying in the hallway\n1.9, 2.9\n9-19\nScenes:\n2/8\npgs.\n64STAGE\nMOVE STAGES\nINTJOHN & CAROLYN'S LOFT\nDay\nCarolyn's best kiss\n1.9, 2.9\n9-7\nScenes:\n6/8\npgs.\nFB1STAGE\nINTJOHN & CAROLYN'S LOFT\nDay\nCarolyn is worried her and John are jumping the gun\n1.9, 7a.9\n9-26\nScenes:\n5/8\npgs.\n67STAGE\nIF NOT COMPLETE\nINTJOHN & CAROLYN'S LOFT\nDay\nCarolyn finds a bouquet of white orchids\n1.9\n9-21\nScenes:\n1/8\npgs.\n66STAGE"
    },
    {
        "dayNumber": 9,
        "date": "Friday, October 31, 2025",
        "scenes": [
            {
                "slugline": "INT GALA",
                "timeOfDay": "Late Day",
                "description": "Guests arrive at the charity gala",
                "cast": "9-16pt1",
                "sceneNum": "Scenes:"
            },
            {
                "slugline": "INT GALA",
                "timeOfDay": "Late Day",
                "description": "John works the room",
                "cast": "2.9",
                "sceneNum": "9-16pt2"
            },
            {
                "slugline": "INT GALA",
                "timeOfDay": "Late Day",
                "description": "John tells a guest that Carolyn wanted to be there",
                "cast": "2.9",
                "sceneNum": "9-16pt3"
            },
            {
                "slugline": "INT GALA",
                "timeOfDay": "Late Day",
                "description": "John jokes with a guest",
                "cast": "2.9",
                "sceneNum": "9-16pt4"
            },
            {
                "slugline": "INT GALA",
                "timeOfDay": "Night",
                "description": "Carolyn surprises John at the Gala",
                "cast": "1.9, 2.9",
                "sceneNum": "9-16pt5"
            },
            {
                "slugline": "INT GALA",
                "timeOfDay": "Night",
                "description": "Rosemarie whispers in John's ear",
                "cast": "1.9, 2.9, 71.9",
                "sceneNum": "9-17"
            }
        ],
        "rawContent": "GALA\nApproximate Call Time:  12p\nINTGALA\nLate Day\nGuests arrive at the charity gala\n9-16pt1\nScenes:\n1/8\npgs.\n64333 E 47th\nStreet\nINTGALA\nLate Day\nJohn works the room\n2.9\n9-16pt2\nScenes:\n2/8\npgs.\n64333 E 47th\nStreet\nINTGALA\nLate Day\nJohn tells a guest that Carolyn wanted to be there\n2.9\n9-16pt3\nScenes:\n1/8\npgs.\n64333 E 47th\nStreet\nINTGALA\nLate Day\nJohn jokes with a guest\n2.9\n9-16pt4\nScenes:\n1/8\npgs.\n64333 E 47th\nStreet\nINTGALA\nNight\nCarolyn surprises John at the Gala\n1.9, 2.9\n9-16pt5\nScenes:\n5/8\npgs.\n64333 E 47th\nStreet\nINTGALA\nNight\nRosemarie whispers in John's ear\n1.9, 2.9, 71.9\n9-17\nScenes:\n1/8\npgs.\n64333 E 47th\nStreet\nPLUS ART DEPARTMENT PHOTO SHOOT WITH CAST #1 & 2"
    },
    {
        "dayNumber": 10,
        "date": "Monday, November 3, 2025",
        "scenes": [],
        "rawContent": "COMPANY OFF - Saturday, November 1 & Sunday, November 2\nSunrise: 6:27a    Sunset: 4:49p\nPart 2 MEMORIAL SERVICE SCENES - TO BE WRITTEN"
    },
    {
        "dayNumber": 11,
        "date": "Tuesday, November 4, 2025",
        "scenes": [
            {
                "slugline": "INT BALLROOM - DREAM",
                "timeOfDay": "Night",
                "description": "Carolyn talks to Jackie about her marriage",
                "cast": "1.9, 3.9, 150.9",
                "sceneNum": "9-11"
            }
        ],
        "rawContent": "INTBALLROOM - DREAM\nNight\nCarolyn talks to Jackie about her marriage\n1.9, 3.9, 150.9\n9-11\nScenes:\n3\npgs.\nDre\nPlus TBD Part 2 Scenes"
    }
];
EOF
mkdir -p "src/data"
cat << 'EOF' > "src/data/schedule.json"
[
  {
    "dayNumber": 1,
    "date": "Tuesday, October 21, 2025",
    "scenes": [
      {
        "slugline": "INT JOHN & CAROLYN'S LOFT - LIVING ROOM",
        "timeOfDay": "Day",
        "description": "John and Carolyn talk about what happpended",
        "cast": "1.9, 2.9",
        "sceneNum": "9-12, 13"
      },
      {
        "slugline": "INT JOHN & CAROLYN'S LOFT",
        "timeOfDay": "Day",
        "description": "John and Carolyn tear off their clothes",
        "cast": "1.9, 2.9",
        "sceneNum": "9-4"
      },
      {
        "slugline": "INT JOHN & CAROLYN'S LOFT - BEDROOM",
        "timeOfDay": "Day",
        "description": "Carolyn gets on top of John",
        "cast": "1.9, 2.9",
        "sceneNum": "9-5"
      },
      {
        "slugline": "INT JOHN & CAROLYN'S LOFT - BEDROOM",
        "timeOfDay": "Day",
        "description": "Carolyn and John talk about their best kiss",
        "cast": "1.9, 2.9",
        "sceneNum": "9-6, 8, 10"
      },
      {
        "slugline": "INT JOHN & CAROLINE'S LOFT",
        "timeOfDay": "Day",
        "description": "Carolyn finds a bouquet of white orchids",
        "cast": "1.9",
        "sceneNum": "9-21"
      }
    ],
    "rawContent": "WHITE PLAINS\nEPISODE 109 WHITE ONE LINE SCHEDULE - 10.20.25 (6p)\nBased on Episode 109 Production Draft - 10.19.25\nSunrise: 7:14a    Sunset: 6:06p\nApproximate Call Time: 8a\nINTJOHN & CAROLYN'S LOFT - LIVING ROOM\nDay\nJohn and Carolyn talk about what happpended\n1.9, 2.9\n9-12, 13\nScenes:\n2 2/8\npgs.\n63STAGE\nINTJOHN & CAROLYN'S LOFT\nDay\nJohn and Carolyn tear off their clothes\n1.9, 2.9\n9-4\nScenes:\n1/8\npgs.\n62STAGE\nCLOSED SET\nINTJOHN & CAROLYN'S LOFT - BEDROOM\nDay\nCarolyn gets on top of John\n1.9, 2.9\n9-5\nScenes:\n1/8\npgs.\n62STAGE\nCLOSED SET\nINTJOHN & CAROLYN'S LOFT - BEDROOM\nDay\nCarolyn and John talk about their best kiss\n1.9, 2.9\n9-6, 8, 10\nScenes:\n1 7/8\npgs.\n62STAGE\nCLOSED SET\nIF TIME PERMITS\nINTJOHN & CAROLINE'S LOFT\nDay\nCarolyn finds a bouquet of white orchids\n1.9\n9-21\nScenes:\n1/8\npgs.\n66STAGE"
  },
  {
    "dayNumber": 2,
    "date": "Wednesday, October 22, 2025",
    "scenes": [
      {
        "slugline": "INT GEORGE - BULLPEN & JOHN'S OFFICE",
        "timeOfDay": "Day",
        "description": "John tells Rosemarie that he refuses to let them go under",
        "cast": "2.9, 71.9",
        "sceneNum": "9-14"
      },
      {
        "slugline": "INT GEORGE - JOHN'S OFFICE",
        "timeOfDay": "Day",
        "description": "John calls the national weather service",
        "cast": "2.9",
        "sceneNum": "9-27"
      }
    ],
    "rawContent": "Approximate Call Time: 8a\nINTGEORGE - BULLPEN & JOHN'S OFFICE\nDay\nJohn tells Rosemarie that he refuses to let them go under\n2.9, 71.9\n9-14\nScenes:\n2\npgs.\n64237 Park\nAvenue\nINTGEORGE - JOHN'S OFFICE\nDay\nJohn calls the national weather service\n2.9\n9-27\nScenes:\n2/8\npgs.\n67237 Park\nAvenue\nPlus To Be Written Scene of Phone Ringing at empty George Office\nPLUS ART DEPARTMENT STILLS SHOOT WITH CAST 2, 7"
  },
  {
    "dayNumber": 3,
    "date": "Thursday, October 23, 2025",
    "scenes": [
      {
        "slugline": "INT THERAPIST'S OFFICE",
        "timeOfDay": "Day",
        "description": "Carolyn talks about her dream",
        "cast": "1.9, 2.9, 145.9",
        "sceneNum": "9-1"
      },
      {
        "slugline": "EXT STREET",
        "timeOfDay": "Day",
        "description": "Carolyn needs a drink",
        "cast": "1.9, 2.9",
        "sceneNum": "9-2"
      },
      {
        "slugline": "EXT STREET",
        "timeOfDay": "Late Day",
        "description": "Carolyn walks past a woman styled in her likeness",
        "cast": "1.9",
        "sceneNum": "9-22pt2"
      }
    ],
    "rawContent": "Approximate Call Time: 730a\nINTTHERAPIST'S OFFICE\nDay\nCarolyn talks about her dream\n1.9, 2.9, 145.9\n9-1\nScenes:\n4 2/8\npgs.\n62352 West\n20th Street\nEXTSTREET\nDay\nCarolyn needs a drink\n1.9, 2.9\n9-2\nScenes:\n2/8\npgs.\n6220th Street\nEXTSTREET\nLate Day\nCarolyn walks past a woman styled in her likeness\n1.9\n9-22pt2\nScenes:\n2/8\npgs.\n6620th Street"
  },
  {
    "dayNumber": 4,
    "date": "Friday, October 24, 2025",
    "scenes": [
      {
        "slugline": "INT INDIAN RESTAURANT",
        "timeOfDay": "D4N",
        "description": "Carolyn asks John why he left",
        "cast": "1.9, 2.9",
        "sceneNum": "9-24"
      },
      {
        "slugline": "I/E INDIAN RESTAURANT",
        "timeOfDay": "Evening",
        "description": "John checks his watch, Carolyn arrives",
        "cast": "2.9",
        "sceneNum": "9-23"
      },
      {
        "slugline": "EXT INDIAN RESTAURANT",
        "timeOfDay": "Evening",
        "description": "Carolyn walks past a woman styled in her likeness",
        "cast": "1.9",
        "sceneNum": "9-22pt4"
      },
      {
        "slugline": "EXT CAROLYN'S OLD APARTMENT",
        "timeOfDay": "Evening",
        "description": "John and Carolyn talk about the wedding",
        "cast": "1.9, 2.9",
        "sceneNum": "9-25"
      }
    ],
    "rawContent": "Approximate Call Time: 2p\nINTINDIAN RESTAURANT\nD4N\nCarolyn asks John why he left\n1.9, 2.9\n9-24\nScenes:\n2 2/8\npgs.\n6693 First Ave\nI/EINDIAN RESTAURANT\nEvening\nJohn checks his watch, Carolyn arrives\n2.9\n9-23\nScenes:\n3/8\npgs.\n6693 First Ave\nEXTINDIAN RESTAURANT\nEvening\nCarolyn walks past a woman styled in her likeness\n1.9\n9-22pt4\nScenes:\n2/8\npgs.\n66First Ave\nEQUIPMENT TRUCK MOVE\nEXTCAROLYN'S OLD APARTMENT\nEvening\nJohn and Carolyn talk about the wedding\n1.9, 2.9\n9-25\nScenes:\n5/8\npgs.\n6648\nStuyvesant"
  },
  {
    "dayNumber": 5,
    "date": "Monday, October 27, 2025",
    "scenes": [
      {
        "slugline": "EXT CENTRAL PARK",
        "timeOfDay": "Day",
        "description": "Caroline asks John if he loves Carolyn enough to forge an equitable life with her",
        "cast": "2.9, 5.9",
        "sceneNum": "9-20"
      },
      {
        "slugline": "EXT CENTRAL PARK",
        "timeOfDay": "Day",
        "description": "The moment John realized he wanted to spend the rest of his life with Carolyn",
        "cast": "1.9, 2.9, 149.9",
        "sceneNum": "9-9"
      }
    ],
    "rawContent": "COMPANY OFF - Saturday, October 25 & Sunday, October 26\nSunrise: 7:20a    Sunset: 5:58p\nApproximate Call Time: 7a\nEXTCENTRAL PARK\nDay\nCaroline asks John if he loves Carolyn enough to forge an equitable life with her\n2.9, 5.9\n9-20\nScenes:\n2 1/8\npgs.\n65Central Park\nEXTCENTRAL PARK\nDay\nThe moment John realized he wanted to spend the rest of his life with Carolyn\n1.9, 2.9, 149.9\n9-9\nScenes:\n3/8\npgs.\nFB1Central Park\nPLUS TBD Part 2 Scenes"
  },
  {
    "dayNumber": 6,
    "date": "Tuesday, October 28, 2025",
    "scenes": [
      {
        "slugline": "INT WALKER'S",
        "timeOfDay": "Day",
        "description": "John and Carolyn reminisce about their relationship",
        "cast": "1.9, 2.9",
        "sceneNum": "9-3"
      },
      {
        "slugline": "INT WALKER'S",
        "timeOfDay": "Day",
        "description": "Lauren tells Carolyn that she spoke to John",
        "cast": "1.9, 7.9",
        "sceneNum": "9-15"
      },
      {
        "slugline": "INT JOHN & CAROLYN'S VESTIBULE",
        "timeOfDay": "Day",
        "description": "Carolyn's best kiss",
        "cast": "1.9, 2.9",
        "sceneNum": "9-7pt"
      },
      {
        "slugline": "EXT JOHN & CAROLYN'S LOFT",
        "timeOfDay": "Late Day",
        "description": "Carolyn walks past a woman styled in her likeness",
        "cast": "1.9",
        "sceneNum": "9-22pt1"
      },
      {
        "slugline": "EXT JOHN & CAROLYN'S LOFT",
        "timeOfDay": "Day",
        "description": "Carolyn's POV of a sea of paparazzi",
        "cast": "9-26pt",
        "sceneNum": "Scenes:"
      }
    ],
    "rawContent": "INTWALKER'S\nDay\nJohn and Carolyn reminisce about their relationship\n1.9, 2.9\n9-3\nScenes:\n2 4/8\npgs.\n6216 N Moore\nStreet\nINTWALKER'S\nDay\nLauren tells Carolyn that she spoke to John\n1.9, 7.9\n9-15\nScenes:\n1 5/8\npgs.\n6416 N Moore\nStreet\nINTJOHN & CAROLYN'S VESTIBULE\nDay\nCarolyn's best kiss\n1.9, 2.9\n9-7pt\nScenes:\n1/8\npgs.\nFB1STAGE\nEXTJOHN & CAROLYN'S LOFT\nLate Day\nCarolyn walks past a woman styled in her likeness\n1.9\n9-22pt1\nScenes:\n1/8\npgs.\n6620 N Moore\nStreet\nC CAMERA SHOOTS\nEXTJOHN & CAROLYN'S LOFT\nDay\nCarolyn's POV of a sea of paparazzi\n9-26pt\nScenes:\n1/8\npgs.\n67STAGE\nPLUS TBD Part 2  North Moore Street Scenes"
  },
  {
    "dayNumber": 7,
    "date": "Wednesday, October 29, 2025",
    "scenes": [],
    "rawContent": "Part 2 BEACH SCENES - TO BE WRITTEN"
  },
  {
    "dayNumber": 8,
    "date": "Thursday, October 30, 2025",
    "scenes": [
      {
        "slugline": "INT HOSPITAL - ANTHONY'S ROOM",
        "timeOfDay": "Night",
        "description": "John and Carolyn visit Anthony",
        "cast": "1.9, 2.9, 10.9, 148.9, 151.9",
        "sceneNum": "9-18"
      },
      {
        "slugline": "INT HOSPITAL - HALLWAY",
        "timeOfDay": "Night",
        "description": "Carolyn finds John crying in the hallway",
        "cast": "1.9, 2.9",
        "sceneNum": "9-19"
      },
      {
        "slugline": "INT JOHN & CAROLYN'S LOFT",
        "timeOfDay": "Day",
        "description": "Carolyn's best kiss",
        "cast": "1.9, 2.9",
        "sceneNum": "9-7"
      },
      {
        "slugline": "INT JOHN & CAROLYN'S LOFT",
        "timeOfDay": "Day",
        "description": "Carolyn is worried her and John are jumping the gun",
        "cast": "1.9, 7a.9",
        "sceneNum": "9-26"
      },
      {
        "slugline": "INT JOHN & CAROLYN'S LOFT",
        "timeOfDay": "Day",
        "description": "Carolyn finds a bouquet of white orchids",
        "cast": "1.9",
        "sceneNum": "9-21"
      }
    ],
    "rawContent": "INTHOSPITAL - ANTHONY'S ROOM\nNight\nJohn and Carolyn visit Anthony\n1.9, 2.9, 10.9, 148.9, 151.9\n9-18\nScenes:\n2 2/8\npgs.\n64STAGE\nINTHOSPITAL - HALLWAY\nNight\nCarolyn finds John crying in the hallway\n1.9, 2.9\n9-19\nScenes:\n2/8\npgs.\n64STAGE\nMOVE STAGES\nINTJOHN & CAROLYN'S LOFT\nDay\nCarolyn's best kiss\n1.9, 2.9\n9-7\nScenes:\n6/8\npgs.\nFB1STAGE\nINTJOHN & CAROLYN'S LOFT\nDay\nCarolyn is worried her and John are jumping the gun\n1.9, 7a.9\n9-26\nScenes:\n5/8\npgs.\n67STAGE\nIF NOT COMPLETE\nINTJOHN & CAROLYN'S LOFT\nDay\nCarolyn finds a bouquet of white orchids\n1.9\n9-21\nScenes:\n1/8\npgs.\n66STAGE"
  },
  {
    "dayNumber": 9,
    "date": "Friday, October 31, 2025",
    "scenes": [
      {
        "slugline": "INT GALA",
        "timeOfDay": "Late Day",
        "description": "Guests arrive at the charity gala",
        "cast": "9-16pt1",
        "sceneNum": "Scenes:"
      },
      {
        "slugline": "INT GALA",
        "timeOfDay": "Late Day",
        "description": "John works the room",
        "cast": "2.9",
        "sceneNum": "9-16pt2"
      },
      {
        "slugline": "INT GALA",
        "timeOfDay": "Late Day",
        "description": "John tells a guest that Carolyn wanted to be there",
        "cast": "2.9",
        "sceneNum": "9-16pt3"
      },
      {
        "slugline": "INT GALA",
        "timeOfDay": "Late Day",
        "description": "John jokes with a guest",
        "cast": "2.9",
        "sceneNum": "9-16pt4"
      },
      {
        "slugline": "INT GALA",
        "timeOfDay": "Night",
        "description": "Carolyn surprises John at the Gala",
        "cast": "1.9, 2.9",
        "sceneNum": "9-16pt5"
      },
      {
        "slugline": "INT GALA",
        "timeOfDay": "Night",
        "description": "Rosemarie whispers in John's ear",
        "cast": "1.9, 2.9, 71.9",
        "sceneNum": "9-17"
      }
    ],
    "rawContent": "GALA\nApproximate Call Time:  12p\nINTGALA\nLate Day\nGuests arrive at the charity gala\n9-16pt1\nScenes:\n1/8\npgs.\n64333 E 47th\nStreet\nINTGALA\nLate Day\nJohn works the room\n2.9\n9-16pt2\nScenes:\n2/8\npgs.\n64333 E 47th\nStreet\nINTGALA\nLate Day\nJohn tells a guest that Carolyn wanted to be there\n2.9\n9-16pt3\nScenes:\n1/8\npgs.\n64333 E 47th\nStreet\nINTGALA\nLate Day\nJohn jokes with a guest\n2.9\n9-16pt4\nScenes:\n1/8\npgs.\n64333 E 47th\nStreet\nINTGALA\nNight\nCarolyn surprises John at the Gala\n1.9, 2.9\n9-16pt5\nScenes:\n5/8\npgs.\n64333 E 47th\nStreet\nINTGALA\nNight\nRosemarie whispers in John's ear\n1.9, 2.9, 71.9\n9-17\nScenes:\n1/8\npgs.\n64333 E 47th\nStreet\nPLUS ART DEPARTMENT PHOTO SHOOT WITH CAST #1 & 2"
  },
  {
    "dayNumber": 10,
    "date": "Monday, November 3, 2025",
    "scenes": [],
    "rawContent": "COMPANY OFF - Saturday, November 1 & Sunday, November 2\nSunrise: 6:27a    Sunset: 4:49p\nPart 2 MEMORIAL SERVICE SCENES - TO BE WRITTEN"
  },
  {
    "dayNumber": 11,
    "date": "Tuesday, November 4, 2025",
    "scenes": [
      {
        "slugline": "INT BALLROOM - DREAM",
        "timeOfDay": "Night",
        "description": "Carolyn talks to Jackie about her marriage",
        "cast": "1.9, 3.9, 150.9",
        "sceneNum": "9-11"
      }
    ],
    "rawContent": "INTBALLROOM - DREAM\nNight\nCarolyn talks to Jackie about her marriage\n1.9, 3.9, 150.9\n9-11\nScenes:\n3\npgs.\nDre\nPlus TBD Part 2 Scenes"
  }
]
EOF
mkdir -p "src/features/Manpower"
cat << 'EOF' > "src/features/Manpower/ManpowerView.tsx"
import React from 'react';

export const ManpowerView: React.FC = () => {
    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Manpower</h2>
            <div className="glass-panel p-8 rounded-lg">
                <p className="text-secondary">Crew management and scheduling will appear here.</p>
            </div>
        </div>
    );
};
EOF
mkdir -p "src/features/Packages"
cat << 'EOF' > "src/features/Packages/PackagesView.tsx"
import React from 'react';

export const PackagesView: React.FC = () => {
    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Shooting Packages</h2>
            <div className="glass-panel p-8 rounded-lg">
                <p className="text-secondary">Equipment and package inventory will appear here.</p>
            </div>
        </div>
    );
};
EOF
mkdir -p "src/features/ShootDays"
cat << 'EOF' > "src/features/ShootDays/ShootDayCard.css"
.shoot-card {
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
}

.shoot-card:hover {
    transform: translateY(-2px);
    background: rgba(39, 39, 42, 0.8);
    /* Zinc 800 with opacity */
    border-color: rgba(59, 130, 246, 0.3);
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
}

.shoot-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: var(--border-highlight);
    transition: background-color 0.3s ease;
}

.shoot-card:hover::before {
    background: var(--accent-primary);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.day-badge {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin-bottom: 0.25rem;
}

.card-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
}

.status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
}

.status-scheduled {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.2);
}

.status-completed {
    background: rgba(39, 39, 42, 0.5);
    color: var(--text-muted);
    border: 1px solid var(--border-highlight);
}

.status-scouting {
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.2);
}

.info-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
}

.info-icon {
    color: var(--text-muted);
}

.scene-count {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.875rem;
    color: var(--text-muted);
}
EOF
mkdir -p "src/features/ShootDays"
cat << 'EOF' > "src/features/ShootDays/ShootDayCard.tsx"
import React from 'react';
import { MapPin, Clock, Film } from 'lucide-react';
import { type ShootDay } from '../../types';
import './ShootDayCard.css';

interface ShootDayCardProps {
    day: ShootDay;
}

export const ShootDayCard: React.FC<ShootDayCardProps> = ({ day }) => {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="glass-panel p-6 rounded-lg shoot-card">
            <div className="card-header">
                <div>
                    <div className="day-badge">Day {day.dayNumber}</div>
                    <h3 className="card-title">{day.title}</h3>
                </div>
                <span className={`status-badge status-${day.status}`}>
                    {day.status}
                </span>
            </div>

            <div className="space-y-2">
                <div className="info-row">
                    <Clock size={16} className="info-icon" />
                    <span>{formatDate(day.date)} • Call: {day.callTime}</span>
                </div>

                <div className="info-row">
                    <MapPin size={16} className="info-icon" />
                    <span className="truncate">{day.location}</span>
                </div>
            </div>

            <div className="scene-count">
                <div className="flex items-center gap-2">
                    <Film size={16} />
                    <span>{day.scenes.length} Scenes</span>
                </div>
                {day.notes && (
                    <span className="text-xs px-2 py-1 bg-white/5 rounded text-secondary">
                        Has Notes
                    </span>
                )}
            </div>
        </div>
    );
};
EOF
mkdir -p "src/features/ShootDays"
cat << 'EOF' > "src/features/ShootDays/ShootDaysView.tsx"
import React from 'react';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { SCHEDULE_DATA } from '../../utils/scheduleAdapter';
import { ShootDayCard } from './ShootDayCard';

export const ShootDaysView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Shoot Schedule</h2>
          <p className="text-secondary mt-1">One Line Schedule (Parsed from PDF)</p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-blue-600 text-white rounded-md font-medium transition-colors">
          <Plus size={18} />
          <span>New Shoot Day</span>
        </button>
      </div>

      {/* Stats / Filter Bar (Placeholder) */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        <div className="glass-panel px-4 py-3 rounded-lg flex items-center gap-3 min-w-[200px]">
          <div className="p-2 bg-green-500/10 rounded-md text-green-500">
            <CalendarIcon size={20} />
          </div>
          <div>
            <div className="text-xs text-secondary uppercase font-semibold">Next Shoot</div>
            <div className="font-medium">Oct 21 • 08:00 AM</div>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SCHEDULE_DATA.map((day) => (
          <ShootDayCard key={day.id} day={day} />
        ))}
      </div>
    </div>
  );
};
EOF
mkdir -p "src/features/TimeCards"
cat << 'EOF' > "src/features/TimeCards/TimeCardsView.tsx"
import React from 'react';

export const TimeCardsView: React.FC = () => {
    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Time Cards</h2>
            <div className="glass-panel p-8 rounded-lg">
                <p className="text-secondary">Time entry and approval interface will appear here.</p>
            </div>
        </div>
    );
};
EOF
mkdir -p "src/types"
cat << 'EOF' > "src/types/index.ts"
export type ShootStatus = 'scheduled' | 'completed' | 'cancelled' | 'scouting';

export interface Scene {
    id: string;
    sceneNumber: string;
    description: string;
    location: string;
}

export interface ShootDay {
    id: string;
    date: string; // ISO date string
    dayNumber: number;
    title: string; // e.g., "Day 1 - Studio A"
    location: string;
    callTime: string; // e.g., "07:00 AM"
    wrapTime?: string;
    status: ShootStatus;
    scenes: Scene[];
    notes?: string;
}
EOF
mkdir -p "src/utils"
cat << 'EOF' > "src/utils/scheduleAdapter.ts"
import type { ShootDay, Scene } from '../types';
import { PARSED_SCHEDULE } from '../data/parsedSchedule';

interface ParsedScene {
    slugline: string;
    timeOfDay: string;
    description: string;
    cast: string;
    sceneNum: string;
}

interface ParsedDay {
    dayNumber: number;
    date: string;
    scenes: ParsedScene[];
    rawContent: string;
}

export const adaptParsedSchedule = (parsedData: ParsedDay[]): ShootDay[] => {
    return parsedData.map((day) => {
        // Extract Call Time
        const callTimeMatch = day.rawContent.match(/Approximate Call Time:\s*(.*)/i);
        const callTime = callTimeMatch ? callTimeMatch[1].trim() : 'TBD';

        // Determine Location (heuristic: use first scene's slugline)
        const location = day.scenes.length > 0
            ? day.scenes[0].slugline
            : 'Company Move / TBD';

        // Map Scenes
        const scenes: Scene[] = day.scenes.map((scene, sIndex) => ({
            id: `d${day.dayNumber}-s${sIndex}`,
            sceneNumber: scene.sceneNum,
            description: scene.description,
            location: scene.slugline // Using slugline as location for now
        }));

        // Determine Status
        // For demo, let's say past dates are completed, future are scheduled.
        // But since dates are in 2025, they are all scheduled.
        const status = 'scheduled';

        return {
            id: `day-${day.dayNumber}`,
            dayNumber: day.dayNumber,
            date: day.date, // The UI handles date strings well enough usually, or we can parse if needed
            title: `Day ${day.dayNumber} - ${location.split('-')[0].trim()}`, // Simplified title
            location: location,
            callTime: callTime,
            status: status,
            scenes: scenes,
            notes: day.rawContent.includes('COMPANY OFF') ? 'Company Off' : undefined
        };
    });
};

export const SCHEDULE_DATA = adaptParsedSchedule(PARSED_SCHEDULE);
EOF
