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

if (year) {
  year.textContent = new Date().getFullYear();
}

initReveal();

/* ══════════════════════════════════════════════════════════════
   BOOKING WIDGET
══════════════════════════════════════════════════════════════ */
(function () {
  const API_BASE = "https://booking-platformdashboard-production.up.railway.app/api";
  const AUTH_HEADER = { Authorization: "Bearer client-key-abc" };

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  // ── State ──────────────────────────────────────────────────
  let viewYear, viewMonth;
  let availMap  = {};   // "YYYY-MM-DD" → { status, closed, load }
  let calFailed = false;
  let selDate   = null; // "YYYY-MM-DD"
  let selSlot   = null; // ISO UTC string

  // ── DOM refs ───────────────────────────────────────────────
  const widget       = document.getElementById("bk-widget");
  if (!widget) return; // guard: booking section not present

  const calGrid      = document.getElementById("bk-cal-grid");
  const calTitle     = document.getElementById("bk-cal-title");
  const calPrev      = document.getElementById("bk-cal-prev");
  const calNext      = document.getElementById("bk-cal-next");
  const calErr       = document.getElementById("bk-cal-err");
  const slotsGrid    = document.getElementById("bk-slots-grid");
  const dateBadge    = document.getElementById("bk-date-badge");
  const slotBadge    = document.getElementById("bk-slot-badge");
  const form         = document.getElementById("bk-form");
  const formErr      = document.getElementById("bk-form-err");
  const submitBtn    = document.getElementById("bk-submit");
  const confirmCard  = document.getElementById("bk-confirm-card");
  const stepEls      = widget.querySelectorAll(".bk-step");

  const panels = {
    1: document.getElementById("bk-panel-1"),
    2: document.getElementById("bk-panel-2"),
    3: document.getElementById("bk-panel-3"),
    4: document.getElementById("bk-panel-4"),
  };

  // ── Utilities ──────────────────────────────────────────────
  function showPanel(n) {
    Object.values(panels).forEach((p) => p && p.classList.add("bk-panel--hidden"));
    if (panels[n]) panels[n].classList.remove("bk-panel--hidden");
    stepEls.forEach((el) => {
      const s = +el.dataset.step;
      el.classList.toggle("bk-step--active", s === n);
      el.classList.toggle("bk-step--done",   s < n);
    });
  }

  function dateLabel(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric",
    });
  }

  function slotTime(isoStr) {
    return new Date(isoStr).toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit",
    });
  }

  function padTwo(n) { return String(n).padStart(2, "0"); }

  // ── Calendar ───────────────────────────────────────────────
  function showCalSkeleton() {
    let h = DAYS.map((d) => `<span class="bk-cal__dow">${d}</span>`).join("");
    for (let i = 0; i < 35; i++) {
      h += `<span class="bk-cal__day bk-cal__day--skeleton"></span>`;
    }
    calGrid.innerHTML = h;
  }

  function renderCal() {
    calTitle.textContent = `${MONTHS[viewMonth]} ${viewYear}`;

    if (calFailed) {
      calErr.hidden = false;
      let h = DAYS.map((d) => `<span class="bk-cal__dow">${d}</span>`).join("");
      calGrid.innerHTML = h;
      return;
    }
    calErr.hidden = true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDow   = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    let h = DAYS.map((d) => `<span class="bk-cal__dow">${d}</span>`).join("");

    for (let i = 0; i < firstDow; i++) {
      h += `<span class="bk-cal__day bk-cal__day--empty"></span>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const ds   = `${viewYear}-${padTwo(viewMonth + 1)}-${padTwo(day)}`;
      const date = new Date(viewYear, viewMonth, day);
      const past = date < today;
      const info = availMap[ds];
      const closed = past || !info || info.closed || info.status === "full";
      const limited = !closed && info && info.status === "limited";
      const isToday = date.toDateString() === today.toDateString();
      const isSel   = ds === selDate;

      let cls = "bk-cal__day";
      if (closed)       cls += " bk-cal__day--closed";
      else if (limited) cls += " bk-cal__day--limited";
      else              cls += " bk-cal__day--open";
      if (isSel)        cls += " bk-cal__day--selected";
      if (isToday)      cls += " bk-cal__day--today";

      if (closed) {
        h += `<span class="${cls}" aria-disabled="true">${day}</span>`;
      } else {
        const lbl = isToday ? `Today, ${dateLabel(ds)}` : dateLabel(ds);
        h += `<button class="${cls}" type="button" data-date="${ds}" aria-label="${lbl}">${day}</button>`;
      }
    }

    calGrid.innerHTML = h;
    calGrid.querySelectorAll("button.bk-cal__day").forEach((btn) =>
      btn.addEventListener("click", () => handleDayClick(btn.dataset.date))
    );

    // disable prev arrow if already at current month
    const now = new Date();
    calPrev.disabled = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  }

  async function loadCal(year, month) {
    viewYear  = year;
    viewMonth = month;
    calFailed = false;
    calTitle.textContent = `${MONTHS[month]} ${year}`;
    showCalSkeleton();

    const start = `${year}-${padTwo(month + 1)}-01`;
    const end   = `${year}-${padTwo(month + 1)}-${new Date(year, month + 1, 0).getDate()}`;

    try {
      const res = await fetch(`${API_BASE}/availability/range?start=${start}&end=${end}`, {
        headers: AUTH_HEADER,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      availMap = {};
      (data.days || []).forEach((d) => { availMap[d.date] = d; });
    } catch (e) {
      console.error("[booking] range error:", e);
      calFailed = true;
      availMap  = {};
    }

    renderCal();
  }

  // ── Slots ──────────────────────────────────────────────────
  function showSlotsSkeleton() {
    slotsGrid.innerHTML = Array.from({ length: 8 }, (_, i) =>
      `<span class="bk-slot bk-slot--skeleton" style="animation-delay:${i * 0.07}s"></span>`
    ).join("");
  }

  async function handleDayClick(ds) {
    selDate = ds;
    renderCal();
    dateBadge.textContent = dateLabel(ds);
    showPanel(2);
    showSlotsSkeleton();

    try {
      const res = await fetch(`${API_BASE}/availability?date=${ds}`, {
        headers: AUTH_HEADER,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      renderSlots(data.slots || []);
    } catch (e) {
      console.error("[booking] slots error:", e);
      slotsGrid.innerHTML =
        `<p class="bk-slots-err">Could not load available times. Please try again.</p>`;
    }
  }

  function renderSlots(slots) {
    const open = slots.filter((s) => s.status === "open");
    if (!open.length) {
      slotsGrid.innerHTML =
        `<p class="bk-slots-empty">No open slots for this date. Please choose another day.</p>`;
      return;
    }
    slotsGrid.innerHTML = open
      .map((s) => {
        const sel = s.time === selSlot ? " bk-slot--selected" : "";
        return `<button class="bk-slot${sel}" type="button" data-time="${s.time}">${slotTime(s.time)}</button>`;
      })
      .join("");
    slotsGrid.querySelectorAll(".bk-slot").forEach((btn) =>
      btn.addEventListener("click", () => handleSlotClick(btn.dataset.time))
    );
  }

  // ── Form ───────────────────────────────────────────────────
  function handleSlotClick(iso) {
    selSlot = iso;
    slotBadge.textContent = `${dateLabel(selDate)} · ${slotTime(iso)}`;
    showPanel(3);
    formErr.hidden = true;
  }

  function setSubmitting(on) {
    submitBtn.disabled = on;
    submitBtn.querySelector(".bk-submit__lbl").hidden = on;
    submitBtn.querySelector(".bk-submit__spin").hidden = !on;
  }

  function showFormErr(msg) {
    formErr.textContent = msg;
    formErr.hidden = false;
    formErr.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const name  = document.getElementById("bkf-name").value.trim();
    const phone = document.getElementById("bkf-phone").value.trim();
    const email = document.getElementById("bkf-email").value.trim() || null;
    const party = parseInt(document.getElementById("bkf-party").value, 10);
    const notes = document.getElementById("bkf-notes").value.trim() || null;

    if (!name || !phone || !party || party < 1) {
      showFormErr("Please fill in all required fields.");
      return;
    }

    formErr.hidden = true;
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: { ...AUTH_HEADER, "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name:  name,
          customer_phone: phone,
          customer_email: email,
          party_size:     party,
          booking_at:     selSlot,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
      showConfirm(data);
    } catch (err) {
      console.error("[booking] submit error:", err);
      showFormErr(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function showConfirm(data) {
    const rows = [
      ["Date",        dateLabel(selDate)],
      ["Time",        slotTime(selSlot)],
      ["Systems",     data.party_size],
      ["Booking&nbsp;ID", `<span class="bk-confirm-id">${data.id}</span>`],
    ];
    confirmCard.innerHTML = rows
      .map(([lbl, val]) =>
        `<div class="bk-confirm-row">
          <span class="bk-confirm-row__label">${lbl}</span>
          <span class="bk-confirm-row__val">${val}</span>
        </div>`
      )
      .join("");

    if (data.requires_confirmation_call) {
      confirmCard.insertAdjacentHTML(
        "afterend",
        `<p class="bk-confirm-note">We may call to confirm your appointment.</p>`
      );
    }
    showPanel(4);
  }

  // ── Init ───────────────────────────────────────────────────
  const now = new Date();
  loadCal(now.getFullYear(), now.getMonth());

  calPrev.addEventListener("click", () => {
    const d = new Date(viewYear, viewMonth - 1, 1);
    loadCal(d.getFullYear(), d.getMonth());
  });
  calNext.addEventListener("click", () => {
    const d = new Date(viewYear, viewMonth + 1, 1);
    loadCal(d.getFullYear(), d.getMonth());
  });

  document.getElementById("bk-back-1").addEventListener("click", () => {
    selDate = null;
    renderCal();
    showPanel(1);
  });
  document.getElementById("bk-back-2").addEventListener("click", () => {
    showPanel(2);
  });

  form.addEventListener("submit", handleSubmit);

  document.getElementById("bk-restart").addEventListener("click", () => {
    selDate = null;
    selSlot = null;
    form.reset();
    formErr.hidden = true;
    // remove any injected confirm note
    const note = widget.querySelector(".bk-confirm-note");
    if (note) note.remove();
    renderCal();
    showPanel(1);
  });
})();
