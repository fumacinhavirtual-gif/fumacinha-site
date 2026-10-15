(() => {
  const labels = Object.freeze({ novidade: "Novidade", lancamento: "Lan\u00e7amento" });

  function normalize(value) {
    return Object.hasOwn(labels, value) ? value : "";
  }

  function markup(value) {
    const label = normalize(value);
    return label ? `<span class="product-label product-label--${label}">${labels[label]}</span>` : "";
  }

  async function save(payload, persist) {
    const result = await persist(payload);
    if (!result.error?.message?.includes("selo_produto")) return result;
    if (normalize(payload.selo_produto)) {
      throw new Error("Para salvar o selo, execute SUPABASE_SELOS_PRODUTOS.sql no SQL Editor do Supabase e tente novamente.");
    }
    const compatible = { ...payload };
    delete compatible.selo_produto;
    return persist(compatible);
  }

  window.FumacinhaProductLabels = Object.freeze({ normalize, markup, save });
})();
