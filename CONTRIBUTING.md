# Contributing Guide

## Table of Contents

- [Code Style Guide](#code-style-guide)
- [Pull Request Process](#pull-request-process)
- [Commit Message Conventions](#commit-message-conventions)
- [Testing Requirements](#testing-requirements)
- [Documentation Requirements](#documentation-requirements)
- [Security Considerations](#security-considerations)
- [Development Environment Setup](#development-environment-setup)

## Code Style Guide

### Naming Conventions

- **Variables**: `camelCase`
- **Components**: `PascalCase`
- **Files**: `kebab-case` for utilities, `PascalCase` for components
- **Constants**: `SCREAMING_SNAKE_CASE`

### TypeScript Best Practices

- Prefer `interface` for public contracts
- Avoid `any` by using generics
- Use `unknown` for untrusted data
- Enable strict mode

### React Component Patterns

```tsx
export function NoteCard({ note }: NoteCardProps) {
  return (
    <article className="note-card">
      <h3>{note.title}</h3>
      <p>{note.preview}</p>
    </article>
  );
}
```

### File Organization

- `src/components` for shared UI
- `src/features` for domain-specific logic
- `src/hooks` for reusable hooks
- `src/api` for API clients

## Pull Request Process

### Branch Naming

`feature/<ticket-number>-short-description`

### PR Description Template

```
## Summary
- What changed

## Testing
- [ ] Unit tests
- [ ] Integration tests

## Screenshots
- N/A
```

### Code Review Checklist

- [ ] Tests added or updated
- [ ] API docs updated
- [ ] No breaking changes without migration plan
- [ ] Security implications reviewed

## Commit Message Conventions

Format: `type(scope): message`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`

Examples:
- `feat(auth): add refresh token rotation`
- `fix(notes): handle empty title validation`
- `docs(readme): update quickstart`

## Testing Requirements

- Minimum unit test coverage: 80%
- Integration tests required for API endpoints

### Running Tests

```bash
npm run test
npm run test:integration
```

## Documentation Requirements

- Document new API endpoints in `API_DOCUMENTATION.md`
- Update README for major features
- Add inline code comments only for complex logic

## Security Considerations

- Keep dependencies up to date
- Run security scans (`npm audit`)
- Report vulnerabilities via the security policy

## Development Environment Setup

### VS Code Recommendations

- Extensions:
  - ESLint
  - Prettier
  - GitLens
  - Docker

### Debugging Setup

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug API",
  "program": "${workspaceFolder}/server.js"
}
```
