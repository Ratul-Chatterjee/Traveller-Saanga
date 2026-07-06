import json, requests, time, sys

CACHE_PATH = 'server/data/places_cache.json'

with open(CACHE_PATH, encoding='utf-8') as f:
    places = json.load(f)

HEADERS = {'User-Agent': 'OdishaTrailBot/1.0 (odisha-trail-app) requests/2.31'}
WIKI_API = 'https://en.wikipedia.org/w/api.php'

def build_wiki_url(page_title, thumb_size=960):
    params = {
        'action': 'query',
        'prop': 'pageimages',
        'titles': page_title,
        'piprop': 'thumbnail',
        'pithumbsize': thumb_size,
        'format': 'json',
        'redirects': '1',
    }
    try:
        r = requests.get(WIKI_API, params=params, headers=HEADERS, timeout=30)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        print(f'  API error in build_wiki_url: {e}')
        return None
    pages = data.get('query', {}).get('pages', {})
    for pid, info in pages.items():
        thumb = info.get('thumbnail')
        if thumb:
            src = thumb.get('source', '')
            if src:
                return src
    return None

def search_and_get_image(query, thumb_size=960):
    # Try exact match first
    params = {
        'action': 'query',
        'generator': 'search',
        'gsrsearch': query,
        'gsrlimit': 3,
        'prop': 'pageimages',
        'piprop': 'thumbnail',
        'pithumbsize': thumb_size,
        'format': 'json',
        'redirects': '1',
    }
    try:
        r = requests.get(WIKI_API, params=params, headers=HEADERS, timeout=30)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        print(f'  API error in search: {e}')
        return None
    pages = data.get('query', {}).get('pages', {})
    for pid in sorted(pages.keys(), key=int):
        info = pages[pid]
        thumb = info.get('thumbnail')
        if thumb:
            src = thumb.get('source', '')
            if src:
                return src
    return None

# Map of place IDs to specific Wikipedia article titles for better accuracy
exact_titles = {
    'dest-1': 'Konark Sun Temple',
    'dest-2': 'Jagannath Temple, Puri',
    'dest-3': 'Lingaraja Temple',
    'dest-4': 'Chilika Lake',
    'dest-5': 'Simlipal National Park',
    'dest-6': 'Barehipani Falls',
    'dest-7': 'Dhauli',
    'dest-8': 'Udayagiri and Khandagiri Caves',
    'dest-9': 'Rath Yatra',
    'dest-10': 'Puri',
    'dest-11': 'Gopalpur, Odisha',
    'dest-12': 'Chandipur, Odisha',
    'dest-13': 'Parsurameswara Temple',
    'dest-14': 'Mukteswara Temple',
    'dest-15': 'Rajarani Temple',
    'dest-16': 'Jagannath Temple, Koraput',
    'dest-17': 'Saptasajya',
    'dest-18': 'Hirakud Dam',
    'dest-19': 'Satkosia Tiger Reserve',
    'dest-20': 'Bhitarkanika National Park',
    'dest-21': 'Nandankanan Zoological Park',
    'dest-22': 'Konark Sun Temple',  # museum near sun temple
    'dest-23': 'Odisha State Museum',
    'dest-24': 'Tarabore Temple',
    'dest-25': 'Chausath Yogini Temple, Hirapur',
    'dest-26': 'Deomali Hill',
    'dest-27': 'Koraput',  # tribal museum
    'dest-28': 'Joranda Falls',
    'dest-29': 'Khandadhar Falls',
    'dest-30': 'Rourkela Steel Plant',
    'dest-31': 'Mahanadi',  # river cruise
    'dest-32': 'Barabati Fort',
    'dest-33': 'Talasari Beach, Odisha',
    'dest-34': 'Panchalingeswar Temple',
    'dest-35': 'Nayagarh',
    'dest-36': 'Balugaon',
    'dest-37': 'Sambalpur, Odisha',
    'dest-38': 'Bhubaneswar',
    'dest-39': 'Cuttack',
    'dest-40': 'Kalinga War Memorial',
    'dest-41': 'Konark Sun Temple',
    'dest-42': 'Bali Yatra',
}

for place in places:
    pid = place['id']
    name = place['name']
    title = exact_titles.get(pid, name)

    # Try getting image by exact title first
    url = build_wiki_url(title)

    if not url:
        # Fall back to search
        search_q = f'{name} Odisha'
        url = search_and_get_image(search_q)

    if url:
        place['image'] = url
        print(f'OK  {pid} ({name}): {url}')
    else:
        print(f'ERR {pid} ({name}): NO IMAGE FOUND')

    time.sleep(2.0)

with open(CACHE_PATH, 'w', encoding='utf-8') as f:
    json.dump(places, f, indent=2, ensure_ascii=False)

print(f'\nDone! Updated {len(places)} places.')
