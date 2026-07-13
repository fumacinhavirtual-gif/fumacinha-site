const SUPABASE_URL = window.FUMACINHA_SUPABASE_URL || "";
const SUPABASE_KEY = window.FUMACINHA_SUPABASE_PUBLISHABLE_KEY || "";
const supabaseClient = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY);

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const app = {
  products: [],
  sales: [],
  saleItems: [],
  stockMoves: [],
  expenses: [],
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
  return toNumber(sale.valor_total || 0);
}

function summaryFor(sales = filteredSales(), expenses = filteredExpenses()) {
  const revenue = sales.reduce((sum, sale) => sum + saleTotal(sale), 0);
  const cost = sales.reduce((sum, sale) => sum + saleCost(sale), 0);
  const expenseTotal = expenses.reduce((sum, expense) => sum + toNumber(expense.valor), 0);
  const gross = revenue - cost;
  const net = gross - expenseTotal;
  const quantity = sales.reduce((sum, sale) => sum + toNumber(sale.quantidade || sale.quantidade_total), 0);
  return {
    revenue,
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
  const [productsResult, salesResult, itemsResult, movesResult, expensesResult] = await Promise.allSettled([
    supabaseClient.from("PRODUTOS").select("*").order("nome", { ascending: true }),
    supabaseClient.from("VENDAS").select("*").order("data_venda", { ascending: false }).limit(500),
    supabaseClient.from("ITENS_VENDA").select("*").order("created_at", { ascending: false }).limit(1000),
    supabaseClient.from("MOVIMENTACOES_ESTOQUE").select("*").order("created_at", { ascending: false }).limit(500),
    supabaseClient.from("DESPESAS").select("*").order("data_despesa", { ascending: false }).limit(500),
  ]);

  const errors = [productsResult, salesResult, itemsResult, movesResult, expensesResult]
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
  setStatus("Controle atualizado.", "success");
  renderAll();
}

function renderAll() {
  renderPeriods();
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
  return `
    <article class="sale-item">
      <label>Produto <select name="produto_id">${productOptions()}</select></label>
      <label>Qtd <input type="number" name="quantidade" min="1" step="1" value="1" /></label>
      <label>Valor unitario <input type="number" name="valor_unitario" min="0" step="0.01" /></label>
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
  });
}

function updateSaleTotal() {
  const discount = toNumber(saleForm?.elements.desconto?.value);
  const total = $$(".sale-item").reduce((sum, row) => {
    return sum + toNumber(row.querySelector('[name="quantidade"]')?.value) * toNumber(row.querySelector('[name="valor_unitario"]')?.value);
  }, 0) - discount;
  const label = $("[data-sale-total]");
  if (label) label.textContent = `Total: ${currency.format(Math.max(0, total))}`;
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
  return supabaseClient.from("MOVIMENTACOES_ESTOQUE").insert(payload);
}

async function updateProductStock(product, nextStock, type = "ajuste manual", saleId = null) {
  const previous = toNumber(product.estoque);
  const next = Math.max(0, Number(nextStock));
  const { error } = await supabaseClient.from("PRODUTOS").update({ estoque: next, ativo: next > 0 }).eq("id", product.id);
  if (error) throw error;
  await insertStockMove(product, previous, next, type, saleId);
  product.estoque = next;
  product.ativo = next > 0;
}

async function registerSale(event) {
  event.preventDefault();
  const rows = $$(".sale-item");
  if (!rows.length) return;
  setStatus("Registrando venda...", "loading");
  try {
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
    const total = Math.max(0, subtotal - discount);
    const cost = items.reduce((sum, item) => sum + item.quantity * productCost(item.product), 0);
    const quantityTotal = items.reduce((sum, item) => sum + item.quantity, 0);
    const first = items[0];
    const salePayload = {
      produto_id: String(first.product.id),
      nome_produto: first.product.nome,
      quantidade: quantityTotal,
      quantidade_total: quantityTotal,
      valor_unitario: first.unitValue,
      valor_total: total,
      desconto: discount,
      forma_pagamento: saleForm.elements.forma_pagamento.value,
      cliente_nome: saleForm.elements.cliente.value.trim(),
      observacao: saleForm.elements.observacao.value.trim(),
      data_venda: saleForm.elements.data_venda.value ? new Date(saleForm.elements.data_venda.value).toISOString() : new Date().toISOString(),
      custo_unitario: productCost(first.product),
      custo_total: cost,
      cancelada: false,
      usuario_id: app.user?.id || null,
    };
    const { data: sale, error: saleError } = await supabaseClient.from("VENDAS").insert(salePayload).select("*").single();
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
    const { error: itemError } = await supabaseClient.from("ITENS_VENDA").insert(itemPayload);
    if (itemError) throw itemError;
    for (const item of items) {
      await updateProductStock(item.product, toNumber(item.product.estoque) - item.quantity, "venda", sale.id);
    }
    saleForm.reset();
    saleForm.elements.data_venda.value = localDateTimeValue();
    saleItemsRoot.innerHTML = saleItemTemplate();
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
    const { error } = await supabaseClient.from("VENDAS").update({ cancelada: true, cancelada_em: new Date().toISOString() }).eq("id", sale.id);
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
        <span>${new Date(sale.data_venda || sale.created_at).toLocaleString("pt-BR")} - ${currency.format(saleTotal(sale))}</span>
        <span>${escapeHtml(sale.forma_pagamento || "Pagamento nao informado")} ${sale.cancelada ? "- Cancelada" : ""}</span>
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
  $("[data-finance-cost]").textContent = currency.format(summary.cost);
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
  const { error } = await supabaseClient.from("DESPESAS").insert(payload);
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
  if (event.target.closest(".sale-item") || event.target.name === "desconto") updateSaleTotal();
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
  const expenseDateInput = expenseForm?.elements.data_despesa;
  if (expenseDateInput) expenseDateInput.value = dateValue();
}

initDefaults();
requireAuth().then((isAuthenticated) => {
  if (isAuthenticated) loadAll();
});
