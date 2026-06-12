# Tài liệu kỹ thuật — Mẹ Thiên Hạ (Money Mom)

Tài liệu này mô tả kiến trúc, mô hình dữ liệu và luồng hoạt động bên trong của ứng dụng, dành cho người muốn đọc hiểu hoặc đóng góp code. Phần giới thiệu tính năng và cách chạy nằm trong [`README.md`](README.md).

---

## 1. Tổng quan

Mẹ Thiên Hạ là một **PWA tĩnh** viết bằng HTML/CSS/JavaScript thuần, không framework, không bước build, không backend. Toàn bộ logic chạy trên trình duyệt; dữ liệu lưu trong `localStorage`.

Ý tưởng cốt lõi: mỗi giao dịch người dùng nhập vào sẽ sinh ra một **phản ứng bằng lời** từ một "nhân vật" (mẹ, người yêu cũ, sếp...), tùy theo loại giao dịch, số tiền, danh mục, ngữ cảnh và tâm trạng hiện tại của nhân vật.

| Đặc điểm | Lựa chọn |
|---|---|
| Ngôn ngữ | Vanilla JS (ES2017+), không module ES |
| Lưu trữ | `localStorage` (1 khóa JSON duy nhất) |
| Đồ họa | Canvas vẽ tay (biểu đồ, ảnh chia sẻ, confetti) |
| Âm thanh | Web Audio API (sinh nốt trực tiếp, không dùng file) |
| Giọng nói | Web Speech API (text-to-speech) |
| Offline | Service Worker (`sw.js`) |
| Quốc tế hóa | 2 ngôn ngữ: `vi` / `en` |

---

## 2. Cấu trúc thư mục

```
money-mom/
├── index.html       # Toàn bộ markup + thứ tự nạp script
├── styles.css       # Giao diện, theme sáng/tối, animation, responsive
├── messages.js      # Kho câu thoại (VI + EN), danh sách nhân vật built-in
├── mm-core.js       # State, hằng số, DOM refs, helpers, âm thanh, render cơ bản
├── mm-reactions.js  # "Bộ não" phản ứng: chọn câu khịa theo ngữ cảnh + tâm trạng
├── mm-actions.js    # Thêm/sửa/xóa giao dịch, lương, hạn mức, chia sẻ ảnh
├── mm-features.js   # Biểu đồ, huy hiệu, mục tiêu, định kỳ, AI, tổng kết, game hóa
├── mm-ui.js         # Theme, PWA, onboarding, i18n, mini-game, cài đặt
├── mm-events.js     # Gắn toàn bộ event listener (bindEvents)
├── mm-init.js       # Điểm khởi động (init) — gọi cuối cùng
├── manifest.json    # Khai báo PWA (tên, icon, theme color)
├── sw.js            # Service worker (cache offline)
├── start.bat        # Chạy server tĩnh trên Windows
├── make-icons.ps1   # Script tạo icon
├── make-screenshots.ps1
├── icon-192.png / icon-512.png
└── screenshots/
```

### Thứ tự nạp script (quan trọng)

Các file được nạp **tuần tự** trong `index.html` và **chia sẻ chung biến toàn cục** (không dùng `import/export`). Thứ tự bắt buộc vì file sau phụ thuộc biến/hàm của file trước:

```
messages.js → mm-core.js → mm-reactions.js → mm-actions.js
→ mm-features.js → mm-ui.js → mm-events.js → mm-init.js
```

`mm-init.js` gọi `init()` ngay khi nạp xong, đây là entry point thực tế.

> Đây là đánh đổi có chủ đích: giữ dự án đơn giản, mở thẳng `index.html` là chạy được, không cần bundler. Cái giá phải trả là phải tự quản lý thứ tự nạp và namespace toàn cục.

---

## 3. Mô hình dữ liệu (state)

Toàn bộ trạng thái nằm trong một object `state` toàn cục (định nghĩa ở đầu `mm-core.js`), được tuần tự hóa thành JSON dưới khóa `localStorage`:

```
STORE_KEY = "meThienHa_v1"
```

### Cấu trúc `state`

```js
state = {
  salary: 0,            // lương tháng (gốc tính số dư)
  budget: 0,            // hạn mức chi tiêu tháng
  soundOn: true,        // bật/tắt âm thanh
  ttsOn: false,         // mẹ đọc to câu mắng (TTS)
  lang: "vi",           // vi | en
  theme: "dark",        // dark | light
  onboardingDone: false,
  currency: "VND",      // VND | USD | EUR | JPY | KRW | GBP
  customScolds: [],     // câu mắng người dùng tự viết
  customChars: [],      // nhân vật tự tạo: {id,label,avatar,scold[],praise[],...}
  goal: { name, target },        // mục tiêu tiết kiệm
  catBudgets: { [catId]: số },   // hạn mức theo từng danh mục
  recurring: [],                 // chi tiêu định kỳ: {id,name,amount,category,day,lastApplied}
  lastSummaryMonth: "",          // tháng đã xem tổng kết (YYYY-M)
  anger: 35,                     // tâm trạng nhân vật: 0 (vui) → 100 (giận)
  angerDay: "",                  // ngày cập nhật anger gần nhất (để giảm dần)
  xp: 0,                         // điểm kinh nghiệm (game hóa)
  challenge: { weekKey, id, claimed }, // thử thách tuần
  mood: "mom",                   // nhân vật đang chọn
  combo: 0,                      // số lần tiêu hoang liên tiếp
  maxCombo: 0,
  unlocked: [],                  // id huy hiệu đã mở
  ai: { enabled: false, key: "" },
  transactions: [],              // xem bên dưới
  ui: { type, essential, category }, // trạng thái form đang nhập
}
```

### Đối tượng giao dịch (`transaction`)

```js
{
  id: "lq3x...",        // Date.now().toString(36) + random
  type: "expense",      // expense | income | saving
  amount: 60000,        // số nguyên (đơn vị tiền cơ sở)
  note: "Mua trà sữa",
  essential: false,     // chỉ áp dụng cho expense
  category: "food",     // chỉ áp dụng cho expense; income/saving = null
  ts: 1699999999999,    // timestamp (Date.now)
}
```

### Persist & migrate

- `save()` — ghi toàn bộ `state` xuống `localStorage`.
- `load()` — đọc lại, **merge nông** với state mặc định (`{ ...state, ...parsed, ui: {...} }`) để các trường mới thêm sau này không bị `undefined`. Có bước migration nhỏ: khoản chi cũ thiếu `category` được gán `"other"`.

---

## 4. Hằng số & cấu hình (mm-core.js)

| Hằng số | Ý nghĩa |
|---|---|
| `CATEGORIES` | 8 danh mục (id, label, icon, `essential` mặc định, màu cho biểu đồ) |
| `CAT_MAP` / `getCat(id)` | Tra cứu nhanh danh mục theo id |
| `CURRENCIES` | Cấu hình ký hiệu, locale, vị trí ký hiệu cho 6 loại tiền |
| `VOICE` | Bảng thay đại từ theo nhân vật (vd ex: con→anh, mẹ→em) |
| `MOOD_ORDER` | Thứ tự xoay vòng nhân vật built-in (mom, ex, boss, neighbor, dad) |
| `APP_URL` | URL bản deploy, dùng trong ảnh/caption chia sẻ |

### Helper tiền tệ

- `parseAmount("60.000")` → `60000` (bỏ mọi ký tự không phải số).
- `formatVND(n)` → chuỗi đã định dạng theo `state.currency` (ký hiệu + locale phù hợp).
- `formatNumberInput(value)` → định dạng khi gõ vào ô input.

### Âm thanh

Web Audio API tạo nốt trực tiếp, không tải file:
- `getAudioCtx()` — khởi tạo `AudioContext` lười (lazy).
- `playNotes(notes)` — phát chuỗi nốt `{freq, start, dur, type, gain}`.
- `SOUNDS` — 3 preset: `scold` (báo lỗi trầm), `praise` (arpeggio vui), `over` (còi báo vượt mức).
- `playSound(kind)` — tôn trọng `state.soundOn`.

---

## 5. Hệ thống nhân vật & câu thoại (messages.js)

### Cấu trúc một nhân vật

Mỗi nhân vật trong `MESSAGES` (VI) và `MESSAGES_EN` (EN) có dạng:

```js
{
  label: "😤 Mẹ nghiêm khắc",
  avatar: "👩‍🦰",
  scold:     [...],  // câu mắng khi tiêu KHÔNG thiết yếu
  essential: [...],  // càu nhàu nhẹ khi tiêu thiết yếu
  income:    [...],  // động viên khi có thu nhập
  praise:    [...],  // khen (mỉa) khi tiết kiệm
  idle:      "..."   // câu chào khi không làm gì
}
```

5 nhân vật built-in: `mom`, `ex`, `boss`, `neighbor`, `dad`. Người dùng có thể thêm nhân vật của riêng mình vào `state.customChars`.

### Biến trong câu thoại

`pickMessage(list, vars)` chọn ngẫu nhiên một câu rồi thay thế:
- `{amount}` → số tiền đã format
- `{note}` → ghi chú của giao dịch

### Hợp nhất nhân vật & đại từ

- `getMood(id)` — trả về nhân vật đã chuẩn hóa, ưu tiên built-in theo `state.lang`, fallback sang custom char (thiếu trường nào thì mượn của `mom`).
- `moodList()` — danh sách id để xoay vòng (built-in + custom).
- `applyVoice(text)` — đổi đại từ "con/mẹ" cho hợp nhân vật (vd với `ex` thành "anh/em"). `mom` giữ nguyên; tiếng Anh bỏ qua.

### Combo & vượt hạn mức

- `COMBO_LINES` / `COMBO_LINES_EN` — câu leo thang tại các mốc combo (3,4,5,6,7,10).
- `OVER_BUDGET_LINES` — câu thêm khi vượt hạn mức tháng.

---

## 6. Bộ não phản ứng (mm-reactions.js)

Đây là phần "linh hồn" của app. Hàm trung tâm là `reactTo(transaction)`.

### Luồng `reactTo`

```
reactTo(t)
├── saving  → pickByAmount(SAVING_TIERS)   (khen theo mức tiền)
├── income  → pickByAmount(INCOME_TIERS)
└── expense
    ├── essential
    │   ├── bigEssentialRoast()  → nếu số tiền vô lý so với danh mục
    │   └── m.essential          → càu nhàu nhẹ bình thường
    └── không thiết yếu
        ├── buildContextualScold()  (ưu tiên 80%)
        │   ├── KEYWORD_ROASTS   → khớp từ khóa món đồ (trà sữa, game, son...)
        │   ├── priceTierLine()  → khịa theo bậc giá nếu không khớp từ khóa
        │   └── priceQuip()      → đôi khi thêm "= mấy tô phở/chỉ vàng"
        ├── memoryCallback()     → "mẹ nhớ dai": nhắc đã mua món này hôm qua/tuần này
        ├── timeQuip()           → khịa theo giờ (đêm khuya, cuối tháng)
        ├── + câu vượt hạn mức tổng / theo danh mục
        └── + câu combo leo thang
```

Sau khi dựng được câu, `reactTo` gọi:
- `speak(text, tone)` — hiển thị lên speech bubble + toast, chạy animation rung, đọc to nếu bật TTS.
- `playSound(sound)` — phát âm thanh tương ứng.
- Lưu vào `lastReaction` (để dùng cho chức năng chia sẻ ảnh).
- Hiện nút "Cãi lại" nếu vừa bị mắng.
- Nếu bật AI: gọi `generateAIScold()` bất đồng bộ để thay câu khi có kết quả.

### Hệ thống tâm trạng (anger)

- `anger` chạy từ 0 (vui) đến 100 (giận tím người), chia 5 mức mặt cảm xúc trong `ANGER_FACES`.
- `angerDelta(t)` — tính lượng thay đổi: tiết kiệm/thu nhập làm giảm, tiêu hoang làm tăng (càng nhiều combo càng tăng mạnh).
- `adjustAnger(delta)` — cập nhật + lưu + render lại mood meter.
- `decayAngerOnLoad()` — mỗi ngày không mở app, anger tự nguôi dần về mức trung tính 35.

### Dữ liệu khịa theo ngữ cảnh

| Bảng | Vai trò |
|---|---|
| `KEYWORD_ROASTS` | Map từ khóa (trà sữa, cà phê, game, iphone, nhậu...) → câu khịa riêng |
| `PRICE_TIERS` | Câu khịa theo bậc giá khi không khớp từ khóa |
| `priceQuip(amount)` | So sánh số tiền với tô phở / chỉ vàng (chỉ VND) |
| `BIG_ESSENTIAL` | Khịa khi khoản "thiết yếu" có số tiền vô lý theo danh mục |
| `SAVING_TIERS` / `INCOME_TIERS` | Phản ứng tiết kiệm/thu nhập theo bậc tiền |

---

## 7. Hành động & giao dịch (mm-actions.js)

| Hàm | Mô tả |
|---|---|
| `addTransaction()` | Đọc form → tạo transaction → cập nhật combo → lưu → render lại tất cả → `reactTo` → cộng XP → kiểm tra huy hiệu/thử thách/mục tiêu |
| `deleteTransaction(id)` | Xóa một khoản, render lại |
| `clearAll()` | Xóa toàn bộ sổ (có confirm), reset combo & anger |
| `setType / setCategory / setEssential` | Cập nhật `state.ui` cho form đang nhập |
| `toggleMood()` | Xoay sang nhân vật kế tiếp |
| `saveSalary / saveBudget` | Lưu lương / hạn mức |
| `toggleSound()` | Bật/tắt âm thanh |
| Chia sẻ | `drawShareCard()` vẽ ảnh lên canvas, `shareNative/downloadImage/copyCaption` để chia sẻ |

`addTransaction` là hàm "trục" — gần như mọi render đều được gọi lại từ đây để đồng bộ UI sau mỗi thay đổi.

---

## 8. Tính năng nâng cao (mm-features.js)

Chứa các nhóm chức năng lớn:

- **Biểu đồ (Canvas vẽ tay):** `renderPie()` (chi theo danh mục), `renderBar()` (6 tháng gần nhất), `renderAnalytics()` (so sánh tháng + tỷ lệ tiết kiệm + dự đoán cuối tháng).
- **Huy hiệu / thành tích:** `checkAchievements()`, `renderAchievements()` — mở khóa dựa trên cột mốc (số dư, streak, combo, mục tiêu...).
- **Mục tiêu tiết kiệm:** `saveGoal()`, `renderGoal()`, `getTotalSaving()`.
- **Hạn mức theo danh mục:** `renderCatBudgets()`, `catMonthSpent()`.
- **Chi tiêu định kỳ:** `addRecurring()`, `applyRecurring()`, `remindRecurringDue()` — tự nhắc/ghi khoản cố định hằng tháng.
- **Tổng kết tháng:** `autoMonthlySummary()`, `openSummaryPrevMonth()` — vẽ ảnh tổng kết, chia sẻ được.
- **Game hóa:** `gainXp()`, `renderLevel()`, thử thách tuần (`renderChallenge`, `checkChallengeComplete`).
- **Chế độ AI:** `generateAIScold()` — gọi API tương thích OpenAI bằng key người dùng tự cung cấp (lưu cục bộ), sinh câu mắng riêng cho từng khoản.

---

## 9. Giao diện & trải nghiệm (mm-ui.js)

- **Theme:** `applyTheme()`, `toggleTheme()` — sáng/tối, lưu trong state.
- **PWA:** `setupPWA()` đăng ký service worker và bắt sự kiện `beforeinstallprompt`; `doInstall()` kích hoạt cài đặt.
- **Onboarding:** màn hình giới thiệu nhiều bước cho lần mở đầu tiên.
- **i18n:** `applyLang()`, `toggleLang()` — đổi toàn bộ nhãn UI giữa VI/EN.
- **TTS:** `toggleTTS()`, `speakAloud()` (ở mm-reactions) dùng Web Speech API.
- **Mini-game "Xin tiền mẹ":** `openBeg()`, `doBeg()` — thuyết phục nhân vật duyệt khoản chi xa xỉ; tỉ lệ thành công phụ thuộc `anger`.
- **Cãi lại / Xin lỗi:** `argue()`, `apologize()` — tương tác đổi tâm trạng nhân vật.
- **Cài đặt:** `openSettings()`, `switchPanel()` — trang cài đặt nhiều tab (hạn mức danh mục, tiền tệ, định kỳ, dữ liệu, câu mắng, nhân vật, AI).
- **Dữ liệu:** `exportData()` / `importData()` (JSON), `resetAll()`.

---

## 10. Khởi động (mm-init.js)

`init()` chạy đúng một lần khi nạp xong script cuối:

```
load()                 # đọc state từ localStorage
decayAngerOnLoad()     # nguôi giận theo số ngày vắng mặt
bindEvents()           # gắn toàn bộ listener
render* ...            # vẽ lại mọi phần UI từ state
applyTheme/applyLang/setupPWA
remindRecurringDue()   # nhắc khoản định kỳ tới hạn
dailyReminder()        # nhắc khai báo hằng ngày
→ onboarding (lần đầu) HOẶC autoMonthlySummary()
```

---

## 11. Service Worker (sw.js)

- Tên cache: `me-thien-ha-v16` (tăng số khi đổi asset để buộc làm mới).
- `install` — cache trước toàn bộ asset trong mảng `ASSETS`.
- `activate` — xóa cache phiên bản cũ.
- `fetch` — chiến lược **network-first**: ưu tiên lấy bản mới khi online, lỗi mạng mới fallback về cache. **Bỏ qua** request khác origin (vd lời gọi API OpenAI không bị cache).

> Khi thêm/đổi tên file asset, nhớ cập nhật mảng `ASSETS` **và** tăng số phiên bản `CACHE` trong `sw.js`, nếu không người dùng cũ sẽ tiếp tục dùng bản cache.

---

## 12. Quyền riêng tư & bảo mật

- Mọi dữ liệu (giao dịch, lương, cài đặt) chỉ nằm trong `localStorage` của trình duyệt. Không có server, không thu thập.
- Chế độ AI (nếu bật) gọi **thẳng** tới nhà cung cấp bằng API key của người dùng; key cũng chỉ lưu cục bộ. Key được nhập qua ô `password` và không gửi đi đâu khác ngoài nhà cung cấp đã chọn.
- Vì là app tĩnh client-side, không có cơ chế xác thực — phù hợp cho dữ liệu cá nhân trên thiết bị riêng, không dành cho chia sẻ máy công cộng.

---

## 13. Hướng dẫn đóng góp / chỉnh sửa

**Thêm câu thoại mới:** sửa trực tiếp mảng `scold/essential/income/praise` của nhân vật trong `messages.js` (cả `MESSAGES` và `MESSAGES_EN` nếu muốn song ngữ).

**Thêm nhân vật built-in:** thêm key mới vào `MESSAGES`/`MESSAGES_EN` và thêm id vào `MOOD_ORDER`. Nếu cần đổi đại từ, thêm mục vào `VOICE`.

**Thêm danh mục:** thêm phần tử vào `CATEGORIES` (id, label, icon, essential, color). Nhãn tiếng Anh thêm vào `CATEGORY_LABELS_EN`.

**Thêm câu khịa theo ngữ cảnh:** thêm nhóm `{kw: [...], lines: [...]}` vào `KEYWORD_ROASTS` (mm-reactions.js).

**Sau khi đổi asset:** cập nhật `ASSETS` và tăng `CACHE` trong `sw.js`.

**Lưu ý chung:** vì dùng biến toàn cục, tránh đặt tên trùng giữa các file `mm-*.js`. Giữ thứ tự nạp script khi thêm file mới.

---

## 14. Công nghệ & yêu cầu

- Trình duyệt hiện đại hỗ trợ: `localStorage`, Canvas, Web Audio API, (tùy chọn) Web Speech API, Service Worker.
- Không cần Node để chạy, nhưng nên chạy qua server tĩnh để service worker hoạt động (xem README).
- Không có dependency runtime; không có bước build.
