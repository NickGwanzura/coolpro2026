import type { Metadata } from 'next';
import { LegalPage, type LegalSection } from '@/components/marketing/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Notice | HEVACRAZ',
  description: 'How the HEVACRAZ HVAC-R platform collects, uses, stores, and shares personal information.',
};

const sections: LegalSection[] = [
  {
    title: 'Who operates the platform',
    paragraphs: [
      'The HEVACRAZ HVAC-R platform supports membership, technician and supplier records, training, certification, refrigerant reporting, compliance workflows, and field operations. HEVACRAZ is the intended platform operator and contact point for this notice. The responsible legal entity and postal address should be confirmed by HEVACRAZ before this notice is formally approved.',
    ],
  },
  {
    title: 'Information we may process',
    paragraphs: ['Depending on the features you use and your relationship with HEVACRAZ, the platform may process:'],
    bullets: [
      'Identity and contact details, account credentials and role, organisation or employer, province, and membership information.',
      'Professional records such as qualifications, licences, certifications, registration status, applications, and verification history.',
      'Learning records, course participation, attendance, assessment submissions and results, and certificate requests.',
      'Supplier and business information, compliance applications, reorder quantities and purposes, ledger entries, and transaction references. Do not enter bank-card credentials into free-text fields.',
      'Work and safety records such as job details, installation locations, refrigerant handling logs, permits, Certificates of Compliance, incident reports, and uploaded supporting files or photographs.',
      'Messages and support requests, plus technical information needed to operate and protect the service, such as session, device, browser, and access-log data.',
      'Information stored on your device by platform features, including session/profile cache, language and emergency-mode preferences, saved sizing cases, checklists, and pending offline records.',
    ],
  },
  {
    title: 'Why information is used',
    paragraphs: ['Information is used only for platform and association purposes, which may include:'],
    bullets: [
      'Creating accounts, authenticating users, assigning access roles, and providing support.',
      'Managing membership, applications, training, assessments, certification, professional registers, and verification.',
      'Supporting field work, safety records, refrigerant recovery and usage reporting, supplier workflows, and compliance review.',
      'Sending service, account, training, compliance, and invitation messages.',
      'Maintaining platform security, preventing misuse, troubleshooting errors, and keeping appropriate operational and audit records.',
      'Producing reports for HEVACRAZ and authorised institutional or regulatory partners, including aggregate reporting where appropriate.',
    ],
  },
  {
    title: 'Lawful basis and choice',
    paragraphs: [
      'Personal information will be processed on a basis permitted by applicable law, such as providing a requested service, meeting a legal or regulatory obligation, carrying out an authorised public-interest function, or obtaining consent where required. If a feature relies on consent, you may withdraw it; withdrawal does not undo processing already lawfully completed and may mean that the related optional feature cannot be provided.',
    ],
  },
  {
    title: 'When information is shared',
    paragraphs: [
      'Access is intended to be limited by user role and operational need. Information may be shared with authorised HEVACRAZ personnel, relevant training or regulatory partners, and service providers that host or support the platform (for example, database, file-storage, email, or infrastructure providers). It may also be disclosed where required by law, to protect people or the platform, or with your direction or permission.',
      'Some records are designed for verification or reporting. Where a public register, certificate verification, or other publication feature is enabled, only the information needed for that purpose should be made public and the applicable notice should explain it. Confirm the publication fields and default visibility before submitting information intended to remain private.',
      'The platform may rely on service providers or infrastructure located outside Zimbabwe. Before production use, HEVACRAZ should document the providers, hosting locations, safeguards, and any applicable cross-border transfer requirements.',
      'We do not offer personal information for sale to data brokers or for third-party behavioural advertising.',
    ],
  },
  {
    title: 'Cookies and device storage',
    id: 'cookies',
    paragraphs: [
      'The platform uses an authentication session cookie to keep a signed-in session and browser local storage for limited app functions. Local storage can include a cached user profile for display, language and emergency-mode preferences, and feature data such as offline queues, checklists, or saved sizing cases. Offline records may remain on the device until synchronised or cleared. Clearing browser storage can sign you out or remove unsynchronised or locally saved data.',
      'Your browser can restrict or clear cookies and local storage. Some sign-in, offline, and preference features may then stop working. Hosting or security providers may also maintain technical logs; the exact log fields and retention period depend on the deployed service configuration.',
    ],
  },
  {
    title: 'Retention and security',
    paragraphs: [
      'Information should be kept only for as long as needed for the purpose it was collected, to meet legal or regulatory duties, to maintain credential and audit records, or to resolve disputes. Retention periods vary by record type and should be defined in HEVACRAZ’s approved retention schedule.',
      'Reasonable technical and organisational safeguards are used to protect information. No internet transmission or storage system can be guaranteed completely secure. Please use a strong password, keep invitation links private, sign out on shared devices, and report suspected account or data exposure promptly.',
    ],
  },
  {
    title: 'Your rights and requests',
    paragraphs: [
      'Zimbabwe’s Cyber and Data Protection Act (Chapter 12:07) provides rights that include being informed about use of personal information, requesting access, objecting to processing, and seeking correction or deletion of false or misleading information. Other rights or limits may apply under the law.',
      'To make a request or raise a concern, email compliance@hevacraz.co.zw. Include enough information for us to identify the relevant account or record, but do not send passwords or sensitive identity documents by ordinary email unless we first provide a secure method. We may need to verify your identity and consult the organisation responsible for a record before acting.',
    ],
  },
  {
    title: 'Children and information about other people',
    paragraphs: [
      'Do not create an account for, upload information about, or submit records concerning a person under 18 unless you are legally authorised to do so and any required parent, guardian, or other approvals have been obtained. If you submit another person’s information, you are responsible for having authority to provide it and for giving them any required notice.',
    ],
  },
  {
    title: 'Changes and contact',
    paragraphs: [
      'We may update this notice as platform features or legal requirements change. The revised date will appear at the top of this page. Material changes should be communicated through an appropriate platform notice.',
      'Questions, access or correction requests, and privacy concerns: compliance@hevacraz.co.zw or info@hevacraz.co.zw. This notice is informed by Zimbabwe’s Cyber and Data Protection Act, 2021 (Chapter 12:07); it is not a substitute for legal advice.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Notice"
      intro="This notice explains what information the HEVACRAZ platform handles, why it is used, and how to ask about or exercise your privacy rights. It applies to platform accounts and features, not to unrelated third-party services."
      sections={sections}
    />
  );
}
