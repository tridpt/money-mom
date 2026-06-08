# Money Mom 👩‍🦰💸

> Ứng dụng quản lý tài chính kiểu **"bị mắng mới chịu tiết kiệm"**.

**🔗 Dùng thử ngay (không cần cài đặt): [tridpt.github.io/money-mom](https://tridpt.github.io/money-mom/)**

Thay vì những biểu đồ thu chi khô khan, Money Mom quản lý ví tiền của bạn bằng cách... **mắng mỏ và khích bác**, đóng vai một người mẹ nghiêm khắc hoặc một người yêu cũ thực dụng.

## ✨ Tính năng

- 🛍️ **Ghi chi tiêu, thu nhập, tiết kiệm** — phân biệt khoản thiết yếu và không thiết yếu.
- 😤 **Mẹ mắng khi tiêu hoang** — nhập "Mua trà sữa 60.000" là nghe ngay: *"Lương ba cọc ba đồng mà tiêu như chủ tịch tập đoàn vậy con?"*
- 🐷 **Khen mỉa khi tiết kiệm** — *"Ồ, hôm nay cũng biết nghĩ cho tương lai rồi cơ à?"*
- 💔 **5 nhân vật**: Mẹ nghiêm khắc, Người yêu cũ thực dụng, Sếp keo kiệt, Bà hàng xóm nhiều chuyện, Ông bố lạnh lùng.
- 💥 **Hệ thống combo**: tiêu hoang liên tiếp là mẹ mắng leo thang (x3, x5, x7, x10).
- 🔥 **Streak tiết kiệm**: đếm số ngày liên tiếp không tiêu hoang.
- 🏆 **Huy hiệu & thành tích**: "Thánh bỏ ống", "Chúa chi tiêu", "Tay hòm chìa khóa"...
- 🤖 **Chế độ AI (tùy chọn)**: mẹ tự nghĩ câu mắng riêng cho từng khoản (dùng API key của bạn, lưu cục bộ).
- 📲 **PWA**: cài lên màn hình điện thoại như app thật, có icon, chạy offline.
- 🌗 **Giao diện sáng/tối** + màn hình hướng dẫn lần đầu (onboarding).
- 🎉 **Hiệu ứng confetti** khi mở khóa huy hiệu.
- 🏁 **Mục tiêu tiết kiệm**: đặt mục tiêu + thanh tiến độ, đạt là confetti ăn mừng.
- 🔁 **Chi tiêu định kỳ**: khai báo tiền nhà, internet... mỗi tháng được nhắc và ghi một chạm.
- 🔍 **Lọc & tìm kiếm** sổ chi tiêu theo loại, danh mục, ghi chú.
- ✏️ **Sửa giao dịch** đã ghi.
- 🎯 **Hạn mức theo từng danh mục** (vd: ăn uống tối đa 2 triệu/tháng).
- 💱 **Đổi đơn vị tiền tệ** (VND, USD, EUR, JPY, KRW, GBP).
- 💾 **Xuất / nhập dữ liệu** ra file JSON để sao lưu và chuyển máy; reset toàn bộ.
- 📅 **Tổng kết tháng tự động** kèm lời mẹ phán + ảnh chia sẻ.
- 🔮 **Dự đoán cuối tháng**: "với đà này bạn sẽ tiêu hết X".
- 📝 **Nhắc nhở hằng ngày** khai báo chi tiêu.
- 💼 **Khai báo lương tháng** để được "so sánh" cho thấm.
- 🎯 **Hạn mức chi tiêu tháng** + thanh tiến độ — vượt ngân sách là mẹ "nổi điên".
- 🥧 **Biểu đồ tròn**: xem tiền đi đâu nhiều nhất theo danh mục (ăn uống, mua sắm, đi lại...).
- 📊 **Biểu đồ cột**: so sánh chi tiêu 6 tháng gần đây.
- 📈 **So sánh tháng này vs tháng trước** + tỷ lệ tiết kiệm.
- 🔊 **Âm thanh phản ứng** — tiếng báo lỗi khi bị mắng, nhạc vui khi tiết kiệm.
- 📸 **Khoe "thành tích bị mắng"** — tạo ảnh chia sẻ lên Facebook / X / Threads.
- 📒 **Sổ chi tiêu** + theo dõi số dư, tổng thu/chi/heo đất.
- 💾 **Lưu ngay trên máy** (localStorage), không cần server, không cần đăng nhập.

## 🚀 Chạy thử

Không cần build. Chỉ cần mở file:

```bash
# Cách 1: mở trực tiếp
# Mở index.html bằng trình duyệt

# Cách 2: chạy qua local server (khuyến nghị)
npx http-server . -p 8080 -c-1
# rồi mở http://127.0.0.1:8080
```

## 🧱 Cấu trúc

```
money-mom/
├── index.html     # Giao diện
├── styles.css     # Phối màu, animation, bong bóng thoại
├── messages.js    # Kho câu thoại của các nhân vật (phần linh hồn)
├── app.js         # Logic: state, render, localStorage, biểu đồ, PWA
├── manifest.json  # Khai báo PWA
├── sw.js          # Service worker (chạy offline)
└── icon-192.png, icon-512.png  # Icon app
```

## 🛠️ Công nghệ

Vanilla HTML/CSS/JavaScript. Không framework, không dependency.

## 💡 Ý tưởng phát triển

- Text-to-speech: đọc to câu mắng
- Đa ngôn ngữ (thêm tiếng Anh)
- Quy đổi tỷ giá thật cho phần tiền tệ
- Backend proxy cho AI (giấu key)

## 📄 License

MIT
