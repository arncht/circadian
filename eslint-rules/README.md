# Custom ESLint Rules for Zod

## Rules

### `zod/zod-require-strict` ✅

Ensures all `z.object()` schemas are followed by `.strict()` to prevent unexpected properties.

**❌ Bad:**
```typescript
const schema = z.object({
  name: z.string()
});
```

**✅ Good:**
```typescript
const schema = z.object({
  name: z.string()
}).strict();
```

**Auto-fixable:** Yes - automatically adds `.strict()` after `z.object()`

---

### `zod/zod-require-explicit-type` ⚠️

Requires explicit type annotation when passing object literals to `.parse()` or `.safeParse()` for compile-time type checking.

**❌ Bad:**
```typescript
const result = schema.parse({
  name: "John",
  age: 30  // No compile-time error if 'age' is not in schema
});
```

**✅ Good:**
```typescript
const input: MyType = {
  name: "John",
  age: 30  // Compile-time error if 'age' is not in MyType
};
const result = schema.parse(input);
```

**Auto-fixable:** No - requires manual refactoring

---

## Why These Rules?

### Problem with Zod's Default Behavior

By default, Zod allows extra properties in validated objects:

```typescript
const userSchema = z.object({
  name: z.string()
});

// This passes validation! 😱
userSchema.parse({
  name: "John",
  maliciousCode: "DROP TABLE users;"
});
```

### TypeScript Can't Catch Runtime Issues

TypeScript only checks the return type, not the input:

```typescript
const result = schema.parse({
  name: "John",
  typo: true  // No TypeScript error, but might cause issues
});
```

### Our Solution

1. **`.strict()` everywhere** - Fail fast on unexpected properties
2. **Explicit type annotations** - Get TypeScript errors at compile-time, not runtime

---

## Configuration

These rules are configured in `eslint.config.js`:

```javascript
rules: {
  'zod/zod-require-strict': 'error',      // Enforces .strict()
  'zod/zod-require-explicit-type': 'error' // Enforces explicit types
}
```

## Usage

Run ESLint:
```bash
npm run lint
```

Auto-fix strict issues:
```bash
npm run lint -- --fix
```

**Note:** Only `zod-require-strict` is auto-fixable. The `zod-require-explicit-type` rule requires manual refactoring.
