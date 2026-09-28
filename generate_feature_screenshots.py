import os
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "docs", "screenshots")
os.makedirs(OUTPUT_DIR, exist_ok=True)

DARK_BG = "#0D1117"
CARD_BG = "#161B22"
BORDER = "#30363D"
TEXT_WHITE = "#F0F6FC"
TEXT_MUTED = "#8B949E"
RED = "#FF4D4D"
GREEN = "#3FB950"
BLUE = "#58A6FF"
AMBER = "#D29922"
PURPLE = "#BC8CFF"

def create_phone_frame(title="ResQRoute AI 2.0"):
    fig, ax = plt.subplots(figsize=(4.2, 8.4), dpi=200)
    fig.patch.set_facecolor(DARK_BG)
    ax.set_facecolor(DARK_BG)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 200)
    ax.axis('off')
    
    # Header bar
    ax.add_patch(patches.Rectangle((0, 182), 100, 18, color=CARD_BG, ec=BORDER, lw=1))
    ax.text(8, 191, "RESQROUTE-A | " + title, color=TEXT_WHITE, fontsize=9.5, weight='bold', va='center')
    ax.text(92, 191, "ONLINE (100%)", color=GREEN, fontsize=7.5, weight='bold', ha='right', va='center')
    ax.text(8, 185, "Zero .pt Embedded Engine | India Edition", color=TEXT_MUTED, fontsize=6.5, va='center')
    
    # Bottom tab bar
    ax.add_patch(patches.Rectangle((0, 0), 100, 14, color=CARD_BG, ec=BORDER, lw=1))
    tabs = ["Home", "Sensors", "Services", "Triage", "Forensics"]
    for i, tab in enumerate(tabs):
        color = BLUE if i == 0 else TEXT_MUTED
        ax.text(10 + i * 20, 7, tab, color=color, fontsize=6.5, weight='bold', ha='center', va='center')
        
    return fig, ax

# 1. SCREENSHOT: HOME / SOS CRASH ALERT
def generate_home_sos():
    fig, ax = create_phone_frame("SOS Active")
    
    # Crash alert card
    rect = patches.FancyBboxPatch((6, 120), 88, 56, boxstyle="round,pad=1,rounding_size=3", color="#3D1214", ec=RED, lw=2)
    ax.add_patch(rect)
    ax.text(50, 168, "! HIGHWAY COLLISION DETECTED !", color=RED, fontsize=9.5, weight='bold', ha='center')
    ax.text(50, 161, "VZCrash Rule C: Dual Kinematic Spike + Acoustic Thud", color=TEXT_WHITE, fontsize=6.5, ha='center')
    
    # SOS Countdown Circle
    circle = patches.Circle((50, 141), 12, color=RED, ec="#FF7B72", lw=2.5)
    ax.add_patch(circle)
    ax.text(50, 142, "07", color="white", fontsize=15, weight='bold', ha='center', va='center')
    ax.text(50, 134, "SEC TO SOS", color="#FFA198", fontsize=5.5, weight='bold', ha='center')
    
    ax.text(50, 124, "Auto-dispatching to 112 ERSS & 3 Trusted Contacts", color="#FFA198", fontsize=6, ha='center')
    
    # Telemetry Snapshot Card
    rect2 = patches.FancyBboxPatch((6, 68), 88, 48, boxstyle="round,pad=1,rounding_size=3", color=CARD_BG, ec=BORDER, lw=1)
    ax.add_patch(rect2)
    ax.text(10, 110, "IMPACT TELEMETRY SNAPSHOT", color=TEXT_WHITE, fontsize=7.5, weight='bold')
    
    # Metric badges
    metrics = [
        ("Peak Accel", "11.2 G", RED, 10, 94),
        ("Braking Jerk", "45 m/s3", RED, 52, 94),
        ("Pre-Crash Speed", "85 km/h", BLUE, 10, 76),
        ("Acoustic Model", "CRASH_98%", PURPLE, 52, 76),
    ]
    for label, val, col, x, y in metrics:
        ax.add_patch(patches.FancyBboxPatch((x, y), 38, 14, boxstyle="round,pad=0.5,rounding_size=1.5", color="#21262D", ec=BORDER, lw=0.8))
        ax.text(x + 2, y + 9, label, color=TEXT_MUTED, fontsize=5)
        ax.text(x + 2, y + 3, val, color=col, fontsize=7.5, weight='bold')
        
    # Cancel / False Alarm Button
    ax.add_patch(patches.FancyBboxPatch((10, 48), 80, 14, boxstyle="round,pad=1,rounding_size=2", color="#238636", ec=GREEN, lw=1))
    ax.text(50, 55, "I AM SAFE (CANCEL COUNTDOWN)", color="white", fontsize=7.5, weight='bold', ha='center', va='center')
    
    # False Alarm Filter Badge
    ax.add_patch(patches.FancyBboxPatch((10, 20), 80, 22, boxstyle="round,pad=1,rounding_size=2", color=CARD_BG, ec=BORDER, lw=1))
    ax.text(50, 36, "[GUARD] ZERO-SPEED SHAKE GUARD ACTIVE", color=GREEN, fontsize=6.5, weight='bold', ha='center')
    ax.text(50, 28, "Stationary phone shaking at v=0 km/h is automatically", color=TEXT_MUTED, fontsize=5.5, ha='center')
    ax.text(50, 23, "filtered out to guarantee zero false 112 emergency calls.", color=TEXT_MUTED, fontsize=5.5, ha='center')
    
    path = os.path.join(OUTPUT_DIR, "screen_home_sos.png")
    plt.savefig(path, bbox_inches='tight', facecolor=DARK_BG, dpi=200)
    plt.close()
    return path

# 2. SCREENSHOT: SENSOR LAB & VZCRASH THRESHOLDS
def generate_sensor_lab():
    fig, ax = create_phone_frame("Sensor Lab")
    
    ax.text(8, 175, "VZCRASH PHYSICS BENCHMARK LAB", color=TEXT_WHITE, fontsize=8, weight='bold')
    ax.text(8, 170, "Calibrated against HuggingFace vzc-research-chapter/VZCrash", color=BLUE, fontsize=5.5)
    
    # Rule Cards
    rules = [
        ("RULE A: OBSTACLE FACED", "Drop in Accel | Steady Gyro | Jerk >= 25 m/s3", AMBER, 134, "Obstacle Decel"),
        ("RULE B: HEAVY BUMP / POTHOLE", "Steady Accel | High Angular Gyro >= 2.8 rad/s", BLUE, 102, "Filtered (No SOS)"),
        ("RULE C: HIGHWAY COLLISION", "Dual Jerk >= 25 m/s3 + Gyro >= 2.8 rad/s", RED, 70, "CRITICAL SOS"),
        ("STATIONARY FILTER (v=0)", "Hand shake at T=0, V=0 suppressed as PHONE_SHAKE", GREEN, 38, "Confidence 0.05"),
    ]
    
    for title, desc, col, y, outcome in rules:
        rect = patches.FancyBboxPatch((6, y), 88, 28, boxstyle="round,pad=1,rounding_size=2.5", color=CARD_BG, ec=col, lw=1.2)
        ax.add_patch(rect)
        ax.text(10, y + 22, title, color=col, fontsize=6.5, weight='bold')
        ax.text(10, y + 14, desc, color=TEXT_MUTED, fontsize=5)
        
        # Progress bar mockup
        ax.add_patch(patches.Rectangle((10, y + 5), 45, 3, color="#30363D"))
        fill_w = 40 if "RULE C" in title else (25 if "RULE A" in title else 12)
        ax.add_patch(patches.Rectangle((10, y + 5), fill_w, 3, color=col))
        
        ax.add_patch(patches.FancyBboxPatch((60, y + 4), 30, 8, boxstyle="round,pad=0.2,rounding_size=1", color="#21262D"))
        ax.text(75, y + 8, outcome, color=col, fontsize=4.8, weight='bold', ha='center', va='center')
        
    # Interactive scenario buttons
    ax.text(10, 27, "SIMULATE REAL-WORLD TEST CASES:", color=TEXT_WHITE, fontsize=6, weight='bold')
    scenarios = [
        ("Simulate Rule A", 10), ("Simulate Rule B", 32), ("Simulate Rule C", 54), ("Hand Shake (v=0)", 76)
    ]
    for scn, x in scenarios:
        ax.add_patch(patches.FancyBboxPatch((x, 17), 20, 8, boxstyle="round,pad=0.5,rounding_size=1", color="#21262D", ec=BORDER, lw=0.6))
        ax.text(x + 10, 21, scn, color=TEXT_WHITE, fontsize=4.2, ha='center', va='center')
        
    path = os.path.join(OUTPUT_DIR, "screen_sensor_lab.png")
    plt.savefig(path, bbox_inches='tight', facecolor=DARK_BG, dpi=200)
    plt.close()
    return path

# 3. SCREENSHOT: LIVE SERVICES GPS RADAR
def generate_services_radar():
    fig, ax = create_phone_frame("Nearby Services")
    
    # Radar Header
    ax.add_patch(patches.FancyBboxPatch((6, 136), 88, 42, boxstyle="round,pad=1,rounding_size=3", color=CARD_BG, ec=BORDER, lw=1))
    ax.text(10, 172, "[RADAR] LIVE GPS OVERPASS SCAN", color=TEXT_WHITE, fontsize=8, weight='bold')
    ax.text(10, 166, "Lat: 28.5672 N | Lon: 77.2100 E (Ring Road, AIIMS)", color=TEXT_MUTED, fontsize=5.5)
    
    # Radar graphic concentric circles
    c1 = patches.Circle((75, 155), 16, color="#1C2128", ec=BLUE, lw=0.8, alpha=0.6)
    c2 = patches.Circle((75, 155), 10, color="#1C2128", ec=BLUE, lw=1.2, alpha=0.8)
    c3 = patches.Circle((75, 155), 4, color=BLUE)
    ax.add_patch(c1); ax.add_patch(c2); ax.add_patch(c3)
    # blip
    ax.add_patch(patches.Circle((79, 160), 1.8, color=RED))
    ax.add_patch(patches.Circle((70, 150), 1.5, color=GREEN))
    
    ax.text(10, 156, "Query: OSM Overpass API", color=BLUE, fontsize=6, weight='bold')
    ax.text(10, 149, "Radius: 15 km Bounding Box", color=TEXT_MUTED, fontsize=5.5)
    ax.text(10, 142, "Found: 14 Units Nearby", color=GREEN, fontsize=6, weight='bold')
    
    # Emergency Service List
    services = [
        ("AIIMS Trauma Centre", "1.2 km - NE", "HOSPITAL / LEVEL 1", "011-26593677", RED, 102),
        ("Safdarjung Emergency", "2.1 km - SW", "AMBULANCE / TRAUMA", "011-26165060", RED, 76),
        ("Hauz Khas Police Station", "3.4 km - SE", "POLICE / 112 DISPATCH", "112 / 100", BLUE, 50),
        ("24x7 NHAI Highway Rescue", "4.8 km - S", "RECOVERY & CRANE", "1033", AMBER, 24),
    ]
    for name, dist, cat, ph, col, y in services:
        rect = patches.FancyBboxPatch((6, y), 88, 22, boxstyle="round,pad=1,rounding_size=2", color=CARD_BG, ec=BORDER, lw=0.8)
        ax.add_patch(rect)
        ax.text(10, y + 16, name, color=TEXT_WHITE, fontsize=6.8, weight='bold')
        ax.text(10, y + 9, dist, color=GREEN, fontsize=5.5, weight='bold')
        ax.add_patch(patches.FancyBboxPatch((55, y + 12), 35, 6.5, boxstyle="round,pad=0.2,rounding_size=1", color="#21262D"))
        ax.text(72, y + 15.5, cat, color=col, fontsize=4.5, weight='bold', ha='center', va='center')
        ax.text(10, y + 3, f"Call: {ph} | Map Navigate", color=BLUE, fontsize=5.2)
        
    path = os.path.join(OUTPUT_DIR, "screen_live_services.png")
    plt.savefig(path, bbox_inches='tight', facecolor=DARK_BG, dpi=200)
    plt.close()
    return path

# 4. SCREENSHOT: FORENSIC BLACKBOX & POLICE DOSSIER
def generate_forensics():
    fig, ax = create_phone_frame("Forensics Blackbox")
    
    # Header dossier
    ax.add_patch(patches.FancyBboxPatch((6, 142), 88, 36, boxstyle="round,pad=1,rounding_size=2.5", color=CARD_BG, ec=BORDER, lw=1))
    ax.text(10, 172, "ACCIDENT FORENSIC FLIGHT RECORDER", color=TEXT_WHITE, fontsize=7.2, weight='bold')
    ax.text(10, 165, "Incident ID: INC-2026-9812 | Vehicle: 4-Wheeler (Car)", color=TEXT_MUTED, fontsize=5.2)
    ax.text(10, 158, "Impact Vector: FRONTAL_COLLISION (Confidence 98%)", color=RED, fontsize=5.8, weight='bold')
    
    # SHA-256 seal stamp
    ax.add_patch(patches.FancyBboxPatch((10, 146), 80, 8, boxstyle="round,pad=0.2,rounding_size=1", color="#1C2128", ec=GREEN, lw=0.8))
    ax.text(50, 150, "[SEAL] SHA-256: 37ff825c55998e99f98a2c1b7e4d (Cloud Sealed)", color=GREEN, fontsize=4.8, weight='bold', ha='center', va='center')
    
    # Pre-crash Telemetry Waveform Plot mockup
    ax.add_patch(patches.FancyBboxPatch((6, 68), 88, 70, boxstyle="round,pad=1,rounding_size=2.5", color=CARD_BG, ec=BORDER, lw=1))
    ax.text(10, 132, "PRE-CRASH 10s TELEMETRY WAVEFORM (10 Hz)", color=TEXT_WHITE, fontsize=6.5, weight='bold')
    
    # mini inner plot for telemetry
    times = np.linspace(-10, 0, 50)
    speed = np.concatenate([np.linspace(85, 82, 35), np.linspace(80, 0, 15)])
    accel = np.concatenate([np.random.normal(1.0, 0.1, 35), [2.5, 4.0, 8.5, 11.2, 7.0, 2.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]])
    
    # Scale to canvas coordinates
    px = 12 + (times - times.min()) / (times.max() - times.min()) * 76
    py_speed = 78 + (speed / 90) * 36
    py_accel = 78 + (accel / 12) * 36
    
    ax.plot(px, py_speed, color=BLUE, lw=1.5, label="Speed (km/h)")
    ax.plot(px, py_accel, color=RED, lw=1.5, label="Accel G")
    ax.text(12, 122, "Speed: 85 km/h -> 0 km/h (Delta V = 85 km/h)", color=BLUE, fontsize=5.5)
    ax.text(12, 116, "Peak Impact: 11.2 G | Jerk: 45 m/s3", color=RED, fontsize=5.5)
    ax.axvline(px[-10], color=AMBER, linestyle='--', lw=1)
    ax.text(px[-10] + 1, 105, "CRASH T=0", color=AMBER, fontsize=5, weight='bold')
    
    # Official Police Dossier Card
    ax.add_patch(patches.FancyBboxPatch((6, 22), 88, 42, boxstyle="round,pad=1,rounding_size=2.5", color=CARD_BG, ec=BORDER, lw=1))
    ax.text(10, 58, "POLICE & INSURANCE REPORT SUMMARY", color=TEXT_WHITE, fontsize=6.8, weight='bold')
    ax.text(10, 51, "- Driver: Souradip Ghosh (Profile: Standard)", color=TEXT_MUTED, fontsize=5.2)
    ax.text(10, 45, "- Impact Type: High-Speed Severe Frontal Deceleration", color=TEXT_MUTED, fontsize=5.2)
    ax.text(10, 39, "- Tamper-proof cloud backup synced to Supabase Cloud", color=GREEN, fontsize=5.2)
    ax.add_patch(patches.FancyBboxPatch((10, 26), 80, 9, boxstyle="round,pad=0.5,rounding_size=1.5", color=BLUE))
    ax.text(50, 30.5, "EXPORT OFFICIAL POLICE DOSSIER (PDF / JSON)", color="white", fontsize=5.8, weight='bold', ha='center', va='center')
    
    path = os.path.join(OUTPUT_DIR, "screen_forensics.png")
    plt.savefig(path, bbox_inches='tight', facecolor=DARK_BG, dpi=200)
    plt.close()
    return path

# 5. SCREENSHOT: USER AUTH & DYNAMIC DRIVER ADAPTATION
def generate_driver_profile():
    fig, ax = create_phone_frame("Driver Profile")
    
    ax.add_patch(patches.FancyBboxPatch((6, 136), 88, 42, boxstyle="round,pad=1,rounding_size=3", color=CARD_BG, ec=BORDER, lw=1))
    ax.text(10, 172, "DRIVER PROFILE & TELEMATICS", color=TEXT_WHITE, fontsize=7.2, weight='bold')
    ax.text(10, 164, "Souradip Ghosh - Verified Driver", color=GREEN, fontsize=6.2, weight='bold')
    ax.text(10, 157, "Email: itssouradip@gmail.com - Cloud: Supabase Synced", color=TEXT_MUTED, fontsize=5.2)
    
    # Vehicle Type Selector
    ax.text(10, 148, "VEHICLE DYNAMICS CATEGORY:", color=TEXT_WHITE, fontsize=5.8, weight='bold')
    v_types = [("Two-Wheeler (Bike)", True, 10), ("Four-Wheeler (Car)", False, 52)]
    for v_name, sel, x in v_types:
        bg = "#1F6FEB" if sel else "#21262D"
        ax.add_patch(patches.FancyBboxPatch((x, 138), 38, 8, boxstyle="round,pad=0.2,rounding_size=1", color=bg))
        ax.text(x + 19, 142, v_name, color="white", fontsize=5, weight='bold', ha='center', va='center')
        
    # Adaptive Threshold Calibration Cards
    ax.add_patch(patches.FancyBboxPatch((6, 60), 88, 70, boxstyle="round,pad=1,rounding_size=3", color=CARD_BG, ec=GREEN, lw=1.2))
    ax.text(10, 124, "DYNAMIC THRESHOLD ADAPTER IN ACTION", color=GREEN, fontsize=7, weight='bold')
    ax.text(10, 117, "Engine automatically re-tunes physics limits based on rider profile:", color=TEXT_MUTED, fontsize=5.2)
    
    calibs = [
        ("Two-Wheeler Cornering Lean", "Gyro Bump Threshold raised from 2.8 -> 3.64 rad/s to prevent normal leaning from triggering false alarms", BLUE, 102),
        ("Novice Clutch Stall Buffer", "Braking jerk threshold cushioned from 25 -> 28.75 m/s3 so accidental stalls won't trigger SOS", AMBER, 84),
        ("Acoustic Crash Permitted", "Microphone ambient observation authorized for metal crunch & glass shatter signatures", PURPLE, 66),
    ]
    for t, d, c, y in calibs:
        ax.text(10, y + 8, "- " + t, color=c, fontsize=6, weight='bold')
        ax.text(14, y + 2, d[:65] + "...", color=TEXT_MUTED, fontsize=4.8)
        
    # Privacy & Safety Badge
    ax.add_patch(patches.FancyBboxPatch((6, 20), 88, 34, boxstyle="round,pad=1,rounding_size=2.5", color=CARD_BG, ec=BORDER, lw=1))
    ax.text(10, 48, "PRIVACY & ON-DEVICE SAFETY GUARANTEE", color=TEXT_WHITE, fontsize=6.5, weight='bold')
    ax.text(10, 41, "- 100% On-Device Neural Forward Pass (Zero cloud inference lag)", color=TEXT_MUTED, fontsize=5.2)
    ax.text(10, 35, "- Acoustic raw audio is never recorded or streamed to any server", color=TEXT_MUTED, fontsize=5.2)
    ax.text(10, 29, "- Forensics are strictly locked until a collision event occurs", color=TEXT_MUTED, fontsize=5.2)
    
    path = os.path.join(OUTPUT_DIR, "screen_auth_personalized.png")
    plt.savefig(path, bbox_inches='tight', facecolor=DARK_BG, dpi=200)
    plt.close()
    return path

# 6. SCREENSHOT: AI CHAT TRIAGE SCREEN
def generate_ai_triage():
    fig, ax = create_phone_frame("AI Emergency Triage")
    
    ax.add_patch(patches.FancyBboxPatch((6, 150), 88, 28, boxstyle="round,pad=1,rounding_size=2.5", color="#3D1214", ec=RED, lw=1))
    ax.text(10, 172, "CRITICAL TRIAGE ACTIVE | STATUS: ACCIDENT", color=RED, fontsize=7.2, weight='bold')
    ax.text(10, 165, "AI Triage Engine - Bilingual Voice/Text (EN / Hindi)", color=TEXT_WHITE, fontsize=5.5)
    ax.text(10, 158, "Recommended Dispatch: Level-1 Trauma Ambulance + Police Patrol", color=AMBER, fontsize=5.2, weight='bold')
    
    # Chat message bubbles
    chats = [
        ("User", "Two cars crashed on the ring road, driver is bleeding and unconscious", BLUE, 130, True),
        ("ResQRoute AI", "Emergency Alert Confirmed: Critical accident reported near AIIMS Ring Road. 108 Ambulance notified.", GREEN, 108, False),
        ("ResQRoute AI", "FIRST AID INSTRUCTIONS:\n1. Do NOT move the driver unless there is imminent fire.\n2. Apply firm pressure on bleeding with clean cloth.\n3. Check for regular breathing.", AMBER, 76, False),
        ("User", "Ambulance eta?", BLUE, 58, True),
        ("ResQRoute AI", "Safdarjung Emergency unit dispatched. Estimated ETA: 4-6 minutes. Stay on line.", GREEN, 38, False),
    ]
    for sender, msg, col, y, is_user in chats:
        x = 25 if is_user else 6
        w = 68 if is_user else 78
        h = 18 if len(msg) < 80 else 26
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.8,rounding_size=2", color=CARD_BG, ec=col, lw=0.8))
        ax.text(x + 3, y + h - 4, sender, color=col, fontsize=5.2, weight='bold')
        ax.text(x + 3, y + h - 10, msg[:120], color=TEXT_WHITE, fontsize=4.8)
        
    path = os.path.join(OUTPUT_DIR, "screen_ai_triage.png")
    plt.savefig(path, bbox_inches='tight', facecolor=DARK_BG, dpi=200)
    plt.close()
    return path

if __name__ == "__main__":
    p1 = generate_home_sos()
    p2 = generate_sensor_lab()
    p3 = generate_services_radar()
    p4 = generate_forensics()
    p5 = generate_driver_profile()
    p6 = generate_ai_triage()
    print("All 6 screenshots generated successfully:")
    for p in [p1, p2, p3, p4, p5, p6]:
        print(" -", p)
