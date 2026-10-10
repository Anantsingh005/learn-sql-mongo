/* Inline illustrations for the home game cards. Flat, hand-drawn SVG in the
   site's palette — no image assets, no animation libraries. */

const SPARK = 'M0 -13 C1.5 -4 4 -1.5 13 0 C4 1.5 1.5 4 0 13 C-1.5 4 -4 1.5 -13 0 C-4 -1.5 -1.5 -4 0 -13 Z'

/* Lavender trophy on a winners podium, for the "Small Steps, Big Progress"
   card. The trophy group bobs (`.jp-bob`, defined by the card's scoped style);
   everything else is static. */
export function TrophyArt() {
  return (
    <svg
      viewBox="0 0 200 168"
      className="h-auto w-full"
      role="img"
      aria-label="A purple trophy with a star standing on a winners podium, surrounded by sparkles"
    >
      <defs>
        <linearGradient id="jp-trophy-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#6b46c9" />
        </linearGradient>
        <linearGradient id="jp-podium-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cdbcf7" />
          <stop offset="100%" stopColor="#b49ef0" />
        </linearGradient>
      </defs>

      <g transform="translate(-26 -32) scale(0.62)">
        {/* Soft clouds behind the scene */}
        <g opacity="0.85">
          <ellipse cx="112" cy="150" rx="62" ry="30" fill="#f9e9f6" />
          <ellipse cx="300" cy="182" rx="66" ry="30" fill="#f7eefc" />
        </g>

        <ellipse cx="204" cy="310" rx="132" ry="11" fill="#2d0022" opacity="0.07" />

        {/* 1-2-3 podium */}
        <g>
          <rect x="78" y="222" width="76" height="84" rx="12" fill="#d8caf8" />
          <rect x="160" y="176" width="88" height="130" rx="14" fill="url(#jp-podium-grad)" />
          <rect x="254" y="250" width="76" height="56" rx="12" fill="#e9e1fc" />
          <text x="116" y="276" textAnchor="middle" fontSize="26" fontWeight="800" fill="#573499">2</text>
          <text x="204" y="258" textAnchor="middle" fontSize="32" fontWeight="800" fill="#573499">1</text>
          <text x="292" y="290" textAnchor="middle" fontSize="22" fontWeight="800" fill="#573499">3</text>
        </g>

        {/* Trophy — bobs gently */}
        <g className="jp-bob">
          <path d="M144 84c-20 2-30 16-30 30 0 16 12 26 28 28" fill="none" stroke="#8b5cf6" strokeWidth="9" strokeLinecap="round" />
          <path d="M264 84c20 2 30 16 30 30 0 16-12 26-28 28" fill="none" stroke="#8b5cf6" strokeWidth="9" strokeLinecap="round" />
          <path d="M144 78h120v20c0 30-25 54-55 54h-10c-30 0-55-24-55-54z" fill="url(#jp-trophy-grad)" />
          <path d="M192 152h24v12h-24z" fill="#6b46c9" />
          <path d="M174 164h60l10 14H164z" fill="#573499" />
          <path transform="translate(204 112) scale(1.6)" d={SPARK} fill="#fde68a" />
        </g>

        <path className="jp-twinkle" style={{ animationDelay: '0s' }} transform="translate(96 96) scale(0.9)" d={SPARK} fill="#d4349e" />
        <path className="jp-twinkle" style={{ animationDelay: '-1.2s', animationDuration: '3.2s' }} transform="translate(322 60) scale(0.8)" d={SPARK} fill="#9575e0" />
        <path className="jp-twinkle" style={{ animationDelay: '-0.6s', animationDuration: '2.8s' }} transform="translate(300 262) scale(0.7)" d={SPARK} fill="#d9a441" />
      </g>
    </svg>
  )
}

export function SqlQuizArt() {
  return (
    <svg viewBox="0 0 240 190" className="h-auto w-full" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ca-sql-doc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#fdf0f8" />
        </linearGradient>
      </defs>

      <ellipse cx="120" cy="152" rx="104" ry="26" fill="#f7d4ed" opacity="0.65" />

      {/* SQL document on the right */}
      <g transform="rotate(-8 168 88)">
        <rect x="112" y="24" width="108" height="128" rx="12" fill="url(#ca-sql-doc)" stroke="#f0a8da" strokeWidth="2" />
        <path d="M112 48h108" stroke="#f0a8da" strokeWidth="2" />
        <circle cx="126" cy="36" r="3.5" fill="#d4349e" />
        <text x="136" y="40" fontFamily="'JetBrains Mono Variable', ui-monospace, monospace" fontSize="9" fontWeight="700" fill="#8c1568">
          query.sql
        </text>
        <g fill="#ecd6ee">
          <rect x="126" y="60" width="78" height="8" rx="4" />
          <rect x="126" y="76" width="62" height="7" rx="3.5" />
          <rect x="126" y="91" width="72" height="7" rx="3.5" />
          <rect x="126" y="106" width="48" height="7" rx="3.5" />
        </g>
        <rect x="126" y="124" width="66" height="16" rx="8" fill="#8c1568" />
        <text x="135" y="135" fontFamily="'JetBrains Mono Variable', ui-monospace, monospace" fontSize="9" fontWeight="700" fill="#ffffff">
          SELECT *
        </text>
      </g>

      {/* Purple SQL database stack, front-left */}
      <g transform="translate(64 132)">
        <ellipse cx="0" cy="34" rx="40" ry="10" fill="#2d0022" opacity="0.1" />
        {[
          { y: -18, body: '#8c1568', top: '#f0a8da' },
          { y: 0, body: '#b01f82', top: '#e46bbf' },
          { y: 18, body: '#d4349e', top: '#fdf0f8' },
        ].map((d) => (
          <g key={d.y}>
            <path d={`M-38 ${d.y + 14} a38 12 0 0 0 76 0 V${d.y} h-76 Z`} fill={d.body} />
            <ellipse cx="0" cy={d.y} rx="38" ry="12" fill={d.top} />
          </g>
        ))}
        <text
          x="0"
          y="-32"
          textAnchor="middle"
          fontFamily="'Inter Variable', system-ui, sans-serif"
          fontSize="13"
          fontWeight="800"
          letterSpacing="0.14em"
          fill="#8c1568"
        >
          SQL
        </text>
      </g>
    </svg>
  )
}

export function MongoQuizArt() {
  return (
    <svg viewBox="0 0 240 190" className="h-auto w-full" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ca-mongo-doc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f3faf5" />
        </linearGradient>
      </defs>

      <ellipse cx="120" cy="152" rx="104" ry="26" fill="#c4e2d0" opacity="0.55" />

      {/* JSON document */}
      <g transform="rotate(7 150 88)">
        <rect x="96" y="24" width="104" height="126" rx="12" fill="url(#ca-mongo-doc)" stroke="#a7e0bd" strokeWidth="2" />
        <path d="M96 48h104" stroke="#a7e0bd" strokeWidth="2" />
        <circle cx="110" cy="36" r="3.5" fill="#2f7a4f" />
        <text x="120" y="40" fontFamily="'JetBrains Mono Variable', ui-monospace, monospace" fontSize="8.5" fontWeight="700" fill="#2f7a4f">
          data.json
        </text>
        <g fill="#d7ecdf">
          <rect x="110" y="60" width="72" height="7" rx="3.5" />
          <rect x="110" y="75" width="58" height="6" rx="3" />
          <rect x="110" y="89" width="68" height="6" rx="3" />
          <rect x="110" y="103" width="44" height="6" rx="3" />
        </g>
        <rect x="110" y="122" width="60" height="15" rx="7.5" fill="#2f7a4f" />
        <text x="118" y="133" fontFamily="'JetBrains Mono Variable', ui-monospace, monospace" fontSize="8.5" fontWeight="700" fill="#ffffff">
          find()
        </text>
      </g>

      {/* Green MongoDB database stack */}
      <g transform="translate(88 132)">
        <ellipse cx="0" cy="34" rx="40" ry="10" fill="#173a26" opacity="0.1" />
        {[
          { y: -18, body: '#2f7a4f', top: '#8fd3a8' },
          { y: 0, body: '#3d7f55', top: '#a7e0bd' },
          { y: 18, body: '#58a874', top: '#d6f2e0' },
        ].map((d) => (
          <g key={d.y}>
            <path d={`M-38 ${d.y + 14} a38 12 0 0 0 76 0 V${d.y} h-76 Z`} fill={d.body} />
            <ellipse cx="0" cy={d.y} rx="38" ry="12" fill={d.top} />
          </g>
        ))}
        <text
          x="0"
          y="-32"
          textAnchor="middle"
          fontFamily="'Inter Variable', system-ui, sans-serif"
          fontSize="12"
          fontWeight="800"
          letterSpacing="0.1em"
          fill="#2f7a4f"
        >
          MongoDB
        </text>
      </g>

      {/* Leaf */}
      <g transform="translate(176 52) scale(1.5)" fill="none" stroke="#2f7a4f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.5 3.5c-7 .5-11 4-12.5 8.5-1 3-.5 6 1 8" />
        <path d="M9 20c-1.5-2-2-5-1-8 1.5-4.5 5.5-7 12.5-8.5" />
        <path d="M4 21h7" />
      </g>
    </svg>
  )
}
