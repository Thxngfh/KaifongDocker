// utils/compressImage.ts

/**
 * บีบอัดรูปภาพฝั่ง client ก่อนส่งขึ้น server
 * เพื่อลดขนาด payload และเวลา upload บน mobile network
 *
 * ขั้นตอน:
 * 1. โหลด File เข้า <img> ผ่าน Object URL
 * 2. ย่อขนาดให้ความกว้างไม่เกิน 1280px (ไม่ขยายถ้าเล็กกว่า)
 * 3. วาดลง canvas แล้วลอง export เป็น JPEG ทีละ quality
 * 4. หยุดเมื่อได้ขนาด ≤500KB หรือถึง quality ต่ำสุด (0.70) แล้ว
 * 5. คืน memory ของ Object URL และ return File ใหม่
 *
 * quality floor อยู่ที่ 0.70 เพื่อให้ ML ยังอ่าน edge/detail ของปัญหาได้
 * (ต่ำกว่านี้ JPEG artifact เริ่มรบกวน object detection)
 */
export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()

    // สร้าง temporary URL จาก File เพื่อโหลดเข้า <img>
    const url = URL.createObjectURL(file)

    img.onload = () => {
      // ถ้ากว้างเกิน 1280px → ย่อตามสัดส่วน, ถ้าเล็กกว่า → scale=1 คงขนาดไว้
      const scale = Math.min(1, 1280 / img.width)

      const canvas = document.createElement("canvas")
      canvas.width  = img.width  * scale
      canvas.height = img.height * scale

      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)

      // เป้าหมายขนาดไฟล์ 500KB — สมดุลระหว่าง storage, upload speed, และ ML quality
      const TARGET_BYTES = 500 * 1024

      // ลำดับ quality ที่ลองตามลำดับ: สูง → กลาง → ต่ำสุด
      // 0.70 คือ floor สำหรับ ML — ต่ำกว่านี้ไม่ลงอีก
      const qualities = [0.85, 0.75, 0.70]

      // ใช้ recursive เพราะ toBlob เป็น async callback ไม่สามารถ await ใน for loop ได้
      function tryCompress(i: number) {
        canvas.toBlob(
          (blob) => {
            if (!blob) return

            const isSmallEnough   = blob.size <= TARGET_BYTES
            const isLowestQuality = i === qualities.length - 1

            if (isSmallEnough || isLowestQuality) {
              // ได้ขนาดที่ต้องการ หรือถึง quality ต่ำสุดแล้ว → ใช้เลย
              URL.revokeObjectURL(url)
              resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }))
            } else {
              // ยังใหญ่เกิน → ลด quality แล้วลองรอบถัดไป
              tryCompress(i + 1)
            }
          },
          "image/jpeg",
          qualities[i]
        )
      }

      tryCompress(0)
    }

    // กำหนด src หลังผูก onload เพื่อให้ event ทำงานแน่นอน
    img.src = url
  })
}