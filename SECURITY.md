# Security Guidelines

## Table of Contents

- [Security Architecture](#security-architecture)
- [Best Practices](#best-practices)
- [Dependency Management](#dependency-management)
- [Data Protection](#data-protection)
- [Incident Response](#incident-response)
- [Third-Party Integrations](#third-party-integrations)

## Security Architecture

- **Authentication**: JWT access + refresh tokens
- **Authorization**: Role-based access control
- **Encryption**: TLS in transit, AES-256 at rest

## Best Practices

- Validate all inputs with schema validation
- Sanitize HTML to prevent XSS
- Use CSRF protection for cookie-based flows
- Parameterize SQL queries to prevent injection

Example middleware:

```ts
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1),
  content: z.string().min(1)
});
```

## Dependency Management

- Run `npm audit` weekly
- Use Dependabot for updates
- Block critical CVEs before releases

## Data Protection

- Encrypt fields like access tokens
- Mask sensitive logs
- Ensure GDPR compliance for delete requests

## Incident Response

1. Identify issue and severity
2. Rotate credentials if needed
3. Communicate impact to stakeholders
4. Post-incident review

## Third-Party Integrations

- Use OAuth for integrations
- Store API keys in secrets manager
- Rate limit external calls
