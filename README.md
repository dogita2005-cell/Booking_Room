# 🏫 Campus Room Booking App (Mini-Project)

Ứng dụng di động hỗ trợ sinh viên và nhóm học tập tìm kiếm, kiểm tra trạng thái và đặt phòng học/phòng thực hành máy tính theo thời gian thực. Dự án được xây dựng nhằm giải quyết bài toán chồng chéo lịch sử dụng và tối ưu hóa việc quản lý không gian học tập.

> **Tiến độ:** Giai đoạn 1 (Hoàn thiện UI/UX và Logic cơ bản)

## ✨ Tính năng hiện tại (Tuần 1)

- **Giao diện hiện đại (Flat Design):** Tối ưu hóa trải nghiệm người dùng với tông màu xám/trắng thanh lịch, hiển thị tốt trên các kích thước màn hình khác nhau.
- **Danh sách phòng học:** Hiển thị chi tiết thông tin (hình ảnh, vị trí, sức chứa) bằng `FlatList`.
- **Đồng bộ thời gian thực (Real-time):** Lắng nghe dữ liệu tức thời từ Firebase Firestore bằng `onSnapshot`. Giao diện tự động cập nhật ngay khi trạng thái phòng thay đổi.
- **Bộ lọc tìm kiếm tức thì:** Tìm kiếm phòng học theo tên nhanh chóng mà không có độ trễ.
- **Logic đặt phòng cơ bản:** Xử lý xác nhận đặt phòng và cập nhật trạng thái `available` sang `booked` trực tiếp lên cơ sở dữ liệu.

## 🛠 Công nghệ sử dụng
- **Framework:** React Native, Expo SDK
- **Ngôn ngữ:** TypeScript
- **Backend/Database:** Firebase Firestore
- **Giao diện:** Flexbox, React Native Safe Area Context

## 🚀 Hướng dẫn cài đặt

**1. Clone dự án về máy**
\`\`\`bash
git clone https://github.com/YOUR_USERNAME/VKU-RoomBooking-App.git
cd VKU-RoomBooking-App
\`\`\`

**2. Cài đặt các gói thư viện**
\`\`\`bash
npm install
# hoặc
npx expo install
\`\`\`

**3. Cấu hình Firebase**
Tạo file \`firebaseConfig.ts\` tại thư mục gốc của dự án và thêm cấu hình Firestore của bạn:
\`\`\`typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
\`\`\`

**4. Khởi chạy ứng dụng**
\`\`\`bash
npx expo start -c
\`\`\`
Quét mã QR bằng ứng dụng **Expo Go** trên thiết bị Android/iOS để trải nghiệm.

## 📅 Kế hoạch phát triển (Giai đoạn tiếp theo)
- [ ] Quản lý State toàn cục với Zustand (Session & Active Reservations).
- [ ] Xây dựng hệ thống chống xung đột (Conflict Engine) và chia slot thời gian (2 tiếng/slot).
- [ ] Tích hợp tính năng tạo mã QR Check-in.
- [ ] Gửi thông báo nhắc nhở (Local Notification) 15 phút trước giờ nhận phòng.