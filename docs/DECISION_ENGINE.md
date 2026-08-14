# Decision Engine & Market Intelligence

The core innovation of AgniVega is shifting the farmer's decision from "highest gross market price" to **"highest Expected Net Amount."**

## The Formula

The decision engine calculates the true value of a crop at a specific market using this logic:

```text
  Gross Market Value (Crop Quantity × Market Price per kg)
- Transport Cost (Distance × Fleet Rate + Tolls)
- Expected Logistics Risk (Spoilage % based on time/temp)
=========================================================
= Expected Net Amount
```

## 1. Market Price (Seeded Data)
The system references a localized database of mandis (e.g., Nashik APMC, Rahuri APMC). For demo reliability, this uses seeded data rather than a live external feed that could fail during presentation.

## 2. Transport Cost (Dynamic Pooling)
The system calculates distance using geospatial routing (`src/lib/routing`). The transport cost is not a flat fee. It calculates the necessary vehicle size, or multiple vehicles, and determines the freight cost based on those specific vehicles.

## 3. Farmer Override
Crucially, AgniVega **recommends** a market, but the farmer **decides**. The UI ranks the markets by Expected Net Amount, but the farmer can manually select a lower-ranked market if they have personal reasons (e.g., existing relationships with buyers there), recalculating the transport logistics instantly.
