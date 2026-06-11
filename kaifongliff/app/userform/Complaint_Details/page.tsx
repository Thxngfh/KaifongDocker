import React from 'react'
import Navbar from '../../../components/navbar'
import StepProgress2 from '../../../components/userform/step_progress_2'
import { Sarabun } from 'next/font/google';
import CardForm2 from '../../../components/userform/card_form2'

//font sarabun
const sarabun = Sarabun({
  subsets: ['thai'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],});

const page = () => {
  return (
    <div className={`${sarabun.className} mobile-viewport`}>
      <Navbar />
      <StepProgress2 />

      {/* หัวข้อและคำอธิบายของฟอร์ม */}
      <div className='flex flex-col items-start px-8'>
        <p className='text-[#5D5C74] text-3xl font-bold mt-10'>รายละเอียดเรื่องร้องทุกข์</p>
        <p className='text-[#4D4632] text-lg mt-1 font-medium'>Complaint Details</p>

        {/* ฟอร์มกรอกข้อมูลเรื่องร้องทุกข์ */}
        <CardForm2/>
      </div>
    </div>
  )
}

export default page
