# Git Best Practices & Workflow

## Core Philosophy
- **Main is Sacred**: The `main` branch should always be deployable. Never push directly to `main` for non-trivial changes.
- **One Feature, One Branch**: Isolate your work. This makes it easier to review, test, and revert if necessary.
- **Commit Often, Push Daily**: Don't hoard changes. Small, frequent commits are easier to understand and fix.

## Daily Workflow: The Feature Branch Cycle

### 1. Start Fresh
Always start from the latest `main` code.
```bash
git checkout main
git pull origin main
```

### 2. Create a Branch
Name your branch descriptively (e.g., `feature/login-page`, `bugfix/header-alignment`).
```bash
git checkout -b feature/my-new-feature
```

### 3. Work & Commit
Make your changes. Check status frequently.
```bash
git status
git add .
git commit -m "feat: add login form layout"
```

**Commit Message Conventions (Semantic Commits):**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Formatting, missing semi-colons, etc; no code change
- `refactor:` Refactoring production code
- `test:` Adding tests, refactoring test; no production code change
- `chore:` Updating build tasks, package manager configs, etc

### 4. Push & Pull Request
Push your branch to GitHub.
```bash
git push -u origin feature/my-new-feature
```
- Go to GitHub and open a **Pull Request (PR)**.
- Describe your changes.
- Request a review if working in a team.
- **Merge** only when checks pass and (optional) code is reviewed.

### 5. Cleanup
After merging, delete the local branch to keep your machine clean.
```bash
git checkout main
git pull origin main
git branch -d feature/my-new-feature
```

## Advanced Scenarios

### Handling Merge Conflicts
If `main` has changed while you were working, you might have conflicts.
1. **Update your branch with main:**
   ```bash
   git checkout feature/my-new-feature
   git pull origin main  # or git merge main
   ```
2. **Resolve conflicts:** Open the files with conflicts (look for `<<<<<<<`), fix them, and save.
3. **Finish the merge:**
   ```bash
   git add .
   git commit -m "Merge main and resolve conflicts"
   ```

### Recovering
- **Undo last commit (keep changes)**: `git reset --soft HEAD~1`
- **Discard changes in a file**: `git checkout -- filename` (or `git restore filename`)
- **Amend last commit** (if you forgot to add a file):
  ```bash
  git add forgotten_file.ts
  git commit --amend --no-edit
  ```
