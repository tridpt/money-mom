// =====================================================================
// Mẹ Thiên Hạ - App logic
// =====================================================================

const STORE_KEY = "meThienHa_v1";

// ---- State ----
let state = {
  salary: 0,
  mood: "mom", // "mom" | "ex"
  transactions: [], // { id, type, amount, note, essential, ts }
  ui: {
    type: "expense", // expense | income | saving
    essential: false,
  },
};

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
};

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
  let text, tone;

  if (transaction.type === "saving") {
    text = pickMessage(m.praise, vars);
    tone = "praise";
  } else if (transaction.type === "income") {
    text = pickMessage(m.income, vars);
    tone = "praise";
  } else {
    // expense
    if (transaction.essential) {
      text = pickMessage(m.essential, vars);
      tone = null;
    } else {
      text = pickMessage(m.scold, vars);
      tone = "scold";
    }
  }
  speak(text, tone);
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
}

function clearAll() {
  if (state.transactions.length === 0) return;
  if (!confirm("Xóa hết sổ chi tiêu? Mẹ sẽ quên hết tội của con đấy.")) return;
  state.transactions = [];
  save();
  renderStats();
  renderHistory();
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
  speak(m.idle, null);
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
}

// ---- Init ----
function init() {
  load();
  bindEvents();
  renderMood();
  renderSalary();
  renderStats();
  renderHistory();
  setType(state.ui.type);
  setEssential(state.ui.essential);
  // Lời chào mở màn
  el.momMessage.textContent = MESSAGES[state.mood].idle;
}

init();
