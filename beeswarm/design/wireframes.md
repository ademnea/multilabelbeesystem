# Beeswarm Mobile App — Screen Wireframes
> ASCII mockups for Figma reference · Amber theme · Dark-on-white

---

## Color Tokens (for Figma styles)

```
THEME.accent      #F59E0B   Amber-400  (primary buttons, active states)
THEME.page        #FAFAFA   Gray-50    (screen background)
THEME.card        #FFFFFF   White      (card surfaces)
THEME.text        #1E1B18   Near-black (primary text)
THEME.muted       #78716C   Stone-500  (secondary text)
THEME.border      #E7E5E4   Stone-200  (dividers, borders)

STATUS.Harmonious #22C55E   Green-500
STATUS.2Queens    #F97316   Orange-500
STATUS.Swarming   #EF4444   Red-500
STATUS.Absconded  #94A3B8   Slate-400

SEVERITY.Critical #DC2626   Red-600
SEVERITY.Warning  #D97706   Amber-600
SEVERITY.Info     #2563EB   Blue-600
```

---

## Typography

```
Display  Bold   24px  THEME.text     (screen titles)
Title    SemiBold 18px THEME.text    (card headers)
Body     Regular 15px  THEME.text    (primary content)
Caption  Regular 13px  THEME.muted   (metadata, timestamps)
Badge    Bold   11px   white         (pill labels)
```

---

## 1. Welcome / Splash Screen

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│         ╔═══════════╗           │
│         ║  🐝 logo  ║           │
│         ╚═══════════╝           │
│                                 │
│         BEESWARM                │
│     Smart Hive Monitoring       │
│                                 │
│                                 │
│  ┌─────────────────────────┐   │
│  │       Get Started        │   │  ← amber fill, rounded-xl
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │     I have an account    │   │  ← border only, rounded-xl
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

---

## 2. Login Screen

```
┌─────────────────────────────────┐
│  ←                              │
│                                 │
│  Sign in                        │  ← Display Bold
│  Welcome back, beekeeper        │  ← Caption/muted
│                                 │
│  Email address                  │  ← label 12px
│  ┌─────────────────────────┐   │
│  │  you@example.com        │   │  ← TextInput, border-stone-200
│  └─────────────────────────┘   │
│                                 │
│  Password                       │
│  ┌─────────────────────────┐   │
│  │  ••••••••         👁    │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │          Sign in         │   │  ← amber fill
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │  ← error box (red bg, hidden
│  │ ⚠ Invalid credentials   │   │    until error)
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

---

## 3. Sign Up Screen

```
┌─────────────────────────────────┐
│  ←                              │
│                                 │
│  Create account                 │
│  Register your apiary           │
│                                 │
│  Full name                      │
│  ┌─────────────────────────┐   │
│  │  John Mwesigwa          │   │
│  └─────────────────────────┘   │
│                                 │
│  Email address                  │
│  ┌─────────────────────────┐   │
│  │  john@example.com       │   │
│  └─────────────────────────┘   │
│                                 │
│  Phone number                   │
│  ┌─────────────────────────┐   │
│  │  +256 700 000000        │   │
│  └─────────────────────────┘   │
│                                 │
│  API Key                        │
│  ┌─────────────────────────┐   │
│  │  sk-•••••••••••         │   │
│  └─────────────────────────┘   │
│                                 │
│  Password                       │
│  ┌─────────────────────────┐   │
│  │  ••••••••         👁    │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │       Create account     │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

---

## 4. Dashboard Screen

```
┌─────────────────────────────────┐
│  ≡  Dashboard          🔔[3]   │  ← header; 🔔 badge
├─────────────────────────────────┤
│ ┌──────────────────────────┐    │
│ │ 🌤 24°C  Humidity 68%    │    │  ← ambient weather strip
│ │ Entebbe · Light breeze   │    │
│ └──────────────────────────┘    │
│                                 │
│ ┌──────┐ ┌──────┐ ┌──────┐    │  ← 3-column overview row
│ │Device│ │Harm- │ │Alert │    │
│ │Status│ │onious│ │      │    │
│ │      │ │      │ │      │    │
│ │  ●   │ │  8   │ │  3   │    │
│ │Online│ │hives │ │      │    │
│ └──────┘ └──────┘ └──────┘    │
│                                 │
│ ┌──────┐ ┌──────┐              │  ← 2-column row
│ │2Queens│ │Swarm-│              │
│ │      │ │ ing  │              │
│ │  2   │ │  1   │              │
│ │orange│ │ red  │              │
│ └──────┘ └──────┘              │
│                                 │
│ ┌──────────────────────────┐    │
│ │  Hive State              │    │  ← donut chart card
│ │                          │    │
│ │      ╭───────╮           │    │
│ │   ╭──┤  12   ├──╮        │    │
│ │   │  │ hives │  │        │    │
│ │   ╰──┤       ├──╯        │    │
│ │      ╰───────╯           │    │
│ │  ● Harmonious  8         │    │
│ │  ● 2 Queens!   2         │    │
│ │  ● Swarming    1         │    │
│ │  ● Absconded   1         │    │
│ └──────────────────────────┘    │
│                                 │
│ ┌──────────────────────────┐    │
│ │  Fleet Temperature       │    │  ← dot chart card
│ │  ── threshold 35°C       │    │
│ │                          │    │
│ │  40°│                    │    │
│ │     │      ●             │    │
│ │  35°│- - - - - - - - - - │    │  ← dashed threshold
│ │     │  ●  ●   ●  ●      │    │
│ │  30°│●          ●  ●    │    │
│ │     └──────────────────  │    │
│ │     BH01 … BH12          │    │
│ │  ● Harmonious ● 2Q ● Swarm│   │
│ └──────────────────────────┘    │
│                                 │
│  Recent Alerts                  │
│ ┌──────────────────────────┐    │
│ │ 🔴  BH0003 · Critical    │    │
│ │     Temperature spike    │    │
│ │     2h ago          >    │    │
│ ├──────────────────────────┤    │
│ │ 🟡  BH0007 · Warning     │    │
│ │     Humidity high        │    │
│ │     5h ago          >    │    │
│ └──────────────────────────┘    │
└─────────────────────────────────┘
  🏠     🔔[3]    📍    🎯    👤
``` 

---

## 5. Hive List Screen

```
┌─────────────────────────────────┐
│  ←  Hives            ⊞ list▾  │
├─────────────────────────────────┤
│  ┌─────────────────────────┐   │
│  │ 🔍 Search hives…        │   │
│  └─────────────────────────┘   │
│                                 │
│  [All][Harmonious][2 Queens!]   │  ← filter pills (scrollable)
│  [Swarming][Absconded]          │
│                                 │
├─────────────────────────────────┤
│  ●  BH0001                      │  ← colored dot
│     [Harmonious] North Yard     │  ← state badge (green bg)
│                          2d     │  ← duration
│                     more ···   │  ← blue
├─────────────────────────────────┤
│  ●  BH0003                      │
│     [2 Queens!]  South Field    │  ← orange bg badge
│                         14h     │
│                     more ···   │
├─────────────────────────────────┤
│  ●  BH0007                      │
│     [Swarming]   East Garden    │  ← red bg badge
│                          3h     │
│                     more ···   │
├─────────────────────────────────┤
│  ●  BH0009                      │
│     [Absconded]  West Field     │  ← gray bg badge
│                          1d     │
│                     more ···   │
└─────────────────────────────────┘
  🏠     🔔      📍    🎯    👤
```

---

## 6. Hive Details Screen

```
┌─────────────────────────────────┐
│  ←  BH0003                  ⋮  │
├─────────────────────────────────┤
│ ┌──────────────────────────┐    │  ← amber hero card
│ │  BH0003                  │    │
│ │  📍 South Field          │    │
│ │                          │    │
│ │  [2 Queens!]    · 14h    │    │  ← state badge + duration
│ └──────────────────────────┘    │
│                                 │
│ ┌──────────────────────────┐    │  ← amber alert banner
│ │ ⚠  Queen cells detected  │    │
│ │    Supercedure risk       │    │
│ └──────────────────────────┘    │
│                                 │
│ ┌──────────────────────────┐    │  ← metrics line chart
│ │  Temperature & Humidity  │    │
│ │  [24h][7d][30d]          │    │  ← range toggle
│ │                          │    │
│ │  40°│                    │    │
│ │     │  ╭──╮              │    │  ← red temp line
│ │  35°│- -│- -│- - - - - - │    │  ← dashed threshold
│ │     │╭──╯  ╰──╮          │    │
│ │  30°│╯         ╰─        │    │
│ │     │    ~~~~            │    │  ← blue humidity line
│ │     └──────────────────  │    │
│ │     09h 10h 11h 12h 15h  │    │
│ │  — Temp  ~ Humidity      │    │  ← legend
│ └──────────────────────────┘    │
│                                 │
│ ┌──────────────────────────┐    │  ← sensor readings card
│ │  Latest Reading          │    │
│ │  Temperature   35.2°C    │    │
│ │  Humidity      69%       │    │
│ │  Weight        28.59 kg  │    │
│ │  Recorded      15:00     │    │
│ └──────────────────────────┘    │
│                                 │
│ ┌──────────────────────────┐    │  ← alerts card
│ │  Hive Alerts             │    │
│ │  🔴  Temp spike  2h ago  │    │
│ │  🟡  High humidity 5h    │    │
│ └──────────────────────────┘    │
└─────────────────────────────────┘
```

---

## 7. Alerts Screen

```
┌─────────────────────────────────┐
│  Alerts                🔔      │
├─────────────────────────────────┤
│  [All][Critical][Warning][Info] │  ← filter pills
│                                 │
│ ┌──────────────────────────┐    │
│ │ 🔴  Critical             │    │  ← red left border
│ │     BH0003               │    │
│ │     Temperature spike    │    │
│ │     Today at 13:45  →    │    │
│ └──────────────────────────┘    │
│                                 │
│ ┌──────────────────────────┐    │
│ │ 🟡  Warning              │    │  ← amber left border
│ │     BH0007               │    │
│ │     Humidity above 75%   │    │
│ │     Today at 11:20  →    │    │
│ └──────────────────────────┘    │
│                                 │
│ ┌──────────────────────────┐    │
│ │ 🔵  Info                 │    │  ← blue left border
│ │     BH0001               │    │
│ │     Weight gain +0.05kg  │    │
│ │     Yesterday  →         │    │
│ └──────────────────────────┘    │
│                                 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │  ← end of list
│           All caught up!        │
└─────────────────────────────────┘
  🏠     🔔[0]    📍    🎯    👤
```

---

## 8. Alert Detail Screen

```
┌─────────────────────────────────┐
│  ←  Alert Detail                │
├─────────────────────────────────┤
│ ┌──────────────────────────┐    │
│ │ 🔴  CRITICAL             │    │  ← severity badge
│ │                          │    │
│ │  Temperature Spike       │    │  ← title
│ │  Hive BH0003 · South Field    │
│ │                          │    │
│ │  Detected: Today 13:45   │    │
│ │  Sensor:   Internal Temp │    │
│ │  Reading:  38.4°C        │    │
│ └──────────────────────────┘    │
│                                 │
│  Description                    │
│  The hive internal temperature  │
│  exceeded 37°C for more than    │
│  30 minutes. Check ventilation. │
│                                 │
│ ┌──────────────────────────┐    │
│ │    Acknowledge Alert      │    │  ← amber fill button
│ └──────────────────────────┘    │
│                                 │
│ ┌──────────────────────────┐    │
│ │    View Hive Details      │    │  ← border button
│ └──────────────────────────┘    │
└─────────────────────────────────┘
```

---

## 9. Map Screen

```
┌─────────────────────────────────┐
│  Map                            │
├─────────────────────────────────┤
│ ┌──────────────────────────┐    │
│ │                          │    │
│ │     [Satellite] [Map]    │    │  ← toggle top-right
│ │                          │    │
│ │         📍               │    │  ← green pin (Harmonious)
│ │     📍                   │    │
│ │              📍(orange)  │    │  ← 2Queens pin
│ │                          │    │
│ │    📍(red)               │    │  ← Swarming pin
│ │                          │    │
│ │                          │    │
│ └──────────────────────────┘    │
│                                 │
│ ┌──────────────────────────┐    │  ← bottom sheet (tapped pin)
│ │  BH0003  [2 Queens!]     │    │
│ │  South Field  ·  14h     │    │
│ │            View Details → │    │
│ └──────────────────────────┘    │
│                                 │
│  Legend                         │
│  ● Harmonious  ● 2 Queens!      │
│  ● Swarming    ● Absconded      │
└─────────────────────────────────┘
  🏠     🔔      📍    🎯    👤
```

---

## 10. Classification Screen

```
┌─────────────────────────────────┐
│  Classification                 │
├─────────────────────────────────┤
│ ┌──────────────────────────┐    │
│ │  Select Hive             │    │  ← dropdown / picker
│ │  BH0001 - North Yard  ▾  │    │
│ └──────────────────────────┘    │
│                                 │
│ ┌──────────────────────────┐    │
│ │                          │    │
│ │   🎤  Tap to record      │    │  ← big mic button, amber
│ │      30 seconds          │    │
│ │                          │    │
│ └──────────────────────────┘    │
│                                 │
│  Last Result                    │
│ ┌──────────────────────────┐    │
│ │  Prediction: Healthy     │    │  ← green badge
│ │  Confidence: 91%         │    │
│ │  Recorded: Today 10:22   │    │
│ │  Duration: 30s           │    │
│ └──────────────────────────┘    │
│                                 │
│  History                        │
│  Today 10:22  Healthy   91%     │
│  Today 08:00  Healthy   87%     │
│  Yesterday    Pre-swarm 73%     │
└─────────────────────────────────┘
  🏠     🔔      📍    🎯    👤
```

---

## 11. Profile Screen

```
┌─────────────────────────────────┐
│  Profile                        │
├─────────────────────────────────┤
│                                 │
│         ╭───────╮               │
│         │  👤   │               │  ← avatar circle (amber bg)
│         ╰───────╯               │
│       John Mwesigwa             │
│       john@example.com          │
│                                 │
│  Full name                      │
│  ┌─────────────────────────┐   │
│  │  John Mwesigwa          │   │
│  └─────────────────────────┘   │
│                                 │
│  Email                          │
│  ┌─────────────────────────┐   │
│  │  john@example.com       │   │
│  └─────────────────────────┘   │
│                                 │
│  Phone                          │
│  ┌─────────────────────────┐   │
│  │  +256 700 000000        │   │
│  └─────────────────────────┘   │
│                                 │
│  Address                        │
│  ┌─────────────────────────┐   │
│  │  Kampala, Uganda        │   │
│  └─────────────────────────┘   │
│                                 │
│  API Key                        │
│  ┌─────────────────────────┐   │
│  │  ••••••••••••••   👁    │   │  ← masked, eye toggle
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │       Save Changes       │   │  ← amber fill
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │         Sign Out         │   │  ← red text, no fill
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
  🏠     🔔      📍    🎯    👤
```

---

## 12. Settings Screen

```
┌─────────────────────────────────┐
│  Settings                       │
├─────────────────────────────────┤
│                                 │
│  Notifications                  │  ← section header
│ ┌──────────────────────────┐    │
│ │  Push Notifications      │    │
│ │  Alerts sent to device ──●    │  ← Switch (amber when on)
│ ├──────────────────────────┤    │
│ │  Critical Alerts Only    │    │
│ │  Skip warning/info    ●──     │  ← Switch (off)
│ └──────────────────────────┘    │
│                                 │
│  Security                       │
│ ┌──────────────────────────┐    │
│ │  Biometric Unlock        │    │
│ │  Face ID / Fingerprint ──●    │
│ └──────────────────────────┘    │
│                                 │
│  Display                        │
│ ┌──────────────────────────┐    │
│ │  Temperature Unit        │    │
│ │  [°C]  [°F]              │    │  ← segmented control
│ ├──────────────────────────┤    │
│ │  Satellite Map           │    │
│ │  Show satellite layer  ──●    │
│ └──────────────────────────┘    │
│                                 │
│  About                          │
│ ┌──────────────────────────┐    │
│ │  Version          1.0.0  │    │
│ │  Backend URL     api.… › │    │
│ └──────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

---

## Tab Bar

```
┌──────────────────────────────────────┐
│  🏠          🔔[3]    📍    🎯    👤 │
│  Home        Alerts   Map  Class  Me │
└──────────────────────────────────────┘
```

*Hives tab is hidden from tab bar; accessed via "View all hives →" on Dashboard.*

---

## Component: Hive Row (flat list)

```
┌─────────────────────────────────┐
│  ●  BH0003  [2 Queens!]         │  ← dot + name + state badge (inline)
│     South Field                 │  ← location (muted)
│                   14h  more ··· │  ← duration + blue "more" right-aligned
└─────────────────────────────────┘
```

## Component: Status Badge

```
 ┌──────────────┐
 │ Harmonious   │  background: #F0FDF4  text: #16A34A  rounded-full
 └──────────────┘

 ┌──────────────┐
 │ 2 Queens!    │  background: #FFF7ED  text: #EA580C  rounded-full
 └──────────────┘

 ┌──────────────┐
 │ Swarming     │  background: #FEF2F2  text: #DC2626  rounded-full
 └──────────────┘

 ┌──────────────┐
 │ Absconded    │  background: #F1F5F9  text: #64748B  rounded-full
 └──────────────┘
```

## Component: Overview Tile

```
 ┌────────────┐
 │  Device    │  ← label (caption, muted)
 │  Status    │
 │            │
 │  ● Online  │  ← value (title, bold)
 │  12 / 12   │  ← sub-value (caption)
 └────────────┘
 background: white  border: stone-200  radius: 12  shadow: sm
```

## Component: Alert Card

```
 ┌───────────────────────────────┐
 ║  (left accent bar, severity   │
 ║   color, 4px wide)            │
 │  🔴  CRITICAL                 │  ← severity icon + label
 │      BH0003 · South Field     │  ← hive + location
 │      Temperature spike        │  ← message
 │      Today at 13:45      →    │  ← time + chevron
 └───────────────────────────────┘
```
