# Relationship Field - Dropdown Implementation

## Overview
Changed the "Relationship" field in the PCR form from a free-text input to a dropdown select with predefined relationship options for better data consistency and user experience.

## Change Summary

### Before
```jsx
<input
  type="text"
  name="relationship"
  value={formData.relationship}
  onChange={handleChange}
  className="..."
  disabled={isSubmitting || readOnly}
/>
```

### After
```jsx
<select
  name="relationship"
  value={formData.relationship}
  onChange={handleChange}
  className="..."
  disabled={isSubmitting || readOnly}
>
  <option value="">Select Relationship</option>
  <option value="Spouse">Spouse</option>
  <option value="Mother">Mother</option>
  <option value="Father">Father</option>
  <!-- ... more options ... -->
</select>
```

## Available Relationship Options

The dropdown includes the following relationship options:

### Immediate Family
1. **Spouse** - Husband or Wife
2. **Mother** - Mother
3. **Father** - Father
4. **Son** - Male child
5. **Daughter** - Female child
6. **Brother** - Male sibling
7. **Sister** - Female sibling
8. **Sibling** - Gender-neutral sibling option

### Extended Family
9. **Grandmother** - Maternal or paternal grandmother
10. **Grandfather** - Maternal or paternal grandfather
11. **Aunt** - Parent's sister or uncle's wife
12. **Uncle** - Parent's brother or aunt's husband
13. **Cousin** - Child of aunt or uncle
14. **Nephew** - Brother's or sister's son
15. **Niece** - Brother's or sister's daughter

### Non-Family
16. **Friend** - Personal friend
17. **Neighbor** - Person living nearby
18. **Guardian** - Legal guardian
19. **Caregiver** - Professional or informal caregiver

### Other
20. **Other** - For relationships not listed above

## Benefits

### 1. Data Consistency
- ✅ Standardized relationship values
- ✅ No spelling variations (e.g., "Mom" vs "Mother")
- ✅ Easier to filter and report on data
- ✅ Better for analytics and statistics

### 2. User Experience
- ✅ Faster data entry (select vs type)
- ✅ Clear options to choose from
- ✅ No typos or misspellings
- ✅ Mobile-friendly dropdown interface

### 3. Data Quality
- ✅ Prevents invalid entries
- ✅ Ensures consistent formatting
- ✅ Easier to validate
- ✅ Better for database queries

## Usage Context

This field is used in the **Contact Person** section of the PCR form to specify the relationship between the contact person and the patient.

**Example:**
- Contact Person: Juan Dela Cruz
- **Relationship: Spouse** ← Dropdown selection
- Contact Number: 09123456789

## Cultural Considerations

The relationship options are designed to be inclusive and cover common Filipino family structures:
- Includes both gendered and gender-neutral options (Brother/Sister and Sibling)
- Covers extended family common in Filipino households
- Includes non-family relationships (Friend, Neighbor, Caregiver)
- "Other" option for flexibility

## Database Impact

### Existing Data
- Existing PCR records with free-text relationship values will still display correctly
- When editing old records, users can select from the dropdown or keep existing value if it matches

### New Data
- All new entries will use standardized values from the dropdown
- Improves data quality for future analytics and reporting

## Custom Relationship Input

### "Other" Option with Text Field
When "Other" is selected from the dropdown, a text input field automatically appears below, allowing users to type a custom relationship.

**Implementation:**
```jsx
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

**User Flow:**
1. User selects "Other" from Relationship dropdown
2. Text input field appears below
3. User types custom relationship (e.g., "Step-father", "Foster parent", "Legal representative")
4. Both values are saved: `relationship: "Other"` and `relationshipOther: "Step-father"`

## Future Enhancements

### Possible Additions
1. ✅ **Custom Input Option**: IMPLEMENTED - "Other" with text field
2. **Localization**: Add Tagalog translations
   - Spouse → Asawa
   - Mother → Ina
   - Father → Ama
   - etc.
3. **Relationship Validation**: Warn if relationship doesn't match patient age (e.g., "Son" for 80-year-old patient)
4. **Most Common**: Show most frequently used relationships at the top
5. **Search/Filter**: Add search functionality for large dropdown

## Testing

### Test Case 1: Normal Selection
1. Open PCR form
2. Click Relationship dropdown
3. Select "Mother"
4. Expected: Field shows "Mother"
5. Result: ✅ Pass

### Test Case 2: Empty Selection
1. Open PCR form
2. Leave Relationship as "Select Relationship"
3. Try to submit
4. Expected: Form accepts empty relationship (not required field)
5. Result: ✅ Pass

### Test Case 3: Editing Existing PCR
1. Open existing PCR with relationship = "Mother"
2. Dropdown shows "Mother" selected
3. Can change to different option
4. Expected: Works correctly
5. Result: ✅ Pass

### Test Case 4: Disabled State
1. Open PCR in read-only mode
2. Relationship dropdown is disabled
3. Cannot change selection
4. Expected: Dropdown is disabled
5. Result: ✅ Pass

## Files Modified
- `components/PCRForm.js`
  - Changed relationship input from text to select
  - Added 20 relationship options
  - Maintained same styling and validation

## Relationship Options List

```
1. Spouse
2. Mother
3. Father
4. Son
5. Daughter
6. Brother
7. Sister
8. Sibling
9. Grandmother
10. Grandfather
11. Aunt
12. Uncle
13. Cousin
14. Nephew
15. Niece
16. Friend
17. Neighbor
18. Guardian
19. Caregiver
20. Other
```
