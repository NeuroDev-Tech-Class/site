# Using the Terminal: A Beginner’s Guide

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

