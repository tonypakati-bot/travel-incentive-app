export type Page = 'home' | 'travel' | 'agenda' | 'explore' | 'contact' | 'documents' | 'registration' | 'travel-insurance' | 'profile' | 'settings' | 'gallery' | 'admin' | 'admin-trip-details';

export interface NavLink {
  id: string;
  label: string;
  icon: string;
  activeIcon?: string;
  page: Page;
}

export interface HamburgerLink {
    id: string;
    label: string;
    icon: string;
    isDanger?: boolean;
    page?: Page;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  action?: {
    page: Page;
    label: string;
  };
  targetAirports?: string[]; // Aeroporti per cui mostrare l'annuncio (opzionale)
}

export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    code: string;
    time: string;
    date: string;
  };
  arrival: {
    airport: string;
    code: string;
    time: string;
    date: string;
  };
  duration: string;
  departureGroup?: string;
}

export interface EmergencyContact {
  id: string;
  departureGroup?: string;
  // New schema: prefer `firstName`/`lastName`, keep `name` for backward compatibility
  firstName?: string;
  lastName?: string;
  name?: string;
  phone: string;
  email?: string;
  type: string;
  targetAirports?: string[]; // Aeroporti per cui mostrare il contatto (opzionale)
  availability?: string;
  languages?: string[];
  services?: string[];
}

export interface InfoBoxContent {
  title: string;
  content: string;
}

export interface TravelInfo {
  welcomeBannerImageUrl: string;
  outboundFlightInfo: InfoBoxContent;
  returnFlightInfo: InfoBoxContent;
  outboundFlights: Flight[];
  returnFlights: Flight[];
  emergencyContacts: EmergencyContact[];
}

export type AgendaCategory = 'Travel' | 'Hotel' | 'Meeting' | 'Activity' | 'Restaurant';

export interface AgendaDetail {
  icon: string;
  text: string;
}

export interface AgendaImage {
  urls: string[];
  caption?: string;
  details?: AgendaDetail[];
}

export interface AgendaItem {
  id: number;
  category?: AgendaCategory;
  icon: string;
  time: string;
  title: string;
  description: string;
  longDescription?: string;
  targetAirports?: string[]; // Aeroporti per cui mostrare l'item dell'agenda (opzionale)
  image?: AgendaImage;
  details?: AgendaDetail[];
}

export interface AgendaDay {
  day: number;
  title: string;
  date: string;
  items: AgendaItem[];
}


export interface EventDetails {
  title: string;
  subtitle: string;
  brandImageUrl?: string;
  backgroundImageUrl?: string;
  registrationDeadline?: string;
  departureGroup?: string[];
  allowCompanion?: boolean;
  allowBusiness?: boolean; // Voli Business flag
  roomType?: string[];
}

export interface TripData {
  eventDetails: EventDetails;
  agenda: AgendaDay[];
  announcements: Announcement[];
}

export interface Profile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  groupName: string;
  role: 'admin' | 'user' | 'super_admin' | 'guide';
  birthDate: string;
  nationality: string;
  mobilePhone?: string;
  imageUrl?: string;
}

// Types for Dynamic Registration Form
export type FormFieldType = 'text' | 'date' | 'email' | 'tel' | 'select' | 'checkbox' | 'radio';

export interface BaseFormField {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  note?: string;
  options?: string[];
  checkboxLabel?: string;
}

export interface ConditionalFormField extends BaseFormField {
  type: 'checkbox';
  controlsFields: FormField[];
}

export type FormField = BaseFormField | ConditionalFormField;

export interface FormSectionConfig {
  id: string;
  title: string;
  fields: FormField[];
}

export type RegistrationFormConfig = FormSectionConfig[];

export interface Photo {
  id: number;
  url: string;
  thumbnailUrl: string;
  userId: string;
  userName: string;
  userImageUrl: string;
  caption: string;
  day: number;
  timestamp: string;
  likes: number;
}

export interface UserDocument {
  _id: string;
  userId: string;
  flightId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  description: string;
  documentType: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}