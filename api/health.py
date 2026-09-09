import os
from fastapi import FastAPI

app = FastAPI()

@app.get('/api/health')
def health():
    ai = [name for name, key in [('nvidia', os.getenv('NVIDIA_API_KEY')), ('openrouter', os.getenv('OPENROUTER_API_KEY'))] if key]
    feeds = []
    if os.getenv('ADZUNA_APP_ID') and os.getenv('ADZUNA_APP_KEY'):
        feeds.append('Adzuna')
    feeds.extend(['Jobicy', 'Remote OK'])
    return {
        'status': 'ok',
        'aiProviders': ai,
        'jobSources': feeds,
        'jobSourceConfiguration': 'ready' if feeds else 'missing live feed configuration',
    }
