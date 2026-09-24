# PowerShell Basics for Windows Users

If you’re using **Windows without WSL**, you’ll work in **PowerShell** instead of a Linux shell.  
The core ideas are the same: navigate folders, run JavaScript with Node, and use Git to manage code.

---

## Navigating Files and Folders

| Purpose | Linux Command | PowerShell Command |
|---|---|---|
| List files | `ls` | `dir` or `Get-ChildItem` |
| Show hidden files | `ls -a` | `Get-ChildItem -Force` |
| Change into a folder | `cd foldername` | `cd foldername` |
| Go up one folder | `cd ..` | `cd ..` |
| Where am I? | `pwd` | `Get-Location` |
| Clear the screen | `clear` | `cls` |

### Example
```powershell
dir
cd Documents
cls
```

Each command lets you explore and organize files just like a GUI file explorer—only faster.

---

## Running JavaScript Files (Node.js)

PowerShell uses the **same** command as Linux to run JavaScript:

```powershell
node 1.1-Syntax.js
```

If you see:
```
'node' is not recognized as the name of a cmdlet, function, script file, or operable program
```
then Node isn’t installed or your session needs a restart.

Verify versions:
```powershell
node -v
npm -v
```

If you use **nvm-windows**:
```powershell
nvm use 20
```

---

## Using Git in PowerShell

Git commands are **identical** in PowerShell and Linux:

```powershell
git init
git status
git add .
git commit -m "Initial commit"
git push
```

The first push may prompt you to sign in to GitHub; approve the login.

---

## Helpful Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + L` or `cls` | Clear the terminal |
| `Ctrl + C` | Stop the current command |
| `↑` / `↓` | Browse command history |
| `Tab` | Autocomplete file/folder names |
| `Ctrl + Shift + C` / `Ctrl + Shift + V` | Copy / Paste |

---

## Practice Commands for PowerShell

On Linux/macOS you might use a `.sh` script; in PowerShell, create a `.ps1` script.

### Example: `practice.ps1`
```powershell
# List all files (including hidden)
Get-ChildItem -Force

# Go up one folder and list again
Set-Location ..
Get-ChildItem -Force

# Clear the screen
Clear-Host
```

### Run it
```powershell
.\practice.ps1
```

If scripts are blocked for security, allow scripts **for this session only**:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

---

## PowerShell vs. Linux Command Reference

| Task | Linux | PowerShell |
|---|---|---|
| List files | `ls` | `dir` |
| Show hidden files | `ls -a` | `Get-ChildItem -Force` |
| Enter folder | `cd folder` | `cd folder` |
| Up one level | `cd ..` | `cd ..` |
| Current directory | `pwd` | `Get-Location` |
| Clear screen | `clear` | `cls` |
| Run a script | `bash script.sh` | `.\script.ps1` |
| Show history | `history` | `Get-History` |
| Exit terminal | `exit` | `exit` |

---

## Summary

You can now:
- Navigate folders and files in PowerShell.
- Run JavaScript files with Node.
- Use Git to track and share your code.
- Write and run simple PowerShell scripts.
- Translate common Linux shell commands to PowerShell.