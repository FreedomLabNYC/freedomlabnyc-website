<p align="center">
  <img src="static/img/Freedom Lab NYC Logo - Circle.png" alt="Freedom Lab NYC logo" width="200" />
</p>

<h1 align="center">🗽 Freedom Lab NYC Website</h1>

This is the official website for **Freedom Lab NYC** — New York City's premier Freedom Tech community space and educational center.
It's a modern, lightweight static website built with HTML, CSS, and JavaScript.

🌐 **Live site:** [https://freedomlab.nyc](https://freedomlab.nyc)

---

## 🧭 About

The site serves as the central hub for Freedom Lab NYC:

* Info about our mission and community
* Classes & Events calendar
* Links to educational resources at [freedomlab.nyc/classes](https://freedomlab.nyc/classes/)
* Contact information and social links

---

## ⚙️ Tech Stack

* **Architecture:** Static HTML/CSS/JS
* **Styling:** Custom CSS with modern design patterns
* **Hosting:** GitHub Pages
* **Build:** Python standard-library compiler for shared navigation and footer partials

---

## 🚀 Local Development

Clone the repo, build the deployable artifact, and start a local server:

```bash
npm start
```

Then visit [http://localhost:8000](http://localhost:8000). Source pages use shared component placeholders; `scripts/build-site.py` compiles them into `_site/`. Rebuild after changing HTML, partials, CSS, or JavaScript.

---

## 🏗️ Build

Run `npm run build` to compile tracked site files into `_site/`. The build injects `partials/nav.html` and `partials/footer.html`, and `npm run audit` validates the compiled artifact.

The main pages are:
* `index.html` - Homepage
* `classes-events.html` - Classes & Events
* `contact.html` - Contact information
* `join.html` - Membership/join page

---

## 🌍 Deployment (GitHub Pages)

The site deploys automatically to GitHub Pages when changes are pushed to the `main` branch.

The GitHub Actions workflow builds and audits `_site/`, then publishes only that compiled artifact to [https://freedomlab.nyc](https://freedomlab.nyc).

---

## 🧠 Repo Structure

```plaintext
btcnyc.github.io/
├── index.html                   # Homepage
├── classes-events.html          # Classes & events page
├── contact.html                 # Contact page
├── join.html                    # Join/membership page
├── css/                         # CSS stylesheets
│   ├── styles.css               # Global styles
│   ├── home.css                 # Homepage styles
│   ├── classes.css              # Classes page styles
│   ├── contact.css              # Contact page styles
│   └── join.css                 # Join page styles
├── static/                      # Static assets
│   ├── CNAME                    # Custom domain config
│   └── img/                     # Images, logos, icons
└── README.md
```

---

## 🤝 Contributing

We welcome contributions from developers who want to improve or extend the Freedom Lab NYC website.

### 🪜 Getting Started

1. Fork this repo and clone your fork locally.
2. Create a new branch for your feature or fix:

   ```bash
   git checkout -b feature/my-new-section
   ```
3. Run the compiled local preview with `npm start`.
4. Make your changes — edit HTML files directly, add/modify CSS in `css/`, update JavaScript as needed.
5. Test your changes locally in your browser.
6. Commit and push your branch:

   ```bash
   git add .
   git commit -m "Add new feature section"
   git push origin feature/my-new-section
   ```
7. Open a pull request to `main`.

### 🧩 Code Style

* Use **semantic HTML5** elements where appropriate.
* Keep CSS organized and follow existing naming conventions.
* Maintain accessibility standards (alt text, ARIA labels, etc.).
* Keep the design minimal and consistent with the Freedom Lab NYC theme.

### ✅ Before Opening a PR

* Test your changes in multiple browsers (Chrome, Firefox, Safari).
* Verify responsive design works on mobile and desktop.
* Check that all links work correctly.
* Ensure images are optimized for web (reasonable file sizes).
* Keep commits concise and descriptive.

### 🔍 Issue Tracking

* Use **GitHub Issues** to report bugs or request features.
* Tag issues appropriately (e.g., `enhancement`, `bug`, `design`, `content`).

---

## 💡 Related Repos

* [btcnyc/classes](https://github.com/btcnyc/classes) — curriculum, guides, and workshop resources

---

## 👩‍💻 Maintainers

Community-maintained by the **Freedom Lab NYC** team.
Questions or PRs welcome!

---

## ⚖️ License

[MIT License](LICENSE)
