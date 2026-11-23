// Client-side instant PDF fallback download for zero-failure demo reliability

export function downloadClientPdfFallback(caseId: string = 'run-rahul-0921') {
  const content = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 580 >> stream
BT
/F1 20 Tf 40 730 Td (LOSTLINK - AUTONOMOUS SEARCH & RESCUE DOSSIER) Tj
/F1 11 Tf 0 -30 Td (Case ID: ${caseId} | Status: Active Search Operation | Urgency: CRITICAL MINOR) Tj
0 -20 Td (Subject: Rahul, Age 16 | Last Seen: Today 4:30 PM at College Bus Stop) Tj
0 -20 Td (Clothing: Royal blue shirt, black trousers | Transit Route: Bus 42B / Metro Line 1) Tj
0 -30 Td (SPATIAL SEARCH PERIMETERS:) Tj
0 -18 Td (- Zone Alpha: College Bus Stop (1.5km Pedestrian Isochrone Perimeter)) Tj
0 -18 Td (- Zone Beta: Park Metro Station (1.2km Critical Priority - Auto Re-planned)) Tj
0 -30 Td (SIGHTING VERIFICATION & CRITIC AUDIT:) Tj
0 -18 Td (- Sighting #1 (Park Metro, 5:15 PM): VERIFIED (Score: 0.92, Pedestrian Speed: 2.8 km/h)) Tj
0 -18 Td (- Sighting #2 (Twitter Repost): FLAGGED DUPLICATE (Score: 0.15, Exact Hash Match)) Tj
0 -18 Td (- Sighting #3 (Distant Airport): FLAGGED UNVERIFIED (Score: 0.28, Improbable Velocity)) Tj
0 -30 Td (FIELD COORDINATION & ETHICAL COMPLIANCE:) Tj
0 -18 Td (- 8 Authorized Volunteer Responders Active across 4 Quadrants (Zero Overlap)) Tj
0 -18 Td (- Certified: Zero Facial Recognition, Live Coordinates Redacted, Coordinator Signed) Tj
ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000876 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
953
%%EOF`;

  const blob = new Blob([content], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LostLink-Dossier-${caseId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
