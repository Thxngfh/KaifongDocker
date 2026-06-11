import React from 'react'
import '../../app/globals.css'
import { BiSolidUser } from "react-icons/bi";
import { GrDocumentText } from 'react-icons/gr';
import { FaRegCheckCircle } from 'react-icons/fa';
import { FiCheck } from 'react-icons/fi';

const step_progress_2 = () => {
  return (
    <div className="flex items-center justify-center mt-10 font-bold">

        {/* line before step1 */}
        <hr className="border-[#D1C6AB] border-t-3 mx-0 w-5 mb-3"/>

        {/* inactive step1 */}
        <div className="flex flex-col items-center">
            <span className="bg-[#5D5C74] text-white rounded-full w-10 h-10 flex items-center justify-center border-3 border-white/5 shadow-md mt-5">
                <FiCheck   className="text-2xl pt-1" />
            </span>
            <p className='text-[#5D5C74] text-xs mt-3'>STEP 1</p>
        </div>

      {/* line between step1 and step2 */}
      <hr className="border-[#D1C6AB] border-t-3 mx-0 w-25 mb-3"/>

      <div className="flex flex-col items-center">
        {/* active step1 */}
        <span className="border-4 border-nt/30 rounded-full flex items-center justify-center">
            <span className="bg-nt text-[#231B00] rounded-full w-14 h-14 flex items-center justify-center border-4 border-white">
                <GrDocumentText className="text-2xl" />
            </span>
        </span>
        <p className='text-[#725C00] text-xs mt-3'>STEP 2</p>
      </div>

        {/* line between step2 and step3 */}
      <hr className="border-[#D1C6AB] border-t-3 mx-0 w-25 mb-3"/>

      {/* inactive step3 */}
      <div className="flex flex-col items-center">
        <span className="bg-[#E2E3E0] text-[#7F7660] rounded-full w-12 h-12 flex items-center justify-center border-3 border-[#D1C6AB] mt-5">
          <FaRegCheckCircle className="text-xl" />
        </span>
        <p className='text-[#5D5C74] text-xs mt-3'>STEP 3</p>
      </div>

      {/* line before step1 */}
        <hr className="border-[#D1C6AB] border-t-3 mx-0 w-5 mb-3"/>
    </div>
  )
}

export default step_progress_2
