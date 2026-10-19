#!/usr/bin/env python3
"""Exercise real GCS uploads and public HTTP reads, then clean up test objects."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import time
import urllib.error
import urllib.request

BUCKET = "uniquedivine-public-files-876932632137"
ACCOUNT = "realuniquedivine@gmail.com"
MAX_BYTES = 256 * 1024 * 1024

def cloud(*args):
    result = subprocess.run(["gcloud", "storage", *args, "--account=" + ACCOUNT],
                            check=True, capture_output=True, text=True)
    return result.stdout.strip()

def request(url, method="GET", headers=None):
    try: return urllib.request.urlopen(urllib.request.Request(url, method=method, headers=headers or {}), timeout=70)
    except urllib.error.HTTPError as error: return error

def run(origin, image):
    stamp = str(time.time_ns())
    prefix = "26-10-12-smoke-" + stamp
    objects = []
    report = {"origin": origin, "tests": []}
    def upload(path, suffix):
        key = prefix + suffix
        cloud("cp", str(path), "gs://" + BUCKET + "/" + key, "--if-generation-match=0")
        objects.append(key)
        return key, origin.rstrip("/") + "/f/" + key
    try:
        with tempfile.TemporaryDirectory(prefix="files-smoke-") as directory:
            directory = Path(directory)
            image_key, image_url = upload(image, ".png")
            with request(image_url) as response:
                assert response.status == 200
                assert response.headers["Content-Type"] == "image/png"
                assert response.headers["Content-Disposition"].startswith("inline")
                assert hashlib.sha256(response.read()).digest() == hashlib.sha256(image.read_bytes()).digest()
                etag = response.headers["ETag"]
            with request(image_url, "HEAD") as response:
                assert response.status == 200 and int(response.headers["Content-Length"]) == image.stat().st_size
                assert response.read() == b""
            with request(image_url, headers={"If-None-Match": etag}) as response: assert response.status == 304
            with request(image_url, headers={"Range": "bytes=0-7"}) as response:
                assert response.status == 206 and response.read() == image.read_bytes()[:8]
            with request(image_url, headers={"Range": "bytes=-8"}) as response:
                assert response.status == 206 and response.read() == image.read_bytes()[-8:]
            with request(image_url, headers={"Range": "bytes=999999999-"}) as response: assert response.status == 416
            with request(image_url, "POST") as response: assert response.status == 405
            with request(origin + "/f/missing-" + stamp + ".png") as response:
                assert response.status == 404 and response.headers["Cache-Control"] == "no-store"
            duplicate = subprocess.run(["gcloud", "storage", "cp", str(image), "gs://" + BUCKET + "/" + image_key,
                                        "--if-generation-match=0", "--account=" + ACCOUNT], capture_output=True)
            assert duplicate.returncode != 0
            report["tests"].append("image checksum, HEAD, ETag, ranges, 404, 405, duplicate refusal")

            pdf = directory / "report.pdf"
            # A complete single-page PDF fixture with a real cross-reference table.
            parts = [b"%PDF-1.4\n"]
            offsets = [0]
            bodies = [b"<< /Type /Catalog /Pages 2 0 R >>", b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
                      b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R >>",
                      b"<< /Length 0 >>\nstream\n\nendstream"]
            for index, body in enumerate(bodies, 1):
                offsets.append(sum(map(len, parts)))
                parts.append(str(index).encode() + b" 0 obj\n" + body + b"\nendobj\n")
            xref = sum(map(len, parts))
            parts.append(b"xref\n0 5\n0000000000 65535 f \n")
            parts.extend(f"{offset:010d} 00000 n \n".encode() for offset in offsets[1:])
            parts.append(f"trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode())
            pdf.write_bytes(b"".join(parts))
            _, pdf_url = upload(pdf, ".pdf")
            with request(pdf_url) as response:
                assert response.status == 200 and response.headers["Content-Type"] == "application/pdf"
                assert response.read() == pdf.read_bytes()
            report["tests"].append("PDF inline response and exact bytes")

            active = directory / "active.html"
            active.write_text("<script>alert('fixture')</script>")
            key, active_url = upload(active, ".html")
            with request(active_url) as response:
                assert response.headers["Content-Disposition"].startswith("attachment")
                assert response.headers["X-Content-Type-Options"] == "nosniff"
            generation = cloud("objects", "describe", "gs://" + BUCKET + "/" + key, "--format=value(generation)")
            cloud("rm", "gs://" + BUCKET + "/" + key)
            with request(active_url + "?uncached=" + stamp) as response: assert response.status == 404
            cloud("restore", "gs://" + BUCKET + "/" + key + "#" + generation)
            with request(active_url + "?restored=" + stamp) as response: assert response.status == 200
            report["tests"].append("attachment handling, deletion, exact-generation soft-delete restore")

            large = directory / "large.bin"
            with large.open("wb") as stream: stream.truncate(MAX_BYTES)
            _, large_url = upload(large, ".bin")
            expected = hashlib.sha256()
            for _ in range(256): expected.update(bytes(1024 * 1024))
            started = time.monotonic()
            actual = hashlib.sha256(); count = 0
            with request(large_url) as response:
                assert response.status == 200
                while chunk := response.read(1024 * 1024): actual.update(chunk); count += len(chunk)
            assert count == MAX_BYTES and actual.digest() == expected.digest(), f"Incomplete download: {count}/{MAX_BYTES} bytes after {time.monotonic()-started:.2f}s"
            report["large_download"] = {"bytes": count, "sha256": actual.hexdigest(), "seconds": round(time.monotonic() - started, 2)}
            report["tests"].append("256 MiB streaming download and SHA-256")
    finally:
        for key in objects: cloud("rm", "gs://" + BUCKET + "/" + key)
    return report

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("origin")
    parser.add_argument("image", type=Path)
    arguments = parser.parse_args()
    print(json.dumps(run(arguments.origin, arguments.image), indent=2))
