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

function openModal(service = "") {
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

function closeModal() {
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

function showSuccess() {
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

// Init
requestTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    openModal(trigger.dataset.service || "");
  });
});

requestCloseBtns.forEach((btn) => {
  btn.addEventListener("click", closeModal);
});

if (requestContinue) {
  requestContinue.addEventListener("click", () => {
    if (!bookingForm) { closeModal(); return; }
    if (validateForm({ emphasize: true, focusFirst: true })) showSuccess();
  });
}

if (bookingForm) {
  bookingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (validateForm({ emphasize: true, focusFirst: true })) showSuccess();
  });
}

if (serviceField) {
  serviceField.addEventListener("change", () => {
    lastSelectedService = serviceField.value;
  });
}

requestControls.forEach((control) => {
  const event = control.tagName === "SELECT" ? "change" : "input";
  control.addEventListener(event, () => validateField(control));
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && requestModal?.classList.contains("is-open")) closeModal();
});
