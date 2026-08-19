import os

with open('changelog.md', 'r') as f:
    lines = f.readlines()

new_content = []
for line in lines:
    new_content.append(line)
    if line.strip() == "### Changed":
        new_content.append("- Expanded `EUD_country_data.json` from grouped entries to 33 distinct country entries, breaking out 'Rest of EU' into 24 distinct EU nations and 'EFTA' into 4 distinct nations.\n")

with open('changelog.md', 'w') as f:
    f.writelines(new_content)
