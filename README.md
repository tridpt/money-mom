# Money Mom 👩‍🦰💸

> Ứng dụng quản lý tài chính kiểu **"bị mắng mới chịu tiết kiệm"**.

Thay vì những biểu đồ thu chi khô khan, Money Mom quản lý ví tiền của bạn bằng cách... **mắng mỏ và khích bác**, đóng vai một người mẹ nghiêm khắc hoặc một người yêu cũ thực dụng.

## ✨ Tính năng

- 🛍️ **Ghi chi tiêu, thu nhập, tiết kiệm** — phân biệt khoản thiết yếu và không thiết yếu.
- 😤 **Mẹ mắng khi tiêu hoang** — nhập "Mua trà sữa 60.000" là nghe ngay: *"Lương ba cọc ba đồng mà tiêu như chủ tịch tập đoàn vậy con?"*
- 🐷 **Khen mỉa khi tiết kiệm** — *"Ồ, hôm nay cũng biết nghĩ cho tương lai rồi cơ à?"*
- 💔 **2 tính cách**: Mẹ nghiêm khắc & Người yêu cũ thực dụng.
- 💼 **Khai báo lương tháng** để được "so sánh" cho thấm.
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

- Đặt hạn mức chi tiêu + cảnh báo khi vượt ngân sách
- Biểu đồ tiền đi đâu nhiều nhất
- Thêm tính cách mới (sếp keo kiệt, bà hàng xóm...)
- Âm thanh phản ứng khi bị mắng / được khen
- AI sinh câu mắng sáng tạo theo từng khoản chi

## 📄 License

MIT
