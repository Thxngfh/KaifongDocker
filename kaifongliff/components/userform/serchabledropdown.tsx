import React, { useState, useEffect } from 'react';
import { prefixOptions, PrefixOption } from '../../data/prefix';
import { IoIosArrowForward } from 'react-icons/io';

const SearchableDropdown = ({ selectedValue, onSelectedChange }: { selectedValue: string; onSelectedChange: (value: string) => void }) => {
    
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const [isInvalid, setIsInvalid] = useState(false);

    // const filtered = prefixOptions.filter((opt): opt is PrefixOption => {
    //     return opt.label.includes(query);
    // });

    // Real-time validation for prefix
    useEffect(() => {
        if (query && !prefixOptions.some(opt => opt.label === query)) {
            setIsInvalid(true);
            onSelectedChange(''); // Clear selection if invalid
        } else if (query && prefixOptions.some(opt => opt.label === query)) {
            setIsInvalid(false);
        } else if (!query) {
            setIsInvalid(false);
            onSelectedChange('');
        }
    }, [query, onSelectedChange]);

    const handleSelectOption = (opt: PrefixOption) => {
        onSelectedChange(opt.value);
        setQuery(opt.label);
        setIsInvalid(false);
        setOpen(false);
    };

  return (
    <div className="relative w-full mt-1 mb-1">
        {/* <input type="text"  
                placeholder="พิมพ์เพื่อค้นหาคำนำหน้า"
                value={query}
                onChange={e => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 100)}
                className={`w-full bg-[#F4F4F1]/50 placeholder:text-[#7F7660]/50 rounded-xl py-4 px-4 pr-10 text-base border-2 ${isInvalid ? 'border-red-500' : 'border-transparent'}`}
                /> */}

        {/* อันนี้เปลี่ยนไปใช้dropdown ธรรมดาแทน --> อนาคตถ้าอยากใช้แบบserchคำนำหน้าได้ค่อยเปิดด้านบน */}
        <button type="button"
            onClick={() => setOpen(!open)}
            className="w-full bg-[#F4F4F1] rounded-xl py-4 px-4 pr-12 text-base text-left cursor-pointer"
        >
            {selectedValue
                ? prefixOptions.find(o => o.value === selectedValue)?.label
            : "เลือกคำนำหน้า"
            }
        </button>
        <IoIosArrowForward className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-[#6B7280] transition-transform ${open ? 'rotate-[270deg]' : 'rotate-90'}`} size={18}/>

        {open && prefixOptions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white shadow-lg rounded-xl mt-1 max-h-60 overflow-y-auto">
            {prefixOptions.map(opt => (
                <li
                key={opt.value}
                onMouseDown={(e) => {
                    e.preventDefault() // ป้องกัน input blur ก่อน
                    handleSelectOption(opt);
                }}
                className="px-4 py-3 hover:bg-[#F4F4F1] cursor-pointer text-base"
                >
                {opt.label}
                </li>
            ))}
            </ul>
        )}
        {/* {open && filtered.length === 0 && (
            <div className="absolute z-10 w-full bg-white shadow-lg rounded-xl mt-1 px-4 py-3 text-base text-gray-500">
                ไม่พบคำนำหน้า
            </div>
        )} */}
    </div>
  )
}

export default SearchableDropdown
