import data from "@/data/mock_data_may2026.json"
export function getCurrentUserId(): string {
  return data.meta.reference_ids.citizen_users[0].user_id; // เปลี่ยนจาก hardcode เปน auth
}