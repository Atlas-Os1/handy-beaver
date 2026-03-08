# TOOLS.md — Lil Beaver Voice Agent Tools

## ElevenLabs Configuration

### Agent Details
- **Agent ID:** `agent_6401kk7jr6ngey2ancnk6nf7kpwy`
- **Branch ID:** `agtbrch_0001kk7m1ss5frqbjb5rnegzyw7z`
- **Platform:** ElevenLabs Conversational AI
- **Voice:** (Select warm, friendly male voice)

### Webhook URL
```
https://handybeaver.co/api/voice/webhook
```

### API Key
Set in ElevenLabs dashboard under "Tools" > "Authorization"

---

## Tool Definitions for ElevenLabs

### 1. lookup_customer

**Name:** `lookup_customer`
**Description:** Search for an existing customer by name or phone number

**Parameters:**
| Name | Type | Description | Required |
|------|------|-------------|----------|
| search | string | Customer name or phone number | Yes |

**Response:**
```json
{
  "found": true,
  "customer": {
    "id": 123,
    "name": "John Smith",
    "phone": "580-555-1234",
    "projects": [
      {
        "id": 45,
        "title": "Kitchen flooring",
        "status": "in_progress",
        "scheduled_date": "2026-03-15"
      }
    ]
  }
}
```

---

### 2. get_project_status

**Name:** `get_project_status`
**Description:** Get the current status of a customer's project

**Parameters:**
| Name | Type | Description | Required |
|------|------|-------------|----------|
| customer_id | number | Customer ID from lookup | Yes |
| project_id | number | Specific project ID | No |

**Response:**
```json
{
  "project": {
    "id": 45,
    "title": "Kitchen flooring",
    "status": "in_progress",
    "scheduled_date": "2026-03-15",
    "notes": "LVP flooring in kitchen and dining room",
    "quote_total": 475
  }
}
```

---

### 3. create_lead

**Name:** `create_lead`
**Description:** Create a new lead from a phone inquiry

**Parameters:**
| Name | Type | Description | Required |
|------|------|-------------|----------|
| name | string | Caller's name | Yes |
| phone | string | Caller's phone number | Yes |
| email | string | Caller's email | No |
| project_type | string | Type of project (flooring, deck, trim, etc.) | Yes |
| description | string | Description of what they need | Yes |
| address | string | Project address | No |

**Response:**
```json
{
  "success": true,
  "lead_id": 789,
  "message": "Lead created successfully"
}
```

---

### 4. check_availability

**Name:** `check_availability`
**Description:** Check available appointment slots for consultations

**Parameters:**
| Name | Type | Description | Required |
|------|------|-------------|----------|
| week_offset | number | 0 = this week, 1 = next week | No (default: 0) |

**Response:**
```json
{
  "available_slots": [
    { "date": "2026-03-12", "day": "Wednesday", "slots": ["9:00 AM", "2:00 PM"] },
    { "date": "2026-03-13", "day": "Thursday", "slots": ["10:00 AM", "3:00 PM"] }
  ]
}
```

---

### 5. schedule_consultation

**Name:** `schedule_consultation`
**Description:** Book a consultation appointment

**Parameters:**
| Name | Type | Description | Required |
|------|------|-------------|----------|
| customer_name | string | Customer name | Yes |
| phone | string | Phone number | Yes |
| date | string | Date (YYYY-MM-DD) | Yes |
| time | string | Time (e.g., "9:00 AM") | Yes |
| project_type | string | Type of project | Yes |
| address | string | Project location | Yes |

**Response:**
```json
{
  "success": true,
  "booking_id": 456,
  "confirmation": "Consultation scheduled for Wednesday, March 12th at 9:00 AM"
}
```

---

### 6. send_notification

**Name:** `send_notification`
**Description:** Send notification to business owner

**Parameters:**
| Name | Type | Description | Required |
|------|------|-------------|----------|
| type | string | "new_lead", "callback_request", "urgent" | Yes |
| message | string | Notification message | Yes |
| caller_name | string | Caller's name | No |
| caller_phone | string | Caller's phone | No |

**Response:**
```json
{
  "success": true,
  "notified": ["discord", "sms"]
}
```

---

## Quick Pricing Reference

| Service | Half Day | Full Day |
|---------|----------|----------|
| Labor | $175 | $300 |
| Helper | $100 | $225 |

**Talking points:**
- "For a typical half-day project, that's around $175 for labor"
- "Full day projects run about $300 for labor"
- "If we need a helper, add $100 for half day or $225 for full day"
- "Materials are extra — you'd purchase those"
- "I can have Colt give you an exact quote once he sees the space"

---

## Common Scenarios

### New Flooring Inquiry
1. Greet caller
2. Determine room size (rough sq ft)
3. Determine flooring type (LVP, hardwood, tile)
4. Collect contact info
5. Create lead
6. Offer to schedule consultation

### Existing Customer Project Check
1. Greet caller
2. Look up by name/phone
3. Provide project status
4. Answer questions
5. Offer to have Colt call if complex

### Schedule Service Request
1. Greet caller
2. Collect project details
3. Check availability
4. Book consultation
5. Confirm details
6. Send notification to owner
