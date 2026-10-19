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
    for relative, digest in provenance["artifacts"].items():
        if not relative.endswith(".svg"):
            continue
        source = visuals / relative
        if sha(source) != digest:
            raise ValueError(f"SVG hash mismatch: {relative}")
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
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
