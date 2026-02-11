# Contributing to AI Agent Manager

Thank you for your interest in contributing to AI Agent Manager! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

### Prerequisites

- Node.js 22.12+ (or 20.19+)
- Docker and Docker Compose
- Git
- Basic knowledge of TypeScript, React, and Next.js

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-agent-manager.git
   cd ai-agent-manager
   ```

3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/ai-agent-manager.git
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Set up the database:
   ```bash
   docker-compose up -d
   npm run db:push
   npm run db:seed
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or changes
- `chore/` - Maintenance tasks

Examples:
- `feature/agent-execution-engine`
- `fix/auth-session-timeout`
- `docs/update-api-documentation`

### Commit Messages

Follow conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(agents): add agent execution queue
fix(auth): resolve session persistence issue
docs(readme): update installation instructions
```

### Pull Request Process

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Write clean, readable code
   - Follow existing code style
   - Add tests for new features
   - Update documentation as needed

3. **Test your changes**:
   ```bash
   npm run lint
   npm run build
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat(scope): your descriptive message"
   ```

5. **Keep your fork synced**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**:
   - Use a clear, descriptive title
   - Provide a detailed description of changes
   - Reference related issues
   - Add screenshots for UI changes
   - Ensure CI passes

### Pull Request Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots here

## Related Issues
Fixes #123
Related to #456
```

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Enable strict mode
- Define explicit types (avoid `any`)
- Use interfaces for object shapes
- Use type unions for variants

### React/Next.js

- Use functional components
- Prefer server components (default in App Router)
- Use client components only when necessary (`'use client'`)
- Use React Server Actions for mutations
- Implement proper error boundaries

### Styling

- Use Tailwind CSS utility classes
- Follow shadcn/ui patterns
- Maintain responsive design
- Support dark mode
- Use CSS variables for theming

### File Organization

```
feature/
├── components/          # Feature-specific components
├── lib/                # Feature utilities
├── types/              # Feature type definitions
└── __tests__/          # Feature tests
```

### Naming Conventions

- **Files**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Functions**: camelCase (`getUserData`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`UserProfile`, `AgentConfig`)

## Database Changes

### Schema Modifications

1. Update `prisma/schema.prisma`
2. Create migration:
   ```bash
   npm run db:migrate
   ```
3. Update seed data if needed
4. Update TypeScript types
5. Document breaking changes

### Migrations

- Name migrations descriptively
- Test migration both up and down
- Consider backward compatibility
- Update documentation

## Testing

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Writing Tests

- Write tests for new features
- Update tests for bug fixes
- Aim for high coverage
- Use descriptive test names
- Test edge cases

### Test Structure

```typescript
describe('Feature', () => {
  it('should do something specific', () => {
    // Arrange
    // Act
    // Assert
  })
})
```

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Document complex logic
- Explain non-obvious decisions
- Keep comments up-to-date

### README Updates

Update README.md for:
- New features
- Configuration changes
- Dependency updates
- Breaking changes

## Performance

### Best Practices

- Minimize client-side JavaScript
- Use server components when possible
- Implement proper caching
- Optimize images
- Lazy load when appropriate
- Monitor bundle size

## Security

### Guidelines

- Never commit secrets
- Validate user input
- Sanitize database queries
- Use parameterized queries
- Implement rate limiting
- Follow OWASP guidelines

### Reporting Vulnerabilities

Email security@example.com with:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Getting Help

- **Documentation**: Check README.md and docs/
- **Issues**: Search existing issues
- **Discussions**: Use GitHub Discussions
- **Discord**: Join our community
- **Email**: contribute@example.com

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Recognized in the community

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to ask questions by:
- Opening a GitHub Discussion
- Commenting on relevant issues
- Joining our Discord server

Thank you for contributing to AI Agent Manager! 🚀
