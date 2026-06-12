type Column = {
  key: string;
  title: string;
  className?: string;
};

type TableProps = {
  columns: Column[];
  theadClassName?: string; //เอาไว้ใช้สำหรับหน้าที่มีรูปแบบtableเปลี่ยน
  children: React.ReactNode; // เอาไว้ใส่ tbody จากข้างนอก
};

export default function DataTable({
  columns,
  theadClassName,
  children,
}: TableProps) {
  return (
    <table className="min-w-full">
      <thead className={theadClassName || "text-[#64748B]"}>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              className={`text-left px-6 py-4 ${col.className || ""}`}
            >
              {col.title}
            </th>
          ))}
        </tr>
      </thead>

      {children}
    </table>
  );
}