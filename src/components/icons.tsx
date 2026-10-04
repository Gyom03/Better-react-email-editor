/** Icons missing from @react-email/editor/ui. All accept a `size` like the package's icons. */

interface IconProps {
  size?: number;
}

const stroke = (size: number, strokeWidth = 2) => ({
  viewBox: '0 0 24 24',
  width: size,
  height: size,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export const GripIcon = ({ size = 14 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
    {[6, 12, 18].map((y) => (
      <g key={y}>
        <circle cx="9" cy={y} r="1.6" />
        <circle cx="15" cy={y} r="1.6" />
      </g>
    ))}
  </svg>
);

export const CopyIcon = ({ size = 14 }: IconProps) => (
  <svg {...stroke(size)}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </svg>
);

export const TrashIcon = ({ size = 14 }: IconProps) => (
  <svg {...stroke(size)}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </svg>
);

export const ParentIcon = ({ size = 14 }: IconProps) => (
  <svg {...stroke(size)}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);

export const UndoIcon = ({ size = 16 }: IconProps) => (
  <svg {...stroke(size)}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </svg>
);

export const RedoIcon = ({ size = 16 }: IconProps) => (
  <svg {...stroke(size)}>
    <path d="m15 14 5-5-5-5" />
    <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
  </svg>
);

export const DesktopIcon = ({ size = 16 }: IconProps) => (
  <svg {...stroke(size)}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8M12 16v4" />
  </svg>
);

export const MobileIcon = ({ size = 16 }: IconProps) => (
  <svg {...stroke(size)}>
    <rect x="7" y="2" width="10" height="20" rx="2" />
    <path d="M11 18h2" />
  </svg>
);

export const LayersIcon = ({ size = 16 }: IconProps) => (
  <svg {...stroke(size)}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5" />
  </svg>
);

export const PipetteIcon = ({ size = 15 }: IconProps) => (
  <svg {...stroke(size)}>
    <path d="m2 22 1-1h3l9-9" />
    <path d="M3 21v-3l9-9" />
    <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z" />
  </svg>
);

/** Layers-panel spacer icon (small). */
export const SpacerIcon = ({ size = 14 }: IconProps) => (
  <svg {...stroke(size)}>
    <path d="M4 4h16M4 20h16M12 8v8" />
  </svg>
);

/** Palette spacer icon (with arrows). */
export const SpacerTileIcon = ({ size = 22 }: IconProps) => (
  <svg {...stroke(size, 1.8)}>
    <path d="M4 4h16M4 20h16M12 7v10M9 9.5 12 7l3 2.5M9 14.5l3 2.5 3-2.5" />
  </svg>
);

export const SocialIcon = ({ size = 22 }: IconProps) => (
  <svg {...stroke(size, 1.8)}>
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <circle cx="18" cy="18" r="2.5" />
    <path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" />
  </svg>
);

export const OneColumnIcon = ({ size = 22 }: IconProps) => (
  <svg {...stroke(size, 1.8)}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
);
