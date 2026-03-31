import { useState } from "react";

const CATEGORY_COLORS: Record<string, { from: string; to: string }> = {
  education: { from: "#5B2EFF", to: "#8B6FFF" },
  design: { from: "#FF5A70", to: "#FF8FA0" },
  fitness: { from: "#00F0A0", to: "#00C080" },
  tech: { from: "#0099FF", to: "#33BBFF" },
  food: { from: "#FFB347", to: "#FFD080" },
  coaching: { from: "#5B2EFF", to: "#9B7FFF" },
  consulting: { from: "#0099FF", to: "#4DC4FF" },
  courses: { from: "#5B2EFF", to: "#7B5EFF" },
  templates: { from: "#FF5A70", to: "#FF8090" },
  "digital guides": { from: "#00F0A0", to: "#33FFB0" },
  "live sessions": { from: "#FFB347", to: "#FFCC80" },
  "tech & software": { from: "#0099FF", to: "#33BBFF" },
  "writing & content": { from: "#FF5A70", to: "#FF8FA0" },
  "design & creative": { from: "#FF5A70", to: "#FF8FA0" },
  "business & coaching": { from: "#5B2EFF", to: "#8B6FFF" },
  "arts & media": { from: "#FFB347", to: "#FFD080" },
  "education & tutoring": { from: "#00F0A0", to: "#33FFB0" },
  "finance & money": { from: "#0099FF", to: "#4DC4FF" },
  "health & wellness": { from: "#00F0A0", to: "#00C080" },
  default: { from: "#5B2EFF", to: "#8B6FFF" },
};

function getCategoryColors(category?: string | null) {
  if (!category) return CATEGORY_COLORS.default;
  const key = category.toLowerCase();
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
}

interface ProductCover3DProps {
  productName: string;
  category?: string | null;
  width?: number;
  height?: number;
  className?: string;
}

export function ProductCover3D({
  productName,
  category,
  width = 300,
  height = 220,
  className = "",
}: ProductCover3DProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colors = getCategoryColors(category);

  const truncatedName = productName.length > 50
    ? productName.slice(0, 47) + "..."
    : productName;

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ width, height, perspective: "800px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative transition-transform duration-700 ease-out"
        style={{
          width: width * 0.75,
          height: height * 0.7,
          transformStyle: "preserve-3d",
          animation: isHovered ? "cover-spin-fast 4s linear infinite" : "cover-spin 12s linear infinite",
        }}
      >
        <div
          className="absolute inset-0 rounded-xl flex items-center justify-center p-4 backface-hidden"
          style={{
            background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
            boxShadow: `0 8px 32px ${colors.from}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
            transform: "rotateY(0deg) translateZ(8px)",
            backfaceVisibility: "hidden",
          }}
        >
          <div className="text-center">
            <p className="text-white font-bold text-sm leading-tight drop-shadow-md"
              style={{ fontSize: Math.max(11, Math.min(16, width / 18)) }}
            >
              {truncatedName}
            </p>
            {category && (
              <p className="text-white/60 text-[10px] mt-2 uppercase tracking-widest font-medium">
                {category}
              </p>
            )}
          </div>
          <div
            className="absolute inset-0 rounded-xl opacity-30"
            style={{
              background: "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)",
              animation: "shine-sweep 3s ease-in-out infinite",
            }}
          />
        </div>

        <div
          className="absolute inset-0 rounded-xl backface-hidden"
          style={{
            background: `linear-gradient(135deg, ${colors.to}, ${colors.from})`,
            boxShadow: `0 8px 32px ${colors.from}40`,
            transform: "rotateY(180deg) translateZ(8px)",
            backfaceVisibility: "hidden",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center">
              <span className="text-white/80 text-2xl font-bold">Z</span>
            </div>
          </div>
        </div>

        <div
          className="absolute rounded-xl"
          style={{
            width: "16px",
            height: "100%",
            background: `linear-gradient(to bottom, ${colors.from}CC, ${colors.to}CC)`,
            transform: "rotateY(90deg) translateZ(" + (width * 0.75 / 2 - 8) + "px)",
            left: "calc(50% - 8px)",
            top: 0,
          }}
        />
        <div
          className="absolute rounded-xl"
          style={{
            width: "16px",
            height: "100%",
            background: `linear-gradient(to bottom, ${colors.to}CC, ${colors.from}CC)`,
            transform: "rotateY(-90deg) translateZ(" + (width * 0.75 / 2 - 8) + "px)",
            left: "calc(50% - 8px)",
            top: 0,
          }}
        />
      </div>
    </div>
  );
}
