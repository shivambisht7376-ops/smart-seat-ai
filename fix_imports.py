import os
import glob

for f_path in glob.glob('backend/app/**/*.py', recursive=True):
    if not os.path.isfile(f_path): continue
    if os.path.getsize(f_path) == 0: continue
    
    with open(f_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    new_content = content.replace('from google.cloud.firestore_v1.async_client import AsyncClient', 'from motor.motor_asyncio import AsyncIOMotorClient as AsyncClient')
    new_content = new_content.replace('from google.cloud.firestore_v1 import async_query', '')
    
    if new_content != content:
        with open(f_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {f_path}")
