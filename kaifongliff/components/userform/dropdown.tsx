import React from 'react'
import { useState, useEffect } from 'react'
import data from '@/data/mock_data_may2026.json';
import { IoIosArrowForward } from 'react-icons/io';

interface Props {
    selectedValue: string
    onSelectedChange: (value: string) => void
    selectedSub: string                        
    onSubChange: (value: string) => void       
}


const DropDown = ({ selectedValue, onSelectedChange, selectedSub, onSubChange }: Props) => {
    const [open, setOpen] = useState(false)
    const [openSub, setOpenSub] = useState(false)
    
    const { categories, subcategories } = data.meta.reference_ids
    const selectedIdx = categories.findIndex(c => c.category_id === selectedValue)
    const subOptions = subcategories.filter(s => s.category_idx === selectedIdx)

  return (
<div className="w-full mt-1 mb-1 flex flex-col gap-2">
    <div className="relative w-full">
        {/* trigger */}
        <button
            type="button"
            onClick={() => setOpen(!open)}
            className="w-full bg-[#F4F4F1] rounded-xl py-4 px-4 pr-12 text-base text-left cursor-pointer"
        >
            {selectedValue
            ? categories.find(c => c.category_id === selectedValue)?.name
            : "เลือกประเภทปัญหา"}
        </button>
        <IoIosArrowForward
            className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] transition-transform ${open ? '-rotate-90' : 'rotate-90'}`}
            size={18}
        />

        {/* dropdown list */}
        {open && (
            <ul className="absolute z-10 w-full bg-white shadow-lg rounded-xl mt-1 max-h-60 overflow-y-auto">
            {categories.map(opt => (
                <li
                key={opt.category_id}
                onMouseDown={() => { onSelectedChange(opt.category_id); onSubChange(''); setOpen(false) }}
                className={`px-4 py-3 cursor-pointer text-base hover:bg-[#F4F4F1]`}
                >
                {opt.name}
                </li>
            ))}
            </ul>
        )}
    </div>

        {/* Sub dropdown — แสดงเมื่อเลือก main แล้วเท่านั้น */}
            {selectedValue && (
                <div  key={selectedValue} className="relative w-full mt-5">
                    <button
                        type="button"
                        onClick={() => setOpenSub(!openSub)}
                        className="w-full bg-[#F4F4F1] rounded-xl py-4 px-4 pr-12 text-base text-left cursor-pointer"
                    >
                        {selectedSub
                            ? subOptions.find(o => o.subcategory_id === selectedSub)?.name
                            : "เลือกประเภทย่อย"
                        }
                    </button>
                    <IoIosArrowForward
                        className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] transition-transform ${openSub ? '-rotate-90' : 'rotate-90'}`}
                        size={18}
                    />
                    {openSub && (
                        <ul className="absolute z-10 w-full bg-white shadow-lg rounded-xl mt-1 max-h-60 overflow-y-auto">
                            {subOptions.map(opt => (
                                <li
                                    key={opt.subcategory_id}
                                    onMouseDown={() => { onSubChange(opt.subcategory_id); setOpenSub(false) }}
                                    className={`px-4 py-3 cursor-pointer text-base hover:bg-[#F4F4F1]`}
                                >
                                    {opt.name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
    </div>
  )
}

export default DropDown
