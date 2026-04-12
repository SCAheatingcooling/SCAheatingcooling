const LEAD_ENDPOINT = "";

const requestFormCard = document.querySelector("#request-form-card");
const bookingForm = document.querySelector("#booking-form");
const requestStatus = document.querySelector("#request-status");
const requestSubmit = document.querySelector("#request-submit");
const requestNameInput = document.querySelector("#request-name");
const serviceField = document.querySelector('select[name="service"]');
const requestTriggers = document.querySelectorAll(".request-trigger");
const requestControls = bookingForm?.querySelectorAll("input, select, textarea") || [];
const year = document.querySelector("#year");

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

function scrollToRequestForm() {
  requestFormCard?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openRequestForm(service = "") {
  const nextService = service || lastSelectedService || serviceField?.value || "";

  if (serviceField && nextService) {
    serviceField.value = nextService;
  }

  lastSelectedService = serviceField?.value || nextService;
  scrollToRequestForm();

  window.setTimeout(() => {
    requestNameInput?.focus();
  }, 220);
}

function setStatus(message, type = "info") {
  if (!requestStatus) {
    return;
  }

  requestStatus.textContent = message;

  if (message) {
    requestStatus.dataset.state = type;
  } else {
    delete requestStatus.dataset.state;
  }
}

async function submitLead(payload) {
  if (!LEAD_ENDPOINT) {
    console.info("Lead payload ready for integration:", payload);
    return;
  }

  const response = await fetch(LEAD_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Lead request failed");
  }
}

async function handleBookingSubmit(event) {
  event.preventDefault();

  setStatus("");

  if (!validateRequestForm({ emphasize: true, focusFirst: true })) {
    return;
  }

  if (!bookingForm || !requestSubmit) {
    return;
  }

  const formData = new FormData(bookingForm);
  const payload = Object.fromEntries(formData.entries());

  requestSubmit.disabled = true;
  requestSubmit.textContent = "Sending...";

  try {
    await submitLead(payload);
    setStatus("We will contact you shortly.", "success");
    bookingForm.reset();
    lastSelectedService = "";
  } catch (error) {
    console.error(error);
    setStatus("We could not send your request right now. Please call us at (573) 317-7239.", "error");
  } finally {
    requestSubmit.disabled = false;
    requestSubmit.textContent = "Request Service";
  }
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

if (bookingForm) {
  bookingForm.addEventListener("submit", handleBookingSubmit);
}

if (requestTriggers.length > 0) {
  requestTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openRequestForm(trigger.dataset.service || "");
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
      if (requestStatus?.textContent) {
        setStatus("");
      }
    });
  });
}

if (year) {
  year.textContent = new Date().getFullYear();
}

initReveal();
