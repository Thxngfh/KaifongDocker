import React from 'react'

const EmojiButton = () => {
  return (
    <button className='bg-accent p-4 rounded-xl font-bold shadow-md cursor-pointer hover:bg-yellow-500 transition'>
        <span className='ml-1 text-black'>
            🧑‍💼 คู่มือการใช้งานเจ้าหน้าที่
        </span>
        <span className="bg-black text-accent text-xs rounded-xl ml-4 mr-1 px-2 py-1">
            12
        </span>
    </button>
  )
}

export default EmojiButton
