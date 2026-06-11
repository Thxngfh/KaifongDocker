"use client"
import React, { useEffect } from 'react'
import DropDown from '../userform/dropdown'
import { RiMapPin2Fill } from 'react-icons/ri';
import { MdOutlineCameraAlt } from 'react-icons/md';
import { IoMdArrowRoundForward } from 'react-icons/io';
import Link from 'next/link'
import { GrWaypoint } from 'react-icons/gr';
import { useRouter } from 'next/navigation' 
import { useState } from 'react';
import { usePhotoStore } from "@/hooks/usePhotoStore"
import mockData from "@/data/mock_data_may2026.json"
import StaticMap from './staticMap';


const categories = mockData.meta.reference_ids.categories;
const subcategories = mockData.meta.reference_ids.subcategories;

/*ตอนนี้ข้อมูล accuracy ไม่ได้ถูกใช้งานแล้ว */

// สร้าง interface สำหรับเก็บข้อความ error ของแต่ละฟิลด์ --> ใช้ในการจัดการและแสดงข้อความ error ได้ง่ายขึ้น
interface FormErrors {
    issueType: string;
    subIssue: string;
    detail: string;
    location: string;
    locationDescription: string;
    additionalNotes: string;
    photo: string;
}

const MAX_PHOTOS = 5 

const card_form2 = () => {
    const router = useRouter()
    const [selected, setSelected] = React.useState<string>("");
    const [selectedSub, setselectedSub] = React.useState<string>("");
    const [detail, setDetail] = React.useState<string>("");
    const [location, setLocation] = React.useState<string>("");
    const [locationDescription, setLocationDescription] = React.useState<string>("");
    const [additionalNotes, setAdditionalNotes] = React.useState<string>("");
    const [province, setProvince] = React.useState<string>("");
    const [district, setDistrict] = React.useState<string>("");
    const [latitude, setlatitude] = React.useState<string>("");
    const [longtitude, setLongtitude] = React.useState<string>("");
    const [geocodedAt, setGeocodedAt]           = useState<string>("")
    const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)
    const detailCharCount = detail.length
    const additionalNotesCharCount = additionalNotes.length
    const locationDetailCharCount = locationDescription.length

    // สร้าง state สำหรับเก็บข้อความ error ของแต่ละฟิลด์   
    const [errors, setErrors] = React.useState<FormErrors>({
        issueType: "",
        subIssue: "",
        detail: "",
        location: "",
        locationDescription: "",
        additionalNotes: "",
        photo: "",
    })

    // ใช้ custom hook สำหรับจัดการรูปภาพ
    const { photos, photoPreviews, addPhoto, removePhoto } = usePhotoStore()
    useEffect(() => {
      if (photos.length > 0 && errors.photo) {
        setErrors((prev) => ({ ...prev, photo: "" }))
      }
    }, [photos.length, errors.photo])

    // ตรวจสอบความถูกต้องของฟอร์มทุกครั้งที่มีการเปลี่ยนแปลงข้อมูลในฟิลด์ที่สำคัญ
    useEffect(() => {
        validateForm()
    },[selected, selectedSub, detail, location, locationDescription, additionalNotes, photos])

    // โหลดข้อมูลฉบับร่างและตำแหน่งจาก sessionStorageเมื่อคอมโพเนนต์ถูก mount เพื่อให้ผู้ใช้สามารถกลับมาแก้ไขฟอร์มได้โดยไม่สูญเสียข้อมูลที่กรอกไว้ก่อนหน้านี้
    useEffect(() => {
      const storedDraft = sessionStorage.getItem("complaintFormDraft");
      if (storedDraft) {
        try {
          const draft = JSON.parse(storedDraft) as {
            selected: string;
            selectedSub: string;
            detail: string;
            location: string;
            Latitude: string;
            longitude: string;
            province: string;
            district: string;
            locationDescription: string;
            additionalNotes: string;
            geocodedAt: string;       
            locationAccuracy: number | null;  
          };

          setSelected(draft.selected ?? "");
          setselectedSub(draft.selectedSub ?? "");
          setDetail(draft.detail ?? "");
          setLocation(draft.location ?? "");
          setDistrict(draft.district ?? "");
          setProvince(draft.province ?? "");
          setLongtitude(draft.longitude ?? "");
          setlatitude(draft.Latitude ?? "");
          setLocationDescription(draft.locationDescription ?? "");
          setAdditionalNotes(draft.additionalNotes ?? "");
          setGeocodedAt(draft.geocodedAt ?? "")
          setLocationAccuracy(draft.locationAccuracy ?? null)
        } catch (error) {
          console.warn("ไม่สามารถโหลดฟอร์มฉบับร่างจาก sessionStorage", error);
        }
      }

      // โหลดตำแหน่งจาก sessionStorage ตอนออกมาจากการpin location เช่น ชื่อสถานที่ รายละเอียดตำแหน่ง จังหวัด อำเภอ ละติจูด ลองจิจูด เพื่อให้ผู้ใช้สามารถกลับมาแก้ไขตำแหน่งได้โดยไม่สูญเสียข้อมูลที่กรอกไว้ก่อนหน้านี้
      const stored = sessionStorage.getItem("complaintLocation");
      if (stored) {
        try {
          const payload = JSON.parse(stored) as { name: string; address: string; locationNotes: string; lat: number; lng: number; province?: string; district?: string };
          if (payload.name || payload.address) {
            setLocation(payload.name || payload.address);
            setLocationDescription(payload.locationNotes ?? "");
            setProvince(payload.province ?? "");
            setDistrict(payload.district ?? "");
            setlatitude(payload.lat?.toString() ?? "");
            setLongtitude(payload.lng?.toString() ?? "");
            
          }
        } catch (error) {
          console.warn("ไม่สามารถโหลดตำแหน่งจาก sessionStorage", error);
        }
      }

    }, []);

    // ฟังก์ชันสำหรับดึงตำแหน่งปัจจุบันของผู้ใช้และแปลงเป็นที่อยู่โดยใช้ Google Geocoding API เมื่อผู้ใช้กดปุ่ม "ใช้ตำแหน่งปัจจุบัน"
    const handleUseCurrentLocation = () => {
      if (!navigator.geolocation) {
        alert("เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง");
        return;
      }

      setLocationLoading(true)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy //เก็บเผื่อเฉยๆ
          const geocodedTime = new Date().toISOString()  
          
          // อัพเดต state และ sessionStorage ด้วยข้อมูลตำแหน่งที่ได้รับ
          setlatitude(lat.toString());
          setLongtitude(lng.toString());
          setLocationAccuracy(accuracy)
          setGeocodedAt(geocodedTime)
            const draftBase = {
                selected,
                selectedSub,
                detail,
                location,
                locationDescription,
                additionalNotes,
                geocodedAt: geocodedTime,
                Latitude: lat.toString(),
                longitude: lng.toString(),
                province,
                district,
                locationAccuracy: accuracy,
            };
            // อัพเดต sessionStorage ด้วยข้อมูลตำแหน่งที่ได้รับ
            sessionStorage.setItem("complaintFormDraft", JSON.stringify(draftBase));
          const latLngText = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;

          // ใช้ Google Geocoding API เพื่อแปลงพิกัดเป็นที่อยู่
          if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.Geocoder) {
            const geocoder = new window.google.maps.Geocoder();
            const latlng = { lat, lng };

            // ดึงข้อมูลจังหวัดและอำเภอจากผลลัพธ์ของ Geocoding API เพื่อเก็บไว้ใน state และ sessionStorage
            geocoder.geocode({ location: latlng }, (results, status) => {
              if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
                                const components = results[0].address_components ?? [];
                                let geocodeProvince = "";
                                let geocodeDistrict = "";
                                for (const component of components) {
                                    const types = component.types ?? [];
                                    // ตรวจสอบประเภทของแต่ละ component เพื่อดึงข้อมูลจังหวัดและอำเภอ
                                    if (types.includes("administrative_area_level_1")) geocodeProvince = component.long_name;
                                    if (types.includes("administrative_area_level_2")) geocodeDistrict = component.long_name;
                                    if (!geocodeDistrict && types.includes("sublocality_level_1")) geocodeDistrict = component.long_name;
                                    if (!geocodeDistrict && types.includes("locality")) geocodeDistrict = component.long_name;
                                }
                                setProvince(geocodeProvince);
                                setDistrict(geocodeDistrict);
                // ถ้าได้ผลลัพธ์จาก Geocoding API ให้ใช้ที่อยู่ที่ได้มาแสดงในฟิลด์ตำแหน่งและเก็บข้อมูลจังหวัดและอำเภอไว้ใน state และ sessionStorage เพื่อใช้ในการส่งข้อมูลไปยัง backend และแสดงให้ผู้ใช้เห็น
                setLocation(results[0].formatted_address || latLngText);
                console.log("พิกัด: "+lat+" "+lng);

                // อัพเดต sessionStorage ด้วยข้อมูลตำแหน่งที่ได้รับจาก Geocoding API
                sessionStorage.setItem(
                    "complaintFormDraft",
                    JSON.stringify({
                        ...draftBase,
                        province: geocodeProvince,
                        district: geocodeDistrict,
                    })
                );
              }else {
                setLocation(`ตำแหน่งปัจจุบัน (${latLngText})`);
                                sessionStorage.setItem("complaintFormDraft", JSON.stringify(draftBase));
              }
              setLocationLoading(false)
            });
          } else {
            setLocation(`ตำแหน่งปัจจุบัน (${latLngText})`);
            setLocationLoading(false)
          }
        },
        (error) => {
          console.error(error);
          alert("ไม่สามารถดึงตำแหน่งปัจจุบันได้ กรุณาลองใหม่");
          setLocationLoading(false)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    //กันตัวอักษรพิเศษ ยกเว้น - / , . ( ) และช่องว่าง
    const isTextValid = (text: string) => {
        const textRegex = /^[ก-๙a-zA-Z0-9\s\/\.,\-\(\)]+$/;
        return textRegex.test(text)
    }

    // ฟังก์ชันสำหรับตรวจสอบความถูกต้องของฟอร์มทั้งหมดก่อนส่งข้อมูลไปยัง backend และแสดงข้อความ error ที่เหมาะสมในแต่ละฟิลด์
    const validateForm = () => {
        const newErrors: FormErrors = {
            issueType: "",
            subIssue: "",
            detail: "",
            location: "",
            locationDescription: "",
            additionalNotes: "",
            photo: "",
        };

        // ตรวจสอบหมวดปัญหา (category_id)
        if (!selected) {
            newErrors.issueType = "*กรุณาเลือกประเภทปัญหา";
        } else if (!categories.some(cat => cat.category_id === selected)) {
            newErrors.issueType = "ประเภทปัญหาที่เลือกไม่ถูกต้อง";
        }

        // ตรวจสอบปัญหาย่อย (subcategory_id)
        const selectedCategoryIdx = categories.findIndex(cat => cat.category_id === selected);
        const relatedSubs = selectedCategoryIdx >= 0 ? subcategories.filter(sub => sub.category_idx === selectedCategoryIdx) : [];
        
        if (relatedSubs && relatedSubs.length > 0) {
            if (!selectedSub) {
                newErrors.subIssue = "*กรุณาเลือกปัญหาย่อย";
            } else if (!subcategories.some(sub => sub.subcategory_id === selectedSub)) {
                newErrors.subIssue = "ปัญหาย่อยที่เลือกไม่ถูกต้อง";
            }
        }

        // ตรวจสอบรายละเอียด
        if (!detail.trim()) {
            newErrors.detail = "*กรุณากรอกรายละเอียด";
        } else if (detail.trim().length > 300) {
            newErrors.detail = "รายละเอียดต้องไม่เกิน 300 ตัวอักษร";
        } else if (!isTextValid(detail)) {
            newErrors.detail = "รายละเอียดมีตัวอักษรที่ไม่ถูกต้อง";
        }

        // ตรวจสอบตำแหน่ง
        if (!location.trim()) {
            newErrors.location = "*กรุณาระบุสถานที่";
        }

        // ตรวจสอบหมายเหตุเพิ่มเติม
        //validate location description
        if (locationDescription.trim().length > 100) {
            newErrors.locationDescription = "รายละเอียดสถานที่ต้องไม่เกิน 100 ตัวอักษร";
        }else if (!isTextValid(locationDescription) && locationDescription.trim().length > 0) {
            newErrors.locationDescription = "รายละเอียดสถานที่มีตัวอักษรที่ไม่ถูกต้อง";
        }

        //validate additional notes
        if (additionalNotes.trim().length > 100) {
            newErrors.additionalNotes = "หมายเหตุเพิ่มเติมต้องไม่เกิน 100 ตัวอักษร";
        } else if (!isTextValid(additionalNotes)  && additionalNotes.trim().length > 0) {
            newErrors.additionalNotes = "หมายเหตุเพิ่มเติมมีตัวอักษรที่ไม่ถูกต้อง";
        }

        if(photos.length === 0){
            newErrors.photo = "*กรุณาอัพโหลดรูปภาพอย่างน้อย 1 รูป";
        }

        setErrors(newErrors);
        return Object.values(newErrors).every(error => error === "");
    }

    // ฟังก์ชันสำหรับจัดการการส่งฟอร์ม เมื่อผู้ใช้กดปุ่ม "ถัดไป" จะตรวจสอบความถูกต้องของฟอร์มทั้งหมดอีกครั้งก่อนส่งข้อมูลไปยัง backend และนำผู้ใช้ไปยังหน้าถัดไปหากข้อมูลถูกต้อง
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const isValid = validateForm();

        if(!isValid) {
            return;
        }

        // ค้นหา label จากไอดี
        const categoryObj = categories.find(c => c.category_id === selected);
        const subcategoryObj = subcategories.find(s => s.subcategory_id === selectedSub);
        
        const categoryName = categoryObj?.name ?? selected;
        const subcategoryName = subcategoryObj?.name ?? selectedSub;

        // เตรียมข้อมูลสำหรับส่งไปยัง backend
        const res = await fetch('/api/form/complaint', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
               title:              categoryName,
                category_id:        selected,
                subcategory_id:     selectedSub,
                detail:             detail,
                location:           location,
                additional:         additionalNotes,
                latitude:           latitude,
                longitude:          longtitude,
                province:           province,
                district:           district,
                geocoded_at:         geocodedAt,
                location_accuracy:   locationAccuracy
            }),
        })

        if (res.ok) {
            router.push("/userform/details")
        }
    };
   
    //กัน error
    const [uploadError, setUploadError] = useState<string | null>(null)

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
    const MAX_SIZE = 5 * 1024 * 1024
    const MIN_SIZE = 1 * 1024

    // ฟังก์ชันสำหรับจัดการการเปลี่ยนแปลงของอินพุตไฟล์เมื่อผู้ใช้เลือกไฟล์รูปภาพใหม่ โดยจะตรวจสอบประเภทและขนาดของไฟล์ก่อนเพิ่มเข้าไปใน state และแสดงข้อความ error หากไฟล์ไม่ถูกต้อง
    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        setUploadError(null)
        const files = Array.from(e.target.files ?? [])
        const remaining = MAX_PHOTOS - photos.length

        let addedPhoto = false
    for (const file of files.slice(0, remaining)) {
            if (!ALLOWED_TYPES.includes(file.type)) {
                setUploadError(`"${file.name}" ไม่รองรับ รองรับเฉพาะ JPEG, PNG, WebP`)
                continue
            }
            if (file.size < MIN_SIZE) {
                setUploadError(`"${file.name}" เล็กเกินไป (ขั้นต่ำ 1 KB)`)
                continue
            }
            if (file.size > MAX_SIZE) {
                setUploadError(`"${file.name}" ใหญ่เกิน 5 MB`)
                continue
            }
            addPhoto(file)
            addedPhoto = true
        }

        if (addedPhoto && errors.photo) {
            setErrors((prev) => ({ ...prev, photo: "" }))
        }

        e.target.value = ""
    }
    //ตอนกด zoom รุป
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
    const [locationLoading, setLocationLoading] = useState(false)
  return (
    <div className='w-full'>
        {/* <StepProgress currentStep={1} /> */}
      <form onSubmit={handleSubmit}>
        <div className='bg-white shadow-lg shadow-gray-100 rounded-lg p-6 w-full mt-6'>
            {/* ประเภทปัญหา */}
            <p className='text-[#5D5C74] text-lg font-semibold'>ประเภทหมวดปัญหา</p>
            <p className='text-[#4D4632] text-base font-normal mb-2'>Issue Type</p>
            <DropDown
                selectedValue={selected}
                onSelectedChange={setSelected} 
                selectedSub={selectedSub} 
                onSubChange={setselectedSub}
            />
            {errors.issueType && <p className='text-[#FA3E3E] text-sm mb-4'>{errors.issueType}</p>}
            {errors.subIssue && <p className='text-[#FA3E3E] text-sm mb-4'>{errors.subIssue}</p>}
        </div>

        <div className='bg-white shadow-lg shadow-gray-100 rounded-lg p-6 w-full mt-6'>
            {/* รายละเอียดปัญหา */}
            <div>
                <p className='text-[#5D5C74] text-lg font-semibold'>รายละเอียด</p>
                <p className='text-[#4D4632] text-base font-normal mb-1'>Details</p>
                <textarea
                    value={detail}
                    placeholder='กรุณาระบุรายละเอียดที่พบ...'
                    onChange={(e) => setDetail(e.target.value)}
                    id="detail"
                    className={`w-full bg-[#F4F4F1] rounded-xl p-2 mt-1 mb-1 py-4 px-4 placeholder:text-[#7F7660] text-base h-36 align-top ${errors.detail ? 'border border-[#FA3E3E]' : 'border border-transparent'}`}
                />
                <p className="text-sm text-[#4D4632]/80 mt-1">
                    {detailCharCount}/300 ตัวอักษร
                </p>
                {errors.detail && <p className='text-[#FA3E3E] text-sm mb-4'>{errors.detail}</p>}       
            </div>
        </div>

        <div className='bg-white shadow-lg shadow-gray-100 rounded-lg p-6 w-full mt-6'>
            {/* ปักหมุดสถานที่ */}
            <p className='text-[#5D5C74] text-lg font-semibold'>ตำแหน่งเรื่องร้องทุกข์</p>
            <p className='text-[#4D4632] text-base font-normal mb-2'>Location</p>
            <div className='flex flex-row'>
                <input
                    id="map"
                    type="text"
                    value={location}
                    placeholder='กดปุ่มเพื่อระบุสถานที่ปัจจุบัน หรือ ปักหมุดในแผนที่'
                    onChange={(e) => setLocation(e.target.value)}
                    className={`w-full bg-[#F4F4F1] rounded-xl p-2 mt-1 mb-1 py-8 px-4 placeholder:text-[#7F7660] text-base`}
                    disabled
                />
                <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locationLoading}
                    className={`bg-nt px-5 py-5 w-15 h-15 items-center rounded-2xl shadow-lg mx-5 mt-1 ${locationLoading ? 'opacity-70 cursor-not-allowed' : 'hover:cursor-pointer'}`}
                >
                    {locationLoading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-3 border-[#725C00]/20 border-t-[#725C00]" />
                    ) : (
                        <RiMapPin2Fill size={22} color='695400'/>
                    )}
                </button>
            </div>

            {/* เพิ่มรายละเอียดสถานที่เอาไว้ */}
            <p className='text-[#4D4632]'>Details</p>
            <input
                type="text"
                value={locationDescription}
                placeholder='คำอธิบายเพิ่มเติม เช่น ท่อน้ำรั่วหน้าประตูทางเข้าตึก...'
                onChange={(e) => setLocationDescription(e.target.value)}
                className={`w-full bg-[#F4F4F1] rounded-xl p-2 mt-1 mb-1 py-8 px-4 placeholder:text-[#7F7660] text-base ${errors.locationDescription ? 'border border-[#FA3E3E]' : 'border border-transparent'}`}
            />
             <p className="text-sm text-[#4D4632]/80 mt-1">
                {locationDetailCharCount}/100 ตัวอักษร
            </p>
            {errors.locationDescription && <p className='text-[#FA3E3E] text-sm mb-4'>{errors.locationDescription}</p>}       


            {/* แผนที่ */}
            <div className='bg-[#F4F4F1] rounded-2xl pt-1 overflow-hidden mt-2 relative'> 
                <StaticMap className="w-full h-40"/>
                    <button
                        type='button'
                        onClick={() => {
                            const draft = {
                            selected,
                            selectedSub,
                            detail,
                            location,
                            locationDescription,
                            additionalNotes,
                            geocodedAt,           
                            locationAccuracy, 
                            Latitude: latitude,      
                            longitude: longtitude,   
                            province,                
                            district,                   
                            };
                            sessionStorage.setItem("complaintFormDraft", JSON.stringify(draft));
                            router.push('/userform/Complaint_Details/MapEdit');
                        }}
                    className='absolute bottom-15 left-1/2 -translate-x-1/2 bg-white/80 h-10 rounded-full cursor-pointer'
                    >
                        <div className='flex flex-row items-center justify-center px-4  text-base text-[#725C00]'>
                            <GrWaypoint className='mr-2'/>
                            <span className='text-xs font-semibold tracking-widest'>PIN LOCATION</span>
                        </div>
                    </button>
            </div>
        </div>

        <div className='bg-white shadow-lg shadow-gray-100 rounded-lg p-6 w-full mt-6 h-screen-min'>
            {/* อัพโหลดรูปภาพ */}
            <div>
                <p className='text-[#5D5C74] text-lg font-semibold'>รูปภาพ</p>
                <p className='text-[#4D4632] text-base font-normal mb-3'>Photo</p>

                 {/* Upload Zone — ซ่อนถ้าครบ 5 รูปแล้ว */}
                {photos.length < MAX_PHOTOS && (
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-64 bg-neutral-secondary-medium border-dashed border-3 border-[#D1C6AB] rounded-2xl cursor-pointer hover:bg-neutral-tertiary-medium">
                            <div className="flex flex-col items-center justify-center text-body pt-5 pb-6">
                                <div className='bg-white px-5 py-5 shadow-md rounded-full mb-5'>
                                    <MdOutlineCameraAlt size='30' color='725C00' />
                                </div>
                                <p className="mb-2 text-lg text-[#5D5C74] font-semibold">
                                    Upload รูป <span className="font-normal">(Upload Photo)</span>
                                </p>
                                <p className="text-base text-[#4D4632]">
                                    อย่างน้อย 1 รูป (At least 1 photo)
                                </p>
                                <p className="text-sm text-[#9E9E9E] mt-1">
                                    {photos.length}/{MAX_PHOTOS} รูป
                                </p>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>
                )}
                {uploadError && (
                    <p className="text-red-500 text-sm mt-2 text-center">{uploadError}</p>
                )}

            {errors.photo && <p className='text-[#FA3E3E] text-sm mb-4'>{errors.photo}</p>}       

               {/* Preview รูปที่เลือก */}
{photoPreviews.length > 0 && (
    <div className="grid grid-cols-3 gap-3 mt-4">
        {photoPreviews.map((url, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden aspect-square">
                <img
                    src={url}
                    alt={`photo-${i}`}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setSelectedPhoto(url)}
                />
                <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/70"
                >
                    ✕
                </button>
            </div>
        ))}
    </div>
)}

{/* Modal */}
{selectedPhoto && (
    <div
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        onClick={() => setSelectedPhoto(null)}
    >
        <button
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full w-9 h-9 flex items-center justify-center text-lg hover:bg-black/70"
            onClick={() => setSelectedPhoto(null)}
        >
            ✕
        </button>
        <img
            src={selectedPhoto}
            className="max-w-[90vw] max-h-[90vh] rounded-2xl object-contain"
            alt="preview"
            onClick={(e) => e.stopPropagation()}
        />
    </div>
)}
            </div>
        </div>

        <div className='bg-white shadow-lg shadow-gray-100 rounded-lg p-6 w-full mt-6'>
            {/* รายละเอียดปัญหา additionalNotes*/}
            <div>
                <p className='text-[#5D5C74] text-lg font-semibold'>หมายเหตุเพิ่มเติม</p>
                <p className='text-[#4D4632] text-base font-normal mb-2'>Additional Notes</p>
                <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    className={`w-full min-h-[5.5rem] bg-[#F4F4F1] rounded-xl p-4 mt-1 mb-1 py-4 px-4 placeholder:text-[#7F7660] resize-none text-base ${errors.additionalNotes ? 'border border-[#FA3E3E]' : 'border border-transparent'}`}
                    placeholder='ข้อมูลอื่นๆ ที่ต้องการแจ้ง...'
                />
                <p className="text-sm text-[#4D4632]/80 mt-1">
                    {additionalNotesCharCount}/100 ตัวอักษร
                </p>         
            </div>
            {errors.additionalNotes && <p className='text-[#FA3E3E] text-sm mb-4'>{errors.additionalNotes}</p>}
        </div>

        {/* ปุ่มถัดไป */}
        <div className='flex items-center justify-center w-full mt-5 mb-10'>
            <button 
                type="submit" 
                id="next-button" 
                className='bg-nt text-black rounded-full px-6 py-3 mt-6 font-bold w-100 h-18 shadow-md hover:cursor-pointer hover:bg-nt/70 transition duration-300 ease-in-out flex items-center justify-center space-x-2'
            > 
                <div className='flex items-center justify-center text-xl'>
                    <span className='mr-2'>ถัดไป</span>
                    <span className='text-xl'>
                        <IoMdArrowRoundForward  />
                    </span>
                </div>
            </button>
        </div>

        {/* ปุ่มย้อนกลับ */}
        <div className='flex items-center justify-center w-full mb-30'>
            <Link href='/userform/Reporter_Info' shallow={false}>
                <p className='text-[#4D4632] font-bold text-lg'>ย้อนกลับ (Back)</p>
            </Link>
        </div>
      </form>
    </div>
  )
}

export default card_form2
