from __future__ import annotations

import json
import re
from html import unescape
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SANTS_DIR = ROOT / "sants"
OUTPUT_FILE = ROOT / "Vakibh" / "data" / "search-index.json"


TAG_RE = re.compile(r"<[^>]+>")
SPACE_RE = re.compile(r"\s+")
TITLE_RE = re.compile(r"<title>(.*?)</title>", re.IGNORECASE | re.DOTALL)
META_DESC_RE = re.compile(
    r'<meta\s+name="description"\s+content="(.*?)"\s*/?>',
    re.IGNORECASE | re.DOTALL,
)
H1_RE = re.compile(r"<h1[^>]*>(.*?)</h1>", re.IGNORECASE | re.DOTALL)
BODY_TEXT_RE = re.compile(
    r'<(?:p|h2|h3|a)[^>]*>(.*?)</(?:p|h2|h3|a)>',
    re.IGNORECASE | re.DOTALL,
)


def clean_html_text(value: str) -> str:
    text = TAG_RE.sub(" ", value)
    text = unescape(text)
    text = text.replace("\xa0", " ")
    return SPACE_RE.sub(" ", text).strip()


def extract_first(pattern: re.Pattern[str], html: str) -> str:
    match = pattern.search(html)
    return clean_html_text(match.group(1)) if match else ""


def infer_page_type(path: Path) -> str:
    parts = {part.lower() for part in path.parts}
    if any("abhang" in part for part in parts):
        return "अभंग"
    if any("aarti" in part for part in parts):
        return "आरती"
    if any("charitra" in part for part in parts):
        return "चरित्र"
    if any("tirth" in part for part in parts):
        return "तीर्थक्षेत्र"
    if any("gatha" in part for part in parts):
        return "गाथा"
    return "साहित्य"


def build_search_index() -> list[dict[str, str]]:
    entries: list[dict[str, str]] = []

    for file_path in sorted(SANTS_DIR.rglob("index.html")):
        html = file_path.read_text(encoding="utf-8", errors="ignore")
        relative_path = file_path.relative_to(ROOT).as_posix()
        title = extract_first(TITLE_RE, html)
        description = extract_first(META_DESC_RE, html)
        heading = extract_first(H1_RE, html)

        text_fragments = [clean_html_text(fragment) for fragment in BODY_TEXT_RE.findall(html)]
        text_fragments = [fragment for fragment in text_fragments if fragment]
        excerpt = " ".join(text_fragments[:8])
        excerpt = excerpt[:320].strip()

        saint_slug = relative_path.split("/")[1] if "/" in relative_path else ""
        saint_name = saint_slug.replace("-", " ").strip()

        entries.append(
            {
                "title": title or heading or saint_name or "Vakibh",
                "heading": heading or title,
                "description": description,
                "excerpt": excerpt,
                "path": relative_path,
                "saint": saint_name,
                "type": infer_page_type(file_path.relative_to(SANTS_DIR)),
            }
        )

    return entries


def main() -> None:
    entries = build_search_index()
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(
        json.dumps(entries, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Wrote {len(entries)} records to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
