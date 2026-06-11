"use client";
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../../../../components/navbar'
import { Sarabun } from 'next/font/google';
import StepProgressMap from '@/components/userform/step_progressmap';
import { RiMapPin2Fill } from 'react-icons/ri';
import SearchBar from '../../../../components/userform/serchbar'
import { FaCircleCheck } from 'react-icons/fa6';
import Map from '../../../../components/Map'

//font sarabun
const sarabun = Sarabun({
  subsets: ['thai'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],});

const page = () => {
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    address: string;
    lat: number;
    lng: number;
    province?: string;
    district?: string;
  } | null>(null);

  // รับค่าจาก SearchBar
  const router = useRouter()

  // SearchBar เลือก → แค่ panTo map (Map จะ reverse geocode เองแล้ว callback กลับมา)
  const handlePlaceSelect = (place: {
    name: string; address: string; lat: number; lng: number;
    province?: string; district?: string;
  }) => {
    setMapCenter({ lat: place.lat, lng: place.lng });
  };

  // Map reverse geocode เสร็จ → update location card
  const handleLocationChange = (place: {
    name: string; address: string; lat: number; lng: number;
    province?: string; district?: string;
  }) => {
    setSelectedLocation(place);
  };

  const SendtoForm = async () => {
    if (!selectedLocation) {
      alert("กรุณาเลือกตำแหน่งก่อนยืนยัน");
      return;
    }
    console.log("พิกัด:", selectedLocation.lat, selectedLocation.lng, selectedLocation.province, selectedLocation.district);
    sessionStorage.setItem("complaintLocation", JSON.stringify(selectedLocation));
    // พยายามดึงค่าความแม่นยำของตำแหน่งจากอุปกรณ์ (หากผู้ใช้อนุญาตให้เข้าถึงตำแหน่ง) 
    //accuracy ไม่ใช่แล้ว 
    let detectedAccuracy: number | null = null;
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
        });
        detectedAccuracy = pos.coords.accuracy ?? null;
      } catch (err) {
        console.warn('Could not get device geolocation for accuracy:', err);
        detectedAccuracy = null;
      }
    }

    // อัปเดต complaintFormDraft เพื่อเก็บค่า geocodedAt และ locationAccuracy ไว้สำหรับนำกลับมาใช้เมื่อผู้ใช้กลับเข้ามาแก้ไขฟอร์มในภายหลัง
    try {
      const current = JSON.parse(sessionStorage.getItem("complaintFormDraft") ?? "{}")
      const updatedDraft = {
        ...current,
        Latitude: selectedLocation.lat?.toString(),
        longitude: selectedLocation.lng?.toString(),
        geocodedAt: new Date().toISOString(),
        locationAccuracy: detectedAccuracy,
      }
      sessionStorage.setItem("complaintFormDraft", JSON.stringify(updatedDraft))
    } catch (err) {
      console.warn("Failed to update complaintFormDraft with geocode info", err)
    }

    router.push("/userform/Complaint_Details");
  };

  return (
    <div className={`${sarabun.className} mobile-viewport`}>
      <Navbar/>

    {/* หัวข้อ */}
      <div className='flex flex-col items-start px-8'>
          <p className='text-[#231B00] text-2xl font-bold mt-10'>แผนที่ (Map)</p>
          <p className='text-[#4D4632] text-lg mt-2'>กรุณาเลือกพื้นที่ที่เกิดเหตุร้องทุกข์</p>
      </div>

      <StepProgressMap/>
      
      
    {/* search bar */}
      <SearchBar onPlaceSelect={handlePlaceSelect}/>

    {/* map */}
      <div className='flex flex-col items-start px-8 mt-8'>
        <Map
          center={mapCenter}
          onMarkerSelect={handleLocationChange}
        />

      {/* Location Card */}
        <div className='bg-white shadow-lg shadow-gray-100 rounded-3xl p-6 w-full mt-6 flex gap-5'>
          <div className='bg-nt px-2 py-2 w-10 h-11 items-center rounded-xl'>
            <RiMapPin2Fill size={22} color='695400'/>
          </div>

        {/* ข้อมูลตำแหน่ง */}
          <div className='flex flex-col'>
            <span className='text-sm font-semibold text-[#4D4632]'>
              ตำแหน่งปัจจุบัน (CURRENT LOCATION)
            </span>
            <span className='pr-15'>
              {selectedLocation ? (
                <>
                  <div className='font-semibold'>{selectedLocation.name}</div>
                  <div>{selectedLocation.address}</div>
                  {(selectedLocation.district || selectedLocation.province) && (
                    <div className='text-sm text-[#4D4632]/80'>
                      {selectedLocation.district ? `${selectedLocation.district}` : ""}
                      {selectedLocation.province ? `, ${selectedLocation.province}` : ""}
                    </div>
                  )}
                </>
              ) : (
                "กรุณาเลือกตำแหน่งจากแผนที่หรือช่องค้นหา"
              )}
            </span>
          </div>
        </div>

        {/* ปุ่มถัดไป */}
          <div className='flex flex-col items-center justify-center w-full mt-5'>
              <button 
                  id="next-button" 
                  onClick={SendtoForm}
                  className='bg-nt text-black rounded-full px-6 py-3 mt-6 font-bold w-full h-18 shadow-md hover:cursor-pointer hover:bg-nt/70 transition duration-300 ease-in-out flex items-center justify-center space-x-2'
              > 
                <div className='flex items-center justify-center text-xl'>
                  <span className='mr-2'>ยืนยันตำแหน่ง</span>
                </div>
              </button>

            <span className='mb-10 mt-4 text-sm text-[#4D4632]/60'>
              *กรุณาตรวจสอบตำแหน่งให้ชัดเจนก่อนกดปุ่มยืนยัน
            </span>
          </div>
      </div>
    </div>
  )
}

export default page
