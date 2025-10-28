# API Validation Summary

This document outlines all the error validation improvements made across the MDRRMO Dashboard API endpoints.

## Overview
Comprehensive input validation and error handling has been added to all critical API endpoints to ensure data integrity and provide clear error messages to users.

---

## 1. Login Endpoint (`/api/login.js`)

### Validations Added:
- ✅ **Required Fields**: Email and password must be provided
- ✅ **Email Format**: Valid email format validation using regex
- ✅ **Specific Error Messages**: Separate messages for missing fields vs invalid credentials
- ✅ **Security**: Generic "Invalid email or password" message to prevent user enumeration

### Error Responses:
- `400`: "Email and password are required"
- `400`: "Invalid email format"
- `401`: "Invalid email or password"
- `500`: "Internal server error"

---

## 2. User Management - Add User (`/api/users/add.js`)

### Validations Added:
- ✅ **Required Fields**: Full name, email, and role validation
- ✅ **Email Format**: Valid email format using regex
- ✅ **Name Length**: Minimum 2 characters for full name
- ✅ **Duplicate Email Check**: Prevents duplicate emails in the same role
- ✅ **Cross-Table Validation**: Checks if email exists in other user tables (users, responders, admins)
- ✅ **Role Validation**: Ensures valid role selection

### Error Responses:
- `400`: "Missing required fields"
- `400`: "Invalid email format"
- `400`: "Full name must be at least 2 characters"
- `400`: "Invalid role specified"
- `409`: "Email already registered in this role"
- `409`: "Email already registered as [Resident/Responder/Admin]"
- `500`: "Internal server error"

---

## 3. User Management - Update User (`/api/users/update.js`)

### Validations Added:
- ✅ **Required Fields**: ID, name, email, and role validation
- ✅ **Email Format**: Valid email format using regex
- ✅ **Name Length**: Minimum 2 characters for name
- ✅ **Duplicate Email Check**: Prevents duplicate emails for different users in the same role
- ✅ **Cross-Table Validation**: Checks if email exists in other user tables
- ✅ **Role Validation**: Ensures valid role selection

### Error Responses:
- `400`: "Missing required fields"
- `400`: "Invalid email format"
- `400`: "Name must be at least 2 characters"
- `400`: "Invalid role specified"
- `404`: "User not found"
- `409`: "Email already registered to another user in this role"
- `409`: "Email already registered as [Resident/Responder/Admin]"
- `500`: "Server error"

---

## 4. Admin Profile (`/api/admin/profile.js`)

### Validations Added:
- ✅ **Name Length**: Minimum 2 characters if name is provided
- ✅ **Password Length**: Minimum 6 characters if password is being updated
- ✅ **Optional Fields**: Validates only when fields are provided

### Error Responses:
- `400`: "Name must be at least 2 characters"
- `400`: "Password must be at least 6 characters"
- `401`: "Unauthorized"
- `401`: "Invalid token"
- `500`: "Server error"

---

## 5. PCR Forms (`/api/pcr/index.js`)

### Validations Added (POST & PUT):
- ✅ **Required Fields**: Patient name, date, and recorder validation
- ✅ **Patient Name**: Minimum 2 characters
- ✅ **Recorder Name**: Minimum 2 characters
- ✅ **Date Format**: Valid date format validation
- ✅ **Time Format**: Validates time format (HH:MM AM/PM)

### Error Responses:
- `400`: "Missing required fields: patientName, date, recorder"
- `400`: "Patient name must be at least 2 characters"
- `400`: "Recorder name must be at least 2 characters"
- `400`: "Invalid date format"
- `400`: "Form ID is required" (for PUT)
- `401`: "Not authenticated"
- `404`: "User not found"
- `404`: "Form not found" (for PUT)
- `500`: "Failed to save/update PCR form"

---

## 6. Notifications (`/api/notifications/create.js`)

### Validations Added:
- ✅ **Required Fields**: All notification fields validated
- ✅ **Message Length**: Cannot be empty, max 1000 characters
- ✅ **Name Validation**: Sender and recipient names cannot be empty
- ✅ **Account ID**: Must be a valid number
- ✅ **Type Validation**: Account type and sender type must be from allowed values

### Error Responses:
- `400`: "Missing required fields"
- `400`: "Message cannot be empty"
- `400`: "Message is too long (max 1000 characters)"
- `400`: "Sender name cannot be empty"
- `400`: "Recipient name cannot be empty"
- `400`: "Invalid account ID"
- `400`: "Invalid accountType: [type]"
- `400`: "Invalid senderType: [type]"
- `500`: "Server error"

---

## 7. Chat Messages (`/api/chat/messages.js`)

### Validations Added:
- ✅ **Required Parameters**: User IDs and types validation
- ✅ **User ID Format**: Must be valid numbers
- ✅ **User Type**: Must be from allowed types (admin, responder, user)

### Error Responses:
- `400`: "Missing required parameters"
- `400`: "Invalid user ID format"
- `400`: "Invalid user type"
- `405`: "Method not allowed"
- `500`: "Failed to fetch messages"

---

## Security Best Practices Implemented

1. **Input Sanitization**: All user inputs are validated before processing
2. **Email Validation**: Consistent regex pattern across all endpoints
3. **Duplicate Prevention**: Email uniqueness enforced across all user tables
4. **Generic Error Messages**: Login errors don't reveal if email exists (prevents user enumeration)
5. **Type Validation**: Strict validation of user types and roles
6. **Length Constraints**: Minimum and maximum length validation where appropriate
7. **SQL Injection Prevention**: Using parameterized queries throughout

---

## HTTP Status Codes Used

- **200**: Success
- **201**: Created successfully
- **400**: Bad request (validation errors)
- **401**: Unauthorized (authentication required)
- **404**: Resource not found
- **405**: Method not allowed
- **409**: Conflict (duplicate data)
- **500**: Internal server error

---

## Testing Recommendations

1. Test duplicate email registration across all user types
2. Test invalid email formats
3. Test missing required fields
4. Test minimum length validations
5. Test cross-table email validation
6. Test login with wrong credentials
7. Test invalid user types and roles
8. Test message length limits in notifications

---

**Last Updated**: October 28, 2025
**Version**: 1.0
