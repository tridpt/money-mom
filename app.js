// =====================================================================
// Mẹ Thiên Hạ - App logic
// =====================================================================

const STORE_KEY = "meThienHa_v1";

// ---- State ----
let state = {
  salary: 0,
  budget: 0,
  soundOn: true,
  mood: "mom", // "mom" | "ex"
  transactions: [], // { id, type, amount, note, essential, ts }
  ui: {
    type: "expense", // expense | income | saving
    essential: false,
  },
};

// Lời mẹ phán gần nhất (để chia sẻ)
let lastReaction = { text: MESSAGES.mom.idle, tone: null, mood: "mom" };

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
};

const APP_URL = "https://tridpt.github.io/money-mom/";

// ---- Helpers ----
function formatVND(n) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n)) + "₫";
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
  if (state.transactions.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-state";
    li.textContent = "Chưa có gì cả. Hôm nay ngoan thế? 🤨";
    el.historyList.appendChild(li);
    return;
  }
  // Mới nhất lên đầu
  const sorted = [...state.transactions].sort((a, b) => b.ts - a.ts);
  for (const t of sorted) {
    const li = document.createElement("li");
    li.className = "history-item";
    const date = new Date(t.ts);
    const dateStr = date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) +
      " " + date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const tag = t.type === "expense" ? (t.essential ? " · Thiết yếu" : " · Không thiết yếu") : "";
    const sign = t.type === "income" ? "+" : "-";

    li.innerHTML = `
      <span class="item-icon">${TYPE_ICON[t.type]}</span>
      <div class="item-body">
        <div class="item-note">${escapeHtml(t.note || TYPE_LABEL[t.type])}</div>
        <div class="item-meta">${TYPE_LABEL[t.type]}${tag} · ${dateStr}</div>
      </div>
      <span class="item-amount ${t.type}">${sign}${formatVND(t.amount)}</span>
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
  const m = MESSAGES[state.mood];
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
  const m = MESSAGES[state.mood];
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
      text = pickMessage(m.scold, vars);
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
  }

  lastReaction = { text, tone, mood: state.mood };
  speak(text, tone);
  if (sound) playSound(sound);
}

const OVER_BUDGET_LINES = [
  "VÀ CON VƯỢT HẠN MỨC THÁNG NÀY RỒI ĐẤY! Mẹ tức á!",
  "Hạn mức cháy rồi nha, giờ thì cạp đất thật chứ không đùa!",
  "Đã bảo bao nhiêu lần rồi, tiêu quá ngân sách rồi con ơi!",
  "Mẹ đặt hạn mức cho có lệ thôi à? Vượt rồi kìa!",
];
function OVER_BUDGET_LINE() {
  return OVER_BUDGET_LINES[Math.floor(Math.random() * OVER_BUDGET_LINES.length)];
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
    ts: Date.now(),
  };

  state.transactions.push(t);
  save();
  renderStats();
  renderHistory();
  renderBudget();
  reactTo(t);

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
}

function clearAll() {
  if (state.transactions.length === 0) return;
  if (!confirm("Xóa hết sổ chi tiêu? Mẹ sẽ quên hết tội của con đấy.")) return;
  state.transactions = [];
  save();
  renderStats();
  renderHistory();
  renderBudget();
  speak("Xóa sạch rồi. Coi như mẹ tha cho con lần này. Làm lại từ đầu nha.", "praise");
}

function setType(type) {
  state.ui.type = type;
  document.querySelectorAll(".type-tab").forEach((b) => {
    b.classList.toggle("active", b.dataset.type === type);
  });
  // Chỉ hiện toggle thiết yếu khi là chi tiêu
  el.essentialField.style.display = type === "expense" ? "" : "none";
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
  state.mood = state.mood === "mom" ? "ex" : "mom";
  save();
  renderMood();
  const m = MESSAGES[state.mood];
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
  const m = MESSAGES[lastReaction.mood] || MESSAGES.mom;

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
  return `"${lastReaction.text}"\n\n— ${MESSAGES[lastReaction.mood].label} phán 😤\nQuản lý tài chính kiểu bị mắng mới chịu tiết kiệm 💸\nThử đi: ${APP_URL}`;
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

  el.historyList.addEventListener("click", (e) => {
    const btn = e.target.closest(".item-del");
    if (btn) deleteTransaction(btn.dataset.id);
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

  // Chia sẻ
  el.shareBtn.addEventListener("click", openShareModal);
  el.shareClose.addEventListener("click", closeShareModal);
  el.shareModal.addEventListener("click", (e) => {
    if (e.target === el.shareModal) closeShareModal();
  });
  el.shareNative.addEventListener("click", shareNative);
  el.shareDownload.addEventListener("click", downloadImage);
  el.shareCopy.addEventListener("click", copyCaption);
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
  setType(state.ui.type);
  setEssential(state.ui.essential);
  // Khôi phục trạng thái âm thanh
  el.soundBtn.textContent = state.soundOn ? "🔊" : "🔇";
  el.soundBtn.classList.toggle("muted", !state.soundOn);
  // Khôi phục ô hạn mức
  if (state.budget > 0) {
    el.budgetInput.value = new Intl.NumberFormat("vi-VN").format(state.budget);
  }
  // Lời chào mở màn
  lastReaction = { text: MESSAGES[state.mood].idle, tone: null, mood: state.mood };
  el.momMessage.textContent = MESSAGES[state.mood].idle;
}

init();
