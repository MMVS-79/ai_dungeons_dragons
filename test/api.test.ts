/**
 * API Integration Tests
 * ---------------------
 * Covers Backend ↔ Database ↔ LLM ↔ Frontend interaction flow.
 * 
 * Tests:
 * - GET /campaigns (loads campaign list)
 * - POST /campaigns (creates new campaign)
 * - POST /campaigns/{id}/action (resolves one event turn)
 * - LLM event generation + DB save flow
 * 
 * Simulates sequences from the UML “Page Load” and “Per Turn” diagrams.
 */
