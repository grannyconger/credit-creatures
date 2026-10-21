// Design Your Card (SPEC §7): pick an issuer, product, limit and look, and watch
// approval risk, APR, fee, income and score needs change live.
import { h, clear, money, percent } from "../dom.js";
import { fullName } from "../../data/creatures.js";
import { quoteApplication, applyForCard, monthlyIncome, buildReport, hardInquiriesInWindow } from "../../engine/index.js";
import { OFFERS, PRODUCTS, ISSUERS, NETWORKS, DESIGNS, TERMS_NOTE } from "../../data/products.js";
import { TRADEOFF_HELP } from "../../data/onboarding.js";
import { cardArt, brandStyle } from "../card-art.js";

const NICK_MAX = 16;
const RISK_CLASS = { Low: "good", Medium: "warn", High: "bad", "Very high": "bad" };

// Phase 10: opened from the Vault once credit cards unlock (route cardDesign).
export function render(root, { game, go, track }) {
  const life = game.life;
  const app = { issuer: "capitalOne", product: "secured", requestedLimit: 300, design: "plasticBlue", nickname: "", ...(game.ob.design || {}) };
  const changes = { issuer: 0, product: 0, limit: 0, design: 0, nickname: 0 };
  const started = Date.now();
  let prev = null;

  const issuerRow = h("div.tile-row.issuers");
  const productRow = h("div.tile-row.products");
  const sliderBox = h("div.slider-box");
  const designRow = h("div.chip-group");
  const nick = h("input", { type: "text", maxlength: NICK_MAX, value: app.nickname, id: "nickname", placeholder: "Optional" });
  const preview = h("div.preview-slot");
  const tradeoffs = h("dl.tradeoffs");
  const reasons = h("ul.reasons");
  const applyBtn = h("button.big", { type: "button" }, "Apply for this card");

  const report = buildReport(life);
  const inquiries = hardInquiriesInWindow(life);
  const you = h(
    "div.you-stats",
    youStat("Score", life.score ?? "None"),
    youStat("History", `${report.reportedMonths} mo`),
    youStat("Income", `${money(Math.round(monthlyIncome(life)))}/mo`),
    youStat("Checking", money(life.checking)),
    youStat("Hard inquiries", inquiries)
  );

  const offersFor = (issuer) => OFFERS.filter((o) => o.issuer === issuer && !o.legacy);

  function setIssuer(key) {
    if (app.issuer === key) return;
    app.issuer = key;
    changes.issuer++;
    if (!offersFor(key).some((o) => o.product === app.product)) {
      app.product = offersFor(key)[0].product;
      app.requestedLimit = PRODUCTS[app.product].minLimit;
    }
    paint();
  }

  function setProduct(key) {
    if (app.product === key) return;
    app.product = key;
    app.requestedLimit = PRODUCTS[key].minLimit;
    changes.product++;
    paint();
  }

  function paintChoices() {
    clear(issuerRow);
    for (const [key, iss] of Object.entries(ISSUERS).filter(([, i]) => !i.legacy)) {
      const names = offersFor(key).map((o) => PRODUCTS[o.product].label.replace(/ card$/, ""));
      issuerRow.append(
        h(
          "button.tile.wide",
          { type: "button", "aria-pressed": String(app.issuer === key), onclick: () => setIssuer(key) },
          h("span.tile-emoji", iss.icon),
          h("strong", iss.brand ? h("span.brand-pill", { style: brandStyle(iss.brand) }, iss.name) : iss.name),
          iss.local ? h("small", "Local credit union") : null,
          h("small", names.join(" · "))
        )
      );
    }

    clear(productRow);
    for (const o of offersFor(app.issuer)) {
      const p = PRODUCTS[o.product];
      const net = NETWORKS[o.network];
      productRow.append(
        h(
          "button.tile.wide",
          { type: "button", "aria-pressed": String(app.product === o.product), onclick: () => setProduct(o.product) },
          h("strong", `${o.icon || ""} ${o.name}`.trim()),
          h("small", p.blurb),
          h("small.muted", `Runs on ${net.icon} ${net.name}`)
        )
      );
    }

    const p = PRODUCTS[app.product];
    const step = p.maxLimit - p.minLimit >= 5000 ? 500 : p.secured ? 10 : 50;
    const value = h("output.slider-value", money(app.requestedLimit));
    const slider = h("input", { type: "range", min: p.minLimit, max: p.maxLimit, step, value: app.requestedLimit, id: "limit" });
    slider.addEventListener("input", () => {
      app.requestedLimit = Number(slider.value);
      value.textContent = money(app.requestedLimit);
      paintLive();
    });
    slider.addEventListener("change", () => changes.limit++);
    clear(sliderBox).append(
      h("label", { for: "limit" }, p.secured ? "Deposit (your deposit is your limit)" : "Credit limit you are asking for"),
      h("div.slider-row", h("span.muted", money(p.minLimit)), slider, h("span.muted", money(p.maxLimit))),
      value
    );
    if (p.secured) sliderBox.append(h("p.note.tight", "The deposit comes out of your checking account if you are approved."));

    clear(designRow);
    for (const [key, d] of Object.entries(DESIGNS)) {
      const extra = d.feeBump ? ` (+${money(d.feeBump)} fee)` : "";
      designRow.append(
        h(
          "button.chip.design-chip",
          {
            type: "button",
            "aria-pressed": String(app.design === key),
            onclick: () => {
              app.design = key;
              changes.design++;
              paint();
            },
          },
          h("span.design-dot", { class: `design-${key}` }),
          d.label + extra
        )
      );
    }
  }

  nick.addEventListener("input", () => {
    app.nickname = nick.value.trim();
    paintLive();
  });
  nick.addEventListener("change", () => changes.nickname++);

  function paintLive() {
    const q = quoteApplication(life, app);
    const offer = OFFERS.find((o) => o.issuer === app.issuer && o.product === app.product);
    clear(preview).append(
      cardArt({ issuer: app.issuer, network: offer.network, name: q.name, design: app.design, nickname: app.nickname, holder: fullName(game.save.creature) })
    );

    const rows = [
      ["risk", "Chance of denial", q.risk, null, RISK_CLASS[q.risk]],
      ["apr", "APR", percent(q.apr, 1), q.apr],
      ["annualFee", "Annual fee", money(q.annualFee), q.annualFee],
      ["requiredIncome", "Income needed", q.requiredIncome ? `${money(q.requiredIncome)}/mo` : "None", q.requiredIncome],
      ["requiredScore", "Score needed", q.requiredScore ?? "None", q.requiredScore ?? 0],
    ];
    const riskRank = { Low: 0, Medium: 1, High: 2, "Very high": 3 };
    clear(tradeoffs);
    for (const [key, label, text, num, cls] of rows) {
      let dir = "";
      if (prev) {
        const before = key === "risk" ? riskRank[prev.risk] : prev[key] ?? 0;
        const now = key === "risk" ? riskRank[q.risk] : num;
        if (now > before) dir = "up";
        else if (now < before) dir = "down";
      }
      tradeoffs.append(
        h(
          "div.tradeoff",
          { class: dir ? `changed ${dir}` : "" },
          h("dt", label, h("small", TRADEOFF_HELP[key])),
          h("dd", { class: cls || "" }, dir === "up" ? "▲ " : dir === "down" ? "▼ " : "", String(text))
        )
      );
    }
    tradeoffs.append(
      h("div.odds-bar", { title: "Chance of approval" }, h("span", { style: { width: `${Math.round(q.odds * 100)}%` }, class: RISK_CLASS[q.risk] }))
    );
    clear(reasons).append(...q.reasons.map((r) => h("li", r)));
    prev = q;
  }

  function paint() {
    paintChoices();
    paintLive();
  }

  applyBtn.addEventListener("click", async () => {
    applyBtn.disabled = true;
    const attempt = (game.ob.applications || 0) + 1;
    const r = applyForCard(game.life, { ...app });
    if (!r.ok) {
      applyBtn.disabled = false;
      reasons.prepend(h("li.error", r.reasons?.[0] || "That application did not work."));
      return;
    }
    game.life = r.life;
    game.ob.design = { ...app };
    game.ob.applications = attempt;
    game.ob.lastResult = {
      approved: r.approved,
      accountId: r.accountId,
      name: r.quote.name,
      issuer: r.quote.issuer,
      network: r.quote.network,
      design: app.design,
      nickname: app.nickname,
      secured: r.quote.secured,
      limit: r.quote.limit,
      apr: r.quote.apr,
      annualFee: r.quote.annualFee,
      odds: r.quote.odds,
      reasons: r.reasons,
    };
    if (r.approved) game.ob.cardId = r.accountId;
    track("cardApply", {
      attempt,
      issuer: app.issuer,
      product: app.product,
      limit: r.quote.limit,
      design: app.design,
      odds: r.quote.odds,
      approved: r.approved,
      issuerChanges: changes.issuer,
      productChanges: changes.product,
      limitChanges: changes.limit,
      designChanges: changes.design,
      seconds: Math.round((Date.now() - started) / 1000),
    });
    await game.persist("cardApply");
    go("cardResult");
  });

  root.append(
    h(
      "section.design",
      h(
        "div.design-left.panel",
        h("p.step-label", "The Gilded Vault: Design Your Card"),
        h("h1", "Design your first card"),
        h("p", "Pick a lender and a card. Watch how each choice changes your chances and your costs."),
        h("h3", "1. Issuer (the lender)"),
        issuerRow,
        h("h3", "2. Card"),
        productRow,
        h("h3", "3. Limit"),
        sliderBox,
        h("h3", "4. Look"),
        designRow,
        h("p.note.tight", "Fancy materials cost more each year, and the issuer wants a stronger application."),
        h("h3", h("label", { for: "nickname" }, "5. Card nickname")),
        nick
      ),
      h(
        "aside.design-right.panel",
        preview,
        h("h3", "You right now"),
        you,
        h("h3", "Live tradeoffs"),
        tradeoffs,
        h("h3", "What the issuer will look at"),
        reasons,
        h("div.row", applyBtn),
        h("p.note.tight", "Every application adds a hard inquiry to your report, approved or not."),
        h("p.note.tight", TERMS_NOTE)
      )
    )
  );
  paint();
}

function youStat(label, value) {
  return h("div", h("strong", String(value)), h("small", label));
}
