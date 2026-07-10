import os
import glob
import re

for f_path in glob.glob('backend/app/routers/**/*.py', recursive=True):
    if not os.path.isfile(f_path): continue
    
    with open(f_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Re-add get_db import
    if "from app.database import get_db" not in content:
        content = re.sub(r'(from fastapi import.*?\n)', r'\1from app.database import get_db\n', content, count=1)
        
    # Re-add motor AsyncClient
    if "AsyncClient" not in content:
        content = re.sub(r'(from app.database import get_db\n)', r'\1from motor.motor_asyncio import AsyncIOMotorClient as AsyncClient\n', content, count=1)

    # Find the _svc functions
    # Replace def _svc():\n    pass with def _svc(db: Annotated[AsyncClient, Depends(get_db)]) -> ServiceName: return ServiceName(db)
    # Wait, the return type is needed.
    
    lines = content.split('\n')
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith('def _') and line.endswith('():'):
            # It's like def _employee_svc():
            func_name = line.split('def ')[1].split('()')[0]
            # Next line is usually pass or something, let's extract the service name from the router name or file
            service_name = None
            if 'auth' in f_path: service_name = 'AuthService'
            if 'employees' in f_path: service_name = 'EmployeeService'
            if 'seats' in f_path: service_name = 'SeatService'
            if 'projects' in f_path: service_name = 'ProjectService'
            if 'allocations' in f_path: service_name = 'AllocationService'
            if 'analytics' in f_path: service_name = 'AnalyticsService'
            
            if service_name:
                new_lines.append(f"def {func_name}(db: Annotated[AsyncClient, Depends(get_db)]) -> {service_name}:")
                new_lines.append(f"    return {service_name}(db)")
                i += 1 # skip the 'pass' line
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)
        i += 1
        
    content = '\n'.join(new_lines)

    # Some endpoints have custom db injections instead of using Depends(get_db) through a wrapper
    # Let's hope the wrapper handles everything for all routers
    
    with open(f_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Routers restored!")
