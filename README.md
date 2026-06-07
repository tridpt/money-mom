# Money Mom 👩‍🦰💸

> Ứng dụng quản lý tài chính kiểu **"bị mắng mới chịu tiết kiệm"**.

**🔗 Dùng thử ngay (không cần cài đặt): [tridpt.github.io/money-mom](https://tridpt.github.io/money-mom/)**

Thay vì những biểu đồ thu chi khô khan, Money Mom quản lý ví tiền của bạn bằng cách... **mắng mỏ và khích bác**, đóng vai một người mẹ nghiêm khắc hoặc một người yêu cũ thực dụng.

## ✨ Tính năng

- 🛍️ **Ghi chi tiêu, thu nhập, tiết kiệm** — phân biệt khoản thiết yếu và không thiết yếu.
- 😤 **Mẹ mắng khi tiêu hoang** — nhập "Mua trà sữa 60.000" là nghe ngay: *"Lương ba cọc ba đồng mà tiêu như chủ tịch tập đoàn vậy con?"*
- 🐷 **Khen mỉa khi tiết kiệm** — *"Ồ, hôm nay cũng biết nghĩ cho tương lai rồi cơ à?"*
- 💔 **2 tính cách**: Mẹ nghiêm khắc & Người yêu cũ thực dụng.
- 💼 **Khai báo lương tháng** để được "so sánh" cho thấm.
- 🎯 **Hạn mức chi tiêu tháng** + thanh tiến độ — vượt ngân sách là mẹ "nổi điên".
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
├── messages.js    # Kho câu thoại của "mẹ" (phần linh hồn)
└── app.js         # Logic: state, render, localStorage
```

## 🛠️ Công nghệ

Vanilla HTML/CSS/JavaScript. Không framework, không dependency.

## 💡 Ý tưởng phát triển

- Phân loại chi tiêu theo danh mục (ăn uống, mua sắm, đi lại...)
- Biểu đồ tiền đi đâu nhiều nhất
- Thêm tính cách mới (sếp keo kiệt, bà hàng xóm...)
- AI sinh câu mắng sáng tạo theo từng khoản chi
- PWA: cài như app trên điện thoại, chạy offline

## 📄 License

MIT
