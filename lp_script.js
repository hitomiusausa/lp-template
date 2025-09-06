// lp_script.js（フラットJSON対応・ID整合済み）
fetch("config.json")
  .then(r => r.json())
  .then(data => {
    const setText = (id, text) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (text !== undefined && text !== null && String(text).trim() !== "") {
        el.textContent = text;
      }
    };
const setImage = (id, src, fallback = "logo.png") => {
  const el = document.getElementById(id);
  if (!el || !src) return;
  el.src = src;
  el.addEventListener("error", () => {
    console.warn(`[image-missing] ${src} → fallback: ${fallback}`);
    el.src = fallback;
  }, { once: true });
};

    const setLink = (id, href) => {
      const el = document.getElementById(id);
      if (el && href && String(href).trim() !== "") el.href = href;
    };
    const setSrc = (id, src) => {
      const el = document.getElementById(id);
      if (el && src && String(src).trim() !== "") el.src = src;
    };

    // --- Hero ---
    setImage("hero_image", data.hero_image);               // 例: "/assets/images/hero.jpg"
    setImage("hero_logo", data.hero_logo);
    setText("key_name", data.key_name);                    // H1
    // hero_message が無ければ hero_title → それも無ければ "" に
    setText("hero_message", data.hero_message || "");
    setText("hero_title", data.hero_title || "");          // 追加表示用（HTML側も追加済）

    // --- Message ---
    setText("main_message", data.main_message);
    setText("cta_mid1", data.cta_mid1);

    // --- Key Facts（フラットJSON） ---
    setText("key_name_fact", data.key_name);               // 事業所名（辞書側）
    setText("key_location", data.key_location);
    setText("key_language", data.key_language);
    setText("key_founded", data.key_founded);
    setText("key_services", data.key_services);
    setText("key_tel_display", data.key_tel_display);
    setLink("key_tel_link", data.key_tel_link);
    setLink("key_reservation_url", data.key_reservation_url);

    // --- Owner（フラットJSON） ---
    setImage("owner_image", data.owner_image);
    setText("owner_name", data.owner_name);
    setText("owner_license", data.owner_license);
    setText("owner_reg_number", data.owner_reg_number);
    setText("owner_cert_number", data.owner_cert_number);

    // --- FAQ（フラットJSON） ---
    setText("faq_q1", data.faq_q1);
    setText("faq_a1", data.faq_a1);
    setText("faq_q2", data.faq_q2);
    setText("faq_a2", data.faq_a2);
    setText("faq_q3", data.faq_q3);
    setText("faq_a3", data.faq_a3);

    // --- Access（フラットJSON） ---
    setSrc("access_map", data.access_map);                 // 例: Google Map の embed URL
    setText("access_address", data.access_address);
    setText("access_hours", data.access_hours);
    setText("access_station", data.access_station);

    // --- CTA ---
    setText("cta_mid2", data.cta_mid2);
    setText("cta_final", data.cta_final);
  })
  .catch(err => console.error("JSON読み込みエラー:", err));
