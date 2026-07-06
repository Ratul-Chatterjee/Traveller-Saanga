import json

path = 'server/data/places_cache.json'
with open(path, encoding='utf-8') as f:
    data = json.load(f)

correct = {
    'dest-1': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Konarka_Temple.jpg/960px-Konarka_Temple.jpg',
    'dest-2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Shri_Jagannath_temple.jpg/960px-Shri_Jagannath_temple.jpg',
    'dest-3': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Lingaraj_Temple_%2C_Bhubaneswar.jpg/960px-Lingaraj_Temple_%2C_Bhubaneswar.jpg',
    'dest-4': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Birds_eyeview_of_Chilika_Lake.jpg/960px-Birds_eyeview_of_Chilika_Lake.jpg',
    'dest-5': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Simlipal_tiger_reserve.jpg/960px-Simlipal_tiger_reserve.jpg',
    'dest-6': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Barehipani_Falls.jpg/960px-Barehipani_Falls.jpg',
    'dest-7': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/ShantiSthupa_Dhauli.jpg/960px-ShantiSthupa_Dhauli.jpg',
    'dest-8': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Khandagari_and_Udaygiri_featured_image.jpg/960px-Khandagari_and_Udaygiri_featured_image.jpg',
    'dest-9': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Rath_Yatra_Puri_07-11027.jpg/960px-Rath_Yatra_Puri_07-11027.jpg',
    'dest-10': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Sunrise_at_Puri_Sea_Beach.jpg/960px-Sunrise_at_Puri_Sea_Beach.jpg',
    'dest-11': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Lighthouse_%40_Gopalpur_%2815808803206%29.jpg/960px-Lighthouse_%40_Gopalpur_%2815808803206%29.jpg',
    'dest-12': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Chandipur_sea_beach_Baleswar.jpg/960px-Chandipur_sea_beach_Baleswar.jpg',
    'dest-13': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Parsurameswara_temple_complex.jpg/960px-Parsurameswara_temple_complex.jpg',
    'dest-14': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Mukteshvara_Temple%2C_Bhubaneswar.jpg/960px-Mukteshvara_Temple%2C_Bhubaneswar.jpg',
    'dest-15': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Rajarani_Temple_04.jpg/960px-Rajarani_Temple_04.jpg',
    'dest-16': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Jagannath_temple_of_Koraput_03.jpg/960px-Jagannath_temple_of_Koraput_03.jpg',
    'dest-17': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Saptasajya_Temple_on_Hill_Top.jpg/960px-Saptasajya_Temple_on_Hill_Top.jpg',
    'dest-18': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Hirakud_Dam.jpg/960px-Hirakud_Dam.jpg',
    'dest-19': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Satkosia_tiger_Reserve_Entrance.jpg/960px-Satkosia_tiger_Reserve_Entrance.jpg',
    'dest-20': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Sunrise_at_Bhitarakanika.jpg/960px-Sunrise_at_Bhitarakanika.jpg',
    'dest-21': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Nandankanan%2C_Bhubaneswar%2C_Odisha.jpg/960px-Nandankanan%2C_Bhubaneswar%2C_Odisha.jpg',
    'dest-22': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Konarka_Temple.jpg/960px-Konarka_Temple.jpg',
    'dest-23': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Bhubaneswar_State_Museum.jpg/960px-Bhubaneswar_State_Museum.jpg',
    'dest-24': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Mukteshvara_Temple%2C_Bhubaneswar.jpg/960px-Mukteshvara_Temple%2C_Bhubaneswar.jpg',
    'dest-25': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Chausath_Yogini_temple_%28Hirapur%29.jpg/960px-Chausath_Yogini_temple_%28Hirapur%29.jpg',
    'dest-26': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Deomali_by_Santanu_Mahapatra%2C_Koraput_-_panoramio.jpg/960px-Deomali_by_Santanu_Mahapatra%2C_Koraput_-_panoramio.jpg',
    'dest-27': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Deomali_by_Santanu_Mahapatra%2C_Koraput_-_panoramio.jpg/960px-Deomali_by_Santanu_Mahapatra%2C_Koraput_-_panoramio.jpg',
    'dest-28': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Joranda_waterfall%2C_Simlipal_Biosphere_Reserve.jpg/960px-Joranda_waterfall%2C_Simlipal_Biosphere_Reserve.jpg',
    'dest-29': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Khandadhar.jpg/960px-Khandadhar.jpg',
    'dest-30': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/RSP_Administrative_Building.png/960px-RSP_Administrative_Building.png',
    'dest-31': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Mahanadi_from_Banki.jpg/960px-Mahanadi_from_Banki.jpg',
    'dest-32': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Entrance_of_Barabati_fort.jpg/960px-Entrance_of_Barabati_fort.jpg',
    'dest-33': 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Talasari_Beach.jpg',
    'dest-34': 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Panchalingeswara_Temple_Nilagiri_Baleswar.jpg',
    'dest-35': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Jagannath_Temple%2C_Nayagarh.jpg/960px-Jagannath_Temple%2C_Nayagarh.jpg',
    'dest-36': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Birds_eyeview_of_Chilika_Lake.jpg/960px-Birds_eyeview_of_Chilika_Lake.jpg',
    'dest-37': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Hirakud_Dam.jpg/960px-Hirakud_Dam.jpg',
    'dest-38': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Bhubaneswar_at_night_from_sky.jpg/960px-Bhubaneswar_at_night_from_sky.jpg',
    'dest-39': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/2-barabati-stadium-cuttack-odisha-city-hero.jpg/960px-2-barabati-stadium-cuttack-odisha-city-hero.jpg',
    'dest-40': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Rock_edicts_of_Ashoka_at_Dhauli.jpg/960px-Rock_edicts_of_Ashoka_at_Dhauli.jpg',
    'dest-41': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Konarka_Temple.jpg/960px-Konarka_Temple.jpg',
    'dest-42': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Balijatra_cuttack.JPG/960px-Balijatra_cuttack.JPG',
}

for item in data:
    pid = item['id']
    if pid in correct:
        item['image'] = correct[pid]
        print(f'Set {pid} ({item["name"]})')
    else:
        print(f'MISSING {pid}')

with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Done')
