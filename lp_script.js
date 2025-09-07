// フラットJSONに対応した描画スクリプト
(function(){
const $ = (id) => document.getElementById(id);
const setText = (id, text) => { const el = $(id); if (!el) return; if (text && String(text).trim()!=="") el.textContent = text; };
const setHTML = (id, html) => { const el = $(id); if (!el) return; if (html && String(html).trim()!=="") el.innerHTML = html; };
const setImage = (id, src, fallback = "/assets/images/logo.png") => {
const el = $(id); if (!el || !src) return; el.src = src; el.addEventListener('error', ()=>{ el.src = fallback; }, { once:true });
};
const setLink = (id, href) => { const el = $(id); if (el && href) el.href = href; };
const setSrc = (id, src) => { const el = $(id); if (el && src) el.src = src; };


const file = 'config.json';
fetch(file)
.then(r => r.json())
.then(data => {
// Hero
setImage('hero_image', data.hero_image);
setImage('hero_logo', data.hero_logo);
setText ('key_name', data.key_name);
setText ('hero_message', data.hero_message || '');


// Message & CTA
setText('main_message', data.main_message);
setText('cta_mid1', data.cta_mid1);


// Facts（key_nameはヒーローとFactsの両方に反映）
setText('key_name_fact', data.key_name);
setText('key_location', data.key_location);
setText('key_language', data.key_language);
setText('key_founded', data.key_founded);
setText('key_services', data.key_services);
setText('key_tel_display', data.key_tel_display);
setLink('key_tel_link', data.key_tel_link);
setLink('key_reservation_url', data.key_reservation_url);


// Owner
setImage('owner_image', data.owner_image);
setText('owner_name', data.owner_name);
setText('owner_license', data.owner_license);
setText('owner_reg_number', data.owner_reg_number);
setText('owner_cert_number', data.owner_cert_number);


// Q&A
setText('faq_q1', data.faq_q1);
setHTML('faq_a1', (data.faq_a1 || '').replace(/\n/g,'<br>'));

setText('faq_q2', data.faq_q2);
setHTML('faq_a2', (data.faq_a2 || '').replace(/\n/g,'<br>'));

setText('faq_q3', data.faq_q3);
setHTML('faq_a3', (data.faq_a3 || '').replace(/\n/g,'<br>'));

initFAQAccordion();

function initFAQAccordion() {
  const root = document.getElementById('faq');
  if (!root) return;

  // 空項目は削除（空ボタン出さない）
  root.querySelectorAll('.faq-q').forEach(btn => {
    const ddId = btn.getAttribute('aria-controls');
    const dd = document.getElementById(ddId);
    const qSpan = btn.querySelector('span[id^="faq_q"]');
    const hasQ = qSpan && qSpan.textContent.trim() !== '';
    const hasA = dd && dd.textContent.trim() !== '';
    if (!hasQ || !hasA) {
      const dt = btn.closest('dt');
      if (dt && dd) { dt.remove(); dd.remove(); }
    }
  });

  // 開閉（イベント委任）
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq-q');
    if (!btn || !root.contains(btn)) return;
    e.preventDefault();

    const ddId = btn.getAttribute('aria-controls');
    const dd = document.getElementById(ddId);
    if (!dd) return;

    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      closePanel(dd, btn);
    } else {
      // ▼ 1個だけ開きたい場合はここを有効化
      // root.querySelectorAll('.faq-a:not([hidden])').forEach(open => {
      //   if (open.id !== ddId) closePanel(open, root.querySelector(`.faq-q[aria-controls="${open.id}"]`));
      // });
      openPanel(dd, btn);
    }
  });
}

function openPanel(dd, btn) {
  btn.setAttribute('aria-expanded', 'true');
  const icon = btn.querySelector('.faq-icon'); if (icon) icon.textContent = '−';
  dd.removeAttribute('hidden');     // 表示にしてから
  dd.classList.add('open');         // CSSでmax-heightを滑らかに上げる
}

function closePanel(dd, btn) {
  btn.setAttribute('aria-expanded', 'false');
  const icon = btn.querySelector('.faq-icon'); if (icon) icon.textContent = '+';
  dd.classList.remove('open');      // max-heightを0に戻す（アニメ）
  // アニメ後に hidden を戻してアクセシビリティ的にも閉じた状態に
  const onEnd = (ev) => {
    if (ev.propertyName !== 'max-height') return;
    dd.setAttribute('hidden','');
    dd.removeEventListener('transitionend', onEnd);
  };
  dd.addEventListener('transitionend', onEnd);
}


// Access（営業時間は改行保持）
setSrc ('access_map', data.access_map);
setHTML('access_hours', (data.access_hours||'').replace(/\n/g,'<br>'));
setText('access_address', data.access_address);
setText('access_station', data.access_station);


// Final CTA
setText('cta_mid2', data.cta_mid2);
setText('cta_final', data.cta_final);
})
.catch(err => console.error('JSON読み込みエラー:', err));
})();
