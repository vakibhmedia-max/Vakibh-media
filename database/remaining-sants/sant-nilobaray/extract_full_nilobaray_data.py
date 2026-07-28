import urllib.request
import json
import os
import sys
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding='utf-8')
base_dir = os.path.dirname(os.path.abspath(__file__))
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

def fetch_soup(url):
    try:
        req = urllib.request.Request(url, headers=headers)
        html = urllib.request.urlopen(req, timeout=12).read().decode('utf-8')
        return BeautifulSoup(html, 'html.parser')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def clean_text_block(soup):
    if not soup:
        return ""
    entry = soup.find(class_=lambda c: c and ('entry-content' in c or 'post-content' in c or 'article' in c))
    if not entry:
        entry = soup.find('article') or soup.body
        
    lines = []
    for elem in entry.find_all(['h1', 'h2', 'h3', 'h4', 'p', 'div', 'li']):
        txt = elem.text.strip()
        if not txt:
            continue
        if any(bad in txt for bad in ['कृषी क्रांती', 'जाहिराती', 'Previous Post', 'Next Post', 'Leave a Comment', 'Type here..', 'Your email address']):
            continue
        if not lines or lines[-1] != txt:
            lines.append(txt)
    return "\n\n".join(lines)

# 1. Fetch Biography
print("--- 1. Fetching Biography ---")
bio_url = "https://www.santsahitya.in/mahati-santanchi/niloba-maharaj/"
bio_soup = fetch_soup(bio_url)
bio_text = clean_text_block(bio_soup)

# 2. Fetch Aarti
print("--- 2. Fetching Aarti ---")
aarti_url = "https://www.santsahitya.in/nilobaray/nilobaray-aartya/"
aarti_soup = fetch_soup(aarti_url)
aarti_text = clean_text_block(aarti_soup)

# 3. Discover All Literature & Abhang URLs
print("--- 3. Discovering All Literature & Abhang URLs ---")
discovered_urls = []
page = 1
while page <= 15:
    index_url = "https://www.santsahitya.in/sant-nilobaray/" if page == 1 else f"https://www.santsahitya.in/sant-nilobaray/page/{page}/"
    soup = fetch_soup(index_url)
    if not soup:
        break
        
    found_on_page = 0
    for a in soup.find_all('a', href=True):
        href = a['href']
        title = a.text.strip()
        if 'nilobaray' in href and title and href != 'https://www.santsahitya.in/sant-nilobaray/' and not href.endswith('/feed/'):
            if not any(item['url'] == href for item in discovered_urls):
                discovered_urls.append({'title': title, 'url': href})
                found_on_page += 1
    print(f"Page {page}: found {found_on_page} new links. Total so far: {len(discovered_urls)}")
    if found_on_page == 0:
        break
    page += 1

print(f"Total unique literature/abhang URLs discovered: {len(discovered_urls)}")

# 4. Fetch Full Content of Every Link
literature_dataset = []
for idx, item in enumerate(discovered_urls):
    print(f"[{idx+1}/{len(discovered_urls)}] Fetching: {item['title']}")
    l_soup = fetch_soup(item['url'])
    full_text = clean_text_block(l_soup)
    literature_dataset.append({
        "id": idx + 1,
        "title": item['title'],
        "url": item['url'],
        "full_text": full_text
    })

# 5. Save JSON Master Database
master_data = {
    "sant": "संत निळोबाराय महाराज",
    "main_url": "https://www.santsahitya.in/sant-nilobaray/",
    "total_literature_items": len(literature_dataset),
    "biography": {
        "url": bio_url,
        "full_text": bio_text
    },
    "aarti": {
        "url": aarti_url,
        "full_text": aarti_text
    },
    "literature": literature_dataset
}

json_file = os.path.join(base_dir, "sant_nilobaray_full_data.json")
with open(json_file, "w", encoding="utf-8") as f:
    json.dump(master_data, f, ensure_ascii=False, indent=2)

# 6. Save Markdown Files

# Biography
with open(os.path.join(base_dir, "sant_niloba_maharaj_mahiti.md"), "w", encoding="utf-8") as f:
    f.write(f"# संत निळोबाराय महाराज माहिती (संपूर्ण चरित्र)\n\n**स्रोत URL:** {bio_url}\n\n---\n\n{bio_text}\n")

# Aarti
with open(os.path.join(base_dir, "sant_niloba_maharaj_aarti.md"), "w", encoding="utf-8") as f:
    f.write(f"# संत निळोबाराय महाराज आरत्या\n\n**स्रोत URL:** {aarti_url}\n\n---\n\n{aarti_text}\n")

# Literature & Abhang Gatha
lit_md = f"# संत निळोबाराय महाराज संपूर्ण साहित्य व अभंग संग्रह (१ ते {len(literature_dataset)})\n\n"
lit_md += f"**मुख्य स्रोत URL:** https://www.santsahitya.in/sant-nilobaray/\n\n"
lit_md += f"**एकूण साहित्य नोंदी:** {len(literature_dataset)}\n\n---\n\n"

for lit in literature_dataset:
    lit_md += f"## {lit['id']}. {lit['title']}\n\n"
    lit_md += f"**URL:** {lit['url']}\n\n"
    lit_md += f"```text\n{lit['full_text']}\n```\n\n---\n\n"

with open(os.path.join(base_dir, "sant_nilobaray_abhang_gatha.md"), "w", encoding="utf-8") as f:
    f.write(lit_md)

# README
readme_text = f"""# संत निळोबाराय महाराज संपूर्ण डेटाबेस (Sant Nilobaray Maharaj Complete Dataset)

हा डेटाबेस [https://www.santsahitya.in/sant-nilobaray/](https://www.santsahitya.in/sant-nilobaray/) या संकेतस्थळावरून चरित्र, आरत्या, अभंग व संपूर्ण साहित्यासह संकलित केलेला आहे.

## समाविष्ट फाइल्स (Files Included):

1. **`sant_nilobaray_full_data.json`** - संपूर्ण डेटा JSON स्वरूपात (Biography, Aarti, {len(literature_dataset)} Literature & Abhang entries).
2. **`sant_niloba_maharaj_mahiti.md`** - संत निळोबाराय महाराज यांचे संपूर्ण चरित्र (पिंपळनेर रामलिंग उपासना, कुलकर्ण वतन त्याग, पंढरी पायी वारी).
3. **`sant_niloba_maharaj_aarti.md`** - संत निळोबाराय महाराज आरत्या.
4. **`sant_nilobaray_abhang_gatha.md`** - संत निळोबाराय महाराज संपूर्ण अभंग व साहित्य (मंगलाचरण, बालक्रीडा, कृष्णचरित्र, गौळणी, विरहिणी, काला, खेळ, लळित, पंढरीमहात्म्य, ज्ञानपर, चांगदेव चरित्र इत्यादी).

## मुख्य संक्षिप्त माहिती (Summary Highlights):
- **नाव:** संत निळोबाराय महाराज (पिंपळनेर)
- **स्थान:** घोडनदी काठ, पिंपळनेर / पारनेर, महाराष्ट्र
- **उपासना:** रामलिंग प्रभु रामचंद्र उपासना, पांडुरंग भक्ती, पंढरपूर देहू आळंदी वारी.
- **एकूण साहित्य नोंदी:** {len(literature_dataset)} रचना व अभंग संपूर्ण पाठ व चरणांसह.
"""

with open(os.path.join(base_dir, "README.md"), "w", encoding="utf-8") as f:
    f.write(readme_text)

print(f"\nSUCCESS! Extracted complete data for Sant Nilobaray Maharaj ({len(literature_dataset)} literature items) into workspace files!")
