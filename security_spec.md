# Security Specification for Gmail BuySell BD

## Data Invariants
1. A listing must have a valid seller ID matching the authenticated user.
2. An order must have both a buyer and a seller, and the amount must match the listing price.
3. User PII (email) is restricted to the owner.
4. Timestamps must be server-generated.

## The "Dirty Dozen" Payloads (Red Team Test Cases)

1. **Identity Spoofing**: Create a listing with `sellerId` of another user. (DENIED)
2. **PII Leak**: Read a user document that is not mine. (DENIED)
3. **Price Manipulation**: Create an order with an amount lower than the listing price. (DENIED)
4. **State Shortcutting**: Update a 'sold' listing back to 'active' as a non-owner. (DENIED)
5. **Shadow Fields**: Create a user profile with an `isAdmin: true` ghost field. (DENIED)
6. **Orphaned Listing**: Create a listing for a non-existent category. (DENIED if validated)
7. **Resource Poisoning**: Use a 2MB string as a listing title. (DENIED)
8. **Malicious ID**: Use `../../exploits` as a document ID. (DENIED)
9. **Timestamp Fraud**: Manually setting `createdAt` to a date in the past. (DENIED)
10. **Listing Takeover**: Update a listing I didn't create. (DENIED)
11. **Order Modification**: Update a 'completed' order status. (DENIED)
12. **Blanket Read**: Fetch all user emails via `list` on `users`. (DENIED)
