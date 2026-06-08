# Money Mom 👩‍🦰💸

> Ứng dụng quản lý tài chính kiểu **"bị mắng mới chịu tiết kiệm"**.

**🔗 Dùng thử ngay (không cần cài đặt): [tridpt.github.io/money-mom](https://tridpt.github.io/money-mom/)**

Thay vì những biểu đồ thu chi khô khan, Money Mom quản lý ví tiền của bạn bằng cách... **mắng mỏ và khích bác**. Nhập một khoản tiêu không thiết yếu là bị phán ngay: *"Lương ba cọc ba đồng mà tiêu như chủ tịch tập đoàn vậy con?"*. Bỏ ống heo thì được khen mỉa: *"Ồ, hôm nay cũng biết nghĩ cho tương lai rồi cơ à?"*.

> Song ngữ 🇻🇳 / 🇬🇧 · Chạy offline (PWA) · Dữ liệu lưu hoàn toàn trên máy bạn.

## ✨ Tính năng

**Cốt lõi**
- 🛍️ Ghi chi tiêu / thu nhập / tiết kiệm, phân loại theo 8 danh mục.
- 😤 Mẹ mắng khi tiêu hoang, khen mỉa khi tiết kiệm.
- 📒 Sổ chi tiêu (tìm kiếm, lọc, sửa, xóa) + theo dõi số dư.
- 💾 Lưu trên máy (localStorage), không cần server hay đăng nhập.

**Vui & gây nghiện**
- 💔 5 nhân vật: Mẹ nghiêm khắc, Người yêu cũ, Sếp keo kiệt, Bà hàng xóm, Ông bố lạnh lùng.
- ✍️ Tự viết câu mắng & 🎭 tạo nhân vật riêng.
- 💥 Combo tiêu hoang leo thang · 🔥 streak tiết kiệm · 🏆 huy hiệu thành tích.
- 🔊 Âm thanh phản ứng · 🗣️ text-to-speech đọc to câu mắng · 🎉 confetti.
- 📸 Khoe "thành tích bị mắng" thành ảnh chia sẻ Facebook / X / Threads.

**Công cụ tài chính**
- 🎯 Hạn mức tháng (tổng & theo danh mục) + cảnh báo vượt mức.
- 🏁 Mục tiêu tiết kiệm + thanh tiến độ.
- 🔁 Chi tiêu định kỳ tự nhắc hằng tháng.
- 🥧📊📈 Biểu đồ tròn / cột / so sánh tháng + tỷ lệ tiết kiệm.
- 📅 Tổng kết tháng tự động · 🔮 dự đoán cuối tháng · 📝 nhắc hằng ngày.
- 💱 Đổi & quy đổi tiền tệ thật (VND, USD, EUR, JPY, KRW, GBP).

**Trải nghiệm**
- 📲 PWA: cài lên màn hình chính, chạy offline.
- 🌗 Sáng/tối · 🌐 song ngữ Việt/Anh · 👋 onboarding · ✨ chế độ AI tùy chọn.
- 💾 Xuất / nhập dữ liệu JSON để sao lưu, chuyển máy.

## 🚀 Chạy thử

Không cần build:

```bash
# Cách 1: mở trực tiếp index.html bằng trình duyệt

# Cách 2 (khuyến nghị, để PWA/service worker hoạt động):
npx http-server . -p 8080 -c-1
# rồi mở http://127.0.0.1:8080
```

**Cách 3 (Windows, không cần gõ lệnh):** double-click vào file **`start.bat`** — nó tự chạy server và mở trình duyệt. Cần cài [Node.js](https://nodejs.org) trước. Để dừng: đóng cửa sổ server vừa mở.

## 🧱 Cấu trúc

```
money-mom/
├── index.html      # Giao diện
├── styles.css      # Phối màu, animation, responsive
├── messages.js     # Kho câu thoại các nhân vật (VI + EN)
├── mm-core.js      # State, DOM, helpers, âm thanh, nhân vật
├── mm-reactions.js # Bộ não phản ứng: khịa theo ngữ cảnh, tâm trạng
├── mm-actions.js   # Ghi/sửa/xóa giao dịch, chia sẻ ảnh
├── mm-features.js  # Biểu đồ, huy hiệu, mục tiêu, định kỳ, AI, tổng kết
├── mm-ui.js        # Theme, PWA, onboarding, i18n, game hóa, mini-game
├── mm-events.js    # Gắn sự kiện
├── mm-init.js      # Khởi tạo app
├── manifest.json   # Khai báo PWA
├── sw.js           # Service worker (offline)
├── start.bat       # Double-click để chạy server (Windows)
├── icon-*.png      # Icon app
└── screenshots/    # Ảnh quảng bá / chụp màn hình
```

> Các file `mm-*.js` được nạp tuần tự (xem `index.html`) và chia sẻ chung biến toàn cục — không dùng module ES để giữ đơn giản.

## 🛠️ Công nghệ

Vanilla HTML/CSS/JavaScript thuần. Không framework, không dependency. Biểu đồ và confetti vẽ tay bằng Canvas.

## 🔒 Quyền riêng tư

Mọi dữ liệu (giao dịch, lương, cài đặt) lưu trong `localStorage` của trình duyệt bạn. Không có server, không thu thập gì. Chế độ AI (nếu bật) gọi thẳng tới nhà cung cấp bằng API key của bạn — key cũng chỉ lưu trên máy.

## 💡 Ý tưởng phát triển

- Backend proxy cho AI (giấu key, dùng chung)
- Push notification nhắc nhở khi đóng app
- Đồng bộ dữ liệu đa thiết bị

## 📄 License

MIT
