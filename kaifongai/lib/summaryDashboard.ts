// lib/summaryDashboard.ts
import { DashboardData } from "../services/DataProvider";
//สำหรับส่งค่าไปที่ front เพื่อแสดงผล
interface SummaryItem{
        title: string ;
        value: number ;
        subvalue?: string | number ;
        color?: string ;
}
//วัน
export function summaryToday(data: DashboardData): SummaryItem{
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' +
                     String(today.getDate()).padStart(2, '0');

    const casesToday = data.cases.filter(c => c.datetime.slice(0, 10) === todayStr).length;

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.getFullYear() + '-' + String(yesterday.getMonth() + 1).padStart(2, '0') + '-' +
                     String(yesterday.getDate()).padStart(2, '0');

   const casesYesterday = data.cases.filter(c => c.datetime.slice(0, 10) === yesterdayStr).length;
   
   //console.log(today)
   //console.log(yesterday)

   // % เพิ่มขึ้น = (วันนี้ - เมื่อวาน) / เมื่อวาน * 100
   const todayPercent = casesYesterday > 0 
    ? ((casesToday - casesYesterday) / casesYesterday * 100).toFixed(2) 
    : "0"; 
    

    return  { title: "เรื่องที่ร้องเรียนวันนี้", value: casesToday, color:"#725C00"}

}
//เดือน 
export function summaryMonth(data: DashboardData): SummaryItem{
  const today = new Date();

  const currentMonth = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0");
  const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.getFullYear() + "-" + String(lastMonthDate.getMonth() + 1).padStart(2, "0");

  const total = data.cases.filter(c => c.datetime.slice(0, 7) === currentMonth).length;
  const prev = data.cases.filter(c => c.datetime.slice(0, 7) === lastMonth).length;
  // % เพิ่มขึ้น = (เดือนนี้ - เดือนก่อน) / เดือนก่อน * 100
  const percent = prev > 0 ? ((total - prev) / prev * 100).toFixed(2) : "0";
  
  //console.log("เดือนก่อน "+lastMonth+" มี "+ prev);
  //console.log("เดือนนี้ "+currentMonth+" มี "+ total);

  return { title: "เรื่องที่ร้องเรียนเดือนนี้", value: total, color:"#FFD100"}; 
}

//pending
export function summaryPending(data: DashboardData): SummaryItem{
  const total = data.cases.filter(c => c.status === "pending").length;
  return { title: "รอดำเนินการ", value: total ,color:"#BA1A1A"};
}

//success
export function summaryResolved(data: DashboardData): SummaryItem {
  const total = data.cases.filter(c => c.status === "resolved").length;
  const percent = ((total / data.cases.length) * 100).toFixed(1);
  return { title: "แก้ไขเสร็จสิ้นแล้ว", value: total,color:"#059669"};
}

//สัปดาห์
export function summaryWeek(data: DashboardData): SummaryItem {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  //console.log("สัปดาห์นี้ "+weekAgo.getDate())

  const total = data.cases.filter(c => new Date(c.datetime) >= weekAgo).length;
  return { title: "ร้องเรียนใหม่สัปดาห์นี้", value: total};
}

//เวลาเฉลี่ยในการปิดงาน (วัน)
export function summaryAvgCloseTime(data: DashboardData): SummaryItem{
  const resolvedCases = data.cases.filter(c => c.status === "resolved");
 const times = resolvedCases
  .map(c => {
    const logs = data.case_status_logs
      .filter(l => l.case_id === c.id)
      .sort((a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime());

    const pending = logs.find(l => l.status === "pending");
    const resolved = [...logs].reverse().find(l => l.status === "resolved");

    if (!pending || !resolved) return null; 

    return new Date(resolved.changed_at).getTime() - new Date(pending.changed_at).getTime();
  })
  .filter(v => v !== null); 

  const avgCloseTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length / (1000 * 60 * 60 * 24) : 0; //ms → sec (÷1000) → min (÷60) → hr (÷60) → day (÷24)
    //sum(resolved-pending)/(resolvedCases)

  //console.log(data.case_status_logs[0]);
  console.log(Number(avgCloseTime.toFixed(2)));
  //console.log(avgCloseTime);
  

  return { title: "เวลาเฉลี่ยในการปิดงาน", value: Number(avgCloseTime.toFixed(2)), subvalue: "วัน" , color:"#FFD100"};
}

//เจ้าหน้าที่ออนไลน์ ตัดออก (ที่ออนไลน์ ณ ขณะนี้)
/*
export function summaryOnlineTechnicians(data: DashboardData): SummaryItem{
}
*/

//อันดับปัญหา 
export function getRanking(data: DashboardData) {
  const problemCount: Record<number, number> = {};
  data.cases.forEach(c => {
    problemCount[c.problem_id] = (problemCount[c.problem_id] || 0) + 1;
  });

  const rankingArray = Object.entries(problemCount)
    .map(([pid, count]) => {
      const problem = data.problems.find(p => p.id === Number(pid));
      return {
        id: Number(pid),
        problemName: problem?.name || "",
        description: problem?.description || "",
        count
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const totalCases = data.cases.length;
  return rankingArray.map((p, idx) => ({
    key: idx + 1,
    id: p.id,
    title: p.problemName,
    value: p.description,
    subvalue: Math.round((p.count / totalCases) * 100)
  }));
}

// all
export async function getSummaryDataDashboard(data: DashboardData) {
  return {
    topCards: [
    summaryPending(data),summaryResolved(data),summaryAvgCloseTime(data)
    ],
    bottomCards: [
    summaryToday(data),summaryWeek(data),summaryMonth(data)
    ],
    RankingCards: getRanking(data) 
  }
}
