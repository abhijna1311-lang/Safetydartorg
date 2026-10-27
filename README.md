
  # Accident Reporting Flow Design_050526

  This is a code bundle for Accident Reporting Flow Design_050526. The original project is available at https://www.figma.com/design/F1ZdGlZW8MEKooODV6rG02/Accident-Reporting-Flow-Design_050526.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Map pinning (Mapbox)

  Everywhere the app asks where an event happened, users can search, click the map, or use their device location to pin it. This covers every operator event type, the leader intake, the Field Supervisor's location details, and the correction screen. The pin fills Street On, City, and ZIP and suggests a cross street. Users can still type in any field, and a later pin won't overwrite what they typed. The map is limited to the DART service area. The shared component is `src/app/components/location/AddressLocationFields.tsx`, and `locationFields.ts` maps each screen to its report fields.

  1. Copy `.env.example` to `.env.local`.
  2. Set `VITE_MAPBOX_TOKEN` to a public Mapbox token (`pk.…`), restricted to DART domains.
  3. Restart the dev server.

  Without a token the map is hidden and the address fields work as before. Developers see a short setup notice instead. Set `VITE_MAPBOX_PERMANENT=true` only once the Mapbox account is licensed for permanent geocoding, which Mapbox's terms require when results are stored.
  