## 2025-02-18 - Nested Component Definitions Anti-Pattern
**Learning:** Multiple pages (`Home`, `Events`, `Merch`, `YourSignings`) define sub-components (like `EventCard`) inside the main component function. This causes them to be redefined on every render, leading to unnecessary unmounts/remounts and preventing effective diffing.
**Action:** Always check for nested component definitions when optimizing React components and extract them to the file scope or separate files.
