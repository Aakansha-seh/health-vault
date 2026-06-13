/**
 * General-purpose helpers used across the app.
 */

/** Generates a short random ID suitable for client-side entity creation. */
export const uid = () => Math.random().toString(36).slice(2, 9);
