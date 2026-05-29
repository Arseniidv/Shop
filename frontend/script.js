const API_BASE = window.location.origin.includes("localhost")
  ? "http://localhost:5001"
  : "/api";

const CART_KEY = "cartItems";
const TOKEN_KEY = "authToken";
const USER_KEY = "currentUser";

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect fill='%23f9f9f9' width='400' height='400'/%3E%3Ctext x='200' y='200' text-anchor='middle' dominant-baseline='central' fill='%23ccc' font-size='60'%3E%F0%9F%92%8E%3C/text%3E%3C/svg%3E";

function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

let productsData = [];
let activeCategory = "Все";
let searchQuery = "";
let cartItems = JSON.parse(localStorage.getItem(CART_KEY) || "[]");

const container = document.getElementById("product-container");
const filterContainer = document.getElementById("filter-container");
const sortSelect = document.querySelector("#sort-select");
const searchToggle = document.getElementById("search-toggle");
const searchContainer = document.getElementById("header-search-container");
const searchInput = document.getElementById("header-search-input");
const pages = document.querySelectorAll(".page");
const navLinks = document.querySelectorAll(".nav-link[data-page]");
const profileLink = document.getElementById("profile-nav-link");
const cartNavLink = document.getElementById("cart-nav-link");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cartTotal");
const cartSummaryEl = document.getElementById("cart-summary");
const cartNavCount = document.getElementById("cart-nav-count");
const checkoutBtn = document.getElementById("checkout-button");
const checkoutMsg = document.getElementById("checkout-message");
const contactForm = document.getElementById("contact-form");
const contactSuccess = document.getElementById("contact-success");

function persistCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
}

function getCartQty() {
  return cartItems.reduce((sum, it) => sum + (it.qty || 0), 0);
}

function getCartTotal() {
  return cartItems.reduce((sum, it) => sum + (it.price || 0) * (it.qty || 0), 0);
}

function formatPrice(price) {
  return Number(price).toLocaleString("ru-RU") + " ₽";
}

function renderCart() {
  if (!cartItemsContainer) return;

  if (!cartItems.length) {
    cartItemsContainer.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-shopping-cart"></i>
        <h3>Корзина пуста</h3>
        <p>Добавьте товары на главной странице</p>
      </div>
    `;
    if (cartSummaryEl) cartSummaryEl.style.display = "none";
    if (cartNavCount) cartNavCount.textContent = "0";
    return;
  }

  cartItemsContainer.innerHTML = cartItems
    .map((it) => {
      const name = escapeHtml(it.name);
      const cat = escapeHtml(it.category || "");
      return `
        <div class="cart-item">
          <div class="cart-item-image">
            <img src="${escapeHtml(it.image)}" alt="${name}" onerror="this.src='${PLACEHOLDER_IMG}'; this.onerror=null">
          </div>
          <div class="cart-item-info">
            <div class="cart-item-title">${name}</div>
            <div class="cart-item-meta">
              Категория: ${cat}<br/>
              Цена: ${formatPrice(it.price)} · Кол-во: ${it.qty}
            </div>
          </div>
          <div class="cart-actions">
            <div class="cart-item-price">${formatPrice(it.price * it.qty)}</div>
            <button class="remove-from-cart" type="button" data-product-name="${escapeHtml(it.name)}">
              Убрать
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  if (cartSummaryEl) cartSummaryEl.style.display = "flex";
  if (cartTotalEl) cartTotalEl.textContent = formatPrice(getCartTotal());
  if (cartNavCount) cartNavCount.textContent = String(getCartQty());
}

if (cartItemsContainer) {
  cartItemsContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".remove-from-cart");
    if (!btn) return;

    const productName = btn.getAttribute("data-product-name");
    if (!productName) return;

    cartItems = cartItems.filter((it) => it.name !== productName);
    persistCart();
    renderCart();
  });
}

function renderProducts(list) {
  if (!container) return;

  if (!list.length) {
    container.innerHTML = '<div class="no-results">Товары не найдены</div>';
    return;
  }

  container.innerHTML = "";
  list.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";

    const imageDiv = document.createElement("div");
    imageDiv.className = "product-image";

    const img = document.createElement("img");
    img.src = product.image || "";
    img.alt = product.name;
    img.onerror = function () { this.src = PLACEHOLDER_IMG; this.onerror = null; };
    imageDiv.appendChild(img);

    if (product.badge) {
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = product.badge;
      imageDiv.appendChild(badge);
    }

    const info = document.createElement("div");
    info.className = "product-info";

    const nameEl = document.createElement("h3");
    nameEl.textContent = product.name;
    info.appendChild(nameEl);

    const catEl = document.createElement("div");
    catEl.className = "category";
    catEl.textContent = product.category || "";
    info.appendChild(catEl);

    const priceEl = document.createElement("div");
    priceEl.className = "price";
    priceEl.textContent = formatPrice(product.price);
    info.appendChild(priceEl);

    const btn = document.createElement("button");
    btn.className = "cta-button add-to-cart";
    btn.type = "button";
    btn.dataset.productName = product.name;
    btn.dataset.productPrice = product.price;
    btn.dataset.productImage = product.image;
    btn.dataset.productCategory = product.category;
    btn.textContent = "В корзину";
    info.appendChild(btn);

    card.appendChild(imageDiv);
    card.appendChild(info);
    container.appendChild(card);
  });

  initCartButtons();
}

function getSortedProducts(list) {
  const sortOrder = sortSelect ? sortSelect.value : "default";
  const sorted = [...list];

  if (sortOrder === "price-asc") sorted.sort((a, b) => a.price - b.price);
  if (sortOrder === "price-desc") sorted.sort((a, b) => b.price - a.price);
  if (sortOrder === "name-asc") sorted.sort((a, b) => a.name.localeCompare(b.name, "ru"));

  return sorted;
}

function updateProducts() {
  if (!productsData.length) {
    if (container) container.innerHTML = '<div class="no-results">Загрузка товаров...</div>';
    return;
  }

  const filtered = productsData.filter((product) => {
    const categoryMatch = activeCategory === "Все" || product.category === activeCategory;
    const searchMatch = product.name.toLowerCase().includes(searchQuery);
    return categoryMatch && searchMatch;
  });

  renderProducts(getSortedProducts(filtered));
}

filterContainer.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-bth");
  if (!btn) return;

  filterContainer.querySelectorAll(".filter-bth").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  activeCategory = btn.dataset.filter;
  updateProducts();
});

if (sortSelect) {
  sortSelect.addEventListener("change", updateProducts);
}

if (searchToggle && searchContainer) {
  searchToggle.addEventListener("click", () => {
    searchContainer.classList.toggle("active");
    if (searchContainer.classList.contains("active")) {
      searchInput.focus();
    }
  });
}

if (searchInput) {
  searchInput.addEventListener("input", debounce((e) => {
    searchQuery = e.target.value.toLowerCase();
    updateProducts();
  }, 300));
}

function initCartButtons() {
  document.querySelectorAll(".add-to-cart").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.productName;
      const price = Number(btn.dataset.productPrice || 0);
      const image = btn.dataset.productImage || "";
      const category = btn.dataset.productCategory || "";

      if (!name) return;

      const idx = cartItems.findIndex((it) => it.name === name);
      if (idx >= 0) {
        cartItems[idx].qty = (cartItems[idx].qty || 0) + 1;
      } else {
        cartItems.push({ name, price, image, category, qty: 1 });
      }

      persistCart();
      renderCart();
    });
  });
}

function setActiveNav(pageId) {
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.page === pageId);
  });
}

function showPage(pageId, updateHash = true) {
  pages.forEach((page) => page.classList.remove("active"));
  const target = document.getElementById(pageId);
  if (!target) return;

  target.classList.add("active");
  setActiveNav(pageId);
  if (updateHash) window.location.hash = pageId;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", (e) => {
  const link = e.target.closest("a[href^='#']");
  if (!link) return;

  const href = link.getAttribute("href");
  if (!href || href === "#") return;

  const id = href.slice(1);
  const targetPage = document.getElementById(id);
  if (!targetPage || !targetPage.classList.contains("page")) return;

  e.preventDefault();
  showPage(id);
});

if (cartNavLink) {
  cartNavLink.addEventListener("click", () => showPage("cart"));
}

function initAuthState() {
  const token = localStorage.getItem(TOKEN_KEY);
  const currentUser = JSON.parse(localStorage.getItem(USER_KEY) || "null");

  if (profileLink) {
    if (currentUser?.name) {
      profileLink.innerHTML = `<i class="fas fa-user"></i> ${escapeHtml(currentUser.name)}`;
      profileLink.title = `Профиль: ${currentUser.name}`;
    } else {
      profileLink.innerHTML = '<i class="fas fa-user"></i>';
      profileLink.title = "Войти";
    }
  }

  if (token && currentUser) {
    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          if (profileLink) {
            profileLink.innerHTML = `<i class="fas fa-user"></i> ${escapeHtml(data.user.name)}`;
          }
        } else {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          if (profileLink) {
            profileLink.innerHTML = '<i class="fas fa-user"></i>';
          }
        }
      })
      .catch(() => {});
  }
}

function initPageRouting() {
  const hashPage = window.location.hash?.replace("#", "");
  if (hashPage && document.getElementById(hashPage)) {
    showPage(hashPage, false);
  } else {
    showPage("home", false);
  }
}

if (checkoutBtn) {
  checkoutBtn.addEventListener("click", () => {
    cartItems = [];
    persistCart();
    renderCart();
    if (checkoutMsg) checkoutMsg.style.display = "block";
    setTimeout(() => {
      if (checkoutMsg) checkoutMsg.style.display = "none";
    }, 3000);
  });
}

if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    contactForm.reset();
    if (contactSuccess) contactSuccess.style.display = "block";
    setTimeout(() => {
      if (contactSuccess) contactSuccess.style.display = "none";
    }, 4000);
  });
}

function loadProducts() {
  if (container) {
    container.innerHTML = '<div class="no-results">Загрузка товаров...</div>';
  }

  fetch(`${API_BASE}/products`)
    .then((r) => {
      if (!r.ok) throw new Error("Network error");
      return r.json();
    })
    .then((data) => {
      productsData = data;
      updateProducts();
    })
    .catch(() => {
      if (container) {
        container.innerHTML = '<div class="no-results">Не удалось загрузить товары. Проверьте, что backend запущен.</div>';
      }
    });
}

document.addEventListener("DOMContentLoaded", () => {
  initAuthState();
  initPageRouting();
  loadProducts();
  renderCart();
});
