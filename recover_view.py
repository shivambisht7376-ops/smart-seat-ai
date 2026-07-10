import json
import re
import os

transcript_path = r"C:\Users\shiva\.gemini\antigravity\brain\cffee137-28c5-4308-b226-6816fce21178\.system_generated\logs\transcript_full.jsonl"
file_versions = {}

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            step = json.loads(line)
        except:
            continue
            
        if step.get("type") == "TOOL_RESPONSE" and "output" in step:
            content = step["output"]
            # Look for "File Path: `file:///C:/WorkSphere/smartseat-ai/backend/app/..."
            match = re.search(r"File Path: `file:///C:/WorkSphere/smartseat-ai/(backend/app/[^\`]+)`", content)
            if match:
                rel_path = match.group(1).replace('/', '\\')
                full_path = os.path.join(r"C:\WorkSphere\smartseat-ai", rel_path)
                
                # Extract lines formatted like "1: code"
                lines = []
                for line_text in content.split('\n'):
                    line_match = re.match(r"^\d+:\s?(.*)$", line_text)
                    if line_match:
                        lines.append(line_match.group(1))
                
                if lines:
                    file_versions[full_path] = '\n'.join(lines)

# Write out the files!
recovered_count = 0
for path, text in file_versions.items():
    try:
        if os.path.exists(path) and os.path.getsize(path) == 0:
            with open(path, 'w', encoding='utf-8') as out:
                out.write(text)
            recovered_count += 1
            print(f"Recovered {path}")
    except Exception as e:
        print(f"Error saving {path}: {e}")

print(f"Total recovered from view_file: {recovered_count}")
