<!-- @format -->

# Formula Notes

The formula engine starts in Phase 7. Phase 1 only records the non-negotiable
numeric policy:

- Persisted financial values must not use JavaScript floating-point arithmetic
- `Money`, `Quantity`, `Rate`, and `Decimal` values are decimal strings
- `Number` values are whole integers stored as JSON numbers
- Formula execution must be independently testable
- Critical formula paths require full unit-test coverage once implemented

## Phase 7 Implementation

Formula execution now uses a BigInt-backed decimal value:

- Decimal strings are parsed into `{ mantissa, scale }`
- Addition/subtraction align scale before arithmetic
- Multiplication combines scales
- Division rounds with `HALF_UP`
- Formatting emits fixed precision strings

Supported formula syntax is intentionally small: identifiers, decimal literals,
`+`, `-`, `*`, `/`, parentheses, and unary minus.
