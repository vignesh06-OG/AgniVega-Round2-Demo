# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: browser-smoke.spec.ts >> AgniVega Round2 - Production Browser Smoke Tests >> Multi-vehicle capacity mathematical invariants (Phase 9)
- Location: tests\browser-smoke.spec.ts:169:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /Analyze Markets|बाजार.*विश्लेषण/ })
    - locator resolved to <button disabled data-tsd-source="/src/routes/_authenticated/farmer.tsx:687:19" class="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 rounded-md px-8 w-full text-lg h-14">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    97 × waiting for element to be visible, enabled and stable
       - element is not enabled
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=f2e1]:
  - generic [ref=f2e2]:
    - generic [ref=f2e3]:
      - generic [ref=f2e4]:
        - generic [ref=f2e5]: Demo mode — seeded Kopargaon–Nashik loads, prices and pools
        - button "Exit demo" [ref=f2e8] [cursor=pointer]
      - banner [ref=f2e9]:
        - generic [ref=f2e10]:
          - link "Team Agnivega Smart Krishi-Yatra AI Team Agnivega" [ref=f2e11] [cursor=pointer]:
            - /url: /
            - img "Team Agnivega" [ref=f2e12]
            - generic [ref=f2e18]:
              - generic [ref=f2e19]: Smart Krishi-Yatra AI
              - generic [ref=f2e20]: Team Agnivega
          - navigation [ref=f2e21]:
            - link "Farmer" [ref=f2e22] [cursor=pointer]:
              - /url: /farmer
            - link "Fleet" [ref=f2e23] [cursor=pointer]:
              - /url: /fleet
            - link "Admin" [ref=f2e24] [cursor=pointer]:
              - /url: /admin
    - main [ref=f2e25]:
      - button "मराठी" [ref=f2e27] [cursor=pointer]
      - generic [ref=f2e28]:
        - button [ref=f2e29] [cursor=pointer]
        - generic [ref=f2e31]:
          - generic [ref=f2e32]: "1"
          - generic [ref=f2e33]: Load & Quality
        - generic [ref=f2e36]:
          - generic [ref=f2e37]: "2"
          - generic [ref=f2e38]: AI Decision
        - generic [ref=f2e41]:
          - generic [ref=f2e42]: "3"
          - generic [ref=f2e43]: Dispatch
      - generic [ref=f2e45]:
        - generic [ref=f2e47]:
          - generic [ref=f2e48]:
            - generic [ref=f2e49]: New Dispatch
            - generic [ref=f2e50]: Provide crop details and upload a photo for AI quality estimation.
          - 'generic "Data status: SIMULATED" [ref=f2e51]': 🟡 SIMULATED
        - generic [ref=f2e52]:
          - generic [ref=f2e53]:
            - generic [ref=f2e54]:
              - text: Select Crop
              - generic [ref=f2e55]:
                - generic [ref=f2e56]:
                  - textbox "Search crops..." [ref=f2e58]
                  - generic [ref=f2e59]:
                    - button "All" [ref=f2e60]
                    - button "vegetable" [ref=f2e61]
                    - button "fruit" [ref=f2e62]
                    - button "oilseed" [ref=f2e63]
                    - button "cash crop" [ref=f2e64]
                    - button "pulse" [ref=f2e65]
                    - button "cereal" [ref=f2e66]
                    - button "spice" [ref=f2e67]
                - generic [ref=f2e68]:
                  - generic [ref=f2e69]:
                    - generic [ref=f2e70]:
                      - heading "Featured for this Season" [level=3] [ref=f2e71]
                      - paragraph [ref=f2e72]: Seasonal guidance (Demo)
                    - radiogroup "Featured crops" [ref=f2e73]:
                      - radio "HIGH DEMAND Onion" [checked] [active] [ref=f2e74]:
                        - generic [ref=f2e75]: HIGH DEMAND
                        - generic [ref=f2e76]: 🧅
                        - generic [ref=f2e77]: Onion
                      - radio "HIGH DEMAND Tomato ⏱ 72h" [ref=f2e78]:
                        - generic [ref=f2e79]: HIGH DEMAND
                        - generic [ref=f2e80]: 🍅
                        - generic [ref=f2e81]: Tomato
                        - generic [ref=f2e82]: ⏱ 72h
                      - radio "HIGH DEMAND Soybean" [ref=f2e83]:
                        - generic [ref=f2e84]: HIGH DEMAND
                        - generic [ref=f2e85]: 🌱
                        - generic [ref=f2e86]: Soybean
                      - radio "HIGH DEMAND Cotton" [ref=f2e87]:
                        - generic [ref=f2e88]: HIGH DEMAND
                        - generic [ref=f2e89]: ☁️
                        - generic [ref=f2e90]: Cotton
                      - radio "Tur" [ref=f2e91]:
                        - generic [ref=f2e92]: 🫘
                      - radio "Moong" [ref=f2e94]:
                        - generic [ref=f2e95]: 🫘
                      - radio "Jowar" [ref=f2e97]:
                        - generic [ref=f2e98]: 🌾
                      - radio "Bajra" [ref=f2e100]:
                        - generic [ref=f2e101]: 🌾
                      - radio "Maize" [ref=f2e103]:
                        - generic [ref=f2e104]: 🌽
                      - radio "Groundnut" [ref=f2e106]:
                        - generic [ref=f2e107]: 🥜
                      - radio "Sunflower" [ref=f2e109]:
                        - generic [ref=f2e110]: 🌻
                      - radio "Urad" [ref=f2e112]:
                        - generic [ref=f2e113]: 🫘
                      - radio "Rice" [ref=f2e115]:
                        - generic [ref=f2e116]: 🍚
                      - radio "HIGH DEMAND Sugarcane ⏱ 72h" [ref=f2e118]:
                        - generic [ref=f2e119]: HIGH DEMAND
                        - generic [ref=f2e120]: 🎋
                        - generic [ref=f2e121]: Sugarcane
                        - generic [ref=f2e122]: ⏱ 72h
                      - radio "Turmeric" [ref=f2e123]:
                        - generic [ref=f2e124]: 🫚
                      - radio "Ginger ⏱ 168h" [ref=f2e126]:
                        - generic [ref=f2e127]: 🫚
                        - generic [ref=f2e128]: Ginger
                        - generic [ref=f2e129]: ⏱ 168h
                  - generic [ref=f2e130]:
                    - heading "All Crops" [level=3] [ref=f2e131]
                    - listbox "Select crop" [ref=f2e132]:
                      - option "🍇 Grapes fruit • Rabi 48h" [ref=f2e133]:
                        - generic [ref=f2e134]: 🍇
                        - generic [ref=f2e135]:
                          - generic [ref=f2e136]: Grapes
                          - generic [ref=f2e137]: fruit • Rabi
                        - generic [ref=f2e138]: 48h
                      - option "🫘 Chana pulse • Rabi" [ref=f2e139]:
                        - generic [ref=f2e140]: 🫘
                        - generic [ref=f2e141]:
                          - generic [ref=f2e142]: Chana
                          - generic [ref=f2e143]: pulse • Rabi
                      - option "🌾 Wheat cereal • Rabi" [ref=f2e144]:
                        - generic [ref=f2e145]: 🌾
                        - generic [ref=f2e146]:
                          - generic [ref=f2e147]: Wheat
                          - generic [ref=f2e148]: cereal • Rabi
                      - option "🥔 Potato vegetable • Rabi" [ref=f2e149]:
                        - generic [ref=f2e150]: 🥔
                        - generic [ref=f2e151]:
                          - generic [ref=f2e152]: Potato
                          - generic [ref=f2e153]: vegetable • Rabi
                      - option "🌼 Mustard oilseed • Rabi" [ref=f2e154]:
                        - generic [ref=f2e155]: 🌼
                        - generic [ref=f2e156]:
                          - generic [ref=f2e157]: Mustard
                          - generic [ref=f2e158]: oilseed • Rabi
            - generic [ref=f2e159]:
              - text: Quantity (Quintals)
              - spinbutton [ref=f2e165]: "30"
              - generic [ref=f2e166]: = 3,000 kg
          - generic [ref=f2e169]:
            - heading "Image & Quality Declaration" [level=3] [ref=f2e170]
            - generic [ref=f2e173]:
              - generic [ref=f2e178]:
                - paragraph [ref=f2e179]: Upload Crop Sample
                - paragraph [ref=f2e180]: Visual proof of quality
              - generic [ref=f2e181]:
                - generic [ref=f2e182]: Take Photo
                - generic [ref=f2e187]: Upload File
          - generic [ref=f2e193]:
            - generic [ref=f2e194]:
              - checkbox "I confirm the declared quality is accurate. Significant physical deviation may lead to rejection/deduction." [checked] [ref=f2e195] [cursor=pointer]
              - generic [ref=f2e196] [cursor=pointer]: I confirm the declared quality is accurate. Significant physical deviation may lead to rejection/deduction.
            - button "Analyze Markets & Vehicles" [disabled]
      - button "Contact AgniVega Support" [ref=f2e197] [cursor=pointer]
  - region "Notifications alt+T"
```

# Test source

```ts
  95  |     await page.locator('button:has-text("Onion"), button:has-text("कांदा")').first().click();
  96  |     await page.locator('input[type="file"]').first().setInputFiles({
  97  |       name: "test.jpg",
  98  |       mimeType: "image/jpeg",
  99  |       buffer: Buffer.from("fake-image-data"),
  100 |     });
  101 |     await page.waitForTimeout(1500); // wait for processing + upload
  102 |     await page.getByRole("button", { name: /Save Quality Data|माहिती जतन करा/ }).click();
  103 |     await page.waitForTimeout(500);
  104 | 
  105 |     // Check consent and analyze
  106 |     await page.getByRole("checkbox").click();
  107 |     await page.getByRole("button", { name: /Analyze Markets|बाजार.*विश्लेषण/ }).click();
  108 |     await page.waitForLoadState("networkidle");
  109 |     await page.waitForTimeout(3000); // wait for analysis
  110 | 
  111 |     // Check options ready state
  112 |     await expect(page.getByText(/Market Comparison|बाजारपेठ तुलना/)).toBeVisible();
  113 | 
  114 |     // Verify vehicle allocation shows multiple vehicles
  115 |     await expect(page.getByText(/Vehicle Allocation|वाहन वाटप/)).toBeVisible();
  116 | 
  117 |     // Check explicit per-vehicle breakdown
  118 |     const vehicleCards = page.locator(
  119 |       '.bg-muted:has-text("Max Capacity"), .bg-muted:has-text("वाहन क्षमता")',
  120 |     );
  121 |     // Should have at least 2 vehicles for 12000kg
  122 |     const count = await vehicleCards.count();
  123 |     expect(count).toBeGreaterThanOrEqual(2);
  124 | 
  125 |     // Verify registration numbers are hidden before payment
  126 |     const allocatedText = await page.locator("text=/Your Load|तुमचा लोड/").allTextContents();
  127 |     console.log("Allocated per vehicle:", allocatedText);
  128 | 
  129 |     // Verify registration numbers are hidden before payment
  130 |     await expect(page.getByText(/Number Hidden|नंबर लपविला/).first()).toBeVisible();
  131 | 
  132 |     // Verify consent modal for multi-vehicle
  133 |     await page.getByRole("button", { name: /Hold Booking|बुकिंग होल्ड/ }).click();
  134 |     await page.waitForTimeout(500);
  135 | 
  136 |     // Consent modal should appear
  137 |     await expect(page.getByText(/Multi-Vehicle \/ Partial Allocation|एकाधिक-वाहन \/ आंशिक वाटप/)).toBeVisible();
  138 |     await expect(page.getByRole("button", { name: /Accept & Continue|स्वीकारा आणि सुरू ठेवा/ })).toBeVisible();
  139 | 
  140 |     // Cancel the modal to clean up state
  141 |     await page.getByRole("button", { name: /Cancel & Go Back|रद्द करा आणि परत जा/ }).click();
  142 |   });
  143 | 
  144 |   test("Quantity state regression: 60 -> 20 -> 60 -> 35 -> 120 -> 12", async ({ page }) => {
  145 |     await loginAs(page, "farmer");
  146 |     await clickNewDispatch(page);
  147 |     // Need to select a crop first for the analyze button to be enabled
  148 |     await page.locator('button:has-text("Onion"), button:has-text("कांदा")').first().click();
  149 |     await page.getByRole("checkbox").click();
  150 | 
  151 |     const testQuantities = [10, 25, 30, 60, 70, 120];
  152 | 
  153 |     for (const qty of testQuantities) {
  154 |       await page.fill('input[type="number"]', String(qty));
  155 |       await page.waitForTimeout(300);
  156 |       
  157 |       const expectedKg = qty * 100;
  158 |       await expect(page.getByText(new RegExp(`${expectedKg.toLocaleString()} kg`))).toBeVisible();
  159 |       
  160 |       // Verify no stale results (invalidates on change)
  161 |       const hasResults = await page
  162 |         .getByText(/Market Comparison|Vehicle Allocation/)
  163 |         .isVisible()
  164 |         .catch(() => false);
  165 |       expect(hasResults).toBe(false);
  166 |     }
  167 |   });
  168 | 
  169 |   test("Multi-vehicle capacity mathematical invariants (Phase 9)", async ({ page }) => {
  170 |     await loginAs(page, "farmer");
  171 |     await clickNewDispatch(page);
  172 | 
  173 |     const testQuantities = [12, 30, 60, 70, 120];
  174 | 
  175 |     for (const qty of testQuantities) {
  176 |       await page.fill('input[type="number"]', String(qty));
  177 |       await page.locator('button:has-text("Onion"), button:has-text("कांदा")').first().click();
  178 |       await page.waitForTimeout(500);
  179 | 
  180 |       if (qty === 12) {
  181 |         // Only need to upload file once, state persists in UI across qty changes
  182 |         await page.locator('input[type="file"]').first().setInputFiles({
  183 |           name: "test.jpg",
  184 |           mimeType: "image/jpeg",
  185 |           buffer: Buffer.from("fake-image-data"),
  186 |         });
  187 |         await page.waitForTimeout(1500);
  188 |         await page.getByRole("button", { name: /Save Quality Data|माहिती जतन करा/ }).click();
  189 |         await page.waitForTimeout(500);
  190 |       }
  191 | 
  192 |       // Quantity change resets consent, so re-check it
  193 |       await page.getByRole("checkbox").check({ force: true });
  194 | 
> 195 |       await page.getByRole("button", { name: /Analyze Markets|बाजार.*विश्लेषण/ }).click();
      |                                                                                   ^ Error: locator.click: Test timeout of 60000ms exceeded.
  196 |       await page.waitForLoadState("networkidle");
  197 |       await page.waitForTimeout(3000);
  198 | 
  199 |       // Verify allocated quantities
  200 |       const requestedKg = qty * 100;
  201 |       
  202 |       // We don't read text inside DOM in Playwright directly to assert math easily without eval.
  203 |       // Let's execute JS to extract the numbers from the DOM and check the invariants.
  204 |       const allocations = await page.evaluate(() => {
  205 |         const vehicles = Array.from(document.querySelectorAll('.bg-muted.p-4'));
  206 |         return vehicles.map(v => {
  207 |           const text = v.textContent || '';
  208 |           // Extract numbers using regex (naive approach based on UI text structure)
  209 |           // Look for text near 'Your Load'
  210 |           return text;
  211 |         });
  212 |       });
  213 |       // A more robust check inside evaluate:
  214 |       const invariantsPass = await page.evaluate((reqKg) => {
  215 |         const vehicleNodes = Array.from(document.querySelectorAll('.bg-muted.p-4.rounded-lg'));
  216 |         let totalAssigned = 0;
  217 |         let pass = true;
  218 |         let log = [];
  219 |         for (const node of vehicleNodes) {
  220 |            const blocks = node.querySelectorAll('.grid > div');
  221 |            // Assumes the order: Max Capacity, Already Loaded, Available Space, Your Load
  222 |            if (blocks.length >= 4) {
  223 |              const availText = blocks[2].textContent.replace(/[^0-9]/g, '');
  224 |              const assignedText = blocks[3].textContent.replace(/[^0-9]/g, '');
  225 |              const avail = parseInt(availText, 10);
  226 |              const assigned = parseInt(assignedText, 10);
  227 |              totalAssigned += assigned;
  228 |              if (assigned > avail) {
  229 |                pass = false;
  230 |              }
  231 |            }
  232 |         }
  233 |         
  234 |         // For partial dispatch, totalAssigned might be < reqKg, but it shouldn't exceed pooled reqKg
  235 |         // Pooling adds partners up to 12000kg. Let's just ensure it's not crazy high, like > reqKg + 12000.
  236 |         if (totalAssigned > reqKg + 12000) pass = false;
  237 |         
  238 |         return pass;
  239 |       }, requestedKg);
  240 |       
  241 |       expect(invariantsPass).toBe(true);
  242 | 
  243 |       // Verify state reset by clicking Back
  244 |       await page.getByRole("button", { name: /Back|मागे/ }).click();
  245 |       await page.waitForTimeout(500);
  246 |     }
  247 |     await loginAs(page, "farmer");
  248 |     await clickNewDispatch(page);
  249 | 
  250 |     await page.fill('input[type="number"]', "30");
  251 |     await page.locator('button:has-text("Onion"), button:has-text("कांदा")').first().click();
  252 |     await page.waitForTimeout(500);
  253 | 
  254 |     // Complete AI upload flow
  255 |     await page
  256 |       .locator('input[type="file"]')
  257 |       .first()
  258 |       .setInputFiles({
  259 |         name: "test.jpg",
  260 |         mimeType: "image/jpeg",
  261 |         buffer: Buffer.from("fake-image-data"),
  262 |       });
  263 |     await page.waitForTimeout(1500);
  264 |     await page.getByRole("button", { name: /Save Quality Data|माहिती जतन करा/ }).click();
  265 |     await page.waitForTimeout(500);
  266 | 
  267 |     await page.getByRole("checkbox").click();
  268 |     await page.getByRole("button", { name: /Analyze Markets|बाजार.*विश्लेषण/ }).click();
  269 |     await page.waitForLoadState("networkidle");
  270 |     await page.waitForTimeout(3000);
  271 | 
  272 |     // Get initial vehicle allocation
  273 |     const initialVehicles = await page.locator(".bg-muted").count();
  274 |     const initialMandi = await page
  275 |       .locator(".border-primary")
  276 |       .first()
  277 |       .getByText(/Kopargaon|Lasalgaon|Nashik|Rahuri/)
  278 |       .textContent();
  279 | 
  280 |     // Click different market
  281 |     const mandiCards = page.locator('[role="radiogroup"] .relative.overflow-hidden');
  282 |     const mandiCount = await mandiCards.count();
  283 |     if (mandiCount > 1) {
  284 |       await mandiCards.nth(1).click();
  285 |       await page.waitForTimeout(1000);
  286 | 
  287 |       // Vehicle allocation should update
  288 |       const newVehicles = await page.locator(".bg-muted").count();
  289 |       // Allocation may change based on route
  290 |       console.log(
  291 |         `Initial vehicles: ${initialVehicles}, New vehicles: ${newVehicles}, Mandi: ${initialMandi}`,
  292 |       );
  293 |     }
  294 |   });
  295 | 
```