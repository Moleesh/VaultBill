# VaultBill ✨

> **Configure once. Bill, print, and report anywhere.**

VaultBill is a JSON-first, offline-capable billing, invoicing, reporting, PDF, and print platform built to feel calm, predictable, and ready to grow 😊

[![TypeScript](https://img.shields.io/badge/TypeScript-89.3%25-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![SCSS](https://img.shields.io/badge/SCSS-8.3%25-c6538c?logo=sass)](https://sass-lang.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## What VaultBill Is 🌟

VaultBill is designed as a single product foundation for teams that want:

- **Responsive SPA + Desktop**: A responsive single-page application with a desktop-friendly Electron companion
- **JSON-Led Configuration**: Complete control via JSON configuration for document formats, reports, printer profiles, and optional integrations
- **Offline-First Architecture**: Offline-capable local data handling with SQLite-backed startup patching and recovery
- **Strong Type Safety**: Full TypeScript guarantees, SCSS theming, and clean modular structure
- **Multi-Platform Releases**: Release pipeline that produces both web deployment artifacts and desktop installer builds

## Why It Feels Nice To Work With 😊

- **Zero-Configuration Branding**: The app starts from one `APP_NAME` value—branding stays simple and consistent
- **Built-In Themes**: Five built-in themes keep the UI visually distinct without requiring custom styling
- **Security & Permissions**: Operator-aware permissions and document-format fallback logic built in
- **Ready-To-Use Features**: Print, PDF, record, report, backup, and Local API seams are already wired
- **Smart Integrations**: Optional integration contracts for SMS, GST helpers, signature pad, and GSP hooks (no false compliance claims)
- **One-Click Deployment**: Automatic GitHub Pages deployment keeps web publishing simple

## Technology Stack

| Layer | Technologies |
|-------|---------------|
| **Frontend** | TypeScript, Vite, SCSS, React/Vue |
| **Desktop** | Electron, TypeScript |
| **Data** | SQLite (offline-capable) |
| **Build** | npm, Vite, electron-builder |
| **Styling** | SCSS (89.3% TypeScript, 8.3% SCSS) |

## Quick Start 🚀

### Web Development

```bash
npm install
npm run dev
```

Then open the local app at `http://127.0.0.1:5173/`.

### Desktop Development

If you want the Electron shell as well:

```bash
npm run dev:electron
```

## Environment Configuration 🔐

Copy `.env.example` to a local environment file only when you need to override defaults. **Never place a Supabase service-role key or provider secret in a frontend variable.**

| Variable | Required | Used by | Default | Purpose |
|----------|----------|---------|---------|---------|
| `APP_NAME` | No | Desktop build + runtime branding | `VaultBill` | Controls packaged product name, artifact slug, app identifier, and default display |
| `SYSADMIN_PASSWORD` | No | Desktop / LAN server startup | Empty | Optional default password for protected SysAdmin actions |
| `BACKUP_PASSWORD` | No | Desktop backup/restore | Empty | Optional default password for encrypted backups |
| `VITE_SUPABASE_URL` | Yes (hosted only) | GitHub Pages web build | Empty | Public Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes (hosted only) | GitHub Pages web build | Empty | Public Supabase publishable/anon key; RLS protected |
| `VITE_BASE_PATH` | No | GitHub Pages web build | `/` | Optional Vite base path when deploying under a repository path |

**GitHub Environment Setup**: The GitHub environment named `VaultBill` must define the public variables `SUPABASE_URL` and `SUPABASE_ANON_KEY`. The Pages workflow maps them to the public Vite variables.

## Useful Scripts 🛠️

### Day-to-Day Development

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server for the web app |
| `npm run dev:electron` | Run web app and Electron shell together |
| `npm run preview` | Serve production web build locally |
| `npm run format:check` | Check code formatting with Prettier |
| `npm run lint` | Run ESLint with zero warnings |
| `npm run typecheck` | Run TypeScript checks for web and Electron |
| `npm run test` | Run Vitest suite once |
| `npm run test:ci` | Run Vitest in CI-friendly serial mode |

### Build & Release

| Command | Purpose |
|---------|---------|
| `npm run build:web` | Build the web bundle |
| `npm run build:electron` | Build Electron TypeScript output |
| `npm run build:desktop` | Build web app and Electron output together |
| `npm run rebuild:native` | Rebuild optional native modules for Electron |
| `npm run package:desktop` | Create unpacked desktop package in `release/` |
| `npm run package:desktop:installer` | Create platform-specific installer artifacts |
| `npm run smoke:installer` | Verify packaged desktop output |
| `npm run smoke:first-run-db` | Check first-run database startup patches |
| `npm run release:notes` | Generate `artifacts/release-notes.md` |
| `npm run release:desktop` | Run the complete desktop release flow |

## Branding & Build Identity 🎨

VaultBill uses a single build-time name variable for complete branding control:

```bash
# macOS/Linux
APP_NAME='Acme Billing' npm run build:desktop

# PowerShell
$env:APP_NAME = 'Acme Billing'
npm run build:desktop
```

If `APP_NAME` is blank or missing, `VaultBill` is used as the fallback.

### GitHub Pages Deployment

For GitHub Pages builds, the app is published under the `/VaultBill/` subpath. The production build and Pages workflow are aligned with this base path, with an automatic redirect for stray URLs.

## Automation & Deployment 🤖

### CI/CD Workflows

- **Build Release Files**: Packages desktop release files and runs validation when dispatched manually. Replaces existing GitHub Releases for the same version.
- **GitHub Pages**: Automatically deploys the web build on pushes to `main` using the `VaultBill` GitHub Pages environment.
- **Security**: The hosted build uses device-scoped Supabase rows protected by RLS; desktop-only and secret-backed integrations remain disabled.
- **Navigation Fallback**: `public/404.html` keeps GitHub Pages navigation friendly.

## What's Inside The App 📘

VaultBill includes core foundations for:

- ✅ SQLite startup patching and schema recovery
- ✅ Operator accounts, roles, and permission-aware navigation
- ✅ Document-format selection, validation, and fallback handling
- ✅ Dynamic line-item behavior and formula evaluation
- ✅ Saved records, reprints, cancellations, and finalization workflows
- ✅ Print template sanitization, PDF planning, and printer profile selection
- ✅ CSV / TSV import previews and bulk print planning
- ✅ Reports, exports, backup packages, and restore validation
- ✅ Runtime branding, company settings, and DB-backed app assets
- ✅ Keyboard shortcuts, responsive layout metadata, and reusable feedback states

## Project Structure 📁

```
├── docs/              # Documentation and specifications
│   ├── Spec.md        # Implementation source of truth
│   └── ReleasePipeline.md
├── src/               # Web application source
├── electron/          # Electron desktop app
│   ├── server/        # Local API server
│   └── main/          # Electron main process
├── public/            # Static assets
└── tests/             # Test suite
```

## Documentation 📚

- **[Implementation Spec](docs/Spec.md)**: The source of truth for this implementation
- **[Release Pipeline](docs/ReleasePipeline.md)**: Details on the release workflow
- **[Electron Server Routes](electron/server/routes/)**: Typed Local API routes (Phase 16+)
- **[Middleware](electron/server/middleware/)**: Local API middleware (Phase 16+)

## A Tiny Promise 😊

This repo is meant to stay **spec-led**, **test-backed**, and pleasantly boring in the best possible way:

- ✨ No hidden magic
- ✨ No surprise build steps
- ✨ No guesswork about where the code lives

If you're here to extend VaultBill, you're in the right place. Let's keep it smooth, colorful, and reliable ✨

---

## Contributing

We welcome contributions! Please ensure your changes:
- Follow the existing code style and patterns
- Maintain TypeScript strict mode
- Include appropriate tests
- Update documentation as needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Made with ❤️ for clear, predictable billing everywhere**
