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
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const COMMISSION_BASE = 0.5;
const COMMISSION_CARD_EXTRA = 1;
const ROUTE_TIMES = ["11:00", "13:00", "15:00", "17:00", "19:00", "21:00"];
const LAST_SELLER_KEY = "fumacinha:lastSellerId";
const LAST_DELIVERER_KEY = "fumacinha:lastDelivererId";
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
  period: "today",
  activeTab: "home",
  stockSearch: "",
  stockCategory: "all",
  stockFilter: "all",
  stockSort: "filter",
  user: null,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const loginView = $("[data-login-view]");
const controlView = $("[data-control-view]");
const bottomNav = $("[data-bottom-nav]");
const loginForm = $("[data-login-form]");
const loginStatus = $("[data-login-status]");
const appStatus = $("[data-app-status]");
const saleForm = $("[data-sale-form]");
const saleItemsRoot = $("[data-sale-items]");
const saleProductSearchInput = $("[data-sale-product-search]");
const saleProductCategorySelect = $("[data-sale-product-category]");
const stockList = $("[data-stock-list]");
const stockHistory = $("[data-stock-history]");
const salesHistory = $("[data-sales-history]");
const pendingOrdersRoot = $("[data-pending-orders]");
const salesStatusFilter = $("[data-sales-status-filter]");
const orderSearchInput = $("[data-order-search]");
const orderSortSelect = $("[data-order-sort]");
const pendingTitle = $("[data-pending-title]");
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
const confirmEditedOrderButton = $("[data-confirm-edited-order]");
const saleEditBanner = $("[data-sale-edit-banner]");
const saleEditLabel = $("[data-sale-edit-label]");
const saleEditMotive = $("[data-sale-edit-motive]");
const cashDateInput = $("[data-cash-date]");
const cashForm = $("[data-cash-form]");
const cashHistory = $("[data-cash-history]");
const cashStatus = $("[data-cash-status]");
const changeHistory = $("[data-change-history]");
const routesDateInput = $("[data-routes-date]");
const routesFilterSelect = $("[data-routes-filter]");
const routesList = $("[data-routes-list]");
let toastTimer = null;

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

function periodRange() {
  const now = new Date();
  if (app.period === "yesterday") {
    const day = new Date(now);
    day.setDate(day.getDate() - 1);
    return { start: startOfDay(day), end: endOfDay(day) };
  }
  if (app.period === "last7") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return { start: startOfDay(start), end: endOfDay(now) };
  }
  if (app.period === "month") {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfDay(now) };
  }
  if (app.period === "custom") {
    const startInput = $("[data-date-start]")?.value;
    const endInput = $("[data-date-end]")?.value;
    const start = startInput ? startOfDay(new Date(`${startInput}T00:00:00`)) : startOfDay(now);
    const end = endInput ? endOfDay(new Date(`${endInput}T00:00:00`)) : endOfDay(now);
    return { start, end };
  }
  return { start: startOfDay(now), end: endOfDay(now) };
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
  const start = startOfDay(new Date());
  const end = endOfDay(new Date());
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
  if (pendingNavBadge) {
    pendingNavBadge.textContent = String(count);
    pendingNavBadge.classList.toggle("hidden", count <= 0);
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

function orderPhone(order) {
  return normalizePhone(order.cliente_telefone || order.telefone || "");
}

function orderWhatsappUrl(order) {
  const phone = orderPhone(order);
  if (!phone) return "";
  const text = `Ola, ${order.cliente_nome || "cliente"}! Estou entrando em contato sobre o pedido ${order.codigo || order.id} da Fumacinha.`;
  return `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(text)}`;
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
    `🔔 Novo pedido recebido\n${order.codigo || `Pedido #${order.id}`}\n${order.cliente_nome || "Cliente"}\n${currency.format(order.valor_produtos || 0)}\nRecebido as ${receivedAt}`,
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

function saleGrandTotal(sale) {
  return toNumber(sale.total_venda || sale.valor_recebido || saleTotal(sale) + saleDelivery(sale));
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
  return toNumber(sale.taxa_entrega || 0);
}

function saleCommission(sale) {
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

function commissionForPayment(payment) {
  const normalized = normalizePayment(payment);
  const card = normalized === "debito" || normalized === "credito";
  const cardExtra = card ? COMMISSION_CARD_EXTRA : 0;
  return {
    base: COMMISSION_BASE,
    card: cardExtra,
    total: COMMISSION_BASE + cardExtra,
  };
}

function productImage(product) {
  return product?.imagem || "./assets/fumacinha-logo.png";
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
  const cost = sales.reduce((sum, sale) => sum + saleCost(sale), 0);
  const expenseTotal = expenses.reduce((sum, expense) => sum + toNumber(expense.valor), 0);
  const gross = revenue - cost;
  const net = gross - expenseTotal - commission;
  const quantity = sales.reduce((sum, sale) => sum + toNumber(sale.quantidade || sale.quantidade_total), 0);
  return {
    revenue,
    received,
    delivery,
    commission,
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
  bottomNav?.classList.toggle("hidden", !isAuthenticated);
}

async function requireAuth() {
  if (!supabaseClient) {
    setLoginStatus("Configure o Supabase da Fumacinha antes de acessar.", "error");
    renderAuth(false);
    return false;
  }

  const { data, error } = await supabaseClient.auth.getSession();
  if (error || !data.session?.user) {
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

async function loadAll() {
  if (!(await requireAuth())) return;
  setStatus("Carregando controle...", "loading");
  const [productsResult, salesResult, itemsResult, ordersResult, orderItemsResult, movesResult, expensesResult, deliverersResult, sellersResult, payoutsResult, closingsResult, cashMovesResult, changeBoxResult, changeMovesResult] = await Promise.allSettled([
    supabaseClient.from(TABLES.products).select("*").order("nome", { ascending: true }),
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
  ]);

  const errors = [productsResult, salesResult, itemsResult, ordersResult, orderItemsResult, movesResult, expensesResult, deliverersResult, sellersResult, payoutsResult, closingsResult, cashMovesResult, changeBoxResult, changeMovesResult]
    .filter((result) => result.status === "fulfilled" && result.value.error)
    .map((result) => result.value.error.message);

  if (errors.length) {
    setStatus(`Erro ao carregar: ${errors[0]}`, "error");
    return;
  }

  const loadedProducts = productsResult.value.data || [];
  try {
    app.products = await ensureDukeAvailability(loadedProducts);
  } catch (error) {
    app.products = loadedProducts;
    console.error("Erro ao corrigir disponibilidade do Duke:", error);
  }
  app.sales = salesResult.value.data || [];
  app.saleItems = itemsResult.value.data || [];
  app.orders = ordersResult.value.data || [];
  app.orderItems = orderItemsResult.value.data || [];
  app.stockMoves = movesResult.value.data || [];
  app.expenses = expensesResult.value.data || [];
  app.deliverers = deliverersResult.value.data || [];
  app.sellers = sellersResult.value.data || [];
  app.deliveryPayouts = payoutsResult.value.data || [];
  app.cashClosings = closingsResult.value.data || [];
  app.cashMovements = cashMovesResult.value.data || [];
  app.changeBox = changeBoxResult.value.data?.[0] || null;
  app.changeMoves = changeMovesResult.value.data || [];
  markOrdersSeen();
  setupOrdersRealtime();
  setStatus("Controle atualizado.", "success");
  renderAll();
}

function renderAll() {
  renderPeriods();
  renderPeopleOptions();
  renderDashboard();
  renderSaleProductFilters();
  renderSaleItems();
  updateSaleItemPrices();
  updateSaleTotal();
  renderPendingOrders();
  renderSalesHistory();
  renderStock();
  renderFinance();
  renderReports();
  renderCashClosing();
  renderRoutes();
}

function renderPeriods() {
  $$("[data-period]").forEach((button) => button.classList.toggle("active", button.dataset.period === app.period));
  $("[data-custom-period]")?.classList.toggle("hidden", app.period !== "custom");
}

function renderPeopleOptions() {
  if (sellerSelect) {
    const activeSellers = app.sellers.filter((seller) => seller.ativo !== false);
    const stored = localStorage.getItem(LAST_SELLER_KEY) || "";
    sellerSelect.innerHTML = `<option value="">Selecione a vendedora</option>${activeSellers
      .map((seller) => `<option value="${seller.id}">${escapeHtml(seller.nome)}</option>`)
      .join("")}`;
    if (activeSellers.some((seller) => String(seller.id) === String(stored))) sellerSelect.value = stored;
  }
  if (delivererSelect) {
    const activeDeliverers = app.deliverers.filter((deliverer) => deliverer.ativo !== false);
    const stored = localStorage.getItem(LAST_DELIVERER_KEY) || "";
    delivererSelect.innerHTML = `<option value="">Sem entregador</option>${activeDeliverers
      .map((deliverer) => `<option value="${deliverer.id}">${escapeHtml(deliverer.nome)}</option>`)
      .join("")}`;
    if (activeDeliverers.some((deliverer) => String(deliverer.id) === String(stored))) delivererSelect.value = stored;
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

function renderDashboard() {
  const selected = filteredSales();
  const selectedSummary = summaryFor(selected);
  const today = summaryFor(todaySales(), []);
  const todayRows = todaySales();
  const linkedSaleIds = new Set(app.orders.map((order) => String(order.venda_id || "")));
  const manualToday = todayRows.filter((sale) => !linkedSaleIds.has(String(sale.id))).length;
  const { start, end } = periodRange();
  const pending = pendingOrders();
  const confirmedToday = app.orders.filter((order) => {
    const status = normalizeOrderStatus(order.status);
    const date = new Date(order.confirmado_em || order.updated_at || order.created_at || Date.now());
    return status === "confirmado" && date >= start && date <= end;
  });
  const cancelled = app.orders.filter((order) => {
    const status = normalizeOrderStatus(order.status);
    const date = new Date(order.cancelado_em || order.updated_at || order.created_at || Date.now());
    return status === "cancelado" && date >= start && date <= end;
  });
  const lowStock = app.products.filter((product) => toNumber(product.estoque) <= 5).length;

  $("[data-kpi-pending-orders]").textContent = String(pending.length);
  $("[data-kpi-manual-sales-today]").textContent = String(manualToday);
  $("[data-kpi-confirmed-orders-today]").textContent = String(confirmedToday.length);
  $("[data-kpi-cancelled-orders]").textContent = String(cancelled.length);
  $("[data-kpi-revenue-today]").textContent = currency.format(today.revenue);
  $("[data-kpi-ticket]").textContent = currency.format(selectedSummary.ticket);
  $("[data-kpi-received]").textContent = currency.format(selectedSummary.received);
  $("[data-kpi-delivery]").textContent = currency.format(selectedSummary.delivery);
  $("[data-kpi-commission]").textContent = currency.format(selectedSummary.commission);
  $("[data-kpi-profit]").textContent = currency.format(selectedSummary.net);
  $("[data-kpi-low-stock]").textContent = String(lowStock);

  renderList("[data-report-top-products]", rankedProducts(selected).slice(0, 5), "Nenhuma venda no periodo.");
  renderRevenueReport(selected);
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

function saleProducts(selected = "") {
  const selectedText = String(selected || "");
  return app.products.filter((product) => {
    const isSelected = selectedText && String(product.id) === selectedText;
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

function productOptions(selected = "") {
  const rows = saleProducts(selected);
  return rows.length
    ? rows.map((product) => `<option value="${product.id}" ${String(product.id) === String(selected) ? "selected" : ""}>${escapeHtml(product.nome)} (${toNumber(product.estoque)} un)</option>`).join("")
    : '<option value="">Sem produtos em estoque</option>';
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

function saleItemTemplate(item = {}) {
  const firstProduct = item.product || app.products.find((product) => String(product.id) === String(item.produto_id)) || firstAvailableProduct();
  return `
    <article class="sale-item">
      <div class="sale-product-preview" data-sale-product-preview>
        <img src="${escapeHtml(productImage(firstProduct))}" alt="${escapeHtml(firstProduct?.nome || "Produto")}" loading="lazy" decoding="async" />
        <div>
          <strong>${escapeHtml(firstProduct?.nome || "Selecione um produto")}</strong>
          <span>${escapeHtml(firstProduct?.categoria || "Produto")}</span>
        </div>
      </div>
      <label>Produto <select name="produto_id">${productOptions(firstProduct?.id || "")}</select></label>
      <label>Qtd <input type="number" name="quantidade" min="1" step="1" value="${toNumber(item.quantidade || 1)}" /></label>
      <label>Valor unitario <input type="number" name="valor_unitario" min="0" step="0.01" value="${item.valor_unitario !== undefined ? toNumber(item.valor_unitario).toFixed(2) : ""}" /></label>
      <div class="sale-line-total"><span>Subtotal</span><strong data-item-subtotal>R$ 0,00</strong></div>
      <button class="ghost-action" type="button" data-remove-sale-item>Remover</button>
    </article>
  `;
}

function renderSaleItems() {
  if (!saleItemsRoot || saleItemsRoot.children.length) return;
  saleItemsRoot.innerHTML = saleItemTemplate();
  updateSaleItemPrices();
  updateSaleTotal();
}

function updateSaleItemPrices() {
  $$(".sale-item").forEach((row) => {
    const select = row.querySelector('[name="produto_id"]');
    const price = row.querySelector('[name="valor_unitario"]');
    const product = app.products.find((item) => String(item.id) === String(select?.value));
    if (select) select.innerHTML = productOptions(select.value);
    const quantityInput = row.querySelector('[name="quantidade"]');
    if (quantityInput && product) quantityInput.max = Math.max(1, toNumber(product.estoque));
    if (product && price && !price.value) price.value = toNumber(product.preco).toFixed(2);
    updateSaleItemPreview(row, product);
  });
}

function updateSaleItemPreview(row, product) {
  const quantity = toNumber(row.querySelector('[name="quantidade"]')?.value);
  const unitValue = parseMoney(row.querySelector('[name="valor_unitario"]')?.value);
  const subtotal = row.querySelector("[data-item-subtotal]");
  const preview = row.querySelector("[data-sale-product-preview]");
  if (subtotal) subtotal.textContent = currency.format(quantity * unitValue);
  if (!preview) return;
  preview.innerHTML = `
    <img src="${escapeHtml(productImage(product))}" alt="${escapeHtml(product?.nome || "Produto")}" loading="lazy" decoding="async" />
    <div>
      <strong>${escapeHtml(product?.nome || "Selecione um produto")}</strong>
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
  const cash = isCashPayment(payment);
  const hasChange = saleForm?.elements.teve_troco?.value === "sim";
  const paidInput = saleForm?.elements.valor_recebido;
  const changeInput = saleForm?.elements.troco;
  const deliveryInput = saleForm?.elements.taxa_entrega;
  if (paidInput && !app.saleReceivedTouched && productsValue > 0) {
    paidInput.value = productsValue.toFixed(2).replace(".", ",");
  }
  const paidValue = parseMoney(paidInput?.value);
  const changeValue = cash && hasChange ? parseMoney(changeInput?.value) : 0;
  const deliveryValue = paidValue - productsValue - changeValue;
  const totalSale = productsValue + Math.max(0, deliveryValue);
  return {
    productsValue,
    payment,
    cash,
    hasChange,
    paidValue,
    changeValue,
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
  if (deliveryInput) {
    deliveryInput.readOnly = true;
    if (draft.cash) deliveryInput.value = Math.max(0, draft.deliveryValue).toFixed(2).replace(".", ",");
    else deliveryInput.value = Math.max(0, draft.deliveryValue).toFixed(2).replace(".", ",");
  }
  if (changeInput && !draft.hasChange) changeInput.value = "";
  const commission = commissionForPayment(draft.payment);
  const receivedInvalid = app.saleReceivedTouched && draft.paidValue < draft.productsValue;
  const changeInvalid = draft.cash && draft.hasChange && (!String(changeInput?.value || "").trim() || draft.changeValue < 0);
  const deliveryInvalid = draft.deliveryValue < 0;

  $("[data-sale-products]").textContent = currency.format(draft.productsValue);
  $("[data-sale-received]").textContent = currency.format(draft.paidValue);
  $("[data-sale-delivery]").textContent = currency.format(Math.max(0, draft.deliveryValue));
  $("[data-sale-net-products]").textContent = currency.format(draft.productsValue);
  $("[data-sale-change]").textContent = currency.format(draft.changeValue);
  $("[data-sale-payment]").textContent = draft.payment;
  $("[data-sale-commission]").textContent = currency.format(commission.total);
  $("[data-sale-route-summary]").textContent = `${formatDateBR(draft.routeDate)} as ${draft.routeTime}`;
  $$("[data-sale-cash-only]").forEach((element) => element.classList.toggle("hidden", !draft.cash));
  $$("[data-sale-change-field]").forEach((element) => element.classList.toggle("hidden", !draft.cash || !draft.hasChange));
  if (saleWarning) {
    saleWarning.textContent = receivedInvalid
      ? "Valor pago menor que o valor dos produtos."
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
  const productsValue = Math.max(0, subtotal - discount);
  if (Math.abs(productsValue - draft.productsValue) > 0.01) throw new Error("Revise os valores da venda.");
  if (draft.paidValue < draft.productsValue) throw new Error("Valor pago menor que o valor dos produtos.");
  if (draft.cash && draft.hasChange && !String(saleForm.elements.troco.value || "").trim()) throw new Error("Informe o valor do troco entregue.");
  if (draft.cash && draft.changeValue < 0) throw new Error("Troco nao pode ser negativo.");
  if (draft.deliveryValue < 0) throw new Error("A taxa de entrega ficou negativa.");
  const deliveryValue = Math.max(0, draft.deliveryValue);
  const totalSale = draft.productsValue + deliveryValue;
  const paymentLabel = draft.payment;
  const deliveredValue = draft.paidValue;
  const changeValue = draft.cash && draft.hasChange ? draft.changeValue : 0;
  const commission = commissionForPayment(paymentLabel);
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
      observacao: saleForm.elements.observacao.value.trim(),
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
  app.editingSaleId = null;
  app.editingOrderId = null;
  app.confirmingOrderId = null;
  saleForm.reset();
  saleForm.elements.desconto.value = "0";
  saleForm.elements.valor_recebido.value = "";
  saleForm.elements.troco.value = "";
  saleForm.elements.teve_troco.value = "nao";
  saleForm.elements.taxa_entrega.value = "";
  saleForm.elements.motivo_alteracao.value = "";
  if (saleForm.elements.bairro) saleForm.elements.bairro.value = "";
  if (saleForm.elements.telefone) saleForm.elements.telefone.value = "";
  if (saleForm.elements.status_entrega) saleForm.elements.status_entrega.value = "Aguardando";
  app.deliveryManuallyEdited = false;
  app.saleReceivedTouched = false;
  setSuggestedDeliveryRoute();
  saleItemsRoot.innerHTML = saleItemTemplate();
  renderPeopleOptions();
  saleEditBanner?.classList.add("hidden");
  saleEditMotive?.classList.add("hidden");
  confirmEditedOrderButton?.classList.add("hidden");
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
  saleForm.elements.forma_pagamento.value = sale.forma_pagamento || "Pix";
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
  saleForm.elements.observacao.value = sale.observacao || "";
  saleForm.elements.motivo_alteracao.value = "";
  saleEditBanner?.classList.remove("hidden");
  saleEditMotive?.classList.remove("hidden");
  confirmEditedOrderButton?.classList.add("hidden");
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
  app.saleSaving = true;
  if (saleSubmit) {
    saleSubmit.disabled = true;
    saleSubmit.textContent = confirmingOrderId ? "Confirmando pedido..." : "Registrando venda...";
  }
  if (saleSuccess) saleSuccess.textContent = "";
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
  } catch (error) {
    if (reservedOrderId && !saleCreated) {
      await supabaseClient
        .from(TABLES.orders)
        .update({ status: "Aguardando confirmacao", updated_at: new Date().toISOString() })
        .eq("id", reservedOrderId)
        .eq("status", "Em separacao");
    }
    setStatus(error.message || "Erro ao registrar venda.", "error");
  } finally {
    app.saleSaving = false;
    if (saleSubmit) {
      saleSubmit.disabled = false;
      saleSubmit.textContent = app.confirmingOrderId ? "Confirmar e registrar venda" : "Registrar venda";
    }
  }
}

async function updateEditedSale(event) {
  event.preventDefault();
  if (app.saleSaving || !app.editingSaleId) return;
  const sale = app.sales.find((item) => String(item.id) === String(app.editingSaleId));
  if (!sale || sale.cancelada) return setStatus("Venda cancelada nao pode ser editada.", "error");
  const motive = saleForm.elements.motivo_alteracao.value.trim();
  if (!motive) return setStatus("Informe o motivo da alteracao.", "error");
  app.saleSaving = true;
  if (saleSubmit) {
    saleSubmit.disabled = true;
    saleSubmit.textContent = "Salvando alteracoes...";
  }
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
    setStatus(error.message || "Erro ao editar venda.", "error");
  } finally {
    app.saleSaving = false;
    if (saleSubmit) {
      saleSubmit.disabled = false;
      saleSubmit.textContent = app.editingSaleId ? "Salvar alteracoes" : "Registrar venda";
    }
  }
}

function saveSale(event) {
  if (app.editingOrderId) return saveOrderEdit(event);
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

function renderPendingOrders() {
  if (!pendingOrdersRoot) return;
  updatePendingBadges();
  if (salesStatusFilter) salesStatusFilter.value = app.orderStatusFilter;
  if (orderSearchInput) orderSearchInput.value = app.orderSearch;
  if (orderSortSelect) orderSortSelect.value = app.orderSort;
  const search = app.orderSearch.trim().toLowerCase();
  const rows = sortedOrders(ordersForCurrentStatusFilter()
    .filter((order) => !search || orderSearchText(order).includes(search)));
  pendingOrdersRoot.innerHTML = rows.length
    ? rows.map((order) => {
      const items = orderItems(order.id);
      const isPending = normalizeOrderStatus(order.status) === "aguardando confirmacao";
      const phoneUrl = orderWhatsappUrl(order);
      return `
        <article class="history-row ${isPending ? "pending-order" : ""} ${normalizeOrderStatus(order.status) === "cancelado" ? "cancelled" : ""}" data-order-row="${order.id}">
          <div class="pending-order-main">
            <strong>${escapeHtml(order.codigo || `Pedido #${order.id}`)} - ${escapeHtml(order.cliente_nome || "Cliente")}</strong>
            ${isPending ? `<span class="status-badge">Aguardando confirmacao</span>` : `<span class="status-badge">${escapeHtml(order.status || "Sem status")}</span>`}
          </div>
          <div class="pending-order-meta">
            <span>${new Date(order.created_at || Date.now()).toLocaleString("pt-BR")}</span>
            <span>${currency.format(order.valor_produtos || 0)}</span>
            <span>${escapeHtml(order.origem || "Site")}</span>
            ${order.data_entrega || order.horario_rota ? `<span>Entrega: ${escapeHtml(formatDateBR(order.data_entrega || localDateValue()))} as ${escapeHtml(order.horario_rota || "--:--")}</span>` : ""}
          </div>
          <span>${items.map((item) => `${toNumber(item.quantidade)}x ${escapeHtml(item.produto_nome)}`).join(" | ") || "Sem itens"}</span>
          ${order.motivo_cancelamento ? `<span>Motivo: ${escapeHtml(order.motivo_cancelamento)}</span>` : ""}
          <div class="history-actions">
            <button type="button" data-view-order="${order.id}">Ver detalhes</button>
            ${phoneUrl ? `<button type="button" data-open-order-whatsapp="${order.id}">Abrir conversa no WhatsApp</button>` : `<span>Telefone nao informado</span>`}
            ${isPending ? `<button type="button" data-edit-order="${order.id}">Editar pedido</button><button type="button" data-cancel-order="${order.id}">Cancelar pedido</button>` : ""}
          </div>
        </article>
      `;
    }).join("")
    : "<p>Nenhum pedido para este filtro.</p>";
}

function renderSalesHistory() {
  if (!salesHistory) return;
  const rows = app.sales.filter(saleMatchesPeriod);
  salesHistory.innerHTML = rows.length
    ? rows.slice(0, 40).map((sale) => `
      <article class="history-row ${sale.cancelada ? "cancelled" : ""}">
        <strong>${escapeHtml(sale.nome_produto || "Venda")}</strong>
        <span>Venda registrada em: ${new Date(sale.created_at || sale.data_venda || Date.now()).toLocaleString("pt-BR")}</span>
        <span>Entrega prevista: ${formatDateBR(saleRouteDate(sale))} as ${saleRouteTime(sale) || "--:--"}</span>
        <span>Produtos ${currency.format(saleTotal(sale))} | Valor pago ${currency.format(saleDeliveredValue(sale))}</span>
        <span>Total ${currency.format(saleGrandTotal(sale))} | Entrega ${currency.format(saleDelivery(sale))}</span>
        ${isCashPayment(sale.forma_pagamento) ? `<span>Entregue ${currency.format(saleDeliveredValue(sale))} | Troco ${currency.format(saleChangeValue(sale))}</span>` : ""}
        <span>${escapeHtml(sale.forma_pagamento || "Pagamento nao informado")} | ${escapeHtml(sale.vendedora_nome || "Vendedora nao informada")} ${sale.cancelada ? "- Cancelada" : ""}</span>
        <div class="history-actions">
          <button type="button" data-view-sale="${sale.id}">Ver detalhes</button>
          ${sale.cancelada ? "" : `<button type="button" data-edit-sale="${sale.id}">Editar venda</button><button type="button" data-cancel-sale="${sale.id}">Cancelar venda</button>`}
        </div>
      </article>
    `).join("")
    : "<p>Nenhuma venda confirmada para este filtro.</p>";
}

function viewSaleDetails(saleId) {
  const sale = app.sales.find((item) => String(item.id) === String(saleId));
  if (!sale) return;
  const items = app.saleItems.filter((item) => String(item.venda_id) === String(saleId));
  window.alert([
    `Venda #${sale.id}`,
    `Cliente: ${sale.cliente_nome || "Nao informado"}`,
    `Produtos: ${items.map((item) => `${item.quantidade}x ${item.nome_produto}`).join(", ") || sale.nome_produto}`,
    `Valor produtos: ${currency.format(saleTotal(sale))}`,
    `Valor pago: ${currency.format(saleDeliveredValue(sale))}`,
    `Taxa entrega: ${currency.format(saleDelivery(sale))}`,
    `Pagamento: ${sale.forma_pagamento || "Nao informado"}`,
    `Entrega: ${formatDateBR(saleRouteDate(sale))} as ${saleRouteTime(sale) || "--:--"}`,
    `Status: ${sale.status_entrega || sale.status || "Nao informado"}`,
  ].join("\n"));
}

function viewOrderDetails(orderId) {
  const order = app.orders.find((item) => String(item.id) === String(orderId));
  if (!order) return;
  const items = orderItems(orderId);
  window.alert([
    `Pedido ${order.codigo || `#${order.id}`}`,
    `Cliente: ${order.cliente_nome || "Nao informado"}`,
    `Bairro: ${order.cliente_bairro || "Nao informado"}`,
    `Produtos: ${items.map((item) => `${item.quantidade}x ${item.produto_nome}`).join(", ") || "Sem itens"}`,
    `Valor produtos: ${currency.format(order.valor_produtos || 0)}`,
    `Origem: ${order.origem || "Site"}`,
    `Status: ${order.status || "Aguardando confirmacao"}`,
    `Recebido em: ${new Date(order.created_at || Date.now()).toLocaleString("pt-BR")}`,
  ].join("\n"));
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
  saleForm.elements.forma_pagamento.value = order.forma_pagamento || "Pix";
  saleForm.elements.valor_recebido.value = toNumber(order.valor_pago_cliente || order.valor_produtos).toFixed(2).replace(".", ",");
  saleForm.elements.teve_troco.value = order.teve_troco || toNumber(order.troco) > 0 ? "sim" : "nao";
  saleForm.elements.troco.value = toNumber(order.troco || 0) ? toNumber(order.troco).toFixed(2).replace(".", ",") : "";
  saleForm.elements.taxa_entrega.value = toNumber(order.taxa_entrega || 0).toFixed(2).replace(".", ",");
  saleForm.elements.cliente.value = order.cliente_nome || "";
  if (saleForm.elements.bairro) saleForm.elements.bairro.value = order.cliente_bairro || "";
  if (saleForm.elements.telefone) saleForm.elements.telefone.value = order.cliente_telefone || "";
  if (saleForm.elements.status_entrega) saleForm.elements.status_entrega.value = order.status_entrega || "Aguardando";
  saleForm.elements.observacao.value = order.observacao_interna || `Pedido ${order.codigo || order.id} recebido pelo site. Bairro: ${order.cliente_bairro || ""}`;
  saleForm.elements.motivo_alteracao.value = "";
  app.saleReceivedTouched = true;
  renderPeopleOptions();
  saleForm.elements.vendedora_id.value = order.vendedora_id || localStorage.getItem(LAST_SELLER_KEY) || "";
  saleForm.elements.entregador_id.value = order.entregador_id || localStorage.getItem(LAST_DELIVERER_KEY) || "";
  saleForm.elements.data_entrega.value = order.data_entrega || localDateValue();
  saleForm.elements.horario_rota.value = order.horario_rota || nextRouteSuggestion().time;
  saleEditBanner?.classList.remove("hidden");
  saleEditMotive?.classList.remove("hidden");
  if (saleEditLabel) saleEditLabel.textContent = mode === "edit" ? `Editando ${order.codigo || `pedido #${order.id}`}` : `Confirmando ${order.codigo || `pedido #${order.id}`}`;
  if (saleSubmit) saleSubmit.textContent = mode === "edit" ? "Salvar alteracoes do pedido" : "Confirmar pedido e registrar venda";
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
    if (draft.paidValue < draft.productsValue) throw new Error("Valor pago menor que o valor dos produtos.");
    if (draft.deliveryValue < 0) throw new Error("A taxa de entrega ficou negativa.");
    const previous = {
      pedido: order,
      itens: orderItems(order.id),
    };
    const motivo = saleForm.elements.motivo_alteracao.value.trim();
    const payload = {
      cliente_nome: saleForm.elements.cliente.value.trim(),
      cliente_bairro: saleForm.elements.bairro?.value.trim() || "",
      cliente_telefone: String(saleForm.elements.telefone?.value || "").replace(/\D/g, ""),
      forma_pagamento: draft.payment,
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
      observacao_interna: saleForm.elements.observacao.value.trim(),
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
  confirmEditedOrderButton?.classList.add("hidden");
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
  if (!categorySelect) return;
  const categories = [...new Set(app.products.map((product) => product.categoria || "Produtos"))].sort();
  categorySelect.innerHTML = `<option value="all">Todas as categorias</option>${categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}`;
  categorySelect.value = app.stockCategory;
}

function stockProducts() {
  const search = app.stockSearch.trim().toLowerCase();
  return app.products
    .filter((product) => !search || product.nome.toLowerCase().includes(search))
    .filter((product) => app.stockCategory === "all" || product.categoria === app.stockCategory)
    .filter((product) => app.stockFilter !== "low" || toNumber(product.estoque) <= 5)
    .sort((a, b) => {
      if (app.stockSort === "stock-asc") return toNumber(a.estoque) - toNumber(b.estoque);
      if (app.stockSort === "stock-desc") return toNumber(b.estoque) - toNumber(a.estoque);
      return 0;
    });
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
  stockList.innerHTML = stockProducts().map((product) => `
    <article class="stock-row" data-stock-row="${product.id}">
      <img src="${escapeHtml(product.imagem || "./assets/fumacinha-logo.png")}" alt="${escapeHtml(product.nome)}" />
      <div>
        <h3>${escapeHtml(product.nome)}</h3>
        <small>${escapeHtml(product.categoria || "Produtos")}</small>
        <p>Estoque atual: <strong class="${stockLevelClass(product.estoque)}">${toNumber(product.estoque)}</strong></p>
        <p>Custo: ${currency.format(productCost(product))} | Venda: ${currency.format(product.preco)}</p>
      </div>
      <div class="stock-actions">
        <div class="stock-quantity-control">
          <button class="stock-minus" type="button" data-stock-minus="${product.id}">−</button>
          <input class="stock-quantity-input" type="number" min="0" step="1" value="${toNumber(product.estoque)}" data-stock-value="${product.id}" data-stock-original="${toNumber(product.estoque)}" />
          <button class="stock-plus" type="button" data-stock-plus="${product.id}">+</button>
        </div>
        <button class="stock-save-button" type="button" data-stock-save="${product.id}" disabled>Salvar estoque</button>
        <span class="stock-save-status" data-stock-save-status="${product.id}">Estoque atualizado</span>
      </div>
    </article>
  `).join("");
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
    const successMessage = `✅ Estoque de “${product.nome}” salvo com sucesso!`;
    setStatus("Estoque atualizado.", "success");
    showToast(successMessage, "success");
    await loadAll();
  } catch (error) {
    console.error("Erro ao salvar estoque:", error);
    setStatus("Não foi possível salvar o estoque.", "error");
    showToast("❌ Não foi possível salvar o estoque.", "error");
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
    status.textContent = changed ? "Alteração não salva" : "Estoque atualizado";
    status.classList.toggle("unsaved", changed);
  }
}

function renderFinance() {
  const summary = summaryFor();
  const orders = filteredOrders();
  const pending = orders.filter((order) => normalizeOrderStatus(order.status) === "aguardando confirmacao");
  $("[data-finance-orders-received]").textContent = String(orders.length);
  $("[data-finance-orders-pending]").textContent = String(pending.length);
  $("[data-finance-sales-confirmed]").textContent = String(filteredSales().length);
  $("[data-finance-pending-potential]").textContent = currency.format(pending.reduce((sum, order) => sum + toNumber(order.valor_produtos), 0));
  $("[data-finance-revenue]").textContent = currency.format(summary.revenue);
  $("[data-finance-received]").textContent = currency.format(summary.received);
  $("[data-finance-delivery]").textContent = currency.format(summary.delivery);
  $("[data-finance-cost]").textContent = currency.format(summary.cost);
  $("[data-finance-commission]").textContent = currency.format(summary.commission);
  $("[data-finance-gross]").textContent = currency.format(summary.gross);
  $("[data-finance-expenses]").textContent = currency.format(summary.expenses);
  $("[data-finance-net]").textContent = currency.format(summary.net);
  renderExpenses();
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

function renderReports() {
  const sales = filteredSales();
  const ranked = rankedProducts(sales);
  const soldNames = new Set(ranked.map((row) => row.label));
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
    sales.reduce((acc, sale) => {
      const key = sale.forma_pagamento || "Nao informado";
      acc[key] = (acc[key] || 0) + saleTotal(sale);
      return acc;
    }, {})
  ).map(([label, total]) => ({ label, total }));
  renderList("[data-report-payments]", paymentRows, "Sem formas de pagamento no periodo.");
  renderList("[data-report-profit-product]", ranked.map((row) => ({ label: row.label, total: row.profit })), "Sem lucro por produto.");
  const stockTotal = app.products.reduce((sum, product) => sum + toNumber(product.estoque) * productCost(product), 0);
  renderList("[data-report-stock-value]", [{ label: "Valor em custo no estoque", total: stockTotal }], "Sem produtos em estoque.");
  renderDelivererReport(sales);
  renderCommissionReport(sales);
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
    const normalized = normalizePayment(sale.forma_pagamento);
    const isCard = normalized === "debito" || normalized === "credito";
    const current = groups.get(name) || { label: name, quantity: 0, pix: 0, cash: 0, debit: 0, credit: 0, base: 0, card: 0, total: 0 };
    current.quantity += 1;
    current.pix += normalized === "pix" ? 1 : 0;
    current.cash += normalized === "dinheiro" ? 1 : 0;
    current.debit += normalized === "debito" ? 1 : 0;
    current.credit += normalized === "credito" ? 1 : 0;
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
      ? `<strong>Caixa conferido</strong><span>${new Date(closing.fechado_em || closing.updated_at).toLocaleString("pt-BR")}</span><span>Responsavel: ${escapeHtml(closing.fechado_por || "Usuario autenticado")}</span><span>Diferenca: ${currency.format(closing.diferenca || 0)}</span>`
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
  const confirmed = window.confirm(`Conferir e fechar caixa de ${new Date(`${app.cashDate}T12:00:00`).toLocaleDateString("pt-BR")}?\n\nDinheiro esperado: ${currency.format(values.dinheiroEsperado)}\nDinheiro contado: ${currency.format(values.dinheiroContado)}\nDiferenca: ${currency.format(values.diferenca)}`);
  if (!confirmed) return;
  setStatus("Fechando caixa...", "loading");
  try {
    await requireUserId();
    const payload = cashPayload("fechado");
    const { data, error } = await supabaseClient.from(TABLES.cashClosings).upsert(payload, { onConflict: "data_caixa" }).select("*").single();
    if (error) throw error;
    app.cashClosings = [data, ...app.cashClosings.filter((closing) => closing.data_caixa !== data.data_caixa)];
    app.cashEditing = false;
    setStatus("Caixa conferido e fechado.", "success");
    renderCashClosing();
  } catch (error) {
    setStatus(error.message || "Erro ao fechar caixa.", "error");
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
  app.activeTab = tab;
  $$("[data-panel]").forEach((panel) => panel.classList.toggle("hidden", panel.dataset.panel !== tab));
  $$("[data-tab]").forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabaseClient) return setLoginStatus("Configure o Supabase da Fumacinha.", "error");
  setLoginStatus("Entrando...", "loading");
  const { error } = await supabaseClient.auth.signInWithPassword({
    email: loginForm.elements.email.value.trim(),
    password: loginForm.elements.password.value,
  });
  if (error) return setLoginStatus(error.message, "error");
  setLoginStatus("");
  await loadAll();
});

saleForm?.addEventListener("submit", saveSale);
saleForm?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.target.tagName === "TEXTAREA") return;
  event.preventDefault();
  if (["valor_recebido", "taxa_entrega", "troco"].includes(event.target.name)) {
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

document.addEventListener("click", async (event) => {
  const tab = event.target.closest("[data-tab]");
  if (tab) switchTab(tab.dataset.tab);
  const period = event.target.closest("[data-period]");
  if (period) {
    app.period = period.dataset.period;
    renderAll();
  }
  if (event.target.closest("[data-refresh]")) loadAll();
  if (event.target.closest("[data-open-orders]")) {
    app.orderStatusFilter = "pending";
    switchTab("orders");
    renderPendingOrders();
  }
  if (event.target.closest("[data-add-sale-item]")) {
    saleItemsRoot?.insertAdjacentHTML("beforeend", saleItemTemplate());
    updateSaleItemPrices();
    updateSaleTotal();
  }
  if (event.target.closest("[data-remove-sale-item]")) {
    event.target.closest(".sale-item")?.remove();
    if (!saleItemsRoot?.children.length) saleItemsRoot.innerHTML = saleItemTemplate();
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
  const cancel = event.target.closest("[data-cancel-sale]");
  if (cancel) cancelSale(cancel.dataset.cancelSale);
  const viewSale = event.target.closest("[data-view-sale]");
  if (viewSale) viewSaleDetails(viewSale.dataset.viewSale);
  const editSale = event.target.closest("[data-edit-sale]");
  if (editSale) loadSaleForEdit(editSale.dataset.editSale);
  const viewOrder = event.target.closest("[data-view-order]");
  if (viewOrder) viewOrderDetails(viewOrder.dataset.viewOrder);
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
  if (event.target.closest(".sale-item") || ["desconto", "valor_recebido", "taxa_entrega", "troco"].includes(event.target.name)) updateSaleTotal();
  if (event.target.matches("[data-stock-search]")) {
    app.stockSearch = event.target.value;
    renderStock();
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
  if (event.target.matches("[data-sale-product-search]")) {
    app.saleProductSearch = event.target.value;
    syncSaleItemSelectionsWithFilters();
    updateSaleItemPrices();
    updateSaleTotal();
  }
  if (event.target.matches("[data-stock-value]")) updateStockSaveState(event.target.dataset.stockValue);
  if (event.target.closest("[data-cash-form]")) {
    app.cashEditing = true;
    updateCashPreview();
  }
});

document.addEventListener("change", (event) => {
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
  if (event.target.name === "teve_troco") updateSaleTotal();
  if (event.target.name === "data_entrega" || event.target.name === "horario_rota") updateSaleTotal();
  if (["valor_recebido", "taxa_entrega", "troco"].includes(event.target.name)) {
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
    syncSaleItemSelectionsWithFilters();
    updateSaleItemPrices();
    updateSaleTotal();
  }
  if (event.target.name === "vendedora_id") localStorage.setItem(LAST_SELLER_KEY, event.target.value);
  if (event.target.name === "entregador_id") {
    if (event.target.value) localStorage.setItem(LAST_DELIVERER_KEY, event.target.value);
    else localStorage.removeItem(LAST_DELIVERER_KEY);
  }
  if (event.target.matches("[data-stock-category]")) {
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

function initDefaults() {
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
