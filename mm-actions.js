// ====== mm-actions.js (tách từ app.js) ======
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
  adjustAnger(angerDelta(t));
  reactTo(t);
  checkAchievements();

  // XP & thử thách tuần
  let xpGain = 2;
  if (t.type === "saving") xpGain += Math.max(5, Math.min(60, Math.round(t.amount / 100000)));
  else if (t.type === "income") xpGain += 3;
  gainXp(xpGain);
  checkChallengeComplete();
  renderChallenge();

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
  state.anger = 35;
  save();
  renderStats();
  renderHistory();
  renderBudget();
  renderAnalytics();
  renderStreakCombo();
  renderGoal();
  renderCatBudgets();
  renderMoodMeter();
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
