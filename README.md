# GBP–醣結合蛋白資料庫與分子對接圖譜 (Plant · Animal · Microbial Lectin Atlas)

收錄 **106 個**跨物種（**動物 85 個、植物 14 個、微生物 7 個**）之醣結合蛋白（Glycan-Binding Proteins, GBPs／Lectins），完整涵蓋：
- **附件圖片完整清單（63 個）**：
  - **C-Type Lectins**：Type I membrane receptors (`DEC205`, `TLR2`, `TLR4`, `TLT2`)、Type II membrane receptors (`ASGR-1`, `ASGR-2`, `BDCA2`, `BIMLEC`, `CLEC6`, `DCIR`, `DC-SIGN`, `DC-SIGNR`, `Dectin-2`, `Langerin`, `LSECtin`, `MINCLE`, `mKCR`, `ML2/MGL`)、NK receptors (`AICL`, `CD69`, `CLEC1`, `CLEC2`, `CLEC2A`, `CLEC2D`, `CLEC5A`, `CLEC5B/CD161`, `CLEC5C/NKp80`, `CLEC9A`★, `CLL1`, `DCAL-1`, `Dectin-1`, `KLRF2/NKp65`, `Lox-1`, `MAFA/KLRG1`, `mCLEC2L`, `NKG2D`, `NKp30`, `NKp44`★)、MMR receptors (`Endo180`, `MMR/MRC1`)、Ficolin (`L-Ficolin/FCN2`)
  - **S-Type Lectins (Galectins)**：`Galectin-1`, `Galectin-2`, `Galectin-3`, `Galectin-4`, `Galectin-7`, `Galectin-8`, `Galectin-9`
  - **I-Type Lectins (Siglecs)**：`Siglec-1`★, `Siglec-2/CD22`★, `Siglec-3/CD33`, `Siglec-4a/MAG`, `Siglec-5`, `Siglec-6`, `Siglec-7`★, `Siglec-8`★, `Siglec-9`, `Siglec-10`★, `Siglec-11`, `Siglec-14`, `Siglec-15`★, `Siglec-16`★
- **其他動物凝集素**：Collectins (`MBL2`, `SP-A`, `SP-D`)、Selectins (`P-/E-/L-selectin`)、P-Type M6P 受體 (`CD-MPR`, `CI-MPR`)、L-Type 內質網品質管制 (`Calnexin`, `Calreticulin`, `ERGIC-53`)、無脊椎動物凝集素 (`Tachylectin-2`, `CEL-III`) 及 GAG 結合蛋白等。
- **植物凝集素（14 個）**：`ConA`, `PNA`, `SBA`, `ASA`, `Ricin`, `SNA-I`, `WGA`, `PHA-E`, `PHA-L`, `UEA-I`, `Jacalin`, `MAA/MAL`, `GNA`, `BanLec`。
- **微生物凝集素（7 個，細菌／真菌／毒素）**：`LecA (PA-IL)`, `LecB (PA-IIL)`, `FimH`, `CTxB (霍亂毒素 B)`, `StxB (志賀毒素 B)`, `AAL (橙黃網胞盤菌)`, `CNL (煙色杯傘)`。

## In-House 分子對接與互動式 Dashboard 功能
1. **3D 蛋白質結構與分子對接 (`structures/<GENE>/`)**：
   - 自動由 AlphaFold DB 下載全蛋白質三維結構 (`AF-<UniProt>-F1.pdb`)。
   - 以 RDKit `ETKDGv3` 建構 19 種代表性聚糖配體之 3D 低能構型，並以 **In-house AutoDock Vina (v1.1.2)** 針對各凝集素之糖結合結構域（CRD）進行三維分子對接（產出 `docked_<Ligand>.pdb` 與 `docking_<Ligand>.json`）。
2. **Standalone HTML Dashboard (`index.html`)**：
   - 可依 **物種界別（動物／植物／微生物／圖片清單／圖片黃色標示 ★）** 與 **蛋白質家族** 篩選或搜尋蛋白。
   - **3D 結構與結合位點互動視窗**：同時顯示全蛋白質結構（依 pLDDT 著色）、對接醣配體（綠色球棍模型）、**結合位置胺基酸（Binding Site AA，玫瑰紅棍棒模型與標籤）**、**配體原子（Ligand Atom 標籤）** 以及 **原子間接觸虛線（≤ 4.5 Å）**。
   - 點擊結合位點表格中之任一胺基酸或配體原子，3D 視窗即自動放大對焦該殘基與配體原子之氫鍵／CH–π 堆疊／極性交互作用。
3. **完整資料庫表格匯出 (`gbp_glycan_database.csv`)**：包含所有 106 個 GBP 的分類、別名、UniProt ID、對接配體、Vina 親和力、結合口袋座標與結合位點胺基酸–配體原子配對清單。

線上預覽頁面：https://hunglinchen2003.github.io/gbp-glycan-atlas/
