#!/usr/bin/env python3
# Assemble le plan 2 : insère les vrais fichiers et les vrais diffs du prototype dans le gabarit.
import re
import subprocess
import sys

S = "/private/tmp/claude-501/-Users-recarnot-dev-claudehot-videogame/0cb26a45-fdbf-460f-8728-6be5213c04e7/scratchpad"
P = f"{S}/proto"
COMMITS = {
    "B": "3c07339", "T1": "2d1c1f0", "T2": "20e0d78", "T3": "c84ed30", "T4": "2c4c6fd",
    "T5": "b451b33", "T6": "e1f7bf6", "T7": "6f6f094", "T8": "72c2525",
}


def git(*args: str) -> str:
    return subprocess.run(["git", "-C", P, *args], check=True, capture_output=True, text=True).stdout


def replace(match: re.Match) -> str:
    kind, rest = match.group(1), match.group(2).split()
    if kind == "FILE":
        commit, path = COMMITS[rest[0]], rest[1]
        return git("show", f"{commit}:{path}").rstrip("\n")
    a, b, paths = COMMITS[rest[0]], COMMITS[rest[1]], rest[2:]
    out = git("diff", a, b, "--", *paths).rstrip("\n")
    if not out:
        sys.exit(f"empty diff: {match.group(0)}")
    return out


template = open(f"{S}/plan-template.md").read()
plan = re.sub(r"@@(FILE|DIFF) ([^@]+)@@", replace, template)
if "@@FILE" in plan or "@@DIFF" in plan:
    sys.exit("unreplaced placeholder")
open(sys.argv[1], "w").write(plan)
print(f"{sys.argv[1]}: {plan.count(chr(10))} lines")
