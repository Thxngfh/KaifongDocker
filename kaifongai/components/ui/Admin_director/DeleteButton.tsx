import { FaRegTrashAlt } from "react-icons/fa";

type DeleteButtonProps = {
  onDelete?: () => void;
};

export default function DeleteButton({
  onDelete,
}: DeleteButtonProps) {
  return (
    <button
  type="button"
  onClick={onDelete}
  className="p-2 rounded-3xl hover:bg-gray-100 transition cursor-pointer">
      <FaRegTrashAlt className="w-6 h-6" />
    </button>
  );
}