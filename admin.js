const TABLE_NAME = "PRODUTOS";

const productForm = document.querySelector("[data-product-form]");
const productList = document.querySelector("[data-product-list]");
const categoryOptions = document.querySelector("[data-category-options]");
const toast = document.querySelector("[data-admin-toast]");

const supabaseClient = createSupabaseClient();
let products = [];

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
  window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function showError(error) {
  showToast(error?.message || "Erro ao conectar com Supabase");
}

async function getAuthenticatedUser() {
  if (!supabaseClient) {
    showToast("Configure o Supabase primeiro");
    return null;
  }

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    showError(error);
    return null;
  }

  if (!data.session?.user) {
    showToast("Faça login para editar produtos.");
    return null;
  }

  return data.session.user;
}

async function loadProducts() {
  if (!supabaseClient) {
    productList.innerHTML = `<p class="help-text">Configure Project URL e Publishable Key em <strong>supabase-config.js</strong>.</p>`;
    return;
  }

  productList.innerHTML = `<p class="help-text">Carregando produtos...</p>`;

  const { data, error } = await supabaseClient
    .from(TABLE_NAME)
    .select("id,nome,preco,imagem,categoria")
    .order("categoria", { ascending: true })
    .order("nome", { ascending: true });

  if (error) {
    productList.innerHTML = `<p class="help-text">Erro: ${error.message}</p>`;
    return;
  }

  products = data || [];
  renderProducts();
  renderCategories();
}

function renderCategories() {
  const categories = [...new Set(products.map((product) => product.categoria).filter(Boolean))];
  categoryOptions.innerHTML = categories.map((category) => `<option value="${category}"></option>`).join("");
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
            <strong>${product.nome}</strong>
            <span>${product.categoria || "Sem categoria"} | R$ ${Number(product.preco || 0).toFixed(2)}</span>
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
}

function editProduct(productId) {
  const product = products.find((item) => String(item.id) === String(productId));
  if (!product) return;

  productForm.elements.id.value = product.id;
  productForm.elements.nome.value = product.nome || "";
  productForm.elements.categoria.value = product.categoria || "";
  productForm.elements.preco.value = product.preco || "";
  productForm.elements.imagem.value = product.imagem || "";
  window.scrollTo({ top: productForm.offsetTop - 90, behavior: "smooth" });
}

function productPayload() {
  const formData = new FormData(productForm);
  return {
    nome: formData.get("nome").trim(),
    categoria: formData.get("categoria").trim(),
    preco: Number(formData.get("preco")),
    pix: Number(formData.get("preco")),
    imagem: formData.get("imagem").trim(),
  };
}

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabaseClient) {
    showToast("Configure o Supabase primeiro");
    return;
  }
  if (!(await getAuthenticatedUser())) return;

  const id = productForm.elements.id.value;
  const payload = productPayload();
  const result = id
    ? await supabaseClient.from(TABLE_NAME).update(payload).eq("id", id)
    : await supabaseClient.from(TABLE_NAME).insert(payload);

  if (result.error) {
    showError(result.error);
    return;
  }

  clearProductForm();
  showToast(id ? "Produto atualizado no Supabase" : "Produto cadastrado no Supabase");
  await loadProducts();
});

document.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit-product]");
  if (editButton) editProduct(editButton.dataset.editProduct);

  const deleteButton = event.target.closest("[data-delete-product]");
  if (deleteButton) {
    if (!supabaseClient) return;
    if (!(await getAuthenticatedUser())) return;
    const { error } = await supabaseClient.from(TABLE_NAME).delete().eq("id", deleteButton.dataset.deleteProduct);
    if (error) {
      showError(error);
      return;
    }
    showToast("Produto excluído do Supabase");
    await loadProducts();
  }

  if (event.target.closest("[data-clear-product]") || event.target.closest("[data-new-product]")) {
    clearProductForm();
    window.scrollTo({ top: productForm.offsetTop - 90, behavior: "smooth" });
  }
});

loadProducts();

