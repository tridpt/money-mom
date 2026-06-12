# Đóng góp cho Money Mom

Cảm ơn bạn đã quan tâm! Dự án này cố tình giữ đơn giản: HTML/CSS/JavaScript thuần, không framework, không bước build.

## Chạy thử local

```bash
# Khuyến nghị (để PWA/service worker hoạt động):
npx http-server . -p 8080 -c-1
# rồi mở http://127.0.0.1:8080
```

Trên Windows có thể double-click `start.bat`. Chi tiết kiến trúc xem [`TAI_LIEU.md`](TAI_LIEU.md).

## Cách đóng góp

1. Fork repo và tạo nhánh mới: `git checkout -b feature/ten-tinh-nang`.
2. Thực hiện thay đổi. Giữ phong cách code hiện có (vanilla JS, biến toàn cục, không thêm dependency).
3. Tự kiểm tra trên trình duyệt: thêm/sửa/xóa giao dịch, đổi nhân vật, bật/tắt offline.
4. Commit với thông điệp rõ ràng, mở Pull Request mô tả thay đổi và lý do.

## Một số đóng góp dễ bắt đầu

- **Thêm câu thoại** cho các nhân vật → sửa `messages.js` (cả `MESSAGES` và `MESSAGES_EN` nếu muốn song ngữ).
- **Thêm câu khịa theo từ khóa** → thêm nhóm vào `KEYWORD_ROASTS` trong `mm-reactions.js`.
- **Thêm danh mục chi tiêu** → thêm vào `CATEGORIES` (`mm-core.js`) và `CATEGORY_LABELS_EN`.
- **Sửa lỗi giao diện / responsive** → `styles.css`.

## Lưu ý kỹ thuật

- Các file `mm-*.js` nạp tuần tự và chia sẻ biến toàn cục — tránh đặt tên trùng và giữ đúng thứ tự nạp trong `index.html`.
- Khi thêm/đổi tên file asset: cập nhật mảng `ASSETS` **và** tăng số phiên bản `CACHE` trong `sw.js`, nếu không người dùng cũ sẽ dùng bản cache cũ.

## Quy tắc ứng xử

Giữ thái độ tôn trọng và thân thiện. Mọi câu mắng "gắt" chỉ dành cho... cái ví trong app, không dành cho người đóng góp. 😄
