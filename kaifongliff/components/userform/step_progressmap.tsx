import React from 'react'
import { BiSolidUser } from 'react-icons/bi'
import { FaRegCheckCircle } from 'react-icons/fa'
import { FiCheck, FiMapPin } from 'react-icons/fi'
import { GrDocumentText } from 'react-icons/gr'

const step_progressmap = () => {
  return (
    <div className="flex items-center justify-center mt-10 font-bold">
            {/* line before step1 */}
            <hr className="border-[#D1C6AB] border-t-3 mx-0 w-5 mb-3"/>
    
            {/* inactive step1 */}
            <div className="flex flex-col items-center">
                <span className="bg-[#E2E0FC] text-white rounded-full w-12 h-12 flex items-center justify-center border-3 border-[#D1C6AB] -mt-2">
                    <GrDocumentText   size={20} className="pt-0" color='63627A' />
                    {/* GrDocumentText */}
                    {/* BiSolidUser */}
                </span>
            </div>
    
          {/* line between step1 and step2 */}
          <hr className="border-[#D1C6AB] border-t-3 mx-0 w-25 mb-3"/>
    
          <div className="flex flex-col items-center">
            {/* active step1 */}
            <span className="rounded-full flex items-center justify-center">
                <span className="bg-[#725C00] text-[#231B00] rounded-full w-15 h-15 flex items-center justify-center border-4 border-nt -mt-3">
                    <FiMapPin  className="text-2xl" color='white' />
                </span>
            </span>
          </div>
    
            {/* line between step2 and step3 */}
          <hr className="border-[#D1C6AB] border-t-3 mx-0 w-25 mb-3"/>
    
          {/* inactive step3 */}
          <div className="flex flex-col items-center">
            <span className="bg-[#F4F4F1] text-[#7F7660] rounded-full w-12 h-12 flex items-center justify-center border-3 border-[#D1C6AB] -mt-2">
              <FaRegCheckCircle className="text-xl" color='D1C6AB'/>
              {/* FaRegCheckCircle */}
              {/* GrDocumentText */}
            </span>
          </div>
    
          {/* line before step1 */}
            <hr className="border-[#D1C6AB] border-t-3 mx-0 w-5 mb-3"/>
        </div>
  )
}

export default step_progressmap
