#!/bin/zsh
# Rejeu du plan 2 tâche par tâche : tests seuls (doivent échouer), puis code (tout passe, tsc passe).
S=/private/tmp/claude-501/-Users-recarnot-dev-claudehot-videogame/0cb26a45-fdbf-460f-8728-6be5213c04e7/scratchpad
P=$S/proto
ST=$S/stage
[[ -d $ST ]] && trash $ST
mkdir -p $ST
git -C $P archive 3c07339 | tar -x -C $ST
ln -s $P/node_modules $ST/node_modules
cd $ST
typeset -a RANGES
RANGES=(3c07339:2d1c1f0 2d1c1f0:20e0d78 20e0d78:c84ed30 c84ed30:2c4c6fd 2c4c6fd:b451b33 b451b33:e1f7bf6 e1f7bf6:6f6f094 6f6f094:72c2525)
n=0
for r in $RANGES; do
  n=$((n+1))
  a=${r%%:*}; b=${r##*:}
  echo "===== Task $n ($a..$b)"
  git -C $P diff --binary $a $b -- tests/ > $S/t$n-tests.patch
  git -C $P diff --binary $a $b -- . ':(exclude)tests/' > $S/t$n-code.patch
  if [[ -s $S/t$n-tests.patch ]]; then
    git apply $S/t$n-tests.patch || { echo "tests patch FAILED"; exit 1; }
    files=(${(f)"$(git -C $P diff --name-only $a $b -- tests/)"})
    RTK_DISABLED=1 bun test ${files[@]} 2>&1 | grep -E "^ *[0-9]+ (pass|fail)|error:" | head -4 | sed 's/^/  before code: /'
  else
    echo "  no tests in this task"
  fi
  git apply $S/t$n-code.patch || { echo "code patch FAILED"; exit 1; }
  RTK_DISABLED=1 bun test 2>&1 | grep -E "^ *[0-9]+ (pass|fail)" | sed 's/^/  after code: /'
  RTK_DISABLED=1 bun run typecheck > $S/t$n-tsc.log 2>&1 && echo "  tsc ok" || { echo "  tsc FAILED"; cat $S/t$n-tsc.log; }
  git -C $P archive $b | tar -x -C $S/expected-$n 2>/dev/null || { mkdir -p $S/expected-$n; git -C $P archive $b | tar -x -C $S/expected-$n; }
  diff -rq --exclude=node_modules $S/expected-$n $ST > /dev/null && echo "  tree == $b" || { echo "  tree DIFFERS"; diff -rq --exclude=node_modules $S/expected-$n $ST; }
  trash $S/expected-$n
done
echo "===== build"
RTK_DISABLED=1 bun run build 2>&1 | grep -E "gzip:|built|error" | tail -3
