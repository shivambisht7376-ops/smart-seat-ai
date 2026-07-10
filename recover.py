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
            
        # Check tool calls for write_to_file
        if "tool_calls" in step:
            for call in step["tool_calls"]:
                if call.get("name") == "write_to_file":
                    args = call.get("args", {})
                    if isinstance(args, str):
                        try:
                            args = json.loads(args)
                        except:
                            continue
                    target = args.get("TargetFile", "")
                    if "backend\\app" in target or "backend/app" in target:
                        norm_target = os.path.normpath(target)
                        file_versions[norm_target] = args.get("CodeContent", "")
                        
        # Check output of view_file to recover files that were viewed
        if step.get("type") == "TOOL_RESPONSE" and "content" in step:
            # Not standard, but sometimes tool responses are logged. Let's see if we can find file paths.
            pass
            
# Write out the files!
recovered_count = 0
for path, content in file_versions.items():
    # Only recover if it's currently empty
    try:
        if os.path.exists(path) and os.path.getsize(path) == 0:
            with open(path, 'w', encoding='utf-8') as out:
                out.write(content)
            recovered_count += 1
            print(f"Recovered {path}")
    except Exception as e:
        print(f"Error saving {path}: {e}")

print(f"Total recovered from write_to_file: {recovered_count}")
