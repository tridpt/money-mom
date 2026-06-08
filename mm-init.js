// ====== mm-init.js (tách từ app.js) ======
// ---- Init ----
function init() {
  load();
  decayAngerOnLoad();
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
  renderMoodMeter();
  renderLevel();
  renderChallenge();
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
  // Lời chào mở màn (ưu tiên lời chào ngày lễ)
  const holiday = holidayGreeting();
  const greet = holiday || getMood(state.mood).idle;
  lastReaction = { text: greet, tone: null, mood: state.mood };
  el.momMessage.textContent = applyVoice(greet);
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
