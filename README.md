VKU Rooms – Ứng dụng đặt phòng học

Ứng dụng di động / web giúp sinh viên tra cứu phòng học, xem lịch trống theo ngày và đặt phòng theo ca, có mã QR check-in và nhắc lịch trước 15 phút. Xây dựng bằng Expo (React Native) + Firebase.

Tính năng
Đăng nhập bằng Email/Mật khẩu hoặc Google; phiên đăng nhập được lưu lại.
Tra cứu phòng, tìm theo tên, lọc theo tòa nhà và sức chứa.
Xem lịch trống 7 ngày tới, chọn ca học và đặt phòng. Dữ liệu cập nhật realtime từ Firestore.
Chống đặt trùng bằng Firestore Transaction; ca đã qua hoặc đã có người đặt sẽ bị khóa.
Tab Phòng của tôi: xem vé, hiển thị mã QR check-in, hủy vé (trả phòng về hệ thống).
Nhắc lịch bằng thông báo cục bộ trước giờ học 15 phút (chỉ trên điện thoại).
Đăng xuất từ tab Phòng của tôi.
Công nghệ
Thành phần	Thư viện
Framework	Expo SDK 57, React Native 0.86, React 19
Điều hướng	Expo Router (file-based, Stack.Protected)
Backend	Firebase Authentication + Cloud Firestore
State	Zustand (lưu offline bằng AsyncStorage)
Animation	React Native Reanimated
Thông báo	expo-notifications
Cấu trúc thư mục
RoomBooking/
├── firebaseConfig.js          # Khởi tạo Firebase (auth + firestore)
├── store/useBookingStore.ts   # Vé đã đặt (Zustand + AsyncStorage)
├── src/
│   ├── app/
│   │   ├── _layout.tsx        # Cổng xác thực: chưa đăng nhập → /login
│   │   ├── login.tsx          # Màn hình đăng nhập / đăng ký / Google
│   │   └── (tabs)/
│   │       ├── _layout.tsx    # Thanh tab
│   │       ├── index.tsx      # Danh sách phòng + modal đặt phòng
│   │       └── bookings.tsx   # Phòng của tôi + QR + hủy vé
│   └── utils/
│       ├── date.ts            # Xử lý ngày theo giờ địa phương
│       ├── dialog.ts          # Alert/Confirm chạy được cả web lẫn mobile
│       └── reminders.ts       # Đặt / hủy nhắc lịch
├── .env.example               # Mẫu biến môi trường cho Google Sign-In
└── app.json
Cài đặt và chạy

Yêu cầu: Node.js 20+ và npm.

bash
npm install
npx expo start -c        # -c để xóa cache

Sau đó chọn nền tảng:

bash
npm run web              # chạy trên trình duyệt
npm run android          # mở trên Android
npm run ios              # mở trên iOS (cần macOS)

Có thể quét mã QR bằng Expo Go để chạy thử nhanh. Riêng đăng nhập Google trên điện thoại và thông báo nhắc lịch trên Android không chạy trong Expo Go, cần development build (xem bên dưới).

Cấu hình Firebase
1. Authentication

Firebase Console → Authentication → Sign-in method, bật:

Email/Password
Google (chọn email hỗ trợ rồi Save)

Nếu chạy web trên tên miền khác localhost, thêm tên miền đó vào Authentication → Settings → Authorized domains.

2. Firestore

Tạo database và thêm collection rooms. Mỗi document là một phòng:

Trường	Kiểu	Ví dụ	Ghi chú
name	string	A201	Tên phòng, dùng để tìm kiếm
location	string	Tòa A - Tầng 2	Phải chứa "Tòa A/B/C/V" để lọc theo tòa
size	string	30 người	Lấy số đầu tiên để lọc sức chứa
image	string	https://...	Link ảnh phòng
bookedSlots	map	xem dưới	Do app tự ghi, có thể để trống

Ví dụ bookedSlots (khóa là ngày YYYY-MM-DD, giá trị là danh sách ca đã đặt):

json
{
  "2026-10-06": ["07:30 - 09:30", "13:00 - 15:00"]
}

Các ca học cố định trong code: 07:30 - 09:30, 09:30 - 11:30, 13:00 - 15:00, 15:00 - 17:00.

3. Security Rules

Không để Firestore ở chế độ mở. Mức tối thiểu là chỉ cho người đã đăng nhập đọc/ghi:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow read, write: if request.auth != null;
    }
  }
}

Đây là mức cơ bản. Muốn chặt hơn (mỗi người chỉ hủy được vé của mình), cần đổi cấu trúc bookedSlots để lưu cả uid người đặt.

Đăng nhập Google
Web: chỉ cần bật Google trong Firebase, không cần cấu hình thêm.
Điện thoại: cần development build và Client ID.
Google Cloud Console → APIs & Services → Credentials (cùng project với Firebase), tạo OAuth client ID loại Web, Android (cần package name + SHA-1) và iOS (cần bundle ID).
Sao chép .env.example thành .env và điền:
     EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
     EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
     EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
Build: npx expo run:android hoặc npx expo run:ios.
Chỉ cho email trường: trong src/app/login.tsx đổi ALLOWED_DOMAIN = '' thành 'vku.udn.vn'.
Xử lý sự cố thường gặp
Hiện tượng	Nguyên nhân / cách xử lý
Google báo Access blocked / redirect_uri_mismatch	Đang chạy trong Expo Go. Dùng web hoặc development build.
Google báo Error 403: access_denied	OAuth consent screen đang ở chế độ Testing. Thêm email vào Test users hoặc Publish app.
auth/unauthorized-domain	Thêm tên miền vào Authorized domains trong Firebase.
auth/operation-not-allowed	Chưa bật phương thức đăng nhập đó trong Firebase.
Danh sách phòng trống / "Không tải được danh sách phòng"	Kiểm tra mạng, collection rooms và Firestore Rules.
Không có nhắc lịch	Chưa cấp quyền thông báo, hoặc đang dùng Expo Go trên Android.
Lỗi lạ sau khi đổi cấu hình	Chạy npx expo start -c để xóa cache Metro.
Lưu ý bảo mật
apiKey trong firebaseConfig.js là khóa định danh của Firebase Web, không phải bí mật. Việc bảo vệ dữ liệu nằm ở Security Rules.
Mã QR hiện được tạo qua dịch vụ api.qrserver.com. Nếu cần bảo mật hơn, hãy tạo QR cục bộ (ví dụ react-native-qrcode-svg).
Giấy phép

Xem file LICENSE.