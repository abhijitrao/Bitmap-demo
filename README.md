# Bitmap Parser Web

Phase 1 web version of the Android Bitmap Parser.

## Included

- ISO8583 Request parsing
- ISO8583 Response parsing
- Bitmap decoding
- ISO data-element names and values
- HEX / ASCII conversion
- Field length display
- Hide field values
- Original field order option
- TLV / EMV parsing with common EMV tag names
- Copy parsed output
- Responsive desktop/mobile UI

The web parser is client-side only. Packet data is processed in the browser and is not uploaded to a server.

## Run

Open `index.html` in a browser, or serve the repository with any static web server.

## Next phase

Host/socket Send Packet communication can be added separately because a normal browser cannot directly open an arbitrary TCP socket to the POS host. A small backend or WebSocket bridge will be required for that feature.
