# airn't 🚬🌫️

**airn't** is an atmospheric telemetry and behavioral economics web application that converts live Air Quality Index (AQI / $\text{PM}_{2.5}$) anywhere on Earth into **daily passive cigarettes smoked**—and calculates your **Marginal Propensity to Smoke a Real Cigarette** using peer-reviewed epidemiological and economic models.

---

## Core Econometric & Scientific Models

1. **Berkeley Earth Equivalence (Muller & Muller, 2015)**
   - $\mathbf{22\ \mu\text{g/m}^3\text{ of }\text{PM}_{2.5} \approx 1.0\text{ cigarette per day}}$ (24-hour outdoor exposure).
   - Dynamically adjusted for **outdoor exposure hours**, **minute-ventilation exertion multipliers** (`Sedentary 1.0x`, `Urban Stroll 1.35x`, `Brisk Commute 1.75x`, `Outdoor Cardio 2.8x`), and **indoor HEPA filtration** ($55\% \to 15\%$ infiltration).

2. **Pope et al. (2009, *Circulation*) Concave Dose-Response Curve**
   - Cardiovascular mortality relative risk follows a concave function of daily particulate dose $C$:
     $$\text{RR}(C) = 1 + \alpha \cdot \left((C + c_0)^{0.42} - c_0^{0.42}\right)$$
   - Because $\frac{\partial^2 \text{RR}}{\partial C^2} < 0$, the **Marginal Health Cost** of lighting 1 real cigarette ($MC(C_{\text{env}}) = \text{RR}(C_{\text{env}} + 1) - \text{RR}(C_{\text{env}})$) strictly decreases as baseline air pollution rises.

3. **Kahneman & Tversky (1979, *Econometrica*) Prospect Theory & Weber-Fechner Law**
   - Evaluates the perceptual salience of $+1$ active cigarette relative to your ambient reference point ($\Delta C / C_{\text{env}}$) and computes a **Perceptual Masking Score ($0\text{–}100$)**.

4. **Becker & Murphy (1988, *JPE*) Rational Addiction & Dow et al. (1999) Competing Risks**
   - Combines subjective hedonic craving with discounted marginal health cost and perceptual masking via a McFadden Random Utility Logit model to estimate **Marginal Smoking Propensity ($0\text{–}100\%$)**.

---

## Features

- **Hybrid Worldwide Live Air Quality**: Auto-detects GPS/IP location and searches any city on Earth via **Open-Meteo CAMS Global** + optional **WAQI (aqicn.org)** physical ground-station fusion.
- **Physical Cigarette Equivalence Rack**: Visualizes full and fractional burning cigarettes with animated embers, rising smoke plumes, and a **+1 Real Cigarette Weber Overlay**.
- **Interactive Econometric Curve Proof**: Dual-tab SVG chart plotting the **Pope (2009) Concave Dose-Response Curve** and **Becker-Murphy Marginal Crossover**.
- **City-to-City Duel & Relocation Calculator**: Compare any two cities worldwide for daily cigarette delta, annual packs saved/added, street value, and shift in smoking propensity.
- **7-Day History + 3-Day Forecast & Unpaid Tar Tax**: 10-day trajectory bar chart plus weekly, monthly, annual, and 10-year pack & street-value equivalents.
- **Global "Smokers' Lounge" Leaderboard**: Live-ranked global hotspots with one-click **Inspect** and **Duel** actions.
- **Shareable Atmospheric Warning Receipt**: Surgeon General & Behavioral Economist warning label receipt ready to copy or print.

---

## Quick Start

```bash
npm install
npm run dev
```
