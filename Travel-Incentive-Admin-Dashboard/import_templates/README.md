Contacts import template

This folder contains CSV templates for importing contacts into the Admin Dashboard.

Usage:
- Use `contacts-template.csv` as a starting point.
- REQUIRED headers: `Nome` (or `FirstName`) and `Cognome` (or `LastName`) — both are mandatory.
- Other supported headers: `Email`, `Phone` (or `Telefono`), `Type` (or `Categoria`), `TargetAirports`, `Availability`, `Languages`, `Services`, `DepartureGroup`, `Notes`.
- `TargetAirports` can be pipe-separated (e.g., `MXP|FCO`). `Languages` and `Services` can be semicolon-separated.

Behavior:
- The import logic will prefer `Nome`/`Cognome` (`FirstName`/`LastName`). If only the legacy `Name` column is provided, the system will attempt to split it into first/last automatically, but this is unreliable and not recommended.

Notes:
- Make sure `Nome` and `Cognome` are populated for each contact — they are now required in the backend validation.
- Use the provided `contacts-template.csv` to ensure correct formatting.
