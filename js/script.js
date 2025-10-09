// Add shadow when scrolling
const header = document.querySelector(".site-header");
window.addEventListener("scroll", () => {
  if (window.scrollY > 4) header.classList.add("scrolled");
  else header.classList.remove("scrolled");
});

// Mobile menu toggle
const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector("#primary-nav");

toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
});

// Smooth scroll helper
const smoothScrollTo = (selector) => {
  const el = document.querySelector(selector);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 64;
  window.scrollTo({ top: y, behavior: "smooth" });
};

// Smooth scroll for links
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const id = link.getAttribute("href");
    if (id.length > 1) {
      e.preventDefault();
      smoothScrollTo(id);
      nav.classList.remove("open"); // close menu after click
      toggle.setAttribute("aria-expanded", "false");
    }
  });
});

// ==== Reserve estimator (lightweight) ====
(() => {
  const typeSel = document.querySelector("#carType");
  const start = document.querySelector("#start");
  const end = document.querySelector("#end");
  const extras = document.querySelectorAll('.checks input[type="checkbox"]');

  const sumType = document.querySelector("#sumType");
  const sumRate = document.querySelector("#sumRate");
  const sumDays = document.querySelector("#sumDays");
  const sumExtras = document.querySelector("#sumExtras");
  const sumTotal = document.querySelector("#sumTotal");

  if (!typeSel || !start || !end) return;

  const dayMs = 24 * 60 * 60 * 1000;

  function daysBetween() {
    const s = new Date(start.value);
    const e = new Date(end.value);
    if (!(s instanceof Date) || !(e instanceof Date) || isNaN(s) || isNaN(e))
      return 1;
    const diff = Math.ceil((e - s) / dayMs);
    return Math.max(diff, 1);
  }

  function ratePerDay() {
    const opt = typeSel.selectedOptions[0];
    return parseFloat(opt?.dataset?.rate || "58");
  }

  function extrasPerDay() {
    let total = 0;
    extras.forEach((cb) => {
      if (cb.checked) total += Number(cb.dataset.extra || 0);
    });
    return total;
  }

  function format(n) {
    return `$${n.toFixed(0)}`;
  }

  function update() {
    const d = daysBetween();
    const base = ratePerDay();
    const ex = extrasPerDay();
    const total = d * (base + ex);

    sumType.textContent = typeSel.value;
    sumRate.textContent = format(base);
    sumDays.textContent = `${d} ${d > 1 ? "days" : "day"}`;
    sumExtras.textContent = format(d * ex);
    sumTotal.textContent = format(total);
  }

  [typeSel, start, end, ...extras].forEach((el) =>
    el.addEventListener("input", update)
  );
  update();
})();
