# Agent 3.6: Data Flow Analysis - Connections and Messaging

**Analysis Date:** 2026-03-21  
**Analyst:** Agent 3.6  
**Scope:** Connections, Conversations, Messages, and Real-time Communication  

---

## 1. Executive Summary

### Overall Health Assessment: **MODERATE RISK**

The connections and messaging system has a solid foundation with proper database schema, RLS policies, and triggers. However, several **critical gaps** exist in the conversation creation flow and real-time message handling that could cause production issues.

### Key Findings Summary

| Category | Status | Issues Found |
|----------|--------|--------------|
| Connections Table Structure | COMPLETE | None |
| Connection Request Flow | PARTIAL | Missing conversation auto-creation on accept |
| Conversations Table Structure | COMPLETE | None |
| Messages Table Structure | COMPLETE | None |
| Message Sending Flow | CRITICAL | No conversation creation logic in frontend |
| Read Receipts | PARTIAL | read_at set but not broadcast properly |
| Real-time Features | PARTIAL | Typing works, message broadcast incomplete |
| RLS Policies | COMPLETE | Well configured |
| Triggers and Functions | PARTIAL | Some gaps |

### Critical Issues Count
- **Critical:** 2
- **High:** 4
- **Medium:** 5
- **Low:** 3

---

## 2. Connection Request Flow Analysis

### 2.1 Database Schema - COMPLETE

All required fields present in connections table:
- id (UUID PRIMARY KEY)
- requester_id (UUID REFERENCES profiles)
- receiver_id (UUID REFERENCES profiles)  
- status (CHECK: pending, accepted, declined, blocked)
- message (TEXT for connection request)
- created_at, updated_at (TIMESTAMPTZ)
- UNIQUE(requester_id, receiver_id)
- CHECK (requester_id != receiver_id)

### 2.2 Connection Status Functions - COMPLETE

| Function | Status | Purpose |
|----------|--------|---------|
| are_connected(user1, user2) | IMPLEMENTED | Returns boolean for accepted connections |
| get_connection_status(user1, user2) | IMPLEMENTED | Returns status string or not_connected |
| get_pending_connection_count(user_id) | IMPLEMENTED | Returns pending request count |

### 2.3 Connection Request Flow - PARTIAL

| Step | Status | Location |
|------|--------|----------|
| Send connection request | OK | lib/services/connections.ts |
| Store with status=pending | OK | Database INSERT |
| Notification to receiver | OK | Trigger notify_connection_request_trigger |
| Event captured | OK | Trigger capture_connection_request_event |
| Accept/Decline | OK | lib/services/connections.ts |
| Status update | OK | Database UPDATE |
| Notification on acceptance | OK | Trigger notify_connection_accepted_trigger |
| Event captured (accepted) | OK | Trigger capture_connection_accepted_event |
| **Create conversation on accept** | **MISSING** | **No implementation** |

### 2.4 Connection Triggers - COMPLETE

- notify_connection_request_trigger (AFTER INSERT)
- notify_connection_accepted_trigger (AFTER UPDATE)
- capture_connection_request_event (AFTER INSERT)
- capture_connection_accepted_event (AFTER UPDATE)

---

## 3. Conversation Management Analysis

### 3.1 Database Schema - COMPLETE

All required fields present:
- id (UUID PRIMARY KEY)
- participant_1 (UUID REFERENCES profiles)
- participant_2 (UUID REFERENCES profiles)
- last_message_text (TEXT)
- last_message_at (TIMESTAMPTZ)
- unread_count_1, unread_count_2 (INTEGER)
- is_archived (BOOLEAN)
- created_at (TIMESTAMPTZ)
- UNIQUE(participant_1, participant_2)
- CHECK (participant_1 < participant_2)

### 3.2 get_conversation Function - EXISTS BUT UNUSED

Function exists in database but NOT USED in frontend code.

### 3.3 Conversation Creation Flow - CRITICAL ISSUE

**Current Issue:** NO conversation creation logic when:
1. A connection request is accepted
2. A user tries to message a connection for the first time

**Evidence:**
- hooks/use-conversations.ts queries connections table (NOT conversations)
- hooks/use-messages.ts expects conversationId but cannot create one
- lib/services/conversations.ts DOES NOT EXIST

### 3.4 RLS Policies - COMPLETE

- Users can view own conversations
- Service role can create conversations
- Users can update own conversations

---

## 4. Message Sending Flow Analysis

### 4.1 Database Schema - COMPLETE

All required fields present:
- id (UUID PRIMARY KEY)
- conversation_id (UUID REFERENCES conversations)
- sender_id (UUID REFERENCES profiles)
- text (TEXT NOT NULL)
- is_read (BOOLEAN DEFAULT FALSE)
- attachment_url (TEXT)
- read_at (TIMESTAMPTZ) - Read receipt timestamp
- attachment_type (CHECK: image, file)
- created_at (TIMESTAMPTZ)

### 4.2 Message Sending Flow - CRITICAL

**Issues:**
1. NO unread count update in frontend (trigger handles it)
2. NO conversation creation - assumes convId exists
3. DUPLICATE logic - trigger does same update as frontend

### 4.3 Message Triggers - COMPLETE

- update_conversation_last_message_trigger (AFTER INSERT)
- notify_new_message_trigger (AFTER INSERT)
- capture_message_sent_event (AFTER INSERT)
- broadcast_message_realtime (AFTER INSERT)

### 4.4 Notification and Event Triggers - COMPLETE

All triggers properly configured for notifications and event capture.

---

## 5. Read Receipts Analysis

### 5.1 Schema Support - COMPLETE

- messages.is_read BOOLEAN NOT NULL DEFAULT FALSE
- messages.read_at TIMESTAMPTZ

### 5.2 Read Receipt Implementation - PARTIAL

**What works:**
- read_at timestamp set correctly on mark as read
- UI displays read receipts properly

**Issues:**
1. Broadcast channel not subscribed - no listener for read_receipt events
2. No trigger for read_at updates

### 5.3 Read Receipt Display - COMPLETE

UI properly shows:
- Single check for sent
- Double check for read
- Tooltip with read timestamp on hover

---

## 6. Real-time Features Analysis

### 6.1 Supabase Realtime Configuration - COMPLETE

All tables added to realtime publication:
- connections
- conversations
- messages
- notifications

### 6.2 Message Real-time Subscription - COMPLETE

Properly configured for:
- INSERT events (new messages)
- UPDATE events (read receipts)
- Channel cleanup on unmount

### 6.3 Typing Indicators - COMPLETE

Well implemented with:
- Broadcast channel for typing events
- Debounce logic (500ms)
- Auto-timeout (2 seconds)
- Proper channel cleanup

### 6.4 Read Receipt Broadcast - MISSING RECEIVER

Issue: Broadcast sent but no subscription exists to receive it.

### 6.5 Real-time Cleanup - COMPLETE

Channel cleanup properly implemented in useEffect return.

---

## 7. Triggers and Functions Summary

### 7.1 Connection Triggers - COMPLETE

| Trigger | Event | Function |
|---------|-------|----------|
| notify_connection_request_trigger | INSERT | notify_connection_request() |
| notify_connection_accepted_trigger | UPDATE | notify_connection_accepted() |
| capture_connection_request_event | INSERT | capture_event(connection_requested) |
| capture_connection_accepted_event | UPDATE | capture_event(connection_accepted) |

### 7.2 Message Triggers - COMPLETE

| Trigger | Event | Function |
|---------|-------|----------|
| update_conversation_last_message_trigger | INSERT | update_conversation_last_message() |
| notify_new_message_trigger | INSERT | notify_new_message() |
| capture_message_sent_event | INSERT | capture_event(message_sent) |
| broadcast_message_realtime | INSERT | broadcast_realtime(messages) |

### 7.3 Helper Functions - PARTIAL

| Function | Purpose | Status |
|----------|---------|--------|
| get_conversation | Get conversation ID | EXISTS, NOT USED |
| are_connected | Check if connected | OK |
| get_connection_status | Get status string | OK |
| get_pending_connection_count | Count pending | OK |

---

## 8. Critical Issues

### Issue #1: No Conversation Creation on Connection Accept [CRITICAL]

**Severity:** CRITICAL  
**Impact:** Users cannot message after accepting connection requests  
**Location:** lib/services/connections.ts:acceptConnectionRequest()  

**Problem:** Connection accept only updates status, does not create conversation record.

**Fix Required:** Add conversation INSERT with ordered participant_1 < participant_2.

### Issue #2: Read Receipt Broadcast Not Received [CRITICAL]

**Severity:** CRITICAL  
**Impact:** Senders never see read receipts in real-time  
**Location:** hooks/use-messages.ts  

**Problem:** Broadcast sent but no subscription listener exists.

**Fix Required:** Add broadcast listener for read_receipt events.

### Issue #3: useConversations Hook Uses Wrong Table [HIGH]

**Severity:** HIGH  
**Impact:** Conversation list does not match conversations table  
**Location:** hooks/use-conversations.ts  

**Problem:** Queries connections table instead of conversations table.

### Issue #4: No Service for Conversations [HIGH]

**Severity:** HIGH  
**Impact:** No centralized conversation management  
**Location:** lib/services/conversations.ts - FILE DOES NOT EXIST  

**Missing:** getOrCreateConversation, getConversations, archiveConversation

### Issue #5: Duplicate Conversation Update Logic [MEDIUM]

**Severity:** MEDIUM  
**Impact:** Race conditions possible  
**Problem:** Both frontend and trigger update last_message fields.

### Issue #6: get_conversation Function Not Used [MEDIUM]

**Severity:** MEDIUM  
**Impact:** Inconsistent conversation lookup  

### Issue #7: No Error Handling for Conversation Creation [MEDIUM]

**Severity:** MEDIUM  
**Impact:** Silent failures when messaging  

### Issue #8: Unread Count May Be Inaccurate [MEDIUM]

**Severity:** MEDIUM  
**Impact:** Badge counts may not reflect reality  

### Issue #9: Missing Composite Index [LOW]

**Severity:** LOW  
**Impact:** Slow conversation lookups at scale  

### Issue #10: Typing Indicator Cleanup [LOW - RESOLVED]

**Severity:** LOW  
**Status:** Properly cleaned up on unmount

---

## 9. Recommendations

### Priority 1: Critical Fixes (Must Fix Before Production)

1. **Add Conversation Creation on Connection Accept**
   - File: lib/services/connections.ts
   - Function: acceptConnectionRequest()
   - Effort: 2 hours

2. **Implement Read Receipt Subscription**
   - File: hooks/use-messages.ts
   - Effort: 1 hour

3. **Create Conversations Service**
   - File: lib/services/conversations.ts (NEW)
   - Effort: 4 hours

### Priority 2: High Priority Fixes

4. **Fix useConversations Hook** - 2 hours
5. **Remove Duplicate Conversation Update** - 30 minutes
6. **Add Error Handling for Missing Conversations** - 1 hour

### Priority 3: Medium Priority Improvements

7. **Use get_conversation Function** - 1 hour
8. **Fix Unread Count Logic** - 2 hours
9. **Add Composite Index** - 30 minutes

### Priority 4: Nice to Have

10. **Add Real-time Connection Status Updates** - 2 hours
11. **Add Message Delivery Confirmation** - 3 hours
12. **Add Conversation Archiving** - 2 hours

---

## 10. Verification Checklist

### Pre-Fix Verification

- [ ] Verify conversations table is empty after accepting connection requests
- [ ] Verify read receipts are not updating in real-time
- [ ] Verify useConversations returns data from connections not conversations
- [ ] Verify no lib/services/conversations.ts file exists

### Post-Fix Verification

- [ ] Accepting connection request creates conversation record
- [ ] Read receipts broadcast and received in real-time
- [ ] useConversations queries conversations table
- [ ] getOrCreateConversation function exists and works
- [ ] No duplicate conversation updates (trigger only)
- [ ] Unread counts accurate after marking as read

---

## 11. Conclusion

### Overall Assessment

The connections and messaging system has a **solid database foundation** with proper schema, RLS policies, and triggers. However, the **frontend implementation has critical gaps** that will prevent the system from working correctly in production.

### Key Takeaways

1. **Database is production-ready** - Schema, triggers, and RLS are well-designed
2. **Frontend has critical gaps** - Missing conversation creation and read receipt handling
3. **Service layer incomplete** - No conversations service exists
4. **Real-time mostly works** - Typing indicators work, but read receipts do not broadcast properly

### Recommended Action Plan

**Week 1:** Fix critical issues (conversation creation, read receipts)  
**Week 2:** Implement conversations service and fix hooks  
**Week 3:** Add improvements and polish  

**Overall Risk Level:** MODERATE - Fixable before production with focused effort.

---

*Report generated by Agent 3.6*  
*Analysis completed: 2026-03-21*
