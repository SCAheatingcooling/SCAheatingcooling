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
const requestNameInput = document.querySelector("#fullName");
const serviceField     = document.querySelector('select[name="serviceType"]');
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

async function submitRequestForm() {
  if (!validateForm({ emphasize: true, focusFirst: true })) return;

  const btn = requestContinue;
  if (btn) { btn.disabled = true; btn.textContent = "Sending..."; }

  const data = new FormData(bookingForm);
  data.append("form_type", "request");

  try {
    const res  = await fetch("form-handler.php", { method: "POST", body: data });
    const json = await res.json();

    if (json.success) {
      showRequestSuccess();
    } else {
      alert("Something went wrong. Please call us at (573) 317-7239.");
    }
  } catch {
    alert("Something went wrong. Please call us at (573) 317-7239.");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Submit Request"; }
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
    submitRequestForm();
  });
}

if (bookingForm) {
  bookingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    submitRequestForm();
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

/* =============================================
   REAL-TIME BOOKING SYSTEM (PRODUCTION API)
   ============================================= */

const API_BASE_URL = "https://booking-platformdashboard-production.up.railway.app/api";
const API_HEADERS = {
  "Authorization": "Bearer client-key-abc",
  "Content-Type": "application/json"
};

// DOM Elements
const apptModal          = document.querySelector("#appointment-modal");
const apptTriggers       = document.querySelectorAll(".appt-trigger");
const apptCloseBtns      = document.querySelectorAll("[data-appt-close]");

const stepCalendar       = document.querySelector("#booking-step-calendar");
const stepSlots          = document.querySelector("#booking-step-slots");
const stepForm           = document.querySelector("#booking-step-form");
const stepSuccess        = document.querySelector("#booking-step-success");
const stepIndicators     = document.querySelectorAll(".booking-step-indicator");

const prevMonthBtn       = document.querySelector("#cal-prev-btn");
const nextMonthBtn       = document.querySelector("#cal-next-btn");
const monthYearDisplay   = document.querySelector("#calendar-month-year");
const daysGrid           = document.querySelector("#calendar-days-grid");

const backToCalendarBtn  = document.querySelector("#back-to-calendar");
const backToSlotsBtn     = document.querySelector("#back-to-slots");
const selectedDateDisp   = document.querySelector("#selected-date-display");
const slotsGrid          = document.querySelector("#slots-grid");
const slotsSkeleton      = document.querySelector("#slots-skeleton");
const noSlotsMsg         = document.querySelector("#no-slots-msg");

const slotSummary        = document.querySelector("#selected-slot-summary");
const bookingSubmitBtn   = document.querySelector("#booking-submit-btn");
const realtimeBookingForm= document.querySelector("#realtime-booking-form");

const errorBanner        = document.querySelector("#booking-error-banner");
const errorText          = document.querySelector("#error-msg-text");
const errorRetryBtn      = document.querySelector("#error-retry-btn");

const confCode           = document.querySelector("#conf-code");
const confDate           = document.querySelector("#conf-date");
const confTime           = document.querySelector("#conf-time");
const confGuests         = document.querySelector("#conf-guests");

// Booking State
let bookingState = {
  currentYear: 2026,
  currentMonth: 5, 
  selectedDateStr: "", // YYYY-MM-DD
  selectedSlotTime: "", // ISO UTC String
  selectedSlotLocal: "", // Format "HH:MM"
  partySize: 2,
  monthAvailability: {}, // Cache map
  lastFailedAction: null
};

// Initial Month setup
const todayDate = new Date();
bookingState.currentYear = todayDate.getFullYear();
bookingState.currentMonth = todayDate.getMonth();

// helper to format dates as YYYY-MM-DD local
function formatDateString(year, month, day) {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

// Convert YYYY-MM-DD to readable local date
function getReadableLocalDate(dateStr) {
  const parts = dateStr.split('-');
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// Steps View Switcher
function setBookingStep(stepNum) {
  stepIndicators.forEach((indicator) => {
    const s = parseInt(indicator.dataset.step, 10);
    indicator.classList.toggle("active", s === stepNum);
    indicator.classList.toggle("completed", s < stepNum);
  });

  stepCalendar.hidden = stepNum !== 1;
  stepSlots.hidden = stepNum !== 2;
  stepForm.hidden = stepNum !== 3;
  stepSuccess.hidden = stepNum !== 4;
}

// API Error Handler
function showBookingError(message, retryCallback) {
  errorText.textContent = message;
  bookingState.lastFailedAction = retryCallback;
  errorBanner.hidden = false;
}

function hideBookingError() {
  if (errorBanner) errorBanner.hidden = true;
  bookingState.lastFailedAction = null;
}

// REST APIs
async function apiGetAvailabilityRange(startStr, endStr) {
  const url = `${API_BASE_URL}/availability/range?start=${startStr}&end=${endStr}`;
  const response = await fetch(url, {
    method: "GET",
    headers: API_HEADERS
  });
  if (!response.ok) throw new Error("Range availability API failed");
  return await response.json();
}

async function apiGetDaySlots(dateStr) {
  const url = `${API_BASE_URL}/availability?date=${dateStr}`;
  const response = await fetch(url, {
    method: "GET",
    headers: API_HEADERS
  });
  if (!response.ok) throw new Error("Day availability API failed");
  return await response.json();
}

async function apiCreateBooking(payload) {
  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: "POST",
    headers: API_HEADERS,
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to confirm booking");
  }
  return await response.json();
}

// Render Calendar skeleton loader
function renderCalendarSkeleton() {
  if (!daysGrid) return;
  daysGrid.innerHTML = "";
  for (let i = 0; i < 35; i++) {
    const skeleton = document.createElement("div");
    skeleton.className = "skeleton-box";
    daysGrid.appendChild(skeleton);
  }
}

// Fetch availability and draw calendar
async function loadCalendarMonth() {
  hideBookingError();
  renderCalendarSkeleton();
  
  const year = bookingState.currentYear;
  const month = bookingState.currentMonth;

  // Format start and end date
  const startDayStr = formatDateString(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDayStr = formatDateString(year, month, lastDay);

  const cacheKey = `${year}-${month}`;
  let daysData = bookingState.monthAvailability[cacheKey];

  try {
    if (!daysData) {
      const data = await apiGetAvailabilityRange(startDayStr, endDayStr);
      daysData = data.days || [];
      bookingState.monthAvailability[cacheKey] = daysData;
    }
    drawCalendarGrid(daysData);
  } catch (error) {
    console.error(error);
    showBookingError("Unable to load calendar availability. Please check your internet connection.", loadCalendarMonth);
    if (daysGrid) daysGrid.innerHTML = "";
  }
}

// Render Calendar Grid
function drawCalendarGrid(daysData) {
  if (!daysGrid) return;
  daysGrid.innerHTML = "";
  const year = bookingState.currentYear;
  const month = bookingState.currentMonth;

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  if (monthYearDisplay) monthYearDisplay.textContent = `${monthNames[month]} ${year}`;

  // Padding days (first day of week index)
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "day-empty";
    daysGrid.appendChild(emptyCell);
  }

  // Days in month
  const totalDays = new Date(year, month + 1, 0).getDate();
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);

  // Map API days for quick lookup
  const apiDaysMap = {};
  daysData.forEach(d => {
    apiDaysMap[d.date] = d;
  });

  for (let day = 1; day <= totalDays; day++) {
    const dateStr = formatDateString(year, month, day);
    const dayBtn = document.createElement("button");
    dayBtn.type = "button";
    dayBtn.className = "day-btn";
    
    // Day number element
    const dayNum = document.createElement("span");
    dayNum.textContent = day;
    dayBtn.appendChild(dayNum);

    // Indicator dot
    const indicator = document.createElement("span");
    indicator.className = "day-indicator";
    dayBtn.appendChild(indicator);

    // Calculate disabled status (past days are disabled)
    const cellDateObj = new Date(year, month, day);
    cellDateObj.setHours(0,0,0,0);

    const isPast = cellDateObj < todayStart;
    const apiDay = apiDaysMap[dateStr];

    if (isPast) {
      dayBtn.disabled = true;
    } else if (apiDay) {
      dayBtn.dataset.status = apiDay.status; // open, limited, full
      if (apiDay.closed || apiDay.status === "full") {
        dayBtn.disabled = true;
      } else {
        dayBtn.addEventListener("click", () => {
          document.querySelectorAll(".day-btn").forEach(b => b.classList.remove("selected"));
          dayBtn.classList.add("selected");
          onDaySelected(dateStr);
        });
      }
    } else {
      // Default to open if API has no record
      dayBtn.dataset.status = "open";
      dayBtn.addEventListener("click", () => {
        document.querySelectorAll(".day-btn").forEach(b => b.classList.remove("selected"));
        dayBtn.classList.add("selected");
        onDaySelected(dateStr);
      });
    }

    daysGrid.appendChild(dayBtn);
  }

  // Disable Prev Month if the navigated month is in the past
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const navigatedMonthStart = new Date(year, month, 1);
  if (prevMonthBtn) prevMonthBtn.disabled = navigatedMonthStart <= currentMonthStart;
}

// Day Selection -> Load Slots
async function onDaySelected(dateStr) {
  hideBookingError();
  bookingState.selectedDateStr = dateStr;
  if (selectedDateDisp) selectedDateDisp.textContent = getReadableLocalDate(dateStr);
  
  // Transition to step 2
  setBookingStep(2);
  if (slotsGrid) slotsGrid.innerHTML = "";
  if (noSlotsMsg) noSlotsMsg.hidden = true;
  if (slotsSkeleton) slotsSkeleton.hidden = false;

  try {
    const data = await apiGetDaySlots(dateStr);
    const slots = data.slots || [];
    if (slotsSkeleton) slotsSkeleton.hidden = true;

    if (slots.length === 0) {
      if (noSlotsMsg) noSlotsMsg.hidden = false;
      return;
    }

    drawSlots(slots);
  } catch (error) {
    console.error(error);
    if (slotsSkeleton) slotsSkeleton.hidden = true;
    showBookingError("Unable to retrieve available hours. Please try again.", () => onDaySelected(dateStr));
  }
}

// Render Time Slots
function drawSlots(slots) {
  if (!slotsGrid) return;
  slotsGrid.innerHTML = "";

  // Convert UTC ISO to Local User Time
  const sortedSlots = slots
    .map(slot => {
      const dateObj = new Date(slot.time);
      const localTimeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      return {
        ...slot,
        localTimeStr,
        dateObj
      };
    })
    // Sort chronologically by date
    .sort((a, b) => a.dateObj - b.dateObj);

  sortedSlots.forEach(slot => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slot-btn";
    btn.textContent = slot.localTimeStr;

    if (slot.status === "full") {
      btn.disabled = true;
    } else {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".slot-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        onSlotSelected(slot.time, slot.localTimeStr);
      });
    }

    slotsGrid.appendChild(btn);
  });
}

// Slot Selection -> Show Form
function onSlotSelected(utcTimeStr, localTimeStr) {
  bookingState.selectedSlotTime = utcTimeStr;
  bookingState.selectedSlotLocal = localTimeStr;

  if (slotSummary) {
    slotSummary.innerHTML = `Date: <strong>${getReadableLocalDate(bookingState.selectedDateStr)}</strong> at <strong>${localTimeStr}</strong>`;
  }
  setBookingStep(3);
}

// Validate Real-time Form
function validateRealtimeForm() {
  const nameField = document.querySelector("#booking-name");
  const phoneField = document.querySelector("#booking-phone");
  const partyField = document.querySelector("#booking-party-size");

  let isValid = true;

  [nameField, phoneField, partyField].forEach(ctrl => {
    if (!ctrl) return;
    const valid = ctrl.checkValidity();
    const field = ctrl.closest(".field");
    if (field) field.classList.toggle("is-invalid", !valid);
    if (!valid && isValid) {
      ctrl.focus();
      isValid = false;
    }
  });

  return isValid;
}

// Submit Booking Form to Backend API
async function submitBooking() {
  if (!validateRealtimeForm()) return;
  hideBookingError();

  const nameVal = document.querySelector("#booking-name")?.value.trim() || "";
  const phoneVal = document.querySelector("#booking-phone")?.value.trim() || "";
  const emailVal = document.querySelector("#booking-email")?.value.trim() || null;
  const partyVal = parseInt(document.querySelector("#booking-party-size")?.value || "2", 10);
  const notesVal = document.querySelector("#booking-notes")?.value.trim() || null;

  const payload = {
    customer_name: nameVal,
    customer_phone: phoneVal,
    customer_email: emailVal,
    party_size: partyVal,
    booking_at: bookingState.selectedSlotTime,
    notes: notesVal
  };

  // UI loading state
  if (bookingSubmitBtn) {
    bookingSubmitBtn.disabled = true;
    bookingSubmitBtn.innerHTML = `<span class="button-spinner"></span> Confirming...`;
  }

  try {
    const confirmation = await apiCreateBooking(payload);
    
    // Fill Step 4 success details
    if (confCode) confCode.textContent = confirmation.id;
    if (confDate) confDate.textContent = getReadableLocalDate(bookingState.selectedDateStr);
    if (confTime) confTime.textContent = `${bookingState.selectedSlotLocal} (Local Time)`;
    if (confGuests) confGuests.textContent = `${confirmation.party_size} ${confirmation.party_size === 1 ? 'person' : 'people'}`;

    setBookingStep(4);
  } catch (error) {
    console.error(error);
    showBookingError(error.message || "Failed to register your booking. Please try again or call us.", submitBooking);
  } finally {
    if (bookingSubmitBtn) {
      bookingSubmitBtn.disabled = false;
      bookingSubmitBtn.textContent = "Confirm Real-Time Booking";
    }
  }
}

// Reset Wizard state on load or close
function resetBookingWizard() {
  hideBookingError();
  const now = new Date();
  bookingState.currentYear = now.getFullYear();
  bookingState.currentMonth = now.getMonth();
  bookingState.selectedDateStr = "";
  bookingState.selectedSlotTime = "";
  bookingState.selectedSlotLocal = "";

  if (realtimeBookingForm) {
    realtimeBookingForm.reset();
    realtimeBookingForm.querySelectorAll(".field").forEach(f => f.classList.remove("is-invalid"));
  }

  setBookingStep(1);
}

// Modal open/close hooks
function openApptModal() {
  resetBookingWizard();
  apptModal?.classList.add("is-open");
  apptModal?.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-modal-open");
  loadCalendarMonth();
}

function closeApptModal() {
  apptModal?.classList.remove("is-open");
  apptModal?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-modal-open");
}

// Event Bindings
apptTriggers.forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    openApptModal();
  });
});

apptCloseBtns.forEach(btn => btn.addEventListener("click", closeApptModal));

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && apptModal?.classList.contains("is-open")) {
    closeApptModal();
  }
});

// Month controls
prevMonthBtn?.addEventListener("click", () => {
  bookingState.currentMonth--;
  if (bookingState.currentMonth < 0) {
    bookingState.currentMonth = 11;
    bookingState.currentYear--;
  }
  loadCalendarMonth();
});

nextMonthBtn?.addEventListener("click", () => {
  bookingState.currentMonth++;
  if (bookingState.currentMonth > 11) {
    bookingState.currentMonth = 0;
    bookingState.currentYear++;
  }
  loadCalendarMonth();
});

// Step navigation
backToCalendarBtn?.addEventListener("click", () => {
  hideBookingError();
  setBookingStep(1);
});

backToSlotsBtn?.addEventListener("click", () => {
  hideBookingError();
  setBookingStep(2);
});

// Realtime Form submission
realtimeBookingForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  submitBooking();
});

// ErrorRetry binding
errorRetryBtn?.addEventListener("click", () => {
  if (bookingState.lastFailedAction) {
    const action = bookingState.lastFailedAction;
    hideBookingError();
    action();
  }
});

// Live Form validation listeners
document.querySelectorAll(".realtime-booking-form input, .realtime-booking-form textarea").forEach(ctrl => {
  ctrl.addEventListener("input", () => {
    const field = ctrl.closest(".field");
    if (field) field.classList.remove("is-invalid");
  });
  if (ctrl.tagName === "INPUT" && ctrl.hasAttribute("required")) {
    ctrl.addEventListener("blur", () => {
      const field = ctrl.closest(".field");
      if (field) field.classList.toggle("is-invalid", !ctrl.checkValidity());
    });
  }
});
