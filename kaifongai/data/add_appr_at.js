const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, "member1.json");
const outputPath = path.join(__dirname, "member.json");

const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const updatedTechnicians = data.technicians.map(tech => {
  if (tech.status === "approved") {
    const date = new Date(tech.datetime);
    date.setHours(date.getHours() + 1); // เพิ่ม 1 ชั่วโมง
    return { ...tech, approve_at: date.toISOString() };
  } else {
    return { ...tech, approve_at: "" };
  }
});

fs.writeFileSync(outputPath, JSON.stringify({ technicians: updatedTechnicians }, null, 2), 'utf8');

console.log('JSON updated successfully!');