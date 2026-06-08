// ====== mm-core.js (tách từ app.js) ======
// =====================================================================
// Mẹ Thiên Hạ - App logic
// =====================================================================

const STORE_KEY = "meThienHa_v1";

// ---- State ----
let state = {
  salary: 0,
  budget: 0,
  soundOn: true,
  ttsOn: false,          // mẹ đọc to câu mắng
  lang: "vi",            // vi | en
  theme: "dark",        // dark | light
  onboardingDone: false,
  currency: "VND",
  customScolds: [],      // câu mắng do người dùng tự viết
  customChars: [],       // nhân vật tự tạo [{id,label,avatar,scold:[],praise:[]}]
  goal: { name: "", target: 0 },     // mục tiêu tiết kiệm
  catBudgets: {},                    // hạn mức theo danh mục { catId: số }
  recurring: [],                     // chi tiêu định kỳ [{id, name, amount, category, day, lastApplied}]
  lastSummaryMonth: "",              // tháng đã xem tổng kết (YYYY-M)
  anger: 35,                         // tâm trạng: 0 (vui) .. 100 (giận tím người)
  angerDay: "",                      // ngày cập nhật anger gần nhất (để giảm dần theo ngày)
  xp: 0,                             // điểm kinh nghiệm "đệ tử tiết kiệm"
  challenge: { weekKey: "", id: "", claimed: false }, // thử thách tuần
  mood: "mom", // mom | ex | boss | neighbor | dad
  combo: 0,        // số lần tiêu hoang liên tiếp
  maxCombo: 0,     // combo cao nhất từng đạt
  unlocked: [],    // id các huy hiệu đã mở
  ai: { enabled: false, key: "" },
  transactions: [], // { id, type, amount, note, essential, category, ts }
  ui: {
    type: "expense", // expense | income | saving
    essential: false,
    category: "food",
  },
};

// Lời mẹ phán gần nhất (để chia sẻ)
let lastReaction = { text: MESSAGES.mom.idle, tone: null, mood: "mom" };

// ---- Danh mục chi tiêu ----
const CATEGORIES = [
  { id: "food",      label: "Ăn uống",   icon: "🍜", essential: false, color: "#ff6b6b" },
  { id: "shopping",  label: "Mua sắm",   icon: "🛍️", essential: false, color: "#ff5d8f" },
  { id: "transport", label: "Đi lại",    icon: "🚗", essential: true,  color: "#4d96ff" },
  { id: "bills",     label: "Hóa đơn",   icon: "🧾", essential: true,  color: "#7c5cff" },
  { id: "fun",       label: "Giải trí",  icon: "🎮", essential: false, color: "#ffd166" },
  { id: "health",    label: "Sức khỏe",  icon: "💊", essential: true,  color: "#36d399" },
  { id: "edu",       label: "Học tập",   icon: "📚", essential: true,  color: "#22d3ee" },
  { id: "other",     label: "Khác",      icon: "📦", essential: false, color: "#9a9bc0" },
];
const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
function getCat(id) { return CAT_MAP[id] || CAT_MAP.other; }

// ---- Nhân vật: hợp nhất built-in + tự tạo ----
// Trả về object nhân vật đã chuẩn hóa (đủ scold/essential/income/praise/idle/label/avatar)
function baseMessages() {
  return state.lang === "en" ? MESSAGES_EN : MESSAGES;
}
function getMood(id) {
  const BM = baseMessages();
  if (BM[id]) return BM[id];
  const c = (state.customChars || []).find((x) => x.id === id);
  if (c) {
    const fb = BM.mom;
    return {
      label: c.label,
      avatar: c.avatar || "🧑",
      scold: c.scold && c.scold.length ? c.scold : fb.scold,
      essential: c.essential && c.essential.length ? c.essential : fb.essential,
      income: c.income && c.income.length ? c.income : fb.income,
      praise: c.praise && c.praise.length ? c.praise : fb.praise,
      idle: c.idle || `Xin chào, tôi là ${c.label}.`,
    };
  }
  return BM.mom;
}

function catLabel(id) {
  if (state.lang === "en" && typeof CATEGORY_LABELS_EN !== "undefined") return CATEGORY_LABELS_EN[id] || getCat(id).label;
  return getCat(id).label;
}

// Danh sách id nhân vật để xoay vòng (built-in + custom)
function moodList() {
  return MOOD_ORDER.concat((state.customChars || []).map((c) => c.id));
}

// ---- Đại từ theo nhân vật (đổi "con/mẹ" trong câu dùng chung) ----
const VOICE = {
  mom: null, // giữ nguyên con/mẹ
  ex: { "con": "anh", "mẹ": "em" },
  boss: { "con": "em", "mẹ": "anh" },
  neighbor: { "con": "cháu", "mẹ": "bác" },
  dad: { "con": "con", "mẹ": "bố" },
};
function replaceWord(text, word, repl) {
  const re = new RegExp("(^|[^\\p{L}])(" + word + ")(?![\\p{L}])", "giu");
  return text.replace(re, (full, pre, w) => {
    const cap = w[0] === w[0].toUpperCase();
    const r = cap ? repl.charAt(0).toUpperCase() + repl.slice(1) : repl;
    return pre + r;
  });
}
function applyVoice(text) {
  if (!text || state.lang === "en") return text;
  let map = VOICE[state.mood];
  if (state.mood && state.mood.indexOf("custom_") === 0) map = { "con": "bạn", "mẹ": "tôi" };
  if (!map) return text; // mom: giữ nguyên
  for (const w in map) text = replaceWord(text, w, map[w]);
  return text;
}

// ---- DOM ----
const $ = (id) => document.getElementById(id);
const el = {
  momAvatar: $("momAvatar"),
  momMessage: $("momMessage"),
  speechBubble: $("speechBubble"),
  balanceValue: $("balanceValue"),
  incomeValue: $("incomeValue"),
  expenseValue: $("expenseValue"),
  savingValue: $("savingValue"),
  salaryInput: $("salaryInput"),
  saveSalaryBtn: $("saveSalaryBtn"),
  salaryHint: $("salaryHint"),
  typeTabs: $("typeTabs"),
  amountInput: $("amountInput"),
  noteInput: $("noteInput"),
  essentialField: $("essentialField"),
  essentialToggle: $("essentialToggle"),
  addBtn: $("addBtn"),
  historyList: $("historyList"),
  emptyState: $("emptyState"),
  clearBtn: $("clearBtn"),
  moodBtn: $("moodBtn"),
  moodLabel: $("moodLabel"),
  toast: $("toast"),
  // Mới: hạn mức
  budgetInput: $("budgetInput"),
  saveBudgetBtn: $("saveBudgetBtn"),
  budgetProgress: $("budgetProgress"),
  budgetBarFill: $("budgetBarFill"),
  budgetStatus: $("budgetStatus"),
  // Mới: âm thanh
  soundBtn: $("soundBtn"),
  // Mới: chia sẻ
  shareBtn: $("shareBtn"),
  shareModal: $("shareModal"),
  shareClose: $("shareClose"),
  shareCanvas: $("shareCanvas"),
  shareNative: $("shareNative"),
  shareDownload: $("shareDownload"),
  shareCopy: $("shareCopy"),
  shareFb: $("shareFb"),
  shareTw: $("shareTw"),
  shareThreads: $("shareThreads"),
  // Mới: danh mục
  categoryField: $("categoryField"),
  categoryGrid: $("categoryGrid"),
  // Mới: biểu đồ
  pieChart: $("pieChart"),
  pieLegend: $("pieLegend"),
  pieEmpty: $("pieEmpty"),
  pieRange: $("pieRange"),
  barChart: $("barChart"),
  barEmpty: $("barEmpty"),
  compareStats: $("compareStats"),
  savingRateValue: $("savingRateValue"),
  savingRateFill: $("savingRateFill"),
  savingRateNote: $("savingRateNote"),
  // Mới: streak & combo
  streakValue: $("streakValue"),
  comboValue: $("comboValue"),
  comboCard: document.querySelector(".mini.combo"),
  // Mới: huy hiệu
  achGrid: $("achGrid"),
  achCount: $("achCount"),
  // Mới: AI
  aiEnabled: $("aiEnabled"),
  aiKey: $("aiKey"),
  aiSaveBtn: $("aiSaveBtn"),
  aiStatus: $("aiStatus"),
  // Mới: theme & PWA & onboarding & confetti
  themeBtn: $("themeBtn"),
  installBtn: $("installBtn"),
  onboardModal: $("onboardModal"),
  onboardEmoji: $("onboardEmoji"),
  onboardTitle: $("onboardTitle"),
  onboardText: $("onboardText"),
  onboardDots: $("onboardDots"),
  onboardSkip: $("onboardSkip"),
  onboardNext: $("onboardNext"),
  confettiCanvas: $("confettiCanvas"),
  // Mới: mục tiêu tiết kiệm
  goalName: $("goalName"),
  goalTarget: $("goalTarget"),
  saveGoalBtn: $("saveGoalBtn"),
  goalProgress: $("goalProgress"),
  goalBarFill: $("goalBarFill"),
  goalStatus: $("goalStatus"),
  // Mới: hạn mức danh mục & tiền tệ
  catBudgetBody: $("catBudgetBody"),
  currencySelect: $("currencySelect"),
  // Mới: chi tiêu định kỳ
  recName: $("recName"),
  recAmount: $("recAmount"),
  recDay: $("recDay"),
  addRecBtn: $("addRecBtn"),
  recurringList: $("recurringList"),
  // Mới: lọc & tìm kiếm
  searchInput: $("searchInput"),
  filterType: $("filterType"),
  filterCategory: $("filterCategory"),
  // Mới: sửa giao dịch
  editModal: $("editModal"),
  editClose: $("editClose"),
  editAmount: $("editAmount"),
  editNote: $("editNote"),
  editCategoryField: $("editCategoryField"),
  editCategoryGrid: $("editCategoryGrid"),
  editEssentialField: $("editEssentialField"),
  editEssentialToggle: $("editEssentialToggle"),
  editSaveBtn: $("editSaveBtn"),
  // Mới: dữ liệu & tổng kết & dự đoán
  exportBtn: $("exportBtn"),
  importBtn: $("importBtn"),
  importFile: $("importFile"),
  resetBtn: $("resetBtn"),
  prediction: $("prediction"),
  summaryBtn: $("summaryBtn"),
  summaryModal: $("summaryModal"),
  summaryClose: $("summaryClose"),
  summaryTitle: $("summaryTitle"),
  summaryCanvas: $("summaryCanvas"),
  summaryShare: $("summaryShare"),
  summaryDownload: $("summaryDownload"),
  summaryCopy: $("summaryCopy"),
  // Mới: TTS, ngôn ngữ, câu mắng & nhân vật tự tạo
  ttsBtn: $("ttsBtn"),
  langBtn: $("langBtn"),
  scoldInput: $("scoldInput"),
  addScoldBtn: $("addScoldBtn"),
  scoldList: $("scoldList"),
  charEmoji: $("charEmoji"),
  charName: $("charName"),
  charScold: $("charScold"),
  charPraise: $("charPraise"),
  addCharBtn: $("addCharBtn"),
  charList: $("charList"),
  // Mới: trang cài đặt
  settingsBtn: $("settingsBtn"),
  settingsPage: $("settingsPage"),
  settingsClose: $("settingsClose"),
  settingsNav: $("settingsNav"),
  // Mới: mood meter
  moodFace: $("moodFace"),
  moodBarFill: $("moodBarFill"),
  moodMeterLabel: $("moodMeterLabel"),
  momCard: document.querySelector(".mom-card"),
  appRoot: document.querySelector(".app"),
  // Mới: game hóa & tương tác
  argueBtn: $("argueBtn"),
  apologizeBtn: $("apologizeBtn"),
  begBtn: $("begBtn"),
  dailyBtn: $("dailyBtn"),
  levelBadge: $("levelBadge"),
  levelTitle: $("levelTitle"),
  xpFill: $("xpFill"),
  levelXp: $("levelXp"),
  challengeLabel: $("challengeLabel"),
  challengeDesc: $("challengeDesc"),
  challengeStatus: $("challengeStatus"),
  begModal: $("begModal"),
  begClose: $("begClose"),
  begItem: $("begItem"),
  begAmount: $("begAmount"),
  begAskBtn: $("begAskBtn"),
  begResult: $("begResult"),
  begLogBtn: $("begLogBtn"),
};

// Trạng thái bộ lọc & sửa
let filters = { search: "", type: "all", category: "all" };
let editing = { id: null, category: "food", essential: false };

let pieRangeMode = "month"; // month | all

const APP_URL = "https://tridpt.github.io/money-mom/";

// ---- Helpers ----
const CURRENCIES = {
  VND: { symbol: "₫", locale: "vi-VN", prefix: false },
  USD: { symbol: "$", locale: "en-US", prefix: true },
  EUR: { symbol: "€", locale: "de-DE", prefix: false },
  JPY: { symbol: "¥", locale: "ja-JP", prefix: true },
  KRW: { symbol: "₩", locale: "ko-KR", prefix: true },
  GBP: { symbol: "£", locale: "en-GB", prefix: true },
};

function curCfg() { return CURRENCIES[state.currency] || CURRENCIES.VND; }

function formatVND(n) {
  const c = curCfg();
  const num = new Intl.NumberFormat(c.locale).format(Math.round(n));
  return c.prefix ? c.symbol + num : num + c.symbol;
}

// Lấy số từ chuỗi có dấu phân cách (vd "60.000" -> 60000)
function parseAmount(str) {
  const digits = (str || "").replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

// Format input số khi gõ: 60000 -> 60.000
function formatNumberInput(value) {
  const num = parseAmount(value);
  return num ? new Intl.NumberFormat("vi-VN").format(num) : "";
}

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed, ui: { ...state.ui, ...(parsed.ui || {}) } };
      // Migration: khoản chi cũ chưa có danh mục -> "other"
      state.transactions.forEach((t) => {
        if (t.type === "expense" && !t.category) t.category = "other";
      });
    }
  } catch (e) {
    console.warn("Không đọc được dữ liệu cũ:", e);
  }
}

// ---- Âm thanh (Web Audio API, tạo trực tiếp, không cần file) ----
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  return audioCtx;
}

// Phát chuỗi nốt: notes = [{freq, start, dur, type, gain}]
function playNotes(notes) {
  if (!state.soundOn) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  const now = ctx.currentTime;
  for (const n of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = n.type || "sine";
    osc.frequency.setValueAtTime(n.freq, now + n.start);
    const peak = n.gain || 0.18;
    gain.gain.setValueAtTime(0.0001, now + n.start);
    gain.gain.exponentialRampToValueAtTime(peak, now + n.start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + n.start);
    osc.stop(now + n.start + n.dur + 0.02);
  }
}

const SOUNDS = {
  // Bị mắng: hai nốt trầm "tút tút" kiểu báo lỗi
  scold: [
    { freq: 220, start: 0, dur: 0.16, type: "square", gain: 0.12 },
    { freq: 165, start: 0.18, dur: 0.22, type: "square", gain: 0.12 },
  ],
  // Được khen: arpeggio vui tươi
  praise: [
    { freq: 523, start: 0, dur: 0.12, type: "triangle" },
    { freq: 659, start: 0.1, dur: 0.12, type: "triangle" },
    { freq: 784, start: 0.2, dur: 0.18, type: "triangle" },
  ],
  // Vượt hạn mức: còi báo động gắt
  over: [
    { freq: 880, start: 0, dur: 0.12, type: "sawtooth", gain: 0.14 },
    { freq: 660, start: 0.13, dur: 0.12, type: "sawtooth", gain: 0.14 },
    { freq: 880, start: 0.26, dur: 0.12, type: "sawtooth", gain: 0.14 },
    { freq: 660, start: 0.39, dur: 0.18, type: "sawtooth", gain: 0.14 },
  ],
};

function playSound(kind) {
  if (SOUNDS[kind]) playNotes(SOUNDS[kind]);
}

// ---- Hạn mức chi tiêu (theo tháng hiện tại) ----
function getThisMonthExpense() {
  const now = new Date();
  const m = now.getMonth(), y = now.getFullYear();
  let sum = 0;
  for (const t of state.transactions) {
    if (t.type !== "expense") continue;
    const d = new Date(t.ts);
    if (d.getMonth() === m && d.getFullYear() === y) sum += t.amount;
  }
  return sum;
}

function renderBudget() {
  if (!state.budget || state.budget <= 0) {
    el.budgetProgress.style.display = "none";
    return;
  }
  const spent = getThisMonthExpense();
  const ratio = spent / state.budget;
  const pct = Math.min(ratio * 100, 100);
  el.budgetProgress.style.display = "";
  el.budgetBarFill.style.width = pct + "%";

  el.budgetBarFill.classList.remove("warn", "over");
  el.budgetStatus.classList.remove("over");

  if (ratio >= 1) {
    el.budgetBarFill.classList.add("over");
    el.budgetStatus.classList.add("over");
    el.budgetStatus.textContent =
      `🔥 Đã tiêu ${formatVND(spent)} / ${formatVND(state.budget)} — VƯỢT HẠN MỨC ${formatVND(spent - state.budget)}!`;
  } else if (ratio >= 0.8) {
    el.budgetBarFill.classList.add("warn");
    el.budgetStatus.textContent =
      `⚠️ Đã tiêu ${formatVND(spent)} / ${formatVND(state.budget)} — sắp cháy túi rồi đó!`;
  } else {
    el.budgetStatus.textContent =
      `Đã tiêu ${formatVND(spent)} / ${formatVND(state.budget)} — còn ${formatVND(state.budget - spent)}.`;
  }
}

// ---- Render ----
function computeTotals() {
  let income = 0, expense = 0, saving = 0;
  for (const t of state.transactions) {
    if (t.type === "income") income += t.amount;
    else if (t.type === "expense") expense += t.amount;
    else if (t.type === "saving") saving += t.amount;
  }
  // Số dư trong ví = lương + thu nhập thêm - chi - tiền đã bỏ heo
  const balance = state.salary + income - expense - saving;
  return { income, expense, saving, balance };
}

function renderStats() {
  const { income, expense, saving, balance } = computeTotals();
  el.balanceValue.textContent = formatVND(balance);
  el.incomeValue.textContent = formatVND(income);
  el.expenseValue.textContent = formatVND(expense);
  el.savingValue.textContent = formatVND(saving);
  el.balanceValue.style.color = balance < 0 ? "var(--expense)" : "var(--text)";
}

const TYPE_ICON = { expense: "🛍️", income: "💰", saving: "🐷" };
const TYPE_LABEL = { expense: "Chi tiêu", income: "Thu nhập", saving: "Tiết kiệm" };

function renderHistory() {
  el.historyList.innerHTML = "";
  // Áp bộ lọc
  let list = state.transactions.filter((t) => {
    if (filters.type !== "all" && t.type !== filters.type) return false;
    if (filters.category !== "all" && (t.category || "") !== filters.category) return false;
    if (filters.search && !(t.note || "").toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  if (list.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-state";
    const hasAny = state.transactions.length > 0;
    li.textContent = hasAny ? "Không tìm thấy khoản nào khớp bộ lọc. 🔍" : "Chưa có gì cả. Hôm nay ngoan thế? 🤨";
    el.historyList.appendChild(li);
    return;
  }
  // Mới nhất lên đầu
  const sorted = list.sort((a, b) => b.ts - a.ts);
  for (const t of sorted) {
    const li = document.createElement("li");
    li.className = "history-item";
    const date = new Date(t.ts);
    const dateStr = date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) +
      " " + date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const tag = t.type === "expense" ? (t.essential ? " · Thiết yếu" : " · Không thiết yếu") : "";
    const sign = t.type === "income" ? "+" : "-";
    const cat = t.type === "expense" ? getCat(t.category) : null;
    const icon = cat ? cat.icon : TYPE_ICON[t.type];
    const metaLabel = cat ? catLabel(t.category) : TYPE_LABEL[t.type];

    li.innerHTML = `
      <span class="item-icon">${icon}</span>
      <div class="item-body">
        <div class="item-note">${escapeHtml(t.note || metaLabel)}</div>
        <div class="item-meta">${metaLabel}${tag} · ${dateStr}</div>
      </div>
      <span class="item-amount ${t.type}">${sign}${formatVND(t.amount)}</span>
      <button class="item-edit" data-id="${t.id}" title="Sửa">✏️</button>
      <button class="item-del" data-id="${t.id}" title="Xóa">✕</button>
    `;
    el.historyList.appendChild(li);
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function renderMood() {
  const m = getMood(state.mood);
  el.moodLabel.textContent = m.label;
  el.momAvatar.textContent = m.avatar;
}

function renderSalary() {
  if (state.salary > 0) {
    el.salaryInput.value = new Intl.NumberFormat("vi-VN").format(state.salary);
    el.salaryHint.textContent = `Mẹ đã ghi nhớ: lương của con là ${formatVND(state.salary)}. Liệu hồn mà tiêu.`;
  }
}
