export type Grade = "strong" | "moderate" | "limited" | "unproven";

export interface Study {
  id: string;
  cite: string;
  population: string;
  finding: string;
  grade: Grade;
  /** What this does and does not show for a glow-up goal. */
  caveat: string;
}

export const GRADE_LABEL: Record<Grade, string> = {
  strong: "Strong evidence",
  moderate: "Moderate evidence",
  limited: "Limited evidence",
  unproven: "Unproven for looks",
};

export const STUDIES: Record<string, Study> = {
  shaker2002: {
    id: "shaker2002",
    cite: "Shaker R, et al. Gastroenterology 2002;122:1314–1321",
    population: "Tube-fed dysphagia patients (abnormal UES opening)",
    finding:
      "6 weeks of the Shaker head-lift exercise (3 × 1-min holds + 30 reps, daily) increased anterior excursion of the hyoid/larynx and UES opening; most patients returned to oral feeding.",
    grade: "moderate",
    caveat:
      "Shows suprahyoid muscles can be trained and hyoid excursion improved in patients with swallowing disorders. It does not show a permanent change in resting hyoid position or jawline appearance in healthy people.",
  },
  kahrilas1991: {
    id: "kahrilas1991",
    cite: "Kahrilas PJ, et al. Am J Physiol 1991;260:G450–G456",
    population: "Healthy adults (videofluoroscopy)",
    finding:
      "Holding the larynx/hyoid up during a swallow (Mendelsohn manoeuvre) prolongs laryngeal elevation and widens UES opening.",
    grade: "moderate",
    caveat: "Acute, in-the-moment effect measured during swallowing. It is the basis of the 'swallow-and-hold' drill.",
  },
  yoon2014: {
    id: "yoon2014",
    cite: "Yoon WL, Khoo JKP, Rickard Liow SJ. Dysphagia 2014;29:243–248",
    population: "Healthy adults (sEMG)",
    finding:
      "Chin tuck against resistance (CTAR) produced suprahyoid muscle activity comparable to the Shaker exercise, with less neck strain.",
    grade: "moderate",
    caveat: "Muscle-activation study, not a long-term outcome trial.",
  },
  robbins2005: {
    id: "robbins2005",
    cite: "Robbins J, et al. J Am Geriatr Soc 2005;53:1483–1489",
    population: "Healthy older adults, 8-week programme",
    finding: "Progressive tongue-press exercise against the palate increased tongue strength and swallowing pressures.",
    grade: "moderate",
    caveat: "Functional strength gains in older adults. No facial-aesthetic outcome was measured.",
  },
  camacho2015: {
    id: "camacho2015",
    cite: "Camacho M, et al. Sleep 2015;38:669–675",
    population: "Meta-analysis, adults and children with sleep apnoea",
    finding:
      "Myofunctional therapy (tongue, soft-palate and facial exercises, incl. tongue posture and stretches) reduced apnoea–hypopnoea index by ~50% in adults.",
    grade: "moderate",
    caveat: "Supports tongue/oropharyngeal training for breathing. Not a jawline study.",
  },
  falla2007: {
    id: "falla2007",
    cite: "Falla D, et al. Phys Ther 2007;87:408–417",
    population: "Patients with chronic neck pain, RCT",
    finding:
      "Craniocervical flexor training (the 'neck flexor curl') improved the ability to hold an upright sitting posture compared with no training.",
    grade: "moderate",
    caveat: "Posture control in neck-pain patients. Strongest evidence in this app for posture work.",
  },
  jull2002: {
    id: "jull2002",
    cite: "Jull G, et al. Spine 2002;27:1835–1843",
    population: "Cervicogenic headache patients, RCT",
    finding: "Low-load craniocervical flexion training reduced headache frequency and neck pain; benefit persisted at 12 months.",
    grade: "strong",
    caveat: "Pain outcome, but establishes the technique and progression used here (10-s holds, graded intensity).",
  },
  yip2008: {
    id: "yip2008",
    cite: "Yip CHT, et al. Man Ther 2008;13:148–154",
    population: "Neck-pain patients vs controls",
    finding: "Smaller craniovertebral angle (more forward head) was associated with greater neck-pain severity and disability.",
    grade: "limited",
    caveat: "Observational. Basis for the ~50° craniovertebral angle rule of thumb.",
  },
  ellenbogen1980: {
    id: "ellenbogen1980",
    cite: "Ellenbogen R, Karlin JV. Plast Reconstr Surg 1980;66:826–837",
    population: "Plastic-surgery aesthetic criteria",
    finding: "Defined the cervicomental angle (chin–neck angle) with a youthful ideal of about 105–120°.",
    grade: "limited",
    caveat: "A clinical aesthetic benchmark, not an outcome trial. The angle is heavily driven by submental fat, skin laxity, jaw/chin projection and head posture.",
  },
  vispute2011: {
    id: "vispute2011",
    cite: "Vispute SS, et al. J Strength Cond Res 2011;25:2559–2564",
    population: "Adults, 27-day abdominal training RCT",
    finding: "Targeted exercise of a body region did not reduce fat in that region; fat loss was systemic.",
    grade: "moderate",
    caveat: "Why neck or face exercises alone won't remove submental fat. Overall fat loss is the lever.",
  },
  coetzee2009: {
    id: "coetzee2009",
    cite: "Coetzee V, Perrett DI, Stephen ID. Perception 2009;38:1694–1709",
    population: "Observers rating faces",
    finding: "Facial adiposity is a visible cue that observers read as health and attractiveness.",
    grade: "limited",
    caveat: "Perception study. Supports body-fat management as the main contour lever for a leaner jaw/neck.",
  },
  hughes2013: {
    id: "hughes2013",
    cite: "Hughes MCB, et al. Ann Intern Med 2013;158:781–790",
    population: "903 adults, 4.5-year RCT",
    finding: "Daily sunscreen use produced ~24% less skin ageing than discretionary use.",
    grade: "strong",
    caveat: "Gold-standard evidence for daily SPF as the top anti-ageing step.",
  },
  kafi2007: {
    id: "kafi2007",
    cite: "Kafi R, et al. Arch Dermatol 2007;143:606–612",
    population: "36 older adults, 24-week RCT",
    finding: "Topical retinol improved fine wrinkling and skin thickness in naturally aged skin versus vehicle.",
    grade: "moderate",
    caveat: "Irritation is common; start slowly. Avoid in pregnancy.",
  },
  palma2015: {
    id: "palma2015",
    cite: "Palma L, et al. Clin Cosmet Investig Dermatol 2015;8:413–421",
    population: "49 healthy women, 4-week intervention",
    finding: "Extra water intake increased skin hydration, most in people whose baseline intake was low.",
    grade: "limited",
    caveat: "Small study. Benefit is mainly if you are under-drinking.",
  },
  axelsson2010: {
    id: "axelsson2010",
    cite: "Axelsson J, et al. BMJ 2010;341:c6614",
    population: "23 adults, photos after sleep restriction",
    finding: "After 5 h sleep vs 8 h, faces were rated less healthy, less attractive, more tired, with darker circles and droopier mouth corners.",
    grade: "limited",
    caveat: "Small experiment but a direct appearance outcome. Sleep is a high-return habit.",
  },
  oyetakin2015: {
    id: "oyetakin2015",
    cite: "Oyetakin-White P, et al. Clin Exp Dermatol 2015;40:17–22",
    population: "60 women, poor vs good sleepers",
    finding: "Poor sleep quality was associated with more signs of skin ageing and slower recovery of the skin barrier.",
    grade: "limited",
    caveat: "Associational.",
  },
  rhodes2006: {
    id: "rhodes2006",
    cite: "Rhodes G. Annu Rev Psychol 2006;57:199–226",
    population: "Review of facial attractiveness research",
    finding: "Symmetry, averageness and sexual dimorphism contribute to rated attractiveness, but effect sizes for symmetry are modest.",
    grade: "limited",
    caveat: "Small asymmetry is normal. Don't chase it. Lighting, expression and angle swing measurements more than real differences.",
  },
  kaufman1998: {
    id: "kaufman1998",
    cite: "Kaufman KD, et al. J Am Acad Dermatol 1998;39:578–589",
    population: "1,553 men, 2-year RCT",
    finding: "Oral finasteride 1 mg slowed hair loss and regrew hair in men with androgenetic alopecia versus placebo.",
    grade: "strong",
    caveat: "Prescription medicine with side effects. Discuss with a doctor.",
  },
  olsen2002: {
    id: "olsen2002",
    cite: "Olsen EA, et al. J Am Acad Dermatol 2002;47:377–385",
    population: "393 men, 48-week RCT",
    finding: "Topical 5% minoxidil outperformed 2% and placebo for hair regrowth in androgenetic alopecia.",
    grade: "strong",
    caveat: "Works while you keep using it. Regrowth is mostly at the vertex; hairline response is smaller.",
  },
  mewing: {
    id: "mewing",
    cite: "Evidence gap: no controlled trials of 'mewing' in adults",
    population: "n/a",
    finding:
      "Tongue posture can influence craniofacial growth in children, mostly in observational work. No trials show that adult jaw bone or hyoid position is reshaped by resting tongue posture.",
    grade: "unproven",
    caveat:
      "Treat it as a free, harmless posture habit (nasal breathing, lips sealed, teeth lightly apart) and not a bone-reshaping tool. Pressing hard or clenching can aggravate jaw (TMJ) pain.",
  },
};

export const study = (id: string) => STUDIES[id];
