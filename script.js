const bookingForm = document.querySelector("#booking-form");
const requestModal = document.querySelector("#request-modal");
const requestCard = document.querySelector("#request-card");
const requestNameInput = document.querySelector("#request-name");
const serviceField = document.querySelector('select[name="service"]');
const requestTriggers = document.querySelectorAll(".request-trigger");
const requestModalContinue = document.querySelector("#request-modal-continue");
const requestCloseButtons = document.querySelectorAll("[data-request-close]");
const year = document.querySelector("#year");
const requestControls = bookingForm?.querySelectorAll("input, select, textarea") || [];

let lastSelectedService = "";

function setFieldValidityState(control, isValid) {
  const field = control.closest(".field");

  if (!field) {
    return;
  }

  field.classList.toggle("is-invalid", !isValid);
  control.setAttribute("aria-invalid", String(!isValid));
}

function validateField(control, { emphasize = false } = {}) {
  const isValid = control.checkValidity();
  setFieldValidityState(control, isValid);

  if (!isValid && emphasize) {
    const field = control.closest(".field");

    if (field) {
      field.classList.remove("is-invalid");
      void field.offsetWidth;
      field.classList.add("is-invalid");
    }
  }

  return isValid;
}

function focusInvalidField(control) {
  if (!control) {
    return;
  }

  window.setTimeout(() => {
    control.focus({ preventScroll: true });
    control.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 40);
}

function validateRequestForm({ emphasize = false, focusFirst = false } = {}) {
  if (!bookingForm) {
    return true;
  }

  let firstInvalid = null;

  requestControls.forEach((control) => {
    const isValid = validateField(control, { emphasize });

    if (!isValid && !firstInvalid) {
      firstInvalid = control;
    }
  });

  if (firstInvalid && focusFirst) {
    focusInvalidField(firstInvalid);
  }

  return !firstInvalid;
}

function openRequestModal(service = "") {
  if (serviceField) {
    serviceField.value = service;
    setFieldValidityState(serviceField, true);
  }

  lastSelectedService = service;
  requestModal?.classList.add("is-open");
  requestModal?.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-modal-open");
  requestCard?.classList.add("is-emphasized");

  window.setTimeout(() => {
    requestCard?.classList.remove("is-emphasized");
    requestNameInput?.focus();
  }, 350);
}

function closeRequestModal() {
  requestModal?.classList.remove("is-open");
  requestModal?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-modal-open");

  bookingForm?.reset();

  requestControls.forEach((control) => {
    setFieldValidityState(control, true);
    control.removeAttribute("aria-invalid");
  });

  if (requestCard) {
    requestCard.querySelector(".booking-form")?.removeAttribute("hidden");
    requestCard.querySelector(".request-card__note")?.removeAttribute("hidden");
    requestCard.querySelector("#request-modal-continue")?.removeAttribute("hidden");
    requestCard.querySelector(".request-card__success")?.remove();
  }
}

function showSuccessState() {
  if (!requestCard) {
    return;
  }

  const formEl = requestCard.querySelector(".booking-form");
  const noteEl = requestCard.querySelector(".request-card__note");
  const continueBtn = requestCard.querySelector("#request-modal-continue");

  formEl?.setAttribute("hidden", "true");
  noteEl?.setAttribute("hidden", "true");
  continueBtn?.setAttribute("hidden", "true");

  let success = requestCard.querySelector(".request-card__success");

  if (!success) {
    success = document.createElement("div");
    success.className = "request-card__success";
    success.innerHTML = `
      <h4>Thank you!</h4>
      <p>We received your request and will contact you shortly to confirm your appointment time.</p>
      <p>For urgent help, call <a href="tel:+15733177239">(573) 317-7239</a>.</p>
    `;
    requestCard.appendChild(success);
  }
}

function handleBookingSubmit(event) {
  event.preventDefault();

  if (!validateRequestForm({ emphasize: true, focusFirst: true })) {
    return;
  }

  showSuccessState();
}

function initReveal() {
  const revealItems = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

initReveal();

if (bookingForm) {
  bookingForm.addEventListener("submit", handleBookingSubmit);
}

if (requestTriggers.length > 0) {
  requestTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openRequestModal(trigger.dataset.service || "");
    });
  });
}

if (serviceField) {
  serviceField.addEventListener("change", () => {
    lastSelectedService = serviceField.value;
  });
}

if (requestControls.length > 0) {
  requestControls.forEach((control) => {
    const eventName = control.tagName === "SELECT" ? "change" : "input";

    control.addEventListener(eventName, () => {
      validateField(control);
    });
  });
}

if (requestModalContinue) {
  requestModalContinue.addEventListener("click", () => {
    if (!bookingForm) {
      closeRequestModal();
      return;
    }

    if (!validateRequestForm({ emphasize: true, focusFirst: true })) {
      return;
    }

    showSuccessState();
  });
}

if (requestCloseButtons.length > 0) {
  requestCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      closeRequestModal();
    });
  });
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && requestModal?.classList.contains("is-open")) {
    closeRequestModal();
  }
});

if (year) {
  year.textContent = new Date().getFullYear();
}

// --- Dark mode ---
const darkToggle = document.querySelector("#dark-toggle");
const root = document.documentElement;

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  localStorage.setItem("sca-theme", theme);
}

(function () {
  const saved = localStorage.getItem("sca-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
})();

if (darkToggle) {
  darkToggle.addEventListener("click", () => {
    const current = root.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

// --- Mobile menu ---
const hamburger  = document.querySelector("#hamburger");
const mobileMenu = document.querySelector("#mobile-menu");

function toggleMobileMenu() {
  const isOpen = !mobileMenu.hidden;
  mobileMenu.hidden = isOpen;
  hamburger.classList.toggle("is-open", !isOpen);
  hamburger.setAttribute("aria-expanded", String(!isOpen));
  document.body.classList.toggle("is-modal-open", !isOpen);
}

if (hamburger && mobileMenu) {
  hamburger.addEventListener("click", toggleMobileMenu);

  document.querySelectorAll("[data-mobile-close]").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.hidden = true;
      hamburger.classList.remove("is-open");
      hamburger.setAttribute("aria-expanded", "false");
      document.body.classList.remove("is-modal-open");
    });
  });
}

// --- Appointment modal ---
const apptModal     = document.querySelector("#appointment-modal");
const apptForm      = document.querySelector("#appt-form");
const apptSuccess   = document.querySelector("#appt-success");
const apptTriggers  = document.querySelectorAll(".appt-trigger");
const apptCloseBtns = document.querySelectorAll("[data-appt-close]");
const apptDateInput = document.querySelector("#appt-date-input");

// Set minimum date to tomorrow
if (apptDateInput) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  apptDateInput.min = tomorrow.toISOString().split("T")[0];
}

function openApptModal() {
  apptModal?.classList.add("is-open");
  apptModal?.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-modal-open");
  apptForm?.querySelector("input")?.focus();
}

function closeApptModal() {
  apptModal?.classList.remove("is-open");
  apptModal?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-modal-open");
}

function validateApptForm() {
  if (!apptForm) return true;
  const controls = apptForm.querySelectorAll("input[required], select[required]");
  let valid = true;
  controls.forEach((ctrl) => {
    const ok = ctrl.checkValidity();
    ctrl.classList.toggle("is-invalid", !ok);
    if (!ok) {
      valid = false;
      if (valid === false && ctrl === [...controls].find(c => !c.checkValidity())) {
        ctrl.focus();
      }
    }
  });
  return valid;
}

apptTriggers.forEach((btn) => {
  btn.addEventListener("click", (e) => { e.preventDefault(); openApptModal(); });
});

apptCloseBtns.forEach((btn) => {
  btn.addEventListener("click", () => closeApptModal());
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && apptModal?.classList.contains("is-open")) closeApptModal();
});

if (apptForm) {
  // Live validation on blur
  apptForm.querySelectorAll("input, select").forEach((ctrl) => {
    ctrl.addEventListener("blur", () => {
      if (ctrl.hasAttribute("required")) {
        ctrl.classList.toggle("is-invalid", !ctrl.checkValidity());
      }
    });
    ctrl.addEventListener("input", () => ctrl.classList.remove("is-invalid"));
  });

  apptForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateApptForm()) return;
    apptForm.hidden = true;
    if (apptSuccess) apptSuccess.hidden = false;
  });
}
