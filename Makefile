.PHONY: build dev lint security security-force-fix static-check complexity

# Build the production bundle
build:
	npm run build

# Start the local dev server
dev:
	npm run dev

# ESLint over the whole repo
lint:
	npm run lint

# Check dependencies for known vulnerabilities (non-zero exit if any)
security:
	npm audit

# Auto-apply fixes; may bump major versions (use with care)
security-force-fix:
	npm audit fix --force

# TypeScript type checking, no emit
static-check:
	npm run typecheck

# Cyclomatic complexity gate (ESLint complexity rule, max 10)
complexity:
	npx eslint --config eslint.complexity.config.mjs .
