import os
import json
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_assessment_pdf(assessment_data: dict, filepath: str):
    """
    Generates a PDF report for a given assessment using reportlab.
    """
    doc = SimpleDocTemplate(filepath, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = styles['Heading1']
    title_style.alignment = 1 # Center
    
    subtitle_style = styles['Heading2']
    subtitle_style.textColor = colors.HexColor("#4F46E5")
    
    normal_style = styles['Normal']
    
    Story = []
    
    # Title
    Story.append(Paragraph("Communication Assessment Report", title_style))
    Story.append(Spacer(1, 12))
    
    # Metadata
    Story.append(Paragraph(f"<b>Session Name:</b> {assessment_data.get('session_name', 'N/A')}", normal_style))
    Story.append(Paragraph(f"<b>Email:</b> {assessment_data.get('session_email', 'N/A')}", normal_style))
    Story.append(Paragraph(f"<b>Date:</b> {assessment_data.get('timestamp', '')[:10]}", normal_style))
    Story.append(Spacer(1, 12))
    
    # Parse Assessment JSON
    assmt = assessment_data.get("assessment", {})
    if isinstance(assmt, str):
        try:
            assmt = json.loads(assmt)
        except:
            assmt = {}
            
    overall_score = assmt.get("overall_score", 0)
    Story.append(Paragraph(f"Overall Score: {overall_score}/100", styles['Heading2']))
    Story.append(Spacer(1, 12))
    
    # Criteria Scores Table
    criteria = assmt.get("criteria", {})
    data = [["Criterion", "Score"]]
    for k, v in criteria.items():
        data.append([k.replace("_", " ").title(), f"{v}/25"])
        
    t = Table(data, colWidths=[300, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.grey),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 12),
        ('BACKGROUND', (0,1), (-1,-1), colors.beige),
        ('GRID', (0,0), (-1,-1), 1, colors.black)
    ]))
    Story.append(t)
    Story.append(Spacer(1, 24))
    
    # Deductions
    Story.append(Paragraph("Specific Deductions", subtitle_style))
    Story.append(Spacer(1, 12))
    
    deductions = assmt.get("deductions", [])
    if deductions:
        for ded in deductions:
            Story.append(Paragraph(f"<b>[{ded.get('criterion')}] (-{ded.get('points_lost')} pts)</b>", normal_style))
            Story.append(Paragraph(f"<i>Evidence:</i> \"{ded.get('evidence')}\"", normal_style))
            Story.append(Paragraph(f"<i>Issue:</i> {ded.get('issue')}", normal_style))
            Story.append(Paragraph(f"<i>Correction:</i> {ded.get('correction')}", normal_style))
            Story.append(Spacer(1, 12))
    else:
        Story.append(Paragraph("No deductions recorded. Perfect score!", normal_style))
        
    # Build Document
    doc.build(Story)
    return filepath
