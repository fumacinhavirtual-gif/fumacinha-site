const TABLE_NAME = "PRODUTOS";
const CONFIG_TABLE_NAME = "SITE_CONFIG";
const CATEGORY_TABLE_NAME = "CATEGORIAS";
const SALES_TABLE_NAME = "VENDAS";
const BANNER_TABLE_NAME = "BANNERS_HOME";
const BENEFITS_TABLE_NAME = "BENEFICIOS_LOJA";
const PRODUCT_IMAGE_BUCKET = "fumacinha-produtos";
const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;
const PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const LOW_STOCK_DEFAULT_LIMIT = 5;
const ADMIN_ACCESS_PARAM = "admin";
const ADMIN_ACCESS_SECRET = "fumacinha";
const PRODUCT_SLOW_LOAD_MS = 5000;

const settings = {
  brandTitle: "Fumacinha",
  brandSubtitle: "Loja Fumacinha com produtos separados, estoque proprio e atendimento pelo WhatsApp.",
  logoUrl: "",
  bannerImage: "",
  homeText: "",
  whatsapp: "62991877597",
  deliveryInfo: "Para todo o Brasil",
};

const state = {
  products: [],
  categories: [],
  cart: new Map(),
  productQuantity: 1,
  search: "",
  editMode: false,
  salesMode: false,
  sales: [],
  benefits: [],
  productsLoaded: false,
  productLoadPromise: null,
  categoryConfigs: [],
  activeCategory: "",
  financeFilter: "today",
  historyGroup: "day",
  bannerCarousel: { enabled: false, interval: 5, banners: [] },
  bannerIndex: 0,
  bannerTimer: null,
  productEditorMode: "create",
  selectedProductImageFile: null,
  removeProductImage: false,
  selectedSiteLogoFile: null,
  removeSiteLogo: false,
  selectedBannerImageFiles: new Map(),
  removedBannerImages: new Set(),
  selectedBenefitImageFiles: new Map(),
  removedBenefitImages: new Set(),
  adminProducts: {
    query: "",
    sort: "recent",
    filter: "all",
    lowStockLimit: LOW_STOCK_DEFAULT_LIMIT,
  },
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const productRoot = document.querySelector("[data-products]");
const productPage = document.querySelector("[data-product-page]");
const categoryRail = document.querySelector("[data-category-rail]");
const cartDrawer = document.querySelector("[data-cart-drawer]");
const cartItems = document.querySelector("[data-cart-items]");
const cartEmpty = document.querySelector("[data-cart-empty]");
const cartCount = document.querySelector("[data-cart-count]");
const cartTrigger = document.querySelector("[data-open-cart]");
const cartUnits = document.querySelector("[data-cart-units]");
const cartNormalTotal = document.querySelector("[data-cart-normal-total]");
const cartFooter = document.querySelector("[data-cart-footer]");
const checkout = document.querySelector("[data-checkout]");
const orderConfirmation = document.querySelector("[data-order-confirmation]");
const orderConfirmationForm = document.querySelector("[data-order-confirmation-form]");
const orderSummary = document.querySelector("[data-order-summary]");
const orderError = document.querySelector("[data-order-error]");
const toastRegion = document.querySelector("[data-toast-region]");
const searchInput = document.querySelector("[data-search]");
const searchForm = document.querySelector(".search-form");
const benefitCarousel = document.querySelector("[data-benefit-carousel]");
const benefitTrack = document.querySelector("[data-benefit-track]");
const benefitPrev = document.querySelector("[data-benefit-prev]");
const benefitNext = document.querySelector("[data-benefit-next]");
const homeBannerCarousel = document.querySelector("[data-home-banner-carousel]");
const brandLogoImage = document.querySelector("[data-brand-logo-image]");
const bannerTrack = document.querySelector("[data-banner-track]");
const bannerDots = document.querySelector("[data-banner-dots]");
const bannerPrev = document.querySelector("[data-banner-prev]");
const bannerNext = document.querySelector("[data-banner-next]");
const configBanner = document.querySelector("[data-config-banner]");
const configBannerImage = document.querySelector("[data-config-banner-image]");
const homeText = document.querySelector("[data-home-text]");
const editLogin = document.querySelector("[data-edit-login]");
const editLoginForm = document.querySelector("[data-edit-login-form]");
const editLoginError = document.querySelector("[data-edit-login-error]");
const editToolbar = document.querySelector("[data-edit-toolbar]");
const adminMobileTrigger = document.querySelector("[data-admin-mobile-toggle]");
const adminMobileMenu = document.querySelector("[data-admin-mobile-menu]");
const adminProductPanel = document.querySelector("[data-admin-product-panel]");
const adminProductSearch = document.querySelector("[data-admin-product-search]");
const adminProductSort = document.querySelector("[data-admin-product-sort]");
const adminProductFilter = document.querySelector("[data-admin-product-filter]");
const lowStockLimitInput = document.querySelector("[data-low-stock-limit]");
const lowStockList = document.querySelector("[data-low-stock-list]");
const productEditor = document.querySelector("[data-product-editor]");
const productEditorForm = document.querySelector("[data-product-editor-form]");
const productEditorTitle = document.querySelector("[data-product-editor-title]");
const productEditorError = document.querySelector("[data-product-editor-error]");
const productImageFileInput = document.querySelector("[data-product-image-file]");
const productImagePreview = document.querySelector("[data-product-image-preview]");
const productImagePreviewEmpty = document.querySelector("[data-product-image-preview-empty]");
const productImagePreviewImage = document.querySelector("[data-product-image-preview-img]");
const productSaveButton = document.querySelector("[data-product-save]");
const productUploadStatus = document.querySelector("[data-product-upload-status]");
const categoryEditor = document.querySelector("[data-category-editor]");
const categoryEditorForm = document.querySelector("[data-category-editor-form]");
const categoryEditorList = document.querySelector("[data-category-editor-list]");
const categoryEditorError = document.querySelector("[data-category-editor-error]");
const bannerEditor = document.querySelector("[data-banner-editor]");
const bannerEditorForm = document.querySelector("[data-banner-editor-form]");
const bannerEditorList = document.querySelector("[data-banner-editor-list]");
const bannerEditorError = document.querySelector("[data-banner-editor-error]");
const benefitEditor = document.querySelector("[data-benefit-editor]");
const benefitEditorForm = document.querySelector("[data-benefit-editor-form]");
const benefitEditorList = document.querySelector("[data-benefit-editor-list]");
const benefitEditorError = document.querySelector("[data-benefit-editor-error]");
const benefitSaveButton = document.querySelector("[data-benefit-save]");
const siteEditor = document.querySelector("[data-site-editor]");
const siteEditorForm = document.querySelector("[data-site-editor-form]");
const siteEditorError = document.querySelector("[data-site-editor-error]");
const siteLogoFileInputs = document.querySelectorAll("[data-site-logo-file]");
const siteLogoPreview = document.querySelector("[data-site-logo-preview]");
const siteLogoPreviewEmpty = document.querySelector("[data-site-logo-preview-empty]");
const siteLogoPreviewImage = document.querySelector("[data-site-logo-preview-img]");
const siteLogoUploadStatus = document.querySelector("[data-site-logo-upload-status]");
const salesLogin = document.querySelector("[data-sales-login]");
const salesLoginForm = document.querySelector("[data-sales-login-form]");
const salesLoginError = document.querySelector("[data-sales-login-error]");
const salesPanel = document.querySelector("[data-sales-panel]");
const stockList = document.querySelector("[data-stock-list]");
const salesHistory = document.querySelector("[data-sales-history]");
const salesDayTotal = document.querySelector("[data-sales-day-total]");
const salesWeekTotal = document.querySelector("[data-sales-week-total]");
const salesMonthTotal = document.querySelector("[data-sales-month-total]");
const salesYearTotal = document.querySelector("[data-sales-year-total]");
const ticketDay = document.querySelector("[data-ticket-day]");
const ticketWeek = document.querySelector("[data-ticket-week]");
const ticketMonth = document.querySelector("[data-ticket-month]");
const ticketYear = document.querySelector("[data-ticket-year]");
const saleForm = document.querySelector("[data-sale-form]");
const saleProductSelect = document.querySelector("[data-sale-product-select]");
const saleError = document.querySelector("[data-sale-error]");
const salesStatus = document.querySelector("[data-sales-status]");
const customPeriod = document.querySelector("[data-custom-period]");
const financeStart = document.querySelector("[data-finance-start]");
const financeEnd = document.querySelector("[data-finance-end]");
const filterTotal = document.querySelector("[data-filter-total]");
const filterCount = document.querySelector("[data-filter-count]");
const filterTicket = document.querySelector("[data-filter-ticket]");
const filterProfit = document.querySelector("[data-filter-profit]");
const filterProducts = document.querySelector("[data-filter-products]");
const chartDay = document.querySelector("[data-chart-day]");
const chartWeek = document.querySelector("[data-chart-week]");
const chartMonth = document.querySelector("[data-chart-month]");
const rankingDay = document.querySelector("[data-ranking-day]");
const rankingWeek = document.querySelector("[data-ranking-week]");
const rankingMonth = document.querySelector("[data-ranking-month]");
const rankingYear = document.querySelector("[data-ranking-year]");
const policyModal = document.querySelector("[data-policy-modal]");
const policyTitle = document.querySelector("[data-policy-title]");
const policyContent = document.querySelector("[data-policy-content]");

const policies = {
  entrega: {
    title: "Entrega",
    html: `
      <h3>Entrega</h3>
      <p>A taxa de entrega é cobrada por quilômetro.</p>
      <p>Todos os pedidos saem em rotas. Por isso, envie sua localização correta para evitar atrasos ou problemas na entrega.</p>
      <p>Horários de saída das rotas:</p>
      <ul>
        <li>11:00</li>
        <li>13:00</li>
        <li>15:00</li>
        <li>17:00</li>
        <li>19:00</li>
        <li>21:00</li>
      </ul>
      <p>Quando o entregador estiver chegando com o seu pedido, ele enviará uma mensagem. Fique atento ao celular.</p>
      <p>Após a chegada do entregador, há uma tolerância máxima de 5 minutos para o recebimento.</p>
      <p>Se o pedido não for recebido dentro desse prazo, o entregador continuará a rota e retornará com o produto.</p>
      <p>Para uma nova tentativa de entrega, será cobrada outra taxa, devido aos custos e ao tempo da nova rota.</p>
    `,
  },
  trocas: {
    title: "Trocas e Devolução",
    html: `
      <h3>Trocas e Devolução</h3>
      <p>Ao receber o pedido, peça ao entregador que aguarde enquanto você testa o produto.</p>
      <p>Caso o produto não funcione, o entregador poderá realizar a troca no mesmo momento.</p>
      <p>Se o produto não for testado no momento da entrega, será necessário pagar uma nova taxa para que o entregador faça a troca no próximo horário de saída.</p>
      <p>Por isso, é muito importante testar o produto na hora do recebimento, evitando transtornos e custos adicionais.</p>
    `,
  },
};

const LUCIDE_BENEFIT_ICONS = [
  "truck", "shield-check", "clock-3", "credit-card", "package", "gift", "map-pin", "store", "badge-check", "wallet",
  "star", "headphones", "phone", "percent", "flame", "zap", "lock", "sparkles", "heart", "shopping-bag",
  "shopping-cart", "badge-dollar-sign", "banknote", "coins", "receipt", "tag", "tags", "ticket", "award", "medal",
  "trophy", "thumbs-up", "smile", "message-circle", "send", "mail", "calendar-check", "calendar-days", "timer", "alarm-clock",
  "route", "navigation", "map", "home", "building-2", "warehouse", "box", "boxes", "package-check", "package-open",
  "package-search", "package-plus", "archive", "clipboard-check", "list-checks", "check-circle", "circle-check", "shield", "shield-plus", "user-check",
  "users", "id-card", "key-round", "scan-line", "qr-code", "wifi", "smartphone", "monitor", "laptop", "camera",
  "image", "upload", "download", "refresh-cw", "rotate-ccw", "repeat", "undo-2", "redo-2", "settings", "sliders-horizontal",
  "filter", "search", "eye", "bell", "megaphone", "radio", "newspaper", "bookmark", "flag", "pin",
  "gem", "crown", "party-popper", "flower", "leaf", "sun", "moon", "cloud", "umbrella", "life-buoy",
  "handshake", "hand-heart", "circle-dollar-sign", "landmark", "scale", "ruler", "wrench", "hammer", "paintbrush", "palette"
];

const supabaseClient = createSupabaseClient();

function createSupabaseClient() {
  const url = window.FUMACINHA_SUPABASE_URL;
  const key = window.FUMACINHA_SUPABASE_PUBLISHABLE_KEY;
  const isConfigured = url && key && !url.includes("COLE_AQUI") && !key.includes("COLE_AQUI");

  if (!isConfigured || !window.supabase) return null;
  return window.supabase.createClient(url, key);
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getProductDescription(product) {
  if (product.descricao) return product.descricao;
  return `Produto da categoria ${product.categoria}, disponível na Fumacinha para confirmar cores, estoque e entrega pelo WhatsApp.`;
}

function productSearchText(product) {
  return `${product.nome} ${product.categoria} ${product.descricao || ""}`.toLowerCase();
}

function getVisibleProducts() {
  const term = state.search.trim().toLowerCase();
  const publicProducts = state.products.filter((product) => product.ativo && product.estoque > 0);
  if (term) {
    return publicProducts.filter((product) => productSearchText(product).includes(term));
  }
  if (state.activeCategory) {
    return publicProducts.filter((product) => product.categoryId === state.activeCategory);
  }
  return publicProducts.filter((product) => !product.ocultar_home);
}

function getFeaturedProducts() {
  if (state.search.trim() || state.activeCategory) return [];
  return state.products.filter((product) => {
    return product.ativo && product.estoque > 0 && product.destaque_home && !product.ocultar_home;
  });
}

function getHomeCategories() {
  if (state.search.trim() || state.activeCategory) return state.categories;
  return state.categories.filter((category) => category.ativo_home);
}

function getCategorySearchProducts(category) {
  const term = state.search.trim().toLowerCase();
  const publicProducts = state.products.filter((product) => product.ativo && product.estoque > 0);
  return publicProducts.filter((product) => {
    if (product.categoryId !== category.id) return false;
    if (!term) return true;
    return productSearchText(product).includes(term);
  });
}

function getAdminFilteredProducts(products = state.products) {
  const query = state.adminProducts.query.trim().toLowerCase();
  const filter = state.adminProducts.filter;
  const sort = state.adminProducts.sort;
  let list = [...products];

  if (query) list = list.filter((product) => productSearchText(product).includes(query));
  if (filter === "active") list = list.filter((product) => product.ativo);
  if (filter === "inactive") list = list.filter((product) => !product.ativo);
  if (filter === "with-stock") list = list.filter((product) => product.estoque > 0);
  if (filter === "without-stock") list = list.filter((product) => product.estoque <= 0);

  const byName = (a, b) => a.nome.localeCompare(b.nome, "pt-BR");
  const byRecent = (a, b) => Number(b.id || 0) - Number(a.id || 0);
  const sorters = {
    recent: byRecent,
    az: byName,
    za: (a, b) => byName(b, a),
    "stock-asc": (a, b) => a.estoque - b.estoque || byName(a, b),
    "stock-desc": (a, b) => b.estoque - a.estoque || byName(a, b),
    active: (a, b) => Number(b.ativo) - Number(a.ativo) || byName(a, b),
    inactive: (a, b) => Number(a.ativo) - Number(b.ativo) || byName(a, b),
  };

  return list.sort(sorters[sort] || byRecent);
}

function renderAdminProductPanel() {
  adminProductPanel?.classList.toggle("hidden", !state.editMode);
  if (!state.editMode || !lowStockList) return;

  const limit = Math.max(1, Number(state.adminProducts.lowStockLimit || LOW_STOCK_DEFAULT_LIMIT));
  const lowStockProducts = state.products
    .filter((product) => product.estoque <= limit)
    .sort((a, b) => a.estoque - b.estoque || a.nome.localeCompare(b.nome, "pt-BR"));

  lowStockList.innerHTML = lowStockProducts.length
    ? lowStockProducts
        .map(
          (product) => `
            <article class="low-stock-card ${product.estoque <= 0 ? "empty" : "warning"}">
              <div class="low-stock-image">${productImage(product)}</div>
              <div>
                <strong>${escapeHtml(product.nome)}</strong>
                <span>${escapeHtml(product.categoria)} · Estoque atual: ${product.estoque}</span>
              </div>
              <label>
                Atualizar
                <input type="number" min="0" step="1" value="${product.estoque}" data-low-stock-input="${product.id}" />
              </label>
              <button type="button" data-edit-product="${product.id}">Editar</button>
              <button type="button" data-low-stock-save="${product.id}">Salvar estoque</button>
            </article>
          `
        )
        .join("")
    : `<p class="edit-help">Nenhum produto com estoque baixo pelo limite atual.</p>`;
}

function mapProduct(row) {
  const categoryName = row.categoria || "Produtos";
  const price = Number(row.preco || 0);
  const hasStockColumn = Object.prototype.hasOwnProperty.call(row, "estoque");
  const hasActiveColumn = Object.prototype.hasOwnProperty.call(row, "ativo");
  const hasFeaturedColumn = Object.prototype.hasOwnProperty.call(row, "destaque_home");
  const hasHideHomeColumn = Object.prototype.hasOwnProperty.call(row, "ocultar_home");
  const hasDescriptionColumn = Object.prototype.hasOwnProperty.call(row, "descricao");
  return {
    id: String(row.id),
    nome: row.nome || "Produto Fumacinha",
    preco: price,
    imagem: row.imagem || "",
    descricao: hasDescriptionColumn ? row.descricao || "" : "",
    categoria: categoryName,
    estoque: hasStockColumn ? Number(row.estoque ?? 0) : 999,
    ativo: hasActiveColumn ? row.ativo !== false : true,
    destaque_home: hasFeaturedColumn ? row.destaque_home === true : false,
    ocultar_home: hasHideHomeColumn ? row.ocultar_home === true : false,
    categoryId: slugify(categoryName),
  };
}

function normalizeProduct(product) {
  const categoryName = product.categoria || "Produtos";
  const price = Number(product.preco || 0);
  return {
    ...product,
    id: String(product.id),
    nome: product.nome || "Produto Fumacinha",
    preco: price,
    imagem: product.imagem || "",
    descricao: product.descricao || "",
    categoria: categoryName,
    estoque: Number(product.estoque ?? 999),
    ativo: product.ativo !== false,
    destaque_home: product.destaque_home === true,
    ocultar_home: product.ocultar_home === true,
    categoryId: slugify(categoryName),
  };
}

function renderProductSkeletons() {
  if (!productRoot || state.productsLoaded || state.products.length) return;
  productRoot.innerHTML = `
    <div class="products-grid product-skeleton-grid" aria-label="Carregando produtos">
      ${Array.from({ length: 6 }, () => '<article class="product-card product-skeleton" aria-hidden="true"><span></span><i></i><b></b><em></em></article>').join("")}
    </div>
  `;
}

function showProductSlowMessage() {
  if (state.products.length || state.productsLoaded) return;
  showLoadMessage("Carregando produtos...");
}

function showProductRetry(message = "Não foi possível carregar os produtos. Toque para tentar novamente.") {
  if (!productRoot) return;
  productRoot.innerHTML = `
    <div class="load-message product-load-error">
      <span>${escapeHtml(message)}</span>
      <button class="btn primary" type="button" data-retry-products>Tentar novamente</button>
    </div>
  `;
}

async function loadProducts({ force = false, showLoading = true } = {}) {
  if (state.productLoadPromise && !force) return state.productLoadPromise;

  state.productLoadPromise = loadProductsOnce({ showLoading }).finally(() => {
    state.productLoadPromise = null;
  });

  return state.productLoadPromise;
}

async function loadProductsOnce({ showLoading = true } = {}) {
  if (!supabaseClient) {
    state.products = [];
    state.productsLoaded = true;
    state.categories = buildFallbackCategories();
    renderCategories();
    renderProductsByCategory();
    syncCartWithProducts();
    renderSalesPanel();
    if (!state.products.length) showLoadMessage("Configure sua Project URL e Publishable Key em supabase-config.js para carregar os produtos.");
    return;
  }

  if (showLoading) renderProductSkeletons();

  const fields = "id,nome,preco,imagem,categoria,descricao,estoque,ativo,destaque_home,ocultar_home";
  const slowTimer = window.setTimeout(showProductSlowMessage, PRODUCT_SLOW_LOAD_MS);
  let response;

  try {
    response = await supabaseClient.from(TABLE_NAME).select(fields).order("categoria", { ascending: true }).order("nome", { ascending: true });
  } catch (error) {
    console.error("[Fumacinha Produtos] Exceção ao carregar produtos:", error);
    if (!state.products.length) showProductRetry();
    console.warn("Erro ao carregar produtos.", error.message || error);
    return;
  } finally {
    window.clearTimeout(slowTimer);
  }

  let { data, error } = response;

  if (error) {
    const missingOptionalColumns =
      error.message?.includes("PRODUTOS.ativo") ||
      error.message?.includes("PRODUTOS.estoque") ||
      error.message?.includes("PRODUTOS.descricao") ||
      error.message?.includes("PRODUTOS.destaque_home") ||
      error.message?.includes("PRODUTOS.ocultar_home");

    if (missingOptionalColumns) {
      console.warn("[Fumacinha Produtos] Colunas opcionais ausentes, usando consulta mínima:", error.message);
      const fallback = await supabaseClient.from(TABLE_NAME).select("id,nome,preco,imagem,categoria").order("categoria", { ascending: true }).order("nome", { ascending: true });
      data = fallback.data;
      error = fallback.error;
    }
  }

  if (error) {
    console.error("[Fumacinha Produtos] Resposta de erro do Supabase:", error);
    if (!state.products.length) showProductRetry();
    console.warn("Erro ao carregar produtos.", error.message);
    return;
  }

  console.log("[Fumacinha Produtos] Produtos carregados:", {
    count: data?.length || 0,
    status: response.status,
    statusText: response.statusText,
  });

  state.products = (data || []).map(mapProduct);
  state.productsLoaded = true;
  state.categories = buildFallbackCategories();
  renderCategories();
  renderProductsByCategory();
  syncCartWithProducts();
  renderSalesPanel();

  loadCategories()
    .then(() => {
      renderCategories();
      renderProductsByCategory();
    })
    .catch((error) => console.warn("Erro ao atualizar categorias.", error.message));
}

function buildFallbackCategories() {
  const visibleForCategories = state.products.filter((product) => product.ativo && product.estoque > 0);
  return [...new Set(visibleForCategories.map((product) => product.categoria))].map((name, index) => ({
    id: slugify(name),
    dbId: "",
    name,
    oldName: name,
    imagem: "",
    ordem: index + 1,
    ativo_home: true,
    icon: iconForCategory(name),
  }));
}

function mapCategoryConfig(row, index = 0) {
  const name = row.nome || "Categoria";
  return {
    id: slugify(name),
    dbId: row.id || "",
    name,
    oldName: name,
    imagem: row.imagem || "",
    ordem: Number(row.ordem || index + 1),
    ativo_home: row.ativo_home !== false,
    icon: iconForCategory(name),
  };
}

function mergeCategoryConfigs(baseCategories, configuredCategories = []) {
  const categoriesByName = new Map(baseCategories.map((category) => [category.name, category]));

  configuredCategories.forEach((configuredCategory, index) => {
    const name = (configuredCategory.name || configuredCategory.nome || "").trim();
    if (!name) return;

    const oldName = configuredCategory.oldName || name;
    const baseCategory = categoriesByName.get(oldName) || categoriesByName.get(name) || {};
    categoriesByName.delete(oldName);
    categoriesByName.set(name, {
      ...baseCategory,
      id: slugify(name),
      dbId: configuredCategory.dbId || baseCategory.dbId || "",
      name,
      oldName: name,
      imagem: configuredCategory.imagem || "",
      ordem: Number(configuredCategory.ordem || index + 1),
      ativo_home: configuredCategory.ativo_home !== false,
      icon: iconForCategory(name),
    });
  });

  return [...categoriesByName.values()].sort((a, b) => a.ordem - b.ordem || a.name.localeCompare(b.name));
}

async function loadCategories() {
  const fallback = buildFallbackCategories();
  state.categories = fallback;

  if (!supabaseClient) return;

  const { data, error } = await supabaseClient.from(CATEGORY_TABLE_NAME).select("id,nome,imagem,ordem,ativo_home").order("ordem", { ascending: true });

  if (error) {
    console.warn(`Configure a tabela ${CATEGORY_TABLE_NAME} no Supabase para editar categorias.`, error.message);
    state.categories = fallback;
    return;
  }

  if (!data?.length) {
    state.categories = fallback;
    return;
  }

  const productCategoryNames = new Set(state.products.map((product) => product.categoria));
  const configured = data.map(mapCategoryConfig).filter((category) => productCategoryNames.has(category.name));
  const configuredNames = new Set(configured.map((category) => category.name));
  const missing = fallback.filter((category) => !configuredNames.has(category.name));
  state.categories = mergeCategoryConfigs(missing, configured);
}

function iconForCategory(name) {
  const text = name.toLowerCase();
  if (text.includes("mesa")) return '<path d="M4 8h16v4H4z" /><path d="M7 12v8M17 12v8M6 20h12" />';
  if (text.includes("rece")) return '<path d="M6 11h12v5H6z" /><path d="M8 6h8v5H8z" /><path d="M7 16v4M17 16v4" />';
  if (text.includes("pl")) return '<path d="M8 5h8v8H8z" /><path d="M7 13h10" /><path d="M9 13v7M15 13v7" />';
  return '<path d="M7 4h10v9H7z" /><path d="M12 13v5M8 20h8" /><path d="M5 20h14" />';
}

function showLoadMessage(message) {
  productRoot.innerHTML = `<p class="load-message">${message}</p>`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cleanFumacinhaContent(value) {
  return String(value || "");
}

async function loadBannerConfig() {
  if (!supabaseClient) {
    renderHomeBannerCarousel();
    return;
  }

  const [{ data: config }, { data: banners, error }] = await Promise.all([
    supabaseClient.from(CONFIG_TABLE_NAME).select("carrossel_ativo,carrossel_intervalo").eq("id", 1).maybeSingle(),
    supabaseClient.from(BANNER_TABLE_NAME).select("id,imagem,titulo,subtitulo,link,ordem,ativo").order("ordem", { ascending: true }),
  ]);

  if (error) {
    console.warn(`Configure a tabela ${BANNER_TABLE_NAME} no Supabase para carregar banners.`, error.message);
    renderHomeBannerCarousel();
    return;
  }

  state.bannerCarousel = {
    enabled: Boolean(config?.carrossel_ativo),
    interval: Number(config?.carrossel_intervalo || 5),
    banners: (banners || []).map((banner) => ({
      id: banner.id,
      imagem: banner.imagem || "",
      titulo: cleanFumacinhaContent(banner.titulo || ""),
      subtitulo: cleanFumacinhaContent(banner.subtitulo || ""),
      link: banner.link || "",
      ordem: Number(banner.ordem || 1),
      ativo: banner.ativo !== false,
    })),
  };
  renderHomeBannerCarousel();
}

function activeBanners() {
  return state.bannerCarousel.banners
    .filter((banner) => banner.imagem && banner.ativo !== false)
    .sort((a, b) => Number(a.ordem || 1) - Number(b.ordem || 1));
}

function moveHomeBanner(direction) {
  const banners = activeBanners();
  if (!banners.length) return;
  state.bannerIndex = (state.bannerIndex + direction + banners.length) % banners.length;
  updateHomeBannerPosition();
}

function updateHomeBannerPosition() {
  if (!bannerTrack) return;
  bannerTrack.style.transform = `translateX(-${state.bannerIndex * 100}%)`;
  bannerDots?.querySelectorAll("button").forEach((button, index) => {
    button.classList.toggle("active", index === state.bannerIndex);
  });
}

function startBannerAutoplay() {
  window.clearInterval(state.bannerTimer);
  const banners = activeBanners();
  if (!state.bannerCarousel.enabled || banners.length <= 1) return;
  state.bannerTimer = window.setInterval(() => moveHomeBanner(1), Math.max(2, Number(state.bannerCarousel.interval || 5)) * 1000);
}

function renderHomeBannerCarousel() {
  const banners = activeBanners();
  const shouldShow = state.bannerCarousel.enabled && banners.length > 0;
  homeBannerCarousel?.classList.toggle("hidden", !shouldShow);
  if (!shouldShow || !bannerTrack || !bannerDots) {
    window.clearInterval(state.bannerTimer);
    return;
  }

  state.bannerIndex = Math.min(state.bannerIndex, banners.length - 1);
  bannerTrack.innerHTML = banners
    .map(
      (banner) => `
        <article class="home-banner-slide">
          ${banner.link ? `<a href="${escapeHtml(banner.link)}" target="_blank" rel="noreferrer">` : ""}
          <img src="${escapeHtml(banner.imagem)}" alt="${escapeHtml(banner.titulo || "Banner Fumacinha")}" />
          ${(banner.titulo || banner.subtitulo) ? `<div><strong>${escapeHtml(banner.titulo)}</strong><span>${escapeHtml(banner.subtitulo)}</span></div>` : ""}
          ${banner.link ? "</a>" : ""}
        </article>
      `
    )
    .join("");
  bannerDots.innerHTML = banners.map((_, index) => `<button type="button" data-banner-dot="${index}" aria-label="Ir para banner ${index + 1}"></button>`).join("");
  updateHomeBannerPosition();
  startBannerAutoplay();
}

function activeBenefits() {
  return state.benefits
    .filter((benefit) => benefit.ativo !== false && (benefit.titulo || benefit.subtitulo || benefit.imagem))
    .sort((a, b) => Number(a.ordem || 1) - Number(b.ordem || 1));
}

function renderLucideIcons() {
  window.lucide?.createIcons?.();
}

function benefitVisual(benefit) {
  if (benefit.imagem) {
    return `<img class="benefit-image" src="${escapeHtml(benefit.imagem)}" alt="${escapeHtml(benefit.titulo || "Benefício Fumacinha")}" />`;
  }
  const icon = benefit.icone || "truck";
  return `<i data-lucide="${escapeHtml(icon)}" aria-hidden="true"></i>`;
}

function renderBenefits() {
  const benefits = activeBenefits();
  benefitCarousel?.classList.toggle("hidden", benefits.length === 0);
  if (!benefitTrack) return;

  benefitIndex = Math.min(benefitIndex, Math.max(benefits.length - 1, 0));
  benefitTrack.innerHTML = benefits
    .map(
      (benefit) => `
        <article class="benefit-card">
          ${benefitVisual(benefit)}
          <div>
            <strong>${escapeHtml(benefit.titulo)}</strong>
            <span>${escapeHtml(benefit.subtitulo)}</span>
          </div>
        </article>
      `
    )
    .join("");
  benefitTrack.style.transform = `translateX(-${benefitIndex * 100}%)`;
  renderLucideIcons();
}

async function loadBenefits() {
  if (!supabaseClient) {
    state.benefits = [];
    renderBenefits();
    return;
  }

  const { data, error } = await supabaseClient
    .from(BENEFITS_TABLE_NAME)
    .select("id,titulo,subtitulo,icone,imagem,ordem,ativo,created_at")
    .order("ordem", { ascending: true });

  if (error) {
    console.warn(`Configure a tabela ${BENEFITS_TABLE_NAME} no Supabase para gerenciar benefícios.`, error.message);
    state.benefits = [];
    renderBenefits();
    return;
  }

  state.benefits = (data || []).map((benefit) => ({
    id: benefit.id,
    titulo: benefit.titulo || "",
    subtitulo: benefit.subtitulo || "",
    icone: benefit.icone || "truck",
    imagem: benefit.imagem || "",
    ordem: Number(benefit.ordem || 1),
    ativo: benefit.ativo !== false,
  }));
  renderBenefits();
}

function benefitIconOptions(selected = "truck") {
  return LUCIDE_BENEFIT_ICONS.map((icon) => `<option value="${icon}" ${icon === selected ? "selected" : ""}>${icon}</option>`).join("");
}

function benefitEditorRow(benefit = {}, index = 0) {
  const rowId = `benefit-${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`;
  const icon = benefit.icone || "truck";
  return `
    <article class="benefit-editor-row" data-benefit-row-id="${rowId}">
      <label>
        Ícone Lucide
        <select name="icone">${benefitIconOptions(icon)}</select>
      </label>
      <label>
        Ordem
        <input type="number" name="ordem" min="1" max="6" step="1" value="${Number(benefit.ordem || index + 1)}" />
      </label>
      <label class="edit-check">
        <input type="checkbox" name="ativo" ${benefit.ativo === false ? "" : "checked"} />
        Ativo
      </label>
      <label class="wide">
        Título
        <input type="text" name="titulo" value="${escapeHtml(benefit.titulo)}" />
      </label>
      <label class="wide">
        Subtítulo
        <input type="text" name="subtitulo" value="${escapeHtml(benefit.subtitulo)}" />
      </label>
      <label class="wide">
        Imagem alternativa (URL)
        <input type="url" name="imagem" value="${escapeHtml(benefit.imagem)}" placeholder="https://..." />
      </label>
      <label class="wide file-picker">
        Upload de imagem PNG, SVG ou WEBP
        <input type="file" accept="image/png,image/svg+xml,image/webp" data-benefit-image-file />
      </label>
      <div class="product-image-preview wide benefit-image-preview" data-benefit-image-preview>
        <span class="${benefit.imagem ? "hidden" : ""}" data-benefit-image-preview-empty>Nenhuma imagem selecionada</span>
        <img class="${benefit.imagem ? "" : "hidden"}" src="${escapeHtml(benefit.imagem)}" alt="Prévia do benefício" data-benefit-image-preview-img />
      </div>
      <div class="edit-actions wide image-actions benefit-row-actions">
        <button class="btn ghost" type="button" data-benefit-up>↑</button>
        <button class="btn ghost" type="button" data-benefit-down>↓</button>
        <button class="btn ghost" type="button" data-duplicate-benefit>Duplicar</button>
        <button class="btn ghost" type="button" data-remove-benefit-image>Remover imagem</button>
        <button class="btn ghost" type="button" data-remove-benefit>Excluir</button>
      </div>
    </article>
  `;
}

function openBenefitEditor() {
  if (!state.editMode || !benefitEditorForm || !benefitEditorList) return;
  if (benefitEditorError) benefitEditorError.textContent = "";
  state.selectedBenefitImageFiles.clear();
  state.removedBenefitImages.clear();
  benefitEditorList.innerHTML = state.benefits.length
    ? state.benefits.slice(0, 6).map(benefitEditorRow).join("")
    : benefitEditorRow({ titulo: "", subtitulo: "", icone: "truck", ativo: true, ordem: 1 }, 0);
  openEditorModal(benefitEditor);
}

function getBenefitRowId(row) {
  return row?.dataset.benefitRowId || "";
}

function updateBenefitImagePreview(row, value) {
  updateImagePreview(
    row?.querySelector("[data-benefit-image-preview]"),
    row?.querySelector("[data-benefit-image-preview-empty]"),
    row?.querySelector("[data-benefit-image-preview-img]"),
    value
  );
}

async function resolveBenefitImageUrl(row) {
  const rowId = getBenefitRowId(row);
  if (state.removedBenefitImages.has(rowId)) return "";
  const file = state.selectedBenefitImageFiles.get(rowId);
  if (file) return uploadBenefitImageFile(file, benefitEditorError);
  return row.querySelector('[name="imagem"]').value.trim();
}

function renumberBenefitRows() {
  benefitEditorList?.querySelectorAll(".benefit-editor-row").forEach((row, index) => {
    const input = row.querySelector('[name="ordem"]');
    if (input) input.value = String(index + 1);
  });
}

function moveBenefitRow(row, direction) {
  if (!row || !benefitEditorList) return;
  const sibling = direction < 0 ? row.previousElementSibling : row.nextElementSibling;
  if (!sibling) return;
  if (direction < 0) benefitEditorList.insertBefore(row, sibling);
  else benefitEditorList.insertBefore(sibling, row);
  renumberBenefitRows();
}

async function saveBenefits(event) {
  event.preventDefault();
  if (!state.editMode) return;

  if (!supabaseClient) {
    if (benefitEditorError) benefitEditorError.textContent = "Configure o Supabase para salvar beneficios.";
    return;
  }

  if (!(await getAuthenticatedUser(benefitEditorError, "Faça login para editar beneficios."))) return;

  const previousText = benefitSaveButton?.textContent || "";
  if (benefitSaveButton) {
    benefitSaveButton.disabled = true;
    benefitSaveButton.textContent = "Salvando...";
  }

  try {
    const rows = [...benefitEditorList.querySelectorAll(".benefit-editor-row")].slice(0, 6);
    const benefits = [];
    for (const [index, row] of rows.entries()) {
      const imagem = await resolveBenefitImageUrl(row);
      const benefit = {
        titulo: row.querySelector('[name="titulo"]').value.trim(),
        subtitulo: row.querySelector('[name="subtitulo"]').value.trim(),
        icone: row.querySelector('[name="icone"]').value.trim() || "truck",
        imagem,
        ordem: Number(row.querySelector('[name="ordem"]').value || index + 1),
        ativo: row.querySelector('[name="ativo"]')?.checked !== false,
      };
      if (benefit.titulo || benefit.subtitulo || benefit.imagem) benefits.push(benefit);
    }

    const { error: deleteError } = await supabaseClient.from(BENEFITS_TABLE_NAME).delete().neq("id", 0);
    if (deleteError) throw deleteError;

    if (benefits.length) {
      const { error: insertError } = await supabaseClient.from(BENEFITS_TABLE_NAME).insert(benefits);
      if (insertError) throw insertError;
    }

    state.selectedBenefitImageFiles.clear();
    state.removedBenefitImages.clear();
    await loadBenefits();
    closeEditorModal(benefitEditor);
    showToast("Benefício salvo com sucesso.");
  } catch (error) {
    if (benefitEditorError) benefitEditorError.textContent = error.message || "Erro ao salvar beneficios.";
  } finally {
    if (benefitSaveButton) {
      benefitSaveButton.disabled = false;
      benefitSaveButton.textContent = previousText;
    }
  }
}

function bannerEditorRow(banner = {}, index = 0) {
  const rowId = `banner-${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`;
  return `
    <article class="banner-editor-row" data-banner-row-id="${rowId}">
      <label class="wide">
        Imagem do banner (URL)
        <input type="url" name="imagem" value="${escapeHtml(banner.imagem)}" placeholder="https://..." />
      </label>
      <label class="wide file-picker">
        Escolher imagem da galeria
        <input type="file" accept="image/jpeg,image/png,image/webp" data-banner-image-file />
      </label>
      <label class="wide file-picker">
        Usar camera do celular
        <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" data-banner-image-file />
      </label>
      <div class="product-image-preview wide banner-image-preview" data-banner-image-preview>
        <span class="${banner.imagem ? "hidden" : ""}" data-banner-image-preview-empty>Nenhuma imagem selecionada</span>
        <img class="${banner.imagem ? "" : "hidden"}" src="${escapeHtml(banner.imagem)}" alt="Previa do banner" data-banner-image-preview-img />
      </div>
      <div class="edit-actions wide image-actions">
        <button class="btn ghost" type="button" data-remove-banner-image>Remover imagem</button>
      </div>
      <label>
        Título
        <input type="text" name="titulo" value="${escapeHtml(banner.titulo)}" />
      </label>
      <label>
        Subtítulo
        <input type="text" name="subtitulo" value="${escapeHtml(banner.subtitulo)}" />
      </label>
      <label>
        Link opcional
        <input type="url" name="link" value="${escapeHtml(banner.link)}" placeholder="https://..." />
      </label>
      <label>
        Ordem
        <input type="number" name="ordem" min="1" step="1" value="${Number(banner.ordem || index + 1)}" />
      </label>
      <label class="edit-check">
        <input type="checkbox" name="ativo" ${banner.ativo === false ? "" : "checked"} />
        Ativo
      </label>
      <button class="remove-banner-button" type="button" data-remove-banner>Excluir</button>
    </article>
  `;
}

function openBannerEditor() {
  if (!state.editMode || !bannerEditorForm || !bannerEditorList) return;
  if (bannerEditorError) bannerEditorError.textContent = "";
  bannerEditorForm.elements.enabled.checked = state.bannerCarousel.enabled;
  bannerEditorForm.elements.interval.value = state.bannerCarousel.interval || 5;
  state.selectedBannerImageFiles.clear();
  state.removedBannerImages.clear();
  bannerEditorList.innerHTML = state.bannerCarousel.banners.length
    ? state.bannerCarousel.banners.map(bannerEditorRow).join("")
    : bannerEditorRow({}, 0);
  openEditorModal(bannerEditor);
}

async function saveBanners(event) {
  event.preventDefault();
  if (!state.editMode) return;

  if (!supabaseClient) {
    if (bannerEditorError) bannerEditorError.textContent = "Configure o Supabase para salvar banners.";
    return;
  }

  if (!(await getAuthenticatedUser(bannerEditorError, "Faça login para editar banners."))) return;

  const submitButton = bannerEditorForm.querySelector('button[type="submit"]');
  const previousText = submitButton?.textContent || "";
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Salvando...";
  }

  try {
    const rows = [...bannerEditorList.querySelectorAll(".banner-editor-row")];
    const banners = [];
    for (const [index, row] of rows.entries()) {
      const imagem = await resolveBannerImageUrl(row);
      const banner = {
        imagem,
        titulo: row.querySelector('[name="titulo"]').value.trim(),
        subtitulo: row.querySelector('[name="subtitulo"]').value.trim(),
        link: row.querySelector('[name="link"]').value.trim(),
        ordem: Number(row.querySelector('[name="ordem"]').value || index + 1),
        ativo: row.querySelector('[name="ativo"]')?.checked !== false,
      };
      if (banner.imagem || banner.titulo || banner.subtitulo) banners.push(banner);
    }

    state.bannerCarousel = {
      enabled: bannerEditorForm.elements.enabled.checked,
      interval: Math.max(2, Number(bannerEditorForm.elements.interval.value || 5)),
      banners,
    };

    const { error: configError } = await supabaseClient
      .from(CONFIG_TABLE_NAME)
      .upsert({ id: 1, carrossel_ativo: state.bannerCarousel.enabled, carrossel_intervalo: state.bannerCarousel.interval }, { onConflict: "id" });
    if (configError) throw configError;

    const { error: deleteError } = await supabaseClient.from(BANNER_TABLE_NAME).delete().neq("id", 0);
    if (deleteError) throw deleteError;

    if (state.bannerCarousel.banners.length) {
      const { error: insertError } = await supabaseClient.from(BANNER_TABLE_NAME).insert(
        state.bannerCarousel.banners.map((banner) => ({
          imagem: banner.imagem,
          titulo: banner.titulo,
          subtitulo: banner.subtitulo,
          link: banner.link,
          ordem: banner.ordem,
          ativo: banner.ativo,
        }))
      );
      if (insertError) throw insertError;
    }

    state.selectedBannerImageFiles.clear();
    state.removedBannerImages.clear();
    await loadBannerConfig();
    renderHomeBannerCarousel();
    closeEditorModal(bannerEditor);
    showToast("Carrossel de banners salvo");
  } catch (error) {
    if (bannerEditorError) bannerEditorError.textContent = error.message || "Erro ao salvar banners.";
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = previousText;
    }
  }
}

function productImage(product, large = false, priority = false) {
  if (product.imagem) {
    const loading = priority ? "eager" : "lazy";
    const fetchPriority = priority ? ' fetchpriority="high"' : "";
    return `<img class="product-image" src="${escapeHtml(product.imagem)}" alt="${escapeHtml(product.nome)}" loading="${loading}" decoding="async"${fetchPriority} />`;
  }

  const color = product.categoryId.includes("mesa") ? "#111111" : "#2d7d46";
  const accent = "#111111";
  if (product.categoryId.includes("mesa")) {
    return `
      <svg class="product-visual" viewBox="0 0 260 220" aria-hidden="true">
        <path d="M34 82h192c10 0 18 8 18 18v18H16v-18c0-10 8-18 18-18Z" fill="${color}" />
        <path d="M44 118h24v78H44zM192 118h24v78h-24z" fill="#2d7d46" />
        <ellipse cx="130" cy="202" rx="${large ? 86 : 72}" ry="10" fill="rgba(0,0,0,.08)" />
      </svg>
    `;
  }

  return `
    <svg class="product-visual" viewBox="0 0 260 220" aria-hidden="true">
      <path d="M88 26h84c22 0 38 19 34 41l-13 80H67L54 67c-4-22 12-41 34-41Z" fill="${color}" />
      <path d="M66 145h128c10 0 18 8 18 18v10H48v-10c0-10 8-18 18-18Z" fill="${color}" />
      <path d="M102 172h56v18h-56z" fill="${accent}" opacity=".8" />
      <path d="M130 190v18M94 210h72M75 210h110" stroke="${accent}" stroke-width="11" stroke-linecap="round" />
      <ellipse cx="130" cy="214" rx="${large ? 70 : 56}" ry="8" fill="rgba(0,0,0,.08)" />
    </svg>
  `;
}

function productCard(product, index = 0) {
  return `
    <article class="product-card">
      ${
        state.editMode
          ? `<div class="edit-card-actions">
              <button type="button" data-edit-product="${product.id}" aria-label="Editar ${escapeHtml(product.nome)}">Editar</button>
              <button type="button" data-duplicate-product="${product.id}" aria-label="Duplicar ${escapeHtml(product.nome)}">Duplicar produto</button>
            </div>`
          : ""
      }
      <div class="product-photo">${productImage(product, false, index < 4)}</div>
      <span class="category">${escapeHtml(product.categoria)}</span>
      <h3>${escapeHtml(product.nome)}</h3>
      <div class="price-block">
        <strong class="normal-price">${currency.format(product.preco)}</strong>
      </div>
      <button class="btn primary view-button" type="button" data-view-product="${product.id}">Ver Produto</button>
    </article>
  `;
}

function renderSettings() {
  document.querySelectorAll(".brand-text strong, [data-footer-brand]").forEach((item) => {
    item.textContent = settings.brandTitle;
  });

  document.querySelectorAll(".brand-text small, .site-footer p").forEach((item) => {
    item.textContent = settings.brandSubtitle;
  });

  if (brandLogoImage) {
    brandLogoImage.src = settings.logoUrl || "./assets/fumacinha-logo.png";
  }

  if (configBanner && configBannerImage && homeText) {
    const hasBanner = Boolean(settings.bannerImage);
    const hasHomeText = Boolean(settings.homeText);
    configBanner.classList.toggle("hidden", !hasBanner && !hasHomeText);
    configBannerImage.classList.toggle("hidden", !hasBanner);
    configBannerImage.src = hasBanner ? settings.bannerImage : "";
    homeText.classList.toggle("hidden", !hasHomeText);
    homeText.textContent = settings.homeText;
  }

  setupWhatsAppDirectLinks();
}

function mapSiteConfig(row) {
  if (!row) return;
  Object.assign(settings, {
    brandTitle: row.titulo_principal || settings.brandTitle,
    brandSubtitle: row.subtitulo || settings.brandSubtitle,
    logoUrl: row.logo_url || "",
    bannerImage: row.banners || "",
    homeText: row.textos_pagina_inicial || "",
    whatsapp: row.whatsapp || settings.whatsapp,
    deliveryInfo: row.entrega || settings.deliveryInfo,
  });
  state.bannerCarousel.enabled = Boolean(row.carrossel_ativo);
  state.bannerCarousel.interval = Number(row.carrossel_intervalo || state.bannerCarousel.interval || 5);
}

function getSiteConfigPayload() {
  return {
    id: 1,
    titulo_principal: settings.brandTitle,
    subtitulo: settings.brandSubtitle,
    logo_url: settings.logoUrl,
    banners: settings.bannerImage,
    textos_pagina_inicial: settings.homeText,
    whatsapp: settings.whatsapp,
    entrega: settings.deliveryInfo,
    carrossel_ativo: state.bannerCarousel.enabled,
    carrossel_intervalo: state.bannerCarousel.interval,
  };
}

async function loadSiteConfig() {
  if (!supabaseClient) {
    renderSettings();
    return;
  }

  const { data, error } = await supabaseClient.from(CONFIG_TABLE_NAME).select("*").eq("id", 1).maybeSingle();

  if (error) {
    console.warn(`Configure a tabela ${CONFIG_TABLE_NAME} no Supabase para salvar textos do site.`, error.message);
    renderSettings();
    return;
  }

  mapSiteConfig(data);
  renderSettings();
  renderHomeBannerCarousel();
}

function renderCategories() {
  const categories = state.categories.filter((category) => category.ativo_home);
  categoryRail.innerHTML = categories
    .map(
      (category) => `
        <a class="category-button ${category.id === state.activeCategory ? "active" : ""}" href="#cat-${category.id}" data-category-scroll="${category.id}">
          <span class="category-circle">
            ${
              category.imagem
                ? `<img class="category-image" src="${category.imagem}" alt="${escapeHtml(category.name)}" />`
                : `<svg viewBox="0 0 24 24" aria-hidden="true">${category.icon}</svg>`
            }
          </span>
          <span>${escapeHtml(category.name)}</span>
        </a>
      `
    )
    .join("");
}

function renderProductsByCategory() {
  const visibleProducts = state.editMode ? getAdminFilteredProducts() : getVisibleProducts();
  const featuredProducts = state.editMode ? [] : getFeaturedProducts();
  const visibleCategories = state.activeCategory
    ? state.categories.filter((category) => category.id === state.activeCategory)
    : state.search.trim() || (state.editMode && state.adminProducts.query.trim())
      ? state.categories
      : getHomeCategories();

  if (!visibleProducts.length && !featuredProducts.length) {
    renderAdminProductPanel();
    showLoadMessage(state.products.length ? "Nenhum produto encontrado para essa busca." : "Nenhum produto cadastrado no Supabase ainda.");
    return;
  }

  const featuredSection = featuredProducts.length
    ? `
        <section class="product-category featured-products" id="mais-procurados">
          <div class="product-category-heading">
            <p class="eyebrow">Destaques</p>
            <h3>Mais Procurados da Fumacinha</h3>
          </div>
          <div class="products-grid">${featuredProducts.map(productCard).join("")}</div>
        </section>
      `
    : "";

  const categorySections = visibleCategories
    .map((category) => {
      const categoryProducts = state.search.trim() && !state.editMode ? getCategorySearchProducts(category) : visibleProducts.filter((product) => product.categoryId === category.id);
      if (!categoryProducts.length) return "";
      return `
        <section class="product-category" id="cat-${category.id}">
          <div class="product-category-heading">
            <h3>${escapeHtml(category.name)}</h3>
          </div>
          <div class="products-grid">${categoryProducts.map(productCard).join("")}</div>
        </section>
      `;
    })
    .join("");

  productRoot.innerHTML = `${featuredSection}${categorySections}`;
  renderAdminProductPanel();
}

function showHome(scroll = true) {
  state.activeCategory = "";
  document.body.classList.remove("product-view");
  document.querySelectorAll("[data-view='home']").forEach((item) => item.classList.remove("hidden"));
  productPage.classList.add("hidden");
  renderProductsByCategory();
  if (scroll) document.querySelector("#inicio").scrollIntoView({ behavior: "smooth" });
}

function showProduct(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  state.productQuantity = 1;
  document.body.classList.add("product-view");
  document.querySelectorAll("[data-view='home']").forEach((item) => item.classList.add("hidden"));
  productPage.classList.remove("hidden");

  const related = state.products
    .filter((item) => item.id !== product.id && item.categoryId === product.categoryId && item.ativo && item.estoque > 0)
    .slice(0, 3);

  productPage.innerHTML = `
    <button class="btn back-link" type="button" data-home-link>Voltar para a página inicial</button>
    <section class="product-detail">
      <div class="detail-photo">${productImage(product, true, true)}</div>
      <div class="product-info">
        <span class="category">${product.categoria}</span>
        <h1>${product.nome}</h1>
        <span class="availability">Disponivel</span>
        <div class="price-block detail-prices">
          <strong class="normal-price large">${currency.format(product.preco)}</strong>
        </div>
        <div>
          <p class="eyebrow">Quantidade</p>
          <div class="quantity-box">
            <button class="qty-button" type="button" data-product-qty="-1">-</button>
            <strong data-product-qty-value>1</strong>
            <button class="qty-button" type="button" data-product-qty="1">+</button>
          </div>
        </div>
        <button class="btn primary" type="button" data-add-product="${product.id}">Adicionar ao Carrinho</button>
        <p class="product-description">${getProductDescription(product)}</p>
      </div>
    </section>
    ${
      related.length
        ? `<section class="related"><h2>Produtos relacionados</h2><div class="products-grid">${related.map(productCard).join("")}</div></section>`
        : ""
    }
  `;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setProductQuantity(change) {
  state.productQuantity = Math.max(1, state.productQuantity + change);
  const qty = document.querySelector("[data-product-qty-value]");
  if (qty) qty.textContent = state.productQuantity;
}

function addToCart(productId, quantity = 1) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  const current = state.cart.get(productId);
  state.cart.set(productId, {
    product,
    quantity: current ? current.quantity + quantity : quantity,
  });

  renderCart();
  animateCartCounter(quantity);
  showCartToast(product);
}

function updateCartQuantity(productId, change) {
  const item = state.cart.get(productId);
  if (!item) return;

  const quantity = item.quantity + change;
  if (quantity <= 0) state.cart.delete(productId);
  else state.cart.set(productId, { ...item, quantity });

  renderCart();
}

function removeFromCart(productId) {
  state.cart.delete(productId);
  renderCart();
}

function getCartSummary() {
  const items = [...state.cart.values()];
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const normalTotal = items.reduce((sum, item) => sum + item.product.preco * item.quantity, 0);
  return { items, count, normalTotal };
}

function buildWhatsAppSendUrl(text) {
  return `https://api.whatsapp.com/send?phone=${settings.whatsapp}&text=${encodeURIComponent(text)}`;
}

function buildWhatsAppProductLines(items) {
  return items.flatMap((item, index) => {
    const lines = [
      index > 0 ? "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501" : "",
      "",
      `*${item.product.nome}*`,
      "",
      `\u2022 Valor da unidade: ${currency.format(item.product.preco)}`,
      "",
      `\u2022 Quantidade: ${item.quantity}`,
    ];

    lines.push("");
    return lines;
  });
}

function syncCartWithProducts() {
  if (!state.cart.size) {
    renderCart();
    return;
  }

  const productsById = new Map(state.products.map((product) => [product.id, product]));
  state.cart.forEach((item, productId) => {
    const currentProduct = productsById.get(productId);
    if (!currentProduct || !currentProduct.ativo || currentProduct.estoque <= 0) {
      state.cart.delete(productId);
      return;
    }

    item.product = currentProduct;
    item.quantity = Math.max(1, Math.min(item.quantity, currentProduct.estoque));
  });
  renderCart();
}

function buildWhatsAppUrl() {
  const { items, normalTotal } = getCartSummary();
  const lines = [
    "Pedido:",
    "",
    ...items.flatMap((item) => [
      `- ${item.product.nome}`,
      `- Quantidade: ${item.quantity}`,
      `- Valor unitário: ${currency.format(item.product.preco)}`,
      "",
    ]),
    `Total: ${currency.format(normalTotal)} + Taxa de entrega: A combinar`,
  ];

  return `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function buildConfirmedWhatsAppUrl(customer = {}) {
  const { items, normalTotal } = getCartSummary();
  const productLines = items.flatMap((item) => [
    `- ${item.product.nome}`,
    `- Quantidade: ${item.quantity}`,
    `- Valor unitário: ${currency.format(item.product.preco)}`,
    "",
  ]);
  const lines = [
    `Nome: ${customer.nome}`,
    `Bairro: ${customer.bairro}`,
    "",
    "Pedido:",
    ...productLines,
    `Total: ${currency.format(normalTotal)} + Taxa de entrega: A combinar`,
  ];

  return buildWhatsAppSendUrl(lines.join("\n"));
}

function buildConfirmedWhatsAppUrlWithImages(customer = {}) {
  const { items, normalTotal } = getCartSummary();
  const lines = [
    "\uD83D\uDCE6 *Pedido Fumacinha*",
    "",
    "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
    "",
    ...buildWhatsAppProductLines(items),
    "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
    "",
    "\uD83D\uDC64 *Cliente:*",
    customer.nome,
    "",
    "\uD83D\uDCCD *Bairro:*",
    customer.bairro,
    "",
    "\uD83D\uDCB0 *Valor do Pedido:*",
    currency.format(normalTotal),
    "",
    "\uD83D\uDE9A *Entrega:*",
    "Taxa a combinar",
  ];

  return buildWhatsAppSendUrl(lines.join("\n"));
}

function renderCart() {
  const { items, count, normalTotal } = getCartSummary();

  cartCount.textContent = count;
  cartUnits.textContent = `Quantidade de produtos: ${count}`;
  cartNormalTotal.textContent = currency.format(normalTotal);
  cartEmpty.classList.toggle("hidden", items.length > 0);
  cartFooter.classList.toggle("hidden", items.length === 0);

  cartItems.innerHTML = items
    .map(
      (item) => `
        <article class="cart-row">
          <div class="cart-thumb">${productImage(item.product)}</div>
          <div class="cart-row-info">
            <span class="cart-label">Nome:</span>
            <h3>${item.product.nome}</h3>
            <span class="cart-label">Preço unitário:</span>
            <span>${currency.format(item.product.preco)} cada</span>
            <div class="cart-controls">
              <button class="qty-button" type="button" data-cart-qty="${item.product.id}" data-change="-1">-</button>
              <strong>${item.quantity}</strong>
              <button class="qty-button" type="button" data-cart-qty="${item.product.id}" data-change="1">+</button>
              <button class="remove-button" type="button" data-remove="${item.product.id}">Remover</button>
            </div>
          </div>
        </article>
      `
    )
    .join("");

  if (items.length) {
    checkout.classList.remove("disabled");
    checkout.setAttribute("aria-disabled", "false");
  } else {
    checkout.classList.add("disabled");
    checkout.setAttribute("aria-disabled", "true");
  }
}

function animateCartCounter(quantity = 1) {
  if (!cartTrigger || !cartCount) return;

  cartTrigger.classList.remove("cart-bump");
  cartCount.classList.remove("count-pop");
  void cartTrigger.offsetWidth;
  cartTrigger.classList.add("cart-bump");
  cartCount.classList.add("count-pop");

  const plus = document.createElement("span");
  plus.className = "cart-plus-one";
  plus.textContent = `+${quantity}`;
  cartTrigger.appendChild(plus);

  window.setTimeout(() => plus.remove(), 900);
  window.setTimeout(() => {
    cartTrigger.classList.remove("cart-bump");
    cartCount.classList.remove("count-pop");
  }, 700);
}

function openCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}

function renderOrderSummary() {
  if (!orderSummary) return;
  const { count, normalTotal } = getCartSummary();
  orderSummary.innerHTML = `
    <h3>Resumo do pedido</h3>
    <div class="order-summary-line"><span>Quantidade de produtos</span><strong>${count}</strong></div>
    <div class="order-total-delivery"><span><strong>Total:</strong> ${currency.format(normalTotal)}</span><span>Taxa de entrega: A combinar</span></div>
  `;
}

function openOrderConfirmation() {
  const { items } = getCartSummary();
  if (!items.length || !orderConfirmation) return;
  renderOrderSummary();
  if (orderError) orderError.textContent = "";
  setOrderSubmitState(false);
  closeCart();
  orderConfirmation.classList.remove("hidden");
  orderConfirmation.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  orderConfirmationForm?.elements.nome?.focus();
}

function closeOrderConfirmation() {
  orderConfirmation?.classList.add("hidden");
  orderConfirmation?.setAttribute("aria-hidden", "true");
  if (orderError) orderError.textContent = "";
  orderConfirmationForm?.querySelectorAll(".field-invalid").forEach((field) => field.classList.remove("field-invalid"));
  setOrderSubmitState(false);
  document.body.classList.remove("no-scroll");
}

function setOrderSubmitState(isSubmitting) {
  if (!orderConfirmationForm) return;
  const submitButton = orderConfirmationForm.querySelector('button[type="submit"]');
  orderConfirmationForm.dataset.submitting = isSubmitting ? "true" : "false";

  if (submitButton) {
    submitButton.dataset.defaultHtml = submitButton.dataset.defaultHtml || submitButton.innerHTML;
    submitButton.disabled = isSubmitting;
    submitButton.setAttribute("aria-busy", isSubmitting ? "true" : "false");
    submitButton.innerHTML = isSubmitting ? "Abrindo WhatsApp..." : submitButton.dataset.defaultHtml;
  }
}

function openPolicyModal(policyKey) {
  const policy = policies[policyKey];
  if (!policy || !policyModal || !policyTitle || !policyContent) return;

  policyTitle.textContent = policy.title;
  policyContent.innerHTML = policy.html;
  policyModal.classList.remove("hidden");
  policyModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
}

function closePolicyModal() {
  policyModal?.classList.add("hidden");
  policyModal?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}

function showToast(message, title = "Fumacinha") {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<strong>${title}</strong><span>${message}</span>`;
  toastRegion.appendChild(toast);
  window.setTimeout(() => toast.classList.add("show"), 20);
  window.setTimeout(() => {
    toast.classList.remove("show");
    window.setTimeout(() => toast.remove(), 250);
  }, 2600);
}

function setSalesStatus(message = "", type = "loading") {
  if (!salesStatus) return;
  salesStatus.textContent = message;
  salesStatus.classList.remove("success", "error", "loading");
  salesStatus.classList.toggle("hidden", !message);
  if (message) salesStatus.classList.add(type);
}

function showCartToast(product) {
  const toast = document.createElement("div");
  toast.className = "toast cart-toast";
  toast.innerHTML = `
    <div class="cart-toast-thumb">${productImage(product)}</div>
    <div class="cart-toast-body">
      <div class="cart-toast-status">
        <span class="cart-toast-check" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="m6 12 4 4 8-8" /></svg>
        </span>
        <strong>Produto adicionado ao carrinho</strong>
      </div>
      <span class="cart-toast-name">${escapeHtml(product.nome)}</span>
      <span class="cart-toast-price">${currency.format(product.preco)}</span>
      <button class="cart-toast-button" type="button" data-toast-cart>Ver Carrinho</button>
    </div>
    <span class="toast-progress" aria-hidden="true"></span>
  `;

  toastRegion.appendChild(toast);
  window.setTimeout(() => toast.classList.add("show"), 20);
  window.setTimeout(() => {
    toast.classList.remove("show");
    window.setTimeout(() => toast.remove(), 260);
  }, 2000);
}

function openLogin() {
  editLogin?.classList.remove("hidden");
  editLogin?.setAttribute("aria-hidden", "false");
  editLoginForm?.elements.email?.focus();
}

function closeLogin() {
  editLogin?.classList.add("hidden");
  editLogin?.setAttribute("aria-hidden", "true");
  if (editLoginError) editLoginError.textContent = "";
}

function hasSecretAdminAccess() {
  const params = new URLSearchParams(window.location.search);
  return params.get(ADMIN_ACCESS_PARAM) === ADMIN_ACCESS_SECRET;
}

function clearSecretAdminAccess() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(ADMIN_ACCESS_PARAM)) return;

  url.searchParams.delete(ADMIN_ACCESS_PARAM);
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, document.title, nextUrl);
}

async function handleSecretAdminAccess() {
  if (!hasSecretAdminAccess()) return;

  if (!supabaseClient) {
    openLogin();
    if (editLoginError) editLoginError.textContent = "Configure o Supabase para fazer login.";
    return;
  }

  const { data, error } = await supabaseClient.auth.getSession();
  if (!error && data.session?.user) {
    enableEditMode();
    clearSecretAdminAccess();
    return;
  }

  openLogin();
}

function isTypingShortcutTarget(target) {
  const field = target?.closest?.("input, textarea, select, [contenteditable='true']");
  return Boolean(field);
}

async function openEditAccess() {
  if (!supabaseClient) {
    openLogin();
    if (editLoginError) editLoginError.textContent = "Configure o Supabase para fazer login.";
    return;
  }

  const { data, error } = await supabaseClient.auth.getSession();
  if (!error && data.session?.user) {
    enableEditMode();
    return;
  }

  openLogin();
}

function openEditorModal(modal) {
  closeAdminMobileMenu();
  modal?.classList.remove("hidden");
  modal?.setAttribute("aria-hidden", "false");
}

function closeEditorModal(modal) {
  if (modal === productEditor) setProductLoading(false);
  modal?.classList.add("hidden");
  modal?.setAttribute("aria-hidden", "true");
}

function openAdminMobileMenu() {
  if (!state.editMode) return;
  adminMobileMenu?.classList.remove("hidden");
  adminMobileMenu?.setAttribute("aria-hidden", "false");
  adminMobileTrigger?.setAttribute("aria-expanded", "true");
}

function closeAdminMobileMenu() {
  adminMobileMenu?.classList.add("hidden");
  adminMobileMenu?.setAttribute("aria-hidden", "true");
  adminMobileTrigger?.setAttribute("aria-expanded", "false");
}

function toggleAdminMobileMenu() {
  if (adminMobileMenu?.classList.contains("hidden")) openAdminMobileMenu();
  else closeAdminMobileMenu();
}

function openLowStockPanel() {
  if (!state.editMode || !adminProductPanel) return;
  closeAdminMobileMenu();
  adminProductPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function getAuthenticatedUser(errorElement, message = "Faça login para editar produtos.") {
  if (!supabaseClient) {
    if (errorElement) errorElement.textContent = "Configure o Supabase para salvar alterações.";
    console.error("[Fumacinha Supabase] Cliente Supabase não configurado.");
    return null;
  }

  const { data, error } = await supabaseClient.auth.getSession();
  console.log("[Fumacinha Supabase] Sessão atual:", data.session);
  if (error) {
    if (errorElement) errorElement.textContent = error.message;
    console.error("[Fumacinha Supabase] Erro ao buscar sessão:", error);
    return null;
  }

  const user = data.session?.user;
  if (!user) {
    if (errorElement) errorElement.textContent = message;
    if (message.includes("estoque") || message.includes("vendas") || message.includes("financeiro")) setSalesStatus(message, "error");
    return null;
  }

  return user;
}

function enableEditMode() {
  state.editMode = true;
  document.body.classList.add("edit-mode");
  editToolbar?.classList.remove("hidden");
  adminMobileTrigger?.classList.remove("hidden");
  closeAdminMobileMenu();
  closeLogin();
  renderProductsByCategory();
  showToast("Modo edição habilitado");
}

function disableEditMode() {
  state.editMode = false;
  document.body.classList.remove("edit-mode");
  editToolbar?.classList.add("hidden");
  adminMobileTrigger?.classList.add("hidden");
  closeAdminMobileMenu();
  closeEditorModal(productEditor);
  closeEditorModal(categoryEditor);
  closeEditorModal(bannerEditor);
  closeEditorModal(benefitEditor);
  closeEditorModal(siteEditor);
  closeLogin();
  renderProductsByCategory();
  supabaseClient?.auth.signOut();
}

function openSalesLogin() {
  salesLogin?.classList.remove("hidden");
  salesLogin?.setAttribute("aria-hidden", "false");
  salesLoginForm?.elements.email?.focus();
}

function closeSalesLogin() {
  salesLogin?.classList.add("hidden");
  salesLogin?.setAttribute("aria-hidden", "true");
  if (salesLoginError) salesLoginError.textContent = "";
}

async function enableSalesMode() {
  if (!(await getAuthenticatedUser(salesLoginError || saleError, "Faça login para alterar estoque e registrar vendas."))) return;
  if (!state.editMode) enableEditMode();
  state.salesMode = true;
  closeSalesLogin();
  openEditorModal(salesPanel);
  await loadSales();
  renderSalesPanel();
  showToast("Área de vendas habilitada");
}

async function openSalesAccess() {
  const user = await getAuthenticatedUser(null);
  if (user) {
    await enableSalesMode();
    return;
  }

  openSalesLogin();
}

function disableSalesMode() {
  state.salesMode = false;
  closeEditorModal(salesPanel);
  closeSalesLogin();
}

function getFormField(form, fieldName) {
  const field = form?.elements?.[fieldName];
  if (!field) {
    const message = `Campo "${fieldName}" não encontrado no formulário.`;
    console.error("[Fumacinha Form]", message);
    return null;
  }
  return field;
}

function getFormValue(form, fieldName) {
  return getFormField(form, fieldName)?.value ?? "";
}

function setFormValue(form, fieldName, value) {
  const field = getFormField(form, fieldName);
  if (field) field.value = value;
}

function getFormChecked(form, fieldName) {
  return Boolean(getFormField(form, fieldName)?.checked);
}

function setFormChecked(form, fieldName, value) {
  const field = getFormField(form, fieldName);
  if (field) field.checked = Boolean(value);
}

function setProductLoading(isLoading, label = "Salvando...") {
  if (!productSaveButton || !productEditorForm) return;
  productSaveButton.disabled = isLoading;
  productSaveButton.textContent = isLoading ? label : "Salvar produto";
  productEditorForm.querySelectorAll("button, input, textarea, select").forEach((field) => {
    if (field === productSaveButton) return;
    field.disabled = isLoading;
  });
}

function updateProductImagePreview(source = "") {
  const value = source || getFormValue(productEditorForm, "imagem");
  const hasImage = Boolean(value);
  productImagePreview?.classList.toggle("has-image", hasImage);
  productImagePreviewEmpty?.classList.toggle("hidden", hasImage);
  productImagePreviewImage?.classList.toggle("hidden", !hasImage);
  if (productImagePreviewImage) productImagePreviewImage.src = hasImage ? value : "";
}

function clearSelectedProductImage() {
  state.selectedProductImageFile = null;
  state.removeProductImage = true;
  if (productImageFileInput) productImageFileInput.value = "";
  setFormValue(productEditorForm, "imagem", "");
  if (productUploadStatus) productUploadStatus.textContent = "";
  updateProductImagePreview("");
}

function validateProductImageFile(file) {
  if (!file) return "";
  if (!PRODUCT_IMAGE_TYPES.includes(file.type)) return "Use imagens JPG, JPEG, PNG ou WEBP.";
  if (file.size > MAX_PRODUCT_IMAGE_SIZE) return "A imagem deve ter no maximo 5 MB.";
  return "";
}

function validateBenefitImageFile(file) {
  if (!file) return "";
  if (!["image/png", "image/svg+xml", "image/webp"].includes(file.type)) return "Use imagens PNG, SVG ou WEBP.";
  if (file.size > MAX_PRODUCT_IMAGE_SIZE) return "A imagem deve ter no maximo 5 MB.";
  return "";
}

function uniqueProductImagePath(file) {
  const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const safeExtension = extension === "jpeg" ? "jpg" : extension;
  const random = Math.random().toString(36).slice(2);
  return `produtos/${Date.now()}-${random}.${safeExtension || "jpg"}`;
}

function uniqueStorageImagePath(file, folder = "produtos") {
  const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const safeExtension = extension === "jpeg" ? "jpg" : extension;
  const random = Math.random().toString(36).slice(2);
  return `${folder}/${Date.now()}-${random}.${safeExtension || "jpg"}`;
}

async function uploadImageFileToStorage(file, folder, statusElement) {
  const validation = validateProductImageFile(file);
  if (validation) throw new Error(validation);
  if (!supabaseClient) throw new Error("Configure o Supabase para enviar imagens.");

  if (statusElement) statusElement.textContent = "Enviando imagem...";
  const path = uniqueStorageImagePath(file, folder);
  const { error } = await supabaseClient.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = supabaseClient.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl || "";
}

async function uploadBenefitImageFile(file, statusElement) {
  const validation = validateBenefitImageFile(file);
  if (validation) throw new Error(validation);
  if (!supabaseClient) throw new Error("Configure o Supabase para enviar imagens.");

  if (statusElement) statusElement.textContent = "Enviando imagem...";
  const path = uniqueStorageImagePath(file, "beneficios");
  const { error } = await supabaseClient.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = supabaseClient.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl || "";
}

function updateImagePreview(preview, emptyElement, imageElement, value) {
  const hasImage = Boolean(value);
  preview?.classList.toggle("has-image", hasImage);
  emptyElement?.classList.toggle("hidden", hasImage);
  imageElement?.classList.toggle("hidden", !hasImage);
  if (imageElement) imageElement.src = hasImage ? value : "";
}

async function uploadSelectedProductImage() {
  const file = state.selectedProductImageFile;
  if (!file) return getFormValue(productEditorForm, "imagem").trim();

  const validation = validateProductImageFile(file);
  if (validation) throw new Error(validation);
  if (!supabaseClient) throw new Error("Configure o Supabase para enviar imagens.");

  if (productUploadStatus) productUploadStatus.textContent = "Enviando imagem...";
  const path = uniqueProductImagePath(file);
  const { error } = await supabaseClient.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = supabaseClient.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl || "";
}

function updateSiteLogoPreview(value) {
  updateImagePreview(siteLogoPreview, siteLogoPreviewEmpty, siteLogoPreviewImage, value);
}

function clearSelectedSiteLogo() {
  state.selectedSiteLogoFile = null;
  state.removeSiteLogo = true;
  siteLogoFileInputs.forEach((input) => (input.value = ""));
  setFormValue(siteEditorForm, "logoUrl", "");
  if (siteLogoUploadStatus) siteLogoUploadStatus.textContent = "";
  updateSiteLogoPreview("");
}

async function resolveSiteLogoUrl() {
  if (state.removeSiteLogo) return "";
  if (state.selectedSiteLogoFile) return uploadImageFileToStorage(state.selectedSiteLogoFile, "logo", siteLogoUploadStatus);
  return getFormValue(siteEditorForm, "logoUrl").trim();
}

function getBannerRowId(row) {
  return row?.dataset.bannerRowId || "";
}

function updateBannerImagePreview(row, value) {
  updateImagePreview(
    row?.querySelector("[data-banner-image-preview]"),
    row?.querySelector("[data-banner-image-preview-empty]"),
    row?.querySelector("[data-banner-image-preview-img]"),
    value
  );
}

async function resolveBannerImageUrl(row) {
  const rowId = getBannerRowId(row);
  if (state.removedBannerImages.has(rowId)) return "";
  const file = state.selectedBannerImageFiles.get(rowId);
  if (file) return uploadImageFileToStorage(file, "banners", bannerEditorError);
  return row.querySelector('[name="imagem"]').value.trim();
}

function duplicateProduct(product) {
  if (!product) return;
  const copy = {
    ...product,
    id: "",
    nome: `${product.nome} - copia`,
  };
  openProductEditor(copy, "duplicate");
}

function openProductEditor(product = null, mode = product?.id ? "edit" : "create") {
  if (!state.editMode || !productEditorForm) return;
  state.productEditorMode = mode;
  state.selectedProductImageFile = null;
  state.removeProductImage = false;
  productEditorForm.reset();
  if (productEditorError) productEditorError.textContent = "";
  if (productUploadStatus) productUploadStatus.textContent = "";
  if (productImageFileInput) productImageFileInput.value = "";
  productEditorTitle.textContent = mode === "duplicate" ? "Duplicar produto" : product?.id ? "Editar produto" : "Novo produto";
  const requiredFields = ["id", "nome", "categoria", "preco", "estoque", "ativo", "destaque_home", "ocultar_home", "imagem", "descricao"];
  const missingFields = requiredFields.filter((field) => !productEditorForm.elements[field]);
  if (missingFields.length) {
    const message = `Campos ausentes no formulário de produto: ${missingFields.join(", ")}.`;
    if (productEditorError) productEditorError.textContent = message;
    console.error("[Fumacinha Produtos]", message);
    return;
  }
  setFormValue(productEditorForm, "id", mode === "duplicate" ? "" : product?.id || "");
  setFormValue(productEditorForm, "nome", product?.nome || "");
  setFormValue(productEditorForm, "categoria", product?.categoria || "");
  setFormValue(productEditorForm, "preco", product?.preco || "");
  setFormValue(productEditorForm, "estoque", product?.estoque ?? 0);
  setFormValue(productEditorForm, "descricao", product?.descricao || "");
  setFormChecked(productEditorForm, "ativo", product ? product.ativo : true);
  setFormChecked(productEditorForm, "destaque_home", product ? product.destaque_home : false);
  setFormChecked(productEditorForm, "ocultar_home", product ? product.ocultar_home : false);
  setFormValue(productEditorForm, "imagem", product?.imagem || "");
  updateProductImagePreview(product?.imagem || "");
  setProductLoading(false);
  document.querySelector("[data-delete-product]")?.classList.toggle("hidden", !product?.id || mode === "duplicate");
  openEditorModal(productEditor);
}

function openSiteEditor() {
  if (!state.editMode || !siteEditorForm) return;
  state.selectedSiteLogoFile = null;
  state.removeSiteLogo = false;
  siteEditorForm.elements.brandTitle.value = settings.brandTitle;
  siteEditorForm.elements.brandSubtitle.value = settings.brandSubtitle;
  siteEditorForm.elements.logoUrl.value = settings.logoUrl || "";
  siteEditorForm.elements.bannerImage.value = settings.bannerImage || "";
  siteEditorForm.elements.homeText.value = settings.homeText || "";
  siteEditorForm.elements.whatsapp.value = settings.whatsapp || "";
  siteEditorForm.elements.deliveryInfo.value = settings.deliveryInfo || "";
  siteLogoFileInputs.forEach((input) => (input.value = ""));
  if (siteLogoUploadStatus) siteLogoUploadStatus.textContent = "";
  updateSiteLogoPreview(settings.logoUrl || "");
  if (siteEditorError) siteEditorError.textContent = "";
  openEditorModal(siteEditor);
}

function openCategoryEditor() {
  if (!state.editMode || !categoryEditorList) return;
  if (categoryEditorError) categoryEditorError.textContent = "";
  categoryEditorList.innerHTML = state.categories
    .map(
      (category) => `
        <article class="category-editor-row">
          <input type="hidden" name="dbId" value="${escapeHtml(category.dbId)}" />
          <input type="hidden" name="oldName" value="${escapeHtml(category.oldName || category.name)}" />
          <label>
            Nome
            <input type="text" name="nome" value="${escapeHtml(category.name)}" required />
          </label>
          <label>
            Imagem/icone (URL)
            <input type="url" name="imagem" value="${escapeHtml(category.imagem)}" placeholder="https://..." />
          </label>
          <label>
            Ordem
            <input type="number" name="ordem" min="1" step="1" value="${category.ordem}" />
          </label>
          <label class="edit-check">
            <input type="checkbox" name="ativo_home" ${category.ativo_home ? "checked" : ""} />
            Aparece na pagina inicial
          </label>
        </article>
      `
    )
    .join("");
  openEditorModal(categoryEditor);
}

function getProductPayload(form) {
  const price = Number(getFormValue(form, "preco") || 0);
  const stock = Number(getFormValue(form, "estoque") || 0);
  return {
    nome: getFormValue(form, "nome").trim(),
    categoria: getFormValue(form, "categoria").trim(),
    preco: price,
    pix: price,
    estoque: stock,
    ativo: getFormChecked(form, "ativo") && stock > 0,
    destaque_home: getFormChecked(form, "destaque_home"),
    ocultar_home: getFormChecked(form, "ocultar_home"),
    descricao: getFormValue(form, "descricao").trim(),
    imagem: getFormValue(form, "imagem").trim(),
  };
}

async function saveProductWithFallback(existingId, payload) {
  const result = existingId
    ? await supabaseClient.from(TABLE_NAME).update(payload).eq("id", existingId)
    : await supabaseClient.from(TABLE_NAME).insert(payload);

  if (result.error?.message?.includes("descricao")) {
    const fallbackPayload = { ...payload };
    delete fallbackPayload.descricao;
    return existingId
      ? supabaseClient.from(TABLE_NAME).update(fallbackPayload).eq("id", existingId)
      : supabaseClient.from(TABLE_NAME).insert(fallbackPayload);
  }

  return result;
}

async function saveProduct(event) {
  event.preventDefault();
  if (!state.editMode) return;

  const form = event.currentTarget;
  const existingId = getFormValue(form, "id");
  const payload = getProductPayload(form);
  if (productEditorError) productEditorError.textContent = "";

  if (!supabaseClient) {
    if (productEditorError) productEditorError.textContent = "Configure o Supabase para salvar produtos.";
    return;
  }

  if (!(await getAuthenticatedUser(productEditorError, "Faça login para editar produtos."))) return;

  try {
    setProductLoading(true, state.selectedProductImageFile ? "Enviando..." : "Salvando...");
    payload.imagem = state.removeProductImage ? "" : await uploadSelectedProductImage();
    const { error } = await saveProductWithFallback(existingId, payload);
    if (error) {
      if (productEditorError) productEditorError.textContent = error.message;
      console.error("[Fumacinha Produtos] Erro ao salvar produto:", error);
      return;
    }

    closeEditorModal(productEditor);
    await loadProducts({ force: true, showLoading: false });
    const successMessage = existingId
      ? "Produto atualizado com sucesso."
      : state.productEditorMode === "duplicate"
        ? "Produto duplicado com sucesso."
        : "Produto salvo com sucesso.";
    showToast(successMessage);
  } catch (error) {
    if (productEditorError) productEditorError.textContent = error.message || "Erro ao salvar produto.";
    console.error("[Fumacinha Produtos] Erro completo ao salvar:", error);
  } finally {
    setProductLoading(false);
    if (productUploadStatus) productUploadStatus.textContent = "";
  }
}

async function deleteCurrentProduct() {
  const id = getFormValue(productEditorForm, "id");
  if (!state.editMode || !id) return;

  if (!supabaseClient) {
    if (productEditorError) productEditorError.textContent = "Configure o Supabase para excluir produtos.";
    return;
  }

  if (!(await getAuthenticatedUser(productEditorError, "Faça login para editar produtos."))) return;

  setProductLoading(true, "Excluindo...");
  const { error } = await supabaseClient.from(TABLE_NAME).delete().eq("id", id);
  if (error) {
    setProductLoading(false);
    if (productEditorError) productEditorError.textContent = error.message;
    return;
  }

  closeEditorModal(productEditor);
  await loadProducts({ force: true, showLoading: false });
  showToast("Produto excluído com sucesso.");
  setProductLoading(false);
}

function saleDateValue(sale) {
  return sale.data_venda || sale.created_at || new Date().toISOString();
}

function localDateKey(value, size = 10) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return size === 7 ? `${year}-${month}` : `${year}-${month}-${day}`;
}

async function loadSales() {
  if (!state.salesMode) return;
  if (!supabaseClient) {
    state.sales = [];
    if (saleError) saleError.textContent = "Configure o Supabase para carregar vendas.";
    return;
  }

  if (!(await getAuthenticatedUser(saleError, "Faça login para ver o financeiro."))) {
    state.sales = [];
    return;
  }

  const { data, error } = await supabaseClient
    .from(SALES_TABLE_NAME)
    .select("id,produto_id,nome_produto,quantidade,valor_unitario,valor_total,custo_unitario,custo_total,data_venda,created_at")
    .order("data_venda", { ascending: false });

  if (error) {
    state.sales = [];
    if (saleError) saleError.textContent = error.message;
    console.error("[Fumacinha Vendas] Erro completo ao carregar histórico:", error);
    return;
  }

  state.sales = data || [];
}

function startOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value = new Date()) {
  const date = startOfDay(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function addDays(value, days) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function startOfWeek(value = new Date()) {
  const date = startOfDay(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(date, diff);
}

function startOfMonth(value = new Date()) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function startOfYear(value = new Date()) {
  return new Date(value.getFullYear(), 0, 1);
}

function getPeriodRange(filter = state.financeFilter) {
  const now = new Date();
  if (filter === "yesterday") {
    const yesterday = addDays(now, -1);
    return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
  }
  if (filter === "this-week") return { start: startOfWeek(now), end: now };
  if (filter === "last-week") {
    const start = addDays(startOfWeek(now), -7);
    return { start, end: endOfDay(addDays(start, 6)) };
  }
  if (filter === "this-month") return { start: startOfMonth(now), end: now };
  if (filter === "last-month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { start, end: endOfDay(new Date(now.getFullYear(), now.getMonth(), 0)) };
  }
  if (filter === "this-year") return { start: startOfYear(now), end: now };
  if (filter === "custom") {
    const start = financeStart?.value ? startOfDay(new Date(`${financeStart.value}T00:00:00`)) : startOfDay(now);
    const end = financeEnd?.value ? endOfDay(new Date(`${financeEnd.value}T00:00:00`)) : endOfDay(now);
    return { start, end };
  }
  return { start: startOfDay(now), end: endOfDay(now) };
}

function getSalesInRange(start, end) {
  return state.sales.filter((sale) => {
    const date = new Date(saleDateValue(sale));
    return date >= start && date <= end;
  });
}

function saleProfit(sale) {
  return Number(sale.valor_total || 0) - Number(sale.custo_total || 0);
}

function summarizeSales(sales) {
  const total = sales.reduce((sum, sale) => sum + Number(sale.valor_total || 0), 0);
  const products = sales.reduce((sum, sale) => sum + Number(sale.quantidade || 0), 0);
  const profit = sales.reduce((sum, sale) => sum + saleProfit(sale), 0);
  return {
    total,
    count: sales.length,
    products,
    profit,
    ticket: sales.length ? total / sales.length : 0,
  };
}

function renderFinanceCards() {
  const now = new Date();
  const day = summarizeSales(getSalesInRange(startOfDay(now), endOfDay(now)));
  const week = summarizeSales(getSalesInRange(startOfWeek(now), now));
  const month = summarizeSales(getSalesInRange(startOfMonth(now), now));
  const year = summarizeSales(getSalesInRange(startOfYear(now), now));

  if (salesDayTotal) salesDayTotal.textContent = currency.format(day.total);
  if (salesWeekTotal) salesWeekTotal.textContent = currency.format(week.total);
  if (salesMonthTotal) salesMonthTotal.textContent = currency.format(month.total);
  if (salesYearTotal) salesYearTotal.textContent = currency.format(year.total);
  if (ticketDay) ticketDay.textContent = currency.format(day.ticket);
  if (ticketWeek) ticketWeek.textContent = currency.format(week.ticket);
  if (ticketMonth) ticketMonth.textContent = currency.format(month.ticket);
  if (ticketYear) ticketYear.textContent = currency.format(year.ticket);
}

function renderFilteredFinance() {
  const { start, end } = getPeriodRange();
  const summary = summarizeSales(getSalesInRange(start, end));
  if (filterTotal) filterTotal.textContent = currency.format(summary.total);
  if (filterCount) filterCount.textContent = String(summary.count);
  if (filterTicket) filterTicket.textContent = currency.format(summary.ticket);
  if (filterProfit) filterProfit.textContent = currency.format(summary.profit);
  if (filterProducts) filterProducts.textContent = String(summary.products);
}

function groupKey(date, mode) {
  if (mode === "year") return String(date.getFullYear());
  if (mode === "month") return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  if (mode === "week") return `${date.getFullYear()}-S${String(Math.ceil(((date - startOfYear(date)) / 86400000 + startOfYear(date).getDay() + 1) / 7)).padStart(2, "0")}`;
  return localDateKey(date);
}

function groupedSales(mode, sales = state.sales) {
  return sales.reduce((groups, sale) => {
    const key = groupKey(new Date(saleDateValue(sale)), mode);
    groups[key] = groups[key] || [];
    groups[key].push(sale);
    return groups;
  }, {});
}

function renderChart(root, mode) {
  if (!root) return;
  const entries = Object.entries(groupedSales(mode)).slice(-12);
  const totals = entries.map(([, sales]) => summarizeSales(sales).total);
  const max = Math.max(...totals, 1);
  root.innerHTML = entries.length
    ? entries
        .map(([key, sales]) => {
          const total = summarizeSales(sales).total;
          return `<div class="chart-row"><span>${key}</span><div><i style="width:${Math.max(6, (total / max) * 100)}%"></i></div><strong>${currency.format(total)}</strong></div>`;
        })
        .join("")
    : `<p class="edit-help">Sem vendas no período.</p>`;
}

function renderRanking(root, start, end) {
  if (!root) return;
  const rank = getSalesInRange(start, end).reduce((items, sale) => {
    const key = sale.nome_produto;
    items[key] = items[key] || { name: key, quantity: 0, total: 0 };
    items[key].quantity += Number(sale.quantidade || 0);
    items[key].total += Number(sale.valor_total || 0);
    return items;
  }, {});
  const rows = Object.values(rank).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  root.innerHTML = rows.length
    ? rows.map((item) => `<article class="ranking-row"><strong>${escapeHtml(item.name)}</strong><span>${item.quantity} un - ${currency.format(item.total)}</span></article>`).join("")
    : `<p class="edit-help">Sem vendas.</p>`;
}

function renderHistory() {
  if (!salesHistory) return;
  const groups = groupedSales(state.historyGroup);
  const entries = Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  salesHistory.innerHTML = entries.length
    ? entries
        .map(([key, sales]) => {
          const summary = summarizeSales(sales);
          const rows = sales
            .map((sale) => `<div class="history-sale"><span>${escapeHtml(sale.nome_produto)}</span><small>${sale.quantidade} un - ${currency.format(Number(sale.valor_total || 0))}</small><button type="button" data-cancel-sale="${sale.id}">Cancelar</button></div>`)
            .join("");
          return `<article class="history-group"><h4>${key}</h4><p>${summary.count} vendas - ${currency.format(summary.total)}</p>${rows}</article>`;
        })
        .join("")
    : `<p class="edit-help">Nenhuma venda registrada ainda.</p>`;
}

function renderFinanceReports() {
  renderFinanceCards();
  renderFilteredFinance();
  renderChart(chartDay, "day");
  renderChart(chartWeek, "week");
  renderChart(chartMonth, "month");
  const now = new Date();
  renderRanking(rankingDay, startOfDay(now), endOfDay(now));
  renderRanking(rankingWeek, startOfWeek(now), now);
  renderRanking(rankingMonth, startOfMonth(now), now);
  renderRanking(rankingYear, startOfYear(now), now);
  renderHistory();
}

function renderSalesPanel() {
  if (!state.salesMode) return;

  if (saleProductSelect) {
    saleProductSelect.innerHTML = state.products
      .map((product) => `<option value="${product.id}">${escapeHtml(product.nome)} - estoque ${product.estoque}</option>`)
      .join("");
    const selectedProduct = state.products.find((product) => product.id === saleProductSelect.value);
    if (selectedProduct && saleForm && !saleForm.elements.valor_unitario.value) {
      saleForm.elements.valor_unitario.value = selectedProduct.preco.toFixed(2);
    }
  }

  if (stockList) {
    stockList.innerHTML = state.products.length
      ? state.products
          .map(
            (product) => `
              <article class="stock-row">
                <div>
                  <strong>${escapeHtml(product.nome)}</strong>
                  <span>${escapeHtml(product.categoria)} - ${product.ativo && product.estoque > 0 ? "visivel" : "oculto"}</span>
                </div>
                <label>
                  Estoque
                  <input type="number" min="0" step="1" value="${product.estoque}" data-stock-input="${product.id}" />
                </label>
                <button type="button" data-save-stock="${product.id}">Salvar</button>
              </article>
            `
          )
          .join("")
      : `<p class="edit-help">Nenhum produto cadastrado.</p>`;
  }

  customPeriod?.classList.toggle("hidden", state.financeFilter !== "custom");
  document.querySelectorAll("[data-finance-filter]").forEach((button) => button.classList.toggle("active", button.dataset.financeFilter === state.financeFilter));
  document.querySelectorAll("[data-history-group]").forEach((button) => button.classList.toggle("active", button.dataset.historyGroup === state.historyGroup));
  renderFinanceReports();
}

async function updateStock(productId, nextStock) {
  if (!state.salesMode && !state.editMode) return;
  const stock = Math.max(0, Number(nextStock || 0));
  const product = state.products.find((item) => String(item.id) === String(productId));
  setSalesStatus("Salvando estoque...", "loading");

  if (!supabaseClient) {
    if (saleError) saleError.textContent = "Configure o Supabase para atualizar estoque.";
    setSalesStatus("Configure o Supabase para atualizar estoque.", "error");
    return;
  }

  const user = await getAuthenticatedUser(saleError, "Faça login para alterar estoque e registrar vendas.");
  if (!user) return;

  console.log("[Fumacinha Estoque] Sessão autenticada:", user);
  console.log("[Fumacinha Estoque] Produto selecionado:", product);
  console.log("[Fumacinha Estoque] Atualizando estoque:", { productId, estoque: stock, ativo: stock > 0 });

  const { error } = await supabaseClient.from(TABLE_NAME).update({ estoque: stock, ativo: stock > 0 }).eq("id", productId);
  if (error) {
    if (saleError) saleError.textContent = error.message;
    setSalesStatus(error.message, "error");
    console.error("[Fumacinha Estoque] Erro completo do Supabase:", error);
    return;
  }

  if (saleError) saleError.textContent = "";
  await loadProducts({ force: true, showLoading: false });
  await loadSales();
  renderSalesPanel();
  setSalesStatus(stock === 0 ? "Estoque salvo com sucesso. Produto oculto do site." : "Estoque salvo com sucesso.", "success");
  showToast("Estoque salvo com sucesso.");
}

async function registerManualSale(event) {
  event.preventDefault();
  if (!state.salesMode) return;
  setSalesStatus("Registrando venda...", "loading");

  const form = event.currentTarget;
  const productId = form.elements.produto_id.value;
  const product = state.products.find((item) => item.id === productId);
  const quantity = Number(form.elements.quantidade.value || 0);
  const unitValue = Number(form.elements.valor_unitario.value || 0);
  const costValue = Number(form.elements.custo_unitario?.value || 0);

  if (!product || quantity <= 0 || unitValue <= 0) {
    if (saleError) saleError.textContent = "Preencha produto, quantidade e valor.";
    setSalesStatus("Preencha produto, quantidade e valor.", "error");
    return;
  }

  if (!supabaseClient) {
    if (saleError) saleError.textContent = "Configure o Supabase para registrar vendas.";
    setSalesStatus("Configure o Supabase para registrar vendas.", "error");
    return;
  }

  const user = await getAuthenticatedUser(saleError, "Faça login para alterar estoque e registrar vendas.");
  if (!user) return;

  if (quantity > product.estoque) {
    if (saleError) saleError.textContent = "Quantidade maior que o estoque disponivel.";
    setSalesStatus("Quantidade maior que o estoque disponível.", "error");
    return;
  }

  const newStock = product.estoque - quantity;
  const salePayload = {
    produto_id: product.id,
    nome_produto: product.nome,
    quantidade: quantity,
    valor_unitario: unitValue,
    valor_total: unitValue * quantity,
    custo_unitario: costValue,
    custo_total: costValue * quantity,
    data_venda: new Date().toISOString(),
  };

  console.log("[Fumacinha Vendas] Sessão autenticada:", user);
  console.log("[Fumacinha Vendas] Produto selecionado:", product);
  console.log("[Fumacinha Vendas] Dados da venda:", salePayload);

  const { data: insertedSale, error: saleInsertError } = await supabaseClient.from(SALES_TABLE_NAME).insert(salePayload).select("*").single();
  if (saleInsertError) {
    if (saleError) saleError.textContent = saleInsertError.message;
    setSalesStatus(saleInsertError.message, "error");
    console.error("[Fumacinha Vendas] Erro completo ao inserir em VENDAS:", saleInsertError);
    return;
  }
  console.log("[Fumacinha Vendas] Venda inserida:", insertedSale);

  const { error: stockError } = await supabaseClient.from(TABLE_NAME).update({ estoque: newStock, ativo: newStock > 0 }).eq("id", product.id);
  if (stockError) {
    if (saleError) saleError.textContent = stockError.message;
    setSalesStatus(stockError.message, "error");
    console.error("[Fumacinha Vendas] Erro completo ao atualizar estoque:", stockError);
    return;
  }

  if (saleError) saleError.textContent = "";
  form.reset();
  form.elements.quantidade.value = 1;
  await loadProducts({ force: true, showLoading: false });
  await loadSales();
  renderSalesPanel();
  setSalesStatus("Venda registrada com sucesso.", "success");
  showToast("Venda registrada com sucesso.");
}

async function cancelSale(saleId) {
  if (!state.salesMode) return;
  const sale = state.sales.find((item) => String(item.id) === String(saleId));
  if (!sale) return;
  if (!window.confirm("Tem certeza que deseja cancelar esta venda?")) return;
  setSalesStatus("Cancelando venda...", "loading");

  if (!supabaseClient) {
    if (saleError) saleError.textContent = "Configure o Supabase para cancelar vendas.";
    setSalesStatus("Configure o Supabase para cancelar vendas.", "error");
    return;
  }

  const user = await getAuthenticatedUser(saleError, "Faça login para alterar estoque e registrar vendas.");
  if (!user) return;
  console.log("[Fumacinha Vendas] Sessão autenticada:", user);
  console.log("[Fumacinha Vendas] Venda selecionada para cancelamento:", sale);

  const product = state.products.find((item) => item.id === String(sale.produto_id));
  const restoredStock = Number(product?.estoque || 0) + Number(sale.quantidade || 0);

  if (product) {
    const { error: stockError } = await supabaseClient.from(TABLE_NAME).update({ estoque: restoredStock, ativo: restoredStock > 0 }).eq("id", product.id);
    if (stockError) {
      if (saleError) saleError.textContent = stockError.message;
      setSalesStatus(stockError.message, "error");
      console.error("[Fumacinha Vendas] Erro completo ao restaurar estoque:", stockError);
      return;
    }
  }

  const { error: deleteError } = await supabaseClient.from(SALES_TABLE_NAME).delete().eq("id", saleId);
  if (deleteError) {
    if (saleError) saleError.textContent = deleteError.message;
    setSalesStatus(deleteError.message, "error");
    console.error("[Fumacinha Vendas] Erro completo ao excluir venda:", deleteError);
    return;
  }

  await loadProducts({ force: true, showLoading: false });
  await loadSales();
  renderSalesPanel();
  setSalesStatus("Venda cancelada e estoque devolvido.", "success");
  showToast("Venda cancelada e estoque devolvido.");
}

async function saveSiteContent(event) {
  event.preventDefault();
  if (!state.editMode) return;

  const form = event.currentTarget;
  if (!supabaseClient) {
    if (siteEditorError) siteEditorError.textContent = "Configure o Supabase para salvar configuracoes.";
    return;
  }

  if (!(await getAuthenticatedUser(siteEditorError, "Faça login para editar configurações."))) return;

  const submitButton = form.querySelector('button[type="submit"]');
  const previousText = submitButton?.textContent || "";
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = state.selectedSiteLogoFile ? "Enviando..." : "Salvando...";
  }

  try {
    const logoUrl = await resolveSiteLogoUrl();
    Object.assign(settings, {
      brandTitle: form.elements.brandTitle.value.trim() || settings.brandTitle,
      brandSubtitle: form.elements.brandSubtitle.value.trim() || settings.brandSubtitle,
      logoUrl,
      bannerImage: form.elements.bannerImage.value.trim(),
      homeText: form.elements.homeText.value.trim(),
      whatsapp: form.elements.whatsapp.value.replace(/\D/g, "") || settings.whatsapp,
      deliveryInfo: form.elements.deliveryInfo.value.trim() || settings.deliveryInfo,
    });

    const { error } = await supabaseClient.from(CONFIG_TABLE_NAME).upsert(getSiteConfigPayload(), { onConflict: "id" });
    if (error) throw error;

    state.selectedSiteLogoFile = null;
    state.removeSiteLogo = false;
    renderSettings();
    closeEditorModal(siteEditor);
    showToast("Configuracoes salvas");
  } catch (error) {
    if (siteEditorError) siteEditorError.textContent = error.message || "Erro ao salvar configuracoes.";
  } finally {
    if (siteLogoUploadStatus) siteLogoUploadStatus.textContent = "";
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = previousText;
    }
  }
}


async function saveCategories(event) {
  event.preventDefault();
  if (!state.editMode) return;

  const rows = [...categoryEditorList.querySelectorAll(".category-editor-row")];

  if (!supabaseClient) {
    if (categoryEditorError) categoryEditorError.textContent = "Configure o Supabase para salvar categorias.";
    return;
  }

  if (!(await getAuthenticatedUser(categoryEditorError, "Faça login para editar categorias."))) return;

  for (const row of rows) {
    const dbId = row.querySelector('[name="dbId"]').value;
    const oldName = row.querySelector('[name="oldName"]').value;
    const nome = row.querySelector('[name="nome"]').value.trim();
    const imagem = row.querySelector('[name="imagem"]').value.trim();
    const ordem = Number(row.querySelector('[name="ordem"]').value || 1);
    const ativo_home = row.querySelector('[name="ativo_home"]').checked;

    if (!nome) continue;

    const payload = { nome, imagem, ordem, ativo_home };
    const request = dbId
      ? supabaseClient.from(CATEGORY_TABLE_NAME).update(payload).eq("id", dbId)
      : supabaseClient.from(CATEGORY_TABLE_NAME).insert(payload);
    const { error } = await request;

    if (error) {
      if (categoryEditorError) categoryEditorError.textContent = error.message;
      return;
    }

    if (oldName && oldName !== nome) {
      const { error: productError } = await supabaseClient.from(TABLE_NAME).update({ categoria: nome }).eq("categoria", oldName);
      if (productError) {
        if (categoryEditorError) categoryEditorError.textContent = productError.message;
        return;
      }
    }
  }

  closeEditorModal(categoryEditor);
  await loadProducts({ force: true, showLoading: false });
  showToast("Categorias atualizadas");
}

function setupWhatsAppDirectLinks() {
  const text = "Ol\u00e1, Fumacinha! Queria tirar uma d\u00favida.";
  const url = `https://api.whatsapp.com/send/?phone=${settings.whatsapp}&text=${encodeURIComponent(text)}`;
  document.querySelectorAll("[data-whatsapp-direct]").forEach((link) => {
    link.href = url;
  });
}

document.addEventListener("click", (event) => {
  const editProductButton = event.target.closest("[data-edit-product]");
  if (editProductButton) {
    event.preventDefault();
    event.stopPropagation();
    const product = state.products.find((item) => item.id === editProductButton.dataset.editProduct);
    openProductEditor(product);
    return;
  }

  const duplicateProductButton = event.target.closest("[data-duplicate-product]");
  if (duplicateProductButton) {
    event.preventDefault();
    event.stopPropagation();
    const product = state.products.find((item) => item.id === duplicateProductButton.dataset.duplicateProduct);
    duplicateProduct(product);
    return;
  }

  const categoryLink = event.target.closest("[data-category-scroll]");
  if (categoryLink) {
    event.preventDefault();
    state.activeCategory = categoryLink.dataset.categoryScroll;
    renderCategories();
    renderProductsByCategory();
    document.querySelector(`#cat-${categoryLink.dataset.categoryScroll}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const viewProductButton = event.target.closest("[data-view-product]");
  if (viewProductButton) showProduct(viewProductButton.dataset.viewProduct);

  const productQtyButton = event.target.closest("[data-product-qty]");
  if (productQtyButton) setProductQuantity(Number(productQtyButton.dataset.productQty));

  const addProductButton = event.target.closest("[data-add-product]");
  if (addProductButton) addToCart(addProductButton.dataset.addProduct, state.productQuantity);

  const cartQtyButton = event.target.closest("[data-cart-qty]");
  if (cartQtyButton) updateCartQuantity(cartQtyButton.dataset.cartQty, Number(cartQtyButton.dataset.change));

  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) removeFromCart(removeButton.dataset.remove);

  if (event.target.closest("[data-open-cart]")) openCart();
  if (event.target.closest("[data-toast-cart]")) openCart();
  if (event.target.closest("[data-retry-products]")) loadProducts({ force: true });
  if (event.target.closest("[data-checkout]") && !checkout.classList.contains("disabled")) openOrderConfirmation();
  if (event.target.closest("[data-close-cart]")) closeCart();
  if (event.target === cartDrawer) closeCart();
  if (event.target.closest("[data-close-order-confirmation]")) closeOrderConfirmation();
  if (event.target === orderConfirmation) closeOrderConfirmation();
  if (event.target.closest("[data-home-link]")) showHome();
  if (event.target.closest("[data-close-edit-login]")) closeLogin();
  if (event.target === editLogin) closeLogin();
  if (event.target.closest("[data-admin-mobile-toggle]")) toggleAdminMobileMenu();
  if (event.target === adminMobileMenu) closeAdminMobileMenu();
  if (event.target.closest("[data-new-product]")) openProductEditor();
  if (event.target.closest("[data-open-category-editor]")) openCategoryEditor();
  if (event.target.closest("[data-open-banner-editor]")) openBannerEditor();
  if (event.target.closest("[data-open-benefit-editor]")) openBenefitEditor();
  if (event.target.closest("[data-open-site-editor]")) openSiteEditor();
  if (event.target.closest("[data-open-low-stock]")) openLowStockPanel();
  if (event.target.closest("[data-close-product-editor]")) closeEditorModal(productEditor);
  if (event.target === productEditor) closeEditorModal(productEditor);
  if (event.target.closest("[data-close-category-editor]")) closeEditorModal(categoryEditor);
  if (event.target === categoryEditor) closeEditorModal(categoryEditor);
  if (event.target.closest("[data-close-banner-editor]")) closeEditorModal(bannerEditor);
  if (event.target === bannerEditor) closeEditorModal(bannerEditor);
  if (event.target.closest("[data-close-benefit-editor]")) closeEditorModal(benefitEditor);
  if (event.target === benefitEditor) closeEditorModal(benefitEditor);
  if (event.target.closest("[data-add-banner]")) bannerEditorList?.insertAdjacentHTML("beforeend", bannerEditorRow({}, bannerEditorList.querySelectorAll(".banner-editor-row").length));
  if (event.target.closest("[data-remove-banner]")) {
    const row = event.target.closest(".banner-editor-row");
    const rowId = getBannerRowId(row);
    state.selectedBannerImageFiles.delete(rowId);
    state.removedBannerImages.delete(rowId);
    row?.remove();
  }
  if (event.target.closest("[data-remove-banner-image]")) {
    const row = event.target.closest(".banner-editor-row");
    const rowId = getBannerRowId(row);
    state.selectedBannerImageFiles.delete(rowId);
    state.removedBannerImages.add(rowId);
    row?.querySelectorAll("[data-banner-image-file]").forEach((input) => (input.value = ""));
    const urlInput = row?.querySelector('[name="imagem"]');
    if (urlInput) urlInput.value = "";
    updateBannerImagePreview(row, "");
  }
  if (event.target.closest("[data-close-site-editor]")) closeEditorModal(siteEditor);
  if (event.target === siteEditor) closeEditorModal(siteEditor);
  if (event.target.closest("[data-add-benefit]")) {
    if ((benefitEditorList?.querySelectorAll(".benefit-editor-row").length || 0) >= 6) {
      if (benefitEditorError) benefitEditorError.textContent = "Cadastre no maximo 6 beneficios.";
    } else {
      benefitEditorList?.insertAdjacentHTML("beforeend", benefitEditorRow({}, benefitEditorList.querySelectorAll(".benefit-editor-row").length));
      renumberBenefitRows();
    }
  }
  if (event.target.closest("[data-benefit-up]")) moveBenefitRow(event.target.closest(".benefit-editor-row"), -1);
  if (event.target.closest("[data-benefit-down]")) moveBenefitRow(event.target.closest(".benefit-editor-row"), 1);
  if (event.target.closest("[data-duplicate-benefit]")) {
    const row = event.target.closest(".benefit-editor-row");
    if ((benefitEditorList?.querySelectorAll(".benefit-editor-row").length || 0) >= 6) {
      if (benefitEditorError) benefitEditorError.textContent = "Cadastre no maximo 6 beneficios.";
    } else if (row) {
      const copy = {
        titulo: row.querySelector('[name="titulo"]').value.trim(),
        subtitulo: row.querySelector('[name="subtitulo"]').value.trim(),
        icone: row.querySelector('[name="icone"]').value.trim(),
        imagem: row.querySelector('[name="imagem"]').value.trim(),
        ativo: row.querySelector('[name="ativo"]')?.checked !== false,
        ordem: (benefitEditorList.querySelectorAll(".benefit-editor-row").length || 0) + 1,
      };
      benefitEditorList.insertAdjacentHTML("beforeend", benefitEditorRow(copy, copy.ordem - 1));
      renumberBenefitRows();
      if (benefitEditorError) benefitEditorError.textContent = "";
    }
  }
  if (event.target.closest("[data-remove-benefit]")) {
    const row = event.target.closest(".benefit-editor-row");
    const rowId = getBenefitRowId(row);
    state.selectedBenefitImageFiles.delete(rowId);
    state.removedBenefitImages.delete(rowId);
    row?.remove();
    renumberBenefitRows();
  }
  if (event.target.closest("[data-remove-benefit-image]")) {
    const row = event.target.closest(".benefit-editor-row");
    const rowId = getBenefitRowId(row);
    state.selectedBenefitImageFiles.delete(rowId);
    state.removedBenefitImages.add(rowId);
    row?.querySelectorAll("[data-benefit-image-file]").forEach((input) => (input.value = ""));
    const urlInput = row?.querySelector('[name="imagem"]');
    if (urlInput) urlInput.value = "";
    updateBenefitImagePreview(row, "");
  }
  if (event.target.closest("[data-delete-product]")) deleteCurrentProduct();
  if (event.target.closest("[data-remove-product-image]")) clearSelectedProductImage();
  if (event.target.closest("[data-remove-site-logo]")) clearSelectedSiteLogo();
  if (event.target.closest("[data-edit-logout]")) disableEditMode();
  if (event.target.closest("[data-close-sales-login]")) closeSalesLogin();
  if (event.target === salesLogin) closeSalesLogin();
  if (event.target.closest("[data-close-sales-panel]")) disableSalesMode();
  if (event.target === salesPanel) disableSalesMode();

  const saveStockButton = event.target.closest("[data-save-stock]");
  if (saveStockButton) {
    const input = document.querySelector(`[data-stock-input="${saveStockButton.dataset.saveStock}"]`);
    updateStock(saveStockButton.dataset.saveStock, input?.value);
  }

  const lowStockSaveButton = event.target.closest("[data-low-stock-save]");
  if (lowStockSaveButton) {
    const input = document.querySelector(`[data-low-stock-input="${lowStockSaveButton.dataset.lowStockSave}"]`);
    updateStock(lowStockSaveButton.dataset.lowStockSave, input?.value);
  }

  const cancelSaleButton = event.target.closest("[data-cancel-sale]");
  if (cancelSaleButton) cancelSale(cancelSaleButton.dataset.cancelSale);

  const financeFilterButton = event.target.closest("[data-finance-filter]");
  if (financeFilterButton) {
    state.financeFilter = financeFilterButton.dataset.financeFilter;
    renderSalesPanel();
  }

  const historyGroupButton = event.target.closest("[data-history-group]");
  if (historyGroupButton) {
    state.historyGroup = historyGroupButton.dataset.historyGroup;
    renderSalesPanel();
  }

  const policyButton = event.target.closest("[data-policy-open]");
  if (policyButton) openPolicyModal(policyButton.dataset.policyOpen);
  if (event.target.closest("[data-policy-close]")) closePolicyModal();
  if (event.target === policyModal) closePolicyModal();

  if (event.target.closest("[data-banner-prev]")) moveHomeBanner(-1);
  if (event.target.closest("[data-banner-next]")) moveHomeBanner(1);
  const bannerDot = event.target.closest("[data-banner-dot]");
  if (bannerDot) {
    state.bannerIndex = Number(bannerDot.dataset.bannerDot);
    updateHomeBannerPosition();
    startBannerAutoplay();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCart();
    closePolicyModal();
    closeOrderConfirmation();
  }
  if (isTypingShortcutTarget(event.target)) return;
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "e") {
    event.preventDefault();
    openEditAccess();
  }
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "v") {
    event.preventDefault();
    if (state.salesMode) {
      disableSalesMode();
      return;
    }
    openSalesAccess();
  }
});

editLoginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  if (editLoginError) editLoginError.textContent = "";

  if (!supabaseClient) {
    if (editLoginError) editLoginError.textContent = "Configure o Supabase para fazer login.";
    return;
  }

  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error || !data.session?.user) {
    editLoginError.textContent = error?.message || "Faça login para editar produtos.";
    return;
  }

  form.reset();
  enableEditMode();
  clearSecretAdminAccess();
});

orderConfirmationForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (form.dataset.submitting === "true") return;

  const customer = {
    nome: form.elements.nome.value.trim(),
    bairro: form.elements.bairro.value.trim(),
  };

  form.elements.nome.classList.toggle("field-invalid", !customer.nome);
  form.elements.bairro.classList.toggle("field-invalid", !customer.bairro);

  if (!customer.nome || !customer.bairro) {
    if (orderError) orderError.textContent = "Preencha os campos obrigatórios para continuar.";
    return;
  }

  if (orderError) orderError.textContent = "";
  const whatsappUrl = buildConfirmedWhatsAppUrlWithImages(customer);

  try {
    setOrderSubmitState(true);
    window.location.assign(whatsappUrl);
  } catch {
    setOrderSubmitState(false);
    if (orderError) orderError.textContent = "Não foi possível abrir o WhatsApp. Tente novamente.";
  }
});

window.addEventListener("pageshow", () => {
  setOrderSubmitState(false);
});

productEditorForm?.addEventListener("submit", saveProduct);
categoryEditorForm?.addEventListener("submit", saveCategories);
bannerEditorForm?.addEventListener("submit", saveBanners);
benefitEditorForm?.addEventListener("submit", saveBenefits);
siteEditorForm?.addEventListener("submit", saveSiteContent);
saleForm?.addEventListener("submit", registerManualSale);
salesLoginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  salesLoginError.textContent = "";

  if (!supabaseClient) {
    salesLoginError.textContent = "Configure o Supabase para fazer login.";
    return;
  }

  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error || !data.session?.user) {
    salesLoginError.textContent = error?.message || "Faça login para alterar estoque e registrar vendas.";
    return;
  }

  form.reset();
  await enableSalesMode();
});

saleProductSelect?.addEventListener("change", (event) => {
  const product = state.products.find((item) => item.id === event.target.value);
  if (product && saleForm) saleForm.elements.valor_unitario.value = product.preco.toFixed(2);
});

financeStart?.addEventListener("change", renderSalesPanel);
financeEnd?.addEventListener("change", renderSalesPanel);

productImageFileInput?.addEventListener("change", (event) => {
  const file = event.target.files?.[0] || null;
  const validation = validateProductImageFile(file);
  if (validation) {
    if (productEditorError) productEditorError.textContent = validation;
    event.target.value = "";
    state.selectedProductImageFile = null;
    return;
  }

  state.selectedProductImageFile = file;
  state.removeProductImage = false;
  if (productEditorError) productEditorError.textContent = "";
  if (productUploadStatus) productUploadStatus.textContent = file ? "Imagem selecionada. Ela sera enviada ao salvar." : "";
  if (file) updateProductImagePreview(URL.createObjectURL(file));
});

productEditorForm?.elements?.imagem?.addEventListener("input", (event) => {
  state.selectedProductImageFile = null;
  state.removeProductImage = false;
  if (productImageFileInput) productImageFileInput.value = "";
  updateProductImagePreview(event.target.value.trim());
});

siteEditorForm?.addEventListener("change", (event) => {
  const input = event.target.closest("[data-site-logo-file]");
  if (!input) return;

  const file = event.target.files?.[0] || null;
  const validation = validateProductImageFile(file);
  if (validation) {
    if (siteEditorError) siteEditorError.textContent = validation;
    input.value = "";
    state.selectedSiteLogoFile = null;
    return;
  }

  state.selectedSiteLogoFile = file;
  state.removeSiteLogo = false;
  siteLogoFileInputs.forEach((fileInput) => {
    if (fileInput !== input) fileInput.value = "";
  });
  if (siteEditorError) siteEditorError.textContent = "";
  if (siteLogoUploadStatus) siteLogoUploadStatus.textContent = file ? "Imagem selecionada. Ela sera enviada ao salvar." : "";
  if (file) updateSiteLogoPreview(URL.createObjectURL(file));
});

siteEditorForm?.elements?.logoUrl?.addEventListener("input", (event) => {
  state.selectedSiteLogoFile = null;
  state.removeSiteLogo = false;
  siteLogoFileInputs.forEach((input) => (input.value = ""));
  updateSiteLogoPreview(event.target.value.trim());
});

bannerEditorList?.addEventListener("change", (event) => {
  const input = event.target.closest("[data-banner-image-file]");
  if (!input) return;

  const row = input.closest(".banner-editor-row");
  const rowId = getBannerRowId(row);
  const file = input.files?.[0] || null;
  const validation = validateProductImageFile(file);
  if (validation) {
    if (bannerEditorError) bannerEditorError.textContent = validation;
    input.value = "";
    state.selectedBannerImageFiles.delete(rowId);
    return;
  }

  if (file) {
    row?.querySelectorAll("[data-banner-image-file]").forEach((fileInput) => {
      if (fileInput !== input) fileInput.value = "";
    });
    state.selectedBannerImageFiles.set(rowId, file);
    state.removedBannerImages.delete(rowId);
    if (bannerEditorError) bannerEditorError.textContent = "Imagem selecionada. Ela sera enviada ao salvar.";
    updateBannerImagePreview(row, URL.createObjectURL(file));
  }
});

bannerEditorList?.addEventListener("input", (event) => {
  const input = event.target.closest('[name="imagem"]');
  if (!input) return;

  const row = input.closest(".banner-editor-row");
  const rowId = getBannerRowId(row);
  state.selectedBannerImageFiles.delete(rowId);
  state.removedBannerImages.delete(rowId);
  row?.querySelectorAll("[data-banner-image-file]").forEach((input) => (input.value = ""));
  updateBannerImagePreview(row, input.value.trim());
});

benefitEditorList?.addEventListener("change", (event) => {
  const input = event.target.closest("[data-benefit-image-file]");
  if (!input) return;

  const row = input.closest(".benefit-editor-row");
  const rowId = getBenefitRowId(row);
  const file = input.files?.[0] || null;
  const validation = validateBenefitImageFile(file);
  if (validation) {
    if (benefitEditorError) benefitEditorError.textContent = validation;
    input.value = "";
    state.selectedBenefitImageFiles.delete(rowId);
    return;
  }

  if (file) {
    state.selectedBenefitImageFiles.set(rowId, file);
    state.removedBenefitImages.delete(rowId);
    if (benefitEditorError) benefitEditorError.textContent = "Imagem selecionada. Ela sera enviada ao salvar.";
    updateBenefitImagePreview(row, URL.createObjectURL(file));
  }
});

benefitEditorList?.addEventListener("input", (event) => {
  const input = event.target.closest('[name="imagem"]');
  if (!input) return;

  const row = input.closest(".benefit-editor-row");
  const rowId = getBenefitRowId(row);
  state.selectedBenefitImageFiles.delete(rowId);
  state.removedBenefitImages.delete(rowId);
  const fileInput = row?.querySelector("[data-benefit-image-file]");
  if (fileInput) fileInput.value = "";
  updateBenefitImagePreview(row, input.value.trim());
});

adminProductSearch?.addEventListener("input", (event) => {
  state.adminProducts.query = event.target.value;
  renderProductsByCategory();
});

adminProductSort?.addEventListener("change", (event) => {
  state.adminProducts.sort = event.target.value;
  renderProductsByCategory();
});

adminProductFilter?.addEventListener("change", (event) => {
  state.adminProducts.filter = event.target.value;
  renderProductsByCategory();
});

lowStockLimitInput?.addEventListener("input", (event) => {
  state.adminProducts.lowStockLimit = Math.max(1, Number(event.target.value || LOW_STOCK_DEFAULT_LIMIT));
  renderAdminProductPanel();
});

searchInput?.addEventListener("input", (event) => {
  state.search = event.target.value;
  state.activeCategory = "";
  renderProductsByCategory();
});

searchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  document.querySelector("#produtos")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

let benefitIndex = 0;

function moveBenefits(direction) {
  if (!benefitTrack) return;
  const total = benefitTrack.children.length;
  if (!total) return;
  benefitIndex = (benefitIndex + direction + total) % total;
  benefitTrack.style.transform = `translateX(-${benefitIndex * 100}%)`;
}

benefitPrev?.addEventListener("click", () => moveBenefits(-1));
benefitNext?.addEventListener("click", () => moveBenefits(1));
if (benefitTrack) window.setInterval(() => moveBenefits(1), 3600);

renderSettings();
renderCart();
setupWhatsAppDirectLinks();
renderProductSkeletons();
Promise.allSettled([loadProducts(), loadBannerConfig(), loadBenefits(), loadSiteConfig()]);
handleSecretAdminAccess();
