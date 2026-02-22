# ElisaLab — Business Plan

## Executive Summary

ElisaLab is a free, browser-based ELISA plate data analysis tool that replaces expensive desktop software (GraphPad Prism $300–1,200/yr, MyAssays Desktop ~$500/yr, Gen5 bundled with plate readers). Researchers paste plate reader data, fit a 4-Parameter Logistic curve, and get interpolated concentrations in seconds — no install, no license, no lock-in.

**Current state:** 80 tests (56 unit + 24 E2E) — the best-tested bioassay tool in the suite. 4PL fitting is production-solid.

---

## Market Validation

| Metric | Score | Notes |
|--------|-------|-------|
| Professional use case | 70% | Core immunoassay workflow in pharma/biotech/academic labs |
| Scales to full product | 40% | Single-plate MVP; multi-plate and LIMS needed for scale |
| Useful at MVP | 75% | Covers standard 4PL fitting + interpolation workflow |
| Would pay (incremental) | 60% | Strong value at $99–199/yr vs $300–1,200/yr competitors |
| Would pay (major) | 75% | Regulated labs need audit trails & compliance features |

## Competitive Landscape

| Competitor | Price | Strengths | Weaknesses |
|-----------|-------|-----------|------------|
| GraphPad Prism | $300–1,200/yr | Gold standard, publication-quality, broad fitting | Expensive, desktop-only, overkill for ELISA-only users |
| MyAssays Desktop | ~$500/yr | ELISA-focused, protocol templates, reader integration | Desktop install, Windows-only, dated UI |
| Gen5 (BioTek) | Bundled with reader | Seamless reader integration, automation | Vendor lock-in, no standalone option, expensive readers |
| SoftMax Pro | $500–2,000/yr | Molecular Devices ecosystem, 21 CFR Part 11 | Extreme vendor lock-in, Windows-only |

**ElisaLab advantage:** Free tier covers 80% of users. Browser-based = zero IT friction. Clean plate layout UI that competitors lack. Premium tiers undercut every competitor by 3–5×.

---

## Current Product (Free Tier)

### Features
- **Plate Data Import** — paste from Excel or upload CSV; auto-parses 8×12 OD grids
- **Visual Plate Layout Editor** — click to assign wells as Standard, Unknown, Blank, or Empty
- **4PL Curve Fitting** — Levenberg–Marquardt optimization with R² goodness of fit
- **Concentration Interpolation** — inverse 4PL solves unknowns from fitted standard curve
- **Statistics** — mean, SD, CV% for replicate groups; flags high-CV (>15%) and out-of-range
- **Interactive Standard Curve** — log-concentration vs OD scatter with 4PL overlay
- **Export** — CSV results download, PNG chart export

### Test Coverage
- 56 unit tests (engine: 4PL fitting, interpolation, statistics, plate parsing)
- 24 E2E tests (plate layout, curve fitting workflow, export)
- **Total: 80 tests** — highest coverage of any bioassay tool in the suite

### Strengths
- Clean plate layout UI with color-coded well types
- Solid 4PL fitting engine with Levenberg–Marquardt
- Concentration interpolation with out-of-range flagging
- CV% quality control with automatic replicate grouping

### Weaknesses (addressed in Phase 2–3)
- Single plate only — no multi-plate experiments
- No 5PL model for asymmetric curves
- No plate reader file import (Molecular Devices, BioTek, BMG formats)
- No audit trail or compliance features

---

## Phase 2 — Pro Tier ($99–199/yr)

Target: Individual researchers and small labs who need multi-plate analysis and reporting.

| Feature | Size | Description |
|---------|------|-------------|
| Multi-plate analysis | L | Link multiple plates in a single experiment; cross-plate normalization and statistics |
| Plate reader file import | M | Parse native formats from Molecular Devices (.txt), BioTek (Gen5 .xlsx), BMG (.csv), Tecan (.xlsx) |
| PDF report generation | M | Publication-ready report with plate layout, standard curve, results table, QC summary; @media print styles |
| 5PL model | M | 5-parameter logistic for asymmetric dose-response curves: `y = D + (A-D) / (1 + (x/C)^B)^E` |
| GLP audit trail | L | Timestamped log of all analysis steps, parameter changes, and data modifications; exportable for GLP documentation |

**Revenue model:** $99/yr individual, $199/yr lab license (up to 5 seats). Annual billing. 14-day free trial.

**Competitive position:** At $99–199/yr, ElisaLab Pro undercuts GraphPad Prism (3–12×) and MyAssays Desktop (2.5–5×) while adding browser-based convenience and multi-plate support.

---

## Phase 3 — Enterprise Tier ($299–499/yr)

Target: Regulated pharma/biotech labs and CROs that require compliance and integration.

| Feature | Size | Description |
|---------|------|-------------|
| LIMS integration | XL | REST API + webhooks for bidirectional data exchange with LabWare, STARLIMS, Benchling; sample ID lookup and result push |
| Batch analysis dashboard | L | Overview of all experiments with filtering, search, trend analysis; flag outlier plates and drift across batches |
| 21 CFR Part 11 compliance | XL | Electronic signatures, role-based access control, complete audit trail, data integrity controls, validation documentation (IQ/OQ/PQ) |
| Multi-analyte panels | L | Multiplex ELISA support: multiple analytes per plate with independent standard curves and cross-analyte QC |

**Revenue model:** $299/yr per seat, $499/yr enterprise (unlimited seats, SSO, priority support). Annual billing.

**Competitive position:** At $299–499/yr, ElisaLab Enterprise competes with SoftMax Pro ($500–2,000/yr) and regulated MyAssays ($1,000+/yr) at a fraction of the cost, with modern browser-based UX.

---

## Validation Strategy

### Reference Data Sources
- **Published 4PL datasets** — peer-reviewed ELISA data with known concentrations and curve parameters
- **GraphPad Prism output matching** — run identical datasets through Prism; verify parameter estimates (A, B, C, D), R², and interpolated concentrations match within tolerance
- **MyAssays comparison** — cross-validate against MyAssays online calculator for standard curves and QC metrics

### Validation Checkpoints
1. **4PL engine** — parameter estimates within 0.1% of GraphPad on reference datasets ✅ (done)
2. **Interpolation** — concentration values match GraphPad inverse-4PL within 1%
3. **CV% / QC** — replicate statistics match Excel manual calculations exactly
4. **5PL engine** (Phase 2) — validate against asymmetric datasets where 4PL fails
5. **Multi-plate** (Phase 2) — cross-plate normalization matches manual R calculations

---

## Revenue Projections

| Phase | Timeline | Price | Target Users | ARR Potential |
|-------|----------|-------|-------------|---------------|
| Free | Now | $0 | Students, academics, small labs | $0 (funnel) |
| Phase 2 (Pro) | +6 months | $99–199/yr | Individual researchers, core labs | $10K–50K |
| Phase 3 (Enterprise) | +12 months | $299–499/yr | Pharma, CROs, regulated labs | $50K–200K |

---

## Go-to-Market

1. **SEO + content** — "free ELISA analysis tool", "4PL curve fitting online", "ELISA data analysis software"
2. **Protocol.io / Benchling integration** — embed ElisaLab as analysis step in published protocols
3. **Journal figure generation** — publication-ready charts drive organic sharing
4. **Lab manager outreach** — free tier removes procurement friction; upsell on compliance needs
5. **Conference demos** — AACR, ASCB, SBS — live plate analysis in 60 seconds

---

## Technical Roadmap

```
Phase 1 (Current)     Phase 2 (Pro)           Phase 3 (Enterprise)
─────────────────     ──────────────────      ──────────────────────
✅ 4PL fitting        Multi-plate analysis    LIMS integration (XL)
✅ Plate layout UI    Plate reader import     21 CFR Part 11 (XL)
✅ Interpolation      PDF report generation   Batch dashboard (L)
✅ CV% QC             5PL model               Multi-analyte panels (L)
✅ CSV/PNG export     GLP audit trail
✅ 80 tests
```
