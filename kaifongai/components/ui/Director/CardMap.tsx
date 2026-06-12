import React from 'react'
import { RiMapPin2Line } from 'react-icons/ri'
import Image from "next/image";
import mapPic from "../../../public/map/Background.png"

const CardMap = () => {
  return (
    <div className="flex flex-col">
      <div className='bg-secondary px-8 py-4.5 w-full text-xl text-white flex flex-row mt-3 justify-start items-center rounded-t-xl'>
        <span>
            <RiMapPin2Line color="#FFD100"/>
        </span>
        <span className = "mx-4">
            ตำแหน่งที่ตั้ง
        </span>
        </div>
        <div className='bg-white w-full border-gray-300/30 border-1 rounded-b-xl grid grid-cols-2'>
            <div className='relative col-span-2 w-full h-full min-h-[470px]'>
                <Image
                    src={mapPic}
                    alt="Map"
                    fill
                    className='object-cover rounded-b-xl'
                />
            </div>
        </div>
    </div>
  )
}

export default CardMap
