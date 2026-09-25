# GitHub Basics: Your First Repository

Every coding exercise in this course is handed in the same way: you keep your work in your own **repository**
(a project folder that Git tracks) on **GitHub**, and you submit the link to it. This exercise walks you through
doing that once, start to finish. After this, every exercise works the same way.

**Git** is a tool on your computer that remembers every saved version of your project. **GitHub** is a website
that stores a copy of your project online so you (and your coach) can see it from anywhere.

If you like to learn by watching first, this [video walkthrough](https://www.youtube.com/watch?v=9cCApTLb_Io&list=PLbvhRHYrmshSCAHZbibqh_px_LxnU54dk)
covers the same steps.

## 1. Get set up (once)

1. Install [Git](https://git-scm.com/downloads). Keep the default options.
2. Make a free account on [GitHub](https://github.com/signup), or sign in if you already have one.
3. Tell Git who you are. Open a terminal (on Windows, open **Git Bash**) and type, with your own name and email:

```shell
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

## 2. Make a repository on GitHub

1. On GitHub, click the **+** in the top right corner, then **New repository**.
2. Name it `github-basics`. Leave it **Public** so your coach can open it.
3. Leave every other box unticked and click **Create repository**. GitHub shows you the repository's address;
   keep that page open.

## 3. Put the starter files in it

1. Download the starter files from this page and unzip them into a new folder called `github-basics`.
2. Open `README.md` in your editor and fill in the three lines about yourself. Save it.
3. In your terminal, go into that folder and connect it to GitHub. Replace the address with the one GitHub showed you:

```shell
cd github-basics
git init -b main
git add .
git commit -m "My first commit"
git remote add origin https://github.com/your-username/github-basics.git
git push -u origin main
```

`git add .` picks up your changes, `git commit` saves a version with a short message, and `git push` sends it to
GitHub. The first push may ask you to sign in to GitHub.

Refresh the GitHub page: your `README.md` is there.

## 4. Submit

Copy the address of your repository from your browser (it looks like `https://github.com/your-username/github-basics`)
and paste it into the form below. That's the whole hand-in.

## Every exercise after this

1. Download the starter files and make a new repository for them, as above.
2. Do the work. Whenever you reach a good point, save a version and send it to GitHub:

```shell
git add .
git commit -m "Describe what you changed"
git push
```

3. Many exercises come with tests. When you push, GitHub runs them for you: a green check next to your latest
   commit means they pass, a red X means something still needs work. Click it to see which test failed.
4. Submit your repository link with the form on the exercise page.

## Git cheat sheet

| Command | What it does |
|---|---|
| `git status` | Shows what has changed since your last commit |
| `git add .` | Gets every change ready to be saved |
| `git commit -m "message"` | Saves a version with a message describing it |
| `git push` | Sends your saved versions to GitHub |
| `git pull` | Brings down changes made on GitHub |
| `git log --oneline` | Lists the versions you've saved |
| `git diff` | Shows exactly what changed |
| `git checkout -- filename` | Throws away changes to one file since the last commit |
| `git branch name` / `git switch name` | Makes a separate line of work / moves to it |
