'use client';

import { useMemo, useState } from 'react';
import {
    ShieldCheck, HeartPulse, Stethoscope, CheckCircle2, Circle,
    CalendarDays, MapPin, Search, ChevronDown, ChevronUp, BookOpen,
    Dumbbell, Brain, Apple, Wind, Sun, Moon, Eye, Ear, AlertTriangle,
} from 'lucide-react';

type CheckCategory = 'respiratory' | 'hearing' | 'vision' | 'musculoskeletal' | 'dermatological' | 'cardiac' | 'mental' | 'blood';

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

interface WellnessArticle {
    id: string;
    category: 'physical' | 'mental' | 'nutrition' | 'ergonomics' | 'safety' | 'lifestyle';
    title: string;
    summary: string;
    content: string;
    readingTime: string;
    icon: typeof ShieldCheck;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
    { id: '1', category: 'respiratory', title: 'Annual Respiratory Exam', desc: 'Spirometry and lung function test due to refrigerant and chemical vapor exposure.', frequency: 'Annual' },
    { id: '2', category: 'hearing', title: 'Hearing Assessment', desc: 'Audiometry test for exposure to loud plant rooms, compressors, and power tools.', frequency: 'Annual' },
    { id: '3', category: 'vision', title: 'Vision Screening', desc: 'Regular eye exams for working with detailed schematics, brazing, and high-pressure systems.', frequency: 'Annual' },
    { id: '4', category: 'musculoskeletal', title: 'Musculoskeletal Check', desc: 'Assessment of back, knees, and shoulders due to heavy lifting and awkward confined-space postures.', frequency: 'Every 6 months' },
    { id: '5', category: 'dermatological', title: 'Dermatological Check', desc: 'Skin examination for irritation from POE oils, lubricants, solvents, and chemical exposure.', frequency: 'Annual' },
    { id: '6', category: 'cardiac', title: 'Cardiovascular Screening', desc: 'Blood pressure and heart health check — especially for technicians working in extreme heat or high altitudes.', frequency: 'Annual' },
    { id: '7', category: 'mental', title: 'Mental Health Assessment', desc: 'Confidential screening for stress, anxiety, and burnout from on-call pressure and long hours.', frequency: 'Every 6 months' },
    { id: '8', category: 'blood', title: 'Blood Chemistry Panel', desc: 'Full blood count and liver/kidney function to monitor long-term effects of refrigerant and chemical exposure.', frequency: 'Annual' },
];

const WELLNESS_ARTICLES: WellnessArticle[] = [
    {
        id: 'a1', category: 'physical',
        title: 'Managing Thermal Stress in Extreme Environments',
        summary: 'Stay safe working in freezing cold rooms or scorching rooftops with proper hydration, clothing layering, and break scheduling.',
        content: `Technicians face some of the most extreme temperature swings of any profession. One hour you may be on a sun-baked rooftop in 38°C heat, the next inside a -20°C cold room. This thermal shock places enormous strain on your cardiovascular system.

        Key strategies for heat management:
        • Pre-hydrate before starting outdoor work — drink 500ml of water 30 minutes before exposure.
        • Wear moisture-wicking base layers under coveralls; avoid cotton which stays wet against the skin.
        • Use cooling towels or vests when working in direct sun or enclosed plant rooms.
        • Schedule heavy physical tasks for cooler morning hours when possible.
        • Recognize heat exhaustion early: headache, dizziness, nausea, excessive sweating that suddenly stops.

        For cold environment work:
        • Layer properly: base (synthetic), mid (fleece), outer (windproof shell).
        • Never wear cotton as a base layer in cold rooms — it loses all insulating properties when damp.
        • Take 10-minute warming breaks every 45 minutes in cold storage areas.
        • Keep a thermos with warm electrolyte drink, not coffee (caffeine constricts blood vessels).
        • Watch for signs of hypothermia: shivering that stops (ominous), confusion, loss of fine motor control.

        Thermal stress is cumulative. A full day of temperature swings can impair judgment as much as moderate alcohol consumption. When in doubt, stop, hydrate, and regulate your core temperature before continuing.`,
        readingTime: '5 min', icon: Sun,
    },
    {
        id: 'a2', category: 'ergonomics',
        title: 'Proper Lifting & Body Mechanics for the Field',
        summary: 'Protect your back, knees, and shoulders with proven techniques for handling compressors, cylinders, and equipment in tight spaces.',
        content: `Back injuries are the most common workplace injury among HVAC-R technicians. Compressors, refrigerant cylinders, and tools regularly exceed 30kg, and the awkward positions you work in compound the risk.

        Foundation principles:
        • Keep your spine in its natural S-curve — never lift with a rounded back.
        • Engage your core before lifting by bracing your abdominal muscles.
        • Position your feet shoulder-width apart with one foot slightly forward for stability.
        • Keep the load as close to your body as possible — every inch away from your spine multiplies the force on your discs by 10x.

        Specific techniques:
        • For compressor lifts: squat down keeping the compressor between your knees, hug it close to your chest, and drive up through your heels.
        • For cylinder handling: always use a hand truck or dolly for cylinders over 20kg. Tip the cylinder onto the dolly using your legs, not your back.
        • For overhead work (ductwork, overhead piping): use a ladder or platform to position yourself at chest level rather than working with arms raised — prolonged overhead work leads to rotator cuff damage.
        • For confined spaces: crawl instead of crouching if you have to maintain position longer than 2 minutes. Bring knee pads and a low-profile stool.

        Daily maintenance:
        • Stretch your hip flexors and hamstrings every morning — tight hips pull your lower back out of alignment.
        • Do 5 minutes of core activation (planks, bird-dogs) before starting physically demanding days.
        • Never ignore "twinges" — a small back tweak today is a slipped disc tomorrow if you don't rest and recover.`,
        readingTime: '6 min', icon: Dumbbell,
    },
    {
        id: 'a3', category: 'safety',
        title: 'Chemical & Refrigerant Exposure: What Every Tech Must Know',
        summary: 'Understand the health effects of refrigerant exposure, proper PPE protocols, and when to seek medical attention.',
        content: `Every HVAC-R technician works with potentially hazardous chemicals daily. Chronic low-level exposure is often overlooked but can cause serious long-term health effects.

        Common exposure routes:
        • Inhalation: refrigerant vapors displace oxygen in confined spaces. Even "safe" A1 refrigerants can cause asphyxiation in high concentrations.
        • Skin contact: POE oils, refrigerants, and cleaning solvents strip the skin's natural oils, leading to dermatitis and increased absorption.
        • Eye contact: liquid refrigerant can cause frostbite on contact; solvent splashes cause chemical burns.
        • Ingestion: from contaminated hands — always wash before eating or smoking.

        Critical protection measures:
        • Always wear nitrile gloves (not latex — refrigerants degrade latex rapidly). For R-1233zd and other solvents, use Butyl gloves.
        • Safety glasses are mandatory when opening any refrigerant circuit. Full-face shields protect against liquid refrigerant spray during recovery.
        • Use a portable refrigerant monitor/detector in confined spaces before and during work.
        • Never use refrigerant to "dust off" clothing or workbenches — this causes airborne contamination and frostbite risk.

        Symptoms requiring immediate medical attention:
        • Cardiac arrhythmia (heart palpitations, irregular pulse) after high-level exposure to halogenated refrigerants.
        • Persistent cough, wheezing, or shortness of breath following any exposure incident.
        • Skin that feels numb, waxy, or appears white after contact with liquid refrigerant (frostbite).
        • Headache, dizziness, or confusion that persists after moving to fresh air.

        Annual health monitoring — the exams in your checklist are not optional. They establish baseline lung function, hearing, and skin condition so that occupational health changes can be caught early.`,
        readingTime: '7 min', icon: Wind,
    },
    {
        id: 'a4', category: 'mental',
        title: 'Mental Health & Fatigue Management for On-Call Technicians',
        summary: 'Recognize burnout, manage shift fatigue, and build resilience for the demands of 24/7 service work.',
        content: `The HVAC-R industry demands 24/7 availability. Emergency call-outs, long shifts, and the pressure of keeping critical systems running take a heavy toll on mental health.

        Recognizing occupational fatigue:
        • Physical: yawning frequently, heavy eyelids, craving sugar or caffeine, micro-sleeps (nodding off for seconds).
        • Cognitive: difficulty concentrating on schematics, making simple calculation errors, forgetting tools.
        • Emotional: irritability with customers or colleagues, feeling overwhelmed by routine tasks, apathy about work quality.

        Immediate fatigue management:
        • The 20-minute power nap: park safely, set an alarm, and nap for exactly 20 minutes. Longer causes sleep inertia.
        • Strategic caffeine: consume caffeine and then nap for 20 minutes — the caffeine takes effect just as you wake up.
        • Never drive fatigued — pull over and call dispatch to explain. No customer emergency is worth a wreck.
        • After a night call-out, block 4 hours of uninterrupted sleep the following morning. Do not try to "push through."

        Long-term resilience:
        • Establish a sleep routine even on days off — erratic sleep patterns worsen fatigue susceptibility.
        • Set boundaries with dispatch: specify your acceptable call-out hours and maximum shift length.
        • Use the "wind-down" ritual: 30 minutes of screen-free time before bed (reading, stretching, conversation).
        • Connect with peers — isolation worsens mental health. Join technician forums or WhatsApp groups.
        • Know your resources: many industry associations offer confidential counseling. The cost of a session is far less than the cost of a burnout-induced accident.

        Remember: your employer needs you safe and functional more than they need you available 24/7. Professional technicians communicate their limits clearly.`,
        readingTime: '6 min', icon: Brain,
    },
    {
        id: 'a5', category: 'nutrition',
        title: 'Nutrition & Hydration for Peak Field Performance',
        summary: 'Fuel your body for physical work with practical meal prep, hydration strategies, and snack choices that sustain energy all day.',
        content: `A technician's workday is an athletic event. You lift, crawl, climb, and problem-solve for 8-12 hours. Yet most techs fuel themselves with sad sandwiches and energy drinks.

        The problem with "skipping lunch":
        • Blood sugar crashes in the afternoon impair cognitive function — you make more calculation errors.
        • Dehydration by just 2% reduces physical performance by 20% and mental focus by 30%.
        • Energy drinks create a cycle of spikes and crashes that leave you more fatigued by end of day.

        Practical field nutrition:
        • Breakfast rule: protein + complex carbs + fat. Example: eggs, oats with peanut butter, banana. Skip sugary cereals.
        • Lunch: cold grain bowl (quinoa/rice + canned fish or chicken + vegetables) stays fresh in a cooler. Avoid heavy, greasy meals that cause afternoon lethargy.
        • Snacks: nuts and seeds (protein + healthy fats), fresh fruit (natural sugar + fiber), Greek yogurt cups.
        • Hydration schedule: 500ml water on arrival at site, 250ml every hour, 500ml after heavy exertion. Add electrolyte tablets when sweating heavily.
        • Limit caffeine to 2 cups before noon. After noon, switch to water or herbal tea to protect sleep quality.

        Specific considerations for RAC techs:
        • Cold environments increase calorie needs — your body burns energy maintaining core temperature. Pack extra snacks for cold room work.
        • Heat environments require electrolyte replacement — not just water. Coconut water, electrolyte tabs, or salted nuts.
        • Avoid dairy before heavy physical work if you're lactose sensitive — it causes bloating and discomfort in confined spaces.

        Your service vehicle is also your lunch room. Keep a cooler with ice packs, refillable water bottles, and a stash of non-perishable healthy snacks. Meal prep Sunday saves your health, your money, and your performance.`,
        readingTime: '5 min', icon: Apple,
    },
    {
        id: 'a6', category: 'physical',
        title: 'Eye Health & Vision Protection for Technicians',
        summary: 'Protect your vision from UV exposure during brazing, refrigerant splashes, and digital eye strain from schematics and reporting.',
        content: `Your eyes are your most critical diagnostic tool. Yet techs routinely risk them through inadequate eye protection and prolonged screen time for digital reporting.

        Workplace vision hazards:
        • UV flash from brazing: even brief exposure causes painful photokeratitis (welder's flash). Use shade 5+ welding goggles or #3 shade brazing glasses.
        • UV exposure from sunlight: cumulative UV exposure increases cataract risk. Wear UV400-rated safety glasses even on cloudy days.
        • Chemical splashes: refrigerant liquid, POE oils, and coil cleaning chemicals cause chemical conjunctivitis and corneal damage.
        • Digital eye strain: 2+ hours of daily tablet/laptop use for digital reporting causes Computer Vision Syndrome — dry eyes, headaches, blurred vision.

        Protection protocol:
        • Primary protection: Z87.1-rated safety glasses with side shields for all site work. Keep them on your forehead when not actively wearing them.
        • Task-specific: full-face shield for recovery operations, shade 5 welding goggles for brazing, clear anti-fog for cold room work.
        • Readers: if you need reading glasses for schematics, get safety-rated prescription readers. Never wear regular reading glasses on site.
        • Anti-glare: apply anti-glare screen protectors to your tablet/phone for outdoor use.

        Vision health maintenance:
        • The 20-20-20 rule: every 20 minutes of screen time, look at something 20 feet away for 20 seconds.
        • Use artificial tears (preservative-free) before starting screen work — preventing dry eyes is easier than treating them.
        • Never rub your eyes with refrigerant-contaminated gloves — this causes chemical conjunctivitis.
        • Annual vision screening (on your checklist) is mandatory — early glaucoma and cataract detection saves sight.

        A good pair of safety glasses costs under $20. A corneal abrasion or cataract surgery costs thousands — in dollars and in lost work.`,
        readingTime: '5 min', icon: Eye,
    },
    {
        id: 'a7', category: 'safety',
        title: 'Hearing Conservation in High-Noise Environments',
        summary: 'Protect your hearing from compressor rooms, plant machinery, and power tools with proper protection and regular screening.',
        content: `Hearing loss is permanent, painless, and progressive. By the time you notice it, the damage is done. HVAC-R environments regularly exceed 85 dB — the threshold where hearing damage begins.

        Common noise sources and levels:
        • Compressor rooms: 85-100 dB (hearing damage after 15 minutes unprotected above 95 dB)
        • Angle grinders / cutoff tools: 100-110 dB (damage within minutes)
        • Hammer drills on concrete: 110-120 dB (immediate risk)
        • Multiple units running in plant rooms: 90-105 dB sustained

        Protection strategy:
        • Know your environment: if you have to raise your voice to be heard at arm's length, the noise level is above 85 dB. Wear protection.
        • Choose the right protection for the task:
          - Disposable foam earplugs: 29-33 NRR, good for most environments. Insert correctly — roll, pull ear back, hold until expanded.
          - Reusable banded plugs: convenient for in-and-out of noise zones.
          - Earmuffs: 22-29 NRR, easier to don/doff, better for intermittent noise.
          - Electronic muffs: amplify speech while blocking harmful noise — ideal for communicating in plant rooms.
        • For dual protection (e.g., jackhammering near compressors): wear plugs AND muffs for maximum attenuation.

        Best practices:
        • Keep earplugs in your toolbox and in your vehicle. You can't use what you don't have.
        • Replace foam plugs after each use; clean reusable plugs with mild soap and water.
        • Never listen to music/podcasts through earbuds as a substitute for hearing protection — this trains your brain to tune out important environmental sounds.
        • Take "hearing breaks" in quiet areas during long noise exposures.

        Your annual audiometry test (on your checklist) is your early warning system. A 10 dB loss at 4000 Hz (typical noise-induced pattern) doesn't affect conversation but is the first sign of damage. Catch it early, protect what remains.`,
        readingTime: '6 min', icon: Ear,
    },
    {
        id: 'a8', category: 'ergonomics',
        title: 'Confined Space Ergonomics: Saving Your Body in Tight Spots',
        summary: 'Techniques and tools to prevent injury when working in attics, crawl spaces, ceiling voids, and mechanical rooms.',
        content: `Confined spaces are a fact of life for HVAC-R technicians. Ceiling voids, crawl spaces, mechanical room corners — these postures are ergonomic disasters waiting to cause chronic injury.

        The real cost of confined space work:
        • Kneeling for extended periods damages the patellofemoral joint and bursae (prepatellar bursitis = "housemaid's knee").
        • Twisting while lying on your side to reach a service valve torques the lumbar spine.
        • Working with arms overhead in a ceiling void causes rotator cuff impingement and thoracic outlet syndrome.

        Gear that saves your body:
        • Professional knee pads with gel inserts and a hard cap — not the $10 foam ones. Worth every cent.
        • A low-profile mechanic's stool/creeper for under-unit work — keeps your spine neutral.
        • Headlamp with a wide beam angle — prevents the neck craning that causes cervicogenic headaches.
        • Extendable inspection mirror and magnetic pickup tools — reach without reaching.

        Body mechanics for tight spaces:
        • Side-lying technique: lie on your side with a rolled-up jacket under your waist to maintain spine alignment, rather than lying on your back twisted.
        • The tripod position: if you must kneel, use one knee down, one foot flat — this keeps your pelvis more aligned and allows quick standing.
        • Take the "2-minute rule": any position held longer than 2 minutes needs adjustment. Shift weight, change knee position, stand and stretch.
        • Pre-work mobility: 30 seconds of hip circles, cat-cow stretches, and ankle rotations before crawling into a tight space.

        The best ergonomic intervention is the right tool for the job. A $50 long-reach tool is cheaper than one physiotherapy session. Invest in your body — it's the only tool you can't replace.`,
        readingTime: '5 min', icon: AlertTriangle,
    },
    {
        id: 'a9', category: 'lifestyle',
        title: 'Sleep Recovery: The Technician\'s Essential Performance Tool',
        summary: 'Optimize your sleep for shift work, on-call disruptions, and recovery from physically demanding days.',
        content: `Sleep is when your body repairs micro-damage to muscles, consolidates learning from the day, and resets your immune system. For technicians, good sleep is not a luxury — it's a safety requirement.

        The cost of sleep deprivation:
        • 24 hours without sleep = cognitive impairment equivalent to 0.10% BAC (legally drunk).
        • 6 hours of sleep per night for 2 weeks = performance equivalent to 2 nights of total sleep deprivation.
        • Sleep-deprived workers have 70% more workplace accidents and take 2x longer to recover from injuries.

        Shift work sleep strategies:
        • The anchor sleep principle: regardless of shift timing, protect a 4-hour block of sleep at the same time each day. This anchors your circadian rhythm.
        • Pre-shift nap: 90 minutes before a night shift gives you a full sleep cycle. Even 20 minutes improves alertness for 3-4 hours.
        • Post-shift wind-down: 30 minutes of dim light, cool temperature, and no screens before sleeping after a night shift.
        • Darken your bedroom: blackout curtains, no LED lights, cover clock displays. Light exposure during sleep reduces melatonin by 50%.

        Creating a sleep sanctuary:
        • Temperature: 18-20°C is optimal for sleep. Cooler is better than warmer.
        • Noise: use a white noise machine or fan to mask intermittent sounds (traffic, neighbors).
        • The 10-3-2-1 rule before bed:
          - 10 hours before bed: no more caffeine.
          - 3 hours before bed: no more food (digestion interferes with deep sleep).
          - 2 hours before bed: no more work emails or calls.
          - 1 hour before bed: no screens (blue light suppresses melatonin).

        After a call-out:
        • Note what you did, what you fixed, and any follow-up needed before sleeping — offload the mental checklist.
        • Set an alarm for essential calls/texts only — silence all other notifications.
        • If you can't fall asleep within 20 minutes, get up and read something boring in dim light until sleepy. Don't lie in bed frustrated.

        Your body repairs itself only during deep sleep. A skipped night of recovery sleep takes 3-4 days to fully recover from. Prioritize sleep like you prioritize safety glasses.`,
        readingTime: '6 min', icon: Moon,
    },
    {
        id: 'a10', category: 'mental',
        title: 'Building Resilience: Handling Customer Pressure & High-Stakes Decisions',
        summary: 'Stay calm under pressure, manage difficult customer interactions, and make clear decisions when systems are down.',
        content: `When a supermarket's refrigeration fails in summer, or a hospital's AC goes down during a procedure, the pressure on the technician is immense. Customers are stressed, managers are calling, and you're expected to perform.

        Understanding pressure responses:
        • The Yerkes-Dodson law: moderate stress improves performance. High stress impairs it. You need to find your optimal zone.
        • Under high stress, your brain shifts from prefrontal cortex (rational decision-making) to amygdala (fight-or-flight). This is why you "blank" on basic diagnostic steps.
        • Physical signs of being over-stressed: rapid breathing, clenched jaw, sweaty palms, tunnel vision.

        The S.T.O.P. technique for high-pressure moments:
        • S — Stop. Physically stop what you're doing. Put down your tools.
        • T — Take a breath. Inhale for 4 counts, hold for 4, exhale for 6. Activate your parasympathetic nervous system.
        • O — Observe. What is the actual problem? What information do you have? What do you need?
        • P — Proceed. Make a plan with one step at a time. Don't solve everything at once.

        Managing difficult customer interactions:
        • Listen first: let the customer vent for 60 seconds without interrupting. They need to feel heard.
        • Acknowledge: "I understand this is critical for your business. Let me explain what I've found and what we can do."
        • Set realistic expectations: "I can restore partial cooling in 30 minutes to protect your stock, but the full repair will take 2 hours."
        • Never promise what you can't deliver — it's better to under-promise and over-deliver.
        • If you need a second opinion, say so. "This system is complex. I want to confirm my approach with our senior tech before proceeding."

        After a high-pressure call:
        • Debrief with yourself or a colleague: what went well? What would you do differently?
        • Write down any lessons learned before they fade.
        • Allow yourself 15 minutes of quiet decompression before the next call.
        • If the pressure is chronic (multiple high-stress calls per week), talk to your supervisor about load balancing.

        The best techs aren't the ones who never feel pressure — they're the ones who have built systems to handle it well.`,
        readingTime: '6 min', icon: HeartPulse,
    },
    {
        id: 'a11', category: 'nutrition',
        title: 'Immune System Support for Field Technicians',
        summary: 'Strengthen your immune system against the constant exposure to temperature changes, dust, chemicals, and public environments.',
        content: `Technicians have uniquely demanding immune challenges: temperature shock, chemical exposure, dust and mold in ceiling spaces, and constant interaction with the public. A robust immune system isn't optional — it's job-critical.

        Why techs get sick more often:
        • Thermal stress suppresses immune function — moving between hot and cold environments stresses the body.
        • Sleep disruption from call-outs reduces natural killer cell activity by up to 70%.
        • Chemical exposure (refrigerants, solvents, cleaning agents) can irritate respiratory mucosa, making you more susceptible to infection.
        • Public interaction in homes, hospitals, and food processing plants exposes you to novel pathogens.

        Immune-supporting habits:
        • Vitamin D: 2000-4000 IU daily during winter months or if you wear full coverage PPE. Deficiency is rampant in shift workers.
        • Zinc: 15-30 mg/day supports immune cell function. Best source: pumpkin seeds, oysters, or a supplement taken with food.
        • Vitamin C: 500-1000 mg/day, but from food sources (citrus, bell peppers, kiwi) rather than supplements — whole-food sources have better absorption.
        • Probiotics: fermented foods (yogurt, kefir, sauerkraut) or a quality probiotic support gut immunity — 70% of immune cells live in your gut.

        Practical immune protection on the job:
        • Wash hands before eating, after removing gloves, and after touching your face. Hand sanitizer is a backup, not a replacement.
        • Keep hand lotion in your toolbox — dry, cracked skin from frequent washing is a portal for infection.
        • Never eat in a worksite area where refrigerant or chemical residue may be present.
        • Change out of work clothes before eating at home. Don't sit on your couch in the same clothes you wore in a ceiling void.
        • Stay current with tetanus and hepatitis B vaccinations — both are industry-relevant risks.

        Red flags that need medical attention:
        • A cough that persists more than 3 weeks after a respiratory infection.
        • Skin infections that don't heal within a week.
        • Unexplained fatigue lasting more than 2 weeks.
        • Recurring sinus infections — may indicate occupational rhinitis from chemical exposure.

        Your immune system is your daily PPE that you can't see. Maintain it as carefully as you maintain your tools.`,
        readingTime: '5 min', icon: ShieldCheck,
    },
    {
        id: 'a12', category: 'lifestyle',
        title: 'Stretching & Mobility Routine for HVAC-R Technicians',
        summary: 'A 10-minute daily stretching routine targeting the specific muscle groups that take the most abuse on the job.',
        content: `Technicians develop predictable patterns of tightness and weakness: tight chest and shoulders (from reaching forward), weak glutes and core (from prolonged sitting in trucks), tight hip flexors (from sitting and crouching), and weak upper back (from forward head posture reading schematics).

        The 10-Minute Daily Mobility Routine:

        Morning (before work):
        1. Cat-Cow (1 min) — 10 slow cycles. Mobilizes the entire spine after sleeping.
        2. Hip circles (1 min) — 10 each direction. Warms up the hips for crouching and kneeling.
        3. Shoulder rolls (30 sec) — 10 forward, 10 backward. Releases tension from overnight.
        4. Ankle circles (30 sec) — 10 each foot. Prevents ankle sprains on uneven sites.

        Midday (lunch break):
        5. Doorway chest stretch (1 min) — 30 seconds each side. Counteracts forward-reaching posture.
        6. Seated hamstring stretch (1 min) — 30 seconds each leg. Relieves lower back tension.
        7. Neck side bends (30 sec) — 5 each side, with gentle traction. Releases trapezius tension.
        8. Wrist flexor stretch (30 sec) — 15 seconds each arm. Prevents repetitive strain from wrench work.

        Evening (after work):
        9. Child's pose (1 min) — Relaxes the entire back and shoulders.
        10. Figure-4 glute stretch (1 min) — 30 seconds each side. Releases the piriformis (prevents sciatica).
        11. Supine twist (1 min) — 30 seconds each side. Mobilizes the thoracic spine.
        12. Legs-up-the-wall (1 min) — Drains fluid from legs after long standing days.

        Consistency over intensity: 10 minutes daily is far more effective than 60 minutes once a week. Set an alarm on your phone. Your 45-year-old body will thank your 25-year-old discipline.

        If you already have an injury, work with a physical therapist to adapt this routine to your specific needs. Never stretch through sharp pain.`,
        readingTime: '4 min', icon: Dumbbell,
    },
];

const CATEGORY_LABELS: Record<string, string> = {
    physical: 'Physical Health',
    mental: 'Mental Health',
    nutrition: 'Nutrition',
    ergonomics: 'Ergonomics',
    safety: 'Safety & PPE',
    lifestyle: 'Lifestyle',
};

const CATEGORY_COLORS: Record<string, string> = {
    physical: 'bg-orange-50 text-orange-700 border-orange-200',
    mental: 'bg-purple-50 text-purple-700 border-purple-200',
    nutrition: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ergonomics: 'bg-blue-50 text-blue-700 border-blue-200',
    safety: 'bg-red-50 text-red-700 border-red-200',
    lifestyle: 'bg-teal-50 text-teal-700 border-teal-200',
};

const CATEGORY_ICONS: Record<string, typeof ShieldCheck> = {
    physical: Sun,
    mental: Brain,
    nutrition: Apple,
    ergonomics: AlertTriangle,
    safety: Wind,
    lifestyle: HeartPulse,
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
    const hasDateInfo = Object.values(checklistState).some(r => r.date || r.place);

    const filteredArticles = useMemo(() => {
        return WELLNESS_ARTICLES.filter(article => {
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
                        <HeartPulse className="h-3.5 w-3.5" />
                        Technician Wellness
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Health & Wellness</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Track your health checkups and read wellness articles built for RAC technicians.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Left Column: Checklist */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                            <div className="bg-rose-50 p-2 text-rose-600">
                                <Stethoscope className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-lg font-bold text-gray-900">Annual Health Checklist</h2>
                                <p className="text-sm text-gray-500">Track checkup dates and locations</p>
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
                                                        placeholder="Clinic / hospital..."
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
                                        ? '✓ All checkups tracked'
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

                {/* Right Column: Wellness Article Library */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                            <div className="bg-blue-50 p-2 text-blue-600">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Wellness Article Library</h2>
                                <p className="text-sm text-gray-500">{WELLNESS_ARTICLES.length} articles for technician health</p>
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
