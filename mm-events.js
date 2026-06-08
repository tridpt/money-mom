// ====== mm-events.js (tách từ app.js) ======
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

  // Game hóa & tương tác
  el.argueBtn.addEventListener("click", argue);
  el.apologizeBtn.addEventListener("click", apologize);
  el.dailyBtn.addEventListener("click", showDailyRoast);
  el.begBtn.addEventListener("click", openBeg);
  el.begClose.addEventListener("click", () => el.begModal.classList.remove("show"));
  el.begModal.addEventListener("click", (e) => { if (e.target === el.begModal) el.begModal.classList.remove("show"); });
  el.begAskBtn.addEventListener("click", doBeg);
  el.begLogBtn.addEventListener("click", logBegItem);
  el.begAmount.addEventListener("input", (e) => { e.target.value = formatNumberInput(e.target.value); });
}
