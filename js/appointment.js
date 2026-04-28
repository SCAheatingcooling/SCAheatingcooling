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

apptCloseBtns.forEach((btn) => {
  btn.addEventListener("click", closeApptModal);
});

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
