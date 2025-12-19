# Debug: Why Rajkumar Lawaniya Appears in Civil Table

## Issue
Shri Rajkumar Lawaniya (Sanitation officer) is showing in the Civil Officers table with 19 complaints.

## Officer Mappings
Rajkumar Lawaniya is mapped as **Sanitation** officer for these wards:
- 05-Bharatpur Gate
- 18-General ganj
- 35-Bankhandi
- 42-Manoharpur
- 49-Daimpiriyal Nagar
- 56-Mandi Randas
- 58-Gau Ghat
- 61-Chaubia para
- 64-Ghati Bahalray
- 65-Holi Gali

## Civil Officers for Same Wards
- 05-Bharatpur Gate → Shri Imran Habib Ansari
- 18-General ganj → Shri Umesh Kumar
- 35-Bankhandi → Shri Imran Habib Ansari
- 42-Manoharpur → Shri Imran Habib Ansari
- 49-Daimpiriyal Nagar → Shri Imran Habib Ansari
- 56-Mandi Randas → Shri Vibhor Vishwakarma
- 58-Gau Ghat → Shri Vibhor Vishwakarma
- 61-Chaubia para → Shri Imran Habib Ansari
- 64-Ghati Bahalray → Shri Imran Habib Ansari
- 65-Holi Gali → Shri Imran Habib Ansari

## Debugging Steps

### Step 1: Add Console Logging
Add this code to `DepartmentReportsPage.tsx` after line 218 to see which complaints are being assigned:

```typescript
// Debug: Log Rajkumar Lawaniya assignments
const civilOfficers = getOfficersByDepartment('Civil');
const lawaniyaCivil = civilOfficers.find(o => o.officer.includes('Lawaniya'));
if (lawaniyaCivil) {
    console.log('🔴 Lawaniya found in Civil officers:', lawaniyaCivil);
    // Log the actual complaints
    const lawaniyaComplaints = filteredData.filter(c => 
        c.assignedOfficer?.includes('Lawaniya') && 
        ['Potholes', 'Unpaved road', 'Broken Footpath', 'Footpath/Pavement Required', 'Barren Land to be Greened']
            .some(t => (c['complaintsubtype'] || '').includes(t))
    );
    console.log('🔴 Civil-type complaints assigned to Lawaniya:', lawaniyaComplaints);
}
```

### Step 2: Check Complaint Data
The 19 complaints showing for Lawaniya in Civil table likely have:
- **Complaint Type**: One of the Civil types (Potholes, Unpaved road, etc.)
- **Ward**: One of Lawaniya's wards (05, 18, 35, 42, 49, 56, 58, 61, 64, 65)
- **Assigned Officer**: Incorrectly set to "Shri Rajkumar Lawaniya"

### Step 3: Check findOfficer() Logic
The issue is likely in `officerMappings.ts` lines 224-275. The function should:
1. Determine department from complaint type
2. Find officer for that ward in that department
3. Return the correct officer

**Hypothesis**: The `findOfficer()` function is returning Lawaniya for Civil complaints when it should return the Civil officer.

## Solution Options

### Option 1: Fix findOfficer() Function
Ensure that when a Civil-type complaint comes in for a ward, it ALWAYS returns the Civil officer, not the Sanitation officer.

### Option 2: Add Validation
Add a check in `dataProcessor.ts` to ensure the assigned officer's department matches the complaint's department:

```typescript
const officer = findOfficer(
    record['Zone'] || '',
    record['Ward'] || '',
    record['complaintsubtype'] || ''
);
if (officer) {
    const expectedDept = getDepartmentFromComplaintType(record['complaintsubtype'] || '');
    if (officer.department === expectedDept) {
        record.assignedOfficer = officer.officer;
        record.assignedSupervisor = normalizeSupervisorName(officer.supervisor);
    } else {
        console.warn('Department mismatch:', {
            complaint: record['compId'],
            expectedDept,
            foundDept: officer.department,
            officer: officer.officer
        });
    }
}
```

### Option 3: Filter by Department in Report
Modify `getOfficersByDepartment()` to ONLY include officers whose assigned complaints match the department filter.

## Next Steps
1. Upload your complaint CSV file to check the actual data
2. Add the debug logging to see which complaints are being assigned
3. Implement the validation fix to prevent cross-department assignment
