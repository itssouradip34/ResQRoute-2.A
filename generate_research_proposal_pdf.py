import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, 
    PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

PDF_OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "docs", "ResQRoute_AI_Research_Proposal.pdf")
ROOT_PDF_PATH = os.path.join(os.path.dirname(__file__), "ResQRoute_AI_Research_Proposal.pdf")
SCREENSHOTS_DIR = os.path.join(os.path.dirname(__file__), "docs", "screenshots")

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "ResQRoute AI 2.0: Technical Research Proposal | Souradip Patra (IISER Bhopal)")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)
            
        # Footer
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_str)
        self.drawString(54, 36, "Author: Souradip Patra | Student, DSE, IISER Bhopal | souradip25@gmail.com")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 48, 558, 48)
        self.restoreState()

def build_pdf():
    doc = SimpleDocTemplate(
        PDF_OUTPUT_PATH,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Custom typography
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=5
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=14.5,
        textColor=colors.HexColor('#334155'),
        spaceAfter=10
    )
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=12,
        spaceAfter=5,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.8,
        leading=13,
        textColor=colors.HexColor('#334155'),
        spaceAfter=5
    )
    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor('#334155'),
        leftIndent=14,
        spaceAfter=3
    )
    caption_style = ParagraphStyle(
        'Caption_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.8,
        leading=10.5,
        textColor=colors.HexColor('#475569'),
        alignment=1, # Center
        spaceBefore=3,
        spaceAfter=7
    )
    callout_style = ParagraphStyle(
        'Callout_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.2,
        leading=12,
        textColor=colors.HexColor('#0F172A')
    )
    table_text = ParagraphStyle(
        'TableText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.5,
        textColor=colors.HexColor('#1E293B')
    )
    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.white
    )

    story = []

    # =========================================================================
    # HEADER BANNER & AUTHOR METADATA
    # =========================================================================
    banner_data = [[
        Paragraph("<b>TECHNICAL RESEARCH PROPOSAL & SYSTEM WHITEPAPER</b>", ParagraphStyle('B1', fontName='Helvetica-Bold', fontSize=8.5, textColor=colors.HexColor('#2563EB'))),
        Paragraph("<b>DATE: SEPTEMBER 2026</b>", ParagraphStyle('B2', fontName='Helvetica-Bold', fontSize=8.5, textColor=colors.HexColor('#64748B'), alignment=2))
    ]]
    t_banner = Table(banner_data, colWidths=[350, 154])
    t_banner.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_banner)
    story.append(Spacer(1, 6))

    story.append(Paragraph("ResQRoute AI 2.0: Physics-Grounded Collision Telematics, Multi-Modal Acoustic Verification & Tamper-Proof Cloud Forensics", title_style))
    story.append(Paragraph("An Embedded Zero-Dependency Edge Architecture Engineered for Unstructured Mixed Traffic and Two-Wheeler Safety", subtitle_style))
    
    # Metadata Badge Card - PROPER AUTHOR INFO
    meta_data = [
        [
            Paragraph("<b>Author:</b> Souradip Patra<br/><b>Department:</b> Data Science & Engineering (DSE), 2nd Year<br/><b>Institution:</b> Indian Institute of Science Education and Research (IISER) Bhopal", callout_style),
            Paragraph("<b>Email:</b> souradip25@gmail.com<br/><b>Open-Source Repository:</b> github.com/itssouradip34/ResQRoute-2.A<br/><b>Primary Focus:</b> Mobile Sensor Computing, Collision Telematics, Edge AI", callout_style)
        ]
    ]
    t_meta = Table(meta_data, colWidths=[270, 234])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 9),
        ('RIGHTPADDING', (0,0), (-1,-1), 9),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 10))

    # =========================================================================
    # 1. ABSTRACT & PROBLEM STATEMENT
    # =========================================================================
    story.append(Paragraph("1. Abstract & Problem Formulation", h1_style))
    story.append(Paragraph(
        "Worldwide, road traffic collisions claim over <b>1.19 million lives every year</b>, with over 90% of casualties occurring in developing nations. In India alone, road accidents cause more than 168,000 fatalities and 450,000 debilitating injuries annually. Over 45% of highway collision fatalities occur during the critical <i>'Golden Hour'</i>—the first 60 minutes where rapid trauma retrieval directly dictates clinical survival.",
        body_style
    ))
    story.append(Paragraph(
        "Existing commercial crash detection algorithms (e.g., Apple Crash Detection, Google Pixel Safety) rely on proprietary models calibrated primarily for structured highways and four-wheeled enclosed vehicles. When deployed in unstructured, developing traffic environments, they suffer from critical operational failures:",
        body_style
    ))
    story.append(Paragraph("• <b>Extreme False Positives from Road Anomalies:</b> Potholes, sudden speed-breakers, and rumble strips generate vertical acceleration spikes up to 3G, overwhelming emergency dispatchers with false alarms.", bullet_style))
    story.append(Paragraph("• <b>Two-Wheeler Dynamics Blind Spot:</b> Two-wheelers represent >70% of traffic in developing nations. Standard motorcycle cornering reaches rotational roll velocities exceeding 2.5 rad/s, which commercial algorithms frequently misclassify as vehicle rollover accidents.", bullet_style))
    story.append(Paragraph("• <b>Stationary Phone Shake False Triggers:</b> When a vehicle is parked or stationary (t=0, v=0), dropping or vigorously shaking the smartphone produces high jerk values that trigger false 112 emergency calls.", bullet_style))
    story.append(Paragraph(
        "<b>ResQRoute AI 2.0</b> addresses these fundamental limitations through a unified, zero-dependency embedded telematics engine combining empirical kinematic rule matrices, multi-modal acoustic crunch verification, dynamic driver personalization, and a cryptographic flight recorder.",
        body_style
    ))
    story.append(Spacer(1, 6))

    # =========================================================================
    # 2. SYSTEM ARCHITECTURE & ZERO .PT PARADIGM
    # =========================================================================
    story.append(Paragraph("2. Embedded Architecture: The Zero-.pt Paradigm", h1_style))
    story.append(Paragraph(
        "Standard mobile machine learning deployments rely on heavyweight frameworks such as PyTorch Mobile (.pt), TensorFlow Lite (.tflite), or ONNX Runtime. In emergency life-safety applications, these frameworks introduce severe drawbacks: 80–150 MB binary bloat, 2–3 second cold-boot latencies, and heavy RAM consumption that causes mobile OS task-managers to kill background listeners.",
        body_style
    ))
    story.append(Paragraph(
        "ResQRoute AI 2.0 introduces a <b>Zero-.pt Pure Matrix Architecture</b>. Neural networks are trained in Python on empirical crash telemetry, after which synaptic weights, biases, and activation parameters are exported into lightweight, compressed JSON tensors. In the mobile client, a hand-crafted vectorized forward-pass engine computes inferences directly in <b>&lt; 3 milliseconds</b> with zero external native C++ dependencies, eliminating cold starts entirely.",
        body_style
    ))

    # Table: System Architectural Layers
    arch_data = [
        [Paragraph("Subsystem Layer", table_header), Paragraph("Underlying Stack", table_header), Paragraph("Technical Specification", table_header)],
        [
            Paragraph("<b>Kinematic Engine</b>", table_text),
            Paragraph("Vectorized MLP + VZCrash Rules<br/>(Pure TypeScript / JSON)", table_text),
            Paragraph("Processes 10 Hz accelerometer, jerk, gyroscope, and speed-drop telemetry. Computes continuous forward-pass classification in &lt;3 ms.", table_text)
        ],
        [
            Paragraph("<b>Acoustic Guardian</b>", table_text),
            Paragraph("Mel-Energy Feedforward Net<br/>(Expo Audio + Consent Guard)", table_text),
            Paragraph("Classifies short-time energy, spectral centroid, and metal crunch/glass shatter signatures upon kinematic shock triggers. Guarded by strict user consent.", table_text)
        ],
        [
            Paragraph("<b>Geospatial Radar</b>", table_text),
            Paragraph("OpenStreetMap Overpass API<br/>+ Haversine Vector Math", table_text),
            Paragraph("Discovers nearest Level-1 trauma centers, police stations, and 24x7 highway rescue units within a 15 km bounding box with turn-by-turn routing.", table_text)
        ],
        [
            Paragraph("<b>Forensic Flight Recorder</b>", table_text),
            Paragraph("10s Rolling Telemetry Buffer<br/>+ SHA-256 Cloud Sync", table_text),
            Paragraph("Maintains a continuous 100-frame pre-impact circular buffer. Signs the telemetry payload with an immutable SHA-256 seal synced to Supabase Cloud.", table_text)
        ],
    ]
    t_arch = Table(arch_data, colWidths=[105, 155, 244])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 8))

    # =========================================================================
    # 3. KINEMATIC THRESHOLDS & VZCRASH BENCHMARKS
    # =========================================================================
    story.append(Paragraph("3. Empirical Kinematic Thresholds & Mathematical Rules", h1_style))
    story.append(Paragraph(
        "To establish deterministic safety bounds, the engine is calibrated using the <b>VZCrash dataset</b> (HuggingFace <code>vzc-research-chapter/VZCrash</code>), comprising thousands of multi-vehicle crash pulses, rollover dynamics, and aggressive non-crash driving profiles. The system categorizes motion into deterministic physics rules:",
        body_style
    ))

    thresh_data = [
        [Paragraph("Collision Rule", table_header), Paragraph("Kinematic Condition", table_header), Paragraph("VZCrash Threshold", table_header), Paragraph("Output & Dispatch Behavior", table_header)],
        [
            Paragraph("<b>Rule A: Obstacle Deceleration</b>", table_text),
            Paragraph("Sudden drop in acceleration, zero chassis roll/pitch", table_text),
            Paragraph("Jerk &ge; 25 m/s³<br/>Speed Drop &ge; 22 km/h<br/>Gyro &lt; 2.0 rad/s", table_text),
            Paragraph("<b>OBSTACLE_FACED</b><br/>Driver caution alert; no SOS.", table_text)
        ],
        [
            Paragraph("<b>Rule B: Heavy Bump / Pothole</b>", table_text),
            Paragraph("Steady speed, angular oscillation without severe shock", table_text),
            Paragraph("Jerk &lt; 15 m/s³<br/>Speed Drop &le; 5 km/h<br/>Gyro &ge; 2.8 rad/s", table_text),
            Paragraph("<b>HEAVY_BUMP</b><br/>Suppressed; prevents false alarm.", table_text)
        ],
        [
            Paragraph("<b>Rule C: Vehicular Crash</b>", table_text),
            Paragraph("Simultaneous extreme deceleration shock and violent rotation", table_text),
            Paragraph("Jerk &ge; 25 m/s³<br/>Speed Drop &ge; 22 km/h<br/>Gyro &ge; 2.8 rad/s", table_text),
            Paragraph("<b>POSSIBLE_ACCIDENT</b><br/>10s Cancelable SOS Trigger.", table_text)
        ],
        [
            Paragraph("<b>Stationary Shake Guard</b>", table_text),
            Paragraph("Violent hand shaking while vehicle is parked (v=0)", table_text),
            Paragraph("Speed Before &lt; 12 km/h<br/>Speed After &lt; 12 km/h", table_text),
            Paragraph("<b>PHONE_SHAKE</b><br/>Confidence 0.05; SOS blocked.", table_text)
        ],
        [
            Paragraph("<b>Two-Wheeler Lean Adapter</b>", table_text),
            Paragraph("Motorcycle leaning during high-speed cornering", table_text),
            Paragraph("Gyro Bump Threshold elevated from 2.8 &rarr; <b>3.64 rad/s</b> (+30%)", table_text),
            Paragraph("<b>NORMAL_CORNERING</b><br/>Allows safe rider lean angles.", table_text)
        ]
    ]
    t_thresh = Table(thresh_data, colWidths=[110, 140, 134, 120])
    t_thresh.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_thresh)
    story.append(Spacer(1, 10))

    # Page Break for Visual Feature Showcase
    story.append(PageBreak())

    # =========================================================================
    # 4. SYSTEM FEATURES & VISUAL ARCHITECTURE PLATES
    # =========================================================================
    story.append(Paragraph("4. System Features & Visual Architecture Gallery", h1_style))
    story.append(Paragraph(
        "The following figures present high-resolution visual plates of the six core interfaces engineered in ResQRoute AI 2.0, demonstrating the complete user journey from real-time kinematic monitoring to emergency dispatch and post-accident forensics:",
        body_style
    ))
    story.append(Spacer(1, 6))

    # Plate 1: Home SOS & Sensor Lab
    img1_path = os.path.join(SCREENSHOTS_DIR, "screen_home_sos.png")
    img2_path = os.path.join(SCREENSHOTS_DIR, "screen_sensor_lab.png")

    img_w, img_h = 240, 480
    plate1_data = [
        [
            RLImage(img1_path, width=img_w, height=img_h) if os.path.exists(img1_path) else Paragraph("Image 1 Missing", body_style),
            RLImage(img2_path, width=img_w, height=img_h) if os.path.exists(img2_path) else Paragraph("Image 2 Missing", body_style)
        ],
        [
            Paragraph("<b>Figure 1:</b> Active Crash Alert HUD displaying pre-impact velocity (85 km/h), dual kinematic shock (11.2G), acoustic validation tag, and 10-second cancelable SOS countdown.", caption_style),
            Paragraph("<b>Figure 2:</b> VZCrash Sensor Lab displaying live telemetry gauges (accelerometer, jerk, gyroscope), empirical threshold rule cards (Rules A/B/C), and interactive physical simulation triggers.", caption_style)
        ]
    ]
    t_plate1 = Table(plate1_data, colWidths=[252, 252])
    t_plate1.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_plate1)
    story.append(PageBreak())

    # Plate 2: Services Radar & Forensic Blackbox
    img3_path = os.path.join(SCREENSHOTS_DIR, "screen_live_services.png")
    img4_path = os.path.join(SCREENSHOTS_DIR, "screen_forensics.png")

    plate2_data = [
        [
            RLImage(img3_path, width=img_w, height=img_h) if os.path.exists(img3_path) else Paragraph("Image 3 Missing", body_style),
            RLImage(img4_path, width=img_w, height=img_h) if os.path.exists(img4_path) else Paragraph("Image 4 Missing", body_style)
        ],
        [
            Paragraph("<b>Figure 3:</b> Live GPS Emergency Radar querying OpenStreetMap Overpass within 15 km, computing Haversine distances, azimuth bearings, and direct 112/108 calling.", caption_style),
            Paragraph("<b>Figure 4:</b> Forensic Blackbox displaying 10-second pre-crash telemetry waveforms (10 Hz), impact vector analysis, and SHA-256 sealed police investigation dossiers.", caption_style)
        ]
    ]
    t_plate2 = Table(plate2_data, colWidths=[252, 252])
    t_plate2.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_plate2)
    story.append(PageBreak())

    # Plate 3: Driver Profile & AI Triage
    img5_path = os.path.join(SCREENSHOTS_DIR, "screen_auth_personalized.png")
    img6_path = os.path.join(SCREENSHOTS_DIR, "screen_ai_triage.png")

    plate3_data = [
        [
            RLImage(img5_path, width=img_w, height=img_h) if os.path.exists(img5_path) else Paragraph("Image 5 Missing", body_style),
            RLImage(img6_path, width=img_w, height=img_h) if os.path.exists(img6_path) else Paragraph("Image 6 Missing", body_style)
        ],
        [
            Paragraph("<b>Figure 5:</b> Driver Authentication & Personalization UI dynamically calibrating lean angles for two-wheelers and clutch-stall buffers for novice motorists.", caption_style),
            Paragraph("<b>Figure 6:</b> Bilingual AI Emergency Triage Chat providing immediate life-saving first-response instructions and direct ambulance dispatch triage.", caption_style)
        ]
    ]
    t_plate3 = Table(plate3_data, colWidths=[252, 252])
    t_plate3.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_plate3)
    story.append(Spacer(1, 8))

    # =========================================================================
    # 5. DATASETS & MACHINE LEARNING PIPELINE
    # =========================================================================
    story.append(Paragraph("5. Training Datasets & Multi-Modal Verification", h1_style))
    story.append(Paragraph(
        "To achieve high generalization across heterogeneous vehicle types and road conditions, ResQRoute incorporates multi-source open datasets:",
        body_style
    ))

    data_info = [
        [Paragraph("Dataset Corpus", table_header), Paragraph("Primary Domain", table_header), Paragraph("Utilization in ResQRoute AI 2.0", table_header)],
        [
            Paragraph("<b>VZCrash Dataset</b><br/>(HuggingFace vzc-research)", table_text),
            Paragraph("Vehicle Collision Kinematics", table_text),
            Paragraph("Provides ground-truth braking jerk, delta-V speed loss, and angular rotational momentum during frontal, side, and rollover impacts.", table_text)
        ],
        [
            Paragraph("<b>MIVIA Road Audio Events</b><br/>(Univ. of Salerno)", table_text),
            Paragraph("Acoustic Road Surveillance", table_text),
            Paragraph("Real-world audio recordings of tire skids, sudden braking, and mechanical impacts in varied acoustic noise environments.", table_text)
        ],
        [
            Paragraph("<b>NINA & DeepCrashzam</b><br/>(AXA REV Research / GitHub)", table_text),
            Paragraph("Vehicle Crash Acoustics", table_text),
            Paragraph("High-energy acoustic spectrograms capturing structural metal deformation, air-bag detonations, and glass shatter frequencies.", table_text)
        ],
        [
            Paragraph("<b>Google AudioSet</b><br/>(AudioSet Ontology)", table_text),
            Paragraph("Environmental Noise Sampling", table_text),
            Paragraph("Negative training samples to suppress non-crash audio events (traffic horns, engine rumble, loud music, thunderstorms, heavy rain).", table_text)
        ],
        [
            Paragraph("<b>CARLA Simulation</b><br/>(Autonomous Vehicle Engine)", table_text),
            Paragraph("PhysX 3D Dynamic Collisions", table_text),
            Paragraph("Rigid-body collision simulation across Indian driving benchmarks (IDD, DriveIndia), modeling non-lane traffic and oblique angle impacts.", table_text)
        ],
    ]
    t_data = Table(data_info, colWidths=[120, 130, 254])
    t_data.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_data)
    story.append(Spacer(1, 10))

    # Page Break for Research Roadmap & Technical Stack
    story.append(PageBreak())

    # =========================================================================
    # 6. SYSTEM STACK & APIS USED
    # =========================================================================
    story.append(Paragraph("6. Production Technology Stack & APIs", h1_style))
    story.append(Paragraph(
        "ResQRoute AI 2.0 is built on a modern, decoupled reactive architecture separating high-speed client-side edge computation from scalable cloud persistence:",
        body_style
    ))

    stack_data = [
        [Paragraph("Component", table_header), Paragraph("Technology / API", table_header), Paragraph("Technical Role & Implementation Details", table_header)],
        [
            Paragraph("<b>Frontend Framework</b>", table_text),
            Paragraph("React Native (v0.86) + Expo (SDK 57)", table_text),
            Paragraph("Cross-platform native mobile runtime delivering 60 FPS animated UI and low-level hardware sensor bindings.", table_text)
        ],
        [
            Paragraph("<b>Hardware Sensors</b>", table_text),
            Paragraph("Expo Sensors (Accelerometer, Gyroscope, DeviceMotion)", table_text),
            Paragraph("Samples continuous 10 Hz 3-axis acceleration and angular rate vectors, computing real-time vector magnitudes and jerk derivatives.", table_text)
        ],
        [
            Paragraph("<b>Geospatial Engine</b>", table_text),
            Paragraph("Expo Location + OpenStreetMap Overpass API", table_text),
            Paragraph("High-accuracy GPS tracking paired with live Overpass QL queries to dynamically discover emergency medical and rescue infrastructure.", table_text)
        ],
        [
            Paragraph("<b>Acoustic Engine</b>", table_text),
            Paragraph("Expo Audio (Audio.Recording)", table_text),
            Paragraph("Low-latency buffered audio feature extractor guarded by explicit in-app user consent modal.", table_text)
        ],
        [
            Paragraph("<b>Cloud & Database</b>", table_text),
            Paragraph("Supabase (PostgreSQL + Auth + Edge Functions)", table_text),
            Paragraph("Encrypted driver profile storage, remote incident syncing, and cloud forensic packet persistence.", table_text)
        ],
        [
            Paragraph("<b>Emergency Comms</b>", table_text),
            Paragraph("Expo SMS + Native Dialer + Mock Telephony", table_text),
            Paragraph("Automated SMS dispatch with Google Maps pinpoint coordinates and direct one-touch 112 / 108 emergency telephony integration.", table_text)
        ],
    ]
    t_stack = Table(stack_data, colWidths=[110, 150, 244])
    t_stack.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_stack)
    story.append(Spacer(1, 10))

    # =========================================================================
    # 7. RESEARCH ROADMAP: WHERE FUNDING / LAB COLLABORATION WILL HELP
    # =========================================================================
    story.append(Paragraph("7. Research Roadmap: Objectives for Lab Collaboration", h1_style))
    story.append(Paragraph(
        "While ResQRoute AI 2.0 demonstrates real-time client-side crash inference on commodity smartphones, transitioning to an automotive-grade certified safety standard requires research laboratory infrastructure. An academic research internship or industrial grant will enable the following milestones:",
        body_style
    ))

    story.append(Paragraph("<b>A. Physical Crash-Sled and Instrumented Vehicle Testing:</b>", h2_style))
    story.append(Paragraph(
        "Current validation relies on recorded VZCrash telemetry and simulated software kinematic pulses. Collaborating with an automotive laboratory will enable mounting smartphones across diverse cabin configurations (dashboard suction mounts, cup holders, magnetic air-vent brackets, rider jacket pockets) during physical crash-sled impacts, validating structural dampening and vibration transfer.",
        body_style
    ))

    story.append(Paragraph("<b>B. CAN-Bus & OBD-II Bluetooth Sensor Fusion:</b>", h2_style))
    story.append(Paragraph(
        "Fusing smartphone IMU and acoustic signals with vehicle CAN-bus parameters (wheel-speed encoders, airbag deployment trigger squibs, brake pedal pressure, seatbelt pre-tensioner status) via Bluetooth Low Energy (BLE) dongles to achieve five-nines (99.999%) detection precision.",
        body_style
    ))

    story.append(Paragraph("<b>C. CARLA 3D Digital Twin of Indian Unstructured Traffic:</b>", h2_style))
    story.append(Paragraph(
        "Building an open-source CARLA digital twin modeling Indian traffic conditions: non-lane vehicle filtering, auto-rickshaws, stray hazards, and heterogeneous speed variance, establishing the first benchmark suite for two-wheeler accident AI.",
        body_style
    ))

    story.append(Paragraph("<b>D. Direct Dispatch API Integration with National ERSS-112:</b>", h2_style))
    story.append(Paragraph(
        "Establishing authenticated, encrypted dispatch handshakes with municipal Emergency Response Support Systems (Dial 112 in India, 911 in North America, 112 in Europe), feeding live victim location, impact severity, and pre-crash telemetry directly onto operator CAD terminals.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # =========================================================================
    # 8. CONCLUSION & PROJECT DETAILS
    # =========================================================================
    story.append(Paragraph("8. Conclusion & Availability for Research", h1_style))
    story.append(Paragraph(
        "<b>ResQRoute AI 2.0</b> demonstrates a feasible, democratic paradigm for universal road traffic safety. By implementing millisecond crash detection, acoustic validation, dynamic driver personalization, and tamper-proof forensics directly on standard smartphones, it eliminates the requirement for expensive proprietary telematics hardware.",
        body_style
    ))
    story.append(Paragraph(
        "As a 2nd year Data Science & Engineering undergraduate at IISER Bhopal, I am actively seeking research internship opportunities and academic collaborations to advance physical crash-sled validation, edge sensor fusion, and large-scale deployment.",
        body_style
    ))
    
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=6))
    
    footer_table_data = [
        [
            Paragraph("<b>Repository:</b> <font color='#2563EB'><u>github.com/itssouradip34/ResQRoute-2.A</u></font><br/><b>Technology Stack:</b> React Native, Expo Sensors, PyTorch, Supabase, Overpass API", callout_style),
            Paragraph("<b>Author:</b> Souradip Patra<br/><b>Department:</b> Data Science & Engineering, IISER Bhopal<br/><b>Email:</b> <font color='#2563EB'><u>souradip25@gmail.com</u></font>", callout_style)
        ]
    ]
    t_foot = Table(footer_table_data, colWidths=[270, 234])
    t_foot.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_foot)

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    
    # Also copy to root for instant access
    import shutil
    shutil.copyfile(PDF_OUTPUT_PATH, ROOT_PDF_PATH)
    print(f"PDF successfully built at:\n - {PDF_OUTPUT_PATH}\n - {ROOT_PDF_PATH}")

if __name__ == "__main__":
    build_pdf()
