/* ==================================================================
   components/opportunity-form.js — formulario multipaso (wizard)
   ------------------------------------------------------------------
   Portado del motor original sin cambios funcionales: 7 pasos,
   validación, resumen en vivo y envío por WhatsApp / email / copia.
   ================================================================== */
import { esc } from "../utils/dom.js";
import { isValidEmail } from "../utils/validation.js";

const TOTAL_STEPS = 7;

export function createWizard(ctx) {
  const { data, state, i18n } = ctx;
  const SETTINGS = data.settings || {};
  const LINKS = data.links || {};

  const form = {
    step: 1,
    opportunity: "",
    company: { empresa: "", sitio: "", pais: "", nombre: "", cargo: "", email: "", whatsapp: "" },
    industries: [],
    context: "",
    responsibilities: [""],
    profile: { indispensables: "", deseables: "", problema: "", resultados: "", liderazgo: "", viajes: "", modalidad: "" },
    comp: { currency: "USD", type: "", min: 2500, max: 4000 },
    message: "",
    urgency: ""
  };

  function F() { return data.forms.opportunity; }
  function t(x) { return i18n.t(x); }
  function ui(k) { return i18n.ui(k); }
  function fmtMoney(n) { return Number(n).toLocaleString(state.lang === "es" ? "es-PA" : "en-US"); }
  function rangeText() {
    return form.comp.currency + " " + fmtMoney(form.comp.min) + " – " + form.comp.currency + " " + fmtMoney(form.comp.max);
  }

  function wizardField(f, value, prefix) {
    const req = f.required ? " *" : "";
    if (f.type === "textarea") {
      return '<div class="field"><label for="' + prefix + f.id + '">' + esc(t(f.label)) + req + "</label>" +
        '<textarea id="' + prefix + f.id + '" data-bind="' + prefix + f.id + '">' + esc(value || "") + "</textarea>" +
        '<p class="err">' + esc(ui("requiredField")) + "</p></div>";
    }
    return '<div class="field"><label for="' + prefix + f.id + '">' + esc(t(f.label)) + req + "</label>" +
      '<input type="' + esc(f.type || "text") + '" id="' + prefix + f.id + '" data-bind="' + prefix + f.id + '" value="' + esc(value || "") + '"' +
      (f.required ? ' required aria-required="true"' : "") + ">" +
      '<p class="err">' + esc(f.type === "email" ? ui("invalidEmail") : ui("requiredField")) + "</p></div>";
  }

  const STEPS = {
    1: function () {
      const s = F().steps.step1;
      const opts = s.options.map(function (o) {
        const checked = form.opportunity === o.id ? " checked" : "";
        return '<label class="opt"><input type="radio" name="opportunity" value="' + esc(o.id) + '"' + checked + ">" +
          "<span>" + esc(t(o.label)) + "</span></label>";
      }).join("");
      return "<h3>" + esc(t(s.title)) + '</h3><p class="step-hint">' + esc(t(s.question)) + "</p>" +
        '<div class="opt-grid" role="radiogroup" aria-label="' + esc(t(s.question)) + '">' + opts + "</div>" +
        '<p class="err" id="step1-err" style="display:none;color:var(--danger);font-size:.8rem;margin-top:10px">' + esc(ui("selectOne")) + "</p>";
    },
    2: function () {
      const s = F().steps.step2;
      return "<h3>" + esc(t(s.title)) + "</h3>" +
        '<div class="field-row">' +
        s.fields.map(function (f) { return wizardField(f, form.company[f.id], "c_"); }).join("") +
        "</div>";
    },
    3: function () {
      const s = F().steps.step3;
      const opts = (state.lang === "es" ? s.options : (s.optionsEn || s.options)).map(function (o, i) {
        const base = s.options[i]; /* valor canónico en español para el mensaje */
        const checked = form.industries.indexOf(base) > -1 ? " checked" : "";
        return '<label class="opt checkbox"><input type="checkbox" name="industry" value="' + esc(base) + '"' + checked + ">" +
          "<span>" + esc(o) + "</span></label>";
      }).join("");
      return "<h3>" + esc(t(s.title)) + '</h3><p class="step-hint">' + esc(t(s.question)) + "</p>" +
        '<div class="opt-grid compact">' + opts + "</div>" +
        '<div class="field" style="margin-top:18px"><label for="f-context">' + esc(t(s.contextLabel)) + "</label>" +
        '<textarea id="f-context" data-bind="context">' + esc(form.context) + "</textarea></div>";
    },
    4: function () {
      const s = F().steps.step4;
      const items = form.responsibilities.map(function (r, i) {
        return '<div class="resp-item">' +
          '<span class="resp-num" aria-hidden="true">' + (i + 1) + "</span>" +
          '<textarea class="resp-input" data-resp="' + i + '" aria-label="' + esc(t(s.title)) + " " + (i + 1) + '" placeholder="' + esc(t(s.placeholder)) + '">' + esc(r) + "</textarea>" +
          (form.responsibilities.length > 1
            ? '<button type="button" class="resp-del" data-del="' + i + '" aria-label="' + esc(ui("removeResponsibility")) + '">×</button>'
            : "") +
          "</div>";
      }).join("");
      return "<h3>" + esc(t(s.title)) + "</h3>" +
        '<div id="resp-list">' + items + "</div>" +
        '<button type="button" class="btn btn-ghost btn-sm" id="add-resp">+ ' + esc(ui("addResponsibility")) + "</button>";
    },
    5: function () {
      const s = F().steps.step5;
      const fields = s.fields.map(function (f) { return wizardField(Object.assign({ type: "textarea" }, f), form.profile[f.id], "p_"); }).join("");
      const selects = s.selects.map(function (sel) {
        const opts = (sel.options[state.lang] || sel.options.es).map(function (o) {
          return '<option value="' + esc(o) + '"' + (form.profile[sel.id] === o ? " selected" : "") + ">" + esc(o) + "</option>";
        }).join("");
        return '<div class="field"><label for="p_' + sel.id + '">' + esc(t(sel.label)) + "</label>" +
          '<select id="p_' + sel.id + '" data-bind="p_' + sel.id + '"><option value="">—</option>' + opts + "</select></div>";
      }).join("");
      return "<h3>" + esc(t(s.title)) + "</h3>" + fields + '<div class="field-row" style="grid-template-columns:repeat(3,1fr)">' + selects + "</div>";
    },
    6: function () {
      const s = F().steps.step6;
      const curr = s.currencies.map(function (c) {
        return '<option value="' + esc(c) + '"' + (form.comp.currency === c ? " selected" : "") + ">" + esc(c) + "</option>";
      }).join("");
      const types = (s.types[state.lang] || s.types.es).map(function (tp) {
        return '<option value="' + esc(tp) + '"' + (form.comp.type === tp ? " selected" : "") + ">" + esc(tp) + "</option>";
      }).join("");
      return "<h3>" + esc(t(s.title)) + "</h3>" +
        '<div class="field-row">' +
        '<div class="field"><label for="f-currency">' + esc(t(s.currencyLabel)) + '</label><select id="f-currency">' + curr + "</select></div>" +
        '<div class="field"><label for="f-comptype">' + esc(t(s.typeLabel)) + '</label><select id="f-comptype"><option value="">—</option>' + types + "</select></div>" +
        "</div>" +
        '<div class="range-wrap">' +
        '<p class="range-display"><span style="font-size:.62em;display:block;color:var(--muted);font-family:var(--font-body);font-weight:600;letter-spacing:.1em;text-transform:uppercase">' + esc(ui("rangeEstimated")) + '</span><span id="range-out">' + esc(rangeText()) + "</span></p>" +
        '<div class="dual-range">' +
        '<div class="track"></div><div class="track-fill" id="track-fill"></div>' +
        '<input type="range" id="range-min" min="' + s.min + '" max="' + s.max + '" step="' + s.step + '" value="' + form.comp.min + '" aria-label="Mínimo">' +
        '<input type="range" id="range-max" min="' + s.min + '" max="' + s.max + '" step="' + s.step + '" value="' + form.comp.max + '" aria-label="Máximo">' +
        "</div>" +
        '<div class="range-scale"><span>' + form.comp.currency + " " + fmtMoney(s.min) + "</span><span>" + form.comp.currency + " " + fmtMoney(s.max) + "</span></div>" +
        "</div>" +
        '<p class="form-note">' + esc(t(s.note)) + "</p>";
    },
    7: function () {
      const s = F().steps.step7;
      const urg = (s.urgencyOptions[state.lang] || s.urgencyOptions.es).map(function (u, i) {
        const base = s.urgencyOptions.es[i];
        const checked = form.urgency === base ? " checked" : "";
        return '<label class="opt"><input type="radio" name="urgency" value="' + esc(base) + '"' + checked + "><span>" + esc(u) + "</span></label>";
      }).join("");
      return "<h3>" + esc(t(s.title)) + "</h3>" +
        '<div class="field"><label for="f-message">' + esc(t(s.messageLabel)) + '</label><textarea id="f-message" data-bind="message">' + esc(form.message) + "</textarea></div>" +
        '<div class="field"><label>' + esc(t(s.urgencyLabel)) + '</label><div class="opt-grid">' + urg + "</div></div>" +
        '<p class="ai-sub" style="margin-top:24px">' + esc(ui("summaryTitle")) + "</p>" +
        '<div class="summary-box" id="summary-box">' + esc(buildMessage()) + "</div>" +
        '<div style="margin-top:12px;display:flex;align-items:center;flex-wrap:wrap;gap:4px">' +
        '<button type="button" class="btn btn-outline btn-sm" id="copy-summary">' + esc(ui("copySummary")) + "</button>" +
        '<span class="copy-feedback" id="copy-feedback">' + esc(ui("copied")) + "</span></div>";
    }
  };

  /* ---------- Construcción del mensaje para WhatsApp / email ---------- */
  function labelOfOpportunity() {
    const s = F().steps.step1;
    const o = s.options.find(function (x) { return x.id === form.opportunity; });
    return o ? t(o.label) : "—";
  }
  function buildMessage() {
    const c = form.company, p = form.profile;
    const resp = form.responsibilities.map(function (r) { return r.trim(); }).filter(Boolean);
    const lines = [];
    lines.push(t(F().whatsappGreeting));
    lines.push("");
    lines.push("Tipo de oportunidad:");
    lines.push(labelOfOpportunity());
    lines.push("");
    lines.push("Empresa:");
    lines.push("- Nombre: " + (c.empresa || "—"));
    lines.push("- Web / red social: " + (c.sitio || "—"));
    lines.push("- País / ciudad: " + (c.pais || "—"));
    lines.push("- Contacto: " + (c.nombre || "—") + (c.cargo ? " (" + c.cargo + ")" : ""));
    lines.push("- Email: " + (c.email || "—"));
    lines.push("- WhatsApp: " + (c.whatsapp || "—"));
    lines.push("");
    lines.push("Área / industria:");
    lines.push(form.industries.length ? form.industries.join(", ") : "—");
    if (form.context.trim()) { lines.push("Contexto: " + form.context.trim()); }
    lines.push("");
    lines.push("Responsabilidades principales:");
    if (resp.length) { resp.forEach(function (r, i) { lines.push((i + 1) + ". " + r); }); }
    else { lines.push("—"); }
    lines.push("");
    lines.push("Perfil deseado:");
    lines.push("- Indispensables: " + (p.indispensables || "—"));
    lines.push("- Deseables: " + (p.deseables || "—"));
    lines.push("- Problema a resolver: " + (p.problema || "—"));
    lines.push("- Resultados 90 días: " + (p.resultados || "—"));
    lines.push("- Liderazgo de equipo: " + (p.liderazgo || "—"));
    lines.push("- Viajes: " + (p.viajes || "—"));
    lines.push("- Modalidad: " + (p.modalidad || "—"));
    lines.push("");
    lines.push("Rango de compensación:");
    lines.push(rangeText() + (form.comp.type ? " · " + form.comp.type : ""));
    lines.push("");
    lines.push("Urgencia: " + (form.urgency || "—"));
    lines.push("");
    lines.push("Mensaje adicional:");
    lines.push(form.message.trim() || "—");
    return lines.join("\n");
  }
  function sendWhatsApp() {
    const num = SETTINGS.whatsappNumber || "50765164741";
    window.open("https://wa.me/" + num + "?text=" + encodeURIComponent(buildMessage()), "_blank", "noopener");
  }
  function sendEmail() {
    const to = LINKS.emailAddress || "josueth.acevedo@gmail.com";
    const subject = F().emailSubject || "Oportunidad profesional para Josueth Acevedo";
    window.location.href = "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(buildMessage());
  }

  /* ---------- Validación ---------- */
  function validateStep() {
    if (form.step === 1) {
      const ok = !!form.opportunity;
      const err = document.getElementById("step1-err");
      if (err) err.style.display = ok ? "none" : "block";
      return ok;
    }
    if (form.step === 2) {
      let ok = true;
      F().steps.step2.fields.forEach(function (f) {
        const el = document.getElementById("c_" + f.id);
        if (!el) return;
        const wrap = el.closest(".field");
        let valid = true;
        if (f.required && !el.value.trim()) valid = false;
        if (f.type === "email" && el.value.trim() && !isValidEmail(el.value)) valid = false;
        if (f.type === "email" && f.required && !el.value.trim()) valid = false;
        wrap.classList.toggle("invalid", !valid);
        if (!valid) ok = false;
      });
      return ok;
    }
    return true;
  }

  /* ---------- Render del wizard ---------- */
  function renderWizard() {
    const body = document.getElementById("wiz-body");
    if (!body) return;
    const bar = document.getElementById("wiz-bar");
    const lbl = document.getElementById("wiz-step-label");
    const wrap = document.getElementById("wiz-bar-wrap");
    bar.style.width = (form.step / TOTAL_STEPS) * 100 + "%";
    wrap.setAttribute("aria-valuenow", form.step);
    lbl.textContent = ui("stepOf").replace("{a}", form.step).replace("{b}", TOTAL_STEPS);

    const last = form.step === TOTAL_STEPS;
    let nav = '<div class="wizard-nav">';
    nav += form.step > 1
      ? '<button type="button" class="btn btn-outline" id="wiz-back">← ' + esc(ui("back")) + "</button>"
      : "<span></span>";
    nav += '<div class="right">';
    if (last) {
      nav += '<button type="button" class="btn btn-outline" id="wiz-email">' + esc(ui("sendEmail")) + "</button>";
      nav += '<button type="button" class="btn btn-copper" id="wiz-wa">' + esc(ui("sendWhatsApp")) + "</button>";
    } else {
      nav += '<button type="button" class="btn btn-primary" id="wiz-next">' + esc(ui("next")) + " →</button>";
    }
    nav += "</div></div>";

    body.innerHTML = '<div class="wizard-step route-page">' + STEPS[form.step]() + "</div>" + nav;
    bindWizard(body);
  }

  function bindWizard(body) {
    /* data-bind genérico: inputs/textareas/selects → estado */
    body.querySelectorAll("[data-bind]").forEach(function (el) {
      el.addEventListener("input", function () {
        const key = el.getAttribute("data-bind");
        if (key.indexOf("c_") === 0) form.company[key.slice(2)] = el.value;
        else if (key.indexOf("p_") === 0) form.profile[key.slice(2)] = el.value;
        else form[key] = el.value;
        const sb = document.getElementById("summary-box");
        if (sb) sb.textContent = buildMessage();
      });
    });
    body.querySelectorAll('input[name="opportunity"]').forEach(function (r) {
      r.addEventListener("change", function () {
        form.opportunity = r.value;
        const err = document.getElementById("step1-err");
        if (err) err.style.display = "none";
      });
    });
    body.querySelectorAll('input[name="industry"]').forEach(function (cb) {
      cb.addEventListener("change", function () {
        const i = form.industries.indexOf(cb.value);
        if (cb.checked && i === -1) form.industries.push(cb.value);
        if (!cb.checked && i > -1) form.industries.splice(i, 1);
      });
    });
    body.querySelectorAll('input[name="urgency"]').forEach(function (r) {
      r.addEventListener("change", function () {
        form.urgency = r.value;
        const sb = document.getElementById("summary-box");
        if (sb) sb.textContent = buildMessage();
      });
    });
    /* responsabilidades dinámicas */
    body.querySelectorAll(".resp-input").forEach(function (ta) {
      ta.addEventListener("input", function () {
        form.responsibilities[Number(ta.getAttribute("data-resp"))] = ta.value;
      });
    });
    body.querySelectorAll(".resp-del").forEach(function (btn) {
      btn.addEventListener("click", function () {
        form.responsibilities.splice(Number(btn.getAttribute("data-del")), 1);
        renderWizard();
      });
    });
    const addResp = body.querySelector("#add-resp");
    if (addResp) addResp.addEventListener("click", function () {
      form.responsibilities.push("");
      renderWizard();
      const inputs = document.querySelectorAll(".resp-input");
      if (inputs.length) inputs[inputs.length - 1].focus();
    });
    /* slider doble */
    const rMin = body.querySelector("#range-min");
    const rMax = body.querySelector("#range-max");
    if (rMin && rMax) {
      const fill = body.querySelector("#track-fill");
      const out = body.querySelector("#range-out");
      const cfg = F().steps.step6;
      function paint() {
        const lo = ((form.comp.min - cfg.min) / (cfg.max - cfg.min)) * 100;
        const hi = ((form.comp.max - cfg.min) / (cfg.max - cfg.min)) * 100;
        fill.style.left = lo + "%";
        fill.style.right = (100 - hi) + "%";
        out.textContent = rangeText();
      }
      rMin.addEventListener("input", function () {
        form.comp.min = Math.min(Number(rMin.value), form.comp.max - cfg.step);
        rMin.value = form.comp.min;
        paint();
      });
      rMax.addEventListener("input", function () {
        form.comp.max = Math.max(Number(rMax.value), form.comp.min + cfg.step);
        rMax.value = form.comp.max;
        paint();
      });
      paint();
    }
    const curSel = body.querySelector("#f-currency");
    if (curSel) curSel.addEventListener("change", function () {
      form.comp.currency = curSel.value;
      renderWizard();
    });
    const typeSel = body.querySelector("#f-comptype");
    if (typeSel) typeSel.addEventListener("change", function () { form.comp.type = typeSel.value; });
    /* navegación */
    const next = body.querySelector("#wiz-next");
    if (next) next.addEventListener("click", function () {
      if (!validateStep()) return;
      form.step = Math.min(TOTAL_STEPS, form.step + 1);
      renderWizard();
      document.getElementById("wizard").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    const back = body.querySelector("#wiz-back");
    if (back) back.addEventListener("click", function () {
      form.step = Math.max(1, form.step - 1);
      renderWizard();
    });
    const wa = body.querySelector("#wiz-wa");
    if (wa) wa.addEventListener("click", sendWhatsApp);
    const em = body.querySelector("#wiz-email");
    if (em) em.addEventListener("click", sendEmail);
    const copyBtn = body.querySelector("#copy-summary");
    if (copyBtn) copyBtn.addEventListener("click", function () {
      const text = buildMessage();
      function done() {
        const fb = document.getElementById("copy-feedback");
        if (fb) { fb.classList.add("show"); setTimeout(function () { fb.classList.remove("show"); }, 1800); }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text); done(); });
      } else { fallbackCopy(text); done(); }
    });
    function fallbackCopy(text) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) { /* sin soporte */ }
      document.body.removeChild(ta);
    }
  }

  /* Preselección desde la URL: #/contacto?tipo=cartas|consultor|planilla|proyecto|alianza|otro */
  function preselect(tipo) {
    const map = { cartas: "cartas", consultor: "consultor", planilla: "planilla", proyecto: "proyecto", alianza: "alianza", otro: "otro" };
    if (map[tipo]) { form.opportunity = map[tipo]; form.step = 1; }
  }

  return { renderWizard, preselect, TOTAL_STEPS };
}
