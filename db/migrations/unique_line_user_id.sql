-- ป้องกัน user ซ้ำ (1 line_user_id ต้องมีแค่ 1 แถวใน users)
ALTER TABLE users ADD CONSTRAINT unique_line_user_id UNIQUE (line_user_id);