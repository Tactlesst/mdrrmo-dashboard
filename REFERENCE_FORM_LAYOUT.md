# Reference Form Layout - Implementation Plan

## Reference Form Analysis

Based on the provided reference image, the form has the following structure:

### Header Section
```
[Logo Left]          Republic of the Philippines          [Logo Right]
                    Province of Masbate Oriental
                    MUNICIPALITY OF BALINGSAG
                    
                    PATIENT CARE REPORT
```

### Main Form Table Structure

#### Row 1
| CASE TYPE - DESCRIPTION | NAME OF RECORDER | DATE |

#### Row 2
| NAME OF PATIENT | HOSPITAL TRANSPORTED TO | TIME OF CALL |

#### Row 3
| AGE | GENDER | CATEGORY: DRIVER (_), PASSENGER (_), PATIENT (_) | TIME ARRIVED AT SCENE |

#### Row 4
| BLOOD PRESSURE | PR | RR | O2SAT | TEMPERATURE | UNDER INFLUENCE: ALCOHOL (_), DRUGS (_), UNKNOWN (_), N/A (_) | TIME LEFT SCENE |

#### Row 5
| HOME ADDRESS (spans multiple columns) | EVACUATION CODE: BLACK (_), RED (_), YELLOW (_), GREEN (_) | TIME ARRIVED AT HOSPITAL |

#### Row 6
| CONTACT PERSON | RELATIONSHIP | CONTACT NUMBER | RESPONSE TEAM: TEAM 1 (_), TEAM 3 (_), TEAM 2 (_) | AMBULANCE NO |

#### Row 7
| DOI | | NOI | | |

#### Row 8
| TOI | | POI | BRGY: _____, HIGHWAY/ROAD (_), RESIDENCE (_), PUBLIC BUILDING/PLACE (_) | |

#### Row 9
| LOSS OF CONSCIOUSNESS | YES (_) NO (_) | MINUTES: _____ | | |

#### Row 10
| CHIEF COMPLAINT/S (full width) |

#### Row 11
| INTERVENTIONS (full width) |

#### Row 12 (Two columns)
| HISTORY (left column) | NARRATIVE OF THE INCIDENT (right column) |

#### History Section (left)
- SIGNS & SYMPTOMS
- ALLERGIES
- MEDICATION
- PAST HISTORY
- LAST INTAKE
- EVENTS

#### Row 13 - Additional Notes
| ADDITIONAL NOTES (full width) |

### Bottom Section (Two columns)

#### Left Column
- Body Diagram (front and back views)
- DRIVER:
- TEAM LEADER:
- CREW:

#### Right Column
- Waiver of Treatment / Patient Refusal (text box)
- Patient Signature: _____ | Witness Signature: _____
- Date: _____ | Date: _____
- RECEIVING HOSPITAL
- NAME: _____
- SIGNATURE: _____

## Implementation Strategy

### Option 1: Full Table Rewrite (Recommended)
Create a complete HTML table structure that exactly matches the reference form layout.

**Pros:**
- Exact match to reference
- Professional appearance
- Easy to print
- Consistent layout

**Cons:**
- Major code rewrite
- Need to restructure all data display
- More complex HTML

### Option 2: CSS Grid with Table Styling
Use CSS Grid to mimic table appearance while keeping current structure.

**Pros:**
- Less code changes
- Flexible layout
- Modern approach

**Cons:**
- May not match exactly
- More CSS complexity
- Print behavior may vary

### Option 3: Hybrid Approach
Keep current sections but style them to look like the reference form.

**Pros:**
- Minimal changes
- Quick implementation

**Cons:**
- Won't match reference exactly
- Compromised appearance

## Recommended Implementation: Option 1

Create a new print-specific component that renders as an HTML table matching the reference form exactly.

### Steps:
1. Create table structure with proper rows and columns
2. Map all form fields to table cells
3. Add borders and styling to match reference
4. Include body diagram and waiver sections
5. Ensure single-page printing

### Code Structure:
```jsx
<table className="print-form-table">
  <tbody>
    {/* Row 1: Case Type, Recorder, Date */}
    <tr>
      <td className="field-label">CASE TYPE - DESCRIPTION:</td>
      <td colSpan="2">{fullForm.caseType}</td>
      <td className="field-label">NAME OF RECORDER:</td>
      <td>{form.recorder}</td>
      <td className="field-label">DATE:</td>
      <td>{formatPHDate(form.date)}</td>
    </tr>
    
    {/* Row 2: Patient Name, Hospital, Time of Call */}
    <tr>
      <td className="field-label">NAME OF PATIENT:</td>
      <td colSpan="3">{form.patient_name}</td>
      <td className="field-label">HOSPITAL TRANSPORTED TO:</td>
      <td colSpan="2">{fullForm.hospitalTransported}</td>
      <td className="field-label">TIME OF CALL:</td>
      <td>{formatTime(fullForm.timeCall)}</td>
    </tr>
    
    {/* Continue for all rows... */}
  </tbody>
</table>
```

## Next Steps

1. **Create new table-based layout** in PCRPrint.js
2. **Map all form fields** to appropriate table cells
3. **Style table** to match reference (borders, fonts, spacing)
4. **Add body diagram** section at bottom
5. **Add waiver section** at bottom
6. **Test printing** to ensure single-page output
7. **Adjust font sizes** if needed to fit on one page

## Estimated Changes

- **PCRPrint.js**: Major rewrite of content section
- **CSS**: Table-specific styling already added
- **Layout**: Complete restructure to table format
- **Testing**: Extensive testing needed

## Timeline

- Table structure creation: 30-45 minutes
- Field mapping: 15-20 minutes
- Styling and adjustments: 20-30 minutes
- Testing and refinement: 15-20 minutes
- **Total**: ~1.5-2 hours

Would you like me to proceed with implementing the full table-based layout to match the reference form exactly?
