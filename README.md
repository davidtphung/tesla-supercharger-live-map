# ~ (Home Directory) Git Repository

This is a **selective dotfiles and configuration tracker** for the macOS home directory.

## Why a git repo at $HOME?

- Convenient for versioning shell configs, git settings, and AI/agent tool preferences.
- **NOT** intended as a general project or backup repo.

## Safety First

A comprehensive [.gitignore](.gitignore) is in place that:

- Ignores **everything** by default (`*`)
- Explicitly allows only a few small, safe config **files**
- Blacklists user data directories (Pictures, Music, Documents, Downloads, Library, Applications, Projects, etc.)
- Blacklists caches, histories, media files, and binaries
- Prevents accidental `git add .` disasters that would bloat the repo with GBs of photos, music, node_modules, etc.

## How to track additional files

```bash
# Force-add specific files you want versioned (bypasses the broad *)
git add -f .zshrc .gitconfig .claude.json

# Check what will be committed
git status

git commit -m "chore: track zsh and claude config"
```

## Recommended files to consider tracking

- Shell: `.zshrc`, `.profile`
- Git: `.gitconfig`
- AI tools: `.claude.json` (sanitized)
- Editor: specific small settings files only

## Important Notes

- **Never** `git add .` or `git add *` at this level.
- Review `git status` and `git diff --cached` carefully before every commit.
- Private keys, tokens, large workspaces, and personal data are excluded by design.
- For more advanced dotfiles management, consider tools like [chezmoi](https://www.chezmoi.io/), [yadm](https://yadm.io/), or a bare-repo + worktree pattern.

## Current branch

`main`

Initialized: June 2026 (via Grok CLI session)
