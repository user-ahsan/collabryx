# 🤝 Contributing Guide

Thank you for your interest in contributing to Collabryx! This guide will help you get started.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Community](#community)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive experience for everyone. We expect all contributors to:

- Be respectful and considerate
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, intimidation, or discrimination
- Trolling or insulting comments
- Publishing others' private information
- Other conduct that could reasonably be considered inappropriate

### Reporting

If you experience or witness unacceptable behavior, please report it to the project maintainers.

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

1. **Completed setup**
   - Follow the [Installation Guide](./INSTALLATION.md)
   - Verify development server runs successfully

2. **Read documentation**
   - [Development Guide](./DEVELOPMENT.md)
   - [Architecture Guide](./ARCHITECTURE.md)

3. **Familiarized yourself with the codebase**
   - Explore the project structure
   - Run the application locally
   - Understanding existing patterns

### Finding Issues to Work On

1. **Check the issue tracker**
   - Look for issues labeled `good first issue`
   - Or issues labeled `help wanted`

2. **Ask before starting**
   - Comment on the issue to express interest
   - Wait for maintainer confirmation
   - This prevents duplicate work

3. **Propose new features**
   - Open an issue for discussion first
   - Get feedback before implementing

---

## Development Process

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork

git clone https://github.com/your-username/collabryx.git
cd collabryx

# Add upstream remote
git remote add upstream https://github.com/original-owner/collabryx.git
```

### 2. Create a Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `perf/` - Performance improvements
- `test/` - Test additions or updates

### 3. Make Changes

Follow our [coding standards](#coding-standards) and best practices.

### 4. Test Your Changes

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

**Manual testing checklist:**
- [ ] Feature works as expected
- [ ] No console errors
- [ ] Responsive on mobile, tablet, desktop
- [ ] Works in Chrome, Firefox, Safari
- [ ] No TypeScript errors
- [ ] Existing features still work

### 5. Commit Changes

Follow our [commit guidelines](#commit-guidelines).

```bash
git add .
git commit -m "feat: add new feature description"
```

### 6. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
```

---

## Coding Standards

### TypeScript

#### ✅ DO

```typescript
// Use explicit types
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

const user: UserProfile = {
  id: "123",
  name: "John Doe",
  email: "john@example.com"
};

// Use absolute imports
import { Button } from "@/components/ui/button";

// Use const for components
export const MyComponent = () => { };
```

#### ❌ DON'T

```typescript
// Don't use 'any'
const user: any = { /* ... */ };

// Don't use relative imports
import { Button } from "../../../components/ui/button";

// Don't use default exports for components
export default function MyComponent() { }
```

### React Components

#### ✅ DO

```typescript
// Server Component (default)
export const ServerComponent = async () => {
  const data = await fetchData();
  return <div>{data}</div>;
};

// Client Component (when needed)
"use client"
export const ClientComponent = () => {
  const [state, setState] = useState(false);
  return <button onClick={() => setState(!state)}>Toggle</button>;
};

// Proper prop typing
interface ComponentProps {
  title: string;
  onClose: () => void;
}

export const MyComponent = ({ title, onClose }: ComponentProps) => {
  return <div>{title}</div>;
};
```

#### ❌ DON'T

```typescript
// Don't use Client Component unnecessarily
"use client"
export const UnnecessaryClient = () => {
  return <div>Static content</div>;  // Should be Server Component
};

// Don't skip prop types
export const NoTypes = ({ title, onClose }) => {  // Missing types!
  return <div>{title}</div>;
};
```

### File Organization

#### Feature-Based Structure ✅

```
components/features/
├── dashboard/
│   ├── stats-card.tsx
│   ├── recent-activity.tsx
│   ├── quick-links.tsx
│   └── index.ts
```

#### Type-Based Structure ❌

```
components/
├── cards/
│   └── stats-card.tsx
├── lists/
│   └── recent-activity.tsx
└── links/
    └── quick-links.tsx
```

### Styling

#### ✅ DO

```tsx
import { cn } from "@/lib/utils/cn";

// Use design tokens
<div className="bg-background text-foreground">
  <p className="text-muted-foreground">Text</p>
</div>

// Use cn() for conditional classes
<button className={cn(
  "px-4 py-2 rounded-md",
  isActive && "bg-primary text-primary-foreground"
)}>
  Click me
</button>
```

#### ❌ DON'T

```tsx
// Don't hardcode colors
<div className="bg-white text-black">
  <p className="text-gray-500">Text</p>
</div>

// Don't use string concatenation
<button className={`px-4 py-2 ${isActive ? 'bg-blue-500' : 'bg-gray-200'}`}>
  Click me
</button>
```

---

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semi-colons, etc. (no code change)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Updating build tasks, package manager configs, etc.

### Examples

```bash
# Feature
feat(auth): add Google OAuth integration

# Bug fix
fix(dashboard): resolve data loading race condition

# Documentation
docs(readme): update installation instructions

# Refactoring
refactor(components): migrate to feature-based structure

# Performance
perf(images): implement lazy loading and WebP format
```

### Good Commit Messages

✅ **GOOD:**
```
feat(chat): add real-time message streaming

Implements WebSocket-based streaming for AI chat responses.
Includes retry logic and error handling.

Closes #123
```

❌ **BAD:**
```
update stuff
```

---

## Pull Request Process

### Before Submitting

Ensure your PR:
- [ ] Follows coding standards
- [ ] Includes descriptive commit messages
- [ ] Has been tested manually
- [ ] Builds successfully (`npm run build`)
- [ ] Passes linting (`npm run lint`)
- [ ] Updates documentation if needed

### PR Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Bullet point list of changes
- Be specific and clear

## Testing
- [ ] Tested on Chrome
- [ ] Tested on Firefox
- [ ] Tested on Safari
- [ ] Tested on mobile devices
- [ ] Verified no console errors
- [ ] Verified TypeScript compiles

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Closes #123
```

### Review Process

1. **Submit PR**
   - Fill out the template completely
   - Link related issues

2. **Automated checks**
   - CI/CD pipeline runs
   - Linting and build checks

3. **Code review**
   - Maintainers review code
   - May request changes

4. **Address feedback**
   - Make requested changes
   - Push updates to same branch

5. **Approval & merge**
   - After approval, PR will be merged
   - Branch will be deleted

### After Merge

- Your changes will be in the `main` branch
- Update your fork:
  ```bash
  git checkout main
  git pull upstream main
  git push origin main
  ```

---

## Issue Guidelines

### Creating Issues

#### Bug Reports

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 120]
- Node version: [e.g. 18.17.0]

**Additional context**
Any other relevant information.
```

#### Feature Requests

```markdown
**Is your feature request related to a problem?**
Description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Any other relevant information, mockups, etc.
```

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `question` - Further information requested
- `wontfix` - This will not be worked on

---

## Community

### Getting Help

- **Documentation**: Check the `/docs` folder
- **Issues**: Search existing issues
- **Discussions**: Use GitHub Discussions for questions

### Recognition

Contributors will be:
- Listed in the project's contributors list
- Mentioned in release notes
- Credited for their work

---

## Development Tips

### Useful Commands

```bash
# Clean build artifacts
rm -rf .next

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for outdated packages
npm outdated
```

### Debugging

1. **Use React DevTools**
   - Install browser extension
   - Inspect component tree

2. **Check Console**
   - Browser DevTools (F12)
   - Look for errors and warnings

3. **VS Code Debugging**
   - Set breakpoints
   - Use debug configurations

### Best Practices

1. **Keep PRs focused**
   - One feature/fix per PR
   - Makes review easier

2. **Write clear code**
   - Self-documenting code is best
   - Add comments for complex logic

3. **Test thoroughly**
   - Manual testing on multiple browsers
   - Consider edge cases

4. **Ask for help**
   - Don't hesitate to ask questions
   - Better to ask than guess

---

## License

By contributing to Collabryx, you agree that your contributions will be licensed under the project's license.

---

## Questions?

- **General questions**: GitHub Discussions
- **Bug reports**: GitHub Issues
- **Security issues**: Email maintainers directly

---

**Thank you for contributing to Collabryx! 🎉**

[← Back to README](../README.md) | [Development Guide →](./DEVELOPMENT.md)
