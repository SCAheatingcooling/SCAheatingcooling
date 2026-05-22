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

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

initReveal();

/* =============================================
   REAL-TIME BOOKING SYSTEM
   ============================================= */

const API_BASE_URL = "https://booking-platformdashboard-production.up.railway.app/api";
const API_HEADERS  = {
  "Authorization": "Bearer client-key-abc",
  "Content-Type": "application/json"
};

// DOM
const apptModal         = document.querySelector("#appointment-modal");
const apptTriggers      = document.querySelectorAll(".appt-trigger");
const apptCloseBtns     = document.querySelectorAll("[data-appt-close]");

const stepCalendar      = document.querySelector("#booking-step-calendar");
const stepSlots         = document.querySelector("#booking-step-slots");
const stepForm          = document.querySelector("#booking-step-form");
const stepSuccess       = document.querySelector("#booking-step-success");
const stepIndicators    = document.querySelectorAll(".booking-step-indicator");

const prevMonthBtn      = document.querySelector("#cal-prev-btn");
const nextMonthBtn      = document.querySelector("#cal-next-btn");
const monthYearDisplay  = document.querySelector("#calendar-month-year");
const daysGrid          = document.querySelector("#calendar-days-grid");

const backToCalendarBtn = document.querySelector("#back-to-calendar");
const backToSlotsBtn    = document.querySelector("#back-to-slots");
const selectedDateDisp  = document.querySelector("#selected-date-display");
const slotsGrid         = document.querySelector("#slots-grid");
const slotsSkeleton     = document.querySelector("#slots-skeleton");
const noSlotsMsg        = document.querySelector("#no-slots-msg");

const slotSummary       = document.querySelector("#selected-slot-summary");
const bookingSubmitBtn  = document.querySelector("#booking-submit-btn");
const realtimeBookingForm = document.querySelector("#realtime-booking-form");

const errorBanner       = document.querySelector("#booking-error-banner");
const errorText         = document.querySelector("#error-msg-text");
const errorRetryBtn     = document.querySelector("#error-retry-btn");

const confCode          = document.querySelector("#conf-code");
const confDate          = document.querySelector("#conf-date");
const confTime          = document.querySelector("#conf-time");
const confGuests        = document.querySelector("#conf-guests");

// State
let bookingState = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  selectedDateStr: "",
  selectedSlotTime: "",
  selectedSlotLocal: "",
  partySize: 2,
  monthAvailability: {},
  lastFailedAction: null
};

// Helpers
function formatDateString(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function getReadableLocalDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return new Date(+y, +m - 1, +d).toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
}

function setBookingStep(n) {
  stepIndicators.forEach(el => {
    const s = parseInt(el.dataset.step, 10);
    el.classList.toggle("active", s === n);
    el.classList.toggle("completed", s < n);
  });
  stepCalendar.hidden = n !== 1;
  stepSlots.hidden    = n !== 2;
  stepForm.hidden     = n !== 3;
  stepSuccess.hidden  = n !== 4;
}

function showBookingError(message, retryFn) {
  if (errorText)   errorText.textContent = message;
  if (errorBanner) errorBanner.hidden = false;
  bookingState.lastFailedAction = retryFn || null;
}

function hideBookingError() {
  if (errorBanner) errorBanner.hidden = true;
  bookingState.lastFailedAction = null;
}

// API
async function apiGetAvailabilityRange(start, end) {
  const res = await fetch(`${API_BASE_URL}/availability/range?start=${start}&end=${end}`, {
    headers: API_HEADERS
  });
  if (!res.ok) throw new Error("Range availability API failed");
  return res.json();
}

async function apiGetDaySlots(date) {
  const res = await fetch(`${API_BASE_URL}/availability?date=${date}`, {
    headers: API_HEADERS
  });
  if (!res.ok) throw new Error("Day availability API failed");
  return res.json();
}

async function apiCreateBooking(payload) {
  const res = await fetch(`${API_BASE_URL}/bookings`, {
    method: "POST",
    headers: API_HEADERS,
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to confirm booking");
  }
  return res.json();
}

// Calendar
function renderCalendarSkeleton() {
  if (!daysGrid) return;
  daysGrid.innerHTML = "";
  for (let i = 0; i < 35; i++) {
    const el = document.createElement("div");
    el.className = "skeleton-box";
    daysGrid.appendChild(el);
  }
}

async function loadCalendarMonth() {
  hideBookingError();
  renderCalendarSkeleton();

  const { currentYear: y, currentMonth: m } = bookingState;
  const start = formatDateString(y, m, 1);
  const end   = formatDateString(y, m, new Date(y, m + 1, 0).getDate());
  const key   = `${y}-${m}`;

  let daysData = bookingState.monthAvailability[key];
  try {
    if (!daysData) {
      const data = await apiGetAvailabilityRange(start, end);
      daysData = data.days || [];
      bookingState.monthAvailability[key] = daysData;
    }
    drawCalendarGrid(daysData);
  } catch (e) {
    console.error(e);
    showBookingError("Unable to load calendar. Please check your connection.", loadCalendarMonth);
    if (daysGrid) daysGrid.innerHTML = "";
  }
}

function drawCalendarGrid(daysData) {
  if (!daysGrid) return;
  daysGrid.innerHTML = "";

  const { currentYear: y, currentMonth: m } = bookingState;
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  if (monthYearDisplay) monthYearDisplay.textContent = `${monthNames[m]} ${y}`;

  const firstDOW = new Date(y, m, 1).getDay();
  for (let i = 0; i < firstDOW; i++) {
    const cell = document.createElement("div");
    cell.className = "day-empty";
    daysGrid.appendChild(cell);
  }

  const totalDays = new Date(y, m + 1, 0).getDate();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const apiMap = {};
  daysData.forEach(d => { apiMap[d.date] = d; });

  for (let day = 1; day <= totalDays; day++) {
    const dateStr = formatDateString(y, m, day);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day-btn";

    const numEl = document.createElement("span");
    numEl.textContent = day;
    btn.appendChild(numEl);

    const dot = document.createElement("span");
    dot.className = "day-indicator";
    btn.appendChild(dot);

    const cellDate = new Date(y, m, day);
    cellDate.setHours(0, 0, 0, 0);
    const isPast = cellDate < todayStart;
    const apiDay = apiMap[dateStr];

    if (isPast) {
      btn.disabled = true;
    } else if (apiDay) {
      btn.dataset.status = apiDay.status;
      if (apiDay.closed || apiDay.status === "full") {
        btn.disabled = true;
      } else {
        btn.addEventListener("click", () => {
          daysGrid.querySelectorAll(".day-btn").forEach(b => b.classList.remove("selected"));
          btn.classList.add("selected");
          onDaySelected(dateStr);
        });
      }
    } else {
      btn.dataset.status = "open";
      btn.addEventListener("click", () => {
        daysGrid.querySelectorAll(".day-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        onDaySelected(dateStr);
      });
    }

    daysGrid.appendChild(btn);
  }

  const now = new Date();
  const curStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const navStart = new Date(y, m, 1);
  if (prevMonthBtn) prevMonthBtn.disabled = navStart <= curStart;
}

// Slots
async function onDaySelected(dateStr) {
  hideBookingError();
  bookingState.selectedDateStr = dateStr;
  if (selectedDateDisp) selectedDateDisp.textContent = getReadableLocalDate(dateStr);

  setBookingStep(2);
  if (slotsGrid)     slotsGrid.innerHTML = "";
  if (noSlotsMsg)    noSlotsMsg.hidden = true;
  if (slotsSkeleton) slotsSkeleton.hidden = false;

  try {
    const data  = await apiGetDaySlots(dateStr);
    const slots = data.slots || [];
    if (slotsSkeleton) slotsSkeleton.hidden = true;

    if (!slots.length) {
      if (noSlotsMsg) noSlotsMsg.hidden = false;
      return;
    }
    drawSlots(slots);
  } catch (e) {
    console.error(e);
    if (slotsSkeleton) slotsSkeleton.hidden = true;
    showBookingError("Unable to retrieve available hours. Please try again.", () => onDaySelected(dateStr));
  }
}

function drawSlots(slots) {
  if (!slotsGrid) return;
  slotsGrid.innerHTML = "";

  const sorted = slots
    .map(s => {
      const d = new Date(s.time);
      return { ...s, dateObj: d, localStr: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) };
    })
    .sort((a, b) => a.dateObj - b.dateObj);

  sorted.forEach(slot => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slot-btn";
    btn.textContent = slot.localStr;

    if (slot.status === "full") {
      btn.disabled = true;
    } else {
      btn.addEventListener("click", () => {
        slotsGrid.querySelectorAll(".slot-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        onSlotSelected(slot.time, slot.localStr);
      });
    }
    slotsGrid.appendChild(btn);
  });
}

function onSlotSelected(utcStr, localStr) {
  bookingState.selectedSlotTime  = utcStr;
  bookingState.selectedSlotLocal = localStr;
  if (slotSummary) {
    slotSummary.innerHTML = `Date: <strong>${getReadableLocalDate(bookingState.selectedDateStr)}</strong> at <strong>${localStr}</strong>`;
  }
  setBookingStep(3);
}

// Form submission
async function submitBooking() {
  const nameField  = document.querySelector("#booking-name");
  const phoneField = document.querySelector("#booking-phone");
  const partyField = document.querySelector("#booking-party-size");
  let valid = true;

  [nameField, phoneField, partyField].forEach(ctrl => {
    if (!ctrl) return;
    const ok = ctrl.checkValidity();
    const f  = ctrl.closest(".field");
    if (f) f.classList.toggle("is-invalid", !ok);
    if (!ok && valid) { ctrl.focus(); valid = false; }
  });
  if (!valid) return;

  hideBookingError();
  if (bookingSubmitBtn) {
    bookingSubmitBtn.disabled = true;
    bookingSubmitBtn.innerHTML = `<span class="button-spinner"></span> Confirming...`;
  }

  try {
    const result = await apiCreateBooking({
      customer_name:  nameField?.value.trim()  || "",
      customer_phone: phoneField?.value.trim() || "",
      customer_email: document.querySelector("#booking-email")?.value.trim() || null,
      party_size:     parseInt(partyField?.value || "2", 10),
      booking_at:     bookingState.selectedSlotTime,
      notes:          document.querySelector("#booking-notes")?.value.trim() || null
    });

    if (confCode)   confCode.textContent   = result.id;
    if (confDate)   confDate.textContent   = getReadableLocalDate(bookingState.selectedDateStr);
    if (confTime)   confTime.textContent   = `${bookingState.selectedSlotLocal} (Local Time)`;
    if (confGuests) confGuests.textContent = `${result.party_size} ${result.party_size === 1 ? "person" : "people"}`;

    setBookingStep(4);
  } catch (e) {
    console.error(e);
    showBookingError(e.message || "Failed to register your booking. Please try again or call us.", submitBooking);
  } finally {
    if (bookingSubmitBtn) {
      bookingSubmitBtn.disabled = false;
      bookingSubmitBtn.textContent = "Confirm Real-Time Booking";
    }
  }
}

// Modal open / close
function openApptModal() {
  // Reset wizard state
  hideBookingError();
  const now = new Date();
  bookingState.currentYear     = now.getFullYear();
  bookingState.currentMonth    = now.getMonth();
  bookingState.selectedDateStr = "";
  bookingState.selectedSlotTime = "";
  bookingState.selectedSlotLocal = "";
  if (realtimeBookingForm) {
    realtimeBookingForm.reset();
    realtimeBookingForm.querySelectorAll(".field").forEach(f => f.classList.remove("is-invalid"));
  }
  setBookingStep(1);

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

// Event bindings
apptTriggers.forEach(btn => {
  btn.addEventListener("click", e => { e.preventDefault(); openApptModal(); });
});

apptCloseBtns.forEach(btn => btn.addEventListener("click", closeApptModal));

window.addEventListener("keydown", e => {
  if (e.key === "Escape" && apptModal?.classList.contains("is-open")) closeApptModal();
});

prevMonthBtn?.addEventListener("click", () => {
  bookingState.currentMonth--;
  if (bookingState.currentMonth < 0) { bookingState.currentMonth = 11; bookingState.currentYear--; }
  loadCalendarMonth();
});

nextMonthBtn?.addEventListener("click", () => {
  bookingState.currentMonth++;
  if (bookingState.currentMonth > 11) { bookingState.currentMonth = 0; bookingState.currentYear++; }
  loadCalendarMonth();
});

backToCalendarBtn?.addEventListener("click", () => { hideBookingError(); setBookingStep(1); });
backToSlotsBtn?.addEventListener("click",    () => { hideBookingError(); setBookingStep(2); });

realtimeBookingForm?.addEventListener("submit", e => { e.preventDefault(); submitBooking(); });

errorRetryBtn?.addEventListener("click", () => {
  const action = bookingState.lastFailedAction;
  if (action) { hideBookingError(); action(); }
});

document.querySelectorAll(".realtime-booking-form input, .realtime-booking-form textarea").forEach(ctrl => {
  ctrl.addEventListener("input", () => {
    const f = ctrl.closest(".field");
    if (f) f.classList.remove("is-invalid");
  });
  if (ctrl.tagName === "INPUT" && ctrl.hasAttribute("required")) {
    ctrl.addEventListener("blur", () => {
      const f = ctrl.closest(".field");
      if (f) f.classList.toggle("is-invalid", !ctrl.checkValidity());
    });
  }
});
