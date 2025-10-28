# Relationship "Other" Option - Custom Input Feature

## Overview
Added functionality to allow users to specify a custom relationship when "Other" is selected from the Relationship dropdown in the PCR form.

## Feature Description

When a user selects "Other" from the Relationship dropdown, a text input field automatically appears below, allowing them to type a custom relationship that isn't in the predefined list.

## Implementation

### 1. Added New Form Field
```javascript
const initialFormData = {
  // ... other fields
  relationship: "",
  relationshipOther: "",  // NEW: Stores custom relationship text
  // ... other fields
};
```

### 2. Conditional Text Input in Form
```jsx
<select name="relationship" value={formData.relationship} onChange={handleChange}>
  <option value="">Select Relationship</option>
  <option value="Spouse">Spouse</option>
  <!-- ... other options ... -->
  <option value="Other">Other</option>
</select>

{/* Conditional text input - only shows when "Other" is selected */}
{formData.relationship === "Other" && (
  <input
    type="text"
    name="relationshipOther"
    value={formData.relationshipOther}
    onChange={handleChange}
    placeholder="Please specify relationship"
    className="mt-2 block w-full border-2 border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all px-3 py-2"
    disabled={isSubmitting || readOnly}
  />
)}
```

### 3. Display Logic in View/Print Components
```javascript
// Display format: "Other (Custom Text)"
{fullForm.relationship === "Other" && fullForm.relationshipOther 
  ? `Other (${fullForm.relationshipOther})` 
  : fullForm.relationship || "N/A"}
```

## User Experience Flow

### Step 1: Initial State
```
Relationship: [Select Relationship ▼]
```

### Step 2: User Selects "Other"
```
Relationship: [Other ▼]
              [Please specify relationship        ]  ← Text input appears
```

### Step 3: User Types Custom Relationship
```
Relationship: [Other ▼]
              [Step-father                        ]
```

### Step 4: Saved Data
```json
{
  "relationship": "Other",
  "relationshipOther": "Step-father"
}
```

### Step 5: Display in View/Print
```
Relationship: Other (Step-father)
```

## Use Cases

### Common Custom Relationships
Users can now specify relationships not in the predefined list:

1. **Step-family**
   - Step-father
   - Step-mother
   - Step-brother
   - Step-sister

2. **Foster/Adopted**
   - Foster parent
   - Foster child
   - Adoptive parent
   - Adoptive child

3. **In-laws**
   - Mother-in-law
   - Father-in-law
   - Brother-in-law
   - Sister-in-law

4. **Professional**
   - Social worker
   - Case manager
   - Legal representative
   - Healthcare proxy

5. **Extended/Complex**
   - Godparent
   - Half-brother
   - Half-sister
   - Great-grandparent

6. **Other**
   - Roommate
   - Co-worker
   - Landlord
   - Any other relationship

## Data Storage

### Database Structure
```json
{
  "full_form": {
    "contactPerson": "Maria Santos",
    "relationship": "Other",
    "relationshipOther": "Step-father",
    "contactNumber": "09123456789"
  }
}
```

### Display Format
- **In Form**: Dropdown shows "Other", text field shows "Step-father"
- **In View**: Shows "Other (Step-father)"
- **In Print**: Shows "Other (Step-father)"
- **In Export**: Shows "Other (Step-father)"

## Benefits

### 1. Flexibility
✅ Accommodates any relationship type
✅ No limitation to predefined list
✅ Handles unique or complex relationships

### 2. Data Quality
✅ Still maintains structure (relationship type + custom text)
✅ Easy to identify custom relationships (all marked as "Other")
✅ Preserves user's exact wording

### 3. User Experience
✅ Intuitive - field appears only when needed
✅ Clear placeholder text guides user
✅ Seamless integration with existing form

### 4. Backward Compatibility
✅ Works with existing data
✅ Doesn't break old records
✅ Gracefully handles missing relationshipOther field

## Validation

### Current Behavior
- No validation required - both fields are optional
- If "Other" is selected but relationshipOther is empty, displays as "Other"
- If relationshipOther has value but relationship is not "Other", relationshipOther is ignored

### Possible Future Validation
```javascript
// Warn if "Other" is selected but no custom text provided
if (formData.relationship === "Other" && !formData.relationshipOther) {
  warning = "Please specify the relationship";
}

// Clear relationshipOther if relationship changes from "Other"
if (name === "relationship" && value !== "Other") {
  setFormData(prev => ({ ...prev, relationship: value, relationshipOther: "" }));
}
```

## Testing Scenarios

### Test 1: Select Other and Type Custom
1. Select "Other" from dropdown
2. Text field appears
3. Type "Step-father"
4. Submit form
5. **Expected**: Saves both values
6. **Result**: ✅ Pass

### Test 2: Select Other, Leave Empty
1. Select "Other" from dropdown
2. Text field appears
3. Leave empty
4. Submit form
5. **Expected**: Saves relationship as "Other", relationshipOther as ""
6. **Result**: ✅ Pass

### Test 3: Change from Other to Standard
1. Select "Other", type "Step-father"
2. Change dropdown to "Mother"
3. **Expected**: Text field disappears, relationshipOther value remains in state
4. **Result**: ✅ Pass

### Test 4: View Existing PCR with Other
1. Open PCR with relationship="Other" and relationshipOther="Step-father"
2. **Expected**: Displays "Other (Step-father)"
3. **Result**: ✅ Pass

### Test 5: Edit Existing PCR with Other
1. Open PCR with relationship="Other" and relationshipOther="Step-father"
2. Dropdown shows "Other" selected
3. Text field shows "Step-father"
4. Can edit both fields
5. **Expected**: Works correctly
6. **Result**: ✅ Pass

### Test 6: Print PCR with Other
1. Create PCR with relationship="Other" and relationshipOther="Foster parent"
2. Print PCR
3. **Expected**: Shows "Other (Foster parent)" in printed document
4. **Result**: ✅ Pass

## Files Modified

### 1. PCRForm.js
- Added `relationshipOther` to initialFormData
- Added conditional text input that appears when "Other" is selected
- Input has placeholder "Please specify relationship"

### 2. PCRView.js
- Updated display logic to show "Other (Custom Text)" format
- Handles cases where relationshipOther is empty

### 3. PCRPrint.js
- Updated both text export and print view
- Shows "Other (Custom Text)" format in both versions

## Display Examples

### Example 1: Standard Relationship
```
Contact Person:
  Name: Juan Dela Cruz
  Relationship: Spouse
  Contact Number: 09123456789
```

### Example 2: Custom Relationship
```
Contact Person:
  Name: Maria Santos
  Relationship: Other (Step-father)
  Contact Number: 09987654321
```

### Example 3: Other Without Custom Text
```
Contact Person:
  Name: Pedro Reyes
  Relationship: Other
  Contact Number: 09111222333
```

## Analytics Considerations

### Reporting
When generating reports or analytics:
- Can filter for all "Other" relationships
- Can analyze custom relationship text for patterns
- May want to periodically review "Other" entries to add new predefined options

### Example Query
```sql
-- Find all custom relationships
SELECT 
  full_form->>'relationshipOther' as custom_relationship,
  COUNT(*) as count
FROM pcr_forms
WHERE full_form->>'relationship' = 'Other'
  AND full_form->>'relationshipOther' IS NOT NULL
  AND full_form->>'relationshipOther' != ''
GROUP BY full_form->>'relationshipOther'
ORDER BY count DESC;
```

This helps identify common custom relationships that might be added to the predefined list.
