// ====== mm-reactions.js (tách từ app.js) ======
// ---- Mom reaction ----
function speak(text, tone) {
  text = applyVoice(text);
  el.momMessage.textContent = text;
  el.momAvatar.classList.remove("shake");
  void el.momAvatar.offsetWidth; // reflow để chạy lại animation
  el.momAvatar.classList.add("shake");
  // Rung màn hình khi bị mắng lúc mẹ đang giận
  if (tone === "scold" && state.anger >= 65 && el.appRoot) {
    el.appRoot.classList.remove("screen-shake");
    void el.appRoot.offsetWidth;
    el.appRoot.classList.add("screen-shake");
    setTimeout(() => el.appRoot.classList.remove("screen-shake"), 500);
  }
  showToast(text, tone);
  speakAloud(text);
}

// Đọc to bằng giọng nói (Web Speech API)
let viVoice = null;
function pickVoice() {
  if (!("speechSynthesis" in window)) return;
  const voices = speechSynthesis.getVoices();
  viVoice = voices.find((v) => /vi[-_]?VN/i.test(v.lang) || /vietnam/i.test(v.name)) ||
            voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(state.lang)) || null;
}
if ("speechSynthesis" in window) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

function speakAloud(text) {
  if (!state.ttsOn || !("speechSynthesis" in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = state.lang === "en" ? "en-US" : "vi-VN";
    if (viVoice) u.voice = viVoice;
    u.rate = 1.05;
    u.pitch = 1.1;
    speechSynthesis.speak(u);
  } catch (e) { /* bỏ qua */ }
}

function showToast(text, tone) {
  el.toast.textContent = text;
  el.toast.className = "toast show" + (tone ? " " + tone : "");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    el.toast.className = "toast" + (tone ? " " + tone : "");
  }, 3800);
}

// ---- Phản ứng theo ngữ cảnh: khịa đúng món đồ + mức giá ----
const KEYWORD_ROASTS = [
  { kw: ["trà sữa", "tra sua", "milk tea", "bubble", "tobo", "gongcha", "phúc long", "phuc long"], lines: [
    "Lại trà sữa? {amount} cho một cốc đường, tiểu đường chưa tới mà ví cạn tới nơi rồi con.",
    "Trà sữa {amount}? Topping thì đầy mà tương lai thì rỗng con à.",
    "{note} hết {amount}. Uống vô béo người, ví thì gầy trông thấy.",
    "Một cốc {amount}? Con tưới đường vô đời mình hay tưới vô mộ cái ví vậy?",
  ]},
  { kw: ["cà phê", "ca phe", "coffee", "highlands", "starbucks", "cafe"], lines: [
    "Cà phê {amount}? Tỉnh táo để làm gì khi ví đã ngủ quên rồi con.",
    "{note} {amount}. Uống cho sang chứ tiền thì chua như cà phê không đường.",
  ]},
  { kw: ["ăn", "buffet", "lẩu", "lau", "nướng", "nuong", "nhà hàng", "nha hang", "order", "đồ ăn", "do an", "ship đồ", "ship do", "grab food", "foody"], lines: [
    "{amount} cho một bữa {note}? No cái bụng, đói cái ví con ạ.",
    "Ăn uống {amount}? Miệng sướng vài phút, ví khóc cả tháng.",
    "{note} hết {amount} luôn? Con ăn tiền chứ ăn gì nữa đây.",
  ]},
  { kw: ["quần áo", "quan ao", "áo", "váy", "vay", "giày", "giay", "dép", "sneaker", "shopee", "lazada", "sale", "đồ", "shopping"], lines: [
    "{note} {amount}? Tủ đồ thì đầy mà tài khoản thì trống huơ trống hoác.",
    "Lại sale à? {amount} cho {note}. 'Tiết kiệm' kiểu mua nhiều để dành tiền ship hả con?",
    "Mua {note} {amount}? Mặc đẹp đi đâu khi cuối tháng phải trốn nợ con.",
  ]},
  { kw: ["son", "mỹ phẩm", "my pham", "skincare", "nước hoa", "nuoc hoa", "kem", "makeup", "make up"], lines: [
    "{note} {amount}? Mặt thì xinh mà ví thì xanh xao con à.",
    "Làm đẹp {amount}? Đẹp để ai ngắm khi con suốt ngày ở nhà tránh chủ nợ.",
  ]},
  { kw: ["game", "nạp", "nap", "skin", "gacha", "liên quân", "lien quan", "steam", "genshin", "roll", "esim", "valorant"], lines: [
    "Nạp game {amount}?! Skin đẹp mà đời thì chưa pass màn 'nghèo' đâu con.",
    "{amount} cho {note}? Nhân vật trong game lên đồ, còn con thì lên... nợ.",
    "Tiêu {amount} vào game? Thắng game thua đời, đáng không con?",
  ]},
  { kw: ["iphone", "điện thoại", "dien thoai", "laptop", "tai nghe", "ipad", "macbook", "airpod", "samsung", "tech", "máy", "may"], lines: [
    "{note} {amount}?! Đồ thì xịn mà chủ nó thì sắp ăn mì gói cả tháng.",
    "Mua {note} hết {amount}? Sống ảo sang chảnh, sống thật thì... thôi mẹ không nói.",
  ]},
  { kw: ["grab", "taxi", "xăng", "xang", "be", "gojek", "xe", "vé xe", "ship"], lines: [
    "{amount} tiền {note}? Đi cho nhanh để về nhà ngồi tiếc tiền hả con.",
    "Tiền xe {amount}? Đi bộ vài bước có chết đâu mà con sang vậy.",
  ]},
  { kw: ["bar", "rượu", "ruou", "bia", "nhậu", "nhau", "pub", "club", "cocktail", "beer"], lines: [
    "{note} {amount}?! Uống cho vui rồi mai tỉnh dậy ví trống, đầu đau, đời buồn.",
    "Nhậu {amount}? Men say vài tiếng, nợ tỉnh cả tháng con à.",
  ]},
  { kw: ["thuốc lá", "thuoc la", "vape", "pod"], lines: [
    "{amount} cho {note}? Đốt tiền theo đúng nghĩa đen luôn con.",
  ]},
  { kw: ["quà", "qua", "crush", "người yêu", "nguoi yeu", "hoa", "gấu", "gau", "bạn gái", "bạn trai"], lines: [
    "{amount} mua {note} cho người ta? Lỡ chia tay thì đòi lại được không con?",
    "Tặng quà {amount}? Tình thì chưa chắc bền, nợ thì chắc chắn ở lại.",
  ]},
  { kw: ["phim", "vé", "ve", "concert", "vé phim", "rạp", "rap", "du lịch", "du lich", "khách sạn", "khach san", "vé máy bay"], lines: [
    "{note} {amount}? Giải trí cho đã rồi về cày trả nợ nha con.",
    "Đi chơi {amount}? Sống cho hiện tại, còn tương lai để mẹ lo chắc?",
  ]},
  { kw: ["mèo", "meo", "chó", "cho ", "thú cưng", "thu cung", "boss", "cám", "cat", "dog"], lines: [
    "{amount} nuôi {note}? Boss sống sang hơn cả sen luôn con nhỉ.",
  ]},
];

// So sánh giá với món ăn bình dân / vàng (chỉ cho VND)
function priceQuip(amount) {
  if (state.currency !== "VND") return null;
  const units = [
    { n: 80000000, name: "cây vàng" },
    { n: 8000000, name: "chỉ vàng" },
    { n: 45000, name: "tô phở" },
    { n: 30000, name: "bữa cơm bụi" },
    { n: 25000, name: "ổ bánh mì" },
    { n: 15000, name: "gói mì tôm" },
  ];
  const candidates = units.filter((u) => amount >= u.n * 2);
  if (!candidates.length) return null;
  // ưu tiên đơn vị lớn nhất phù hợp để con số không quá khủng
  const u = candidates[0];
  const c = Math.round(amount / u.n);
  const tmpl = [
    `Số tiền này bằng ${c} ${u.name} đấy con!`,
    `${formatVND(amount)} = ${c} ${u.name}. Con tự cân nhắc đi.`,
    `Bằng đúng ${c} ${u.name} luôn á, mẹ xót dùm cái ví.`,
  ];
  return tmpl[Math.floor(Math.random() * tmpl.length)];
}

// Câu khịa theo bậc giá (khi không khớp từ khóa)
const PRICE_TIERS = [
  { min: 1000000000, lines: [
    "{amount} cho {note}?! Con trúng số hay đi cướp ngân hàng vậy con?!",
    "{note} mà {amount}?! Cả họ nhà mình gom lại chưa chắc có từng đó đâu con!",
  ]},
  { min: 100000000, lines: [
    "{amount} cho {note}?! Cả đời mẹ chưa cầm số tiền đó một lúc bao giờ!",
    "{note} hết {amount}?! Con tiêu tiền hay tiêu hết tương lai vậy?",
  ]},
  { min: 10000000, lines: [
    "{amount} cho {note}?! Con tưởng tiền là lá khô hả con ơi?",
    "{note} {amount} luôn á?! Mẹ làm cả năm mới dành được từng đó đó!",
  ]},
  { min: 2000000, lines: [
    "{amount} cho {note}?! Con mua đứt cả tháng tiền ăn của nhà mình rồi đấy!",
    "{note} mà {amount}?! Đại gia phố núi đây rồi, lạy ngài.",
  ]},
  { min: 500000, lines: [
    "{amount} cho {note}? Sang dữ ha. Tiền nhiều không tiêu được hết à con?",
    "{note} hết {amount} lận? Mẹ làm mấy ngày mới ra từng đó đó con.",
  ]},
  { min: 150000, lines: [
    "{note} {amount}? Đắt xắt ra... nợ con à.",
    "{amount} cho {note}? Cũng chua đấy, liệu cơm gắp mắm đi con.",
  ]},
  { min: 0, lines: [
    "{note} {amount}. Ít thôi nhưng góp gió thành bão nợ đó con.",
    "{amount} cho {note}? Lẻ tẻ vậy mà cuối tháng cộng lại giật mình đấy.",
  ]},
];

function priceTierLine(transaction, vars) {
  for (const t of PRICE_TIERS) {
    if (transaction.amount >= t.min) return pickMessage(t.lines, vars);
  }
  return pickMessage(PRICE_TIERS[PRICE_TIERS.length - 1].lines, vars);
}

// Dựng câu mắng theo ngữ cảnh món đồ + giá
function buildContextualScold(transaction, vars) {
  if (state.lang === "en") return null; // tạm thời chỉ tiếng Việt
  const note = (transaction.note || "").toLowerCase();
  let line = null;
  // 1. Khớp từ khóa món đồ
  if (note) {
    for (const g of KEYWORD_ROASTS) {
      if (g.kw.some((k) => note.includes(k))) { line = pickMessage(g.lines, vars); break; }
    }
  }
  // 2. Không khớp -> khịa theo bậc giá (nếu có ghi chú)
  if (!line && note) line = priceTierLine(transaction, vars);
  if (!line) return null;
  // 3. Đôi khi thêm câu so sánh giá cho đau
  const quip = priceQuip(transaction.amount);
  if (quip && Math.random() < 0.55) line += " " + quip;
  return applyVoice(line);
}

// Khịa khoản THIẾT YẾU khi số tiền vô lý so với danh mục
const BIG_ESSENTIAL = {
  transport: { min: 1500000, lines: [
    "Đi lại gì mà {amount}? Con thuê nguyên hãng taxi à con?!",
    "{amount} tiền đi lại?! Hay mua luôn cái xe cho rồi con!",
  ]},
  bills: { min: 4000000, lines: [
    "Hóa đơn {amount}?! Con cắm điện nuôi trại đào bitcoin hả?",
    "{amount} tiền hóa đơn?! Cả tòa nhà xài chung à con?",
  ]},
  edu: { min: 30000000, lines: [
    "Học phí {amount}?! Học làm tiến sĩ hay mua luôn cái trường vậy con?",
    "{amount} cho học tập?! Tri thức vô giá nhưng cái giá này thì... mẹ tái mặt.",
  ]},
  health: { min: 15000000, lines: [
    "{amount} tiền sức khỏe?! Con thay nguyên bộ nội tạng à?",
    "Sức khỏe {amount}?! Quý thật nhưng nghe xong mẹ cần đi khám tim.",
  ]},
  bills_generic: { min: 5000000, lines: [
    "{amount} cho khoản 'thiết yếu' này?! Thiết yếu gì mà bằng cả gia tài vậy con?",
    "Thiết yếu mà {amount} lận?! Con chắc cái này 'cần' chứ không phải 'thèm' chứ?",
  ]},
};

function bigEssentialRoast(transaction, vars) {
  const amt = transaction.amount;
  const cat = transaction.category;
  const conf = BIG_ESSENTIAL[cat];
  if (conf && amt >= conf.min) {
    let line = pickMessage(conf.lines, vars);
    if (amt >= 100000000) line += " Mà {amount} thì... con in tiền hả con?!".replace("{amount}", vars.amount);
    return applyVoice(line);
  }
  // Không thuộc danh mục trên nhưng số tiền quá lớn cho một khoản thiết yếu
  if (amt >= BIG_ESSENTIAL.bills_generic.min) {
    let line = pickMessage(BIG_ESSENTIAL.bills_generic.lines, vars);
    const quip = priceQuip(amt);
    if (quip && Math.random() < 0.6) line += " " + quip;
    return applyVoice(line);
  }
  return null;
}

// Phản ứng thu nhập / tiết kiệm theo bậc tiền (VND)
const SAVING_TIERS = [
  { min: 50000000, lines: [
    "Bỏ heo {amount}?! Con của mẹ giàu thật rồi! Mẹ tự hào muốn rơi nước mắt!",
    "{amount} vô heo đất luôn á?! Mẹ phải khoe khắp họ mới được!",
    "Trời ơi {amount}! Cứ đà này mẹ về hưu sớm nhờ con được rồi!",
  ]},
  { min: 5000000, lines: [
    "Bỏ ống {amount}? Khá lắm con! Cứ thế này là mua được nhà đấy.",
    "{amount} tiết kiệm cơ à? Mẹ bắt đầu tin tưởng con thật rồi nha.",
    "Giỏi! {amount} đâu phải con số nhỏ, mẹ ghi nhận công lao.",
  ]},
  { min: 500000, lines: [
    "Bỏ heo {amount}? Cũng được đấy, biết lo xa rồi con.",
    "{amount} à? Tạm ổn, cố thêm chút nữa nha con.",
  ]},
  { min: 50000, lines: [
    "Bỏ ống {amount}? Ờ... có còn hơn không.",
    "{amount} thôi à? Thôi cũng tính là cố gắng.",
  ]},
  { min: 0, lines: [
    "Bỏ heo {amount}? Lẻ tẻ quá mẹ chả buồn khen con à.",
    "{amount} mà cũng bỏ ống? Thôi, kiến tha lâu đầy tổ.",
  ]},
];

const INCOME_TIERS = [
  { min: 50000000, lines: [
    "{amount}?! Con trúng số hay được thừa kế gì thế con?!",
    "Ối giời ơi {amount}! Con giấu mẹ làm ăn gì mà đỉnh vậy?!",
    "{amount} một lúc?! Mẹ chóng mặt vì tự hào luôn nè!",
  ]},
  { min: 5000000, lines: [
    "{amount} hả? Khá đấy con, làm ăn được rồi đó.",
    "Thu {amount}? Mẹ yên tâm phần nào, nhớ giữ cho kỹ nha.",
  ]},
  { min: 500000, lines: [
    "Có {amount} về à? Cũng tốt, góp gió thành bão con.",
    "{amount}? Được đấy, đừng tiêu liền là mẹ mừng.",
  ]},
  { min: 50000, lines: [
    "{amount} thôi à? Ờ, kiếm được đồng nào hay đồng nấy.",
    "Có mấy đồng {amount} cũng ghi à? Thôi cũng siêng.",
  ]},
  { min: 0, lines: [
    "{amount}? Lẻ tẻ vậy cũng khai, mẹ ghi cho vui thôi nha.",
    "Thu {amount}? Mẹ còn chả buồn ngẩng đầu lên con à.",
  ]},
];

function pickByAmount(tiers, amount, vars) {
  for (const t of tiers) { if (amount >= t.min) return pickMessage(t.lines, vars); }
  return pickMessage(tiers[tiers.length - 1].lines, vars);
}

// ---- Tâm trạng nhân vật (anger 0..100) ----
const ANGER_FACES = [
  { max: 15, face: "🥰", label: "Hài lòng lắm", color: "linear-gradient(90deg,#36d399,#2bbf86)" },
  { max: 35, face: "🙂", label: "Vui vẻ", color: "linear-gradient(90deg,#7ddc9f,#36d399)" },
  { max: 55, face: "😐", label: "Bình thường", color: "linear-gradient(90deg,#ffd166,#f5a623)" },
  { max: 75, face: "😤", label: "Khó chịu rồi đấy", color: "linear-gradient(90deg,#ff9f43,#ff6b6b)" },
  { max: 101, face: "😡", label: "Giận tím người!", color: "linear-gradient(90deg,#ff6b6b,#c0392b)" },
];
const ANGER_LABELS_EN = ["Very pleased", "Happy", "Neutral", "Getting annoyed", "Furious!"];

function angerInfo() {
  const a = state.anger;
  for (let i = 0; i < ANGER_FACES.length; i++) {
    if (a <= ANGER_FACES[i].max) {
      const info = ANGER_FACES[i];
      return { face: info.face, label: state.lang === "en" ? ANGER_LABELS_EN[i] : info.label, color: info.color };
    }
  }
  return ANGER_FACES[2];
}

function renderMoodMeter(bump) {
  const info = angerInfo();
  el.moodFace.textContent = info.face;
  el.moodBarFill.style.width = state.anger + "%";
  el.moodBarFill.style.background = info.color;
  el.moodMeterLabel.textContent = (state.lang === "en" ? "Mood: " : "Tâm trạng: ") + info.label;
  if (el.momCard) el.momCard.classList.toggle("angry", state.anger >= 70);
  if (bump) {
    el.moodFace.classList.remove("bump");
    void el.moodFace.offsetWidth;
    el.moodFace.classList.add("bump");
  }
}

function adjustAnger(delta) {
  state.anger = Math.max(0, Math.min(100, Math.round(state.anger + delta)));
  state.angerDay = new Date().toDateString();
  save();
  renderMoodMeter(true);
}

function decayAngerOnLoad() {
  const today = new Date().toDateString();
  if (state.angerDay && state.angerDay !== today) {
    // mỗi ngày không gặp, mẹ nguôi dần về mức 35
    const last = new Date(state.angerDay);
    const days = Math.max(1, Math.round((Date.now() - last.getTime()) / 86400000));
    const target = 35;
    if (state.anger > target) state.anger = Math.max(target, state.anger - days * 10);
    else state.anger = Math.min(target, state.anger + days * 6);
  }
  state.angerDay = today;
}

function angerDelta(t) {
  if (t.type === "saving") return t.amount >= 5000000 ? -30 : t.amount >= 500000 ? -18 : -8;
  if (t.type === "income") return -6;
  if (t.type === "expense") {
    if (t.essential) return t.amount >= 5000000 ? 12 : 2;
    let d = t.amount >= 10000000 ? 28 : t.amount >= 2000000 ? 20 : t.amount >= 500000 ? 12 : t.amount >= 100000 ? 7 : 4;
    d += Math.min(state.combo * 2, 16);
    return d;
  }
  return 0;
}

// ---- Mẹ "nhớ dai": nhắc chuyện cũ ----
function sameDate(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function isYesterday(d, ref) {
  const y = new Date(ref); y.setDate(y.getDate() - 1);
  return sameDate(d, y);
}
function memoryCallback(t) {
  if (t.type !== "expense" || t.essential || state.lang === "en") return null;
  const today = new Date(t.ts);
  let todayCount = 0, yesterdayCount = 0, weekCount = 0;
  for (const x of state.transactions) {
    if (x.id === t.id || x.type !== "expense" || x.essential) continue;
    if ((x.category || "") !== (t.category || "")) continue;
    const d = new Date(x.ts);
    if (sameDate(d, today)) todayCount++;
    else if (isYesterday(d, today)) yesterdayCount++;
    if (today.getTime() - x.ts <= 7 * 86400000) weekCount++;
  }
  const label = (getCat(t.category).label || "khoản này").toLowerCase();
  if (todayCount >= 2) return `Lại ${label}?! Hôm nay con tiêu cho ${label} ${todayCount + 1} lần rồi đấy, nghiện hả con?`;
  if (todayCount >= 1) return `Hôm nay ${label} lần nữa à? Bộ ${label} là chân ái của con hả?`;
  if (yesterdayCount >= 1) return `Hôm qua ${label} rồi, nay lại ${label} nữa à con?`;
  if (weekCount >= 3) return `Tuần này ${label} tới ${weekCount + 1} lần rồi đó, con tự đếm đi.`;
  return null;
}

// ---- Phản ứng theo giờ / thời điểm ----
function timeQuip(t) {
  if (state.lang === "en") return null;
  const d = new Date(t.ts);
  const h = d.getHours();
  const day = d.getDate();
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const pool = [];
  if (h >= 0 && h < 5) pool.push(`Giờ này (${h} giờ sáng) không ngủ còn online tiêu tiền hả con?`);
  else if (h >= 22) pool.push("Khuya rồi còn tiêu, mất ngủ vì xót tiền cho coi.");
  if (day >= daysInMonth - 3) pool.push("Cuối tháng rồi mà còn vung tay thế con?");
  else if (day <= 3) pool.push("Đầu tháng đã tiêu mạnh, cuối tháng cạp đất à con?");
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function reactTo(transaction) {
  const m = getMood(state.mood);
  const vars = { amount: formatVND(transaction.amount), note: transaction.note };
  let text, tone, sound;

  if (transaction.type === "saving") {
    text = state.lang === "en" ? pickMessage(m.praise, vars) : applyVoice(pickByAmount(SAVING_TIERS, transaction.amount, vars));
    const big = transaction.amount >= 500000;
    tone = big ? "praise" : null;
    sound = big ? "praise" : null;
  } else if (transaction.type === "income") {
    text = state.lang === "en" ? pickMessage(m.income, vars) : applyVoice(pickByAmount(INCOME_TIERS, transaction.amount, vars));
    const big = transaction.amount >= 500000;
    tone = big ? "praise" : null;
    sound = big ? "praise" : null;
  } else {
    // expense
    if (transaction.essential) {
      const bigRoast = state.lang === "en" ? null : bigEssentialRoast(transaction, vars);
      if (bigRoast) {
        text = bigRoast;
        tone = "scold";
        sound = "over";
      } else {
        text = pickMessage(m.essential, vars);
        tone = null;
        sound = null;
      }
    } else {
      // Ưu tiên câu khịa theo ngữ cảnh món đồ + giá; xen kẽ câu nhân vật/tự viết
      const contextual = buildContextualScold(transaction, vars);
      const pool = m.scold.concat(state.customScolds || []);
      if (contextual && Math.random() < 0.8) {
        text = contextual;
      } else {
        text = pickMessage(pool, vars);
      }
      // Mẹ nhớ dai + phản ứng theo giờ
      const extras = [];
      const mem = memoryCallback(transaction); if (mem) extras.push(mem);
      const tq = timeQuip(transaction); if (tq) extras.push(tq);
      if (extras.length && Math.random() < 0.7) {
        text += " " + extras[Math.floor(Math.random() * extras.length)];
      }
      tone = "scold";
      sound = "scold";
    }
    // Kiểm tra vượt hạn mức -> mẹ nổi điên thêm
    if (state.budget > 0) {
      const spent = getThisMonthExpense(); // đã gồm khoản vừa thêm
      if (spent > state.budget) {
        text += " " + applyVoice(OVER_BUDGET_LINE());
        tone = "scold";
        sound = "over";
      }
    }
    // Combo tiêu hoang liên tiếp -> câu leo thang
    if (!transaction.essential) {
      const cl = comboLine(state.combo);
      if (cl) {
        text += " " + applyVoice(cl);
        tone = "scold";
        sound = "over";
      }
    }
    // Vượt hạn mức riêng của danh mục
    const cb = state.catBudgets[transaction.category];
    if (cb > 0 && catMonthSpent(transaction.category, new Date()) > cb) {
      text += ` Riêng khoản ${getCat(transaction.category).label} cũng vượt hạn mức tháng này rồi đấy!`;
      tone = "scold";
      sound = "over";
    }
  }

  lastReaction = { text, tone, mood: state.mood };
  speak(text, tone);
  if (sound) playSound(sound);

  // Hiện nút "Cãi lại" sau khi bị mắng
  if (el.argueBtn) {
    if (tone === "scold") { el.argueBtn.style.display = ""; banterRound = 0; }
    else { el.argueBtn.style.display = "none"; }
  }

  // Nếu bật AI: thử sinh câu mắng riêng (bất đồng bộ, thay thế khi có)
  if (state.ai.enabled && state.ai.key && transaction.type === "expense" && !transaction.essential) {
    generateAIScold(transaction, tone);
  }
}

const OVER_BUDGET_LINES = [
  "VÀ CON VƯỢT HẠN MỨC THÁNG NÀY RỒI ĐẤY! Mẹ tức á!",
  "Hạn mức cháy rồi nha, giờ thì cạp đất thật chứ không đùa!",
  "Đã bảo bao nhiêu lần rồi, tiêu quá ngân sách rồi con ơi!",
  "Mẹ đặt hạn mức cho có lệ thôi à? Vượt rồi kìa!",
];
function OVER_BUDGET_LINE() {
  const arr = state.lang === "en" ? OVER_BUDGET_LINES_EN : OVER_BUDGET_LINES;
  return arr[Math.floor(Math.random() * arr.length)];
}
