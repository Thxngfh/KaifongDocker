import { useState } from "react";
import { List, LayoutGrid } from "lucide-react";

const ViewToggle = () => {
  const [view, setView] = useState<"list" | "grid">("list");

  const buttons = [
    { icon: List, key: "list" },
    { icon: LayoutGrid, key: "grid" },
  ] as const;

  const buttonWidth = 40; 
  const activeStroke = "hsl(45,50%,35%)"; // สีเดิม

  return (
    <div className="relative inline-flex items-center rounded-xl bg-[#d6d3da] p-1">
      {/* Sliding block */}
      <div
        className="absolute top-1 left-1 h-10 w-10 bg-white rounded-lg transition-all duration-300"
        style={{
          transform: `translateX(${view === "list" ? 0 : buttonWidth}px)`,
        }}
      />

      {/* Buttons */}
      {buttons.map((btn) => {
        const Icon = btn.icon;
        return (
          <button
            key={btn.key}
            onClick={() => setView(btn.key)}
            className="relative z-10 w-10 h-10 flex items-center justify-center"
          >
            <Icon
              size={20}
              strokeWidth={2.5}
              stroke={view === btn.key ? activeStroke : "hsl(44, 8%, 36%)"} // active/inactive
            />
          </button>
        );
      })}
    </div>
  );
};

export default ViewToggle;