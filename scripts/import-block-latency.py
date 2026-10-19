#!/usr/bin/env python3
"""Import the fixed profiling capture into self-contained Astro assets."""

import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path
from xml.etree import ElementTree as ET


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("profiling", type=Path, help="boku epic's profiling directory")
    args = parser.parse_args()
    site = Path(__file__).resolve().parent.parent
    report = args.profiling / "evidence/2026-10-19-baseline-v1/report"
    visuals = args.profiling / "visuals"
    summary = json.loads((report / "summary.json").read_text())
    provenance = json.loads((visuals / "provenance.json").read_text())
    if sha(report / "summary.json") != provenance["source_sha256"]:
        raise ValueError("Guide and summary belong to different captures")
    if sha(visuals / "index.html") != provenance["artifacts"]["index.html"]:
        raise ValueError("Guide HTML differs from its provenance record")
    match = re.search(
        r'<script id="guide-data" type="application/json">(.*?)</script>',
        (visuals / "index.html").read_text(),
        re.DOTALL,
    )
    if match is None:
        raise ValueError("Guide display data is missing")
    data = json.loads(match[1])
    if data["normal"] != summary["normal"]:
        raise ValueError("Guide baseline differs from the saved report")
    primary = "cataclysm-1-validator"
    for version, entry in data["upgrades"].items():
        if entry["tables"] != summary["upgrades"][version]["tables"][primary]:
            raise ValueError(f"Guide upgrade data differs: {version}")
    destination = site / "public/research/261019-block-latency"
    destination.mkdir(parents=True, exist_ok=True)
    figures = {}
    source_figures = {}
    presentation_edits = {}
    for relative, digest in provenance["artifacts"].items():
        if not relative.endswith(".svg"):
            continue
        source = visuals / relative
        if sha(source) != digest:
            raise ValueError(f"SVG hash mismatch: {relative}")
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        original = source.read_text()
        exported = original.replace("SCHEMATIC · NOT TO SCALE", "SUCCESSFUL-ROUND FLOW")
        edits = []
        if exported != original:
            edits.append("Replace schematic scale label with successful-round flow label.")
        if relative == "block-cycle.svg":
            replacements = {
                ">Apply block</text>": ">After quorum:</text>",
                ">+ persist state</text>": ">apply + persist</text>",
            }
            for old, new in replacements.items():
                if old not in exported:
                    raise ValueError(f"Block-cycle label changed: {old}")
                exported = exported.replace(old, new, 1)
            marker = '<text x="48" y="670"'
            if marker not in exported:
                raise ValueError("Block-cycle footer marker changed")
            note = (
                '<text x="48" y="435" font-size="18" fill="#202f36" font-weight="normal">'
                'More than 2/3 of voting power precommits the block → consensus decision; local processing follows.'
                '</text>'
            )
            exported = exported.replace(marker, note + marker, 1)
            exported = exported.replace(
                "The next height repeats the cycle.",
                "A matching precommit quorum establishes the consensus decision before local execution and persistence. The next height repeats the cycle.",
                1,
            )
            edits.append("Distinguish the precommit-quorum decision from local execution and persistence.")
        target.write_text(exported)
        source_figures[relative] = digest
        if edits:
            presentation_edits[relative] = " ".join(edits)
        root = ET.parse(source).getroot()
        figures[relative] = {
            "width": float(root.get("width")),
            "height": float(root.get("height")),
        }
    for version in data["upgrades"]:
        shutil.copyfile(
            report / f"figures/{version}.svg", destination / f"timeline-{version}.svg"
        )
    shutil.copyfile(report / "tables.md", destination / "tables.md")
    data["figures"] = figures
    data["source_sha256"] = provenance["source_sha256"]
    encoded = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    (destination / "measurements.json").write_text(encoded)
    module = site / "src/data/research/blockLatency.json"
    module.parent.mkdir(parents=True, exist_ok=True)
    module.write_text(encoded)
    manifest = {
        "capture": "2026-10-19-baseline-v1",
        "source_report_sha256": provenance["source_sha256"],
        "importer_sha256": sha(Path(__file__)),
        "source_figure_sha256": source_figures,
        "presentation_edits": presentation_edits,
        "artifacts": {
            str(p.relative_to(destination)): sha(p)
            for p in sorted(destination.rglob("*"))
            if p.is_file() and p.name != "provenance.json"
        },
    }
    (destination / "provenance.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(
        f"Imported {len(figures)} guide SVGs, two timelines, tables, and display data"
    )


if __name__ == "__main__":
    main()
