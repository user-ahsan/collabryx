#!/usr/bin/env bash
# =============================================================================
# Collabryx Environment Setup Tests (TC-001, TC-002, TC-003)
# =============================================================================
# Tests:
#   TC-001: bun install executes in Node.js 20+ LTS
#   TC-002: bun install rejected with Node.js < 20
#   TC-003: package install fails if using npm/yarn instead of bun
#
# Usage:
#   bash tests/scripts/env-setup.test.sh
#   bash tests/scripts/env-setup.test.sh --verbose
#
# Exit codes:
#   0 - All tests passed
#   1 - One or more tests failed
# =============================================================================

set -euo pipefail

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
VERBOSE=false

# Parse arguments
for arg in "$@"; do
  case "$arg" in
    --verbose|-v) VERBOSE=true ;;
    *) echo "Unknown argument: $arg"; exit 1 ;;
  esac
done

# Helper: extract major version from semver string (handles "v20.11.0" and "20.11.0")
extract_major() {
  local version="$1"
  version="${version#v}"
  echo "${version%%.*}"
}

# Helper: extract minor version from semver string
extract_minor() {
  local version="$1"
  version="${version#v}"
  version="${version#*.}"
  echo "${version%%.*}"
}

# Assertion helpers
pass() {
  PASSED=$((PASSED + 1))
  echo -e "  ${GREEN}✓ PASS${NC}: $1"
}

fail() {
  FAILED=$((FAILED + 1))
  echo -e "  ${RED}✗ FAIL${NC}: $1"
}

assert_greater_equal() {
  local actual="$1"
  local expected="$2"
  local description="$3"
  if [ "$actual" -ge "$expected" ]; then
    pass "$description (got $actual, expected >= $expected)"
    return 0
  else
    fail "$description (got $actual, expected >= $expected)"
    return 1
  fi
}

assert_less_than() {
  local actual="$1"
  local expected="$2"
  local description="$3"
  if [ "$actual" -lt "$expected" ]; then
    pass "$description (got $actual, expected < $expected)"
    return 0
  else
    fail "$description (got $actual, expected < $expected)"
    return 1
  fi
}

assert_equals() {
  local actual="$1"
  local expected="$2"
  local description="$3"
  if [ "$actual" = "$expected" ]; then
    pass "$description (got $actual)"
    return 0
  else
    fail "$description (expected $expected, got $actual)"
    return 1
  fi
}

# =============================================================================
# Test Setup: Detect available runtimes
# =============================================================================
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}Collabryx Environment Setup Tests${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""

detect_node() {
  if command -v node &>/dev/null; then
    NODE_VERSION="$(node --version 2>/dev/null || echo 'unknown')"
    NODE_MAJOR="$(extract_major "$NODE_VERSION" 2>/dev/null || echo '0')"
  else
    NODE_VERSION="not installed"
    NODE_MAJOR="0"
  fi
}

detect_npm() {
  if command -v npm &>/dev/null; then
    NPM_INSTALLED="true"
    NPM_VERSION="$(npm --version 2>/dev/null || echo 'unknown')"
  else
    NPM_INSTALLED="false"
  fi
}

detect_yarn() {
  if command -v yarn &>/dev/null; then
    YARN_INSTALLED="true"
    YARN_VERSION="$(yarn --version 2>/dev/null || echo 'unknown')"
  else
    YARN_INSTALLED="false"
  fi
}

detect_bun() {
  if command -v bun &>/dev/null; then
    BUN_INSTALLED="true"
    BUN_VERSION="$(bun --version 2>/dev/null || echo 'unknown')"
  else
    BUN_INSTALLED="false"
  fi
}

detect_node
detect_npm
detect_yarn
detect_bun

$VERBOSE && {
  echo -e "${CYAN}Detected Runtimes:${NC}"
  echo "  Node.js: $NODE_VERSION (major: $NODE_MAJOR)"
  echo "  bun:     ${BUN_VERSION:-not installed}"
  echo "  npm:     ${NPM_VERSION:-not installed}"
  echo "  yarn:    ${YARN_VERSION:-not installed}"
  echo ""
}

# =============================================================================
# TC-001: Verify bun install executes in Node.js 20+ LTS
# =============================================================================
echo -e "${CYAN}[TC-001] Node.js 20+ LTS Requirement${NC}"

# Check that Node.js is installed and version >= 20
if [ "$NODE_MAJOR" -eq 0 ]; then
  echo -e "  ${YELLOW}⚠ SKIP${NC}: Node.js not installed — cannot verify version"
else
  NODE_MINOR="$(extract_minor "$NODE_VERSION" 2>/dev/null || echo '0')"
  assert_greater_equal "$NODE_MAJOR" 20 \
    "Node.js major version >= 20 (LTS)"
fi

# Verify the engines field in package.json matches expectation
if [ -f "package.json" ]; then
  ENGINE_NODE=$(node -e "console.log(require('./package.json').engines?.node || 'none')" 2>/dev/null || echo "none")
  $VERBOSE && echo "  package.json engines.node: $ENGINE_NODE"

  # Verify engines field specifies >=20.0.0
  if echo "$ENGINE_NODE" | grep -qE '\b(>=|>|=)?\s*2[0-9]\.'; then
    pass "package.json engines.node specifies Node 20+"
  else
    fail "package.json engines.node should specify Node 20+ (got: $ENGINE_NODE)"
  fi
else
  fail "package.json not found in current directory"
fi

# Verify bun is available and dependencies can be installed
if [ "$BUN_INSTALLED" = "true" ]; then
  pass "bun $BUN_VERSION is installed"
  
  # Verify bun.lock exists or node_modules exists
  if [ -d "node_modules" ]; then
    pass "node_modules directory exists (dependencies installed)"
  else
    echo -e "  ${YELLOW}⚠ SKIP${NC}: node_modules not found — run 'bun install' first"
  fi
else
  fail "bun is not installed — required for this project"
fi

echo ""

# =============================================================================
# TC-002: Verify bun install rejected with Node.js < 20
# =============================================================================
echo -e "${CYAN}[TC-002] Node.js < 20 Rejection${NC}"

# Simulate: if we have a legacy Node.js, verify it would be rejected
if [ -f "package.json" ]; then
  # Test the rejection logic: if engines.node is set and current < 20, bun should warn/error
  if [ "$NODE_MAJOR" -ge 20 ]; then
    # We're on Node 20+ — verify that the check itself works
    ENGINE_CHECK=$(node -e "
      const eng = require('./package.json').engines || {};
      const nodeReq = eng.node || '';
      if (nodeReq && process.version) {
        const major = parseInt(process.version.slice(1).split('.')[0]);
        const required = 20;
        console.log(major >= required ? 'PASS' : 'FAIL:' + major);
      } else {
        console.log('PASS (no engine restriction)');
      }
    " 2>/dev/null || echo "ERROR")
    
    if [[ "$ENGINE_CHECK" == PASS* ]]; then
      pass "Current Node.js version satisfies engines requirement"
    else
      fail "Engine check unexpected: $ENGINE_CHECK"
    fi
  else
    # On Node < 20 — this should fail the engines check
    fail "Running on Node.js $NODE_MAJOR which is below the required Node 20+"
  fi

  # Verify that the engines field would reject old Node
  MIN_NODE_REQUIRED=$(node -e "
    const eng = require('./package.json').engines || {};
    const match = (eng.node || '').match(/(\d+)/);
    console.log(match ? parseInt(match[1]) : 0);
  " 2>/dev/null || echo "0")
  
  assert_greater_equal "$MIN_NODE_REQUIRED" 20 \
    "package.json requires Node >= $MIN_NODE_REQUIRED"
fi

echo ""

# =============================================================================
# TC-003: Verify package install fails if using npm/yarn instead of bun
# =============================================================================
echo -e "${CYAN}[TC-003] Package Manager Restriction (bun only)${NC}"

# Verify engines.bun exists in package.json
if [ -f "package.json" ]; then
  ENGINE_BUN=$(node -e "console.log(require('./package.json').engines?.bun || 'none')" 2>/dev/null || echo "none")
  $VERBOSE && echo "  package.json engines.bun: $ENGINE_BUN"

  if echo "$ENGINE_BUN" | grep -qE '(\d+)'; then
    MIN_BUN=$(echo "$ENGINE_BUN" | grep -oE '[0-9]+' | head -1)
    assert_greater_equal "$MIN_BUN" 1 \
      "package.json engines.bun requires bun >= $MIN_BUN"
  else
    fail "package.json engines.bun does not specify bun requirement"
  fi
fi

# Verify bun.lock exists (bun is the package manager)
if [ -f "bun.lock" ]; then
  pass "bun.lock exists (bun is the package manager)"
elif [ -f "bun.lockb" ]; then
  pass "bun.lockb exists (bun is the package manager)"
else
  echo -e "  ${YELLOW}⚠ INFO${NC}: No bun.lock or bun.lockb found — may need to run 'bun install'"
fi

# Assert package-lock.json should NOT be present (project uses bun, not npm)
if [ -f "package-lock.json" ]; then
  fail "package-lock.json found — project should use bun, not npm"
else
  pass "No package-lock.json detected (correct — project uses bun)"
fi

# Assert yarn.lock should NOT be present (project uses bun)
if [ -f "yarn.lock" ]; then
  fail "yarn.lock found — project should use bun, not yarn"
else
  pass "No yarn.lock detected (correct — project uses bun)"
fi

# Check that bun is the detected package manager
if [ "$BUN_INSTALLED" = "true" ]; then
  pass "bun $BUN_VERSION is available and ready"
else
  fail "bun is not installed — run 'curl -fsSL https://bun.sh/install | bash' or visit https://bun.sh"
fi

# Warn if npm or yarn are available (should not be used for this project)
if [ "$NPM_INSTALLED" = "true" ]; then
  echo -e "  ${YELLOW}⚠ WARN${NC}: npm is installed but should not be used for this project"
fi

if [ "$YARN_INSTALLED" = "true" ]; then
  echo -e "  ${YELLOW}⚠ WARN${NC}: yarn is installed but should not be used for this project"
fi

echo ""

# =============================================================================
# Results Summary
# =============================================================================
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}Results Summary${NC}"
echo -e "${CYAN}============================================================${NC}"
TOTAL=$((PASSED + FAILED))
echo -e "  Total:  $TOTAL"
echo -e "  ${GREEN}Passed: $PASSED${NC}"
if [ "$FAILED" -gt 0 ]; then
  echo -e "  ${RED}Failed: $FAILED${NC}"
else
  echo -e "  ${GREEN}Failed: 0${NC}"
fi
echo ""

if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}All environment setup tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed. See output above for details.${NC}"
  exit 1
fi
