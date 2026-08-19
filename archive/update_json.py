import json
import copy

with open('EUD_country_data.json', 'r') as f:
    data = json.load(f)

rest_of_eu_data = data.pop('Rest of EU')
efta_data = data.pop('EFTA')

eu24 = [
    "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark", 
    "Estonia", "Finland", "Greece", "Hungary", "Ireland", "Latvia", "Lithuania", 
    "Luxembourg", "Malta", "Netherlands", "Poland", "Portugal", "Romania", 
    "Slovakia", "Slovenia", "Spain", "Sweden"
]

efta4 = ["Switzerland", "Norway", "Iceland", "Liechtenstein"]

for country in eu24:
    data[country] = copy.deepcopy(rest_of_eu_data)

for country in efta4:
    data[country] = copy.deepcopy(efta_data)

with open('EUD_country_data.json', 'w') as f:
    json.dump(data, f, indent=2)
