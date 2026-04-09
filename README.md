<div align="center">
  <img src="assets/icons/icon.png" width="128" alt="Anima Logo">
  <h1>Anima v2.0</h1>
  <p><b>A lightweight, 2D animation software for you and the community.</b></p>
</div>

Anima is a "no-nonsense" creative tool built for speed. Designed with a familiar timeline workflow, it focuses on the essentials: drawing, timing, and motion. 
---

## Why did you move to Anima v2?
#### Anima started as an Electron app, but 500MB of RAM for a simple 2D app didn't felt right to me. So I've rewritten the entire core in C++ and Qt.

And here's what got benefited:
* Optimization for low-end devices.
* Higher performance for future potential features.
* less than a 100 MB lightweight
##### (And I started learning C++ too and you can too if you want to fork or recreate this, or go back to the v1 and learn the easier way or want simplicity)

## What's new in v2.0?
* **Dual-Format Save System:** Support for high-speed binary .anx files and legacy JSON-based .anima files. (HOLY SH## BACKWARDS COMPATIBILITY)
* **Native Performance:** Barely lags on low-end hardware (maybe you can run this on a potato?)

More release notes in the [Changelog](https://github.com/Idkthisguy/Anima/blob/anima-v2/CHANGELOG.md).

## Key Features (so far)
* Lightweight executable for saving your storage space
* Boosted performance C++ instead of ElectronJS

## Getting Started (NOT AVAILABLE BUT I'M KEEPING THIS IN FOR NOW)
1. **Download:** Download Anima from the [Releases](https://github.com/Idkthisguy/anima/releases) section.
2. **Launch:** Just extract the zip file and run the `Anima.exe` executable. No installation required. (literally)
3. **Animate:** Just draw and animate! There's nothing complicated about that, right?... (right?...)

>[!WARNING]
>If you so happened to find bugs, please report them in [issues](https://github.com/Idkthisguy/Anima/issues) with a clip (like a screenshot or a screen recording) if possible. :)

## Pro Shortcuts (NOT AVAILABLE BUT I'M KEEPING THIS IN FOR NOW)
| Action | Key |
| :--- | :--- |
| **Tools** | `B` (Brush), `E` (Eraser), `G` (Fill) |
| **Navigation** | `Right arrow` (Next Frame), `Left arrow` (Prev Frame) |
| **Playback** | `Spacebar` (Play/Pause) |
| **Canvas** | `Ctrl + Scroll` (Zoom), `Mid-Mouse` (Pan), `Ctrl + 0` (Reset) |

## Demos

### I don't have any media exported from Anima for now but here's a very friendly screenshot.

<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/78ed27e8-f9d9-4ac6-9170-a4d8842d6769" />


## Project Status & Contributions

### The great upgrade

- I realized how much ElectronJS is gonna affect this project negatively, so I have to upgrade Anima to C++ and [Qt](https://www.qt.io/) to bring that true lightweightness and performance. Also I'm using this as an excuse to learn C++ development hehe

### Linux version coming soon

- I will be making a Linux version for Anima, for all the Linux users out there who wants to try this :D

### Mobile port coming soon

- Some awesome person asked me if it's gonna be just on PC or Android and I realized how good this will be on mobile so yeah
- And also for the iPhone users, sorry guys but y'all are gonna have to sideload this since I'm too broke to put this on the app store
- And another thing, I'm also too broke to put it in the play store lol.

---

## Roadmap
- [x] **Legacy Support:** Allowed save and open of `.anima` files.
- [ ] **FFMPEG Export:** Export to MP4 and GIF.
- [ ] **Tweening:** Automated motion paths between keyframes.
- [ ] **Audio Support:** Multi-track scrubbing for lip-syncing.

---


## Top Contributors

### Idkthisguy 
- Creator
- Code-writer
- Desktop Tester

### yashmanikonda
- Code-writer

### Ezure
- Main Tester
- Mobile tester
- Desktop tester

### ivagaguaig-source
- Main Tester
- Desktop tester

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. 

> [!IMPORTANT]
> If you modify Anima and run it on a server or distribute it, you **must** make your source code available under the same license. See the [LICENSE](LICENSE.txt) file for full details.
