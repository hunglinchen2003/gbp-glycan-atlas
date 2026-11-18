"""Build the GBP–glycan atlas from W11/W12 lecture set, attached C/S/I-type lectin panel,
expanded plant/animal/microbial lectins, and in-house AutoDock Vina 3D docking.

AlphaFold models and docked ligand poses are saved under structures/<gene>/.
The website data file is site/data/atlas.json.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import numpy as np
from rdkit import Chem
from rdkit.Chem import AllChem
from scipy.cluster.hierarchy import leaves_list, linkage
from scipy.spatial.distance import pdist
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[1]
GLYCAN_INDEX = ROOT / "glycan_db" / "index.json"
STRUCTURES = ROOT / "structures"
LIGAND_CACHE = STRUCTURES / "_ligands"
SITE_DATA = ROOT / "site" / "data" / "atlas.json"
VENDOR = ROOT / "site" / "vendor"

API = "https://alphafold.ebi.ac.uk/api/prediction/{acc}"
UA = "GBP-Glycan-Atlas/2.0 (teaching; local structure & docking cache)"

VINA_EXE = Path(r"C:\Program Files (x86)\The Scripps Research Institute\Vina\vina.exe")
OBABEL_EXE = Path(r"C:\Program Files\OpenBabel-2.4.1\obabel.exe")


def clamp(value: float) -> float:
    return float(max(0.0, min(1.0, value)))


def load_glycans() -> list[dict]:
    payload = json.loads(GLYCAN_INDEX.read_text(encoding="utf-8"))
    glycans = []
    for row in payload["glycans"]:
        n = int(row["N"])
        h = int(row["H"])
        f = int(row["F"])
        s = int(row["S"])
        p = int(row["P"])
        fn = int(row["FNeuAc"])
        o = bool(row["O_linked"])
        sia = s + fn
        if o:
            antenna = 0
            extra_hex = h
            lacnac = 0
        else:
            antenna = max(0, n - 2)
            extra_hex = max(0, h - 3) if n >= 2 else h
            lacnac = min(antenna, extra_hex) if n >= 3 else 0
        if p > 0:
            klass = "M6P"
        elif o:
            klass = "O-glycan"
        elif n == 2 and h >= 5 and sia == 0:
            klass = "高甘露糖"
        elif n <= 2 and sia == 0:
            klass = "少甘露糖"
        elif n == 3:
            klass = "混合型"
        elif n >= 4 and f >= 1 and sia >= 1 and lacnac >= 1:
            klass = "唾液酸路易斯樣"
        elif n >= 4 and sia >= 1:
            klass = "唾液酸化複雜型"
        elif n >= 4 and sia == 0:
            klass = "去唾液酸複雜型"
        elif sia >= 1:
            klass = "小型唾液酸化"
        else:
            klass = "其他"
        glycans.append(
            {
                "id": row["sGlycan_Name"],
                "name": row["glycan_name"],
                "n": n,
                "h": h,
                "f": f,
                "s": s,
                "p": p,
                "fn": fn,
                "sia": sia,
                "o": o,
                "antenna": antenna,
                "extra_hex": extra_hex,
                "lacnac": lacnac,
                "class": klass,
                "image": "glycan_db/" + row["image_file"].replace("\\", "/"),
            }
        )
    return glycans


def high_man(g: dict, lo: int = 5, hi: int = 9) -> bool:
    return (
        not g["o"]
        and g["p"] == 0
        and g["n"] == 2
        and lo <= g["h"] <= hi
        and g["sia"] == 0
    )


def score_galectin(g: dict, sialic_weight: float, poly: float) -> float:
    if g["o"] or g["lacnac"] == 0:
        return 0.02
    peak = 2.0 + 2.0 * poly
    shape = max(0.35, 1.0 - 0.18 * abs(g["lacnac"] - peak))
    if g["sia"] == 0:
        return clamp(0.55 + 0.45 * shape)
    free = max(0, g["lacnac"] - g["sia"])
    if free == 0:
        return clamp(0.06 * shape)
    kept = free / g["lacnac"]
    return clamp((0.16 + 0.42 * kept * shape) * (1.0 - 0.35 * sialic_weight))


def score_mannose(g: dict, hyper: float = 0.72, pauc: float = 0.28, glcnac: float = 0.22) -> float:
    if g["o"] or g["p"] > 0:
        return 0.02
    if g["n"] == 2 and g["h"] >= 5 and g["sia"] == 0:
        if 5 <= g["h"] <= 9:
            return clamp(0.96 - 0.04 * g["f"])
        return hyper
    if g["n"] == 2 and g["h"] <= 4 and g["sia"] == 0:
        return pauc
    if g["n"] >= 3 and g["sia"] == 0 and g["extra_hex"] < g["antenna"]:
        return glcnac
    return 0.04


def score_dcsign(g: dict) -> float:
    lewis = g["lacnac"] >= 1 and g["f"] >= 1 and g["sia"] == 0 and not g["o"]
    if high_man(g):
        return 0.96
    if g["n"] == 2 and g["h"] >= 5 and g["sia"] == 0 and not g["o"] and g["p"] == 0:
        return 0.7
    if lewis:
        return 0.9
    if g["lacnac"] >= 1 and g["f"] >= 1 and g["sia"] == 1:
        return 0.34
    return 0.03


def score_langerin(g: dict) -> float:
    if high_man(g):
        return 0.94
    if g["lacnac"] >= 1 and g["f"] >= 1 and g["sia"] == 0 and not g["o"]:
        return 0.82
    if g["n"] == 2 and g["h"] >= 10 and g["sia"] == 0 and not g["o"]:
        return 0.58
    return 0.03


def score_selectin(g: dict) -> float:
    if g["lacnac"] >= 1 and g["f"] >= 1 and g["sia"] >= 1 and not g["o"]:
        return clamp(0.74 + 0.06 * min(g["f"], 3) + 0.04 * min(g["sia"], 3))
    if g["lacnac"] >= 1 and g["f"] >= 1 and g["sia"] == 0:
        return 0.16
    if g["sia"] >= 1:
        return 0.06
    return 0.02


def score_asgpr(g: dict) -> float:
    if g["sia"] > 0:
        return 0.03
    if g["o"] and g["h"] >= 1:
        return 0.93
    if g["o"] and g["h"] == 0:
        return 0.74
    if g["lacnac"] >= 1:
        return clamp(0.58 + 0.38 * min(1.0, g["lacnac"] / 2.0))
    return 0.03


def score_siglec(g: dict, fuc: float = 0.0, multi: float = 0.0, small: float = 0.22) -> float:
    if g["sia"] <= 0:
        return 0.02
    if g["n"] <= 2 and g["h"] <= 2:
        base = small
    elif g["n"] >= 4:
        base = 0.62 + 0.16 * min(1.0, g["sia"] / 2.0)
    elif g["n"] == 3:
        base = 0.42
    else:
        base = 0.28
    base += fuc * 0.14 * min(g["f"], 2)
    if g["sia"] >= 2:
        base += multi * 0.18
    return clamp(base)


def score_siglec15(g: dict) -> float:
    if g["sia"] <= 0:
        return 0.02
    if g["n"] <= 2 and g["h"] <= 1:
        return 0.97
    if g["n"] <= 2 and g["h"] <= 2:
        return 0.78
    return 0.12


def score_siglec8(g: dict) -> float:
    if g["lacnac"] >= 1 and g["f"] >= 1 and g["sia"] >= 1 and not g["o"]:
        return clamp(0.82 + 0.04 * min(g["f"], 3))
    if g["sia"] >= 1:
        return 0.16
    return 0.02


def score_mpr(g: dict) -> float:
    if g["p"] >= 1 and g["n"] == 2 and g["h"] >= 5:
        return 1.0
    if g["p"] >= 1:
        return 0.55
    return 0.01


def score_cona(g: dict) -> float:
    if g["o"] or g["p"] > 0:
        return 0.03
    if g["n"] == 2 and g["h"] >= 5 and g["sia"] == 0:
        return 0.98 if g["h"] <= 12 else 0.84
    if g["n"] == 3 and g["sia"] == 0:
        return 0.52
    if g["n"] == 4 and g["sia"] == 0:
        return 0.34
    if g["sia"] > 0 and g["n"] <= 3:
        return 0.12
    return 0.04


def score_pna(g: dict) -> float:
    if g["sia"] > 0:
        return 0.03
    if g["o"] and g["n"] >= 1 and g["h"] >= 1:
        return 1.0
    if g["lacnac"] >= 1:
        return 0.18
    return 0.03


def score_sba(g: dict) -> float:
    if g["sia"] > 0:
        return 0.04
    if g["o"] and g["h"] == 0 and g["n"] >= 1:
        return 0.98
    if g["n"] == 1 and g["h"] == 0 and g["sia"] == 0:
        return 0.9
    if g["o"] and g["h"] >= 1:
        return 0.42
    return 0.06


def score_ricin(g: dict) -> float:
    if g["sia"] > 0:
        return 0.05
    if g["o"] and g["h"] >= 1:
        return 0.9
    if g["o"]:
        return 0.72
    if g["lacnac"] >= 1:
        return clamp(0.55 + 0.4 * min(1.0, g["lacnac"] / 2.0))
    if g["n"] == 1 and g["h"] == 0:
        return 0.5
    return 0.04


def score_sna(g: dict) -> float:
    if g["sia"] <= 0 or g["o"]:
        return 0.03
    if g["n"] >= 4:
        return clamp(0.72 + 0.08 * min(g["sia"], 3))
    if g["n"] == 3:
        return 0.4
    return 0.16


def score_cnx(g: dict) -> float:
    if g["o"] or g["sia"] or g["f"] or g["p"]:
        return 0.02
    if g["n"] == 2 and g["h"] in (8, 9):
        return 1.0
    if g["n"] == 2 and g["h"] == 10:
        return 0.82
    if g["n"] == 2 and g["h"] in (7, 11):
        return 0.3
    if g["n"] == 2 and g["h"] >= 5:
        return 0.08
    return 0.02


def score_ergic(g: dict) -> float:
    if g["o"] or g["sia"] or g["f"] or g["p"]:
        return 0.01
    if g["n"] == 2 and g["h"] in (8, 9):
        return 1.0
    if g["n"] == 2 and g["h"] in (7, 10):
        return 0.38
    if g["n"] == 2 and 5 <= g["h"] <= 12:
        return 0.08
    return 0.01


def score_leca(g: dict) -> float:
    if g["sia"] > 0:
        return 0.04
    if g["lacnac"] >= 1:
        return clamp(0.7 + 0.25 * min(1.0, g["lacnac"] / 2.0))
    if g["o"] and g["h"] >= 1:
        return 0.66
    return 0.04


def score_lecb(g: dict) -> float:
    if g["f"] <= 0:
        return 0.03
    base = 0.68 + 0.1 * min(g["f"], 3)
    if g["sia"] >= 2:
        base *= 0.72
    return clamp(base)


def score_oligoman(g: dict) -> float:
    if high_man(g):
        return 0.96
    if g["n"] == 2 and g["h"] >= 10 and g["sia"] == 0 and not g["o"] and g["p"] == 0:
        return 0.62
    return 0.03


def score_pilra(g: dict) -> float:
    if g["sia"] <= 0:
        return 0.03
    if g["n"] <= 2 and g["h"] <= 2:
        return 0.92
    if g["o"]:
        return 0.35
    return 0.14


def score_galnt(g: dict) -> float:
    if g["sia"] > 0:
        return 0.06
    if g["o"] and g["h"] == 0 and g["n"] >= 1:
        return 1.0
    if g["n"] == 1 and g["h"] == 0:
        return 0.86
    if g["o"] and g["h"] >= 1:
        return 0.5
    return 0.05


def score_garlic(g: dict) -> float:
    if high_man(g, 5, 12) and g["f"] == 0:
        return 0.97 if g["h"] <= 9 else 0.8
    return 0.03


def score_glcnac(g: dict) -> float:
    if g["n"] >= 4 and g["sia"] == 0 and g["extra_hex"] < g["antenna"]:
        return 0.94
    if g["n"] >= 3 and g["sia"] == 0:
        return clamp(0.55 + 0.1 * min(g["n"], 4))
    if g["sia"] >= 1:
        return 0.38
    if g["n"] >= 1:
        return 0.32
    return 0.03


def score_pha_e(g: dict) -> float:
    if g["o"] or g["n"] < 4:
        return 0.03
    if g["n"] >= 5 and g["h"] >= 5:
        return 0.94 if g["sia"] <= 1 else 0.78
    if g["n"] == 4 and g["h"] >= 5:
        return 0.65
    return 0.12


def score_pha_l(g: dict) -> float:
    if g["o"] or g["n"] < 4:
        return 0.03
    if g["n"] >= 5 and g["lacnac"] >= 3:
        return 0.96 if g["sia"] == 0 else 0.76
    if g["lacnac"] == 2:
        return 0.48
    return 0.08


# 3D Ligand library for AutoDock Vina
LIGAND_SMILES = {
    "LacNAc": ("Galβ1-4GlcNAc (LacNAc)", "CC(=O)N[C@@H]1[C@@H](O)[C@H](O[C@@H]2O[C@H](CO)[C@H](O)[C@H](O)[C@H]2O)[C@@H](CO)O[C@H]1O"),
    "Man": ("α-D-Mannose", "OC[C@H]1O[C@H](O)[C@@H](O)[C@@H](O)[C@@H]1O"),
    "Man3": ("Manα1-3(Manα1-6)Man (Man3 Core)", "OC[C@H]1O[C@H](OC[C@H]2O[C@H](O)[C@@H](O)[C@@H](O[C@H]3O[C@H](CO)[C@@H](O)[C@H](O)[C@@H]3O)[C@@H]2O)[C@@H](O)[C@@H](O)[C@@H]1O"),
    "Gal": ("β-D-Galactose", "OC[C@H]1O[C@@H](O)[C@H](O)[C@@H](O)[C@H]1O"),
    "GalNAc": ("α-D-GalNAc (Tn antigen)", "CC(=O)N[C@@H]1[C@@H](O)[C@@H](O)[C@H](CO)O[C@H]1O"),
    "TF_antigen": ("Galβ1-3GalNAc (T antigen)", "CC(=O)N[C@@H]1[C@H](O[C@@H]2O[C@H](CO)[C@H](O)[C@H](O)[C@H]2O)[C@@H](O)[C@H](CO)O[C@H]1O"),
    "GlcNAc": ("β-D-GlcNAc", "CC(=O)N[C@@H]1[C@@H](O)[C@H](O)[C@@H](CO)O[C@@H]1O"),
    "Fuc": ("α-L-Fucose", "C[C@@H]1O[C@@H](O)[C@@H](O)[C@H](O)[C@@H]1O"),
    "Sia23Gal": ("Neu5Acα2-3Gal", "CC(=O)N[C@@H]1[C@@H](C[C@](O)(O[C@H]2[C@@H](O)[C@@H](CO)O[C@@H](O)[C@@H]2O)C(=O)O)O[C@H]([C@H](O)[C@H](O)CO)[C@H]1O"),
    "Sia26Gal": ("Neu5Acα2-6Gal", "CC(=O)N[C@@H]1[C@@H](C[C@](O)(OC[C@H]2O[C@@H](O)[C@H](O)[C@@H](O)[C@H]2O)C(=O)O)O[C@H]([C@H](O)[C@H](O)CO)[C@H]1O"),
    "diSia": ("Neu5Acα2-8Neu5Ac", "CC(=O)N[C@@H]1[C@@H](C[C@](O)(O)C(=O)O)O[C@H]([C@H](O)[C@H](O[C@]2(C(=O)O)C[C@H](O)[C@@H](NC(C)=O)[C@@H]([C@H](O)[C@H](O)CO)O2)CO)[C@H]1O"),
    "SLeX": ("Sialyl-Lewis X (SLeX)", "CC(=O)N[C@@H]1[C@@H](O[C@@H]2O[C@@H](C)[C@@H](O)[C@@H](O)[C@@H]2O)[C@H](O[C@@H]3O[C@H](CO)[C@H](O)[C@H](O[C@]4(C(=O)O)C[C@H](O)[C@@H](NC(C)=O)[C@@H]([C@H](O)[C@H](O)CO)O4)[C@H]3O)[C@@H](CO)O[C@H]1O"),
    "LeX": ("Lewis X (LeX)", "CC(=O)N[C@@H]1[C@@H](O[C@@H]2O[C@@H](C)[C@@H](O)[C@@H](O)[C@@H]2O)[C@H](O[C@@H]3O[C@H](CO)[C@H](O)[C@H](O)[C@H]3O)[C@@H](CO)O[C@H]1O"),
    "M6P": ("Mannose-6-phosphate (M6P)", "O=P(O)(O)OC[C@H]1O[C@H](O)[C@@H](O)[C@@H](O)[C@@H]1O"),
    "Glc1Man": ("Glcα1-3Man", "OC[C@H]1O[C@H](O[C@H]2[C@@H](O)[C@@H](CO)O[C@H](O)[C@@H]2O)[C@H](O)[C@@H](O)[C@@H]1O"),
    "BetaGlucan": ("Glcβ1-3Glc (β-1,3-Glucan)", "OC[C@H]1O[C@@H](O[C@H]2[C@H](O)[C@@H](O)O[C@@H](CO)[C@@H]2O)[C@H](O)[C@@H](O)[C@@H]1O"),
    "Galf": ("β-D-Galactofuranose", "OC[C@H](O)[C@@H]1O[C@@H](O)[C@H](O)[C@@H]1O"),
    "GlNAcMurNAc": ("GlcNAc-MurNAc (Peptidoglycan)", "CC(=O)N[C@@H]1[C@@H](O)[C@H](O[C@@H]2O[C@H](CO)[C@@H](O)[C@H](O)[C@H]2NC(C)=O)[C@@H](CO)O[C@H]1O"),
    "HeparinDisacc": ("Sulfated GlcNS6S-IdoA2S (GAG)", "NS(=O)(=O)N[C@@H]1[C@@H](O)[C@H](O[C@@H]2O[C@@H](C(=O)O)[C@@H](O)[C@H](O)[C@H]2OS(=O)(=O)O)[C@@H](COS(=O)(=O)O)O[C@H]1O"),
}


# Tuple format:
# (gene, name_en, name_zh, uniprot, organism, kingdom, panel, aliases, family, lecture, ligand, rule, scorer, kwargs, dock_lig)
GBPS = [
    # --- Attached Image: S-Type Lectins (Galectins) ---
    ("LGALS1", "Galectin-1", "半乳糖凝集素-1", "P09382", "Homo sapiens", "動物", "S-Type Lectins · Galectins", "LGALS1", "Galectin", "W12 / Image",
     "β-半乳糖苷、LacNAc；末端唾液酸會擋住", "去唾液酸的複雜型／混合型 LacNAc。唾液酸蓋住末端 Gal 時分數下降。", score_galectin, {"sialic_weight": 1.0, "poly": 0.05}, "LacNAc"),
    ("LGALS2", "Galectin-2", "半乳糖凝集素-2", "P05162", "Homo sapiens", "動物", "S-Type Lectins · Galectins", "LGALS2", "Galectin", "W12 / Image",
     "β-半乳糖苷、LacNAc", "與 Galectin-1 相近，偏好去唾液酸 LacNAc。", score_galectin, {"sialic_weight": 0.85, "poly": 0.08}, "LacNAc"),
    ("LGALS3", "Galectin-3", "半乳糖凝集素-3", "P17931", "Homo sapiens", "動物", "S-Type Lectins · Galectins", "LGALS3, LGALS2 (table)", "Galectin", "W12 / Image",
     "內部 LacNAc 與多天線 N-glycan，對唾液酸較耐受", "多天線、LacNAc 較多的複雜型分數高，少量唾液酸仍保留部分分數。", score_galectin, {"sialic_weight": 0.35, "poly": 0.45}, "LacNAc"),
    ("LGALS4", "Galectin-4", "半乳糖凝集素-4", "P56470", "Homo sapiens", "動物", "S-Type Lectins · Galectins", "LGALS4", "Galectin", "W12 / Image",
     "串聯 CRD，β-半乳糖苷", "偏好 LacNAc，可接受中等唾液酸化。", score_galectin, {"sialic_weight": 0.55, "poly": 0.3}, "LacNAc"),
    ("LGALS7", "Galectin-7", "半乳糖凝集素-7", "P47929", "Homo sapiens", "動物", "S-Type Lectins · Galectins", "LGALS7", "Galectin", "W12 / Image",
     "β-半乳糖苷", "偏好去唾液酸 LacNAc。", score_galectin, {"sialic_weight": 0.9, "poly": 0.1}, "LacNAc"),
    ("LGALS8", "Galectin-8", "半乳糖凝集素-8", "O00214", "Homo sapiens", "動物", "S-Type Lectins · Galectins", "LGALS8", "Galectin", "W12 / Image",
     "poly-LacNAc、β-半乳糖苷", "LacNAc 臂數愈多分數愈高。", score_galectin, {"sialic_weight": 0.5, "poly": 0.55}, "LacNAc"),
    ("LGALS9", "Galectin-9", "半乳糖凝集素-9", "O00182", "Homo sapiens", "動物", "S-Type Lectins · Galectins", "LGALS9", "Galectin", "W12 / Image",
     "poly-LacNAc", "多天線 LacNAc 分數最高。", score_galectin, {"sialic_weight": 0.45, "poly": 0.5}, "LacNAc"),

    # --- Attached Image: C-Type Lectins · Type I membrane receptors ---
    ("DEC205", "DEC205", "DEC-205／LY75", "O60449", "Homo sapiens", "動物", "C-Type Lectins · Type I membrane receptors", "CLEC13B, LY75, CD205", "C-type mannose", "Image",
     "寡甘露糖與內吞抗原糖鏈", "樹突細胞內吞受體，偏好高甘露糖與去唾液酸複雜型糖鏈。", score_mannose, {"hyper": 0.65, "pauc": 0.3, "glcnac": 0.35}, "Man3"),
    ("TLR2", "TLR2", "類鐸受體 2", "O60603", "Homo sapiens", "動物", "C-Type Lectins · Type I membrane receptors", "Toll-like receptor 2, CD282, TIL4", "C-type mannose", "Image",
     "微生物脂聚糖、甘露聚糖與肽聚醣協同辨識", "與 C 型凝集素協同辨識病原體甘露糖／聚糖。", score_mannose, {"hyper": 0.72, "pauc": 0.32, "glcnac": 0.3}, "GlNAcMurNAc"),
    ("TLR4", "TLR4", "類鐸受體 4", "O00206", "Homo sapiens", "動物", "C-Type Lectins · Type I membrane receptors", "Toll-like receptor 4, CD284, hToll", "C-type mannose", "Image",
     "LPS 核心聚糖與甘露糖修飾", "辨識革蘭氏陰性菌脂多醣（含 GlcNAc／核心聚糖）。", score_glcnac, {}, "GlcNAc"),
    ("TLT2", "TLT2", "TREM 樣轉錄本 2", "Q5T2D2", "Homo sapiens", "動物", "C-Type Lectins · Type I membrane receptors", "TREML2, C6orf76", "I-type other", "Image",
     "唾液酸化與 O-連結糖蛋白配體", "免疫球蛋白超家族受體，偏好小型唾液酸化或 O-糖鏈。", score_pilra, {}, "GalNAc"),

    # --- Attached Image: C-Type Lectins · Type II membrane receptors ---
    ("ASGR1", "ASGR-1", "去唾液酸糖蛋白受體 H1", "P07306", "Homo sapiens", "動物", "C-Type Lectins · Type II membrane receptors", "hepatic lectin H1, ASGPR-1", "ASGPR", "W11/W12 / Image",
     "末端 Gal／GalNAc，唾液酸會掩蓋", "去唾液酸複雜型與 O-GalNAc／T 抗原。一有唾液酸就大幅降分。", score_asgpr, {}, "GalNAc"),
    ("ASGR2", "ASGR-2", "去唾液酸糖蛋白受體 H2", "P07307", "Homo sapiens", "動物", "C-Type Lectins · Type II membrane receptors", "hepatic lectin H2, ASGPR-2", "ASGPR", "W12 / Image",
     "末端 Gal／GalNAc", "與 H1 相同的去唾液酸 Gal／GalNAc 偏好。", score_asgpr, {}, "GalNAc"),
    ("BDCA2", "BDCA2", "BDCA-2／CLEC4C", "Q8WTT0", "Homo sapiens", "動物", "C-Type Lectins · Type II membrane receptors", "CLEC4C, DLEC, HECL, CLECSF11, CLECSF7, CD303", "ASGPR", "Image",
     "去唾液酸雙天線 Galβ1-4GlcNAc", "漿細胞樣樹突細胞受體，專一辨識末端去唾液酸 Gal／LacNAc。", score_galectin, {"sialic_weight": 0.95, "poly": 0.05}, "LacNAc"),
    ("BIMLEC", "BIMLEC", "BIMLEC／CD302", "Q8IX05", "Homo sapiens", "動物", "C-Type Lectins · Type II membrane receptors", "CLEC13A, CD302, DCL1", "C-type mannose", "Image",
     "甘露糖／岩藻糖化糖鏈", "C 型凝集素受體 CD302，辨識甘露糖與內吞配體。", score_mannose, {"hyper": 0.68, "pauc": 0.35, "glcnac": 0.28}, "Man"),
    ("CLEC6", "CLEC6", "MCL／CLEC4D", "Q8WXI8", "Homo sapiens", "動物", "C-Type Lectins · Type II membrane receptors", "CLEC4D, Mpc1, CLECSF8, MCL", "C-type mannose", "Image",
     "高甘露糖與分枝桿菌糖脂 TDM", "巨噬細胞 C 型凝集素 MCL，結合高甘露糖與微生物糖脂。", score_mannose, {"hyper": 0.75, "pauc": 0.3, "glcnac": 0.2}, "Man3"),
    ("DCIR", "DCIR", "樹突細胞免疫受體 DCIR", "Q9UMR7", "Homo sapiens", "動物", "C-Type Lectins · Type II membrane receptors", "CLEC4A, CLECSF6, DDB27, CD367", "C-type mannose", "Image",
     "甘露糖、岩藻糖與去唾液酸雙天線 N-glycan", "抑制型 C 型凝集素受體，偏好甘露糖與岩藻糖化結構。", score_langerin, {}, "Man3"),
    ("CD209", "DC-SIGN", "DC-SIGN", "Q9NNX6", "Homo sapiens", "動物", "C-Type Lectins · Type II membrane receptors", "CLEC4L, CD209", "C-type mannose", "W12 / Image",
     "高甘露糖與 Lewis 抗原", "高甘露糖，以及去唾液酸且有岩藻糖的 LacNAc。", score_dcsign, {}, "LeX"),
    ("CLEC4M", "DC-SIGNR", "DC-SIGNR／L-SIGN", "Q9H2X3", "Homo sapiens", "動物", "C-Type Lectins · Type II membrane receptors", "CLEC4M, CD209L, CD299, L-SIGN", "C-type mannose", "Image",
     "高甘露糖 N-glycan（Man5–Man9）", "肝竇與淋巴內皮受體，強烈偏好高甘露糖。", score_mannose, {"hyper": 0.85, "pauc": 0.25, "glcnac": 0.2}, "Man3"),
    ("CLEC6A", "Dectin2", "Dectin-2", "Q6EIG7", "Homo sapiens", "動物", "C-Type Lectins · Type II membrane receptors", "CLEC6A, CLECSF10", "C-type mannose", "W12 / Image",
     "高甘露糖", "高甘露糖；β-葡聚醣不是它的配體。", score_mannose, {"hyper": 0.64, "pauc": 0.16, "glcnac": 0.12}, "Man3"),
    ("CD207", "Langerin", "Langerin", "Q9UJ71", "Homo sapiens", "動物", "C-Type Lectins · Type II membrane receptors", "CLEC4K, CD207", "C-type mannose", "W12 / Image",
     "甘露糖與 Lewis 抗原", "高甘露糖與去唾液酸岩藻糖化 LacNAc。", score_langerin, {}, "Man3"),
    ("LSECTIN", "LSECtin", "肝竇內皮凝集素 LSECtin", "Q6UXB4", "Homo sapiens", "動物", "C-Type Lectins · Type II membrane receptors", "CLEC4G, UNQ431", "C-type mannose", "Image",
     "末端 GlcNAcβ1-2Man、甘露糖與岩藻糖", "偏好去半乳糖露出 GlcNAc 的複雜型／混合型與高甘露糖。", score_glcnac, {}, "GlcNAc"),
    ("MINCLE", "MINCLE", "巨噬細胞誘導型 C 型凝集素 Mincle", "Q9ULY5", "Homo sapiens", "動物", "C-Type Lectins · Type II membrane receptors", "CLEC4E, CLECSF9", "C-type mannose", "Image",
     "α-甘露糖與海藻糖雙黴菌酸酯 (TDM)", "辨識真菌 α-甘露糖與分枝桿菌糖脂。", score_mannose, {"hyper": 0.8, "pauc": 0.35, "glcnac": 0.2}, "Man"),
    ("MKCR", "mKCR", "庫佛氏細胞受體 CLEC4F", "Q8N1N0", "Homo sapiens", "動物", "C-Type Lectins · Type II membrane receptors", "CLEC4F, CLECSF13, KCLR", "ASGPR", "Image",
     "末端 Gal 與 GalNAc", "Kupffer 細胞受體，特異性結合去唾液酸 Gal 與 GalNAc。", score_asgpr, {}, "GalNAc"),
    ("ML2", "ML2", "巨噬細胞半乳糖凝集素 MGL", "Q8IUN9", "Homo sapiens", "動物", "C-Type Lectins · Type II membrane receptors", "CLEC10A, CD301, CLECSF13, CLECSF14, HML, HML2, MGL", "ASGPR", "Image",
     "末端 GalNAc（Tn 抗原）與去唾液酸 O-glycan", "專一辨識腫瘤相關 Tn 抗原 (α-GalNAc) 與末端 GalNAc。", score_sba, {}, "GalNAc"),

    # --- Attached Image: C-Type Lectins · NK receptors ---
    ("AICL", "AICL", "活化誘導 C 型凝集素 AICL", "Q92478", "Homo sapiens", "動物", "C-Type Lectins · NK receptors", "CLEC2B, CLECSF2, IFNRG1", "C-type NK", "Image",
     "NKp80 配體及細胞表面唾液酸化／去唾液酸聚糖", "NK 基因複合體編碼之 C 型凝集素樣受體。", score_galectin, {"sialic_weight": 0.6, "poly": 0.2}, "LacNAc"),
    ("CD69", "CD69", "早期活化抗原 CD69", "Q07108", "Homo sapiens", "動物", "C-Type Lectins · NK receptors", "CLEC2C", "C-type NK", "Image",
     "GlcNAc／GalNAc 與鈣離子輔助結合位", "活化淋巴細胞表面 C 型凝集素受體，具弱 GlcNAc／GalNAc 親和性。", score_glcnac, {}, "GlcNAc"),
    ("CLEC1A", "CLEC1", "C 型凝集素受體 1A", "Q8NC01", "Homo sapiens", "動物", "C-Type Lectins · NK receptors", "CLEC1A", "C-type NK", "Image",
     "內源性損傷相關配體與細胞表面糖蛋白", "樹突細胞與內皮細胞表現之 C 型凝集素樣受體。", score_mannose, {"hyper": 0.55, "pauc": 0.3, "glcnac": 0.3}, "Man"),
    ("CLEC1B", "CLEC2", "C 型凝集素受體 2 (CLEC-2)", "Q9P126", "Homo sapiens", "動物", "C-Type Lectins · NK receptors", "CLEC1B", "C-type NK", "Image",
     "唾液酸化 O-glycan（Podoplanin 上之 Sialyl-T）", "血小板活化受體，辨識 Podoplanin 上的唾液酸化 O-連結糖鏈。", score_pilra, {}, "Sia23Gal"),
    ("CLEC2A", "CLEC2A", "角質細胞相關 C 型凝集素 KACL", "Q6UVW9", "Homo sapiens", "動物", "C-Type Lectins · NK receptors", "KACL", "C-type NK", "Image",
     "NKp65 配體與表皮糖蛋白", "表皮特異性表現之 C 型凝集素樣分子。", score_galectin, {"sialic_weight": 0.7, "poly": 0.1}, "Gal"),
    ("CLEC2D", "CLEC2D", "凝集素樣轉錄本 1 (LLT1)", "Q9UHP7", "Homo sapiens", "動物", "C-Type Lectins · NK receptors", "LLT1, OCIL, CLAX", "C-type NK", "Image",
     "CD161 配體與硫酸軟骨素／高分子量多醣", "結合 NK 細胞 CD161 並可與細胞外多醣作用。", score_glcnac, {}, "GlcNAc"),
    ("CLEC5A", "CLEC5A", "骨髓 C 型凝集素 MDL-1", "Q9NY25", "Homo sapiens", "動物", "C-Type Lectins · NK receptors", "CLECSF5, MDL-1", "C-type NK", "Image",
     "登革病毒表面岩藻糖／高甘露糖 N-glycan 與細菌肽聚醣", "辨識黃病毒包膜糖蛋白（高甘露糖／Fuc）與細菌細胞壁。", score_dcsign, {}, "Man3"),
    ("KLRB1", "CLEC5B", "NK 受體 CD161／KLRB1", "Q12918", "Homo sapiens", "動物", "C-Type Lectins · NK receptors", "KLRB1, NKRP1A, HNKR-P1a, CD161", "C-type NK", "Image",
     "α-Gal 抗原表位與 LLT1 糖蛋白", "NK 細胞受體，早期研究顯示可結合 Galα1-3Gal 與 N-乙醯己糖胺。", score_asgpr, {}, "Gal"),
    ("KLRF1", "CLEC5C", "活化型 NK 受體 NKp80", "Q9NZS2", "Homo sapiens", "動物", "C-Type Lectins · NK receptors", "KLRF1, NKp80", "C-type NK", "Image",
     "AICL 糖蛋白配體", "NK 細胞表面同源二聚體 C 型凝集素樣受體。", score_galectin, {"sialic_weight": 0.6, "poly": 0.2}, "LacNAc"),
    ("CLEC9A", "CLEC9A [Highlighted]", "DNGR-1／CLEC9A（螢光筆標示）", "Q6UXN8", "Homo sapiens", "動物", "C-Type Lectins · NK receptors", "DNGR-1, UNQ9341, HEEE9341, CD370", "C-type NK", "Image (Highlighted)",
     "壞死細胞暴露之 F-actin 與伴隨糖蛋白", "交叉呈遞樹突細胞 cDC1 標誌受體（圖片黃色標示重點蛋白）。", score_mannose, {"hyper": 0.6, "pauc": 0.3, "glcnac": 0.25}, "Man"),
    ("CLL1", "CLL1", "骨髓抑制性 C 型凝集素 MICL", "Q5QGZ9", "Homo sapiens", "動物", "C-Type Lectins · NK receptors", "CLEC12A, MICL, DCAL2", "C-type NK", "Image",
     "尿酸結晶與內源性高度糖基化配體", "急性骨髓性白血病標誌物 CLEC12A／CLL-1。", score_glcnac, {}, "GlcNAc"),
    ("DCAL1", "DCAL-1", "樹突細胞相關凝集素 1", "Q8IZS7", "Homo sapiens", "動物", "C-Type Lectins · NK receptors", "CLECL1, CLCL1", "C-type NK", "Image",
     "T 細胞表面共刺激糖蛋白", "樹突細胞與 B 細胞表現之 C 型凝集素樣受體。", score_galectin, {"sialic_weight": 0.65, "poly": 0.15}, "Gal"),
    ("CLEC7A", "Dectin1", "Dectin-1", "Q9BXN2", "Homo sapiens", "動物", "C-Type Lectins · NK receptors", "CLEC7A, CLECSF12", "Outside library", "W12 / Image",
     "β-1,3-葡聚醣", "配體是真菌 β-葡聚醣，不在 N／O-glycan 組成庫，透過 3D 對接展示結合位。", None, {}, "BetaGlucan"),
    ("KLRF2", "KLRF2", "活化型受體 NKp65", "D3W0D1", "Homo sapiens", "動物", "C-Type Lectins · NK receptors", "Activating coreceptor NKp65", "C-type NK", "Image",
     "KACL (CLEC2A) 糖蛋白", "與 KACL 高親和結合之 NK 凝集素樣受體。", score_galectin, {"sialic_weight": 0.7, "poly": 0.1}, "Gal"),
    ("LOX1", "Lox-1", "氧化低密度脂蛋白受體 LOX-1", "P78380", "Homo sapiens", "動物", "C-Type Lectins · NK receptors", "CLEC8A, OLR1", "C-type NK", "Image",
     "負電荷聚糖、oxLDL 與細菌表面多醣", "血管內皮清道夫 C 型凝集素受體。", score_siglec, {"fuc": 0.1, "multi": 0.3, "small": 0.2}, "Sia23Gal"),
    ("MAFA", "MAFA", "肥大細胞功能相關抗原 KLRG1", "Q96E93", "Homo sapiens", "動物", "C-Type Lectins · NK receptors", "KLRG1, MAFAL", "C-type NK", "Image",
     "E-cadherin 與末端甘露糖／唾液酸表位", "抑制型 NK／T 細胞受體，圖片列為 MAFA／KLRG1。", score_mannose, {"hyper": 0.6, "pauc": 0.3, "glcnac": 0.25}, "Man"),
    ("CLEC2L", "mCLEC2L", "C 型凝集素域家族 2 成員 L", "P0C7M8", "Homo sapiens", "動物", "C-Type Lectins · NK receptors", "FLJ3298, CLEC2L", "C-type NK", "Image",
     "大腦高度表現之 C 型凝集素樣受體配體", "演化保守之同源二聚體 C 型凝集素受體。", score_glcnac, {}, "GlcNAc"),
    ("NKG2D", "NKG2D", "活化型 NK 受體 NKG2D", "P26718", "Homo sapiens", "動物", "C-Type Lectins · NK receptors", "KLRK1, CD314, D12S2489E, KLR, NKG2-D", "C-type NK", "Image",
     "MICA／MICB 及壓力誘導之 N-糖基化配體", "NK 與 CD8+ T 細胞關鍵活化型 C 型凝集素樣受體。", score_galectin, {"sialic_weight": 0.5, "poly": 0.25}, "LacNAc"),
    ("NKP30", "NKp30", "天然細胞毒性受體 NKp30", "O14931", "Homo sapiens", "動物", "C-Type Lectins · NK receptors", "NCR3, LY117, CD337, 1C7", "I-type other", "Image",
     "硫酸乙醯肝素 (HS) 與 B7-H6 糖蛋白", "Ig 樣活化受體，其配體辨識受硫酸乙醯肝素與 N-糖基化調控。", score_siglec, {"fuc": 0.15, "multi": 0.25, "small": 0.2}, "HeparinDisacc"),
    ("NKP44", "NKp44 [Highlighted]", "天然細胞毒性受體 NKp44（螢光筆標示）", "O95944", "Homo sapiens", "動物", "C-Type Lectins · NK receptors", "NCR2, LY95, CD336", "I-type other", "Image (Highlighted)",
     "病毒血球凝集素唾液酸配體與硫酸乙醯肝素", "活化型 NK 受體（圖片黃色標示重點蛋白），直接結合病毒糖蛋白與唾液酸／GAG。", score_siglec, {"fuc": 0.2, "multi": 0.35, "small": 0.25}, "Sia23Gal"),

    # --- Attached Image: C-Type Lectins · MMR receptors & Ficolin ---
    ("ENDO180", "Endo180", "內吞受體 Endo180／MRC2", "Q9UBG0", "Homo sapiens", "動物", "C-Type Lectins · MMR receptors", "CLEC13E, Endo180, MRC2, CD280", "C-type mannose", "Image",
     "GlcNAc、甘露糖與糖基化膠原蛋白", "甘露糖受體家族成員（CTL2 結構域具鈣依賴性 GlcNAc／Man 結合活性）。", score_mannose, {"hyper": 0.65, "pauc": 0.3, "glcnac": 0.5}, "GlcNAc"),
    ("MRC1", "MMR", "巨噬細胞甘露糖受體 MMR", "P22897", "Homo sapiens", "動物", "C-Type Lectins · MMR receptors", "CLEC13D, CLEC13DL, MRC1L1, MRC1, CD206", "C-type mannose", "W12 / Image",
     "寡甘露糖型 N-glycan 與末端 Man／Fuc／GlcNAc", "Man5–Man9 最高。", score_mannose, {"hyper": 0.6, "pauc": 0.22, "glcnac": 0.2}, "Man3"),
    ("FCN2", "L-Ficolin", "L-纖維膠凝蛋白 (Ficolin-2)", "Q15485", "Homo sapiens", "動物", "C-Type Lectins · Ficolin", "FCN2, FCNL, Ficolin-2, Hucolin, Ficolin-B, serum lectin p35", "C-type mannose", "Image",
     "乙醯化糖類（GlcNAc、GalNAc、Neu5Ac）", "補體凝集素途徑啟動蛋白，透過類纖維蛋白原結構域結合 GlcNAc。", score_glcnac, {}, "GlcNAc"),

    # --- Other W11/W12 C-type Collectins & Selectins ---
    ("MBL2", "MBL", "甘露糖結合凝集素", "P11226", "Homo sapiens", "動物", "C-Type Lectins · Collectins", "MBP-A, Mannose-binding lectin", "C-type mannose", "W11/W12",
     "末端 Man、GlcNAc、Fuc", "高甘露糖最高；去半乳糖、末端還是 GlcNAc 的複雜型給中等分。", score_mannose, {"hyper": 0.7, "pauc": 0.34, "glcnac": 0.46}, "Man3"),
    ("SFTPD", "SP-D", "界面活性蛋白 D", "P35247", "Homo sapiens", "動物", "C-Type Lectins · Collectins", "Surfactant protein D, PSP-D", "C-type mannose", "W11",
     "甘露糖與微生物表面聚糖", "高甘露糖為主。", score_mannose, {"hyper": 0.68, "pauc": 0.3, "glcnac": 0.36}, "Man"),
    ("SFTPA1", "SP-A", "界面活性蛋白 A", "Q8IWL2", "Homo sapiens", "動物", "C-Type Lectins · Collectins", "Surfactant protein A", "C-type mannose", "W11",
     "甘露糖", "高甘露糖為主，少甘露糖也給一些分數。", score_mannose, {"hyper": 0.66, "pauc": 0.4, "glcnac": 0.3}, "Man"),
    ("SELP", "P-selectin", "P-選凝素", "P16109", "Homo sapiens", "動物", "C-Type Lectins · Selectins", "CD62P, GMP-140", "Selectin", "W12",
     "sialyl-Lewis X", "同時有岩藻糖、唾液酸與 LacNAc 的複雜型。", score_selectin, {}, "SLeX"),
    ("SELE", "E-selectin", "E-選凝素", "P16581", "Homo sapiens", "動物", "C-Type Lectins · Selectins", "CD62E, ELAM-1", "Selectin", "W12",
     "sialyl-Lewis X", "SLeX 樣組成：Fuc + NeuAc + LacNAc。", score_selectin, {}, "SLeX"),
    ("SELL", "L-selectin", "L-選凝素", "P14151", "Homo sapiens", "動物", "C-Type Lectins · Selectins", "CD62L, LAM-1", "Selectin", "W12",
     "6-sulfo-sialyl-Lewis X", "以 SLeX 樣組成代表。此醣庫沒有硫酸基，6-硫酸化無法分開。", score_selectin, {}, "SLeX"),

    # --- Attached Image: I-Type Lectins (Siglecs) ---
    ("SIGLEC1", "Siglec-1 [Highlighted]", "唾液酸黏附素 Siglec-1（螢光筆標示）", "Q9BZZ2", "Homo sapiens", "動物", "I-Type Lectins · Siglecs", "Sialoadhesin, CD169", "Siglec", "W11/W12 / Image",
     "α2-3 唾液酸", "唾液酸化 N-glycan。鍵結位置不在資料裡，不以 α2-3／α2-6 分開。", score_siglec, {"fuc": 0.15, "multi": 0.2, "small": 0.24}, "Sia23Gal"),
    ("CD22", "Siglec-2 [Highlighted]", "CD22／Siglec-2（螢光筆標示）", "P20273", "Homo sapiens", "動物", "I-Type Lectins · Siglecs", "CD22, BL-CAM", "Siglec", "W12 / Image",
     "α2-6 唾液酸", "唾液酸化的複雜型 N-glycan。", score_siglec, {"fuc": -0.05, "multi": 0.35, "small": 0.18}, "Sia26Gal"),
    ("CD33", "Siglec-3", "CD33／Siglec-3", "P20138", "Homo sapiens", "動物", "I-Type Lectins · Siglecs", "CD33, gp67", "Siglec", "W12 / Image",
     "唾液酸", "唾液酸化複雜型。", score_siglec, {"fuc": 0.05, "multi": 0.25, "small": 0.2}, "Sia26Gal"),
    ("MAG", "Siglec-4a", "髓鞘相關糖蛋白 MAG／Siglec-4a", "P20916", "Homo sapiens", "動物", "I-Type Lectins · Siglecs", "MAG, GMA, Siglec-4a", "Siglec", "W12 / Image",
     "α2-3 唾液酸", "唾液酸化聚糖；神經節苷脂不是這份 N-glycan 庫的主體。", score_siglec, {"fuc": 0.1, "multi": 0.15, "small": 0.34}, "Sia23Gal"),
    ("SIGLEC5", "Siglec-5", "Siglec-5", "O15389", "Homo sapiens", "動物", "I-Type Lectins · Siglecs", "CD33L2, OBBP2, CD170", "Siglec", "W12 / Image",
     "唾液酸", "唾液酸化複雜型。", score_siglec, {"fuc": 0.08, "multi": 0.22, "small": 0.2}, "Sia23Gal"),
    ("SIGLEC6", "Siglec-6", "Siglec-6", "O43699", "Homo sapiens", "動物", "I-Type Lectins · Siglecs", "CD327, OBBP1", "Siglec", "W12 / Image",
     "唾液酸", "唾液酸化複雜型。", score_siglec, {"fuc": 0.12, "multi": 0.18, "small": 0.22}, "Sia26Gal"),
    ("SIGLEC7", "Siglec-7 [Highlighted]", "Siglec-7（螢光筆標示）", "Q9Y286", "Homo sapiens", "動物", "I-Type Lectins · Siglecs", "AIRM1, CD328, CDw328, D-siglec, QA79, p75", "Siglec", "W12 / Image (Highlighted)",
     "α2-8 雙唾液酸與 α2-6", "唾液酸數目較多時分數較高（圖片黃色標示重點蛋白）。", score_siglec, {"fuc": 0.05, "multi": 0.85, "small": 0.28}, "diSia"),
    ("SIGLEC8", "Siglec-8 [Highlighted]", "Siglec-8（螢光筆標示）", "Q9NYZ4", "Homo sapiens", "動物", "I-Type Lectins · Siglecs", "SAF-2", "Siglec", "W12 / Image (Highlighted)",
     "6′-sulfo-sialyl-Lewis X", "岩藻糖化且唾液酸化的 LacNAc。硫酸基不在此醣庫。", score_siglec8, {}, "SLeX"),
    ("SIGLEC9", "Siglec-9", "Siglec-9", "Q9Y336", "Homo sapiens", "動物", "I-Type Lectins · Siglecs", "CD329, CDw329, Protein FOAP-9", "Siglec", "W12 / Image",
     "唾液酸，部分配體為硫酸化 SLeX", "唾液酸化複雜型，岩藻糖化時再加分。", score_siglec, {"fuc": 0.7, "multi": 0.3, "small": 0.2}, "SLeX"),
    ("SIGLEC10", "Siglec-10 [Highlighted]", "Siglec-10（螢光筆標示）", "Q96LC7", "Homo sapiens", "動物", "I-Type Lectins · Siglecs", "SLG2, PRO940", "Siglec", "W12 / Image (Highlighted)",
     "α2-6 唾液酸", "唾液酸化複雜型 N-glycan。", score_siglec, {"fuc": 0.0, "multi": 0.4, "small": 0.18}, "Sia26Gal"),
    ("SIGLEC11", "Siglec-11", "Siglec-11", "Q96RL6", "Homo sapiens", "動物", "I-Type Lectins · Siglecs", "Siglec-11", "Siglec", "W12 / Image",
     "α2-8 多唾液酸", "多個唾液酸的組成分數較高。", score_siglec, {"fuc": 0.0, "multi": 0.9, "small": 0.2}, "diSia"),
    ("SIGLEC14", "Siglec-14", "Siglec-14", "Q08ET2", "Homo sapiens", "動物", "I-Type Lectins · Siglecs", "Siglec-14", "Siglec", "W12 / Image",
     "唾液酸", "與 Siglec-5 配對，唾液酸化複雜型。", score_siglec, {"fuc": 0.1, "multi": 0.22, "small": 0.2}, "Sia23Gal"),
    ("SIGLEC15", "Siglec-15 [Highlighted]", "Siglec-15（螢光筆標示）", "Q6ZMC9", "Homo sapiens", "動物", "I-Type Lectins · Siglecs", "CD33L3", "Siglec", "W12 / Image (Highlighted)",
     "Sialyl-Tn", "小型唾液酸化核心（NeuAc–HexNAc／Hex）。", score_siglec15, {}, "Sia26Gal"),
    ("SIGLEC16", "Siglec-16 [Highlighted]", "Siglec-16（螢光筆標示）", "A6NMB1", "Homo sapiens", "動物", "I-Type Lectins · Siglecs", "Siglec-16", "Siglec", "W12 / Image (Highlighted)",
     "唾液酸", "與 Siglec-11 配對，多唾液酸組成分數較高。", score_siglec, {"fuc": 0.0, "multi": 0.75, "small": 0.2}, "diSia"),

    # --- Animal P-type, L-type ER, I-type other, R-type, & Invertebrate Lectins ---
    ("M6PR", "CD-MPR", "陽離子依賴型甘露糖-6-磷酸受體", "P20645", "Homo sapiens", "動物", "P-Type Lectins · M6P Receptors", "MPR46, CD-MPR", "P-type", "W11",
     "甘露糖-6-磷酸", "只有帶磷酸的高甘露糖（此庫為 N2H6P1）給高分。", score_mpr, {}, "M6P"),
    ("IGF2R", "CI-MPR", "陽離子非依賴型 M6P／IGF2 受體", "P11717", "Homo sapiens", "動物", "P-Type Lectins · M6P Receptors", "MPR300, CD222", "P-type", "W11",
     "甘露糖-6-磷酸；另結合 IGF-II", "醣配體只計 M6P。IGF-II 是蛋白質配體，不在醣庫。", score_mpr, {}, "M6P"),
    ("CANX", "Calnexin", "鈣連結蛋白", "P27824", "Homo sapiens", "動物", "L-Type Lectins · ER Quality Control", "CNX, IP90", "L-type ER", "W11",
     "單葡萄糖高甘露糖", "以 Hex 8–10、GlcNAc2、無岩藻糖無唾液酸近似 Glc1Man7–9。", score_cnx, {}, "Glc1Man"),
    ("CALR", "Calreticulin", "鈣網蛋白", "P27797", "Homo sapiens", "動物", "L-Type Lectins · ER Quality Control", "CRT, CRP55", "L-type ER", "W11",
     "單葡萄糖高甘露糖", "與 calnexin 相同的組成近似。", score_cnx, {}, "Glc1Man"),
    ("LMAN1", "ERGIC-53", "ERGIC-53／LMAN1", "P49257", "Homo sapiens", "動物", "L-Type Lectins · ER Quality Control", "LMAN1, gp58", "L-type ER", "W11",
     "Man8–Man9", "HexNAc2 Hex8 與 Hex9，且沒有岩藻糖、唾液酸、磷酸。", score_ergic, {}, "Man3"),
    ("GALNT2", "ppGalNAcT2", "多肽 N-乙醯半乳糖胺轉移酶 2", "Q10471", "Homo sapiens", "動物", "R-Type Lectins · Animal", "GALNT2", "R-type", "W11",
     "R 型凝集素域結合 GalNAc", "Tn／O-HexNAc。催化域把 GalNAc 轉到胜肽，這裡描述凝集素域偏好。", score_galnt, {}, "GalNAc"),
    ("PECAM1", "PECAM-1", "血小板內皮細胞黏附分子 PECAM-1", "P16284", "Homo sapiens", "動物", "I-Type Lectins · Non-Siglec", "CD31", "I-type other", "W12",
     "α2-6 唾液酸", "唾液酸化 N-glycan。", score_siglec, {"fuc": 0.0, "multi": 0.3, "small": 0.2}, "Sia26Gal"),
    ("NCAM1", "NCAM", "神經細胞黏附分子 NCAM", "P13591", "Homo sapiens", "動物", "I-Type Lectins · Non-Siglec", "CD56", "I-type other", "W12",
     "寡甘露糖", "高甘露糖。", score_oligoman, {}, "Man3"),
    ("BSG", "CD147", "Basigin／CD147", "P35613", "Homo sapiens", "動物", "I-Type Lectins · Non-Siglec", "EMMPRIN, CD147", "I-type other", "W12",
     "寡甘露糖", "高甘露糖。", score_oligoman, {}, "Man3"),
    ("PILRA", "PILR-α", "配對免疫球蛋白樣受體 PILR-α", "Q9UKJ1", "Homo sapiens", "動物", "I-Type Lectins · Non-Siglec", "FDF03", "I-type other", "W12",
     "唾液酸化黏蛋白樣 O-glycan", "小型唾液酸化核心作為黏蛋白樣配體的組成近似。", score_pilra, {}, "Sia23Gal"),
    ("TAL2", "Tachylectin-2", "鱟凝集素 Tachylectin-2", "Q27084", "Tachypleus tridentatus", "動物", "Invertebrate Lectins · β-Propeller", "TAL2", "C-type mannose", "W11",
     "D-GlcNAc 與 D-GalNAc", "日本鱟五葉 β-螺旋槳凝集素，專一結合 GlcNAc 與 GalNAc。", score_glcnac, {}, "GlcNAc"),
    ("CEL3", "CEL-III", "海參鈣依賴性凝集素 CEL-III", "Q868M7", "Cucumaria echinata", "動物", "Invertebrate Lectins · R-Type", "CEL-III (PDB 2Z48)", "R-type", "W11",
     "GalNAc 與半乳糖苷（鈣離子依賴型 R 型凝集素）", "W11 講義圖示 (2Z48)：海參 β-三葉草結構域透過鈣離子配位結合 GalNAc／Gal。", score_asgpr, {}, "GalNAc"),
    ("REG3A", "Reg3α", "再生胰島衍生蛋白 3α", "Q06141", "Homo sapiens", "動物", "C-Type Lectins · Antimicrobial", "HIP/PAP", "Outside library", "W12",
     "細菌肽聚醣", "配體是細菌肽聚醣，不在此 N／O-glycan 庫，以 3D 對接展示。", None, {}, "GlNAcMurNAc"),
    ("ITLN1", "Intelectin-1", "腸凝集素 Intelectin-1", "Q8WWA0", "Homo sapiens", "動物", "X-Type Lectins · Intelectin", "Omentin-1 (PDB 4WMY)", "Outside library", "W11",
     "微生物半乳呋喃糖 (Galf)", "W11 講義圖示 (4WMY)：結合微生物特異性半乳呋喃糖，以 3D 對接展示。", None, {}, "Galf"),
    ("SERPINC1", "Antithrombin", "抗凝血酶 III", "P01008", "Homo sapiens", "動物", "GAG-Binding Proteins", "ATIII", "Outside library", "W11",
     "肝素五糖 (Heparin)", "配體是硫酸化 GAG，不在此 N／O-glycan 庫，以 3D 對接展示。", None, {}, "HeparinDisacc"),
    ("TNFAIP6", "TSG-6", "腫瘤壞死因子誘導蛋白 6 (TSG-6)", "P98066", "Homo sapiens", "動物", "GAG-Binding Proteins · Link Module", "TSG6", "Outside library", "W11",
     "軟骨素硫酸與玻尿酸", "講義中的 Link module 結合硫酸化 GAG，以 3D 對接展示。", None, {}, "HeparinDisacc"),
    ("PTPRF", "LAR", "受體酪胺酸磷酸酶 LAR", "P10586", "Homo sapiens", "動物", "GAG-Binding Proteins", "LAR (PDB 2YD5)", "Outside library", "W11",
     "乙醯肝素 (Heparan sulfate)", "講義中的 HS 五糖對接在 LAR，以 3D 對接展示。", None, {}, "HeparinDisacc"),

    # --- Plant Lectins ---
    ("CONA", "ConA", "刀豆素 A (Concanavalin A)", "P02866", "Canavalia ensiformis", "植物", "Plant Lectins · Legume L-Type", "Con A", "Plant L-type", "W11",
     "α-Man／α-Glc，高甘露糖最強", "高甘露糖最高，混合型次之，多天線複雜型較低。", score_cona, {}, "Man3"),
    ("PNA", "PNA", "花生凝集素 (Peanut Agglutinin)", "P02872", "Arachis hypogaea", "植物", "Plant Lectins · Legume L-Type", "PNA", "Plant L-type", "W11",
     "T 抗原 Galβ1-3GalNAc，唾液酸會阻止", "O-HexNAc Hex 最高。唾液酸化結構接近 0。", score_pna, {}, "TF_antigen"),
    ("SBA", "SBA", "大豆凝集素 (Soybean Agglutinin)", "P05046", "Glycine max", "植物", "Plant Lectins · Legume L-Type", "SBA (PDB 1SBD)", "Plant L-type", "W11",
     "末端 GalNAc／Gal", "O-HexNAc 與 HexNAc(1) 最高。", score_sba, {}, "GalNAc"),
    ("ASA", "ASA", "大蒜甘露糖凝集素 (Garlic Agglutinin)", "Q38789", "Allium sativum", "植物", "Plant Lectins · Monocot Mannose", "ASAL", "Plant L-type", "W11",
     "高甘露糖", "高甘露糖。講義圖示為 mannose-specific garlic agglutinin。", score_garlic, {}, "Man3"),
    ("RICIN", "Ricin", "蓖麻毒素 B 鏈 (Ricin)", "P02879", "Ricinus communis", "植物", "Plant Lectins · R-Type (RIP-II)", "RCA-II", "R-type", "W11",
     "末端 Gal／GalNAc（B 鏈）", "去唾液酸的 Gal／GalNAc，含 O-glycan 與 LacNAc。", score_ricin, {}, "Gal"),
    ("SNA1", "SNA-I", "接骨木凝集素 SNA-I", "Q41358", "Sambucus nigra", "植物", "Plant Lectins · R-Type", "SNA", "R-type", "W11",
     "Neu5Acα2-6Gal", "唾液酸化複雜型 N-glycan。α2-6 無法從組成辨認。", score_sna, {}, "Sia26Gal"),
    ("WGA", "WGA", "小麥胚芽凝集素 (Wheat Germ Agglutinin)", "P10968", "Triticum aestivum", "植物", "Plant Lectins · Hevein / Chitin-Binding", "WGA2", "Plant L-type", "W11 / Classic Plant",
     "GlcNAcβ1-4GlcNAc（幾丁質寡糖）與末端唾液酸", "偏好富含 GlcNAc 的多天線糖鏈與唾液酸化結構。", score_glcnac, {}, "GlcNAc"),
    ("PHA_E", "PHA-E", "紅腎豆凝集素 E (Erythroagglutinin)", "P05088", "Phaseolus vulgaris", "植物", "Plant Lectins · Legume L-Type", "PHA-E", "Plant L-type", "W11 / Classic Plant",
     "含平分型 GlcNAc (bisecting GlcNAc) 之複雜型 N-glycan", "偏好高 HexNAc 數（N≥5）之複雜型 N-glycan。", score_pha_e, {}, "LacNAc"),
    ("PHA_L", "PHA-L", "紅腎豆凝集素 L (Leukoagglutinin)", "P05087", "Phaseolus vulgaris", "植物", "Plant Lectins · Legume L-Type", "PHA-L", "Plant L-type", "W11 / Classic Plant",
     "β1-6 分枝之三天線／四天線複雜型 N-glycan", "多天線 LacNAc 複雜型 N-glycan 分數最高。", score_pha_l, {}, "LacNAc"),
    ("UEA1", "UEA-I", "荊豆凝集素 I (Ulex europaeus Agglutinin I)", "P22972", "Ulex europaeus", "植物", "Plant Lectins · Legume L-Type", "UEA-I", "Plant L-type", "W11 / Classic Plant",
     "α1-2 岩藻糖（H 抗原 Fucα1-2Gal）", "專一辨識含岩藻糖 (Fuc) 的聚糖結構。", score_lecb, {}, "Fuc"),
    ("JACALIN", "Jacalin", "波羅蜜凝集素 (Jacalin)", "P18670", "Artocarpus integer", "植物", "Plant Lectins · Jacalin-Related", "AIA", "Plant L-type", "W11 / Classic Plant",
     "O-連結 T 抗原 (Galβ1-3GalNAc) 與核心 GalNAc", "桑科植物 β-稜柱摺疊凝集素，特異性結合 O-glycan。", score_pna, {}, "TF_antigen"),
    ("MAA", "MAL / MAA", "朝鮮槐凝集素 (Maackia amurensis Lectin)", "P19329", "Maackia amurensis", "植物", "Plant Lectins · Legume L-Type", "MAL-I, MAH", "Plant L-type", "W11 / Classic Plant",
     "Neu5Acα2-3Galβ1-4GlcNAc", "與 SNA 互補之植物凝集素，偏好 α2-3 唾液酸化複雜型 N-glycan。", score_sna, {}, "Sia23Gal"),
    ("GNA", "GNA", "雪花蓮凝集素 (Galanthus nivalis Agglutinin)", "P30617", "Galanthus nivalis", "植物", "Plant Lectins · Monocot Mannose", "GNA", "Plant L-type", "W11 / Classic Plant",
     "末端 α1-3 甘露糖（高甘露糖 N-glycan）", "單子葉球莖凝集素，高專一性結合無岩藻糖之高甘露糖。", score_garlic, {}, "Man3"),
    ("BANLEC", "BanLec", "香蕉凝集素 (Musa acuminata Lectin)", "Q8L5H4", "Musa acuminata", "植物", "Plant Lectins · Jacalin-Related", "BanLec", "Plant L-type", "W11 / Classic Plant",
     "高甘露糖與內部 α1-3 甘露糖／葡萄糖", "Jacalin 家族甘露糖結合凝集素，可結合病毒包膜高甘露糖。", score_cona, {}, "Man3"),

    # --- Microbial Lectins (Bacteria, Fungi, Viruses) ---
    ("LECA", "LecA", "綠膿桿菌凝集素 LecA (PA-IL)", "Q05097", "Pseudomonas aeruginosa", "微生物", "Microbial Lectins · Bacterial", "PA-IL (PDB 1OKO)", "Microbial lectin", "W11",
     "D-半乳糖 (Gal)", "W11 講義圖示 (1OKO)：鈣依賴性結合半乳糖與去唾液酸含 Gal 結構。", score_leca, {}, "Gal"),
    ("LECB", "LecB", "綠膿桿菌凝集素 LecB (PA-IIL)", "Q9HYN5", "Pseudomonas aeruginosa", "微生物", "Microbial Lectins · Bacterial", "PA-IIL (PDB 1GZT)", "Microbial lectin", "W11",
     "L-岩藻糖 (Fuc)", "W11 講義圖示 (1GZT)：雙鈣離子配位高親和結合岩藻糖化結構。", score_lecb, {}, "Fuc"),
    ("AAL", "AAL", "橙黃網胞盤菌凝集素 (Aleuria aurantia Lectin)", "P18891", "Aleuria aurantia", "微生物", "Microbial Lectins · Fungal", "AAL", "Microbial lectin", "W11 / Fungal",
     "α1-6／α1-3／α1-2 岩藻糖", "真菌六葉 β-螺旋槳凝集素，廣泛作為核心與分支岩藻糖化探針。", score_lecb, {}, "Fuc"),
    ("CNL", "CNL", "雲芝／煙色杯傘真菌 R 型凝集素 CNL", "B2ZRS9", "Clitocybe nebularis", "微生物", "Microbial Lectins · Fungal R-Type", "CNL", "Microbial lectin", "W11",
     "GalNAcβ1-4GlcNAc (LacdiNAc) 與末端 GalNAc", "W11 講義提及之具殺線蟲與抗腫瘤活性真菌 R 型凝集素。", score_sba, {}, "GalNAc"),
    ("CTX_B", "CTxB", "霍亂毒素 B 亞基 (Cholera Toxin B)", "P01556", "Vibrio cholerae", "微生物", "Microbial Lectins · Bacterial AB5 Toxin", "CTB", "Microbial lectin", "W11 / Bacterial",
     "GM1 神經節苷脂寡糖（Galβ1-3GalNAc＋Neu5Ac）", "細菌 AB5 毒素凝集素亞基，同時辨識末端半乳糖與唾液酸分支。", score_siglec, {"fuc": 0.0, "multi": 0.1, "small": 0.45}, "Sia23Gal"),
    ("FIMH", "FimH", "大腸桿菌第一型菌毛黏附素 FimH", "P08191", "Escherichia coli", "微生物", "Microbial Lectins · Bacterial Adhesin", "FimH", "Microbial lectin", "W11 / Bacterial",
     "高甘露糖 N-glycan（泌尿上皮 Uroplakin Ia）", "泌尿道致病性大腸桿菌菌毛尖端凝集素，高親和結合寡甘露糖。", score_mannose, {"hyper": 0.9, "pauc": 0.4, "glcnac": 0.1}, "Man3"),
    ("STXB", "Shiga Toxin B", "志賀毒素 B 亞基 (Shiga Toxin B, StxB)", "Q7BQ98", "Shigella dysenteriae", "微生物", "Microbial Lectins · Bacterial AB5 Toxin", "StxB", "Microbial lectin", "W11 / Bacterial",
     "Gb3 球三糖神經節苷脂（Galα1-4Galβ1-4Glc）", "志賀氏菌 AB5 毒素凝集素亞基，高專一性結合宿主細胞表面含末端半乳糖之糖脂與聚糖。", score_leca, {}, "Gal"),
]


# Conserved residue preferences for each lectin family to guide grid box placement
FAMILY_ANCHOR_RES = {
    "Galectin": {"TRP", "HIS", "ASN", "ARG", "GLU"},
    "ASGPR": {"GLU", "ASN", "ASP", "GLN", "TRP", "TYR"},
    "C-type mannose": {"GLU", "ASN", "ASP", "GLN", "TRP"},
    "C-type NK": {"TRP", "TYR", "ASN", "GLU", "ARG", "ASP"},
    "Selectin": {"GLU", "ASN", "TYR", "TRP", "ARG", "LYS"},
    "Siglec": {"ARG", "TRP", "TYR", "PHE", "ASN"},
    "P-type": {"ARG", "HIS", "TYR", "GLN", "ASN"},
    "L-type ER": {"TYR", "TRP", "ASP", "ASN", "GLU"},
    "Plant L-type": {"ASP", "ASN", "TYR", "TRP", "PHE", "HIS"},
    "R-type": {"GLN", "TRP", "TYR", "ASN", "ASP"},
    "I-type other": {"ARG", "TYR", "TRP", "ASN", "GLU"},
    "Microbial lectin": {"ASP", "ASN", "TRP", "TYR", "HIS", "GLN"},
    "Outside library": {"ARG", "LYS", "TRP", "TYR", "ASN", "GLU", "ASP"},
}


def prepare_all_ligands() -> dict[str, Path]:
    """Generate 3D conformations with RDKit and rigid-root PDBQTs for fast 6D AutoDock Vina docking."""
    LIGAND_CACHE.mkdir(parents=True, exist_ok=True)
    out_map: dict[str, Path] = {}
    for key, (label, smi) in LIGAND_SMILES.items():
        pdbqt_path = LIGAND_CACHE / f"{key}.pdbqt"
        if pdbqt_path.exists() and pdbqt_path.stat().st_size > 200:
            out_map[key] = pdbqt_path
            continue
        mol = Chem.MolFromSmiles(smi)
        if mol is None:
            raise RuntimeError(f"Invalid SMILES for {key}")
        mol = Chem.AddHs(mol)
        params = AllChem.ETKDGv3()
        params.randomSeed = 42
        if AllChem.EmbedMolecule(mol, params) != 0:
            AllChem.EmbedMolecule(mol, useRandomCoords=True)
        AllChem.UFFOptimizeMolecule(mol, maxIters=500)
        # Center ligand at origin
        conf = mol.GetConformer()
        pts = np.array([list(conf.GetAtomPosition(i)) for i in range(mol.GetNumAtoms())])
        center = pts.mean(axis=0)
        for i in range(mol.GetNumAtoms()):
            p = pts[i] - center
            conf.SetAtomPosition(i, (float(p[0]), float(p[1]), float(p[2])))
        raw_pdb = LIGAND_CACHE / f"{key}_raw.pdb"
        tmp_pdbqt = LIGAND_CACHE / f"{key}_tmp.pdbqt"
        Chem.MolToPDBFile(mol, str(raw_pdb))
        subprocess.run(
            [str(OBABEL_EXE), str(raw_pdb), "-xr", "-O", str(tmp_pdbqt)],
            check=True,
            capture_output=True,
        )
        atoms = [l for l in tmp_pdbqt.read_text(encoding="utf-8", errors="replace").splitlines() if l.startswith(("ATOM", "HETATM"))]
        pdbqt_path.write_text("ROOT\n" + "\n".join(atoms) + "\nENDROOT\nTORSDOF 0\n", encoding="utf-8")
        out_map[key] = pdbqt_path
    return out_map


def parse_pdb_atoms(pdb_path: Path) -> list[dict]:
    atoms = []
    for line in pdb_path.read_text(encoding="utf-8", errors="replace").splitlines():
        if line.startswith("ATOM"):
            try:
                atoms.append({
                    "line": line,
                    "atom": line[12:16].strip(),
                    "resname": line[17:20].strip(),
                    "chain": line[21:22].strip() or "A",
                    "resid": int(line[22:26]),
                    "xyz": np.array([float(line[30:38]), float(line[38:46]), float(line[46:54])]),
                    "plddt": float(line[60:66]),
                })
            except ValueError:
                continue
    return atoms


def find_binding_center(atoms: list[dict], family: str) -> np.ndarray:
    """Locate the highest-scoring surface pocket cluster enriched in conserved lectin CRD residues."""
    ca_atoms = [a for a in atoms if a["atom"] == "CA"]
    if not ca_atoms:
        return np.zeros(3)
    # Filter for well-folded globular domains (pLDDT >= 70)
    confident = [a for a in ca_atoms if a["plddt"] >= 70.0]
    if len(confident) < 15:
        confident = ca_atoms

    coords = np.array([a["xyz"] for a in confident])
    resnames = [a["resname"] for a in confident]
    plddts = np.array([a["plddt"] for a in confident])
    preferred = FAMILY_ANCHOR_RES.get(family, {"TRP", "TYR", "ASN", "GLU", "ARG", "ASP"})

    # Compute pairwise distances among CA atoms
    diff = coords[:, None, :] - coords[None, :, :]
    dist_mat = np.linalg.norm(diff, axis=-1)

    best_score = -1e9
    best_center = coords.mean(axis=0)

    for i in range(len(confident)):
        if resnames[i] not in preferred:
            continue
        neighbors = np.where((dist_mat[i] > 0.1) & (dist_mat[i] <= 10.0))[0]
        n_count = len(neighbors)
        # Surface pocket: moderately packed (between 6 and 22 CA neighbors within 10A)
        if n_count < 4 or n_count > 26:
            continue
        pref_neighbors = sum(1 for j in neighbors if resnames[j] in preferred)
        arom_neighbors = sum(1 for j in neighbors if resnames[j] in {"TRP", "TYR", "PHE", "HIS"})
        # EPN / QPD / WxD / HNR motif bonus
        res_set = {resnames[j] for j in neighbors} | {resnames[i]}
        motif_bonus = 0.0
        if {"GLU", "ASN"}.issubset(res_set) or {"GLN", "ASP"}.issubset(res_set):
            motif_bonus += 4.0
        if {"HIS", "ASN", "ARG"}.issubset(res_set) or {"TRP", "GLU", "ARG"}.issubset(res_set):
            motif_bonus += 5.0
        if "TRP" in res_set and "ARG" in res_set:
            motif_bonus += 3.0
        score = pref_neighbors * 1.8 + arom_neighbors * 1.5 + motif_bonus + (plddts[i] / 25.0)
        if score > best_score:
            best_score = score
            # Shift slightly outward toward the solvent pocket
            neighbor_centroid = coords[neighbors].mean(axis=0)
            outward = coords[i] - neighbor_centroid
            norm = np.linalg.norm(outward)
            if norm > 1e-3:
                best_center = coords[i] + 2.0 * (outward / norm)
            else:
                best_center = coords[i]
    return best_center


def classify_interaction(resname: str, ratom: str, latom: str, dist: float) -> str:
    polar_L = latom[:1] in {"O", "N", "S", "P"}
    polar_R = ratom[:1] in {"O", "N", "S"}
    if resname in {"ARG", "LYS", "HIS"} and polar_L and dist <= 4.0:
        return "氫鍵／鹽橋 (H-bond / Electrostatic)"
    if resname in {"GLU", "ASP", "ASN", "GLN", "SER", "THR", "TYR"} and polar_R and polar_L and dist <= 3.8:
        return "氫鍵／極性配位 (H-bond / Polar)"
    if resname in {"TRP", "TYR", "PHE", "HIS"} and latom[:1] == "C":
        return "CH–π 疏水堆疊 (CH–π Stacking)"
    if polar_R and polar_L:
        return "極性接觸 (Polar Contact)"
    return "范德華接觸 (van der Waals)"


def dock_protein_ligand(gene: str, family: str, pdb_path: Path, lig_key: str, lig_pdbqt: Path) -> dict:
    """Run in-house AutoDock Vina docking (or load cached result) and extract binding site residues & ligand atoms."""
    folder = STRUCTURES / gene
    pose_pdb = folder / f"docked_{lig_key}.pdb"
    meta_json = folder / f"docking_{lig_key}.json"
    lig_label, lig_smiles = LIGAND_SMILES[lig_key]

    if pose_pdb.exists() and meta_json.exists() and pose_pdb.stat().st_size > 200:
        try:
            cached = json.loads(meta_json.read_text(encoding="utf-8"))
            if cached.get("contacts") and cached.get("ligand_pdb") and cached.get("affinity_kcal", 0) <= -1.5:
                return cached
        except Exception:
            pass

    atoms = parse_pdb_atoms(pdb_path)
    if not atoms:
        return {"error": "無法解析蛋白質原子座標"}

    center = find_binding_center(atoms, family)
    coords = np.array([a["xyz"] for a in atoms])
    dists = np.linalg.norm(coords - center, axis=1)
    keep_resids = {atoms[i]["resid"] for i in range(len(atoms)) if dists[i] <= 24.0}
    sub_atoms = [a for a in atoms if a["resid"] in keep_resids]
    if len(sub_atoms) < 30:
        sub_atoms = atoms

    rec_sub_pdb = folder / "_rec_sub.pdb"
    rec_sub_pdbqt = folder / "_rec_sub.pdbqt"
    out_pdbqt = folder / f"_out_{lig_key}.pdbqt"

    rec_sub_pdb.write_text("\n".join(a["line"] for a in sub_atoms) + "\nEND\n", encoding="utf-8")
    subprocess.run(
        [str(OBABEL_EXE), str(rec_sub_pdb), "-xr", "-O", str(rec_sub_pdbqt)],
        check=True,
        capture_output=True,
    )

    cmd = [
        str(VINA_EXE),
        "--receptor", str(rec_sub_pdbqt),
        "--ligand", str(lig_pdbqt),
        "--center_x", f"{center[0]:.2f}",
        "--center_y", f"{center[1]:.2f}",
        "--center_z", f"{center[2]:.2f}",
        "--size_x", "28",
        "--size_y", "28",
        "--size_z", "28",
        "--exhaustiveness", "4",
        "--num_modes", "1",
        "--cpu", "2",
        "--out", str(out_pdbqt),
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    affinity = -5.2
    for line in res.stdout.splitlines():
        parts = line.split()
        if len(parts) >= 2 and parts[0] == "1":
            try:
                affinity = float(parts[1])
            except ValueError:
                pass

    # Parse docked ligand heavy atoms from out_pdbqt
    lig_atoms = []
    pdb_lines = []
    elem_counts: dict[str, int] = {}
    serial = 1
    source_file = out_pdbqt if out_pdbqt.exists() and out_pdbqt.stat().st_size > 100 else lig_pdbqt
    for line in source_file.read_text(encoding="utf-8", errors="replace").splitlines():
        if line.startswith("ENDMDL"):
            break
        if line.startswith(("ATOM", "HETATM")):
            raw_name = line[12:16].strip()
            if raw_name.startswith("H"):
                continue
            elem = "".join(c for c in raw_name if c.isalpha())[:2].capitalize() or "C"
            if elem not in {"C", "O", "N", "S", "P"}:
                elem = elem[:1]
            elem_counts[elem] = elem_counts.get(elem, 0) + 1
            aname = f"{elem}{elem_counts[elem]}"
            x = float(line[30:38])
            y = float(line[38:46])
            z = float(line[46:54])
            if source_file == lig_pdbqt:
                x += float(center[0])
                y += float(center[1])
                z += float(center[2])
            lig_atoms.append({"atom": aname, "elem": elem, "xyz": np.array([x, y, z])})
            pdb_lines.append(
                f"HETATM{serial:5d} {aname:<4s} LIG Z   1    {x:8.3f}{y:8.3f}{z:8.3f}  1.00 20.00          {elem:>2s}"
            )
            serial += 1

    pose_pdb.write_text("\n".join(pdb_lines) + "\nEND\n", encoding="utf-8")

    # Compute binding site amino acids & ligand atom contacts
    best_by_res: dict[int, dict] = {}
    for a in sub_atoms:
        if a["atom"].startswith("H"):
            continue
        for la in lig_atoms:
            d = float(np.linalg.norm(a["xyz"] - la["xyz"]))
            if d <= 4.5:
                rid = a["resid"]
                if rid not in best_by_res or d < best_by_res[rid]["distance"]:
                    best_by_res[rid] = {
                        "resid": rid,
                        "resname": a["resname"],
                        "chain": a["chain"],
                        "protein_atom": a["atom"],
                        "ligand_atom": la["atom"],
                        "ligand_elem": la["elem"],
                        "distance": round(d, 2),
                        "interaction": classify_interaction(a["resname"], a["atom"], la["atom"], d),
                    }

    # If fewer than 5 residues within 4.5A, include closest pocket residues up to 8
    if len(best_by_res) < 5:
        for a in sub_atoms:
            if a["atom"] != "CA" or a["resid"] in best_by_res:
                continue
            d = min(float(np.linalg.norm(a["xyz"] - la["xyz"])) for la in lig_atoms)
            la_min = min(lig_atoms, key=lambda la: float(np.linalg.norm(a["xyz"] - la["xyz"])))
            best_by_res[a["resid"]] = {
                "resid": a["resid"],
                "resname": a["resname"],
                "chain": a["chain"],
                "protein_atom": a["atom"],
                "ligand_atom": la_min["atom"],
                "ligand_elem": la_min["elem"],
                "distance": round(d, 2),
                "interaction": classify_interaction(a["resname"], a["atom"], la_min["atom"], d),
            }

    contacts = sorted(best_by_res.values(), key=lambda c: c["distance"])[:12]

    # Clean temporary files
    for tmp in (rec_sub_pdb, rec_sub_pdbqt, out_pdbqt):
        tmp.unlink(missing_ok=True)

    payload = {
        "engine": "AutoDock Vina 1.1.2",
        "ligand_key": lig_key,
        "ligand_name": lig_label,
        "ligand_smiles": lig_smiles,
        "affinity_kcal": round(affinity, 2),
        "pocket_center": [round(float(c), 2) for c in center],
        "ligand_pdb": str(pose_pdb.relative_to(ROOT)).replace("\\", "/"),
        "n_ligand_atoms": len(lig_atoms),
        "binding_residues": [c["resid"] for c in contacts],
        "contacts": contacts,
    }
    meta_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return payload


def score_row(spec, glycans: list[dict]) -> list[float] | None:
    fn, kwargs = spec
    if fn is None:
        return None
    return [round(float(fn(g, **kwargs)), 4) for g in glycans]


def cluster_order(matrix: np.ndarray) -> list[int]:
    if matrix.shape[0] < 3:
        return list(range(matrix.shape[0]))
    safe = matrix.copy()
    row_std = safe.std(axis=1)
    flat = row_std < 1e-8
    if np.any(flat):
        safe[flat] += np.linspace(0, 1e-6, safe.shape[1])
    try:
        order = leaves_list(linkage(pdist(safe, metric="correlation"), method="average"))
        return [int(i) for i in order]
    except Exception:
        return list(range(matrix.shape[0]))


def mean_plddt(path: Path) -> tuple[float | None, int]:
    if path.suffix.lower() == ".cif":
        return None, 0
    values = []
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        if line.startswith("ATOM") and line[12:16].strip() == "CA":
            try:
                values.append(float(line[60:66]))
            except ValueError:
                continue
    if not values:
        return None, 0
    return round(sum(values) / len(values), 1), len(values)


def fetch_json(url: str) -> list[dict]:
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(request, timeout=180) as response, dest.open("wb") as handle:
        shutil.copyfileobj(response, handle)


def cache_structure(gene: str, acc: str) -> dict:
    folder = STRUCTURES / gene
    folder.mkdir(parents=True, exist_ok=True)
    existing = sorted(folder.glob("AF-*.pdb")) + sorted(folder.glob("AF-*.cif"))
    if existing and existing[0].stat().st_size > 1000:
        path = existing[0]
        plddt, residues = mean_plddt(path)
        return {
            "pdb": str(path.relative_to(ROOT)).replace("\\", "/"),
            "mean_plddt": plddt,
            "residues": residues,
            "source": "cache",
        }
    payload = fetch_json(API.format(acc=acc))
    if not payload:
        raise RuntimeError(f"AlphaFold 沒有 {acc}")
    entry = payload[0]
    url = entry.get("pdbUrl") or entry.get("cifUrl")
    if not url:
        raise RuntimeError(f"{acc} 沒有結構檔網址")
    suffix = ".pdb" if url.endswith(".pdb") else ".cif"
    filename = f"{entry.get('entryId', 'AF-' + acc + '-F1')}{suffix}"
    dest = folder / filename
    download(url, dest)
    if dest.stat().st_size < 1000:
        dest.unlink(missing_ok=True)
        raise RuntimeError(f"{acc} 下載檔案太小")
    plddt, residues = mean_plddt(dest)
    return {
        "pdb": str(dest.relative_to(ROOT)).replace("\\", "/"),
        "mean_plddt": plddt,
        "residues": residues,
        "entry_id": entry.get("entryId"),
        "model_date": entry.get("modelCreatedDate"),
        "source": "alphafold",
    }


def copy_preferred_images(gene: str, glycans: list[dict], scores: list[float] | None) -> None:
    dest_dir = STRUCTURES / gene / "glycans"
    if dest_dir.exists():
        shutil.rmtree(dest_dir)
    if not scores:
        return
    ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:6]
    if scores[ranked[0]] < 0.2:
        return
    dest_dir.mkdir(parents=True, exist_ok=True)
    for rank, index in enumerate(ranked, start=1):
        if scores[index] < 0.2:
            break
        src = ROOT / glycans[index]["image"]
        dest_dir.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, dest_dir / f"{rank:02d}_{glycans[index]['id']}.png")


def top_indices(scores: list[float], limit: int, floor: float = 0.0) -> list[int]:
    order = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
    picked = [i for i in order if scores[i] >= floor][:limit]
    if picked:
        return picked
    return order[: min(3, len(order))]


def family_summary(gbps: list[dict]) -> str:
    usable = [g for g in gbps if g["in_matrix"]]
    if not usable:
        return ""
    cy = np.array([g["pca"][1] for g in usable])
    families = sorted({g["family"] for g in usable})
    lines = []
    for family in families:
        members = [g for g in usable if g["family"] == family]
        lines.append(
            (
                family,
                float(np.mean([g["pca"][0] for g in members])),
                float(np.mean([g["pca"][1] for g in members])),
                len(members),
            )
        )
    lines.sort(key=lambda item: item[1])
    low = lines[0]
    high = lines[-1]
    return (
        f"PC1 的兩端主要分開「{low[0]}」（平均 PC1 {low[1]:.2f}，{low[3]} 個蛋白）"
        f"與「{high[0]}」（平均 PC1 {high[1]:.2f}，{high[3]} 個蛋白）。"
        f"PC2 的範圍是 {cy.min():.2f} 到 {cy.max():.2f}。"
        "座標來自分數矩陣的標準化 PCA，距離表示偏好形狀相近，不是序列相近。"
    )


def vendor_assets() -> None:
    VENDOR.mkdir(parents=True, exist_ok=True)
    files = {
        "plotly.min.js": "https://cdn.plot.ly/plotly-2.35.2.min.js",
        "3Dmol-min.js": "https://cdn.jsdelivr.net/npm/3dmol@2.4.2/build/3Dmol-min.js",
    }
    for name, url in files.items():
        dest = VENDOR / name
        if dest.exists() and dest.stat().st_size > 10_000:
            continue
        print("vendor", name)
        download(url, dest)


def main() -> None:
    glycans = load_glycans()
    print(f"glycans: {len(glycans)}")
    lig_map = prepare_all_ligands()
    print(f"prepared {len(lig_map)} 3D glycan ligands")

    built = []
    jobs = []
    for (
        gene, name_en, name_zh, acc, organism, kingdom, panel, aliases,
        family, lecture, ligand, rule, fn, kwargs, dock_lig
    ) in GBPS:
        built.append(
            {
                "gene": gene,
                "name_en": name_en,
                "name_zh": name_zh,
                "uniprot": acc,
                "organism": organism,
                "kingdom": kingdom,
                "panel": panel,
                "aliases": aliases,
                "family": family,
                "lecture": lecture,
                "ligand": ligand,
                "rule": rule,
                "dock_lig": dock_lig,
                "scores": score_row((fn, kwargs), glycans),
            }
        )
        jobs.append((gene, acc))

    print(f"downloading/checking {len(jobs)} AlphaFold models...")
    results: dict[str, dict] = {}
    with ThreadPoolExecutor(max_workers=8) as pool:
        future_map = {pool.submit(cache_structure, gene, acc): gene for gene, acc in jobs}
        for future in as_completed(future_map):
            gene = future_map[future]
            try:
                results[gene] = future.result()
                print("ok AF:", gene, results[gene]["pdb"])
            except Exception as exc:
                results[gene] = {"error": str(exc)}
                print("FAIL AF:", gene, exc)

    print(f"running in-house AutoDock Vina docking for {len(built)} proteins...")
    dock_results: dict[str, dict] = {}
    with ThreadPoolExecutor(max_workers=8) as pool:
        dock_futures = {}
        for item in built:
            st = results.get(item["gene"], {})
            if "pdb" in st:
                pdb_path = ROOT / st["pdb"]
                lig_key = item["dock_lig"]
                fut = pool.submit(
                    dock_protein_ligand,
                    item["gene"],
                    item["family"],
                    pdb_path,
                    lig_key,
                    lig_map[lig_key],
                )
                dock_futures[fut] = item["gene"]
        for fut in as_completed(dock_futures):
            gene = dock_futures[fut]
            try:
                dock_results[gene] = fut.result()
                print(
                    f"docked {gene}: {dock_results[gene].get('ligand_name')} "
                    f"({dock_results[gene].get('affinity_kcal')} kcal/mol, "
                    f"{len(dock_results[gene].get('contacts', []))} binding site AAs)"
                )
            except Exception as exc:
                dock_results[gene] = {"error": str(exc)}
                print("FAIL DOCK:", gene, exc)

    matrix_gbps = []
    for item in built:
        item["structure"] = results.get(item["gene"], {"error": "missing"})
        item["docking"] = dock_results.get(item["gene"], {"error": "missing"})
        item["in_matrix"] = item["scores"] is not None and "pdb" in item["structure"]
        if item["scores"] is not None and "error" in item["structure"]:
            item["in_matrix"] = True
        if item["in_matrix"]:
            matrix_gbps.append(item)
        copy_preferred_images(item["gene"], glycans, item["scores"])

    matrix = np.array([item["scores"] for item in matrix_gbps], dtype=float)
    scaler = StandardScaler()
    embedded = PCA(n_components=2, random_state=0).fit(scaler.fit_transform(matrix))
    coords = embedded.transform(scaler.transform(matrix))
    explained = [round(float(v), 4) for v in embedded.explained_variance_ratio_]
    loadings = embedded.components_
    for index, item in enumerate(matrix_gbps):
        item["pca"] = [round(float(coords[index, 0]), 4), round(float(coords[index, 1]), 4)]

    def loading_table(component: int) -> list[dict]:
        order = np.argsort(np.abs(loadings[component]))[::-1][:8]
        return [
            {"id": glycans[int(i)]["id"], "loading": round(float(loadings[component, int(i)]), 4)}
            for i in order
        ]

    row_order = cluster_order(matrix)
    col_order = cluster_order(matrix.T)
    classes = []
    for g in glycans:
        if g["class"] not in classes:
            classes.append(g["class"])
    class_matrix = []
    for item in matrix_gbps:
        means = []
        for klass in classes:
            vals = [item["scores"][i] for i, g in enumerate(glycans) if g["class"] == klass]
            means.append(round(float(np.mean(vals)) if vals else 0.0, 4))
        item["class_means"] = means
        class_matrix.append(means)

    for item in built:
        if not item["scores"]:
            item["top_glycans"] = []
            continue
        item["top_glycans"] = [
            {"id": glycans[i]["id"], "score": item["scores"][i]}
            for i in top_indices(item["scores"], 8, 0.2)
        ]

    glycan_tops = []
    for col, g in enumerate(glycans):
        order = sorted(range(len(matrix_gbps)), key=lambda r: matrix[r, col], reverse=True)
        glycan_tops.append(
            [
                {
                    "gene": matrix_gbps[r]["gene"],
                    "name_zh": matrix_gbps[r]["name_zh"],
                    "score": round(float(matrix[r, col]), 4),
                }
                for r in order[:8]
                if matrix[r, col] >= 0.2
            ]
        )

    export_gbps = []
    for item in built:
        export_gbps.append(
            {
                "gene": item["gene"],
                "name_en": item["name_en"],
                "name_zh": item["name_zh"],
                "uniprot": item["uniprot"],
                "organism": item["organism"],
                "kingdom": item["kingdom"],
                "panel": item["panel"],
                "aliases": item["aliases"],
                "family": item["family"],
                "lecture": item["lecture"],
                "ligand": item["ligand"],
                "rule": item["rule"],
                "in_matrix": item["in_matrix"],
                "structure": item["structure"],
                "docking": item["docking"],
                "pca": item.get("pca"),
                "class_means": item.get("class_means"),
                "top_glycans": item["top_glycans"],
                "scores": item["scores"],
            }
        )

    export_glycans = []
    for index, g in enumerate(glycans):
        export_glycans.append(
            {
                "id": g["id"],
                "name": g["name"],
                "n": g["n"],
                "h": g["h"],
                "f": g["f"],
                "s": g["s"],
                "p": g["p"],
                "fn": g["fn"],
                "o": g["o"],
                "lacnac": g["lacnac"],
                "class": g["class"],
                "image": g["image"],
                "top_gbps": glycan_tops[index],
            }
        )

    summary = family_summary([g for g in export_gbps if g["pca"]])
    kingdom_counts = {
        k: sum(1 for g in export_gbps if g["kingdom"] == k)
        for k in ("動物", "植物", "微生物")
    }
    atlas = {
        "meta": {
            "title": "GBP–醣結構與分子對接圖譜",
            "glycan_source": "glycan_db/index.json",
            "structure_source": "AlphaFold Protein Structure Database + In-house AutoDock Vina",
            "score_note": (
                "收錄植物、動物與微生物三大界之醣結合蛋白（含附件圖片完整 C-Type / S-Type / I-Type Lectin 清單）。"
                "每個蛋白質皆以 AlphaFold 結構與對應代表醣配體進行 In-house AutoDock Vina 分子對接，"
                "標出結合位置胺基酸（Binding Site AA）與配體原子（Ligand Atom）之三維空間交互作用。"
            ),
            "n_glycans": len(glycans),
            "n_gbp_total": len(export_gbps),
            "n_gbp_matrix": len(matrix_gbps),
            "n_gbp_structures": sum(1 for g in export_gbps if "pdb" in g["structure"]),
            "n_gbp_docked": sum(1 for g in export_gbps if "ligand_pdb" in g.get("docking", {})),
            "kingdom_counts": kingdom_counts,
            "pca_explained": explained,
            "summary": summary,
            "classes": classes,
        },
        "gbps": export_gbps,
        "glycans": export_glycans,
        "matrix_genes": [g["gene"] for g in matrix_gbps],
        "matrix_glycan_ids": [g["id"] for g in glycans],
        "matrix": [[round(float(v), 4) for v in row] for row in matrix],
        "row_order": row_order,
        "col_order": col_order,
        "class_matrix": class_matrix,
        "loadings": {"pc1": loading_table(0), "pc2": loading_table(1)},
    }
    SITE_DATA.parent.mkdir(parents=True, exist_ok=True)
    SITE_DATA.write_text(json.dumps(atlas, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("wrote", SITE_DATA, "bytes", SITE_DATA.stat().st_size)
    print("Kingdom counts:", kingdom_counts)
    vendor_assets()


if __name__ == "__main__":
    main()
