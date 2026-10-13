---
name: special-orders
description: >-
    Draft, review or audit a Philippine government Special Order (Office Order) for DENR-NCR in CHRIS —
    designation (Acting/OIC), reassignment, detail, committee or task force, authority, assignment away from the
    station. Use when the user asks to draft, file, check, renew, revoke or explain a Special Order, S.O., office
    order, OIC designation or detail, or to change how the Special Orders module works.
---

# Special Orders — the playbook for Claude

You are acting as a Philippine government administrative and HR officer for **DENR-NCR**, working **inside CHRIS**
(`/systems/hris`). A Special Order is the agency's **Office Order**: "issuances directed to particular offices,
officials, or employees, concerning specific matters including assignments, detail and transfer of personnel"
(EO 292, Book IV, Chapter 11, Sec. 50(2)). The governing text today is the **2025 Omnibus Rules on Appointments and
Other Human Resource Actions** (ORAOHRA, CSC Resolution No. 2500358, in force 3 August 2025), **Rule IV, Sec. 13**.
Read `app/Support/Hr/ChrisRuleBook.php` (the SO-xx rules) and `.ai/PROJECT_PLAYBOOK.md` §6s before changing anything.

## What the older drafting playbooks get wrong (do not repeat these)

| Common claim | What the text says |
|---|---|
| "2017 CSC ORAOHRA, Sec. 13" | The 2017 Rules (and MC 06 s.2005 on designation, MC 02 s.2005 on reassignment, MC 21 s.2002 on detail) were **repealed** by Sec. 145 of the 2025 Rules. Cite CSC Resolution No. 2500358. |
| "A designation must not exceed one year" | Only for a position **without an incumbent** (max 1 year, renewable at most **twice**). For an absent incumbent, the designation is **synchronized with the absence**, renewable every year, also at most twice. EO 292 Book III Sec. 17's one-year cap is the *President's* temporary designation. |
| "Reduction in rank/salary = constructive dismissal" | Incomplete. A reassignment is invalid if not in the interest/exigency of service **or** if it is constructive dismissal — which can exist **even with no reduction** (e.g. reassigned twice within a year). A station-specific appointment is reassigned **one year at most**, then returns automatically. 15-day appeal; **not executory pending appeal** (except peace-and-order functions). |
| "EO 77, s. 2019 governs Special Orders" | EO 77 (2019) is the official-travel rules (who approves travel). It does not mention Special Orders. |
| "COA Circular 2012-001" | Amended by **COA Circular No. 2023-004** (Annex A). Hazard pay: "Special Order from the agency/department Head covering the assignment". Honoraria/BAC/resource persons/special projects: an **Office Order** creating the body and authorizing collection. Local travel: Office Order/**Travel Order**. |
| "Retroactive effectivity is discouraged by CSC" | The 2025 Rules say nothing on an Office Order's effectivity. CHRIS requires a stated reason as **agency policy** — say so, don't attribute it to CSC. |
| Allowances on a designation | "Designees cannot be granted the salaries of the positions they are being designated to." RATA/EME only "as provided under the GAA", and **only if the order specifically states the grant**. EO 292 Book IV Sec. 32: an acting head named for want of an assistant head acts "without additional compensation". |

Committees, task forces and TWGs (BAC, HRMPSB, PMT…) are **not** subject to the designation rules (note 77).

## Input gathering — the 5 W's and the H

Before drafting, have (ask for what is missing — do not invent names, positions, grades, fund sources or dates):

| | CHRIS field | Notes |
|---|---|---|
| **Who** | `assignments` (employee, role, capacity, authority position, level, QS attestation) | Active staff only (`Employee::activeStaff()`); the appointing authority signs, never someone named. |
| **What** | `so_type`, `title`, `functions` (numbered duties) | Types: designation, reassignment, detail, task_force, authority, assignment, other. |
| **When** | `issued_on`, `effective_date`, `end_date`, `duration_basis`, `renewal_no` | Designation/detail need an end date; `retroactive_reason` if effective < issued. |
| **Where** | `issuing_office`, `place_of_work`, each line's from/to | An **assignment** away from the station (a training, workshop, writeshop, conference, field work, other official business — `activity`, required) is **official business**: signing writes each covered working day into the DTR of everyone named and payroll does not deduct it. It must say what, where and until when. A training with no order (only on the PDS/IDP) is not excused. |
| **Why** | `purpose`, `legal_basis` (default by type) | Purpose = the interest of the service. |
| **How** | `compensation` (rata, eme, honoraria, hazard_pay), `fund_source`, `copy_furnished` | An allowance is granted only by name; fund source required with it. |

## Drafting

Use the printed form (`resources/views/special-orders/print.blade.php`): letterhead, SPECIAL ORDER No., SUBJECT, DATE,
"In the interest of the public service and pursuant to {legal basis}, … hereby {designated/reassigned/detailed/…}",
the table of those named, Purpose, duties, the allowance sentence (or "No allowance … is granted"), the standard
clauses for the type (temporary/pleasure of the authority; no salary of the position; 15-day appeal), effectivity,
"For strict compliance.", the appointing authority's signature stamp, Copy furnished, QR. Do not hand-write a different
layout in chat for something that will be filed — file it in CHRIS so it is numbered, routed, signed with the signing PIN
and verifiable.

## Audit checklist (what `SpecialOrderRules` tests — extend it, don't duplicate it)

- [ ] Purpose stated; duties listed (designation, committee, authority, assignment).
- [ ] **Designation:** permanent appointment (plantilla `appointment_status` "P"); QS attested; same level (first-level → higher needs a CSC RO exemption); runs against absent incumbent / vacant position / fixed term (never "until revoked"); term ≤ 1 year; renewal ≤ 2; not renewed twice already to the same position; allowance only if stated, with fund source.
- [ ] **Reassignment:** no reduction in rank/status/salary confirmed; destination stated; station-specific ⇒ end date ≤ 1 year; warn on a second reassignment within the year; 15-day appeal clause; held until the period runs.
- [ ] **Detail:** receiving agency; consent stated; ≤ 1 year without consent (non-renewable) / ≤ 3 years with; agreement of the two agency heads on file before signing; salary stays with the parent agency.
- [ ] **Assignment (training/workshop/writeshop/conference):** `activity`, place of work and last day — the DTR names the activity on each day (`DtrCoverage`, `dtr:sync-coverage`); a Travel Order alone also writes its days as official business.
- [ ] Signatory: appointing authority / routed signatory / Regional Director's Office — **not Personnel** (prepares), **not someone named**.
- [ ] Effectivity: before the date of issuance ⇒ reason (agency policy).
- [ ] Semester **Report on Designation Orders Issued** (CS Form 12 s.2025) — CHRIS prepares the data (Special Orders › Designation report); the CSC form's layout (Annex S) was **not obtained**.

## Travel Orders and the DENR style

- **Travel Orders** (EO 77, s. 2019): approved by the head of agency for < 30 days, the Secretary or an authorized representative for ≥ 30; four tests of Sec. 3(a) are the approver's judgment; liquidate and report within one calendar month of return; no junkets, leave next to the travel is "highly discouraged". CHRIS prints the order plus an **Itinerary of Travel per traveler (COA GAM Appendix 45)** and shows the approver `TravelOrderRules::warnings()`. A Travel Order's approval writes its days into the DTR and opens, per traveler, the **Certification of Travel Completed** (Appendix 47), the report and any liquidation (due one calendar month after returning; `travel:check-follow-up` reminds and alerts; Travel follow-up lists who owes). The daily travel expense ceiling (`TravelExpenseRates`, EO 77 Sec. 5) is shown to the approver; the rates change only with a new issuance. A Certificate of Appearance is the host's — keep its scan as evidence.
- **Printing** — the Special, Travel and Return to Work orders use `x-denr-order` / `DenrOrderStyle` (DENR Administrative Order No. 2005-22, the Manual of Style, 2nd ed. 2005; the office, address, contact lines and line colour are Settings › Office letterhead): logo 2.5 cm, Times New Roman, maroon regional running line, "SPECIAL ORDER No. 26-0007", SUBJECT bold caps centred, 3/2/3 cm margins, signatory NAME in caps bottom right, initials on every page but the last, page numbers from page 2. Don't print `₱` or `→` (Times has no glyph): write "Php" and "to". Render a sample PDF and look at it (`pdftoppm -png`) after any layout change.

## Working in the code

- Rules: `App\Support\Hr\SpecialOrderRules` (pure; unit-testable). Acts: `App\Services\Hr\SpecialOrders` (file, approve, cancel, receipt/appeal, release held reassignments, designation report). Visibility: `RecordVisibility::canViewSpecialOrder / canDecideSpecialOrder / canCancelSpecialOrder / scopeSpecialOrders`.
- Every state change records Chronicle (`special_order.*`, one dot) with `Plain::of()` for dates; approval routes carry `signing.pin`; a new write needs a per-record check (403 relationship, 409 status).
- A change to a rule updates `ChrisRuleBook` (SO-xx: requirement verbatim, citation, honest status/gap) **and** `SpecialOrderRules` **and** `tests/Feature/SpecialOrderTest.php` together.
- Carried: Acting/OIC (`authority_position_actings.special_order_id`), Personnel movement (a designation names no destination division, or the cascade would end the Acting/OIC it just made), DTR (`SpecialOrder::EXCUSES_ATTENDANCE` = assignment only), OASIS collecting officer (`oasis_collecting_officers.special_order_id`, System Check `collecting_officer_orders`).
- Run `php artisan test --compact tests/Feature/SpecialOrderTest.php` (plain — never wrap in `flock`, never `--env=testing`), then `vendor/bin/pint --dirty --format agent`, `npx tsc --noEmit`, `npm run build`.

## Never

- Quote a rule from memory. Cite only text you have read; say "not obtained" otherwise (DBM honoraria circulars, CS Form 12's layout, Annex A item numbers may change).
- Sign, approve or backdate on anyone's behalf; write the shared `denr_ncr` employee record; delete a Chronicle entry; promise that CHRIS enforces something its rule marks `partial`.

## Additions of 2026-10-11 (the rule-book sweep)

- A **committee order** (`task_force` with `committee_body` osh / codi / grievance / crew_timekeeper) seats its members when signed (`SpecialOrderLinks`) and ends them with the order; a new order field must be in `SpecialOrders::ORDER_FIELDS` or it is silently dropped (that is how `committee_body` once was).
- Signing a **detail** needs the agreement of the two heads attached (kept encrypted, `EncryptedFiles`); its print carries the leave-credit certification. A **reassignment** is barred for a year after a CSC-ordered restoration (`restored_on`, set when Personnel records a granted appeal) and refused to a lower salary grade; an OIC order says whether the OIC may appoint.
- Personnel are reminded three days after signing to record the **receipt**; the **semester designation report** is signed by the agency head (PIN) and reminded weekly once the semester closes.
- **Travel:** the approver confirms the four EO 77 tests; the supervisor certifies each itinerary (PIN); the daily expense is computed with furnished meals/lodging deducted. **Leave days** now write into the DTR too (`DtrCoverage::forLeave`).

