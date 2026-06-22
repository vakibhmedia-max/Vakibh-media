export type SantCategoryKey = "abhang" | "gaatha" | "ovi" | "granth";
export type SantContentItem = {
  id: string;
  title: string;
  content: string;
  source?: string;
};
export type SantContent = {
  sant: string;
  slug: string;
  image: string;
  intro: string;
  categories: Record<SantCategoryKey, SantContentItem[]>;
};

import santTukaram from "@/Vakibh/sant/tukaram.png";
import santDnyaneshwar from "@/Vakibh/sant/sant dnyaneshwar.png";
import santNamdev from "@/Vakibh/sant/sant namdev.png";
import santEknath from "@/Vakibh/sant/sant eknaath.png";
import santJanabai from "@/Vakibh/sant/janabai.png";
import santChokhoba from "@/Vakibh/sant/संत चोखामेळा महाराज.png";
import santSavata from "@/Vakibh/sant/sant savta maharaj.png";
import santGora from "@/Vakibh/sant/संत गोरा कुंभार.png";

const abhangTitles = [
  "नामस्मरणाची गोडी",
  "विठ्ठलभक्तीचा मार्ग",
  "संतसंगाचे महत्त्व",
  "अंतरीची प्रार्थना",
  "भक्तीतील समाधान",
  "करुणेची विनवणी",
  "हरिनामाचा आधार",
  "सद्गुरूचे स्मरण",
  "पंढरीची ओढ",
  "आत्मशांतीचा अनुभव",
];

const oviTitles = [
  "ओवी: विठ्ठल दर्शन",
  "ओवी: अंतरीचे सुख",
  "ओवी: संतांचे वचन",
  "ओवी: साधेपणाची वाट",
  "ओवी: भक्तीची सावली",
  "ओवी: हरिनामाची ज्योत",
  "ओवी: मनशांतीचा धागा",
  "ओवी: समाधानाचा अर्थ",
];

const gaathaTitles = [
  "गाथा: भक्तीचा उद्गार",
  "गाथा: विठ्ठल नाममहिमा",
  "गाथा: संतविचार",
  "गाथा: भक्ताचे मन",
  "गाथा: करुणेचे दान",
];

const granthTitles = [
  "ग्रंथ: नाममहिमा",
  "ग्रंथ: भक्तिपंथ",
  "ग्रंथ: संतवाङ्मय",
  "ग्रंथ: आध्यात्मिक चिंतन",
  "ग्रंथ: विठ्ठलसमाधान",
];

const genericVerseLines = [
  "विठ्ठल नाम घेता अंतरी उजेड दाटे.",
  "संतवाणी ऐकता मनाला शांत निवारा लाभे.",
  "भक्तीच्या वाटेवर चालतां अहंकार निवतो.",
  "पंढरीची ओढ लागता जीवाला नवे बळ येते.",
  "सद्गुरू स्मरणाने चित्त स्थिर होत जाते.",
  "नामाचा गजर झाला की दुःखाचा भार हलका होतो.",
  "करुणामूर्ती हरी चरणी ठेवितो हा सर्व भाव.",
  "संतसंग लाभता अंतरी प्रेमाचा झरा वाहतो.",
];

const intros = [
  "{name} यांच्या वाङ्मयातून भक्ती, नम्रता आणि विठ्ठलप्रेमाचा अखंड झरा प्रकट होतो.",
  "त्यांच्या रचनांमध्ये साधेपणा, अध्यात्म आणि लोकजीवनाशी जोडलेली अनुभूती दिसते.",
  "नामस्मरण, संतसंग आणि आत्मशांती यांचा सुंदर संगम या साहित्यामध्ये जाणवतो.",
  "भक्तीचा मार्ग सर्वांसाठी खुला आहे, हा संदेश त्यांच्या वचनांतून सतत उमटतो.",
  "विठ्ठलभक्तीला जीवनाचे केंद्रस्थान देत त्यांनी अंतरीची प्रार्थना शब्दबद्ध केली.",
];

const tukaramAbhangTitles = [
  "सुंदर ते ध्यान",
  "वृक्षवल्ली आम्हां सोयरे",
  "आम्ही जातो अमुच्या गावा",
  "अवघा रंग एक झाला",
  "जे का रंजले गांजले",
  "आधी बीज एकले",
  "माझे माहेर पंढरी",
  "देह जावो अथवा राहो",
  "नाम घेतल्याविण",
  "चित्त हरिपाठी लावा",
];

const pick = (list: string[], index: number) => list[index % list.length];

const makeIntro = (name: string) =>
  intros.map((sentence) => sentence.replace("{name}", name)).join(" ");

const makeVerse = (signature: string, index: number, lineCount: number) =>
  Array.from({ length: lineCount }, (_, offset) => pick(genericVerseLines, index + offset))
    .concat(`${signature} म्हणे नामीचि खरी शांती.`)
    .join("\n");

const buildItems = (
  slug: string,
  signature: string,
  titles: string[],
  kind: SantCategoryKey
) =>
  titles.map((title, index) => ({
    id: `${slug}-${kind}-${index + 1}`,
    title:
      slug === "tukaram" && kind === "abhang" && tukaramAbhangTitles[index]
        ? tukaramAbhangTitles[index]
        : title,
    content:
      kind === "abhang"
        ? makeVerse(signature, index, 4)
        : kind === "ovi"
          ? makeVerse(signature, index + 2, 3)
          : kind === "gaatha"
            ? makeVerse(signature, index + 4, 5)
            : makeVerse(signature, index + 1, 4),
  }));

const santSeeds = [
  { sant: "संत तुकाराम", slug: "tukaram", image: santTukaram, signature: "तुका" },
  { sant: "संत ज्ञानेश्वर", slug: "dnyaneshwar", image: santDnyaneshwar, signature: "ज्ञानदेव" },
  { sant: "संत नामदेव", slug: "namdev", image: santNamdev, signature: "नामदेव" },
  { sant: "संत एकनाथ", slug: "eknath", image: santEknath, signature: "एकनाथ" },
  { sant: "संत जनाबाई", slug: "janabai", image: santJanabai, signature: "जनी" },
  { sant: "संत चोखामेळा", slug: "chokhamela", image: santChokhoba, signature: "चोखा" },
  { sant: "संत सावता माळी", slug: "savata-mali", image: santSavata, signature: "सावता" },
  { sant: "संत गोरा कुंभार", slug: "gora-kumbhar", image: santGora, signature: "गोरा" },
];

export const santContent: SantContent[] = santSeeds.map((sant) => ({
  sant: sant.sant,
  slug: sant.slug,
  image: sant.image,
  intro: makeIntro(sant.sant),
  categories: {
    abhang: buildItems(sant.slug, sant.signature, abhangTitles, "abhang"),
    gaatha: buildItems(sant.slug, sant.signature, gaathaTitles, "gaatha"),
    ovi: buildItems(sant.slug, sant.signature, oviTitles, "ovi"),
    granth: buildItems(sant.slug, sant.signature, granthTitles, "granth"),
  },
}));

export const getSantBySlug = (slug: string) =>
  santContent.find((sant) => sant.slug === slug);

export const getSantSlugByName = (name: string) =>
  santContent.find((sant) => sant.sant === name)?.slug;
