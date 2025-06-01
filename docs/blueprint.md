# **App Name**: SpeedVolumePro

## Core Features:

- GPS-Powered Speed Detection: Implement precise GPS tracking to continuously determine the user's current speed. The system must balance accuracy with battery efficiency through intelligent polling. It should gracefully handle temporary signal loss, perhaps by maintaining the last known volume for a brief period.
- Dynamic System Volume Control: Utilize platform-specific APIs (iOS) to control the device's system-wide media volume. Ensure all volume changes are smooth and gradual to prevent jarring audio shifts. The app should respect system volume limits and allow for user manual overrides.
- Customizable Volume Curves: Allow users to define a series of `(speed, volume)` data points to create a personalized volume curve. The app will use linear interpolation to calculate intermediate volume levels. This includes:Defining a minimum speed threshold (e.g., 0 MPH) with a corresponding minimum volume.Defining a maximum speed threshold (e.g., 60 MPH) with a corresponding maximum volume, above which the volume remains constant.Providing sensible default curve settings for immediate usability.
- Clean and Intuitive UI: Design a user interface that's easy to navigate, especially for quick adjustments in a vehicle. Use large, legible text and clear icons.
- Prominent "On/Off" Toggle: Include a highly visible and easy-to-tap button to activate or deactivate the automatic volume adjustment feature.
- Profile Management: Enable users to create, name, edit, and effortlessly switch between multiple custom profiles (e.g., "Boat," "Car," "Motorcycle"), each with its unique volume curve.
- Real-time Visual Feedback: Display the current GPS speed prominently. Visually represent the current output volume level (e.g., via a slider or percentage). Consider a graphical representation of the active volume curve, highlighting the current speed's position on it.
- Robust Background Operation: Ensure the app reliably runs in the background to continuously monitor speed and adjust volume without interruption. Configure necessary background modes (e.g., "location updates" for iOS) and user permissions.
- Battery Efficiency: Implement strategies to minimize power consumption, particularly during extended background use, through optimized GPS polling.
- Graceful Edge Case Handling: Design the app to handle scenarios like temporary GPS loss, app suspension/resumption, and manual user volume adjustments. Incorporate a brief delay (e.g., 5-10 seconds) before reducing volume when stationary to prevent rapid fluctuations at stops.
- Strategic Interstitial Ads: Implement full-screen interstitial ads that appear at non-disruptive, logical breakpoints in the user's interaction.
- Clear Premium Upgrade Path: Clearly present an "Upgrade to Premium" option (via In-App Purchase). Emphasize the core benefits of the premium version: "Remove All Ads" and access to advanced features like unlimited profiles or more granular curve customization.

## Style Guidelines:

- Primary color: Saturated blue (#4285F4) to evoke a sense of technology and reliability, mirroring GPS accuracy and system control.
- Background color: Light gray (#F0F4F7), a desaturated version of the primary blue, providing a clean and unobtrusive backdrop that ensures legibility and minimizes distraction.
- Accent color: Analogous green (#34A853), offset to the 'left' of the primary blue, will signal active states and confirmations. Its contrasting brightness and saturation will effectively draw attention to interactive elements and positive feedback messages.
- Body and headline font: 'Inter' (sans-serif) for a clean, modern, and easily readable interface. Its neutral appearance ensures clarity in various driving conditions.
- Use minimalist icons to ensure clarity and quick recognition.
- The layout is simple and intuitive. Key elements (On/Off toggle, speed display, volume control) are prominently displayed and easily accessible, minimizing distraction.