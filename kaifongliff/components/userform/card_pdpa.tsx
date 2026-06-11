import React from 'react'
import { BiShieldQuarter } from 'react-icons/bi'

const card_pdpa = () => {
  return (
    <div className='flex items-center bg-[#EEEEEB]/50 rounded-lg p-6 w-full mt-6 mb-10 text-[#4D4632] text-base font-normal space-x-4'>
        <span className='text-[#7F7660] text-3xl mr-4'>
            <BiShieldQuarter />
        </span>
        <p>
            ข้อมูลของคุณจะถูกเก็บเป็นความลับและใช้เพื่อการตรวจสอบข้อเท็จจริงเท่านั้นตามนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)
        </p>
    </div>
  )
}

export default card_pdpa
