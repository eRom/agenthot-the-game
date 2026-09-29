#!/usr/bin/env python3
# Rejoue le plan tel qu'un exécutant le lirait : fichiers entiers recopiés, diffs appliqués, dans l'ordre.
import re
import subprocess
import sys

S = "/private/tmp/claude-501/-Users-recarnot-dev-claudehot-videogame/0cb26a45-fdbf-460f-8728-6be5213c04e7/scratchpad"
root = sys.argv[2]
lines = open(sys.argv[1]).read().split("\n")
i = 0
pending_path = None
count_files = count_diffs = 0
while i < len(lines):
    line = lines[i]
    m = re.match(r"^`([^`]+)` :$", line)
    if m:
        pending_path = m.group(1)
        i += 1
        continue
    fence = re.match(r"^```(\w*)$", line)
    if fence:
        lang = fence.group(1)
        j = i + 1
        while lines[j] != "```":
            j += 1
        body = "\n".join(lines[i + 1 : j]) + "\n"
        if lang == "diff":
            subprocess.run(["git", "apply", "-"], input=body, text=True, cwd=root, check=True)
            count_diffs += 1
        elif lang in ("ts",) and pending_path:
            path = f"{root}/{pending_path}"
            subprocess.run(["mkdir", "-p", path.rsplit("/", 1)[0]], check=True)
            open(path, "w").write(body)
            count_files += 1
        pending_path = None
        i = j + 1
        continue
    if line.strip():
        pending_path = pending_path if line.startswith("`") else None
    i += 1
print(f"files written: {count_files}, diffs applied: {count_diffs}")
