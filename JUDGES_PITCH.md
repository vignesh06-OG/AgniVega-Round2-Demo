# Smart Krishi-Yatra AI — Judge's Pitch & Media Kit

## The Hook

_“What if the highest market price doesn't mean the highest income for the farmer?”_

Most ag-tech platforms focus on discovering the highest Mandi price. But a 15% higher price at a market 200 kilometers away can result in a net **loss** due to transportation costs and crop degradation.

Smart Krishi-Yatra AI solves this by introducing a new metric: **Expected Net Realization (ENR)**.

## The Problem

Smallholder farmers suffer from fragmented logistics:

1. They book entire trucks for small (LTL) loads, wasting money on empty space.
2. They choose markets blindly based solely on gross price, ignoring transit costs.
3. Lack of reliable transport leads to post-harvest loss (up to 30% in some perishables).

## Our Solution

Smart Krishi-Yatra AI is a **Market-Aware Agricultural Logistics Operating System**.

We answer five questions simultaneously:

- **WHERE** should the farmer sell?
- **WHICH** vehicle should transport it?
- **HOW** should loads be pooled?
- **WHICH** route should be used?
- **WHEN** should the trip be dispatched?

### How It Works: The ENR Engine

Our system calculates:
`ENR = Predicted Mandi Price - (Transport Cost + Time Degradation + Quality Risk)`

Using a **Deterministic Capacity-Constrained Vehicle Routing Problem (CVRP)** engine, we automatically pool loads from neighboring farmers (LTL to FTL) and route the most efficient fleet vehicle to pick them up, ensuring the farmer gets the maximum actual cash in hand.

## Key Technical Achievements

1. **Deterministic CVRP Optimization:** Mathematically rigorous routing that respects vehicle capacity, driver hours of service (HOS), and delivery windows.
2. **Offline-First PWA:** Built entirely on modern web standards (React 19, TanStack Router) with IndexedDB caching, meaning it works even when the farmer loses 4G connectivity in the field.
3. **Voice IVR Prototype:** Farmers shouldn't need a smartphone or app literacy to book a truck. Our prototype demonstrates a natural language voice interface that extracts intent directly from speech.
4. **Zero-Trust Handover Tokens:** Cryptographically generated receipts ensure drivers get paid instantly upon delivery, and farmers have verifiable proof of cargo handover.

## The Impact (ESG)

- **Economic:** Increases farmer net realization by 12–18% through dynamic pooling and data-driven market selection.
- **Environmental:** Reduces "empty miles" and carbon emissions by ensuring trucks run at >85% capacity.
- **Social:** Democratizes access to enterprise-grade logistics for smallholder farmers.

## The Team

**Agnivega** is a team of software engineers and logistics innovators committed to building resilient, market-aware systems that uplift the farming community.
