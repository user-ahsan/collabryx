# 📦 Installation Guide

This guide provides step-by-step instructions for setting up Collabryx on a new machine.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [System Requirements](#system-requirements)
- [Installation Steps](#installation-steps)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

---

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

### Required Software

1. **Node.js** (v20.x or higher)
   - Download from: https://nodejs.org/
   - Verify installation:
     ```bash
     node --version  # Should output v20.x.x or higher
     ```

2. **npm** (v9.x or higher) or **yarn** (v1.22.x or higher)
   - Comes with Node.js installation
   - Verify installation:
     ```bash
     npm --version   # Should output 9.x.x or higher
     ```

3. **Git** (v2.x or higher)
   - Download from: https://git-scm.com/
   - Verify installation:
     ```bash
     git --version   # Should output 2.x.x or higher
     ```

4. **Code Editor** (Recommended)
   - [Visual Studio Code](https://code.visualstudio.com/)
   - [WebStorm](https://www.jetbrains.com/webstorm/)
   - Or any editor of your choice

### Accounts Required

- **GitHub Account** - For repository access
- **Supabase Account** - For backend services (free tier available at https://supabase.com/)
- **Vercel Account** (Optional) - For deployment (https://vercel.com/)

---

## System Requirements

### Minimum Requirements
- **OS:** Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **RAM:** 4 GB
- **Storage:** 2 GB free space
- **Internet:** Stable connection for package downloads

### Recommended Requirements
- **RAM:** 8 GB or more
- **Storage:** 5 GB free space (for node_modules and build artifacts)
- **CPU:** Multi-core processor for faster builds

---

## Installation Steps

### Step 1: Clone the Repository

Open your terminal and navigate to your desired project directory:

```bash
# Using HTTPS
git clone https://github.com/your-username/collabryx.git

# OR using SSH (if configured)
git clone git@github.com:your-username/collabryx.git

# Navigate into the project directory
cd collabryx
```

### Step 2: Install Dependencies

Install all required npm packages:

```bash
# Using npm
npm install

# OR using yarn
yarn install
```

**Expected Output:**
- The installation process will download and install all dependencies listed in `package.json`
- This may take 2-5 minutes depending on your internet speed
- You should see a progress bar and final success message

**Dependency Count:**
- Production dependencies: ~40 packages
- Development dependencies: ~10 packages
- Total installed packages (including sub-dependencies): ~2000+

### Step 3: Environment Configuration

Create environment files for local development:

```bash
# Create .env.local file
touch .env.local

# For Windows Command Prompt
type nul > .env.local

# For Windows PowerShell
New-Item .env.local -ItemType File
```

Edit `.env.local` with your configuration:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: Analytics and Monitoring
# NEXT_PUBLIC_GA_ID=your-google-analytics-id
# NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Optional: Feature Flags
# NEXT_PUBLIC_ENABLE_AI_FEATURES=true
```

---

## Environment Configuration

### Getting Supabase Credentials

1. **Create a Supabase Project** (if you don't have one):
   - Go to https://supabase.com/
   - Click "Start your project"
   - Create a new project and note the database password

2. **Retrieve API Keys**:
   - Navigate to your project dashboard
   - Go to **Settings** → **API**
   - Copy the following:
     - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
     - **anon/public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

3. **Update `.env.local`**:
   - Replace placeholder values with your actual credentials
   - Save the file

### Environment Variable Reference

| Variable | Description | Required | Public |
|----------|-------------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ Yes | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ Yes | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ Yes | ❌ No |

**Security Notes:**
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- NEVER commit `.env.local` to version control (it's in `.gitignore`)
- NEVER share your `SUPABASE_SERVICE_ROLE_KEY` publicly

---

## Database Setup

### Option 1: Using Supabase Dashboard (Recommended for Beginners)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the migration files located in `supabase/migrations/` in order

### Option 2: Using Supabase CLI (Recommended for Development)

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link to your project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Push migrations**:
   ```bash
   supabase db push
   ```

### Verify Database Setup

Run this query in the SQL Editor to verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

## Verification

### Step 1: Start the Development Server

```bash
npm run dev
```

**Expected Output:**
```
▲ Next.js 16.x.x
- Local:        http://localhost:3000
- Ready in 2.3s
```

### Step 2: Open the Application

1. Open your browser
2. Navigate to http://localhost:3000
3. You should see the Collabryx landing page

### Step 3: Check for Errors

Open the browser console (F12) and terminal:
- ✅ No red errors should appear
- ⚠️ Warnings are generally acceptable during development
- Check the terminal for compilation errors

### Step 4: Test Core Features

- [ ] Page loads without errors
- [ ] Navigation works
- [ ] Theme toggle (dark/light mode) functions
- [ ] 3D visualizations render
- [ ] Authentication pages load

---

## Troubleshooting

### Common Issues

#### Issue 1: `npm install` fails

**Symptoms:**
```
npm ERR! peer dependency error
```

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

#### Issue 2: Port 3000 already in use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

Option 1: Kill the process using port 3000
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

Option 2: Use a different port
```bash
PORT=3001 npm run dev
```

#### Issue 3: Supabase connection errors

**Symptoms:**
```
Error: Invalid Supabase URL
```

**Solutions:**
1. Verify `.env.local` file exists in project root
2. Check that environment variables are correctly set (no extra spaces)
3. Restart the development server after changing `.env.local`
4. Verify Supabase project is running (check Supabase dashboard)

#### Issue 4: TypeScript errors

**Symptoms:**
```
Type error: Cannot find module '@/components/...'
```

**Solutions:**
```bash
# Clear Next.js cache
rm -rf .next

# Restart TypeScript server in VS Code
# Press Ctrl+Shift+P → "TypeScript: Restart TS Server"

# Rebuild
npm run dev
```

#### Issue 5: Module not found errors

**Symptoms:**
```
Module not found: Can't resolve 'module-name'
```

**Solutions:**
```bash
# Ensure you're in the project root directory
pwd  # Should show /path/to/collabryx

# Reinstall dependencies
npm install

# Check if the module exists in package.json
cat package.json | grep "module-name"
```

### Getting Help

If you encounter issues not covered here:

1. Check the [Development Guide](./DEVELOPMENT.md)
2. Search existing [GitHub Issues](https://github.com/your-username/collabryx/issues)
3. Create a new issue with:
   - Your OS and Node.js version
   - Complete error message
   - Steps to reproduce

---

## Next Steps

✅ Installation complete! Here's what to do next:

1. **Read the Documentation**
   - [Development Guide](./DEVELOPMENT.md) - Learn the development workflow
   - [Architecture Guide](./ARCHITECTURE.md) - Understand the project structure
   - [Contributing Guide](./CONTRIBUTING.md) - Start contributing

2. **Explore the Codebase**
   - Check out `app/(public)/page.tsx` for the landing page
   - Look at `components/features/` for feature components
   - Review `lib/supabase/` for database integration

3. **Start Building**
   - Make your first change
   - Create a new feature branch
   - Submit your first pull request

4. **Join the Community**
   - Star the repository ⭐
   - Join discussions
   - Follow the project for updates

---

**Happy coding! 🚀**

[← Back to README](../README.md) | [Development Guide →](./DEVELOPMENT.md)
