## What is version control?

![Git logo](/images/slides/what-is-version-control/01.webp)

![Mercurial version control logo](/images/slides/what-is-version-control/02.webp)

![Subversion version control logo](/images/slides/what-is-version-control/03.webp)

---

## A better way to share files

![Stack of paper file folders](/images/slides/what-is-version-control/04.webp)

Version control is a system that helps track and manage changes made to files over time. By far the most popular version control system is Git.

Version control is useful for collaborative work, especially in software development. Instead of emailing files back and forth or using something like Google Drive or Dropbox, everyone can just work on the same files and keep track of changes, and can go back to previous versions if needed.

---

## Stage, commit, push

Staging is the process of adding changes to your code to the staging area, which is a sort of temporary holding area for changes made to your code. The git command for staging change is `git add [filename]`.

Staging lets you choose which changes to include in your next commit, so you can break up your work into meaningful checkpoints. This can be helpful when you need to revert (undo) changes that have been made. You can use `git status` to check what files are currently staged.

---

## Stage, commit, push

Committing involves saving all of the changes that have been staged to the local Git repo, along with a message that explains the changes made. This creates a snapshot in the repository's history, allowing for future access. The command for committing is `git commit -m “[message]”`.

Pushing is uploading all your changes to a remote repository (like GitHub) for others to view and collaborate on. This allows other developers to access and review your changes, and to then contribute their own changes. The command for pushing is `git push`.

---

## Stage, commit, push

To recap:

1. Stage edits to a file to prepare them for a commit.
2. Commit these staged edits to take a snapshot of this version of your files, along with a helpful message.
3. Push the commit to a remote repository to share with others.

---

## Branches

![Diagram of colored dots connected by branching and merging lines, representing Git branches](/images/slides/what-is-version-control/05.webp)

What if multiple people need to work on the same project?

When two or more people edit the same file, they risk causing merge conflicts (incompatible changes that Git can't resolve automatically.) These can be a huge headache to fix.

To avoid this, each person works on a separate branch, isolating their changes from the main codebase (main or master). This allows work to happen in parallel without interference. Once a job is complete, the branch can be merged back into the main branch (usually after a review by a team lead or admin.)

---

## Git commands and flags

By now you should have already installed Git, and have some experience with text commands through a terminal. Git commands can be performed in VS Code’s terminal or in the command prompt. Some commands have flags, which begin with a - modify commands. Here are some examples:

- `git init` - initialize a new repository in the current directory
- `git add [filename]` - add changes to the staging area
- `git add -A` - add ALL changes (convenient, but be careful with this one)
- `git commit -m “[message]”` - commit and document changes to repository
- `git push` - push changes to remote repository
- `git push --force` - force changes, even if the local branch has diverged

---

## Git commands and flags

- `git pull` - pull changes from remote to local repo
- `git reset --hard` - forcibly reset local repo, discarding local changes
- `git status` - show modified, staged, and untracked files
- `git clone [url]` - clone a remote repo to your local machine
- `git diff [filename]` - show differences between different versions of files
- `git branch` - list all branches in the repo
- `git checkout [branch]` - switch to a different branch
- `git merge [branch]` - merge changes from another branch into the current
- `git log` - display commit history, including authors and timestamps
- `git remote` - manage remote repos (GitHub) linked to local repo
- `git restore --source=HEAD` - restore all tracked files (undo staged changes)

---

## Setting up a new repo

- To begin, you’ll need to download Git and set up a GitHub account (you should have already done this by now)
- Open VS Code and navigate to the folder where you want to create the new repository.
- Open the terminal in VS Code by clicking Terminal in the top menu and selecting New Terminal.
- Type `git init` in the terminal to initialize a new Git repository in the current folder.
- Create a new file or add an existing file to the repository using the `touch` command followed by the file name (ex: `touch hello.py`)

---

## Setting up a new repo

- Stage the changes to the file(s) using the `git add` command.
- Commit the changes to the repository using the `git commit -m` command.
- Create a new repository on GitHub.com and copy the URL of the repository.
- Connect your local repository to the GitHub repository using the command `git remote add origin` followed by the GitHub URL (ex: `git remote add origin https://github.com/your-username/your-repository.git`).
- Push the changes from your local repository to the GitHub repository using the command `git push -u origin main` (or the branch name you are pushing). This will also create a new branch called 'main' on GitHub if it doesn't exist already.

---

<div class="video-embed"><iframe src="https://www.youtube.com/embed/2ReR1YJrNOM" title="Video" allowfullscreen></iframe></div>
