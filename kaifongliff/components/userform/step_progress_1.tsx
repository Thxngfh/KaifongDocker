import React from 'react'
import '../../app/globals.css'
import { BiSolidUser } from "react-icons/bi";
import { GrDocumentText } from 'react-icons/gr';
import { FaRegCheckCircle } from 'react-icons/fa';

const step_progress = () => {
  return (
    <div className="flex items-center justify-center mt-10 font-bold">

      <div className="flex flex-col items-center">
        {/* active step1 */}
        <span className="bg-nt text-[#231B00] rounded-full w-14 h-14 flex items-center justify-center border-4 border-white shadow-md">
          <BiSolidUser className="text-xl" />
        </span>
        <p className='text-[#725C00] text-xs mt-3'>STEP 1</p>
      </div>

      {/* line between step1 and step2 */}
      <hr className="border-[#D1C6AB] border-t-3 mx-1 w-25 mb-3"/>

      {/* inactive step2 */}
      <div className="flex flex-col items-center">
        <span className="bg-[#E2E3E0] text-[#7F7660] rounded-full w-10 h-10 flex items-center justify-center border-3 border-white/5 shadow-md mt-5">
          <GrDocumentText className="text-xl" />
        </span>
        <p className='text-[#5D5C74] text-xs mt-3'>STEP 2</p>
      </div>

        {/* line between step2 and step3 */}
      <hr className="border-[#D1C6AB] border-t-3 mx-1 w-25 mb-3"/>

      {/* inactive step3 */}
      <div className="flex flex-col items-center">
        <span className="bg-[#E2E3E0] text-[#7F7660] rounded-full w-10 h-10 flex items-center justify-center border-3 border-white/5 shadow-md mt-5">
          <FaRegCheckCircle className="text-xl" />
        </span>
        <p className='text-[#5D5C74] text-xs mt-3'>STEP 3</p>
      </div>
    </div>
  )
}

export default step_progress
