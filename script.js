/* =============================================
   DARK MODE
   ============================================= */

const root = document.documentElement;

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  localStorage.setItem("sca-theme", theme);
}

(function () {
  const saved      = localStorage.getItem("sca-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
})();

const darkToggle = document.querySelector("#dark-toggle");
if (darkToggle) {
  darkToggle.addEventListener("click", () => {
    applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });
}

/* =============================================
   MOBILE MENU
   ============================================= */

const hamburger  = document.querySelector("#hamburger");
const mobileMenu = document.querySelector("#mobile-menu");

if (hamburger && mobileMenu) {
  hamburger.addEventListener("click", () => {
    const isOpen = !mobileMenu.hidden;
    mobileMenu.hidden = isOpen;
    hamburger.classList.toggle("is-open", !isOpen);
    hamburger.setAttribute("aria-expanded", String(!isOpen));
    document.body.classList.toggle("is-modal-open", !isOpen);
  });

  document.querySelectorAll("[data-mobile-close]").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.hidden = true;
      hamburger.classList.remove("is-open");
      hamburger.setAttribute("aria-expanded", "false");
      document.body.classList.remove("is-modal-open");
    });
  });
}

/* =============================================
   SCROLL REVEAL
   ============================================= */

function initReveal() {
  const items = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
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

  items.forEach((el) => observer.observe(el));
}

initReveal();

/* =============================================
   FOOTER YEAR
   ============================================= */

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

/* =============================================
   REQUEST SERVICE MODAL
   ============================================= */

const bookingForm      = document.querySelector("#booking-form");
const requestModal     = document.querySelector("#request-modal");
const requestCard      = document.querySelector("#request-card");
const requestNameInput = document.querySelector("#request-name");
const serviceField     = document.querySelector('select[name="service"]');
const requestTriggers  = document.querySelectorAll(".request-trigger");
const requestContinue  = document.querySelector("#request-modal-continue");
const requestCloseBtns = document.querySelectorAll("[data-request-close]");
const requestControls  = bookingForm?.querySelectorAll("input, select, textarea") || [];

let lastSelectedService = "";

function setFieldValidity(control, isValid) {
  const field = control.closest(".field");
  if (!field) return;
  field.classList.toggle("is-invalid", !isValid);
  control.setAttribute("aria-invalid", String(!isValid));
}

function validateField(control, { emphasize = false } = {}) {
  const isValid = control.checkValidity();
  setFieldValidity(control, isValid);

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

function validateForm({ emphasize = false, focusFirst = false } = {}) {
  if (!bookingForm) return true;
  let firstInvalid = null;

  requestControls.forEach((control) => {
    const valid = validateField(control, { emphasize });
    if (!valid && !firstInvalid) firstInvalid = control;
  });

  if (firstInvalid && focusFirst) {
    window.setTimeout(() => {
      firstInvalid.focus({ preventScroll: true });
      firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 40);
  }

  return !firstInvalid;
}

function openRequestModal(service = "") {
  if (serviceField) {
    serviceField.value = service;
    setFieldValidity(serviceField, true);
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
    setFieldValidity(control, true);
    control.removeAttribute("aria-invalid");
  });

  if (requestCard) {
    requestCard.querySelector(".booking-form")?.removeAttribute("hidden");
    requestCard.querySelector(".request-card__note")?.removeAttribute("hidden");
    requestCard.querySelector("#request-modal-continue")?.removeAttribute("hidden");
    requestCard.querySelector(".request-card__success")?.remove();
  }
}

function showRequestSuccess() {
  if (!requestCard) return;
  requestCard.querySelector(".booking-form")?.setAttribute("hidden", "true");
  requestCard.querySelector(".request-card__note")?.setAttribute("hidden", "true");
  requestCard.querySelector("#request-modal-continue")?.setAttribute("hidden", "true");

  if (!requestCard.querySelector(".request-card__success")) {
    const el = document.createElement("div");
    el.className = "request-card__success";
    el.innerHTML = `
      <h4>Thank you!</h4>
      <p>We received your request and will contact you shortly to confirm your appointment time.</p>
      <p>For urgent help, call <a href="tel:+15733177239">(573) 317-7239</a>.</p>
    `;
    requestCard.appendChild(el);
  }
}

requestTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    openRequestModal(trigger.dataset.service || "");
  });
});

requestCloseBtns.forEach((btn) => btn.addEventListener("click", closeRequestModal));

if (requestContinue) {
  requestContinue.addEventListener("click", () => {
    if (!bookingForm) { closeRequestModal(); return; }
    if (validateForm({ emphasize: true, focusFirst: true })) showRequestSuccess();
  });
}

if (bookingForm) {
  bookingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (validateForm({ emphasize: true, focusFirst: true })) showRequestSuccess();
  });
}

if (serviceField) {
  serviceField.addEventListener("change", () => { lastSelectedService = serviceField.value; });
}

requestControls.forEach((control) => {
  const event = control.tagName === "SELECT" ? "change" : "input";
  control.addEventListener(event, () => validateField(control));
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && requestModal?.classList.contains("is-open")) closeRequestModal();
});

/* =============================================
   APPOINTMENT MODAL
   ============================================= */

const apptModal     = document.querySelector("#appointment-modal");
const apptForm      = document.querySelector("#appt-form");
const apptSuccess   = document.querySelector("#appt-success");
const apptTriggers  = document.querySelectorAll(".appt-trigger");
const apptCloseBtns = document.querySelectorAll("[data-appt-close]");
const apptDateInput = document.querySelector("#appt-date-input");

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
  let focused = false;

  controls.forEach((ctrl) => {
    const ok = ctrl.checkValidity();
    ctrl.classList.toggle("is-invalid", !ok);
    if (!ok) {
      valid = false;
      if (!focused) { ctrl.focus(); focused = true; }
    }
  });

  return valid;
}

apptTriggers.forEach((btn) => {
  btn.addEventListener("click", (e) => { e.preventDefault(); openApptModal(); });
});

apptCloseBtns.forEach((btn) => btn.addEventListener("click", closeApptModal));

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && apptModal?.classList.contains("is-open")) closeApptModal();
});

if (apptForm) {
  apptForm.querySelectorAll("input, select").forEach((ctrl) => {
    ctrl.addEventListener("blur", () => {
      if (ctrl.hasAttribute("required")) ctrl.classList.toggle("is-invalid", !ctrl.checkValidity());
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
