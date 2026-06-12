import { FaRegTrashAlt } from "react-icons/fa";


export default function DeleteButton() {
  return (
    <button className="p-2 rounded-3xl hover:bg-gray-100 transition cursor-pointer">
      <FaRegTrashAlt className="w-6 h-6" />
    </button>
  );
}