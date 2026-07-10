const TABLE_NAME = "PRODUTOS";

const loginForm = document.querySelector("[data-login-form]");
const logoutButton = document.querySelector("[data-logout]");
const sessionStatus = document.querySelector("[data-session-status]");
const authError = document.querySelector("[data-auth-error]");
const productForm = document.querySelector("[data-product-form]");
const productError = document.querySelector("[data-product-error]");
const productList = document.querySelector("[data-product-list]");
const categoryOptions = document.querySelector("[data-category-options]");
const toast = document.querySelector("[data-admin-toast]");

const supabaseClient = createSupabaseClient();
let products = [];
let currentUser = null;

function createSupabaseClient() {
  const url = window.FUMACINHA_SUPABASE_URL;
  const key = window.FUMACINHA_SUPABASE_PUBLISHABLE_KEY;
  const isConfigured = url && key && !url.includes("COLE_AQUI") && !key.includes("COLE_AQUI");

  if (!isConfigured || !window.supabase) return null;
  return window.supabase.createClient(url, key);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2800);
}

function setError(element, message) {
  if (element) element.textContent = message || "";
}

function describeSupabaseError(error) {
  if (!error) return "Erro ao conectar com Supabase.";
  return [error.message, error.details, error.hint].filter(Boolean).join(" ");
}

function showSupabaseError(context, error, element = productError) {
  const message = describeSupabaseError(error);
  setError(element, message);
  showToast(message);
  console.error(`[Fumacinha Admin] ${context}`, error);
}

function setLoggedIn(user) {
  currentUser = user || null;
  const logged = Boolean(currentUser);
  sessionStatus.textContent = logged ? `Logado como ${currentUser.email}` : "Nenhum usuario logado.";
  loginForm.classList.toggle("hidden", logged);
  logoutButton.classList.toggle("hidden", !logged);
  productForm.querySelectorAll("input, button").forEach((element) => {
    element.disabled = !logged;
  });
}

async function refreshSession() {
  if (!supabaseClient) {
    setError(authError, "Configure Project URL e Publishable Key em supabase-config.js.");
    setLoggedIn(null);
    return null;
  }

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    showSupabaseError("Erro ao buscar sessao", error, authError);
    setLoggedIn(null);
    return null;
  }

  const user = data.session?.user || null;
  setLoggedIn(user);
  return user;
}

async function requireAuthenticatedUser() {
  const user = currentUser || (await refreshSession());
  if (!user) {
    const message = "Entre com um usuario do Supabase Auth antes de salvar.";
    setError(authError, message);
    showToast(message);
    console.warn("[Fumacinha Admin] Tentativa de escrita sem sessao autenticada.");
    return null;
  }
  return user;
}

async function signIn(email, password) {
  if (!supabaseClient) {
    setError(authError, "Configure o Supabase primeiro.");
    return;
  }

  setError(authError, "");
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error || !data.session?.user) {
    showSupabaseError("Falha no login", error || { message: "Sessao nao criada." }, authError);
    setLoggedIn(null);
    return;
  }

  setLoggedIn(data.session.user);
  showToast("Login realizado.");
  await loadProducts();
}

async function signOut() {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    showSupabaseError("Erro ao sair", error, authError);
    return;
  }
  setLoggedIn(null);
  clearProductForm();
  showToast("Sessao encerrada.");
}

async function loadProducts() {
  if (!supabaseClient) {
    productList.innerHTML = `<p class="help-text">Configure Project URL e Publishable Key em <strong>supabase-config.js</strong>.</p>`;
    return;
  }

  productList.innerHTML = `<p class="help-text">Carregando produtos...</p>`;

  const { data, error } = await supabaseClient
    .from(TABLE_NAME)
    .select("id,nome,preco,imagem,categoria,estoque,ativo,destaque_home,ocultar_home")
    .order("categoria", { ascending: true })
    .order("nome", { ascending: true });

  if (error) {
    productList.innerHTML = `<p class="help-text">Erro: ${error.message}</p>`;
    console.error("[Fumacinha Admin] Erro ao carregar produtos", error);
    return;
  }

  products = data || [];
  renderProducts();
  renderCategories();
}

function renderCategories() {
  const categories = [...new Set(products.map((product) => product.categoria).filter(Boolean))];
  categoryOptions.innerHTML = categories.map((category) => `<option value="${escapeHtml(category)}"></option>`).join("");
}

function renderProducts() {
  if (!products.length) {
    productList.innerHTML = `<p class="help-text">Nenhum produto cadastrado ainda.</p>`;
    return;
  }

  productList.innerHTML = products
    .map(
      (product) => `
        <div class="admin-row">
          <div>
            <strong>${escapeHtml(product.nome)}</strong>
            <span>${escapeHtml(product.categoria || "Sem categoria")} | R$ ${Number(product.preco || 0).toFixed(2)} | Estoque: ${Number(product.estoque || 0)} | ${product.ativo ? "Ativo" : "Inativo"}</span>
          </div>
          <button type="button" data-edit-product="${product.id}">Editar</button>
          <button type="button" data-delete-product="${product.id}">Excluir</button>
        </div>
      `
    )
    .join("");
}

function clearProductForm() {
  productForm.reset();
  productForm.elements.id.value = "";
  productForm.elements.estoque.value = "1";
  productForm.elements.ativo.checked = true;
  setError(productError, "");
}

function editProduct(productId) {
  const product = products.find((item) => String(item.id) === String(productId));
  if (!product) return;

  productForm.elements.id.value = product.id;
  productForm.elements.nome.value = product.nome || "";
  productForm.elements.categoria.value = product.categoria || "";
  productForm.elements.preco.value = product.preco || "";
  productForm.elements.estoque.value = Number(product.estoque || 0);
  productForm.elements.ativo.checked = product.ativo !== false;
  productForm.elements.imagem.value = product.imagem || "";
  setError(productError, "");
  window.scrollTo({ top: productForm.offsetTop - 90, behavior: "smooth" });
}

function productPayload() {
  const formData = new FormData(productForm);
  const price = Number(formData.get("preco") || 0);
  const stock = Math.max(0, Number.parseInt(formData.get("estoque") || "0", 10));

  return {
    nome: String(formData.get("nome") || "").trim(),
    categoria: String(formData.get("categoria") || "").trim(),
    preco: price,
    pix: price,
    imagem: String(formData.get("imagem") || "").trim(),
    estoque: stock,
    ativo: formData.get("ativo") === "on",
  };
}

function validatePayload(payload) {
  if (!payload.nome) return "Informe o nome do produto.";
  if (!payload.categoria) return "Informe a categoria do produto.";
  if (!Number.isFinite(payload.preco) || payload.preco < 0) return "Informe um preco valido.";
  if (!Number.isFinite(payload.estoque) || payload.estoque < 0) return "Informe um estoque valido.";
  return "";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  await signIn(String(formData.get("email") || "").trim(), String(formData.get("password") || ""));
});

logoutButton.addEventListener("click", signOut);

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setError(productError, "");

  if (!supabaseClient) {
    setError(productError, "Configure o Supabase primeiro.");
    return;
  }
  if (!(await requireAuthenticatedUser())) return;

  const id = productForm.elements.id.value;
  const payload = productPayload();
  const validationError = validatePayload(payload);
  if (validationError) {
    setError(productError, validationError);
    return;
  }

  const result = id
    ? await supabaseClient.from(TABLE_NAME).update(payload).eq("id", id).select("id").single()
    : await supabaseClient.from(TABLE_NAME).insert(payload).select("id").single();

  if (result.error) {
    showSupabaseError(id ? "Erro no update de PRODUTOS" : "Erro no insert de PRODUTOS", result.error);
    return;
  }

  clearProductForm();
  showToast(id ? "Produto atualizado no Supabase." : "Produto cadastrado no Supabase.");
  await loadProducts();
});

document.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit-product]");
  if (editButton) editProduct(editButton.dataset.editProduct);

  const deleteButton = event.target.closest("[data-delete-product]");
  if (deleteButton) {
    if (!supabaseClient) return;
    if (!(await requireAuthenticatedUser())) return;

    const { error } = await supabaseClient.from(TABLE_NAME).delete().eq("id", deleteButton.dataset.deleteProduct);
    if (error) {
      showSupabaseError("Erro no delete de PRODUTOS", error);
      return;
    }

    showToast("Produto excluido do Supabase.");
    await loadProducts();
  }

  if (event.target.closest("[data-clear-product]") || event.target.closest("[data-new-product]")) {
    clearProductForm();
    window.scrollTo({ top: productForm.offsetTop - 90, behavior: "smooth" });
  }
});

if (supabaseClient) {
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    setLoggedIn(session?.user || null);
  });
}

setLoggedIn(null);
refreshSession();
loadProducts();
