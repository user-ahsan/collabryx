# 🧩 Agent Workflow & Context Optimization

**Trigger:** `always_on`

**Priority:** CRITICAL - Maximizes agent efficiency and output quality

---

## 🎯 Objective

Optimize agent performance through:
- Clear task decomposition
- Efficient context usage
- Parallel execution where possible
- Minimal token waste

---

## 📋 Task Decomposition Protocol

### 1. **Assess Task Complexity**

```
COMPLEXITY LEVELS:

🟢 Simple (1-3 steps)
- Single file changes
- Adding a component
- Fixing a bug
→ Execute directly

🟡 Medium (4-10 steps)
- New feature with 2-3 components
- Refactoring multiple files
- API integration
→ Create plan, then execute

🔴 Complex (10+ steps)
- Multi-feature implementation
- Architecture changes
- Migration projects
→ Break into subtasks, use parallel agents
```

### 2. **Plan Before Execution**

```typescript
// ✅ MEDIUM/COMPLEX tasks: Create implementation plan
/**
 * PLAN: Add match filter functionality
 * 
 * Files to modify:
 * 1. app/(auth)/matches/page.tsx - Add filter UI
 * 2. components/features/matches/filter-bar.tsx - New component
 * 3. hooks/use-matches.ts - Add filter logic
 * 4. lib/services/matches.ts - Add filter params
 * 
 * Steps:
 * 1. Create filter-bar component
 * 2. Add filter state to hook
 * 3. Update service with filter params
 * 4. Integrate filter-bar into page
 * 
 * Estimated time: 45 minutes
 */

// Then execute step by step
```

### 3. **Parallel Execution**

```
INDEPENDENT TASKS (Run in parallel):
✅ Create multiple components
✅ Update multiple utilities
✅ Write multiple tests
✅ Document multiple features

DEPENDENT TASKS (Run sequentially):
❌ Database schema → API → Frontend
❌ Component → Component that uses it
❌ Type definition → Implementation using type
```

---

## 🧠 Context Management

### 1. **Efficient File Reading**

```typescript
// ✅ Read multiple files in parallel
Read: @/components/features/dashboard/feed.tsx
Read: @/components/features/dashboard/suggestions-sidebar.tsx
Read: @/hooks/use-matches.ts

// ❌ AVOID - Sequential reads (wastes turns)
Read: file1.tsx
...wait...
Read: file2.tsx
...wait...
Read: file3.tsx
```

### 2. **Targeted Reading**

```typescript
// ✅ Read specific sections
Read: @/lib/services/matches.ts (lines 1-50)
Grep: "export.*getMatches" in lib/services/

// ❌ AVOID - Reading entire large files
Read: @/types/database.types.ts (351 lines when you need 1 type)

// ✅ Better - Search for specific type
Grep: "interface.*Profile" in types/
```

### 3. **Context Prioritization**

```
CONTEXT PRIORITY (High → Low):

1. 📄 Current file being edited
2. 📄 Direct imports/dependencies
3. 📄 Type definitions being used
4. 📄 Related components
5. 📄 Documentation
6. 📄 Unrelated files (avoid)

CONTEXT WINDOW BUDGET:
- Simple task: 20% of window
- Medium task: 50% of window
- Complex task: 80% of window (leave room for output)
```

---

## 🔧 Tool Usage Optimization

### 1. **Choose Right Tool**

```
TASK → TOOL MAPPING:

Find files → Glob
Find code → Grep
Read files → Read (parallel when possible)
Edit files → Edit (single line changes)
Search content → Grep (regex)
Run commands → Bash (chain with &&)
Get user input → Question (multiple choice)
```

### 2. **Batch Operations**

```typescript
// ✅ Batch bash commands
Bash: git status && git diff && git log --oneline -5

// ✅ Batch file reads
Read: file1.tsx, file2.tsx, file3.tsx (parallel)

// ✅ Batch edits (related changes)
Edit: line 45 in file1.tsx
Edit: line 78 in file1.tsx
Edit: line 12 in file2.tsx

// ❌ AVOID - One command per turn
Bash: git status
...wait for response...
Bash: git diff
...wait for response...
Bash: git log
```

### 3. **Smart Search Patterns**

```typescript
// ✅ Find all uses of a function
Grep: "useMatches" in **/*.tsx, **/*.ts

// ✅ Find imports
Grep: "from.*services/matches" in **/*.ts

// ✅ Find type usage
Grep: "Profile\|Match\|Post" in types/

// ✅ Find TODOs
Grep: "TODO|FIXME|HACK" in **/*.ts
```

---

## 📝 Communication Efficiency

### 1. **Concise Updates**

```
✅ GOOD:
"Added filter component to matches page. Updated hook with filter state. 
Modified service to accept filter params. All tests passing."

❌ BAD:
"So I started by looking at the matches page and I noticed that it needed 
a filter, so I thought I should create a new component called FilterBar 
which I put in the features/matches folder as per the file structure rules, 
and then I..."
```

### 2. **Structured Output**

```markdown
## Changes Made

### Files Modified
- `app/(auth)/matches/page.tsx` - Added filter UI
- `components/features/matches/filter-bar.tsx` - New component
- `hooks/use-matches.ts` - Added filter state

### Key Changes
1. Created `FilterBar` component with score range slider
2. Added `filters` state to `useMatches` hook
3. Updated `getMatches` to accept filter params

### Testing
- ✅ Component renders correctly
- ✅ Filter updates match list
- ✅ URL sync working
```

### 3. **Progressive Disclosure**

```
START: High-level summary
MIDDLE: Implementation details (if asked)
END: Verification results

DON'T: Dump everything at once
DO: Provide layers of detail on demand
```

---

## 🎯 Agent Mode Selection

### Mode Triggers

```
🔨 IMPLEMENTATION MODE
Trigger: "Build", "Create", "Add", "Implement"
Focus: Writing code, minimal explanation

🐛 DEBUGGING MODE
Trigger: "Fix", "Error", "Bug", "Not working"
Focus: Root cause analysis, systematic debugging

📚 LEARNING MODE
Trigger: "How does", "Explain", "Understand"
Focus: Clear explanations, examples, diagrams

🔍 REVIEW MODE
Trigger: "Review", "Check", "Audit"
Focus: Best practices, potential issues, suggestions

🏗️ ARCHITECTURE MODE
Trigger: "Design", "Plan", "Structure"
Focus: Trade-offs, patterns, scalability
```

### Mode Switching

```typescript
// ✅ Explicit mode declaration
/**
 * MODE: DEBUGGING
 * 
 * Issue: Matches not loading
 * Hypothesis: Supabase query failing
 * Plan: 
 * 1. Check network tab
 * 2. Check Supabase logs
 * 3. Add error handling
 */

// ✅ Switch modes when needed
"I've identified the bug. Switching to IMPLEMENTATION mode to fix it."
```

---

## ⚡ Token Efficiency

### 1. **Avoid Redundancy**

```
❌ REDUNDANT:
"Looking at the file structure, I can see that the components are organized 
by feature. This is good because it follows the feature-based architecture 
pattern. The components folder has features, shared, and ui subfolders..."

✅ CONCISE:
"File structure confirmed. Feature-based architecture in place."
```

### 2. **Code Comments**

```typescript
// ❌ REDUNDANT comments
// Increment counter by 1
count = count + 1

// ✅ WHY comments (not what)
// Optimistic update for instant UX
queryClient.setQueryData(key, newData)

// ✅ Complex logic explanation
// Use keyset pagination for better performance than offset
// See: https://supabase.com/docs/guides/database/pagination
```

### 3. **Minimal Context**

```
✅ GOOD CONTEXT:
"Following existing pattern in `lib/services/posts.ts`..."

❌ BAD CONTEXT:
"I looked at the posts service file which is in the lib/services directory 
and it has functions like getPosts, getPostById, createPost, etc. and I'm 
going to follow the same pattern..."
```

---

## 🔄 Iteration Loops

### 1. **Fast Feedback**

```
✅ GOOD LOOP:
1. Make small change
2. Run test/lint
3. Fix error
4. Repeat

❌ BAD LOOP:
1. Make 10 changes
2. Run test
3. 5 errors
4. Fix all at once
5. New errors
6. Repeat
```

### 2. **Verification Checkpoints**

```
CHECKPOINT TRIGGERS:

✅ After each file edit
- Run: eslint file.tsx
- Run: tsc --noEmit

✅ After feature complete
- Run: npm run lint
- Run: npm run typecheck

✅ Before commit
- Run: git status
- Run: git diff
- Run: npm run build
```

### 3. **Error Recovery**

```
ERROR HANDLING PROTOCOL:

1. STOP - Don't make more changes
2. READ - Understand the error message
3. SEARCH - Find similar errors in codebase
4. FIX - Make minimal fix
5. VERIFY - Run same command again
6. CONTINUE - Resume work

❌ DON'T: Panic and make random changes
✅ DO: Systematic debugging
```

---

## 📊 Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Task completion rate | > 95% | Git commits |
| Rework rate | < 10% | Git history |
| Token efficiency | > 80% | Token count / output quality |
| Context usage | 50-80% | Context window utilization |
| Parallel execution | > 50% tasks | Parallel vs sequential |

---

## ⚠️ STRICT RULES

1. **NEVER** start coding without understanding the task
2. **NEVER** read files sequentially (always parallel)
3. **NEVER** make large changes without verification
4. **ALWAYS** declare mode (implement/debug/review)
5. **ALWAYS** batch independent operations
6. **ALWAYS** verify after each significant change

---

## 🎯 Agent Actions

### Before Starting Task

1. **Assess complexity** (🟢/🟡/🔴)
2. **Create plan** (if 🟡/🔴)
3. **Identify parallel ops**
4. **Gather context** (parallel reads)
5. **Declare mode**

### During Task

1. **Make incremental changes**
2. **Verify after each change**
3. **Batch independent ops**
4. **Update progress**
5. **Switch modes if needed**

### After Task

1. **Run final verification**
2. **Summarize changes**
3. **Suggest next steps**
4. **Document if needed**

---

## 🛠️ Quick Reference

### Parallel Operations Template

```
PARALLEL OPS:
Read: file1.tsx, file2.tsx, file3.tsx
Grep: "pattern1" in dir1/
Grep: "pattern2" in dir2/
Glob: "**/*.tsx"
```

### Plan Template

```markdown
## PLAN: [Task Name]

### Files to Modify
1. `path/to/file1.tsx` - Change description
2. `path/to/file2.tsx` - Change description

### Steps
1. [ ] Step 1
2. [ ] Step 2
3. [ ] Step 3

### Parallel Ops
- Create component A & B simultaneously
- Update utilities X & Y simultaneously

### Estimated Time: XX minutes
```

### Progress Template

```markdown
## PROGRESS

### Completed
- ✅ Step 1
- ✅ Step 2

### In Progress
- 🔄 Step 3

### Remaining
- ⏳ Step 4
- ⏳ Step 5

### Blockers
- None / [Description]
```

---

**Remember:** Efficient agents ship faster. Every token and turn counts.
