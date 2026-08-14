# Testing Strategy

AgniVega relies on rigorous testing to ensure mathematical accuracy in the logistics engine and UI reliability for the user.

## Current Test Status
- **Unit Tests**: `79/79 Passing`
- **End-to-End QA**: `100% Passed`

## 1. Unit Tests
We use Vitest to cover the complex mathematical functions that power the routing and logistics engine.

To run the unit tests:
```bash
npm test
```
*Coverage includes:*
- Market Price Calculation
- Multi-vehicle capacity splitting logic
- Fleet pooling assignment rules
- Distance calculation formulas

## 2. Browser E2E Acceptance Testing
Prior to the final commit, the repository underwent an exhaustive "Red Team" black-box browser test. 

*Verified Behaviors:*
- **Farmer Happy Path**: Login -> Crop selection (12,000kg) -> Quality form -> Market selection -> Booking hold -> Payment -> Confirmed Dashboard.
- **Role Isolation**: Hard-blocking cross-role access (e.g. Farmer to Admin).
- **Missing API Key**: Verified the system gracefully degrades to manual quality entry rather than crashing or faking data.
- **Dynamic Math**: Verified that changing crop quantities instantly recalculates the multi-vehicle allocation and logistics fees.
