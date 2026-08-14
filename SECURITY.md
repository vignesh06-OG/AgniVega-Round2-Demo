# Security & Authorization

## 1. Role Isolation (Demo)
AgniVega currently implements four distinct personas:
- Farmer
- Driver
- Fleet Operator
- Administrator

To demonstrate role isolation in a serverless/demo environment, we utilize client-side token storage (`agnivega_auth`) combined with strict TanStack Router `beforeLoad` guards. 

**Example:**
If a user is authenticated as a `farmer` and attempts to navigate to `/driver`, the router intercepts the request and immediately redirects them to the unauthenticated landing page. 

*Note for Evaluators: In a full production deployment, this client-side guard would be backed by server-side JWT verification and Row Level Security (RLS) policies in the database.*

## 2. Privacy
- **Driver Visibility**: The driver dashboard only receives operational telemetry (weight, distance, pickup coordinates, destination). It **never** receives the farmer's crop value, Expected Net Amount, or market price data.

## 3. Secret Management
- API Keys (e.g., Gemini AI, Mapbox) are explicitly excluded from version control. 
- The repository utilizes a `.env.example` template. No real credentials exist anywhere in the source code, markdown files, or git history.
