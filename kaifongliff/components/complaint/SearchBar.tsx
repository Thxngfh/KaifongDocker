import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}
//ฟังก์ชันช่องค้นหาคำร้องตามหมายเลขคำร้องที่แสดง (REQ-00x/xx)
export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "ค้นหาหมายเลขคำร้องเรียนของคุณ..."}
        className="bg-card placeholder:text-muted-foreground focus-visible:ring-ring h-12 w-full rounded-2xl border border-border pr-4 pl-12 text-sm shadow-sm outline-none focus-visible:ring-2"
      />
    </div>
  );
}