import type { ReactNode, SVGProps } from "react";

/**
 * Minimal hand-rolled icon set (stroke-based, 24x24, currentColor) so we
 * don't need an icon library dependency for a handful of glyphs. Every
 * icon is `aria-hidden` by default — icons are always paired with visible
 * or sr-only text at the call site.
 */
function Icon({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const CheckIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);

export const XIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
);

export const PlusIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const SearchIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </Icon>
);

export const ChevronDownIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

export const ChevronRightIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="m9 6 6 6-6 6" />
  </Icon>
);

export const TrashIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
  </Icon>
);

export const UploadIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M12 16V4M6 10l6-6 6 6M4 20h16" />
  </Icon>
);

export const DownloadIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M12 4v12M6 12l6 6 6-6M4 20h16" />
  </Icon>
);

export const AlertIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M12 9v4M12 17h.01" />
    <path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  </Icon>
);

export const InfoIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16v-5M12 8h.01" />
  </Icon>
);

export const SparklesIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" />
  </Icon>
);

export const ClockIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </Icon>
);

export const FileIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
    <path d="M14 2v6h6" />
  </Icon>
);

export const SunIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Icon>
);

export const MoonIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
  </Icon>
);

export const MonitorIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <rect x="2" y="4" width="20" height="13" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </Icon>
);

export const MenuIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);

export const EditIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </Icon>
);

export const WifiOffIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M2 8.8a16 16 0 0 1 5.3-3.2M22 8.8a16 16 0 0 0-6.6-3.7M6.3 13.2a10.5 10.5 0 0 1 3.1-1.7M14.6 11.5a10.5 10.5 0 0 1 3.1 1.7M9.9 16.7a5 5 0 0 1 4.2 0M12 20h.01M1 1l22 22" />
  </Icon>
);
