"use client"
import React, { useState } from 'react'
import { BiShieldQuarter } from 'react-icons/bi'

interface CardPdpaProps {
  onCheckChange?: (isChecked: boolean) => void;
  isChecked?: boolean;
}

const CardPdpa = ({ onCheckChange, isChecked = false }: CardPdpaProps) => {
  const [checked, setChecked] = useState(isChecked);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newCheckedState = event.target.checked;
    setChecked(newCheckedState);
    onCheckChange?.(newCheckedState);
  };
  return (
      <div className='flex flex-row items-center'>
        <div className='flex items-center bg-[#EEEEEB]/50 rounded-lg p-6 w-full mt-6 mb-10 text-[#4D4632] text-base font-normal space-x-4'>
            <span className='text-[#7F7660] text-3xl mr-4'>
                <BiShieldQuarter />
            </span>
            <p>
                ข้อมูลของคุณจะถูกเก็บเป็นความลับและใช้เพื่อการตรวจสอบข้อเท็จจริงเท่านั้นตามนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)
            </p>
                        <span className='mx-1'>
              <input 
                type="checkbox" 
                checked={checked}
                onChange={handleChange}
                className="h-6 w-6 border-[#4D4632] cursor-pointer"
              />
            </span>
        </div>
      </div>
  )
}

export default CardPdpa
