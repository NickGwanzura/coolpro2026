import { Province, Technician } from '@/types/index';

// Zimbabwe Provinces and Districts
export const ZIMBABWE_PROVINCES: Province[] = [
  {
    id: 'harare',
    name: 'Harare',
    districts: ['Harare Central', 'Harare South', 'Harare North', 'Harare West', 'Harare East']
  },
  {
    id: 'bulawayo',
    name: 'Bulawayo',
    districts: ['Bulawayo Central', 'Bulawayo South', 'Bulawayo North', 'Bulawayo West', 'Bulawayo East']
  },
  {
    id: 'manicaland',
    name: 'Manicaland',
    districts: ['Mutare', 'Chipinge', 'Buhera', 'Makoni', 'Nyanga']
  },
  {
    id: 'masvingo',
    name: 'Masvingo',
    districts: ['Masvingo', 'Gutu', 'Chiredzi', 'Mwenezi', 'Zaka']
  },
  {
    id: 'midlands',
    name: 'Midlands',
    districts: ['Gweru', 'Kwekwe', 'Gokwe', 'Shurugwi', 'Zvishavane']
  },
  {
    id: 'matabeleland-north',
    name: 'Matabeleland North',
    districts: ['Bulawayo', 'Hwange', 'Lupane', 'Tsholotsho', 'Umguza']
  },
  {
    id: 'matabeleland-south',
    name: 'Matabeleland South',
    districts: ['Beitbridge', 'Gwanda', 'Insiza', 'Matobo', 'Umzingwane']
  },
  {
    id: 'mashonaland-west',
    name: 'Mashonaland West',
    districts: ['Chinhoyi', 'Karoi', 'Kadoma', 'Chegutu', 'Zvimba']
  },
  {
    id: 'mashonaland-central',
    name: 'Mashonaland Central',
    districts: ['Mount Darwin', 'Bindura', 'Guruve', 'Mazowe', 'Rushinga']
  },
  {
    id: 'mashonaland-east',
    name: 'Mashonaland East',
    districts: ['Marondera', 'Murehwa', 'Uzumba-Maramba-Pfungwe', 'Goromonzi', 'Chikomba']
  }
];

// Technician Specializations - Refrigeration & Air Conditioning only
export const TECHNICIAN_SPECIALIZATIONS = [
  'Refrigeration & Air Conditioning',
  'HVAC',
  'Cold Room Installation',
  'Commercial Refrigeration',
  'Domestic Refrigeration',
  'Air Conditioning',
  'Split System Installation',
  'Central Air Conditioning',
  'Refrigerant Handling',
  'Heat Pump Systems',
  'Chiller Systems',
  'Industrial Refrigeration'
];

// Issuing Bodies for Certifications
export const CERTIFICATION_ISSUING_BODIES = [
  'Zimbabwe National Council for Higher Education (ZIMCHE)',
  'National Employment Councils (NECs)',
  'Vocational Training Centres (VTCs)',
  'Polytechnics',
  'Technical Colleges',
  'Industry Associations',
  'International Certifying Bodies'
];

// Mock data for technician registry
export const MOCK_TECHNICIANS: Technician[] = [
  {
    id: '1',
    name: 'Tapiwa Moyo',
    nationalId: '12-3456789A12',
    registrationNumber: 'ZIM/TECH/2023/001',
    region: 'Harare',
    province: 'Harare',
    district: 'Harare Central',
    contactNumber: '+263 77 123 4567',
    email: 'tapiwa.moyo@example.com',
    specialization: 'Refrigeration & Air Conditioning',
    certifications: [
      {
        id: 'cert1',
        name: 'Certificate in Refrigeration Technology',
        issuingBody: 'Harare Polytechnic',
        dateIssued: '2023-06-15',
        expiryDate: '2028-06-15',
        certificateNumber: 'HP/2023/CERT/001',
        status: 'valid' as const
      }
    ],
    trainingHistory: [
      {
        id: 'train1',
        courseName: 'Advanced Refrigeration Systems',
        provider: 'Cooling Systems Zimbabwe',
        dateCompleted: '2024-03-20',
        duration: '40 hours',
        certificateNumber: 'CSZ/2024/TRN/005'
      }
    ],
    employmentStatus: 'employed' as const,
    employer: 'Cooling Systems Zimbabwe',
    registrationDate: '2023-07-01',
    expiryDate: '2028-06-30',
    status: 'active' as const,
    lastRenewalDate: '2023-07-01',
    nextRenewalDate: '2028-06-30'
  },
  {
    id: '2',
    name: 'Nyasha Chikomo',
    nationalId: '13-4567890B13',
    registrationNumber: 'ZIM/TECH/2023/002',
    region: 'Bulawayo',
    province: 'Bulawayo',
    district: 'Bulawayo South',
    contactNumber: '+263 71 234 5678',
    email: 'nyasha.chikomo@example.com',
    specialization: 'Commercial Refrigeration',
    certifications: [
      {
        id: 'cert2',
        name: 'Certificate in Commercial Refrigeration',
        issuingBody: 'Bulawayo Polytechnic',
        dateIssued: '2023-09-10',
        expiryDate: '2026-09-10',
        certificateNumber: 'BP/2023/REF/045',
        status: 'valid' as const
      }
    ],
    trainingHistory: [
      {
        id: 'train2',
        courseName: 'Commercial Refrigeration Systems',
        provider: 'Cooling Systems Zimbabwe',
        dateCompleted: '2023-08-15',
        duration: '60 hours',
        certificateNumber: 'CSZ/2023/TRN/123'
      }
    ],
    employmentStatus: 'self-employed' as const,
    employer: 'Chikomo Cooling Services',
    registrationDate: '2023-10-01',
    expiryDate: '2026-09-30',
    status: 'active' as const,
    lastRenewalDate: '2023-10-01',
    nextRenewalDate: '2026-09-30'
  },
  {
    id: '3',
    name: 'Munyaradzi Dube',
    nationalId: '14-5678901C14',
    registrationNumber: 'ZIM/TECH/2024/001',
    region: 'Midlands',
    province: 'Midlands',
    district: 'Gweru',
    contactNumber: '+263 73 345 6789',
    email: 'munyaradzi.dube@example.com',
    specialization: 'Air Conditioning',
    certifications: [
      {
        id: 'cert3',
        name: 'Certificate in Air Conditioning',
        issuingBody: 'Gweru Technical College',
        dateIssued: '2024-01-20',
        expiryDate: '2029-01-20',
        certificateNumber: 'GTC/2024/AC/078',
        status: 'valid' as const
      }
    ],
    trainingHistory: [
      {
        id: 'train3',
        courseName: 'Air Conditioning Installation & Maintenance',
        provider: 'HVAC Training Institute',
        dateCompleted: '2023-12-15',
        duration: '30 hours',
        certificateNumber: 'HTI/2023/TRN/456'
      }
    ],
    employmentStatus: 'employed' as const,
    employer: 'Dube Air Solutions',
    registrationDate: '2024-02-01',
    expiryDate: '2029-01-31',
    status: 'active' as const,
    lastRenewalDate: '2024-02-01',
    nextRenewalDate: '2029-01-31'
  }
];