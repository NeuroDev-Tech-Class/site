# Terminal Commands

The terminal lets you work with files and run programs by typing commands. Read the section for your computer
(Linux and macOS use the same commands; Windows uses PowerShell), then try the practice below.

## Using the Terminal: A Beginner’s Guide

In this lesson, you’ll learn how to use the terminal (also known as the command line).  
We’ll use it to navigate files, run JavaScript programs, and later, work with Git for saving your code projects.

---

## What Is the Terminal?

The terminal is a tool that lets you type commands to tell your computer what to do.

We’ll use it to:
- Navigate between folders (directories)
- Run JavaScript files using Node.js
- Use Git to save and share code

---

## Opening the Terminal

If you don’t see one at the bottom of your screen:
1. Click **View** at the top of VS Code.
2. Select **Terminal** near the bottom of the list.

You should see something like this:

```bash
yourname@DESKTOP-GHSDFJ02:/mnt/c/SomeFolders/WebDev-II-1.0-Terminal_Commands/
```

Each `/` separates folders on your computer, ending with the folder you’re currently in.

---

## Navigating Files and Folders

### ls
```bash
ls
```
Lists all files and folders in your current directory.  
Try it now — you’ll see your assignments or units.

### cd
```bash
cd Unit-1/
```
`cd` stands for **Change Directory** — it’s how you move into a folder.  
You’ll notice the terminal path updates to show your new location.

### cd ..
```bash
cd ..
```
Moves **back one folder** (up one level).  
Try moving into and out of folders a few times to get comfortable.

### Auto-Completion
When typing folder names:
- Press **TAB** once to auto-complete the name.
- Press **TAB** twice to see all possible matches.

---

## Running JavaScript Files

We’ll use **Node.js** to execute JavaScript files directly from the terminal.

```bash
node 1.1-Syntax.js
```

To test your code:
1. Save your JavaScript file.
2. Type `node YourFileName.js`.
3. Press **Enter** to run it.

---

## Helpful Shortcuts

| Shortcut | Action |
|-----------|---------|
| Ctrl + L | Clear the terminal screen |
| Ctrl + C | Stop the current process |
| Ctrl + Shift + C | Copy text in the terminal |
| Ctrl + Shift + V | Paste text into the terminal |

---

## Git Basics (Version Control)

Git helps you save versions of your code, track changes, and collaborate with others.

### Initialize a Repository
```bash
git init
```
Creates a new Git repository in your project folder.

### Check Status
```bash
git status
```
Shows which files are new, changed, or ready to be saved.

### Stage Files
```bash
git add .
```
Stages (prepares) all your changed files for saving.

### Commit Changes
```bash
git commit -m "Add initial project files"
```
Saves your changes with a short message about what you did.

### Connect to GitHub (Optional)
```bash
git remote add origin https://github.com/YourUsername/your-repo.git
git push -u origin main
```
Links your local project to GitHub and uploads it.

### Quick Recap
| Command | Purpose |
|----------|----------|
| git init | Start version tracking |
| git add . | Stage changes |
| git commit -m "message" | Save your progress |
| git push | Upload to GitHub |

---

You now know how to navigate the terminal, run code, and start saving your progress with Git.

## PowerShell Basics for Windows Users

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

## Practice

Type each command into your terminal and watch what it does:

```shell
# Copy the code below and run it in your terminal

ls -al

# What happened? This code lists all files and gives more information on them

# Now navigate one folder back in the hierarchy and run the previous code again
# Now clear the output
```
