import { MdOutlineEdit } from "react-icons/md";

type Props = {
  onClick?: () => void;
};

export default function EditButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-3xl hover:bg-gray-100 transition cursor-pointer"
    >
      <MdOutlineEdit className="w-6 h-6" />
    </button>
  );
}