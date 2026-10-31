INSERT OR REPLACE INTO books(id,title,author,genre,status,rating,chapter_count,accent,description) VALUES
('skyforge','นครเหนือเมฆ','ลมเหนือ','Fantasy','Ongoing',4.9,42,'#5B5BD6','เมืองลอยฟ้าที่ซ่อนความจริงของแผนที่ต้องห้าม'),
('jadepath','วิถีหยกนิรันดร์','หมึกคราม','Cultivation','Ongoing',4.8,118,'#0F766E','การเดินทางของศิษย์สำนักเล็กสู่เส้นทางที่ไม่มีใครคาดคิด'),
('zero-hour','ศูนย์ชั่วโมง','N. Vector','Sci-Fi','Completed',4.7,64,'#334155','เมื่อเวลาทั่วทั้งมหานครหยุดนิ่ง มีเพียงคนกลุ่มหนึ่งที่ยังเคลื่อนไหวได้'),
('glass-rain','ฝนบนกระจก','พรายดาว','Romance','Completed',4.6,36,'#BE185D','เรื่องของคนสองคนที่กลับมาพบกันในฤดูฝนหลังจากหายไปหลายปี'),
('black-lantern','ตะเกียงสีดำ','Kirin','Mystery','Ongoing',4.9,57,'#7C3AED','ตะเกียงเก่าที่ติดขึ้นเองทุกครั้งก่อนมีคนหายตัวไป'),
('iron-pulse','ชีพจรเหล็ก','Astra Forge','Action','Ongoing',4.5,81,'#B45309','หน่วยกู้วิกฤตต้องหยุดเครือข่ายอาวุธอัตโนมัติก่อนเมืองทั้งเมืองถูกล็อกดาวน์');

WITH RECURSIVE nums(n) AS (
  SELECT 1 UNION ALL SELECT n+1 FROM nums WHERE n < 12
), ids(book_id) AS (
  VALUES ('skyforge'),('jadepath'),('zero-hour'),('glass-rain'),('black-lantern'),('iron-pulse')
)
INSERT OR REPLACE INTO chapters(id,book_id,chapter_no,title,body,is_free,coin_price)
SELECT
  book_id || '-' || n,
  book_id,
  n,
  'ตอนตัวอย่าง ' || n,
  'เนื้อหาตัวอย่างต้นฉบับสำหรับทดสอบ ASTRA Read ตอนที่ ' || n || char(10) || char(10) ||
  'รุ่งเช้าของวันนั้นเริ่มด้วยสัญญาณเล็ก ๆ ที่ไม่มีใครใส่ใจ แต่ไม่นานมันก็เปลี่ยนเส้นทางของทุกคนที่เกี่ยวข้อง',
  CASE WHEN n <= 10 THEN 1 ELSE 0 END,
  CASE WHEN n <= 10 THEN 0 ELSE 10 END
FROM ids CROSS JOIN nums;

INSERT OR IGNORE INTO reader_profiles(id,display_name) VALUES('demo-reader','Demo Reader');
