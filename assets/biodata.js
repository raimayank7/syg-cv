/* Biodata maker (marriage biodata and job biodata). Runs in the browser only: text and photo stay in localStorage on this device.
   The page sets window.BIO = {key, title, top, sections:[{id,title,rows:[[key,label,placeholder,big?]]}], tables:[{id,title,cols:[..],rows:n}], declaration, sign} */
(function () {
  'use strict';
  var d = document, form = d.getElementById('bd-form'), C = window.BIO;
  if (!form || !C) return;
  var $ = function (id) { return d.getElementById(id); }, esc = SYG.esc, KEY = 'biodata-' + C.key;
  var EMPTY = { top: C.top || '', heading: C.title, f: {}, custom: {}, t: {}, photo: '', tpl: 'border', color: '#7f1d1d', size: 11, decl: C.declaration || '', place: '', date: '' };
  var data;
  function load() { var v = null; try { v = JSON.parse(localStorage.getItem(KEY)); } catch (e) {} data = Object.assign(JSON.parse(JSON.stringify(EMPTY)), v || {}); ['f', 'custom', 't'].forEach(function (k) { if (!data[k] || typeof data[k] !== 'object') data[k] = {}; }); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { SYG.toast('Could not save in this browser (storage is full). Remove the photo or download a backup.'); } }
  function inp(id, label, ph, val, big) {
    return '<div class="rb-f"><label for="' + id + '">' + esc(label) + '</label>' + (big ? '<textarea id="' + id + '" rows="3" placeholder="' + esc(ph || '') + '">' + esc(val || '') + '</textarea>'
      : '<input type="text" id="' + id + '" placeholder="' + esc(ph || '') + '" value="' + esc(val || '') + '" autocomplete="off">') + '</div>';
  }
  function drawForm() {
    var h = '<fieldset><legend>Heading</legend><div class="rb-grid">' + inp('bd-top', 'Top line (optional)', C.topPh || '', data.top) + inp('bd-heading', 'Title', 'BIODATA', data.heading) + '</div></fieldset>';
    C.sections.forEach(function (s) {
      h += '<fieldset><legend>' + esc(s.title) + '</legend><div class="rb-grid">';
      s.rows.forEach(function (r) { if (!r[3]) h += inp('bd-f-' + r[0], r[1], r[2], data.f[r[0]]); });
      h += '</div>';
      s.rows.forEach(function (r) { if (r[3]) h += inp('bd-f-' + r[0], r[1], r[2], data.f[r[0]], true); });
      (data.custom[s.id] || []).forEach(function (c, n) {
        h += '<div class="rb-grid bd-cust">' + inp('bd-c-' + s.id + '-' + n + '-l', 'Your own label', 'For example: Blood group', c[0]) + inp('bd-c-' + s.id + '-' + n + '-v', 'Value', '', c[1]) +
          '<div class="rb-f"><label>&nbsp;</label><button type="button" class="btn sm ghost" data-crm="' + s.id + ',' + n + '">Remove row</button></div></div>';
      });
      h += '<button type="button" class="btn sm ghost" data-cadd="' + s.id + '">Add your own row</button></fieldset>';
    });
    (C.tables || []).forEach(function (t) {
      var rows = data.t[t.id] || (data.t[t.id] = Array.apply(null, Array(t.rows)).map(function () { return t.cols.map(function () { return ''; }); }));
      h += '<fieldset><legend>' + esc(t.title) + '</legend>';
      rows.forEach(function (r, n) {
        h += '<div class="rb-grid bd-trow">';
        t.cols.forEach(function (c, k) { h += inp('bd-t-' + t.id + '-' + n + '-' + k, c, '', r[k]); });
        h += '</div>';
      });
      h += '<div class="rb-row"><button type="button" class="btn sm ghost" data-tadd="' + t.id + '">Add a row</button><button type="button" class="btn sm ghost" data-trm="' + t.id + '">Remove last row</button></div></fieldset>';
    });
    if (C.declaration !== undefined) h += '<fieldset><legend>Declaration and signature</legend>' + inp('bd-decl', 'Declaration (leave empty to omit)', '', data.decl, true) + '<div class="rb-grid">' + inp('bd-place', 'Place', 'Lucknow', data.place) + inp('bd-date', 'Date', '12 November 2026', data.date) + '</div></fieldset>';
    form.innerHTML = h;
  }
  function read() {
    data.top = $('bd-top').value.trim(); data.heading = $('bd-heading').value.trim();
    C.sections.forEach(function (s) {
      s.rows.forEach(function (r) { data.f[r[0]] = $('bd-f-' + r[0]).value.trim(); });
      (data.custom[s.id] || []).forEach(function (c, n) { c[0] = $('bd-c-' + s.id + '-' + n + '-l').value.trim(); c[1] = $('bd-c-' + s.id + '-' + n + '-v').value.trim(); });
    });
    (C.tables || []).forEach(function (t) { data.t[t.id].forEach(function (r, n) { t.cols.forEach(function (c, k) { r[k] = $('bd-t-' + t.id + '-' + n + '-' + k).value.trim(); }); }); });
    if (C.declaration !== undefined) { data.decl = $('bd-decl').value.trim(); data.place = $('bd-place').value.trim(); data.date = $('bd-date').value.trim(); }
  }
  function pairs(s) {
    var out = [];
    s.rows.forEach(function (r) { if (data.f[r[0]]) out.push([r[1].replace(/\s*\(.*\)$/, ''), data.f[r[0]]]); });
    (data.custom[s.id] || []).forEach(function (c) { if (c[0] && c[1]) out.push(c); });
    return out;
  }
  function sheetHtml() {
    var h = (data.top ? '<p class="bs-top">' + esc(data.top) + '</p>' : '') + '<p class="bs-h">' + esc(data.heading || C.title) + '</p>';
    var first = true;
    C.sections.forEach(function (s) {
      var p = pairs(s); if (!p.length) return;
      var tbl = '<table>' + p.map(function (x) { return '<tr><th>' + esc(x[0]) + '</th><td>' + esc(x[1]).replace(/\n/g, '<br>') + '</td></tr>'; }).join('') + '</table>';
      h += '<section><h2>' + esc(s.title) + '</h2>' + (first && data.photo ? '<div class="bs-ph"><div>' + tbl + '</div><img src="' + data.photo + '" alt="Photograph"></div>' : tbl) + '</section>';
      first = false;
    });
    (C.tables || []).forEach(function (t) {
      var rows = (data.t[t.id] || []).filter(function (r) { return r.some(Boolean); }); if (!rows.length) return;
      h += '<section><h2>' + esc(t.title) + '</h2><table class="bs-grid"><thead><tr>' + t.cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></section>';
    });
    if (C.declaration !== undefined) {
      if (data.decl) h += '<section><h2>Declaration</h2><p>' + esc(data.decl) + '</p></section>';
      h += '<div class="bs-sign"><div>' + (data.place ? 'Place: ' + esc(data.place) + '<br>' : '') + (data.date ? 'Date: ' + esc(data.date) : '') + '</div><div>' + esc(C.sign || 'Signature') + '<br><b>' + esc(data.f.name || '') + '</b></div></div>';
    }
    return '<div class="bs-in">' + h + '</div>';
  }
  var sheet = $('bd-sheet'), wrap = $('bd-wrap');
  function fit() {
    var k = Math.min(1, wrap.clientWidth / sheet.offsetWidth);
    sheet.style.transform = 'scale(' + k + ')'; wrap.style.height = Math.ceil(sheet.offsetHeight * k) + 'px';
    var inner = sheet.firstElementChild, over = inner ? inner.scrollHeight - inner.clientHeight : 0, st = $('bd-fit');
    if (over > 2) { st.textContent = 'Too long for one page by about ' + Math.ceil(over / 3.78) + ' mm. Shorten the text or press "Fit to one page".'; st.className = 'rb-fit bad'; }
    else { st.textContent = 'Fits on one A4 page.'; st.className = 'rb-fit ok'; }
    return over;
  }
  function draw() {
    sheet.className = 'bs bs-' + data.tpl; sheet.style.setProperty('--bs-c', data.color); sheet.style.setProperty('--bs-f', data.size + 'pt');
    sheet.innerHTML = sheetHtml(); $('bd-size').value = data.size; $('bd-size-v').textContent = data.size + ' pt';
    $('bd-photo-rm').hidden = !data.photo; fit();
  }
  function controls() {
    Array.prototype.forEach.call(d.querySelectorAll('[data-tpl]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-tpl') === data.tpl ? 'true' : 'false'); });
    Array.prototype.forEach.call(d.querySelectorAll('[data-color]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-color') === data.color ? 'true' : 'false'); });
  }
  function all() { drawForm(); controls(); draw(); save(); }
  form.addEventListener('input', function () { read(); draw(); save(); });
  form.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return; var p, t;
    if (b.hasAttribute('data-cadd')) { read(); p = b.getAttribute('data-cadd'); (data.custom[p] = data.custom[p] || []).push(['', '']); all(); }
    else if (b.hasAttribute('data-crm')) { read(); p = b.getAttribute('data-crm').split(','); data.custom[p[0]].splice(+p[1], 1); all(); }
    else if (b.hasAttribute('data-tadd')) { read(); p = b.getAttribute('data-tadd'); t = C.tables.filter(function (x) { return x.id === p; })[0]; if (data.t[p].length < 10) data.t[p].push(t.cols.map(function () { return ''; })); all(); }
    else if (b.hasAttribute('data-trm')) { read(); p = b.getAttribute('data-trm'); if (data.t[p].length > 1) data.t[p].pop(); all(); }
  });
  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-tpl],[data-color]'); if (!b) return;
    read(); if (b.hasAttribute('data-tpl')) data.tpl = b.getAttribute('data-tpl'); else data.color = b.getAttribute('data-color');
    controls(); draw(); save();
  });
  $('bd-size').addEventListener('input', function () { data.size = +this.value; draw(); save(); });
  $('bd-auto').addEventListener('click', function () { read(); while (fit() > 2 && data.size > 8.5) { data.size = Math.round((data.size - 0.25) * 100) / 100; draw(); } save(); SYG.toast(fit() > 2 ? 'Still too long at the smallest readable size. Cut some text.' : 'Fits on one page at ' + data.size + ' pt'); });
  $('bd-print').addEventListener('click', function () {
    read(); draw();
    if (fit() > 2 && !confirm('The biodata is longer than one page and the extra lines will be cut off. Print anyway?')) return;
    var old = d.title; d.title = (data.f.name || 'Biodata').replace(/[^\w ]+/g, '').trim().replace(/\s+/g, '_') + '_Biodata'; window.print(); d.title = old;
  });
  function asText(noContact) {
    var t = [];
    if (data.top) t.push(data.top); t.push((data.heading || C.title).toUpperCase(), '');
    C.sections.forEach(function (s) {
      if (noContact && s.contact) return;
      var p = pairs(s); if (!p.length) return; t.push('*' + s.title + '*'); p.forEach(function (x) { t.push(x[0] + ': ' + x[1].replace(/\n/g, ' ')); }); t.push('');
    });
    (C.tables || []).forEach(function (tb) { var rows = (data.t[tb.id] || []).filter(function (r) { return r.some(Boolean); }); if (rows.length) { t.push('*' + tb.title + '*'); rows.forEach(function (r) { t.push(r.filter(Boolean).join(', ')); }); t.push(''); } });
    return t.join('\n').trim();
  }
  $('bd-text').addEventListener('click', function () { read(); SYG.copy(asText(false), 'Text copied'); });
  if ($('bd-text2')) $('bd-text2').addEventListener('click', function () { read(); SYG.copy(asText(true), 'Copied without the contact details'); });
  $('bd-photo').addEventListener('change', function () {
    var f = this.files[0]; this.value = ''; if (!f) return;
    if (!/^image\//.test(f.type)) return SYG.toast('Please choose a picture file');
    var r = new FileReader();
    r.onload = function () {
      var img = new Image();
      img.onload = function () {          // shrink to a small portrait so it fits in browser storage and prints sharply enough
        var w = 360, h = Math.round(w * 4 / 3), c = d.createElement('canvas'); c.width = w; c.height = h;
        var k = Math.max(w / img.width, h / img.height), sw = w / k, sh = h / k;
        c.getContext('2d').drawImage(img, (img.width - sw) / 2, Math.max(0, (img.height - sh) / 4), sw, sh, 0, 0, w, h);
        read(); data.photo = c.toDataURL('image/jpeg', 0.85); draw(); save(); SYG.toast('Photo added. It stays on this device.');
      };
      img.onerror = function () { SYG.toast('That picture could not be read'); };
      img.src = r.result;
    };
    r.readAsDataURL(f);
  });
  $('bd-photo-rm').addEventListener('click', function () { read(); data.photo = ''; draw(); save(); });
  $('bd-save').addEventListener('click', function () {
    read(); var a = d.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
    a.download = (data.f.name || 'my').replace(/[^\w]+/g, '_') + '_biodata_backup.json'; d.body.appendChild(a); a.click(); a.remove();
  });
  $('bd-open').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return; var r = new FileReader();
    r.onload = function () { try { var v = JSON.parse(r.result); if (typeof v !== 'object' || !v.f) throw 0; data = Object.assign(JSON.parse(JSON.stringify(EMPTY)), v); all(); SYG.toast('Backup opened'); } catch (e) { SYG.toast('That file is not a biodata backup from this page'); } };
    r.readAsText(f); this.value = '';
  });
  $('bd-clear').addEventListener('click', function () { if (confirm('Clear everything you have typed, including the photo? This cannot be undone.')) { data = JSON.parse(JSON.stringify(EMPTY)); all(); } });
  $('bd-sample').addEventListener('click', function () {
    read(); if (data.f.name && !confirm('Replace what you have typed with a sample?')) return;
    data = Object.assign(JSON.parse(JSON.stringify(EMPTY)), JSON.parse(JSON.stringify(C.sample)), { tpl: data.tpl, color: data.color }); all(); SYG.toast('Sample loaded. Replace it with your own details.');
  });
  window.addEventListener('resize', fit);
  load(); all();
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(fit);
})();
/* which-document chooser */
(function () {
  var box = document.getElementById('wd'); if (!box) return;
  box.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-wd]'); if (!b) return;
    Array.prototype.forEach.call(box.querySelectorAll('button[data-wd]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    var r = document.getElementById('wd-res'); r.hidden = false; r.innerHTML = document.getElementById('wd-' + b.getAttribute('data-wd')).innerHTML; r.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
})();
