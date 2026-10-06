# Looksbitching

A private, on-device 60-day self-improvement app: posture and hyoid-muscle training, facial scan and rating, daily habits, reminders and a photo progress log.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export to ./out (serve with: npm start)
```

Next.js 15 (static export) + Tailwind 4. State lives in `localStorage`; photos and scans live in IndexedDB. Nothing is uploaded. The face model (`public/models/face_landmarker.task`) and its WASM runtime run in the browser.

## Tabs

1. **Today**: day X of 60, streak badges (7/30/60), today's sessions, quick check-in, next glow-up actions.
2. **Posture**: 8-week progressive calendar (days unlock daily, recovery days every 7th), exercise library with guided timers, and an evidence page.
3. **Scan**: camera/upload with outline guides, landmark analysis (symmetry, tilt, jaw edge, skin metrics), manual craniovertebral and cervicomental angle tools, four 1-10 scores with "how built" breakdowns, and a checkable action list.
4. **Routine**: water, AM/PM skincare, posture check-ins, sessions, sleep, weight; reminders; Day 1 / 30 / 60 photo comparison.

## What the research does and does not support

| Component | Evidence | Notes |
|---|---|---|
| Neck flexor curl / chin tuck | Strong to moderate (Jull 2002, Falla 2007) | Posture control and neck pain |
| Resisted chin tuck, swallow-and-hold | Moderate (Shaker 2002, Kahrilas 1991, Yoon 2014) | Strengthens suprahyoid muscles, shown in swallowing research |
| Tongue press / stretches | Moderate (Robbins 2005, Camacho 2015) | Tongue strength, breathing |
| Mewing / "raising the hyoid" for jawline | **Unproven** | No adult controlled trials. The app labels it as a posture habit |
| Daily SPF, sleep, hydration, fat loss | Strong to limited (Hughes 2013, Axelsson 2010, Palma 2015, Vispute 2011) | The main levers on how face and neck look |

Scores are uncalibrated estimates for tracking your own change, not a medical or aesthetic verdict. Not medical advice: stop any exercise that causes pain, dizziness, numbness or trouble swallowing.

## Reminders

Browsers cannot fire timers once fully closed. Reminders fire while the app is open or installed as a PWA. The app can also export a calendar (.ics) with 60-day repeating events for reliable alerts.
