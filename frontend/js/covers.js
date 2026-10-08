/**
 * ============================================================
 * MADHU BOOKHUB — Editorial Book Cover Visual System
 * File: frontend/js/covers.js
 *
 * CONCEPT: High-Fidelity Procedural Book Covers
 * When physical image uploads are unavailable or external CDNs fail,
 * this engine generates bespoke, publisher-grade SVG book covers
 * directly in the browser. Zero broken images, zero network delay.
 *
 * Features:
 *   1. Category-specific chromatic palettes & geometric patterns
 *   2. Physical book geometry (spine binding groove, book crease)
 *   3. Editorial typography layout with automatic title wrapping
 *   4. Gold & silver foil insignia and publisher watermark
 *   5. Seamless Open Library cover loading with zero-flicker SVG fallback
 * ============================================================
 */

'use strict';

const BookCover = (() => {
  // ── Genre-specific chromatic palettes & motifs ─────────────
  const THEMES = {
    Programming: {
      bg1: '#0F172A',
      bg2: '#1E293B',
      accent: '#38BDF8',
      foil: '#7DD3FC',
      pattern: 'circuits',
      tag: 'TECH & CODE',
    },
    Science: {
      bg1: '#064E3B',
      bg2: '#065F46',
      accent: '#34D399',
      foil: '#A7F3D0',
      pattern: 'orbital',
      tag: 'SCIENCE & NATURE',
    },
    History: {
      bg1: '#451A03',
      bg2: '#78350F',
      accent: '#FBBF24',
      foil: '#FDE68A',
      pattern: 'classic',
      tag: 'HISTORY & CIVILIZATION',
    },
    Economics: {
      bg1: '#1E1B4B',
      bg2: '#312E81',
      accent: '#F59E0B',
      foil: '#FCD34D',
      pattern: 'geometric',
      tag: 'FINANCE & ECONOMY',
    },
    Fiction: {
      bg1: '#4A044E',
      bg2: '#701A75',
      accent: '#F472B6',
      foil: '#FBCFE8',
      pattern: 'constellation',
      tag: 'LITERATURE & FICTION',
    },
    Technology: {
      bg1: '#0A0F1D',
      bg2: '#1E293B',
      accent: '#60A5FA',
      foil: '#93C5FD',
      pattern: 'circuits',
      tag: 'TECHNOLOGY',
    },
    Business: {
      bg1: '#111827',
      bg2: '#1F2937',
      accent: '#F59E0B',
      foil: '#FBBF24',
      pattern: 'stripes',
      tag: 'BUSINESS & LEADERSHIP',
    },
    Mathematics: {
      bg1: '#1E293B',
      bg2: '#334155',
      accent: '#818CF8',
      foil: '#C7D2FE',
      pattern: 'geometric',
      tag: 'MATHEMATICS',
    },
    Default: {
      bg1: '#0F172A',
      bg2: '#1E293B',
      accent: '#D97706',
      foil: '#FDE68A',
      pattern: 'minimal',
      tag: 'MADHU SELECTION',
    },
  };

  /**
   * Helper: wrap title into max 3 lines for the cover SVG
   */
  function wrapText(text, maxCharsPerLine = 18, maxLines = 3) {
    if (!text) return ['Untitled'];
    const words = text.trim().split(/\s+/);
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
        if (lines.length === maxLines - 1) break;
      }
    }
    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine);
    }
    if (lines.length === maxLines && words.length > lines.join(' ').split(/\s+/).length) {
      lines[lines.length - 1] = lines[lines.length - 1].slice(0, maxCharsPerLine - 2) + '…';
    }
    return lines;
  }

  /**
   * Generates a complete standalone SVG Data URL representing the book cover
   */
  function generateSvgDataUri(book) {
    const category = (book.category || 'Default').trim();
    const theme = THEMES[category] || THEMES.Default;
    const titleLines = wrapText(book.title || 'Untitled', 16, 3);
    const author = (book.author || 'Unknown Author').trim().slice(0, 26);
    const tag = theme.tag;

    // Pattern graphics based on genre
    let patternSvg = '';
    if (theme.pattern === 'circuits') {
      patternSvg = `
        <circle cx="160" cy="90" r="40" fill="none" stroke="${theme.accent}" stroke-width="0.75" stroke-dasharray="3,3" opacity="0.3"/>
        <line x1="80" y1="90" x2="240" y2="90" stroke="${theme.accent}" stroke-width="0.5" opacity="0.25"/>
        <line x1="160" y1="20" x2="160" y2="160" stroke="${theme.accent}" stroke-width="0.5" opacity="0.25"/>
        <rect x="154" y="84" width="12" height="12" fill="${theme.accent}" opacity="0.5" rx="2"/>
      `;
    } else if (theme.pattern === 'orbital') {
      patternSvg = `
        <ellipse cx="160" cy="95" rx="55" ry="22" fill="none" stroke="${theme.accent}" stroke-width="0.75" opacity="0.3" transform="rotate(-25 160 95)"/>
        <ellipse cx="160" cy="95" rx="55" ry="22" fill="none" stroke="${theme.accent}" stroke-width="0.75" opacity="0.3" transform="rotate(35 160 95)"/>
        <circle cx="160" cy="95" r="8" fill="${theme.foil}" opacity="0.6"/>
      `;
    } else if (theme.pattern === 'classic') {
      patternSvg = `
        <rect x="40" y="24" width="240" height="372" fill="none" stroke="${theme.foil}" stroke-width="0.75" opacity="0.25"/>
        <rect x="46" y="30" width="228" height="360" fill="none" stroke="${theme.foil}" stroke-width="0.5" opacity="0.2"/>
        <circle cx="160" cy="90" r="22" fill="none" stroke="${theme.foil}" stroke-width="0.75" opacity="0.4"/>
      `;
    } else {
      patternSvg = `
        <circle cx="160" cy="90" r="46" fill="none" stroke="${theme.accent}" stroke-width="0.75" opacity="0.25"/>
        <polygon points="160,65 180,105 140,105" fill="none" stroke="${theme.foil}" stroke-width="0.75" opacity="0.35"/>
      `;
    }

    // SVG Title text spans
    const startY = 175;
    const lineSpacing = 24;
    const titleSvg = titleLines.map((line, idx) => {
      const y = startY + (idx * lineSpacing);
      return `<text x="160" y="${y}" text-anchor="middle" font-family="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="18" fill="#FFFFFF" letter-spacing="0.02em">${escapeXml(line)}</text>`;
    }).join('\n');

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 440" width="100%" height="100%">
        <defs>
          <!-- Base Cover Gradient -->
          <linearGradient id="coverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${theme.bg1}"/>
            <stop offset="100%" stop-color="${theme.bg2}"/>
          </linearGradient>

          <!-- Spine Shadow Gradient (Real book depth) -->
          <linearGradient id="spineShadow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="rgba(0,0,0,0.5)"/>
            <stop offset="3%" stop-color="rgba(255,255,255,0.12)"/>
            <stop offset="6%" stop-color="rgba(0,0,0,0.4)"/>
            <stop offset="10%" stop-color="rgba(0,0,0,0.02)"/>
            <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
          </linearGradient>

          <!-- Outer Edge Highlight -->
          <linearGradient id="edgeGlow" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="rgba(255,255,255,0.15)"/>
            <stop offset="3%" stop-color="rgba(0,0,0,0)"/>
          </linearGradient>
        </defs>

        <!-- Base Background -->
        <rect width="320" height="440" fill="url(#coverGrad)"/>

        <!-- Top Accent Gold Line -->
        <line x1="30" y1="28" x2="290" y2="28" stroke="${theme.foil}" stroke-width="1.5" opacity="0.8"/>

        <!-- Category Chip / Tag -->
        <rect x="95" y="42" width="130" height="20" rx="10" fill="rgba(255,255,255,0.08)" stroke="${theme.accent}" stroke-width="0.5" stroke-opacity="0.4"/>
        <text x="160" y="55" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="700" font-size="8.5" fill="${theme.foil}" letter-spacing="0.12em">${escapeXml(tag)}</text>

        <!-- Dynamic Pattern Geometry -->
        ${patternSvg}

        <!-- Book Title -->
        ${titleSvg}

        <!-- Divider Foil Line -->
        <line x1="110" y1="285" x2="210" y2="285" stroke="${theme.foil}" stroke-width="1" opacity="0.65"/>
        <circle cx="160" cy="285" r="3" fill="${theme.foil}"/>

        <!-- Author Name -->
        <text x="160" y="325" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="600" font-size="12" fill="${theme.accent}" letter-spacing="0.06em">${escapeXml(author)}</text>
        <text x="160" y="342" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="500" font-size="9" fill="rgba(255,255,255,0.5)" letter-spacing="0.08em">AUTHOR</text>

        <!-- Bottom Publisher Seal / Logo -->
        <line x1="30" y1="400" x2="290" y2="400" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
        <text x="160" y="420" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="700" font-size="8.5" fill="rgba(255,255,255,0.4)" letter-spacing="0.15em">MADHU BOOKHUB EDITION</text>

        <!-- Book Spine Physical Groove & Highlight Layers -->
        <rect x="0" y="0" width="32" height="440" fill="url(#spineShadow)"/>
        <rect x="312" y="0" width="8" height="440" fill="url(#edgeGlow)"/>
      </svg>
    `.trim();

    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function escapeXml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Returns HTML string for a book cover container.
   * Features:
   *  - Automatic SVG procedural cover default
   *  - Optional OpenLibrary cover image with zero-flicker instant fallback
   */
  function render(book, options = {}) {
    const sizeClass = options.size === 'lg' ? 'cover-lg' : options.size === 'sm' ? 'cover-sm' : 'cover-md';
    const svgUri = generateSvgDataUri(book);
    const altText = `Book cover for ${escapeXml(book.title)} by ${escapeXml(book.author)}`;

    // Try OpenLibrary title match if online, otherwise immediate SVG fallback
    const encodedTitle = encodeURIComponent((book.title || '').trim());
    const openLibraryUrl = `https://covers.openlibrary.org/b/id/${book.book_id}-M.jpg?default=false`;

    return `
      <div class="book-cover-wrap ${sizeClass}" data-book-id="${book.book_id}">
        <div class="book-cover-3d">
          <img
            src="${svgUri}"
            data-remote-src="https://covers.openlibrary.org/b/isbn/${book.book_id}.jpg"
            alt="${altText}"
            class="book-cover-img"
            loading="lazy"
            onerror="this.src='${svgUri}'; this.onerror=null;"
          />
          <div class="book-spine-sheen" aria-hidden="true"></div>
          <div class="book-cover-glare" aria-hidden="true"></div>
        </div>
      </div>
    `;
  }

  /**
   * Generates Author Initials avatar element
   */
  function renderAuthorAvatar(authorName, size = 48) {
    const name = (authorName || 'Author').trim();
    const parts = name.split(/\s+/).filter(Boolean);
    let initials = 'A';
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      initials = parts[0].slice(0, 2).toUpperCase();
    }

    // Deterministic hue based on author name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h1 = Math.abs(hash) % 360;
    const h2 = (h1 + 45) % 360;

    return `
      <div class="author-avatar" style="width:${size}px; height:${size}px; background:linear-gradient(135deg, hsl(${h1}, 70%, 25%), hsl(${h2}, 85%, 45%));" aria-label="Avatar for ${escapeXml(name)}">
        <span class="author-avatar-text">${escapeXml(initials)}</span>
      </div>
    `;
  }

  return {
    generateSvgDataUri,
    render,
    renderAuthorAvatar,
  };
})();
