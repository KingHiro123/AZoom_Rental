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

// under rates.html

//rates.html enhanced toggle with animation
function setToggleIndicator(segmentedEl, index) {
  const indicator = segmentedEl.querySelector(".seg-indicator");
  if (!indicator) return;
  indicator.style.left = index === 0 ? "4px" : "calc(50% + 4px)";
}

// Animate cards left/right + fade
function switchRates(view, dir /* 'right' | 'left' */) {
  const grid = document.querySelector(".rates-grid");
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll(".rate-card"));
  const toShow = cards.filter((c) => c.getAttribute("data-segment") === view);
  const toHide = cards.filter((c) => c.getAttribute("data-segment") !== view);

  // animate out current
  toHide.forEach((card) => {
    if (card.style.display === "none") return; // already hidden
    card.classList.add(
      "anim-hide",
      dir === "right" ? "leave-to-left" : "leave-to-right"
    );
    const onEnd = (e) => {
      if (e.propertyName !== "opacity") return;
      card.style.display = "none";
      card.classList.remove("anim-hide", "leave-to-left", "leave-to-right");
      card.removeEventListener("transitionend", onEnd);
    };
    card.addEventListener("transitionend", onEnd);
  });

  // animate in next
  toShow.forEach((card) => {
    card.style.display = ""; // show in layout
    // remove any stale 'hidden' attr if present
    if (card.hasAttribute("hidden")) card.removeAttribute("hidden");

    card.classList.add(
      dir === "right" ? "enter-from-right" : "enter-from-left"
    );
    requestAnimationFrame(() => {
      // force reflow
      // eslint-disable-next-line no-unused-expressions
      card.offsetHeight;
      card.classList.remove("enter-from-right", "enter-from-left");
      card.classList.remove("anim-hide");
    });
  });
}

// Click handler: toggle active, slide pill, animate cards
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".seg-btn");
  if (!btn) return;

  const segmented = btn.closest(".segmented");
  const buttons = Array.from(segmented.querySelectorAll(".seg-btn"));

  const prevIndex = buttons.findIndex((b) => b.classList.contains("active"));
  const nextIndex = buttons.indexOf(btn);
  const view = btn.dataset.view;
  const dir = nextIndex > prevIndex ? "right" : "left";

  // update button UI
  buttons.forEach((b, i) => {
    const active = i === nextIndex;
    b.classList.toggle("active", active);
    b.setAttribute("aria-selected", active ? "true" : "false");
  });

  // move the blue indicator
  setToggleIndicator(segmented, nextIndex);

  // animate the cards set
  switchRates(view, dir);
});

// Init: ensure 'hidden' attrs are removed and default state is hourly
document.addEventListener("DOMContentLoaded", () => {
  // remove any 'hidden' attributes that might block visibility
  document.querySelectorAll(".rates-grid .rate-card[hidden]").forEach((c) => {
    c.hidden = false;
    c.removeAttribute("hidden");
  });

  // show hourly, hide fullday (without animation)
  document
    .querySelectorAll('.rates-grid .rate-card[data-segment="hourly"]')
    .forEach((c) => {
      c.style.display = "";
    });
  document
    .querySelectorAll('.rates-grid .rate-card[data-segment="fullday"]')
    .forEach((c) => {
      c.style.display = "none";
    });

  // position indicator under active button
  const segmented = document.querySelector(".segmented");
  if (segmented) {
    const buttons = Array.from(segmented.querySelectorAll(".seg-btn"));
    const activeIndex = Math.max(
      0,
      buttons.findIndex((b) => b.classList.contains("active"))
    );
    setToggleIndicator(segmented, activeIndex);
    buttons.forEach((b, i) =>
      b.setAttribute("aria-selected", i === activeIndex ? "true" : "false")
    );
  }
});
//rates.html filter from "Explore Vehicle Models" to carList.html
/* ==== Prefilter with checked sidebar state: rates.html -> carList.html ==== */

/* 1) On rates.html, store the chosen category when "Explore vehicle models" is clicked */
document.addEventListener("click", (e) => {
  const link = e.target.closest('a[href*="carList.html"]');
  if (!link) return;

  const card = link.closest(".rate-card");
  if (!card) return;

  const label = (card.querySelector("h3")?.textContent || "")
    .trim()
    .toLowerCase();
  if (label) {
    try {
      sessionStorage.setItem("ratesPrefilter", label); // e.g. "economy"
    } catch (_) {}
  }
  // let navigation proceed
});

/* 2) On carList.html, check the matching checkbox and trigger your existing filters */
document.addEventListener("DOMContentLoaded", () => {
  if (!/carlist\.html$/i.test(location.pathname)) return;

  const filtersEl = document.querySelector(".filters");
  const searchEl = document.querySelector(".search input");
  if (!filtersEl) return;

  // Prefer ?filter=, else sessionStorage
  const params = new URLSearchParams(location.search);
  let token = (params.get("filter") || "").trim().toLowerCase();
  if (!token) {
    try {
      token = (sessionStorage.getItem("ratesPrefilter") || "").toLowerCase();
      sessionStorage.removeItem("ratesPrefilter");
    } catch (_) {}
  }
  if (!token) return;

  // Try to find a matching label in the sidebar and check it
  let matched = false;
  const allLabels = Array.from(
    filtersEl.querySelectorAll(".filter-group label")
  );
  allLabels.forEach((lbl) => {
    const text = (lbl.textContent || "").trim().toLowerCase();
    const cb = lbl.querySelector('input[type="checkbox"]');
    if (!cb) return;
    if (text === token) {
      cb.checked = true;
      matched = true;
    }
  });

  if (matched) {
    // Clear search so it doesn't AND with the checkbox unless you want it to
    if (searchEl) {
      searchEl.value = "";
      searchEl.dispatchEvent(new Event("input", { bubbles: true }));
    }
    // Fire your existing filter change handler
    filtersEl.dispatchEvent(new Event("change", { bubbles: true }));
  } else {
    // Fallback: use the search box like before
    if (searchEl) {
      searchEl.value = token;
      searchEl.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
});

//rates.html scripts ends here

//start of carList.html scripts

// ==== Car list filtering under carList.html (with filter tags)====
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

//Reserved page
// ==== Save clicked car from carList -> sessionStorage ====
document.addEventListener("click", (e) => {
  const link = e.target.closest(".link-btn");
  if (!link) return;

  // Only run on car list page where a .car-card exists
  const card = link.closest(".car-card");
  if (!card) return;

  const text = (el) => (el ? el.textContent.trim() : "");

  const title = text(card.querySelector(".car-title"));
  const badges = [...card.querySelectorAll(".badges .badge")].map((b) =>
    b.textContent.replace(/\s+/g, " ").trim()
  );
  const type = text(card.querySelector(".specs li:nth-child(1)")); // Sedan / SUV / Hatchback
  const seatsText = text(card.querySelector(".specs li:nth-child(2)")); // "5-seater"
  const img = card.querySelector("img")?.getAttribute("src") || "";
  const alt =
    card.querySelector("img")?.getAttribute("alt") ||
    title ||
    "Selected vehicle";

  // Try to infer fuel & category from badges
  const fuel =
    badges
      .find((t) => /petrol|hybrid|electric/i.test(t))
      ?.replace(/^\s+|\s+$/g, "") || "";
  const category =
    badges
      .find((t) => /economy|standard|luxury/i.test(t))
      ?.replace(/^\s+|\s+$/g, "") || "";

  // Extract seat count if possible (e.g., "5-seater" -> 5)
  const seats = (() => {
    const m = seatsText.match(/(\d+)/);
    return m ? Number(m[1]) : null;
  })();

  const car = {
    title, // e.g., "Toyota Vios"
    fuel, // e.g., "Petrol" / "Hybrid" / "Electric"
    category, // e.g., "Economy" / "Standard" / "Luxury"
    type, // e.g., "Sedan"
    seats, // e.g., 5
    seatsText, // fallback display text e.g., "5-seater"
    img, // image path from the card
    alt, // alt text (fallback: title)
    ts: Date.now(), // timestamp (handy if you want expiry later)
  };

  try {
    sessionStorage.setItem("selectedCar", JSON.stringify(car));
  } catch (err) {
    // If storage fails, we silently ignore and the reserve page will show defaults
    console.warn("Could not store selected car:", err);
  }

  // Let the link continue to navigate to reserve.html
});

// ==== Apply selected car on reserve.html ====
document.addEventListener("DOMContentLoaded", () => {
  const imgEl = document.querySelector("#vehImg");
  const nameEl = document.querySelector("#vehName");
  const tagsEl = document.querySelector("#vehTags");

  if (!imgEl || !nameEl || !tagsEl) return; // Not on reserve page

  let car = null;
  try {
    const raw = sessionStorage.getItem("selectedCar");
    if (raw) car = JSON.parse(raw);
  } catch (e) {
    console.warn("Selected car parse error:", e);
  }

  if (!car || !car.title) return; // nothing saved — keep defaults

  // Compose display values with fallbacks
  const displayName = `${car.title}${car.category ? ` (${car.category})` : ""}`;
  const seatsDisplay = car.seats
    ? `${car.seats} seats`
    : car.seatsText || "5 seats";
  const fuelDisplay = car.fuel || "Petrol";
  const typeDisplay = car.type || "Sedan";

  // Apply to DOM
  if (car.img) {
    imgEl.src = car.img;
  }
  imgEl.alt = car.alt || displayName;

  nameEl.textContent = displayName;
  tagsEl.textContent = `${typeDisplay} • ${fuelDisplay} • ${seatsDisplay}`;
});

// ==== Reserve page: pricing engine using rates.html numbers ====

// Exact tables from rates.html (Petrol/Diesel/Hybrid vehicles)
const RATES = {
  hourly: {
    // You can switch "band" to 'offpeak' | 'normal' | 'peak' later if needed.
    bands: {
      offpeak: { Economy: 3, Standard: 3, Luxury: 4 }, // $/hr
      normal: { Economy: 5, Standard: 6, Luxury: 7 }, // $/hr
      peak: { Economy: 9, Standard: 10, Luxury: 11 }, // $/hr
    },
    // mileage for hourly (all categories the same in your page)
    perKm: ({ category }) => 0.39,
  },
  fullday: {
    perDay: { Economy: 68, Standard: 82, Luxury: 240 }, // $/day
    // mileage for full-day: luxury differs
    perKm: ({ category }) => (category === "Luxury" ? 0.49 : 0.39),
  },
};

// Choose which hourly band to use.
// Your reserve.html has no UI for bands, so default to 'normal' to match the page text.
const HOURLY_BAND = "normal"; // 'offpeak' | 'normal' | 'peak'

// Promo examples (optional)
const PROMOS = {
  SAVE10: { type: "percent", value: 0.1 },
  FREEMI: { type: "mileage_free", value: true },
};

(function initReservePricingFromRatesPage() {
  const form = document.querySelector("#reserve-form");
  const summary = document.querySelector("#price-summary");
  if (!form || !summary) return; // not on reserve page

  // Inputs
  const mileageEl = form.querySelector("#mileage");
  const promoEl = form.querySelector("#promo");
  const addonChecks = [
    ...form.querySelectorAll('.checks input[type="checkbox"]'),
  ];
  const coverRadios = [...form.querySelectorAll('input[name="cover"]')];
  const dtEls = [...form.querySelectorAll('input[type="datetime-local"]')];
  const pickupEl = dtEls[0] || null;
  const returnEl = dtEls[1] || null;

  // Plan segmented
  const planSeg = form.querySelector(".segmented[aria-label='Plan']");
  let currentPlan = "hourly";

  // Summary fields
  const sumTime = summary.querySelector("#sum-time");
  const sumMileage = summary.querySelector("#sum-mileage");
  const sumAddons = summary.querySelector("#sum-addons");
  const sumCover = summary.querySelector("#sum-cover");
  const sumPromo = summary.querySelector("#sum-promo");
  const sumTotal = summary.querySelector("#sum-total");

  // Selected car context (from carList -> sessionStorage)
  let car = null;
  try {
    const raw = sessionStorage.getItem("selectedCar");
    if (raw) car = JSON.parse(raw);
  } catch (_) {}
  // Normalise casing and fallbacks
  const norm = (s) => (s || "").toString().trim();
  const category = (() => {
    const c = norm(car?.category).toLowerCase();
    if (c.includes("economy")) return "Economy";
    if (c.includes("luxury") || c.includes("select")) return "Luxury";
    return "Standard";
  })();
  const fuel = (() => {
    const f = norm(car?.fuel).toLowerCase();
    if (f.includes("diesel")) return "Diesel";
    if (f.includes("hybrid")) return "Hybrid";
    if (f.includes("electric")) return "Electric";
    return "Petrol";
  })();

  // Helpers
  const hrMs = 60 * 60 * 1000;
  const dayMs = 24 * hrMs;
  const money = (n) => `$${Math.max(0, n).toFixed(2)}`;

  const parseDateSafe = (el) => {
    if (!el || !el.value) return null;
    const d = new Date(el.value);
    return isNaN(d) ? null : d;
  };

  function durations(plan) {
    const s = parseDateSafe(pickupEl);
    const e = parseDateSafe(returnEl);
    if (!s || !e || e <= s) {
      return plan === "hourly" ? { hours: 1, days: 1 } : { hours: 24, days: 1 };
    }
    const diff = e - s;
    const hours = Math.ceil(diff / hrMs);
    const days = Math.ceil(diff / dayMs);
    return { hours: Math.max(hours, 1), days: Math.max(days, 1) };
  }

  function hourlyRate(cat) {
    const bandTable =
      RATES.hourly.bands[HOURLY_BAND] || RATES.hourly.bands.normal;
    return bandTable[cat] ?? bandTable.Standard;
  }

  function fullDayRate(cat) {
    const table = RATES.fullday.perDay;
    return table[cat] ?? table.Standard;
  }

  function perKm(plan, cat /*, fuelType*/) {
    // fuelType currently irrelevant per your rates page (Petrol/Diesel/Hybrid share one panel)
    return plan === "hourly"
      ? RATES.hourly.perKm({ category: cat })
      : RATES.fullday.perKm({ category: cat });
  }

  function readCoverPerDay() {
    const sel = coverRadios.find((r) => r.checked);
    const v = Number(sel?.dataset.price || 0);
    return isNaN(v) ? 0 : v;
  }

  const addonsFlat = () =>
    addonChecks.reduce(
      (sum, cb) =>
        cb.checked
          ? sum + Number(cb.dataset.price || cb.dataset.extra || 0)
          : sum,
      0
    );

  const readPromo = () => {
    const code = (promoEl?.value || "").trim().toUpperCase();
    return PROMOS[code] || null;
  };

  function formatPromo(amount) {
    // amount is negative
    return `–$${Math.abs(amount).toFixed(2)}`;
  }

  function updateIndicator(segmentedEl, index) {
    const indicator = segmentedEl?.querySelector(".seg-indicator");
    if (!indicator) return;
    indicator.style.left = index === 0 ? "6px" : "calc(50% + 6px)";
  }

  function compute() {
    const plan = currentPlan; // 'hourly' | 'fullday'
    const { hours, days } = durations(plan);

    // Time charge
    const timeCharge =
      plan === "hourly"
        ? hourlyRate(category) * hours
        : fullDayRate(category) * days;

    // Mileage
    const km = Math.max(0, Number(mileageEl?.value || 0));
    const kmRate = perKm(plan, category /*, fuel*/);
    let mileageCharge = km * kmRate;

    // Add-ons
    const addonsCharge = addonsFlat();

    // Protection (per day; for hourly, ceil to day-equivalent)
    const coverPerDay = readCoverPerDay();
    const coverUnits = plan === "hourly" ? Math.ceil(hours / 24) : days;
    const coverCharge = coverPerDay * coverUnits;

    // Subtotal
    let subtotal = timeCharge + mileageCharge + addonsCharge + coverCharge;

    // Promo
    let promoOff = 0;
    const promoObj = readPromo();
    if (promoObj) {
      if (promoObj.type === "percent") {
        promoOff = -subtotal * promoObj.value;
      } else if (promoObj.type === "mileage_free") {
        promoOff = -mileageCharge;
        mileageCharge = 0; // show waived in the line item
      }
    }

    const total = subtotal + promoOff;

    // Write to DOM
    sumTime.textContent = money(timeCharge);
    sumMileage.textContent = money(mileageCharge);
    sumAddons.textContent = money(addonsCharge);
    sumCover.textContent = money(coverCharge);
    sumPromo.textContent = promoOff ? formatPromo(promoOff) : "–$0.00";
    sumTotal.textContent = money(total);
  }

  // Wire plan toggle
  if (planSeg) {
    const buttons = [...planSeg.querySelectorAll(".seg-btn")];
    buttons.forEach((btn, i) => {
      btn.addEventListener("click", () => {
        if (btn.classList.contains("active")) return;
        buttons.forEach((b) => {
          const active = b === btn;
          b.classList.toggle("active", active);
          b.setAttribute("aria-selected", active ? "true" : "false");
        });
        // Your buttons use data-view="hourly|fullday"
        currentPlan = btn.dataset.plan || btn.dataset.view || "hourly";
        updateIndicator(planSeg, i);
        compute();
      });
    });
    const initIndex = Math.max(
      0,
      buttons.findIndex((b) => b.classList.contains("active"))
    );
    updateIndicator(planSeg, initIndex === -1 ? 0 : initIndex);
    currentPlan =
      (buttons[initIndex] &&
        (buttons[initIndex].dataset.plan || buttons[initIndex].dataset.view)) ||
      "hourly";
  }

  // Recompute on changes
  [mileageEl, promoEl, pickupEl, returnEl].forEach((el) => {
    if (!el) return;
    el.addEventListener("input", compute);
    el.addEventListener("change", compute);
  });
  [...addonChecks, ...coverRadios].forEach((el) =>
    el.addEventListener("change", compute)
  );

  // First run
  compute();
})();
