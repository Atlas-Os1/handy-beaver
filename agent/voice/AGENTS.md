# AGENTS.md — Lil Beaver Voice Agent Architecture

## Overview

Lil Beaver Voice Agent runs on ElevenLabs Conversational AI, handling inbound phone calls for The Handy Beaver handyman service.

## Workflow Nodes

### 1. Start
- Greeting plays automatically
- System identifies if caller is new or returning

### 2. Welcome & Identify Caller
**Prompt:**
> "Hey there! Thanks for calling The Handy Beaver, this is Lil Beaver speaking. How can I help you today?"

**Branches:**
- `caller_is_existing_customer` → Project & Account Questions
- `caller_is_new_prospect` → Schedule Consultation
- `caller_needs_general_info` → Answer Questions

### 3. Project & Account Questions
**Purpose:** Help existing customers with their ongoing projects

**Prompt:**
> "Sure thing! Can you tell me your name so I can pull up your project?"

**Actions:**
- Look up customer in database
- Provide project status
- Answer questions about timeline, materials, etc.
- Transfer to Colt if complex issue

**Exit:** "The project questions have been answered"

### 4. Schedule Consultation
**Purpose:** Book new customers for estimates/consultations

**Prompt:**
> "I'd be happy to help you get set up with an estimate! What kind of project are you looking at?"

**Actions:**
- Collect project type (flooring, deck, trim, etc.)
- Get basic scope
- Collect contact info (name, phone, address)
- Suggest available times
- Create booking in system

**Exit:** "The consultation has been scheduled"

### 5. Service Request
**Purpose:** Existing customers requesting new work

**Prompt:**
> "Got it! Tell me about what you need done."

**Actions:**
- Collect project details
- Provide rough estimate if simple
- Schedule callback for detailed quote
- Create lead in system

**Exit:** "The service request has been submitted"

### 6. Confirm & Close
**Prompt:**
> "Is there anything else I can help you with today?"

**Branches:**
- More questions → Route back to appropriate node
- No more questions → End

### 7. End
**Prompt:**
> "Alright, thanks for calling The Handy Beaver! We'll be in touch soon. Have a great day!"

## Tools Available

### 1. lookup_customer
Look up customer by name or phone number.
```json
{
  "name": "lookup_customer",
  "description": "Find customer in database",
  "parameters": {
    "search": "string (name or phone)"
  }
}
```

### 2. get_project_status
Get status of a specific project.
```json
{
  "name": "get_project_status",
  "description": "Get project/booking status",
  "parameters": {
    "customer_id": "number"
  }
}
```

### 3. create_lead
Create a new lead/quote request.
```json
{
  "name": "create_lead",
  "description": "Create new lead from call",
  "parameters": {
    "name": "string",
    "phone": "string",
    "email": "string (optional)",
    "project_type": "string",
    "description": "string",
    "address": "string (optional)"
  }
}
```

### 4. check_availability
Check available dates for scheduling.
```json
{
  "name": "check_availability",
  "description": "Get available appointment slots",
  "parameters": {
    "week_offset": "number (0=this week, 1=next week)"
  }
}
```

### 5. schedule_consultation
Book a consultation appointment.
```json
{
  "name": "schedule_consultation",
  "description": "Schedule consultation/estimate",
  "parameters": {
    "customer_name": "string",
    "phone": "string",
    "date": "string (YYYY-MM-DD)",
    "time": "string (HH:MM)",
    "project_type": "string",
    "address": "string"
  }
}
```

### 6. send_notification
Notify owner of call.
```json
{
  "name": "send_notification",
  "description": "Send notification to owner",
  "parameters": {
    "type": "string (new_lead, callback_request, urgent)",
    "message": "string",
    "caller_info": "object"
  }
}
```

## API Endpoints

All tools connect to The Handy Beaver API:

```
Base URL: https://handybeaver.co/api/voice

POST /api/voice/lookup - lookup_customer
GET /api/voice/project/:id - get_project_status
POST /api/voice/lead - create_lead
GET /api/voice/availability - check_availability
POST /api/voice/schedule - schedule_consultation
POST /api/voice/notify - send_notification
```

## Authentication

ElevenLabs will call the API with:
- `Authorization: Bearer {VOICE_AGENT_API_KEY}`
- `X-Agent-ID: lil-beaver-voice`

## Error Handling

If any tool fails:
> "I'm having a little trouble with my system right now. Can I have Colt give you a call back? What's the best number to reach you?"
