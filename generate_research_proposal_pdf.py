import os
import sys
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, 
    PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

PDF_OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "docs", "ResQRoute_AI_Research_Proposal.pdf")
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
            self.drawString(54, 750, "ResQRoute AI 2.0 | Research Proposal & Global Internship Dossier")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)
            
        # Footer
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_str)
        self.drawString(54, 36, "CONFIDENTIAL & PROPRIETARY | Author: Souradip Ghosh (itssouradip@gmail.com)")
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
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=21,
        leading=25,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#334155'),
        spaceAfter=12
    )
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )
    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.8,
        leading=13,
        textColor=colors.HexColor('#334155'),
        leftIndent=15,
        spaceAfter=3
    )
    caption_style = ParagraphStyle(
        'Caption_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#475569'),
        alignment=1, # Center
        spaceBefore=4,
        spaceAfter=8
    )
    callout_style = ParagraphStyle(
        'Callout_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor('#0F172A')
    )
    table_text = ParagraphStyle(
        'TableText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor('#1E293B')
    )
    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.2,
        leading=11,
        textColor=colors.white
    )

    story = []

    # =========================================================================
    # COVER / HEADER BANNER
    # =========================================================================
    banner_data = [[
        Paragraph("<b>PROJECT RESEARCH PROPOSAL & INTERNSHIP FELLOWSHIP DOSSIER</b>", ParagraphStyle('B1', fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor('#2563EB'))),
        Paragraph("<b>DATE: SEPTEMBER 2026</b>", ParagraphStyle('B2', fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor('#64748B'), alignment=2))
    ]]
    t_banner = Table(banner_data, colWidths=[350, 154])
    t_banner.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_banner)
    story.append(Spacer(1, 8))

    story.append(Paragraph("ResQRoute AI 2.0: Physics-Grounded Collision Telematics, Multi-Modal Acoustic Verification & Tamper-Proof Cloud Forensics", title_style))
    story.append(Paragraph("A Zero-Dependency Embedded AI Framework Engineered for Mixed Unstructured Traffic and Two-Wheeler Safety", subtitle_style))
    
    # Metadata Badge Card
    meta_data = [
        [
            Paragraph("<b>Principal Investigator:</b> Souradip Ghosh<br/><b>Affiliation:</b> AI & Telematics Engineering Lead<br/><b>Email:</b> itssouradip@gmail.com", callout_style),
            Paragraph("<b>Target Venues:</b> Academic Labs (MIT, Berkeley, CMU, TUM, IISc)<br/><b>Industry Labs:</b> Cambridge Mobile Telematics, Zendrive, Bosch, Continental<br/><b>GitHub:</b> github.com/itssouradip34/ResQRoute-2.A", callout_style)
        ]
    ]
    t_meta = Table(meta_data, colWidths=[240, 264])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 12))

    # =========================================================================
    # 1. EXECUTIVE SUMMARY & PROBLEM STATEMENT
    # =========================================================================
    story.append(Paragraph("1. Executive Summary & Problem Formulation", h1_style))
    story.append(Paragraph(
        "Worldwide, road traffic collisions account for over <b>1.19 million deaths annually</b> and more than 50 million severe injuries, with low- and middle-income nations bearing over 90% of the casualties. In India alone, over 168,000 lives are claimed each year on highways and urban arteries. More than 45% of highway collision fatalities occur during the <i>'Golden Hour'</i>—the critical 60-minute window post-crash where rapid trauma care and surgical intervention can drastically reduce mortality.",
        body_style
    ))
    story.append(Paragraph(
        "Commercial smartphone crash detection systems (e.g., Apple Crash Detection, Google Pixel Safety) rely on proprietary models tuned predominantly for passenger vehicles navigating high-income, well-structured highway infrastructure. When deployed in developing countries such as India, these solutions fail catastrophically due to three fundamental domain gaps:",
        body_style
    ))
    story.append(Paragraph("• <b>High False-Alarm Rates from Potholes & Vibrations:</b> Severe road surface unevenness and speed-breakers produce instantaneous vertical accelerations up to 3G, falsely triggering automated emergency calls.", bullet_style))
    story.append(Paragraph("• <b>Motorcycle & Two-Wheeler Blind Spots:</b> Over 70% of vehicles in developing countries are two-wheelers. Normal motorcycle cornering involves high rotational roll velocities (2.5 - 3.2 rad/s) which naive algorithms misclassify as vehicle rollover accidents.", bullet_style))
    story.append(Paragraph("• <b>Stationary Phone Handling False Triggers:</b> At zero speed (t=0, v=0), dropping or vigorously shaking the phone in hand induces high acceleration jerks that trigger false 112 emergency calls.", bullet_style))
    story.append(Paragraph(
        "<b>ResQRoute AI 2.0</b> addresses these challenges through a hybrid architecture combining physics-derived kinematic rule matrices, multi-modal acoustic verification, dynamic driver personalization, and a tamper-proof cryptographic blackbox flight recorder.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # =========================================================================
    # 2. CORE ARCHITECTURE & ZERO .PT PARADIGM
    # =========================================================================
    story.append(Paragraph("2. System Architecture: The Zero-.pt Embedded Paradigm", h1_style))
    story.append(Paragraph(
        "Conventional mobile AI workflows deploy heavyweight neural model containers such as PyTorch Mobile (.pt), TensorFlow Lite (.tflite), or ONNX Runtime. In mission-critical emergency applications, these containers impose significant penalties: 80-150 MB binary bloat, 2-3 second cold-boot initializations, and non-trivial battery consumption that leads operating systems to kill background services.",
        body_style
    ))
    story.append(Paragraph(
        "ResQRoute AI 2.0 establishes a <b>Zero-.pt Pure Matrix Architecture</b>. Neural networks are trained in Python using PyTorch, after which the learned synaptic weights, biases, and normalization parameters are exported into highly compressed JSON parameter tensors. On the client device (React Native / TypeScript), a hand-crafted vectorized forward-pass engine evaluates inferences directly in <b>&lt; 3 milliseconds</b> with zero external native C++ library dependencies.",
        body_style
    ))

    # Architecture summary table
    arch_data = [
        [Paragraph("Subsystem Layer", table_header), Paragraph("Underlying Technology", table_header), Paragraph("Functional Capability", table_header)],
        [
            Paragraph("<b>Kinematic Engine</b>", table_text),
            Paragraph("Vectorized MLP + VZCrash Rules<br/>(Pure TypeScript / JSON)", table_text),
            Paragraph("Evaluates 10 Hz accelerometer, jerk, gyroscope, and speed-drop telemetry. Zero cold-start latency.", table_text)
        ],
        [
            Paragraph("<b>Acoustic Guardian</b>", table_text),
            Paragraph("Audio Mel-Energy Classifier<br/>(Expo Audio + Neural Filter)", table_text),
            Paragraph("Listens for high-decibel metal crunch, glass shatter, and air-bag deployment signatures. Protected by explicit user consent.", table_text)
        ],
        [
            Paragraph("<b>Geospatial Radar</b>", table_text),
            Paragraph("OpenStreetMap Overpass API<br/>+ Haversine Vector Math", table_text),
            Paragraph("Real-time bounding box discovery of hospitals, trauma centers, police stations, and 24x7 recovery services within 15 km.", table_text)
        ],
        [
            Paragraph("<b>Forensic Blackbox</b>", table_text),
            Paragraph("10s Circular Telemetry Buffer<br/>+ SHA-256 Cloud Sync", table_text),
            Paragraph("Cryptographically signs pre-impact dynamics and syncs to Supabase Cloud, ensuring evidence survivability if hardware is destroyed.", table_text)
        ],
    ]
    t_arch = Table(arch_data, colWidths=[100, 160, 244])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 10))

    # =========================================================================
    # 3. KINEMATIC THRESHOLDS & MATHEMATICAL DERIVATION
    # =========================================================================
    story.append(Paragraph("3. Kinematic Thresholds & VZCrash Derivations", h1_style))
    story.append(Paragraph(
        "To ground anomaly detection in real-world vehicle physics, the system is calibrated using the <b>VZCrash dataset</b> (HuggingFace <code>vzc-research-chapter/VZCrash</code>), containing thousands of instrumented multi-vehicle collision records, rollover telemetry, and aggressive non-crash driving maneuvers. ResQRoute partitions kinematic behavior into deterministic rules:",
        body_style
    ))

    thresh_data = [
        [Paragraph("Collision Rule", table_header), Paragraph("Kinematic Condition", table_header), Paragraph("VZCrash Threshold", table_header), Paragraph("System Classification", table_header)],
        [
            Paragraph("<b>Rule A: Obstacle Deceleration</b>", table_text),
            Paragraph("Sudden drop in acceleration, zero chassis roll/pitch", table_text),
            Paragraph("Jerk &ge; 25 m/s³<br/>Speed Drop &ge; 22 km/h<br/>Gyro &lt; 2.0 rad/s", table_text),
            Paragraph("<b>OBSTACLE_FACED</b><br/>(Caution Alert, Driver Query)", table_text)
        ],
        [
            Paragraph("<b>Rule B: Heavy Bump / Pothole</b>", table_text),
            Paragraph("Steady speed, angular oscillation without severe shock", table_text),
            Paragraph("Jerk &lt; 15 m/s³<br/>Speed Drop &le; 5 km/h<br/>Gyro &ge; 2.8 rad/s", table_text),
            Paragraph("<b>HEAVY_BUMP</b><br/>(Filtered / SOS Suppressed)", table_text)
        ],
        [
            Paragraph("<b>Rule C: Vehicular Crash</b>", table_text),
            Paragraph("Simultaneous extreme deceleration shock and violent rotation", table_text),
            Paragraph("Jerk &ge; 25 m/s³<br/>Speed Drop &ge; 22 km/h<br/>Gyro &ge; 2.8 rad/s", table_text),
            Paragraph("<b>POSSIBLE_ACCIDENT</b><br/>(10s Cancelable SOS Trigger)", table_text)
        ],
        [
            Paragraph("<b>Stationary Shake Guard</b>", table_text),
            Paragraph("Violent hand shaking while vehicle is parked (v=0)", table_text),
            Paragraph("Speed Before &lt; 12 km/h<br/>Speed After &lt; 12 km/h", table_text),
            Paragraph("<b>PHONE_SHAKE</b><br/>(Confidence 0.05, Filtered)", table_text)
        ],
        [
            Paragraph("<b>Two-Wheeler Lean Adapter</b>", table_text),
            Paragraph("Motorcycle leaning during high-speed cornering", table_text),
            Paragraph("Gyro Bump Threshold elevated from 2.8 &rarr; <b>3.64 rad/s</b> (+30%)", table_text),
            Paragraph("<b>NORMAL_CORNERING</b><br/>(Prevents false rollover SOS)", table_text)
        ]
    ]
    t_thresh = Table(thresh_data, colWidths=[110, 140, 134, 120])
    t_thresh.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_thresh)
    story.append(Spacer(1, 14))

    # Page Break to start Features with visual plates
    story.append(PageBreak())

    # =========================================================================
    # 4. SYSTEM FEATURES & SCREENSHOT SHOWCASE
    # =========================================================================
    story.append(Paragraph("4. Core Features & Empirical System Showcase", h1_style))
    story.append(Paragraph(
        "Below are high-resolution renderings of the six production screens comprising ResQRoute AI 2.0, demonstrating the end-to-end user workflow from pre-crash kinematics monitoring to live rescue dispatch and tamper-proof forensic auditing.",
        body_style
    ))
    story.append(Spacer(1, 8))

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
            Paragraph("<b>Figure 1:</b> Active Crash Alert HUD showing pre-impact velocity (85 km/h), dual kinematic spike (11.2G), and 10-second cancelable emergency dispatch countdown.", caption_style),
            Paragraph("<b>Figure 2:</b> VZCrash Sensor Lab displaying real-time live telemetry gauges, empirical threshold cards (Rules A/B/C), and interactive physical simulation triggers.", caption_style)
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
    story.append(Spacer(1, 10))

    # =========================================================================
    # 5. DATASETS & MACHINE LEARNING PIPELINE
    # =========================================================================
    story.append(Paragraph("5. Training Datasets & Machine Learning Pipeline", h1_style))
    story.append(Paragraph(
        "To ensure robust generalization, ResQRoute combines empirical telematics benchmarks, acoustic road event corpora, and autonomous driving simulation engines:",
        body_style
    ))

    data_info = [
        [Paragraph("Dataset Corpus", table_header), Paragraph("Primary Domain", table_header), Paragraph("Utilization in ResQRoute AI 2.0", table_header)],
        [
            Paragraph("<b>VZCrash Dataset</b><br/>(HuggingFace vzc-research-chapter)", table_text),
            Paragraph("Vehicle Collision Kinematics", table_text),
            Paragraph("Extracts empirical braking jerks, speed drops (&Delta;V), and rotational yaw/pitch/roll signatures across frontal, rear, and rollover crashes.", table_text)
        ],
        [
            Paragraph("<b>MIVIA Road Audio Events</b><br/>(Univ. of Salerno, Italy)", table_text),
            Paragraph("Road Acoustic Surveillance", table_text),
            Paragraph("Provides ground-truth acoustic recordings of tire screeches and physical vehicle collisions recorded in varied acoustic environments.", table_text)
        ],
        [
            Paragraph("<b>NINA & DeepCrashzam</b><br/>(AXA REV Research / GitHub)", table_text),
            Paragraph("Accident Audio Spectrograms", table_text),
            Paragraph("Acoustic frequency models for metal crushing, shattering safety glass, and high-energy structural deformation sounds.", table_text)
        ],
        [
            Paragraph("<b>Google AudioSet</b><br/>(AudioSet Ontology)", table_text),
            Paragraph("General Acoustic Classes", table_text),
            Paragraph("Negative sampling against non-crash acoustic events (engine rumble, honking, music, heavy rain, thunderstorms).", table_text)
        ],
        [
            Paragraph("<b>CARLA Simulation</b><br/>(Autonomous Driving Engine)", table_text),
            Paragraph("PhysX 3D Dynamic Collisions", table_text),
            Paragraph("Simulation of Indian road conditions (IDD, DriveIndia), modeling unstructured lane behavior and high-angle impact dynamics.", table_text)
        ],
    ]
    t_data = Table(data_info, colWidths=[120, 130, 254])
    t_data.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_data)
    story.append(Spacer(1, 10))

    # Page Break for Roadmap & Target Institutions
    story.append(PageBreak())

    # =========================================================================
    # 6. WHAT AN INTERNSHIP OR FUNDING WILL UNLOCK
    # =========================================================================
    story.append(Paragraph("6. Research Roadmap: What Funding / An Internship Will Unlock", h1_style))
    story.append(Paragraph(
        "While ResQRoute AI 2.0 successfully proves real-time client-side crash inference on smartphones, transitioning this technology to widespread municipal deployment requires dedicated research infrastructure. Funding or a research fellowship will directly empower the following four pillars:",
        body_style
    ))

    story.append(Paragraph("<b>A. Full-Scale Crash Sled & Physical Vehicle Sled Testing:</b>", h2_style))
    story.append(Paragraph(
        "Current validation relies on recorded VZCrash telemetry and simulated software kinematic frames. An internship at an automotive laboratory (e.g., TUM, Bosch, Continental) will allow mounting smartphones in test sleds and instrumented vehicles to evaluate sensor dampening under diverse cabin mounts (dashboard suction, cup holders, air-vent grips, rider jacket pockets).",
        body_style
    ))

    story.append(Paragraph("<b>B. CAN-Bus & OBD-II Bluetooth Multi-Sensor Fusion:</b>", h2_style))
    story.append(Paragraph(
        "Fusing smartphone IMU and acoustic streams with vehicle CAN-bus data (wheel speed, airbag deployment trigger, brake pedal pressure, seatbelt tensioner status) via low-energy Bluetooth dongles to achieve five-nines (99.999%) detection precision.",
        body_style
    ))

    story.append(Paragraph("<b>C. CARLA 3D Digital Twin of Indian Unstructured Traffic:</b>", h2_style))
    story.append(Paragraph(
        "Authoring an open-source CARLA digital twin featuring Indian traffic physics: non-lane-based vehicle squeezing, auto-rickshaws, stray cattle, and uneven road geometries, creating the world's first benchmark suite for two-wheeler accident AI.",
        body_style
    ))

    story.append(Paragraph("<b>D. Direct Dispatch API Integration with National ERSS-112:</b>", h2_style))
    story.append(Paragraph(
        "Establishing encrypted web-socket handshakes with municipal emergency dispatch centers (Dial 112 in India, 911 in the US, 112 in Europe), feeding automated patient vitals, GPS coordinates, and vehicle damage estimates directly onto dispatcher screens.",
        body_style
    ))
    story.append(Spacer(1, 10))

    # =========================================================================
    # 7. TARGET PROFESSORS & ACADEMIC LABS
    # =========================================================================
    story.append(Paragraph("7. Target Academic Professors & Research Labs Worldwide", h1_style))
    story.append(Paragraph(
        "The following leading professors and research groups lead the frontier in Intelligent Transportation Systems (ITS), mobile pervasive sensing, and vehicle crash dynamics, representing ideal advisors for research internships and MS/PhD funding:",
        body_style
    ))

    profs = [
        [Paragraph("Professor / Lab", table_header), Paragraph("Institution & Country", table_header), Paragraph("Research Domain & Alignment", table_header)],
        [
            Paragraph("<b>Prof. Hari Balakrishnan</b><br/>(Co-founder, Cambridge Mobile Telematics)", table_text),
            Paragraph("MIT CSAIL<br/>(Cambridge, USA)", table_text),
            Paragraph("Pioneer of mobile sensor crash detection, CarTel systems, telematics algorithms, and networked sensing.", table_text)
        ],
        [
            Paragraph("<b>Prof. Alexandre Bayen</b><br/>(Director, Institute of Transp. Studies)", table_text),
            Paragraph("UC Berkeley / PATH<br/>(Berkeley, USA)", table_text),
            Paragraph("Connected vehicle safety, mobile traffic estimation, mobile sensing for highway safety and incident response.", table_text)
        ],
        [
            Paragraph("<b>Prof. Bhiksha Raj / Prof. Rita Singh</b><br/>(Speech & Audio Processing Lab)", table_text),
            Paragraph("Carnegie Mellon University<br/>(Pittsburgh, USA)", table_text),
            Paragraph("Acoustic event detection, audio forensics, recognizing physical impacts and sirens in public environments.", table_text)
        ],
        [
            Paragraph("<b>Prof. Alois Knoll</b><br/>(Chair of Robotics & Embedded Systems)", table_text),
            Paragraph("Technical University of Munich<br/>(Munich, Germany)", table_text),
            Paragraph("Autonomous vehicles, digital twin collision simulation, CARLA simulator contributions, active automotive safety.", table_text)
        ],
        [
            Paragraph("<b>Prof. Marco Gruteser</b><br/>(WINLAB Wireless Info Lab)", table_text),
            Paragraph("Rutgers University<br/>(Piscataway, USA)", table_text),
            Paragraph("Vehicular networking, smartphone driver tracking, pedestrian crash warning systems, sensor fusion.", table_text)
        ],
        [
            Paragraph("<b>Prof. Gitakrishnan Ramadurai</b><br/>(Urban Transport CoE)", table_text),
            Paragraph("IIT Madras<br/>(Chennai, India)", table_text),
            Paragraph("Indian driving behavior, heterogeneous non-lane traffic modeling, two-wheeler crash analysis.", table_text)
        ],
        [
            Paragraph("<b>Prof. Rajesh Sundaresan</b><br/>(Robert Bosch Cyber-Physical Systems)", table_text),
            Paragraph("IISc Bangalore<br/>(Bangalore, India)", table_text),
            Paragraph("Cyber-physical transportation networks, smart mobility telematics, road safety algorithms.", table_text)
        ],
    ]
    t_profs = Table(profs, colWidths=[130, 110, 264])
    t_profs.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_profs)
    story.append(Spacer(1, 10))

    # Page Break for Industry & Fellowships
    story.append(PageBreak())

    # =========================================================================
    # 8. TARGET INDUSTRY LABS & CORPORATE SPONSORS
    # =========================================================================
    story.append(Paragraph("8. Target Industry R&D Labs & Telematics Corporations", h1_style))
    story.append(Paragraph(
        "Commercial telematics giants, tier-1 automotive suppliers, and mobility operators invest hundreds of millions annually into smartphone collision detection and digital flight recorders:",
        body_style
    ))

    companies = [
        [Paragraph("Company & Division", table_header), Paragraph("Global Locations", table_header), Paragraph("Strategic Synergy & Internship Scope", table_header)],
        [
            Paragraph("<b>Cambridge Mobile Telematics (CMT)</b><br/>(DriveWell Platform Team)", table_text),
            Paragraph("Boston (USA), London (UK), Tokyo (Japan)", table_text),
            Paragraph("Global market leader in smartphone crash detection. Powers insurance telematics for 21M+ drivers. Direct fit for kinematic ML research.", table_text)
        ],
        [
            Paragraph("<b>Zendrive</b><br/>(Mobility Safety AI Lab)", table_text),
            Paragraph("San Francisco (USA), Bangalore (India)", table_text),
            Paragraph("Pioneers of mobile sensor telematics. Large R&D base in Bangalore focusing on Indian road safety and multi-modal transit.", table_text)
        ],
        [
            Paragraph("<b>Bosch Mobility Solutions</b><br/>(Active Safety & Two-Wheeler Systems)", table_text),
            Paragraph("Stuttgart (Germany), Bangalore (India)", table_text),
            Paragraph("World leader in vehicle stability and eCall hardware. R&D division builds connected motorcycle safety systems (Help Connect).", table_text)
        ],
        [
            Paragraph("<b>Continental Automotive</b><br/>(Passive Safety & Sensorics)", table_text),
            Paragraph("Frankfurt (Germany), Bangalore (India)", table_text),
            Paragraph("Develops crash sensing algorithms, airbag control units, and V2X vehicle-to-cloud emergency warning networks.", table_text)
        ],
        [
            Paragraph("<b>Life360 / Tile</b><br/>(Crash Detection & Family Safety)", table_text),
            Paragraph("San Francisco (USA), Remote Global", table_text),
            Paragraph("Deploys smartphone crash detection to 60M+ families worldwide. Continuously recruits for telematics algorithm optimization.", table_text)
        ],
        [
            Paragraph("<b>Ola Electric & Ather Energy</b><br/>(Connected Vehicle Telematics)", table_text),
            Paragraph("Bangalore (India)", table_text),
            Paragraph("Indian EV OEMs developing intelligent digital instrument clusters. High demand for lean-angle crash detection and automatic SOS.", table_text)
        ],
    ]
    t_comp = Table(companies, colWidths=[130, 110, 264])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_comp)
    story.append(Spacer(1, 10))

    # =========================================================================
    # 9. FUNDED FELLOWSHIPS & APPLICATION PATHWAYS
    # =========================================================================
    story.append(Paragraph("9. Funded Global Fellowship Programs & Application Strategy", h1_style))
    story.append(Paragraph(
        "Applicants from India can leverage institutional funding grants to support their research stay at partner universities:",
        body_style
    ))

    grants = [
        ("DAAD WISE (Germany)", "Fully funded summer research internships for Indian students in German universities (TUM, RWTH Aachen, KIT). Stipend: ~934 EUR/month + travel allowance."),
        ("Mitacs Globalink Research Internship (Canada)", "12-week funded research stay at top Canadian institutions (Toronto, Waterloo, McGill) in transportation AI and mobile telematics."),
        ("Charpak Global Internship (France)", "Funded internship scholarship across French engineering laboratories (INRIA, Sorbonne, CentraleSupélec) covering living allowances."),
        ("Viterbi-India Program (USC) & SN Bose Scholars (USA)", "Prestigious summer research fellowships supporting top Indian engineering undergraduates at premier US research institutions."),
        ("Corporate R&D Internships (CMT, Zendrive, Bosch)", "Directly sponsored corporate internships offering industry-standard competitive compensation, housing stipends, and patent co-authorship."),
    ]
    for name, desc in grants:
        story.append(Paragraph(f"• <b>{name}:</b> {desc}", bullet_style))
        
    story.append(Spacer(1, 8))

    # =========================================================================
    # 10. CONCLUSION & CONTACT
    # =========================================================================
    story.append(Paragraph("10. Conclusion & Call for Collaboration", h1_style))
    story.append(Paragraph(
        "<b>ResQRoute AI 2.0</b> represents a proven, high-performance paradigm for democratic vehicle safety. By delivering millisecond collision detection, acoustic crunch verification, and tamper-proof cloud forensics directly on commodity smartphones, it eliminates the need for expensive proprietary hardware and bridges the safety gap for millions of vulnerable road users worldwide.",
        body_style
    ))
    story.append(Paragraph(
        "<b>We invite academic laboratories, automotive researchers, and telematics industry leaders to partner with us for research fellowships, crash-sled validation, and pilot deployments.</b>",
        body_style
    ))
    
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=8))
    
    footer_table_data = [
        [
            Paragraph("<b>Repository:</b> <font color='#2563EB'><u>github.com/itssouradip34/ResQRoute-2.A</u></font><br/><b>Primary Tech Stack:</b> React Native, Expo Sensors, PyTorch, Supabase, Overpass API", callout_style),
            Paragraph("<b>Direct Contact:</b> Souradip Ghosh<br/><b>Email:</b> <font color='#2563EB'><u>itssouradip@gmail.com</u></font><br/><b>Location:</b> New Delhi, India", callout_style)
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
    print(f"PDF successfully built at: {PDF_OUTPUT_PATH}")

if __name__ == "__main__":
    build_pdf()
