import re
import os
import json

templates_dir = r"C:\Users\giuse\projects\Code Builder Course\Prelegal\templates"
output = {}

for filename in os.listdir(templates_dir):
    if not filename.endswith(".md"):
        continue
    filepath = os.path.join(templates_dir, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Find all span placeholders
    spans = re.findall(r'<span\s+[^>]*class=["\']([^"\']+)["\'][^>]*>([^<]+)</span>', content)
    # Find all bracket placeholders (e.g. [Fill in State], [Today's Date])
    brackets = re.findall(r'\[([^\]\n]{2,40})\]', content)
    
    unique_placeholders = set()
    for cls, text in spans:
        if "header_" not in cls: # Skip styling classes
            unique_placeholders.add(text.strip())
            
    for text in brackets:
        # Filter out md checklist boxes like [ ] and [x]
        if text.strip().lower() not in ["", " ", "x"]:
            unique_placeholders.add(text.strip())
            
    output[filename] = sorted(list(unique_placeholders))

print(json.dumps(output, indent=2))
