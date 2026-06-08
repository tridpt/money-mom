// ====== mm-ui.js (tách từ app.js) ======
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
    argue: "😤 Cãi lại", apologize: "🙇 Xin lỗi mẹ", beg: "💸 Xin tiền mẹ", daily: "📜 Câu hôm nay",
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
    argue: "😤 Argue back", apologize: "🙇 Apologize", beg: "💸 Beg mom", daily: "📜 Daily roast",
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
  setText("#apologizeBtn", "apologize");
  setText("#begBtn", "beg");
  setText("#dailyBtn", "daily");
  if (el.argueBtn && el.argueBtn.style.display !== "none") setText("#argueBtn", "argue");
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
  renderMoodMeter();
  renderLevel();
  renderChallenge();
  lastReaction = { text: getMood(state.mood).idle, tone: null, mood: state.mood };
  el.momMessage.textContent = lastReaction.text;
}

// ---- Game hóa: cấp độ "đệ tử tiết kiệm" ----
const LEVELS = [
  { min: 0, title: "Tập sự giữ ví" },
  { min: 80, title: "Học việc tiết kiệm" },
  { min: 200, title: "Thợ giữ tiền" },
  { min: 450, title: "Cao thủ giữ ví" },
  { min: 800, title: "Bậc thầy tiết kiệm" },
  { min: 1400, title: "Đại sư keo kiệt" },
  { min: 2200, title: "Thần giữ của" },
];
const LEVELS_EN = ["Rookie Saver", "Saving Apprentice", "Coin Keeper", "Wallet Master", "Saving Sage", "Frugal Grandmaster", "God of Thrift"];

function levelInfo() {
  const xp = state.xp || 0;
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].min) idx = i;
  const next = LEVELS[idx + 1];
  return {
    idx,
    title: state.lang === "en" ? LEVELS_EN[idx] : LEVELS[idx].title,
    prevMin: LEVELS[idx].min,
    nextMin: next ? next.min : LEVELS[idx].min,
    xp,
    hasNext: !!next,
  };
}

function renderLevel() {
  const i = levelInfo();
  el.levelBadge.textContent = "Lv" + (i.idx + 1);
  el.levelTitle.textContent = i.title;
  let pct, txt;
  if (i.hasNext) {
    pct = ((i.xp - i.prevMin) / (i.nextMin - i.prevMin)) * 100;
    txt = `${i.xp} / ${i.nextMin} XP`;
  } else { pct = 100; txt = `${i.xp} XP (MAX)`; }
  el.xpFill.style.width = Math.min(Math.max(pct, 0), 100) + "%";
  el.levelXp.textContent = txt;
}

function gainXp(n) {
  if (!n || n <= 0) return;
  const before = levelInfo().idx;
  state.xp = (state.xp || 0) + n;
  save();
  const after = levelInfo().idx;
  renderLevel();
  if (after > before) {
    setTimeout(() => {
      showToast(`🎉 ${state.lang === "en" ? "Level up! You're now" : "Lên cấp! Giờ bạn là"} "${levelInfo().title}"`, "praise");
      playSound("praise");
      fireConfetti();
    }, 1500);
  }
}

// ---- Thử thách tuần ----
const CHALLENGES = [
  { id: "save500", reward: 50, vi: "Bỏ heo tổng ≥ 500.000 tuần này", en: "Save ≥ 500,000 total this week",
    eval: (w) => { const s = w.filter((t) => t.type === "saving").reduce((a, t) => a + t.amount, 0); return { done: s >= 500000, text: `${formatVND(s)} / ${formatVND(500000)}` }; } },
  { id: "save3x", reward: 40, vi: "Bỏ ống ít nhất 3 lần tuần này", en: "Save into the piggy bank ≥ 3 times this week",
    eval: (w) => { const c = w.filter((t) => t.type === "saving").length; return { done: c >= 3, text: `${c}/3 lần` }; } },
  { id: "log4d", reward: 30, vi: "Ghi chép ít nhất 4 ngày khác nhau", en: "Log on at least 4 different days",
    eval: (w) => { const d = new Set(w.map((t) => new Date(t.ts).toDateString())); return { done: d.size >= 4, text: `${d.size}/4 ngày` }; } },
  { id: "streak3", reward: 40, vi: "Giữ 3 ngày liên tiếp không tiêu hoang", en: "Keep a 3-day no-splurge streak",
    eval: () => { const s = computeStreak(); return { done: s >= 3, text: `${s}/3 ngày` }; } },
  { id: "income", reward: 25, vi: "Ghi nhận thu nhập tuần này", en: "Record some income this week",
    eval: (w) => { const c = w.filter((t) => t.type === "income").length; return { done: c >= 1, text: `${c}/1` }; } },
];

function weekStartMs() {
  const x = new Date();
  const day = (x.getDay() + 6) % 7; // 0 = thứ Hai
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x.getTime();
}
function weekKeyNow() { return new Date(weekStartMs()).toISOString().slice(0, 10); }
function weekTx() { const s = weekStartMs(); return state.transactions.filter((t) => t.ts >= s); }
function pickChallengeId(key) {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CHALLENGES[h % CHALLENGES.length].id;
}
function ensureChallenge() {
  const wk = weekKeyNow();
  if (!state.challenge || state.challenge.weekKey !== wk) {
    state.challenge = { weekKey: wk, id: pickChallengeId(wk), claimed: false };
    save();
  }
}
function currentChallenge() { return CHALLENGES.find((c) => c.id === state.challenge.id) || CHALLENGES[0]; }

function renderChallenge() {
  ensureChallenge();
  const c = currentChallenge();
  const r = c.eval(weekTx());
  el.challengeLabel.textContent = state.lang === "en" ? "Weekly challenge" : "Thử thách tuần";
  el.challengeDesc.textContent = state.lang === "en" ? c.en : c.vi;
  if (state.challenge.claimed) {
    el.challengeStatus.textContent = `✅ ${state.lang === "en" ? "Done! +" : "Hoàn thành! +"}${c.reward} XP`;
  } else if (r.done) {
    el.challengeStatus.textContent = state.lang === "en" ? "🎁 Achieved! Log one more entry to claim" : "🎁 Đạt rồi! Ghi thêm 1 khoản để nhận thưởng";
  } else {
    el.challengeStatus.textContent = (state.lang === "en" ? "Progress: " : "Tiến độ: ") + r.text;
  }
}
function checkChallengeComplete() {
  ensureChallenge();
  if (state.challenge.claimed) return;
  const c = currentChallenge();
  if (c.eval(weekTx()).done) {
    state.challenge.claimed = true;
    save();
    gainXp(c.reward);
    setTimeout(() => {
      showToast(`🎯 ${state.lang === "en" ? "Weekly challenge complete! +" : "Hoàn thành thử thách tuần! +"}${c.reward} XP`, "praise");
      playSound("praise");
      fireConfetti();
    }, 700);
    renderChallenge();
  }
}

// ---- Cãi lại / Xin lỗi ----
const BANTER = [
  ["Cãi à? Nuôi con lớn để con cãi lại mẹ đấy hả?", "Giỏi cãi nhỉ? Tiếc là cãi không ra tiền con ạ."],
  ["Còn cãi nữa? Lý sự thì nhiều mà ví thì rỗng.", "Mẹ nói một con cãi mười, sao hồi đi học không giỏi vậy?"],
  ["Thôi mẹ thua cái mồm con. Nhưng cuối tháng con vẫn thua cái ví nha.", "Được, con thắng. Phần thưởng là tự trả nợ một mình."],
];
let banterRound = 0;
function argue() {
  const r = Math.min(banterRound, BANTER.length - 1);
  const line = BANTER[r][Math.floor(Math.random() * BANTER[r].length)];
  banterRound++;
  adjustAnger(6);
  speak(line, "scold");
  if (banterRound >= BANTER.length) { el.argueBtn.style.display = "none"; banterRound = 0; }
}

const APOLOGY = [
  "Biết lỗi là tốt. Combo xóa, mẹ tha. Lần sau liệu hồn nha con.",
  "Ừ, xin lỗi thì mẹ bỏ qua. Nhưng tiền tiêu rồi có xin lại được đâu.",
  "Thôi được, mẹ nguôi rồi. Ngoan thì mẹ thương.",
];
function apologize() {
  state.combo = 0;
  adjustAnger(-25);
  renderStreakCombo();
  el.argueBtn.style.display = "none";
  banterRound = 0;
  speak(APOLOGY[Math.floor(Math.random() * APOLOGY.length)], "praise");
}

// ---- Mini-game: xin tiền mẹ ----
const BEG_OK = [
  "Thôi được, lần này mẹ cho. Nhưng đây là lần CUỐI đấy nha!",
  "Ừ thì... con nói cũng có lý. Cầm tiền đi, đừng phá.",
  "Mẹ mềm lòng rồi đó. Mua {note} đi rồi liệu mà tiết kiệm bù.",
];
const BEG_NO = [
  "Mơ đi con. Tiền đâu mẹ cho con mua {note}?",
  "Không. {amount} cho {note}? Mẹ thà cho con một cái lắc đầu.",
  "Xin xỏ giỏi ghê. Nhưng câu trả lời là KHÔNG.",
  "Con tự đi mà kiếm. Mẹ đâu phải cây ATM của con.",
];
let begPending = null;
function openBeg() {
  el.begResult.textContent = "";
  el.begResult.className = "beg-result";
  el.begLogBtn.style.display = "none";
  begPending = null;
  el.begModal.classList.add("show");
}
function doBeg() {
  const item = el.begItem.value.trim() || "món đó";
  const amount = parseAmount(el.begAmount.value);
  const vars = { amount: formatVND(amount || 0), note: item };
  let chance = 0.5;
  if (amount >= 10000000) chance -= 0.28;
  else if (amount >= 2000000) chance -= 0.12;
  chance -= state.anger / 300;
  const ok = Math.random() < Math.max(0.08, chance);
  if (ok) {
    el.begResult.className = "beg-result ok";
    el.begResult.textContent = applyVoice(pickMessage(BEG_OK, vars));
    adjustAnger(-3);
    if (amount > 0) { el.begLogBtn.style.display = ""; begPending = { item, amount }; }
  } else {
    el.begResult.className = "beg-result no";
    el.begResult.textContent = applyVoice(pickMessage(BEG_NO, vars));
    el.begLogBtn.style.display = "none";
    adjustAnger(4);
  }
}
function logBegItem() {
  if (!begPending) return;
  el.begModal.classList.remove("show");
  setType("expense");
  setEssential(false);
  el.amountInput.value = new Intl.NumberFormat("vi-VN").format(begPending.amount);
  el.noteInput.value = begPending.item;
  begPending = null;
  addTransaction();
}

// ---- Ngày lễ ----
const HOLIDAYS = {
  "01-01": "Chúc mừng năm mới! Năm nay nhớ tiết kiệm nha con, đừng để mẹ phải la nhiều.",
  "02-14": "Valentine à? Người yêu thì chưa chắc có mà tiền thì sắp hết rồi con ơi.",
  "03-08": "8/3 vui vẻ con gái! Hôm nay mẹ tha, nhưng mai tính tiếp nha.",
  "10-20": "20/10 nha! Hôm nay con tiêu mẹ cũng không nỡ la... nhiều.",
  "12-24": "Giáng sinh an lành! Quà cáp vừa phải thôi con nhé.",
  "12-25": "Merry Christmas! Ông già Noel không trả nợ giùm con đâu đấy.",
};
const HOLIDAYS_EN = {
  "01-01": "Happy New Year! Save more this year, don't make me nag so much.",
  "02-14": "Valentine's? You might not have a date, but your wallet sure is empty.",
  "12-25": "Merry Christmas! Santa won't pay off your debt, you know.",
};
function holidayGreeting() {
  const tet = tetGreeting();
  if (tet) return tet;
  const d = new Date();
  const k = String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  if (state.lang === "en") return HOLIDAYS_EN[k] || null;
  return HOLIDAYS[k] || null;
}

// Tết âm lịch: ngày mùng 1 (dương lịch) các năm
const TET_MUNG1 = {
  2025: "2025-01-29", 2026: "2026-02-17", 2027: "2027-02-06", 2028: "2028-01-26",
  2029: "2029-02-13", 2030: "2030-02-03", 2031: "2031-01-23", 2032: "2032-02-11",
};
function tetGreeting() {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const s = TET_MUNG1[now.getFullYear()];
  if (!s) return null;
  const m1 = new Date(s + "T00:00:00");
  const diff = Math.round((now.getTime() - m1.getTime()) / 86400000);
  if (diff === -1) {
    return state.lang === "en"
      ? "New Year's Eve! I'll forgive all the overspending this year. Be good next year, dear."
      : "Giao thừa rồi con! Năm cũ con tiêu hoang bao nhiêu mẹ bỏ qua hết. Năm mới nhớ ngoan nha.";
  }
  if (diff >= 0 && diff <= 2) {
    return state.lang === "en"
      ? "Happy Lunar New Year! No scolding today — may money flow in. But keep your lucky money safe, okay?"
      : "Chúc mừng năm mới! Hôm nay mẹ không la đâu, chúc con tiền vào như nước. Mà lì xì nhớ cất kỹ, đừng nướng sạch nha con!";
  }
  return null;
}

// ---- Câu mắng của ngày (cố định theo ngày) ----
function showDailyRoast() {
  const d = new Date();
  const seed = d.getFullYear() * 1000 + d.getMonth() * 31 + d.getDate();
  const pool = getMood(state.mood).scold;
  const raw = pool[seed % pool.length];
  const text = raw.replace(/\{amount\}/g, "kha khá").replace(/\{note\}/g, "thứ đó");
  lastReaction = { text: applyVoice(text), tone: "scold", mood: state.mood };
  speak(lastReaction.text, "scold");
}
