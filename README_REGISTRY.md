# National Technician Registry for Zimbabwe

## Overview

This project implements a comprehensive National Technician Registry for Zimbabwe, built with Next.js 16, React 19, and TypeScript. The registry provides a centralized platform to manage and verify registered technicians across the country.

## Features

### 1. Technician Registry Page (`/technician-registry`)
- **Search Functionality**: Search by name, registration number, national ID, or specialization
- **Advanced Filtering**: Filter by province, specialization, and status
- **Real-time Statistics**: Display technician count, active status, and distribution
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Status Badges**: Visual indicators for active, inactive, suspended, and pending statuses

### 2. Technician Details Page (`/technician-registry/[id]`)
- **Personal Information**: Full name, national ID, registration details
- **Location**: Province, district, and region
- **Contact Information**: Phone number and email
- **Employment Status**: Details about employment and employer
- **Certifications**: Complete certification history with status and expiry dates
- **Training History**: Comprehensive training records
- **Registration Status**: Key dates and renewal information
- **Quick Actions**: Download certificate, view full profile, send notifications

### 3. Manage Technicians Page (`/technician-registry/manage`)
- **Admin Dashboard**: Statistics on pending approvals, active, and suspended technicians
- **Bulk Management**: Approve, activate, suspend, or delete technicians in bulk
- **Advanced Filtering**: Same filtering options as registry page
- **Quick Actions**: Edit, approve, activate/suspend, or delete individual technicians

### 4. Add Technician Page (`/technician-registry/add`)
- **Comprehensive Form**: Fields for all technician information
- **Dynamic Fields**: Conditional fields based on employment status
- **Certification Management**: Add multiple certifications with details
- **Training History**: Add and manage training records
- **Province-District Relationship**: Dynamic district dropdown based on selected province
- **Validation**: Form validation and required field checks

## Technical Implementation

### Data Models

#### Technician
```typescript
interface Technician {
  id: string;
  name: string;
  nationalId: string;
  registrationNumber: string;
  region: string;
  province: string;
  district: string;
  contactNumber: string;
  email?: string;
  specialization: string;
  certifications: Certification[];
  trainingHistory: TrainingRecord[];
  employmentStatus: 'employed' | 'self-employed' | 'unemployed';
  employer?: string;
  registrationDate: string;
  expiryDate: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  lastRenewalDate?: string;
  nextRenewalDate?: string;
}
```

#### Certification
```typescript
interface Certification {
  id: string;
  name: string;
  issuingBody: string;
  dateIssued: string;
  expiryDate: string;
  certificateNumber: string;
  status: 'valid' | 'expired' | 'pending';
}
```

#### Training Record
```typescript
interface TrainingRecord {
  id: string;
  courseName: string;
  provider: string;
  dateCompleted: string;
  duration: string;
  certificateNumber?: string;
}
```

### Technologies Used

- **Next.js 16**: React framework with App Router
- **React 19**: UI library
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Framer Motion**: Animation library

## Getting Started

1. **Install Dependencies**: Run `npm install`
2. **Development Server**: Run `npm run dev`
3. **Build**: Run `npm run build`
4. **Start Production Server**: Run `npm start`

## Database Integration

The current implementation uses mock data. To integrate with a real database:

1. Replace mock data in `constants/registry.ts` with API calls
2. Implement backend endpoints for CRUD operations
3. Use Next.js API routes or a separate backend service
4. Add authentication and authorization middleware

## Security Considerations

- Implement proper authentication and authorization
- Validate all input data
- Use HTTPS for all requests
- Implement rate limiting
- Secure sensitive data storage
- Regular security audits

## Future Enhancements

1. **Advanced Search**: Add full-text search capabilities
2. **Reporting**: Generate detailed reports on technician distribution
3. **Analytics**: Add charts and graphs for data visualization
4. **Notifications**: Implement email and SMS notifications
5. **Mobile App**: Create a dedicated mobile application
6. **Offline Support**: Add PWA capabilities for offline use
7. **API Integration**: Integrate with other government systems
8. **Blockchain**: Implement blockchain for immutable records

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.