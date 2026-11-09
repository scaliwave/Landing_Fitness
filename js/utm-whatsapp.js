/*
 * Proyecto TEO — palabra clave del anuncio → mensaje de WhatsApp
 *
 * Qué hace:
 * 1. Lee la palabra clave del anuncio desde la URL (?utm_content=ESPALDA).
 * 2. La guarda 7 días en el navegador, por si la persona vuelve luego sin el enlace del anuncio.
 * 3. Cuando la persona toca cualquier botón de WhatsApp (wa.me / api.whatsapp.com),
 *    agrega la palabra al final del mensaje prellenado:
 *    "Hola Teo, quiero empezar con el plan Plus (ESPALDA)"
 * 4. Si algún día se instala el píxel de Meta, registra el evento "Contact" con la palabra.
 *
 * Instalación: cargar al final del <body>, después de los botones:
 *   <script src="js/utm-whatsapp.js" defer></script>
 *
 * Prueba: abrir el sitio con ?utm_content=ESPALDA y tocar un botón de WhatsApp.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'teo_ad_keyword';
  var TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días
  var WA_HOSTS = ['wa.me', 'api.whatsapp.com', 'web.whatsapp.com'];

  // Solo letras y números, en mayúsculas, máximo 20 caracteres.
  function sanitize(value) {
    if (!value) return '';
    return String(value)
      .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita tildes
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 20);
  }

  function readFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search);
      return sanitize(params.get('utm_content'));
    } catch (e) {
      return '';
    }
  }

  function save(keyword) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ k: keyword, t: Date.now() }));
    } catch (e) { /* almacenamiento no disponible: se usa solo la URL */ }
  }

  function readSaved() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return '';
      var data = JSON.parse(raw);
      if (!data || Date.now() - data.t > TTL_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return '';
      }
      return sanitize(data.k);
    } catch (e) {
      return '';
    }
  }

  // La palabra del enlace actual manda; si no hay, se usa la guardada.
  var fromUrl = readFromUrl();
  if (fromUrl) save(fromUrl);
  var keyword = fromUrl || readSaved();

  function isWhatsAppLink(url) {
    return WA_HOSTS.indexOf(url.hostname) !== -1;
  }

  // Agrega " (PALABRA)" al parámetro text, sin duplicarlo.
  function addKeyword(href, kw) {
    var url;
    try { url = new URL(href, window.location.href); } catch (e) { return href; }
    if (!isWhatsAppLink(url)) return href;
    var text = url.searchParams.get('text') || 'Hola Teo';
    var tag = '(' + kw + ')';
    if (text.indexOf(tag) === -1) text = text + ' ' + tag;
    // Se arma a mano con encodeURIComponent: espacios como %20 (no "+"), igual que los enlaces del sitio.
    url.searchParams.delete('text');
    var rest = url.searchParams.toString();
    return url.origin + url.pathname + '?' + (rest ? rest + '&' : '') + 'text=' + encodeURIComponent(text) + url.hash;
  }

  function trackPixel(kw) {
    try {
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Contact', { content_name: kw || 'SIN_PALABRA' });
      }
    } catch (e) { /* sin píxel: no pasa nada */ }
  }

  // Delegación de clics: funciona también con botones que se agreguen después.
  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!link) return;
    var url;
    try { url = new URL(link.href, window.location.href); } catch (e) { return; }
    if (!isWhatsAppLink(url)) return;

    if (keyword) link.href = addKeyword(link.href, keyword);
    trackPixel(keyword);
  }, true);

  // Expuesto solo para pruebas en consola: window.__teoKeyword
  window.__teoKeyword = keyword;
})();