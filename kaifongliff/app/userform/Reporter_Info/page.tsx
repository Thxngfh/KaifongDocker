import React from 'react'
import Navbar from '../../../components/navbar'
import StepProgress from '../../../components/userform/step_progress_1'
import Cardform from '../../../components/userform/card_form'
import Cardpdpa from '../../../components/userform/card_pdpa'
import { Sarabun } from 'next/font/google';
import { IoMdArrowRoundForward  } from 'react-icons/io';
import Link from 'next/link';

//font sarabun
const sarabun = Sarabun({
  subsets: ['thai'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],});


const page = () => {
  return (
    <div className={`${sarabun.className} mobile-viewport`}>
      <Navbar />
      <StepProgress />

      {/* หัวข้อและคำอธิบายของฟอร์ม */}
      <div className='flex flex-col items-start px-8'>
        <p className='text-[#231B00] text-3xl font-bold mt-10'>ข้อมูลผู้แจ้ง</p>
        <p className='text-[#5D5C74] text-xl mt-1 font-normal'>Reporter Info</p>
        <p className='text-[#4D4632] text-lg mt-2'>กรุณากรอกข้อมูลจริงเพื่อประโยชน์ในการร้องเรียนเรื่อง</p>

        {/* ฟอร์ม */}
        <Cardform/>

        {/* คำเตือนpdpa */}
        <Cardpdpa />
      </div>
    </div>
  )
}

export default page
