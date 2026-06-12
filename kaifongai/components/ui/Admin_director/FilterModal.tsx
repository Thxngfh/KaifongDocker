type Props = {
  isOpen: boolean;
  onClose: () => void;

  roles: string[];
  types: string[];

  selectedRoles: string[];
  selectedTypes: string[];

  setSelectedRoles: (v: string[]) => void;
  setSelectedTypes: (v: string[]) => void;
};

export default function FilterModal({
  isOpen,
  onClose,
  roles,
  types,
  selectedRoles,
  selectedTypes,
  setSelectedRoles,
  setSelectedTypes,
}: Props) {
  const toggle = (
    value: string,
    current: string[],
    setState: (v: string[]) => void
  ) => {
    setState(
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[400px] p-6 rounded-xl">

      <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold text-[#333847]">กรองข้อมูล</h2>

      <button
        onClick={onClose}
        className="text-xl text-gray-500 hover:text-black hover:cursor-pointer"
      >
        ✕
      </button>
    </div>

        {/* ROLE */}
        <div className="mb-4">
          <p className="font-semibold mb-2">บทบาท</p>
          {roles.map((role) => (
            <label key={role} className="flex gap-2 items-center">
              <input
                type="checkbox"
                checked={selectedRoles.includes(role)}
                onChange={() =>
                  toggle(role, selectedRoles, setSelectedRoles)
                }
              />
              {role}
            </label>
          ))}
        </div>

        {/* TYPE */}
        <div className="mb-4">
          <p className="font-semibold mb-2">ประเภทช่าง</p>
          {types.map((type) => (
            <label key={type} className="flex gap-2 items-center">
              <input
                type="checkbox"
                checked={selectedTypes.includes(type)}
                onChange={() =>
                  toggle(type, selectedTypes, setSelectedTypes)
                }
              />
              {type}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-5 ">
         
          <button className ="hover:cursor-pointer"
            onClick={() => {
              setSelectedRoles([]);
              setSelectedTypes([]);
            }}
          >
            ล้าง
          </button>
          <div className="px-4 py-2 rounded-xl bg-[#FFD100] font-bold">
          <button className="hover:cursor-pointer " onClick={onClose}>เสร็จสิ้น</button>
          </div>
        </div>

      </div>
    </div>
  );
}