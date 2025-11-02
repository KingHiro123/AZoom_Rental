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

// Login / Signup pages: simple form validation
function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`[AZoom] Corrupt JSON in localStorage[${key}]. Resetting.`, e);
    localStorage.removeItem(key);
    return fallback;
  }
}
function safeSet(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`[AZoom] Failed to set localStorage[${key}].`, e);
    alert("Storage failed. Are you in Incognito or blocking storage?");
  }
}

const Store = {
  getUsers() {
    return safeGet("azoom_users", {});
  },
  setUsers(obj) {
    safeSet("azoom_users", obj);
  },
  getCurrent() {
    return safeGet("azoom_current_user", null);
  },
  setCurrent(user) {
    safeSet("azoom_current_user", user);
  },
  clearCurrent() {
    localStorage.removeItem("azoom_current_user");
  },
};

// ---------- Header ----------
function initGlobalHeader() {
  const loginBox = document.querySelector(".login");
  if (!loginBox) return;

  const current = Store.getCurrent();
  console.log("[AZoom] Header init. Current user:", current);

  if (current && current.name) {
    const first = current.name.split(" ")[0];
    loginBox.innerHTML = `
 
        <span class="user-name">Hi, ${first}</span>
        <button class="btn small" id="logoutBtn">Logout</button>

      `;
    const btn = document.getElementById("logoutBtn");
    if (btn) {
      btn.addEventListener("click", () => {
        if (confirm("Log out of your account?")) {
          Store.clearCurrent();
          window.location.reload();
        }
      });
    }
  } else {
    loginBox.innerHTML = `<a href="./login.html" class="btn small">Login</a>`;
  }
}

// ---------- Sign Up ----------
function initSignup() {
  const form = document.getElementById("signupForm");
  if (!form) return;
  console.log("[AZoom] Signup page detected.");

  const nameEl = document.getElementById("name");
  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");
  const confirmEl = document.getElementById("confirm");

  // Load draft
  const draft = safeGet("signup_draft", {});
  if (draft.name) nameEl.value = draft.name;
  if (draft.email) emailEl.value = draft.email;
  if (draft.password) passEl.value = draft.password;
  if (draft.confirm) confirmEl.value = draft.confirm;

  // Autosave draft
  function saveDraft() {
    safeSet("signup_draft", {
      name: nameEl.value,
      email: emailEl.value,
      password: passEl.value,
      confirm: confirmEl.value,
    });
  }
  [nameEl, emailEl, passEl, confirmEl].forEach((el) =>
    el.addEventListener("input", saveDraft)
  );

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = nameEl.value.trim();
    const email = emailEl.value.trim().toLowerCase();
    const pass = passEl.value;
    const confirm = confirmEl.value;

    if (!name || !email || !pass || !confirm) {
      alert("Please fill in all fields.");
      return;
    }
    if (pass.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
    if (pass !== confirm) {
      alert("Passwords do not match.");
      return;
    }

    const users = Store.getUsers();
    console.log("[AZoom] Existing users before signup:", users);

    if (users[email]) {
      alert("An account with this email already exists. Please log in.");
      window.location.href = "./login.html";
      return;
    }

    users[email] = { name, email, pass, createdAt: new Date().toISOString() };
    Store.setUsers(users);
    localStorage.setItem("azoom_last_email", email);
    localStorage.removeItem("signup_draft");

    console.log("[AZoom] User saved. Users after signup:", Store.getUsers());
    alert("Account created! You can now log in.");
    window.location.href = "./login.html";
  });
}

// ---------- Login ----------
function initLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;
  console.log("[AZoom] Login page detected.");

  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");

  const lastEmail = localStorage.getItem("azoom_last_email");
  if (lastEmail && !emailEl.value) emailEl.value = lastEmail;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = emailEl.value.trim().toLowerCase();
    const pass = passEl.value;

    const users = Store.getUsers();
    console.log("[AZoom] Users at login:", users);

    const user = users[email];
    if (!user) {
      alert("No account found for this email. Please sign up.");
      return;
    }
    if (user.pass !== pass) {
      alert("Incorrect password. Try again.");
      return;
    }

    Store.setCurrent(user);
    alert(`Welcome back, ${user.name}!`);
    window.location.href = "./index.html";
  });
}

// ---------- Boot ----------
document.addEventListener("DOMContentLoaded", () => {
  console.log("[AZoom] DOM ready. Booting scripts.");
  initGlobalHeader();
  initSignup();
  initLogin();
});

/* ========== Scroll reveal for steps grids ========== */
document.addEventListener("DOMContentLoaded", () => {
  const grids = document.querySelectorAll(".steps .steps-grid");
  grids.forEach((g) => g.classList.add("reveal"));

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target); // animate once
        }
      });
    },
    { threshold: 0.15 }
  );

  grids.forEach((g) => io.observe(g));
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
      sessionStorage.setItem(
        "ratesPrefilter",
        JSON.stringify({
          value: label,
          ts: Date.now(),
        })
      );
    } catch (_) {}
  }
});

/* 2) On carList.html, check the matching checkbox and trigger your existing filters */
document.addEventListener("DOMContentLoaded", () => {
  if (!/carlist\.html$/i.test(location.pathname)) return;

  const filtersEl = document.querySelector(".filters");
  const searchEl = document.querySelector(".search input");
  if (!filtersEl) return;

  const params = new URLSearchParams(location.search);
  let token = (params.get("filter") || "").trim().toLowerCase();

  if (!token) {
    // Only trust storage if we came from rates.html very recently
    let fromRates = false;
    try {
      const ref = new URL(document.referrer);
      fromRates = /rates\.html$/i.test(ref.pathname);
    } catch (_) {}

    if (fromRates) {
      try {
        const raw = sessionStorage.getItem("ratesPrefilter");
        if (raw) {
          const data = JSON.parse(raw);
          // optional: expire after 10 seconds
          if (
            data &&
            data.value &&
            (!data.ts || Date.now() - data.ts < 10_000)
          ) {
            token = String(data.value).toLowerCase();
          }
        }
      } catch (_) {}
    }
    // Consume/clear regardless to avoid stickiness
    try {
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

// ==== Reserve page ====
document.addEventListener("DOMContentLoaded", () => {
  /* =========================
   TIME SELECTS (24h, every 1h)
========================== */
  function generateTimeOptions(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = "";
    for (let hour = 0; hour < 24; hour++) {
      const h = String(hour).padStart(2, "0");
      const opt = document.createElement("option");
      opt.value = `${h}:00`;
      opt.textContent = `${h}:00`;
      select.appendChild(opt);
    }
  }
  generateTimeOptions("pickup-time");
  generateTimeOptions("return-time");

  // Default both times to next full hour
  function roundToNextHour() {
    const now = new Date();
    if (now.getMinutes() > 0) {
      now.setHours(now.getHours() + 1);
      now.setMinutes(0, 0, 0);
    }
    return now;
  }
  const now = roundToNextHour();
  const pad2 = (n) => String(n).padStart(2, "0");
  const defaultTime = `${pad2(now.getHours())}:00`;
  const pickupTimeSel = document.getElementById("pickup-time");
  const returnTimeSel = document.getElementById("return-time");
  if (pickupTimeSel) pickupTimeSel.value = defaultTime;
  if (returnTimeSel) returnTimeSel.value = defaultTime;

  /* =========================
     DATE LIMITS (no past; return >= pickup)
  ========================== */
  const pickupDate = document.getElementById("pickup-date");
  const returnDate = document.getElementById("return-date");
  const fmtDate = (d) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  if (pickupDate && returnDate) {
    const today = new Date();
    const todayStr = fmtDate(today);
    pickupDate.min = todayStr;
    returnDate.min = todayStr;
    if (!pickupDate.value) pickupDate.value = todayStr;
    if (!returnDate.value) returnDate.value = todayStr;

    pickupDate.addEventListener("change", () => {
      const pick = new Date(pickupDate.value);
      const minStr = fmtDate(pick);
      returnDate.min = minStr;
      if (new Date(returnDate.value) < pick) returnDate.value = minStr;
      updateSummary();
    });
    returnDate.addEventListener("change", updateSummary);
  }

  /* =========================
     LOCATIONS (pickup vs dropoff)
  ========================== */
  const pickupLocSel = document.getElementById("pickup-loc");
  const dropoffLocSel = document.getElementById("dropoff-loc");

  function harvestLocationsFromDOM() {
    const cards = document.querySelectorAll(".loc-card");
    const list = [];
    cards.forEach((card) => {
      const head = card.querySelector(".loc-card-head");
      const tag = head?.querySelector(".tag");
      const h3 = head?.querySelector("h3");
      const addr = card.querySelector(".address");
      if (!tag || !h3) return;
      let type = "";
      if (tag.classList.contains("pickup")) type = "pickup";
      else if (tag.classList.contains("return")) type = "dropoff";
      else if (tag.classList.contains("hq")) type = "hq";
      if (type === "hq") return;

      const raw = h3.textContent.trim();
      const label = raw
        .replace(/^Pickup\s*–\s*/i, "")
        .replace(/^Return\s*–\s*/i, "")
        .trim();
      const value = `${label}-${type}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
      list.push({
        name: label,
        type,
        title: raw,
        address: addr?.textContent?.trim() || "",
        value,
      });
    });
    return list;
  }

  const fallbackLocations = [
    { name: "Downtown", type: "pickup", value: "downtown-pickup" },
    { name: "Orchard", type: "pickup", value: "orchard-pickup" },
    { name: "Airport", type: "dropoff", value: "airport-dropoff" },
  ];
  const locations = (() => {
    const harvested = harvestLocationsFromDOM();
    return harvested && harvested.length ? harvested : fallbackLocations;
  })();

  function populateSelect(selectEl, items, placeholder) {
    if (!selectEl) return;
    selectEl.innerHTML = "";
    const ph = document.createElement("option");
    ph.value = "";
    ph.textContent = placeholder;
    selectEl.appendChild(ph);
    items
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((loc) => {
        const opt = document.createElement("option");
        opt.value = loc.value || loc.name;
        opt.textContent = loc.name;
        selectEl.appendChild(opt);
      });
  }
  populateSelect(
    pickupLocSel,
    locations.filter((l) => l.type === "pickup"),
    "Select pick-up…"
  );
  populateSelect(
    dropoffLocSel,
    locations.filter((l) => l.type === "dropoff"),
    "Select drop-off…"
  );

  /* =========================
     STEPPER (prev/next + indicator)
  ========================== */
  const stepPanels = document.querySelectorAll(".form-step");
  const nextBtns = document.querySelectorAll(".next-step");
  const backBtns = document.querySelectorAll(".back-step");
  const indicators = document.querySelectorAll(".stepper li");
  let currentStep = 0;

  function showStep(index) {
    stepPanels.forEach((p, i) => {
      p.classList.remove("active");
      p.style.display = i === index ? "block" : "none";
    });
    setTimeout(() => stepPanels[index].classList.add("active"), 10);
    indicators.forEach((li, i) => li.classList.toggle("active", i === index));
  }
  nextBtns.forEach((b) =>
    b.addEventListener("click", (e) => {
      e.preventDefault();
      if (currentStep < stepPanels.length - 1) {
        currentStep++;
        showStep(currentStep);
      }
    })
  );
  backBtns.forEach((b) =>
    b.addEventListener("click", (e) => {
      e.preventDefault();
      if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
      }
    })
  );
  showStep(currentStep);

  /* =========================
     PRICING (plan/rates + summary)
  ========================== */
  const state = {
    plan: "hourly",
    times: {
      pickupDate,
      pickupTime: pickupTimeSel,
      returnDate,
      returnTime: returnTimeSel,
    },
    summary: {
      time: document.getElementById("sum-time"),
      addons: document.getElementById("sum-addons"),
      cover: document.getElementById("sum-cover"),
      total: document.getElementById("sum-total"),
    },
    rates: { hourly: 12, fullday: 80 }, // fallback
  };

  // Vehicle name (to match rates.html if available)
  const vehName = (
    document.getElementById("vehName")?.textContent || ""
  ).trim();

  // Try sessionStorage first
  const ss = sessionStorage.getItem("selectedCar");
  if (ss) {
    try {
      const car = JSON.parse(ss);
      if (car?.rates?.hourly && car?.rates?.fullday) {
        state.rates = {
          hourly: Number(car.rates.hourly),
          fullday: Number(car.rates.fullday),
        };

        requestAnimationFrame(() => updateSummary());
      }
    } catch {}
  }

  // Fallback: try parse rates.html if we still have defaults
  /* Sync rates from rates.html by category (Economy/Standard/Luxury) */
  async function syncRatesFromRatesHtmlByCategory(cat) {
    if (!cat) return; // nothing to do if we still don't know
    try {
      const res = await fetch("./rates.html");
      if (!res.ok) return;
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");

      const findCard = (seg) =>
        [...doc.querySelectorAll(`.rate-card[data-segment="${seg}"]`)].find(
          (c) => {
            const h = (c.querySelector("h3")?.textContent || "")
              .trim()
              .toLowerCase();
            return h === cat; // matches "economy" | "standard" | "luxury"
          }
        );

      const hourlyCard = findCard("hourly");
      const fulldayCard = findCard("fullday");
      if (!hourlyCard && !fulldayCard) return;

      const num = (t) => {
        const m = String(t)
          .replace(/,/g, "")
          .match(/(\d+(\.\d+)?)/);
        return m ? Number(m[1]) : null;
      };

      // Hourly: prefer "Normal", fallback "Off-peak"
      let hourly = null;
      if (hourlyCard) {
        const rows = [...hourlyCard.querySelectorAll(".row")];
        const normal = rows.find((r) => /normal/i.test(r.textContent || ""));
        const offpeak = rows.find((r) =>
          /off-?peak/i.test(r.textContent || "")
        );
        const src = normal || offpeak;
        hourly = src ? num(src.textContent) : null;
      }

      // Full-day: read "Full-day (24h)"
      let fullday = null;
      if (fulldayCard) {
        const rows = [...fulldayCard.querySelectorAll(".row")];
        const fd = rows.find((r) =>
          /full[\-\u2013]?day/i.test(r.textContent || "")
        );
        fullday = fd ? num(fd.textContent) : null;
      }

      if (hourly != null || fullday != null) {
        state.rates.hourly = hourly ?? state.rates.hourly;
        state.rates.fullday = fullday ?? state.rates.fullday;
        requestAnimationFrame(() => updateSummary());
      }
    } catch {
      /* ignore and keep existing */
    }
  }

  // Kick it off (AFTER selected car was applied to DOM)
  (async () => {
    const cat = detectCategory();
    await syncRatesFromRatesHtmlByCategory(cat);
  })();
  function setPlanIndicatorByIndex(idx) {
    const seg = document.querySelector(".form-card.plan .segmented");
    const ind = seg?.querySelector(".seg-indicator");
    if (!ind) return;
    ind.style.left = idx === 0 ? "6px" : "calc(50% + 6px)";
  }

  function syncPlanUI(plan) {
    state.plan = plan; // "hourly" | "fullday"
    const seg = document.querySelector(".form-card.plan .segmented");
    const btns = seg ? Array.from(seg.querySelectorAll(".seg-btn")) : [];
    btns.forEach((b, i) => {
      const active = b.dataset.plan === plan;
      b.classList.toggle("active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
      if (active) setPlanIndicatorByIndex(i);
    });
  }

  function setTimesEnabled(enabled) {
    [pickupTimeSel, returnTimeSel].forEach((sel) => {
      if (!sel) return;
      sel.disabled = !enabled;
      // Also disable options so dropdown looks fully greyed out
      Array.from(sel.options).forEach((opt) => (opt.disabled = !enabled));
    });
  }

  function applyDurationRules() {
    const s = toDate(
      state.times.pickupDate?.value,
      state.times.pickupTime?.value
    );
    const e = toDate(
      state.times.returnDate?.value,
      state.times.returnTime?.value
    );
    if (!s || !e) return;

    const days = Math.max(ceilDaysBetween(s, e), 0);
    const overTwoDays = days > 2;

    if (overTwoDays) {
      // allow & enforce Full-day
      setPlanButtonEnabled("fullday", true);
      setPlanButtonEnabled("hourly", true); // optional: keep hourly clickable, we still enforce full-day
      if (state.plan !== "fullday") syncPlanUI("fullday");
      setTimesEnabled(false);
    } else {
      // lock Full-day, force Hourly
      setPlanButtonEnabled("fullday", false);
      setPlanButtonEnabled("hourly", true);
      if (state.plan !== "hourly") syncPlanUI("hourly");
      setTimesEnabled(true);
    }
  }

  // Plan toggle
  // REPLACE your current planButtons.forEach(...) with:
  const planButtons = document.querySelectorAll(".form-card.plan .seg-btn");
  planButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // block clicks on disabled/aria-disabled buttons
      if (
        btn.disabled ||
        btn.getAttribute("aria-disabled") === "true" ||
        btn.classList.contains("is-disabled")
      ) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      syncPlanUI(btn.dataset.plan);
      updateSummary();
    });
  });

  // On first load, position the plan pill under the active button
  (() => {
    const seg = document.querySelector(".form-card.plan .segmented");
    if (!seg) return;
    const btns = Array.from(seg.querySelectorAll(".seg-btn"));
    const activeIdx = Math.max(
      0,
      btns.findIndex((b) => b.classList.contains("active"))
    );
    setPlanIndicatorByIndex(activeIdx);
  })();

  // Helpers
  function setPlanButtonEnabled(plan, enabled) {
    const btn = document.querySelector(
      `.form-card.plan .seg-btn[data-plan="${plan}"]`
    );
    if (!btn) return;
    btn.disabled = !enabled;
    btn.setAttribute("aria-disabled", enabled ? "false" : "true");
    btn.classList.toggle("is-disabled", !enabled);
  }

  function toDate(dateStr, timeStr) {
    if (!dateStr || !timeStr) return null;
    const [y, m, d] = dateStr.split("-").map(Number);
    const [hh, mm] = timeStr.split(":").map(Number);
    return new Date(y, m - 1, d, hh, mm, 0, 0);
  }
  const hoursBetween = (a, b) => Math.max(0, (b - a) / 36e5);
  const ceilDaysBetween = (a, b) => Math.ceil(hoursBetween(a, b) / 24);

  function getAddonsTotal() {
    let sum = 0;
    document
      .querySelectorAll(".checks input[type='checkbox']:checked")
      .forEach((c) => {
        sum += Number(c.dataset.price || 0);
      });
    return sum;
  }
  function getCoverTotal() {
    const r = document.querySelector(".radios input[type='radio']:checked");
    return r ? Number(r.dataset.price || 0) : 0;
  }
  function getTimeCharge() {
    const s = toDate(
      state.times.pickupDate?.value,
      state.times.pickupTime?.value
    );
    const e = toDate(
      state.times.returnDate?.value,
      state.times.returnTime?.value
    );
    if (!s || !e || e <= s) return 0;
    if (state.plan === "hourly") {
      const hrs = Math.ceil(hoursBetween(s, e)); // bill by started hour
      return state.rates.hourly * hrs;
    } else {
      const days = Math.max(1, ceilDaysBetween(s, e));
      return state.rates.fullday * days;
    }
  }
  const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

  function updateSummary() {
    const timeCharge = getTimeCharge();
    const addons = getAddonsTotal();
    const cover = getCoverTotal();
    const total = timeCharge + addons + cover;
    if (state.summary.time) state.summary.time.textContent = money(timeCharge);
    if (state.summary.addons) state.summary.addons.textContent = money(addons);
    if (state.summary.cover) state.summary.cover.textContent = money(cover);
    if (state.summary.total) state.summary.total.textContent = money(total);
  }
  const __updateSummary = updateSummary;
  updateSummary = function () {
    applyDurationRules(); // checks if multi-day & greys out times
    __updateSummary(); // runs the normal price update
  };
  // Recalc triggers
  ["pickup-date", "pickup-time", "return-date", "return-time"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", updateSummary);
  });
  document
    .querySelectorAll(".checks input[type='checkbox']")
    .forEach((c) => c.addEventListener("change", updateSummary));
  document
    .querySelectorAll(".radios input[type='radio']")
    .forEach((r) => r.addEventListener("change", updateSummary));
  updateSummary();

  /* =========================
     DRIVER (manual form toggle)
  ========================== */
  const btnSingpass = document.getElementById("singpass");
  const btnManual = document.getElementById("manual");
  const manualBox = document.getElementById("driverManual");
  if (btnManual && manualBox) {
    btnManual.addEventListener("click", () => {
      manualBox.hidden = !manualBox.hidden;
    });
  }
  if (btnSingpass && manualBox) {
    btnSingpass.addEventListener("click", () => {
      manualBox.hidden = true;
      alert("Redirecting to Singpass (demo)...");
    });
  }

  /* PAYMENT (confirm → spinner → success → redirect) */
  const payBtn = document.querySelector(".pay-btn");
  const overlay = document.getElementById("overlay");

  if (payBtn) {
    payBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const cardType = (
        document.getElementById("cardType")?.value || ""
      ).trim();
      const name = (document.getElementById("cardName")?.value || "").trim();
      const number = (
        document.getElementById("cardNumber")?.value || ""
      ).trim();
      const expiry = (document.getElementById("expiry")?.value || "").trim();
      const cvv = (document.getElementById("cvv")?.value || "").trim();

      if (!cardType || !name || !number || !expiry || !cvv) {
        alert("Please fill in all payment fields.");
        return;
      }

      if (!confirm("Are you sure you want to proceed with payment?")) return;

      // Show spinner ONLY after confirm
      overlay?.classList.add("show");

      // Simulate processing delay
      setTimeout(() => {
        overlay?.classList.remove("show"); // hide spinner
        alert("Payment successful, thanks!");
        setTimeout(() => {
          window.location.href = "./index.html";
        }, 2000);
      }, 2000);
    });
  }
});
