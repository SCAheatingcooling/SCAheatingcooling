// Dark mode
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

const darkToggle = document.querySelector("#dark-toggle");
if (darkToggle) {
  darkToggle.addEventListener("click", () => {
    applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });
}

// Mobile menu
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

// Scroll reveal
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

// Footer year
const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();
