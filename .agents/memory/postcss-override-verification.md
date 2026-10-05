---
name: PostCSS override verification
description: Observed behavior when trying to override Next.js's pinned PostCSS dependency in the MarketNet npm workspace.
---

In this workspace, adding a root PostCSS override and running targeted npm workspace installs, lockfile-only installation, and package updates did not change the PostCSS version resolved beneath Next.js. The security audit continued to report the vulnerable version.

**Why:** A manifest override that appears correct is not enough evidence that the lockfile or installed dependency tree changed; assuming it worked would leave the security finding unresolved.

**How to apply:** After any future PostCSS override attempt, verify the actual `npm ls postcss` tree and audit result. If a clean override cannot be applied, do not silently make another major Next.js upgrade; get approval first.
