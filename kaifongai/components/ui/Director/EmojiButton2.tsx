import React from 'react'

const EmojiButton = () => {
  return (
    <button className='bg-white p-4 rounded-xl font-bold shadow-xs cursor-pointer hover:bg-gray-200 transition border-1 border-gray-200'>
        <span className='ml-1 text-[#575E72]'>
            📣 คู่มือการใช้งานผู้แจ้งเรื่อง
        </span>
        <span className="bg-[#DEE2F5] text-[#575E72] text-xs rounded-xl ml-4 mr-1 px-2.5 py-1.5">
            05
        </span>
    </button>
  )
}

export default EmojiButton
