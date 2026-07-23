const SUPABASE_URL = window.FUMACINHA_SUPABASE_URL || "";
const SUPABASE_KEY = window.FUMACINHA_SUPABASE_PUBLISHABLE_KEY || "";
const supabaseClient = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY);
const TABLES = {
  products: "PRODUTOS",
  sales: "VENDAS",
  saleItems: "ITENS_VENDA",
  orders: "PEDIDOS",
  orderItems: "ITENS_PEDIDO",
  orderChanges: "ALTERACOES_PEDIDO",
  stockMoves: "MOVIMENTACOES_ESTOQUE",
  expenses: "DESPESAS",
  deliverers: "ENTREGADORES",
  sellers: "VENDEDORAS",
  deliveryPayouts: "REPASSES_ENTREGADORES",
  cashClosings: "FECHAMENTOS_CAIXA",
  cashMovements: "MOVIMENTACOES_CAIXA",
  changeBox: "CAIXA_TROCO",
  changeMoves: "MOVIMENTACOES_TROCO",
  exchangeChecks: "CONFERENCIAS_TROCAS",
  siteConfig: "SITE_CONFIG",
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const COMMISSION_BASE = 0.5;
const COMMISSION_CARD_EXTRA = 1;
const ROUTE_TIMES = ["11:00", "13:00", "15:00", "17:00", "19:00", "21:00"];
const PRODUCT_IMAGE_BUCKET = "fumacinha-produtos";
const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;
const PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PRODUCT_SELECT_FIELDS = "id,nome,preco,imagem,categoria,descricao,estoque,ativo,destaque_home,ocultar_home";
const PRODUCT_SELECT_FALLBACK_FIELDS = "id,nome,preco,imagem,categoria,estoque,ativo";
const LAST_SELLER_KEY = "fumacinha:lastSellerId";
const LAST_DELIVERER_KEY = "fumacinha:lastDelivererId";
const EXCHANGE_CHECK_KEY = "fumacinha:exchangeChecks";
const CONFERENCE_PASSWORD_KEY = "fumacinha:conferencePassword";
const DEFAULT_CONFERENCE_PASSWORD = "1234";
const ANALYTICS_PERIOD_LABELS = {
  today: "Hoje",
  last7: "Ultimos 7 dias",
  month: "Este mes",
  lastMonth: "Mes passado",
  year: "Ano atual",
  custom: "Personalizado",
};
const app = {
  products: [],
  sales: [],
  saleItems: [],
  orders: [],
  orderItems: [],
  stockMoves: [],
  expenses: [],
  deliverers: [],
  sellers: [],
  deliveryPayouts: [],
  cashClosings: [],
  cashMovements: [],
  changeBox: null,
  changeMoves: [],
  exchangeChecks: [],
  exchangeSaving: {},
  exchangeSaveTimers: {},
  exchangeSaveVersions: {},
  siteConfig: {
    loja_online: true,
    mensagem_loja_fechada: "Loja temporariamente fechada. Voltaremos em breve.",
  },
  storeStatusSaving: false,
  deliveryManuallyEdited: false,
  saleReceivedTouched: false,
  saleSaving: false,
  editingSaleId: null,
  editingOrderId: null,
  confirmingOrderId: null,
  orderStatusFilter: "pending",
  orderSearch: "",
  orderSort: "recent",
  saleProductSearch: "",
  saleProductCategory: "all",
  productsLoading: false,
  productsError: "",
  salePickerSearch: "",
  salePickerCategory: "all",
  salePickerLoading: false,
  salePickerError: "",
  salePickerSelected: new Set(),
  seenOrderIds: new Set(),
  notifiedOrderIds: new Set(),
  realtimeChannel: null,
  ordersPollTimer: null,
  cashDate: "",
  cashEditing: false,
  routesDate: "",
  routesFilter: "todas",
  sellerSearch: "",
  delivererSearch: "",
  clientSearch: "",
  period: "today",
  financePeriodMode: "month",
  financeMonth: localDateValue(new Date()).slice(0, 7),
  financeQuickPeriod: "month",
  analyticsPeriods: {
    topProducts: "month",
    payments: "month",
    deliverers: "month",
    sellers: "month",
    clients: "month",
  },
  historyPeriod: "month",
  showCancelledHistory: false,
  homeTopProductsExpanded: false,
  activeTab: "home",
  stockSearch: "",
  stockCategory: "all",
  stockCategories: [],
  stockFilter: "all",
  stockSort: "filter",
  stockProductSaving: false,
  selectedStockProductImageFile: null,
  stockProductPreviewUrl: "",
  user: null,
};

let sideTouchStartX = null;
let saleDetailTouchStartY = null;
let salePickerTouchStartY = null;
let lastSaleDetailTrigger = null;
let pendingConfirmAction = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
function setAllText(selector, value) {
  $$(selector).forEach((element) => {
    element.textContent = value;
  });
}

const loginView = $("[data-login-view]");
const controlView = $("[data-control-view]");
const sideShell = $("[data-side-shell]");
const sideMenu = $("[data-side-menu]");
const orderDrawerShell = $("[data-order-drawer-shell]");
const orderDrawerBody = $("[data-order-drawer-body]");
const saleDetailShell = $("[data-sale-detail-shell]");
const saleDetailBody = $("[data-sale-detail-body]");
const confirmShell = $("[data-confirm-shell]");
const confirmTitle = $("[data-confirm-title]");
const confirmMessage = $("[data-confirm-message]");
const confirmOkButton = $("[data-confirm-ok]");
const loginForm = $("[data-login-form]");
const loginStatus = $("[data-login-status]");
const appStatus = $("[data-app-status]");
const saleForm = $("[data-sale-form]");
const saleItemsRoot = $("[data-sale-items]");
const saleProductSearchInput = $("[data-sale-product-search]");
const saleProductCategorySelect = $("[data-sale-product-category]");
const saleProductSheet = $("[data-sale-product-sheet]");
const salePickerSearchInput = $("[data-sale-picker-search]");
const salePickerCategoriesRoot = $("[data-sale-picker-categories]");
const salePickerListRoot = $("[data-sale-picker-list]");
const salePickerConfirmButton = $("[data-confirm-sale-picker]");
const stockList = $("[data-stock-list]");
const stockHistory = $("[data-stock-history]");
const stockProductForm = $("[data-stock-product-form]");
const stockProductStatus = $("[data-stock-product-status]");
const stockProductSubmit = $("[data-stock-product-submit]");
const stockProductImageFile = $("[data-stock-product-image-file]");
const stockProductImagePreview = $("[data-stock-product-image-preview]");
const stockProductImagePreviewImg = $("[data-stock-product-image-preview-img]");
const stockProductImageEmpty = $("[data-stock-product-image-empty]");
const salesHistory = $("[data-sales-history]");
const historyPeriodSelect = $("[data-history-period]");
const pendingOrdersRoot = $("[data-pending-orders]");
const salesStatusFilter = $("[data-sales-status-filter]");
const orderSearchInput = $("[data-order-search]");
const orderSortSelect = $("[data-order-sort]");
const pendingTitle = $("[data-pending-title]");
const pendingTotalBadge = $("[data-pending-total-badge]");
const pendingSummary = $("[data-pending-summary]");
const pendingNavBadge = $("[data-pending-nav-badge]");
const expenseForm = $("[data-expense-form]");
const expenseList = $("[data-expense-list]");
const sellerSelect = $("[data-seller-select]");
const delivererSelect = $("[data-deliverer-select]");
const saleWarning = $("[data-sale-warning]");
const sellerForm = $("[data-seller-form]");
const delivererForm = $("[data-deliverer-form]");
const sellerList = $("[data-seller-list]");
const delivererList = $("[data-deliverer-list]");
const saleSuccess = $("[data-sale-success]");
const saleSubmit = $("[data-sale-submit]");
const paymentCheckMessage = $("[data-payment-check-message]");
const confirmEditedOrderButton = $("[data-confirm-edited-order]");
const saleEditBanner = $("[data-sale-edit-banner]");
const saleEditTitle = $("[data-sale-edit-title]");
const saleEditLabel = $("[data-sale-edit-label]");
const saleEditMotive = $("[data-sale-edit-motive]");
const cashDateInput = $("[data-cash-date]");
const cashForm = $("[data-cash-form]");
const cashHistory = $("[data-cash-history]");
const cashStatus = $("[data-cash-status]");
const conferenceAlert = $("[data-conference-alert]");
const changeHistory = $("[data-change-history]");
const routesDateInput = $("[data-routes-date]");
const routesFilterSelect = $("[data-routes-filter]");
const routesList = $("[data-routes-list]");
const topClientsRoot = $("[data-top-clients]");
const clientsCount = $("[data-clients-count]");
let toastTimer = null;
let saleConfirmationTimer = null;

function setStatus(message = "", type = "") {
  if (!appStatus) return;
  appStatus.textContent = message;
  appStatus.className = `app-status ${type}`.trim();
}

function setLoginStatus(message = "", type = "") {
  if (!loginStatus) return;
  loginStatus.textContent = message;
  loginStatus.className = `form-status ${type}`.trim();
}

function setPaymentCheckMessage(message = "", type = "error") {
  if (!paymentCheckMessage) return;
  paymentCheckMessage.textContent = message;
  paymentCheckMessage.className = `payment-check-message ${message ? type : ""}`.trim();
}

function isPaymentCheckError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return message.includes("conferiu o pagamento") || message.includes("confira a forma de pagamento");
}

function saleSubmitIdleLabel() {
  if (app.confirmingOrderId) return "Confirmar e registrar venda";
  if (app.editingSaleId) return "Salvar alteracoes";
  return "Registrar venda";
}

function showSaleConfirmedFeedback() {
  if (saleConfirmationTimer) window.clearTimeout(saleConfirmationTimer);
  setPaymentCheckMessage("Venda confirmada", "success");
  if (saleSubmit) {
    saleSubmit.classList.add("sale-confirmed");
    saleSubmit.disabled = true;
    saleSubmit.textContent = "Venda confirmada";
  }
  saleConfirmationTimer = window.setTimeout(() => {
    setPaymentCheckMessage("");
    if (saleSubmit && !app.saleSaving) {
      saleSubmit.classList.remove("sale-confirmed");
      saleSubmit.disabled = false;
      saleSubmit.textContent = saleSubmitIdleLabel();
    }
  }, 2600);
}

function isConnectionError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return !navigator.onLine || message.includes("failed to fetch") || message.includes("networkerror") || message.includes("network request failed") || message.includes("fetch");
}

function connectionMessage() {
  return "Sem internet. Verifique sua conexao e toque em Atualizar para tentar novamente.";
}

function showConnectionStatus() {
  const message = connectionMessage();
  setStatus(message, "error");
  setLoginStatus(message, "error");
}

function showToast(message, type = "success", options = {}) {
  let toast = $("[data-control-toast]");
  if (!toast) {
    toast = document.createElement("div");
    toast.dataset.controlToast = "";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `control-toast ${type} visible ${options.clickable ? "clickable" : ""}`.trim();
  toast.onclick = options.onClick || null;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("visible");
    toast.onclick = null;
  }, 3000);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toNumber(value) {
  return Number(value || 0);
}

function parseMoney(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const clean = String(value || "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoneyInput(input) {
  if (!input || !String(input.value).trim()) return;
  input.value = parseMoney(input.value).toFixed(2).replace(".", ",");
}

function dateValue(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function localDateValue(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function localDateTimeValue(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDateBR(dateKey) {
  return dateKey ? new Date(`${dateKey}T12:00:00`).toLocaleDateString("pt-BR") : "";
}

function nextRouteSuggestion(now = new Date()) {
  const minutes = now.getHours() * 60 + now.getMinutes();
  for (const route of ROUTE_TIMES) {
    const [hour, minute] = route.split(":").map(Number);
    if (minutes < hour * 60 + minute) {
      return { date: localDateValue(now), time: route };
    }
  }
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { date: localDateValue(tomorrow), time: "11:00" };
}

function routeIso(dateKey, routeTime) {
  return dateKey && routeTime ? new Date(`${dateKey}T${routeTime}:00`).toISOString() : null;
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function periodRange(period = app.period) {
  const now = new Date();
  if (period === "yesterday") {
    const day = new Date(now);
    day.setDate(day.getDate() - 1);
    return { start: startOfDay(day), end: endOfDay(day) };
  }
  if (period === "last7") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return { start: startOfDay(start), end: endOfDay(now) };
  }
  if (period === "month") {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfDay(now) };
  }
  if (period === "lastMonth") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start: startOfDay(start), end: endOfDay(end) };
  }
  if (period === "year") {
    return { start: new Date(now.getFullYear(), 0, 1), end: endOfDay(now) };
  }
  if (period === "custom") {
    const startInput = $("[data-date-start]")?.value;
    const endInput = $("[data-date-end]")?.value;
    const start = startInput ? startOfDay(new Date(`${startInput}T00:00:00`)) : startOfDay(now);
    const end = endInput ? endOfDay(new Date(`${endInput}T00:00:00`)) : endOfDay(now);
    return { start, end };
  }
  return { start: startOfDay(now), end: endOfDay(now) };
}

function analyticsPeriodRange(period = "month") {
  return periodRange(period);
}

function analyticsPeriodFor(key) {
  return app.analyticsPeriods?.[key] || "month";
}

function analyticsSales(key) {
  const { start, end } = analyticsPeriodRange(analyticsPeriodFor(key));
  return app.sales.filter((sale) => {
    if (sale.cancelada) return false;
    const date = saleDate(sale);
    return date >= start && date <= end;
  });
}

function analyticsConfirmedOrders(key) {
  const { start, end } = analyticsPeriodRange(analyticsPeriodFor(key));
  return app.orders.filter((order) => {
    if (!isConfirmedOrder(order) || !order.venda_id) return false;
    const date = orderHistoryDate(order);
    return date >= start && date <= end;
  });
}

function monthKey(date = new Date()) {
  return localDateValue(date).slice(0, 7);
}

function monthStartFromKey(key) {
  const [year, month] = String(key || monthKey()).split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function monthEndFromKey(key) {
  const [year, month] = String(key || monthKey()).split("-").map(Number);
  return endOfDay(new Date(year, month, 0));
}

function monthLabel(key) {
  const date = monthStartFromKey(key);
  const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function setGlobalCustomRange(startDate, endDate) {
  const startInput = $("[data-date-start]");
  const endInput = $("[data-date-end]");
  if (startInput) startInput.value = localDateValue(startDate);
  if (endInput) endInput.value = localDateValue(endDate);
  app.period = "custom";
}

function applyFinanceMonth(key = monthKey()) {
  app.financePeriodMode = "month";
  app.financeMonth = key;
  const current = monthKey();
  if (key === current) {
    app.period = "month";
  } else {
    setGlobalCustomRange(monthStartFromKey(key), monthEndFromKey(key));
  }
}

function financePeriodTitle() {
  if (app.financePeriodMode === "month") return monthLabel(app.financeMonth);
  const labels = {
    today: `Hoje, ${new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}`,
    yesterday: "Ontem",
    last7: "Ultimos 7 dias",
    month: "Mes atual",
    lastMonth: "Mes passado",
    year: `Ano atual - ${new Date().getFullYear()}`,
    custom: "Periodo personalizado",
  };
  if (app.financeQuickPeriod === "custom") {
    const start = $("[data-date-start]")?.value;
    const end = $("[data-date-end]")?.value;
    return start && end ? `${formatDateBR(start)} a ${formatDateBR(end)}` : labels.custom;
  }
  return labels[app.financeQuickPeriod] || labels.custom;
}

function openFinanceFilter() {
  const shell = $("[data-finance-filter-shell]");
  if (!shell) return;
  const startInput = $("[data-finance-date-start]");
  const endInput = $("[data-finance-date-end]");
  if (startInput) startInput.value = $("[data-date-start]")?.value || localDateValue(new Date());
  if (endInput) endInput.value = $("[data-date-end]")?.value || localDateValue(new Date());
  shell.classList.remove("hidden");
  shell.setAttribute("aria-hidden", "false");
  renderFinancePeriodControls();
}

function closeFinanceFilter() {
  const shell = $("[data-finance-filter-shell]");
  if (!shell) return;
  shell.classList.add("hidden");
  shell.setAttribute("aria-hidden", "true");
}

function renderFinancePeriodControls() {
  const label = $("[data-finance-period-label]");
  if (label) label.textContent = financePeriodTitle();
  const nextButton = $("[data-finance-month-next]");
  if (nextButton) nextButton.disabled = app.financePeriodMode === "month" && app.financeMonth >= monthKey();
  $("[data-finance-current-month]")?.classList.toggle("hidden", app.financePeriodMode === "month" && app.financeMonth === monthKey());
  $$("[data-finance-quick]").forEach((button) => {
    const quick = button.dataset.financeQuick;
    const activeQuick = app.financePeriodMode === "quick" && quick === app.financeQuickPeriod;
    const activeCurrentMonth = app.financePeriodMode === "month" && app.financeMonth === monthKey() && quick === "month";
    button.classList.toggle("active", activeQuick || activeCurrentMonth);
  });
}

function applyFinanceQuickPeriod(period) {
  app.financePeriodMode = "quick";
  app.financeQuickPeriod = period;
  app.period = period;
  if (period === "month") app.financeMonth = monthKey();
  if (period === "lastMonth") {
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    app.financeMonth = monthKey(previousMonth);
  }
  closeFinanceFilter();
  renderAll();
}

function applyFinanceCustomDates() {
  const startValue = $("[data-finance-date-start]")?.value;
  const endValue = $("[data-finance-date-end]")?.value;
  const status = $("[data-finance-filter-status]");
  if (!startValue || !endValue) {
    if (status) status.textContent = "Informe a data inicial e final.";
    return;
  }
  const start = new Date(`${startValue}T00:00:00`);
  const end = new Date(`${endValue}T00:00:00`);
  if (end < start) {
    if (status) status.textContent = "A data final nao pode ser anterior a inicial.";
    return;
  }
  setGlobalCustomRange(start, end);
  app.financePeriodMode = "quick";
  app.financeQuickPeriod = "custom";
  if (status) status.textContent = "";
  closeFinanceFilter();
  renderAll();
}

function saleDate(sale) {
  return new Date(sale.data_venda || sale.created_at || Date.now());
}

function filteredSales() {
  const { start, end } = periodRange();
  return app.sales.filter((sale) => {
    if (sale.cancelada) return false;
    const date = saleDate(sale);
    return date >= start && date <= end;
  });
}

function filteredExpenses() {
  const { start, end } = periodRange();
  return app.expenses.filter((expense) => {
    const date = new Date(`${expense.data_despesa || dateValue()}T12:00:00`);
    return date >= start && date <= end;
  });
}

function filteredOrders() {
  const { start, end } = periodRange();
  return app.orders.filter((order) => {
    const date = new Date(order.created_at || Date.now());
    return date >= start && date <= end;
  });
}

function ordersForCurrentStatusFilter() {
  const base = app.orderStatusFilter === "pending" ? app.orders : filteredOrders();
  return base.filter(orderMatchesFilter);
}

function pendingOrderCount() {
  return pendingOrders().length;
}

function updatePendingBadges() {
  const count = pendingOrderCount();
  if (pendingTitle) pendingTitle.textContent = `Pedidos pendentes (${count})`;
  if (pendingTotalBadge) pendingTotalBadge.textContent = `${count} ${count === 1 ? "pedido" : "pedidos"}`;
  if (pendingNavBadge) {
    pendingNavBadge.textContent = String(count);
    pendingNavBadge.classList.toggle("hidden", count <= 0);
    pendingNavBadge.classList.toggle("attention", count > 0);
  }
}

function orderSearchText(order) {
  return [
    order.codigo,
    order.cliente_nome,
    order.cliente_bairro,
    order.cliente_telefone,
    order.telefone,
  ].filter(Boolean).join(" ").toLowerCase();
}

function sortedOrders(rows) {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    if (app.orderSort === "oldest") return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    if (app.orderSort === "value-desc") return toNumber(b.valor_produtos) - toNumber(a.valor_produtos);
    if (app.orderSort === "value-asc") return toNumber(a.valor_produtos) - toNumber(b.valor_produtos);
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
  return sorted;
}

function normalizePhone(value = "") {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function phoneDisplay(value = "") {
  const digits = String(value || "").replace(/\D/g, "").replace(/^55/, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return digits || "Sem WhatsApp";
}

function orderPhone(order) {
  return normalizePhone(order.cliente_telefone || order.telefone || "");
}

function orderWhatsappUrl(order) {
  const phone = orderPhone(order);
  if (!phone) return "";
  const text = `Ola, ${order.cliente_nome || "cliente"}! Estou entrando em contato sobre o pedido ${order.codigo || order.id} da Fumacinha.`;
  return `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(text)}`;
}

function clientWhatsappUrl(phone, name = "cliente") {
  const normalized = normalizePhone(phone);
  if (!normalized) return "";
  const text = `Ola, ${name || "cliente"}! Aqui e da Fumacinha.`;
  return `https://api.whatsapp.com/send/?phone=${normalized}&text=${encodeURIComponent(text)}`;
}

function saleLinkedOrder(sale) {
  return app.orders.find((order) => String(order.venda_id || "") === String(sale.id));
}

function isConfirmedOrder(order) {
  return normalizeOrderStatus(order.status) === "confirmado";
}

function orderHistoryDate(order) {
  return new Date(order.confirmado_em || order.updated_at || order.created_at || Date.now());
}

function orderMatchesPeriod(order) {
  const { start, end } = periodRange();
  const date = orderHistoryDate(order);
  return date >= start && date <= end;
}

function clientRows(sales = analyticsSales("clients")) {
  const rank = new Map();
  sales.forEach((sale) => {
    const linkedOrder = saleLinkedOrder(sale);
    const name = sale.cliente_nome || linkedOrder?.cliente_nome || "Cliente sem nome";
    const rawPhone = sale.cliente_telefone || linkedOrder?.cliente_telefone || linkedOrder?.telefone || "";
    const phone = normalizePhone(rawPhone);
    const key = phone || name.trim().toLowerCase();
    const current = rank.get(key) || {
      name,
      phone,
      purchases: 0,
      total: 0,
      received: 0,
      lastDate: null,
    };
    current.name = current.name === "Cliente sem nome" && name ? name : current.name;
    current.phone = current.phone || phone;
    current.purchases += 1;
    current.total += saleProductsValue(sale);
    current.received += saleDeliveredValue(sale);
    const date = saleDate(sale);
    if (!current.lastDate || date > current.lastDate) current.lastDate = date;
    rank.set(key, current);
  });

  const search = app.clientSearch.trim().toLowerCase();
  return [...rank.values()]
    .filter((client) => {
      if (!search) return true;
      return `${client.name} ${phoneDisplay(client.phone)} ${client.phone}`.toLowerCase().includes(search);
    })
    .sort((a, b) => b.purchases - a.purchases || b.total - a.total || (b.lastDate || 0) - (a.lastDate || 0));
}

function scrollToOrder(orderId) {
  switchTab("orders");
  app.orderStatusFilter = "pending";
  renderPendingOrders();
  window.requestAnimationFrame(() => {
    const row = document.querySelector(`[data-order-row="${orderId}"]`);
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function markOrdersSeen() {
  app.orders.forEach((order) => app.seenOrderIds.add(String(order.id)));
}

function notifyNewOrder(order) {
  const id = String(order.id);
  if (!id || app.notifiedOrderIds.has(id)) return;
  app.notifiedOrderIds.add(id);
  const receivedAt = new Date(order.created_at || Date.now()).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  showToast(
    `Novo pedido recebido\n${order.codigo || `Pedido #${order.id}`}\n${order.cliente_nome || "Cliente"}\n${currency.format(order.valor_produtos || 0)}\nRecebido as ${receivedAt}`,
    "order",
    { clickable: true, onClick: () => scrollToOrder(order.id) }
  );
}

async function fetchOrderItemsFor(orderId) {
  const { data, error } = await supabaseClient.from(TABLES.orderItems).select("*").eq("pedido_id", orderId).order("created_at", { ascending: true });
  if (error) throw error;
  app.orderItems = [...app.orderItems.filter((item) => String(item.pedido_id) !== String(orderId)), ...(data || [])];
}

async function handleRealtimeOrder(order, shouldNotify = true) {
  if (!order?.id) return;
  const id = String(order.id);
  const existed = app.orders.some((current) => String(current.id) === id);
  app.orders = [order, ...app.orders.filter((current) => String(current.id) !== id)];
  await fetchOrderItemsFor(order.id).catch(() => {});
  renderPendingOrders();
  renderDashboard();
  renderFinance();
  if (!existed && shouldNotify && !app.seenOrderIds.has(id)) notifyNewOrder(order);
  app.seenOrderIds.add(id);
}

async function pollOrdersLight() {
  if (!supabaseClient || !app.user) return;
  const { data, error } = await supabaseClient.from(TABLES.orders).select("*").order("created_at", { ascending: false }).limit(20);
  if (error) return;
  const newRows = (data || []).filter((order) => !app.seenOrderIds.has(String(order.id)));
  if (!newRows.length) return;
  const ids = newRows.map((order) => order.id);
  const { data: items } = await supabaseClient.from(TABLES.orderItems).select("*").in("pedido_id", ids);
  app.orderItems = [...app.orderItems.filter((item) => !ids.some((id) => String(id) === String(item.pedido_id))), ...(items || [])];
  newRows.reverse().forEach((order) => {
    app.orders = [order, ...app.orders.filter((current) => String(current.id) !== String(order.id))];
    notifyNewOrder(order);
    app.seenOrderIds.add(String(order.id));
  });
  renderPendingOrders();
  renderDashboard();
  renderFinance();
}

function setupOrdersRealtime() {
  if (!supabaseClient || app.realtimeChannel) return;
  app.realtimeChannel = supabaseClient
    .channel("fumacinha-pedidos")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: TABLES.orders }, (payload) => handleRealtimeOrder(payload.new, true))
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: TABLES.orders }, (payload) => handleRealtimeOrder(payload.new, false))
    .subscribe();
  if (!app.ordersPollTimer) app.ordersPollTimer = window.setInterval(pollOrdersLight, 20000);
}

function productCost(product) {
  return toNumber(product.custo || product.custo_unitario || 0);
}

function saleCost(sale) {
  return toNumber(sale.custo_total || 0);
}

function saleTotal(sale) {
  return toNumber(sale.valor_produtos || sale.valor_total || 0);
}

function saleProductsValue(sale) {
  const directValue = toNumber(sale?.valor_produtos);
  if (directValue > 0 || sale?.valor_produtos === 0 || sale?.valor_produtos === "0") return directValue;

  const saleId = String(sale?.id || "");
  const itemsTotal = app.saleItems
    .filter((item) => String(item.venda_id || "") === saleId)
    .reduce((sum, item) => {
      const storedTotal = toNumber(item.valor_total || item.subtotal);
      if (storedTotal > 0) return sum + storedTotal;
      return sum + toNumber(item.quantidade) * toNumber(item.valor_unitario);
    }, 0);
  if (itemsTotal > 0) return itemsTotal;

  return saleTotal(sale);
}

function saleGrandTotal(sale) {
  return toNumber(sale.total_venda || sale.valor_recebido || saleTotal(sale) + saleDelivery(sale) + saleCardServiceFee(sale));
}

function saleDeliveredValue(sale) {
  return toNumber(sale.valor_pago_cliente || sale.valor_entregue || sale.valor_recebido || saleGrandTotal(sale));
}

function saleChangeValue(sale) {
  return toNumber(sale.troco || 0);
}

function saleReceived(sale) {
  return saleGrandTotal(sale);
}

function saleDelivery(sale) {
  const storedDelivery = toNumber(sale.taxa_entrega || 0);
  const cardServiceFee = saleCardServiceFee(sale);
  const explicitPaidValue = toNumber(sale.valor_pago_cliente || sale.valor_entregue || 0);
  if (cardServiceFee > 0 && explicitPaidValue > 0) {
    const correctedDelivery = explicitPaidValue - saleProductsValue(sale) - saleChangeValue(sale) - cardServiceFee;
    if (correctedDelivery >= -0.01) return Math.max(0, correctedDelivery);
  }
  return storedDelivery;
}

function saleCommission(sale) {
  const breakdown = salePaymentBreakdown(sale);
  if (breakdown.length) {
    const hasCard = breakdown.some((payment) => isCardPayment(payment.forma));
    return COMMISSION_BASE + (hasCard ? COMMISSION_CARD_EXTRA : 0);
  }
  return toNumber(sale.comissao_total || commissionForPayment(sale.forma_pagamento).total);
}

function normalizePayment(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isCashPayment(payment) {
  return normalizePayment(payment) === "dinheiro";
}

function isCardPayment(payment) {
  const normalized = normalizePayment(payment);
  return normalized === "debito" || normalized === "credito";
}

function commissionForPayment(payment) {
  const card = isCardPayment(payment);
  const cardExtra = card ? COMMISSION_CARD_EXTRA : 0;
  return {
    base: COMMISSION_BASE,
    card: cardExtra,
    total: COMMISSION_BASE + cardExtra,
  };
}

function cardServiceFeeForPayment(payment, splitPayments = []) {
  const hasCard = splitPayments.length
    ? splitPayments.some((row) => isCardPayment(row.forma))
    : isCardPayment(payment);
  return hasCard ? COMMISSION_CARD_EXTRA : 0;
}

function saleCardServiceFee(sale) {
  const breakdown = salePaymentBreakdown(sale);
  const hasCard = breakdown.length
    ? breakdown.some((payment) => isCardPayment(payment.forma))
    : isCardPayment(sale.forma_pagamento);
  if (!hasCard) return 0;
  return toNumber(sale.comissao_cartao || COMMISSION_CARD_EXTRA);
}

function productImage(product) {
  return product?.imagem || product?.image_url || product?.imagem_url || product?.produto_imagem || "./assets/fumacinha-logo.png";
}

function personNameById(rows, id) {
  const row = rows.find((item) => String(item.id) === String(id));
  return row?.nome || "";
}

function summaryFor(sales = filteredSales(), expenses = filteredExpenses()) {
  const revenue = sales.reduce((sum, sale) => sum + saleTotal(sale), 0);
  const received = sales.reduce((sum, sale) => sum + saleReceived(sale), 0);
  const delivery = sales.reduce((sum, sale) => sum + saleDelivery(sale), 0);
  const commission = sales.reduce((sum, sale) => sum + saleCommission(sale), 0);
  const cardServiceFees = sales.reduce((sum, sale) => sum + saleCardServiceFee(sale), 0);
  const cost = sales.reduce((sum, sale) => sum + saleCost(sale), 0);
  const expenseTotal = expenses.reduce((sum, expense) => sum + toNumber(expense.valor), 0);
  const gross = revenue + cardServiceFees - cost;
  const net = gross - expenseTotal - commission;
  const quantity = sales.reduce((sum, sale) => sum + toNumber(sale.quantidade || sale.quantidade_total), 0);
  return {
    revenue,
    received,
    delivery,
    commission,
    cardServiceFees,
    cost,
    expenses: expenseTotal,
    gross,
    net,
    count: sales.length,
    quantity,
    ticket: sales.length ? revenue / sales.length : 0,
  };
}

function renderAuth(isAuthenticated) {
  loginView?.classList.toggle("hidden", isAuthenticated);
  controlView?.classList.toggle("hidden", !isAuthenticated);
  sideShell?.classList.toggle("hidden", !isAuthenticated);
  if (!isAuthenticated) closeSideMenu();
}

async function requireAuth() {
  if (!supabaseClient) {
    setLoginStatus("Configure o Supabase da Fumacinha antes de acessar.", "error");
    renderAuth(false);
    return false;
  }

  let sessionResult;
  try {
    sessionResult = await supabaseClient.auth.getSession();
  } catch (error) {
    if (isConnectionError(error)) showConnectionStatus();
    else setLoginStatus(error?.message || "Nao foi possivel verificar a sessao.", "error");
    renderAuth(false);
    return false;
  }

  const { data, error } = sessionResult;
  if (error || !data.session?.user) {
    if (isConnectionError(error)) showConnectionStatus();
    renderAuth(false);
    return false;
  }

  app.user = data.session.user;
  renderAuth(true);
  return true;
}

async function requireUserId() {
  if (!supabaseClient) throw new Error("Configure o Supabase da Fumacinha antes de acessar.");
  const { data, error } = await supabaseClient.auth.getUser();
  if (error || !data.user?.id) {
    app.user = null;
    renderAuth(false);
    throw new Error("Sessao expirada. Entre novamente.");
  }
  app.user = data.user;
  return data.user.id;
}

async function ensureDukeAvailability(products) {
  const dukeIds = products
    .filter((product) => {
      const estoque = Number(product.estoque ?? 0);
      return String(product.nome || "").toLowerCase().includes("duke")
        && Number.isFinite(estoque)
        && estoque > 0
        && product.ativo === false;
    })
    .map((product) => product.id);
  if (!dukeIds.length) return products;

  const { data, error } = await supabaseClient
    .from(TABLES.products)
    .update({ ativo: true })
    .in("id", dukeIds)
    .eq("ativo", false)
    .gt("estoque", 0)
    .select("*");
  if (error) throw error;

  const updatedProducts = new Map((data || []).map((product) => [String(product.id), product]));
  return products.map((product) => updatedProducts.get(String(product.id)) || product);
}

async function loadProductsFromSupabase({ silent = false } = {}) {
  if (!supabaseClient) throw new Error("Configure o Supabase da Fumacinha antes de acessar.");
  app.productsLoading = true;
  app.productsError = "";
  if (!silent) renderProductDependentViews();
  let { data, error } = await supabaseClient
    .from(TABLES.products)
    .select(PRODUCT_SELECT_FIELDS)
    .order("categoria", { ascending: true })
    .order("nome", { ascending: true });
  if (error) {
    const missingOptionalColumns =
      error.message?.includes("PRODUTOS.descricao") ||
      error.message?.includes("PRODUTOS.destaque_home") ||
      error.message?.includes("PRODUTOS.ocultar_home");
    if (missingOptionalColumns) {
      console.warn("Consulta completa de produtos falhou, usando consulta minima:", error.message);
      const fallback = await supabaseClient
        .from(TABLES.products)
        .select(PRODUCT_SELECT_FALLBACK_FIELDS)
        .order("categoria", { ascending: true })
        .order("nome", { ascending: true });
      data = fallback.data;
      error = fallback.error;
    }
  }
  if (error) {
    const minimal = await supabaseClient
      .from(TABLES.products)
      .select("id,nome,preco,imagem,categoria")
      .order("nome", { ascending: true });
    if (!minimal.error) {
      data = minimal.data;
      error = null;
    }
  }
  app.productsLoading = false;
  if (error) {
    app.productsError = error.message || "Erro ao carregar produtos.";
    console.error("Erro ao carregar produtos da Fumacinha:", {
      table: TABLES.products,
      filters: PRODUCT_SELECT_FIELDS,
      error,
    });
    if (!silent) renderProductDependentViews();
    throw error;
  }
  const loadedProducts = data || [];
  try {
    app.products = await ensureDukeAvailability(loadedProducts);
  } catch (error) {
    app.products = loadedProducts;
    console.error("Erro ao corrigir disponibilidade do Duke:", error);
  }
  if (!silent) renderProductDependentViews();
  return app.products;
}

function renderProductDependentViews() {
  renderSaleProductFilters();
  renderSaleProductPicker();
  renderStock();
  updateSaleProductFilterStatus();
}

function splitPaymentPanelMarkup() {
  return `
    <div>
      <strong>Pagamento dividido</strong>
      <span>Use quando o cliente pagar em duas formas.</span>
    </div>
    <label class="inline-check split-payment-toggle"><input type="checkbox" name="pagamento_dividido" /><span></span></label>
    <div class="split-payment-grid hidden" data-split-payment-fields>
      <label>
        Forma 1
        <select name="pagamento_1_forma">
          <option value="Pix">Pix</option>
          <option value="Dinheiro">Dinheiro</option>
          <option value="Debito">Debito</option>
          <option value="Credito">Credito</option>
          <option value="Outros">Outros</option>
        </select>
      </label>
      <label>Valor 1 <input type="text" name="pagamento_1_valor" inputmode="decimal" autocomplete="off" placeholder="0,00" /></label>
      <label>
        Forma 2
        <select name="pagamento_2_forma">
          <option value="Pix">Pix</option>
          <option value="Dinheiro">Dinheiro</option>
          <option value="Debito">Debito</option>
          <option value="Credito">Credito</option>
          <option value="Outros">Outros</option>
        </select>
      </label>
      <label>Valor 2 <input type="text" name="pagamento_2_valor" inputmode="decimal" autocomplete="off" placeholder="0,00" /></label>
    </div>
  `;
}

function ensureSplitPaymentPanel() {
  if (!saleForm) return null;
  const paymentSelect = saleForm.elements.forma_pagamento;
  const paymentLabel = paymentSelect?.closest("label");
  if (!paymentLabel) return null;

  let panel = saleForm.querySelector("[data-split-payment-panel]");
  if (!panel) {
    panel = document.createElement("section");
    panel.className = "split-payment-panel";
    panel.dataset.splitPaymentPanel = "";
    panel.dataset.testid = "split-payment-panel";
    panel.setAttribute("aria-label", "Pagamento dividido");
    panel.innerHTML = splitPaymentPanelMarkup();
  }

  panel.hidden = false;
  panel.classList.remove("hidden");
  panel.removeAttribute("aria-hidden");
  if (paymentLabel.nextElementSibling !== panel) paymentLabel.insertAdjacentElement("afterend", panel);
  return panel;
}

async function loadAll() {
  if (!(await requireAuth())) return;
  if (!navigator.onLine) {
    showConnectionStatus();
    return;
  }
  setStatus("Carregando controle...", "loading");
  try {
    await loadProductsFromSupabase({ silent: true });
  } catch (error) {
    showToast("Nao foi possivel carregar os produtos.", "error");
  }

  const [salesResult, itemsResult, ordersResult, orderItemsResult, movesResult, expensesResult, deliverersResult, sellersResult, payoutsResult, closingsResult, cashMovesResult, changeBoxResult, changeMovesResult, exchangeChecksResult, siteConfigResult] = await Promise.allSettled([
    supabaseClient.from(TABLES.sales).select("*").order("created_at", { ascending: false }).limit(500),
    supabaseClient.from(TABLES.saleItems).select("*").order("created_at", { ascending: false }).limit(1000),
    supabaseClient.from(TABLES.orders).select("*").order("created_at", { ascending: false }).limit(500),
    supabaseClient.from(TABLES.orderItems).select("*").order("created_at", { ascending: false }).limit(1000),
    supabaseClient.from(TABLES.stockMoves).select("*").order("created_at", { ascending: false }).limit(500),
    supabaseClient.from(TABLES.expenses).select("*").order("data_despesa", { ascending: false }).limit(500),
    supabaseClient.from(TABLES.deliverers).select("*").order("nome", { ascending: true }),
    supabaseClient.from(TABLES.sellers).select("*").order("nome", { ascending: true }),
    supabaseClient.from(TABLES.deliveryPayouts).select("*").order("created_at", { ascending: false }).limit(1000),
    supabaseClient.from(TABLES.cashClosings).select("*").order("data_caixa", { ascending: false }).limit(120),
    supabaseClient.from(TABLES.cashMovements).select("*").order("created_at", { ascending: false }).limit(500),
    supabaseClient.from(TABLES.changeBox).select("*").order("id", { ascending: true }).limit(1),
    supabaseClient.from(TABLES.changeMoves).select("*").order("created_at", { ascending: false }).limit(500),
    supabaseClient.from(TABLES.exchangeChecks).select("*").order("data_caixa", { ascending: false }).limit(1000),
    supabaseClient.from(TABLES.siteConfig).select("*").eq("id", 1).maybeSingle(),
  ]);

  const loadErrors = [];
  const readData = (result, label, fallback = []) => {
    if (result.status === "rejected") {
      loadErrors.push(`${label}: ${result.reason?.message || result.reason}`);
      console.error(`Erro ao carregar ${label}:`, result.reason);
      return fallback;
    }
    if (result.value.error) {
      loadErrors.push(`${label}: ${result.value.error.message}`);
      console.error(`Erro ao carregar ${label}:`, result.value.error);
      return fallback;
    }
    return result.value.data ?? fallback;
  };

  app.sales = readData(salesResult, "vendas", app.sales);
  app.saleItems = readData(itemsResult, "itens de venda", app.saleItems);
  app.orders = readData(ordersResult, "pedidos", app.orders);
  app.orderItems = readData(orderItemsResult, "itens de pedido", app.orderItems);
  app.stockMoves = readData(movesResult, "movimentacoes de estoque", app.stockMoves);
  app.expenses = readData(expensesResult, "despesas", app.expenses);
  app.deliverers = readData(deliverersResult, "entregadores", app.deliverers);
  app.sellers = readData(sellersResult, "vendedoras", app.sellers);
  app.deliveryPayouts = readData(payoutsResult, "repasses de entregadores", app.deliveryPayouts);
  app.cashClosings = readData(closingsResult, "fechamentos de caixa", app.cashClosings);
  app.cashMovements = readData(cashMovesResult, "movimentacoes de caixa", app.cashMovements);
  app.changeBox = readData(changeBoxResult, "caixa de troco", app.changeBox ? [app.changeBox] : [])[0] || null;
  app.changeMoves = readData(changeMovesResult, "movimentacoes de troco", app.changeMoves);
  app.exchangeChecks = exchangeChecksResult.status === "fulfilled" && !exchangeChecksResult.value.error
    ? exchangeChecksResult.value.data || []
    : [];
  if (exchangeChecksResult.status === "rejected" || exchangeChecksResult.value?.error) {
    console.error("Erro ao carregar conferencias de trocas:", exchangeChecksResult.reason || exchangeChecksResult.value?.error);
  }
  const siteConfigData = readData(siteConfigResult, "configuracao do site", app.siteConfig);
  app.siteConfig = {
    loja_online: siteConfigData?.loja_online !== false,
    mensagem_loja_fechada: siteConfigData?.mensagem_loja_fechada || "Loja temporariamente fechada. Voltaremos em breve.",
  };
  markOrdersSeen();
  setupOrdersRealtime();
  if (loadErrors.length) {
    showToast("Alguns dados nao carregaram. Produtos foram mantidos separados.", "error");
    setStatus(`Erro ao carregar: ${loadErrors[0]}`, "error");
  } else {
    showToast("Controle atualizado.", "success");
    setStatus("", "");
  }
  renderAll();
}

function renderSafely(label, callback) {
  try {
    callback();
  } catch (error) {
    console.error(`Erro ao renderizar ${label}:`, error);
  }
}

function renderAll() {
  renderSafely("periodos", renderPeriods);
  renderSafely("filtros analiticos", renderAnalyticsFilters);
  renderSafely("equipe", renderPeopleOptions);
  renderSafely("dashboard", renderDashboard);
  renderSafely("filtros de venda", renderSaleProductFilters);
  renderSafely("itens da venda", renderSaleItems);
  renderSafely("precos da venda", updateSaleItemPrices);
  renderSafely("total da venda", updateSaleTotal);
  renderSafely("pedidos pendentes", renderPendingOrders);
  renderSafely("historico de vendas", renderSalesHistory);
  renderSafely("estoque", renderStock);
  renderSafely("financeiro", renderFinance);
  renderSafely("relatorios", renderReports);
  renderSafely("conferencia", renderCashClosing);
  renderSafely("rotas", renderRoutes);
  renderSafely("status da loja", renderStoreStatus);
}

function renderAnalyticsFilters() {
  $$("[data-analytics-period]").forEach((select) => {
    const key = select.dataset.analyticsPeriod;
    select.value = analyticsPeriodFor(key);
    select.title = ANALYTICS_PERIOD_LABELS[select.value] || "Este mes";
  });
}

function renderStoreStatus() {
  const config = app.siteConfig || {};
  const isOnline = config.loja_online !== false;
  const status = $("[data-store-status-label]");
  const helper = $("[data-store-status-helper]");
  const toggle = $("[data-store-status-toggle]");
  const message = $("[data-store-closed-message]");

  if (status) {
    status.textContent = isOnline ? "Loja online" : "Loja fora do ar";
    status.className = `store-status-pill ${isOnline ? "online" : "offline"}`;
  }
  if (helper) {
    helper.textContent = isOnline
      ? "Clientes conseguem ver produtos, usar carrinho e finalizar pedidos."
      : "Clientes veem somente o aviso de loja fechada. Admin e Controle continuam funcionando.";
  }
  if (toggle) {
    toggle.textContent = isOnline ? "Desativar loja" : "Ativar loja";
    toggle.className = isOnline ? "danger-action" : "primary-action";
    toggle.disabled = app.storeStatusSaving;
  }
  if (message && document.activeElement !== message) {
    message.value = config.mensagem_loja_fechada || "Loja temporariamente fechada. Voltaremos em breve.";
  }
}

function storeStatusErrorMessage(error) {
  const message = String(error?.message || error || "");
  const missingStatusColumn =
    message.includes("loja_online") ||
    message.includes("mensagem_loja_fechada") ||
    (message.includes("SITE_CONFIG") && message.includes("schema cache"));

  if (missingStatusColumn) {
    return "Execute o arquivo SUPABASE_STATUS_LOJA.sql no SQL Editor do Supabase da Fumacinha e depois clique em Atualizar.";
  }

  return message || "Nao foi possivel atualizar o status da loja.";
}

async function saveStoreStatus(patch, successMessage) {
  if (app.storeStatusSaving) return;
  if (!(await requireAuth())) return;
  app.storeStatusSaving = true;
  renderStoreStatus();
  try {
    const payload = {
      id: 1,
      loja_online: app.siteConfig?.loja_online !== false,
      mensagem_loja_fechada: app.siteConfig?.mensagem_loja_fechada || "Loja temporariamente fechada. Voltaremos em breve.",
      ...patch,
    };
    let { data, error } = await supabaseClient
      .from(TABLES.siteConfig)
      .update(patch)
      .eq("id", 1)
      .select("loja_online,mensagem_loja_fechada")
      .maybeSingle();
    if (!error && !data) {
      const inserted = await supabaseClient
        .from(TABLES.siteConfig)
        .upsert(payload, { onConflict: "id" })
        .select("loja_online,mensagem_loja_fechada")
        .single();
      data = inserted.data;
      error = inserted.error;
    }
    if (error) throw error;
    app.siteConfig = {
      loja_online: data?.loja_online !== false,
      mensagem_loja_fechada: data?.mensagem_loja_fechada || payload.mensagem_loja_fechada,
    };
    setStatus(successMessage, "success");
    showToast(successMessage);
  } catch (error) {
    console.error("Erro ao atualizar status da loja:", error);
    const message = storeStatusErrorMessage(error);
    setStatus(message, "error");
    showToast(message, "error");
  } finally {
    app.storeStatusSaving = false;
    renderStoreStatus();
  }
}

async function toggleStoreStatus() {
  const isOnline = app.siteConfig?.loja_online !== false;
  const nextOnline = !isOnline;
  const question = nextOnline
    ? "Ativar a loja agora? Os clientes poderao fazer pedidos novamente."
    : "Desativar a loja agora? Os clientes nao poderao fazer pedidos enquanto ela estiver fora do ar.";
  if (!window.confirm(question)) return;
  await saveStoreStatus(
    { loja_online: nextOnline },
    nextOnline ? "Loja ativada com sucesso." : "Loja desativada com sucesso."
  );
}

async function saveClosedStoreMessage() {
  const message = $("[data-store-closed-message]")?.value.trim() || "Loja temporariamente fechada. Voltaremos em breve.";
  await saveStoreStatus({ mensagem_loja_fechada: message }, "Mensagem da loja fechada salva.");
}

function renderPeriods() {
  const shouldHidePeriodFilters = ["home", "sales", "stock", "history", "finance"].includes(app.activeTab);
  $("[data-period-tabs]")?.classList.toggle("hidden", shouldHidePeriodFilters);
  $$("[data-period]").forEach((button) => button.classList.toggle("active", button.dataset.period === app.period));
  $("[data-custom-period]")?.classList.toggle("hidden", shouldHidePeriodFilters || app.period !== "custom");
  const preset = $("[data-period-preset]");
  if (preset) preset.value = ["last7", "month", "lastMonth", "year"].includes(app.period) ? app.period : "custom";
  const homePeriod = $("[data-home-period]");
  if (homePeriod) homePeriod.value = ["today", "yesterday", "last7", "month", "lastMonth", "year"].includes(app.period) ? app.period : "today";
  renderFinancePeriodControls();
}

function renderPeopleOptions() {
  if (sellerSelect) {
    const activeSellers = app.sellers.filter((seller) => seller.ativo !== false);
    const stored = localStorage.getItem(LAST_SELLER_KEY) || "";
    const defaultSeller = activeSellers.find((seller) => normalizeText(seller.nome) === "telma") || activeSellers[0];
    sellerSelect.innerHTML = `<option value="">Selecione a vendedora</option>${activeSellers
      .map((seller) => `<option value="${seller.id}">${escapeHtml(seller.nome)}</option>`)
      .join("")}`;
    if (activeSellers.some((seller) => String(seller.id) === String(stored))) sellerSelect.value = stored;
    else if (defaultSeller) sellerSelect.value = defaultSeller.id;
  }
  if (delivererSelect) {
    const activeDeliverers = app.deliverers.filter((deliverer) => deliverer.ativo !== false);
    const stored = localStorage.getItem(LAST_DELIVERER_KEY) || "";
    const defaultDeliverer = activeDeliverers.find((deliverer) => normalizeText(deliverer.nome) === "jota") || activeDeliverers[0];
    delivererSelect.innerHTML = `<option value="">Sem entregador</option>${activeDeliverers
      .map((deliverer) => `<option value="${deliverer.id}">${escapeHtml(deliverer.nome)}</option>`)
      .join("")}`;
    if (activeDeliverers.some((deliverer) => String(deliverer.id) === String(stored))) delivererSelect.value = stored;
    else if (defaultDeliverer) delivererSelect.value = defaultDeliverer.id;
  }
  renderTeamLists();
}

function todaySales() {
  const start = startOfDay(new Date());
  const end = endOfDay(new Date());
  return app.sales.filter((sale) => {
    if (sale.cancelada) return false;
    const date = saleDate(sale);
    return date >= start && date <= end;
  });
}

function confirmedSiteOrdersInPeriod() {
  const { start, end } = periodRange();
  return app.orders.filter((order) => {
    if (!isConfirmedOrder(order)) return false;
    const date = orderHistoryDate(order);
    return date >= start && date <= end;
  });
}

function manualSalesInPeriod(sales = filteredSales(), confirmedOrders = confirmedSiteOrdersInPeriod()) {
  const siteSaleIds = new Set(confirmedOrders.map((order) => String(order.venda_id || "")).filter(Boolean));
  return sales.filter((sale) => !siteSaleIds.has(String(sale.id)));
}

function confirmedSiteOrderRevenue(orders) {
  return orders.reduce((sum, order) => sum + toNumber(order.valor_produtos), 0);
}

function renderDashboard() {
  const selected = filteredSales();
  const confirmedSiteOrders = confirmedSiteOrdersInPeriod();
  const manualSales = manualSalesInPeriod(selected, confirmedSiteOrders);
  const manualSummary = summaryFor(manualSales);
  const siteRevenue = confirmedSiteOrderRevenue(confirmedSiteOrders);
  const totalSales = manualSales.length + confirmedSiteOrders.length;
  const totalRevenue = manualSummary.revenue + siteRevenue;
  const totalTicket = totalSales ? totalRevenue / totalSales : 0;
  const { start, end } = periodRange();
  const pending = pendingOrders();
  const cancelled = app.orders.filter((order) => {
    const status = normalizeOrderStatus(order.status);
    const date = new Date(order.cancelado_em || order.updated_at || order.created_at || Date.now());
    return status === "cancelado" && date >= start && date <= end;
  });
  const lowStock = app.products.filter((product) => toNumber(product.estoque) <= 5).length;

  $("[data-kpi-pending-orders]").textContent = String(pending.length);
  $("[data-kpi-total-sales]").textContent = String(totalSales);
  $("[data-kpi-total-sales-breakdown]").textContent = `${manualSales.length} manuais | ${confirmedSiteOrders.length} site`;
  $("[data-kpi-cancelled-orders]").textContent = String(cancelled.length);
  $("[data-kpi-revenue-today]").textContent = currency.format(totalRevenue);
  $("[data-kpi-ticket]").textContent = currency.format(totalTicket);
  $("[data-kpi-received]").textContent = currency.format(manualSummary.received);
  $("[data-kpi-delivery]").textContent = currency.format(manualSummary.delivery);
  $("[data-kpi-commission]").textContent = currency.format(manualSummary.commission);
  $("[data-kpi-profit]").textContent = currency.format(manualSummary.net + siteRevenue);
  $("[data-kpi-low-stock]").textContent = String(lowStock);

  renderList("[data-report-top-products]", rankedProducts(selected).slice(0, 5), "Nenhuma venda no periodo.");
  renderRevenueReport(selected);
}

function operationalAlerts({ pending, lowStock, outStock, missingImages, inactiveProducts }) {
  const alerts = [];
  if (outStock.length) alerts.push({ icon: "!", text: `${outStock.length} ${outStock.length === 1 ? "produto sem estoque" : "produtos sem estoque"}` });
  if (lowStock.length) alerts.push({ icon: "-", text: `${lowStock.length} ${lowStock.length === 1 ? "produto com estoque baixo" : "produtos com estoque baixo"}` });
  if (pending.length) alerts.push({ icon: "#", text: `${pending.length} ${pending.length === 1 ? "pedido aguardando confirmacao" : "pedidos aguardando confirmacao"}` });
  if (missingImages.length) alerts.push({ icon: "i", text: `${missingImages.length} ${missingImages.length === 1 ? "produto cadastrado sem imagem" : "produtos cadastrados sem imagem"}` });
  if (inactiveProducts.length) alerts.push({ icon: "x", text: `${inactiveProducts.length} ${inactiveProducts.length === 1 ? "produto inativo" : "produtos inativos"}` });
  return alerts;
}

function renderDashboard() {
  const selected = filteredSales();
  const confirmedSiteOrders = confirmedSiteOrdersInPeriod();
  const manualSales = manualSalesInPeriod(selected, confirmedSiteOrders);
  const salesSummary = summaryFor(selected);
  const totalSales = manualSales.length + confirmedSiteOrders.length;
  const pending = pendingOrders();
  const lowStock = app.products.filter((product) => {
    const stock = toNumber(product.estoque);
    return stock >= 1 && stock <= 5;
  });
  const outStock = app.products.filter((product) => toNumber(product.estoque) === 0);
  const missingImages = app.products.filter((product) => !String(product.imagem || "").trim());
  const inactiveProducts = app.products.filter((product) => product.ativo === false);
  const alerts = operationalAlerts({ pending, lowStock, outStock, missingImages, inactiveProducts });

  $("[data-kpi-pending-orders]").textContent = String(pending.length);
  $("[data-kpi-total-sales]").textContent = String(totalSales);
  $("[data-kpi-total-sales-breakdown]").textContent = `${manualSales.length} manuais | ${confirmedSiteOrders.length} site`;
  $("[data-kpi-home-commission]").textContent = currency.format(salesSummary.commission);
  $("[data-kpi-home-delivery]").textContent = currency.format(salesSummary.delivery);
  $("[data-kpi-low-stock]").textContent = String(lowStock.length);
  $("[data-kpi-out-stock]").textContent = String(outStock.length);
  renderOperationalAlerts(alerts);
  renderHomeLowStockList();
  const topProductsSales = analyticsSales("topProducts");
  const topProductsConfirmedOrders = analyticsConfirmedOrders("topProducts");
  const topProductsManualSales = manualSalesInPeriod(topProductsSales, topProductsConfirmedOrders);
  const topProducts = dashboardRankedProducts(topProductsManualSales, topProductsConfirmedOrders);
  renderTopProductsRanking(topProducts.slice(0, app.homeTopProductsExpanded ? 20 : 5));
  updateHomeTopProductsMoreButton(topProducts.length);
}

function dashboardRankedProducts(manualSales, confirmedOrders) {
  const rank = new Map();
  const productById = new Map(app.products.map((product) => [String(product.id), product]));
  const productByName = new Map(app.products.map((product) => [String(product.nome || "").trim().toLowerCase(), product]));
  const addRow = (key, label, quantity, total) => {
    const product = productById.get(String(key)) || productByName.get(String(label || "").trim().toLowerCase());
    const current = rank.get(key) || { label: label || "Produto", quantity: 0, total: 0, image: productImage(product) };
    current.quantity += toNumber(quantity);
    current.total += toNumber(total);
    if (!current.image && product) current.image = productImage(product);
    rank.set(key, current);
  };

  app.saleItems
    .filter((item) => manualSales.some((sale) => String(sale.id) === String(item.venda_id)))
    .forEach((item) => {
      const key = item.produto_id || item.nome_produto;
      addRow(key, item.nome_produto || "Produto", item.quantidade, item.valor_total);
    });

  const confirmedOrderIds = new Set(confirmedOrders.map((order) => String(order.id)));
  app.orderItems
    .filter((item) => confirmedOrderIds.has(String(item.pedido_id)))
    .forEach((item) => {
      const key = item.produto_id || item.produto_nome;
      addRow(key, item.produto_nome || "Produto", item.quantidade, item.subtotal || item.valor_total);
    });

  return [...rank.values()].sort((a, b) => b.quantity - a.quantity);
}

function renderOperationalAlerts(alerts) {
  const root = $("[data-operational-alerts]");
  if (!root) return;
  root.innerHTML = alerts.length
    ? `<ul class="operational-alert-list">${alerts.map((alert) => `
      <li>
        <span class="alert-icon">${escapeHtml(alert.icon)}</span>
        <strong>${escapeHtml(alert.text)}</strong>
        <span class="alert-arrow">&rsaquo;</span>
      </li>
    `).join("")}</ul>`
    : `<p class="operational-alert-empty">Nenhum alerta importante agora.</p>`;
}

function stockColorClass(stock) {
  const value = toNumber(stock);
  if (value === 0) return "stock-alert-zero";
  if (value >= 1 && value <= 3) return "stock-alert-critical";
  return "stock-alert-ok";
}

function renderHomeLowStockList() {
  const root = $("[data-home-low-stock-list]");
  if (!root) return;
  const rows = app.products
    .filter((product) => toNumber(product.estoque) <= 5)
    .sort((a, b) => toNumber(a.estoque) - toNumber(b.estoque) || String(a.nome || "").localeCompare(String(b.nome || "")));

  root.innerHTML = rows.length
    ? `<div class="home-stock-list">${rows.map((product) => {
      const stock = toNumber(product.estoque);
      return `
        <article class="home-stock-row ${stockColorClass(stock)}">
          <strong>${escapeHtml(product.nome || "Produto")}</strong>
          <span>${stock} un</span>
        </article>
      `;
    }).join("")}</div>`
    : `<p class="operational-alert-empty">Nenhum produto com estoque baixo.</p>`;
}

function renderTopProductsRanking(rows) {
  const root = $("[data-report-top-products]");
  if (!root) return;
  if (!rows.length) {
    root.innerHTML = "<p>Nenhuma venda no periodo.</p>";
    return;
  }
  const maxQuantity = Math.max(...rows.map((row) => toNumber(row.quantity)), 1);
  root.innerHTML = rows.map((row, index) => {
    const quantity = toNumber(row.quantity);
    const percent = Math.max(8, Math.round((quantity / maxQuantity) * 100));
    return `
      <article class="top-product-row">
        <div class="top-product-position">${index + 1}&ordm;</div>
        <img class="top-product-image" src="${escapeHtml(row.image || "./assets/fumacinha-logo.png")}" alt="${escapeHtml(row.label)}" />
        <div class="top-product-info">
          <strong>${escapeHtml(row.label)}</strong>
          <span>${quantity} ${quantity === 1 ? "unidade" : "unidades"}</span>
          <div class="top-product-bar"><span style="width: ${percent}%"></span></div>
        </div>
        <strong class="top-product-revenue">${currency.format(row.total)}</strong>
      </article>
    `;
  }).join("");
}

function updateHomeTopProductsMoreButton(totalProducts) {
  const button = $("[data-home-top-products-more]");
  if (!button) return;
  const hasMore = totalProducts > 5;
  button.hidden = !hasMore;
  button.textContent = app.homeTopProductsExpanded ? "Ver menos" : "Ver mais";
}
function rankedProducts(sales = filteredSales()) {
  const rank = new Map();
  app.saleItems
    .filter((item) => sales.some((sale) => String(sale.id) === String(item.venda_id)))
    .forEach((item) => {
      const key = item.nome_produto || item.produto_id;
      const current = rank.get(key) || { label: key, quantity: 0, total: 0, profit: 0 };
      current.quantity += toNumber(item.quantidade);
      current.total += toNumber(item.valor_total);
      current.profit += toNumber(item.valor_total) - toNumber(item.custo_total);
      rank.set(key, current);
    });
  return [...rank.values()].sort((a, b) => b.quantity - a.quantity);
}

function smartOrderSuggestions() {
  const selected = filteredSales();
  const confirmedSiteOrders = confirmedSiteOrdersInPeriod();
  const manualSales = manualSalesInPeriod(selected, confirmedSiteOrders);
  const saleIds = new Set(manualSales.map((sale) => String(sale.id)));
  const orderIds = new Set(confirmedSiteOrders.map((order) => String(order.id)));
  const productById = new Map(app.products.map((product) => [String(product.id), product]));
  const productByName = new Map(app.products.map((product) => [String(product.nome || "").trim().toLowerCase(), product]));
  const sold = new Map();

  const addSold = (item, productId, productName, quantity, total) => {
    const normalizedName = String(productName || "").trim().toLowerCase();
    const product = productById.get(String(productId)) || productByName.get(normalizedName);
    const key = product ? `product:${product.id}` : `name:${normalizedName || productId}`;
    const current = sold.get(key) || {
      product,
      name: product?.nome || productName || "Produto",
      quantity: 0,
      total: 0,
      stock: toNumber(product?.estoque),
    };
    current.quantity += toNumber(quantity);
    current.total += toNumber(total);
    current.stock = toNumber(current.product?.estoque);
    sold.set(key, current);
  };

  app.saleItems
    .filter((item) => saleIds.has(String(item.venda_id)))
    .forEach((item) => addSold(item, item.produto_id, item.nome_produto, item.quantidade, item.valor_total));

  app.orderItems
    .filter((item) => orderIds.has(String(item.pedido_id)))
    .forEach((item) => addSold(item, item.produto_id, item.produto_nome, item.quantidade, item.subtotal || item.valor_total));

  return [...sold.values()]
    .filter((row) => {
      const stock = toNumber(row.stock);
      const soldQty = toNumber(row.quantity);
      if (stock === 0) return soldQty >= 1;
      if (stock >= 1 && stock <= 3) return soldQty >= 2;
      if (stock >= 4 && stock <= 5) return soldQty >= 3;
      return false;
    })
    .map((row) => {
      const stock = toNumber(row.stock);
      let priority = 3;
      let status = "Acompanhar";
      if (stock === 0) {
        priority = 1;
        status = "Acabou e vendeu";
      } else if (stock <= 3) {
        priority = 2;
        status = "Repor urgente";
      } else {
        status = "Esgotando";
      }
      return { ...row, priority, status };
    })
    .sort((a, b) => a.priority - b.priority || b.quantity - a.quantity || a.stock - b.stock)
    .slice(0, 12);
}

function renderList(selector, rows, emptyText) {
  const root = $(selector);
  if (!root) return;
  root.innerHTML = rows.length
    ? rows.map((row) => `<div class="report-row"><strong>${escapeHtml(row.label)}</strong><span>${row.quantity || ""} ${row.total !== undefined ? currency.format(row.total) : ""}</span></div>`).join("")
    : `<p>${emptyText}</p>`;
}

function renderRevenueReport(sales) {
  const root = $("[data-report-revenue]");
  if (!root) return;
  const groups = {};
  sales.forEach((sale) => {
    const key = saleDate(sale).toLocaleDateString("pt-BR");
    groups[key] = (groups[key] || 0) + saleTotal(sale);
  });
  const rows = Object.entries(groups).map(([label, total]) => ({ label, total }));
  renderList("[data-report-revenue]", rows, "Sem faturamento no periodo.");
}

function isProductAvailable(product) {
  if (!product) return false;
  const estoque = Number(product.estoque ?? 0);
  const preco = Number(product.preco);
  const id = String(product.id ?? "").trim();
  return Number.isFinite(estoque)
    && estoque > 0
    && product.ativo !== false
    && !product.deleted_at
    && Number.isFinite(preco)
    && preco > 0
    && id !== "";
}

function hasActiveSaleProductFilter() {
  return Boolean(saleFilterText(app.saleProductSearch)) || app.saleProductCategory !== "all";
}

function saleProducts(selected = "") {
  const selectedText = String(selected || "");
  const canKeepSelectedOutsideFilter = Boolean(selectedText);
  return app.products.filter((product) => {
    const isSelected = canKeepSelectedOutsideFilter && String(product.id) === selectedText;
    if (!isProductAvailable(product) && !isSelected) return false;
    if (!isSelected && !productMatchesSaleFilters(product)) return false;
    return true;
  });
}

function saleFilterText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeText(value = "") {
  return saleFilterText(value);
}

function productMatchesSaleFilters(product) {
  if (!isProductAvailable(product)) return false;
  const search = saleFilterText(app.saleProductSearch);
  if (app.saleProductCategory !== "all" && String(product.categoria || "") !== app.saleProductCategory) return false;
  if (!search) return true;
  return saleFilterText([
    product.nome,
    product.categoria,
    product.descricao,
  ].filter(Boolean).join(" ")).includes(search);
}

function productMatchesPickerFilters(product) {
  if (!product) return false;
  const preco = Number(product.preco);
  const id = String(product.id ?? "").trim();
  if (product.ativo === false || product.deleted_at || !Number.isFinite(preco) || preco <= 0 || id === "") return false;
  const search = saleFilterText(app.salePickerSearch);
  if (app.salePickerCategory !== "all" && String(product.categoria || "") !== app.salePickerCategory) return false;
  if (!search) return true;
  return saleFilterText([
    product.nome,
    product.categoria,
    product.descricao,
    product.marca,
    product.sabor,
  ].filter(Boolean).join(" ")).includes(search);
}

function salePickerProducts() {
  return app.products.filter(productMatchesPickerFilters);
}

function selectedSaleProductIds() {
  return new Set($$(".sale-item").map((row) => String(row.querySelector('[name="produto_id"]')?.value || "")).filter(Boolean));
}

function productOptions(selected = "") {
  const rows = saleProducts(selected);
  return rows.length
    ? rows.map((product) => `<option value="${product.id}" ${String(product.id) === String(selected) ? "selected" : ""}>${escapeHtml(product.nome)} (${toNumber(product.estoque)} un)</option>`).join("")
    : '<option value="">Nenhum produto encontrado</option>';
}

function firstAvailableProduct() {
  return saleProducts()[0] || null;
}

function saleProductCategories() {
  return [...new Set(app.products
    .filter(isProductAvailable)
    .map((product) => product.categoria || "Produtos"))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function renderSaleProductFilters() {
  if (saleProductSearchInput) saleProductSearchInput.value = app.saleProductSearch;
  if (!saleProductCategorySelect) return;
  const categories = saleProductCategories();
  saleProductCategorySelect.innerHTML = `<option value="all">Todas as categorias</option>${categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}`;
  saleProductCategorySelect.value = categories.includes(app.saleProductCategory) ? app.saleProductCategory : "all";
  if (saleProductCategorySelect.value !== app.saleProductCategory) app.saleProductCategory = "all";
}

function syncSaleItemSelectionsWithFilters() {
  const firstProduct = firstAvailableProduct();
  $$(".sale-item").forEach((row) => {
    const select = row.querySelector('[name="produto_id"]');
    const price = row.querySelector('[name="valor_unitario"]');
    const current = app.products.find((product) => String(product.id) === String(select?.value));
    if (productMatchesSaleFilters(current)) return;
    if (select) select.value = firstProduct?.id || "";
    if (price) price.value = firstProduct ? toNumber(firstProduct.preco).toFixed(2) : "";
  });
}

function updateSaleProductFilterStatus() {
  const status = $("[data-sale-product-filter-status]");
  if (!status) return;
  if (app.productsLoading) {
    status.textContent = "Carregando produtos...";
    status.className = "sale-product-filter-status";
    return;
  }
  if (app.productsError) {
    status.textContent = "Nao foi possivel carregar os produtos.";
    status.className = "sale-product-filter-status error";
    return;
  }
  const total = saleProducts().length;
  if (!hasActiveSaleProductFilter()) {
    status.textContent = `${total} produto${total === 1 ? "" : "s"} disponivel${total === 1 ? "" : "s"} para venda.`;
    status.className = "sale-product-filter-status";
    return;
  }
  if (!total) {
    status.textContent = "Nenhum produto encontrado para essa busca e categoria.";
    status.className = "sale-product-filter-status error";
    return;
  }
  status.textContent = `${total} produto${total === 1 ? "" : "s"} encontrado${total === 1 ? "" : "s"} no filtro.`;
  status.className = "sale-product-filter-status success";
}

function renderSaleProductState() {
  const rows = $$(".sale-item");
  const empty = $("[data-sale-empty]");
  empty?.classList.toggle("hidden", rows.length > 0);
  saleItemsRoot?.classList.toggle("hidden", rows.length === 0);
  const addButtons = $$("[data-add-sale-item]");
  addButtons.forEach((button) => {
    if (button.closest("[data-sale-empty]")) return;
    button.classList.toggle("hidden", rows.length === 0);
  });
  bindSalePickerOpenButtons();
}

function bindSalePickerOpenButtons() {
  $$("[data-add-sale-item]").forEach((button) => {
    if (button.dataset.salePickerBound === "true") return;
    button.dataset.salePickerBound = "true";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openSaleProductPicker();
    });
  });
}

function renderSaleProductPicker() {
  if (salePickerSearchInput) salePickerSearchInput.value = app.salePickerSearch;
  const categories = ["all", ...saleProductCategories()];
  const categoryLabel = (category) => {
    if (category === "all") return "Todos";
    const normalized = normalizeText(category);
    const labels = {
      acessorios: "Acessorios",
      descartavel: "Descartaveis",
      descartaveis: "Descartaveis",
      coil: "Coil",
      kit: "Kit",
      refil: "Refil",
      salt: "Salt",
      pods: "Pods",
    };
    return labels[normalized] || category;
  };
  if (salePickerCategoriesRoot) {
    salePickerCategoriesRoot.innerHTML = categories.map((category) => `
      <button type="button" class="${category === app.salePickerCategory ? "active" : ""}" data-sale-picker-category="${escapeHtml(category)}">
        ${escapeHtml(categoryLabel(category))}
      </button>
    `).join("");
  }
  if (salePickerListRoot && app.salePickerLoading) {
    salePickerListRoot.innerHTML = '<p class="sale-picker-empty">Carregando produtos...</p>';
    if (salePickerConfirmButton) salePickerConfirmButton.disabled = true;
    return;
  }
  if (salePickerListRoot && app.salePickerError) {
    salePickerListRoot.innerHTML = `
      <div class="sale-picker-empty">
        <p>Nao foi possivel carregar os produtos.</p>
        <button type="button" class="ghost-action" data-retry-sale-products>Tentar novamente</button>
      </div>
    `;
    if (salePickerConfirmButton) salePickerConfirmButton.disabled = true;
    return;
  }
  const selectedIds = selectedSaleProductIds();
  const rows = salePickerProducts();
  if (salePickerListRoot) {
    salePickerListRoot.innerHTML = rows.length ? rows.map((product) => {
      const id = String(product.id);
      const alreadySelected = selectedIds.has(id);
      const pending = app.salePickerSelected.has(id);
      const checked = alreadySelected || pending;
      const disabled = toNumber(product.estoque) <= 0;
      return `
        <button class="sale-picker-product ${checked ? "selected" : ""}" type="button" data-sale-picker-product="${escapeHtml(id)}" ${disabled ? "disabled" : ""}>
          <img src="${escapeHtml(productImage(product))}" alt="${escapeHtml(product.nome || "Produto")}" loading="lazy" decoding="async" onerror="this.src='./assets/fumacinha-logo.png'" />
          <span>
            <strong>${escapeHtml(product.nome || "Produto")}</strong>
            <small>${escapeHtml(product.categoria || "Produto")} • Estoque: ${toNumber(product.estoque)}</small>
          </span>
          <b>${currency.format(toNumber(product.preco))}</b>
          <i>${disabled ? "Sem estoque" : checked ? "✓" : "+"}</i>
        </button>
      `;
    }).join("") : '<p class="sale-picker-empty">Nenhum produto encontrado.</p>';
    salePickerListRoot.querySelectorAll(".sale-picker-product").forEach((button, index) => {
      const product = rows[index];
      const checked = selectedIds.has(String(product.id)) || app.salePickerSelected.has(String(product.id));
      const disabled = toNumber(product.estoque) <= 0;
      const meta = button.querySelector("small");
      const marker = button.querySelector("i");
      if (meta) meta.textContent = `${product.categoria || "Produto"} \u2022 Estoque: ${toNumber(product.estoque)}`;
      if (marker) marker.textContent = disabled ? "Sem estoque" : checked ? "\u2713" : "+";
    });
  }
  if (salePickerConfirmButton) salePickerConfirmButton.disabled = app.salePickerSelected.size === 0;
}

async function openSaleProductPicker() {
  app.salePickerSearch = app.saleProductSearch || "";
  app.salePickerCategory = app.saleProductCategory || "all";
  app.salePickerSelected = new Set();
  saleProductSheet?.classList.add("open");
  saleProductSheet?.setAttribute("aria-hidden", "false");
  document.body.classList.add("sheet-open");
  if (!app.products.length || app.productsError) {
    app.salePickerLoading = true;
    app.salePickerError = "";
    renderSaleProductPicker();
    try {
      await loadProductsFromSupabase({ silent: true });
    } catch (error) {
      app.salePickerError = error.message || "Erro ao carregar produtos.";
      showToast("Nao foi possivel carregar os produtos.", "error");
    } finally {
      app.salePickerLoading = false;
    }
  }
  renderSaleProductPicker();
  window.setTimeout(() => salePickerSearchInput?.focus(), 60);
}

function closeSaleProductPicker() {
  saleProductSheet?.classList.remove("open");
  saleProductSheet?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("sheet-open");
  app.salePickerSelected = new Set();
}

function addProductToSale(productId) {
  const product = app.products.find((item) => String(item.id) === String(productId));
  if (!product || !isProductAvailable(product)) return false;
  const existing = $$(".sale-item").find((row) => String(row.querySelector('[name="produto_id"]')?.value) === String(productId));
  if (existing) {
    const quantityInput = existing.querySelector('[name="quantidade"]');
    const current = toNumber(quantityInput?.value || 1);
    const stock = Math.max(1, toNumber(product.estoque));
    if (quantityInput) quantityInput.value = String(Math.min(stock, current + 1));
    updateSaleItemPrices();
    updateSaleTotal();
    return true;
  }
  saleItemsRoot?.insertAdjacentHTML("beforeend", saleItemTemplate({ product, produto_id: product.id, valor_unitario: product.preco, quantidade: 1 }));
  updateSaleItemPrices();
  updateSaleTotal();
  return true;
}

function confirmSaleProductPicker() {
  const ids = [...app.salePickerSelected];
  if (!ids.length) return;
  ids.forEach(addProductToSale);
  closeSaleProductPicker();
  updateSaleTotal();
}

function saleItemTemplate(item = {}) {
  const firstProduct = item.product || app.products.find((product) => String(product.id) === String(item.produto_id)) || firstAvailableProduct();
  return `
    <article class="sale-item">
      <div class="sale-product-preview" data-sale-product-preview>
        <img src="${escapeHtml(productImage(firstProduct))}" alt="${escapeHtml(firstProduct?.nome || "Produto")}" loading="lazy" decoding="async" onerror="this.src='./assets/fumacinha-logo.png'" />
        <div>
          <strong>${escapeHtml(firstProduct?.nome || "Selecionar produto")}</strong>
          <span>${escapeHtml(firstProduct?.categoria || "Produto")}</span>
        </div>
      </div>
      <button class="ghost-action sale-remove-icon" type="button" data-remove-sale-item aria-label="Remover produto"></button>
      <label>Produto <select name="produto_id">${productOptions(firstProduct?.id || "")}</select></label>
      <label class="sale-quantity-field">
        <span>Qtd</span>
        <span class="sale-quantity-control">
          <button type="button" data-sale-quantity-step="-1" aria-label="Diminuir quantidade">-</button>
          <input type="number" name="quantidade" min="1" step="1" value="${toNumber(item.quantidade || 1)}" />
          <button type="button" data-sale-quantity-step="1" aria-label="Aumentar quantidade">+</button>
        </span>
      </label>
      <label class="sale-unit-field">Valor unitario <input type="number" name="valor_unitario" min="0" step="0.01" value="${item.valor_unitario !== undefined ? toNumber(item.valor_unitario).toFixed(2) : ""}" readonly /></label>
      <div class="sale-unit-value"><strong data-item-unit>R$ 0,00</strong><span>cada</span></div>
      <div class="sale-line-total"><span>Subtotal</span><strong data-item-subtotal>R$ 0,00</strong></div>
    </article>
  `;
}

function renderSaleItems() {
  if (!saleItemsRoot) return;
  updateSaleItemPrices();
  updateSaleTotal();
}

function updateSaleItemPrices() {
  updateSaleProductFilterStatus();
  $$(".sale-item").forEach((row) => {
    const select = row.querySelector('[name="produto_id"]');
    const price = row.querySelector('[name="valor_unitario"]');
    const previousProductId = String(select?.value || "");
    let product = app.products.find((item) => String(item.id) === previousProductId);
    if (select) {
      select.innerHTML = productOptions(select.value);
      product = app.products.find((item) => String(item.id) === String(select.value));
    }
    const quantityInput = row.querySelector('[name="quantidade"]');
    if (quantityInput && product) quantityInput.max = Math.max(1, toNumber(product.estoque));
    if (product && price && (!price.value || String(product.id) !== previousProductId)) price.value = toNumber(product.preco).toFixed(2);
    if (!product && price) price.value = "";
    updateSaleItemPreview(row, product);
  });
}

function updateSaleItemPreview(row, product) {
  const quantity = toNumber(row.querySelector('[name="quantidade"]')?.value);
  const unitValue = parseMoney(row.querySelector('[name="valor_unitario"]')?.value);
  const subtotal = row.querySelector("[data-item-subtotal]");
  const unit = row.querySelector("[data-item-unit]");
  const preview = row.querySelector("[data-sale-product-preview]");
  if (subtotal) subtotal.textContent = currency.format(quantity * unitValue);
  if (unit) unit.textContent = currency.format(unitValue);
  if (!preview) return;
  preview.innerHTML = `
    <img src="${escapeHtml(productImage(product))}" alt="${escapeHtml(product?.nome || "Produto")}" loading="lazy" decoding="async" onerror="this.src='./assets/fumacinha-logo.png'" />
    <div>
      <strong>${escapeHtml(product?.nome || "Selecionar produto")}</strong>
      <span>${escapeHtml(product?.categoria || "Produto")} | Estoque: ${toNumber(product?.estoque || 0)}</span>
    </div>
  `;
}

function currentProductTotal() {
  const discount = parseMoney(saleForm?.elements.desconto?.value);
  const subtotal = $$(".sale-item").reduce((sum, row) => {
    return sum + toNumber(row.querySelector('[name="quantidade"]')?.value) * parseMoney(row.querySelector('[name="valor_unitario"]')?.value);
  }, 0);
  return Math.max(0, subtotal - discount);
}

function currentSaleDraft() {
  const productsValue = currentProductTotal();
  const payment = saleForm?.elements.forma_pagamento?.value || "Pix";
  const split = saleForm?.elements.pagamento_dividido?.checked || false;
  const splitPayments = split ? splitPaymentsFromForm() : [];
  const paymentLabel = split && splitPayments.length ? paymentBreakdownLabel(splitPayments) : payment;
  const cardServiceFee = cardServiceFeeForPayment(payment, splitPayments);
  const cash = split ? splitPayments.some((row) => isCashPayment(row.forma)) : isCashPayment(payment);
  const hasChange = saleForm?.elements.teve_troco?.value === "sim";
  const paidInput = saleForm?.elements.valor_recebido;
  const changeInput = saleForm?.elements.troco;
  const deliveryInput = saleForm?.elements.taxa_entrega;
  if (paidInput && !split && !app.saleReceivedTouched && productsValue > 0) {
    paidInput.value = (productsValue + cardServiceFee).toFixed(2).replace(".", ",");
  }
  const paidValue = split ? splitPayments.reduce((sum, row) => sum + row.valor, 0) : parseMoney(paidInput?.value);
  const changeValue = cash && hasChange ? parseMoney(changeInput?.value) : 0;
  const deliveryValue = paidValue - productsValue - changeValue - cardServiceFee;
  const totalSale = productsValue + Math.max(0, deliveryValue) + cardServiceFee;
  return {
    productsValue,
    payment,
    paymentLabel,
    split,
    splitPayments,
    cash,
    hasChange,
    paidValue,
    changeValue,
    cardServiceFee,
    deliveryValue,
    totalSale,
    routeDate: saleForm?.elements.data_entrega?.value || localDateValue(),
    routeTime: saleForm?.elements.horario_rota?.value || "11:00",
  };
}

function updateSaleTotal() {
  $$(".sale-item").forEach((row) => {
    const product = app.products.find((item) => String(item.id) === String(row.querySelector('[name="produto_id"]')?.value));
    updateSaleItemPreview(row, product);
  });

  const draft = currentSaleDraft();
  const deliveryInput = saleForm?.elements.taxa_entrega;
  const changeInput = saleForm?.elements.troco;
  const paidInput = saleForm?.elements.valor_recebido;
  if (paidInput) {
    paidInput.readOnly = draft.split;
    if (draft.split) paidInput.value = draft.paidValue.toFixed(2).replace(".", ",");
  }
  const splitFields = $("[data-split-payment-fields]");
  splitFields?.classList.toggle("hidden", !draft.split);
  if (deliveryInput) {
    deliveryInput.readOnly = true;
    if (draft.cash) deliveryInput.value = Math.max(0, draft.deliveryValue).toFixed(2).replace(".", ",");
    else deliveryInput.value = Math.max(0, draft.deliveryValue).toFixed(2).replace(".", ",");
  }
  if (changeInput && !draft.hasChange) changeInput.value = "";
  const commission = draft.split
    ? { total: COMMISSION_BASE + (draft.splitPayments.some((payment) => isCardPayment(payment.forma)) ? COMMISSION_CARD_EXTRA : 0) }
    : commissionForPayment(draft.payment);
  const minimumPaidValue = draft.productsValue + draft.cardServiceFee;
  const receivedInvalid = app.saleReceivedTouched && draft.paidValue < minimumPaidValue;
  const changeInvalid = draft.cash && draft.hasChange && (!String(changeInput?.value || "").trim() || draft.changeValue < 0);
  const deliveryInvalid = draft.deliveryValue < 0;

  setAllText("[data-sale-products]", currency.format(draft.productsValue));
  setAllText("[data-sale-received]", currency.format(draft.paidValue));
  setAllText("[data-sale-delivery]", currency.format(Math.max(0, draft.deliveryValue)));
  setAllText("[data-sale-net-products]", currency.format(draft.productsValue));
  setAllText("[data-sale-change]", currency.format(draft.changeValue));
  setAllText("[data-sale-payment]", draft.paymentLabel || draft.payment);
  setAllText("[data-sale-commission]", currency.format(commission.total));
  setAllText("[data-sale-route-summary]", draft.routeTime);
  setAllText("[data-sale-route-current]", draft.routeTime || "Selecionar");
  $$("[data-sale-route-toggle]").forEach((button) => {
    button.setAttribute("aria-label", `Horario da rota, ${draft.routeTime || "selecionar"}`);
  });
  setAllText("[data-sale-grand-total], [data-sale-footer-total]", currency.format(draft.totalSale));
  setAllText("[data-sale-items-count]", `${$$(".sale-item").length} ${$$(".sale-item").length === 1 ? "item" : "itens"}`);
  renderSaleProductState();
  $$("[data-sale-route-option]").forEach((button) => {
    button.classList.toggle("active", button.dataset.saleRouteOption === draft.routeTime);
  });
  $$("[data-sale-cash-only]").forEach((element) => element.classList.toggle("hidden", !draft.cash));
  $$("[data-sale-change-field]").forEach((element) => element.classList.toggle("hidden", !draft.cash || !draft.hasChange));
  if (saleWarning) {
    saleWarning.textContent = receivedInvalid
      ? draft.cardServiceFee > 0
        ? "Valor pago menor que produtos + R$ 1,00 da taxa do cartao."
        : "Valor pago menor que o valor dos produtos."
      : changeInvalid
        ? "Informe o valor do troco entregue."
        : deliveryInvalid
          ? "A taxa de entrega ficou negativa. Corrija o valor pago ou o troco."
          : "";
    saleWarning.className = `form-status ${receivedInvalid || changeInvalid || deliveryInvalid ? "error" : ""}`.trim();
  }
}

function collectSaleItems({ allowEditing = false } = {}) {
  const rows = $$(".sale-item");
  const items = rows.map((row) => {
    const product = app.products.find((item) => String(item.id) === String(row.querySelector('[name="produto_id"]')?.value));
    const quantity = toNumber(row.querySelector('[name="quantidade"]')?.value);
    const unitValue = parseMoney(row.querySelector('[name="valor_unitario"]')?.value);
    if (!product || quantity <= 0 || unitValue <= 0) throw new Error("Revise os produtos da venda.");
    if (!allowEditing && !isProductAvailable(product)) throw new Error(`${product.nome} esta sem estoque para novas vendas.`);
    return { product, quantity, unitValue };
  });
  const totals = new Map();
  items.forEach((item) => {
    const key = String(item.product.id);
    totals.set(key, (totals.get(key) || 0) + item.quantity);
  });
  if (!allowEditing) {
    totals.forEach((quantity, productId) => {
      const product = app.products.find((item) => String(item.id) === productId);
      if (quantity > toNumber(product?.estoque)) throw new Error(`Estoque insuficiente para ${product?.nome || "produto"}.`);
    });
  }
  return items;
}

async function insertStockMove(product, previous, next, type, saleId = null) {
  const usuarioId = await requireUserId();
  const payload = {
    produto_id: String(product.id),
    nome_produto: product.nome,
    quantidade_anterior: previous,
    quantidade_nova: next,
    diferenca: next - previous,
    tipo: type,
    venda_id: saleId,
    usuario_id: usuarioId,
  };
  return supabaseClient.from(TABLES.stockMoves).insert(payload);
}

async function updateProductStock(product, nextStock, type = "ajuste manual", saleId = null) {
  const previous = toNumber(product.estoque);
  const next = Math.max(0, Number(nextStock));
  const { error } = await supabaseClient.from(TABLES.products).update({ estoque: next, ativo: next > 0 }).eq("id", product.id);
  if (error) throw error;
  await insertStockMove(product, previous, next, type, saleId);
  product.estoque = next;
  product.ativo = next > 0;
}

async function getOrCreatePerson(tableName, rows, name) {
  const cleanName = String(name || "").trim();
  if (!cleanName) return null;
  const existing = rows.find((item) => item.nome?.toLowerCase() === cleanName.toLowerCase());
  if (existing) return existing;
  const { data, error } = await supabaseClient.from(tableName).insert({ nome: cleanName, ativo: true }).select("*").single();
  if (error) throw error;
  rows.push(data);
  return data;
}

function saleItemPayload(items) {
  return items.map((item) => ({
    produto_id: String(item.product.id),
    nome_produto: item.product.nome,
    quantidade: item.quantity,
    valor_unitario: item.unitValue,
    valor_total: item.quantity * item.unitValue,
    custo_unitario: productCost(item.product),
    custo_total: item.quantity * productCost(item.product),
  }));
}

function buildSalePayload(items, seller, deliverer) {
  const discount = parseMoney(saleForm.elements.desconto.value);
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitValue, 0);
  const draft = currentSaleDraft();
  const paymentChecked = saleForm.elements.pagamento_conferido?.value || "";
  setPaymentCheckMessage("");
  if (!paymentChecked) throw new Error("Campo obrigatorio: responda se conferiu o pagamento.");
  if (paymentChecked !== "sim") throw new Error("Confira a forma de pagamento antes de registrar a venda.");
  const productsValue = Math.max(0, subtotal - discount);
  if (Math.abs(productsValue - draft.productsValue) > 0.01) throw new Error("Revise os valores da venda.");
  if (draft.split && draft.splitPayments.length < 2) throw new Error("Informe as duas formas de pagamento dividido.");
  if (draft.paidValue < draft.productsValue + draft.cardServiceFee) {
    throw new Error(draft.cardServiceFee > 0 ? "Valor pago menor que produtos + R$ 1,00 da taxa do cartao." : "Valor pago menor que o valor dos produtos.");
  }
  if (draft.cash && draft.hasChange && !String(saleForm.elements.troco.value || "").trim()) throw new Error("Informe o valor do troco entregue.");
  if (draft.cash && draft.changeValue < 0) throw new Error("Troco nao pode ser negativo.");
  if (draft.deliveryValue < 0) throw new Error("A taxa de entrega ficou negativa.");
  const deliveryValue = Math.max(0, draft.deliveryValue);
  const totalSale = draft.productsValue + deliveryValue + draft.cardServiceFee;
  const paymentLabel = draft.paymentLabel || draft.payment;
  const deliveredValue = draft.paidValue;
  const changeValue = draft.cash && draft.hasChange ? draft.changeValue : 0;
  const commission = draft.split
    ? {
      base: COMMISSION_BASE,
      card: draft.splitPayments.some((payment) => isCardPayment(payment.forma)) ? COMMISSION_CARD_EXTRA : 0,
      total: COMMISSION_BASE + (draft.splitPayments.some((payment) => isCardPayment(payment.forma)) ? COMMISSION_CARD_EXTRA : 0),
    }
    : commissionForPayment(paymentLabel);
  const observation = [
    saleForm.elements.observacao.value.trim(),
    draft.split ? `PAGAMENTOS_JSON:${JSON.stringify(draft.splitPayments)}` : "",
  ].filter(Boolean).join("\n");
  const cost = items.reduce((sum, item) => sum + item.quantity * productCost(item.product), 0);
  const quantityTotal = items.reduce((sum, item) => sum + item.quantity, 0);
  const first = items[0];
  const routeDateTime = routeIso(draft.routeDate, draft.routeTime);
  return {
    draft,
    totalSale,
    productsValue,
    deliveryValue,
    deliveredValue,
    paymentLabel,
    payload: {
      produto_id: String(first.product.id),
      nome_produto: first.product.nome,
      quantidade: quantityTotal,
      quantidade_total: quantityTotal,
      valor_unitario: first.unitValue,
      valor_total: productsValue,
      valor_produtos: productsValue,
      total_venda: totalSale,
      valor_recebido: totalSale,
      valor_pago_cliente: deliveredValue,
      valor_entregue: deliveredValue,
      teve_troco: draft.cash && draft.hasChange,
      troco: changeValue,
      taxa_entrega: deliveryValue,
      desconto: discount,
      forma_pagamento: paymentLabel,
      entregador_id: deliverer?.id || null,
      entregador_nome: deliverer?.nome || "",
      vendedora_id: seller.id,
      vendedora_nome: seller.nome,
      comissao_base: commission.base,
      comissao_cartao: commission.card,
      comissao_total: commission.total,
      cliente_nome: saleForm.elements.cliente.value.trim(),
      observacao: observation,
      data_entrega: draft.routeDate,
      horario_rota: draft.routeTime,
      rota_data_hora: routeDateTime,
      status_entrega: saleForm.elements.status_entrega?.value || "Aguardando",
      status: "concluida",
      custo_unitario: productCost(first.product),
      custo_total: cost,
      cancelada: false,
      usuario_id: app.user?.id || null,
    },
  };
}

function resetSaleForm() {
  const preservedProductSearch = app.saleProductSearch;
  const preservedProductCategory = app.saleProductCategory;
  app.editingSaleId = null;
  app.editingOrderId = null;
  app.confirmingOrderId = null;
  saleForm.reset();
  setPaymentCheckMessage("");
  if (saleConfirmationTimer) window.clearTimeout(saleConfirmationTimer);
  saleSubmit?.classList.remove("sale-confirmed");
  app.saleProductSearch = preservedProductSearch;
  app.saleProductCategory = preservedProductCategory;
  renderSaleProductFilters();
  saleForm.elements.desconto.value = "0";
  saleForm.elements.valor_recebido.value = "";
  saleForm.elements.troco.value = "";
  saleForm.elements.teve_troco.value = "nao";
  saleForm.elements.taxa_entrega.value = "";
  if (saleForm.elements.pagamento_conferido) saleForm.elements.pagamento_conferido.value = "";
  setSplitPaymentFields([]);
  saleForm.elements.motivo_alteracao.value = "";
  if (saleForm.elements.bairro) saleForm.elements.bairro.value = "";
  if (saleForm.elements.telefone) saleForm.elements.telefone.value = "";
  if (saleForm.elements.status_entrega) saleForm.elements.status_entrega.value = "Aguardando";
  app.deliveryManuallyEdited = false;
  app.saleReceivedTouched = false;
  setSuggestedDeliveryRoute();
  saleItemsRoot.innerHTML = "";
  renderPeopleOptions();
  saleEditBanner?.classList.add("hidden");
  saleEditMotive?.classList.add("hidden");
  confirmEditedOrderButton?.classList.add("hidden");
  saleSubmit?.classList.remove("hidden");
  if (saleEditTitle) saleEditTitle.textContent = "Editando venda";
  if (saleSubmit) saleSubmit.textContent = "Registrar venda";
  updateSaleItemPrices();
  updateSaleTotal();
}

function loadSaleForEdit(saleId) {
  const sale = app.sales.find((item) => String(item.id) === String(saleId));
  if (!sale || sale.cancelada) return setStatus("Venda cancelada nao pode ser editada.", "error");
  const items = app.saleItems.filter((item) => String(item.venda_id) === String(saleId));
  if (!items.length) return setStatus("Venda sem itens para editar.", "error");
  app.editingSaleId = sale.id;
  switchTab("sales");
  saleItemsRoot.innerHTML = items.map((item) => saleItemTemplate(item)).join("");
  saleForm.elements.desconto.value = toNumber(sale.desconto).toFixed(2);
  const breakdown = salePaymentBreakdown(sale);
  saleForm.elements.forma_pagamento.value = breakdown[0]?.forma || sale.forma_pagamento || "Pix";
  if (saleForm.elements.pagamento_conferido) saleForm.elements.pagamento_conferido.value = "";
  setSplitPaymentFields(breakdown);
  renderPeopleOptions();
  saleForm.elements.vendedora_id.value = sale.vendedora_id || "";
  saleForm.elements.entregador_id.value = sale.entregador_id || "";
  saleForm.elements.valor_recebido.value = saleDeliveredValue(sale).toFixed(2).replace(".", ",");
  saleForm.elements.teve_troco.value = sale.teve_troco || saleChangeValue(sale) > 0 ? "sim" : "nao";
  saleForm.elements.troco.value = saleChangeValue(sale).toFixed(2).replace(".", ",");
  saleForm.elements.data_entrega.value = saleRouteDate(sale);
  saleForm.elements.horario_rota.value = saleRouteTime(sale) || "11:00";
  saleForm.elements.cliente.value = sale.cliente_nome || "";
  if (saleForm.elements.bairro) saleForm.elements.bairro.value = sale.cliente_bairro || "";
  if (saleForm.elements.telefone) saleForm.elements.telefone.value = sale.cliente_telefone || "";
  if (saleForm.elements.status_entrega) saleForm.elements.status_entrega.value = sale.status_entrega || "Aguardando";
  saleForm.elements.observacao.value = stripPaymentBreakdownText(sale.observacao || "");
  saleForm.elements.motivo_alteracao.value = "";
  saleEditBanner?.classList.remove("hidden");
  saleEditMotive?.classList.remove("hidden");
  confirmEditedOrderButton?.classList.add("hidden");
  saleSubmit?.classList.remove("hidden");
  if (saleEditTitle) saleEditTitle.textContent = "Editando venda";
  if (saleEditLabel) saleEditLabel.textContent = `Venda #${sale.id}`;
  if (saleSubmit) saleSubmit.textContent = "Salvar alteracoes";
  app.saleReceivedTouched = true;
  updateSaleItemPrices();
  updateSaleTotal();
  saleForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function registerSale(event) {
  event.preventDefault();
  if (app.saleSaving) return;
  const rows = $$(".sale-item");
  if (!rows.length) return;
  const confirmingOrderId = app.confirmingOrderId;
  let reservedOrderId = null;
  let saleCreated = false;
  let showConfirmedButton = false;
  app.saleSaving = true;
  if (saleSubmit) {
    saleSubmit.disabled = true;
    saleSubmit.textContent = confirmingOrderId ? "Confirmando pedido..." : "Registrando venda...";
  }
  if (confirmingOrderId && confirmEditedOrderButton) {
    confirmEditedOrderButton.disabled = true;
    confirmEditedOrderButton.textContent = "Confirmando pedido...";
  }
  if (saleSuccess) saleSuccess.textContent = "";
  setPaymentCheckMessage("");
  setStatus(confirmingOrderId ? "Confirmando pedido..." : "Registrando venda...", "loading");
  try {
    const usuarioId = await requireUserId();
    const seller = app.sellers.find((item) => String(item.id) === String(saleForm.elements.vendedora_id.value));
    if (!seller) throw new Error("Informe a vendedora.");
    const deliverer = app.deliverers.find((item) => String(item.id) === String(saleForm.elements.entregador_id.value)) || null;
    const items = collectSaleItems();
    const { payload: salePayload, totalSale, productsValue, deliveredValue, deliveryValue, paymentLabel, draft } = buildSalePayload(items, seller, deliverer);
    salePayload.usuario_id = usuarioId;
    if (confirmingOrderId) {
      const { data: reservedOrder, error: reserveError } = await supabaseClient
        .from(TABLES.orders)
        .update({ status: "Em separacao", updated_at: new Date().toISOString() })
        .eq("id", confirmingOrderId)
        .eq("status", "Aguardando confirmacao")
        .select("id")
        .single();
      if (reserveError || !reservedOrder) throw new Error("Esse pedido ja foi confirmado ou cancelado.");
      reservedOrderId = reservedOrder.id;
    }
    const { data: sale, error: saleError } = await supabaseClient.rpc("registrar_venda_troco", {
      p_venda: salePayload,
      p_itens: saleItemPayload(items),
    });
    if (saleError) throw saleError;
    saleCreated = true;
    if (confirmingOrderId) {
      const { error: orderUpdateError } = await supabaseClient
        .from(TABLES.orders)
        .update({
          status: "Confirmado",
          venda_id: sale?.id || null,
          confirmado_em: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", confirmingOrderId)
        .eq("status", "Em separacao");
      if (orderUpdateError) throw orderUpdateError;
    }
    localStorage.setItem(LAST_SELLER_KEY, String(seller.id));
    if (deliverer) localStorage.setItem(LAST_DELIVERER_KEY, String(deliverer.id));
    else localStorage.removeItem(LAST_DELIVERER_KEY);
    await loadAll();
    resetSaleForm();
    if (confirmingOrderId) {
      switchTab("history");
      renderSalesHistory();
      salesHistory?.closest(".panel-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const registeredAt = new Date(sale?.created_at || Date.now()).toLocaleString("pt-BR");
    const successMessage = confirmingOrderId
      ? `Pedido confirmado e venda registrada com sucesso. Valor produtos ${currency.format(productsValue)} | Valor pago ${currency.format(deliveredValue)} | Taxa ${currency.format(deliveryValue)} | ${paymentLabel} | Rota ${draft.routeTime} | Registrada em ${registeredAt}.`
      : `Venda registrada com sucesso. Valor produtos ${currency.format(productsValue)} | Valor pago ${currency.format(deliveredValue)} | Taxa ${currency.format(deliveryValue)} | ${paymentLabel} | Rota ${draft.routeTime} | Registrada em ${registeredAt}.`;
    setStatus(successMessage, "success");
    if (saleSuccess) {
      saleSuccess.textContent = successMessage;
      saleSuccess.className = "form-status success";
      window.setTimeout(() => {
        saleSuccess.textContent = "";
      }, 8000);
    }
    showConfirmedButton = true;
  } catch (error) {
    if (reservedOrderId && !saleCreated) {
      await supabaseClient
        .from(TABLES.orders)
        .update({ status: "Aguardando confirmacao", updated_at: new Date().toISOString() })
        .eq("id", reservedOrderId)
        .eq("status", "Em separacao");
    }
    const message = error.message || "Erro ao registrar venda.";
    if (isPaymentCheckError(error)) {
      setStatus("", "");
      setPaymentCheckMessage(message, "error");
    } else {
      setStatus(message, "error");
    }
  } finally {
    app.saleSaving = false;
    if (saleSubmit) {
      if (showConfirmedButton) {
        showSaleConfirmedFeedback();
      } else {
        saleSubmit.classList.remove("sale-confirmed");
        saleSubmit.disabled = false;
        saleSubmit.textContent = saleSubmitIdleLabel();
      }
    }
    if (confirmEditedOrderButton) {
      confirmEditedOrderButton.disabled = false;
      confirmEditedOrderButton.textContent = "Confirmar pedido";
    }
  }
}

async function updateEditedSale(event) {
  event.preventDefault();
  if (app.saleSaving || !app.editingSaleId) return;
  const sale = app.sales.find((item) => String(item.id) === String(app.editingSaleId));
  if (!sale || sale.cancelada) return setStatus("Venda cancelada nao pode ser editada.", "error");
  const motive = saleForm.elements.motivo_alteracao.value.trim() || "Ajuste manual da venda";
  app.saleSaving = true;
  if (saleSubmit) {
    saleSubmit.disabled = true;
    saleSubmit.textContent = "Salvando alteracoes...";
  }
  if (saleWarning) {
    saleWarning.textContent = "";
    saleWarning.className = "form-status";
  }
  if (saleSuccess) {
    saleSuccess.textContent = "";
    saleSuccess.className = "form-status";
  }
  setPaymentCheckMessage("");
  setStatus("Salvando alteracoes...", "loading");
  try {
    const usuarioId = await requireUserId();
    const seller = app.sellers.find((item) => String(item.id) === String(saleForm.elements.vendedora_id.value));
    if (!seller) throw new Error("Informe a vendedora.");
    const deliverer = app.deliverers.find((item) => String(item.id) === String(saleForm.elements.entregador_id.value)) || null;
    const items = collectSaleItems({ allowEditing: true });
    const { payload, totalSale, productsValue, deliveredValue, deliveryValue, paymentLabel, draft } = buildSalePayload(items, seller, deliverer);
    payload.usuario_id = usuarioId;
    if (!window.confirm(`Salvar alteracoes da venda #${app.editingSaleId}?`)) return;
    const { error } = await supabaseClient.rpc("editar_venda_estoque", {
      p_venda_id: Number(app.editingSaleId),
      p_venda: payload,
      p_itens: saleItemPayload(items),
      p_motivo: motive,
    });
    if (error) throw error;
    await loadAll();
    resetSaleForm();
    const successMessage = `Venda atualizada com sucesso. Valor produtos ${currency.format(productsValue)} | Valor pago ${currency.format(deliveredValue)} | Taxa ${currency.format(deliveryValue)} | ${paymentLabel} | Rota ${draft.routeTime}.`;
    setStatus(successMessage, "success");
    if (saleSuccess) {
      saleSuccess.textContent = successMessage;
      saleSuccess.className = "form-status success";
      window.setTimeout(() => {
        saleSuccess.textContent = "";
      }, 8000);
    }
  } catch (error) {
    const message = error.message || "Erro ao editar venda.";
    if (isPaymentCheckError(error)) {
      setStatus("", "");
      setPaymentCheckMessage(message, "error");
    } else {
      setStatus(message, "error");
    }
    if (saleWarning && !isPaymentCheckError(error)) {
      saleWarning.textContent = message;
      saleWarning.className = "form-status error";
    }
  } finally {
    app.saleSaving = false;
    if (saleSubmit) {
      saleSubmit.disabled = false;
      saleSubmit.textContent = saleSubmitIdleLabel();
    }
  }
}

function saveSale(event) {
  if (app.editingOrderId) {
    event.preventDefault();
    return confirmEditedOrder();
  }
  return app.editingSaleId ? updateEditedSale(event) : registerSale(event);
}

async function cancelSale(saleId) {
  const sale = app.sales.find((item) => String(item.id) === String(saleId));
  if (!sale || sale.cancelada) return;
  setStatus("Cancelando venda...", "loading");
  try {
    await requireUserId();
    const { error } = await supabaseClient.rpc("cancelar_venda_troco", {
      p_venda_id: Number(sale.id),
      p_observacao: "Cancelamento pelo painel",
    });
    if (error) throw error;
    await supabaseClient
      .from(TABLES.orders)
      .update({
        status: "Cancelado",
        motivo_cancelamento: "Venda cancelada pelo painel",
        cancelado_em: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("venda_id", sale.id);
    setStatus("Venda cancelada e estoque devolvido.", "success");
    await loadAll();
  } catch (error) {
    setStatus(error.message || "Erro ao cancelar venda.", "error");
  }
}

function normalizeOrderStatus(status = "") {
  return String(status || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function pendingOrders() {
  return app.orders.filter((order) => normalizeOrderStatus(order.status) === "aguardando confirmacao");
}

function orderItems(orderId) {
  return app.orderItems.filter((item) => String(item.pedido_id) === String(orderId));
}

function saleItemsForSale(saleId) {
  return app.saleItems.filter((item) => String(item.venda_id) === String(saleId));
}

function saleHistoryProducts(sale) {
  const items = saleItemsForSale(sale.id);
  if (!items.length) {
    return {
      title: sale.nome_produto || "Venda",
      quantity: toNumber(sale.quantidade || 1),
    };
  }

  return {
    title: items.map((item) => `${toNumber(item.quantidade)}x ${item.nome_produto || "Produto"}`).join(" | "),
    quantity: items.reduce((sum, item) => sum + toNumber(item.quantidade), 0),
  };
}

function splitPaymentsFromForm() {
  if (!saleForm?.elements.pagamento_dividido?.checked) return [];
  return [1, 2]
    .map((index) => ({
      forma: saleForm.elements[`pagamento_${index}_forma`]?.value || "Pix",
      valor: parseMoney(saleForm.elements[`pagamento_${index}_valor`]?.value),
    }))
    .filter((payment) => payment.valor > 0);
}

function paymentBreakdownLabel(payments) {
  return payments.map((payment) => `${payment.forma} ${currency.format(payment.valor)}`).join(" + ");
}

function paymentBreakdownFromText(text = "") {
  const observation = String(text || "");
  const match = observation.match(/PAGAMENTOS_JSON:([^\n]+)/);
  if (!match) return [];
  try {
    const rows = JSON.parse(match[1]);
    return Array.isArray(rows)
      ? rows
        .map((payment) => ({ forma: payment.forma || "Outros", valor: toNumber(payment.valor) }))
        .filter((payment) => payment.valor > 0)
      : [];
  } catch {
    return [];
  }
}

function stripPaymentBreakdownText(text = "") {
  return String(text || "")
    .split("\n")
    .filter((line) => !line.startsWith("PAGAMENTOS_JSON:"))
    .join("\n")
    .trim();
}

function salePaymentBreakdown(sale) {
  return paymentBreakdownFromText(sale?.observacao || "");
}

function setSplitPaymentFields(payments = []) {
  const split = payments.length >= 2;
  if (!saleForm) return;
  saleForm.elements.pagamento_dividido.checked = split;
  [1, 2].forEach((index) => {
    const payment = payments[index - 1] || {};
    if (saleForm.elements[`pagamento_${index}_forma`]) saleForm.elements[`pagamento_${index}_forma`].value = payment.forma || (index === 1 ? "Pix" : "Dinheiro");
    if (saleForm.elements[`pagamento_${index}_valor`]) saleForm.elements[`pagamento_${index}_valor`].value = payment.valor ? toNumber(payment.valor).toFixed(2).replace(".", ",") : "";
  });
}

function salePaymentMethods(sale) {
  const breakdown = salePaymentBreakdown(sale);
  return breakdown.length ? breakdown.map((payment) => payment.forma) : [sale.forma_pagamento || "Nao informado"];
}

function salePaymentValue(sale, method) {
  const breakdown = salePaymentBreakdown(sale);
  const normalized = normalizePayment(method);
  if (!breakdown.length) return normalizePayment(sale.forma_pagamento) === normalized ? saleTotal(sale) : 0;
  return breakdown
    .filter((payment) => normalizePayment(payment.forma) === normalized)
    .reduce((sum, payment) => sum + toNumber(payment.valor), 0);
}

function orderHistoryProducts(order) {
  const items = orderItems(order.id);
  if (!items.length) {
    return {
      title: order.codigo || "Pedido feito no site",
      quantity: 0,
    };
  }

  return {
    title: items.map((item) => `${toNumber(item.quantidade)}x ${item.produto_nome || "Produto"}`).join(" | "),
    quantity: items.reduce((sum, item) => sum + toNumber(item.quantidade), 0),
  };
}

function orderMatchesFilter(order) {
  const filter = app.orderStatusFilter;
  const status = normalizeOrderStatus(order.status);
  if (filter === "all") return true;
  if (filter === "pending") return status === "aguardando confirmacao";
  if (filter === "confirmed") return status === "confirmado";
  if (filter === "separation") return status === "em separacao";
  if (filter === "route") return status === "em rota";
  if (filter === "delivered") return status === "entregue";
  if (filter === "cancelled") return status === "cancelado";
  return true;
}

function saleMatchesStatusFilter(sale) {
  const filter = app.orderStatusFilter;
  const status = normalizeOrderStatus(sale.status_entrega || sale.status);
  if (filter === "all") return true;
  if (filter === "pending") return false;
  if (filter === "confirmed") return !sale.cancelada && normalizeOrderStatus(sale.status) === "concluida";
  if (filter === "separation") return false;
  if (filter === "route") return status === "em rota";
  if (filter === "delivered") return status === "entregue";
  if (filter === "cancelled") return sale.cancelada || status === "cancelado";
  return true;
}

function saleMatchesPeriod(sale) {
  const { start, end } = periodRange();
  const date = saleDate(sale);
  return date >= start && date <= end;
}

function orderStatusInfo(status = "") {
  const normalized = normalizeOrderStatus(status);
  if (normalized === "confirmado") {
    return { className: "status-confirmed", icon: "&#10003;", label: "Confirmado" };
  }
  if (normalized === "em rota") {
    return { className: "status-route", icon: "&#128666;", label: "Em rota" };
  }
  if (normalized === "entregue") {
    return { className: "status-delivered", icon: "&#10003;", label: "Entregue" };
  }
  if (normalized === "cancelado") {
    return { className: "status-cancelled", icon: "&#10005;", label: "Cancelado" };
  }
  return { className: "status-pending", icon: "&#128337;", label: "Aguardando confirmacao" };
}

function renderPendingOrderSummary() {
  if (!pendingSummary) return;
  const rows = pendingOrders();
  const total = rows.reduce((sum, order) => sum + toNumber(order.valor_produtos), 0);
  pendingSummary.innerHTML = `
    <section class="pending-orders-summary" aria-label="Resumo de pedidos pendentes">
      <article>
        <span>Total pendente</span>
        <strong>${rows.length} ${rows.length === 1 ? "pedido" : "pedidos"}</strong>
      </article>
      <article>
        <span>Valor total</span>
        <strong>${currency.format(total)}</strong>
      </article>
    </section>
  `;
}

function renderPendingOrders() {
  if (!pendingOrdersRoot) return;
  updatePendingBadges();
  if (salesStatusFilter) salesStatusFilter.value = app.orderStatusFilter;
  if (orderSearchInput) orderSearchInput.value = app.orderSearch;
  if (orderSortSelect) orderSortSelect.value = app.orderSort;
  const search = app.orderSearch.trim().toLowerCase();
  const rows = sortedOrders(ordersForCurrentStatusFilter()
    .filter((order) => !search || orderSearchText(order).includes(search)));
  pendingOrdersRoot.classList.add("pending-orders-list");
  pendingOrdersRoot.innerHTML = rows.length
    ? rows.map((order) => {
      const items = orderItems(order.id);
      const normalizedStatus = normalizeOrderStatus(order.status);
      const isPending = normalizedStatus === "aguardando confirmacao";
      const statusInfo = orderStatusInfo(order.status);
      const phoneUrl = orderWhatsappUrl(order);
      const createdAt = new Date(order.created_at || Date.now());
      const quantity = items.reduce((sum, item) => sum + toNumber(item.quantidade || 1), 0);
      const productText = items.map((item) => `${toNumber(item.quantidade || 1)}x ${escapeHtml(item.produto_nome || "Produto")}`).join(" | ") || "Sem itens";
      const phoneText = orderPhone(order) ? phoneDisplay(orderPhone(order)) : "Sem telefone";
      const value = currency.format(order.valor_produtos || 0);
      return `
        <article class="pending-order-card ${statusInfo.className}" data-order-row="${order.id}">
          <div class="pending-order-icon" aria-hidden="true">${statusInfo.icon}</div>
          <div class="pending-order-content">
            <header class="pending-order-card-head">
              <div class="pending-order-identity">
                <strong>${escapeHtml(order.codigo || `Pedido #${order.id}`)}</strong>
                <span>${escapeHtml(order.cliente_nome || "Cliente")}</span>
              </div>
              <div class="pending-order-value">
                <strong>${value}</strong>
                <span>${escapeHtml(order.origem || "Site")}</span>
              </div>
            </header>
            <span class="pending-order-status">${statusInfo.label}</span>
            <div class="pending-order-meta">
              <span>&#128197; ${createdAt.toLocaleDateString("pt-BR")}</span>
              <span>&#128338; ${createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
              <span>&#128230; ${quantity || items.length} ${(quantity || items.length) === 1 ? "item" : "itens"}</span>
              <span>&#128222; ${escapeHtml(phoneText)}</span>
            </div>
            <p class="pending-order-product">${productText}</p>
            ${order.data_entrega || order.horario_rota ? `<p class="pending-order-delivery">Entrega: ${escapeHtml(formatDateBR(order.data_entrega || localDateValue()))} as ${escapeHtml(order.horario_rota || "--:--")}</p>` : ""}
            ${order.motivo_cancelamento ? `<p class="pending-order-cancel-reason">Motivo: ${escapeHtml(order.motivo_cancelamento)}</p>` : ""}
            <div class="pending-order-actions">
              <button type="button" class="pending-order-button secondary" data-view-order="${order.id}">Ver detalhes</button>
              ${isPending ? `<button type="button" class="pending-order-button secondary" data-edit-order="${order.id}">Editar</button>` : ""}
              ${phoneUrl ? `<button type="button" class="pending-order-button whatsapp" data-open-order-whatsapp="${order.id}">WhatsApp</button>` : ""}
              ${isPending ? `<button type="button" class="pending-order-button danger" data-cancel-order="${order.id}">Cancelar</button>` : ""}
            </div>
          </div>
        </article>
      `;
    }).join("")
    : "<p>Nenhum pedido para este filtro.</p>";
  renderPendingOrderSummary();
}

function renderSalesHistory() {
  if (!salesHistory) return;
  updateHistoryPeriodOptions();
  if (historyPeriodSelect) historyPeriodSelect.value = app.historyPeriod;
  const cancelledToggle = $("[data-toggle-cancelled-history]");
  if (cancelledToggle) {
    cancelledToggle.innerHTML = `<span>Incluir canceladas</span><i aria-hidden="true"></i>`;
    cancelledToggle.classList.toggle("active", app.showCancelledHistory);
    cancelledToggle.setAttribute("aria-pressed", String(app.showCancelledHistory));
  }
  const sales = app.sales;
  const saleIds = new Set(sales.map((sale) => String(sale.id)));
  const confirmedSiteOrders = app.orders
    .filter((order) => isConfirmedOrder(order))
    .filter((order) => !order.venda_id || !saleIds.has(String(order.venda_id)));
  const rows = [
    ...sales.map((sale) => ({ type: "sale", date: saleDate(sale), sale })),
    ...confirmedSiteOrders.map((order) => ({ type: "order", date: orderHistoryDate(order), order })),
  ].sort((a, b) => b.date - a.date);
  const allRowsInPeriod = filterHistoryRowsByPeriod(rows);
  const filteredRows = allRowsInPeriod.filter((row) => !isHistoryRowCancelled(row));
  const cancelledRows = allRowsInPeriod.filter((row) => isHistoryRowCancelled(row));
  const groups = filteredRows.reduce((acc, row) => {
    const key = localDateValue(row.date);
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key).push(row);
    return acc;
  }, new Map());
  const summary = renderSalesHistoryPeriodSummary(filteredRows);
  const cancelledSection = app.showCancelledHistory ? renderCancelledHistorySection(cancelledRows) : "";

  salesHistory.innerHTML = filteredRows.length || cancelledSection
    ? `${summary}${filteredRows.length ? [...groups.entries()].map(([dateKey, groupRows]) => renderSalesHistoryDay(dateKey, groupRows)).join("") : "<p>Nenhuma venda confirmada neste periodo.</p>"}${cancelledSection}`
    : "<p>Nenhuma venda confirmada neste periodo.</p>";
}

function filterHistoryRowsByPeriod(rows) {
  const { start, end } = periodRange(app.historyPeriod);
  return rows.filter((row) => row.date >= start && row.date <= end);
}

function historyPeriodLabel() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const labels = {
    today: `Hoje, ${now.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}`,
    yesterday: `Ontem, ${yesterday.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}`,
    last7: "Ultimos 7 dias",
    month: monthLabel(monthKey()),
    lastMonth: monthLabel(monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1))),
    year: `Ano atual - ${now.getFullYear()}`,
    custom: "Personalizado",
  };
  return labels[app.historyPeriod] || monthLabel(monthKey());
}

function historyPeriodBadge() {
  const labels = {
    today: "Hoje",
    yesterday: "Ontem",
    last7: "7 dias",
    month: "Mes atual",
    lastMonth: "Mes passado",
    year: "Ano atual",
    custom: "Personalizado",
  };
  return labels[app.historyPeriod] || "Mes atual";
}

function updateHistoryPeriodOptions() {
  if (!historyPeriodSelect) return;
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const optionLabels = {
    today: "Hoje",
    yesterday: "Ontem",
    last7: "Ultimos 7 dias",
    month: `📅 ${monthLabel(monthKey())}`,
    lastMonth: monthLabel(monthKey(lastMonth)),
    year: `Ano atual - ${now.getFullYear()}`,
    custom: "Personalizado",
  };
  [...historyPeriodSelect.options].forEach((option) => {
    option.textContent = optionLabels[option.value] || option.textContent;
  });
}

function renderSalesHistoryPeriodSummary(rows) {
  const activeRows = rows.filter((row) => !isHistoryRowCancelled(row));
  const salesCount = activeRows.length;
  const revenue = activeRows.reduce((sum, row) => sum + historyRowRevenue(row), 0);
  const ticket = salesCount ? revenue / salesCount : 0;
  const completedCount = activeRows.length;
  return `
    <section class="history-period-summary">
      <div class="history-period-summary-head">
        <h3><span aria-hidden="true">📅</span> ${escapeHtml(historyPeriodLabel())}</h3>
        <span>${escapeHtml(historyPeriodBadge())}</span>
      </div>
      <div class="history-period-metrics">
        <article>
          <strong>${salesCount}</strong>
          <span>Vendas</span>
        </article>
        <article>
          <strong>${currency.format(revenue)}</strong>
          <span>Faturamento</span>
        </article>
        <article>
          <strong>${currency.format(ticket)}</strong>
          <span>Ticket medio</span>
        </article>
        <article>
          <strong>${completedCount}</strong>
          <span>Concluidas</span>
        </article>
      </div>
    </section>
  `;
}

function renderSalesHistoryDay(dateKey, rows) {
  const activeRows = rows.filter((row) => !isHistoryRowCancelled(row));
  const revenue = activeRows.reduce((sum, row) => sum + historyRowRevenue(row), 0);
  const salesCount = activeRows.length;
  const ticket = salesCount ? revenue / salesCount : 0;
  const title = historyDateTitle(dateKey);
  return `
    <section class="history-day-group">
      <header class="history-day-header">
        <div>
          <h3><span aria-hidden="true">📅</span> ${escapeHtml(title)}</h3>
        </div>
        <div class="history-day-summary">
          <strong>🛒 ${salesCount} ${salesCount === 1 ? "venda" : "vendas"}</strong>
          <span>💰 ${currency.format(revenue)}</span>
          <span>📈 Ticket ${currency.format(ticket)}</span>
        </div>
      </header>
      <div class="history-day-list">
        ${rows.map(renderSalesHistoryRow).join("")}
      </div>
    </section>
  `;
}

function renderCancelledHistorySection(rows) {
  if (!rows.length) {
    return `
      <section class="history-cancelled-section">
        <header class="history-cancelled-title">
          <h3>Vendas canceladas</h3>
          <span>Nenhuma venda cancelada neste periodo.</span>
        </header>
      </section>
    `;
  }
  const groups = rows.reduce((acc, row) => {
    const key = localDateValue(row.date);
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key).push(row);
    return acc;
  }, new Map());
  return `
    <section class="history-cancelled-section">
      <header class="history-cancelled-title">
        <h3>Vendas canceladas</h3>
        <span>${rows.length} ${rows.length === 1 ? "registro cancelado" : "registros cancelados"}</span>
      </header>
      ${[...groups.entries()].map(([dateKey, groupRows]) => renderCancelledHistoryDay(dateKey, groupRows)).join("")}
    </section>
  `;
}

function renderCancelledHistoryDay(dateKey, rows) {
  return `
    <section class="history-day-group history-cancelled-day">
      <header class="history-day-header">
        <div>
          <h3><span aria-hidden="true">📅</span> ${escapeHtml(historyDateTitle(dateKey))}</h3>
        </div>
        <div class="history-day-summary">
          <strong>${rows.length} ${rows.length === 1 ? "cancelada" : "canceladas"}</strong>
        </div>
      </header>
      <div class="history-day-list">
        ${rows.map(renderSalesHistoryRow).join("")}
      </div>
    </section>
  `;
}

function renderSalesHistoryRow(row) {
  if (row.type === "order") {
    const order = row.order;
    const products = orderHistoryProducts(order);
    const createdAt = orderHistoryDate(order);
    const firstItem = orderItems(order.id)[0] || {};
    const image = firstItem.produto_imagem || firstItem.imagem || "./assets/fumacinha-logo.png";
    const code = order.codigo || `Pedido #${order.id}`;
    const productName = firstItem.produto_nome || products.title || "Pedido";
    const productVariation = firstItem.sabor || firstItem.variacao || "";
    return `
      <article class="history-row sale-history-line site-order-history" data-order-detail-row="${order.id}" tabindex="0" role="button" aria-label="Abrir detalhes do pedido ${escapeHtml(code)}">
        <img class="sale-history-thumb" src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async" onerror="this.src='./assets/fumacinha-logo.png'" />
        <div class="sale-history-main">
          <div class="sale-history-top">
            <span class="sale-history-status status-site">Confirmado</span>
            <strong>${escapeHtml(code)}</strong>
            <span>🌐 Site</span>
          </div>
          <strong class="sale-history-product">${escapeHtml(productName)}</strong>
          ${productVariation ? `<span class="sale-history-flavor">${escapeHtml(productVariation)}</span>` : ""}
          <span class="sale-history-meta">
            <b>🕒${createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</b>
            <b>📦${products.quantity} ${products.quantity === 1 ? "un" : "un"}</b>
            <b>👤${escapeHtml(order.cliente_nome || "Nao informado")}</b>
          </span>
        </div>
        <div class="sale-history-side">
          <strong>${currency.format(order.valor_produtos || 0)}</strong>
          <span>${escapeHtml(order.forma_pagamento || "Site")}</span>
        </div>
        <button type="button" class="sale-history-menu-button" data-history-menu-toggle="${escapeHtml(`order-${order.id}`)}" aria-label="Acoes do pedido ${escapeHtml(code)}">...</button>
        <div class="sale-history-menu hidden" data-history-menu="${escapeHtml(`order-${order.id}`)}">
          <button type="button" data-view-order="${order.id}">Ver detalhes</button>
          <button type="button" data-history-menu-placeholder>Editar</button>
          <button type="button" data-history-menu-placeholder>Duplicar</button>
          <button type="button" data-history-menu-placeholder>Imprimir</button>
          <button type="button" data-history-menu-placeholder>Compartilhar</button>
        </div>
      </article>
    `;
  }

  const sale = row.sale;
  const products = saleHistoryProducts(sale);
  const linkedOrder = saleLinkedOrder(sale);
  const details = saleHistoryLineDetails(sale, products, linkedOrder);
  return `
      <article class="history-row sale-history-line ${sale.cancelada ? "cancelled" : ""}" data-sale-detail-row="${sale.id}" tabindex="0" role="button" aria-label="Abrir detalhes da venda ${escapeHtml(details.code)}">
        <img class="sale-history-thumb" src="${escapeHtml(details.image)}" alt="" loading="lazy" decoding="async" onerror="this.src='./assets/fumacinha-logo.png'" />
        <div class="sale-history-main">
          <div class="sale-history-top">
            <span class="sale-history-status ${escapeHtml(details.statusClass)}">${escapeHtml(details.status)}</span>
            <strong>${escapeHtml(details.code)}</strong>
            <span>${escapeHtml(details.originIcon)} ${escapeHtml(details.origin)}</span>
          </div>
          <strong class="sale-history-product">${escapeHtml(details.productName)}</strong>
          ${details.variation ? `<span class="sale-history-flavor">${escapeHtml(details.variation)}</span>` : ""}
          <span class="sale-history-meta">
            <b>🕒${escapeHtml(details.createdTime)}</b>
            <b>🚚${escapeHtml(details.routeTime)}</b>
            <b>👤${escapeHtml(details.seller)}</b>
            <b>📦${products.quantity} ${products.quantity === 1 ? "un" : "un"}</b>
          </span>
        </div>
        <div class="sale-history-side">
          <strong>${currency.format(saleGrandTotal(sale))}</strong>
          <span>${escapeHtml(details.payment)}</span>
        </div>
        <button type="button" class="sale-history-menu-button" data-history-menu-toggle="${sale.id}" aria-label="Acoes da venda ${escapeHtml(details.code)}">...</button>
        <div class="sale-history-menu hidden" data-history-menu="${sale.id}">
          ${sale.cancelada ? "" : `<button type="button" data-edit-sale="${sale.id}">Editar</button><button type="button" data-cancel-sale="${sale.id}">Cancelar</button>`}
          <button type="button" data-history-menu-placeholder>Duplicar</button>
          <button type="button" data-history-menu-placeholder>Imprimir</button>
          <button type="button" data-history-menu-placeholder>Compartilhar</button>
        </div>
      </article>
    `;
}

function saleHistoryLineDetails(sale, products, linkedOrder) {
  const createdAt = new Date(sale.created_at || sale.data_venda || Date.now());
  const firstItem = saleDetailItems(sale)[0] || {};
  return {
    code: linkedOrder?.codigo || `Venda #${sale.id}`,
    origin: linkedOrder ? "Site" : "Manual",
    originIcon: linkedOrder ? "🌐" : "🛒",
    status: sale.cancelada ? "Cancelada" : (salePaymentConferredLabel(sale) === "Sim" ? "Pago" : (sale.status_entrega || sale.status || "Concluida")),
    statusClass: sale.cancelada ? "status-cancelled" : (salePaymentConferredLabel(sale) === "Sim" ? "status-paid" : "status-awaiting"),
    productName: firstItem.name || products.title || sale.nome_produto || "Venda",
    variation: firstItem.variation || "",
    image: firstItem.image || "./assets/fumacinha-logo.png",
    createdTime: createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    routeTime: saleRouteTime(sale) || "--:--",
    seller: sale.vendedora_nome || "Vendedora nao informada",
    payment: paymentBreakdownLabel(salePaymentBreakdown(sale)) || sale.forma_pagamento || "Pagamento",
  };
}

function historyDateTitle(dateKey) {
  const date = new Date(`${dateKey}T12:00:00`);
  const title = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function isHistoryRowCancelled(row) {
  return row.type === "sale" ? Boolean(row.sale.cancelada) : normalizeOrderStatus(row.order.status) === "cancelado";
}

function historyRowRevenue(row) {
  if (isHistoryRowCancelled(row)) return 0;
  return row.type === "sale" ? saleTotal(row.sale) : toNumber(row.order.valor_produtos);
}

function saleDetailItems(sale) {
  const items = saleItemsForSale(sale.id);
  if (items.length) {
    return items.map((item) => {
      const product = app.products.find((row) => String(row.id) === String(item.produto_id));
      const quantity = toNumber(item.quantidade || 1);
      const unitValue = toNumber(item.valor_unitario || item.preco_unitario || product?.preco || product?.valor || 0);
      const subtotal = toNumber(item.subtotal || item.valor_total || (quantity * unitValue));
      return {
        image: item.produto_imagem || item.imagem || productImage(product),
        name: item.nome_produto || product?.nome || "Produto",
        variation: item.sabor || item.variacao || product?.sabor || product?.categoria || "",
        quantity,
        unitValue,
        subtotal,
      };
    });
  }

  const product = app.products.find((row) => String(row.id) === String(sale.produto_id) || row.nome === sale.nome_produto);
  const quantity = toNumber(sale.quantidade || 1);
  const unitValue = quantity ? saleProductsValue(sale) / quantity : saleProductsValue(sale);
  return [{
    image: productImage(product),
    name: sale.nome_produto || product?.nome || "Venda",
    variation: product?.categoria || "",
    quantity,
    unitValue,
    subtotal: saleProductsValue(sale),
  }];
}

function saleDetailCode(sale) {
  const linkedOrder = saleLinkedOrder(sale);
  return linkedOrder?.codigo || `Venda #${sale.id}`;
}

function saleDetailOrigin(sale) {
  return saleLinkedOrder(sale) ? "Pedido feito no site" : "Venda manual";
}

function salePaymentConferredLabel(sale) {
  const value = String(sale.pagamento_conferido || sale.conferiu_pagamento || "").toLowerCase();
  if (value === "sim" || value === "true" || value === "1") return "Sim";
  if (value === "nao" || value === "não" || value === "false" || value === "0") return "Nao";
  return "Nao informado";
}

function saleDetailStatus(sale) {
  if (sale.cancelada) return { label: "Cancelada", className: "status-cancelled", icon: "!" };
  const status = sale.status_entrega || sale.status || "Concluida";
  const normalized = normalizeOrderStatus(status);
  if (normalized.includes("rota")) return { label: status, className: "status-route", icon: ">" };
  if (normalized.includes("entreg")) return { label: status, className: "status-delivered", icon: "ok" };
  return { label: status, className: "status-confirmed", icon: "ok" };
}

function saleTimelineItems(sale) {
  const createdAt = new Date(sale.created_at || sale.data_venda || Date.now());
  const items = [{
    title: "Venda registrada",
    detail: createdAt.toLocaleString("pt-BR"),
  }];
  if (salePaymentConferredLabel(sale) === "Sim") {
    items.push({
      title: "Pagamento confirmado",
      detail: createdAt.toLocaleString("pt-BR"),
    });
  }
  if (saleRouteDate(sale) || saleRouteTime(sale)) {
    items.push({
      title: "Entrega prevista",
      detail: `${formatDateBR(saleRouteDate(sale))} as ${saleRouteTime(sale) || "--:--"}`,
    });
  }
  if (sale.cancelada) {
    items.push({
      title: "Venda cancelada",
      detail: sale.cancelado_em ? new Date(sale.cancelado_em).toLocaleString("pt-BR") : "Cancelada",
    });
  }
  return items;
}

function saleDetailListRow(label, value, highlight = false) {
  return `<div class="${highlight ? "highlight" : ""}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function saleDetailValueRow(label, value, extraClass = "") {
  return `<div class="sale-values-row ${extraClass}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function viewSaleDetails(saleId, trigger = null) {
  const sale = app.sales.find((item) => String(item.id) === String(saleId));
  if (!sale) return;
  openSaleDetailPanel(sale, trigger);
}

function openSaleDetailPanel(sale, trigger = null) {
  if (!saleDetailShell || !saleDetailBody) return;
  lastSaleDetailTrigger = trigger || document.activeElement;
  const items = saleDetailItems(sale);
  const statusInfo = saleDetailStatus(sale);
  const createdAt = new Date(sale.created_at || sale.data_venda || Date.now());
  const linkedOrder = saleLinkedOrder(sale);
  const quantity = items.reduce((sum, item) => sum + toNumber(item.quantity), 0);
  const paymentDetails = paymentBreakdownLabel(salePaymentBreakdown(sale)) || sale.forma_pagamento || "Nao informado";
  const customerPhone = linkedOrder ? orderPhone(linkedOrder) : (sale.cliente_telefone || sale.telefone || "");
  const customerName = sale.cliente_nome || linkedOrder?.cliente_nome || "Nao informado";
  const total = saleGrandTotal(sale);
  saleDetailBody.innerHTML = `
    <header class="sale-detail-header ${statusInfo.className}">
      <div class="sale-detail-icon" aria-hidden="true">${escapeHtml(statusInfo.icon)}</div>
      <div>
        <span class="sale-detail-status">${escapeHtml(statusInfo.label)}</span>
        <h2>Detalhes da venda</h2>
        <p><strong>${escapeHtml(saleDetailCode(sale))}</strong> &bull; ${escapeHtml(saleDetailOrigin(sale))}</p>
      </div>
    </header>

    <section class="sale-detail-summary">
      <article><span>Data</span><strong>${createdAt.toLocaleDateString("pt-BR")}</strong></article>
      <article><span>Registro</span><strong>${createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</strong></article>
      <article><span>Itens</span><strong>${quantity} ${quantity === 1 ? "item" : "itens"}</strong></article>
      <article><span>Total</span><strong>${currency.format(total)}</strong></article>
    </section>

    <section class="sale-detail-card">
      <h3>Cliente</h3>
      <div class="sale-detail-pairs">
        ${saleDetailListRow("Nome", customerName)}
        ${saleDetailListRow("Telefone", customerPhone ? phoneDisplay(customerPhone) : "Nao informado")}
        ${saleDetailListRow("Origem", saleDetailOrigin(sale))}
      </div>
    </section>

    <section class="sale-detail-card">
      <h3>Produtos</h3>
      <div class="sale-detail-products">
        ${items.map((item) => `
          <article>
            <img src="${escapeHtml(item.image || "./assets/fumacinha-logo.png")}" alt="" loading="lazy" decoding="async" onerror="this.src='./assets/fumacinha-logo.png'" />
            <div>
              <strong>${escapeHtml(item.name)}</strong>
              ${item.variation ? `<span>${escapeHtml(item.variation)}</span>` : ""}
              <small>${item.quantity} ${item.quantity === 1 ? "unidade" : "unidades"} x ${currency.format(item.unitValue)}</small>
            </div>
            <b>${currency.format(item.subtotal)}</b>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="sale-detail-card">
      <h3>Valores</h3>
      <div class="sale-detail-values">
        ${saleDetailValueRow("Produtos", currency.format(saleProductsValue(sale)))}
        ${saleDetailValueRow("Entrega", currency.format(saleDelivery(sale)))}
        ${saleDetailValueRow("Valor pago", currency.format(saleDeliveredValue(sale)))}
        ${saleDetailValueRow("Total", currency.format(total), "sale-values-total")}
        <div class="sale-values-extra hidden" data-sale-values-extra>
          ${saleDetailValueRow("Desconto", currency.format(toNumber(sale.desconto || 0)))}
          ${saleDetailValueRow("Comissao", currency.format(saleCommission(sale)))}
          ${saleDetailValueRow("Liquido", currency.format(saleProductsValue(sale) - toNumber(sale.desconto || 0)))}
        </div>
        <button type="button" class="sale-values-toggle" data-sale-values-toggle aria-expanded="false">▼ Ver detalhamento</button>
      </div>
    </section>

    <section class="sale-detail-card">
      <h3>Entrega</h3>
      <div class="sale-detail-pairs">
        ${saleDetailListRow("Data prevista", formatDateBR(saleRouteDate(sale)))}
        ${saleDetailListRow("Horario previsto", saleRouteTime(sale) || "Nao informado")}
        ${saleDetailListRow("Taxa do entregador", currency.format(saleDelivery(sale)))}
        ${saleDetailListRow("Status", sale.status_entrega || sale.status || "Nao informado")}
      </div>
    </section>

    <section class="sale-detail-card">
      <h3>Pagamento</h3>
      <div class="sale-detail-pairs">
        ${saleDetailListRow("Metodo", paymentDetails)}
        ${saleDetailListRow("Valor pago", currency.format(saleDeliveredValue(sale)))}
        ${saleDetailListRow("Conferido", salePaymentConferredLabel(sale))}
        ${saleDetailListRow("Vendedora", sale.vendedora_nome || "Nao informado")}
      </div>
    </section>

    <section class="sale-detail-card">
      <h3>Linha do tempo</h3>
      <ol class="sale-detail-timeline">
        ${saleTimelineItems(sale).map((item) => `<li><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.detail)}</span></li>`).join("")}
      </ol>
    </section>

    <footer class="sale-detail-actions">
      ${sale.cancelada ? "" : `<button type="button" class="sale-detail-secondary" data-edit-sale="${sale.id}">Editar venda</button><button type="button" class="sale-detail-danger" data-cancel-sale="${sale.id}">Cancelar venda</button>`}
    </footer>
  `;
  saleDetailShell.classList.remove("hidden");
  saleDetailShell.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => saleDetailShell.classList.add("open"));
  saleDetailShell.querySelector("[data-sale-detail-close]")?.focus();
}

function closeSaleDetailPanel() {
  if (!saleDetailShell) return;
  saleDetailShell.classList.remove("open");
  saleDetailShell.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  window.setTimeout(() => {
    if (!saleDetailShell.classList.contains("open")) saleDetailShell.classList.add("hidden");
  }, 260);
  if (lastSaleDetailTrigger && typeof lastSaleDetailTrigger.focus === "function") lastSaleDetailTrigger.focus();
  lastSaleDetailTrigger = null;
}

function closeHistoryMenus() {
  $$("[data-history-menu]").forEach((menu) => menu.classList.add("hidden"));
}

function toggleHistoryMenu(menuId) {
  const menu = $$("[data-history-menu]").find((item) => item.dataset.historyMenu === menuId);
  if (!menu) return;
  const willOpen = menu.classList.contains("hidden");
  closeHistoryMenus();
  if (willOpen) menu.classList.remove("hidden");
}

function requestConfirmation({ title, message, confirmText = "Confirmar", onConfirm }) {
  if (!confirmShell || !confirmOkButton) return onConfirm?.();
  pendingConfirmAction = onConfirm;
  if (confirmTitle) confirmTitle.textContent = title;
  if (confirmMessage) confirmMessage.textContent = message;
  confirmOkButton.textContent = confirmText;
  confirmShell.classList.remove("hidden");
  confirmShell.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => confirmShell.classList.add("open"));
  confirmOkButton.focus();
}

function closeConfirmation() {
  if (!confirmShell) return;
  confirmShell.classList.remove("open");
  confirmShell.setAttribute("aria-hidden", "true");
  pendingConfirmAction = null;
  if (!saleDetailShell?.classList.contains("open")) document.body.classList.remove("modal-open");
  window.setTimeout(() => {
    if (!confirmShell.classList.contains("open")) confirmShell.classList.add("hidden");
  }, 220);
}

function requestCancelSale(saleId) {
  requestConfirmation({
    title: "Cancelar venda",
    message: "Tem certeza que deseja cancelar esta venda? O estoque sera devolvido e os valores serao ajustados.",
    confirmText: "Cancelar venda",
    onConfirm: async () => {
      closeConfirmation();
      closeSaleDetailPanel();
      await cancelSale(saleId, { skipConfirm: true });
    },
  });
}

function viewOrderDetails(orderId) {
  const order = app.orders.find((item) => String(item.id) === String(orderId));
  if (!order) return;
  const items = orderItems(orderId);
  openOrderDrawer(order, items);
}

function orderStatusDescription(status = "") {
  const normalized = normalizeOrderStatus(status);
  if (normalized === "confirmado") return "Este pedido ja foi confirmado.";
  if (normalized === "em rota") return "Este pedido esta em rota de entrega.";
  if (normalized === "entregue") return "Este pedido foi entregue.";
  if (normalized === "cancelado") return "Este pedido foi cancelado.";
  return "Este pedido ainda nao foi confirmado.";
}

function openOrderDrawer(order, items = []) {
  if (!orderDrawerShell || !orderDrawerBody) return;
  const statusInfo = orderStatusInfo(order.status);
  const createdAt = new Date(order.created_at || Date.now());
  const quantity = items.reduce((sum, item) => sum + toNumber(item.quantidade || 1), 0);
  const subtotal = items.reduce((sum, item) => sum + toNumber(item.subtotal || (toNumber(item.valor_unitario) * toNumber(item.quantidade || 1))), 0);
  const total = toNumber(order.valor_produtos || subtotal);
  const phone = orderPhone(order) ? phoneDisplay(orderPhone(order)) : "Nao informado";
  orderDrawerBody.innerHTML = `
    <header class="order-drawer-header ${statusInfo.className}">
      <div class="order-drawer-icon" aria-hidden="true">${statusInfo.icon}</div>
      <div>
        <span class="pending-order-status">${statusInfo.label}</span>
        <h2>${escapeHtml(order.codigo || `Pedido #${order.id}`)}</h2>
        <p>&#127760; Pedido realizado pelo ${escapeHtml(order.origem || "Site")}</p>
      </div>
    </header>

    <section class="order-drawer-summary">
      <article><span>&#128197; Data</span><strong>${createdAt.toLocaleDateString("pt-BR")}</strong></article>
      <article><span>&#128338; Horario</span><strong>${createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</strong></article>
      <article><span>&#128230; Itens</span><strong>${quantity || items.length}</strong></article>
      <article><span>&#128176; Valor total</span><strong>${currency.format(total)}</strong></article>
    </section>

    <section class="order-drawer-card ${statusInfo.className}">
      <h3>Cliente</h3>
      <dl class="order-drawer-list">
        <div><dt>Nome</dt><dd>${escapeHtml(order.cliente_nome || "Nao informado")}</dd></div>
        <div><dt>Telefone</dt><dd>${escapeHtml(phone)}</dd></div>
        <div><dt>Origem</dt><dd>${escapeHtml(order.origem || "Site")}</dd></div>
      </dl>
    </section>

    <section class="order-drawer-card">
      <h3>Produtos</h3>
      <div class="order-drawer-products">
        ${items.length ? items.map((item) => `
          <article>
            <img src="${escapeHtml(item.produto_imagem || item.imagem || "")}" alt="" onerror="this.classList.add('hidden')" />
            <div>
              <strong>${escapeHtml(item.produto_nome || "Produto")}</strong>
              <span>Qtd: ${toNumber(item.quantidade || 1)}</span>
            </div>
            <b>${currency.format(item.subtotal || (toNumber(item.valor_unitario) * toNumber(item.quantidade || 1)))}</b>
          </article>
        `).join("") : `<p>Sem itens cadastrados neste pedido.</p>`}
      </div>
      <div class="order-drawer-totals">
        <span>Subtotal <strong>${currency.format(subtotal || total)}</strong></span>
        <span>Total <strong>${currency.format(total)}</strong></span>
      </div>
    </section>

    <section class="order-drawer-card">
      <h3>Status do pedido</h3>
      <div class="order-drawer-status">
        <span class="pending-order-status">${statusInfo.label}</span>
        <p>${orderStatusDescription(order.status)}</p>
      </div>
    </section>
  `;
  orderDrawerShell.classList.remove("hidden");
  orderDrawerShell.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => orderDrawerShell.classList.add("open"));
}

function closeOrderDrawer() {
  if (!orderDrawerShell) return;
  orderDrawerShell.classList.remove("open");
  orderDrawerShell.setAttribute("aria-hidden", "true");
  window.setTimeout(() => {
    if (!orderDrawerShell.classList.contains("open")) orderDrawerShell.classList.add("hidden");
  }, 260);
}

function loadOrderIntoSaleForm(orderId, mode = "confirm") {
  const order = app.orders.find((item) => String(item.id) === String(orderId));
  if (!order) return setStatus("Pedido nao encontrado.", "error");
  if (normalizeOrderStatus(order.status) !== "aguardando confirmacao") return setStatus("Esse pedido ja foi processado.", "error");
  const items = orderItems(orderId);
  if (!items.length) return setStatus("Pedido sem itens para confirmar.", "error");

  app.confirmingOrderId = mode === "confirm" ? order.id : null;
  app.editingOrderId = mode === "edit" ? order.id : null;
  app.editingSaleId = null;
  switchTab("sales");
  saleItemsRoot.innerHTML = items.map((item) => {
    const product = app.products.find((productRow) => String(productRow.id) === String(item.produto_id));
    return saleItemTemplate({
      product,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
    });
  }).join("");
  saleForm.elements.desconto.value = toNumber(order.desconto || 0).toFixed(2).replace(".", ",");
  const breakdown = paymentBreakdownFromText(order.observacao_interna || "");
  saleForm.elements.forma_pagamento.value = breakdown[0]?.forma || order.forma_pagamento || "Pix";
  if (saleForm.elements.pagamento_conferido) saleForm.elements.pagamento_conferido.value = "";
  setSplitPaymentFields(breakdown);
  saleForm.elements.valor_recebido.value = toNumber(order.valor_pago_cliente || order.valor_produtos).toFixed(2).replace(".", ",");
  saleForm.elements.teve_troco.value = order.teve_troco || toNumber(order.troco) > 0 ? "sim" : "nao";
  saleForm.elements.troco.value = toNumber(order.troco || 0) ? toNumber(order.troco).toFixed(2).replace(".", ",") : "";
  saleForm.elements.taxa_entrega.value = toNumber(order.taxa_entrega || 0).toFixed(2).replace(".", ",");
  saleForm.elements.cliente.value = order.cliente_nome || "";
  if (saleForm.elements.bairro) saleForm.elements.bairro.value = order.cliente_bairro || "";
  if (saleForm.elements.telefone) saleForm.elements.telefone.value = order.cliente_telefone || "";
  if (saleForm.elements.status_entrega) saleForm.elements.status_entrega.value = order.status_entrega || "Aguardando";
  saleForm.elements.observacao.value = stripPaymentBreakdownText(order.observacao_interna || "") || `Pedido ${order.codigo || order.id} recebido pelo site. Bairro: ${order.cliente_bairro || ""}`;
  saleForm.elements.motivo_alteracao.value = "";
  app.saleReceivedTouched = true;
  renderPeopleOptions();
  saleForm.elements.vendedora_id.value = order.vendedora_id || localStorage.getItem(LAST_SELLER_KEY) || "";
  saleForm.elements.entregador_id.value = order.entregador_id || localStorage.getItem(LAST_DELIVERER_KEY) || "";
  saleForm.elements.data_entrega.value = order.data_entrega || localDateValue();
  saleForm.elements.horario_rota.value = order.horario_rota || nextRouteSuggestion().time;
  saleEditBanner?.classList.remove("hidden");
  saleEditMotive?.classList.remove("hidden");
  if (saleEditTitle) saleEditTitle.textContent = mode === "edit" ? "Editando pedido" : "Confirmando pedido";
  if (saleEditLabel) saleEditLabel.textContent = mode === "edit" ? `${order.codigo || `Pedido #${order.id}`}` : `Confirmando ${order.codigo || `pedido #${order.id}`}`;
  saleSubmit?.classList.toggle("hidden", mode === "edit");
  if (saleSubmit) saleSubmit.textContent = mode === "edit" ? "Confirmar pedido" : "Confirmar pedido e registrar venda";
  confirmEditedOrderButton?.classList.toggle("hidden", mode !== "edit");
  updateSaleItemPrices();
  updateSaleTotal();
  saleForm.scrollIntoView({ behavior: "smooth", block: "start" });
  setStatus(mode === "edit" ? "Edite o pedido e salve. Ele continuara pendente." : "Revise o pedido, informe pagamento, vendedora e entregador, depois confirme a venda.", "success");
}

function loadOrderForConfirmation(orderId) {
  loadOrderIntoSaleForm(orderId, "confirm");
}

function loadOrderForEdit(orderId) {
  loadOrderIntoSaleForm(orderId, "edit");
}

function orderItemPayload(items) {
  return items.map((item) => ({
    produto_id: String(item.product.id),
    produto_nome: item.product.nome,
    produto_imagem: item.product.imagem || "",
    quantidade: item.quantity,
    valor_unitario: item.unitValue,
    subtotal: item.quantity * item.unitValue,
  }));
}

async function saveOrderEdit(event) {
  event.preventDefault();
  if (app.saleSaving || !app.editingOrderId) return;
  const order = app.orders.find((item) => String(item.id) === String(app.editingOrderId));
  if (!order) return setStatus("Pedido nao encontrado.", "error");
  if (normalizeOrderStatus(order.status) !== "aguardando confirmacao") return setStatus("Apenas pedidos pendentes podem ser editados.", "error");
  app.saleSaving = true;
  if (saleSubmit) {
    saleSubmit.disabled = true;
    saleSubmit.textContent = "Salvando alteracoes...";
  }
  setStatus("Salvando alteracoes do pedido...", "loading");
  try {
    const usuarioId = await requireUserId();
    const items = collectSaleItems({ allowEditing: true });
    const draft = currentSaleDraft();
    if (draft.paidValue < draft.productsValue + draft.cardServiceFee) {
      throw new Error(draft.cardServiceFee > 0 ? "Valor pago menor que produtos + R$ 1,00 da taxa do cartao." : "Valor pago menor que o valor dos produtos.");
    }
    if (draft.deliveryValue < 0) throw new Error("A taxa de entrega ficou negativa.");
    if (draft.split && draft.splitPayments.length < 2) throw new Error("Informe as duas formas de pagamento dividido.");
    const previous = {
      pedido: order,
      itens: orderItems(order.id),
    };
    const motivo = saleForm.elements.motivo_alteracao.value.trim();
    const payload = {
      cliente_nome: saleForm.elements.cliente.value.trim(),
      cliente_bairro: saleForm.elements.bairro?.value.trim() || "",
      cliente_telefone: String(saleForm.elements.telefone?.value || "").replace(/\D/g, ""),
      forma_pagamento: draft.paymentLabel || draft.payment,
      valor_pago_cliente: draft.paidValue,
      teve_troco: draft.cash && draft.hasChange,
      troco: draft.cash && draft.hasChange ? draft.changeValue : 0,
      taxa_entrega: Math.max(0, draft.deliveryValue),
      desconto: parseMoney(saleForm.elements.desconto.value),
      valor_produtos: draft.productsValue,
      vendedora_id: saleForm.elements.vendedora_id.value || null,
      entregador_id: saleForm.elements.entregador_id.value || null,
      data_entrega: draft.routeDate,
      horario_rota: draft.routeTime,
      rota_data_hora: routeIso(draft.routeDate, draft.routeTime),
      status_entrega: saleForm.elements.status_entrega?.value || "Aguardando",
      observacao_interna: [
        saleForm.elements.observacao.value.trim(),
        draft.split ? `PAGAMENTOS_JSON:${JSON.stringify(draft.splitPayments)}` : "",
      ].filter(Boolean).join("\n"),
      updated_at: new Date().toISOString(),
    };
    if (!payload.cliente_nome) throw new Error("Informe o nome do cliente.");
    const { error: orderError } = await supabaseClient.from(TABLES.orders).update(payload).eq("id", order.id).eq("status", "Aguardando confirmacao");
    if (orderError) throw orderError;
    const { error: deleteError } = await supabaseClient.from(TABLES.orderItems).delete().eq("pedido_id", order.id);
    if (deleteError) throw deleteError;
    const nextItems = orderItemPayload(items).map((item) => ({ ...item, pedido_id: order.id }));
    const { error: itemsError } = await supabaseClient.from(TABLES.orderItems).insert(nextItems);
    if (itemsError) throw itemsError;
    await supabaseClient.from(TABLES.orderChanges).insert({
      pedido_id: order.id,
      dados_anteriores: previous,
      dados_novos: { pedido: payload, itens: nextItems },
      motivo,
      usuario_id: usuarioId,
    });
    await loadAll();
    app.orders = app.orders.map((current) => String(current.id) === String(order.id) ? { ...current, ...payload } : current);
    app.orderItems = [...app.orderItems.filter((item) => String(item.pedido_id) !== String(order.id)), ...nextItems];
    app.editingOrderId = order.id;
    app.confirmingOrderId = null;
    app.editingSaleId = null;
    confirmEditedOrderButton?.classList.remove("hidden");
    renderPendingOrders();
    showToast("Pedido atualizado com sucesso.", "success");
    setStatus("Pedido atualizado com sucesso. Confira os dados e toque em Confirmar pedido para registrar a venda.", "success");
  } catch (error) {
    setStatus(error.message || "Erro ao salvar pedido.", "error");
  } finally {
    app.saleSaving = false;
    if (saleSubmit) {
      saleSubmit.disabled = false;
      saleSubmit.textContent = app.editingOrderId ? "Salvar alteracoes do pedido" : "Registrar venda";
    }
  }
}

function confirmEditedOrder() {
  if (!app.editingOrderId) return;
  const orderId = app.editingOrderId;
  app.confirmingOrderId = orderId;
  app.editingOrderId = null;
  app.editingSaleId = null;
  if (saleSubmit) saleSubmit.textContent = "Confirmar pedido e registrar venda";
  saleForm?.requestSubmit();
}

async function cancelOrder(orderId) {
  const order = app.orders.find((item) => String(item.id) === String(orderId));
  if (!order) return;
  if (normalizeOrderStatus(order.status) !== "aguardando confirmacao") return setStatus("Apenas pedidos pendentes podem ser cancelados aqui.", "error");
  setStatus("Cancelando pedido...", "loading");
  const { error } = await supabaseClient
    .from(TABLES.orders)
    .update({
      status: "Cancelado",
      motivo_cancelamento: "",
      cancelado_em: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "Aguardando confirmacao");
  if (error) return setStatus(error.message || "Erro ao cancelar pedido.", "error");
  showToast("Pedido cancelado com sucesso.", "success");
  setStatus("Pedido cancelado com sucesso.", "success");
  await loadAll();
}

function openOrderWhatsApp(orderId) {
  const order = app.orders.find((item) => String(item.id) === String(orderId));
  const url = order ? orderWhatsappUrl(order) : "";
  if (!url) return setStatus("Telefone nao informado para este pedido.", "error");
  window.location.href = url;
}

function renderStockFilters() {
  const categorySelect = $("[data-stock-category]");
  const categoryChips = $("[data-stock-category-chips]");
  const productCategories = $("[data-stock-product-categories]");
  const categories = [...new Set(app.products.map((product) => product.categoria || "Produtos"))].sort();
  if (productCategories) {
    productCategories.innerHTML = categories.map((category) => `<option value="${escapeHtml(category)}"></option>`).join("");
  }
  app.stockCategories = app.stockCategories.filter((category) => categories.includes(category));
  app.stockCategory = app.stockCategories.length === 1 ? app.stockCategories[0] : "all";
  if (categorySelect) {
    categorySelect.innerHTML = `<option value="all">Todas as categorias</option>${categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}`;
    categorySelect.value = app.stockCategory;
  }
  if (categoryChips) {
    categoryChips.innerHTML = categories.length ? `
      <button type="button" class="${app.stockCategories.length ? "" : "active"}" data-stock-category-chip="all">Todas</button>
      ${categories.map((category) => `
        <button type="button" class="${app.stockCategories.includes(category) ? "active" : ""}" data-stock-category-chip="${escapeHtml(category)}">${escapeHtml(category)}</button>
      `).join("")}
    ` : '<p class="empty-state">Nenhuma categoria encontrada.</p>';
  }
}

function stockProducts() {
  const search = saleFilterText(app.stockSearch);
  return app.products
    .filter((product) => !search || saleFilterText([product.nome, product.categoria, product.descricao, product.marca, product.sabor].filter(Boolean).join(" ")).includes(search))
    .filter((product) => !app.stockCategories.length || app.stockCategories.includes(product.categoria || "Produtos"))
    .filter((product) => app.stockFilter !== "low" || toNumber(product.estoque) <= 5)
    .sort((a, b) => {
      if (app.stockSort === "stock-asc") return toNumber(a.estoque) - toNumber(b.estoque);
      if (app.stockSort === "stock-desc") return toNumber(b.estoque) - toNumber(a.estoque);
      return 0;
    });
}

function renderStockTotalSummary(products) {
  const root = $("[data-stock-total-summary]");
  if (!root) return;
  const totalUnits = products.reduce((sum, product) => sum + toNumber(product.estoque), 0);
  const selectedLabel = app.stockCategories.length
    ? app.stockCategories.join(" + ")
    : "Todas as categorias";
  const categoryRows = app.stockCategories.length
    ? app.stockCategories.map((category) => {
      const units = products
        .filter((product) => (product.categoria || "Produtos") === category)
        .reduce((sum, product) => sum + toNumber(product.estoque), 0);
      return `<span>${escapeHtml(category)}: <strong>${units}</strong></span>`;
    }).join("")
    : "";
  root.innerHTML = `
    <div>
      <span>Total de estoque</span>
      <strong>${totalUnits}</strong>
      <small>${escapeHtml(selectedLabel)}</small>
    </div>
    ${categoryRows ? `<p>${categoryRows}</p>` : ""}
  `;
}

function stockLevelClass(stock) {
  const quantity = toNumber(stock);
  if (quantity <= 0) return "estoque-zero";
  if (quantity <= 5) return "estoque-baixo";
  if (quantity <= 10) return "estoque-medio";
  return "estoque-alto";
}

function renderStock() {
  renderStockFilters();
  if (!stockList) return;
  if (app.productsLoading) {
    renderStockTotalSummary([]);
    stockList.innerHTML = '<p class="empty-state">Carregando estoque...</p>';
    renderStockHistory();
    return;
  }
  if (app.productsError) {
    renderStockTotalSummary([]);
    stockList.innerHTML = `
      <div class="empty-state">
        <p>Nao foi possivel carregar o estoque.</p>
        <button type="button" class="ghost-action" data-retry-products>Tentar novamente</button>
      </div>
    `;
    renderStockHistory();
    return;
  }
  const products = stockProducts();
  renderStockTotalSummary(products);
  stockList.innerHTML = products.length ? products.map((product) => `
    <article class="stock-row" data-stock-row="${product.id}">
      <img src="${escapeHtml(productImage(product))}" alt="${escapeHtml(product.nome || "Produto")}" loading="lazy" decoding="async" onerror="this.src='./assets/fumacinha-logo.png'" />
      <div>
        <h3>${escapeHtml(product.nome || "Produto sem nome")}</h3>
        <small>${escapeHtml(product.categoria || "Produtos")}</small>
        <p>Estoque atual: <strong class="${stockLevelClass(product.estoque)}">${toNumber(product.estoque)}</strong></p>
        <p>Custo: ${currency.format(productCost(product))} | Venda: ${currency.format(product.preco)}</p>
      </div>
      <div class="stock-actions">
        <div class="stock-quantity-control">
          <button class="stock-minus" type="button" data-stock-minus="${product.id}">-</button>
          <input class="stock-quantity-input" type="number" min="0" step="1" value="${toNumber(product.estoque)}" data-stock-value="${product.id}" data-stock-original="${toNumber(product.estoque)}" />
          <button class="stock-plus" type="button" data-stock-plus="${product.id}">+</button>
        </div>
        <button class="stock-save-button" type="button" data-stock-save="${product.id}" disabled>Salvar estoque</button>
        <span class="stock-save-status" data-stock-save-status="${product.id}">Estoque atualizado</span>
      </div>
    </article>
  `).join("") : '<p class="empty-state">Nenhum produto encontrado.</p>';
  renderStockHistory();
}

function renderStockHistory() {
  if (!stockHistory) return;
  stockHistory.innerHTML = app.stockMoves.length
    ? app.stockMoves.slice(0, 50).map((move) => `
      <article class="history-row">
        <strong>${escapeHtml(move.nome_produto || move.produto_id)}</strong>
        <span>${toNumber(move.quantidade_anterior)} -> ${toNumber(move.quantidade_nova)} (${toNumber(move.diferenca)})</span>
        <span>${escapeHtml(move.tipo || "ajuste")} - ${new Date(move.created_at).toLocaleString("pt-BR")}</span>
      </article>
    `).join("")
    : "<p>Nenhuma movimentacao registrada.</p>";
}

function setStockProductStatus(message = "", type = "") {
  if (!stockProductStatus) return;
  stockProductStatus.textContent = message;
  stockProductStatus.className = `form-status ${type}`.trim();
}

function validateStockProductImageFile(file) {
  if (!file) return "";
  if (!PRODUCT_IMAGE_TYPES.includes(file.type)) return "Use imagens JPG, JPEG, PNG ou WEBP.";
  if (file.size > MAX_PRODUCT_IMAGE_SIZE) return "A imagem deve ter no maximo 5 MB.";
  return "";
}

function stockProductImagePath(file) {
  const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const safeExtension = extension === "jpeg" ? "jpg" : extension;
  const random = Math.random().toString(36).slice(2);
  return `produtos/${Date.now()}-${random}.${safeExtension || "jpg"}`;
}

function updateStockProductImagePreview(source = "") {
  const value = source || stockProductForm?.elements.imagem?.value.trim() || "";
  const hasImage = Boolean(value);
  stockProductImagePreview?.classList.toggle("has-image", hasImage);
  stockProductImageEmpty?.classList.toggle("hidden", hasImage);
  stockProductImagePreviewImg?.classList.toggle("hidden", !hasImage);
  if (stockProductImagePreviewImg) stockProductImagePreviewImg.src = hasImage ? value : "";
}

function clearStockProductImage() {
  if (app.stockProductPreviewUrl) URL.revokeObjectURL(app.stockProductPreviewUrl);
  app.stockProductPreviewUrl = "";
  app.selectedStockProductImageFile = null;
  if (stockProductImageFile) stockProductImageFile.value = "";
  if (stockProductForm?.elements.imagem) stockProductForm.elements.imagem.value = "";
  updateStockProductImagePreview("");
}

function selectStockProductImage(file) {
  const validation = validateStockProductImageFile(file);
  if (validation) {
    clearStockProductImage();
    setStockProductStatus(validation, "error");
    return;
  }
  if (app.stockProductPreviewUrl) URL.revokeObjectURL(app.stockProductPreviewUrl);
  app.selectedStockProductImageFile = file || null;
  app.stockProductPreviewUrl = file ? URL.createObjectURL(file) : "";
  setStockProductStatus("");
  updateStockProductImagePreview(app.stockProductPreviewUrl);
}

async function uploadStockProductImage() {
  const file = app.selectedStockProductImageFile;
  if (!file) return stockProductForm?.elements.imagem?.value.trim() || "";
  const validation = validateStockProductImageFile(file);
  if (validation) throw new Error(validation);
  const path = stockProductImagePath(file);
  const { error } = await supabaseClient.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabaseClient.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl || "";
}

function stockProductPayload(form) {
  const price = parseMoney(form.elements.preco.value);
  const cost = parseMoney(form.elements.custo.value);
  const stock = Math.max(0, Number.parseInt(form.elements.estoque.value || "0", 10));
  return {
    nome: form.elements.nome.value.trim(),
    categoria: form.elements.categoria.value.trim(),
    preco: price,
    pix: price,
    custo: cost,
    estoque: stock,
    imagem: form.elements.imagem.value.trim(),
    descricao: form.elements.descricao.value.trim(),
    ativo: form.elements.ativo.checked,
    destaque_home: false,
    ocultar_home: false,
  };
}

function validateStockProduct(payload) {
  if (!payload.nome) return "Informe o nome do produto.";
  if (!payload.categoria) return "Informe a categoria.";
  if (!Number.isFinite(payload.preco) || payload.preco <= 0) return "Informe um preco de venda valido.";
  if (!Number.isFinite(payload.custo) || payload.custo < 0) return "Informe um custo valido.";
  if (!Number.isFinite(payload.estoque) || payload.estoque < 0) return "Informe um estoque valido.";
  return "";
}

async function saveStockProduct(event) {
  event.preventDefault();
  if (app.stockProductSaving || !stockProductForm) return;
  if (!(await requireAuth())) return;

  const payload = stockProductPayload(stockProductForm);
  const validation = validateStockProduct(payload);
  if (validation) return setStockProductStatus(validation, "error");

  app.stockProductSaving = true;
  if (stockProductSubmit) {
    stockProductSubmit.disabled = true;
    stockProductSubmit.textContent = "Cadastrando...";
  }
  setStockProductStatus("Cadastrando produto...", "loading");
  try {
    if (app.selectedStockProductImageFile) setStockProductStatus("Enviando imagem...", "loading");
    payload.imagem = await uploadStockProductImage();
    setStockProductStatus("Cadastrando produto...", "loading");
    const { error } = await supabaseClient.from(TABLES.products).insert(payload);
    if (error) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.descricao;
      const fallback = await supabaseClient.from(TABLES.products).insert(fallbackPayload);
      if (fallback.error) throw fallback.error;
    }
    stockProductForm.reset();
    stockProductForm.elements.estoque.value = "1";
    stockProductForm.elements.ativo.checked = true;
    clearStockProductImage();
    app.stockCategory = payload.categoria;
    app.saleProductCategory = payload.categoria;
    setStockProductStatus(`Produto "${payload.nome}" cadastrado com sucesso.`, "success");
    showToast(`Produto "${payload.nome}" cadastrado com sucesso.`, "success");
    await loadAll();
    switchTab("stock");
  } catch (error) {
    console.error("Erro ao cadastrar produto no controle:", error);
    setStockProductStatus(error.message || "Nao foi possivel cadastrar o produto.", "error");
  } finally {
    app.stockProductSaving = false;
    if (stockProductSubmit) {
      stockProductSubmit.disabled = false;
      stockProductSubmit.textContent = "Cadastrar produto";
    }
  }
}

async function saveStock(productId) {
  const product = app.products.find((item) => String(item.id) === String(productId));
  const input = $(`[data-stock-value="${productId}"]`);
  const button = $(`[data-stock-save="${productId}"]`);
  if (!product || !input) return;
  try {
    if (button) {
      button.disabled = true;
      button.textContent = "Salvando...";
    }
    await updateProductStock(product, toNumber(input.value), "ajuste manual");
    const successMessage = `Estoque de "${product.nome}" salvo com sucesso!`;
    setStatus("Estoque atualizado.", "success");
    showToast(successMessage, "success");
    await loadAll();
  } catch (error) {
    console.error("Erro ao salvar estoque:", error);
    setStatus("Nao foi possivel salvar o estoque.", "error");
    showToast("Nao foi possivel salvar o estoque.", "error");
    if (button) {
      button.disabled = false;
      button.textContent = "Salvar estoque";
    }
  }
}

function updateStockSaveState(productId) {
  const input = $(`[data-stock-value="${productId}"]`);
  const button = $(`[data-stock-save="${productId}"]`);
  const status = $(`[data-stock-save-status="${productId}"]`);
  if (!input || !button) return;
  const changed = toNumber(input.value) !== toNumber(input.dataset.stockOriginal);
  button.disabled = !changed;
  button.textContent = "Salvar estoque";
  if (status) {
    status.textContent = changed ? "Alteracao nao salva" : "Estoque atualizado";
    status.classList.toggle("unsaved", changed);
  }
}

function renderFinance() {
  const summary = summaryFor();
  $("[data-finance-sales-confirmed]").textContent = String(filteredSales().length);
  $("[data-finance-revenue]").textContent = currency.format(summary.revenue);
  $("[data-finance-received]").textContent = currency.format(summary.received);
  $("[data-finance-delivery]").textContent = currency.format(summary.delivery);
  $("[data-finance-cost]").textContent = currency.format(summary.cost);
  $("[data-finance-commission]").textContent = currency.format(summary.commission);
  $("[data-finance-gross]").textContent = currency.format(summary.gross);
  $("[data-finance-expenses]").textContent = currency.format(summary.expenses);
  $("[data-finance-net]").textContent = currency.format(summary.net);
  renderTopClients();
  renderExpenses();
}

function renderTopClients() {
  if (!topClientsRoot) return;
  const rows = clientRows();
  const allClientsCount = clientRowsUnfilteredCount();
  if (clientsCount) clientsCount.textContent = `${allClientsCount} ${allClientsCount === 1 ? "cliente" : "clientes"}`;
  topClientsRoot.innerHTML = rows.length
    ? rows.slice(0, 20).map((client, index) => {
      const whatsappUrl = clientWhatsappUrl(client.phone, client.name);
      const lastDate = client.lastDate ? client.lastDate.toLocaleDateString("pt-BR") : "Sem data";
      return `
        <article class="client-row">
          <div class="client-rank">${index + 1}</div>
          <div class="client-main">
            <strong>${escapeHtml(client.name)}</strong>
            <span>${escapeHtml(phoneDisplay(client.phone))}</span>
            <small>Ultima compra: ${lastDate}</small>
          </div>
          <div class="client-stats">
            <strong>${client.purchases}</strong>
            <span>${client.purchases === 1 ? "compra" : "compras"}</span>
          </div>
          <div class="client-total">
            <strong>${currency.format(client.total)}</strong>
            <span>em produtos</span>
          </div>
          ${whatsappUrl ? `<a class="client-whatsapp" href="${whatsappUrl}" target="_blank" rel="noreferrer">WhatsApp</a>` : ""}
        </article>
      `;
    }).join("")
    : `<p class="empty-state">Nenhum cliente encontrado neste periodo.</p>`;
}

function ensureClientsTab() {
  if (!sideMenu || sideMenu.querySelector('[data-tab="clients"]')) return;
  const nav = sideMenu.querySelector(".side-menu-nav");
  const historyButton = nav?.querySelector('[data-tab="history"]');
  if (!nav || !historyButton) return;
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.tab = "clients";
  button.innerHTML = '<span>&#128101;</span> Clientes';
  nav.insertBefore(button, historyButton);
}

function clientRowsUnfilteredCount() {
  const previousSearch = app.clientSearch;
  app.clientSearch = "";
  const count = clientRows(analyticsSales("clients")).length;
  app.clientSearch = previousSearch;
  return count;
}

async function saveExpense(event) {
  event.preventDefault();
  let usuarioId = "";
  try {
    usuarioId = await requireUserId();
  } catch (error) {
    return setStatus(error.message, "error");
  }
  const form = event.currentTarget;
  const payload = {
    descricao: form.elements.descricao.value.trim(),
    categoria: form.elements.categoria.value,
    valor: toNumber(form.elements.valor.value),
    data_despesa: form.elements.data_despesa.value || dateValue(),
    forma_pagamento: form.elements.forma_pagamento.value,
    observacao: form.elements.observacao.value.trim(),
    usuario_id: usuarioId,
  };
  if (!payload.descricao || payload.valor <= 0) return setStatus("Preencha a despesa corretamente.", "error");
  const { error } = await supabaseClient.from(TABLES.expenses).insert(payload);
  if (error) return setStatus(error.message, "error");
  form.reset();
  form.elements.data_despesa.value = dateValue();
  setStatus("Despesa registrada.", "success");
  await loadAll();
}

function renderExpenses() {
  if (!expenseList) return;
  const rows = filteredExpenses();
  expenseList.innerHTML = rows.length
    ? rows.map((expense) => `
      <article class="expense-row">
        <strong>${escapeHtml(expense.descricao)}</strong>
        <span>${escapeHtml(expense.categoria)} - ${currency.format(expense.valor)}</span>
        <span>${new Date(`${expense.data_despesa}T12:00:00`).toLocaleDateString("pt-BR")} - ${escapeHtml(expense.forma_pagamento || "")}</span>
      </article>
    `).join("")
    : "<p>Nenhuma despesa no periodo.</p>";
}

function renderSmartOrderSuggestions() {
  const root = $("[data-smart-order-suggestions]");
  if (!root) return;
  const rows = smartOrderSuggestions();
  root.innerHTML = rows.length
    ? `<div class="smart-order-list">${rows.map((row) => {
      const stock = toNumber(row.stock);
      const colorClass = stockColorClass(stock);
      return `
        <article class="smart-order-row ${colorClass}">
          <div>
            <strong>${escapeHtml(row.name)}</strong>
            <span>${escapeHtml(row.status)} | vendeu ${toNumber(row.quantity)} un no periodo | estoque ${stock} un</span>
          </div>
          <em>${currency.format(row.total)}</em>
        </article>
      `;
    }).join("")}</div>`
    : `<p class="operational-alert-empty">Nenhuma sugestao de pedido agora. Produtos com pouco estoque, mas sem venda forte, foram ignorados.</p>`;
}

function renderReports() {
  const sales = filteredSales();
  const ranked = rankedProducts(sales);
  const soldNames = new Set(ranked.map((row) => row.label));
  const paymentSales = analyticsSales("payments");
  const delivererSales = analyticsSales("deliverers");
  const commissionSales = analyticsSales("sellers");
  renderSmartOrderSuggestions();
  renderList("[data-report-low-products]", [...ranked].reverse().slice(0, 5), "Sem dados de venda.");
  renderList(
    "[data-report-no-sales]",
    app.products.filter((product) => !soldNames.has(product.nome)).slice(0, 8).map((product) => ({ label: product.nome, total: undefined })),
    "Todos os produtos tiveram venda no periodo."
  );
  renderList(
    "[data-report-low-stock]",
    app.products.filter((product) => toNumber(product.estoque) <= 5).map((product) => ({ label: product.nome, quantity: `${product.estoque} un`, total: undefined })),
    "Nenhum produto com estoque baixo."
  );
  const paymentRows = Object.entries(
    paymentSales.reduce((acc, sale) => {
      const breakdown = salePaymentBreakdown(sale);
      if (breakdown.length) {
        breakdown.forEach((payment) => {
          const key = payment.forma || "Nao informado";
          acc[key] = (acc[key] || 0) + toNumber(payment.valor);
        });
      } else {
        const key = sale.forma_pagamento || "Nao informado";
        acc[key] = (acc[key] || 0) + saleTotal(sale);
      }
      return acc;
    }, {})
  ).map(([label, total]) => ({ label, total }));
  renderList("[data-report-payments]", paymentRows, "Sem formas de pagamento no periodo.");
  renderList("[data-report-profit-product]", ranked.map((row) => ({ label: row.label, total: row.profit })), "Sem lucro por produto.");
  const stockTotal = app.products.reduce((sum, product) => sum + toNumber(product.estoque) * productCost(product), 0);
  renderList("[data-report-stock-value]", [{ label: "Valor em custo no estoque", total: stockTotal }], "Sem produtos em estoque.");
  renderDelivererReport(delivererSales);
  renderCommissionReport(commissionSales);
}

function renderDelivererReport(sales) {
  const groups = new Map();
  sales.forEach((sale) => {
    const name = sale.entregador_nome || personNameById(app.deliverers, sale.entregador_id) || "Sem entregador";
    const current = groups.get(name) || { label: name, quantity: 0, total: 0 };
    current.quantity += saleDelivery(sale) > 0 ? 1 : 0;
    current.total += saleDelivery(sale);
    groups.set(name, current);
  });
  renderList(
    "[data-report-deliverers]",
    [...groups.values()].filter((row) => row.total > 0).map((row) => ({ label: row.label, quantity: `${row.quantity} entregas`, total: row.total })),
    "Sem taxas de entrega no periodo."
  );
}

function renderCommissionReport(sales) {
  const groups = new Map();
  sales.forEach((sale) => {
    const name = sale.vendedora_nome || personNameById(app.sellers, sale.vendedora_id) || "Sem vendedora";
    const methods = salePaymentMethods(sale).map(normalizePayment);
    const isCard = methods.some((method) => method === "debito" || method === "credito");
    const current = groups.get(name) || { label: name, quantity: 0, pix: 0, cash: 0, debit: 0, credit: 0, base: 0, card: 0, total: 0 };
    current.quantity += 1;
    current.pix += methods.includes("pix") ? 1 : 0;
    current.cash += methods.includes("dinheiro") ? 1 : 0;
    current.debit += methods.includes("debito") ? 1 : 0;
    current.credit += methods.includes("credito") ? 1 : 0;
    current.base += toNumber(sale.comissao_base || COMMISSION_BASE);
    current.card += toNumber(sale.comissao_cartao || (isCard ? COMMISSION_CARD_EXTRA : 0));
    current.total += saleCommission(sale);
    groups.set(name, current);
  });
  renderList(
    "[data-report-commissions]",
    [...groups.values()].map((row) => ({
      label: `${row.label} - ${row.quantity} vendas (${row.pix} Pix, ${row.cash} dinheiro, ${row.debit} debito, ${row.credit} credito)`,
      quantity: `Base ${currency.format(row.base)} | Cartao ${currency.format(row.card)}`,
      total: row.total,
    })),
    "Sem comissoes no periodo."
  );
}

function filteredTeam(rows, search) {
  const term = search.trim().toLowerCase();
  return rows
    .filter((row) => !term || row.nome.toLowerCase().includes(term))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

function renderTeamList(root, rows, type) {
  if (!root) return;
  root.innerHTML = rows.length
    ? rows.map((person) => `
      <article class="team-row">
        <div>
          <strong>${escapeHtml(person.nome)}</strong>
          <span>${person.ativo === false ? "Inativo" : "Ativo"}</span>
        </div>
        <div class="team-actions">
          <button type="button" data-team-edit="${type}" data-team-id="${person.id}">Editar</button>
          <button type="button" data-team-toggle="${type}" data-team-id="${person.id}">${person.ativo === false ? "Ativar" : "Inativar"}</button>
          <button type="button" data-team-delete="${type}" data-team-id="${person.id}">Excluir</button>
        </div>
      </article>
    `).join("")
    : "<p>Nenhum cadastro encontrado.</p>";
}

function renderTeamLists() {
  renderTeamList(sellerList, filteredTeam(app.sellers, app.sellerSearch), "seller");
  renderTeamList(delivererList, filteredTeam(app.deliverers, app.delivererSearch), "deliverer");
}

async function addTeamMember(type, form) {
  const table = type === "seller" ? TABLES.sellers : TABLES.deliverers;
  const rows = type === "seller" ? app.sellers : app.deliverers;
  const name = form.elements.nome.value.trim();
  if (!name) return setStatus("Informe o nome.", "error");
  if (rows.some((row) => row.nome.toLowerCase() === name.toLowerCase())) return setStatus("Esse nome ja esta cadastrado.", "error");
  const { data, error } = await supabaseClient.from(table).insert({ nome: name, ativo: true }).select("*").single();
  if (error) return setStatus(error.message, "error");
  rows.push(data);
  form.reset();
  setStatus(type === "seller" ? "Vendedora cadastrada." : "Entregador cadastrado.", "success");
  renderPeopleOptions();
}

async function editTeamMember(type, id) {
  const table = type === "seller" ? TABLES.sellers : TABLES.deliverers;
  const rows = type === "seller" ? app.sellers : app.deliverers;
  const person = rows.find((row) => String(row.id) === String(id));
  if (!person) return;
  const name = window.prompt("Novo nome:", person.nome);
  if (!name || !name.trim()) return;
  const { error } = await supabaseClient.from(table).update({ nome: name.trim() }).eq("id", id);
  if (error) return setStatus(error.message, "error");
  person.nome = name.trim();
  setStatus("Nome atualizado.", "success");
  renderPeopleOptions();
}

async function toggleTeamMember(type, id) {
  const table = type === "seller" ? TABLES.sellers : TABLES.deliverers;
  const rows = type === "seller" ? app.sellers : app.deliverers;
  const person = rows.find((row) => String(row.id) === String(id));
  if (!person) return;
  const next = person.ativo === false;
  const { error } = await supabaseClient.from(table).update({ ativo: next }).eq("id", id);
  if (error) return setStatus(error.message, "error");
  person.ativo = next;
  setStatus(next ? "Cadastro ativado." : "Cadastro inativado.", "success");
  renderPeopleOptions();
}

async function deleteTeamMember(type, id) {
  const table = type === "seller" ? TABLES.sellers : TABLES.deliverers;
  const rows = type === "seller" ? app.sellers : app.deliverers;
  const hasHistory = type === "seller"
    ? app.sales.some((sale) => String(sale.vendedora_id) === String(id))
    : app.sales.some((sale) => String(sale.entregador_id) === String(id)) || app.deliveryPayouts.some((payout) => String(payout.entregador_id) === String(id));
  if (hasHistory) return setStatus("Nao e possivel excluir: existe historico relacionado. Use inativar.", "error");
  if (!window.confirm("Excluir este cadastro?")) return;
  const { error } = await supabaseClient.from(table).delete().eq("id", id);
  if (error) return setStatus(error.message, "error");
  const index = rows.findIndex((row) => String(row.id) === String(id));
  if (index >= 0) rows.splice(index, 1);
  setStatus("Cadastro excluido.", "success");
  renderPeopleOptions();
}

function saleDateKey(sale) {
  return localDateValue(saleDate(sale));
}

function cashClosingForDate(dateKey = app.cashDate) {
  return app.cashClosings.find((closing) => closing.data_caixa === dateKey);
}

function cashSalesForDate(dateKey = app.cashDate, includeCancelled = false) {
  return app.sales.filter((sale) => {
    if (!includeCancelled && sale.cancelada) return false;
    return saleDateKey(sale) === dateKey;
  });
}

function cashMovementsForDate(dateKey = app.cashDate) {
  return app.cashMovements.filter((move) => move.data_caixa === dateKey);
}

function changeMovesForDate(dateKey = app.cashDate) {
  return app.changeMoves.filter((move) => localDateValue(new Date(move.created_at || Date.now())) === dateKey);
}

function changeMoveImpact(move) {
  const value = toNumber(move.valor);
  if (move.tipo === "uso_venda") return -Math.abs(value);
  if (move.tipo === "devolucao_cancelamento" || move.tipo === "adicao" || move.tipo === "saldo_inicial") return Math.abs(value);
  if (move.tipo === "ajuste") return toNumber(move.saldo_posterior) - toNumber(move.saldo_anterior);
  return 0;
}

function changeTotalsForDate(dateKey = app.cashDate) {
  const moves = changeMovesForDate(dateKey);
  const totals = { usado: 0, adicionado: 0, devolvido: 0, ajustado: 0, saldoInicial: 0, saldoFinal: toNumber(app.changeBox?.saldo_atual || 0) };
  moves.forEach((move) => {
    const value = Math.abs(toNumber(move.valor));
    if (move.tipo === "uso_venda") totals.usado += value;
    else if (move.tipo === "adicao") totals.adicionado += value;
    else if (move.tipo === "devolucao_cancelamento") totals.devolvido += value;
    else if (move.tipo === "ajuste" || move.tipo === "saldo_inicial") totals.ajustado += changeMoveImpact(move);
  });
  if (dateKey === localDateValue()) {
    totals.saldoInicial = totals.saldoFinal - totals.adicionado - totals.devolvido - totals.ajustado + totals.usado;
  } else {
    const lastMove = moves[0];
    const firstMove = moves[moves.length - 1];
    totals.saldoInicial = firstMove ? toNumber(firstMove.saldo_anterior) : 0;
    totals.saldoFinal = lastMove ? toNumber(lastMove.saldo_posterior) : 0;
  }
  return totals;
}

function cashPaymentTotals(dateKey = app.cashDate) {
  const totals = {
    pix: 0,
    dinheiro: 0,
    debito: 0,
    credito: 0,
    outros: 0,
    dinheiroRecebido: 0,
    trocoDevolvido: 0,
    dinheiroLiquido: 0,
  };
  cashSalesForDate(dateKey).forEach((sale) => {
    const breakdown = salePaymentBreakdown(sale);
    if (breakdown.length) {
      breakdown.forEach((row) => {
        const payment = normalizePayment(row.forma);
        const value = toNumber(row.valor);
        if (payment === "pix") totals.pix += value;
        else if (payment === "dinheiro") {
          totals.dinheiro += value;
          totals.dinheiroRecebido += value;
        } else if (payment === "debito") totals.debito += value;
        else if (payment === "credito") totals.credito += value;
        else totals.outros += value;
      });
      totals.trocoDevolvido += saleChangeValue(sale);
      return;
    }

    const payment = normalizePayment(sale.forma_pagamento);
    const value = saleGrandTotal(sale);
    if (payment === "pix") totals.pix += value;
    else if (payment === "dinheiro") {
      totals.dinheiro += value;
      totals.dinheiroRecebido += saleDeliveredValue(sale);
      totals.trocoDevolvido += saleChangeValue(sale);
    } else if (payment === "debito") totals.debito += value;
    else if (payment === "credito") totals.credito += value;
    else totals.outros += value;
  });
  totals.dinheiroLiquido = totals.dinheiroRecebido - totals.trocoDevolvido;
  return totals;
}

function cashMovementTotals(dateKey = app.cashDate) {
  const totals = { sangria: 0, reforco: 0, retirada: 0, pagamento: 0, ajuste: 0 };
  cashMovementsForDate(dateKey).forEach((move) => {
    const type = normalizePayment(move.tipo);
    const value = toNumber(move.valor);
    if (type in totals) totals[type] += value;
  });
  return totals;
}

function cashReadFormValues(dateKey = app.cashDate) {
  const movementTotals = cashMovementTotals();
  const readMoney = (name, fallback = 0) => {
    const input = cashForm?.elements[name];
    return input && String(input.value).trim() ? parseMoney(input.value) : fallback;
  };
  return {
    trocoInicial: changeTotalsForDate(dateKey).saldoInicial,
    trocoUsado: changeTotalsForDate(dateKey).usado,
    sangrias: readMoney("sangrias", movementTotals.sangria),
    reforcos: readMoney("reforcos", movementTotals.reforco),
    retiradas: readMoney("retiradas", movementTotals.retirada),
    pagamentosCaixa: readMoney("pagamentos_caixa", movementTotals.pagamento),
    dinheiroContado: readMoney("dinheiro_contado"),
    observacao: cashForm?.elements.observacao?.value.trim() || "",
  };
}

function cashCalculate(dateKey = app.cashDate) {
  const payment = cashPaymentTotals(dateKey);
  const form = cashReadFormValues(dateKey);
  const change = changeTotalsForDate(dateKey);
  const activeSales = cashSalesForDate(dateKey);
  const cancelledSales = cashSalesForDate(dateKey, true).filter((sale) => sale.cancelada);
  const totalVendas = payment.pix + payment.dinheiro + payment.debito + payment.credito + payment.outros;
  const eletronicos = payment.pix + payment.debito + payment.credito + payment.outros;
  const trocoUsadoTotal = change.usado;
  const trocoRestante = Math.max(0, change.saldoFinal);
  const dinheiroEsperado = form.trocoInicial + payment.dinheiroRecebido - payment.trocoDevolvido + form.reforcos - form.sangrias - form.retiradas - form.pagamentosCaixa;
  const diferenca = form.dinheiroContado - dinheiroEsperado;
  return {
    ...form,
    ...payment,
    trocoUsadoManual: form.trocoUsado,
    trocoUsado: trocoUsadoTotal,
    trocoAdicionado: change.adicionado,
    trocoDevolvidoCancelamento: change.devolvido,
    trocoAjustado: change.ajustado,
    totalVendas,
    eletronicos,
    quantidadeVendas: activeSales.length,
    vendasCanceladas: cancelledSales.length,
    trocoRestante,
    dinheiroEsperado,
    diferenca,
  };
}

function cashDifferenceLabel(difference) {
  if (Math.abs(difference) < 0.005) return "Caixa correto";
  return difference > 0 ? "Sobra de caixa" : "Falta de caixa";
}

function exchangeStore() {
  try {
    return JSON.parse(localStorage.getItem(EXCHANGE_CHECK_KEY) || "{}");
  } catch {
    return {};
  }
}

function exchangeRowKey(dateKey, time) {
  return `${dateKey || app.cashDate}|${time}`;
}

function exchangeSavedRow(dateKey, time) {
  return app.exchangeChecks.find((row) => row.data_caixa === dateKey && row.horario_rota === time);
}

function exchangeLocalFallback(dateKey, time) {
  return exchangeStore()[dateKey]?.[time] || null;
}

function exchangeRowsForDate(dateKey = app.cashDate) {
  return ROUTE_TIMES.map((time) => ({
    time,
    ...exchangeRowFromSaved(dateKey, time),
    saving: app.exchangeSaving[exchangeRowKey(dateKey, time)] || null,
  }));
}

function exchangeRowFromSaved(dateKey, time) {
  const saved = exchangeSavedRow(dateKey, time);
  const local = saved ? null : exchangeLocalFallback(dateKey, time);
  const sent = Math.max(0, Number.parseInt(saved?.quantidade_trocas ?? local?.sent ?? 0, 10));
  const returned = Math.max(0, Number.parseInt(saved?.trocas_retornadas ?? local?.returned ?? 0, 10));
  const checked = Boolean(saved?.conferido ?? local?.checked ?? (sent > 0 && returned >= sent));
  return { id: saved?.id || null, sent, returned, checked };
}

function exchangeRowsFromInputs() {
  return ROUTE_TIMES.map((time) => ({
    time,
    sent: Math.max(0, Number.parseInt($(`[data-exchange-count="${time}"]`)?.value || "0", 10)),
    checked: Boolean($(`[data-exchange-checked="${time}"]`)?.checked),
  }));
}

function exchangePayload(row, dateKey = app.cashDate) {
  const sent = Math.max(0, Number.parseInt(row.sent || 0, 10));
  const checked = Boolean(row.checked);
  return {
    data_caixa: dateKey,
    horario_rota: row.time,
    quantidade_trocas: sent,
    trocas_retornadas: checked ? sent : 0,
    conferido: checked,
    updated_at: new Date().toISOString(),
  };
}

function applyExchangeSavedRow(saved) {
  if (!saved) return;
  app.exchangeChecks = [
    saved,
    ...app.exchangeChecks.filter((row) => !(row.data_caixa === saved.data_caixa && row.horario_rota === saved.horario_rota)),
  ];
}

async function persistExchangeRow(row, dateKey = app.cashDate) {
  const payload = exchangePayload(row, dateKey);
  const { data, error } = await supabaseClient
    .from(TABLES.exchangeChecks)
    .upsert(payload, { onConflict: "data_caixa,horario_rota" })
    .select("*")
    .single();
  if (error) throw error;
  applyExchangeSavedRow(data);
  return data;
}

async function saveExchangeRows(rows = exchangeRowsFromInputs(), dateKey = app.cashDate) {
  const savedRows = [];
  for (const row of rows) {
    savedRows.push(await persistExchangeRow(row, dateKey));
  }
  return savedRows;
}

function exchangeSummary(rows = exchangeRowsFromInputs()) {
  const sent = rows.reduce((sum, row) => sum + toNumber(row.sent), 0);
  const checked = rows.reduce((sum, row) => sum + (toNumber(row.sent) > 0 && row.checked ? toNumber(row.sent) : 0), 0);
  const checkedRoutes = rows.filter((row) => toNumber(row.sent) > 0 && row.checked).length;
  const pendingRoutes = rows.filter((row) => toNumber(row.sent) > 0 && !row.checked).length;
  const startedRoutes = rows.filter((row) => toNumber(row.sent) > 0).length;
  const progress = Math.round((checkedRoutes / ROUTE_TIMES.length) * 100);
  return { sent, returned: checked, missing: Math.max(0, sent - checked), checkedRoutes, pendingRoutes, startedRoutes, progress, ok: pendingRoutes === 0 };
}

function exchangeLastUpdated(dateKey = app.cashDate) {
  const updatedAt = app.exchangeChecks
    .filter((row) => row.data_caixa === dateKey)
    .map((row) => row.updated_at || row.created_at)
    .filter(Boolean)
    .sort()
    .at(-1);
  return updatedAt ? new Date(updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--:--";
}

function setExchangeSaveState(key, state = "", message = "") {
  if (state) app.exchangeSaving[key] = { state, message };
  else delete app.exchangeSaving[key];
}

function exchangeRowsWithOverride(time, patch = {}, dateKey = app.cashDate) {
  return exchangeRowsFromInputs().map((row) => (row.time === time ? { ...row, ...patch } : row));
}

function scheduleExchangeRowSave(time, patch = {}, previous = {}, dateKey = app.cashDate) {
  const key = exchangeRowKey(dateKey, time);
  window.clearTimeout(app.exchangeSaveTimers[key]);
  const version = (app.exchangeSaveVersions[key] || 0) + 1;
  app.exchangeSaveVersions[key] = version;
  const currentRow = exchangeRowsWithOverride(time, patch, dateKey).find((row) => row.time === time);
  setExchangeSaveState(key, "saving", "Salvando...");
  renderExchangeCheck(exchangeRowsWithOverride(time, currentRow, dateKey));
  app.exchangeSaveTimers[key] = window.setTimeout(async () => {
    try {
      const saved = await persistExchangeRow(currentRow, dateKey);
      if (app.exchangeSaveVersions[key] !== version) return;
      setExchangeSaveState(key, "saved", "Salvo");
      renderExchangeCheck(exchangeRowsForDate(dateKey));
      window.setTimeout(() => {
        if (app.exchangeSaveVersions[key] === version) {
          setExchangeSaveState(key);
          renderExchangeCheck(exchangeRowsForDate(dateKey));
        }
      }, 1500);
      return saved;
    } catch (error) {
      if (app.exchangeSaveVersions[key] !== version) return;
      console.error("Erro ao salvar conferencia de troca:", { time, dateKey, currentRow, error });
      const rollbackRows = exchangeRowsWithOverride(time, previous, dateKey);
      setExchangeSaveState(key);
      renderExchangeCheck(rollbackRows);
      showToast("Não foi possível salvar. Tente novamente.", "error");
    }
  }, 320);
}

function exchangeRouteState(row) {
  const quantity = toNumber(row.sent);
  if (row.checked) return { key: "checked", label: "Conferido", dot: "green" };
  if (quantity <= 0) return { key: "idle", label: "Ainda nao iniciado", dot: "gray" };
  const selectedDate = app.cashDate || localDateValue();
  const today = localDateValue();
  const routeDate = new Date(`${selectedDate}T${row.time}:00`);
  const isLate = selectedDate < today || (selectedDate === today && Date.now() > routeDate.getTime());
  return isLate
    ? { key: "late", label: "Horario passou", dot: "red" }
    : { key: "pending", label: "Pendente", dot: "orange" };
}

function renderExchangeSummary(rows = exchangeRowsFromInputs()) {
  const root = $("[data-exchange-summary]");
  if (!root) return;
  const summary = exchangeSummary(rows);
  root.className = "exchange-summary";
  root.innerHTML = `
    <div class="exchange-kpi-grid">
      <article><span>Total de trocas</span><strong>${summary.sent}</strong><small>Trocas hoje</small></article>
      <article><span>Rotas conferidas</span><strong>${summary.checkedRoutes} / ${ROUTE_TIMES.length}</strong><small>Confirmadas</small></article>
      <article><span>Pendentes</span><strong>${summary.pendingRoutes}</strong><small>Horarios</small></article>
      <article><span>Ultima atualizacao</span><strong>${exchangeLastUpdated()}</strong><small>Conferencia</small></article>
    </div>
    <div class="exchange-progress-card">
      <div>
        <strong>Progresso do dia</strong>
        <span>${summary.checkedRoutes} de ${ROUTE_TIMES.length} horarios conferidos</span>
      </div>
      <b>${summary.progress}%</b>
      <div class="exchange-progress-track"><i style="width: ${summary.progress}%"></i></div>
    </div>
  `;
}

function renderExchangeCheck(rows = exchangeRowsForDate()) {
  const root = $("[data-exchange-route-list]");
  if (!root) return;
  root.innerHTML = rows.map((row) => {
      const checked = Boolean(row.checked);
      const state = exchangeRouteState(row);
      const saving = app.exchangeSaving[exchangeRowKey(app.cashDate, row.time)] || null;
      const disabled = saving?.state === "saving";
      return `
        <article class="exchange-route-row ${state.key}">
          <header>
            <strong><span aria-hidden="true">&#128337;</span>${row.time}</strong>
            <em class="exchange-status ${state.key}"><i></i>${state.label}</em>
          </header>
          <div class="exchange-route-body">
            <div class="exchange-stepper">
              <span>Trocas</span>
              <div>
                <button type="button" data-exchange-step="${row.time}" data-step="-1" ${disabled ? "disabled" : ""}>-</button>
                <input aria-label="Trocas da rota ${row.time}" type="number" min="0" step="1" value="${row.sent}" data-exchange-count="${row.time}" ${disabled ? "disabled" : ""} />
                <button type="button" data-exchange-step="${row.time}" data-step="1" ${disabled ? "disabled" : ""}>+</button>
              </div>
            </div>
            <label class="exchange-switch" aria-label="Conferir rota ${row.time}">
              <input type="checkbox" ${checked ? "checked" : ""} data-exchange-checked="${row.time}" ${disabled ? "disabled" : ""} />
              <span></span>
              <b>${saving?.message || (checked ? "Conferido" : "Pendente")}</b>
            </label>
          </div>
        </article>
      `;
    }).join("");
  renderExchangeSummary(rows);
}

async function saveExchangeCheck() {
  const rows = exchangeRowsFromInputs();
  const summary = exchangeSummary(rows);
  ROUTE_TIMES.forEach((time) => setExchangeSaveState(exchangeRowKey(app.cashDate, time), "saving", "Salvando..."));
  renderExchangeCheck(rows);
  try {
    await saveExchangeRows(rows);
    ROUTE_TIMES.forEach((time) => setExchangeSaveState(exchangeRowKey(app.cashDate, time), "saved", "Salvo"));
    renderExchangeCheck(exchangeRowsForDate());
    showToast(summary.ok ? "Trocas conferidas." : "Trocas salvas com pendências.", summary.ok ? "success" : "error");
    window.setTimeout(() => {
      ROUTE_TIMES.forEach((time) => setExchangeSaveState(exchangeRowKey(app.cashDate, time)));
      renderExchangeCheck(exchangeRowsForDate());
    }, 1500);
  } catch (error) {
    console.error("Erro ao salvar trocas:", error);
    ROUTE_TIMES.forEach((time) => setExchangeSaveState(exchangeRowKey(app.cashDate, time)));
    renderExchangeCheck(exchangeRowsForDate());
    showToast("Não foi possível salvar. Tente novamente.", "error");
  }
}

function conferencePasswordOk() {
  const expected = localStorage.getItem(CONFERENCE_PASSWORD_KEY) || DEFAULT_CONFERENCE_PASSWORD;
  const value = cashForm?.elements.conferencia_senha?.value || "";
  return value === expected;
}

function renderConferenceAlert() {
  if (!conferenceAlert) return;
  const today = localDateValue();
  const closing = cashClosingForDate();
  const selectedDate = app.cashDate || today;
  const isPastOpen = selectedDate < today && closing?.status !== "fechado";
  conferenceAlert.innerHTML = isPastOpen
    ? `<strong>Dia ${new Date(`${selectedDate}T12:00:00`).toLocaleDateString("pt-BR")} nao foi conferido.</strong><span>A vendedora ainda nao conferiu caixa, troco e trocas deste dia.</span>`
    : "";
  conferenceAlert.classList.toggle("hidden", !isPastOpen);
}

function setMoneyInput(input, value) {
  if (input) input.value = toNumber(value).toFixed(2).replace(".", ",");
}

function renderChangeBox() {
  const totals = changeTotalsForDate();
  const saldo = toNumber(app.changeBox?.saldo_atual || 0);
  $("[data-change-initial]").textContent = currency.format(totals.saldoInicial);
  $("[data-change-used]").textContent = currency.format(totals.usado);
  $("[data-change-added]").textContent = currency.format(totals.adicionado);
  $("[data-change-current]").textContent = currency.format(saldo);
  $("[data-change-adjusted]").textContent = currency.format(totals.ajustado);
  if (!changeHistory) return;
  changeHistory.innerHTML = app.changeMoves.length
    ? app.changeMoves.slice(0, 40).map((move) => `
      <article class="history-row">
        <strong>${escapeHtml(changeMoveLabel(move.tipo))} - ${currency.format(Math.abs(toNumber(move.valor)))}</strong>
        <span>Saldo: ${currency.format(move.saldo_anterior || 0)} -> ${currency.format(move.saldo_posterior || 0)}</span>
        ${move.venda_id ? `<span>Venda #${move.venda_id}</span>` : ""}
        ${move.observacao ? `<span>${escapeHtml(move.observacao)}</span>` : ""}
        <span>${new Date(move.created_at || Date.now()).toLocaleString("pt-BR")}</span>
      </article>
    `).join("")
    : "<p>Nenhuma movimentacao de troco registrada.</p>";
}

function changeMoveLabel(type = "") {
  const labels = {
    saldo_inicial: "Saldo inicial",
    uso_venda: "Uso em venda",
    devolucao_cancelamento: "Devolucao por cancelamento",
    adicao: "Adicao de troco",
    ajuste: "Ajuste manual",
  };
  return labels[type] || "Movimentacao";
}

function populateCashForm() {
  if (!cashForm || app.cashEditing) return;
  const closing = cashClosingForDate();
  const movements = cashMovementTotals();
  setMoneyInput(cashForm.elements.sangrias, closing?.sangrias || movements.sangria);
  setMoneyInput(cashForm.elements.reforcos, closing?.reforcos || movements.reforco);
  setMoneyInput(cashForm.elements.retiradas, closing?.retiradas || movements.retirada);
  setMoneyInput(cashForm.elements.pagamentos_caixa, closing?.pagamentos_caixa || movements.pagamento);
  setMoneyInput(cashForm.elements.dinheiro_contado, closing?.dinheiro_contado || 0);
  cashForm.elements.observacao.value = closing?.observacao || "";
  if (cashForm.elements.conferencia_senha) cashForm.elements.conferencia_senha.value = "";
}

async function changeCashBalance(action) {
  const adding = action === "adicao";
  const title = adding ? "Adicionar troco" : "Ajustar saldo de troco";
  const valueLabel = adding ? "Valor adicionado" : "Novo saldo";
  const rawValue = window.prompt(`${title}\n\n${valueLabel}:`);
  if (rawValue === null) return;
  const value = parseMoney(rawValue);
  if (value < 0 || (!adding && !Number.isFinite(value))) return setStatus("Informe um valor valido.", "error");
  if (adding && value <= 0) return setStatus("Informe um valor maior que zero.", "error");
  const observation = window.prompt(adding ? "Observacao:" : "Motivo do ajuste:");
  if (!adding && !String(observation || "").trim()) return setStatus("Informe o motivo do ajuste.", "error");
  setStatus(adding ? "Adicionando troco..." : "Ajustando saldo...", "loading");
  try {
    await requireUserId();
    const { error } = await supabaseClient.rpc("movimentar_troco_caixa", {
      p_tipo: adding ? "adicao" : "ajuste",
      p_valor: value,
      p_observacao: observation || "",
      p_venda_id: null,
    });
    if (error) throw error;
    setStatus(adding ? "Troco adicionado." : "Saldo de troco ajustado.", "success");
    await loadAll();
  } catch (error) {
    setStatus(error.message || "Erro ao atualizar troco.", "error");
  }
}

function updateCashPreview() {
  const values = cashCalculate();
  renderChangeBox();
  $("[data-cash-change-left]").textContent = currency.format(values.trocoRestante);
  $("[data-cash-expected]").textContent = currency.format(values.dinheiroEsperado);
  $("[data-cash-counted]").textContent = currency.format(values.dinheiroContado);
  $("[data-cash-difference]").textContent = currency.format(values.diferenca);
  $("[data-cash-difference-status]").textContent = cashDifferenceLabel(values.diferenca);
  const summary = $("[data-cash-summary]");
  if (summary) {
    summary.innerHTML = `
      <strong>Resumo do dia</strong>
      <span>Pix: ${currency.format(values.pix)}</span>
      <span>Dinheiro: ${currency.format(values.dinheiro)}</span>
      <span>Credito: ${currency.format(values.credito)}</span>
      <span>Debito: ${currency.format(values.debito)}</span>
      <span>Outros: ${currency.format(values.outros)}</span>
      <span>Total vendido: ${currency.format(values.totalVendas)}</span>
      <span>Troco inicial: ${currency.format(values.trocoInicial)}</span>
      <span>Troco usado: ${currency.format(values.trocoUsado)}</span>
      <span>Troco adicionado: ${currency.format(values.trocoAdicionado)}</span>
      <span>Ajustes do troco: ${currency.format(values.trocoAjustado)}</span>
      <span>Troco restante: ${currency.format(values.trocoRestante)}</span>
      <span>Dinheiro recebido: ${currency.format(values.dinheiroRecebido)}</span>
      <span>Troco devolvido: ${currency.format(values.trocoDevolvido)}</span>
      <span>Dinheiro liquido: ${currency.format(values.dinheiroLiquido)}</span>
      <span>Dinheiro esperado: ${currency.format(values.dinheiroEsperado)}</span>
      <span>Dinheiro contado: ${currency.format(values.dinheiroContado)}</span>
      <span>Diferenca: ${currency.format(values.diferenca)}</span>
      <span>Status: ${cashDifferenceLabel(values.diferenca)}</span>
    `;
  }
}

function renderCashHistory() {
  if (!cashHistory) return;
  cashHistory.innerHTML = app.cashClosings.length
    ? app.cashClosings.slice(0, 30).map((closing) => `
      <article class="history-row">
        <strong>${new Date(`${closing.data_caixa}T12:00:00`).toLocaleDateString("pt-BR")} - ${escapeHtml(closing.status || "Aberto")}</strong>
        <span>Total vendido ${currency.format(closing.total_vendas || 0)} | Esperado ${currency.format(closing.dinheiro_esperado || 0)}</span>
        <span>Contado ${currency.format(closing.dinheiro_contado || 0)} | Diferenca ${currency.format(closing.diferenca || 0)}</span>
        <button type="button" data-open-cash-date="${closing.data_caixa}">Abrir fechamento</button>
      </article>
    `).join("")
    : "<p>Nenhum fechamento registrado.</p>";
}

function renderCashClosing() {
  if (!cashForm || !cashDateInput) return;
  if (!app.cashDate) app.cashDate = localDateValue();
  cashDateInput.value = app.cashDate;
  populateCashForm();
  const values = cashCalculate();
  const closing = cashClosingForDate();
  $("[data-cash-pix]").textContent = currency.format(values.pix);
  $("[data-cash-money]").textContent = currency.format(values.dinheiro);
  $("[data-cash-debit]").textContent = currency.format(values.debito);
  $("[data-cash-credit]").textContent = currency.format(values.credito);
  $("[data-cash-other]").textContent = currency.format(values.outros);
  $("[data-cash-total]").textContent = currency.format(values.totalVendas);
  $("[data-cash-electronic]").textContent = currency.format(values.eletronicos);
  $("[data-cash-money-received]").textContent = currency.format(values.dinheiroRecebido);
  $("[data-cash-change-given]").textContent = currency.format(values.trocoDevolvido);
  $("[data-cash-money-net]").textContent = currency.format(values.dinheiroLiquido);
  $("[data-cash-count]").textContent = String(values.quantidadeVendas);
  $("[data-cash-cancelled]").textContent = String(values.vendasCanceladas);
  if (cashStatus) {
    cashStatus.innerHTML = closing?.status === "fechado"
      ? `<strong>Conferencia finalizada</strong><span>${new Date(closing.fechado_em || closing.updated_at).toLocaleString("pt-BR")}</span><span>Responsavel: ${escapeHtml(closing.fechado_por || "Usuario autenticado")}</span><span>Diferenca: ${currency.format(closing.diferenca || 0)}</span>`
      : "<span>Fechamento aberto para conferencia.</span>";
  }
  const isClosed = closing?.status === "fechado";
  $$("[data-reopen-cash]").forEach((button) => button.classList.toggle("hidden", !isClosed));
  const closeButton = $("[data-cash-close-button]");
  if (closeButton) {
    closeButton.classList.toggle("hidden", isClosed);
    closeButton.disabled = isClosed;
  }
  [...cashForm.elements].forEach((field) => {
    if (field.matches("input, textarea, select")) field.disabled = isClosed;
  });
  renderConferenceAlert();
  renderExchangeCheck();
  $$("[data-exchange-count], [data-exchange-checked], [data-exchange-step], [data-save-exchange-check]").forEach((field) => {
    field.disabled = isClosed;
  });
  updateCashPreview();
  renderCashHistory();
}

function cashPayload(status = "fechado") {
  const values = cashCalculate();
  const usuarioId = app.user?.id || null;
  return {
    data_caixa: app.cashDate,
    troco_inicial: values.trocoInicial,
    troco_usado: values.trocoUsado,
    troco_restante: values.trocoRestante,
    vendas_pix: values.pix,
    vendas_dinheiro: values.dinheiro,
    vendas_debito: values.debito,
    vendas_credito: values.credito,
    vendas_outros: values.outros,
    total_vendas: values.totalVendas,
    total_dinheiro_recebido: values.dinheiroRecebido,
    total_troco_devolvido: values.trocoDevolvido,
    dinheiro_liquido: values.dinheiroLiquido,
    quantidade_vendas: values.quantidadeVendas,
    vendas_canceladas: values.vendasCanceladas,
    sangrias: values.sangrias,
    reforcos: values.reforcos,
    retiradas: values.retiradas,
    pagamentos_caixa: values.pagamentosCaixa,
    dinheiro_esperado: values.dinheiroEsperado,
    dinheiro_contado: values.dinheiroContado,
    diferenca: values.diferenca,
    status,
    observacao: values.observacao,
    fechado_por: usuarioId || "",
    fechado_por_id: usuarioId,
    fechado_em: new Date().toISOString(),
  };
}

async function closeCash(event) {
  event.preventDefault();
  if (!cashForm) return;
  const values = cashCalculate();
  const exchangeRows = exchangeRowsFromInputs();
  const exchange = exchangeSummary(exchangeRows);
  if (!exchange.ok) {
    renderExchangeSummary(exchangeRows);
    return setStatus(`Ainda existe horario de troca sem conferir. Confira antes de finalizar.`, "error");
  }
  if (!conferencePasswordOk()) return setStatus("Senha de conferencia incorreta.", "error");
  const confirmed = window.confirm(`Finalizar conferencia de ${new Date(`${app.cashDate}T12:00:00`).toLocaleDateString("pt-BR")}?\n\nDinheiro esperado: ${currency.format(values.dinheiroEsperado)}\nDinheiro contado: ${currency.format(values.dinheiroContado)}\nDiferenca: ${currency.format(values.diferenca)}\nTrocas: levou ${exchange.sent}, voltou ${exchange.returned}`);
  if (!confirmed) return;
  setStatus("Finalizando conferencia...", "loading");
  try {
    await requireUserId();
    await saveExchangeRows(exchangeRows);
    const payload = cashPayload("fechado");
    const { data, error } = await supabaseClient.from(TABLES.cashClosings).upsert(payload, { onConflict: "data_caixa" }).select("*").single();
    if (error) throw error;
    app.cashClosings = [data, ...app.cashClosings.filter((closing) => closing.data_caixa !== data.data_caixa)];
    app.cashEditing = false;
    setStatus("Conferencia finalizada.", "success");
    renderCashClosing();
  } catch (error) {
    setStatus(error.message || "Erro ao finalizar conferencia.", "error");
  }
}

async function reopenCash() {
  const closing = cashClosingForDate();
  if (!closing) return;
  if (!window.confirm("Reabrir este fechamento? O historico sera mantido.")) return;
  setStatus("Reabrindo caixa...", "loading");
  try {
    const usuarioId = await requireUserId();
    const { data, error } = await supabaseClient
      .from(TABLES.cashClosings)
      .update({
        status: "reaberto",
        reaberto_por: usuarioId,
        reaberto_por_id: usuarioId,
        reaberto_em: new Date().toISOString(),
      })
      .eq("id", closing.id)
      .select("*")
      .single();
    if (error) throw error;
    Object.assign(closing, data);
    setStatus("Fechamento reaberto.", "success");
    renderCashClosing();
  } catch (error) {
    setStatus(error.message || "Erro ao reabrir fechamento.", "error");
  }
}

function usePreviousChange() {
  if (!cashForm) return;
  const previous = app.cashClosings
    .filter((closing) => closing.data_caixa < app.cashDate)
    .sort((a, b) => b.data_caixa.localeCompare(a.data_caixa))[0];
  if (!previous) return setStatus("Nenhum fechamento anterior encontrado.", "error");
  if (!window.confirm(`Usar ${currency.format(previous.troco_restante || 0)} como troco inicial?`)) return;
  setMoneyInput(cashForm.elements.troco_inicial, previous.troco_restante || 0);
  app.cashEditing = true;
  updateCashPreview();
}

function setSuggestedDeliveryRoute() {
  if (!saleForm?.elements.data_entrega || !saleForm?.elements.horario_rota) return;
  const suggestion = nextRouteSuggestion();
  saleForm.elements.data_entrega.value = suggestion.date;
  saleForm.elements.horario_rota.value = suggestion.time;
}

function saleRouteDate(sale) {
  return sale.data_entrega || saleDateKey(sale);
}

function saleRouteTime(sale) {
  return sale.horario_rota || "";
}

function saleProductsLabel(sale) {
  const items = app.saleItems.filter((item) => String(item.venda_id) === String(sale.id));
  return items.length
    ? items.map((item) => `${item.quantidade}x ${item.nome_produto}`).join(", ")
    : sale.nome_produto || "Venda";
}

function routeStatusOptions(selected = "Aguardando") {
  return ["Aguardando", "Em rota", "Entregue", "Nao recebido", "Cancelado"]
    .map((status) => `<option value="${status}" ${status === selected ? "selected" : ""}>${status}</option>`)
    .join("");
}

function renderRoutes() {
  if (!routesList) return;
  if (!app.routesDate) app.routesDate = localDateValue();
  if (routesDateInput) routesDateInput.value = app.routesDate;
  if (routesFilterSelect) routesFilterSelect.value = app.routesFilter;
  const sales = app.sales
    .filter((sale) => !sale.cancelada)
    .filter((sale) => saleRouteDate(sale) === app.routesDate)
    .filter((sale) => app.routesFilter === "todas" || saleRouteTime(sale) === app.routesFilter);
  const groups = ROUTE_TIMES.map((time) => ({
    time,
    sales: sales.filter((sale) => saleRouteTime(sale) === time),
  })).filter((group) => app.routesFilter === "todas" || group.time === app.routesFilter);

  routesList.innerHTML = groups.map((group) => `
    <section class="route-group">
      <h3>${group.time}</h3>
      ${group.sales.length ? group.sales.map((sale) => `
        <article class="history-row route-sale">
          <strong>${escapeHtml(sale.cliente_nome || "Cliente nao informado")}</strong>
          <span>Entregador: ${escapeHtml(sale.entregador_nome || "Sem entregador")}</span>
          <span>Produtos: ${escapeHtml(saleProductsLabel(sale))}</span>
          <span>Valor: ${currency.format(saleGrandTotal(sale))} | Taxa: ${currency.format(saleDelivery(sale))}</span>
          <span>${escapeHtml(sale.forma_pagamento || "Pagamento nao informado")}</span>
          <label>Status
            <select data-route-status="${sale.id}">
              ${routeStatusOptions(sale.status_entrega || "Aguardando")}
            </select>
          </label>
        </article>
      `).join("") : "<p>Nenhum pedido nesta rota.</p>"}
    </section>
  `).join("");
}

async function updateDeliveryStatus(saleId, status) {
  const sale = app.sales.find((item) => String(item.id) === String(saleId));
  if (!sale) return;
  const { error } = await supabaseClient.from(TABLES.sales).update({ status_entrega: status }).eq("id", saleId);
  if (error) return setStatus(error.message, "error");
  sale.status_entrega = status;
  setStatus("Status da entrega atualizado.", "success");
  renderRoutes();
}

function switchTab(tab) {
  if (tab === "finance") applyFinanceMonth(monthKey());
  app.activeTab = tab;
  $$("[data-panel]").forEach((panel) => panel.classList.toggle("hidden", panel.dataset.panel !== tab));
  $$("[data-tab]").forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
  renderPeriods();
  if (tab === "finance") {
    renderFinance();
    renderReports();
  }
  if (tab === "clients") renderTopClients();
}

function openSideMenu() {
  if (!sideShell) return;
  sideShell.classList.remove("hidden");
  sideShell.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => sideShell.classList.add("open"));
}

function closeSideMenu() {
  if (!sideShell) return;
  sideShell.classList.remove("open");
  sideShell.setAttribute("aria-hidden", "true");
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabaseClient) return setLoginStatus("Configure o Supabase da Fumacinha.", "error");
  if (!navigator.onLine) return showConnectionStatus();
  setLoginStatus("Entrando...", "loading");
  let result;
  try {
    result = await supabaseClient.auth.signInWithPassword({
      email: loginForm.elements.email.value.trim(),
      password: loginForm.elements.password.value,
    });
  } catch (error) {
    return setLoginStatus(isConnectionError(error) ? connectionMessage() : error?.message || "Nao foi possivel entrar.", "error");
  }
  if (result.error) return setLoginStatus(isConnectionError(result.error) ? connectionMessage() : result.error.message, "error");
  setLoginStatus("");
  await loadAll();
});

saleForm?.addEventListener("submit", saveSale);
stockProductForm?.addEventListener("submit", saveStockProduct);
saleForm?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.target.tagName === "TEXTAREA") return;
  event.preventDefault();
  if (["valor_recebido", "taxa_entrega", "troco", "pagamento_1_valor", "pagamento_2_valor"].includes(event.target.name)) {
    formatMoneyInput(event.target);
    app.saleReceivedTouched = event.target.name === "valor_recebido" ? true : app.saleReceivedTouched;
    updateSaleTotal();
  }
});
expenseForm?.addEventListener("submit", saveExpense);
cashForm?.addEventListener("submit", closeCash);
sellerForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  addTeamMember("seller", event.currentTarget);
});
delivererForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  addTeamMember("deliverer", event.currentTarget);
});

sideMenu?.addEventListener(
  "touchstart",
  (event) => {
    sideTouchStartX = event.touches?.[0]?.clientX ?? null;
  },
  { passive: true },
);

sideMenu?.addEventListener(
  "touchend",
  (event) => {
    if (sideTouchStartX === null) return;
    const endX = event.changedTouches?.[0]?.clientX ?? sideTouchStartX;
    if (sideTouchStartX - endX > 60) closeSideMenu();
    sideTouchStartX = null;
  },
  { passive: true },
);

saleDetailShell?.addEventListener(
  "touchstart",
  (event) => {
    if (!event.target.closest(".sale-detail-panel")) return;
    saleDetailTouchStartY = event.touches?.[0]?.clientY ?? null;
  },
  { passive: true },
);

saleDetailShell?.addEventListener(
  "touchend",
  (event) => {
    if (saleDetailTouchStartY === null) return;
    const endY = event.changedTouches?.[0]?.clientY ?? saleDetailTouchStartY;
    if (endY - saleDetailTouchStartY > 70) closeSaleDetailPanel();
    saleDetailTouchStartY = null;
  },
  { passive: true },
);

saleProductSheet?.addEventListener(
  "touchstart",
  (event) => {
    if (!event.target.closest(".sale-product-sheet-panel")) return;
    salePickerTouchStartY = event.touches?.[0]?.clientY ?? null;
  },
  { passive: true },
);

saleProductSheet?.addEventListener(
  "touchend",
  (event) => {
    if (salePickerTouchStartY === null) return;
    const endY = event.changedTouches?.[0]?.clientY ?? salePickerTouchStartY;
    if (endY - salePickerTouchStartY > 70) closeSaleProductPicker();
    salePickerTouchStartY = null;
  },
  { passive: true },
);

window.addEventListener("offline", showConnectionStatus);
window.addEventListener("online", () => {
  setStatus("Internet voltou. Toque em Atualizar para carregar os dados.", "success");
  setLoginStatus("");
});

document.addEventListener("click", async (event) => {
  if (event.target.closest("[data-confirm-cancel]")) {
    closeConfirmation();
    return;
  }
  if (event.target.closest("[data-confirm-ok]")) {
    const action = pendingConfirmAction;
    pendingConfirmAction = null;
    if (action) await action();
    return;
  }
  if (event.target.closest("[data-sale-detail-close]")) {
    closeSaleDetailPanel();
    return;
  }
  const saleValuesToggle = event.target.closest("[data-sale-values-toggle]");
  if (saleValuesToggle) {
    const valuesCard = saleValuesToggle.closest(".sale-detail-values");
    const extra = valuesCard?.querySelector("[data-sale-values-extra]");
    if (extra) {
      const expanded = extra.classList.toggle("hidden") === false;
      saleValuesToggle.setAttribute("aria-expanded", String(expanded));
      saleValuesToggle.textContent = expanded ? "▲ Ocultar detalhamento" : "▼ Ver detalhamento";
    }
    return;
  }
  if (event.target.closest("[data-order-drawer-close]")) {
    closeOrderDrawer();
    return;
  }
  if (event.target.closest("[data-side-open]")) {
    openSideMenu();
    return;
  }
  if (event.target.closest("[data-side-close]")) {
    closeSideMenu();
    return;
  }
  const tab = event.target.closest("[data-tab]");
  if (tab) {
    switchTab(tab.dataset.tab);
    closeSideMenu();
  }
  const period = event.target.closest("[data-period]");
  if (period) {
    app.period = period.dataset.period;
    renderAll();
  }
  if (event.target.closest("[data-finance-month-prev]")) {
    const current = monthStartFromKey(app.financeMonth);
    current.setMonth(current.getMonth() - 1);
    applyFinanceMonth(monthKey(current));
    renderAll();
  }
  if (event.target.closest("[data-finance-month-next]")) {
    const current = monthStartFromKey(app.financeMonth);
    current.setMonth(current.getMonth() + 1);
    if (monthKey(current) <= monthKey()) {
      applyFinanceMonth(monthKey(current));
      renderAll();
    }
  }
  if (event.target.closest("[data-finance-current-month]")) {
    applyFinanceMonth(monthKey());
    renderAll();
  }
  if (event.target.closest("[data-toggle-cancelled-history]")) {
    app.showCancelledHistory = !app.showCancelledHistory;
    renderSalesHistory();
    return;
  }
  if (event.target.closest("[data-home-top-products-more]")) {
    app.homeTopProductsExpanded = !app.homeTopProductsExpanded;
    renderDashboard();
    return;
  }
  if (event.target.closest("[data-finance-filter-open]")) openFinanceFilter();
  if (event.target.closest("[data-finance-filter-close]")) closeFinanceFilter();
  const financeQuick = event.target.closest("[data-finance-quick]");
  if (financeQuick) applyFinanceQuickPeriod(financeQuick.dataset.financeQuick);
  if (event.target.closest("[data-finance-filter-apply]")) applyFinanceCustomDates();
  if (event.target.closest("[data-refresh]")) loadAll();
  if (event.target.closest("[data-store-status-toggle]")) toggleStoreStatus();
  if (event.target.closest("[data-store-message-save]")) saveClosedStoreMessage();
  if (event.target.closest("[data-stock-product-remove-image]")) clearStockProductImage();
  if (event.target.closest("[data-retry-products]")) {
    try {
      await loadProductsFromSupabase();
    } catch (error) {
      showToast("Nao foi possivel carregar o estoque.", "error");
    }
    return;
  }
  if (event.target.closest("[data-retry-sale-products]")) {
    app.salePickerLoading = true;
    app.salePickerError = "";
    renderSaleProductPicker();
    try {
      await loadProductsFromSupabase({ silent: true });
    } catch (error) {
      app.salePickerError = error.message || "Erro ao carregar produtos.";
      showToast("Nao foi possivel carregar os produtos.", "error");
    } finally {
      app.salePickerLoading = false;
      renderSaleProductPicker();
    }
    return;
  }
  if (event.target.closest("[data-open-orders]")) {
    app.orderStatusFilter = "pending";
    switchTab("orders");
    renderPendingOrders();
  }
  if (event.target.closest("[data-add-sale-item]")) {
    openSaleProductPicker();
    return;
  }
  if (event.target.closest("[data-close-sale-picker]")) {
    closeSaleProductPicker();
    return;
  }
  if (event.target.closest("[data-confirm-sale-picker]")) {
    confirmSaleProductPicker();
    return;
  }
  const pickerCategory = event.target.closest("[data-sale-picker-category]");
  if (pickerCategory) {
    app.salePickerCategory = pickerCategory.dataset.salePickerCategory || "all";
    renderSaleProductPicker();
    return;
  }
  const pickerProduct = event.target.closest("[data-sale-picker-product]");
  if (pickerProduct) {
    const id = String(pickerProduct.dataset.salePickerProduct || "");
    if (app.salePickerSelected.has(id)) app.salePickerSelected.delete(id);
    else app.salePickerSelected.add(id);
    renderSaleProductPicker();
    return;
  }
  const quantityStep = event.target.closest("[data-sale-quantity-step]");
  if (quantityStep) {
    const input = quantityStep.closest(".sale-item")?.querySelector('[name="quantidade"]');
    if (input) {
      const step = Number.parseInt(quantityStep.dataset.saleQuantityStep || "0", 10);
      const max = input.max ? Number.parseInt(input.max, 10) : Number.POSITIVE_INFINITY;
      input.value = String(Math.min(max, Math.max(1, toNumber(input.value) + step)));
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
  const routeOption = event.target.closest("[data-sale-route-option]");
  if (routeOption && saleForm?.elements.horario_rota) {
    saleForm.elements.horario_rota.value = routeOption.dataset.saleRouteOption;
    saleForm.elements.horario_rota.dispatchEvent(new Event("change", { bubbles: true }));
    const panel = routeOption.closest(".route-chip-panel");
    const toggle = panel?.querySelector("[data-sale-route-toggle]");
    panel?.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
    updateSaleTotal();
  }
  const routeToggle = event.target.closest("[data-sale-route-toggle]");
  if (routeToggle) {
    const panel = routeToggle.closest(".route-chip-panel");
    const isOpen = !panel?.classList.contains("open");
    panel?.classList.toggle("open", isOpen);
    routeToggle.setAttribute("aria-expanded", String(isOpen));
  }
  if (event.target.closest("[data-remove-sale-item]")) {
    event.target.closest(".sale-item")?.remove();
    updateSaleTotal();
  }
  const plus = event.target.closest("[data-stock-plus]");
  if (plus) {
    const input = $(`[data-stock-value="${plus.dataset.stockPlus}"]`);
    if (input) input.value = toNumber(input.value) + 1;
    updateStockSaveState(plus.dataset.stockPlus);
  }
  const minus = event.target.closest("[data-stock-minus]");
  if (minus) {
    const input = $(`[data-stock-value="${minus.dataset.stockMinus}"]`);
    if (input) input.value = Math.max(0, toNumber(input.value) - 1);
    updateStockSaveState(minus.dataset.stockMinus);
  }
  const save = event.target.closest("[data-stock-save]");
  if (save) saveStock(save.dataset.stockSave);
  const stockCategoryChip = event.target.closest("[data-stock-category-chip]");
  if (stockCategoryChip) {
    const category = stockCategoryChip.dataset.stockCategoryChip;
    if (category === "all") {
      app.stockCategories = [];
    } else if (app.stockCategories.includes(category)) {
      app.stockCategories = app.stockCategories.filter((item) => item !== category);
    } else {
      app.stockCategories = [...app.stockCategories, category];
    }
    app.stockCategory = app.stockCategories.length === 1 ? app.stockCategories[0] : "all";
    renderStock();
  }
  const historyMenuToggle = event.target.closest("[data-history-menu-toggle]");
  if (historyMenuToggle) {
    event.stopPropagation();
    toggleHistoryMenu(historyMenuToggle.dataset.historyMenuToggle);
    return;
  }
  if (!event.target.closest("[data-history-menu]")) closeHistoryMenus();
  const cancel = event.target.closest("[data-cancel-sale]");
  if (cancel) {
    event.stopPropagation();
    requestCancelSale(cancel.dataset.cancelSale);
    return;
  }
  const viewSale = event.target.closest("[data-view-sale]");
  if (viewSale) {
    event.stopPropagation();
    viewSaleDetails(viewSale.dataset.viewSale, viewSale);
    closeHistoryMenus();
    return;
  }
  const editSale = event.target.closest("[data-edit-sale]");
  if (editSale) {
    event.stopPropagation();
    closeSaleDetailPanel();
    closeHistoryMenus();
    loadSaleForEdit(editSale.dataset.editSale);
    return;
  }
  const viewOrder = event.target.closest("[data-view-order]");
  if (viewOrder) {
    event.stopPropagation();
    viewOrderDetails(viewOrder.dataset.viewOrder);
    closeHistoryMenus();
    return;
  }
  const historyMenuPlaceholder = event.target.closest("[data-history-menu-placeholder]");
  if (historyMenuPlaceholder) {
    event.stopPropagation();
    closeHistoryMenus();
    return;
  }
  const saleDetailRow = event.target.closest("[data-sale-detail-row]");
  if (saleDetailRow && !event.target.closest("button, a, input, select, textarea, [data-history-menu]")) {
    viewSaleDetails(saleDetailRow.dataset.saleDetailRow, saleDetailRow);
    return;
  }
  const orderDetailRow = event.target.closest("[data-order-detail-row]");
  if (orderDetailRow && !event.target.closest("button, a, input, select, textarea, [data-history-menu]")) {
    viewOrderDetails(orderDetailRow.dataset.orderDetailRow);
    return;
  }
  const editOrder = event.target.closest("[data-edit-order]");
  if (editOrder) loadOrderForEdit(editOrder.dataset.editOrder);
  if (event.target.closest("[data-confirm-edited-order]")) confirmEditedOrder();
  const cancelOrderButton = event.target.closest("[data-cancel-order]");
  if (cancelOrderButton) cancelOrder(cancelOrderButton.dataset.cancelOrder);
  const orderWhatsapp = event.target.closest("[data-open-order-whatsapp]");
  if (orderWhatsapp) openOrderWhatsApp(orderWhatsapp.dataset.openOrderWhatsapp);
  if (event.target.closest("[data-cancel-edit-sale]")) resetSaleForm();
  const editTeam = event.target.closest("[data-team-edit]");
  if (editTeam) editTeamMember(editTeam.dataset.teamEdit, editTeam.dataset.teamId);
  const toggleTeam = event.target.closest("[data-team-toggle]");
  if (toggleTeam) toggleTeamMember(toggleTeam.dataset.teamToggle, toggleTeam.dataset.teamId);
  const deleteTeam = event.target.closest("[data-team-delete]");
  if (deleteTeam) deleteTeamMember(deleteTeam.dataset.teamDelete, deleteTeam.dataset.teamId);
  const openCashDate = event.target.closest("[data-open-cash-date]");
  if (openCashDate) {
    app.cashDate = openCashDate.dataset.openCashDate;
    app.cashEditing = false;
    renderCashClosing();
  }
  if (event.target.closest("[data-add-change]")) changeCashBalance("adicao");
  if (event.target.closest("[data-adjust-change]")) changeCashBalance("ajuste");
  if (event.target.closest("[data-reopen-cash]")) reopenCash();
  if (event.target.closest("[data-save-exchange-check]")) saveExchangeCheck();
  const exchangeStep = event.target.closest("[data-exchange-step]");
  if (exchangeStep) {
    const input = $(`[data-exchange-count="${exchangeStep.dataset.exchangeStep}"]`);
    if (input) {
      const time = exchangeStep.dataset.exchangeStep;
      const previous = {
        sent: Math.max(0, Number.parseInt(input.value || "0", 10)),
        checked: Boolean($(`[data-exchange-checked="${time}"]`)?.checked),
      };
      const nextValue = Math.max(0, previous.sent + Number.parseInt(exchangeStep.dataset.step || "0", 10));
      input.value = String(nextValue);
      scheduleExchangeRowSave(time, { sent: nextValue }, previous);
    }
  }
  if (event.target.closest("[data-view-catalog]")) {
    window.location.href = "/";
  }
  if (event.target.closest("[data-edit-site]")) {
    sessionStorage.setItem("fumacinha_open_editor", "1");
    window.location.href = "/?admin=fumacinha";
  }
  if (event.target.closest("[data-logout]")) {
    await supabaseClient?.auth.signOut();
    renderAuth(false);
  }
});

document.addEventListener("input", (event) => {
  if (event.target.name === "taxa_entrega") app.deliveryManuallyEdited = true;
  if (event.target.name === "valor_recebido") {
    app.deliveryManuallyEdited = false;
    app.saleReceivedTouched = true;
  }
  if (event.target.closest(".sale-item") || ["desconto", "valor_recebido", "taxa_entrega", "troco", "pagamento_1_valor", "pagamento_2_valor"].includes(event.target.name)) updateSaleTotal();
  if (event.target.matches("[data-stock-search]")) {
    app.stockSearch = event.target.value;
    renderStock();
  }
  if (event.target.matches("[data-stock-product-image-url]")) {
    if (app.stockProductPreviewUrl) URL.revokeObjectURL(app.stockProductPreviewUrl);
    app.stockProductPreviewUrl = "";
    app.selectedStockProductImageFile = null;
    if (stockProductImageFile) stockProductImageFile.value = "";
    updateStockProductImagePreview(event.target.value.trim());
  }
  if (event.target.matches("[data-seller-search]")) {
    app.sellerSearch = event.target.value;
    renderTeamLists();
  }
  if (event.target.matches("[data-deliverer-search]")) {
    app.delivererSearch = event.target.value;
    renderTeamLists();
  }
  if (event.target.matches("[data-order-search]")) {
    app.orderSearch = event.target.value;
    renderPendingOrders();
  }
  if (event.target.matches("[data-client-search]")) {
    app.clientSearch = event.target.value;
    renderTopClients();
  }
  if (event.target.matches("[data-sale-product-search]")) {
    app.saleProductSearch = event.target.value;
    updateSaleProductFilterStatus();
    updateSaleTotal();
  }
  if (event.target.matches("[data-sale-picker-search]")) {
    app.salePickerSearch = event.target.value;
    renderSaleProductPicker();
  }
  if (event.target.matches("[data-stock-value]")) updateStockSaveState(event.target.dataset.stockValue);
  if (event.target.matches("[data-finance-date-start], [data-finance-date-end]")) {
    const status = $("[data-finance-filter-status]");
    if (status) status.textContent = "";
  }
  if (event.target.closest("[data-cash-form]")) {
    app.cashEditing = true;
    updateCashPreview();
  }
  if (event.target.matches("[data-exchange-count]")) {
    renderExchangeSummary();
  }
});

document.addEventListener("change", (event) => {
  if (event.target.matches("[data-analytics-period]")) {
    const key = event.target.dataset.analyticsPeriod;
    app.analyticsPeriods[key] = event.target.value || "month";
    if (key === "topProducts") app.homeTopProductsExpanded = false;
    renderAnalyticsFilters();
    renderDashboard();
    renderReports();
    renderTopClients();
  }
  if (event.target.matches("[data-period-preset]")) {
    app.period = event.target.value === "custom" ? "custom" : event.target.value;
    renderAll();
  }
  if (event.target.matches("[data-history-period]")) {
    app.historyPeriod = event.target.value || "month";
    renderSalesHistory();
  }
  if (event.target.matches("[data-home-period]")) {
    app.period = event.target.value || "today";
    renderAll();
  }
});

document.addEventListener("change", (event) => {
  if (event.target.matches("[data-stock-product-image-file]")) {
    selectStockProductImage(event.target.files?.[0] || null);
  }
  if (event.target.closest(".sale-item")) {
    if (event.target.name === "produto_id") {
      const row = event.target.closest(".sale-item");
      const price = row.querySelector('[name="valor_unitario"]');
      if (price) price.value = "";
      updateSaleItemPrices();
    }
    updateSaleTotal();
  }
  if (event.target.name === "forma_pagamento") {
    if (!isCashPayment(event.target.value)) app.saleReceivedTouched = false;
    updateSaleTotal();
  }
  if (event.target.name === "pagamento_dividido") updateSaleTotal();
  if (["pagamento_1_forma", "pagamento_2_forma"].includes(event.target.name)) updateSaleTotal();
  if (event.target.name === "teve_troco") updateSaleTotal();
  if (event.target.name === "pagamento_conferido") setPaymentCheckMessage("");
  if (event.target.name === "data_entrega" || event.target.name === "horario_rota") updateSaleTotal();
  if (event.target.matches("[data-exchange-count]")) {
    const time = event.target.dataset.exchangeCount;
    const saved = exchangeRowFromSaved(app.cashDate, time);
    const nextValue = Math.max(0, Number.parseInt(event.target.value || "0", 10));
    event.target.value = String(nextValue);
    scheduleExchangeRowSave(time, { sent: nextValue }, { sent: saved.sent, checked: saved.checked });
  }
  if (event.target.matches("[data-exchange-checked]")) {
    const time = event.target.dataset.exchangeChecked;
    const saved = exchangeRowFromSaved(app.cashDate, time);
    scheduleExchangeRowSave(time, { checked: Boolean(event.target.checked) }, { sent: saved.sent, checked: saved.checked });
  }
  if (["valor_recebido", "taxa_entrega", "troco", "pagamento_1_valor", "pagamento_2_valor"].includes(event.target.name)) {
    formatMoneyInput(event.target);
    updateSaleTotal();
  }
  const routeStatus = event.target.closest("[data-route-status]");
  if (routeStatus) updateDeliveryStatus(routeStatus.dataset.routeStatus, routeStatus.value);
  if (event.target.matches("[data-routes-date]")) {
    app.routesDate = event.target.value || localDateValue();
    renderRoutes();
  }
  if (event.target.matches("[data-routes-filter]")) {
    app.routesFilter = event.target.value;
    renderRoutes();
  }
  if (event.target.matches("[data-sales-status-filter]")) {
    app.orderStatusFilter = event.target.value;
    renderPendingOrders();
  }
  if (event.target.matches("[data-order-sort]")) {
    app.orderSort = event.target.value;
    renderPendingOrders();
  }
  if (event.target.matches("[data-sale-product-category]")) {
    app.saleProductCategory = event.target.value || "all";
    updateSaleProductFilterStatus();
    updateSaleTotal();
  }
  if (event.target.name === "vendedora_id") localStorage.setItem(LAST_SELLER_KEY, event.target.value);
  if (event.target.name === "entregador_id") {
    if (event.target.value) localStorage.setItem(LAST_DELIVERER_KEY, event.target.value);
    else localStorage.removeItem(LAST_DELIVERER_KEY);
  }
  if (event.target.matches("[data-stock-category]")) {
    app.stockCategories = event.target.value === "all" ? [] : [event.target.value];
    app.stockCategory = event.target.value;
    renderStock();
  }
  if (event.target.matches("[data-stock-filter]")) {
    app.stockFilter = event.target.value;
    renderStock();
  }
  if (event.target.matches("[data-stock-sort]")) {
    app.stockSort = event.target.value;
    renderStock();
  }
  if (event.target.matches("[data-date-start], [data-date-end]")) renderAll();
  if (event.target.matches("[data-cash-date]")) {
    app.cashDate = event.target.value || localDateValue();
    app.cashEditing = false;
    renderCashClosing();
  }
  if (event.target.closest("[data-cash-form]") && event.target.tagName === "INPUT") {
    formatMoneyInput(event.target);
    updateCashPreview();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const saleRow = event.target.closest?.("[data-sale-detail-row]");
    if (saleRow) {
      event.preventDefault();
      viewSaleDetails(saleRow.dataset.saleDetailRow, saleRow);
      return;
    }
    const orderRow = event.target.closest?.("[data-order-detail-row]");
    if (orderRow) {
      event.preventDefault();
      viewOrderDetails(orderRow.dataset.orderDetailRow);
      return;
    }
  }
  if (event.key !== "Escape") return;
  if (saleProductSheet?.classList.contains("open")) {
    closeSaleProductPicker();
    return;
  }
  if (confirmShell?.classList.contains("open")) {
    closeConfirmation();
    return;
  }
  if (saleDetailShell?.classList.contains("open")) {
    closeSaleDetailPanel();
    return;
  }
  if ($$("[data-history-menu]").some((menu) => !menu.classList.contains("hidden"))) {
    closeHistoryMenus();
    return;
  }
  if (orderDrawerShell?.classList.contains("open")) {
    closeOrderDrawer();
  }
});

function initDefaults() {
  ensureClientsTab();
  ensureSplitPaymentPanel();
  app.cashDate = localDateValue();
  app.routesDate = localDateValue();
  if (cashDateInput) cashDateInput.value = app.cashDate;
  if (routesDateInput) routesDateInput.value = app.routesDate;
  setSuggestedDeliveryRoute();
  if (saleForm?.elements.valor_recebido) saleForm.elements.valor_recebido.value = "";
  if (saleForm?.elements.taxa_entrega) saleForm.elements.taxa_entrega.value = "";
  if (saleForm?.elements.troco) saleForm.elements.troco.value = "";
  const expenseDateInput = expenseForm?.elements.data_despesa;
  if (expenseDateInput) expenseDateInput.value = dateValue();
  updateSaleTotal();
}

initDefaults();
requireAuth().then((isAuthenticated) => {
  if (isAuthenticated) loadAll();
});
