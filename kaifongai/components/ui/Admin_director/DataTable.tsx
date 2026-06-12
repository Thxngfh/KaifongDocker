//สำหรับtable ในหน้าadmin เช่น dashboard หรืออื่นๆที่คล้ายกัน
type Column = {
  key: string;
  title: string;
  className?: string; // ใส่ class text,bg เฉพาะ column
  render?: (value: any, row: any) => React.ReactNode; //ใส่พวกของจำเพาะแต่ละคอลัม เช่น toggle มาเปน div ได้เลย
};

type TableProps = {
  columns: Column[];
  data: any[];
  theadClassName?: string, //เหมือนด้านล่างแต่เปลี่ยน thead
  className?: string; //เอาไว้ใช้สำหรับหน้าที่มีรูปแบบtableเปลี่ยน บางหน้ามีเส้นrowบางอันไม่มี ให้ใส่ เช่น border-b border-black"
};

export default function DataTable({ columns, data, theadClassName, className }: TableProps) {
  return (
    <table className="w-full ">
      <thead className={`${theadClassName || "text-[#64748B]" }`}>
        <tr>
          {columns.map((col) => (
            <th key={col.key}  className="text-left px-6 py-4">{col.title}</th>
          ))}
        </tr>
      </thead>

      <tbody>
      {data.map((row, i) => (
        <tr key={i}>
          {columns.map((col) => (
            <td
              key={col.key}
              className={`text-left align-middle px-5 py-4 md:px-4 ${col.className || ""} ${className || ""}`}
            >
              {col.render ? col.render(row[col.key], row) : row[col.key]}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
    </table>
  );
}