# Git Workflow

Git branching, committing, and pull request guidelines for Collabryx.

---

## Table of Contents

- [Branch Naming](#branch-naming)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Common Commands](#common-commands)

---

## Branch Naming

### Format

```
<type>/<description>
```

### Types

| Type | Description |
|------|-------------|
| `feature/` | New feature or enhancement |
| `fix/` | Bug fix |
| `docs/` | Documentation changes |
| `refactor/` | Code refactoring |
| `perf/` | Performance improvements |
| `test/` | Adding or updating tests |
| `chore/` | Build/config changes |

### Examples

```bash
# Good
feature/user-authentication
fix/login-redirect-issue
docs/update-readme
refactor/component-structure
perf/optimize-images
test/add-unit-tests
chore/update-dependencies

# Bad
patch-1
fix-stuff
my-feature
```

---

## Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting (no code change)
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Adding tests
- `chore` - Build/config changes

### Examples

```bash
# Good
feat(auth): add Google OAuth integration
fix(dashboard): resolve data loading race condition
docs(readme): update installation instructions
refactor(components): migrate to feature-based structure
perf(images): implement lazy loading and WebP format
test(hooks): add unit tests for useChat hook

# Bad
update stuff
fixed bug
misc changes
```

### Best Practices

- Use imperative mood in subject ("add" not "added")
- Don't end subject line with period
- Limit subject to 50 characters
- Wrap body at 72 characters
- Explain what and why, not how

---

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No TypeScript errors
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Bullet list of changes

## Testing
- [ ] Tested on Chrome
- [ ] Tested on Firefox
- [ ] Mobile responsive
- [ ] No console errors

## Related Issues
Closes #123
```

### Review Process

1. Create PR with descriptive title
2. Fill out PR template
3. Request review from maintainers
4. Address feedback
5. Merge after approval

---

## Common Commands

### Daily Workflow

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature

# Stage changes
git add .

# Commit
git commit -m "feat: add new feature"

# Push
git push origin feature/your-feature
```

### Undo Changes

```bash
# Unstage file
git reset HEAD <file>

# Discard local changes
git checkout -- <file>

# Amend last commit
git commit --amend -m "new message"
```

### Sync with Main

```bash
# While on feature branch
git fetch origin
git rebase origin/main

# Or merge
git merge origin/main
```

---

## Best Practices

### DO ✅

- Commit small, focused changes
- Write clear commit messages
- Create descriptive PRs
- Review your own code first
- Respond to feedback promptly

### DON'T ❌

- Don't commit large files
- Don't commit `.env` or secrets
- Don't use vague commit messages
- Don't skip testing
- Don't force push to shared branches

---

**Last Updated**: 2026-03-14

[← Back to Docs](../README.md)
