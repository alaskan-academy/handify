(function () {
  var API = 'https://membros.handify.com.br/api/public/produtos';
  var CACHE_KEY = 'hdf_produtos';
  var CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  function aplicarPrecos(produtos) {
    var mapa = {};
    produtos.forEach(function (p) { mapa[p.slug] = p; });

    document.querySelectorAll('[data-preco-slug]').forEach(function (el) {
      var slug = el.getAttribute('data-preco-slug');
      var produto = mapa[slug];
      if (!produto) return;

      var tipo = el.getAttribute('data-preco-tipo') || 'preco';
      if (tipo === 'parcelas' && produto.parcelas) {
        el.textContent = produto.parcelas;
      } else {
        el.textContent = produto.preco;
      }
    });

    // Soma total de todos os produtos para elementos [data-preco-pack-total]
    var els = document.querySelectorAll('[data-preco-pack-total]');
    if (els.length) {
      var total = 0;
      produtos.forEach(function (p) {
        var n = parseFloat(String(p.preco).replace('R$', '').replace('.', '').replace(',', '.'));
        if (!isNaN(n)) total += n;
      });
      var fmt = 'R$' + total.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
      els.forEach(function (el) { el.textContent = fmt; });
    }

    document.dispatchEvent(new CustomEvent('hdf:precos'));
  }

  function buscarEAplicar() {
    // Verificar cache
    try {
      var cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        var obj = JSON.parse(cached);
        if (Date.now() - obj.ts < CACHE_TTL) {
          aplicarPrecos(obj.data);
          return;
        }
      }
    } catch (e) {}

    fetch(API)
      .then(function (r) { return r.json(); })
      .then(function (json) {
        if (!json.produtos) return;
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: json.produtos }));
        } catch (e) {}
        aplicarPrecos(json.produtos);
      })
      .catch(function () {}); // falha silenciosa — preço estático permanece visível
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buscarEAplicar);
  } else {
    buscarEAplicar();
  }
})();
