const SUPABASE_URL = window.FUMACINHA_SUPABASE_URL || "";
const SUPABASE_KEY = window.FUMACINHA_SUPABASE_PUBLISHABLE_KEY || "";
const supabaseClient = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY);
const TABLES = {
  products: "PRODUTOS",
  sales: "VENDAS",
  saleItems: "ITENS_VENDA",
  stockMoves: "MOVIMENTACOES_ESTOQUE",
  expenses: "DESPESAS",
  deliverers: "ENTREGADORES",
  sellers: "VENDEDORAS",
  deliveryPayouts: "REPASSES_ENTREGADORES",
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const COMMISSION_BASE = 0.5;
const COMMISSION_CARD_EXTRA = 1;
const app = {
  products: [],
  sales: [],
  saleItems: [],
  stockMoves: [],
  expenses: [],
  deliverers: [],
  sellers: [],
  deliveryPayouts: [],
  deliveryManuallyEdited: false,
  period: "today",
  activeTab: "home",
  stockSearch: "",
  stockCategory: "all",
  stockFilter: "all",
  stockSort: "name",
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
const stockList = $("[data-stock-list]");
const stockHistory = $("[data-stock-history]");
const salesHistory = $("[data-sales-history]");
const expenseForm = $("[data-expense-form]");
const expenseList = $("[data-expense-list]");
const sellersList = $("[data-sellers-list]");
const deliverersList = $("[data-deliverers-list]");

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

function dateValue(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function localDateTimeValue(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
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
  const { start, end } = periodRange();
  return app.expenses.filter((expense) => {
    const date = new Date(`${expense.data_despesa || dateValue()}T12:00:00`);
    return date >= start && date <= end;
  });
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

function saleReceived(sale) {
  return toNumber(sale.valor_recebido || saleTotal(sale) + toNumber(sale.taxa_entrega));
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

async function loadAll() {
  if (!(await requireAuth())) return;
  setStatus("Carregando controle...", "loading");
  const [productsResult, salesResult, itemsResult, movesResult, expensesResult, deliverersResult, sellersResult, payoutsResult] = await Promise.allSettled([
    supabaseClient.from(TABLES.products).select("*").order("nome", { ascending: true }),
    supabaseClient.from(TABLES.sales).select("*").order("data_venda", { ascending: false }).limit(500),
    supabaseClient.from(TABLES.saleItems).select("*").order("created_at", { ascending: false }).limit(1000),
    supabaseClient.from(TABLES.stockMoves).select("*").order("created_at", { ascending: false }).limit(500),
    supabaseClient.from(TABLES.expenses).select("*").order("data_despesa", { ascending: false }).limit(500),
    supabaseClient.from(TABLES.deliverers).select("*").order("nome", { ascending: true }),
    supabaseClient.from(TABLES.sellers).select("*").order("nome", { ascending: true }),
    supabaseClient.from(TABLES.deliveryPayouts).select("*").order("created_at", { ascending: false }).limit(1000),
  ]);

  const errors = [productsResult, salesResult, itemsResult, movesResult, expensesResult, deliverersResult, sellersResult, payoutsResult]
    .filter((result) => result.status === "fulfilled" && result.value.error)
    .map((result) => result.value.error.message);

  if (errors.length) {
    setStatus(`Erro ao carregar: ${errors[0]}`, "error");
    return;
  }

  app.products = productsResult.value.data || [];
  app.sales = salesResult.value.data || [];
  app.saleItems = itemsResult.value.data || [];
  app.stockMoves = movesResult.value.data || [];
  app.expenses = expensesResult.value.data || [];
  app.deliverers = deliverersResult.value.data || [];
  app.sellers = sellersResult.value.data || [];
  app.deliveryPayouts = payoutsResult.value.data || [];
  setStatus("Controle atualizado.", "success");
  renderAll();
}

function renderAll() {
  renderPeriods();
  renderPeopleOptions();
  renderDashboard();
  renderSaleItems();
  renderSalesHistory();
  renderStock();
  renderFinance();
  renderReports();
}

function renderPeriods() {
  $$("[data-period]").forEach((button) => button.classList.toggle("active", button.dataset.period === app.period));
  $("[data-custom-period]")?.classList.toggle("hidden", app.period !== "custom");
}

function renderPeopleOptions() {
  if (sellersList) {
    sellersList.innerHTML = app.sellers
      .filter((seller) => seller.ativo !== false)
      .map((seller) => `<option value="${escapeHtml(seller.nome)}"></option>`)
      .join("");
  }
  if (deliverersList) {
    deliverersList.innerHTML = app.deliverers
      .filter((deliverer) => deliverer.ativo !== false)
      .map((deliverer) => `<option value="${escapeHtml(deliverer.nome)}"></option>`)
      .join("");
  }
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
  const lowStock = app.products.filter((product) => toNumber(product.estoque) <= 5).length;

  $("[data-kpi-sales-today]").textContent = String(today.count);
  $("[data-kpi-revenue-today]").textContent = currency.format(today.revenue);
  $("[data-kpi-ticket]").textContent = currency.format(selectedSummary.ticket);
  $("[data-kpi-received]").textContent = currency.format(selectedSummary.received);
  $("[data-kpi-delivery]").textContent = currency.format(selectedSummary.delivery);
  $("[data-kpi-commission]").textContent = currency.format(selectedSummary.commission);
  $("[data-kpi-profit]").textContent = currency.format(selectedSummary.net);
  $("[data-kpi-sales-count]").textContent = String(selectedSummary.count);
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

function productOptions(selected = "") {
  return app.products.map((product) => `<option value="${product.id}" ${String(product.id) === String(selected) ? "selected" : ""}>${escapeHtml(product.nome)}</option>`).join("");
}

function saleItemTemplate() {
  const firstProduct = app.products[0];
  return `
    <article class="sale-item">
      <div class="sale-product-preview" data-sale-product-preview>
        <img src="${escapeHtml(productImage(firstProduct))}" alt="${escapeHtml(firstProduct?.nome || "Produto")}" loading="lazy" decoding="async" />
        <div>
          <strong>${escapeHtml(firstProduct?.nome || "Selecione um produto")}</strong>
          <span>${escapeHtml(firstProduct?.categoria || "Produto")}</span>
        </div>
      </div>
      <label>Produto <select name="produto_id">${productOptions()}</select></label>
      <label>Qtd <input type="number" name="quantidade" min="1" step="1" value="1" /></label>
      <label>Valor unitario <input type="number" name="valor_unitario" min="0" step="0.01" /></label>
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
    if (product && price && !price.value) price.value = toNumber(product.preco).toFixed(2);
    updateSaleItemPreview(row, product);
  });
}

function updateSaleItemPreview(row, product) {
  const quantity = toNumber(row.querySelector('[name="quantidade"]')?.value);
  const unitValue = toNumber(row.querySelector('[name="valor_unitario"]')?.value);
  const subtotal = row.querySelector("[data-item-subtotal]");
  const preview = row.querySelector("[data-sale-product-preview]");
  if (subtotal) subtotal.textContent = currency.format(quantity * unitValue);
  if (!preview) return;
  preview.innerHTML = `
    <img src="${escapeHtml(productImage(product))}" alt="${escapeHtml(product?.nome || "Produto")}" loading="lazy" decoding="async" />
    <div>
      <strong>${escapeHtml(product?.nome || "Selecione um produto")}</strong>
      <span>${escapeHtml(product?.categoria || "Produto")}</span>
    </div>
  `;
}

function currentProductTotal() {
  const discount = toNumber(saleForm?.elements.desconto?.value);
  const subtotal = $$(".sale-item").reduce((sum, row) => {
    return sum + toNumber(row.querySelector('[name="quantidade"]')?.value) * toNumber(row.querySelector('[name="valor_unitario"]')?.value);
  }, 0);
  return Math.max(0, subtotal - discount);
}

function updateSaleTotal() {
  $$(".sale-item").forEach((row) => {
    const product = app.products.find((item) => String(item.id) === String(row.querySelector('[name="produto_id"]')?.value));
    updateSaleItemPreview(row, product);
  });

  const productsValue = currentProductTotal();
  const receivedInput = saleForm?.elements.valor_recebido;
  const deliveryInput = saleForm?.elements.taxa_entrega;
  if (receivedInput && (!receivedInput.value || toNumber(receivedInput.value) < productsValue)) {
    receivedInput.value = productsValue.toFixed(2);
  }
  const preliminaryReceived = Math.max(productsValue, toNumber(receivedInput?.value));
  if (deliveryInput && !app.deliveryManuallyEdited) {
    deliveryInput.value = Math.max(0, preliminaryReceived - productsValue).toFixed(2);
  }
  const deliveryValue = Math.max(0, toNumber(deliveryInput?.value));
  const receivedValue = Math.max(productsValue + deliveryValue, preliminaryReceived);
  if (receivedInput && toNumber(receivedInput.value) < receivedValue) {
    receivedInput.value = receivedValue.toFixed(2);
  }
  const totalValue = productsValue + deliveryValue;
  const commission = commissionForPayment(saleForm?.elements.forma_pagamento?.value);

  $("[data-sale-products]").textContent = currency.format(productsValue);
  $("[data-sale-received]").textContent = currency.format(receivedValue);
  $("[data-sale-delivery]").textContent = currency.format(deliveryValue);
  $("[data-sale-total]").textContent = currency.format(totalValue);
  $("[data-sale-commission]").textContent = currency.format(commission.total);
}

async function insertStockMove(product, previous, next, type, saleId = null) {
  const payload = {
    produto_id: String(product.id),
    nome_produto: product.nome,
    quantidade_anterior: previous,
    quantidade_nova: next,
    diferenca: next - previous,
    tipo: type,
    venda_id: saleId,
    usuario_id: app.user?.id || null,
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

async function registerSale(event) {
  event.preventDefault();
  const rows = $$(".sale-item");
  if (!rows.length) return;
  setStatus("Registrando venda...", "loading");
  try {
    const seller = await getOrCreatePerson(TABLES.sellers, app.sellers, saleForm.elements.vendedora_nome.value);
    if (!seller) throw new Error("Informe a vendedora.");
    const deliverer = await getOrCreatePerson(TABLES.deliverers, app.deliverers, saleForm.elements.entregador_nome.value);
    const items = rows.map((row) => {
      const product = app.products.find((item) => String(item.id) === String(row.querySelector('[name="produto_id"]')?.value));
      const quantity = toNumber(row.querySelector('[name="quantidade"]')?.value);
      const unitValue = toNumber(row.querySelector('[name="valor_unitario"]')?.value);
      if (!product || quantity <= 0 || unitValue <= 0) throw new Error("Revise os produtos da venda.");
      if (quantity > toNumber(product.estoque)) throw new Error(`Estoque insuficiente para ${product.nome}.`);
      return { product, quantity, unitValue };
    });
    const discount = toNumber(saleForm.elements.desconto.value);
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitValue, 0);
    const productsValue = Math.max(0, subtotal - discount);
    const deliveryValue = Math.max(0, toNumber(saleForm.elements.taxa_entrega.value));
    const receivedValue = Math.max(productsValue, toNumber(saleForm.elements.valor_recebido.value), productsValue + deliveryValue);
    const commission = commissionForPayment(saleForm.elements.forma_pagamento.value);
    const cost = items.reduce((sum, item) => sum + item.quantity * productCost(item.product), 0);
    const quantityTotal = items.reduce((sum, item) => sum + item.quantity, 0);
    const first = items[0];
    const salePayload = {
      produto_id: String(first.product.id),
      nome_produto: first.product.nome,
      quantidade: quantityTotal,
      quantidade_total: quantityTotal,
      valor_unitario: first.unitValue,
      valor_total: productsValue,
      valor_produtos: productsValue,
      valor_recebido: receivedValue,
      taxa_entrega: deliveryValue,
      desconto: discount,
      forma_pagamento: saleForm.elements.forma_pagamento.value,
      entregador_id: deliverer?.id || null,
      entregador_nome: deliverer?.nome || "",
      vendedora_id: seller.id,
      vendedora_nome: seller.nome,
      comissao_base: commission.base,
      comissao_cartao: commission.card,
      comissao_total: commission.total,
      cliente_nome: saleForm.elements.cliente.value.trim(),
      observacao: saleForm.elements.observacao.value.trim(),
      data_venda: saleForm.elements.data_venda.value ? new Date(saleForm.elements.data_venda.value).toISOString() : new Date().toISOString(),
      custo_unitario: productCost(first.product),
      custo_total: cost,
      cancelada: false,
      usuario_id: app.user?.id || null,
    };
    const { data: sale, error: saleError } = await supabaseClient.from(TABLES.sales).insert(salePayload).select("*").single();
    if (saleError) throw saleError;
    const itemPayload = items.map((item) => ({
      venda_id: sale.id,
      produto_id: String(item.product.id),
      nome_produto: item.product.nome,
      quantidade: item.quantity,
      valor_unitario: item.unitValue,
      valor_total: item.quantity * item.unitValue,
      custo_unitario: productCost(item.product),
      custo_total: item.quantity * productCost(item.product),
    }));
    const { error: itemError } = await supabaseClient.from(TABLES.saleItems).insert(itemPayload);
    if (itemError) throw itemError;
    for (const item of items) {
      await updateProductStock(item.product, toNumber(item.product.estoque) - item.quantity, "venda", sale.id);
    }
    if (deliverer && deliveryValue > 0) {
      const { error: payoutError } = await supabaseClient.from(TABLES.deliveryPayouts).insert({
        venda_id: sale.id,
        entregador_id: deliverer.id,
        valor: deliveryValue,
        pago: false,
      });
      if (payoutError) throw payoutError;
    }
    saleForm.reset();
    saleForm.elements.data_venda.value = localDateTimeValue();
    saleForm.elements.desconto.value = "0";
    saleForm.elements.valor_recebido.value = "0";
    saleForm.elements.taxa_entrega.value = "0";
    app.deliveryManuallyEdited = false;
    saleItemsRoot.innerHTML = saleItemTemplate();
    updateSaleItemPrices();
    updateSaleTotal();
    setStatus("Venda registrada com sucesso.", "success");
    await loadAll();
  } catch (error) {
    setStatus(error.message || "Erro ao registrar venda.", "error");
  }
}

async function cancelSale(saleId) {
  const sale = app.sales.find((item) => String(item.id) === String(saleId));
  if (!sale || sale.cancelada) return;
  setStatus("Cancelando venda...", "loading");
  try {
    const items = app.saleItems.filter((item) => String(item.venda_id) === String(saleId));
    for (const item of items) {
      const product = app.products.find((productItem) => String(productItem.id) === String(item.produto_id));
      if (product) await updateProductStock(product, toNumber(product.estoque) + toNumber(item.quantidade), "cancelamento", sale.id);
    }
    const { error } = await supabaseClient.from(TABLES.sales).update({ cancelada: true, cancelada_em: new Date().toISOString() }).eq("id", sale.id);
    if (error) throw error;
    setStatus("Venda cancelada e estoque devolvido.", "success");
    await loadAll();
  } catch (error) {
    setStatus(error.message || "Erro ao cancelar venda.", "error");
  }
}

function renderSalesHistory() {
  if (!salesHistory) return;
  salesHistory.innerHTML = app.sales.length
    ? app.sales.slice(0, 40).map((sale) => `
      <article class="history-row ${sale.cancelada ? "cancelled" : ""}">
        <strong>${escapeHtml(sale.nome_produto || "Venda")}</strong>
        <span>${new Date(sale.data_venda || sale.created_at).toLocaleString("pt-BR")} - Produtos ${currency.format(saleTotal(sale))}</span>
        <span>Recebido ${currency.format(saleReceived(sale))} | Entrega ${currency.format(saleDelivery(sale))}</span>
        <span>${escapeHtml(sale.forma_pagamento || "Pagamento nao informado")} | ${escapeHtml(sale.vendedora_nome || "Vendedora nao informada")} ${sale.cancelada ? "- Cancelada" : ""}</span>
        ${sale.cancelada ? "" : `<button type="button" data-cancel-sale="${sale.id}">Cancelar venda</button>`}
      </article>
    `).join("")
    : "<p>Nenhuma venda registrada.</p>";
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
      return a.nome.localeCompare(b.nome);
    });
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
        <p>Estoque atual: <strong>${toNumber(product.estoque)}</strong></p>
        <p>Custo: ${currency.format(productCost(product))} | Venda: ${currency.format(product.preco)}</p>
      </div>
      <div class="stock-actions">
        <button type="button" data-stock-minus="${product.id}">-</button>
        <button type="button" data-stock-plus="${product.id}">+</button>
        <input type="number" min="0" step="1" value="${toNumber(product.estoque)}" data-stock-value="${product.id}" />
        <select data-stock-type="${product.id}">
          <option>entrada de mercadoria</option>
          <option>ajuste manual</option>
          <option>perda</option>
          <option>avaria</option>
          <option>devolucao</option>
          <option>cancelamento</option>
        </select>
        <button class="primary-action stock-save" type="button" data-stock-save="${product.id}">Salvar</button>
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
  const type = $(`[data-stock-type="${productId}"]`)?.value || "ajuste manual";
  if (!product || !input) return;
  try {
    await updateProductStock(product, toNumber(input.value), type);
    setStatus("Estoque atualizado.", "success");
    await loadAll();
  } catch (error) {
    setStatus(error.message || "Erro ao atualizar estoque.", "error");
  }
}

function renderFinance() {
  const summary = summaryFor();
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
  const form = event.currentTarget;
  const payload = {
    descricao: form.elements.descricao.value.trim(),
    categoria: form.elements.categoria.value,
    valor: toNumber(form.elements.valor.value),
    data_despesa: form.elements.data_despesa.value || dateValue(),
    forma_pagamento: form.elements.forma_pagamento.value,
    observacao: form.elements.observacao.value.trim(),
    usuario_id: app.user?.id || null,
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

saleForm?.addEventListener("submit", registerSale);
expenseForm?.addEventListener("submit", saveExpense);

document.addEventListener("click", async (event) => {
  const tab = event.target.closest("[data-tab]");
  if (tab) switchTab(tab.dataset.tab);
  const period = event.target.closest("[data-period]");
  if (period) {
    app.period = period.dataset.period;
    renderAll();
  }
  if (event.target.closest("[data-refresh]")) loadAll();
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
  }
  const minus = event.target.closest("[data-stock-minus]");
  if (minus) {
    const input = $(`[data-stock-value="${minus.dataset.stockMinus}"]`);
    if (input) input.value = Math.max(0, toNumber(input.value) - 1);
  }
  const save = event.target.closest("[data-stock-save]");
  if (save) saveStock(save.dataset.stockSave);
  const cancel = event.target.closest("[data-cancel-sale]");
  if (cancel) cancelSale(cancel.dataset.cancelSale);
  if (event.target.closest("[data-logout]")) {
    await supabaseClient?.auth.signOut();
    renderAuth(false);
  }
});

document.addEventListener("input", (event) => {
  if (event.target.name === "taxa_entrega") app.deliveryManuallyEdited = true;
  if (event.target.name === "valor_recebido") app.deliveryManuallyEdited = false;
  if (event.target.closest(".sale-item") || ["desconto", "valor_recebido", "taxa_entrega"].includes(event.target.name)) updateSaleTotal();
  if (event.target.matches("[data-stock-search]")) {
    app.stockSearch = event.target.value;
    renderStock();
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
  if (event.target.name === "forma_pagamento") updateSaleTotal();
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
});

function initDefaults() {
  const saleDateInput = saleForm?.elements.data_venda;
  if (saleDateInput) saleDateInput.value = localDateTimeValue();
  if (saleForm?.elements.valor_recebido) saleForm.elements.valor_recebido.value = "0";
  if (saleForm?.elements.taxa_entrega) saleForm.elements.taxa_entrega.value = "0";
  const expenseDateInput = expenseForm?.elements.data_despesa;
  if (expenseDateInput) expenseDateInput.value = dateValue();
  updateSaleTotal();
}

initDefaults();
requireAuth().then((isAuthenticated) => {
  if (isAuthenticated) loadAll();
});
