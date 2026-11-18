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

const FAMILY_I18N = {
  全部: { zh: "全部家族", en: "All Families", bi: "全部家族 All Families" },
  Galectin: { zh: "Galectin 半乳糖凝集素", en: "Galectins (S-Type)", bi: "Galectin 半乳糖凝集素" },
  ASGPR: { zh: "C 型 Gal/GalNAc", en: "C-Type Gal/GalNAc", bi: "C 型 Gal/GalNAc (ASGPR/MGL)" },
  "C-type mannose": { zh: "C 型甘露糖／內吞", en: "C-Type Mannose / Endocytic", bi: "C 型甘露糖／內吞 C-Type Mannose" },
  "C-type NK": { zh: "C 型 NK 受體", en: "C-Type NK Receptors", bi: "C 型 NK 受體 C-Type NK" },
  Selectin: { zh: "Selectin 選凝素", en: "Selectins", bi: "Selectin 選凝素" },
  Siglec: { zh: "I 型 Siglec", en: "Siglecs (I-Type)", bi: "I 型 Siglec" },
  "P-type": { zh: "P 型 M6P", en: "P-Type (M6P Receptors)", bi: "P 型 M6P 受體" },
  "L-type ER": { zh: "L 型內質網", en: "L-Type ER Quality Control", bi: "L 型內質網 L-Type ER" },
  "Plant L-type": { zh: "植物凝集素", en: "Plant Lectins", bi: "植物凝集素 Plant Lectins" },
  "R-type": { zh: "R 型凝集素", en: "R-Type Lectins", bi: "R 型凝集素 R-Type" },
  "I-type other": { zh: "其他 I 型／IgSF", en: "Other I-Type / IgSF", bi: "其他 I 型／IgSF Other I-Type" },
  "Microbial lectin": { zh: "微生物凝集素", en: "Microbial Lectins", bi: "微生物凝集素 Microbial" },
  "Outside library": { zh: "特殊多醣／GAG", en: "Special Glycans / GAGs", bi: "特殊多醣／GAG Special Glycans" },
};

const KINGDOM_I18N = {
  全部: { zh: "全部物種界別", en: "All Kingdoms", bi: "全部 All" },
  動物: { zh: "動物凝集素", en: "Animal", bi: "動物 Animal" },
  植物: { zh: "植物凝集素", en: "Plant", bi: "植物 Plant" },
  微生物: { zh: "微生物凝集素", en: "Microbial", bi: "微生物 Microbial" },
  "圖片清單 (C/S/I-Type)": { zh: "附件圖片清單 (C/S/I-Type)", en: "Attached Image Panel (C/S/I-Type)", bi: "圖片清單 Image Panel" },
  "圖片黃色標示 ★": { zh: "圖片黃色標示 ★", en: "Highlighted in Image ★", bi: "圖片標示 ★ Highlighted" },
};

const CLASS_I18N = {
  全部: { zh: "全部類別", en: "All Classes", bi: "全部 All" },
  高甘露糖: { zh: "高甘露糖", en: "High-Mannose", bi: "高甘露糖 High-Mannose" },
  少甘露糖: { zh: "少甘露糖", en: "Paucimannose", bi: "少甘露糖 Paucimannose" },
  混合型: { zh: "混合型", en: "Hybrid", bi: "混合型 Hybrid" },
  去唾液酸複雜型: { zh: "去唾液酸複雜型", en: "Asialo Complex", bi: "去唾液酸複雜型 Asialo Complex" },
  唾液酸化複雜型: { zh: "唾液酸化複雜型", en: "Sialylated Complex", bi: "唾液酸化複雜型 Sialylated Complex" },
  唾液酸路易斯樣: { zh: "唾液酸路易斯樣", en: "Sialyl-Lewis-like", bi: "唾液酸路易斯樣 SLeX-like" },
  小型唾液酸化: { zh: "小型唾液酸化", en: "Small Sialylated", bi: "小型唾液酸化 Small Sialylated" },
  "O-glycan": { zh: "O-glycan", en: "O-Glycan", bi: "O-glycan" },
  M6P: { zh: "M6P", en: "M6P (Phosphorylated)", bi: "M6P" },
  其他: { zh: "其他", en: "Other", bi: "其他 Other" },
};

const INTERACTION_I18N = {
  "氫鍵／鹽橋 (H-bond / Electrostatic)": {
    zh: "氫鍵／鹽橋",
    en: "H-bond / Electrostatic",
    bi: "氫鍵／鹽橋 (H-bond / Electrostatic)",
  },
  "氫鍵／極性配位 (H-bond / Polar)": {
    zh: "氫鍵／極性配位",
    en: "H-bond / Polar Coordination",
    bi: "氫鍵／極性配位 (H-bond / Polar)",
  },
  "CH–π 疏水堆疊 (CH–π Stacking)": {
    zh: "CH–π 疏水堆疊",
    en: "CH–π Aromatic Stacking",
    bi: "CH–π 疏水堆疊 (CH–π Stacking)",
  },
  "極性接觸 (Polar Contact)": {
    zh: "極性接觸",
    en: "Polar Contact",
    bi: "極性接觸 (Polar Contact)",
  },
  "范德華接觸 (van der Waals)": {
    zh: "范德華接觸",
    en: "van der Waals Contact",
    bi: "范德華接觸 (van der Waals)",
  },
};

const PROTEIN_EN_DESC = {
  Galectin: {
    ligand: "β-galactosides, LacNAc / poly-LacNAc on N- and O-glycans",
    rule: "Recognizes terminal or internal β-galactoside / LacNAc repeats; α2-6 sialylation typically masks binding.",
  },
  ASGPR: {
    ligand: "Terminal Gal / GalNAc (Tn antigen and desialylated complex glycans)",
    rule: "Ca2+-dependent C-type CRD specific for exposed Gal or GalNAc; terminal sialic acid abolishes binding.",
  },
  "C-type mannose": {
    ligand: "High-mannose N-glycans (Man5–Man9), fucosylated Lewis epitopes, or exposed GlcNAc",
    rule: "Ca2+-dependent C-type lectin receptor coordinating equatorial 3- and 4-OH groups of mannose, fucose, or GlcNAc.",
  },
  "C-type NK": {
    ligand: "Cell-surface glycoprotein glycans, high-mannose / LacNAc / GlcNAc motifs & immune ligands",
    rule: "NK gene complex C-type lectin-like domain (CTLD) recognizing glycosylated surface receptors or DAMPs/PAMPs.",
  },
  Selectin: {
    ligand: "Sialyl-Lewis X (SLeX) and 6-sulfo-SLeX on leukocyte mucins",
    rule: "Requires both α2-3 sialic acid and α1-3 fucose on a LacNAc core (SLeX motif) with Ca2+ coordination.",
  },
  Siglec: {
    ligand: "α2-3, α2-6, or α2-8 linked sialic acids (Neu5Ac) on N- and O-glycans",
    rule: "V-set Ig domain forms an essential salt bridge between a conserved Arg residue and the carboxylate of sialic acid.",
  },
  "P-type": {
    ligand: "Mannose-6-phosphate (M6P) on lysosomal enzymes",
    rule: "Specifically recognizes phosphorylated oligomannose N-glycans (N2H6P1) for lysosomal targeting.",
  },
  "L-type ER": {
    ligand: "Monoglucosylated high-mannose (Glc1Man9GlcNAc2) or Man8–Man9 N-glycans",
    rule: "ER / ERGIC quality-control chaperone lectin binding high-mannose cores during glycoprotein folding and sorting.",
  },
  "Plant L-type": {
    ligand: "Plant lectin specificity: High-mannose (ConA/ASA/GNA/BanLec), T-antigen (PNA/Jacalin), GalNAc (SBA), GlcNAc (WGA), Fuc (UEA-I), or Complex N-glycans (PHA-E/L, MAA)",
    rule: "Classical plant lectin fold with conserved metal/H-bond pocket selective for distinct monosaccharide or branching motifs.",
  },
  "R-type": {
    ligand: "β-trefoil R-type lectin ligand: Gal / GalNAc (Ricin, CEL-III, ppGalNAcT2) or α2-6 Sia (SNA-I)",
    rule: "β-trefoil Q-x-W motif subdomain recognizing terminal galactose, GalNAc, or α2-6-sialylated LacNAc.",
  },
  "I-type other": {
    ligand: "Ig-superfamily glycan ligands: oligomannose (NCAM/CD147), α2-6 Sia (PECAM-1), or sialylated O-glycans / HS (PILR-α, NKp30, NKp44)",
    rule: "Non-Siglec IgSF receptor mediating cell adhesion or innate recognition via sialylated, oligomannose, or GAG chains.",
  },
  "Microbial lectin": {
    ligand: "Host cell-surface glycans: D-Gal (LecA, StxB), L-Fuc (LecB, AAL), Man (FimH), GalNAc (CNL), or GM1 Sia-Gal (CTxB)",
    rule: "Bacterial, fungal, or toxin adhesin CRD mediating high-avidity attachment to host mucosal or epithelial glycans.",
  },
  "Outside library": {
    ligand: "Specialized microbial polysaccharides (β-1,3-glucan, peptidoglycan, galactofuranose) or sulfated GAGs (heparin / HS / CS)",
    rule: "Ligand is outside the standard N/O-glycan composition matrix; 3D binding pose and pocket contacts are shown via AutoDock Vina docking.",
  },
};

const UI_TEXT = {
  zh: {
    kicker: "動物 · 植物 · 微生物醣結合蛋白 · AlphaFold DB · In-House AutoDock Vina",
    title: "GBP–醣結合蛋白資料庫與分子對接圖譜",
    lede: (m) =>
      `收錄植物、動物與微生物三大界共 ${m.n_gbp_total} 個醣結合蛋白（含附件圖片完整 C-Type / S-Type / I-Type Lectin 清單）。每個蛋白質皆以 AlphaFold 結構與對應代表醣配體進行 In-house AutoDock Vina 分子對接，標出結合位置胺基酸（Binding Site AA）與配體原子（Ligand Atom）之三維空間交互作用。`,
    nav: ["蛋白與醣選單", "3D 結構與結合位點", "完整 GBP 資料庫總表", "PCA 特異性分群", "類別熱圖", "全醣熱圖"],
    pickGbpTitle: "1. 選取醣結合蛋白 (GBP／Lectin)",
    pickGbpDesc: "涵蓋動物（含附件 C/S/I-Type 清單）、植物與微生物凝集素。點選即可預覽 3D 結構與對接結合位點。",
    gbpPlaceholder: "搜尋蛋白、基因、別名 (如 CLEC9A、NKp44、Siglec-7、ConA、DC-SIGN)…",
    pickGlycanTitle: "2. 從醣結構找凝集素",
    pickGlycanDesc: "選一個聚糖組成，列出偏好結合它的植物、動物與微生物 GBP。",
    glycanPlaceholder: "搜尋 N4H5、HexNAc、唾液酸、高甘露糖…",
    btnFocus: "聚焦結合位點",
    btnReset: "全蛋白質結構預覽",
    btnLabels: "顯示/隱藏殘基與原子標籤",
    btnSurface: "口袋表面 (Surface)",
    legPlddt: "蛋白 pLDDT：",
    legDock: "對接圖層：",
    legAA: "結合位點胺基酸 (Binding Site AA)",
    legLig: "對接醣配體原子 (Ligand Atom)",
    legCnt: "交互作用接觸 (≤4.5 Å)",
    dbTitle: "完整醣結合蛋白資料庫總表（植物 · 動物 · 微生物 · 附件圖片清單）",
    dbDesc: "點擊任一列即可在上方 3D 視窗載入該蛋白質結構、對接醣配體與結合位點胺基酸（黃底星號 ★ 為附件圖片螢光筆標示項目）。",
    dbHeaders: ["物種界別", "分類面板 (Panel)", "蛋白質名稱", "基因／別名 (Other Names)", "UniProt", "物種", "對接代表醣配體", "Vina 親和力", "關鍵結合位點胺基酸 (Binding Site AAs)"],
    pcaTitle: "PCA 特異性圖譜",
    pcaNote: (m) => m.summary,
    heatClassTitle: "依醣類別的 Heatmap",
    heatClassDesc: "每一格是該 GBP 在此聚糖類別裡的平均模型分數。點一格會選定那一列的蛋白並載入 3D 對接結構。",
    heatFullTitle: "全部醣的 Heatmap",
    heatFullDesc: "列、欄都依分數形狀做階層分群。懸停看名稱，點一格同時選定 GBP 與醣。顏色是 0–1 的模型分數。",
    footer: "蛋白質三維座標來自 AlphaFold DB，代表性醣配體由 RDKit ETKDGv3 產生三維構型並以 In-house AutoDock Vina 進行分子對接，自動解析 4.5 Å 內之結合位點胺基酸 (Binding Site AA) 與配體原子 (Ligand Atom) 接觸。",
    loading3D: "載入蛋白質與對接配體結構…",
    loaded3D: (lig) => `已載入全蛋白與對接配體 (${lig})`,
    failed3D: "結構檔載入失敗",
  },
  en: {
    kicker: "Animal · Plant · Microbial GBPs · AlphaFold DB · In-House AutoDock Vina",
    title: "GBP–Glycan Binding Protein Database & Molecular Docking Atlas",
    lede: (m) =>
      `Comprehensive database of ${m.n_gbp_total} Glycan-Binding Proteins (GBPs / Lectins) across Animal, Plant, and Microbial kingdoms (including the complete C-Type, S-Type, and I-Type lectin panel from the reference figure). Every protein structure from AlphaFold DB is docked in-house against its representative 3D glycan ligand using AutoDock Vina to map Binding Site Amino Acids (AA) and Ligand Atom interactions.`,
    nav: ["Protein & Glycan Pickers", "3D Structure & Binding Site", "Full GBP Database Table", "PCA Specificity Map", "Glycan Class Heatmap", "Full Glycan Heatmap"],
    pickGbpTitle: "1. Select a Glycan-Binding Protein (GBP / Lectin)",
    pickGbpDesc: "Includes Animal (C/S/I-Type panel), Plant, and Microbial lectins. Click any entry to preview its 3D structure and docked binding site.",
    gbpPlaceholder: "Search protein, gene, or alias (e.g., CLEC9A, NKp44, Siglec-7, ConA, DC-SIGN)…",
    pickGlycanTitle: "2. Find Lectins by Glycan Structure",
    pickGlycanDesc: "Select a glycan composition to rank Animal, Plant, and Microbial GBPs that recognize it.",
    glycanPlaceholder: "Search N4H5, HexNAc, NeuAc, High-Mannose…",
    btnFocus: "Focus Binding Site",
    btnReset: "Full Protein Overview",
    btnLabels: "Toggle AA & Atom Labels",
    btnSurface: "Pocket Surface",
    legPlddt: "Protein pLDDT:",
    legDock: "Docking Layers:",
    legAA: "Binding Site Amino Acids (AA)",
    legLig: "Docked Glycan Ligand Atoms",
    legCnt: "Interatomic Contacts (≤4.5 Å)",
    dbTitle: "Complete Glycan-Binding Protein Database (Animal · Plant · Microbial · Reference Panel)",
    dbDesc: "Click any row to load the 3D protein structure, docked glycan ligand, and binding site amino acid contacts in the viewer above (★ marks entries highlighted in the reference figure).",
    dbHeaders: ["Kingdom", "Classification Panel", "Protein Name", "Gene / Other Names", "UniProt", "Organism", "Docked Glycan Ligand", "Vina Affinity", "Key Binding Site AAs"],
    pcaTitle: "PCA Specificity Map",
    pcaNote: (m) =>
      `Standardized PCA computed across the ${m.n_gbp_matrix} GBPs × ${m.n_glycans} glycans specificity matrix. PC1 (${(m.pca_explained[0] * 100).toFixed(1)}%) and PC2 (${(m.pca_explained[1] * 100).toFixed(1)}%) group lectins by glycan recognition profile rather than sequence homology.`,
    heatClassTitle: "Heatmap by Glycan Class",
    heatClassDesc: "Each cell shows the mean specificity score of a GBP across that glycan class. Click any cell to select the protein and inspect its 3D docked complex.",
    heatFullTitle: "Full GBP × Glycan Specificity Heatmap",
    heatFullDesc: "Rows (GBPs) and columns (162 glycans) are hierarchically clustered by binding profile similarity. Click any cell to select both GBP and glycan.",
    footer: "3D protein coordinates are retrieved from AlphaFold DB. 3D glycan conformers are generated with RDKit ETKDGv3 and docked in-house via AutoDock Vina (v1.1.2) to identify binding site amino acids and ligand atom contacts within 4.5 Å.",
    loading3D: "Loading 3D protein & docked ligand structures…",
    loaded3D: (lig) => `Loaded full protein & docked ligand (${lig})`,
    failed3D: "Failed to load structure file",
  },
  bi: {
    kicker: "Animal · Plant · Microbial GBPs · AlphaFold DB · In-House AutoDock Vina",
    title: "GBP–醣結合蛋白資料庫與分子對接圖譜 | GBP–Glycan Structure & Docking Atlas",
    lede: (m) =>
      `收錄植物、動物與微生物三大界共 ${m.n_gbp_total} 個醣結合蛋白（含附件圖片 C/S/I-Type 清單），結合 AlphaFold 3D 結構與 In-house AutoDock Vina 分子對接。 | Curates ${m.n_gbp_total} Animal, Plant, and Microbial GBPs with AlphaFold structures and in-house AutoDock Vina glycan docking to map Binding Site AAs and Ligand Atoms.`,
    nav: ["選單 Pickers", "3D 結構與結合位點 3D & Binding Site", "完整資料庫總表 Database Table", "PCA 分群", "類別熱圖 Class Heatmap", "全醣熱圖 Full Heatmap"],
    pickGbpTitle: "1. 選取醣結合蛋白 | Select GBP / Lectin",
    pickGbpDesc: "涵蓋動物（含附件 C/S/I-Type 清單）、植物與微生物凝集素。 | Animal, Plant, and Microbial lectins with 3D docking.",
    gbpPlaceholder: "搜尋蛋白、基因、別名 Search protein, gene, alias (CLEC9A, NKp44, Siglec-7, ConA)…",
    pickGlycanTitle: "2. 從醣結構找凝集素 | Find Lectins by Glycan",
    pickGlycanDesc: "選取聚糖組成以列出偏好結合它的 GBP。 | Select a glycan composition to rank matching GBPs.",
    glycanPlaceholder: "搜尋 N4H5、HexNAc、唾液酸 Search glycan composition…",
    btnFocus: "聚焦結合位點 Focus Binding Site",
    btnReset: "全蛋白預覽 Full Protein",
    btnLabels: "標籤開關 Toggle Labels",
    btnSurface: "口袋表面 Pocket Surface",
    legPlddt: "蛋白 pLDDT：",
    legDock: "對接圖層 Docking：",
    legAA: "結合位點胺基酸 Binding Site AA",
    legLig: "配體原子 Ligand Atom",
    legCnt: "原子接觸 Contacts (≤4.5 Å)",
    dbTitle: "完整醣結合蛋白資料庫總表 | Complete GBP Database Table (Animal · Plant · Microbial)",
    dbDesc: "點擊任一列即可載入 3D 蛋白質結構、對接醣配體與結合位點胺基酸（★ 為附件圖片螢光筆標示）。 | Click any row to view 3D docked structure and binding site AAs.",
    dbHeaders: ["界別 Kingdom", "分類面板 Panel", "蛋白質名稱 Protein", "基因／別名 Gene & Aliases", "UniProt", "物種 Organism", "對接配體 Docked Ligand", "親和力 Affinity", "關鍵結合位點胺基酸 Binding Site AAs"],
    pcaTitle: "PCA 特異性圖譜 | PCA Specificity Map",
    pcaNote: (m) =>
      `${m.summary} (PC1 ${(m.pca_explained[0] * 100).toFixed(1)}%, PC2 ${(m.pca_explained[1] * 100).toFixed(1)}%)`,
    heatClassTitle: "依醣類別熱圖 | Heatmap by Glycan Class",
    heatClassDesc: "每一格為該 GBP 在此聚糖類別的平均分數，點擊可載入 3D 對接結構。 | Mean specificity score per glycan class; click to load 3D structure.",
    heatFullTitle: "全部醣熱圖 | Full GBP × Glycan Heatmap",
    heatFullDesc: "列與欄依結合特徵做階層分群，點擊可同時選定 GBP 與聚糖。 | Hierarchically clustered specificity matrix.",
    footer: "蛋白質座標來自 AlphaFold DB，醣配體以 RDKit ETKDGv3 建模並由 In-house AutoDock Vina 對接解析 4.5 Å 內結合位點胺基酸與配體原子。 | AlphaFold DB structures docked with RDKit 3D glycans via AutoDock Vina.",
    loading3D: "載入結構中 Loading 3D structures…",
    loaded3D: (lig) => `已載入全蛋白與對接配體 Loaded complex (${lig})`,
    failed3D: "結構檔載入失敗 Failed to load structure",
  },
};

const state = {
  atlas: null,
  lang: "bi",
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

function tMap(dict, key) {
  const entry = dict[key];
  if (!entry) return key;
  return entry[state.lang] || entry.bi || entry.zh || key;
}

function cleanEnName(g) {
  return (g.name_en || g.gene).replace(" [Highlighted]", "");
}

function cleanZhName(g) {
  return (g.name_zh || g.gene).replace("（螢光筆標示）", "");
}

function gbpDisplayName(g) {
  const zh = cleanZhName(g);
  const en = cleanEnName(g);
  if (state.lang === "en") return en;
  if (state.lang === "zh") return zh;
  return zh === en ? en : `${zh} (${en})`;
}

function gbpLigandDesc(g) {
  const enInfo = PROTEIN_EN_DESC[g.family] || PROTEIN_EN_DESC["C-type mannose"];
  if (state.lang === "en") {
    return {
      ligand: `${g.docking ? g.docking.ligand_name : ""} — ${enInfo.ligand}`,
      rule: enInfo.rule,
    };
  }
  if (state.lang === "zh") {
    return { ligand: g.ligand, rule: g.rule };
  }
  return {
    ligand: `${g.ligand} | ${enInfo.ligand}`,
    rule: `${g.rule} (${enInfo.rule})`,
  };
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
    const clsEn = (CLASS_I18N[g.class] || {}).en || "";
    return `${g.id} ${g.name} ${g.class} ${clsEn}`.toLowerCase().includes(q);
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

function applyStaticLabels() {
  const ui = UI_TEXT[state.lang] || UI_TEXT.bi;
  const m = state.atlas.meta;
  document.documentElement.lang = state.lang === "en" ? "en" : "zh-Hant";
  document.getElementById("txt-kicker").textContent = ui.kicker;
  document.getElementById("txt-title").textContent = ui.title;
  document.getElementById("lede").textContent = ui.lede(m);

  const navIds = ["nav-pickers", "nav-stage", "nav-db", "nav-pca", "nav-heat-class", "nav-heat-full"];
  navIds.forEach((id, idx) => {
    const el = document.getElementById(id);
    if (el) el.textContent = ui.nav[idx];
  });

  document.getElementById("txt-pick-gbp-title").textContent = ui.pickGbpTitle;
  document.getElementById("txt-pick-gbp-desc").textContent = ui.pickGbpDesc;
  document.getElementById("gbp-q").placeholder = ui.gbpPlaceholder;

  document.getElementById("txt-pick-glycan-title").textContent = ui.pickGlycanTitle;
  document.getElementById("txt-pick-glycan-desc").textContent = ui.pickGlycanDesc;
  document.getElementById("glycan-q").placeholder = ui.glycanPlaceholder;

  document.getElementById("viewer-focus-site").textContent = ui.btnFocus;
  document.getElementById("viewer-reset").textContent = ui.btnReset;
  document.getElementById("viewer-toggle-labels").textContent = ui.btnLabels;
  document.getElementById("viewer-toggle-surface").textContent = ui.btnSurface;

  document.getElementById("txt-legend-plddt").textContent = ui.legPlddt;
  document.getElementById("txt-legend-dock").textContent = ui.legDock;
  document.getElementById("txt-leg-aa").textContent = ui.legAA;
  document.getElementById("txt-leg-lig").textContent = ui.legLig;
  document.getElementById("txt-leg-cnt").textContent = ui.legCnt;

  document.getElementById("txt-db-title").textContent = ui.dbTitle;
  document.getElementById("txt-db-desc").textContent = ui.dbDesc;
  const thead = document.getElementById("db-thead");
  if (thead) {
    thead.innerHTML = `<tr>${ui.dbHeaders.map((h) => `<th>${h}</th>`).join("")}</tr>`;
  }

  document.getElementById("txt-pca-title").textContent = ui.pcaTitle;
  document.getElementById("pca-note").textContent = ui.pcaNote(m);
  document.getElementById("txt-heat-class-title").textContent = ui.heatClassTitle;
  document.getElementById("txt-heat-class-desc").textContent = ui.heatClassDesc;
  document.getElementById("txt-heat-full-title").textContent = ui.heatFullTitle;
  document.getElementById("txt-heat-full-desc").textContent = ui.heatFullDesc;
  document.getElementById("txt-footer").textContent = ui.footer;

  document.querySelectorAll("#lang-switch button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === state.lang);
  });
}

function renderSummaryBadges() {
  const host = document.getElementById("summary-badges");
  if (!host || !state.atlas) return;
  const m = state.atlas.meta;
  const kc = m.kingdom_counts || {};
  const nImg = state.atlas.gbps.filter((g) => g.lecture && g.lecture.includes("Image")).length;
  if (state.lang === "en") {
    host.innerHTML = `
      <span>Total GBPs: <b>${m.n_gbp_total || state.atlas.gbps.length}</b></span>
      <span>Animal Lectins: <b>${kc["動物"] || 0}</b></span>
      <span>Plant Lectins: <b>${kc["植物"] || 0}</b></span>
      <span>Microbial Lectins: <b>${kc["微生物"] || 0}</b></span>
      <span>Reference Figure Panel: <b>${nImg}</b></span>
      <span>AlphaFold Structures: <b>${m.n_gbp_structures}</b></span>
      <span>In-House Vina Docked Complexes: <b>${m.n_gbp_docked || m.n_gbp_structures}</b></span>
      <span>Glycan Library: <b>${m.n_glycans}</b></span>
    `;
  } else if (state.lang === "zh") {
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
  } else {
    host.innerHTML = `
      <span>總收錄 Total GBPs: <b>${m.n_gbp_total || state.atlas.gbps.length}</b></span>
      <span>動物 Animal: <b>${kc["動物"] || 0}</b></span>
      <span>植物 Plant: <b>${kc["植物"] || 0}</b></span>
      <span>微生物 Microbial: <b>${kc["微生物"] || 0}</b></span>
      <span>圖片清單 Image Panel: <b>${nImg}</b></span>
      <span>AlphaFold PDBs: <b>${m.n_gbp_structures}</b></span>
      <span>Vina 對接 Docked: <b>${m.n_gbp_docked || m.n_gbp_structures}</b></span>
      <span>聚糖 Glycans: <b>${m.n_glycans}</b></span>
    `;
  }
}

function renderGlycanList() {
  const host = document.getElementById("glycan-list");
  const rows = filteredGlycans();
  const emptyMsg = state.lang === "en" ? "No matching glycans" : "沒有符合的醣";
  host.innerHTML = rows.map((g) => `
    <button type="button" data-id="${g.id}" class="${g.id === state.glycan ? "active" : ""}">
      <span>${g.id}<small>${tMap(CLASS_I18N, g.class)} · ${g.name}</small></span>
    </button>
  `).join("") || `<p class="tag" style="padding:8px">${emptyMsg}</p>`;
}

function renderGbpList() {
  const host = document.getElementById("gbp-list");
  const rows = filteredGbps();
  const emptyMsg = state.lang === "en" ? "No matching proteins" : "沒有符合的蛋白";
  const hlBadge = state.lang === "en" ? "★ Highlighted" : state.lang === "zh" ? "★ 圖片標示" : "★ 圖片標示 Highlighted";
  host.innerHTML = rows.map((g) => {
    const hl = isHighlighted(g);
    const dk = g.docking || {};
    const aff = dk.affinity_kcal != null ? `${dk.affinity_kcal.toFixed(1)} kcal/mol` : "";
    const kLabel = tMap(KINGDOM_I18N, g.kingdom || "動物");
    return `
      <button type="button" data-gene="${g.gene}" class="${g.gene === state.gene ? "active" : ""} ${hl ? "highlighted" : ""}">
        <span>
          <em class="badge-kingdom k-${g.kingdom}">${kLabel}</em>
          <strong>${gbpDisplayName(g)}</strong>
          ${hl ? `<em class="badge-highlight">${hlBadge}</em>` : ""}
          <small>${g.gene} · ${g.aliases || cleanEnName(g)} · ${g.uniprot} · ${g.panel || tMap(FAMILY_I18N, g.family)}</small>
        </span>
        <em class="tag">${aff}</em>
      </button>
    `;
  }).join("") || `<p class="tag" style="padding:8px">${emptyMsg}</p>`;
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
    const kLabel = tMap(KINGDOM_I18N, g.kingdom || "動物");
    return `
      <tr data-gene="${g.gene}" class="${g.gene === state.gene ? "active-row" : ""} ${hl ? "highlight-row" : ""}">
        <td><span class="badge-kingdom k-${g.kingdom}">${kLabel}</span></td>
        <td>${g.panel || tMap(FAMILY_I18N, g.family)}</td>
        <td><strong>${gbpDisplayName(g)}</strong>${hl ? ` <span class="badge-highlight">★</span>` : ""}</td>
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
      `<button type="button" data-kingdom="${name}" class="${name === state.kingdom ? "active" : ""}">${tMap(KINGDOM_I18N, name)}</button>`
    ).join("");
  }

  const classes = ["全部", ...state.atlas.meta.classes];
  document.getElementById("glycan-chips").innerHTML = classes.map((name) =>
    `<button type="button" data-class="${name}" class="${name === state.glycanClass ? "active" : ""}">${tMap(CLASS_I18N, name)}</button>`
  ).join("");

  const families = ["全部", ...new Set(state.atlas.gbps.map((g) => g.family))];
  document.getElementById("family-chips").innerHTML = families.map((name) =>
    `<button type="button" data-family="${name}" class="${name === state.family ? "active" : ""}">${tMap(FAMILY_I18N, name)}</button>`
  ).join("");

  document.getElementById("family-legend").innerHTML = families.filter((name) => name !== "全部").map((name) =>
    `<span><i style="background:${FAMILY_COLOR[name] || "#888"}"></i>${tMap(FAMILY_I18N, name)}</span>`
  ).join("");
}

function composition(g) {
  const lacLabel = state.lang === "en" ? `Est. LacNAc arms ${g.lacnac}` : state.lang === "zh" ? `估計 LacNAc 臂 ${g.lacnac}` : `LacNAc 臂/arms ${g.lacnac}`;
  const bits = [`HexNAc ${g.n}`, `Hex ${g.h}`, `Fuc ${g.f}`, `NeuAc ${g.s}`];
  if (g.p) bits.push(`Phospho ${g.p}`);
  if (g.fn) bits.push(`FNeuAc ${g.fn}`);
  if (g.o) bits.push("O-linked");
  if (g.lacnac) bits.push(lacLabel);
  return bits.map((bit) => `<span>${bit}</span>`).join("");
}

function renderGlycanCard() {
  const host = document.getElementById("glycan-card");
  const g = glycanById.get(state.glycan);
  if (!g) {
    host.innerHTML = state.lang === "en" ? "<p>Select a glycan from the picker above.</p>" : "<p>請從上方選一個醣結構。</p>";
    return;
  }
  const gbp = gbpByGene.get(state.gene);
  const pair = scoreOf(gbp, g.id);
  const scoreLabel = state.lang === "en"
    ? `Specificity score with ${gbp ? cleanEnName(gbp) : ""}: ${pair != null ? pair.toFixed(2) : "-"}`
    : state.lang === "zh"
    ? `與目前選取蛋白 (${gbp ? cleanZhName(gbp) : ""}) 的模型分數：${pair != null ? pair.toFixed(2) : "-"}`
    : `與 ${gbp ? gbpDisplayName(gbp) : ""} 模型分數 Specificity Score: ${pair != null ? pair.toFixed(2) : "-"}`;
  const pairHtml = pair == null ? "" : `<span class="pair-score">${scoreLabel}</span>`;

  const ranks = g.top_gbps.length
    ? g.top_gbps.map((row) => {
        const item = gbpByGene.get(row.gene);
        const kLabel = item ? tMap(KINGDOM_I18N, item.kingdom || "動物") : "";
        const kBadge = item ? `<em class="badge-kingdom k-${item.kingdom}">${kLabel}</em>` : "";
        return `<button type="button" data-gene="${row.gene}" class="${row.gene === state.gene ? "active" : ""}">
          <span>${kBadge}${item ? gbpDisplayName(item) : row.name_zh}<small>${row.gene} · ${item ? item.panel || tMap(FAMILY_I18N, item.family) : ""}</small></span><b>${row.score.toFixed(2)}</b>
        </button>`;
      }).join("")
    : (state.lang === "en" ? "<p>No GBP has a model score ≥ 0.20 for this glycan.</p>" : "<p>此組成在模型裡沒有分數 ≥ 0.20 的 GBP。</p>");

  const kickerTxt = state.lang === "en" ? "Glycan Structure & Top-Binding Lectins" : state.lang === "zh" ? "資料庫聚糖結構" : "資料庫聚糖結構 | Glycan Structure";
  const classPrefix = state.lang === "en" ? "Class: " : state.lang === "zh" ? "類別：" : "類別 Class: ";
  const rankHeading = state.lang === "en" ? "Top GBPs Recognizing This Glycan" : state.lang === "zh" ? "偏好結合此醣結構的 GBP 排行" : "偏好此醣的 GBP 排行 | Top Matching GBPs";

  host.innerHTML = `
    <p class="kicker">${kickerTxt}</p>
    <div class="glycan-figure">
      <img src="${asset(g.image)}" alt="${g.name}">
      <div>
        <p class="meta-line"><strong>${g.id}</strong></p>
        <p class="meta-line">${g.name}</p>
        <p class="meta-line">${classPrefix}${tMap(CLASS_I18N, g.class)}</p>
        <div class="pills">${composition(g)}</div>
        ${pairHtml}
      </div>
    </div>
    <h3>${rankHeading}</h3>
    <div class="rank">${ranks}</div>
  `;
}

function renderProteinMeta() {
  const host = document.getElementById("protein-meta");
  const dockHost = document.getElementById("docking-panel");
  const strip = document.getElementById("pref-strip");
  const g = gbpByGene.get(state.gene);
  if (!g) {
    host.innerHTML = state.lang === "en" ? "<p>Select a GBP from the top-left list.</p>" : "<p>請從左上方選一個 GBP。</p>";
    dockHost.innerHTML = "";
    strip.innerHTML = "";
    return;
  }
  const structure = g.structure || {};
  const dk = g.docking || {};
  const hl = isHighlighted(g);
  const kLabel = tMap(KINGDOM_I18N, g.kingdom || "動物");
  const hlTxt = state.lang === "en"
    ? "★ Highlighted in Reference Panel"
    : state.lang === "zh"
    ? "★ 附件圖片螢光筆標示"
    : "★ 圖片螢光筆標示 Highlighted";

  const quality = structure.mean_plddt != null
    ? (state.lang === "en"
        ? `Mean pLDDT ${structure.mean_plddt} · ${structure.residues} amino acid residues`
        : state.lang === "zh"
        ? `平均 pLDDT ${structure.mean_plddt} · ${structure.residues} 胺基酸殘基`
        : `平均 Mean pLDDT ${structure.mean_plddt} · ${structure.residues} residues`)
    : (state.lang === "en" ? "No structure file available" : "沒有可用的座標檔");

  const desc = gbpLigandDesc(g);
  const lblGene = state.lang === "en" ? "Gene / Aliases:" : state.lang === "zh" ? "基因／別名：" : "基因／別名 Gene & Aliases:";
  const lblOrg = state.lang === "en" ? "Organism:" : state.lang === "zh" ? "物種：" : "物種 Organism:";
  const lblQual = state.lang === "en" ? "Structure Quality:" : state.lang === "zh" ? "結構品質：" : "結構品質 Quality:";
  const lblLig = state.lang === "en" ? "Ligand Specificity:" : state.lang === "zh" ? "天然／代表配體：" : "配體特異性 Ligand Specificity:";

  host.innerHTML = `
    <p class="kicker">
      <span class="badge-kingdom k-${g.kingdom}">${kLabel}</span>
      ${g.panel || tMap(FAMILY_I18N, g.family)} · ${g.lecture}
      ${hl ? `<span class="badge-highlight">${hlTxt}</span>` : ""}
    </p>
    <p class="meta-line"><strong>${gbpDisplayName(g)}</strong></p>
    <p class="meta-line"><b>${lblGene}</b> <code>${g.gene}</code> · ${g.aliases || "-"} · <b>UniProt:</b> <a href="https://www.uniprot.org/uniprotkb/${g.uniprot}" target="_blank" rel="noopener">${g.uniprot}</a> · <b>${lblOrg}</b> <em>${g.organism}</em></p>
    <p class="meta-line"><b>${lblQual}</b> ${quality}</p>
    <p class="meta-line"><b>${lblLig}</b> ${desc.ligand} — ${desc.rule}</p>
  `;

  if (dk && dk.contacts && dk.contacts.length) {
    const chipsHtml = dk.contacts.map((c) =>
      `<button type="button" class="aa-chip ${state.activeResid === c.resid ? "active" : ""}" data-resid="${c.resid}" title="Focus ${c.resname}${c.resid} ↔ ${c.ligand_atom}">
        ${c.resname}${c.resid} <small>(${c.protein_atom}↔${c.ligand_atom} ${c.distance.toFixed(1)}Å)</small>
      </button>`
    ).join("");

    const rowsHtml = dk.contacts.map((c) => `
      <tr data-resid="${c.resid}" class="${state.activeResid === c.resid ? "active-row" : ""}">
        <td><strong>${c.resname} ${c.resid}</strong> (Chain ${c.chain})</td>
        <td><code>${c.protein_atom}</code></td>
        <td><code style="color:#166534;font-weight:600">${c.ligand_atom}</code> (${c.ligand_elem})</td>
        <td><b>${c.distance.toFixed(2)} &Aring;</b></td>
        <td>${tMap(INTERACTION_I18N, c.interaction)}</td>
      </tr>
    `).join("");

    const dkTitle = state.lang === "en"
      ? "In-House Molecular Docking: Binding Site Amino Acids (AA) & Ligand Atom Contacts"
      : state.lang === "zh"
      ? "In-House 分子對接結合位點分析 (Binding Site AA & Ligand Atom Contacts)"
      : "In-House 分子對接結合位點分析 | Binding Site AA & Ligand Atom Contacts";
    const dkHint = state.lang === "en"
      ? "Click any amino acid badge or table row below to zoom and focus the 3D viewer on that residue–ligand atom interaction."
      : state.lang === "zh"
      ? "點擊任一胺基酸標籤或表格列，3D 視窗將自動放大對焦該殘基與配體原子之氫鍵／接觸。"
      : "點擊任一胺基酸標籤或表格列以在 3D 視窗放大對焦 | Click any residue badge or row to zoom in 3D.";

    const mEngine = state.lang === "en" ? "Engine" : state.lang === "zh" ? "對接引擎" : "引擎 Engine";
    const mLig = state.lang === "en" ? "Docked Ligand" : state.lang === "zh" ? "對接配體" : "配體 Ligand";
    const mAtoms = state.lang === "en" ? "heavy atoms" : state.lang === "zh" ? "重原子" : "重原子 atoms";
    const mAff = state.lang === "en" ? "Affinity" : state.lang === "zh" ? "對接親和力" : "親和力 Affinity";
    const mCenter = state.lang === "en" ? "Pocket Center" : state.lang === "zh" ? "結合口袋中心" : "口袋中心 Pocket";

    const ths = state.lang === "en"
      ? ["Binding Site Amino Acid (AA)", "Protein Atom", "Ligand Atom", "Distance", "Interaction Type"]
      : state.lang === "zh"
      ? ["結合位置胺基酸 (Binding Site AA)", "蛋白質原子 (Protein Atom)", "配體原子 (Ligand Atom)", "原子距離", "預估交互作用類型"]
      : ["結合位點胺基酸 Binding Site AA", "蛋白質原子 Protein Atom", "配體原子 Ligand Atom", "距離 Distance", "交互作用類型 Interaction"];

    dockHost.innerHTML = `
      <div class="docking-box">
        <div class="docking-header">
          <div>
            <h3>${dkTitle}</h3>
            <small style="color:var(--muted)">${dkHint}</small>
          </div>
          <div class="docking-metrics">
            <span>${mEngine}: <b>${dk.engine || "AutoDock Vina"}</b></span>
            <span>${mLig}: <b>${dk.ligand_name}</b> (${dk.n_ligand_atoms} ${mAtoms})</span>
            <span>${mAff}: <b>${dk.affinity_kcal} kcal/mol</b></span>
            <span>${mCenter}: <code>(${dk.pocket_center.join(", ")})</code></span>
          </div>
        </div>
        <div class="aa-chips">${chipsHtml}</div>
        <div class="contact-table-wrap">
          <table class="contact-table">
            <thead>
              <tr>${ths.map((h) => `<th>${h}</th>`).join("")}</tr>
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
    const outMsg = state.lang === "en"
      ? "This protein's primary ligand (e.g., β-1,3-glucan, peptidoglycan, galactofuranose, or sulfated GAG) is outside the N/O-glycan composition table; its 3D docked complex and binding site contacts are displayed directly above."
      : state.lang === "zh"
      ? "此蛋白的特異性配體（如 β-1,3-葡聚醣、肽聚醣或硫酸化 GAG）不在 N／O-glycan 組成表內，上方已直接提供該配體之 3D 分子對接複合物與結合位點殘基。"
      : "此蛋白的特異性配體不在 N/O-glycan 組成表內，上方已直接提供 3D 分子對接複合物與結合位點殘基。 | Specialized ligand docked directly in 3D viewer above.";
    strip.innerHTML = `<p style='margin-top:10px;color:var(--muted)'>${outMsg}</p>`;
    return;
  }
  const stripTitle = state.lang === "en"
    ? "Top-Scoring Glycan Structures in Library"
    : state.lang === "zh"
    ? "資料庫中偏好分數最高的聚糖結構"
    : "偏好分數最高的聚糖結構 | Top-Scoring Glycans in Library";

  strip.innerHTML = `<h3>${stripTitle}</h3><div class="strip">${g.top_glycans.map((row) => {
    const glycan = glycanById.get(row.id);
    return `<button type="button" class="thumb ${row.id === state.glycan ? "active" : ""}" data-id="${row.id}">
      <img src="${asset(glycan.image)}" alt="${row.id}">
      <b>${row.id}</b>
      <small>${row.score.toFixed(2)} · ${tMap(CLASS_I18N, glycan.class)}</small>
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

  if (state.protModel) {
    state.protModel.setStyle({}, { cartoon: { colorfunc: plddtColor, opacity: 0.86 } });
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

  if (state.ligModel) {
    state.ligModel.setStyle(
      {},
      {
        stick: { radius: 0.26, colorscheme: "greenCarbon" },
        sphere: { scale: 0.32, colorscheme: "greenCarbon" },
      }
    );
  }

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
  const ui = UI_TEXT[state.lang] || UI_TEXT.bi;
  if (!g || !g.structure || !g.structure.pdb) {
    box.innerHTML = `<p style='padding:16px'>${ui.failed3D}</p>`;
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
  status.textContent = ui.loading3D;

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
        ? ui.loaded3D(g.docking.ligand_name)
        : "Loaded";
    })
    .catch(() => {
      box.innerHTML = `<p style='padding:16px'>${ui.failed3D}</p>`;
      status.textContent = ui.failed3D;
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
    name: tMap(FAMILY_I18N, family),
    x: rows.map((g) => g.pca[0]),
    y: rows.map((g) => g.pca[1]),
    customdata: rows.map((g) => g.gene),
    text: rows.map((g) => `[${tMap(KINGDOM_I18N, g.kingdom || "動物")}] ${gbpDisplayName(g)}<br>${g.gene} (${g.organism})`),
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
    xaxis: { title: `PC1 (${(explained[0] * 100).toFixed(1)}%)`, zeroline: false },
    yaxis: { title: `PC2 (${(explained[1] * 100).toFixed(1)}%)`, zeroline: false },
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
  const classes = state.atlas.meta.classes.map((c) => tMap(CLASS_I18N, c));
  const z = order.map((row) => state.atlas.class_matrix[row]);
  const y = order.map((row) => genes[row]);
  const scoreLbl = state.lang === "en" ? "Mean Score" : state.lang === "zh" ? "平均分數" : "平均分數 Score";
  Plotly.react("class-plot", [{
    type: "heatmap",
    z,
    x: classes,
    y,
    colorscale: "YlOrRd",
    zmin: 0,
    zmax: 1,
    hovertemplate: `%{y}<br>%{x}<br>${scoreLbl} %{z:.2f}<extra></extra>`,
    colorbar: { title: state.lang === "en" ? "Score" : "分數", thickness: 12 },
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
  const classes = state.atlas.meta.classes.map((c) => tMap(CLASS_I18N, c));
  const titleTxt = state.lang === "en"
    ? `Mean Specificity Score by Glycan Class for ${cleanEnName(g)}`
    : state.lang === "zh"
    ? `${cleanZhName(g)} 的各類別平均分數`
    : `${gbpDisplayName(g)} 各類別平均分數 | Mean Score by Class`;
  const yTitle = state.lang === "en" ? "Mean Score" : state.lang === "zh" ? "平均分數" : "平均分數 Mean Score";
  Plotly.react(host, [{
    type: "bar",
    x: classes,
    y: g.class_means,
    marker: { color: "#1f6a64" },
    hovertemplate: "%{x}<br>%{y:.2f}<extra></extra>",
  }], {
    margin: { l: 48, r: 10, t: 36, b: 100 },
    height: 280,
    title: { text: titleTxt, font: { size: 14 } },
    paper_bgcolor: "#faf7f1",
    plot_bgcolor: "#fff",
    yaxis: { range: [0, 1], title: yTitle },
    xaxis: { tickangle: -30 },
  }, { responsive: true, displaylogo: false });
}

function drawFullHeat() {
  const genes = state.atlas.matrix_genes;
  const ids = state.atlas.matrix_glycan_ids;
  const z = state.atlas.row_order.map((row) => state.atlas.col_order.map((col) => state.atlas.matrix[row][col]));
  const y = state.atlas.row_order.map((row) => genes[row]);
  const x = state.atlas.col_order.map((col) => ids[col]);
  const scoreLbl = state.lang === "en" ? "Score" : "分數";
  Plotly.react("full-plot", [{
    type: "heatmap",
    z,
    x,
    y,
    colorscale: "YlOrRd",
    zmin: 0,
    zmax: 1,
    hovertemplate: `%{y} × %{x}<br>${scoreLbl} %{z:.2f}<extra></extra>`,
    colorbar: { title: scoreLbl, thickness: 12 },
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
  const t1 = state.lang === "en" ? "Top PC1 Loading Glycans" : state.lang === "zh" ? "PC1 負荷較大的醣" : "PC1 負荷較大的醣 | Top PC1 Glycans";
  const t2 = state.lang === "en" ? "Top PC2 Loading Glycans" : state.lang === "zh" ? "PC2 負荷較大的醣" : "PC2 負荷較大的醣 | Top PC2 Glycans";
  const block = (title, rows) => `
    <div><b>${title}</b><br>${rows.map((row) => `${row.id} (${row.loading > 0 ? "+" : ""}${row.loading.toFixed(2)})`).join(" · ")}</div>`;
  document.getElementById("loadings").innerHTML =
    block(t1, state.atlas.loadings.pc1) +
    block(t2, state.atlas.loadings.pc2);
}

function setLanguage(lang) {
  state.lang = lang;
  applyStaticLabels();
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
  document.getElementById("lang-switch").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-lang]");
    if (!button) return;
    setLanguage(button.dataset.lang);
  });
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
  setLanguage("bi");
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
      "讀不到 site/data/atlas.json。請直接開啟根目錄的單一整合檔 index.html。 | Cannot load site/data/atlas.json; open the root standalone index.html directly.";
  });
