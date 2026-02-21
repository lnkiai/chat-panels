# Contributing to Chat Panels

Thank you for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/lnkiai/chat-panels.git
cd chat-panels
npm install
npm run dev
```

## Guidelines

- **UI/UX changes**: Please open an issue first to discuss before submitting a PR.
- **New AI providers**: Open an issue with the provider's API documentation link.
- **Bug fixes**: PRs are welcome! Include a clear description of the bug and your fix.
- **TypeScript**: Keep strict mode. Do not use `any` unless absolutely necessary.

## Pull Request Process

1. Fork the repo and create your branch from `main`
2. Run `npm run build` to ensure the build passes before submitting
3. Keep PRs focused — one feature or fix per PR

## Code Style

- Follow existing patterns in `lib/ai-providers/` for adding new providers
- Components go in `components/`, hooks in `hooks/`
- All API routes must use `export const runtime = "edge"`

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
