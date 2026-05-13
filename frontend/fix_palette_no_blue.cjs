const fs = require('fs');
const path = require('path');
const files = [
  'vite/src/App.css',
  'vite/src/index.css',
  'vite/src/shared/styles/Dashboard.css',
  'vite/src/shared/styles/DashboardEmpleado.css'
];
const replacements = [
  // App.css palette
  [/(--accent-blue:\s*)#2f78bf;/g, '$1#92600e;'],
  [/(--accent-blue-soft:\s*)#63a3ff;/g, '$1#f3c26a;'],
  [/(background:\s*)rgba\(47,120,191,0\.15\);/g, '$1rgba(216, 139, 16, 0.16);'],
  [/(background:\s*)rgba\(47,120,191,0\.28\) 0%, transparent 65%\);/g, '$1rgba(216, 139, 16, 0.20) 0%, transparent 65%);'],
  [/(color:\s*)var\(--accent-blue-soft\);/g, '$1var(--accent-amber-soft);'],
  [/(background:\s*)var\(--accent-blue\);/g, '$1var(--accent-amber);'],
  [/(background:\s*)var\(--accent-blue-soft\);/g, '$1var(--accent-amber-soft);'],
  [/(background:\s*)linear-gradient\(135deg, var\(--accent-blue\), var\(--accent-orange\)\);/g, '$1linear-gradient(135deg, var(--accent-green), var(--accent-orange));'],
  [/(background:\s*)rgba\(47,120,191,0\.15\);/g, '$1rgba(216, 139, 16, 0.12);'],
  [/(background:\s*)rgba\(47,120,191,0\.3\);/g, '$1rgba(216, 139, 16, 0.18);'],
  [/(background:\s*)rgba\(47,120,191,0\.18\);/g, '$1rgba(216, 139, 16, 0.12);'],
  [/(border:\s*1px solid rgba\(95,163,255,0\.28\);)/g, 'border: 1px solid rgba(216,139,16,0.28);'],
  [/(background:\s*)rgba\(47,120,191,0\.15\);/g, '$1rgba(216,139,16,0.12);'],
  [/(background:\s*)rgba\(63,163,255,0\.12\);/g, '$1rgba(216,139,16,0.12);'],
  [/(border:\s*1px solid rgba\(99,153,255,0\.18\);)/g, 'border: 1px solid rgba(216,139,16,0.18);'],
  [/(border-color:\s*)var\(--accent-blue-soft\);/g, '$1var(--accent-amber-soft);'],
  [/(border-color:\s*)rgba\(99,153,255,0\.24\);/g, '$1rgba(216,139,16,0.24);'],
  [/(color:\s*)var\(--accent-blue-soft\);/g, '$1var(--accent-amber-soft);'],
  [/(color:\s*)#80b4ff;/g, '$1#d88b10;'],
  [/(background:\s*)rgba\(47,120,191,0\.2\);/g, '$1rgba(216,139,16,0.16);'],
  [/(background:\s*)rgba\(47,120,191,0\.18\);/g, '$1rgba(216,139,16,0.12);'],

  // App.css variable definitions
  [/(--primary-dark:\s*)#071c31;/g, '$1#0a2a12;'],
  [/(--primary-mid:\s*)#113052;/g, '$1#15411b;'],
  [/(--accent-green:\s*)#3d7a00;/g, '$1#3d7a00;'],
  [/(--accent-amber:\s*)#d88b10;/g, '$1#d88b10;'],
  [/(--accent-amber-soft:\s*)#f3c26a;/g, '$1#f3c26a;'],
  [/(--accent-orange:\s*)#f08f3c;/g, '$1#f08f3c;'],
  [/(--accent-soft:\s*)#6aaa00;/g, '$1#6aaa00;'],
  [/(--accent-lime:\s*)#90cc00;/g, '$1#90cc00;'],
  [/(--accent-blue:\s*)#92600e;/g, '$1#d88b10;'],
  [/(--accent-blue-soft:\s*)#f3c26a;/g, '$1#f3c26a;'],

  // Dashboard root variables
  [/(--g1:\s*)#081f3a;/g, '$1#081f20;'],
  [/(--g2:\s*)#14345b;/g, '$1#102e25;'],
  [/(--g3:\s*)#1f5a9b;/g, '$1#3e700d;'],
  [/(--gl:\s*)#2f78bf;/g, '$1#d88b10;'],
  [/(--glim:\s*)#63a3ff;/g, '$1#f3c26a;'],

  // Dashboard colors
  [/(border:\s*1px solid rgba\(63, 163, 255, 0\.3\);)/g, 'border: 1px solid rgba(216,139,16,0.28);'],
  [/(border:\s*1px solid rgba\(63, 163, 255, 0\.25\);)/g, 'border: 1px solid rgba(216,139,16,0.22);'],
  [/(border-color:\s*var\(--glim\);)/g, 'border-color: var(--glim);'],
  [/(border-color:\s*rgba\(63, 163, 255, 0\.25\);)/g, 'border-color: rgba(216,139,16,0.25);'],
  [/(border-bottom:\s*1px solid rgba\(63, 163, 255, 0\.15\);)/g, 'border-bottom: 1px solid rgba(216,139,16,0.16);'],
  [/(border-color:\s*rgba\(63, 163, 255, 0\.4\);)/g, 'border-color: rgba(216,139,16,0.35);'],
  [/(background:\s*#0b2443;)/g, 'background: #102e24;'],
  [/(border-right:\s*1px solid rgba\(63, 163, 255, 0\.1\);)/g, 'border-right: 1px solid rgba(216,139,16,0.12);'],
  [/(background:\s*rgba\(63, 163, 255, 0\.12\);)/g, 'background: rgba(216,139,16,0.12);'],
  [/(background:\s*rgba\(63, 163, 255, 0\.18\);)/g, 'background: rgba(216,139,16,0.15);'],
  [/(background:\s*rgba\(63, 163, 255, 0\.2\);)/g, 'background: rgba(216,139,16,0.16);'],
  [/(background:\s*rgba\(80, 150, 255, 0\.15\);)/g, 'background: rgba(216,139,16,0.14);'],
  [/(color:\s*#80b4ff;)/g, 'color: #d88b10;'],
  [/(background:\s*rgba\(80, 150, 255, 0\.25\) !important;)/g, 'background: rgba(216,139,16,0.16) !important;'],
  [/(border-color:\s*rgba\(80, 150, 255, 0\.4\) !important;)/g, 'border-color: rgba(216,139,16,0.32) !important;'],
  [/(background:\s*rgba\(80, 150, 255, 0\.18\) !important;)/g, 'background: rgba(216,139,16,0.14) !important;'],
  [/(background:\s*#4080f0 !important;)/g, 'background: #d88b10 !important;'],
  [/(border-color:\s*#4080f0 !important;)/g, 'border-color: #d88b10 !important;'],
  [/(background:\s*linear-gradient\(90deg, #1a5a9b, #63a3ff\);)/g, 'background: linear-gradient(90deg, #3d7a00, #f3c26a);'],
  [/(background:\s*linear-gradient\(90deg, #1a4a99, #4080f0\);)/g, 'background: linear-gradient(90deg, #4a7d0e, #d88b10);'],
  [/(border:\s*1px solid rgba\(63, 163, 255, 0\.15\);)/g, 'border: 1px solid rgba(216,139,16,0.16);'],
  [/(border-color:\s*rgba\(63, 163, 255, 0\.35\);)/g, 'border-color: rgba(216,139,16,0.35);'],
  [/(background:\s*rgba\(63, 163, 255, 0\.35\);)/g, 'background: rgba(216,139,16,0.14);'],
  [/(border-color:\s*rgba\(63, 163, 255, 0\.5\);)/g, 'border-color: rgba(216,139,16,0.45);'],
  [/(background:\s*rgba\(63, 163, 255, 0\.2\);)/g, 'background: rgba(216,139,16,0.16);'],
];

for (const file of files) {
  const filePath = path.resolve(file);
  let content = fs.readFileSync(filePath, 'utf8');
  replacements.forEach(([pattern, replacement]) => {
    if (pattern instanceof RegExp) {
      content = content.replace(pattern, replacement);
    } else {
      content = content.replace(new RegExp(pattern, 'g'), replacement);
    }
  });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('updated', file);
}
