import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ── 6 High-Quality Technical & Engineering Diagram SVG Textures (400x250) ──
const DIAGRAM_SVGS = [
  // 1. Quicksort & Divide-and-Conquer Sorting Theory
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250">
    <defs>
      <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#041820" />
        <stop offset="100%" stop-color="#020b10" />
      </linearGradient>
      <linearGradient id="beamGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#10b981" />
        <stop offset="100%" stop-color="#38bdf8" />
      </linearGradient>
      <pattern id="grid1" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(56, 189, 248, 0.08)" stroke-width="1" />
      </pattern>
    </defs>
    <rect width="400" height="250" fill="url(#g1)" rx="15" />
    <rect width="400" height="250" fill="url(#grid1)" rx="15" />
    <rect x="1" y="1" width="398" height="248" fill="none" stroke="rgba(56, 189, 248, 0.25)" stroke-width="1.5" rx="14" />
    
    <!-- Header -->
    <text x="24" y="34" fill="#38bdf8" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" letter-spacing="1">QUICKSORT • DIVIDE &amp; CONQUER</text>
    <rect x="290" y="22" width="86" height="18" rx="4" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" stroke-width="1" />
    <text x="333" y="34" fill="#10b981" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" text-anchor="middle">O(N log N)</text>
    
    <!-- Sorting Array Visualization Bars -->
    <g transform="translate(30, 60)">
      <rect x="10" y="70" width="22" height="50" rx="3" fill="#0284c7" />
      <text x="21" y="62" fill="#7dd3fc" font-family="'JetBrains Mono', monospace" font-size="9" text-anchor="middle">24</text>
      
      <rect x="42" y="30" width="22" height="90" rx="3" fill="#0284c7" />
      <text x="53" y="22" fill="#7dd3fc" font-family="'JetBrains Mono', monospace" font-size="9" text-anchor="middle">68</text>
      
      <rect x="74" y="85" width="22" height="35" rx="3" fill="#0284c7" />
      <text x="85" y="77" fill="#7dd3fc" font-family="'JetBrains Mono', monospace" font-size="9" text-anchor="middle">12</text>
      
      <!-- Pivot Element -->
      <rect x="106" y="50" width="22" height="70" rx="3" fill="#10b981" stroke="#34d399" stroke-width="1.5" />
      <text x="117" y="42" fill="#34d399" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" text-anchor="middle">PIVOT</text>
      
      <rect x="138" y="15" width="22" height="105" rx="3" fill="#0284c7" />
      <text x="149" y="8" fill="#7dd3fc" font-family="'JetBrains Mono', monospace" font-size="9" text-anchor="middle">92</text>
      
      <rect x="170" y="40" width="22" height="80" rx="3" fill="#0284c7" />
      <text x="181" y="32" fill="#7dd3fc" font-family="'JetBrains Mono', monospace" font-size="9" text-anchor="middle">55</text>
      
      <rect x="202" y="60" width="22" height="60" rx="3" fill="#0284c7" />
      <text x="213" y="52" fill="#7dd3fc" font-family="'JetBrains Mono', monospace" font-size="9" text-anchor="middle">41</text>
      
      <!-- Pointer Arrows -->
      <path d="M 21 130 L 21 142 M 18 134 L 21 130 L 24 134" stroke="#f59e0b" stroke-width="1.5" fill="none" />
      <text x="21" y="155" fill="#f59e0b" font-family="'JetBrains Mono', monospace" font-size="9" text-anchor="middle">i</text>
      
      <path d="M 213 130 L 213 142 M 210 134 L 213 130 L 216 134" stroke="#ec4899" stroke-width="1.5" fill="none" />
      <text x="213" y="155" fill="#ec4899" font-family="'JetBrains Mono', monospace" font-size="9" text-anchor="middle">j</text>
    </g>

    <!-- Metrics / Theory Footer -->
    <g transform="translate(24, 195)">
      <text x="0" y="14" fill="#a1a1aa" font-family="'JetBrains Mono', monospace" font-size="9">BEST CASE</text>
      <text x="0" y="32" fill="#fafafa" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="800">Ω(N log N)</text>
      <text x="115" y="14" fill="#a1a1aa" font-family="'JetBrains Mono', monospace" font-size="9">AVERAGE</text>
      <text x="115" y="32" fill="#fafafa" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="800">Θ(N log N)</text>
      <text x="230" y="14" fill="#a1a1aa" font-family="'JetBrains Mono', monospace" font-size="9">SPACE COMPLEXITY</text>
      <text x="230" y="32" fill="#fafafa" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="800">O(log N)</text>
    </g>
  </svg>`,

  // 2. Transformer Neural Network Architecture
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250">
    <defs>
      <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#120c24" />
        <stop offset="100%" stop-color="#080410" />
      </linearGradient>
      <pattern id="grid2" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(168, 85, 247, 0.08)" stroke-width="1" />
      </pattern>
    </defs>
    <rect width="400" height="250" fill="url(#g2)" rx="15" />
    <rect width="400" height="250" fill="url(#grid2)" rx="15" />
    <rect x="1" y="1" width="398" height="248" fill="none" stroke="rgba(168, 85, 247, 0.3)" stroke-width="1.5" rx="14" />
    
    <text x="24" y="34" fill="#c084fc" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" letter-spacing="1">TRANSFORMER ATTENTION MATRIX</text>
    <rect x="290" y="22" width="86" height="18" rx="4" fill="rgba(192, 132, 252, 0.15)" stroke="#c084fc" stroke-width="1" />
    <text x="333" y="34" fill="#c084fc" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" text-anchor="middle">HEADS: 8</text>

    <!-- Synaptic Layers & Node Flow -->
    <g transform="translate(30, 60)">
      <!-- Input Token Layer -->
      <rect x="0" y="35" width="60" height="70" rx="6" fill="#1e1338" stroke="#818cf8" stroke-width="1.5" />
      <text x="30" y="65" fill="#e4e4e7" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" text-anchor="middle">INPUT</text>
      <text x="30" y="80" fill="#818cf8" font-family="'JetBrains Mono', monospace" font-size="8" text-anchor="middle">[B, 512]</text>

      <!-- Connection Lines -->
      <path d="M 60 70 L 110 40 M 60 70 L 110 70 M 60 70 L 110 100" stroke="#a855f7" stroke-width="1.5" opacity="0.6" />

      <!-- Multi-Head Attention Core -->
      <rect x="110" y="20" width="120" height="100" rx="8" fill="#241247" stroke="#c084fc" stroke-width="1.5" />
      <text x="170" y="50" fill="#fafafa" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" text-anchor="middle">MULTI-HEAD</text>
      <text x="170" y="66" fill="#c084fc" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" text-anchor="middle">ATTENTION</text>
      <text x="170" y="88" fill="#a1a1aa" font-family="'JetBrains Mono', monospace" font-size="8" text-anchor="middle">Softmax(QK^T / √d)V</text>

      <!-- Connections to Output -->
      <path d="M 230 70 L 275 70" stroke="#38bdf8" stroke-width="2" />

      <!-- Feed Forward & Output -->
      <rect x="275" y="35" width="65" height="70" rx="6" fill="#181e3b" stroke="#38bdf8" stroke-width="1.5" />
      <text x="307" y="65" fill="#e4e4e7" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" text-anchor="middle">OUTPUT</text>
      <text x="307" y="80" fill="#38bdf8" font-family="'JetBrains Mono', monospace" font-size="8" text-anchor="middle">[B, Vocab]</text>
    </g>

    <!-- Footer specs -->
    <text x="24" y="222" fill="#71717a" font-family="'JetBrains Mono', monospace" font-size="9.5">DIM: 768 • PARAMS: 175M • D_MODEL: 64 • ACTIVATION: GeLU</text>
  </svg>`,

  // 3. 555 Timer & Circuit Schematic Blueprint
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250">
    <defs>
      <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#081424" />
        <stop offset="100%" stop-color="#040912" />
      </linearGradient>
      <pattern id="grid3" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(56, 189, 248, 0.08)" stroke-width="1" />
      </pattern>
    </defs>
    <rect width="400" height="250" fill="url(#g3)" rx="15" />
    <rect width="400" height="250" fill="url(#grid3)" rx="15" />
    <rect x="1" y="1" width="398" height="248" fill="none" stroke="rgba(56, 189, 248, 0.3)" stroke-width="1.5" rx="14" />
    
    <text x="24" y="34" fill="#38bdf8" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" letter-spacing="1">NE555 ASTABLE MULTIVIBRATOR</text>
    <rect x="295" y="22" width="81" height="18" rx="4" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" stroke-width="1" />
    <text x="335" y="34" fill="#38bdf8" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" text-anchor="middle">f = 1.44 kHz</text>

    <!-- Circuit IC Chip & Connections -->
    <g transform="translate(130, 60)">
      <!-- 555 DIP-8 IC Body -->
      <rect x="0" y="0" width="140" height="100" rx="8" fill="#0f172a" stroke="#38bdf8" stroke-width="2" />
      <circle cx="15" cy="15" r="4" fill="#38bdf8" />
      <text x="70" y="48" fill="#fafafa" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="800" text-anchor="middle">NE555 IC</text>
      <text x="70" y="66" fill="#64748b" font-family="'JetBrains Mono', monospace" font-size="9" text-anchor="middle">PRECISION TIMER</text>

      <!-- Pins & Labels -->
      <line x1="-30" y1="20" x2="0" y2="20" stroke="#f59e0b" stroke-width="2" />
      <text x="-35" y="24" fill="#f59e0b" font-family="'JetBrains Mono', monospace" font-size="9" text-anchor="end">GND (1)</text>

      <line x1="-30" y1="50" x2="0" y2="50" stroke="#f59e0b" stroke-width="2" />
      <text x="-35" y="54" fill="#f59e0b" font-family="'JetBrains Mono', monospace" font-size="9" text-anchor="end">TRIG (2)</text>

      <line x1="-30" y1="80" x2="0" y2="80" stroke="#f59e0b" stroke-width="2" />
      <text x="-35" y="84" fill="#f59e0b" font-family="'JetBrains Mono', monospace" font-size="9" text-anchor="end">OUT (3)</text>

      <line x1="140" y1="20" x2="170" y2="20" stroke="#10b981" stroke-width="2" />
      <text x="175" y="24" fill="#10b981" font-family="'JetBrains Mono', monospace" font-size="9">VCC (8)</text>

      <line x1="140" y1="50" x2="170" y2="50" stroke="#10b981" stroke-width="2" />
      <text x="175" y="54" fill="#10b981" font-family="'JetBrains Mono', monospace" font-size="9">DISCH (7)</text>

      <line x1="140" y1="80" x2="170" y2="80" stroke="#10b981" stroke-width="2" />
      <text x="175" y="84" fill="#10b981" font-family="'JetBrains Mono', monospace" font-size="9">THRES (6)</text>
    </g>

    <!-- Pulse Signal Output Track -->
    <path d="M 30 185 L 60 185 L 60 165 L 110 165 L 110 185 L 160 185 L 160 165 L 210 165 L 210 185 L 260 185 L 260 165 L 310 165 L 310 185 L 370 185" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linejoin="round" />
    <text x="24" y="222" fill="#71717a" font-family="'JetBrains Mono', monospace" font-size="9.5">DUTY CYCLE: 66.7% • R1: 1kΩ • R2: 10kΩ • C1: 100nF • VCC: +5V</text>
  </svg>`,

  // 4. DNA Double Helix Molecular Model
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250">
    <defs>
      <linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#031818" />
        <stop offset="100%" stop-color="#010c0c" />
      </linearGradient>
      <pattern id="grid4" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(16, 185, 129, 0.08)" stroke-width="1" />
      </pattern>
    </defs>
    <rect width="400" height="250" fill="url(#g4)" rx="15" />
    <rect width="400" height="250" fill="url(#grid4)" rx="15" />
    <rect x="1" y="1" width="398" height="248" fill="none" stroke="rgba(16, 185, 129, 0.3)" stroke-width="1.5" rx="14" />
    
    <text x="24" y="34" fill="#34d399" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" letter-spacing="1">DNA B-FORM MOLECULAR HELIX</text>
    <rect x="290" y="22" width="86" height="18" rx="4" fill="rgba(16, 185, 129, 0.15)" stroke="#34d399" stroke-width="1" />
    <text x="333" y="34" fill="#34d399" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" text-anchor="middle">3.4nm PITCH</text>

    <!-- DNA Double Helix Base Pairs (Sine Wave Lattice) -->
    <g transform="translate(30, 115)">
      <!-- Base Rungs -->
      <line x1="20" y1="-30" x2="20" y2="30" stroke="#06b6d4" stroke-width="2.5" />
      <circle cx="20" cy="-30" r="4.5" fill="#38bdf8" />
      <circle cx="20" cy="30" r="4.5" fill="#10b981" />

      <line x1="60" y1="-45" x2="60" y2="45" stroke="#a78bfa" stroke-width="2.5" />
      <circle cx="60" cy="-45" r="4.5" fill="#c084fc" />
      <circle cx="60" cy="45" r="4.5" fill="#f59e0b" />

      <line x1="100" y1="-35" x2="100" y2="35" stroke="#ec4899" stroke-width="2.5" />
      <circle cx="100" cy="-35" r="4.5" fill="#f43f5e" />
      <circle cx="100" cy="35" r="4.5" fill="#38bdf8" />

      <line x1="140" y1="0" x2="140" y2="0" stroke="#10b981" stroke-width="2.5" />
      <circle cx="140" cy="0" r="5" fill="#10b981" />

      <line x1="180" y1="35" x2="180" y2="-35" stroke="#06b6d4" stroke-width="2.5" />
      <circle cx="180" cy="35" r="4.5" fill="#38bdf8" />
      <circle cx="180" cy="-35" r="4.5" fill="#10b981" />

      <line x1="220" y1="45" x2="220" y2="-45" stroke="#a78bfa" stroke-width="2.5" />
      <circle cx="220" cy="45" r="4.5" fill="#c084fc" />
      <circle cx="220" cy="-45" r="4.5" fill="#f59e0b" />

      <line x1="260" y1="30" x2="260" y2="-30" stroke="#ec4899" stroke-width="2.5" />
      <circle cx="260" cy="30" r="4.5" fill="#f43f5e" />
      <circle cx="260" cy="-30" r="4.5" fill="#38bdf8" />

      <line x1="300" y1="0" x2="300" y2="0" stroke="#10b981" stroke-width="2.5" />
      <circle cx="300" cy="0" r="5" fill="#10b981" />

      <line x1="330" y1="-35" x2="330" y2="35" stroke="#06b6d4" stroke-width="2.5" />
      <circle cx="330" cy="-35" r="4.5" fill="#38bdf8" />
      <circle cx="330" cy="35" r="4.5" fill="#10b981" />

      <!-- Helical Ribose Backbone Strands -->
      <path d="M 0 -20 Q 60 -60 140 0 T 300 0 T 350 -40" fill="none" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" />
      <path d="M 0 20 Q 60 60 140 0 T 300 0 T 350 40" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" />
    </g>

    <text x="24" y="222" fill="#71717a" font-family="'JetBrains Mono', monospace" font-size="9.5">BASE PAIRS: ADENINE-THYMINE [2 H-BONDS] • GUANINE-CYTOSINE [3 H-BONDS]</text>
  </svg>`,

  // 5. Distributed Cloud & Microservices Mesh
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250">
    <defs>
      <linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#091426" />
        <stop offset="100%" stop-color="#040812" />
      </linearGradient>
      <pattern id="grid5" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(56, 189, 248, 0.08)" stroke-width="1" />
      </pattern>
    </defs>
    <rect width="400" height="250" fill="url(#g5)" rx="15" />
    <rect width="400" height="250" fill="url(#grid5)" rx="15" />
    <rect x="1" y="1" width="398" height="248" fill="none" stroke="rgba(56, 189, 248, 0.25)" stroke-width="1.5" rx="14" />
    
    <text x="24" y="34" fill="#38bdf8" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" letter-spacing="1">DISTRIBUTED SYSTEM MESH</text>
    <rect x="295" y="22" width="81" height="18" rx="4" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" stroke-width="1" />
    <text x="335" y="34" fill="#38bdf8" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" text-anchor="middle">SLA 99.999%</text>

    <!-- Mesh Nodes & Clusters -->
    <g transform="translate(30, 60)">
      <!-- API Gateway -->
      <rect x="0" y="30" width="70" height="50" rx="6" fill="#0f213d" stroke="#38bdf8" stroke-width="1.5" />
      <text x="35" y="52" fill="#fafafa" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" text-anchor="middle">API</text>
      <text x="35" y="66" fill="#38bdf8" font-family="'JetBrains Mono', monospace" font-size="8" text-anchor="middle">GATEWAY</text>

      <!-- Connection Vectors -->
      <path d="M 70 55 L 130 25 M 70 55 L 130 55 M 70 55 L 130 85" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4 2" />

      <!-- Microservices Cluster -->
      <rect x="130" y="5" width="80" height="35" rx="4" fill="#18223d" stroke="#10b981" stroke-width="1.5" />
      <text x="170" y="26" fill="#10b981" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" text-anchor="middle">AUTH POD</text>

      <rect x="130" y="45" width="80" height="35" rx="4" fill="#18223d" stroke="#818cf8" stroke-width="1.5" />
      <text x="170" y="66" fill="#818cf8" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" text-anchor="middle">AI INFERENCE</text>

      <rect x="130" y="85" width="80" height="35" rx="4" fill="#18223d" stroke="#ec4899" stroke-width="1.5" />
      <text x="170" y="106" fill="#ec4899" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" text-anchor="middle">VECTOR DB</text>

      <!-- Connections to Database -->
      <path d="M 210 25 L 260 55 M 210 65 L 260 55 M 210 100 L 260 55" stroke="#f59e0b" stroke-width="1.5" />

      <!-- Distributed Storage Engine -->
      <rect x="260" y="30" width="80" height="50" rx="6" fill="#2d1c08" stroke="#f59e0b" stroke-width="1.5" />
      <text x="300" y="52" fill="#fafafa" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" text-anchor="middle">REDIS / DB</text>
      <text x="300" y="66" fill="#f59e0b" font-family="'JetBrains Mono', monospace" font-size="8" text-anchor="middle">SHARD CLUSTER</text>
    </g>

    <text x="24" y="222" fill="#71717a" font-family="'JetBrains Mono', monospace" font-size="9.5">KUBERNETES v1.30 • TLS 1.3 • LATENCY: 2.1ms • SHARD REPLICATION: 3x</text>
  </svg>`,

  // 6. AVL Tree & Binary Search Traversal Blueprint
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250">
    <defs>
      <linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#140b24" />
        <stop offset="100%" stop-color="#06030c" />
      </linearGradient>
      <pattern id="grid6" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(192, 132, 252, 0.08)" stroke-width="1" />
      </pattern>
    </defs>
    <rect width="400" height="250" fill="url(#g6)" rx="15" />
    <rect width="400" height="250" fill="url(#grid6)" rx="15" />
    <rect x="1" y="1" width="398" height="248" fill="none" stroke="rgba(192, 132, 252, 0.3)" stroke-width="1.5" rx="14" />
    
    <text x="24" y="34" fill="#c084fc" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" letter-spacing="1">AVL BALANCED BINARY SEARCH TREE</text>
    <rect x="295" y="22" width="81" height="18" rx="4" fill="rgba(192, 132, 252, 0.15)" stroke="#c084fc" stroke-width="1" />
    <text x="335" y="34" fill="#c084fc" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" text-anchor="middle">O(log N)</text>

    <!-- Tree Nodes & Edges -->
    <g transform="translate(40, 50)">
      <!-- Root Node (50) -->
      <line x1="160" y1="20" x2="80" y2="70" stroke="#818cf8" stroke-width="2" />
      <line x1="160" y1="20" x2="240" y2="70" stroke="#818cf8" stroke-width="2" />
      <circle cx="160" cy="20" r="18" fill="#2e1065" stroke="#c084fc" stroke-width="2" />
      <text x="160" y="25" fill="#ffffff" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="800" text-anchor="middle">50</text>

      <!-- Level 1 (25, 75) -->
      <line x1="80" y1="70" x2="40" y2="120" stroke="#a78bfa" stroke-width="1.5" />
      <line x1="80" y1="70" x2="120" y2="120" stroke="#a78bfa" stroke-width="1.5" />
      <circle cx="80" cy="70" r="15" fill="#1e1338" stroke="#818cf8" stroke-width="1.5" />
      <text x="80" y="74" fill="#ffffff" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" text-anchor="middle">25</text>

      <line x1="240" y1="70" x2="200" y2="120" stroke="#a78bfa" stroke-width="1.5" />
      <line x1="240" y1="70" x2="280" y2="120" stroke="#a78bfa" stroke-width="1.5" />
      <circle cx="240" cy="70" r="15" fill="#1e1338" stroke="#818cf8" stroke-width="1.5" />
      <text x="240" y="74" fill="#ffffff" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" text-anchor="middle">75</text>

      <!-- Level 2 Leaf Nodes -->
      <circle cx="40" cy="120" r="13" fill="#0f091d" stroke="#38bdf8" stroke-width="1.5" />
      <text x="40" y="124" fill="#38bdf8" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" text-anchor="middle">10</text>

      <circle cx="120" cy="120" r="13" fill="#0f091d" stroke="#38bdf8" stroke-width="1.5" />
      <text x="120" y="124" fill="#38bdf8" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" text-anchor="middle">35</text>

      <circle cx="200" cy="120" r="13" fill="#0f091d" stroke="#38bdf8" stroke-width="1.5" />
      <text x="200" y="124" fill="#38bdf8" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" text-anchor="middle">60</text>

      <circle cx="280" cy="120" r="13" fill="#0f091d" stroke="#38bdf8" stroke-width="1.5" />
      <text x="280" y="124" fill="#38bdf8" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" text-anchor="middle">90</text>
    </g>

    <text x="24" y="222" fill="#71717a" font-family="'JetBrains Mono', monospace" font-size="9.5">ROTATION: LL / RR / LR / RL • BALANCE FACTOR ∈ {-1, 0, 1} • SEARCH: O(log N)</text>
  </svg>`
];

// Convert SVGs to clean data URIs for instant fast rendering
const DIAGRAM_DATA_URIS = DIAGRAM_SVGS.map(
  (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
);

function generateCode(width, height) {
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[randInt(0, arr.length - 1)];

  const header = [
    "// compiled diagram preview • telemetry stream",
    "/* generated for visual shader effect – not executed */",
    "const SCAN_WIDTH = 8;",
    "const FADE_ZONE = 35;",
    "const MAX_PARTICLES = 2500;",
    "const TRANSITION = 0.05;",
  ];

  const helpers = [
    "function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }",
    "function lerp(a, b, t) { return a + (b - a) * t; }",
    "const now = () => performance.now();",
    "function rng(min, max) { return Math.random() * (max - min) + min; }",
  ];

  const particleBlock = (idx) => [
    `class Particle${idx} {`,
    "  constructor(x, y, vx, vy, r, a) {",
    "    this.x = x; this.y = y;",
    "    this.vx = vx; this.vy = vy;",
    "    this.r = r; this.a = a;",
    "  }",
    "  step(dt) { this.x += this.vx * dt; this.y += this.vy * dt; }",
    "}",
  ];

  const scannerBlock = [
    "const scanner = {",
    "  x: Math.floor(window.innerWidth / 2),",
    "  width: SCAN_WIDTH,",
    "  glow: 3.5,",
    "};",
    "",
    "function drawParticle(ctx, p) {",
    "  ctx.globalAlpha = clamp(p.a, 0, 1);",
    "  ctx.drawImage(gradient, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);",
    "}",
  ];

  const library = [];
  header.forEach((l) => library.push(l));
  helpers.forEach((l) => library.push(l));
  for (let b = 0; b < 3; b++) particleBlock(b).forEach((l) => library.push(l));
  scannerBlock.forEach((l) => library.push(l));

  for (let i = 0; i < 40; i++) {
    const n1 = randInt(1, 9);
    const n2 = randInt(10, 99);
    library.push(`const v${i} = (${n1} + ${n2}) * 0.${randInt(1, 9)};`);
  }

  let flow = library.join(" ").replace(/\s+/g, " ").trim();
  const totalChars = width * height;
  while (flow.length < totalChars + width) {
    const extra = pick(library).replace(/\s+/g, " ").trim();
    flow += " " + extra;
  }

  let out = "";
  let offset = 0;
  for (let row = 0; row < height; row++) {
    let line = flow.slice(offset, offset + width);
    if (line.length < width) line = line + " ".repeat(width - line.length);
    out += line + (row < height - 1 ? "\n" : "");
    offset += width;
  }
  return out;
}

export default function CardBeamAnimation() {
  const containerRef = useRef(null);
  const cardLineRef = useRef(null);
  const particleCanvasRef = useRef(null);
  const scannerCanvasRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const cardLine = cardLineRef.current;
    const pCanvas = particleCanvasRef.current;
    const sCanvas = scannerCanvasRef.current;
    if (!container || !cardLine || !pCanvas || !sCanvas) return;

    let isDestroyed = false;
    let animFrameId = null;

    // ── 1. Infinite Continuous Diagram Stream ──
    const cardWidth = 400;
    const cardGap = 60;
    const singleSetCount = 6;
    const totalCards = singleSetCount * 3; // 18 cards for seamless loop
    const halfWidth = (cardWidth + cardGap) * singleSetCount;

    let position = 0;
    const velocity = 120; // px/sec
    let lastTime = performance.now();
    let isScanningActive = false;

    // Populate Cards with High-Res Technical Diagram Textures
    cardLine.innerHTML = '';
    for (let i = 0; i < totalCards; i++) {
      const wrapper = document.createElement("div");
      wrapper.className = "card-wrapper";

      const normalCard = document.createElement("div");
      normalCard.className = "card card-normal";

      const diagramImg = document.createElement("img");
      diagramImg.className = "card-image";
      diagramImg.src = DIAGRAM_DATA_URIS[i % DIAGRAM_DATA_URIS.length];
      diagramImg.alt = "Technical Diagram";

      normalCard.appendChild(diagramImg);

      const asciiCard = document.createElement("div");
      asciiCard.className = "card card-ascii";

      const asciiContent = document.createElement("div");
      asciiContent.className = "ascii-content";
      asciiContent.style.fontSize = "11px";
      asciiContent.style.lineHeight = "13px";
      asciiContent.textContent = generateCode(66, 19);

      asciiCard.appendChild(asciiContent);
      wrapper.appendChild(normalCard);
      wrapper.appendChild(asciiCard);
      cardLine.appendChild(wrapper);
    }

    // ── 2. Three.js Particle Starfield ──
    let threeScene, threeCamera, threeRenderer, threeParticles;
    const pCount = 300;
    const velocities = new Float32Array(pCount);

    try {
      threeScene = new THREE.Scene();
      const w = window.innerWidth;
      const h = container.clientHeight || 260;

      threeCamera = new THREE.OrthographicCamera(-w / 2, w / 2, 125, -125, 1, 1000);
      threeCamera.position.z = 100;

      threeRenderer = new THREE.WebGLRenderer({
        canvas: pCanvas,
        alpha: true,
        antialias: true,
      });
      threeRenderer.setSize(w, h);
      threeRenderer.setClearColor(0x000000, 0);

      const geom = new THREE.BufferGeometry();
      const pos = new Float32Array(pCount * 3);
      const alphas = new Float32Array(pCount);

      const tCanvas = document.createElement("canvas");
      tCanvas.width = 100;
      tCanvas.height = 100;
      const tCtx = tCanvas.getContext("2d");
      const half = tCanvas.width / 2;
      const hue = 217;

      const grad = tCtx.createRadialGradient(half, half, 0, half, half, half);
      grad.addColorStop(0.025, "#fff");
      grad.addColorStop(0.1, `hsl(${hue}, 61%, 33%)`);
      grad.addColorStop(0.25, `hsl(${hue}, 64%, 6%)`);
      grad.addColorStop(1, "transparent");

      tCtx.fillStyle = grad;
      tCtx.beginPath();
      tCtx.arc(half, half, half, 0, Math.PI * 2);
      tCtx.fill();

      const texture = new THREE.CanvasTexture(tCanvas);

      for (let i = 0; i < pCount; i++) {
        pos[i * 3] = (Math.random() - 0.5) * w * 2;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 250;
        pos[i * 3 + 2] = 0;
        alphas[i] = (Math.random() * 8 + 2) / 10;
        velocities[i] = Math.random() * 60 + 30;
      }

      geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geom.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));

      const mat = new THREE.ShaderMaterial({
        uniforms: {
          pointTexture: { value: texture },
          size: { value: 15.0 },
        },
        vertexShader: `
          attribute float alpha;
          varying float vAlpha;
          uniform float size;
          void main() {
            vAlpha = alpha;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform sampler2D pointTexture;
          varying float vAlpha;
          void main() {
            gl_FragColor = vec4(1.0, 1.0, 1.0, vAlpha) * texture2D(pointTexture, gl_PointCoord);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      threeParticles = new THREE.Points(geom, mat);
      threeScene.add(threeParticles);
    } catch (e) {
      console.warn("Three.js particle init skipped:", e);
    }

    // ── 3. 2D Particle Scanner Laser Beam ──
    const sCtx = sCanvas.getContext("2d");
    let sw = window.innerWidth;
    let sh = container.clientHeight || 260;

    const setupScannerCanvas = () => {
      sw = window.innerWidth;
      sh = container.clientHeight || 260;
      sCanvas.width = sw;
      sCanvas.height = sh;
    };
    setupScannerCanvas();

    const gradientCanvas = document.createElement("canvas");
    const gradientCtx = gradientCanvas.getContext("2d");
    gradientCanvas.width = 16;
    gradientCanvas.height = 16;
    const gHalf = 8;
    const gRad = gradientCtx.createRadialGradient(gHalf, gHalf, 0, gHalf, gHalf, gHalf);
    gRad.addColorStop(0, "rgba(255, 255, 255, 1)");
    gRad.addColorStop(0.3, "rgba(196, 181, 253, 0.8)");
    gRad.addColorStop(0.7, "rgba(139, 92, 246, 0.4)");
    gRad.addColorStop(1, "transparent");
    gradientCtx.fillStyle = gRad;
    gradientCtx.beginPath();
    gradientCtx.arc(gHalf, gHalf, gHalf, 0, Math.PI * 2);
    gradientCtx.fill();

    const particles = [];
    const maxParticles = 400;
    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: sw / 2 + (Math.random() - 0.5) * 6,
        y: Math.random() * sh,
        vx: Math.random() * 0.8 + 0.2,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.4 + 0.6,
        life: Math.random(),
        decay: Math.random() * 0.008 + 0.004,
      });
    }

    const asciiInterval = setInterval(() => {
      const asciiEls = cardLine.querySelectorAll(".ascii-content");
      asciiEls.forEach((el) => {
        if (Math.random() < 0.15) {
          el.textContent = generateCode(66, 19);
        }
      });
    }, 200);

    // ── Main Animation Loop ──
    const renderLoop = (time) => {
      if (isDestroyed) return;
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // Scroll position with seamless wrapping
      position -= velocity * dt;
      if (position <= -halfWidth) {
        position += halfWidth;
      }
      cardLine.style.transform = `translateX(${position}px)`;

      // Scanner position: exact window center
      const scannerX = window.innerWidth / 2;
      let anyScanning = false;

      // Pixel-perfect clipping for each diagram card
      const wrappers = cardLine.children;
      for (let i = 0; i < wrappers.length; i++) {
        const wrap = wrappers[i];
        const rect = wrap.getBoundingClientRect();
        const cardLeft = rect.left;
        const cardRight = rect.right;

        const normal = wrap.querySelector(".card-normal");
        const ascii = wrap.querySelector(".card-ascii");
        if (!normal || !ascii) continue;

        if (cardLeft < scannerX && cardRight > scannerX) {
          anyScanning = true;
          const pct = Math.max(0, Math.min(100, ((scannerX - cardLeft) / cardWidth) * 100));

          normal.style.setProperty("--clip-right", `${pct}%`);
          ascii.style.setProperty("--clip-left", `${pct}%`);
        } else if (cardRight <= scannerX) {
          normal.style.setProperty("--clip-right", "100%");
          ascii.style.setProperty("--clip-left", "100%");
        } else {
          normal.style.setProperty("--clip-right", "0%");
          ascii.style.setProperty("--clip-left", "0%");
        }
      }
      isScanningActive = anyScanning;

      // Three.js stars
      if (threeParticles && threeRenderer && threeScene && threeCamera) {
        const pArr = threeParticles.geometry.attributes.position.array;
        const aArr = threeParticles.geometry.attributes.alpha.array;
        const t = time * 0.001;

        for (let i = 0; i < pCount; i++) {
          pArr[i * 3] += velocities[i] * dt;
          if (pArr[i * 3] > window.innerWidth / 2 + 100) {
            pArr[i * 3] = -window.innerWidth / 2 - 100;
            pArr[i * 3 + 1] = (Math.random() - 0.5) * 250;
          }
          pArr[i * 3 + 1] += Math.sin(t + i * 0.1) * 0.3;
        }
        threeParticles.geometry.attributes.position.needsUpdate = true;
        threeParticles.geometry.attributes.alpha.needsUpdate = true;
        threeRenderer.render(threeScene, threeCamera);
      }

      // 2D Laser Light Bar
      sCtx.clearRect(0, 0, sw, sh);

      const beamX = window.innerWidth / 2;
      const glow = isScanningActive ? 3.0 : 1.2;
      const lineWidth = 4;

      sCtx.globalCompositeOperation = "lighter";

      // Glow Layer 2 (Wide Purple)
      const g2 = sCtx.createLinearGradient(beamX - lineWidth * 5, 0, beamX + lineWidth * 5, 0);
      g2.addColorStop(0, "rgba(139, 92, 246, 0)");
      g2.addColorStop(0.5, `rgba(139, 92, 246, ${0.45 * glow})`);
      g2.addColorStop(1, "rgba(139, 92, 246, 0)");
      sCtx.fillStyle = g2;
      sCtx.fillRect(beamX - lineWidth * 5, 0, lineWidth * 10, sh);

      // Glow Layer 1 (Bright Violet)
      const g1 = sCtx.createLinearGradient(beamX - lineWidth * 2.5, 0, beamX + lineWidth * 2.5, 0);
      g1.addColorStop(0, "rgba(139, 92, 246, 0)");
      g1.addColorStop(0.5, `rgba(196, 181, 253, ${0.85 * glow})`);
      g1.addColorStop(1, "rgba(139, 92, 246, 0)");
      sCtx.fillStyle = g1;
      sCtx.fillRect(beamX - lineWidth * 2.5, 0, lineWidth * 5, sh);

      // Laser Core (Pure White)
      const gCore = sCtx.createLinearGradient(beamX - lineWidth / 2, 0, beamX + lineWidth / 2, 0);
      gCore.addColorStop(0, "rgba(255, 255, 255, 0)");
      gCore.addColorStop(0.5, `rgba(255, 255, 255, ${1 * glow})`);
      gCore.addColorStop(1, "rgba(255, 255, 255, 0)");
      sCtx.fillStyle = gCore;
      sCtx.fillRect(beamX - lineWidth / 2, 0, lineWidth, sh);

      // Soft vertical fade on laser
      const vertGrad = sCtx.createLinearGradient(0, 0, 0, sh);
      vertGrad.addColorStop(0, "rgba(0,0,0,1)");
      vertGrad.addColorStop(0.15, "rgba(0,0,0,0)");
      vertGrad.addColorStop(0.85, "rgba(0,0,0,0)");
      vertGrad.addColorStop(1, "rgba(0,0,0,1)");
      sCtx.globalCompositeOperation = "destination-out";
      sCtx.fillStyle = vertGrad;
      sCtx.fillRect(beamX - lineWidth * 6, 0, lineWidth * 12, sh);

      // Spray Particles to the right
      sCtx.globalCompositeOperation = "lighter";
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0 || p.x > sw + 10) {
          p.x = beamX + (Math.random() - 0.5) * 4;
          p.y = Math.random() * sh;
          p.vx = Math.random() * 0.9 + 0.3;
          p.vy = (Math.random() - 0.5) * 0.3;
          p.life = 1.0;
        }

        sCtx.globalAlpha = p.alpha * p.life;
        sCtx.drawImage(gradientCanvas, p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
      }

      animFrameId = requestAnimationFrame(renderLoop);
    };

    animFrameId = requestAnimationFrame(renderLoop);

    const handleResize = () => {
      setupScannerCanvas();
      if (threeCamera && threeRenderer && container) {
        const w = window.innerWidth;
        const h = container.clientHeight || 260;
        threeCamera.left = -w / 2;
        threeCamera.right = w / 2;
        threeCamera.updateProjectionMatrix();
        threeRenderer.setSize(w, 250);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      isDestroyed = true;
      clearInterval(asciiInterval);
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener("resize", handleResize);
      if (threeRenderer) threeRenderer.dispose();
      if (threeParticles) {
        threeParticles.geometry.dispose();
        threeParticles.material.dispose();
      }
    };
  }, []);

  return (
    <div className="card-beam-container" ref={containerRef}>
      <canvas id="particleCanvas" ref={particleCanvasRef} />
      <canvas id="scannerCanvas" ref={scannerCanvasRef} />
      <div className="card-stream" id="cardStream">
        <div className="card-line" id="cardLine" ref={cardLineRef} />
      </div>
    </div>
  );
}
