import httpx, os, sys
sys.stdout.reconfigure(encoding='utf-8')
from dotenv import load_dotenv
load_dotenv('.env')
url = os.getenv('SUPABASE_URL') + '/rest/v1'
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
h = {'apikey': key, 'Authorization': f'Bearer {key}'}
c = httpx.Client()

tables = ['profiles', 'posts', 'connections', 'profile_embeddings',
          'embedding_pending_queue', 'conversations', 'messages']

for t in tables:
    r = c.get(f'{url}/{t}?select=count', headers=h, params={'head': 'true'})
    cr = r.headers.get('content-range', '?')
    print(f'{t:35s} -> {cr}')

# Sample complete vs incomplete
r = c.get(f'{url}/profiles?select=onboarding_completed&limit=206', headers=h)
profiles = r.json()
complete = sum(1 for p in profiles if p.get('onboarding_completed'))
print(f'\nComplete profiles (onboarding_completed=true): {complete}/{len(profiles)}')

# Sample the newest profile
r = c.get(f'{url}/profiles?select=display_name,headline,bio,onboarding_completed,profile_completion&order=created_at.desc&limit=2', headers=h)
print(f'\nNewest profile: {r.json()}')
