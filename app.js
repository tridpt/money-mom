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

// ---- Mom reaction ----
function speak(text, tone) {
  el.momMessage.textContent = text;
  el.momAvatar.classList.remove("shake");
  void el.momAvatar.offsetWidth; // reflow để chạy lại animation
  el.momAvatar.classList.add("shake");
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

function reactTo(transaction) {
  const m = getMood(state.mood);
  const vars = { amount: formatVND(transaction.amount), note: transaction.note };
  let text, tone, sound;

  if (transaction.type === "saving") {
    text = pickMessage(m.praise, vars);
    tone = "praise";
    sound = "praise";
  } else if (transaction.type === "income") {
    text = pickMessage(m.income, vars);
    tone = "praise";
    sound = "praise";
  } else {
    // expense
    if (transaction.essential) {
      text = pickMessage(m.essential, vars);
      tone = null;
      sound = null;
    } else {
      text = pickMessage(m.scold.concat(state.customScolds || []), vars);
      tone = "scold";
      sound = "scold";
    }
    // Kiểm tra vượt hạn mức -> mẹ nổi điên thêm
    if (state.budget > 0) {
      const spent = getThisMonthExpense(); // đã gồm khoản vừa thêm
      if (spent > state.budget) {
        text += " " + OVER_BUDGET_LINE();
        tone = "scold";
        sound = "over";
      }
    }
    // Combo tiêu hoang liên tiếp -> câu leo thang
    if (!transaction.essential) {
      const cl = comboLine(state.combo);
      if (cl) {
        text += " " + cl;
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

// ---- Actions ----
function addTransaction() {
  const amount = parseAmount(el.amountInput.value);
  const note = el.noteInput.value.trim();

  if (amount <= 0) {
    speak("Số tiền đâu? Con định lừa mẹ à? Nhập số tiền đi.", "scold");
    el.amountInput.focus();
    return;
  }

  const t = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type: state.ui.type,
    amount,
    note,
    essential: state.ui.type === "expense" ? state.ui.essential : false,
    category: state.ui.type === "expense" ? state.ui.category : null,
    ts: Date.now(),
  };

  state.transactions.push(t);

  // Cập nhật combo tiêu hoang
  if (t.type === "expense" && !t.essential) {
    state.combo += 1;
    if (state.combo > state.maxCombo) state.maxCombo = state.combo;
  } else {
    state.combo = 0; // tiết kiệm/thu nhập/chi thiết yếu -> chuộc lỗi
  }

  save();
  renderStats();
  renderHistory();
  renderBudget();
  renderAnalytics();
  renderStreakCombo();
  renderGoal();
  renderCatBudgets();
  reactTo(t);
  checkAchievements();

  // Đạt mục tiêu tiết kiệm -> ăn mừng
  if (t.type === "saving" && state.goal.target > 0) {
    const saved = getTotalSaving();
    if (saved >= state.goal.target && saved - t.amount < state.goal.target) {
      setTimeout(() => {
        showToast(`🎉 Đạt mục tiêu "${state.goal.name || "tiết kiệm"}"! Quá giỏi luôn con!`, "praise");
        playSound("praise");
        fireConfetti();
      }, 800);
    }
  }

  // Reset form
  el.amountInput.value = "";
  el.noteInput.value = "";
  el.amountInput.focus();
}

function deleteTransaction(id) {
  state.transactions = state.transactions.filter((t) => t.id !== id);
  save();
  renderStats();
  renderHistory();
  renderBudget();
  renderAnalytics();
  renderStreakCombo();
  renderGoal();
  renderCatBudgets();
}

function clearAll() {
  if (state.transactions.length === 0) return;
  if (!confirm("Xóa hết sổ chi tiêu? Mẹ sẽ quên hết tội của con đấy.")) return;
  state.transactions = [];
  state.combo = 0;
  save();
  renderStats();
  renderHistory();
  renderBudget();
  renderAnalytics();
  renderStreakCombo();
  renderGoal();
  renderCatBudgets();
  speak("Xóa sạch rồi. Coi như mẹ tha cho con lần này. Làm lại từ đầu nha.", "praise");
}

function renderCategoryGrid() {
  el.categoryGrid.innerHTML = "";
  for (const c of CATEGORIES) {
    const btn = document.createElement("button");
    btn.className = "cat-btn" + (c.id === state.ui.category ? " active" : "");
    btn.dataset.cat = c.id;
    btn.innerHTML = `<span class="cat-emoji">${c.icon}</span>${catLabel(c.id)}`;
    el.categoryGrid.appendChild(btn);
  }
}

function setCategory(id) {
  state.ui.category = id;
  document.querySelectorAll(".cat-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.cat === id);
  });
  // Tự đặt mức thiết yếu theo danh mục (vẫn cho phép chỉnh tay sau đó)
  setEssential(getCat(id).essential);
  save();
}

function setType(type) {
  state.ui.type = type;
  document.querySelectorAll(".type-tab").forEach((b) => {
    b.classList.toggle("active", b.dataset.type === type);
  });
  // Chỉ hiện toggle thiết yếu khi là chi tiêu
  el.essentialField.style.display = type === "expense" ? "" : "none";
  el.categoryField.style.display = type === "expense" ? "" : "none";
  // Đổi placeholder gợi ý
  const hints = {
    expense: "VD: Mua cốc trà sữa",
    income: "VD: Lương thưởng, freelance",
    saving: "VD: Bỏ ống heo cuối tháng",
  };
  el.noteInput.placeholder = hints[type];
  save();
}

function setEssential(val) {
  state.ui.essential = val;
  document.querySelectorAll(".ess-btn").forEach((b) => {
    b.classList.toggle("active", (b.dataset.essential === "true") === val);
  });
  save();
}

function toggleMood() {
  const list = moodList();
  const idx = list.indexOf(state.mood);
  state.mood = list[(idx + 1) % list.length];
  save();
  renderMood();
  const m = getMood(state.mood);
  lastReaction = { text: m.idle, tone: null, mood: state.mood };
  speak(m.idle, null);
}

// ---- Chia sẻ "thành tích bị mắng" ----
function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawShareCard() {
  const canvas = el.shareCanvas;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const m = getMood(lastReaction.mood) || MESSAGES.mom;

  // Nền gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#2a1c4a");
  grad.addColorStop(0.5, "#1c1d33");
  grad.addColorStop(1, "#3a1330");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Viền
  ctx.strokeStyle = lastReaction.tone === "praise" ? "#36d399" : "#ff5d8f";
  ctx.lineWidth = 10;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  // Avatar emoji
  ctx.textAlign = "center";
  ctx.font = "150px serif";
  ctx.fillText(m.avatar, W / 2, 230);

  // Tên tính cách
  ctx.fillStyle = "#9a9bc0";
  ctx.font = "600 36px 'Be Vietnam Pro', sans-serif";
  ctx.fillText(m.label, W / 2, 300);

  // Dấu ngoặc kép
  ctx.fillStyle = lastReaction.tone === "praise" ? "#36d399" : "#ff5d8f";
  ctx.font = "800 140px Georgia, serif";
  ctx.fillText("\u201C", W / 2, 430);

  // Câu phán (wrap)
  ctx.fillStyle = "#ecedf7";
  ctx.font = "700 52px 'Be Vietnam Pro', sans-serif";
  const lines = wrapText(ctx, lastReaction.text, W - 160);
  let y = 540;
  const lineH = 70;
  for (const ln of lines.slice(0, 6)) {
    ctx.fillText(ln, W / 2, y);
    y += lineH;
  }

  // Branding dưới cùng
  ctx.fillStyle = "#ff5d8f";
  ctx.font = "800 46px 'Be Vietnam Pro', sans-serif";
  ctx.fillText("👩‍🦰 Mẹ Thiên Hạ", W / 2, H - 130);
  ctx.fillStyle = "#9a9bc0";
  ctx.font = "500 32px 'Be Vietnam Pro', sans-serif";
  ctx.fillText("Quản lý tài chính kiểu bị mắng mới chịu tiết kiệm", W / 2, H - 80);
  ctx.fillText("tridpt.github.io/money-mom", W / 2, H - 40);
}

function getCaption() {
  return `"${lastReaction.text}"\n\n— ${getMood(lastReaction.mood).label} phán 😤\nQuản lý tài chính kiểu bị mắng mới chịu tiết kiệm 💸\nThử đi: ${APP_URL}`;
}

function canvasToBlob() {
  return new Promise((resolve) => el.shareCanvas.toBlob(resolve, "image/png"));
}

function openShareModal() {
  drawShareCard();
  // Cập nhật link mạng xã hội
  const caption = getCaption();
  const encUrl = encodeURIComponent(APP_URL);
  const encText = encodeURIComponent(`"${lastReaction.text}" — Mẹ Thiên Hạ phán. Thử đi:`);
  el.shareFb.href = `https://www.facebook.com/sharer/sharer.php?u=${encUrl}&quote=${encText}`;
  el.shareTw.href = `https://twitter.com/intent/tweet?text=${encText}&url=${encUrl}`;
  el.shareThreads.href = `https://www.threads.net/intent/post?text=${encodeURIComponent(caption)}`;
  el.shareModal.classList.add("show");
}

function closeShareModal() {
  el.shareModal.classList.remove("show");
}

async function shareNative() {
  const caption = getCaption();
  try {
    const blob = await canvasToBlob();
    const file = new File([blob], "me-thien-ha.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text: caption, title: "Mẹ Thiên Hạ phán" });
      return;
    }
    if (navigator.share) {
      await navigator.share({ text: caption, url: APP_URL, title: "Mẹ Thiên Hạ phán" });
      return;
    }
    // Không hỗ trợ -> tải ảnh
    downloadImage();
  } catch (e) {
    // người dùng hủy hoặc lỗi -> bỏ qua
    console.warn("Share bị hủy/không hỗ trợ:", e);
  }
}

async function downloadImage() {
  const blob = await canvasToBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "me-thien-ha.png";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyCaption() {
  const caption = getCaption();
  try {
    await navigator.clipboard.writeText(caption);
    el.shareCopy.textContent = "✅ Đã copy!";
    setTimeout(() => (el.shareCopy.textContent = "📋 Copy caption"), 1800);
  } catch (e) {
    alert("Không copy được. Caption:\n\n" + caption);
  }
}

function saveSalary() {
  const val = parseAmount(el.salaryInput.value);
  state.salary = val;
  save();
  renderSalary();
  renderStats();
  if (val > 0) {
    speak(`Lương ${formatVND(val)} hả? Mẹ ghi sổ rồi. Đừng có tiêu quá tay nha con.`, null);
  }
}

function saveBudget() {
  const val = parseAmount(el.budgetInput.value);
  state.budget = val;
  save();
  renderBudget();
  if (val > 0) {
    el.budgetInput.value = new Intl.NumberFormat("vi-VN").format(val);
    speak(`Hạn mức ${formatVND(val)} tháng này. Vượt một đồng là mẹ biết liền đó!`, null);
  }
}

function toggleSound() {
  state.soundOn = !state.soundOn;
  save();
  el.soundBtn.textContent = state.soundOn ? "🔊" : "🔇";
  el.soundBtn.classList.toggle("muted", !state.soundOn);
  if (state.soundOn) playSound("praise");
}

// ---- Biểu đồ & phân tích ----
function formatShort(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + " tỷ";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + " tr";
  if (n >= 1e3) return Math.round(n / 1e3) + "k";
  return String(Math.round(n));
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function monthSum(type, y, m) {
  let s = 0;
  for (const t of state.transactions) {
    if (t.type !== type) continue;
    const d = new Date(t.ts);
    if (d.getFullYear() === y && d.getMonth() === m) s += t.amount;
  }
  return s;
}

function drawPie(canvas, segments) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total <= 0) return;
  const cx = W / 2, cy = H / 2;
  const r = Math.min(W, H) / 2 - 8;
  const rInner = r * 0.58;
  let start = -Math.PI / 2;
  for (const seg of segments) {
    const angle = (seg.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    start += angle;
  }
  // Lỗ giữa (donut)
  ctx.beginPath();
  ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--card").trim() || "#1c1d33";
  ctx.fill();
  // Chữ giữa
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text").trim() || "#ecedf7";
  ctx.textAlign = "center";
  ctx.font = "700 30px 'Be Vietnam Pro', sans-serif";
  ctx.fillText(formatShort(total), cx, cy + 4);
  ctx.fillStyle = "#9a9bc0";
  ctx.font = "500 16px 'Be Vietnam Pro', sans-serif";
  ctx.fillText("Tổng chi", cx, cy + 30);
}

function drawBar(canvas, items) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const padL = 14, padR = 14, padTop = 28, padBottom = 36;
  const chartW = W - padL - padR;
  const chartH = H - padTop - padBottom;
  const max = Math.max(...items.map((i) => i.value), 1);
  const n = items.length;
  const slot = chartW / n;
  const barW = Math.min(slot * 0.55, 70);
  items.forEach((it, i) => {
    const x = padL + i * slot + (slot - barW) / 2;
    const h = (it.value / max) * chartH;
    const y = padTop + chartH - h;
    if (it.value > 0) {
      const grad = ctx.createLinearGradient(0, y, 0, y + h);
      grad.addColorStop(0, "#7c5cff");
      grad.addColorStop(1, "#ff5d8f");
      ctx.fillStyle = grad;
      roundRect(ctx, x, y, barW, Math.max(h, 2), 6);
      ctx.fill();
      ctx.fillStyle = "#ecedf7";
      ctx.font = "600 15px 'Be Vietnam Pro', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(formatShort(it.value), x + barW / 2, y - 8);
    }
    ctx.fillStyle = "#9a9bc0";
    ctx.font = "500 15px 'Be Vietnam Pro', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(it.label, x + barW / 2, H - 12);
  });
}

function renderPie() {
  const now = new Date();
  const cm = now.getMonth(), cy = now.getFullYear();
  const totals = {};
  for (const t of state.transactions) {
    if (t.type !== "expense") continue;
    if (pieRangeMode === "month") {
      const d = new Date(t.ts);
      if (d.getMonth() !== cm || d.getFullYear() !== cy) continue;
    }
    const cid = t.category || "other";
    totals[cid] = (totals[cid] || 0) + t.amount;
  }
  const segments = CATEGORIES
    .map((c) => ({ label: catLabel(c.id), value: totals[c.id] || 0, color: c.color, icon: c.icon }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = segments.reduce((s, x) => s + x.value, 0);

  if (total <= 0) {
    el.pieEmpty.classList.add("show");
    el.pieChart.style.display = "none";
    el.pieLegend.innerHTML = "";
    return;
  }
  el.pieEmpty.classList.remove("show");
  el.pieChart.style.display = "";
  drawPie(el.pieChart, segments);

  el.pieLegend.innerHTML = "";
  for (const s of segments) {
    const pct = Math.round((s.value / total) * 100);
    const li = document.createElement("li");
    li.innerHTML = `<span class="legend-dot" style="background:${s.color}"></span>
      <span class="legend-label">${s.icon} ${s.label}</span>
      <span class="legend-pct">${pct}% · ${formatShort(s.value)}</span>`;
    el.pieLegend.appendChild(li);
  }
}

function renderBar() {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ y: d.getFullYear(), m: d.getMonth(), label: "T" + (d.getMonth() + 1), value: 0 });
  }
  for (const t of state.transactions) {
    if (t.type !== "expense") continue;
    const d = new Date(t.ts);
    const slot = months.find((x) => x.y === d.getFullYear() && x.m === d.getMonth());
    if (slot) slot.value += t.amount;
  }
  const hasData = months.some((x) => x.value > 0);
  if (!hasData) {
    el.barEmpty.classList.add("show");
    el.barChart.style.display = "none";
    return;
  }
  el.barEmpty.classList.remove("show");
  el.barChart.style.display = "";
  drawBar(el.barChart, months.map((x) => ({ label: x.label, value: x.value })));
}

function renderCompare() {
  const now = new Date();
  const thisM = monthSum("expense", now.getFullYear(), now.getMonth());
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastM = monthSum("expense", last.getFullYear(), last.getMonth());
  const savingThis = monthSum("saving", now.getFullYear(), now.getMonth());
  const incomeThis = monthSum("income", now.getFullYear(), now.getMonth());

  let deltaClass = "flat", deltaText;
  if (lastM === 0) {
    deltaText = thisM > 0 ? "Tháng trước chưa tiêu gì" : "Chưa có dữ liệu";
  } else {
    const deltaPct = Math.round(((thisM - lastM) / lastM) * 100);
    if (deltaPct > 0) { deltaClass = "up"; deltaText = `▲ ${deltaPct}% so tháng trước`; }
    else if (deltaPct < 0) { deltaClass = "down"; deltaText = `▼ ${Math.abs(deltaPct)}% so tháng trước`; }
    else { deltaText = "Bằng tháng trước"; }
  }

  el.compareStats.innerHTML = `
    <div class="compare-item">
      <div class="ci-label">Chi tháng này</div>
      <div class="ci-value">${formatVND(thisM)}</div>
      <div class="ci-delta ${deltaClass}">${deltaText}</div>
    </div>
    <div class="compare-item">
      <div class="ci-label">Chi tháng trước</div>
      <div class="ci-value">${formatVND(lastM)}</div>
      <div class="ci-delta flat">&nbsp;</div>
    </div>
    <div class="compare-item">
      <div class="ci-label">Bỏ heo tháng này</div>
      <div class="ci-value">${formatVND(savingThis)}</div>
      <div class="ci-delta flat">&nbsp;</div>
    </div>`;

  const moneyIn = state.salary + incomeThis;
  const rate = moneyIn > 0 ? Math.round((savingThis / moneyIn) * 100) : 0;
  el.savingRateValue.textContent = rate + "%";
  el.savingRateFill.style.width = Math.min(Math.max(rate, 0), 100) + "%";

  let note;
  if (moneyIn <= 0) note = "Khai báo lương để mẹ tính tỷ lệ tiết kiệm cho con.";
  else if (rate >= 30) note = "Giỏi! Tiết kiệm hơn 30% rồi đấy. Mẹ tự hào (chút thôi).";
  else if (rate >= 10) note = "Tạm được, nhưng ráng lên 20-30% nữa đi con.";
  else if (rate > 0) note = "Tiết kiệm tí xíu vậy thôi à? Mẹ buồn ghê.";
  else note = "Tháng này chưa bỏ đồng nào vào heo. Định cạp đất hả con?";
  el.savingRateNote.textContent = note;
}

function renderAnalytics() {
  renderPie();
  renderBar();
  renderCompare();
  renderPrediction();
}

// ---- Streak & combo ----
function dayKey(d) { return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate(); }

function getSplurgeDaySet() {
  const set = new Set();
  for (const t of state.transactions) {
    if (t.type === "expense" && !t.essential) set.add(dayKey(new Date(t.ts)));
  }
  return set;
}

function computeStreak() {
  if (state.transactions.length === 0) return 0;
  const splurge = getSplurgeDaySet();
  const firstTs = Math.min(...state.transactions.map((t) => t.ts));
  const first = new Date(firstTs); first.setHours(0, 0, 0, 0);
  let streak = 0;
  const d = new Date(); d.setHours(0, 0, 0, 0);
  while (d.getTime() >= first.getTime()) {
    if (splurge.has(dayKey(d))) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function renderStreakCombo() {
  el.streakValue.textContent = computeStreak() + " ngày";
  el.comboValue.textContent = "x" + state.combo;
  if (el.comboCard) {
    el.comboCard.classList.remove("hot");
    if (state.combo >= 3) {
      void el.comboCard.offsetWidth;
      el.comboCard.classList.add("hot");
    }
  }
}

// ---- Huy hiệu & thành tích ----
const ACHIEVEMENTS = [
  { id: "first_note",  icon: "📝", title: "Lần đầu ghi sổ",      desc: "Ghi khoản đầu tiên",                 check: (s) => s.txCount >= 1 },
  { id: "piggy_saint", icon: "🐷", title: "Thánh bỏ ống",        desc: "Tổng tiết kiệm đạt 1 triệu",          check: (s) => s.totalSaving >= 1000000 },
  { id: "saver_5",     icon: "💰", title: "Chăm bỏ heo",         desc: "Bỏ ống đủ 5 lần",                     check: (s) => s.savingCount >= 5 },
  { id: "streak_3",    icon: "🔥", title: "3 ngày không trà sữa", desc: "3 ngày liên tiếp không tiêu hoang",   check: (s) => s.streak >= 3 },
  { id: "streak_7",    icon: "🧘", title: "Tuần lễ kỷ luật",      desc: "7 ngày liên tiếp không tiêu hoang",   check: (s) => s.streak >= 7 },
  { id: "rate_30",     icon: "🏦", title: "Tay hòm chìa khóa",    desc: "Tỷ lệ tiết kiệm ≥ 30% trong tháng",   check: (s) => s.savingRate >= 30 },
  { id: "spender_god", icon: "💸", title: "Chúa chi tiêu",        desc: "Chi hơn 5 triệu trong một tháng",     check: (s) => s.expenseThis >= 5000000 },
  { id: "combo_5",     icon: "🎆", title: "Đốt tiền nghệ thuật",  desc: "Đạt combo tiêu hoang x5",             check: (s) => s.maxCombo >= 5 },
  { id: "combo_10",    icon: "💀", title: "Vô phương cứu chữa",   desc: "Đạt combo tiêu hoang x10",            check: (s) => s.maxCombo >= 10 },
];

function buildAchStats() {
  let totalSaving = 0, savingCount = 0, totalExpense = 0, splurgeCount = 0, incomeTotal = 0;
  for (const t of state.transactions) {
    if (t.type === "saving") { totalSaving += t.amount; savingCount++; }
    else if (t.type === "expense") { totalExpense += t.amount; if (!t.essential) splurgeCount++; }
    else if (t.type === "income") { incomeTotal += t.amount; }
  }
  const now = new Date();
  const savingThis = monthSum("saving", now.getFullYear(), now.getMonth());
  const incomeThis = monthSum("income", now.getFullYear(), now.getMonth());
  const expenseThis = monthSum("expense", now.getFullYear(), now.getMonth());
  const moneyIn = state.salary + incomeThis;
  const savingRate = moneyIn > 0 ? (savingThis / moneyIn) * 100 : 0;
  return {
    totalSaving, savingCount, totalExpense, splurgeCount, incomeTotal,
    streak: computeStreak(), maxCombo: state.maxCombo, savingRate, expenseThis,
    txCount: state.transactions.length,
  };
}

function renderAchievements() {
  el.achGrid.innerHTML = "";
  for (const a of ACHIEVEMENTS) {
    const unlocked = state.unlocked.includes(a.id);
    const div = document.createElement("div");
    div.className = "ach-item" + (unlocked ? " unlocked" : "");
    div.innerHTML = `<div class="ach-emoji">${a.icon}</div>
      <div class="ach-title">${a.title}</div>
      <div class="ach-desc">${a.desc}</div>
      <span class="ach-badge">${unlocked ? "✓ Đã mở" : "🔒 Chưa mở"}</span>`;
    el.achGrid.appendChild(div);
  }
  el.achCount.textContent = `${state.unlocked.length}/${ACHIEVEMENTS.length}`;
}

function checkAchievements(silent) {
  const s = buildAchStats();
  const newly = [];
  for (const a of ACHIEVEMENTS) {
    if (!state.unlocked.includes(a.id) && a.check(s)) {
      state.unlocked.push(a.id);
      newly.push(a);
    }
  }
  if (newly.length) {
    save();
    renderAchievements();
    if (!silent) {
      const a = newly[0];
      setTimeout(() => {
        showToast(`🏆 Mở khóa huy hiệu: ${a.icon} ${a.title}!`, "praise");
        playSound("praise");
        fireConfetti();
      }, 1200);
    }
  }
}

// ---- AI (tùy chọn, dùng key của người dùng, lưu cục bộ) ----
function setAIStatus(msg, cls) {
  el.aiStatus.textContent = msg;
  el.aiStatus.className = "ai-status" + (cls ? " " + cls : "");
}

function saveAI() {
  state.ai.enabled = el.aiEnabled.checked;
  state.ai.key = el.aiKey.value.trim();
  save();
  if (state.ai.enabled && !state.ai.key) {
    setAIStatus("Đã bật nhưng chưa có key. Dán API key vào nhé.", "err");
  } else if (state.ai.enabled) {
    setAIStatus("Đã bật AI. Thử ghi một khoản tiêu hoang xem mẹ chửi gì!", "ok");
  } else {
    setAIStatus("Đã tắt AI. Dùng lại câu thoại có sẵn.", "");
  }
}

const AI_PERSONA = {
  mom: "một người mẹ Việt Nam nghiêm khắc, hay cằn nhằn",
  ex: "một người yêu cũ thực dụng, mỉa mai, hay nhắc chuyện cũ",
  boss: "một ông sếp keo kiệt, hay nói về tiền bạc và năng suất",
  neighbor: "một bà hàng xóm Việt nhiều chuyện, hay so sánh và đem chuyện đi kể",
  dad: "một ông bố Việt lạnh lùng, ít nói, hay thất vọng",
};

async function generateAIScold(transaction, tone) {
  el.momMessage.classList.add("ai-thinking");
  try {
    const persona = AI_PERSONA[state.mood] || AI_PERSONA.mom;
    const prompt = `Bạn đóng vai ${persona}. Người dùng vừa chi ${formatVND(transaction.amount)} cho "${transaction.note || "một khoản không thiết yếu"}". Hãy mắng hoặc khích bác họ bằng ĐÚNG MỘT câu tiếng Việt ngắn (dưới 30 từ), hài hước, đúng giọng nhân vật, không emoji, không xuống dòng.`;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + state.ai.key },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 80,
        temperature: 1.0,
      }),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const txt = (data.choices && data.choices[0] && data.choices[0].message.content || "").trim();
    el.momMessage.classList.remove("ai-thinking");
    if (txt) {
      lastReaction = { text: txt, tone, mood: state.mood };
      speak(txt, tone);
    }
  } catch (e) {
    el.momMessage.classList.remove("ai-thinking");
    setAIStatus("AI lỗi (" + e.message + "). Tạm dùng câu có sẵn.", "err");
    console.warn("AI error:", e);
  }
}

// ---- Mục tiêu tiết kiệm ----
function getTotalSaving() {
  return state.transactions.filter((t) => t.type === "saving").reduce((s, t) => s + t.amount, 0);
}

function saveGoal() {
  state.goal.name = el.goalName.value.trim();
  state.goal.target = parseAmount(el.goalTarget.value);
  save();
  renderGoal();
  if (state.goal.target > 0) {
    el.goalTarget.value = new Intl.NumberFormat("vi-VN").format(state.goal.target);
    speak(`Mục tiêu "${state.goal.name || "để dành"}": ${formatVND(state.goal.target)}. Cố mà bỏ heo cho đủ nha con!`, null);
  }
}

function renderGoal() {
  if (!state.goal.target || state.goal.target <= 0) {
    el.goalProgress.style.display = "none";
    return;
  }
  const saved = getTotalSaving();
  const ratio = saved / state.goal.target;
  const pct = Math.min(ratio * 100, 100);
  el.goalProgress.style.display = "";
  el.goalBarFill.style.width = pct + "%";
  el.goalBarFill.classList.toggle("done", ratio >= 1);
  const name = state.goal.name || "mục tiêu";
  if (ratio >= 1) {
    el.goalStatus.textContent = `🎉 Đạt mục tiêu "${name}"! Đã bỏ ${formatVND(saved)}. Mẹ tự hào ghê!`;
  } else {
    el.goalStatus.textContent = `"${name}": ${formatVND(saved)} / ${formatVND(state.goal.target)} (${Math.round(pct)}%) · còn thiếu ${formatVND(state.goal.target - saved)}.`;
  }
}

// ---- Hạn mức theo danh mục ----
function catMonthSpent(catId, date) {
  let s = 0;
  for (const t of state.transactions) {
    if (t.type !== "expense" || (t.category || "") !== catId) continue;
    const d = new Date(t.ts);
    if (d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear()) s += t.amount;
  }
  return s;
}

function renderCatBudgets() {
  el.catBudgetBody.innerHTML = "";
  const now = new Date();
  for (const c of CATEGORIES) {
    const limit = state.catBudgets[c.id] || 0;
    const used = catMonthSpent(c.id, now);
    const over = limit > 0 && used > limit;
    const row = document.createElement("div");
    row.className = "catbudget-row" + (over ? " over" : "");
    const usedText = limit > 0
      ? `Đã tiêu ${formatVND(used)} / ${formatVND(limit)}${over ? " — VƯỢT!" : ""}`
      : (used > 0 ? `Đã tiêu ${formatVND(used)} (chưa đặt hạn mức)` : "");
    row.innerHTML = `
      <span class="cb-icon">${c.icon}</span>
      <span class="cb-label">${catLabel(c.id)}</span>
      <input type="text" inputmode="numeric" data-cat="${c.id}" value="${limit ? new Intl.NumberFormat("vi-VN").format(limit) : ""}" placeholder="Không giới hạn" />
      <div class="cb-used">${usedText}</div>`;
    el.catBudgetBody.appendChild(row);
  }
}

// ---- Tiền tệ (quy đổi tỷ giá thật) ----
function applyRateToAmounts(rate) {
  state.transactions.forEach((t) => { t.amount = Math.round(t.amount * rate); });
  state.salary = Math.round(state.salary * rate);
  state.budget = Math.round(state.budget * rate);
  if (state.goal) state.goal.target = Math.round((state.goal.target || 0) * rate);
  for (const k in state.catBudgets) state.catBudgets[k] = Math.round(state.catBudgets[k] * rate);
  (state.recurring || []).forEach((r) => { r.amount = Math.round(r.amount * rate); });
}

function finalizeCurrency(cur) {
  state.currency = cur;
  save();
  el.currencySelect.value = cur;
  reRenderAll();
}

async function setCurrency(cur) {
  if (!CURRENCIES[cur] || cur === state.currency) { el.currencySelect.value = state.currency; return; }
  const from = state.currency;
  const hasData = state.transactions.length > 0 || state.salary > 0 || state.budget > 0;

  if (!hasData) { finalizeCurrency(cur); return; }

  const convert = confirm(`Quy đổi toàn bộ số tiền từ ${from} sang ${cur} theo tỷ giá hiện tại?\n\nOK = quy đổi giá trị · Cancel = chỉ đổi ký hiệu hiển thị.`);
  if (!convert) { finalizeCurrency(cur); return; }

  try {
    el.currencySelect.disabled = true;
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const rate = data && data.rates && data.rates[cur];
    if (!rate) throw new Error("Không có tỷ giá");
    applyRateToAmounts(rate);
    finalizeCurrency(cur);
    speak(`Đã quy đổi sang ${cur} theo tỷ giá ${from}→${cur} ≈ ${rate}.`, null);
  } catch (e) {
    if (confirm(`Không lấy được tỷ giá (${e.message}). Chỉ đổi ký hiệu mà không quy đổi giá trị?`)) {
      finalizeCurrency(cur);
    } else {
      el.currencySelect.value = state.currency;
    }
  } finally {
    el.currencySelect.disabled = false;
  }
}

// ---- Chi tiêu định kỳ ----
function monthKey(d) { return d.getFullYear() + "-" + d.getMonth(); }

function addRecurring() {
  const name = el.recName.value.trim();
  const amount = parseAmount(el.recAmount.value);
  let day = parseInt(el.recDay.value, 10) || 1;
  day = Math.min(Math.max(day, 1), 28);
  if (!name || amount <= 0) {
    speak("Nhập tên và số tiền cho khoản định kỳ đã con.", "scold");
    return;
  }
  state.recurring.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    name, amount, category: "bills", day, lastApplied: null,
  });
  save();
  renderRecurring();
  el.recName.value = ""; el.recAmount.value = ""; el.recDay.value = "";
}

function deleteRecurring(id) {
  state.recurring = state.recurring.filter((r) => r.id !== id);
  save();
  renderRecurring();
}

function applyRecurring(id) {
  const r = state.recurring.find((x) => x.id === id);
  if (!r) return;
  const now = new Date();
  const mk = monthKey(now);
  if (r.lastApplied === mk) return;
  const ts = new Date(now.getFullYear(), now.getMonth(), Math.min(r.day, 28), 9, 0, 0).getTime();
  state.transactions.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type: "expense", amount: r.amount, note: r.name + " (định kỳ)",
    essential: true, category: r.category || "bills", ts,
  });
  r.lastApplied = mk;
  state.combo = 0;
  save();
  renderStats(); renderHistory(); renderBudget(); renderAnalytics();
  renderGoal(); renderCatBudgets(); renderRecurring(); renderStreakCombo();
  speak(`Đã ghi khoản định kỳ "${r.name}" ${formatVND(r.amount)} cho tháng này.`, null);
  checkAchievements();
}

function renderRecurring() {
  el.recurringList.innerHTML = "";
  const mk = monthKey(new Date());
  for (const r of state.recurring) {
    const applied = r.lastApplied === mk;
    const li = document.createElement("li");
    li.className = "recurring-item" + (applied ? "" : " due");
    li.innerHTML = `
      <div class="rec-info">
        <div class="rec-name">${escapeHtml(r.name)}</div>
        <div class="rec-meta">${formatVND(r.amount)} · ngày ${r.day} hằng tháng</div>
      </div>
      ${applied
        ? '<span class="rec-applied">✓ Đã ghi tháng này</span>'
        : `<button class="rec-apply" data-id="${r.id}">Ghi tháng này</button>`}
      <button class="rec-del" data-id="${r.id}" title="Xóa">🗑️</button>`;
    el.recurringList.appendChild(li);
  }
}

function remindRecurringDue() {
  const now = new Date();
  const mk = monthKey(now);
  const due = state.recurring.filter((r) => r.lastApplied !== mk && now.getDate() >= r.day);
  if (due.length > 0) {
    setTimeout(() => {
      showToast(`🔁 Có ${due.length} khoản định kỳ tới hạn tháng này. Vào mục "Chi tiêu định kỳ" để ghi nhé!`, null);
    }, 1800);
  }
}

// ---- Lọc & tìm kiếm ----
function populateFilterCategories() {
  // Giữ 2 option đầu, thêm danh mục
  el.filterCategory.length = 1;
  for (const c of CATEGORIES) {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${c.icon} ${catLabel(c.id)}`;
    el.filterCategory.appendChild(opt);
  }
}

// ---- Sửa giao dịch ----
function openEdit(id) {
  const t = state.transactions.find((x) => x.id === id);
  if (!t) return;
  editing.id = id;
  editing.category = t.category || "food";
  editing.essential = !!t.essential;
  el.editAmount.value = new Intl.NumberFormat("vi-VN").format(t.amount);
  el.editNote.value = t.note || "";
  const isExpense = t.type === "expense";
  el.editCategoryField.style.display = isExpense ? "" : "none";
  el.editEssentialField.style.display = isExpense ? "" : "none";
  renderEditCategory();
  renderEditEssential();
  el.editModal.classList.add("show");
}

function renderEditCategory() {
  el.editCategoryGrid.innerHTML = "";
  for (const c of CATEGORIES) {
    const btn = document.createElement("button");
    btn.className = "cat-btn" + (c.id === editing.category ? " active" : "");
    btn.dataset.cat = c.id;
    btn.innerHTML = `<span class="cat-emoji">${c.icon}</span>${catLabel(c.id)}`;
    el.editCategoryGrid.appendChild(btn);
  }
}

function renderEditEssential() {
  el.editEssentialToggle.querySelectorAll(".ess-btn").forEach((b) => {
    b.classList.toggle("active", (b.dataset.essential === "true") === editing.essential);
  });
}

function saveEdit() {
  const t = state.transactions.find((x) => x.id === editing.id);
  if (!t) return;
  const amount = parseAmount(el.editAmount.value);
  if (amount <= 0) {
    alert("Số tiền phải lớn hơn 0.");
    return;
  }
  t.amount = amount;
  t.note = el.editNote.value.trim();
  if (t.type === "expense") {
    t.category = editing.category;
    t.essential = editing.essential;
  }
  save();
  closeEdit();
  renderStats(); renderHistory(); renderBudget(); renderAnalytics();
  renderGoal(); renderCatBudgets(); renderStreakCombo();
  checkAchievements();
}

function closeEdit() {
  el.editModal.classList.remove("show");
  editing.id = null;
}

// ---- Dữ liệu: xuất / nhập / reset ----
function reRenderAll() {
  renderMood();
  renderSalary();
  renderStats();
  renderHistory();
  renderBudget();
  renderCategoryGrid();
  renderAnalytics();
  renderStreakCombo();
  renderAchievements();
  renderGoal();
  renderCatBudgets();
  renderRecurring();
  el.soundBtn.textContent = state.soundOn ? "🔊" : "🔇";
  el.soundBtn.classList.toggle("muted", !state.soundOn);
  if (state.budget > 0) el.budgetInput.value = new Intl.NumberFormat("vi-VN").format(state.budget);
  if (state.goal.name) el.goalName.value = state.goal.name;
  if (state.goal.target > 0) el.goalTarget.value = new Intl.NumberFormat("vi-VN").format(state.goal.target);
  el.currencySelect.value = state.currency;
  el.aiEnabled.checked = !!state.ai.enabled;
  el.aiKey.value = state.ai.key || "";
  applyTheme();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  a.href = url;
  a.download = `me-thien-ha-backup-${stamp}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  speak("Đã xuất dữ liệu ra file. Cất kỹ vào nha con!", null);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.transactions)) {
        throw new Error("Cấu trúc file không đúng");
      }
      if (!confirm("Nhập dữ liệu này sẽ GHI ĐÈ toàn bộ dữ liệu hiện tại. Tiếp tục?")) return;
      state = { ...state, ...parsed, ui: { ...state.ui, ...(parsed.ui || {}) } };
      state.transactions.forEach((t) => { if (t.type === "expense" && !t.category) t.category = "other"; });
      save();
      reRenderAll();
      speak("Đã nhập dữ liệu thành công! Mẹ nhớ hết tội cũ của con rồi đấy.", null);
    } catch (e) {
      alert("Không đọc được file: " + e.message);
    }
  };
  reader.readAsText(file);
}

function resetAll() {
  if (!confirm("XÓA TOÀN BỘ dữ liệu và cài đặt? Không thể hoàn tác!")) return;
  if (!confirm("Chắc chắn chưa? Mẹ hỏi lại lần cuối đấy.")) return;
  localStorage.removeItem(STORE_KEY);
  location.reload();
}

// ---- Dự đoán cuối tháng ----
function renderPrediction() {
  const now = new Date();
  const day = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const spent = monthSum("expense", now.getFullYear(), now.getMonth());
  el.prediction.className = "prediction";
  if (spent <= 0 || day < 2) { el.prediction.textContent = ""; return; }
  const projected = (spent / day) * daysInMonth;
  let msg = `🔮 Dự đoán: với đà này, hết tháng con sẽ tiêu khoảng ${formatVND(projected)} (đã tiêu ${formatVND(spent)} sau ${day} ngày).`;
  if (state.budget > 0) {
    if (projected > state.budget) {
      el.prediction.classList.add("over");
      msg += ` Vượt hạn mức ${formatVND(projected - state.budget)} — phanh lại đi con!`;
    } else {
      el.prediction.classList.add("warn");
      msg += ` Vẫn trong hạn mức, ráng giữ nha.`;
    }
  }
  el.prediction.textContent = msg;
}

// ---- Tổng kết tháng ----
let summaryCaption = "";

function getMonthSummary(year, month) {
  let expense = 0, income = 0, saving = 0, splurge = 0;
  const catTotals = {};
  for (const t of state.transactions) {
    const d = new Date(t.ts);
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;
    if (t.type === "expense") {
      expense += t.amount;
      if (!t.essential) splurge += t.amount;
      const c = t.category || "other";
      catTotals[c] = (catTotals[c] || 0) + t.amount;
    } else if (t.type === "income") income += t.amount;
    else if (t.type === "saving") saving += t.amount;
  }
  let topCat = null, topVal = 0;
  for (const k in catTotals) { if (catTotals[k] > topVal) { topVal = catTotals[k]; topCat = k; } }
  return { expense, income, saving, splurge, topCat, topVal, hasData: (expense + income + saving) > 0 };
}

function summaryVerdict(s) {
  if (!s.hasData) return "Tháng đó con chẳng ghi gì cả. Lười cả ghi sổ thì tiết kiệm kiểu gì?";
  if (s.saving > s.splurge && s.saving > 0) return "Tiết kiệm nhiều hơn tiêu hoang. Mẹ bất ngờ đấy, giỏi lắm!";
  if (s.expense > 0 && s.splurge > s.expense * 0.6) return "Tiêu hoang quá trời. Tháng này liệu hồn nha con!";
  return "Cũng tạm. Nhưng mẹ tin con làm tốt hơn được.";
}

function drawSummaryCard(year, month, s) {
  const canvas = el.summaryCanvas;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#2a1c4a");
  grad.addColorStop(0.5, "#1c1d33");
  grad.addColorStop(1, "#3a1330");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#7c5cff";
  ctx.lineWidth = 10;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ff5d8f";
  ctx.font = "800 60px 'Be Vietnam Pro', sans-serif";
  ctx.fillText(`Tổng kết Tháng ${month + 1}/${year}`, W / 2, 130);

  const rows = [
    ["💰 Đã thu", formatVND(s.income), "#36d399"],
    ["🛍️ Đã tiêu", formatVND(s.expense), "#ff6b6b"],
    ["😋 Tiêu hoang", formatVND(s.splurge), "#ffd166"],
    ["🐷 Bỏ heo", formatVND(s.saving), "#7c5cff"],
  ];
  let y = 250;
  ctx.font = "600 46px 'Be Vietnam Pro', sans-serif";
  for (const [label, val, color] of rows) {
    ctx.textAlign = "left";
    ctx.fillStyle = "#ecedf7";
    ctx.fillText(label, 90, y);
    ctx.textAlign = "right";
    ctx.fillStyle = color;
    ctx.fillText(val, W - 90, y);
    y += 80;
  }

  if (s.topCat) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#9a9bc0";
    ctx.font = "500 36px 'Be Vietnam Pro', sans-serif";
    ctx.fillText(`Tốn nhất: ${getCat(s.topCat).icon} ${catLabel(s.topCat)} (${formatVND(s.topVal)})`, W / 2, y + 10);
  }

  // Lời phán (wrap)
  ctx.fillStyle = "#ecedf7";
  ctx.font = "700 44px 'Be Vietnam Pro', sans-serif";
  const verdict = summaryVerdict(s);
  const lines = wrapText(ctx, "“" + verdict + "”", W - 160);
  let vy = y + 110;
  for (const ln of lines.slice(0, 4)) { ctx.fillText(ln, W / 2, vy); vy += 58; }

  ctx.fillStyle = "#ff5d8f";
  ctx.font = "800 42px 'Be Vietnam Pro', sans-serif";
  ctx.fillText("👩‍🦰 Mẹ Thiên Hạ", W / 2, H - 80);
  ctx.fillStyle = "#9a9bc0";
  ctx.font = "500 30px 'Be Vietnam Pro', sans-serif";
  ctx.fillText("tridpt.github.io/money-mom", W / 2, H - 40);
}

function openSummary(year, month) {
  const s = getMonthSummary(year, month);
  el.summaryTitle.textContent = `Tổng kết Tháng ${month + 1}/${year} 📅`;
  drawSummaryCard(year, month, s);
  summaryCaption = `Tổng kết Tháng ${month + 1}/${year} của tôi trên Mẹ Thiên Hạ 💸\nĐã tiêu ${formatVND(s.expense)}, bỏ heo ${formatVND(s.saving)}.\n"${summaryVerdict(s)}"\nThử đi: ${APP_URL}`;
  el.summaryModal.classList.add("show");
}

function openSummaryPrevMonth() {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  openSummary(prev.getFullYear(), prev.getMonth());
}

function autoMonthlySummary() {
  const now = new Date();
  const curMK = monthKey(now);
  if (state.lastSummaryMonth === curMK) return;
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const s = getMonthSummary(prev.getFullYear(), prev.getMonth());
  state.lastSummaryMonth = curMK;
  save();
  if (s.hasData) {
    setTimeout(() => openSummary(prev.getFullYear(), prev.getMonth()), 900);
  }
}

async function shareSummary() {
  try {
    const blob = await new Promise((r) => el.summaryCanvas.toBlob(r, "image/png"));
    const file = new File([blob], "tong-ket-thang.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text: summaryCaption, title: "Tổng kết tháng" });
      return;
    }
    if (navigator.share) { await navigator.share({ text: summaryCaption, url: APP_URL }); return; }
    downloadSummary();
  } catch (e) { console.warn("Share summary:", e); }
}

async function downloadSummary() {
  const blob = await new Promise((r) => el.summaryCanvas.toBlob(r, "image/png"));
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "tong-ket-thang.png"; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copySummary() {
  try {
    await navigator.clipboard.writeText(summaryCaption);
    el.summaryCopy.textContent = "✅ Đã copy!";
    setTimeout(() => (el.summaryCopy.textContent = "📋 Copy"), 1800);
  } catch (e) { alert(summaryCaption); }
}

// ---- Nhắc nhở hằng ngày ----
function dailyReminder() {
  const today = new Date().toDateString();
  const logged = state.transactions.some((t) => new Date(t.ts).toDateString() === today);
  if (!logged) {
    setTimeout(() => showToast("📝 Hôm nay khai báo chi tiêu chưa con? Đừng có giấu mẹ nha!", null), 3000);
  }
}

// ---- Theme sáng/tối ----
function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
  el.themeBtn.textContent = state.theme === "light" ? "☀️" : "🌙";
  if (state.transactions.length) renderAnalytics(); // vẽ lại biểu đồ theo màu mới
}

function toggleTheme() {
  state.theme = state.theme === "light" ? "dark" : "light";
  save();
  applyTheme();
}

// ---- PWA: service worker + nút cài đặt ----
let deferredPrompt = null;

function setupPWA() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch((e) => console.warn("SW lỗi:", e));
  }
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    el.installBtn.style.display = "";
  });
  window.addEventListener("appinstalled", () => {
    el.installBtn.style.display = "none";
    deferredPrompt = null;
  });
}

async function doInstall() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  el.installBtn.style.display = "none";
}

// ---- Onboarding ----
const ONBOARD_STEPS = [
  { emoji: "👩‍🦰", title: "Chào con, mẹ là Mẹ Thiên Hạ!", text: "Mẹ sẽ giúp con quản lý tiền bạc... bằng cách mắng cho con chừa cái tật tiêu hoang." },
  { emoji: "🛍️", title: "Ghi mọi khoản tiền", text: "Nhập khoản chi, thu nhập hay tiết kiệm. Tiêu thứ không thiết yếu là mẹ mắng ngay tại chỗ!" },
  { emoji: "🎭", title: "5 nhân vật khó tính", text: "Bấm nút góc trên để đổi giữa Mẹ, Người yêu cũ, Sếp keo kiệt, Bà hàng xóm và Ông bố lạnh lùng." },
  { emoji: "🎯", title: "Hạn mức & huy hiệu", text: "Đặt hạn mức tháng, giữ streak không tiêu hoang và mở khóa các huy hiệu thành tích." },
  { emoji: "📸", title: "Khoe lời mẹ phán", text: "Tạo ảnh câu mắng để chia sẻ lên mạng xã hội. Giờ thì bắt đầu tiết kiệm thôi nào!" },
];
let onboardStep = 0;

const ONBOARD_STEPS_EN = [
  { emoji: "👩‍🦰", title: "Hi, I'm Money Mom!", text: "I'll help you manage your money... by scolding you out of your overspending habit." },
  { emoji: "🛍️", title: "Log every entry", text: "Add expenses, income or savings. Spend on something non-essential and I'll scold you on the spot!" },
  { emoji: "🎭", title: "5 tough characters", text: "Tap the top button to switch between Mom, Ex, Stingy Boss, Nosy Neighbor and Cold Dad." },
  { emoji: "🎯", title: "Budgets & badges", text: "Set a monthly budget, keep a no-splurge streak and unlock achievement badges." },
  { emoji: "📸", title: "Share the verdict", text: "Turn scoldings into shareable images. Now let's start saving!" },
];

function onboardSteps() {
  return state.lang === "en" ? ONBOARD_STEPS_EN : ONBOARD_STEPS;
}

function renderOnboard() {
  const steps = onboardSteps();
  const s = steps[onboardStep];
  el.onboardEmoji.textContent = s.emoji;
  el.onboardTitle.textContent = s.title;
  el.onboardText.textContent = s.text;
  el.onboardDots.innerHTML = steps
    .map((_, i) => `<span class="${i === onboardStep ? "active" : ""}"></span>`)
    .join("");
  el.onboardNext.textContent = onboardStep === steps.length - 1 ? tr("onboardStart") : tr("onboardNext");
}

function openOnboard() {
  onboardStep = 0;
  renderOnboard();
  el.onboardModal.classList.add("show");
}

function nextOnboard() {
  if (onboardStep < onboardSteps().length - 1) {
    onboardStep++;
    renderOnboard();
  } else {
    finishOnboard();
  }
}

function finishOnboard() {
  el.onboardModal.classList.remove("show");
  if (!state.onboardingDone) {
    state.onboardingDone = true;
    save();
    fireConfetti();
  }
}

// ---- Confetti (canvas, không cần thư viện) ----
let confettiRAF = null;

function fireConfetti() {
  const canvas = el.confettiCanvas;
  canvas.classList.add("show");
  const W = window.innerWidth, H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const colors = ["#ff5d8f", "#7c5cff", "#ffd166", "#36d399", "#4d96ff"];
  const parts = [];
  for (let i = 0; i < 150; i++) {
    parts.push({
      x: W / 2 + (Math.random() - 0.5) * W * 0.4,
      y: H * 0.28 + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 13,
      vy: Math.random() * -13 - 3,
      g: 0.3 + Math.random() * 0.25,
      size: 6 + Math.random() * 9,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.35,
    });
  }
  const start = performance.now();
  cancelAnimationFrame(confettiRAF);
  function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    for (const p of parts) {
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.99;
      p.rot += p.vrot;
      if (p.y < H + 30) alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - t / 2700);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    if (alive && t < 2900) {
      confettiRAF = requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, W, H);
      canvas.classList.remove("show");
    }
  }
  confettiRAF = requestAnimationFrame(frame);
}

// ---- Text-to-speech toggle ----
function toggleTTS() {
  state.ttsOn = !state.ttsOn;
  save();
  el.ttsBtn.textContent = state.ttsOn ? "🗣️" : "🤐";
  el.ttsBtn.classList.toggle("muted", !state.ttsOn);
  if (state.ttsOn) speakAloud(getMood(state.mood).idle);
  else if ("speechSynthesis" in window) speechSynthesis.cancel();
}

// ---- Câu mắng tự viết ----
function renderScoldList() {
  el.scoldList.innerHTML = "";
  (state.customScolds || []).forEach((s, i) => {
    const li = document.createElement("li");
    li.className = "chip-item";
    li.innerHTML = `<span>${escapeHtml(s)}</span><button data-i="${i}" title="Xóa">✕</button>`;
    el.scoldList.appendChild(li);
  });
}
function addScold() {
  const v = el.scoldInput.value.trim();
  if (!v) return;
  state.customScolds.push(v);
  save();
  renderScoldList();
  el.scoldInput.value = "";
}
function deleteScold(i) {
  state.customScolds.splice(i, 1);
  save();
  renderScoldList();
}

// ---- Nhân vật tự tạo ----
function renderCharList() {
  el.charList.innerHTML = "";
  (state.customChars || []).forEach((c) => {
    const li = document.createElement("li");
    li.className = "chip-item";
    li.innerHTML = `<span>${c.avatar || "🧑"} ${escapeHtml(c.label.replace(c.avatar + " ", ""))} (${(c.scold || []).length} câu)</span><button data-id="${c.id}" title="Xóa">✕</button>`;
    el.charList.appendChild(li);
  });
}
function addChar() {
  const name = el.charName.value.trim();
  const emoji = el.charEmoji.value.trim() || "🧑";
  const scold = el.charScold.value.split("\n").map((s) => s.trim()).filter(Boolean);
  const praise = el.charPraise.value.split("\n").map((s) => s.trim()).filter(Boolean);
  if (!name) { alert("Nhập tên nhân vật đã."); return; }
  if (scold.length === 0) { alert("Thêm ít nhất 1 câu mắng cho nhân vật."); return; }
  state.customChars.push({
    id: "custom_" + Date.now().toString(36),
    label: emoji + " " + name,
    avatar: emoji,
    scold,
    praise,
  });
  save();
  renderCharList();
  el.charName.value = ""; el.charEmoji.value = ""; el.charScold.value = ""; el.charPraise.value = "";
  showToast(`Đã tạo nhân vật "${name}"! Bấm nút đổi tính cách để gặp.`, "praise");
}
function deleteChar(id) {
  state.customChars = state.customChars.filter((c) => c.id !== id);
  if (state.mood === id) { state.mood = "mom"; renderMood(); }
  save();
  renderCharList();
}

// ---- Trang cài đặt ----
function openSettings() {
  el.settingsPage.classList.add("show");
  document.body.style.overflow = "hidden";
}
function closeSettings() {
  el.settingsPage.classList.remove("show");
  document.body.style.overflow = "";
}
function switchPanel(panel) {
  document.querySelectorAll(".snav-item").forEach((b) => {
    b.classList.toggle("active", b.dataset.panel === panel);
  });
  document.querySelectorAll(".settings-panel").forEach((p) => {
    p.classList.toggle("active", p.id === "panel-" + panel);
  });
  const content = document.querySelector(".settings-content");
  if (content) content.scrollTop = 0;
}

// ---- Đa ngôn ngữ ----
const I18N = {
  vi: {
    tagline: "Tiêu hoang là bị mắng. Tiết kiệm thì... cũng bị nói.",
    addEntry: "Ghi một khoản mới", expense: "🛍️ Chi tiêu", income: "💰 Thu nhập", saving: "🐷 Tiết kiệm",
    amount: "Số tiền", note: "Ghi chú", category: "Danh mục", essentialQ: "Khoản này có thiết yếu không?",
    essNo: "😋 Không thiết yếu", essYes: "🧾 Thiết yếu", addBtn: "Ghi sổ & nghe mẹ phán 👂",
    ledger: "Sổ chi tiêu", clearAll: "🗑️ Xóa hết", searchPh: "🔍 Tìm theo ghi chú...",
    allTypes: "Tất cả loại", allCats: "Mọi danh mục",
    balance: "Số dư trong ví", paidIn: "Đã thu", spent: "Đã tiêu", piggy: "Heo đất",
    streak: "🔥 Không tiêu hoang", combo: "💥 Combo tiêu hoang",
    salary: "💼 Lương tháng của bạn", budget: "🎯 Hạn mức chi tiêu tháng này", goal: "🏆 Mục tiêu tiết kiệm",
    amountPh: "VD: 60.000", notePh: "VD: Mua cốc trà sữa", save: "Lưu",
    achievements: "Huy hiệu & thành tích 🏆",
    salaryHint: "Mẹ cần biết lương để còn so sánh với mức tiêu của bạn.",
    salaryPh: "VD: 7.000.000", budgetPh: "VD: 3.000.000",
    goalNamePh: "VD: Mua iPhone", goalTargetPh: "VD: 10.000.000",
    catBudgetSum: "🎯 Hạn mức theo từng danh mục", currencySum: "💱 Đơn vị tiền tệ",
    currencyNote: "Đổi ký hiệu & cách hiển thị; nếu chọn, app sẽ quy đổi theo tỷ giá thật.",
    dataSum: "💾 Dữ liệu & sao lưu",
    dataNote: "Dữ liệu chỉ nằm trên máy này. Xuất ra file để sao lưu hoặc chuyển sang máy/điện thoại khác.",
    exportBtn: "⬇️ Xuất dữ liệu (.json)", importBtn: "⬆️ Nhập dữ liệu từ file", resetBtn: "🧨 Xóa toàn bộ & cài đặt lại",
    scoldSum: "✍️ Câu mắng tự viết",
    scoldNote: "Thêm câu mắng của riêng bạn. Chúng sẽ được trộn vào lúc bạn tiêu hoang.",
    scoldPh: "VD: Tiêu thế bao giờ giàu?", add: "Thêm",
    charSum: "🎭 Tạo nhân vật riêng",
    charNote: "Tự tạo nhân vật với tên, emoji và câu thoại riêng. Mỗi dòng là một câu.",
    charNamePh: "Tên nhân vật (VD: Crush)", charScoldPh: "Câu mắng khi tiêu hoang (mỗi dòng 1 câu)",
    charPraisePh: "Câu khen khi tiết kiệm (mỗi dòng 1 câu)", addChar: "➕ Tạo nhân vật",
    aiSum: "🤖 Chế độ AI — để mẹ chửi sáng tạo",
    aiNote: "Bật để các nhân vật tự nghĩ câu mắng riêng cho từng khoản. Dùng API tương thích OpenAI. Key lưu ngay trên máy bạn.",
    aiEnable: "Bật chế độ AI", aiKeyPh: "Dán API key (vd: sk-...)", aiSaveBtn: "Lưu cài đặt AI",
    recSum: "🔁 Chi tiêu định kỳ (tiền nhà, internet...)",
    recNote: "Khai báo khoản cố định hằng tháng. Mỗi tháng mẹ sẽ nhắc và ghi giúp con.",
    recNamePh: "Tên (VD: Tiền nhà)", recAmountPh: "Số tiền", recDayPh: "Ngày",
    pieTitle: "Tiền đi đâu nhiều nhất 🥧", thisMonth: "Tháng này", allTime: "Tất cả",
    barTitle: "Chi tiêu 6 tháng gần đây 📊", compareTitle: "Tháng này so với tháng trước 📈",
    summaryBtn: "📅 Tổng kết tháng trước", savingRate: "Tỷ lệ tiết kiệm tháng này",
    pieEmpty: "Chưa có khoản chi nào để vẽ. Tiêu đi rồi mẹ vẽ cho xem 🤨",
    barEmpty: "Chưa có dữ liệu. Đợi con tiêu thêm vài tháng nữa nha.",
    footer: "Dữ liệu lưu ngay trên máy bạn. Mẹ không lưu trên mây, mẹ chỉ lưu trong tim 💚",
    shareTrigger: "📸 Khoe lời mẹ phán",
    shareTitle: 'Khoe "thành tích" bị mẹ phán 📸', shareNow: "📤 Chia sẻ ngay",
    downloadImg: "⬇️ Tải ảnh", copyCap: "📋 Copy caption",
    editTitle: "Sửa khoản này ✏️", essential: "Thiết yếu?", essNoShort: "😋 Không", essYesShort: "🧾 Có",
    editSave: "Lưu thay đổi", share: "📤 Chia sẻ", copy: "📋 Copy",
    onboardSkip: "Bỏ qua", onboardNext: "Tiếp →", onboardStart: "Bắt đầu 🎉",
    settingsTitle: "⚙️ Cài đặt", settingsOpen: "⚙️ Cài đặt & tùy chỉnh →",
    navCatBudget: "Hạn mức danh mục", navCurrency: "Đơn vị tiền tệ", navRecurring: "Chi tiêu định kỳ",
    navData: "Dữ liệu & sao lưu", navScold: "Câu mắng tự viết", navChar: "Tạo nhân vật riêng", navAI: "Chế độ AI",
  },
  en: {
    tagline: "Overspend and get scolded. Save and... still get a remark.",
    addEntry: "Add a new entry", expense: "🛍️ Expense", income: "💰 Income", saving: "🐷 Saving",
    amount: "Amount", note: "Note", category: "Category", essentialQ: "Is this essential?",
    essNo: "😋 Non-essential", essYes: "🧾 Essential", addBtn: "Log it & hear the verdict 👂",
    ledger: "Transactions", clearAll: "🗑️ Clear all", searchPh: "🔍 Search by note...",
    allTypes: "All types", allCats: "All categories",
    balance: "Wallet balance", paidIn: "Income", spent: "Spent", piggy: "Piggy bank",
    streak: "🔥 No-splurge streak", combo: "💥 Splurge combo",
    salary: "💼 Your monthly salary", budget: "🎯 This month's budget", goal: "🏆 Savings goal",
    amountPh: "e.g. 60,000", notePh: "e.g. Bubble tea", save: "Save",
    achievements: "Badges & achievements 🏆",
    salaryHint: "Mom needs your salary to compare with your spending.",
    salaryPh: "e.g. 7,000,000", budgetPh: "e.g. 3,000,000",
    goalNamePh: "e.g. Buy iPhone", goalTargetPh: "e.g. 10,000,000",
    catBudgetSum: "🎯 Per-category budgets", currencySum: "💱 Currency",
    currencyNote: "Changes the symbol & format; if chosen, the app converts using real exchange rates.",
    dataSum: "💾 Data & backup",
    dataNote: "Data lives only on this device. Export to a file to back up or move to another device.",
    exportBtn: "⬇️ Export data (.json)", importBtn: "⬆️ Import from file", resetBtn: "🧨 Erase everything & reset",
    scoldSum: "✍️ Your own scoldings",
    scoldNote: "Add your own scolding lines. They get mixed in when you splurge.",
    scoldPh: "e.g. You'll never get rich like this", add: "Add",
    charSum: "🎭 Create your own character",
    charNote: "Make a character with a name, emoji and lines. One line per row.",
    charNamePh: "Name (e.g. Crush)", charScoldPh: "Scolding lines when you splurge (one per row)",
    charPraisePh: "Praise lines when you save (one per row)", addChar: "➕ Create character",
    aiSum: "🤖 AI mode — creative scolding",
    aiNote: "Turn on so characters invent unique scoldings per entry. Uses an OpenAI-compatible API. Key stays on your device.",
    aiEnable: "Enable AI mode", aiKeyPh: "Paste API key (e.g. sk-...)", aiSaveBtn: "Save AI settings",
    recSum: "🔁 Recurring expenses (rent, internet...)",
    recNote: "Declare fixed monthly costs. Each month mom reminds and logs them for you.",
    recNamePh: "Name (e.g. Rent)", recAmountPh: "Amount", recDayPh: "Day",
    pieTitle: "Where the money goes 🥧", thisMonth: "This month", allTime: "All time",
    barTitle: "Spending, last 6 months 📊", compareTitle: "This month vs last month 📈",
    summaryBtn: "📅 Last month's summary", savingRate: "Savings rate this month",
    pieEmpty: "No expenses to chart yet. Spend something and I'll draw it 🤨",
    barEmpty: "No data yet. Spend a few more months and check back.",
    footer: "Your data stays on your device. Mom doesn't store it in the cloud, only in her heart 💚",
    shareTrigger: "📸 Share the verdict",
    shareTitle: 'Show off your "achievement" 📸', shareNow: "📤 Share now",
    downloadImg: "⬇️ Save image", copyCap: "📋 Copy caption",
    editTitle: "Edit this entry ✏️", essential: "Essential?", essNoShort: "😋 No", essYesShort: "🧾 Yes",
    editSave: "Save changes", share: "📤 Share", copy: "📋 Copy",
    onboardSkip: "Skip", onboardNext: "Next →", onboardStart: "Start 🎉",
    settingsTitle: "⚙️ Settings", settingsOpen: "⚙️ Settings & customization →",
    navCatBudget: "Category budgets", navCurrency: "Currency", navRecurring: "Recurring",
    navData: "Data & backup", navScold: "Your scoldings", navChar: "Custom character", navAI: "AI mode",
  },
};
function tr(k) { return (I18N[state.lang] && I18N[state.lang][k]) || I18N.vi[k] || k; }

function applyLang() {
  document.documentElement.lang = state.lang;
  el.langBtn.textContent = state.lang === "en" ? "🇬🇧" : "🇻🇳";
  const setText = (sel, k) => { const e = document.querySelector(sel); if (e) e.textContent = tr(k); };
  const setPh = (id, k) => { if (el[id]) el[id].placeholder = tr(k); };

  setText(".tagline", "tagline");
  setText(".form-card h2", "addEntry");
  const tabs = document.querySelectorAll("#typeTabs .type-tab");
  if (tabs[0]) tabs[0].textContent = tr("expense");
  if (tabs[1]) tabs[1].textContent = tr("income");
  if (tabs[2]) tabs[2].textContent = tr("saving");
  setText('label[for="amountInput"]', "amount");
  setText('label[for="noteInput"]', "note");
  setText("#categoryField label", "category");
  setText("#essentialField label", "essentialQ");
  const ess = document.querySelectorAll("#essentialToggle .ess-btn");
  if (ess[0]) ess[0].textContent = tr("essNo");
  if (ess[1]) ess[1].textContent = tr("essYes");
  setText("#addBtn", "addBtn");
  setText(".history-card h2", "ledger");
  setText("#clearBtn", "clearAll");
  setPh("searchInput", "searchPh");
  setPh("amountInput", "amountPh");
  setPh("noteInput", "notePh");

  const labels = document.querySelectorAll(".stats .stat-label");
  const order = ["balance", "paidIn", "spent", "piggy", "streak", "combo"];
  labels.forEach((lb, i) => { if (order[i]) lb.textContent = tr(order[i]); });

  setText('label[for="salaryInput"]', "salary");
  setText('label[for="budgetInput"]', "budget");
  setText(".goal-box > label", "goal");
  setText(".ach-card h2", "achievements");

  setText("#saveSalaryBtn", "save");
  setText("#saveBudgetBtn", "save");
  setText("#saveGoalBtn", "save");
  setPh("salaryInput", "salaryPh");
  setPh("budgetInput", "budgetPh");
  setPh("goalName", "goalNamePh");
  setPh("goalTarget", "goalTargetPh");
  if (!(state.salary > 0)) setText("#salaryHint", "salaryHint");

  // Trang cài đặt: tiêu đề, nav, panel
  setText("#settingsTitle", "settingsTitle");
  const navLabel = (panel, k) => setText(`.snav-item[data-panel="${panel}"] span`, k);
  navLabel("catbudget", "navCatBudget");
  navLabel("currency", "navCurrency");
  navLabel("recurring", "navRecurring");
  navLabel("data", "navData");
  navLabel("scold", "navScold");
  navLabel("char", "navChar");
  navLabel("ai", "navAI");

  setText("#panel-catbudget .panel-title", "catBudgetSum");
  setText("#panel-currency .panel-title", "currencySum");
  setText("#panel-currency .settings-note", "currencyNote");
  setText("#panel-recurring .panel-title", "recSum");
  setText("#panel-recurring .settings-note", "recNote");
  setPh("recName", "recNamePh");
  setPh("recAmount", "recAmountPh");
  setPh("recDay", "recDayPh");
  setText("#addRecBtn", "add");
  setText("#panel-data .panel-title", "dataSum");
  setText("#panel-data .settings-note", "dataNote");
  setText("#exportBtn", "exportBtn");
  setText("#importBtn", "importBtn");
  setText("#resetBtn", "resetBtn");
  setText("#panel-scold .panel-title", "scoldSum");
  setText("#panel-scold .settings-note", "scoldNote");
  setPh("scoldInput", "scoldPh");
  setText("#addScoldBtn", "add");
  setText("#panel-char .panel-title", "charSum");
  setText("#panel-char .settings-note", "charNote");
  setPh("charName", "charNamePh");
  setPh("charScold", "charScoldPh");
  setPh("charPraise", "charPraisePh");
  setText("#addCharBtn", "addChar");
  setText("#panel-ai .panel-title", "aiSum");
  setText("#panel-ai .ai-note", "aiNote");
  setPh("aiKey", "aiKeyPh");
  setText("#aiSaveBtn", "aiSaveBtn");
  setText("#settingsBtn", "settingsOpen");
  const aiToggle = document.querySelector(".ai-toggle");
  if (aiToggle) aiToggle.lastChild.textContent = " " + tr("aiEnable");

  setText(".analytics .chart-card:first-child .chart-head h2", "pieTitle");
  setText(".analytics .chart-card:nth-child(2) h2", "barTitle");
  setText(".chart-card.compare .chart-head h2", "compareTitle");
  const pr = document.querySelectorAll("#pieRange .range-tab");
  if (pr[0]) pr[0].textContent = tr("thisMonth");
  if (pr[1]) pr[1].textContent = tr("allTime");
  setText("#summaryBtn", "summaryBtn");
  setText(".saving-rate-head span:first-child", "savingRate");
  setText("#pieEmpty", "pieEmpty");
  setText("#barEmpty", "barEmpty");
  setText(".footer p", "footer");
  setText("#shareBtn", "shareTrigger");

  setText("#shareModal h3", "shareTitle");
  setText("#shareNative", "shareNow");
  setText("#shareDownload", "downloadImg");
  setText("#shareCopy", "copyCap");
  setText("#editModal h3", "editTitle");
  setText("#editEssentialField label", "essential");
  const eess = document.querySelectorAll("#editEssentialToggle .ess-btn");
  if (eess[0]) eess[0].textContent = tr("essNoShort");
  if (eess[1]) eess[1].textContent = tr("essYesShort");
  setText("#editSaveBtn", "editSave");
  setText("#summaryShare", "share");
  setText("#summaryDownload", "downloadImg");
  setText("#summaryCopy", "copy");
  setText("#onboardSkip", "onboardSkip");

  if (el.filterType) {
    el.filterType.options[0].textContent = tr("allTypes");
    el.filterType.options[1].textContent = tr("expense");
    el.filterType.options[2].textContent = tr("income");
    el.filterType.options[3].textContent = tr("saving");
  }
  if (el.filterCategory && el.filterCategory.options[0]) el.filterCategory.options[0].textContent = tr("allCats");
}

function toggleLang() {
  state.lang = state.lang === "en" ? "vi" : "en";
  save();
  applyLang();
  pickVoice();
  renderMood();
  renderCategoryGrid();
  renderHistory();
  renderAnalytics();
  renderCatBudgets();
  populateFilterCategories();
  el.filterCategory.value = filters.category;
  el.filterType.value = filters.type;
  lastReaction = { text: getMood(state.mood).idle, tone: null, mood: state.mood };
  el.momMessage.textContent = lastReaction.text;
}

// ---- Events ----
function bindEvents() {
  el.addBtn.addEventListener("click", addTransaction);

  // Enter để thêm nhanh
  [el.amountInput, el.noteInput].forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addTransaction();
    });
  });

  // Auto format số tiền khi gõ
  el.amountInput.addEventListener("input", (e) => {
    const pos = e.target.value.length;
    e.target.value = formatNumberInput(e.target.value);
  });
  el.salaryInput.addEventListener("input", (e) => {
    e.target.value = formatNumberInput(e.target.value);
  });

  el.saveSalaryBtn.addEventListener("click", saveSalary);
  el.salaryInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveSalary();
  });

  el.typeTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".type-tab");
    if (btn) setType(btn.dataset.type);
  });

  el.essentialToggle.addEventListener("click", (e) => {
    const btn = e.target.closest(".ess-btn");
    if (btn) setEssential(btn.dataset.essential === "true");
  });

  // Danh mục
  el.categoryGrid.addEventListener("click", (e) => {
    const btn = e.target.closest(".cat-btn");
    if (btn) setCategory(btn.dataset.cat);
  });

  // Tab phạm vi biểu đồ tròn
  el.pieRange.addEventListener("click", (e) => {
    const btn = e.target.closest(".range-tab");
    if (!btn) return;
    pieRangeMode = btn.dataset.range;
    document.querySelectorAll("#pieRange .range-tab").forEach((b) => {
      b.classList.toggle("active", b.dataset.range === pieRangeMode);
    });
    renderPie();
  });

  el.historyList.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".item-edit");
    if (editBtn) { openEdit(editBtn.dataset.id); return; }
    const delBtn = e.target.closest(".item-del");
    if (delBtn) deleteTransaction(delBtn.dataset.id);
  });

  el.clearBtn.addEventListener("click", clearAll);
  el.moodBtn.addEventListener("click", toggleMood);

  // Hạn mức
  el.saveBudgetBtn.addEventListener("click", saveBudget);
  el.budgetInput.addEventListener("input", (e) => {
    e.target.value = formatNumberInput(e.target.value);
  });
  el.budgetInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveBudget();
  });

  // Âm thanh
  el.soundBtn.addEventListener("click", toggleSound);

  // AI
  el.aiSaveBtn.addEventListener("click", saveAI);

  // Chia sẻ
  el.shareBtn.addEventListener("click", openShareModal);
  el.shareClose.addEventListener("click", closeShareModal);
  el.shareModal.addEventListener("click", (e) => {
    if (e.target === el.shareModal) closeShareModal();
  });
  el.shareNative.addEventListener("click", shareNative);
  el.shareDownload.addEventListener("click", downloadImage);
  el.shareCopy.addEventListener("click", copyCaption);

  // Theme, PWA, onboarding
  el.themeBtn.addEventListener("click", toggleTheme);
  el.installBtn.addEventListener("click", doInstall);
  el.onboardNext.addEventListener("click", nextOnboard);
  el.onboardSkip.addEventListener("click", finishOnboard);

  // Mục tiêu tiết kiệm
  el.saveGoalBtn.addEventListener("click", saveGoal);
  el.goalTarget.addEventListener("input", (e) => { e.target.value = formatNumberInput(e.target.value); });
  el.goalTarget.addEventListener("keydown", (e) => { if (e.key === "Enter") saveGoal(); });

  // Hạn mức theo danh mục
  el.catBudgetBody.addEventListener("input", (e) => {
    const inp = e.target.closest("input[data-cat]");
    if (!inp) return;
    inp.value = formatNumberInput(inp.value);
    state.catBudgets[inp.dataset.cat] = parseAmount(inp.value);
    save();
  });

  // Tiền tệ
  el.currencySelect.addEventListener("change", (e) => setCurrency(e.target.value));

  // Chi tiêu định kỳ
  el.addRecBtn.addEventListener("click", addRecurring);
  el.recAmount.addEventListener("input", (e) => { e.target.value = formatNumberInput(e.target.value); });
  el.recurringList.addEventListener("click", (e) => {
    const applyBtn = e.target.closest(".rec-apply");
    if (applyBtn) { applyRecurring(applyBtn.dataset.id); return; }
    const delBtn = e.target.closest(".rec-del");
    if (delBtn) deleteRecurring(delBtn.dataset.id);
  });

  // Lọc & tìm kiếm
  el.searchInput.addEventListener("input", (e) => { filters.search = e.target.value; renderHistory(); });
  el.filterType.addEventListener("change", (e) => { filters.type = e.target.value; renderHistory(); });
  el.filterCategory.addEventListener("change", (e) => { filters.category = e.target.value; renderHistory(); });

  // Sửa giao dịch
  el.editClose.addEventListener("click", closeEdit);
  el.editModal.addEventListener("click", (e) => { if (e.target === el.editModal) closeEdit(); });
  el.editAmount.addEventListener("input", (e) => { e.target.value = formatNumberInput(e.target.value); });
  el.editCategoryGrid.addEventListener("click", (e) => {
    const btn = e.target.closest(".cat-btn");
    if (btn) { editing.category = btn.dataset.cat; renderEditCategory(); }
  });
  el.editEssentialToggle.addEventListener("click", (e) => {
    const btn = e.target.closest(".ess-btn");
    if (btn) { editing.essential = btn.dataset.essential === "true"; renderEditEssential(); }
  });
  el.editSaveBtn.addEventListener("click", saveEdit);

  // Dữ liệu: xuất / nhập / reset
  el.exportBtn.addEventListener("click", exportData);
  el.importBtn.addEventListener("click", () => el.importFile.click());
  el.importFile.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) importData(e.target.files[0]);
    e.target.value = "";
  });
  el.resetBtn.addEventListener("click", resetAll);

  // Tổng kết tháng
  el.summaryBtn.addEventListener("click", openSummaryPrevMonth);
  el.summaryClose.addEventListener("click", () => el.summaryModal.classList.remove("show"));
  el.summaryModal.addEventListener("click", (e) => { if (e.target === el.summaryModal) el.summaryModal.classList.remove("show"); });
  el.summaryShare.addEventListener("click", shareSummary);
  el.summaryDownload.addEventListener("click", downloadSummary);
  el.summaryCopy.addEventListener("click", copySummary);

  // TTS & ngôn ngữ
  el.ttsBtn.addEventListener("click", toggleTTS);
  el.langBtn.addEventListener("click", toggleLang);

  // Câu mắng tự viết
  el.addScoldBtn.addEventListener("click", addScold);
  el.scoldInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addScold(); });
  el.scoldList.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-i]");
    if (btn) deleteScold(parseInt(btn.dataset.i, 10));
  });

  // Nhân vật tự tạo
  el.addCharBtn.addEventListener("click", addChar);
  el.charList.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-id]");
    if (btn) deleteChar(btn.dataset.id);
  });

  // Trang cài đặt
  el.settingsBtn.addEventListener("click", openSettings);
  el.settingsClose.addEventListener("click", closeSettings);
  const settingsBtnTop = document.getElementById("settingsBtnTop");
  if (settingsBtnTop) settingsBtnTop.addEventListener("click", openSettings);
  el.settingsNav.addEventListener("click", (e) => {
    const btn = e.target.closest(".snav-item");
    if (btn) switchPanel(btn.dataset.panel);
  });
}

// ---- Init ----
function init() {
  load();
  bindEvents();
  renderMood();
  renderSalary();
  renderStats();
  renderHistory();
  renderBudget();
  renderCategoryGrid();
  renderAnalytics();
  renderStreakCombo();
  renderAchievements();
  checkAchievements(true); // mở khóa lại các huy hiệu đã đạt, không báo
  renderGoal();
  renderCatBudgets();
  renderRecurring();
  populateFilterCategories();
  setType(state.ui.type);
  setEssential(state.ui.essential);
  // Khôi phục trạng thái âm thanh
  el.soundBtn.textContent = state.soundOn ? "🔊" : "🔇";
  el.soundBtn.classList.toggle("muted", !state.soundOn);
  // Khôi phục ô hạn mức
  if (state.budget > 0) {
    el.budgetInput.value = new Intl.NumberFormat("vi-VN").format(state.budget);
  }
  // Khôi phục cài đặt AI
  el.aiEnabled.checked = !!state.ai.enabled;
  el.aiKey.value = state.ai.key || "";
  // Khôi phục mục tiêu & tiền tệ
  if (state.goal.name) el.goalName.value = state.goal.name;
  if (state.goal.target > 0) el.goalTarget.value = new Intl.NumberFormat("vi-VN").format(state.goal.target);
  el.currencySelect.value = state.currency;
  // Theme + PWA
  applyTheme();
  setupPWA();
  // TTS, ngôn ngữ, câu mắng & nhân vật tự tạo
  el.ttsBtn.textContent = state.ttsOn ? "🗣️" : "🤐";
  el.ttsBtn.classList.toggle("muted", !state.ttsOn);
  renderScoldList();
  renderCharList();
  applyLang();
  // Lời chào mở màn
  lastReaction = { text: getMood(state.mood).idle, tone: null, mood: state.mood };
  el.momMessage.textContent = getMood(state.mood).idle;
  // Nhắc chi tiêu định kỳ tới hạn
  remindRecurringDue();
  // Nhắc khai báo hằng ngày
  dailyReminder();
  // Onboarding lần đầu / tổng kết đầu tháng
  if (!state.onboardingDone) {
    setTimeout(openOnboard, 400);
  } else {
    autoMonthlySummary();
  }
}

init();
