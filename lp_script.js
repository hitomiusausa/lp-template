// lp_script.js
fetch("config.json")
  .then(response => response.json())
  .then(data => {
    const setText = (id, text) => {
      const el = document.getElementById(id);
      if (el && text) el.textContent = text;
    };

    const setImage = (id, src) => {
      const el = document.getElementById(id);
      if (el && src) el.src = src;
    };

    const setLink = (id, href) => {
      const el = document.getElementById(id);
      if (el && href) el.href = href;
    };

    const setMap = (id, src) => {
      const el = document.getElementById(id);
      if (el && src) el.src = src;
    };

    // Hero Section
    setImage("hero_image", data.hero_image);
    setText("key_name", data.key_facts?.name);
    setText("hero_message", data.hero_message);
    setImage("hero_logo", data.hero_logo);

    // Message Section
    setText("main_message", data.main_message);
 　　setText("key_name", data.key_name);
    setText("cta_mid1", data.cta?.mid1);

    // Key Facts
    setText("key_location", data.key_facts?.location);
    setText("key_language", data.key_facts?.language);
    setText("key_founded", data.key_facts?.founded);
    setText("key_services", data.key_facts?.services);
    setText("key_tel_display", data.key_facts?.tel_display);
    setLink("key_tel_link", data.key_facts?.tel_link);
    setLink("key_reservation_url", data.key_facts?.reservation_url);

    // Owner Section
    setImage("owner_image", data.owner?.image);
    setText("owner_name", data.owner?.name);
    setText("owner_license", data.owner?.license);
    setText("owner_reg_number", data.owner?.reg_number);
    setText("owner_cert_number", data.owner?.cert_number);

    // FAQ
    setText("faq_q1", data.faq?.[0]?.q);
    setText("faq_a1", data.faq?.[0]?.a);
    setText("faq_q2", data.faq?.[1]?.q);
    setText("faq_a2", data.faq?.[1]?.a);
    setText("faq_q3", data.faq?.[2]?.q);
    setText("faq_a3", data.faq?.[2]?.a);

    // Access
    setMap("access_map", data.access?.map_embed);
    setText("access_address", data.access?.address);
    setText("access_hours", data.access?.hours);
    setText("access_station", data.access?.station);
    setText("key_tel_display_access", data.key_facts?.tel_display);

    // Final CTA
    setText("cta_final", data.cta?.final);
  })
  .catch(err => console.error("JSON読み込みエラー", err));
