# Scholarship System Frontend Integration Guide

This document outlines the necessary changes and implementation details for the **Admin Frontend** and **Client Frontend** to integrate the refactored Scholarship System.

## 1. Backend API Changes Summary

The Scholarship entity has been significantly enhanced to support more structured data, effectively mirroring platforms like ApplyBoard.

### Key Changes
- **New Fields:**
  - `type`: Enum (`MERIT`, `ENTRANCE`, `ATHLETIC`, `COMMUNITY`, `OTHER`).
  - `deadline`: Date (ISO 8601 string).
  - `minGpa`: Number (Float).
  - `eligibleNationalities`: Array of strings (Country codes, e.g., `['UZ', 'US']`).
  - `studyLevels`: Array of enums (`BACHELOR`, `MASTER`, `PHD`, `LANGUAGE_COURSE`, `FOUNDATION`).
- **Logic Updates:**
  - `programId` is now **optional**. You can create scholarships linked directly to a University without a specific Program (University-wide scholarships).
  - Unique constraint on `[universityId, programId]` has been **removed**. Multiple scholarships can now exist for the same university/program scope.

### Enums
Ensure your frontend applications have matching enums/constants for:

**ScholarshipType:**
- `MERIT`
- `ENTRANCE`
- `ATHLETIC`
- `COMMUNITY`
- `OTHER`

**StudyLevel:**
- `BACHELOR`
- `MASTER`
- `PHD`
- `LANGUAGE_COURSE`
- `FOUNDATION`

---

## 2. Admin Frontend Implementation

### Objective
Update the Scholarship Management interface to allow creating and editing the new sophisticated scholarship structures.

### Tasks

#### A. Update Scholarship Forms (Create & Edit)
1.  **Type Selection:**
    -   Add a dropdown/select for `type`.
    -   *Default:* `OTHER` or empty.
2.  **Deadline Picker:**
    -   Add a date picker for `deadline`.
3.  **Academic Requirements:**
    -   Add a number input for `minGpa`.
    -   Add a multi-select dropdown for `studyLevels`.
4.  **Nationality Eligibility:**
    -   Add a multi-select component for `eligibleNationalities` (fetching the list of Countries from your system).
5.  **Program Selection (Optionality):**
    -   Make the "Program" field **optional**.
    -   Add a clear visual indication (e.g., "Leave empty for University-wide Scholarship").
6.  **Constraint Removal:**
    -   Remove any frontend validation preventing creating a second scholarship for the same University/Program pair.

#### B. Update Scholarship List/Table
1.  **Columns:** Add new columns for `Type`, `Deadline`, and `Amount`.
2.  **Filtering:** Allow admins to filter scholarships by `Type` and `University`.

---

## 3. Client Frontend Implementation

### Objective
Enhance the student experience by allowing them to find scholarships they are actually eligible for and view detailed requirements.

### Tasks

#### A. Scholarship Discovery (Search & Filter)
1.  **New Filters:**
    -   **Scholarship Type:** Allow students to filter by Merit, Athletic, etc.
    -   **Study Level:** Filter based on what they want to study (e.g., only show Bachelor scholarships).
    -   **GPA:** (Optional) "Show scholarships matching my GPA".
2.  **Display Cards:**
    -   Show tags for `type` (e.g., a "Merit" badge).
    -   Show the `deadline` clearly (e.g., "Expires in 10 days").

#### B. Scholarship Details Page
1.  **Requirements Section:**
    -   Display `minGpa` if set.
    -   List `eligibleNationalities` if restricted.
    -   Show flexible `studyLevels`.
2.  **General Info:**
    -   Show whether it is "University-wide" or specific to a "Program".

#### C. Student Profile Matching (Advanced)
1.  **Eligibility Check:**
    -   On the scholarship detail page, compare the student's profile (GPA, Nationality, desired Degree) against the scholarship's `minGpa`, `eligibleNationalities`, and `studyLevels`.
    -   *Visuals:* Show a "You are eligible!" checkmark or a "Requirements not met" warning.

### API Reference (DTOs)

**CreateScholarshipDto / UpdateScholarshipDto Payload:**
```json
{
  "name": "Merit Excellence Award",
  "universityId": "uuid...",
  "programId": "uuid..." | null,  // Now optional
  "type": "MERIT",
  "deadline": "2026-12-31T23:59:59Z",
  "minGpa": 3.5,
  "eligibleNationalities": ["UZ", "KZ"],
  "studyLevels": ["BACHELOR"],
  "amount": 5000,
  "requirements": ["Essay required"] // Legacy unstructured requirements still supported
}
```


