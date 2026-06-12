type Props = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function SearchInput({
  value,
  onChange,
}: Props) {
  return (
    <div className="relative w-full max-w-[400px]">
      {/* Icon */}
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/70">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="#7F765F"
          className="h-4 w-4"
        >
          <path
            fillRule="evenodd"
            d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
            clipRule="evenodd"
          />
        </svg>
      </span>

      {/* Input */}
      <input
        type="text"
        placeholder="ค้นหาชื่อประเภท..."
        value={value}
        onChange={onChange}
        className="w-full border border-[#D1C6AB]/30 bg-[#FAF8FF] rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none"
      />
    </div>
  );
}