const FAMILY_COLOR = {
  Galectin: "#c2410c",
  ASGPR: "#b45309",
  "C-type mannose": "#0f766e",
  "C-type NK": "#0d9488",
  Selectin: "#7c3aed",
  Siglec: "#1d4ed8",
  "P-type": "#be123c",
  "L-type ER": "#0369a1",
  "Plant L-type": "#3f6212",
  "R-type": "#a16207",
  "I-type other": "#334155",
  "Microbial lectin": "#9f1239",
  "Outside library": "#78716c",
};

const FAMILY_LABEL = {
  Galectin: "Galectin 半乳糖凝集素",
  ASGPR: "C 型 Gal/GalNAc",
  "C-type mannose": "C 型甘露糖／內吞",
  "C-type NK": "C 型 NK 受體",
  Selectin: "Selectin 選凝素",
  Siglec: "I 型 Siglec",
  "P-type": "P 型 M6P",
  "L-type ER": "L 型內質網",
  "Plant L-type": "植物凝集素",
  "R-type": "R 型凝集素",
  "I-type other": "其他 I 型／IgSF",
  "Microbial lectin": "微生物凝集素",
  "Outside library": "特殊多醣／GAG",
};

const state = {
  atlas: null,
  gene: null,
  glycan: null,
  gbpQuery: "",
  glycanQuery: "",
  kingdom: "全部",
  family: "全部",
  glycanClass: "全部",
  viewer: null,
  viewerGene: null,
  protModel: null,
  ligModel: null,
  showLabels: true,
  showSurface: false,
  surfaceId: null,
  activeResid: null,
};

const gbpByGene = new Map();
const glycanById = new Map();

function asset(path) {
  return "../" + encodeURI(path);
}

function isHighlighted(gbp) {
  return (gbp.name_en && gbp.name_en.includes("[Highlighted]")) ||
    (gbp.lecture && gbp.lecture.includes("Highlighted")) ||
    (gbp.name_zh && gbp.name_zh.includes("螢光筆標示"));
}

function scoreOf(gbp, glycanId) {
  if (!gbp || !gbp.scores) return null;
  const index = state.atlas.glycans.findIndex((g) => g.id === glycanId);
  if (index < 0) return null;
  return gbp.scores[index];
}

function plddtColor(atom) {
  const value = atom.b;
  if (value >= 90) return "#0053d6";
  if (value >= 70) return "#65cbf3";
  if (value >= 50) return "#ffdb13";
  return "#ff7d45";
}

function writeHash() {
  const gene = state.gene || "";
  const glycan = state.glycan || "";
  history.replaceState(null, "", `#${encodeURIComponent(gene)}/${encodeURIComponent(glycan)}`);
}

function readHash() {
  const raw = decodeURIComponent(location.hash.replace(/^#/, ""));
  const [gene, glycan] = raw.split("/");
  return { gene: gene || null, glycan: glycan || null };
}

function filteredGlycans() {
  const q = state.glycanQuery.trim().toLowerCase();
  return state.atlas.glycans.filter((g) => {
    if (state.glycanClass !== "全部" && g.class !== state.glycanClass) return false;
    if (!q) return true;
    return `${g.id} ${g.name} ${g.class}`.toLowerCase().includes(q);
  });
}

function filteredGbps() {
  const q = state.gbpQuery.trim().toLowerCase();
  return state.atlas.gbps.filter((g) => {
    if (state.kingdom === "圖片清單 (C/S/I-Type)") {
      if (!g.lecture || !g.lecture.includes("Image")) return false;
    } else if (state.kingdom === "圖片黃色標示 ★") {
      if (!isHighlighted(g)) return false;
    } else if (state.kingdom !== "全部" && g.kingdom !== state.kingdom) {
      return false;
    }
    if (state.family !== "全部" && g.family !== state.family) return false;
    if (!q) return true;
    const hay = `${g.gene} ${g.name_en} ${g.name_zh} ${g.uniprot} ${g.organism} ${g.kingdom} ${g.panel || ""} ${g.aliases || ""} ${g.family} ${g.ligand}`.toLowerCase();
    return hay.includes(q);
  });
}

function renderSummaryBadges() {
  const host = document.getElementById("summary-badges");
  if (!host || !state.atlas) return;
  const m = state.atlas.meta;
  const kc = m.kingdom_counts || {};
  const nImg = state.atlas.gbps.filter((g) => g.lecture && g.lecture.includes("Image")).length;
  host.innerHTML = `
    <span>總收錄 GBP：<b>${m.n_gbp_total || state.atlas.gbps.length}</b></span>
    <span>動物凝集素：<b>${kc["動物"] || 0}</b></span>
    <span>植物凝集素：<b>${kc["植物"] || 0}</b></span>
    <span>微生物凝集素：<b>${kc["微生物"] || 0}</b></span>
    <span>附件圖片清單：<b>${nImg}</b></span>
    <span>AlphaFold 結構：<b>${m.n_gbp_structures}</b></span>
    <span>In-house Vina 對接複合物：<b>${m.n_gbp_docked || m.n_gbp_structures}</b></span>
    <span>資料庫聚糖結構：<b>${m.n_glycans}</b></span>
  `;
}

function renderGlycanList() {
  const host = document.getElementById("glycan-list");
  const rows = filteredGlycans();
  host.innerHTML = rows.map((g) => `
    <button type="button" data-id="${g.id}" class="${g.id === state.glycan ? "active" : ""}">
      <span>${g.id}<small>${g.class} · ${g.name}</small></span>
    </button>
  `).join("") || `<p class="tag" style="padding:8px">沒有符合的醣</p>`;
}

function renderGbpList() {
  const host = document.getElementById("gbp-list");
  const rows = filteredGbps();
  host.innerHTML = rows.map((g) => {
    const hl = isHighlighted(g);
    const dk = g.docking || {};
    const aff = dk.affinity_kcal != null ? `${dk.affinity_kcal.toFixed(1)} kcal/mol` : "";
    return `
      <button type="button" data-gene="${g.gene}" class="${g.gene === state.gene ? "active" : ""} ${hl ? "highlighted" : ""}">
        <span>
          <em class="badge-kingdom k-${g.kingdom}">${g.kingdom || "動物"}</em>
          <strong>${g.name_zh.replace("（螢光筆標示）", "")}</strong>
          ${hl ? `<em class="badge-highlight">★ 圖片標示</em>` : ""}
          <small>${g.gene} · ${g.aliases || g.name_en} · ${g.uniprot} · ${g.panel || FAMILY_LABEL[g.family] || g.family}</small>
        </span>
        <em class="tag">${aff}</em>
      </button>
    `;
  }).join("") || `<p class="tag" style="padding:8px">沒有符合的蛋白</p>`;
}

function renderDbTable() {
  const tbody = document.getElementById("db-tbody");
  if (!tbody) return;
  const rows = filteredGbps();
  tbody.innerHTML = rows.map((g) => {
    const hl = isHighlighted(g);
    const dk = g.docking || {};
    const contacts = dk.contacts || [];
    const topAAs = contacts.slice(0, 6).map((c) => `${c.resname}${c.resid}`).join(", ");
    const cleanName = g.name_zh.replace("（螢光筆標示）", "");
    return `
      <tr data-gene="${g.gene}" class="${g.gene === state.gene ? "active-row" : ""} ${hl ? "highlight-row" : ""}">
        <td><span class="badge-kingdom k-${g.kingdom}">${g.kingdom || "動物"}</span></td>
        <td>${g.panel || FAMILY_LABEL[g.family] || g.family}</td>
        <td><strong>${cleanName}</strong> (${g.name_en.replace(" [Highlighted]", "")})${hl ? ` <span class="badge-highlight">★</span>` : ""}</td>
        <td><code>${g.gene}</code> · <small>${g.aliases || "-"}</small></td>
        <td><a href="https://www.uniprot.org/uniprotkb/${g.uniprot}" target="_blank" rel="noopener">${g.uniprot}</a></td>
        <td><em>${g.organism}</em></td>
        <td>${dk.ligand_name || g.ligand}</td>
        <td><b>${dk.affinity_kcal != null ? dk.affinity_kcal.toFixed(1) + " kcal/mol" : "-"}</b></td>
        <td><code>${topAAs || "-"}</code></td>
      </tr>
    `;
  }).join("");
}

function renderChips() {
  const kingdoms = ["全部", "動物", "植物", "微生物", "圖片清單 (C/S/I-Type)", "圖片黃色標示 ★"];
  const kHost = document.getElementById("kingdom-chips");
  if (kHost) {
    kHost.innerHTML = kingdoms.map((name) =>
      `<button type="button" data-kingdom="${name}" class="${name === state.kingdom ? "active" : ""}">${name}</button>`
    ).join("");
  }

  const classes = ["全部", ...state.atlas.meta.classes];
  document.getElementById("glycan-chips").innerHTML = classes.map((name) =>
    `<button type="button" data-class="${name}" class="${name === state.glycanClass ? "active" : ""}">${name}</button>`
  ).join("");

  const families = ["全部", ...new Set(state.atlas.gbps.map((g) => g.family))];
  document.getElementById("family-chips").innerHTML = families.map((name) =>
    `<button type="button" data-family="${name}" class="${name === state.family ? "active" : ""}">${FAMILY_LABEL[name] || name}</button>`
  ).join("");

  document.getElementById("family-legend").innerHTML = families.filter((name) => name !== "全部").map((name) =>
    `<span><i style="background:${FAMILY_COLOR[name] || "#888"}"></i>${FAMILY_LABEL[name] || name}</span>`
  ).join("");
}

function composition(g) {
  const bits = [`HexNAc ${g.n}`, `Hex ${g.h}`, `Fuc ${g.f}`, `NeuAc ${g.s}`];
  if (g.p) bits.push(`Phospho ${g.p}`);
  if (g.fn) bits.push(`FNeuAc ${g.fn}`);
  if (g.o) bits.push("O-linked");
  if (g.lacnac) bits.push(`估計 LacNAc 臂 ${g.lacnac}`);
  return bits.map((bit) => `<span>${bit}</span>`).join("");
}

function renderGlycanCard() {
  const host = document.getElementById("glycan-card");
  const g = glycanById.get(state.glycan);
  if (!g) {
    host.innerHTML = "<p>請從上方選一個醣結構。</p>";
    return;
  }
  const gbp = gbpByGene.get(state.gene);
  const pair = scoreOf(gbp, g.id);
  const pairHtml = pair == null ? "" : `<span class="pair-score">與目前選取蛋白 (${gbp.name_zh}) 的模型分數：${pair.toFixed(2)}</span>`;
  const ranks = g.top_gbps.length
    ? g.top_gbps.map((row) => {
        const item = gbpByGene.get(row.gene);
        const kBadge = item ? `<em class="badge-kingdom k-${item.kingdom}">${item.kingdom}</em>` : "";
        return `<button type="button" data-gene="${row.gene}" class="${row.gene === state.gene ? "active" : ""}">
          <span>${kBadge}${item ? item.name_zh : row.name_zh}<small>${row.gene} · ${item ? item.panel || item.family : ""}</small></span><b>${row.score.toFixed(2)}</b>
        </button>`;
      }).join("")
    : "<p>此組成在模型裡沒有分數 ≥ 0.20 的 GBP。</p>";
  host.innerHTML = `
    <p class="kicker">資料庫聚糖結構 (Glycan Structure)</p>
    <div class="glycan-figure">
      <img src="${asset(g.image)}" alt="${g.name}">
      <div>
        <p class="meta-line"><strong>${g.id}</strong></p>
        <p class="meta-line">${g.name}</p>
        <p class="meta-line">類別：${g.class}</p>
        <div class="pills">${composition(g)}</div>
        ${pairHtml}
      </div>
    </div>
    <h3>偏好結合此醣結構的 GBP 排行</h3>
    <div class="rank">${ranks}</div>
  `;
}

function renderProteinMeta() {
  const host = document.getElementById("protein-meta");
  const dockHost = document.getElementById("docking-panel");
  const strip = document.getElementById("pref-strip");
  const g = gbpByGene.get(state.gene);
  if (!g) {
    host.innerHTML = "<p>請從左上方選一個 GBP。</p>";
    dockHost.innerHTML = "";
    strip.innerHTML = "";
    return;
  }
  const structure = g.structure || {};
  const dk = g.docking || {};
  const hl = isHighlighted(g);
  const quality = structure.mean_plddt != null
    ? `平均 pLDDT ${structure.mean_plddt} · ${structure.residues} 胺基酸殘基`
    : "沒有可用的座標檔";
  host.innerHTML = `
    <p class="kicker">
      <span class="badge-kingdom k-${g.kingdom}">${g.kingdom || "動物"}</span>
      ${g.panel || FAMILY_LABEL[g.family] || g.family} · ${g.lecture}
      ${hl ? `<span class="badge-highlight">★ 附件圖片螢光筆標示</span>` : ""}
    </p>
    <p class="meta-line"><strong>${g.name_zh}</strong> <span style="color:var(--muted);font-size:15px">(${g.name_en.replace(" [Highlighted]", "")})</span></p>
    <p class="meta-line"><b>基因／別名：</b><code>${g.gene}</code> · ${g.aliases || "-"} · <b>UniProt：</b><a href="https://www.uniprot.org/uniprotkb/${g.uniprot}" target="_blank" rel="noopener">${g.uniprot}</a> · <b>物種：</b><em>${g.organism}</em></p>
    <p class="meta-line"><b>結構品質：</b>${quality}</p>
    <p class="meta-line"><b>天然／代表配體：</b>${g.ligand} — ${g.rule}</p>
  `;

  if (dk && dk.contacts && dk.contacts.length) {
    const chipsHtml = dk.contacts.map((c) =>
      `<button type="button" class="aa-chip ${state.activeResid === c.resid ? "active" : ""}" data-resid="${c.resid}" title="點擊在 3D 視窗聚焦 ${c.resname}${c.resid} 與配體原子 ${c.ligand_atom}">
        ${c.resname}${c.resid} <small>(${c.protein_atom}↔${c.ligand_atom} ${c.distance.toFixed(1)}Å)</small>
      </button>`
    ).join("");

    const rowsHtml = dk.contacts.map((c) => `
      <tr data-resid="${c.resid}" class="${state.activeResid === c.resid ? "active-row" : ""}">
        <td><strong>${c.resname} ${c.resid}</strong> (Chain ${c.chain})</td>
        <td><code>${c.protein_atom}</code></td>
        <td><code style="color:#166534;font-weight:600">${c.ligand_atom}</code> (${c.ligand_elem})</td>
        <td><b>${c.distance.toFixed(2)} &Aring;</b></td>
        <td>${c.interaction}</td>
      </tr>
    `).join("");

    dockHost.innerHTML = `
      <div class="docking-box">
        <div class="docking-header">
          <div>
            <h3>In-House 分子對接結合位點分析 (Binding Site AA &amp; Ligand Atom Contacts)</h3>
            <small style="color:var(--muted)">點擊任一胺基酸標籤或表格列，3D 視窗將自動放大對焦該殘基與配體原子之氫鍵／接觸。</small>
          </div>
          <div class="docking-metrics">
            <span>對接引擎：<b>${dk.engine || "AutoDock Vina"}</b></span>
            <span>對接配體：<b>${dk.ligand_name}</b> (${dk.n_ligand_atoms} 重原子)</span>
            <span>對接親和力：<b>${dk.affinity_kcal} kcal/mol</b></span>
            <span>結合口袋中心：<code>(${dk.pocket_center.join(", ")})</code></span>
          </div>
        </div>
        <div class="aa-chips">${chipsHtml}</div>
        <div class="contact-table-wrap">
          <table class="contact-table">
            <thead>
              <tr>
                <th>結合位置胺基酸 (Binding Site AA)</th>
                <th>蛋白質原子 (Protein Atom)</th>
                <th>配體原子 (Ligand Atom)</th>
                <th>原子距離</th>
                <th>預估交互作用類型</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      </div>
    `;
  } else {
    dockHost.innerHTML = "";
  }

  if (!g.top_glycans || !g.top_glycans.length) {
    strip.innerHTML = "<p style='margin-top:10px;color:var(--muted)'>此蛋白的特異性配體（如 β-1,3-葡聚醣、肽聚醣或硫酸化 GAG）不在 N／O-glycan 組成表內，上方已直接提供該配體之 3D 分子對接複合物與結合位點殘基。</p>";
    return;
  }
  strip.innerHTML = `<h3>資料庫中偏好分數最高的聚糖結構</h3><div class="strip">${g.top_glycans.map((row) => {
    const glycan = glycanById.get(row.id);
    return `<button type="button" class="thumb ${row.id === state.glycan ? "active" : ""}" data-id="${row.id}">
      <img src="${asset(glycan.image)}" alt="${row.id}">
      <b>${row.id}</b>
      <small>${row.score.toFixed(2)} · ${glycan.class}</small>
    </button>`;
  }).join("")}</div>`;
}

function renderDockingScene(focusMode = "site") {
  const viewer = state.viewer;
  const g = gbpByGene.get(state.gene);
  if (!viewer || !g) return;
  const dk = g.docking || {};
  const bindRes = dk.binding_residues || [];

  viewer.removeAllLabels();
  viewer.removeAllShapes();
  if (state.surfaceId != null) {
    try { viewer.removeSurface(state.surfaceId); } catch (e) {}
    state.surfaceId = null;
  }

  // 1. Style full protein cartoon by pLDDT
  if (state.protModel) {
    state.protModel.setStyle({}, { cartoon: { colorfunc: plddtColor, opacity: 0.86 } });
    // Highlight binding site amino acids in rose/crimson sticks
    if (bindRes.length) {
      state.protModel.setStyle(
        { resi: bindRes },
        {
          cartoon: { colorfunc: plddtColor, opacity: 0.9 },
          stick: { radius: 0.22, colorscheme: "roseCarbon" },
        }
      );
    }
    if (state.activeResid != null) {
      state.protModel.setStyle(
        { resi: [state.activeResid] },
        {
          cartoon: { color: "#e11d48" },
          stick: { radius: 0.32, colorscheme: "yellowCarbon" },
        }
      );
    }
  }

  // 2. Style docked glycan ligand atoms
  if (state.ligModel) {
    state.ligModel.setStyle(
      {},
      {
        stick: { radius: 0.26, colorscheme: "greenCarbon" },
        sphere: { scale: 0.32, colorscheme: "greenCarbon" },
      }
    );
  }

  // 3. Draw dashed contact cylinders & labels for binding site AAs and ligand atoms
  if (dk.contacts && state.protModel && state.ligModel) {
    const protAtoms = state.protModel.selectedAtoms({ resi: bindRes });
    const ligAtoms = state.ligModel.selectedAtoms({});

    dk.contacts.forEach((c) => {
      const pMatch = protAtoms.find((a) => a.resi === c.resid && a.atom === c.protein_atom) ||
                     protAtoms.find((a) => a.resi === c.resid && a.atom === "CA");
      const lMatch = ligAtoms.find((a) => a.atom === c.ligand_atom);

      if (pMatch && lMatch) {
        viewer.addCylinder({
          start: { x: pMatch.x, y: pMatch.y, z: pMatch.z },
          end: { x: lMatch.x, y: lMatch.y, z: lMatch.z },
          radius: state.activeResid === c.resid ? 0.11 : 0.06,
          color: state.activeResid === c.resid ? "#dc2626" : "#f59e0b",
          dashed: true,
          fromCap: 1,
          toCap: 1,
        });
      }

      if (state.showLabels && pMatch) {
        const isFocus = state.activeResid === c.resid;
        viewer.addLabel(`${c.resname}${c.resid} (${c.protein_atom})`, {
          position: { x: pMatch.x, y: pMatch.y, z: pMatch.z },
          backgroundColor: isFocus ? "#be123c" : "#881337",
          fontColor: "#ffffff",
          fontSize: isFocus ? 12.5 : 10.5,
          backgroundOpacity: 0.88,
          borderRadius: 4,
          padding: 2,
        });
      }
    });

    if (state.showLabels) {
      // Label unique interacting ligand atoms
      const seenLig = new Set();
      dk.contacts.slice(0, 6).forEach((c) => {
        if (seenLig.has(c.ligand_atom)) return;
        seenLig.add(c.ligand_atom);
        const lMatch = ligAtoms.find((a) => a.atom === c.ligand_atom);
        if (lMatch) {
          viewer.addLabel(`Lig:${c.ligand_atom}`, {
            position: { x: lMatch.x, y: lMatch.y, z: lMatch.z },
            backgroundColor: "#14532d",
            fontColor: "#dcfce7",
            fontSize: 10,
            backgroundOpacity: 0.85,
            borderRadius: 4,
            padding: 2,
          });
        }
      });
    }
  }

  // 4. Optional translucent pocket surface
  if (state.showSurface && state.protModel && bindRes.length) {
    try {
      state.surfaceId = viewer.addSurface(
        $3Dmol.SurfaceType.VDW,
        { opacity: 0.38, color: "#fda4af" },
        { model: state.protModel, resi: bindRes }
      );
    } catch (e) {}
  }

  viewer.resize();
  if (focusMode === "resid" && state.activeResid != null && state.protModel) {
    viewer.zoomTo({ model: state.protModel, resi: [state.activeResid] }, 450);
  } else if (focusMode === "site" && bindRes.length && state.protModel) {
    viewer.zoomTo({ model: state.protModel, resi: bindRes }, 450);
  } else if (focusMode === "full") {
    viewer.zoomTo({}, 450);
  }
  viewer.render();
}

function showStructure() {
  const g = gbpByGene.get(state.gene);
  const box = document.getElementById("viewer");
  if (!g || !g.structure || !g.structure.pdb) {
    box.innerHTML = "<p style='padding:16px'>這個條目沒有 AlphaFold 座標。</p>";
    state.viewer = null;
    state.viewerGene = null;
    return;
  }
  if (state.viewerGene === g.gene && state.viewer) return;
  box.innerHTML = "";
  const viewer = $3Dmol.createViewer(box, { backgroundColor: "#ffffff" });
  state.viewer = viewer;
  state.viewerGene = g.gene;
  state.protModel = null;
  state.ligModel = null;
  state.activeResid = null;

  const status = document.getElementById("viewer-status");
  status.textContent = "載入蛋白質與對接配體結構…";

  const protUrl = asset(g.structure.pdb);
  const ligUrl = g.docking && g.docking.ligand_pdb ? asset(g.docking.ligand_pdb) : null;

  const pProt = fetch(protUrl)
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.text();
    })
    .catch(() => {
      if (g.uniprot) {
        return fetch(`https://alphafold.ebi.ac.uk/files/AF-${g.uniprot}-F1-model_v6.pdb`)
          .then((r) => {
            if (!r.ok) throw new Error(String(r.status));
            return r.text();
          });
      }
      throw new Error("missing");
    });

  const pLig = g.docking && g.docking.ligand_pdb_text
    ? Promise.resolve(g.docking.ligand_pdb_text)
    : ligUrl
    ? fetch(ligUrl).then((r) => (r.ok ? r.text() : null)).catch(() => null)
    : Promise.resolve(null);

  Promise.all([pProt, pLig])
    .then(([protText, ligText]) => {
      const format = g.structure.pdb.endsWith(".cif") ? "cif" : "pdb";
      state.protModel = viewer.addModel(protText, format);
      if (ligText) {
        state.ligModel = viewer.addModel(ligText, "pdb");
      }
      renderDockingScene("full");
      status.textContent = ligText
        ? `已載入全蛋白與對接配體 (${g.docking.ligand_name})`
        : "已載入蛋白質結構";
    })
    .catch(() => {
      box.innerHTML = "<p style='padding:16px'>結構檔載入失敗。</p>";
      status.textContent = "結構檔載入失敗";
      state.viewer = null;
      state.viewerGene = null;
    });
}

function drawPca() {
  const groups = new Map();
  state.atlas.gbps.filter((g) => g.pca).forEach((g) => {
    if (!groups.has(g.family)) groups.set(g.family, []);
    groups.get(g.family).push(g);
  });
  const traces = [...groups.entries()].map(([family, rows]) => ({
    type: "scatter",
    mode: "markers",
    name: FAMILY_LABEL[family] || family,
    x: rows.map((g) => g.pca[0]),
    y: rows.map((g) => g.pca[1]),
    customdata: rows.map((g) => g.gene),
    text: rows.map((g) => `[${g.kingdom || "動物"}] ${g.name_zh}<br>${g.gene} (${g.organism})`),
    hovertemplate: "%{text}<br>PC1 %{x:.2f}<br>PC2 %{y:.2f}<extra></extra>",
    marker: {
      size: rows.map((g) => (g.gene === state.gene ? 16 : 10)),
      color: FAMILY_COLOR[family] || "#888",
      line: { width: rows.map((g) => (g.gene === state.gene ? 2.5 : 0)), color: "#1c2430" },
    },
  }));
  const explained = state.atlas.meta.pca_explained;
  Plotly.react("pca-plot", traces, {
    margin: { l: 56, r: 16, t: 10, b: 48 },
    height: 480,
    paper_bgcolor: "#faf7f1",
    plot_bgcolor: "#fff",
    xaxis: { title: `PC1（${(explained[0] * 100).toFixed(1)}%）`, zeroline: false },
    yaxis: { title: `PC2（${(explained[1] * 100).toFixed(1)}%）`, zeroline: false },
    showlegend: false,
  }, { responsive: true, displaylogo: false });
  const plot = document.getElementById("pca-plot");
  if (plot.removeAllListeners) plot.removeAllListeners("plotly_click");
  plot.on("plotly_click", (event) => {
    selectGene(event.points[0].customdata);
  });
}

function drawClassHeat() {
  const genes = state.atlas.matrix_genes;
  const order = state.atlas.row_order;
  const classes = state.atlas.meta.classes;
  const z = order.map((row) => state.atlas.class_matrix[row]);
  const y = order.map((row) => genes[row]);
  Plotly.react("class-plot", [{
    type: "heatmap",
    z,
    x: classes,
    y,
    colorscale: "YlOrRd",
    zmin: 0,
    zmax: 1,
    hovertemplate: "%{y}<br>%{x}<br>平均分數 %{z:.2f}<extra></extra>",
    colorbar: { title: "分數", thickness: 12 },
  }], {
    margin: { l: 110, r: 20, t: 90, b: 24 },
    height: Math.max(580, y.length * 14 + 180),
    paper_bgcolor: "#faf7f1",
    xaxis: { side: "top", tickangle: -35, automargin: true },
    yaxis: { automargin: true, autorange: "reversed", tickfont: { size: 10 } },
  }, { responsive: true, displaylogo: false });
  document.getElementById("class-plot").on("plotly_click", (event) => {
    selectGene(event.points[0].y);
  });
}

function drawClassBar() {
  const g = gbpByGene.get(state.gene);
  const host = document.getElementById("class-bar");
  if (!g || !g.class_means) {
    Plotly.purge(host);
    host.innerHTML = "";
    return;
  }
  Plotly.react(host, [{
    type: "bar",
    x: state.atlas.meta.classes,
    y: g.class_means,
    marker: { color: "#1f6a64" },
    hovertemplate: "%{x}<br>平均 %{y:.2f}<extra></extra>",
  }], {
    margin: { l: 48, r: 10, t: 36, b: 100 },
    height: 280,
    title: { text: `${g.name_zh} 的各類別平均分數`, font: { size: 14 } },
    paper_bgcolor: "#faf7f1",
    plot_bgcolor: "#fff",
    yaxis: { range: [0, 1], title: "平均分數" },
    xaxis: { tickangle: -30 },
  }, { responsive: true, displaylogo: false });
}

function drawFullHeat() {
  const genes = state.atlas.matrix_genes;
  const ids = state.atlas.matrix_glycan_ids;
  const z = state.atlas.row_order.map((row) => state.atlas.col_order.map((col) => state.atlas.matrix[row][col]));
  const y = state.atlas.row_order.map((row) => genes[row]);
  const x = state.atlas.col_order.map((col) => ids[col]);
  Plotly.react("full-plot", [{
    type: "heatmap",
    z,
    x,
    y,
    colorscale: "YlOrRd",
    zmin: 0,
    zmax: 1,
    hovertemplate: "%{y} × %{x}<br>分數 %{z:.2f}<extra></extra>",
    colorbar: { title: "分數", thickness: 12 },
  }], {
    margin: { l: 110, r: 20, t: 10, b: 120 },
    height: Math.max(780, y.length * 14 + 180),
    paper_bgcolor: "#faf7f1",
    xaxis: { tickfont: { size: 8 }, tickangle: -90, automargin: true },
    yaxis: { automargin: true, autorange: "reversed", tickfont: { size: 10 } },
  }, { responsive: true, displaylogo: false });
  document.getElementById("full-plot").on("plotly_click", (event) => {
    selectGene(event.points[0].y);
    selectGlycan(event.points[0].x);
  });
}

function renderLoadings() {
  const block = (title, rows) => `
    <div><b>${title}</b><br>${rows.map((row) => `${row.id} (${row.loading > 0 ? "+" : ""}${row.loading.toFixed(2)})`).join(" · ")}</div>`;
  document.getElementById("loadings").innerHTML =
    block("PC1 負荷較大的醣", state.atlas.loadings.pc1) +
    block("PC2 負荷較大的醣", state.atlas.loadings.pc2);
}

function selectGene(gene, options = {}) {
  if (!gbpByGene.has(gene)) return;
  state.gene = gene;
  state.activeResid = null;
  writeHash();
  renderGbpList();
  renderDbTable();
  renderGlycanCard();
  renderProteinMeta();
  showStructure();
  drawClassBar();
  if (!options.silentCharts) drawPca();
  const button = document.querySelector(`#gbp-list button[data-gene="${CSS.escape(gene)}"]`);
  if (button) button.scrollIntoView({ block: "nearest" });
}

function selectGlycan(id) {
  if (!glycanById.has(id)) return;
  state.glycan = id;
  writeHash();
  renderGlycanList();
  renderGlycanCard();
  renderProteinMeta();
  const button = document.querySelector(`#glycan-list button[data-id="${CSS.escape(id)}"]`);
  if (button) button.scrollIntoView({ block: "nearest" });
}

function focusResidue(resid) {
  state.activeResid = Number(resid);
  renderProteinMeta();
  renderDockingScene("resid");
}

function bind() {
  document.getElementById("glycan-q").addEventListener("input", (event) => {
    state.glycanQuery = event.target.value;
    renderGlycanList();
  });
  document.getElementById("gbp-q").addEventListener("input", (event) => {
    state.gbpQuery = event.target.value;
    renderGbpList();
    renderDbTable();
  });
  const kChips = document.getElementById("kingdom-chips");
  if (kChips) {
    kChips.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      state.kingdom = button.dataset.kingdom;
      renderChips();
      renderGbpList();
      renderDbTable();
    });
  }
  document.getElementById("glycan-chips").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    state.glycanClass = button.dataset.class;
    renderChips();
    renderGlycanList();
  });
  document.getElementById("family-chips").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    state.family = button.dataset.family;
    renderChips();
    renderGbpList();
    renderDbTable();
  });
  document.getElementById("glycan-list").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (button) selectGlycan(button.dataset.id);
  });
  document.getElementById("gbp-list").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (button) selectGene(button.dataset.gene);
  });
  const dbTbody = document.getElementById("db-tbody");
  if (dbTbody) {
    dbTbody.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      const tr = event.target.closest("tr[data-gene]");
      if (!tr) return;
      selectGene(tr.dataset.gene);
      document.getElementById("stage").scrollIntoView({ behavior: "smooth" });
    });
  }
  document.getElementById("docking-panel").addEventListener("click", (event) => {
    const target = event.target.closest("[data-resid]");
    if (!target) return;
    focusResidue(target.dataset.resid);
  });
  document.getElementById("glycan-card").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (button) selectGene(button.dataset.gene);
  });
  document.getElementById("pref-strip").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (button) selectGlycan(button.dataset.id);
  });
  document.querySelector(".jump").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    document.getElementById(button.dataset.jump).scrollIntoView({ behavior: "smooth" });
  });
  document.getElementById("viewer-focus-site").addEventListener("click", () => {
    state.activeResid = null;
    renderProteinMeta();
    renderDockingScene("site");
  });
  document.getElementById("viewer-reset").addEventListener("click", () => {
    state.activeResid = null;
    renderProteinMeta();
    renderDockingScene("full");
  });
  document.getElementById("viewer-toggle-labels").addEventListener("click", () => {
    state.showLabels = !state.showLabels;
    renderDockingScene("none");
  });
  document.getElementById("viewer-toggle-surface").addEventListener("click", () => {
    state.showSurface = !state.showSurface;
    renderDockingScene("none");
  });
}

function boot(atlas) {
  state.atlas = atlas;
  atlas.gbps.forEach((g) => gbpByGene.set(g.gene, g));
  atlas.glycans.forEach((g) => glycanById.set(g.id, g));
  const fromHash = readHash();
  state.gene = gbpByGene.has(fromHash.gene) ? fromHash.gene : "LGALS1";
  state.glycan = glycanById.has(fromHash.glycan) ? fromHash.glycan : (gbpByGene.get(state.gene).top_glycans[0] || {}).id || atlas.glycans[0].id;
  document.getElementById("lede").textContent =
    `${atlas.meta.score_note} ${atlas.meta.summary}`;
  document.getElementById("pca-note").textContent = atlas.meta.summary;
  renderSummaryBadges();
  renderChips();
  renderGlycanList();
  renderGbpList();
  renderDbTable();
  renderGlycanCard();
  renderProteinMeta();
  renderLoadings();
  drawPca();
  drawClassHeat();
  drawClassBar();
  drawFullHeat();
  showStructure();
  bind();
}

fetch("data/atlas.json")
  .then((response) => {
    if (!response.ok) throw new Error(String(response.status));
    return response.json();
  })
  .then(boot)
  .catch(() => {
    document.getElementById("lede").textContent =
      "讀不到 site/data/atlas.json。請在專案根目錄執行 python -m http.server 8876，再開 http://127.0.0.1:8876/site/ 。直接用檔案開啟時，請開啟根目錄的單一整合檔 index.html。";
  });
