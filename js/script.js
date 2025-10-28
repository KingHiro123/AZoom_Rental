// Add shadow when scrolling
// const header = document.querySelector(".site-header");
// window.addEventListener("scroll", () => {
//   if (window.scrollY > 4) header.classList.add("scrolled");
//   else header.classList.remove("scrolled");
// });

// Mobile menu toggle
const toggle = document.querySelector(".menu");
const nav = document.querySelector("#main-nav");

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

// under rates.html
// Rates segmented toggle
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".seg-btn");
  if (!btn) return;

  const view = btn.dataset.view; // 'hourly' or 'fullday'
  // toggle button UI
  document.querySelectorAll(".seg-btn").forEach((b) => {
    b.classList.toggle("active", b === btn);
    b.setAttribute("aria-selected", b === btn ? "true" : "false");
  });

  // show/hide cards
  document.querySelectorAll(".rates-grid .rate-card").forEach((card) => {
    const isMatch = card.getAttribute("data-segment") === view;
    card.hidden = !isMatch;
  });
});

// On load: show hourly set (hide full-day)
document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelectorAll('.rates-grid .rate-card[data-segment="fullday"]')
    .forEach((c) => (c.hidden = true));
});

//THIS IS A TEST FUNCTION FOR MY INDEX PAGE
// const wrap = document.querySelector(".rates-hero");
// const tabs = [...wrap.querySelectorAll(".seg-btn")];
// const cards = [...wrap.querySelectorAll(".rate-card")];

// function setView(view) {
//   // update tabs
//   tabs.forEach((t) => {
//     const isActive = t.dataset.view === view;
//     t.classList.toggle("active", isActive);
//     t.setAttribute("aria-selected", isActive ? "true" : "false");
//   });

//   // show/hide cards with a tiny entrance animation
//   cards.forEach((card) => {
//     const match = card.getAttribute("data-segment") === view;
//     if (match) {
//       card.hidden = false;
//       // animate in
//       card.classList.add("toggle-enter");
//       // force reflow
//       card.getBoundingClientRect();
//       card.classList.remove("toggle-enter");
//     } else {
//       card.hidden = true;
//     }
//   });
// }

// // click handlers
// tabs.forEach((t) => {
//   t.addEventListener("click", () => setView(t.dataset.view));
// });

// // init default view
// setView("hourly");

//under carList.html
// ===== unified search + filters (OR within group, AND across groups) =====

// Elements
const searchInput = document.querySelector(".search input");
const filterPanel = document.querySelector(".filters");

// Early exit if not on car list
if (filterPanel) {
  const groups = [...filterPanel.querySelectorAll(".filter-group")];
  const carCards = [...document.querySelectorAll(".car-card")];

  // Normalize helper
  const norm = (s) => (s || "").toLowerCase().trim();

  // Read current selections from each group (by <h3> title)
  function getSelections() {
    const selections = {};
    groups.forEach((group) => {
      const key = norm(group.querySelector("h3")?.textContent); // e.g., "brand"
      const checked = [
        ...group.querySelectorAll('input[type="checkbox"]:checked'),
      ];
      selections[key] = checked.map((cb) => norm(cb.parentElement.textContent));
    });
    return selections;
  }

  // Core filter: a card passes if, for every group that has selections,
  // the card text contains at least one of the group's selected tokens (OR within group).
  // Search is applied on top (AND with groups).
  function applyFilters() {
    const selections = getSelections();
    const q = norm(searchInput?.value);

    carCards.forEach((card) => {
      const text = norm(card.textContent);

      // AND across groups
      const groupsPass = Object.values(selections).every((tokens) => {
        if (!tokens.length) return true; // no selection in this group
        return tokens.some((t) => text.includes(t)); // OR within this group
      });

      // search ANDs with group result
      const searchPass = q ? text.includes(q) : true;

      const passes = groupsPass && searchPass;
      card.style.display = passes ? "" : "none";
    });
  }

  // Wire up search (live) — now uses unified filter
  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }

  // Re-filter whenever a checkbox is toggled
  filterPanel.addEventListener("change", (e) => {
    if (e.target.matches('input[type="checkbox"]')) applyFilters();
  });

  // Initial run
  applyFilters();
}
