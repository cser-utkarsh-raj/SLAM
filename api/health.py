import os
from fastapi import FastAPI

app = FastAPI()

@app.get('/api/health')
def health():
    return {
        'status': 'ok',
        'aiProviders': [name for name, key in [('nvidia', os.getenv('NVIDIA_API_KEY')), ('openrouter', os.getenv('OPENROUTER_API_KEY'))] if key],
        'jobSources': ['Adzuna'] if os.getenv('ADZUNA_APP_ID') and os.getenv('ADZUNA_APP_KEY') else [],
        'jobSourceConfiguration': 'ready' if os.getenv('ADZUNA_APP_ID') and os.getenv('ADZUNA_APP_KEY') else 'missing Adzuna credentials',
    }
