.PHONY: build dev lint security security-force-fix static-check complexity fill

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

# Kill leftover local processes from dev/E2E runs: listeners on the Next dev
# ports, node processes whose cwd is this repo, and Playwright browsers.
fill:
	@echo "fill: looking for leftover Mejenga processes..."
	@for pid in $$(lsof -t -iTCP:3000-3009 -sTCP:LISTEN 2>/dev/null | sort -u); do \
		echo "  killing listener $$pid ($$(ps -p $$pid -o comm= 2>/dev/null))"; \
		kill -TERM $$pid 2>/dev/null || true; \
	done
	@for pid in $$(pgrep -x node 2>/dev/null); do \
		cwd=$$(lsof -a -p $$pid -d cwd -Fn 2>/dev/null | sed -n 's/^n//p'); \
		case "$$cwd" in \
			"$(CURDIR)"|$(CURDIR)/*) echo "  killing project node $$pid"; kill -TERM $$pid 2>/dev/null || true ;; \
		esac; \
	done
	@pkill -f "ms-playwright" 2>/dev/null || true
	@if lsof -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then \
		echo "fill: done — WARNING: :3000 still busy"; \
	else \
		echo "fill: done — :3000 free"; \
	fi
