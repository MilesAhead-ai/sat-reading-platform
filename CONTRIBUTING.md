# Contributing

Thanks for your interest in contributing to the SAT Reading Platform!

## Getting Started

1. Fork the repository
2. Clone your fork and set up the development environment (see README)
3. Create a feature branch: `git checkout -b feat/your-feature`
4. Make your changes
5. Run type-checking: `cd apps/api && npx tsc --noEmit`
6. Commit with a clear message: `git commit -m "feat: add X"`
7. Push and open a Pull Request against `main`

## Code Style

- TypeScript for API and Web (strict mode)
- Follow existing patterns in each module
- Use NestJS conventions for the API (modules, services, controllers)
- Use React Server Components / App Router conventions for the frontend

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `refactor:` — code change that neither fixes a bug nor adds a feature
- `test:` — adding or updating tests

## Reporting Bugs

Open an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, browser)

## Adding Content

See the README section on "Importing Additional Content" for how to add your own practice passages and questions.

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.
