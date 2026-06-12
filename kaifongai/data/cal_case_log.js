const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "data.json");

// output 
const outputPath = path.join(__dirname, "case_status_logs.json");

const raw = fs.readFileSync(inputPath, "utf-8");
const data = JSON.parse(raw);


function formatDate(date) {
  return date.toISOString().replace(".000Z", "Z");
}


function genLogs(cases) {
  let logs = [];
  let id = 1;

  cases.forEach(c => {
    let t = new Date(c.datetime);

    // pending
    logs.push({
      id: id++,
      case_id: c.id,
      status: "pending",
      changed_at: formatDate(t)
    });

    // in_progress
    if (c.status !== "pending") {
      let t2 = new Date(t);
      t2.setHours(t2.getHours() + 1); //1 ชม

      logs.push({
        id: id++,
        case_id: c.id,
        status: "in_progress",
        changed_at: formatDate(t2)
      });

      // resolved
      if (c.status === "resolved") {
        let t3 = new Date(t2);
        t3.setDate(t3.getDate() + 1); //1 วัน

        logs.push({
          id: id++,
          case_id: c.id,
          status: "resolved",
          changed_at: formatDate(t3)
        });
      }
    }
  });

  return logs;
}


//คำนวณ ART
function calculateART(cases, logs) {
  const resolvedCases = cases.filter(c => c.status === "resolved");

  const durations = resolvedCases.map(c => {
    const caseLogs = logs
      .filter(l => l.case_id === c.id)
      .sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));

    const pending = caseLogs.find(l => l.status === "pending");
    const resolved = [...caseLogs].reverse().find(l => l.status === "resolved");

    if (!pending || !resolved) return 0;

    return new Date(resolved.changed_at) - new Date(pending.changed_at);
  });

  const valid = durations.filter(d => d > 0);

  const avg =
    valid.length > 0
      ? valid.reduce((a, b) => a + b, 0) / valid.length / (1000 * 60 * 60 * 24)
      : 0;

  return avg;
}
function logARTDetails(cases, logs) {
  const resolvedCases = cases.filter(c => c.status === "resolved");

  let durations = [];

  console.log("\n📌 รายเคสที่ปิดงาน:\n");

  resolvedCases.forEach(c => {
    const caseLogs = logs
      .filter(l => l.case_id === c.id)
      .sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));

    const pending = caseLogs.find(l => l.status === "pending");
    const resolved = [...caseLogs].reverse().find(l => l.status === "resolved");

    if (!pending || !resolved) return;

    const diffMs = new Date(resolved.changed_at) - new Date(pending.changed_at);
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    durations.push(diffDays);

    console.log(
      `Case ${c.id} → ${diffHours.toFixed(2)} hrs (${diffDays.toFixed(2)} days)`
    );
  });

  const avg =
    durations.reduce((a, b) => a + b, 0) / durations.length;

  console.log("\n📊 สรุปรวม:");
  console.log("จำนวนเคส:", durations.length);
  console.log("Average (days):", avg.toFixed(2));
}

// run
const logs = genLogs(data.cases);
fs.writeFileSync(outputPath, JSON.stringify(logs, null, 2));

logARTDetails(data.cases, logs);


const art = calculateART(data.cases, logs);

console.log("case_status_logs.json created");
console.log("ART (Average Resolution Time):", art.toFixed(2), "days");
