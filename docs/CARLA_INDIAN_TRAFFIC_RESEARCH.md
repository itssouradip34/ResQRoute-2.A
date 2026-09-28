# CARLA Simulation & Indian Driving Environments: Datasets, Relevance & Kinematic Crash Analysis

**Document Status**: Official Research Report  
**Author**: ResQRoute AI Autonomous Research & Kinematics Team  
**Focus**: CARLA Simulator Applicability for Unstructured Indian Road Crash & Anomaly Detection  

---

## 1. Executive Summary

Autonomous collision detection systems like **ResQRoute AI** rely on high-fidelity inertial (accelerometer, gyroscope) and speed telemetry. A recurring question in transportation AI is:

> *"Do datasets exist for simulating vehicle dynamics and collisions in Indian environments using the CARLA simulator, and how relevant is CARLA simulation for training and calibrating real-world crash detection systems like ResQRoute?"*

### Core Conclusions:
1. **No Native "Indian Mode" in CARLA Core**: CARLA (Open-source Simulator for Autonomous Driving Research, developed by Intel, Toyota Research Institute, and Computer Vision Center) does not provide a native "out-of-the-box" Indian town map or traffic mode in its standard distribution. Its default towns (`Town01` through `Town12`) depict European and North American suburban and highway geometries.
2. **Academic & Research Extensions DO Exist**: Leading Indian and international institutions (notably IIIT Hyderabad, IIT Bombay, TUM, and Intel Labs) have developed specialized datasets and custom simulation configurations capturing Indian driving behaviors (unstructured traffic, non-lane-based movement, diverse vehicle fleets including auto-rickshaws and two-wheelers).
3. **High Relevance for Collision Kinematics, Moderate Domain Gap for Road Noise**:
   - **High Relevance**: CARLA's multi-body PhysX rigid dynamics engine reliably outputs 6-axis IMU telemetry (linear acceleration $a_x, a_y, a_z$, angular velocities $\omega_x, \omega_y, \omega_z$, and collision impulses), making it ideal for simulating fatal rollover, T-bone, and multi-vehicle highway collisions that cannot be safely staged with real humans.
   - **Moderate Domain Gap**: Naive CARLA simulations lack high-frequency chassis micro-vibrations, phone suspension damping inside vehicle cabins, and the chaotic variety of Indian road imperfections (potholes, rumblers, unpaved shoulders). Therefore, **hybrid modeling**—combining synthetic CARLA extreme-crash scenarios with real-world road datasets like **VZCrash**—is the industry best practice.

---

## 2. Key Existing Datasets & Simulation Frameworks

| Dataset / Framework | Origin / Institution | Format / Sensors | Relevance to ResQRoute AI |
|---|---|---|---|
| **DeepAccident** | Technical University of Munich (TUM) | CARLA Synthetic (691 accident scenarios, multi-camera, LiDAR, 6-axis IMU) | **Very High** for crash trajectory, impact impulses, and kinematics |
| **AccidentSim** | Academic Research (arXiv:2403.08234) | CARLA Reconstruction from real-world crash investigation reports | **High** for verifying kinematic thresholds during severe structural deformation |
| **IDD (India Driving Dataset)** | IIIT Hyderabad, Intel Labs | Real-World & Simulation (Bangalore, Hyderabad, 10,000+ frames, 34 classes) | **Foundational** for understanding unstructured Indian traffic distributions |
| **IDD-3D & IDD-Multimodal** | IIIT Hyderabad | Real-world LiDAR, stereo camera, GPS-IMU sequences | **High** for validating real Indian road acceleration profiles |
| **DriveIndia** | IIT Kharagpur / Academic Consortium | 67,000 annotated frames, extreme vehicle density, mixed traffic | **Medium-High** for understanding close-quarter near-miss kinematics |
| **AutoVOT / Unstructured CARLA** | Open-source Research Forks | Custom CARLA Python API (TrafficManager with lane-disregard) | **High** for simulating cut-in braking and two-wheeler skids |

---

## 3. How Indian Traffic is Simulated in CARLA

To model the unique dynamics of Indian roads inside CARLA, researchers configure three layers:

### A. Unstructured Traffic Behavior (Traffic Manager Configuration)
Standard autonomous driving simulations assume lane-following rules. In India, lane discipline is largely informal, with dynamic vehicle filtering and frequent lateral cut-ins. This is achieved in CARLA's Python API via:
```python
# Customizing CARLA Traffic Manager for Indian Road Dynamics
traffic_manager.set_global_distance_to_leading_vehicle(1.2)  # High vehicle density
traffic_manager.global_percentage_speed_difference(-15.0)    # Aggressive overtaking
traffic_manager.set_random_device_seed(42)

for vehicle in world.get_actors().filter('*vehicle*'):
    # Allow non-lane following / filtering (common for motorcycles & autos)
    traffic_manager.ignore_lights_percentage(vehicle, 10.0)
    traffic_manager.ignore_signs_percentage(vehicle, 15.0)
    traffic_manager.auto_lane_change(vehicle, True)
    traffic_manager.distance_to_leading_vehicle(vehicle, 0.8)
```

### B. Fleet Heterogeneity (Asset Blueprint Injection)
In Indian driving conditions, light motor vehicles (cars) make up less than 40% of the active traffic mix. Over 60% consists of:
- **Two-Wheelers (Motorcycles, Scooters)**: Rapid acceleration, sharp leaning angles ($20^\circ - 45^\circ$), and vulnerable rollover risks.
- **Three-Wheelers (Auto-Rickshaws)**: High center-of-gravity, prone to lateral tipping on sharp evasive maneuvers.
- **Heavy Commercial Vehicles (Buses, Multi-axle Trucks)**: High momentum, sluggish braking.
Researchers import custom `.fbx` assets into Unreal Engine / CARLA to accurately reflect the mass and collision mesh of these vehicle categories.

### C. Road Topography & Pothole Mesh Generation
Road surface anomalies (potholes, unmarked speed-breakers, rumble strips) are modeled using **RoadRunner** (VectorZero / MathWorks) and imported as OpenDRIVE (`.xodr`) maps with localized vertical deformations.

---

## 4. Relevance Assessment: Simulation vs. Real-World Kinematics

### Strengths of CARLA for ResQRoute AI:
1. **Rare & Severe Collision Modeling**: Fatal high-speed collisions, rollovers, and multi-vehicle chain reactions can be staged at scale across thousands of permutations (speeds from 20 km/h to 140 km/h, impact angles from $0^\circ$ to $180^\circ$).
2. **Ground Truth Sensor Access**: CARLA's `sensor.other.imu` provides ground truth accelerometer ($m/s^2$), gyroscope ($rad/s$), and compass headings at customizable sampling rates (100 Hz to 200 Hz), matching high-end smartphone IMUs.
3. **Collision Impulse Validation**: The `sensor.other.collision` sensor measures exact impulse vectors (Newton-seconds), enabling verification of whether calculated jerk ($m/s^3$) correctly correlates with physical impact energy.

### Limitations & Domain Gap (Why CARLA Alone is Insufficient):
1. **Cabin Dynamics & Phone Placement**: In CARLA, the IMU is rigidly attached to the vehicle chassis (`actor.attach_to`). In real life, a smartphone sits in a dashboard mount, pocket, or cup-holder. Cabin vibration damping and mounting flex alter high-frequency jerk spikes.
2. **Road Noise Realism**: Real Indian road textures have stochastic micro-vibrations that naive physics engines smooth over.
3. **Zero-Speed Hand Shake**: In a simulator, virtual vehicle actors never produce accidental hand movements while parked. In real smartphones, users shake their phones, drop them on the seat, or walk while holding them, requiring dedicated zero-speed filtering.

---

## 5. Strategic Recommendations for ResQRoute AI 2.0

1. **Retain VZCrash as Primary Ground Truth**:
   The `vzc-research-chapter/VZCrash` dataset remains the superior real-world benchmark because it contains physical smartphone telemetry recorded during actual vehicle motion and crashes.
2. **Utilize CARLA Synthetic Data for Edge-Case Augmentation**:
   Use synthetic accident trajectories from **DeepAccident** and **AccidentSim** to stress-test extreme multi-axial rollover scenarios (where both pitch and roll rates exceed $8.0\text{ rad/s}$) and calibrate secondary rollover thresholds.
3. **Incorporate Two-Wheeler Lean Compensation**:
   As demonstrated in Indian traffic studies, two-wheelers regularly achieve $\omega > 2.5\text{ rad/s}$ during ordinary turns. ResQRoute's new `PersonalizedThresholdAdapter` directly incorporates this empirical finding to prevent false alarms for motorcycle riders.
