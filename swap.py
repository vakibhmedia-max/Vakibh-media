import re

with open('e:/antigravati-vakibh-project/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract Section 4
s4_match = re.search(r'(    <!-- Section 4: Sant Parampara \(संत परंपरा\) -->\n    <section class="saints-section" id="saints">\n.*?</section>\n)', content, re.DOTALL)
if not s4_match:
    print('Failed to find Section 4')
    exit(1)

s4_content = s4_match.group(1)

# Remove Section 4
content = content.replace(s4_content, '')

# Extract Section 1
s1_match = re.search(r'(    <!-- Section 1: Quick Category Grid \(मुबलक संग्रह\) -->\n    <section class="quick-links-section" id="quickLinks">\n.*?</section>\n)', content, re.DOTALL)
if not s1_match:
    print('Failed to find Section 1')
    exit(1)

s1_content = s1_match.group(1)

# Replace Section 1 with Section 4
content = content.replace(s1_content, s4_content)

with open('e:/antigravati-vakibh-project/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Successfully swapped sections')
