// app/api/requests/route.ts

import data from "@/data/mock_data_may2026.json";
import { calcResolvedDuration, calcPendingDuration, getGroup, getComplaintNumber } from "@/lib/mockDB/caseUtils"; //ฟังก์ชันช่วยเหลือสำหรับการคำนวณระยะเวลา, จัดกลุ่ม, และดึงหมายเลขคำร้อง
import type {Status, ServiceRequest, RequestsPayload} from "@/lib/mockDB/requests.types"; //เอา type มาใช้เพื่อให้โค้ดมีความชัดเจนและตรวจสอบได้ง่ายขึ้น
import {STATUS_PROGRESS } from "@/lib/mockDB/status"; //เอา object ที่แมป status กับเปอร์เซ็นต์ความคืบหน้าไว้แล้วมาใช้เพื่อแสดงความคืบหน้าใน UI
import { getCurrentUserId } from "@/lib/session"; 

const TARGET_USER_ID = getCurrentUserId(); //ถ้าใช้แบคเอน auth ให้ไปแก้ใน /lib/session ตอนนี้ hardcode id 

const currentUser = data.meta.reference_ids.citizen_users.find(
  (u) => u.user_id === TARGET_USER_ID //จริงๆแล้วมันต้องใช้ user_line_id นะ
);

// ฟังก์ชันหลักนี้คือส่วนที่จะมาแสดงในหน้า track-complaint/complaint เป็นหน้าที่โชว์คำร้องทั้งหมดของ user 
// โดยจะเอา complaint ที่มี user_line_id ตรงกับ TARGET_USER_ID มาแสดง 
// จะจัดเรียงตามวันที่สร้างจากใหม่ไปเก่า จากนั้นก็จะเอาข้อมูลที่จำเป็นมาแปลงเป็นรูปแบบที่หน้า track-complaint ต้องการ แล้วก็ส่งกลับไปในรูปแบบ JSON 
export async function GET(): Promise<Response> {
  const complaints = data.complaints
  //จริงๆแล้ว จะต้องคิวรี่โดยดึง complaint ที่มี user_id ตรงกับ user_line_id ของผู้ใช้ที่ log in อยู่ตอนนี้ด้วย
    .filter((c) => c.user_id === TARGET_USER_ID)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

 const requests: ServiceRequest[] = complaints.map((c) => {
   //ที่ getStatusCode ต้องเอา current_status_id ไปหาใน reference_ids.statuses ว่ามี code อะไร แล้วเอา code มาแปลงเป็น status ในระบบเราอีกที (code เช่น PENDING โดย id = 003 โดยประมาณ)
    const status: Status = getStatusCode(c.current_status_id);
    const isResolved = status === "resolved" ;

    return {
      id:          c.complaint_id,
      complaintNo: getComplaintNumber(c.complaint_no) || "", //หมายเลขคำร้อง 
      title:       getCategory(c.category_id) || "", //ชื่อประเภทหัวข้อใหญ่

      //ที่actionNote ต้องไปดูใน workflow_logs ถ้าเกิดเปน resolved ให้เอาเวลาที่ใช้ในการแก้ไขมาแสดง 
      //แต่ถ้าไม่ใช่ให้เอา action note ล่าสุดมาแสดงแทน โดยดูจาก log ที่มี complaint_id ตรงกัน แล้วเอา action note ของ log ที่มี action_datetime ล่าสุดมาแสดง
      actionNote:  isResolved
                    ? calcResolvedDuration(c.created_at, c.resolved_at) : getLatestActionNote(c.complaint_id),
      category:    c.category_id,
      status, //ได้มาจาก getStatusCode 

      district:    c.district,
      province:    c.province,

     //UI field
      detailMeta: isResolved
                      ? ""
                      : status === "pending"
                      ?  "\u00A0\u00A0\u00A0·\u00A0\u00A0" + calcPendingDuration(c.created_at)
                      : `${calcPendingDuration(c.created_at)}`,

      progress:    STATUS_PROGRESS[status], //ได้มาจาก STATUS_PROGRESS ซึ่งเป็น object ที่แมป status กับเปอร์เซ็นต์ความคืบหน้าไว้แล้ว
      date:        new Date(c.created_at).toLocaleDateString("th-TH", {
                     day: "numeric", month: "short", year: "numeric",
                     timeZone: "Asia/Bangkok" //+7 utc
                   }), //แปลงวันที่เป็นรูปแบบ วัน เดือน ปี โดยใช้ locale th-TH เพื่อให้แสดงผลเป็นภาษาไทย เช่น 1 ม.ค. 2567

      group:          getGroup(c.created_at), 
      rating:         getRating(c.complaint_id, c.user_id),

      showRateAction: isResolved,
    };
  });
  
  //ตัวแปรที่จะเอาไปส่งกลับในรูปแบบ JSON ซึ่งมีโครงสร้างตามที่หน้าต้องการ มีข้อมุลผู้ใช้, จำนวนเรื่องร้องเรียนในแต่ละสถานะ, และ คำร้องจากฟังชันด้านบน
  const payload: RequestsPayload = {
    //เอาไว้ใช้กับแสดงส่วนด้านบนกับ Nav 
    user:   { name: currentUser?.display_name ?? "ผู้ใช้งาน" },
    //เอาไว้ใช้ส่วน statusTabs (บอกจำนวนสถานะ)
    counts: { 
      all:         requests.length,
      in_progress: requests.filter((r) => r.status === "in_progress").length,
      resolved:    requests.filter((r) => r.status === "resolved").length,
      pending:     requests.filter((r) => r.status === "pending").length,
      paused:      requests.filter((r) => r.status === "paused").length,
      rejected:      requests.filter((r) => r.status === "rejected").length
    },
    requests, //ตัวแปรด้านบนที่เราแปลงมาแล้วเปนข้อมุลที่เก็บใน StatusCard
  };

  return Response.json(payload);
}

//อนาคตจะเปลี่ยนเปน คิวรี่ 
//ดึงคะแนนรีวิวของเคสนี้จาก complaint_feedback โดยเอา complaint_id กับ user_id มาเทียบกัน ถ้าเจอที่ตรงกันก็เอาคะแนนรีวิวมาแสดง ถ้าไม่มีเลยก็แสดง undefined
function getRating(complaintId: string, userId: string): number | undefined {
  return data.complaint_feedback.find(
    (f) => f.complaint_id === complaintId && f.user_id === userId
  )?.score_overall ?? undefined;
}

//ดึงชื่อหมวดหมู่ใหญ่มาแสดงในหน้าแรก โดยเอา category_id ของ complaint ไปหาใน reference_ids.categories ว่าชื่ออะไร
function getCategory(category_id: string): string | undefined {
  return data.meta.reference_ids.categories.find(
    (c) => c.category_id === category_id
  )?.name ?? undefined;
}

//ดึง action note ล่าสุดมาแสดงในหน้าแรก จาก workflow log ที่มี complaint_id ตรงกัน แล้วเอา action note ของ log ที่มี action_datetime ล่าสุดมาแสดง
function getLatestActionNote(complaintId: string): string {
  const logs = data.workflow_logs
    .filter((l) => l.complaint_id === complaintId) 
    .sort((a, b) => new Date(b.action_datetime).getTime() - new Date(a.action_datetime).getTime());
    //เอา action note ของ log ที่มี action_datetime ล่าสุดมาแสดง ถ้าไม่มี log เลยให้แสดง "-"
  return logs[0]?.action_note ?? "-";
}

//ป้องกันตัวอักษรใหญ่เล็กไม่ตรงกับใน data เพราะบางอันดาต้าใช้ตัวใหญ่บางอันใช้ตัวเล็ก เลยแปลงมาเป็น status กลางๆ ก่อนแล้วค่อยแปลงเป็น status ในระบบเราอีกที
//สำหรับ status ต้องดูในดาต้าเบสมีอะไรบ้างแล้วค่อยมาแมปอีกที เผื่อค่าเปลี่ยนแปลงหรือมีใหม่ไม่ตรง mock data
function getStatusCode(statusId: string): Status {
  const code = data.meta.reference_ids.statuses.find(
    (s) => s.status_id === statusId
  )?.code;
   switch (code) {
    case "OPEN":
    case "PENDING":
      return "pending";
    case "IN_PROGRESS":
      return "in_progress";
    case "RESOLVED":
    case "CLOSED":
      return "resolved";
    case "PAUSED":
      return "paused";
    case "REJECTED":
      return "rejected";
    default:
      return "pending";
  }
}

   
