# Deuce Cellars website: hosting on Netlify

The site is plain HTML, CSS and JS. There is no build step: Netlify serves this folder as it is (see netlify.toml).

## 1. Put the site on GitHub
1. On github.com, create a new private repository, for example `deuce-cellars-site`.
2. Upload everything in this folder to it (drag and drop on the repo page works), or push it with git:
   ```
   git init
   git add .
   git commit -m "Deuce Cellars site"
   git branch -M main
   git remote add origin https://github.com/<your-account>/deuce-cellars-site.git
   git push -u origin main
   ```
   The hero videos are 10 MB and 5 MB, well under GitHub's 100 MB file limit.

## 2. Connect GitHub to Netlify (continuous deployment)
1. Sign in at app.netlify.com and choose **Add new site > Import an existing project > GitHub**.
2. Authorize Netlify for your GitHub account and pick the `deuce-cellars-site` repo.
3. Branch to deploy: `main`. Build command: leave empty. Publish directory: `.` (netlify.toml already sets both).
4. Deploy. From now on every push to `main` updates the live site automatically.

## 3. Links for revisions
- Netlify gives the site a free address like `deuce-cellars.netlify.app`. Rename it under **Site configuration > Site details > Change site name**.
- **Deploy previews:** open a pull request on GitHub and Netlify posts a private preview link for that change. Share it for review, merge when approved.
- **Branch deploys** (optional): under **Build & deploy > Branches**, enable a branch such as `staging` for a standing link like `staging--deuce-cellars.netlify.app`.

## 4. Before launch
- [ ] Review every page on the netlify.app address, on phone and desktop.
- [ ] Check the Shop buttons, Square link, phone and email links.
- [ ] List the old Duda page addresses and add 301 redirects for them in netlify.toml.
- [ ] Add the favicon and social share image if wanted.

## 5. Go live: the DNS change
1. In Netlify: **Domain management > Add a domain** and enter the domain (and `www`).
2. At the domain registrar, either:
   - point the nameservers to Netlify DNS (simplest), or
   - keep the registrar's DNS: set the apex `A` record to Netlify's load balancer IP and `www` as a `CNAME` to `<site>.netlify.app` (Netlify shows the exact values on that screen).
3. Remove the old Duda records for the same names so they don't conflict.
4. Netlify issues the free HTTPS certificate on its own once DNS resolves (minutes to a few hours).
5. Keep Duda running until the new site loads on the real domain, then cancel it.
