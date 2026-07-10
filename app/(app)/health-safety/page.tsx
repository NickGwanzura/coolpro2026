'use client';

import { useMemo, useState } from 'react';
import {
    ShieldCheck, Stethoscope, CheckCircle2, Circle,
    CalendarDays, MapPin, Search, ChevronDown, ChevronUp, BookOpen,
    Wind, Flame, Skull, AlertTriangle, Gauge, Radio, DoorOpen, Lock, Siren,
} from 'lucide-react';

type CheckCategory = 'ventilation' | 'detection' | 'egress' | 'relief' | 'signage' | 'classification' | 'emergency' | 'ppe';

interface ChecklistItem {
    id: string;
    category: CheckCategory;
    title: string;
    desc: string;
    frequency: string;
}

interface ChecklistRecord {
    completed: boolean;
    date: string;
    place: string;
}

interface HazardArticle {
    id: string;
    category: 'classification' | 'ventilation' | 'flammability' | 'toxicity' | 'confined-space' | 'equipment' | 'detection' | 'emergency';
    title: string;
    summary: string;
    content: string;
    readingTime: string;
    icon: typeof ShieldCheck;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
    { id: '1', category: 'ventilation', title: 'Machinery Room Mechanical Ventilation Test', desc: 'Verify exhaust ventilation activates on detector alarm and meets the ASHRAE 15 §7.3 airflow rate (Q = 100√G, where G is refrigerant mass in the largest system).', frequency: 'Annual' },
    { id: '2', category: 'detection', title: 'Refrigerant Detector Calibration & Alarm Setpoint', desc: 'Calibrate fixed refrigerant detectors and confirm alarm setpoints trigger at or below the ASHRAE 34 Refrigerant Concentration Limit (RCL) for the refrigerant in use.', frequency: 'Every 6 months' },
    { id: '3', category: 'egress', title: 'Machinery Room Egress & Self-Closing Door Inspection', desc: 'Confirm doors swing outward in the direction of egress, close and latch automatically, and that exit paths remain unobstructed.', frequency: 'Annual' },
    { id: '4', category: 'relief', title: 'Pressure Relief Device & Discharge Piping Inspection', desc: 'Inspect relief valves and rupture members for correct sizing and confirm discharge piping is routed to a safe location per ASHRAE 15 Section 9.', frequency: 'Annual' },
    { id: '5', category: 'signage', title: 'Warning Signage & Refrigerant Labeling Audit', desc: 'Verify placards at machinery room entrances correctly identify the refrigerant, its ASHRAE 34 safety group, and required precautions.', frequency: 'Annual' },
    { id: '6', category: 'classification', title: 'Refrigerant Charge vs. Room Volume (RCL) Compliance', desc: 'Confirm the refrigerant charge in occupied and machinery spaces does not exceed the RCL for the applicable ASHRAE 34 classification (A1, A2L, A2, A3, B1, B2L, B2, B3).', frequency: 'Every 6 months' },
    { id: '7', category: 'emergency', title: 'Emergency Shut-Off, Alarm & SCBA Readiness Drill', desc: 'Test remote emergency shut-off switches located outside the machinery room and confirm self-contained breathing apparatus is staged, charged, and accessible.', frequency: 'Every 6 months' },
    { id: '8', category: 'ppe', title: 'PPE & Portable Gas Detection Equipment Check', desc: 'Verify portable refrigerant monitors are calibrated and PPE appropriate to the refrigerant class (gloves, goggles, respiratory protection) is stocked and serviceable.', frequency: 'Annual' },
];

const HAZARD_ARTICLES: HazardArticle[] = [
    {
        id: 'a1', category: 'classification',
        title: 'Understanding ASHRAE 34 Refrigerant Safety Classifications',
        summary: 'Every refrigerant carries a two-part safety code — a toxicity letter and a flammability number. Know what it means before you open a circuit.',
        content: `ASHRAE Standard 34 assigns every refrigerant a safety classification with two components: a toxicity class (A or B) and a flammability class (1, 2L, 2, or 3).

        Toxicity classification:
        • Class A — lower toxicity. No identified toxic effects at concentrations at or below 400 ppm (e.g., R-410A, R-134a, R-32).
        • Class B — higher toxicity. Evidence of toxicity at concentrations below 400 ppm (e.g., R-717 ammonia).

        Flammability classification:
        • Class 1 — does not propagate flame in air (e.g., R-410A, R-134a).
        • Class 2L — lower flammability, low burning velocity (≤10 cm/s), requires an ignition source and higher energy to ignite (e.g., R-32, R-454B, R-1234yf).
        • Class 2 — flammable, moderate burning velocity.
        • Class 3 — higher flammability, high burning velocity, low heat of combustion limit (e.g., R-290 propane, R-600a isobutane).

        Combined designations you will see on nameplates and MSDS sheets: A1, A2L, A2, A3, B1, B2L, B2, B3. The classification drives nearly every other requirement in ASHRAE 15 — allowable charge size for a given occupancy, machinery room ventilation rate, detector placement, and the electrical equipment rating permitted in the space.

        Before opening any system, confirm the refrigerant's ASHRAE 34 designation on the equipment nameplate. Never assume a drop-in or retrofit refrigerant shares the same class as the one it replaces — R-22 (A1) to R-454B (A2L) retrofits, for example, introduce flammability hazards that did not exist in the original design.`,
        readingTime: '6 min', icon: ShieldCheck,
    },
    {
        id: 'a2', category: 'ventilation',
        title: 'Machinery Room Ventilation & Refrigerant Concentration Limits (ASHRAE 15 §7)',
        summary: 'Mechanical ventilation and the Refrigerant Concentration Limit (RCL) are the backbone of machinery room safety design.',
        content: `ASHRAE 15 requires every refrigeration machinery room to have mechanical ventilation sized to remove refrigerant vapor before it reaches a hazardous concentration.

        The Refrigerant Concentration Limit (RCL):
        • Defined in ASHRAE 34 as the lesser of the toxicity-based exposure limit or the flammability-based limit (25% of the lower flammability limit, LFL).
        • Fixed refrigerant detectors must be set to alarm at or below the RCL, not above it.

        Ventilation rate requirement:
        • ASHRAE 15 §7.3 sets the required exhaust rate using Q = 100√G, where Q is airflow in cfm and G is the mass in pounds of refrigerant in the largest connected system.
        • Ventilation must activate automatically on detector alarm, not rely solely on manual operation.
        • Continuous ventilation may be required for some occupancy classes; emergency ventilation must run independently of normal HVAC.

        Exhaust and intake placement:
        • Discharge must be routed outdoors, away from air intakes, operable windows, and means of egress.
        • For refrigerants heavier than air (most halocarbons), exhaust intakes should be near the floor; for lighter-than-air refrigerants like ammonia, near the ceiling.

        Undersized or non-automatic ventilation is one of the most common machinery room deficiencies found in field audits. Verify airflow with an anemometer against the calculated Q value — do not trust a fan nameplate rating alone, as duct losses and filter loading reduce actual delivered airflow.`,
        readingTime: '7 min', icon: Wind,
    },
    {
        id: 'a3', category: 'flammability',
        title: 'Working Safely with A2L Mildly Flammable Refrigerants',
        summary: 'R-32, R-454B, and R-1234yf are reshaping the industry. ASHRAE 15 addenda set specific rules for handling class 2L refrigerants.',
        content: `A2L refrigerants (R-32, R-454B, R-454C, R-1234yf, and others) are classified as "lower flammability" — they need a stronger ignition source and burn more slowly than A2 or A3 refrigerants, but they are not non-flammable.

        Key differences from A1 handling:
        • Recovery machines, gauges, and leak detectors must be listed for use with flammable refrigerants — A1-rated tools are not automatically compatible.
        • Brazing and soldering on a charged A2L system requires purging the circuit with nitrogen to prevent an ignitable mixture inside the pipework, and the surrounding area must be ventilated below the LFL before hot work begins.
        • Static electricity discharge, exposed heating elements, and non-classified electrical switches are all recognized ignition sources — keep them away from potential leak points.
        • ASHRAE 15 sets maximum allowable A2L charge quantities per room based on floor area and ceiling height; exceeding them requires additional ventilation or detection.

        Field practices:
        • Never use a halide torch or open flame to leak-check an A2L system — use electronic leak detectors rated for flammable refrigerants or bubble solution.
        • Ground yourself and bond equipment before connecting service hoses to reduce static discharge risk.
        • Ventilate confined or enclosed spaces before and during any service work that could release refrigerant.
        • Store A2L cylinders away from ignition sources and heat, in accordance with the cylinder's flammable gas labeling.

        As A2L refrigerants become the default for new residential and light commercial equipment, treating every charged system as potentially flammable until confirmed otherwise is the safest working assumption.`,
        readingTime: '7 min', icon: Flame,
    },
    {
        id: 'a4', category: 'toxicity',
        title: 'Ammonia (R-717) & Class B Toxic Refrigerant Hazards',
        summary: 'Ammonia is an efficient, widely used industrial refrigerant — and a Class B toxic gas that can incapacitate at low concentrations.',
        content: `Ammonia (R-717) carries a B2L classification: higher toxicity, lower flammability. It remains one of the most common refrigerants in industrial and cold-storage applications because of its efficiency and zero ozone-depletion potential, but it demands rigorous exposure control.

        Exposure thresholds:
        • Detectable by smell at roughly 5 ppm — far below hazardous levels, which gives useful early warning.
        • OSHA PEL (permissible exposure limit) is 50 ppm as an 8-hour time-weighted average.
        • IDLH (Immediately Dangerous to Life or Health) is 300 ppm — self-contained breathing apparatus is required above this level.
        • At high concentrations, ammonia causes severe respiratory tract and eye damage within seconds.

        ASHRAE 15 requirements specific to ammonia systems:
        • Machinery rooms must have detection and ventilation designed for ammonia's lighter-than-air behavior — exhaust intakes near the ceiling, not the floor.
        • Emergency ventilation rate and detector alarm setpoints must be based on ammonia's RCL, distinct from the halocarbon calculation.
        • Machinery rooms handling ammonia typically require a water spray or deluge system in larger installations to knock down and dilute a release.

        PPE and emergency response:
        • Full-face respirators with ammonia-rated cartridges for concentrations below IDLH; SCBA is mandatory at or above IDLH or in an unknown atmosphere.
        • Chemical-resistant gloves and goggles are required for any direct handling of liquid ammonia — contact causes immediate caustic burns and frostbite.
        • Never enter an ammonia machinery room after an alarm without confirming atmospheric levels with a calibrated monitor first.`,
        readingTime: '7 min', icon: Skull,
    },
    {
        id: 'a5', category: 'confined-space',
        title: 'Confined Space & Oxygen Deprivation in Plant Rooms',
        summary: 'Refrigerant vapor is heavier than air and odorless in many blends — a slow leak in a below-grade plant room can silently displace breathable oxygen.',
        content: `Below-grade and enclosed machinery rooms are among the highest-risk confined spaces a technician enters, because a refrigerant leak displaces oxygen without necessarily triggering any obvious sensory warning.

        Why oxygen deprivation happens:
        • Most halocarbon refrigerants are significantly heavier than air and pool in low points — pits, sumps, and below-grade rooms.
        • A release large enough to displace oxygen below 19.5% causes impaired judgment and unconsciousness with little to no warning, since many refrigerants are odorless.
        • CO2 and nitrogen used for pressure testing and purging carry the same asphyxiation risk and are frequently underestimated because they are considered "inert" and therefore safe.

        Before entry:
        • Test the atmosphere with a calibrated multi-gas monitor for oxygen level, refrigerant concentration, and combustible gas — in that order of priority.
        • Do not rely on smell or visible fog as an indicator; by the time refrigerant vapor is visible, concentration may already be hazardous.
        • Ventilate the space mechanically and re-test before entry, even if the room's fixed detection system shows no alarm.

        Entry procedure:
        • Treat machinery rooms below grade or with limited egress as permit-required confined spaces — use an attendant, continuous atmospheric monitoring, and a retrieval plan.
        • Never silence or bypass a detector alarm to "get the job done" — investigate the cause before re-entering.
        • If a co-worker collapses inside a suspect atmosphere, do not enter without SCBA — becoming a second casualty helps no one; call for emergency response immediately.`,
        readingTime: '6 min', icon: AlertTriangle,
    },
    {
        id: 'a6', category: 'equipment',
        title: 'High-Pressure System Hazards & Relief Device Requirements',
        summary: 'Trapped liquid refrigerant, undersized relief valves, and misrouted discharge piping turn routine service into a pressure-vessel failure.',
        content: `Refrigeration circuits are pressure vessels, and ASHRAE 15 Section 9 sets specific requirements for the pressure-relief devices that protect them.

        Core hazards:
        • Hydraulic lock: liquid refrigerant trapped between two closed valves expands with temperature and can rupture piping or fittings with explosive force — liquid refrigerant is essentially incompressible.
        • Undersized relief valves fail to vent fast enough during an abnormal pressure event such as fire exposure or loss of condenser cooling.
        • Relief discharge routed to an occupied space, rather than outdoors to a safe location, turns a relief event into a toxic or flammable release indoors.

        ASHRAE 15 relief device requirements:
        • Pressure vessels above a specified internal volume must have a relief device sized per the standard's capacity formulas, based on vessel surface area and refrigerant type.
        • Discharge piping must be sized so it does not create excessive backpressure that prevents the relief device from functioning correctly.
        • Rupture members (bursting discs) used in series with a relief valve require a means to detect if the disc has ruptured, so an unnoticed loss of charge is not mistaken for continued protection.

        Field practices:
        • Never isolate a section of liquid line without opening a path for thermal expansion or verifying it is empty first.
        • Inspect relief valve discharge piping routing during every machinery room walkthrough — additions or building changes can inadvertently block or redirect a vent path.
        • Hydrostatic and standing pressure tests must stay within the equipment's rated MAWP (maximum allowable working pressure); never test above nameplate rating.`,
        readingTime: '6 min', icon: Gauge,
    },
    {
        id: 'a7', category: 'detection',
        title: 'Refrigerant Leak Detection Systems & Alarm Response',
        summary: 'Detector placement, setpoints, and alarm sequencing are engineered decisions — not afterthoughts bolted on after commissioning.',
        content: `A properly designed detection system is what makes the rest of ASHRAE 15's machinery room provisions function as intended. Detection triggers ventilation, alarms, and — at higher concentrations — evacuation.

        Placement principles:
        • For refrigerants heavier than air (most halocarbons), mount detectors low, near the floor and in low points where vapor pools.
        • For refrigerants lighter than air (ammonia), mount detectors high, near the ceiling.
        • Place detectors near likely leak sources: compressor seals, valve packing, flanged joints, and low points in piping.

        Setpoints and alarm sequencing:
        • First-stage alarm activates mechanical ventilation automatically, typically set well below the RCL to allow time for ventilation to clear the space.
        • Second-stage alarm, at or approaching the RCL, triggers audible/visual evacuation alarms both inside the machinery room and at entrances, and may lock out non-essential electrical equipment.
        • Setpoints must be verified against the specific refrigerant's RCL from ASHRAE 34 — a detector calibrated for one refrigerant is not automatically valid after a retrofit to a different one.

        Maintenance discipline:
        • Calibrate fixed detectors on the manufacturer's schedule, typically every 6–12 months, using certified calibration gas.
        • Function-test the full alarm chain — detector, ventilation activation, audible/visual alarms — not just the sensor reading.
        • Log every alarm event, false or real. A pattern of nuisance alarms at the same detector often indicates a real, slow leak rather than a faulty sensor.`,
        readingTime: '6 min', icon: Radio,
    },
    {
        id: 'a8', category: 'ventilation',
        title: 'Machinery Room Egress, Signage & Emergency Shut-Off',
        summary: 'When a release happens, the room itself needs to help you get out — door swing, signage, and shut-off location are all specified by ASHRAE 15.',
        content: `ASHRAE 15 treats the physical layout of a machinery room as a safety system in its own right, not just a housekeeping detail.

        Egress requirements:
        • Doors must swing in the direction of egress (outward, toward the exit path) so a technician moving away from a hazard is not fighting the door.
        • Doors must be self-closing and tight-fitting to contain a release and prevent vapor migration into adjoining occupied spaces.
        • Where two means of egress are required, they must be remote from each other so a single hazard cannot block both.

        Signage requirements:
        • A placard at each machinery room entrance must identify the refrigerant in use and its ASHRAE 34 safety classification.
        • Warning signage must be visible before entry, not just posted inside the room.
        • Labeling should be kept current — a placard referencing a refrigerant that was retrofitted years ago creates a false sense of the actual hazard present.

        Emergency shut-off:
        • A remote emergency shut-off switch, located outside the machinery room near an entrance, must de-energize refrigeration equipment without requiring entry into a hazardous atmosphere.
        • Emergency lighting and ventilation controls should remain functional even if the primary shut-off has been activated, so responders can safely assess conditions.

        During any machinery room retrofit or refrigerant changeover, re-verify that signage, egress door hardware, and shut-off switch labeling still match the equipment actually installed.`,
        readingTime: '5 min', icon: DoorOpen,
    },
    {
        id: 'a9', category: 'flammability',
        title: 'Fire & Explosion Hazards for Flammable Refrigerants (A2, A2L, A3)',
        summary: 'Understanding the Lower Flammability Limit (LFL) and ignition source control is essential wherever class 2, 2L, or 3 refrigerants are present.',
        content: `Flammable refrigerants ignite only within a specific concentration band in air — below the Lower Flammability Limit (LFL) there isn't enough fuel to sustain combustion; above the Upper Flammability Limit (UFL) there isn't enough oxygen.

        Why this matters operationally:
        • ASHRAE 34 sets the RCL for flammable refrigerants at 25% of the LFL, building in a substantial safety margin before a flammable mixture could even form.
        • Ventilation is the primary control — keeping the concentration in any occupied or machinery space well below the LFL at all times, not just during an active leak event.
        • A3 refrigerants (propane, isobutane) have low LFLs and high heats of combustion, meaning even modest charge sizes require careful room-volume calculations under ASHRAE 15.

        Ignition source control:
        • Electrical equipment installed in spaces where flammable refrigerant charge could exceed the RCL must meet classified area (explosion-proof or non-sparking) ratings.
        • Static electricity from ungrounded equipment, synthetic clothing, or plastic components is a recognized ignition source — bonding and grounding matter.
        • Open flames, cutting/grinding operations, and non-classified switches or relays should never be used near a system known or suspected to be leaking flammable refrigerant.

        Recognize that flammability risk is not binary — a well-ventilated, well-detected A2L installation with correctly rated equipment is engineered to keep the LFL threshold out of reach under normal and single-fault conditions. Every shortcut in ventilation, detection, or electrical rating erodes that margin.`,
        readingTime: '6 min', icon: Flame,
    },
    {
        id: 'a10', category: 'ventilation',
        title: 'Indoor Air Quality & Ventilation Rates (ASHRAE 62.1)',
        summary: 'Machinery room exhaust and occupied-space ventilation are governed by different standards — but a poorly coordinated design can undermine both.',
        content: `While ASHRAE 15 governs machinery room and refrigerant safety ventilation, ASHRAE 62.1 (Ventilation for Acceptable Indoor Air Quality) governs the outdoor air supplied to occupied spaces. The two interact wherever refrigeration equipment shares a building envelope with occupied areas.

        Ventilation Rate Procedure basics:
        • ASHRAE 62.1 sets minimum outdoor airflow based on occupancy type, floor area, and expected occupant density.
        • CO2 concentration is commonly used as a practical proxy for adequate ventilation in occupied spaces, though it does not directly indicate refrigerant presence.
        • Makeup air for machinery room exhaust must come from outdoors, not be pulled from an already-conditioned occupied space, or the building's overall ventilation balance is compromised.

        Where the standards intersect:
        • A machinery room exhaust fan that pulls makeup air through gaps into an adjoining occupied space can draw refrigerant-contaminated air along with it if the room isn't properly sealed.
        • Building pressurization design should ensure the machinery room stays at negative pressure relative to occupied spaces, so any leakage path draws air into the machinery room rather than out of it.
        • Recirculating air handling units should never share ductwork with a refrigeration machinery room's exhaust system.

        When investigating unexplained IAQ complaints (headaches, odors, stuffiness) in buildings with nearby mechanical or refrigeration plant, review both the 62.1 outdoor air supply and the 15-governed machinery room ventilation before assuming a purely HVAC-comfort cause.`,
        readingTime: '6 min', icon: Wind,
    },
    {
        id: 'a11', category: 'equipment',
        title: 'Electrical Hazards & Lockout/Tagout for Refrigeration Equipment',
        summary: 'Compressors, panels, and controls carry both electrical shock risk and — near flammable refrigerants — ignition risk. LOTO covers both.',
        content: `Refrigeration and AC equipment combines conventional electrical shock hazards with, in flammable-refrigerant installations, the added risk of electrical equipment acting as an ignition source.

        Lockout/Tagout fundamentals:
        • De-energize and verify zero energy state before opening any electrical panel, compressor terminal box, or control cabinet — never trust a switch position alone.
        • Apply a lock and tag that only the technician who applied it can remove, and test with a rated meter before touching conductors.
        • Capacitors can retain a lethal charge after power is removed — discharge them properly before servicing.

        Additional considerations near flammable refrigerants:
        • In spaces where A2, A2L, or A3 refrigerant concentration could reach the RCL, only classified (explosion-proof or intrinsically safe) electrical equipment should be installed or used for diagnostics.
        • Standard multimeters, work lights, and power tools are ignition sources in a flammable atmosphere — confirm the space is clear before using non-classified equipment.
        • Grounding and bonding of equipment reduces static discharge risk, which matters even when no active electrical fault exists.

        Arc flash awareness:
        • Larger compressors and disconnects can present an arc flash hazard — follow the equipment's labeled PPE category and maintain safe approach boundaries.
        • Never bypass a protective device (fuse, breaker, interlock) to get equipment running — it is protecting against a fault condition that still exists.`,
        readingTime: '6 min', icon: Lock,
    },
    {
        id: 'a12', category: 'emergency',
        title: 'Emergency Response Planning for Refrigerant Releases',
        summary: 'A detector alarm is the start of a response, not the end of the problem — know the sequence before you need it.',
        content: `Every site with refrigeration equipment above a minimal charge threshold should have a documented emergency action plan, and every technician working on that equipment should know it before an alarm sounds.

        On alarm activation:
        • Do not re-enter or remain in the machinery room once an evacuation-level alarm has sounded — exit immediately using the nearest unobstructed egress route.
        • Account for all personnel at a designated assembly point outside the affected area.
        • Notify emergency services and facility management with the refrigerant type and approximate quantity if known — this determines the appropriate response level.

        Re-entry procedure:
        • Only personnel with appropriate respiratory protection (SCBA for unknown or IDLH atmospheres) may re-enter to investigate.
        • Confirm the atmosphere with a calibrated monitor before removing respiratory protection, even after ventilation has been running.
        • Do not silence or reset an alarm system until the cause of the release has been identified and corrected.

        Post-incident:
        • Document the event: refrigerant type, estimated release quantity, detector readings, and response timeline.
        • Inspect the system for the release's root cause — a relief valve discharge, a failed fitting, a hydraulic lock event — before returning equipment to service.
        • Review whether detection setpoints, ventilation capacity, or signage performed as designed, and correct any gap identified.

        An emergency action plan that exists only on paper fails when it matters. Walk through it with the whole team, including what a real alarm sounds and looks like, before an actual release makes it the first time anyone has seen it in action.`,
        readingTime: '6 min', icon: Siren,
    },
];

const CATEGORY_LABELS: Record<string, string> = {
    classification: 'Refrigerant Classification',
    ventilation: 'Ventilation & RCL',
    flammability: 'Flammability Hazards',
    toxicity: 'Toxicity Hazards',
    'confined-space': 'Confined Space',
    equipment: 'Equipment Hazards',
    detection: 'Leak Detection',
    emergency: 'Emergency Response',
};

const CATEGORY_COLORS: Record<string, string> = {
    classification: 'bg-blue-50 text-blue-700 border-blue-200',
    ventilation: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    flammability: 'bg-orange-50 text-orange-700 border-orange-200',
    toxicity: 'bg-red-50 text-red-700 border-red-200',
    'confined-space': 'bg-amber-50 text-amber-700 border-amber-200',
    equipment: 'bg-slate-50 text-slate-700 border-slate-200',
    detection: 'bg-purple-50 text-purple-700 border-purple-200',
    emergency: 'bg-rose-50 text-rose-700 border-rose-200',
};

const CATEGORY_ICONS: Record<string, typeof ShieldCheck> = {
    classification: ShieldCheck,
    ventilation: Wind,
    flammability: Flame,
    toxicity: Skull,
    'confined-space': AlertTriangle,
    equipment: Gauge,
    detection: Radio,
    emergency: Siren,
};

const FREQUENCY_COLORS: Record<string, string> = {
    'Annual': 'bg-blue-50 text-blue-700',
    'Every 6 months': 'bg-amber-50 text-amber-700',
};

export default function HealthSafetyPage() {
    const [checklistState, setChecklistState] = useState<Record<string, ChecklistRecord>>({});
    const [articleSearch, setArticleSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

    const updateChecklist = (id: string, updates: Partial<ChecklistRecord>) => {
        setChecklistState(prev => ({
            ...prev,
            [id]: { ...prev[id] ?? { completed: false, date: '', place: '' }, ...updates },
        }));
    };

    const toggleComplete = (id: string) => {
        const current = checklistState[id];
        if (current?.completed) {
            updateChecklist(id, { completed: false });
        } else {
            updateChecklist(id, { completed: true, date: current?.date || '', place: current?.place || '' });
        }
    };

    const completedCount = Object.values(checklistState).filter(r => r.completed).length;

    const filteredArticles = useMemo(() => {
        return HAZARD_ARTICLES.filter(article => {
            const matchesSearch = !articleSearch ||
                article.title.toLowerCase().includes(articleSearch.toLowerCase()) ||
                article.summary.toLowerCase().includes(articleSearch.toLowerCase()) ||
                article.content.toLowerCase().includes(articleSearch.toLowerCase());
            const matchesCategory = !selectedCategory || article.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [articleSearch, selectedCategory]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        ASHRAE Safety Standards
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Safety & Hazards</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Track facility safety compliance and learn hazard controls per ASHRAE 15 & 34 standards.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Left Column: Checklist */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                            <div className="bg-rose-50 p-2 text-rose-600">
                                <Stethoscope className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-lg font-bold text-gray-900">ASHRAE Safety Compliance Checklist</h2>
                                <p className="text-sm text-gray-500">Track machinery room inspection dates and locations</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-gray-900">{completedCount}/{CHECKLIST_ITEMS.length}</p>
                                <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden mt-1">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${(completedCount / CHECKLIST_ITEMS.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {CHECKLIST_ITEMS.map((item) => {
                                const record = checklistState[item.id] ?? { completed: false, date: '', place: '' };
                                const isChecked = record.completed;
                                const hasDateTime = record.date || record.place;

                                return (
                                    <div key={item.id} className={`transition-colors ${isChecked ? 'bg-emerald-50/40' : 'hover:bg-gray-50'}`}>
                                        {/* Main row - click to toggle */}
                                        <div
                                            onClick={() => toggleComplete(item.id)}
                                            className="flex items-start gap-3 px-5 py-3.5 cursor-pointer"
                                        >
                                            <div className="mt-0.5 flex-shrink-0">
                                                {isChecked ? (
                                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                ) : (
                                                    <Circle className="h-5 w-5 text-gray-400 hover:text-blue-500 transition-colors" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className={`text-sm font-bold ${isChecked ? 'text-emerald-900' : 'text-gray-900'}`}>
                                                        {item.title}
                                                    </p>
                                                    <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-semibold ${FREQUENCY_COLORS[item.frequency] ?? 'bg-gray-50 text-gray-600'}`}>
                                                        {item.frequency}
                                                    </span>
                                                </div>
                                                <p className={`mt-0.5 text-xs leading-relaxed ${isChecked ? 'text-emerald-700' : 'text-gray-500'}`}>
                                                    {item.desc}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Date & Place fields */}
                                        <div className={`px-5 pb-3.5 pl-14 transition-all ${isChecked ? 'opacity-100' : 'hidden'}`}>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <div className="relative">
                                                    <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                                                    <input
                                                        type="date"
                                                        value={record.date}
                                                        onChange={(e) => updateChecklist(item.id, { date: e.target.value })}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-200 bg-white outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-300"
                                                        placeholder="Date"
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        value={record.place}
                                                        onChange={(e) => updateChecklist(item.id, { place: e.target.value })}
                                                        onClick={(e) => e.stopPropagation()}
                                                        placeholder="Site / machinery room..."
                                                        className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-200 bg-white outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-300"
                                                    />
                                                </div>
                                            </div>
                                            {hasDateTime && (
                                                <p className="mt-1 text-[10px] text-emerald-600 font-medium">
                                                    Recorded: {record.date || 'date not set'} · {record.place || 'place not set'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary */}
                        <div className="border-t border-gray-100 px-5 py-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-gray-600">
                                    {completedCount === CHECKLIST_ITEMS.length
                                        ? '✓ All checks tracked'
                                        : `${CHECKLIST_ITEMS.length - completedCount} remaining`}
                                </span>
                                {completedCount > 0 && (
                                    <span className="text-xs text-gray-400">
                                        {Object.values(checklistState).filter(r => r.date).length} with dates ·
                                        {Object.values(checklistState).filter(r => r.place).length} with locations
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Hazard & Standards Library */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                            <div className="bg-blue-50 p-2 text-blue-600">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Hazard & Standards Library</h2>
                                <p className="text-sm text-gray-500">{HAZARD_ARTICLES.length} articles on ASHRAE safety standards</p>
                            </div>
                        </div>

                        {/* Search & Filter */}
                        <div className="px-5 py-4 border-b border-gray-100 space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={articleSearch}
                                    onChange={(e) => setArticleSearch(e.target.value)}
                                    placeholder="Search articles..."
                                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 bg-gray-50 outline-none focus:border-blue-300 focus:bg-white transition-colors"
                                />
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    onClick={() => setSelectedCategory('')}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                                        !selectedCategory
                                            ? 'bg-gray-900 text-white border-gray-900'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                    }`}
                                >
                                    All
                                </button>
                                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                    <button
                                        key={key}
                                        onClick={() => setSelectedCategory(key)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                                            selectedCategory === key
                                                ? 'bg-gray-900 text-white border-gray-900'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Article Cards */}
                        <div className="divide-y divide-gray-100">
                            {filteredArticles.length === 0 ? (
                                <div className="px-5 py-12 text-center">
                                    <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No articles match your search.</p>
                                    <button
                                        onClick={() => { setArticleSearch(''); setSelectedCategory(''); }}
                                        className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            ) : (
                                filteredArticles.map((article) => {
                                    const isExpanded = expandedArticle === article.id;
                                    const CatIcon = CATEGORY_ICONS[article.category] ?? BookOpen;

                                    return (
                                        <div key={article.id} className="border-b border-gray-50 last:border-b-0">
                                            <button
                                                onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                                                className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors group"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`p-2 rounded-lg flex-shrink-0 ${CATEGORY_COLORS[article.category]?.split(' ').slice(0, 2).join(' ') || 'bg-gray-50 text-gray-600'}`}>
                                                        <CatIcon className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="text-sm font-bold text-gray-900">{article.title}</h3>
                                                            <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border ${CATEGORY_COLORS[article.category] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                                {CATEGORY_LABELS[article.category] || article.category}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-sm text-gray-600 leading-relaxed">{article.summary}</p>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <span className="text-xs text-gray-400">{article.readingTime} read</span>
                                                            <span className={`flex items-center gap-1 text-xs font-semibold transition-colors ${
                                                                isExpanded ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'
                                                            }`}>
                                                                {isExpanded ? (
                                                                    <>Show less <ChevronUp className="h-3 w-3" /></>
                                                                ) : (
                                                                    <>Read article <ChevronDown className="h-3 w-3" /></>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>

                                            {/* Expanded content */}
                                            {isExpanded && (
                                                <div className="px-5 pb-5 pl-16">
                                                    <div className="border-l-2 border-blue-200 pl-4">
                                                        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                                                            {article.content}
                                                        </div>
                                                        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                                                            <BookOpen className="h-3.5 w-3.5" />
                                                            <span>{article.readingTime} · {CATEGORY_LABELS[article.category]}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
