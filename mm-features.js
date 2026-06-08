// ====== mm-features.js (tách từ app.js) ======
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
  el.summaryTitle.textContent = `Tổng kết Tháng ${month + 1}/${year}`;
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

