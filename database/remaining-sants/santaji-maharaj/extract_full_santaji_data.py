import urllib.request
import json
import os
import sys
import re
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
        # Ignore ads, navigation and comments form
        txt = elem.text.strip()
        if not txt:
            continue
        if any(bad in txt for bad in ['कृषी क्रांती', 'जाहिराती', 'Previous Post', 'Next Post', 'Leave a Comment', 'Type here..', 'Your email address']):
            continue
        # Avoid duplicate lines from nested tags
        if not lines or lines[-1] != txt:
            lines.append(txt)
    return "\n\n".join(lines)

# 1. Fetch Biography
print("--- 1. Fetching Biography ---")
bio_url = "https://www.santsahitya.in/mahati-santanchi/sant-jagnade-maharaj/"
bio_soup = fetch_soup(bio_url)
bio_text = clean_text_block(bio_soup)

# 2. Fetch Aarti
print("--- 2. Fetching Aarti ---")
aarti_url = "https://www.santsahitya.in/arti/jganade-aarti/"
aarti_soup = fetch_soup(aarti_url)
aarti_text = clean_text_block(aarti_soup)

# 3. Fetch Mandir Info
print("--- 3. Fetching Mandir Info ---")
mandir_url = "https://www.santsahitya.in/tirthkshetra/jagnade-mandir/"
mandir_soup = fetch_soup(mandir_url)
mandir_text = clean_text_block(mandir_soup)

# 4. Discover All 86 Abhang URLs
print("--- 4. Discovering All Abhang URLs ---")
abhang_urls = []
page = 1
while True:
    index_url = "https://www.santsahitya.in/santaji-maharaj/" if page == 1 else f"https://www.santsahitya.in/santaji-maharaj/page/{page}/"
    soup = fetch_soup(index_url)
    if not soup and page > 1:
        soup = fetch_soup(f"https://www.santsahitya.in/santaji-maharaj/{page}/")
    if not soup:
        break
        
    found_on_page = 0
    for a in soup.find_all('a', href=True):
        href = a['href']
        title = a.text.strip()
        if 'sant-santaji-abhang' in href and title:
            if not any(item['url'] == href for item in abhang_urls):
                abhang_urls.append({'title': title, 'url': href})
                found_on_page += 1
    print(f"Page {page}: found {found_on_page} new abhangs. Total: {len(abhang_urls)}")
    if found_on_page == 0:
        break
    page += 1

print(f"Total unique Abhang URLs discovered: {len(abhang_urls)}")

# 5. Fetch Complete Text of Every Abhang
abhangs_dataset = []
for idx, item in enumerate(abhang_urls):
    print(f"[{idx+1}/{len(abhang_urls)}] Fetching: {item['title']}")
    a_soup = fetch_soup(item['url'])
    full_abhang_text = clean_text_block(a_soup)
    abhangs_dataset.append({
        "id": idx + 1,
        "title": item['title'],
        "url": item['url'],
        "full_text": full_abhang_text
    })

# 6. Save JSON Master Database
master_data = {
    "sant": "संत संताजी जगनाडे महाराज",
    "main_url": "https://www.santsahitya.in/santaji-maharaj/",
    "total_abhangas": len(abhangs_dataset),
    "biography": {
        "url": bio_url,
        "full_text": bio_text
    },
    "aarti": {
        "url": aarti_url,
        "full_text": aarti_text
    },
    "mandir": {
        "url": mandir_url,
        "full_text": mandir_text
    },
    "abhangas": abhangs_dataset
}

json_file = os.path.join(base_dir, "santaji_maharaj_full_data.json")
with open(json_file, "w", encoding="utf-8") as f:
    json.dump(master_data, f, ensure_ascii=False, indent=2)

# 7. Write Markdown Files

# Biography Markdown
with open(os.path.join(base_dir, "sant_jagnade_maharaj_mahiti.md"), "w", encoding="utf-8") as f:
    f.write(f"# संत जगनाडे महाराज माहिती (संपूर्ण चरित्र)\n\n**स्रोत URL:** {bio_url}\n\n---\n\n{bio_text}\n")

# Aarti Markdown
with open(os.path.join(base_dir, "sant_jagnade_maharaj_aarti.md"), "w", encoding="utf-8") as f:
    f.write(f"# संत जगनाडे महाराज आरती (संपूर्ण)\n\n**स्रोत URL:** {aarti_url}\n\n---\n\n{aarti_text}\n")

# Mandir Markdown
with open(os.path.join(base_dir, "sant_jagnade_maharaj_mandir.md"), "w", encoding="utf-8") as f:
    f.write(f"# संत जगनाडे महाराज मंदिर व समाधी स्थान\n\n**स्रोत URL:** {mandir_url}\n\n---\n\n{mandir_text}\n")

# Complete Abhang Gatha Markdown
abhang_gatha_md = f"# संत संताजी जगनाडे महाराज संपूर्ण अभंग गाथा (अभंग १ ते {len(abhangs_dataset)})\n\n"
abhang_gatha_md += f"**मुख्य स्रोत URL:** https://www.santsahitya.in/santaji-maharaj/\n\n"
abhang_gatha_md += f"**एकूण अभंग:** {len(abhangs_dataset)}\n\n---\n\n"

for ab in abhangs_dataset:
    abhang_gatha_md += f"## {ab['id']}. {ab['title']}\n\n"
    abhang_gatha_md += f"**URL:** {ab['url']}\n\n"
    abhang_gatha_md += f"```text\n{ab['full_text']}\n```\n\n---\n\n"

with open(os.path.join(base_dir, "sant_santaji_abhang_gatha.md"), "w", encoding="utf-8") as f:
    f.write(abhang_gatha_md)

# README Markdown
readme_text = f"""# संत संताजी जगनाडे महाराज संपूर्ण डेटाबेस (Santaji Maharaj Complete Dataset)

हा डेटाबेस [https://www.santsahitya.in/santaji-maharaj/](https://www.santsahitya.in/santaji-maharaj/) या संकेतस्थळावरून सर्व अभंग (१ ते {len(abhangs_dataset)}), चरित्र, आरती व मंदिर माहितीसह संपूर्ण संकलित केला आहे.

## समाविष्ट फाइल्स (Files Included):

1. **`santaji_maharaj_full_data.json`** - संपूर्ण डेटा JSON स्वरूपात (Biography, Aarti, Mandir, All 86 Abhangas with full verses).
2. **`sant_jagnade_maharaj_mahiti.md`** - संत संताजी जगनाडे महाराज यांचे संपूर्ण चरित्र (बालपण, विवाह, गुरुभेट, संत तुकाराम महाराज सहकार्य).
3. **`sant_jagnade_maharaj_aarti.md`** - संत जगनाडे महाराज यांच्या दोन्ही आरत्या (पूर्ण विडिओ/पाठ मजकुरासह).
4. **`sant_jagnade_maharaj_mandir.md`** - सुदुंबरे (मावळ, पुणे) येथील संत जगनाडे महाराज मंदिर व समाधी स्थानाची माहिती.
5. **`sant_santaji_abhang_gatha.md`** - संत संताजी जगनाडे महाराज अभंग गाथा (१ ते {len(abhangs_dataset)} सर्व अभंगांचे संपूर्ण चरण).

## मुख्य संक्षिप्त माहिती (Summary Highlights):
- **नाव:** संत संताजी विठोबा जगनाडे महाराज (अंदाजे १६२४ – १६८८)
- **स्थान:** सुदुंबरे, तालुका मावळ, जिल्हा पुणे, महाराष्ट्र
- **योगदान:** संत तुकाराम महाराजांचे प्रमुख चौदा टाळकऱ्यांपैकी एक आणि तुकाराम अभंग गाथेचे निष्ठावंत लेखनिक.
- **एकूण संकलित अभंग:** {len(abhangs_dataset)} अभंग संपूर्ण चरण व पाठासह.
"""

with open(os.path.join(base_dir, "README.md"), "w", encoding="utf-8") as f:
    f.write(readme_text)

print(f"\nSUCCESS! Extracted complete data for {len(abhangs_dataset)} Abhangas, Biography, Aarti & Mandir into workspace files!")
