"""Write a single standalone index.html for GitHub Pages and local viewing.

CSS, Plotly, 3Dmol, the atlas, glycan cartoons, and all 106 docked ligand 3D poses are inlined.
AlphaFold PDB files stay in structures/ and are loaded when a protein is selected (with AlphaFold CDN fallback for local file:// viewing).
Also exports gbp_glycan_database.csv for spreadsheet analysis.
"""

from __future__ import annotations

import base64
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
ATLAS_PATH = SITE / "data" / "atlas.json"
OUT = ROOT / "index.html"
CSV_OUT = ROOT / "gbp_glycan_database.csv"


def inline_script(source: str) -> str:
    return source.replace("</", "<\\/")


def embed_assets(atlas: dict) -> None:
    for glycan in atlas["glycans"]:
        path = ROOT / glycan["image"]
        if not path.exists():
            continue
        encoded = base64.b64encode(path.read_bytes()).decode("ascii")
        glycan["image"] = f"data:image/png;base64,{encoded}"

    for gbp in atlas["gbps"]:
        dk = gbp.get("docking") or {}
        lig_pdb = dk.get("ligand_pdb")
        if lig_pdb:
            lpath = ROOT / lig_pdb
            if lpath.exists():
                dk["ligand_pdb_text"] = lpath.read_text(encoding="utf-8")


def write_csv(atlas: dict) -> None:
    fieldnames = [
        "Gene",
        "Protein_EN",
        "Protein_ZH",
        "Kingdom",
        "Panel",
        "Other_Names_Aliases",
        "UniProt",
        "Organism",
        "Family",
        "Source",
        "Natural_Ligand",
        "Docked_Ligand",
        "Vina_Affinity_kcal_mol",
        "Pocket_Center_XYZ",
        "Binding_Site_AAs",
        "AA_Ligand_Atom_Contacts",
        "AlphaFold_PDB",
        "Mean_pLDDT",
        "Residues",
    ]
    with CSV_OUT.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for g in atlas["gbps"]:
            dk = g.get("docking") or {}
            st = g.get("structure") or {}
            contacts = dk.get("contacts") or []
            aa_list = ", ".join(f"{c['resname']}{c['resid']}" for c in contacts)
            pair_list = "; ".join(
                f"{c['resname']}{c['resid']}({c['protein_atom']})<->Lig({c['ligand_atom']})={c['distance']}A [{c['interaction']}]"
                for c in contacts
            )
            writer.writerow({
                "Gene": g["gene"],
                "Protein_EN": g["name_en"],
                "Protein_ZH": g["name_zh"],
                "Kingdom": g.get("kingdom", ""),
                "Panel": g.get("panel", ""),
                "Other_Names_Aliases": g.get("aliases", ""),
                "UniProt": g["uniprot"],
                "Organism": g["organism"],
                "Family": g["family"],
                "Source": g["lecture"],
                "Natural_Ligand": g["ligand"],
                "Docked_Ligand": dk.get("ligand_name", ""),
                "Vina_Affinity_kcal_mol": dk.get("affinity_kcal", ""),
                "Pocket_Center_XYZ": ",".join(str(x) for x in dk.get("pocket_center", [])),
                "Binding_Site_AAs": aa_list,
                "AA_Ligand_Atom_Contacts": pair_list,
                "AlphaFold_PDB": st.get("pdb", ""),
                "Mean_pLDDT": st.get("mean_plddt", ""),
                "Residues": st.get("residues", ""),
            })
    print(f"wrote {CSV_OUT} ({len(atlas['gbps'])} rows)")


def main() -> None:
    atlas = json.loads(ATLAS_PATH.read_text(encoding="utf-8"))
    write_csv(atlas)
    embed_assets(atlas)
    payload = json.dumps(atlas, ensure_ascii=False, separators=(",", ":"))
    payload = payload.replace("<", "\\u003c").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")

    css = (SITE / "styles.css").read_text(encoding="utf-8")
    html = (SITE / "index.html").read_text(encoding="utf-8")
    body = html.split("<body>", 1)[1].split("<script", 1)[0]
    app = (SITE / "app.js").read_text(encoding="utf-8")
    app = app.replace(
        """function asset(path) {
  return "../" + encodeURI(path);
}""",
        """function asset(path) {
  if (path.startsWith("data:")) return path;
  return path.split("/").map(encodeURIComponent).join("/");
}""",
    )
    app = app.split('fetch("data/atlas.json")', 1)[0].rstrip() + "\n\nboot(ATLAS);\n"
    plotly = (SITE / "vendor" / "plotly.min.js").read_text(encoding="utf-8")
    mol = (SITE / "vendor" / "3Dmol-min.js").read_text(encoding="utf-8")

    page = f"""<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GBP–醣結合蛋白資料庫與分子對接圖譜 (Plant · Animal · Microbial Lectin Atlas)</title>
  <style>
{css}
  </style>
</head>
<body>
{body}
  <script>
{inline_script(plotly)}
  </script>
  <script>
{inline_script(mol)}
  </script>
  <script>
const ATLAS = {payload};
{inline_script(app)}
  </script>
</body>
</html>
"""
    OUT.write_text(page, encoding="utf-8")
    print(f"wrote {OUT} ({OUT.stat().st_size / 1e6:.2f} MB)")


if __name__ == "__main__":
    main()
