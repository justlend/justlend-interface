# Security Policy

The JustLend DAO Interface is the open-source frontend for the JustLend DAO protocol on TRON. We take the security of this interface seriously.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Instead, use **GitHub's private vulnerability reporting**:

1. Open the **Security** tab of this repository.
2. Click **Report a vulnerability**.
3. Include a clear description, reproduction steps, affected version/commit, and impact assessment.

We will acknowledge your report, investigate, and keep you updated on the resolution. Please allow a reasonable period to address the issue before any public disclosure.

## Scope

This policy covers the **frontend interface in this repository** — e.g. rendering/XSS, wallet-integration handling, client-side data handling, and dependency vulnerabilities.

Issues in the **on-chain JustLend protocol / smart contracts** are **out of scope** here — they concern the protocol itself, not this interface, and should be reported through the protocol's own channels.

## Supported Versions

Only the latest version (tracking `main`, deployed at `app.justlend.org`) is supported. Please reproduce against `main` before reporting.
