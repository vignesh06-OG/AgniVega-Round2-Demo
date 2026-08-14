# Multi-Vehicle Dispatch Engine

A common failure of basic logistics apps is the "Capacity Exceeded" error. If a farmer wants to move 12,000 kg, and the largest truck nearby is 5,000 kg, basic apps fail.

AgniVega intelligently splits the load.

## The Logic

When the Farmer inputs a weight that exceeds the single largest available vehicle in the fleet pool, the algorithm mathematically determines the optimal combination of vehicles to cover the load.

### Example Scenario

- **Farmer Load**: `12,000 kg`

**Available Fleet Pool:**
- Vehicle A (Tata 407): `2,500 kg` limit
- Vehicle B (Bolero): `1,500 kg` limit
- Vehicle C (Tata 1613): `10,000 kg` limit

**The Engine Execution:**
1. The engine iterates through the pool, prioritizing the largest available vehicle to minimize overhead.
2. It allocates `10,000 kg` to Vehicle C.
3. Remaining load: `2,000 kg`.
4. It allocates the remaining `2,000 kg` to Vehicle A (since it fits under the 2,500 kg limit).

**Result shown to Farmer:**
Instead of failing, the system offers a combined transport option:
- 1x Tata 1613 (10,000 kg)
- 1x Tata 407 (2,000 kg)
Total Transport Fee calculated accordingly.

This ensures that large-scale agricultural shipments are never rejected by the platform.
