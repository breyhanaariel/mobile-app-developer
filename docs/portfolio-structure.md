# Portfolio Repository Structure

The repository is organized into three layers:

## Portfolio Presentation

- `README.md` — GitHub-facing portfolio overview
- `assets/` — artwork used directly by the README, including featured-project covers

## Live Portfolio Website

- `site/index.html` — portfolio homepage
- `site/services.html` — services, packages, support options, and project inquiry form
- `site/assets/` — website-specific visual assets

## Application Projects

- `glossed-tip/`
- `all-together/`
- `bite-route/`

Each application remains a self-contained project folder with its own README, source code, and project-specific documentation.

## Automation

Application CI workflows remain in `.github/workflows/` and use project-specific paths. The application folders should not be reorganized solely for cosmetic consistency because their established structure is part of the working codebase.
