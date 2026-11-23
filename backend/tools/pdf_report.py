import io
from typing import Dict, Any, List, Optional
from datetime import datetime

def generate_case_pdf_report(
    case_data: Dict[str, Any],
    zones: List[Dict[str, Any]],
    tasks: List[Dict[str, Any]],
    sightings: List[Dict[str, Any]],
    approvals: Optional[List[Dict[str, Any]]] = None
) -> bytes:
    """
    Generates a professional PDF Incident Dossier for LostLink search operations.
    Uses strictly real database records:
    - If no approved decision exists, the signature displays 'Pending coordinator approval'.
    - If search zones, tasks, or sightings are empty, renders empty indicator states rather than mock data.
    """
    # Check if an approved approval exists
    approved_decision = None
    if approvals:
        for app in approvals:
            if app.get("status") == "approved":
                approved_decision = app
                break

    if approved_decision:
        decided_by = approved_decision.get("decided_by") or "Lead Coordinator"
        signature_text = f"Signed: {decided_by} | Authorization Confirmed"
    else:
        signature_text = "Pending coordinator approval"

    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#0B1120')
        )
        subtitle_style = ParagraphStyle(
            'SubTitleStyle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#00838F')
        )
        section_style = ParagraphStyle(
            'SectionStyle',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=15,
            textColor=colors.HexColor('#1E293B')
        )
        body_style = ParagraphStyle(
            'BodyStyle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor('#334155')
        )

        elements = []

        # 1. Header Banner
        elements.append(Paragraph("LOSTLINK · AI SEARCH & RESCUE NETWORK", subtitle_style))
        elements.append(Paragraph("OFFICIAL CASE INCIDENT DOSSIER", title_style))
        elements.append(Paragraph(f"Case ID: {case_data.get('case_id')} | Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", body_style))
        elements.append(Spacer(1, 8))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#00F0FF'), spaceAfter=12))

        # 2. Case Profile Table
        elements.append(Paragraph("1. CASE PROFILE & STATUS", section_style))
        elements.append(Spacer(1, 4))
        case_table_data = [
            ["Subject Name:", str(case_data.get('name', 'None')), "Age:", f"{case_data.get('age', 0)}"],
            ["Last Seen Time:", str(case_data.get('last_seen_time', 'Unrecorded')), "Urgency Level:", str(case_data.get('urgency', 'HIGH'))],
            ["Anchor Location:", str(case_data.get('last_seen_location', 'None')), "Case Status:", str(case_data.get('status', 'active')).upper()],
            ["Clothing Details:", str(case_data.get('clothing', 'Unspecified')), "Created At:", str(case_data.get('created_at', '-'))]
        ]
        t1 = Table(case_table_data, colWidths=[110, 160, 100, 170])
        t1.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#0F172A')),
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8.5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ]))
        elements.append(t1)
        elements.append(Spacer(1, 12))

        # 3. Dynamic Search Zones Table (Real Values Only)
        elements.append(Paragraph("2. SPATIAL SEARCH PERIMETERS", section_style))
        elements.append(Spacer(1, 4))
        zone_rows = [["Zone Name", "Coordinates", "Radius", "Priority", "Status"]]
        if zones:
            for z in zones:
                zone_rows.append([
                    str(z.get('name', '-')),
                    f"{z.get('center_lat', 0.0):.4f}, {z.get('center_lon', 0.0):.4f}",
                    f"{z.get('radius_m', 0)}m",
                    str(z.get('priority', '-')).upper(),
                    str(z.get('status', 'active')).upper()
                ])
        else:
            zone_rows.append(["No search zones recorded yet", "-", "-", "-", "-"])

        t2 = Table(zone_rows, colWidths=[160, 130, 70, 90, 90])
        t2.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0B1120')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(t2)
        elements.append(Spacer(1, 12))

        # 4. Sighting Verification & Critic Audit (Real Values Only)
        elements.append(Paragraph("3. SIGHTING VERIFICATION & AUDIT LOG", section_style))
        elements.append(Spacer(1, 4))
        sight_rows = [["Location", "Source", "Score", "Status", "Critic Rationale"]]
        if sightings:
            for s in sightings:
                sight_rows.append([
                    str(s.get('location', '-')),
                    str(s.get('source', '-'))[:14],
                    f"{s.get('confidence', 0.0):.2f}",
                    str(s.get('status', 'pending')).upper(),
                    str(s.get('critic_notes', '-'))[:45] + ("..." if len(str(s.get('critic_notes', ''))) > 45 else "")
                ])
        else:
            sight_rows.append(["No sightings submitted yet", "-", "0.00", "-", "Awaiting incoming witness telemetry"])

        t3 = Table(sight_rows, colWidths=[95, 80, 45, 115, 205])
        t3.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 7.5),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(t3)
        elements.append(Spacer(1, 12))

        # 5. Ethical AI Mandate & Human Sign-off Certificate
        elements.append(Paragraph("4. ETHICAL GOVERNANCE & COORDINATOR SIGN-OFF", section_style))
        elements.append(Spacer(1, 4))
        cert_text = (
            "<b>Human-in-the-Loop Governance:</b> AI agents assist in triage and spatial modeling but cannot declare "
            "a person found or close a case. All outbound dispatches require authorization by an accredited coordinator. "
            "Matching is text-based only; no facial recognition or individual tracking is employed."
        )
        elements.append(Paragraph(cert_text, body_style))
        elements.append(Spacer(1, 8))
        elements.append(Paragraph(f"<b>Coordinator Sign-off:</b> {signature_text}", subtitle_style))

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

    except ImportError:
        # Fallback pure PDF writer without external dependencies
        text_content = f"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 320 >> stream
BT
/F1 16 Tf 40 730 Td (LOSTLINK SEARCH & RESCUE DOSSIER) Tj
/F1 10 Tf 0 -25 Td (Case ID: {case_data.get('case_id')} | Status: {case_data.get('status', 'active')}) Tj
0 -18 Td (Subject: {case_data.get('name', 'Unrecorded')} - Age: {case_data.get('age', 0)}) Tj
0 -18 Td (Anchor Location: {case_data.get('last_seen_location', 'None')}) Tj
0 -18 Td (Search Zones Recorded: {len(zones)} | Total Sightings: {len(sightings)}) Tj
0 -25 Td (Coordinator Sign-off: {signature_text}) Tj
0 -18 Td (Zero facial recognition or individual tracking employed.) Tj
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
0000000617 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
694
%%EOF
"""
        return text_content.encode('latin1')
