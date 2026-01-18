# Scholarship System Frontend Integration Guide

This document outlines the necessary changes and implementation details for the **Admin Frontend** and **Client Frontend** to integrate the refactored Scholarship System.

## 1. Backend API Changes Summary

The Scholarship entity has been completely refactored to support complex, rule-based logic and rich content, including "Level-based" amounts and granular eligibility rules.

### Key Conceptual Changes
- **Complex Rules (JSONB):** Instead of flat fields, we now use structured JSON objects for:
  - **`levels`**: Defines multiple tiers (e.g., Gold: $5k, Silver: $2k) based on GPA.
  - **`eligibility`**: Rules for Nationalities, Program Levels, and Student Types (Freshman vs Transfer).
  - **`renewalConditions`**: Rules for maintaining the scholarship (e.g., maintain 3.0 GPA).
- **Textual Amounts:** The `amount` field is now a string to support ranges (e.g., "$2,000 - $5,000") or specifics like "Full Tuition".
- **Many-to-Many Programs:** A scholarship can now apply to **multiple** specific programs via `programIds`.

### New Data Model Fields
- **`title`**: Scholarship Name (replaces `name`).
- **`institutionName`**: Name of the University/Provider.
- **`sourceUrl`**: Link to the official source.
- **`isAutoApplied`**: Boolean indicating if no separate application is needed.
- **`levels`** (Array): `{ name: string, value: string, minGpa: number }`.
- **`eligibility`** (Object): `{ nationalities: string[], programLevels: string[], studentTypes: string[] }`.
- **`renewalConditions`** (Object): `{ duration: string, minGpa: number, minCredits: number }`.

---

## 2. Admin Frontend Implementation

### Objective
Update the Scholarship Management interface to support the new "Rule-Builder" style forms.

### Tasks

#### A. Create/Edit Scholarship Form (Complex)
1.  **Basic Info:**
    -   Inputs for `title`, `description` (Markdown editor recommended), `institutionName`, `sourceUrl`.
    -   `amount` (Text input), `currency` (Text input), `isAutoApplied` (Toggle).
2.  **University & Program Linking:**
    -   **University:** Single Select.
    -   **Programs:** Multi-Select (pass `programIds` array).
3.  **Levels Builder (Dynamic List):**
    -   Allow adding multiple levels.
    -   Fields per level: `Name` (e.g., "Presidential"), `Value` (e.g., "$10,000"), `Min GPA`.
4.  **Eligibility Rules (Grouped Inputs):**
    -   **Nationalities:** Multi-select country picker.
    -   **Student Type:** Multi-select (Enum: `Freshman`, `Transfer`, `Graduate`).
    -   **Program Levels:** Multi-select (Enum: `Bachelor`, `Master`).
5.  **Renewal Conditions:**
    -   Inputs for `Duration` (text), `Min GPA` (number), `Min Credits` (number).

#### B. API Payload (Create/Update)
```json
{
  "title": "International Excellence Award",
  "description": "A prestigious award...",
  "institutionName": "Harvard University",
  "universityId": "uuid...",
  "programIds": ["uuid-1...", "uuid-2..."], 
  "amount": "$5,000 - $10,000",
  "currency": "USD",
  "isAutoApplied": false,
  "levels": [
    { "name": "Gold", "value": "$10,000", "minGpa": 3.8 },
    { "name": "Silver", "value": "$5,000", "minGpa": 3.5 }
  ],
  "eligibility": {
    "nationalities": ["UZ", "CN"],
    "studentTypes": ["Freshman"],
    "programLevels": ["Bachelor"]
  },
  "renewalConditions": {
    "duration": "4 years",
    "minGpa": 3.0,
    "minCredits": 30
  }
}
```

---

## 3. Client Frontend Implementation

### Objective
Implement a smart matching engine and detailed view for students.

### Tasks

#### A. Smart Matching (New Endpoint)
Use the new **Match Endpoint** to find scholarships relevant to the user.

- **Endpoint:** `POST /scholarships/match`
- **Payload:**
  ```json
  {
    "gpa": 3.6,
    "nationality": "UZ",
    "studentType": "Freshman"
  }
  ```
- **Response:** List of `ScholarshipResponseDto` that match the criteria.
- **Usage:** Call this when a student visits the "Scholarships" tab to show "Recommended for You".

#### B. Scholarship Detail Page
Render the complex objects clearly:
1.  **Hero Section:** Title, Institution name, Amount Range.
2.  **Levels Table:** If `levels` exist, show a table: | Level Name | GPA Req | Amount |.
3.  **Eligibility Sidebar:**
    -   "Who can apply?": List nationalities and student types.
4.  **Renewal Info:** "To keep this scholarship: Maintain [minGpa] GPA for [duration]".
5.  **CTA:** If `sourceUrl` exists, button "Visit Official Site".

#### C. Filtering
-   **Endpoint:** `GET /scholarships` (Standard list)
-   **Query Params:** `universityId` and `programId`.
-   *Note:* Client-side filtering might be needed for deep JSON fields if not using the Match endpoint.

---

## 4. API Reference Updates

### Response Object (`ScholarshipResponseDto`)
```json
{
  "id": "uuid...",
  "title": "...",
  "description": "...",
  "institutionName": "...",
  "sourceUrl": "...",
  "amount": "$2,000",
  "levels": [...], // Array of objects
  "eligibility": { ... }, // Object
  "renewalConditions": { ... }, // Object
  "lastUpdated": "2026-01-18T..."
}
```


