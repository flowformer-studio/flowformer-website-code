/* ==========================================================================
   FlowFormer – Forms Bundle - v2026-02-13-05
   Aus Webflow "Before </body>" ausgelagert (JS only)
   ========================================================================= */

/* ==========================================================================
   (1) Allgemein – Dropdown Placeholder Status
   ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const selectsAll = document.querySelectorAll("select.w-select");
  selectsAll.forEach((sel) => {
    const update = () => {
      const isPlaceholder =
        !sel.value ||
        ((sel.options[sel.selectedIndex]?.textContent || "")
          .trim()
          .toLowerCase()
          .includes("bitte auswählen"));
      sel.classList.toggle("ff-has-value", !isPlaceholder);
    };
    update();
    sel.addEventListener("change", update);
  });
});

/* ==========================================================================
   (2) Vorab-Check – Hauptlogik, Validierung und Error-Utilities
   ========================================================================= */
document.addEventListener("DOMContentLoaded", function () {
  const formWrapper = document.querySelector('[sf="flowformer-vorabcheck"]');
  if (!formWrapper) return;

  const form = formWrapper.querySelector("form");
  if (!form) return;

  // -----------------------------
  // Helpers (Error Handling)
  // -----------------------------
  function getFieldWrapper(el) {
    return (
      (el && el.closest && el.closest(".form_field-wrapper, .multi-form18_field-wrapper")) ||
      (el && el.parentElement) ||
      null
    );
  }

  function setError(wrapper, errorEl, show) {
    if (errorEl) {
      errorEl.style.display = show ? "block" : "none";
      errorEl.style.opacity = show ? "1" : "0";
    }
    if (wrapper) {
      wrapper.classList.toggle("ff-has-error", !!show);
    }
  }

  function isRequiredTextField(el) {
    if (!el) return false;
    const tag = (el.tagName || "").toLowerCase();

    const isReq = !!el.required || el.getAttribute("aria-required") === "true";
    if (!isReq) return false;

    if (tag === "textarea") return true;

    if (tag === "input") {
      const type = (el.type || "text").toLowerCase();
      if (["checkbox", "radio", "submit", "button", "hidden", "file"].includes(type)) return false;
      return true;
    }
    return false;
  }

  function validateRequiredTextFields(scopeEl) {
    const hasDataRequired = !!scopeEl.querySelector('[data-ff-required="true"]');
    const fields = hasDataRequired
      ? Array.from(scopeEl.querySelectorAll('[data-ff-required="true"]'))
          .map((el) => (el.matches("input, textarea") ? el : el.querySelector("input, textarea")))
          .filter(Boolean)
      : Array.from(scopeEl.querySelectorAll("input, textarea")).filter(isRequiredTextField);

    let okAll = true;

    fields.forEach((fieldEl) => {
      const wrap = getFieldWrapper(fieldEl);
      const errEl = wrap ? wrap.querySelector(".form-error-text") : null;

      const hasValue = (fieldEl.value || "").trim() !== "";
      const valid = hasValue && (typeof fieldEl.checkValidity !== "function" || fieldEl.checkValidity());

      setError(wrap, errEl, !valid);
      if (!valid) okAll = false;
    });

    return okAll;
  }

  function clearFieldError(fieldEl) {
    const wrap = getFieldWrapper(fieldEl);
    if (!wrap) return;
    const errEl = wrap.querySelector(".form-error-text");
    setError(wrap, errEl, false);

    if (fieldEl.classList) {
      fieldEl.classList.remove("w--redirected-invalid", "w--redirected-focus");
    }
  }

  // Expose shared helpers for other scripts
  if (!window.ffFormUtils) {
    window.ffFormUtils = {
      getFieldWrapper,
      setError,
      clearFieldError,
      validateRequiredTextFields,
    };
  }

  // ----------------------------------------
  // STEP 2 – "Etwas anderes" (Show/Hide + conditional Pflicht beim Weiter-Klick)
  // ----------------------------------------
  const otherWrapper = formWrapper.querySelector('[data-ff-goal-other-wrapper="true"]');

  const otherToggleInput =
    formWrapper.querySelector('[data-ff-goal-other="true"] input[type="checkbox"]') ||
    formWrapper.querySelector('input[type="checkbox"][data-ff-goal-other="true"]');

  const otherField = otherWrapper
  ? otherWrapper.querySelector('[data-ff-other-input="true"]')
  : null;

  function getOtherErrorRefs() {
    const fieldWrap = otherField ? getFieldWrapper(otherField) : null;
    const errEl =
      (fieldWrap && fieldWrap.querySelector(".form-error-text")) ||
      (otherWrapper && otherWrapper.querySelector(".form-error-text")) ||
      null;
    return { fieldWrap, errEl };
  }

  function resetOtherError() {
    if (!otherField) return;
    const { fieldWrap, errEl } = getOtherErrorRefs();
    setError(fieldWrap, errEl, false);
    otherField.classList.remove("w--redirected-invalid", "w--redirected-focus");
  }

  function setOtherVisibility(show) {
    if (!otherWrapper) return;

    otherWrapper.style.display = show ? "block" : "none";

    if (otherField) {
      otherField.removeAttribute("required");
      if (!show) otherField.value = "";
    }

    resetOtherError();
  }

  // Init
  setOtherVisibility(!!(otherToggleInput && otherToggleInput.checked));

  // Toggle
  if (otherToggleInput) {
    otherToggleInput.addEventListener("change", function () {
      setOtherVisibility(!!otherToggleInput.checked);
    });
  }

  // ----------------------------------------
  // STEP 2 – Ziele: max. 3, mind. 1 Auswahl
  // ----------------------------------------
  const goalCheckboxes = Array.from(
    formWrapper.querySelectorAll(
      '[data-ff-goal="true"] input[type="checkbox"], input[type="checkbox"][data-ff-goal="true"]'
    )
  );

  const goalsNextButton = formWrapper.querySelector('[data-ff-goal-next="true"]');
  const goalsErrorWrapper = formWrapper.querySelector('[data-ff-goal-error="true"]');
  const goalsErrorText =
    (goalsErrorWrapper && goalsErrorWrapper.querySelector(".form-error-text")) ||
    goalsErrorWrapper ||
    null;

  const counterEl = formWrapper.querySelector('[data-ff-goal-counter="true"]');

  if (goalCheckboxes.length > 0 && goalsNextButton) {
    const maxGoals = 3;

    function getSelectedCount() {
      return goalCheckboxes.filter((cb) => cb.checked).length;
    }

  function updateGoalsUI() {
  const count = getSelectedCount();
  const hasSelection = count > 0;

  if (counterEl) counterEl.textContent = String(count);

  if (count >= maxGoals) {
    goalCheckboxes.forEach((cb) => {
      if (!cb.checked) cb.disabled = true;
    });
  } else {
    goalCheckboxes.forEach((cb) => {
      cb.disabled = false;
    });
  }

  if (goalsErrorText && hasSelection) {
    goalsErrorText.style.display = "none";
  }

  if (!goalsNextButton) return;

  goalsNextButton.toggleAttribute("disabled", !hasSelection);
  goalsNextButton.setAttribute("aria-disabled", String(!hasSelection));

  if (!hasSelection) {
    goalsNextButton.classList.add("is-disabled");
    goalsNextButton.style.pointerEvents = "none";
  } else {
    goalsNextButton.classList.remove("is-disabled");
    goalsNextButton.style.pointerEvents = "";
  }
}

function goalsValid() {
  return getSelectedCount() > 0;
}

    goalCheckboxes.forEach((cb) => cb.addEventListener("change", updateGoalsUI));

    goalsNextButton.addEventListener(
      "click",
      function (event) {
        let ok = true;

        // 1) Ziele Pflicht
        if (!goalsValid()) {
          if (goalsErrorText) goalsErrorText.style.display = "block";
          ok = false;
        } else {
          if (goalsErrorText) goalsErrorText.style.display = "none";
        }

        // 2) "Etwas anderes" conditional Pflicht
        if (ok && otherToggleInput && otherToggleInput.checked && otherField) {
          const val = (otherField.value || "").trim();
          const { fieldWrap, errEl } = getOtherErrorRefs();

          if (val === "") {
            setError(fieldWrap, errEl, true);
            ok = false;
          } else {
            setError(fieldWrap, errEl, false);
          }
        } else {
          resetOtherError();
        }

        if (!ok) {
          event.preventDefault();
          event.stopPropagation();
          if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
          return;
        }
      },
      true
    );

    if (otherField) {
      otherField.addEventListener("input", function () {
        if (otherToggleInput && otherToggleInput.checked) resetOtherError();
      });
    }

    updateGoalsUI();
  }

  // ----------------------------------------
  // STEP 3 – Dropdowns + Datenschutz-Checkbox + Required Textfelder
  // ----------------------------------------
  const privacyCheckbox =
    formWrapper.querySelector('[data-ff-privacy="true"] input[type="checkbox"]') ||
    formWrapper.querySelector('input[type="checkbox"][data-ff-privacy="true"]');

  const privacyErrorWrapper = formWrapper.querySelector('[data-ff-privacy-error="true"]');
  const privacyErrorText =
    (privacyErrorWrapper && privacyErrorWrapper.querySelector(".form-error-text")) ||
    privacyErrorWrapper ||
    null;

  const privacySubmitButton = formWrapper.querySelector('[data-ff-privacy-submit="true"]');
  const selects = Array.from(formWrapper.querySelectorAll('select[data-ff-status-select="true"]'));

  // Placeholder nach Auswahl nicht mehr anwählbar
  selects.forEach((select) => {
    const placeholder = select.querySelector('option[value=""]') || select.options[0];
    if (!placeholder) return;
    placeholder.disabled = true;
  });

  function isSelectValid(select) {
    return (select.value || "").trim() !== "" && select.selectedIndex > 0;
  }

  function validateSingleSelect(select) {
    const wrapper = getFieldWrapper(select);
    const errorEl = wrapper ? wrapper.querySelector(".form-error-text") : null;

    const valid = isSelectValid(select);
    setError(wrapper, errorEl, !valid);

    return valid;
  }

  selects.forEach((select) => {
    select.addEventListener("change", function () {
      validateSingleSelect(select);
    });
  });

  // Progressive Validation: Fehler im Step 3 verschwinden beim Fokus
  if (privacySubmitButton) {
    const step3El = privacySubmitButton.closest("[sf-step]") || formWrapper;

    step3El.addEventListener(
      "focusin",
      function (e) {
        const t = e.target;
        if (!t) return;

        const tag = (t.tagName || "").toLowerCase();
        if (!["input", "textarea", "select"].includes(tag)) return;

        const step = t.closest("[sf-step]");
        if (step && step.classList.contains("ff-show-errors")) {
          clearFieldError(t);
        }
      },
      true
    );
  }

  if (privacySubmitButton) {
    privacySubmitButton.addEventListener(
      "click",
      function (event) {
        let allValid = true;

        const step = privacySubmitButton.closest("[sf-step]");
        if (step) step.classList.add("ff-show-errors");

        // Datenschutz
        if (privacyCheckbox) {
          const wrapper = getFieldWrapper(privacyCheckbox);
          const validPrivacy = !!privacyCheckbox.checked;
          setError(wrapper, privacyErrorText, !validPrivacy);
          if (!validPrivacy) allValid = false;
        }

        // Selects
        selects.forEach((select) => {
          const ok = validateSingleSelect(select);
          if (!ok) allValid = false;
        });

        // Required Textfelder/Textareas
        const scope = privacySubmitButton.closest("[sf-step]") || formWrapper;
        const okText = validateRequiredTextFields(scope);
        if (!okText) allValid = false;

        if (!allValid) {
          event.preventDefault();
          event.stopPropagation();
          if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
          return;
        }
      },
      true
    );
  }

  // Safety: echtes submit
  form.addEventListener("submit", function (event) {
    let allValid = true;

    if (privacyCheckbox) {
      const wrapper = getFieldWrapper(privacyCheckbox);
      const validPrivacy = !!privacyCheckbox.checked;
      setError(wrapper, privacyErrorText, !validPrivacy);
      if (!validPrivacy) allValid = false;
    }

    selects.forEach((select) => {
      const ok = validateSingleSelect(select);
      if (!ok) allValid = false;
    });

    const scope = (privacySubmitButton && privacySubmitButton.closest("[sf-step]")) || formWrapper;
    const okText = validateRequiredTextFields(scope);
    if (!okText) allValid = false;

    if (!allValid) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  if (privacyCheckbox) {
    privacyCheckbox.addEventListener("change", function () {
      if (privacyCheckbox.checked) {
        const wrapper = getFieldWrapper(privacyCheckbox);
        setError(wrapper, privacyErrorText, false);
      }
    });
  }
});

/* ==========================================================================
   (3) Vorab-Check – Feldfehler bei Fokus rein/raus zurücknehmen
   ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.querySelector('[sf="flowformer-vorabcheck"]');
  if (!wrapper) return;

  const form = wrapper.querySelector("form");
  if (form) form.setAttribute("novalidate", "novalidate");

  function getWrap(el) {
    return el?.closest?.(".form_field-wrapper, .multi-form18_field-wrapper") || null;
  }
  function hideError(el) {
    const wrap = getWrap(el);
    if (!wrap) return;

    const errEl = wrap.querySelector(".form-error-text");
    if (errEl) {
      errEl.style.display = "none";
      errEl.style.opacity = "0";
    }
    wrap.classList.remove("ff-has-error");
  }

  wrapper.addEventListener(
    "focusin",
    (e) => {
      const t = e.target;
      if (!t) return;

      const tag = (t.tagName || "").toLowerCase();
      if (!["input", "textarea", "select"].includes(tag)) return;

      const step = t.closest("[sf-step]");
      if (!step || !step.classList.contains("ff-show-errors")) return;

      hideError(t);
    },
    true
  );

  wrapper.addEventListener(
    "focusout",
    (e) => {
      const t = e.target;
      if (!t) return;

      const tag = (t.tagName || "").toLowerCase();
      if (!["input", "textarea", "select"].includes(tag)) return;

      const step = t.closest("[sf-step]");
      if (!step || !step.classList.contains("ff-show-errors")) return;

      hideError(t);
    },
    true
  );
});

/* ==========================================================================
   (4) Vorab-Check – Step 2 Feldfehler bei Fokus zurücknehmen
   ========================================================================= */
document.addEventListener("DOMContentLoaded", function () {
  const wrapper = document.querySelector('[sf="flowformer-vorabcheck"]');
  if (!wrapper) return;

  const utils = window.ffFormUtils;
  if (!utils) return;

  const steps = Array.from(wrapper.querySelectorAll("[sf-step]"));
  const step2 = steps[1];
  if (!step2) return;

  step2.addEventListener(
    "focusin",
    function (e) {
      const t = e.target;
      if (!t) return;

      const tag = (t.tagName || "").toLowerCase();
      if (!["input", "textarea", "select"].includes(tag)) return;

      utils.clearFieldError(t);
    },
    true
  );
});

/* ==========================================================================
   (5) Vorab-Check – Fehleranzeige bei Weiter-Versuch aktivieren
   ========================================================================= */
(function () {
  function markStep(el) {
    const step = el && el.closest && el.closest("[sf-step]");
    if (step) step.classList.add("ff-show-errors");
  }

  document.addEventListener(
    "click",
    function (e) {
      const nav = e.target.closest("[sf-goto]");
      if (!nav) return;

      const goto = (nav.getAttribute("sf-goto") || "").trim().toLowerCase();
      if (["back", "prev", "previous", "-1"].includes(goto)) return;

      markStep(nav);
    },
    true
  );

  document.addEventListener(
    "keydown",
    function (e) {
      if (e.key !== "Enter") return;
      const t = e.target;
      if (!t) return;
      if ((t.tagName || "").toLowerCase() === "textarea") return;
      markStep(t);
    },
    true
  );

  document.addEventListener(
    "click",
    function (e) {
      const btn = e.target.closest('[sf-reset="true"]');
      const resetScope = btn && btn.closest('[data-ff-form="vorabcheck"]');
      if (!resetScope) return;
      resetScope.querySelectorAll("[sf-step].ff-show-errors").forEach((s) => s.classList.remove("ff-show-errors"));
    },
    true
  );
})();

/* ==========================================================================
   (6) Vorab-Check – Submit-Fail, Custom Notice und Mailto-Fallback
   ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const pageScope = document.querySelector('[sf="flowformer-vorabcheck"]');
  const formBlock = document.querySelector('[data-ff-form="vorabcheck"]');

  if (!pageScope || !formBlock) return;

  const form = formBlock.querySelector("form");
  if (!form) return;

  /*
    Wichtig:
    [sf="flowformer-vorabcheck"] umfasst den größeren Kontakt-/Tabs-Bereich.
    Die Fail-Logik darf deshalb nicht alle .w-form-fail innerhalb dieses Bereichs beobachten,
    sondern nur die .w-form-fail innerhalb des Vorab-Check-Form-Blocks.
  */
  const fails = Array.from(formBlock.querySelectorAll(".w-form-fail"));
  const steps = Array.from(form.querySelectorAll("[sf-step]"));
  const notice = formBlock.querySelector('[data-ff-submit-notice="vorabcheck"].ff-submit-notice');

  if (!fails.length || !steps.length || !notice) return;

  const EMAIL_TO = "kontakt@flowformer.de";
  const cleanText = (s) => (s || "").replace(/\s+/g, " ").trim();

  function checkboxOptionText(inputEl) {
    const label = inputEl.closest("label") || inputEl.closest(".w-checkbox") || inputEl.parentElement;
    const span = label && label.querySelector(".w-form-label");
    return cleanText(span ? span.textContent : label?.textContent || "");
  }

  function findValue(matchFn, scopeEl) {
    const scope = scopeEl || form;
    const els = Array.from(scope.querySelectorAll("input, textarea, select")).filter((el) => {
      const tag = (el.tagName || "").toLowerCase();
      if (tag === "fieldset") return false;
      if (tag === "input") {
        const type = (el.type || "").toLowerCase();
        if (["hidden", "submit", "button"].includes(type)) return false;
      }
      return true;
    });

    const el = els.find((e) => matchFn(e.name || "", e.id || "", e));
    return el ? (el.value ?? "").toString().trim() : "";
  }

  function buildMailto() {
    const subject = encodeURIComponent("Vorab-Check Anfrage (alternativer Versand)");
    const lines = [
      "Hallo FlowFormer-Team,",
      "",
      "leider hat das Absenden des Formulars nicht geklappt. Hier sind meine Daten für den Vorab-Check:",
      "",
    ];

    // STEP 1
    lines.push("ZIELE & PRIORITÄTEN:");
    const goalsStep = steps[0] || formBlock;

    const checkedAll = Array.from(goalsStep.querySelectorAll('input[type="checkbox"]:checked'));
    const checkedGoals = checkedAll.filter((el) => {
      const n = (el.name || "").toLowerCase();
      const id = (el.id || "").toLowerCase();
      const t = checkboxOptionText(el).toLowerCase();
      if (n.includes("privacy") || id.includes("privacy") || t.includes("datenschutz")) return false;
      return true;
    });

    const otherField =
      goalsStep.querySelector('textarea[name="Beschreibung"], textarea#Beschreibung, input[name="Beschreibung"], input#Beschreibung') ||
      goalsStep.querySelector('[data-ff-other-input="true"]') ||
      goalsStep
        .querySelector('[data-ff-goal-other-wrapper="true"]')
        ?.querySelector('textarea, input[type="text"], input:not([type])');

    const otherText = (otherField?.value ?? "").toString().trim();

    const otherCheckedEl = checkedGoals.find((el) =>
      checkboxOptionText(el).toLowerCase().includes("etwas anderes")
    );

    const goalTexts = checkedGoals
      .filter((el) => el !== otherCheckedEl)
      .map((el) => checkboxOptionText(el))
      .filter((t) => t && !t.includes("?"))
      .filter((t, i, arr) => arr.indexOf(t) === i);

    let hasGoals = false;
    goalTexts.forEach((t) => {
      lines.push(`- ${t}`);
      hasGoals = true;
    });

    if (otherCheckedEl) {
      lines.push(`- Etwas anderes: ${otherText}`);
      hasGoals = true;
    }

    if (!hasGoals) lines.push("- (keine Auswahl)");

    // STEP 2
    lines.push("", "STATUS QUO:");
    const statusStep = steps[1] || formBlock;

    Array.from(statusStep.querySelectorAll("select")).forEach((sel) => {
      const txt = cleanText(sel.options?.[sel.selectedIndex]?.text || sel.value);
      if (txt) lines.push(`- ${txt}`);
    });

    Array.from(statusStep.querySelectorAll('input[type="radio"]:checked')).forEach((r) => {
      const txt = cleanText(r.value);
      if (txt) lines.push(`- ${txt}`);
    });

    // STEP 3
    lines.push("", "KONTAKTDATEN:");
    const contactStep = steps[2] || formBlock;

    const company = findValue(
      (n, id) => /company|firma|unternehmen/i.test(n) || /company|firma|unternehmen/i.test(id),
      contactStep
    );
    const fullName = findValue(
      (n, id) => /full[_-]?name|vor|nach|name/i.test(n) || /full[_-]?name|vor|nach|name/i.test(id),
      contactStep
    );
    const website = findValue((n, id) => /^webseite$/i.test(n) || /^webseite$/i.test(id), contactStep);
    const email = findValue(
      (n, id, el) => (el?.type || "").toLowerCase() === "email" || /email/i.test(n) || /email/i.test(id),
      contactStep
    );

    if (fullName) lines.push(`- Vor-/Nachname: ${fullName}`);
    if (company) lines.push(`- Unternehmen: ${company}`);
    if (website) lines.push(`- Webseite: ${website}`);
    if (email) lines.push(`- E-Mail-Adresse: ${email}`);

    lines.push("", "Ich freue mich über Ihre Rückmeldung.");

    const body = encodeURIComponent(lines.join("\n"));
    return `mailto:${EMAIL_TO}?subject=${subject}&body=${body}`;
  }

  function safeUpdateNoticeLinks() {
    try {
      const mailBtn = formBlock.querySelector(".ff-mailto-link");
      const direct = formBlock.querySelector(".ff-mailto-direct");
      if (mailBtn) mailBtn.setAttribute("href", buildMailto());
      if (direct) direct.setAttribute("href", `mailto:${EMAIL_TO}`);
    } catch (e) {
      console.error("[FlowFormer] buildMailto failed:", e);
    }
  }

  function unlockNav() {
    formBlock.querySelectorAll("[sf-goto]").forEach((el) => {
      el.removeAttribute("disabled");
      el.removeAttribute("aria-disabled");
      if (el.getAttribute("tabindex") === "-1") el.removeAttribute("tabindex");

      el.style.pointerEvents = "auto";
      el.style.opacity = "1";
      el.classList.remove("is-disabled", "disabled", "w--disabled");
    });
  }

    function scrollToFormAfterFailStepChange() {
    const TABLET_MAX = 991;
    const MOBILE_MAX = 767;

    const desktopAnchor = document.getElementById("Formulare");
    const smallAnchor = document.getElementById("forms-anchor");

    function isTabletDown() {
      return window.matchMedia(`(max-width: ${TABLET_MAX}px)`).matches;
    }

    function isMobileDown() {
      return window.matchMedia(`(max-width: ${MOBILE_MAX}px)`).matches;
    }

    function getActiveAnchor() {
      if (isTabletDown()) return smallAnchor || desktopAnchor;
      return desktopAnchor || smallAnchor;
    }

    function getOffset() {
      if (isMobileDown()) return 50;
      if (isTabletDown()) return 60;
      return 0;
    }

    const anchorEl = getActiveAnchor();
    if (!anchorEl) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const rect = anchorEl.getBoundingClientRect();
    const top = rect.top + scrollTop - getOffset();

    window.scrollTo({ top, behavior: "smooth" });
  }

    function showStepAfterFail(index) {
  if (formBlock.contains(document.activeElement) && document.activeElement?.blur) {
    document.activeElement.blur();
  }

  scrollToFormAfterFailStepChange();

  steps.forEach((step, i) => {
    const isActive = i === index;

    step.style.display = isActive ? "block" : "none";
    step.style.opacity = isActive ? "1" : "0";
    step.setAttribute("aria-hidden", String(!isActive));

    if (!isActive) {
      step.classList.remove("ff-show-errors");
    }
  });

  const progressBar = formBlock.querySelector('[sf-el="progress-bar"]');
  if (progressBar && steps.length > 0) {
    progressBar.style.width = `${((index + 1) / steps.length) * 100}%`;
  }

  showNotice(false);
  unlockNav();
}

    function getInputControlAfterFail(el) {
    if (!el) return null;

    const tag = (el.tagName || "").toLowerCase();

    if (tag === "input" || tag === "textarea" || tag === "select") {
      return el;
    }

    return el.querySelector(
      'textarea, input:not([type]), input[type="text"], input[type="search"], input[type="email"], input[type="url"], input[type="tel"], select'
    );
  }

  function setFieldErrorAfterFail(fieldEl, show) {
    if (!fieldEl) return;

    const control = getInputControlAfterFail(fieldEl) || fieldEl;

    const fieldWrap =
      control.closest(".form_field-wrapper, .multi-form18_field-wrapper") ||
      fieldEl.closest?.(".form_field-wrapper, .multi-form18_field-wrapper") ||
      control.parentElement ||
      fieldEl.parentElement;

    const errEl = fieldWrap ? fieldWrap.querySelector(".form-error-text") : null;

    if (errEl) {
      errEl.style.display = show ? "block" : "none";
      errEl.style.opacity = show ? "1" : "0";
    }

    if (fieldWrap) {
      fieldWrap.classList.toggle("ff-has-error", !!show);
    }
  }

  function validateStepBeforeFailNext(currentIndex) {
    const currentStep = steps[currentIndex];
    if (!currentStep) return false;

    /*
      Nach Submit-Fail übernehmen wir die Step-Navigation selbst.
      Für Step 1 sichern wir deshalb die wichtigste Validierung erneut ab:
      - mindestens ein Ziel
      - falls „Etwas anderes“ gewählt ist: Textfeld muss gefüllt sein
    */
    if (currentIndex !== 0) return true;

    let ok = true;

    const goalCheckboxes = Array.from(
      currentStep.querySelectorAll(
        '[data-ff-goal="true"] input[type="checkbox"], input[type="checkbox"][data-ff-goal="true"]'
      )
    );

    const hasGoal = goalCheckboxes.some((cb) => cb.checked);

    const goalsErrorWrapper = currentStep.querySelector('[data-ff-goal-error="true"]');
    const goalsErrorText =
      (goalsErrorWrapper && goalsErrorWrapper.querySelector(".form-error-text")) ||
      goalsErrorWrapper ||
      null;

    if (!hasGoal) {
      if (goalsErrorText) {
        goalsErrorText.style.display = "block";
        goalsErrorText.style.opacity = "1";
      }
      currentStep.classList.add("ff-show-errors");
      ok = false;
    } else if (goalsErrorText) {
      goalsErrorText.style.display = "none";
      goalsErrorText.style.opacity = "0";
    }

    const otherToggleInput =
      currentStep.querySelector('[data-ff-goal-other="true"] input[type="checkbox"]') ||
      currentStep.querySelector('input[type="checkbox"][data-ff-goal-other="true"]');

    const otherFieldMarker = currentStep.querySelector('[data-ff-other-input="true"]');
    const otherControl = getInputControlAfterFail(otherFieldMarker);

    if (otherToggleInput && otherToggleInput.checked && otherFieldMarker) {
      const valueSource = otherControl || otherFieldMarker;
      const hasOtherText = (valueSource.value || "").trim() !== "";

      setFieldErrorAfterFail(otherFieldMarker, !hasOtherText);

      if (!hasOtherText) {
        currentStep.classList.add("ff-show-errors");
        ok = false;
      }
    } else {
      setFieldErrorAfterFail(otherFieldMarker, false);
    }

    return ok;
  }

  formBlock.addEventListener(
    "click",
    (e) => {
      const nav = e.target.closest("[sf-goto]");
      if (!nav) return;
      if (formBlock.dataset.ffSubmitFailed !== "1") return;

      nav.removeAttribute("disabled");
      nav.removeAttribute("aria-disabled");
      if (nav.getAttribute("tabindex") === "-1") nav.removeAttribute("tabindex");
      nav.style.pointerEvents = "auto";

      const goto = (nav.getAttribute("sf-goto") || "").trim().toLowerCase();

      const isBack = ["back", "prev", "previous", "-1"].includes(goto);
      const isNext = ["next", "forward", "1"].includes(goto);

      if (!isBack && !isNext) return;

      const currentIndex = getVisibleStepIndex();
      if (currentIndex < 0) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      if (isBack) {
        if (currentIndex <= 0) return;
        showStepAfterFail(currentIndex - 1);
        return;
      }

      if (isNext) {
        if (currentIndex >= steps.length - 1) return;
        if (!validateStepBeforeFailNext(currentIndex)) return;
        showStepAfterFail(currentIndex + 1);
      }
    },
    true
  );

  function getVisibleStepIndex() {
    let idx = steps.findIndex((s) => getComputedStyle(s).display !== "none");
    if (idx !== -1) return idx;
    return steps.findIndex((s) => s.getAttribute("aria-hidden") === "false");
  }

  function showNotice(show) {
    notice.classList.toggle("is-open", !!show);
  }

  function enterFailMode() {
  formBlock.dataset.ffSubmitFailed = "1";

  try {
    const sf = window.SuperformAPI?.getForm?.("flowformer-vorabcheck");
    if (sf && "isSubmitted" in sf) {
      sf.isSubmitted = false;
    }
  } catch (e) {
    console.warn("[FlowFormer] Superform submit lock reset failed:", e);
  }

  fails.forEach((f) => {
    f.style.display = "none";
  });

  unlockNav();
  safeUpdateNoticeLinks();

  const idx = getVisibleStepIndex();
  showNotice(idx === steps.length - 1);
}

  function anyFailVisible() {
    return fails.some((f) => getComputedStyle(f).display !== "none");
  }

  fails.forEach((f) => {
    const obs = new MutationObserver(() => {
      if (getComputedStyle(f).display !== "none") enterFailMode();
    });
    obs.observe(f, { attributes: true, attributeFilter: ["style", "class"] });
  });

  if (anyFailVisible()) enterFailMode();

  setInterval(() => {
    if (formBlock.dataset.ffSubmitFailed === "1") {
      unlockNav();
      safeUpdateNoticeLinks();
    }
  }, 300);
});

/* ==========================================================================
   (7) Vorab-Check – Reset-Verhalten und UI-Bereinigung
   ========================================================================= */
(function () {
  document.addEventListener(
    "click",
    function (e) {
      const btn = e.target.closest('[sf-reset="true"]');
      const resetScope = btn && btn.closest('[data-ff-form="vorabcheck"]');
      if (!resetScope) return;

      const wrapper = document.querySelector('[sf="flowformer-vorabcheck"]');
      if (!wrapper) return;

      if (btn.dataset.ffAllowReset !== "1") {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

        const prevVisibility = wrapper.style.visibility;
        const prevOpacity = wrapper.style.opacity;

        wrapper.dataset.ffPrevVisibility = prevVisibility;
        wrapper.dataset.ffPrevOpacity = prevOpacity;

        wrapper.style.visibility = "hidden";
        wrapper.style.opacity = "0";

        requestAnimationFrame(() => {
          setTimeout(() => {
            btn.dataset.ffAllowReset = "1";
            btn.click();
            delete btn.dataset.ffAllowReset;
          }, 20);
        });

        return;
      }

      // Bereinigung auf den Vorab-Check begrenzen; Kontaktdaten erhalten.
      setTimeout(() => {
        resetScope.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach((i) => {
          i.checked = false;
          i.disabled = false;
          i.dispatchEvent(new Event("change", { bubbles: true }));
        });

        resetScope.querySelectorAll(".w-checkbox-input, .w-radio-input").forEach((el) => {
          el.classList.remove("w--redirected-checked", "w--redirected-focus");
        });

        resetScope
          .querySelectorAll(
            'input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]):not([type="hidden"]), textarea'
          )
          .forEach((i) => {
            i.value = "";
          });

        resetScope.querySelectorAll("select").forEach((sel) => {
          sel.value = "";
          sel.selectedIndex = 0;
          sel.dispatchEvent(new Event("change", { bubbles: true }));
        });

        resetScope.querySelectorAll('input[type="submit"]').forEach((sub) => {
          if (!sub.value) sub.value = sub.defaultValue || sub.getAttribute("value") || "Vorab-Check Anfrage absenden";
        });

        const otherWrapper = resetScope.querySelector('[data-ff-goal-other-wrapper="true"]');
        if (otherWrapper) otherWrapper.style.display = "none";

        resetScope.querySelectorAll("[sf-step].ff-show-errors").forEach((s) => s.classList.remove("ff-show-errors"));
      }, 220);

      setTimeout(() => {
        wrapper.style.visibility = wrapper.dataset.ffPrevVisibility || "";
        wrapper.style.opacity = wrapper.dataset.ffPrevOpacity || "";
        delete wrapper.dataset.ffPrevVisibility;
        delete wrapper.dataset.ffPrevOpacity;
      }, 520);
    },
    true
  );

  window.addEventListener("load", () => {
    document.documentElement.classList.remove("ff-vorabcheck-loading");
  });
})();

/* ==========================================================================
   (8) Vorab-Check – Success State: Scroll und Fade
   ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const desktopAnchor = document.getElementById("Formulare");
  const smallAnchor = document.getElementById("forms-anchor");
  if (!desktopAnchor && !smallAnchor) return;

  const TABLET_MAX = 991;
  const MOBILE_MAX = 767;

  function isTabletDown() {
    return window.matchMedia(`(max-width: ${TABLET_MAX}px)`).matches;
  }
  function isMobileDown() {
    return window.matchMedia(`(max-width: ${MOBILE_MAX}px)`).matches;
  }
  function getActiveAnchor() {
    if (isTabletDown()) return smallAnchor || desktopAnchor;
    return desktopAnchor || smallAnchor;
  }
  function getOffset() {
    if (isMobileDown()) return 50;
    if (isTabletDown()) return 60;
    return 0;
  }
  function scrollToAnchor({ behavior = "auto" } = {}) {
    const anchorEl = getActiveAnchor();
    if (!anchorEl) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const rect = anchorEl.getBoundingClientRect();
    const top = rect.top + scrollTop - getOffset();

    window.scrollTo({ top, behavior });
  }

  // Fade CSS (in JS gelassen wie vorher)
  const style = document.createElement("style");
  style.innerHTML = `
    .w-form-done {
      opacity: 0;
      transition: opacity 0.6s ease-in-out;
    }
    .w-form-done.show-fade {
      opacity: 1 !important;
    }
  `;
  document.head.appendChild(style);

  function handleSuccessState(msg) {
    scrollToAnchor({ behavior: "auto" });
    setTimeout(() => {
      msg.classList.add("show-fade");
    }, 50);
  }

  const lastVisible = new WeakMap();
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      const t = mutation.target;
      if (!t) return;

      const visibleNow = window.getComputedStyle(t).display !== "none";
      const visibleBefore = lastVisible.get(t) ?? false;

      if (visibleNow && !visibleBefore) {
        handleSuccessState(t);
      }

      lastVisible.set(t, visibleNow);
    });
  });

  document.querySelectorAll(".w-form-done").forEach((msg) => {
    lastVisible.set(msg, window.getComputedStyle(msg).display !== "none");
    observer.observe(msg, { attributes: true, attributeFilter: ["style", "class"] });
  });

  const vorabWrapper = document.querySelector('[sf="flowformer-vorabcheck"]');
  if (vorabWrapper) {
    vorabWrapper.addEventListener("click", (e) => {
      const btn = e.target.closest('[sf-next="true"], [sf-back="true"], [sf-goto], [sf-reset="true"]');
      if (!btn) return;

      if (btn.getAttribute("sf-next") !== "false") {
        scrollToAnchor({ behavior: "smooth" });
      }
    });
  }
});

/* ==========================================================================
   (9) Vorab-Check – zusätzlicher Submit-Guard für Pflichtfelder
   ========================================================================= */
document.addEventListener("DOMContentLoaded", function () {
  const wrapper = document.querySelector('[sf="flowformer-vorabcheck"]');
  if (!wrapper) return;

  const utils = window.ffFormUtils;
  if (!utils) return;

  const steps = Array.from(wrapper.querySelectorAll("[sf-step]"));
  if (!steps.length) return;

  function getVisibleStep() {
    return (
      steps.find((s) => s.getAttribute("aria-hidden") === "false") ||
      steps.find((s) => getComputedStyle(s).display !== "none") ||
      null
    );
  }

  function setErrorForField(fieldEl, show) {
    const wrap = utils.getFieldWrapper(fieldEl);
    if (!wrap) return;

    const errEl = wrap.querySelector(".form-error-text");
    utils.setError(wrap, errEl, show);
  }

  document.addEventListener(
    "click",
    function (e) {
      const btn = e.target.closest('[data-ff-privacy-submit="true"]');
      if (!btn) return;
      if (!wrapper.contains(btn)) return;

      const step = getVisibleStep();
      if (!step) return;

      step.classList.add("ff-show-errors");
      const okText = utils.validateRequiredTextFields(step);

      if (!okText) {
        e.preventDefault();
        return;
      }
    },
    true
  );

  wrapper.addEventListener(
    "focusin",
    function (e) {
      const step = getVisibleStep();
      if (!step) return;
      if (!step.classList.contains("ff-show-errors")) return;

      const t = e.target;
      if (!t) return;

      const tag = (t.tagName || "").toLowerCase();
      if (!["input", "textarea", "select"].includes(tag)) return;

      setErrorForField(t, false);
    },
    true
  );
});

/* ==========================================================================
   (10) Allgemein – Blog-Slider Touch Locking
   ========================================================================= */
(function () {
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  if (!isTouch) return;

  const el = document.querySelector(".landingpage_blog_slider");
  if (!el) return;

  let sx = 0,
    sy = 0,
    locked = null;

  const DEADZONE = 12;
  const X_WINS_RATIO = 1.35;
  const Y_WINS_RATIO = 1.35;

  el.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches || e.touches.length !== 1) return;
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      locked = null;
    },
    { passive: true }
  );

  el.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches || e.touches.length !== 1) return;

      const dx = e.touches[0].clientX - sx;
      const dy = e.touches[0].clientY - sy;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);

      if (locked === null) {
        if (adx + ady < DEADZONE) return;

        if (adx > ady * X_WINS_RATIO) locked = "x";
        else if (ady > adx * Y_WINS_RATIO) locked = "y";
        else return;
      }

      if (locked === "x") e.preventDefault();
    },
    { passive: false }
  );

  el.addEventListener("touchend", () => {
    locked = null;
  }, { passive: true });

  el.addEventListener("touchcancel", () => {
    locked = null;
  }, { passive: true });
})();

/* ==========================================================================
   (11) Vorab-Check – Success State: Antwortdaten einfügen
   ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.querySelector('[sf="flowformer-vorabcheck"]');
  if (!wrapper) return;

  const success = wrapper.querySelector(".w-form-done");
  if (!success) return;

  const getFieldValue = (selectors) => {
    for (const sel of selectors) {
      const el = wrapper.querySelector(sel);
      if (el && el.value?.trim()) return el.value.trim();
    }
    return null;
  };

  function updateSuccessContent() {
    if (success.dataset.injected === "true") return;

    const nameVal =
      getFieldValue(['input[name="name"]', 'input[name*="vorname"]', "#Name", 'input[name*="ame"]']) ||
      "Interessent";
    const companyVal =
      getFieldValue(['input[name*="firma"]', 'input[name*="unternehmen"]', 'input[name*="company"]']) ||
      "Ihrem Unternehmen";
    const emailVal =
      getFieldValue(['input[type="email"]', 'input[name*="email"]']) || "Ihrer E-Mail-Adresse";

    const goalCbs = Array.from(wrapper.querySelectorAll('[data-ff-goal="true"] input[type="checkbox"]:checked'));
    const mainGoals = goalCbs
      .map((cb) => {
        const label = cb.closest("label") || cb.parentElement;
        return (label.querySelector(".w-form-label")?.textContent || label.textContent).trim();
      })
      .filter((text) => {
        const t = text.toLowerCase();
        return !t.includes("etwas anderes") && !t.includes("datenschutz") && !t.includes("privacy");
      });

    let goalsText = mainGoals.join(", ");
    if (mainGoals.length > 1) {
      const lastComma = goalsText.lastIndexOf(", ");
      goalsText = goalsText.substring(0, lastComma) + " und " + goalsText.substring(lastComma + 2);
    }
    if (!goalsText) goalsText = "Ihre Ziele";

    const otherInput = wrapper.querySelector(
      '[data-ff-goal-other-wrapper="true"] textarea, [data-ff-goal-other-wrapper="true"] input'
    );
    const otherVal = otherInput ? otherInput.value.trim() : "";

    const taggedBlocks = success.querySelectorAll('[data-ff-success-text="true"]');
    taggedBlocks.forEach((block) => {
      if (!block.dataset.originalHtml) block.dataset.originalHtml = block.innerHTML;

      let html = block.dataset.originalHtml;
      html = html.split("{{name}}").join(nameVal);
      html = html.split("{{company}}").join(companyVal);
      html = html.split("{{goals}}").join(goalsText);
      html = html.split("{{email}}").join(emailVal);

      const sentence = otherVal ? `Zusätzlich haben Sie notiert: "${otherVal}"` : "";
      html = html.split("{{otherSentence}}").join(sentence);

      block.innerHTML = html;
    });

    success.dataset.injected = "true";
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest('[sf-reset="true"]')) {
      delete success.dataset.injected;
      success.querySelectorAll('[data-ff-success-text="true"]').forEach((block) => {
        if (block.dataset.originalHtml) block.innerHTML = block.dataset.originalHtml;
      });
    }
  });

  const successObserver = new MutationObserver(() => {
    if (window.getComputedStyle(success).display !== "none") updateSuccessContent();
  });
  successObserver.observe(success, { attributes: true, attributeFilter: ["style", "class"] });
});

/* ==========================================================================
   (12) Direkter Kontakt – Success schließen und Formular zurücksetzen
   ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const scope = document.getElementById("contact-form");
  if (!scope) return;

  const closeBtn = scope.querySelector(".cf-success-close");
  if (!closeBtn) return;

  const formEl = scope.querySelector("form");
  const doneEl = scope.querySelector(".w-form-done");
  const failEl = scope.querySelector(".w-form-fail");

  closeBtn.addEventListener("click", (e) => {
    e.preventDefault();

    if (doneEl) doneEl.style.display = "none";
    if (failEl) failEl.style.display = "none";

    if (formEl) formEl.style.display = "block";
    if (formEl) formEl.reset();

    scope
      .querySelectorAll(".w--redirected-focus, .w--redirected-checked, .w--redirected-invalid")
      .forEach((el) => {
        el.classList.remove("w--redirected-focus", "w--redirected-checked", "w--redirected-invalid");
      });
  });
});

/* ==========================================================================
   (13) Direkter Kontakt – Feldvalidierung
   ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const scope = document.getElementById("contact-form");
  if (!scope) return;

  const step = scope.querySelector(".contact-form_step");
  if (!step) return;

  const form = scope.querySelector("form");
  if (!form) return;

  form.setAttribute("novalidate", "novalidate");

  const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
  if (!submitBtn) return;

  function getTextFieldWrapper(el) {
    return (el && el.closest && el.closest(".contactform_field-wrapper")) || null;
  }

  function getCheckboxGroupWrapper(inputEl) {
    return (inputEl && inputEl.closest && inputEl.closest(".contact-form_checkbox")) || null;
  }

  function getCheckboxErrorEl(groupWrapper) {
    if (!groupWrapper) return null;

    let err = groupWrapper.querySelector(".form-error-text");
    if (err) return err;

    const next = groupWrapper.nextElementSibling;
    if (next) {
      err = next.querySelector && next.querySelector(".form-error-text");
      if (err) return err;
    }

    const parent = groupWrapper.parentElement;
    if (parent) {
      const candidates = Array.from(parent.querySelectorAll(".form-error-text"));
      if (candidates.length === 1) return candidates[0];
    }

    return null;
  }

  function setErrorText(errEl, show) {
    if (!errEl) return;
    errEl.style.display = show ? "block" : "none";
    errEl.style.opacity = show ? "1" : "0";
  }

  function setErrorClass(wrapper, show) {
    if (!wrapper) return;
    wrapper.classList.toggle("ff-has-error", !!show);
  }

  function isRequiredTextLike(el) {
    if (!el) return false;
    const tag = (el.tagName || "").toLowerCase();
    const isReq = !!el.required || el.getAttribute("aria-required") === "true";
    if (!isReq) return false;

    if (tag === "textarea") return true;
    if (tag === "select") return true;

    if (tag === "input") {
      const type = (el.type || "text").toLowerCase();
      if (["checkbox", "radio", "submit", "button", "hidden", "file"].includes(type)) return false;
      return true;
    }
    return false;
  }

  function findPrivacyCheckboxInput() {
    const byId = form.querySelector("#cf-Einverstaendniserklaerung-Datenschutz");
    if (byId && (byId.type || "").toLowerCase() === "checkbox") return byId;

    const marker = form.querySelector('[data-ff-privacy="true"]');
    if (!marker) return null;

    const label = marker.closest("label") || marker.closest(".w-checkbox") || marker.parentElement;
    if (!label) return null;

    return label.querySelector('input[type="checkbox"]');
  }

  function validateAll() {
    let ok = true;

    const fields = Array.from(form.querySelectorAll("input, textarea, select")).filter(isRequiredTextLike);

    fields.forEach((el) => {
      const wrap = getTextFieldWrapper(el);
      const errEl = wrap ? wrap.querySelector(".form-error-text") : null;

      const hasValue = (el.value || "").trim() !== "";
      const valid = hasValue && (typeof el.checkValidity !== "function" || el.checkValidity());

      setErrorText(errEl, !valid);
      setErrorClass(wrap, !valid);

      if (!valid) ok = false;
    });

    const privacyCb = findPrivacyCheckboxInput();
    if (privacyCb) {
      const groupWrap = getCheckboxGroupWrapper(privacyCb);
      const errEl = getCheckboxErrorEl(groupWrap);

      const valid = !!privacyCb.checked;

      setErrorText(errEl, !valid);
      setErrorClass(groupWrap, !valid);

      if (!valid) ok = false;
    }

    return ok;
  }

  function clearSingleError(target) {
    const textWrap = getTextFieldWrapper(target);
    if (textWrap) {
      const errEl = textWrap.querySelector(".form-error-text");
      setErrorText(errEl, false);
      setErrorClass(textWrap, false);
      if (target.classList) target.classList.remove("w--redirected-invalid", "w--redirected-focus");
      return;
    }

    if ((target.type || "").toLowerCase() === "checkbox") {
      const groupWrap = getCheckboxGroupWrapper(target);
      const errEl = getCheckboxErrorEl(groupWrap);
      setErrorText(errEl, false);
      setErrorClass(groupWrap, false);
      if (target.classList) target.classList.remove("w--redirected-invalid", "w--redirected-focus");
    }
  }

  submitBtn.addEventListener(
    "click",
    (e) => {
      step.classList.add("ff-show-errors");
      const ok = validateAll();
      if (!ok) {
        e.preventDefault();
        return;
      }
    },
    true
  );

  form.addEventListener(
    "submit",
    (e) => {
      step.classList.add("ff-show-errors");
      const ok = validateAll();
      if (!ok) {
        e.preventDefault();
        return;
      }
    },
    true
  );

  step.addEventListener(
    "focusin",
    (e) => {
      if (!step.classList.contains("ff-show-errors")) return;

      const t = e.target;
      if (!t) return;

      const tag = (t.tagName || "").toLowerCase();
      if (!["input", "textarea", "select"].includes(tag)) return;

      clearSingleError(t);
    },
    true
  );

  step.addEventListener(
    "change",
    (e) => {
      const t = e.target;
      if (!t) return;
      if ((t.tagName || "").toLowerCase() !== "input") return;
      if ((t.type || "").toLowerCase() !== "checkbox") return;

      if (t.checked) clearSingleError(t);
    },
    true
  );
});


/* ==========================================================================
   (14) Direkter Kontakt – Submit-Fail und Custom Notice
   ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const formBlock = document.querySelector('[data-ff-form="direct-contact"]');
  if (!formBlock) return;

  const form = formBlock.querySelector("form");
  const failEl = formBlock.querySelector(".w-form-fail");
  const doneEl = formBlock.querySelector(".w-form-done");
  const notice = formBlock.querySelector('[data-ff-submit-notice="direct-contact"].ff-submit-notice');

  if (!form || !failEl || !notice) return;

  function isVisible(el) {
    return !!el && window.getComputedStyle(el).display !== "none";
  }

  function openNotice() {
    notice.classList.add("is-open");

    /*
      Webflow Error bleibt als technisches Signal vorhanden,
      wird aber nach Auslösung optisch versteckt.
    */
    failEl.style.display = "none";
  }

  function closeNotice() {
    notice.classList.remove("is-open");
  }

  const failObserver = new MutationObserver(() => {
    if (isVisible(failEl)) {
      openNotice();
    }
  });

  failObserver.observe(failEl, {
    attributes: true,
    attributeFilter: ["style", "class"],
  });

  if (doneEl) {
    const doneObserver = new MutationObserver(() => {
      if (isVisible(doneEl)) {
        closeNotice();
      }
    });

    doneObserver.observe(doneEl, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });
  }

  form.addEventListener(
    "submit",
    () => {
      closeNotice();
    },
    true
  );

  form.addEventListener(
    "input",
    () => {
      closeNotice();
    },
    true
  );

  form.addEventListener(
    "change",
    () => {
      closeNotice();
    },
    true
  );

  if (isVisible(failEl)) {
    openNotice();
  }
});


/* ==========================================================================
   (15) FlowFormer – Tabs öffnen + Instant Scroll
   Desktop (>991): #Formulare
   Tablet & down (<=991): #forms-anchor
   Trigger: [data-ff-open-tab="TABNAME"]
   TabLinks: .w-tab-link[data-ff-tab="TABNAME"]
   ========================================================================== */
(() => {
  window.Webflow = window.Webflow || [];

  window.Webflow.push(() => {
    const TABLET_MAX = 991;
    const mqTabletDown = window.matchMedia(
      `(max-width:${TABLET_MAX}px)`
    );

    // Pointer vs. Keyboard Mode
    const root = document.documentElement;

    const setPointerMode = () =>
      root.classList.add("ff-pointer");

    const setKeyboardMode = () =>
      root.classList.remove("ff-pointer");

    window.addEventListener(
      "pointerdown",
      setPointerMode,
      true
    );

    window.addEventListener(
      "touchstart",
      setPointerMode,
      true
    );

    window.addEventListener(
      "mousedown",
      setPointerMode,
      true
    );

    window.addEventListener(
      "keydown",
      (e) => {
        if (
          e.key === "Tab" ||
          e.key === "Enter" ||
          e.key === " "
        ) {
          setKeyboardMode();
        }
      },
      true
    );

    function getActiveAnchor() {
      const desktop =
        document.getElementById("Formulare");

      const tablet =
        document.getElementById("forms-anchor");

      return mqTabletDown.matches
        ? (tablet || desktop)
        : (desktop || tablet);
    }

        function scrollInstantTo(el) {
      if (!el) return;

      /*
       * Oberkante von #forms-anchor unterhalb
       * der sticky Navigation positionieren.
       */
      const ANCHOR_GAP_PX = 16;

      const navbar =
        document.getElementById("Navbar");

      const navbarHeight = navbar
        ? Math.ceil(
            navbar.getBoundingClientRect().height
          )
        : 60;

      const offset = mqTabletDown.matches
        ? navbarHeight + ANCHOR_GAP_PX
        : 0;

      const y =
        (
          window.pageYOffset ||
          document.documentElement.scrollTop
        ) +
        el.getBoundingClientRect().top -
        offset;

      window.scrollTo(0, Math.round(y));
    }

    function openTabByName(
      tabName,
      forceBlur = false
    ) {
      const tabLink = document.querySelector(
        `.w-tab-link[data-ff-tab="${CSS.escape(tabName)}"]`
      );

      if (!tabLink) return false;

      tabLink.click();

      /*
       * Fokus nach Pointer-Nutzung oder einem
       * automatischen Seitenaufruf entfernen.
       */
      if (
        (
          forceBlur ||
          root.classList.contains("ff-pointer")
        ) &&
        document.activeElement?.blur
      ) {
        try {
          document.activeElement.blur();
        } catch (e) {}
      }

      return true;
    }

    async function run(
      tabName,
      forceBlur = false
    ) {
      // 1. Tab öffnen
      openTabByName(tabName, forceBlur);

      // 2. Zwei Rendering-Frames abwarten
      await new Promise((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(resolve)
        )
      );

      const anchor = getActiveAnchor();
      scrollInstantTo(anchor);

      /*
       * 3. Nachkorrektur für
       * Safari, Firefox und Edge
       */
      setTimeout(() => {
        const anchor2 = getActiveAnchor();
        scrollInstantTo(anchor2);

        if (
          (
            forceBlur ||
            root.classList.contains("ff-pointer")
          ) &&
          document.activeElement?.blur
        ) {
          try {
            document.activeElement.blur();
          } catch (e) {}
        }
      }, 80);
    }

    document.addEventListener(
      "click",
      (e) => {
        const trigger = e.target.closest(
          "[data-ff-open-tab]"
        );

        if (!trigger) return;

        e.preventDefault();

        const tabName = (
          trigger.getAttribute(
            "data-ff-open-tab"
          ) || ""
        ).trim();

        if (!tabName) return;

        run(tabName);
      },
      true
    );

    // Tastatur: Enter oder Space
    document.addEventListener(
      "keydown",
      (e) => {
        if (
          e.key !== "Enter" &&
          e.key !== " "
        ) {
          return;
        }

        const trigger = e.target.closest?.(
          "[data-ff-open-tab]"
        );

        if (!trigger) return;

        e.preventDefault();

        const tabName = (
          trigger.getAttribute(
            "data-ff-open-tab"
          ) || ""
        ).trim();

        if (!tabName) return;

        run(tabName);
      },
      true
    );

    /*
     * Seitenübergreifender Einstieg
     * in den gewünschten Formular-Tab
     */
    const params = new URLSearchParams(
      window.location.search
    );

    const requestedTab =
      params.get("ff-tab");

    const isFormsTarget =
      window.location.hash === "#Formulare" ||
      window.location.hash === "#forms-anchor";

    const isValidTab =
      requestedTab === "Vorab-Check" ||
      requestedTab === "Direkter-Kontakt";

    if (isFormsTarget && isValidTab) {
      run(requestedTab, true);
    }
  });
})();