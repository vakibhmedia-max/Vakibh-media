# Vaakibh Marathi Content and Unicode Audit

Generated: 2026-08-19

## Scope

- 6,520 text/source files scanned under `Vakibh-media`.
- Public HTML, Marathi literature, blog content, search data, shared JavaScript/CSS, and retained source mirrors were included.
- Database records changed: 0.
- UI/layout/functionality changes: 0.

## Safe automatic cleanup

- 64 files were normalized to Unicode NFC.
- 26 accidental U+200B zero-width spaces were removed while preserving Marathi ZWJ/U+200C and ZWNJ/U+200D shaping characters.
- A reusable scanner and a separate conservative fixer were added under `scripts/`.
- 102 read-only/locked imported files were not modified; their findings remain in the JSON report.

## Current scan result

- Affected files: 126
- Total findings: 1,742
- Review findings: 495
- Raw confirmed-pattern findings: 1,247

The raw confirmed count includes known non-public/vendor cases described below and must not be interpreted as 1,247 corrupted Marathi passages.

## Priority finding: Amrutanubhav

`sants/dnyaneshwar/amrutanubhav/index.html` contains severe source OCR corruption rather than a UTF-8 decoding failure. The source includes malformed words and stray OCR glyphs such as `म्लोक`, `निटत्तिनाथ`, `ड्`, `ख्होक`, Vedic accent marks in ordinary prose, and `«५`-style verse-number artifacts.

- Suspicious OCR-mark occurrences detected: 154.
- These were not auto-rewritten because a character substitution cannot safely reconstruct the intended संत साहित्य.
- A verified edition/transcription is required before replacing this text. Guessing would risk changing the literary meaning.

## Other manual-review priorities

- `puravni-abhang/index.html`: 203 suspicious OCR marks; verify against its source edition.
- 88 files remain non-NFC because they are read-only/locked in the current environment.
- 32 U+200B zero-width spaces remain in read-only/locked files.
- 10 mixed Latin/Devanagari word contexts require editorial review.
- 3 repeated non-breaking-space sequences require layout-aware review.

## Non-public or third-party findings

- 1,199 mojibake-pattern matches in `Vakibh/css/sant.css` occur in developer comments, not rendered Marathi content.
- 24 matches in `Vakibh/js/main.js` are primarily corruption-detection regex data or comments.
- 2 U+FFFD matches are inside retained mirrored minified jQuery UI files.
- 4 control-character matches are inside retained mirrored WordPress i18n minified files.
- 18 private-use characters are icon-font codepoints in mirrored WooCommerce/theme CSS.

These were intentionally not changed because they do not represent visible Marathi literature and editing minified/vendor assets can introduce regressions.

## Root causes

1. OCR-derived Marathi source was imported without an editorial verification pass, especially in Amrutanubhav and Puravni Abhang.
2. Some files contain canonically equivalent but inconsistent Unicode sequences and accidental zero-width spaces from copied/imported content.
3. Retained third-party mirrors and old comments contain legacy encoding artifacts that are not rendered public content.
4. A subset of imported files is locked/read-only, preventing conservative normalization.

## Machine-readable details

See `reports/marathi-content-audit.json` for file path, page title, line number, Unicode codepoint, severity, and surrounding context for every finding.

