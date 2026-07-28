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
bio_url = "https://www.santsahitya.in/mahati-santanchi/sant-narhari-sonar/"
bio_soup = fetch_soup(bio_url)
bio_text = clean_text_block(bio_soup)

# 2. Fetch Mandir / Samadhi Info
print("--- 2. Fetching Mandir / Samadhi Info ---")
mandir_url = "https://www.santsahitya.in/tirthkshetra/narhari-sonar-samadhi/"
mandir_soup = fetch_soup(mandir_url)
mandir_text = clean_text_block(mandir_soup)

# 3. Discover All Abhang URLs
print("--- 3. Discovering All Abhang URLs ---")
abhang_urls = []
page = 1
while True:
    index_url = "https://www.santsahitya.in/narhari-sonar/" if page == 1 else f"https://www.santsahitya.in/narhari-sonar/page/{page}/"
    soup = fetch_soup(index_url)
    if not soup and page > 1:
        soup = fetch_soup(f"https://www.santsahitya.in/narhari-sonar/{page}/")
    if not soup:
        break
        
    found_on_page = 0
    for a in soup.find_all('a', href=True):
        href = a['href']
        title = a.text.strip()
        if 'narhari-sonar' in href and title and href != 'https://www.santsahitya.in/narhari-sonar/' and not href.endswith('/feed/'):
            if not any(item['url'] == href for item in abhang_urls):
                abhang_urls.append({'title': title, 'url': href})
                found_on_page += 1
    print(f"Page {page}: found {found_on_page} new links. Total so far: {len(abhang_urls)}")
    if found_on_page == 0:
        break
    page += 1

print(f"Total unique Abhang URLs discovered: {len(abhang_urls)}")

# 4. Fetch Full Content of Every Abhang
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

# 5. Save JSON Master Database
master_data = {
    "sant": "संत नरहरी सोनार",
    "main_url": "https://www.santsahitya.in/narhari-sonar/",
    "total_abhangas": len(abhangs_dataset),
    "biography": {
        "url": bio_url,
        "full_text": bio_text
    },
    "mandir": {
        "url": mandir_url,
        "full_text": mandir_text
    },
    "abhangas": abhangs_dataset
}

json_file = os.path.join(base_dir, "sant_narhari_sonar_full_data.json")
with open(json_file, "w", encoding="utf-8") as f:
    json.dump(master_data, f, ensure_ascii=False, indent=2)

# 6. Save Markdown Files

# Biography
with open(os.path.join(base_dir, "sant_narhari_sonar_mahiti.md"), "w", encoding="utf-8") as f:
    f.write(f"# संत नरहरी सोनार माहिती (संपूर्ण चरित्र)\n\n**स्रोत URL:** {bio_url}\n\n---\n\n{bio_text}\n")

# Mandir
with open(os.path.join(base_dir, "sant_narhari_sonar_mandir.md"), "w", encoding="utf-8") as f:
    f.write(f"# संत नरहरी सोनार मंदिर व समाधी स्थान\n\n**स्रोत URL:** {mandir_url}\n\n---\n\n{mandir_text}\n")

# Abhang Gatha
abhang_gatha_md = f"# संत नरहरी सोनार संपूर्ण अभंग गाथा (अभंग १ ते {len(abhangs_dataset)})\n\n"
abhang_gatha_md += f"**मुख्य स्रोत URL:** https://www.santsahitya.in/narhari-sonar/\n\n"
abhang_gatha_md += f"**एकूण अभंग:** {len(abhangs_dataset)}\n\n---\n\n"

for ab in abhangs_dataset:
    abhang_gatha_md += f"## {ab['id']}. {ab['title']}\n\n"
    abhang_gatha_md += f"**URL:** {ab['url']}\n\n"
    abhang_gatha_md += f"```text\n{ab['full_text']}\n```\n\n---\n\n"

with open(os.path.join(base_dir, "sant_narhari_sonar_abhang_gatha.md"), "w", encoding="utf-8") as f:
    f.write(abhang_gatha_md)

# README
readme_text = f"""# संत नरहरी सोनार संपूर्ण डेटाबेस (Sant Narhari Sonar Complete Dataset)

हा डेटाबेस [https://www.santsahitya.in/narhari-sonar/](https://www.santsahitya.in/narhari-sonar/) या संकेतस्थळावरून चरित्र, समाधी स्थान व अभंग गाथेसह संपूर्ण संकलित केला आहे.

## समाविष्ट फाइल्स (Files Included):

1. **`sant_narhari_sonar_full_data.json`** - संपूर्ण डेटा JSON स्वरूपात (Biography, Mandir, All {len(abhangs_dataset)} Abhangas with full verses).
2. **`sant_narhari_sonar_mahiti.md`** - संत नरहरी सोनार यांचे संपूर्ण चरित्र (शिव उपासक, विठ्ठलाची सोनसाखळी कथा, डोळ्यावर पट्टीचा प्रसंग, हरि-हर ऐक्य).
3. **`sant_narhari_sonar_mandir.md`** - परळी वैजनाथ व पंढरपूर येथील संत नरहरी सोनार समाधी मंदिराची माहिती.
4. **`sant_narhari_sonar_abhang_gatha.md`** - संत नरहरी सोनार संपूर्ण अभंग गाथा (१ ते {len(abhangs_dataset)} सर्व अभंगांचे संपूर्ण चरण).

## मुख्य संक्षिप्त माहिती (Summary Highlights):
- **नाव:** संत नरहरी सोनार (पंढरपूर)
- **उपासना:** शिव-विठ्ठल ऐक्य (हरि-हर ऐक्य)
- **प्रसिद्ध अभंग:** "देवा तुझा मी सोनार । तुझ्या नामाचा व्यवहार ।।"
- **समाधी स्थान:** परळी वैजनाथ / पंढरपूर (माघ कृष्ण तृतीया / १२८५ - १३१४ इ.स.)
- **एकूण संकलित अभंग:** {len(abhangs_dataset)} अभंग संपूर्ण चरण व पाठासह.
"""

with open(os.path.join(base_dir, "README.md"), "w", encoding="utf-8") as f:
    f.write(readme_text)

print(f"\nSUCCESS! Extracted complete data for Sant Narhari Sonar ({len(abhangs_dataset)} Abhangas) into workspace files!")
