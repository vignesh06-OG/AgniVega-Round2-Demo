# Booking State Machine

AgniVega manages the lifecycle of a farmer's dispatch through a strict state machine to prevent capacity overallocation.

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Farmer begins form
    DRAFT --> OPTIONS_READY: Crop & Quality entered
    OPTIONS_READY --> CONFIRMED_EDITABLE: Market & Vehicle Selected
    
    state CONFIRMED_EDITABLE {
        [*] --> TimerStarted
        TimerStarted --> Editing: Farmer modifies load
        Editing --> TimerStarted
    }
    
    CONFIRMED_EDITABLE --> EXPIRED: 30 minutes elapsed (Capacity Released)
    CONFIRMED_EDITABLE --> CANCELLED: Farmer cancels manually
    CONFIRMED_EDITABLE --> PAYMENT_PENDING: Clicks Pay
    
    PAYMENT_PENDING --> LOCKED: Payment Success
    PAYMENT_PENDING --> CONFIRMED_EDITABLE: Payment Fails/Cancel
    
    LOCKED --> DISPATCHED: Fleet Assigned
    DISPATCHED --> IN_TRANSIT: Driver Starts Trip
    IN_TRANSIT --> ARRIVED: Delivery Complete
    ARRIVED --> [*]
```

## Key Mechanics
1. **30-Minute Hold**: When a farmer selects a market and holds a booking, the required vehicle capacity is temporarily reserved. A 30-minute timer starts.
2. **Capacity Release**: If the booking expires or is cancelled, that capacity is immediately returned to the fleet pool.
3. **LOCKED**: Once payment is confirmed, the booking is permanently locked and passed to the Driver dashboard for dispatch.
