// JSONファイルのパスを指定（例：同じディレクトリにある client-data.json）
fetch('client-data.json')
  .then(response => response.json())
  .then(data => {
    // シンプルなテキスト・画像の反映
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el && value) el.textContent = value;
    };
    const setImg = (id, src) => {
      const el = document.getElementById(id);
      if (el && src) el.src = src;
    };
    const setLink = (id, href) => {
      const el = document.getElementById(id);
      if (el && href) el.href = href;
    };

    set('main_message', data.main_message);
    set('hero_message', data.hero_message);
    setImg('hero_image', data.hero_image);
    setImg('hero_logo', data.hero_logo);

    // Key Facts
    const kf = data.key_facts || {};
    set('key_name', kf.name);
    set('key_name_fact', kf.name);
    set('key_location', kf.location);
    set('key_language', kf.language);
    set('key_founded', kf.founded);
    set('key_services', kf.services);
    set('key_tel_display', kf.tel_display);
    set('key_tel_display_access', kf.tel_display);
    setLink('key_tel_link', kf.tel_link);
    setLink('key_reservation_url', kf.reservation_url);

    // Owner
    const owner = data.owner || {};
    set('owner_name', owner.name);
    setImg('owner_image', owner.image);
    set('owner_license', owner.license);
    set('owner_reg_number', owner.reg_number);
    set('owner_cert_number', owner.cert_number);

    // FAQ
    const faq = data.faq || [];
    if (faq[0]) { set('faq_q1', faq[0].q); set('faq_a1', faq[0].a); }
    if (faq[1]) { set('faq_q2', faq[1].q); set('faq_a2', faq[1].a); }
    if (faq[2]) { set('faq_q3', faq[2].q); set('faq_a3', faq[2].a); }

    // アクセス
    const access = data.access || {};
    const map = document.getElementById('access_map');
    if (map && access.map_embed) map.src = access.map_embed;
    set('access_address', access.address);
    set('access_hours', access.hours);
    set('access_station', access.station);

    // CTA
    const cta = data.cta || {};
    set('cta_mid1', cta.mid1);
    set('cta_mid2', cta.mid2);
    set('cta_final', cta.final);
  })
  .catch(err => console.error('JSON読み込みエラー:', err));
