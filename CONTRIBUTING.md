# Contributing to the JustLend DAO Interface

Thank you for your interest in contributing! This is a community-driven, open-source frontend for the JustLend DAO protocol on TRON. The [README](./README.md#3-how-to-contribute) covers the high-level flow; this document covers local development details.

## Prerequisites

- **Node.js v20.19.2** — we recommend [`nvm`](https://github.com/nvm-sh/nvm): `nvm install 20.19.2`.
- **pnpm v10.12.4** — run `corepack enable` to pick up the pinned version automatically.

## Local development

```bash
git clone https://github.com/justlend/justlend-interface.git
cd justlend-interface
pnpm install            # install dependencies

pnpm run dev            # dev server on http://localhost:18113 (Nile testnet)
pnpm run build          # production build (Vite)
pnpm run serve          # preview the production build locally
```

## Tests

```bash
pnpm run test:unit      # Vitest unit tests
pnpm run e2e            # Playwright end-to-end tests (installs browsers on first run)
```

CI (GitHub Actions, `.github/workflows/ci.yml`) runs the build and unit tests on every pull request — please make sure both pass locally first.

## Workflow

1. **Find or open an issue.** Issues tagged `looking for help` are good entry points; comment to get assigned.
2. **Fork & branch.** Use `type/issue-number-short-description` (e.g. `feat/321-add-user-profile`).
3. **Commit** following [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, …).
4. **Open a PR** against `main`, summarize your changes, and complete the PR checklist.
5. **Review.** A maintainer reviews; address feedback, then it's merged after code review + QA.

## Code style

- A Prettier config (`.prettierrc`) ships with the repo — format before committing.
- Keep PRs focused; avoid unrelated refactors in the same change.

## Reporting

- Regular bugs / feature requests → [open an issue](https://github.com/justlend/justlend-interface/issues/new).
- Security vulnerabilities → **do not** open a public issue; follow [SECURITY.md](./SECURITY.md).

By contributing, you agree that your contributions are licensed under the [Apache-2.0 License](./LICENSE.md) and that you will uphold our [Code of Conduct](./CODE_OF_CONDUCT.md).
