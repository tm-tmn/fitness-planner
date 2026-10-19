import type { ReactNode, SVGProps } from "react";

/**
 * ชุดไอคอนวาดมือสไตล์การ์ตูน: เส้นขอบหมึกหนา ปลายมน ระบายสีสดแบบสติกเกอร์
 * viewBox 32x32 ทุกอัน
 */
const INK = "#26234A";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & { size?: number };

function Svg({
  size = 24,
  children,
  ...rest
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke={INK}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const SunIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M16 3v3M16 26v3M3 16h3M26 16h3M7 7l2 2M23 23l2 2M25 7l-2 2M9 23l-2 2" />
    <circle cx="16" cy="16" r="6.5" fill="#FFD23F" />
    <path d="M13.5 15.5h.01M18.5 15.5h.01" strokeWidth={3} />
    <path d="M14 18.5q2 1.6 4 0" strokeWidth={1.8} />
  </Svg>
);

export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 8.5q0-2 2-2h18q2 0 2 2V25q0 2-2 2H7q-2 0-2-2z" fill="#fff" />
    <path d="M5 12h22V8.5q0-2-2-2H7q-2 0-2 2z" fill="#FF6F91" />
    <path d="M10 4v5M22 4v5" />
    <path d="M10 17h.01M16 17h.01M22 17h.01M10 22h.01M16 22h.01" strokeWidth={3} />
  </Svg>
);

export const ListIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 5h15q3 0 3 3v17q0 2-2 2H9q-3 0-3-3V6z" fill="#BFF2DA" />
    <path d="M11 11h10M11 16h10M11 21h6" />
  </Svg>
);

export const SmileIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="16" cy="16" r="11.5" fill="#C9B8FF" />
    <path d="M12 13.5h.01M20 13.5h.01" strokeWidth={3.2} />
    <path d="M11.5 18.5q4.5 5 9 0" />
  </Svg>
);

export const DumbbellIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10 16h12" strokeWidth={3} />
    <rect x="5" y="9" width="5" height="14" rx="2" fill="#FF6F91" />
    <rect x="22" y="9" width="5" height="14" rx="2" fill="#FF6F91" />
    <path d="M2.5 13v6M29.5 13v6" />
  </Svg>
);

export const BowlIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M11 5q-2 3 0 5M16 4q-2 3 0 6M21 5q-2 3 0 5" strokeWidth={2} />
    <path d="M4 14h24q0 10-8 12.5h-8Q4 24 4 14z" fill="#FFD23F" />
    <path d="M12 28.5h8" />
  </Svg>
);

export const TargetIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="15" cy="17" r="10.5" fill="#fff" />
    <circle cx="15" cy="17" r="6" fill="#FF6F91" />
    <circle cx="15" cy="17" r="1.8" fill={INK} />
    <path d="M16.5 15.5L27 5M23 4.5l.5 4 4 .5" />
  </Svg>
);

export const RocketIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M17 4q9 1 11 11-3 6-8 9l-8-8q2-8 5-12z" fill="#fff" />
    <circle cx="20.5" cy="11.5" r="2.4" fill="#9FD5F5" />
    <path d="M12 12l-6 1 4 5M20 20l-1 6-5-4" fill="#FF6F91" />
    <path d="M7 25l-3 3" />
  </Svg>
);

export const FlameIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M16 3q1 6 6 10t3 9q-1 6-9 6t-9-6q0-5 4-8 0 3 2 4 0-8 3-15z" fill="#FF8A5B" />
    <path d="M16 27q-4 0-4-4 0-3 4-6 4 3 4 6 0 4-4 4z" fill="#FFD23F" />
  </Svg>
);

export const StarIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M16 3.5l3.8 8 8.7 1.1-6.4 6 1.7 8.7L16 23l-7.8 4.3 1.7-8.7-6.4-6 8.7-1.1z" fill="#FFD23F" />
  </Svg>
);

export const TrashIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 9h20M12 9V6q0-1.5 1.5-1.5h5Q20 4.5 20 6v3" />
    <path d="M8 9l1.2 16q.2 2.5 2.5 2.5h8.6q2.3 0 2.5-2.5L24 9z" fill="#FFB3C7" />
    <path d="M13 14v8M19 14v8" strokeWidth={2} />
  </Svg>
);

export const PlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M16 6v20M6 16h20" strokeWidth={4} />
  </Svg>
);

export const ArrowLeftIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M26 16H7M14 8l-8 8 8 8" strokeWidth={3.2} />
  </Svg>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 16h19M18 8l8 8-8 8" strokeWidth={3.2} />
  </Svg>
);

export const DoorIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 4h13v24H7z" fill="#FFD23F" />
    <path d="M16 16h.01" strokeWidth={3.2} />
    <path d="M23 12l5 4-5 4M28 16H17" />
  </Svg>
);

export const BedIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8v18M4 21h24v5M28 21v-5q0-3-3-3H14v8" />
    <circle cx="9" cy="16" r="2.6" fill="#FF6F91" />
    <path d="M14 13h11q3 0 3 3v5H14z" fill="#9FD5F5" />
  </Svg>
);

export const HeartIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M16 27C5 19 4 14 4 11q0-6 6-6 4 0 6 4 2-4 6-4 6 0 6 6 0 3-8 16z" fill="#FF6F91" />
  </Svg>
);

/** ไอคอนมื้ออาหารแต่ละมื้อ */
export const CoffeeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4q-1.5 2 0 3.5M18 4q-1.5 2 0 3.5" strokeWidth={2} />
    <path d="M5 12h16v8q0 6-8 6t-8-6z" fill="#FFB3C7" />
    <path d="M21 14h2.5q3 0 3 3t-3 3H21" />
  </Svg>
);

export const AppleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M16 10q-5-3-9 1-2 6 1 12 3 5 8 3 5 2 8-3 3-6 1-12-4-4-9-1z" fill="#FF6F91" />
    <path d="M16 10q0-4 3-6" />
    <path d="M18 5q4-1 6 1-3 2-6 0z" fill="#5ED6A8" />
  </Svg>
);

export const MoonIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M24 20q-10 5-15-4t3-12q-9 1-9 11t11 13q8 0 10-8z" fill="#FFD23F" />
    <path d="M26 5v4M24 7h4" strokeWidth={2} />
  </Svg>
);

export const MEAL_ICONS: Record<string, (p: IconProps) => JSX.Element> = {
  breakfast: CoffeeIcon,
  lunch: BowlIcon,
  dinner: MoonIcon,
  snack: AppleIcon,
};

/**
 * Buddy: มาสคอตออริจินัลของแอป เป็นก้อนเจลลี่สีมิ้นต์ใส่แถบคาดหัว ถือดัมเบลเล็ก ๆ
 * mood: "happy" ธรรมดา, "cheer" ดีใจ (ทำครบแล้ว), "sleepy" วันพัก
 */
export function Buddy({
  size = 96,
  mood = "happy",
  className,
}: {
  size?: number;
  mood?: "happy" | "cheer" | "sleepy";
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      stroke={INK}
      strokeWidth={3.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="img"
      aria-label="Buddy มาสคอต"
    >
      {/* เงาพื้น */}
      <ellipse cx="60" cy="108" rx="30" ry="5" fill={INK} opacity="0.18" stroke="none" />
      {/* ตัว */}
      <path
        d="M60 22c-22 0-36 16-36 40 0 22 12 40 36 40s36-18 36-40c0-24-14-40-36-40z"
        fill="#5ED6A8"
      />
      {/* ไฮไลต์ */}
      <path d="M36 44q3-10 12-14" stroke="#fff" strokeWidth={4.5} />
      {/* แถบคาดหัว */}
      <path d="M26 44q34-14 68 0l-1 10q-33-13-66 0z" fill="#FF6F91" />
      <path d="M94 46l10 4-2 8" />
      {/* แก้ม */}
      <circle cx="40" cy="72" r="5.5" fill="#FFB3C7" stroke="none" />
      <circle cx="80" cy="72" r="5.5" fill="#FFB3C7" stroke="none" />
      {/* ตา */}
      {mood === "sleepy" ? (
        <>
          <path d="M42 66q5 4 10 0M68 66q5 4 10 0" />
          <path d="M92 28h8l-8 8h8" strokeWidth={2.6} />
        </>
      ) : (
        <>
          <ellipse cx="47" cy="66" rx="4.5" ry="6" fill={INK} stroke="none" />
          <ellipse cx="73" cy="66" rx="4.5" ry="6" fill={INK} stroke="none" />
          <circle cx="48.5" cy="63.5" r="1.6" fill="#fff" stroke="none" />
          <circle cx="74.5" cy="63.5" r="1.6" fill="#fff" stroke="none" />
        </>
      )}
      {/* ปาก */}
      {mood === "cheer" ? (
        <path d="M48 77q12 16 24 0z" fill="#FF6F91" />
      ) : mood === "sleepy" ? (
        <path d="M54 80q6 3 12 0" />
      ) : (
        <path d="M50 77q10 10 20 0" />
      )}
      {/* ดัมเบลที่ถือ */}
      <g transform={mood === "cheer" ? "translate(0 -16)" : undefined}>
        <path d="M22 84l-4 8" />
        <path d="M98 84l4 8" />
      </g>
      {mood === "cheer" && (
        <>
          <path d="M20 40l-8-10M100 40l8-10" />
          <path d="M10 24l2 5 5 1-5 2-2 5-2-5-5-2 5-1z" fill="#FFD23F" strokeWidth={2} />
          <path d="M108 22l2 5 5 1-5 2-2 5-2-5-5-2 5-1z" fill="#FFD23F" strokeWidth={2} />
        </>
      )}
      {mood !== "cheer" && (
        <g>
          <path d="M26 92l-8 2" />
          <rect x="4" y="86" width="9" height="16" rx="3" fill="#FFD23F" />
          <rect x="17" y="86" width="9" height="16" rx="3" fill="#FFD23F" />
          <path d="M13 94h4" />
        </g>
      )}
    </svg>
  );
}
