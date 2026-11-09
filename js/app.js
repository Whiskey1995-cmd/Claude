(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const fmt = (n) => n.toLocaleString("uk-UA").replace(/,/g, " ") + " ₴";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
  const catName = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.name]));

  /* ---------- Ілюстрації товарів (коли немає фото) ---------- */
  const ART = {
    phones: (c) => `<rect x="34" y="8" width="52" height="104" rx="10" fill="${c}"/><rect x="38" y="16" width="44" height="86" rx="4" fill="#fff" opacity=".9"/><rect x="52" y="11" width="16" height="2.5" rx="1.25" fill="#fff" opacity=".6"/><circle cx="60" cy="59" r="12" fill="${c}" opacity=".25"/>`,
    laptops: (c) => `<rect x="18" y="22" width="84" height="56" rx="5" fill="${c}"/><rect x="23" y="27" width="74" height="46" rx="2" fill="#fff" opacity=".9"/><path d="M8 82h104l-6 10H14z" fill="${c}" opacity=".8"/><rect x="50" y="82" width="20" height="3" rx="1.5" fill="#fff" opacity=".5"/>`,
    tablets: (c) => `<rect x="22" y="12" width="76" height="96" rx="9" fill="${c}"/><rect x="27" y="18" width="66" height="84" rx="3" fill="#fff" opacity=".9"/><circle cx="60" cy="15" r="1.5" fill="#fff" opacity=".6"/><rect x="38" y="40" width="44" height="6" rx="3" fill="${c}" opacity=".3"/><rect x="38" y="52" width="30" height="6" rx="3" fill="${c}" opacity=".2"/>`,
    audio: (c) => `<path d="M24 66V58a36 36 0 0 1 72 0v8" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round"/><rect x="16" y="62" width="22" height="36" rx="9" fill="${c}"/><rect x="82" y="62" width="22" height="36" rx="9" fill="${c}"/><rect x="21" y="68" width="6" height="24" rx="3" fill="#fff" opacity=".35"/><rect x="93" y="68" width="6" height="24" rx="3" fill="#fff" opacity=".35"/>`,
    speakers: (c) => `<rect x="32" y="14" width="56" height="92" rx="14" fill="${c}"/><circle cx="60" cy="68" r="20" fill="#fff" opacity=".85"/><circle cx="60" cy="68" r="9" fill="${c}" opacity=".6"/><circle cx="60" cy="32" r="8" fill="#fff" opacity=".85"/>`,
    watches: (c) => `<rect x="44" y="6" width="32" height="26" rx="6" fill="${c}" opacity=".7"/><rect x="44" y="88" width="32" height="26" rx="6" fill="${c}" opacity=".7"/><rect x="34" y="28" width="52" height="64" rx="14" fill="${c}"/><rect x="40" y="35" width="40" height="50" rx="9" fill="#fff" opacity=".9"/><path d="M60 48v13l8 5" stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round"/><rect x="86" y="50" width="4" height="12" rx="2" fill="${c}"/>`,
    accessories: (c) => `<rect x="30" y="26" width="60" height="70" rx="12" fill="${c}"/><path d="M64 38 50 62h10l-4 18 14-25H60z" fill="#fff" opacity=".9"/><rect x="48" y="96" width="8" height="12" rx="2" fill="${c}" opacity=".7"/><rect x="64" y="96" width="8" height="12" rx="2" fill="${c}" opacity=".7"/>`,
  };
  const art = (p) =>
    p.image
      ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">`
      : `<svg viewBox="0 0 120 120" role="img" aria-label="${esc(p.name)}">${(ART[p.category] || ART.accessories)(p.color || "#3b6fd8")}</svg>`;

  /* ---------- Дані магазину на сторінці ---------- */
  function fillStoreInfo() {
    $$('[data-store="name"]').forEach((el) => (el.textContent = STORE.name));
    $$('[data-store="tagline"]').forEach((el) => (el.textContent = STORE.tagline));
    document.title = `${STORE.name} — електроніка та гаджети`;
    $("#freeShip").textContent = "від " + fmt(STORE.freeShippingFrom);
    const phone = $("#phoneLink");
    phone.textContent = STORE.phone;
    phone.href = "tel:" + STORE.phone.replace(/[^+\d]/g, "");
    const email = $("#emailLink");
    email.textContent = STORE.email;
    email.href = "mailto:" + STORE.email;
    if (STORE.telegram) {
      $("#tgItem").hidden = false;
      $("#tgLink").href = "https://t.me/" + STORE.telegram;
      $("#tgLink").textContent = "Telegram: @" + STORE.telegram;
    }
    $("#addressText").textContent = `${STORE.city}, ${STORE.address}`;
    $("#hoursText").textContent = STORE.hours;
    $("#year").textContent = new Date().getFullYear();
    $("#doneEmail").textContent = STORE.email;
  }

  /* ---------- Каталог ---------- */
  const state = { category: "all", query: "", sort: "popular", inStock: false };

  function renderCategories() {
    const all = [{ id: "all", name: "Усі товари" }, ...CATEGORIES];
    $("#categories").innerHTML = all
      .map((c) => `<button class="chip" role="tab" data-cat="${c.id}" aria-selected="${c.id === state.category}">${esc(c.name)}</button>`)
      .join("");
  }

  function filtered() {
    const q = state.query.trim().toLowerCase();
    let list = PRODUCTS.filter((p) =>
      (state.category === "all" || p.category === state.category) &&
      (!state.inStock || p.stock) &&
      (!q || (p.name + " " + p.desc + " " + catName[p.category]).toLowerCase().includes(q))
    );
    const sorters = {
      cheap: (a, b) => a.price - b.price,
      expensive: (a, b) => b.price - a.price,
      name: (a, b) => a.name.localeCompare(b.name, "uk"),
      popular: (a, b) => (b.stock - a.stock),
    };
    return list.sort(sorters[state.sort]);
  }

  const plural = (n, one, few, many) => {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  };

  const priceHtml = (p) =>
    `<div class="price${p.oldPrice ? " price--sale" : ""}">${p.oldPrice ? `<span class="price-old">${fmt(p.oldPrice)}</span>` : ""}${fmt(p.price)}</div>`;

  const plusIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`;

  function renderGrid() {
    const list = filtered();
    $("#grid").innerHTML = list
      .map(
        (p) => `
      <article class="card">
        <button class="card__media" data-open="${p.id}" aria-label="Детальніше: ${esc(p.name)}">
          ${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ""}
          ${art(p)}
        </button>
        <div class="card__body">
          <span class="card__cat">${esc(catName[p.category] || "")}</span>
          <button class="card__title" data-open="${p.id}">${esc(p.name)}</button>
          <span class="stock${p.stock ? "" : " stock--out"}">${p.stock ? "● В наявності" : "Немає в наявності"}</span>
          <div class="card__foot">
            ${priceHtml(p)}
            <button class="add-btn" data-add="${p.id}" ${p.stock ? "" : "disabled"} aria-label="Додати в кошик: ${esc(p.name)}">${plusIcon}</button>
          </div>
        </div>
      </article>`
      )
      .join("");
    $("#empty").hidden = list.length > 0;
    $("#resultCount").textContent = list.length
      ? `${list.length} ${plural(list.length, "товар", "товари", "товарів")}`
      : "";
  }

  /* ---------- Картка товару ---------- */
  const modal = $("#productModal");

  function openProduct(id) {
    const p = byId[id];
    if (!p) return;
    const specs = Object.entries(p.specs || {})
      .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
      .join("");
    $("#productModalBody").innerHTML = `
      <div class="pm__media">${art(p)}</div>
      <div class="pm__info">
        <span class="card__cat">${esc(catName[p.category] || "")}</span>
        <h2 id="pmTitle">${esc(p.name)}</h2>
        <span class="stock${p.stock ? "" : " stock--out"}">${p.stock ? "● В наявності" : "Немає в наявності"}</span>
        <p>${esc(p.desc)}</p>
        ${specs ? `<table class="specs"><tbody>${specs}</tbody></table>` : ""}
        <div class="pm__buy">
          ${priceHtml(p)}
          <button class="btn btn--primary" data-add="${p.id}" ${p.stock ? "" : "disabled"}>${p.stock ? "Додати в кошик" : "Немає в наявності"}</button>
        </div>
      </div>`;
    modal.showModal();
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest("[data-close]")) modal.close();
  });

  /* ---------- Кошик ---------- */
  const CART_KEY = "store-cart";
  let cart = {};
  try {
    cart = JSON.parse(localStorage.getItem(CART_KEY)) || {};
  } catch { cart = {}; }
  // прибрати товари, яких більше немає в каталозі
  for (const id of Object.keys(cart)) if (!byId[id] || !(cart[id] > 0)) delete cart[id];

  const save = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {} };
  const cartItems = () => Object.entries(cart).map(([id, qty]) => ({ p: byId[id], qty }));
  const cartQty = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = () => cartItems().reduce((s, { p, qty }) => s + p.price * qty, 0);

  function addToCart(id, btn) {
    const p = byId[id];
    if (!p || !p.stock) return;
    cart[id] = (cart[id] || 0) + 1;
    save();
    renderCart();
    toast(`«${p.name}» додано в кошик`);
    const cb = $("#cartOpen");
    cb.classList.remove("bump"); void cb.offsetWidth; cb.classList.add("bump");
    if (btn && btn.classList.contains("add-btn")) {
      btn.classList.add("added");
      btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5L19 7"/></svg>`;
      setTimeout(() => { btn.classList.remove("added"); btn.innerHTML = plusIcon; }, 1100);
    }
  }

  function setQty(id, qty) {
    if (qty <= 0) delete cart[id];
    else cart[id] = Math.min(qty, 99);
    save();
    renderCart();
  }

  let view = "cart"; // cart | checkout | done

  function shippingText(sum) {
    const delivery = $('input[name="delivery"]:checked')?.value;
    if (view === "checkout" && delivery === "Самовивіз") return "Безкоштовно";
    if (sum >= STORE.freeShippingFrom) return "Безкоштовно";
    return "за тарифами перевізника";
  }

  function renderCart() {
    const qty = cartQty();
    const countEl = $("#cartCount");
    countEl.hidden = qty === 0;
    countEl.textContent = qty;

    const items = cartItems();
    $("#cartList").innerHTML = items
      .map(
        ({ p, qty }) => `
      <li class="cart-item">
        <div class="cart-item__img">${art(p)}</div>
        <div>
          <p class="cart-item__name">${esc(p.name)}</p>
          <div class="qty">
            <button data-dec="${p.id}" aria-label="Зменшити кількість">−</button>
            <span>${qty}</span>
            <button data-inc="${p.id}" aria-label="Збільшити кількість">+</button>
          </div>
        </div>
        <div class="cart-item__side">
          <span class="cart-item__price">${fmt(p.price * qty)}</span>
          <button class="remove" data-remove="${p.id}">Видалити</button>
        </div>
      </li>`
      )
      .join("");
    $("#cartEmpty").hidden = items.length > 0;

    const sum = subtotal();
    $("#subtotal").textContent = fmt(sum);
    $("#shipping").textContent = shippingText(sum);
    $("#total").textContent = fmt(sum);

    if (!items.length && view === "checkout") setView("cart");
    $("#cartFoot").hidden = view === "done" || !items.length;
  }

  function setView(v) {
    view = v;
    $("#cartView").hidden = v !== "cart";
    $("#checkoutView").hidden = v !== "checkout";
    $("#doneView").hidden = v !== "done";
    $("#drawerTitle").textContent = { cart: "Кошик", checkout: "Оформлення замовлення", done: "Замовлення сформовано" }[v];
    $("#checkoutBtn").textContent = v === "checkout" ? "Підтвердити замовлення" : "Оформити замовлення";
    $("#formError").hidden = true;
    renderCart();
    $(".drawer__body:not([hidden])")?.scrollTo(0, 0);
  }

  /* ---------- Відкриття/закриття кошика ---------- */
  const drawer = $("#drawer");
  const backdrop = $("#drawerBackdrop");
  let lastFocus = null;

  function openDrawer() {
    lastFocus = document.activeElement;
    if (view === "done") setView("cart");
    backdrop.hidden = false;
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    $("#cartClose").focus();
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    backdrop.hidden = true;
    document.body.classList.remove("no-scroll");
    lastFocus?.focus?.();
  }

  /* ---------- Оформлення ---------- */
  const form = $("#checkoutView");

  function toggleBranch() {
    const pickup = $('input[name="delivery"]:checked').value === "Самовивіз";
    $("#branchField").hidden = pickup;
    form.branch.required = !pickup;
    renderCart();
  }

  function submitOrder() {
    let ok = true;
    $$("input[required]", form).forEach((inp) => {
      const valid = inp.closest("[hidden]") ? true : inp.checkValidity() && inp.value.trim() !== "";
      inp.classList.toggle("invalid", !valid);
      if (!valid && ok) { inp.focus(); ok = false; }
    });
    $("#formError").hidden = ok;
    if (!ok) return;

    const d = Object.fromEntries(new FormData(form));
    const num = "№" + Date.now().toString().slice(-6);
    const sum = subtotal();
    const lines = cartItems().map(({ p, qty }, i) => `${i + 1}. ${p.name} × ${qty} = ${fmt(p.price * qty)}`);
    const text = [
      `Замовлення ${num} — ${STORE.name}`,
      "",
      ...lines,
      "",
      `Разом: ${fmt(sum)}`,
      `Доставка: ${d.delivery}${d.delivery !== "Самовивіз" ? ", " + d.branch : ""} (${shippingText(sum)})`,
      `Оплата: ${d.payment}`,
      "",
      `Ім'я: ${d.name}`,
      `Телефон: ${d.phone}`,
      `Місто: ${d.city}`,
      d.comment ? `Коментар: ${d.comment}` : "",
    ].filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n").trim();

    $("#orderText").value = text;
    cart = {};
    save();
    form.reset();
    toggleBranch();
    setView("done");

    const mail = `mailto:${STORE.email}?subject=${encodeURIComponent(`Замовлення ${num}`)}&body=${encodeURIComponent(text)}`;
    window.location.href = mail;
  }

  /* ---------- Повідомлення ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* ---------- Події ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-add],[data-open],[data-inc],[data-dec],[data-remove],[data-cat],[data-go-catalog]");
    if (!t) return;
    const d = t.dataset;
    if (d.add) addToCart(d.add, t);
    else if (d.open) openProduct(d.open);
    else if (d.inc) setQty(d.inc, (cart[d.inc] || 0) + 1);
    else if (d.dec) setQty(d.dec, (cart[d.dec] || 0) - 1);
    else if (d.remove) setQty(d.remove, 0);
    else if (d.cat) { state.category = d.cat; renderCategories(); renderGrid(); }
    else if ("goCatalog" in d) { closeDrawer(); setView("cart"); location.hash = "catalog"; }
  });

  let searchTimer;
  $("#search").addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = e.target.value;
      renderGrid();
      if (state.query && window.scrollY < $("#catalog").offsetTop - 100) $("#catalog").scrollIntoView();
    }, 150);
  });
  $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; renderGrid(); });
  $("#inStock").addEventListener("change", (e) => { state.inStock = e.target.checked; renderGrid(); });
  $("#resetFilters").addEventListener("click", () => {
    Object.assign(state, { category: "all", query: "", inStock: false });
    $("#search").value = "";
    $("#inStock").checked = false;
    renderCategories();
    renderGrid();
  });

  $("#cartOpen").addEventListener("click", openDrawer);
  $("#cartClose").addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("open") && !modal.open) closeDrawer();
  });

  $("#checkoutBtn").addEventListener("click", () => {
    if (view === "cart") setView("checkout");
    else if (view === "checkout") submitOrder();
  });
  $("#backToCart").addEventListener("click", () => setView("cart"));
  form.addEventListener("submit", (e) => { e.preventDefault(); submitOrder(); });
  form.addEventListener("input", (e) => e.target.classList.remove("invalid"));
  $$('input[name="delivery"]').forEach((r) => r.addEventListener("change", toggleBranch));

  $("#copyOrder").addEventListener("click", async () => {
    const ta = $("#orderText");
    try { await navigator.clipboard.writeText(ta.value); }
    catch { ta.select(); document.execCommand("copy"); }
    toast("Замовлення скопійовано");
  });

  /* ---------- Старт ---------- */
  fillStoreInfo();
  renderCategories();
  renderGrid();
  setView("cart");
})();
