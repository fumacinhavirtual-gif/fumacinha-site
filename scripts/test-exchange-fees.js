const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const context = vm.createContext({
  console,
  Date,
  Intl,
  Number,
  Math,
  JSON,
  Set,
  Map,
  URL,
  window: { addEventListener() {} },
  document: { querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {} },
  navigator: { onLine: false },
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
});

const source = fs.readFileSync(path.join(__dirname, "..", "controle.js"), "utf8");
vm.runInContext(source, context, { filename: "controle.js" });
const app = vm.runInContext("app", context);
const day = "2026-11-18";
app.cashDate = day;
app.deliverers = [{ id: 1, nome: "Jota" }];
app.sales = [{
  id: 1,
  data_venda: `${day}T12:00:00`,
  valor_produtos: 105,
  valor_total: 105,
  total_venda: 115,
  valor_recebido: 115,
  taxa_entrega: 10,
  forma_pagamento: "Pix",
  entregador_id: 1,
  entregador_nome: "Jota",
  cancelada: false,
}];
app.exchangeFees = [
  { id: 1, data_troca: day, entregador_id: 1, entregador_nome: "Jota", forma_pagamento: "Pix", taxa_entrega: 15, cancelada: false },
  { id: 2, data_troca: day, entregador_id: 1, entregador_nome: "Jota", forma_pagamento: "Dinheiro", taxa_entrega: 5, cancelada: false },
  { id: 3, data_troca: day, entregador_id: 1, entregador_nome: "Jota", forma_pagamento: "Pix", taxa_entrega: 99, cancelada: true },
];

const payment = vm.runInContext(`cashPaymentTotals("${day}")`, context);
assert.equal(payment.totalVendas, 115);
assert.equal(payment.pix, 130);
assert.equal(payment.dinheiro, 5);
assert.equal(payment.exchangeFeeTotal, 20);
assert.equal(payment.exchangeCount, 2);
assert.equal(payment.dinheiroRecebido, 5);

const cash = vm.runInContext(`cashCalculate("${day}")`, context);
assert.equal(cash.quantidadeVendas, 1);
assert.equal(cash.dinheiroEsperado, 5);

const closing = vm.runInContext("cashPayload()", context);
assert.equal(closing.vendas_pix, 115);
assert.equal(closing.total_vendas, 115);
assert.equal(closing.quantidade_vendas, 1);

const deliveries = vm.runInContext(`deliveryRowsForDate("${day}")`, context);
assert.equal(deliveries.length, 1);
assert.equal(deliveries[0].sales, 1);
assert.equal(deliveries[0].exchanges, 2);
assert.equal(deliveries[0].fees, 30);

app.sales = [];
const onlyExchange = vm.runInContext(`cashPaymentTotals("${day}")`, context);
assert.equal(onlyExchange.totalVendas, 0);
assert.equal(onlyExchange.pix, 15);
assert.equal(onlyExchange.dinheiro, 5);
assert.equal(vm.runInContext(`cashCalculate("${day}").dinheiroEsperado`, context), 5);

console.log("Taxas de troca: recebimentos, caixa e entregas validados.");
