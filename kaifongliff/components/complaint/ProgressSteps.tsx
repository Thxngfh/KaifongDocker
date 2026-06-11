interface ProgressStepsProps {
  /** จำนวนช่องทั้งหมด */
  steps: number;
  /** ความคืบหน้า 0-100 */
  progress: number;
  /** tailwind bg-* สีช่องปัจจุบัน */
  fillClassName: string;
  /** tailwind bg-* สีช่องที่ผ่านไปแล้ว */
  completedClassName?: string;
}

export function ProgressSteps({
  steps,
  progress,
  fillClassName,
  completedClassName,
}: ProgressStepsProps) {
  // แปลง % → จำนวนช่องที่เติมสี
  const filled = Math.round((progress / 100) * steps);

  return (
    <div className="flex w-full gap-1.5">
      {Array.from({ length: steps }).map((_, i) => {
        // ช่องที่ผ่านมาแล้ว หรือ 100% ทุกช่อง
        const isCompleted = i < filled - 1 || progress === 100;
        // ช่องปัจจุบัน (มี shimmer วิ่ง)
        const isCurrent = progress < 100 && i === filled - 1;

        return (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full relative overflow-hidden ${
              isCurrent
                ? fillClassName
                : isCompleted
                ? completedClassName ?? fillClassName
                : "bg-muted"
            }`}
          >
            {/* แสงวิ่งบนช่องปัจจุบัน */}
            {isCurrent && (
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-8 animate-[shimmer_1.8s_linear_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}