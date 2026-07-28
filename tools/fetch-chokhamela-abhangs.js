const fs = require("fs");
const path = require("path");

const databaseDir = path.resolve(__dirname, "..", "database");
const devanagari = "०१२३४५६७८९";
const toAsciiNumber = (value) =>
  Number(String(value).replace(/[०-९]/g, (digit) => devanagari.indexOf(digit)));
const decode = (value) =>
  value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)))
    .replace(/&amp;/g, "&");
const titleKey = (value) =>
  decode(value)
    .replace(/\s*[–-]\s*संत\s+चोखामेळा\s+अभंग\s*[–-]\s*[०-९\d]+\s*$/u, "")
    .replace(/\s+/g, " ")
    .trim();

function cleanContent(rendered) {
  const sections = rendered.split(/<hr\s*\/?>/gi);
  if (sections.length >= 3 && sections[1].trim()) {
    return sections[1]
      .replace(/<h[1-6][^>]*>/gi, "<div>")
      .replace(/<\/h[1-6]>/gi, "</div>")
      .trim();
  }
  const heading = rendered.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
  if (heading) return `<div>${heading[1]}</div>`;

  const beforePrompt = rendered.split(/राम कृष्ण हरी आपणास/i)[0];
  return beforePrompt
    .replace(/<h2[^>]*>[\s\S]*?<\/h2>/gi, "")
    .replace(/<hr\s*\/?>/gi, "")
    .trim();
}

async function recoverCategory({ categoryId, pages, saintPattern, outputName }) {
  const posts = [];
  for (let page = 1; page <= pages; page += 1) {
    const url =
      `https://www.santsahitya.in/wp-json/wp/v2/posts?categories=${categoryId}&per_page=100&page=${page}` +
      "&_fields=title,content,slug,link";
    const response = await fetch(url, { headers: { "user-agent": "Vakibh local content recovery" } });
    if (!response.ok) throw new Error(`API page ${page}: HTTP ${response.status}`);
    posts.push(...(await response.json()));
  }

  const recovered = {};
  for (const post of posts) {
    const title = decode(post.title?.rendered || "");
    const numberMatch = title.match(/अभंग\s*[–-]\s*([०-९\d]+)\s*$/);
    const key = title
      .replace(saintPattern, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!key) continue;
    recovered[key] = {
      number: numberMatch ? toAsciiNumber(numberMatch[1]) : null,
      title,
      verse: cleanContent(post.content?.rendered || ""),
      source: post.link || "",
    };
  }

  const outputPath = path.join(databaseDir, outputName);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(recovered, null, 2)}\n`, "utf8");
  process.stdout.write(`Recovered ${Object.keys(recovered).length} entries into ${outputName}\n`);
}

async function main() {
  await recoverCategory({
    categoryId: 3116,
    pages: 4,
    saintPattern: /\s*[–-]\s*संत\s+चोखामेळा\s+अभंग\s*[–-]\s*[०-९\d]+\s*$/u,
    outputName: "chokhamela-abhang-content.json",
  });
  await recoverCategory({
    categoryId: 202,
    pages: 3,
    saintPattern: /\s*[–-]\s*(?:संत\s+)?निवृत्तीनाथ\s+अभंग(?:\s*[–-]\s*[०-९\d]+)?\s*$/u,
    outputName: "nivruttinath-abhang-content.json",
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
