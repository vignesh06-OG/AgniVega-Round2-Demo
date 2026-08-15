const fs = require("fs");
let code = fs.readFileSync("src/routes/_authenticated/farmer.tsx", "utf8");

// 1. Add missing imports
code = code.replace(
  'import { createBookingHold, getBooking, confirmPayment } from \"@/lib/krishi/booking.server\";',
  'import { createBookingHold, getBooking, confirmPayment, getVehicleCapacity, cancelBooking } from \"@/lib/krishi/booking.server\";',
);

// 2. Add vehicle capacity state and query
if (!code.includes("const cancelBookingFn = useServerFn(cancelBooking);")) {
  code = code.replace(
    "const confirmPaymentFn = useServerFn(confirmPayment);",
    "const confirmPaymentFn = useServerFn(confirmPayment);\n  const cancelBookingFn = useServerFn(cancelBooking);\n  const getCapacityFn = useServerFn(getVehicleCapacity);",
  );
}

// Add state for vehicle capacity
if (!code.includes("const [vehicleCap, setVehicleCap]")) {
  code = code.replace(
    "const [paymentOpen, setPaymentOpen] = useState(false);",
    "const [paymentOpen, setPaymentOpen] = useState(false);\n  const [vehicleCap, setVehicleCap] = useState<{total: number, booked: number} | null>(null);",
  );
}

// 3. Update activeOption.pooled.vehicle display logic (around line 431)
// It shows 2,500 kg hardcoded. We need to fetch capacity when OPTIONS_READY
if (code.includes('<p className=\"font-semibold text-base\">2,500 kg</p>')) {
  // First, let's fetch capacity when activeOption changes
  code = code.replace(
    'if (flowState === \"ANALYZING\") {',
    'useEffect(() => {\n    if (flowState === \"OPTIONS_READY\" && activeOption) {\n      getCapacityFn({ data: { vehicleId: activeOption.pooled.vehicle } }).then(setVehicleCap);\n    }\n  }, [flowState, activeOption]);\n\n  if (flowState === \"ANALYZING\") {',
  );

  // Then replace the hardcoded 2500 kg
  code = code.replace(
    '<p className=\"font-semibold text-base\">2,500 kg</p>',
    '<p className=\"font-semibold text-base\">{vehicleCap ? vehicleCap.total.toLocaleString() : \"...\"} kg</p>',
  );

  code = code.replace(
    '<p className=\"font-semibold text-base\">{result.nearbyPool.totalWeightKg.toLocaleString()} kg</p>',
    '<p className=\"font-semibold text-base\">{vehicleCap ? vehicleCap.booked.toLocaleString() : result.nearbyPool.totalWeightKg.toLocaleString()} kg</p>',
  );
}

// 4. Edit Booking -> Cancel previous hold to release capacity
code = code.replace(
  'onClick={() => setFlowState(\"OPTIONS_READY\")}',
  'onClick={async () => {\n                    if (bookingRecord) {\n                      try { await cancelBookingFn({ data: { bookingId: bookingRecord.bookingId } }); } catch(e) {}\n                    }\n                    setFlowState(\"OPTIONS_READY\");\n                  }}',
);

// 5. Add "DEMO DATA" and "AI Estimate" Badges
code = code.replace(
  'AI Engine Optimizing...\" : \"AI ????? ????????? ??? ???...\"}',
  'AI Engine Optimizing...\" : \"AI ????? ????????? ??? ???...\"}\n              <Badge variant=\"outline\" className=\"ml-2 bg-blue-50 text-blue-700\">AI Estimate</Badge>',
);

code = code.replace(
  '{lang === \"en\" ? \"Market Comparison\" : \"???????? ?????\"}',
  '{lang === \"en\" ? \"Market Comparison\" : \"???????? ?????\"} <Badge variant=\"outline\" className=\"ml-2 bg-amber-50 text-amber-700\">DEMO DATA</Badge>',
);

fs.writeFileSync("src/routes/_authenticated/farmer.tsx", code);
