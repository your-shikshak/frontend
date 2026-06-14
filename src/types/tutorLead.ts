import { Gender } from '../types/enums';

// Props types
export interface TutorLeadFormProps {
  onSubmit: (data: TutorLeadFormData) => void | Promise<void>;
  isLoading?: boolean;
  initialData?: TutorLeadFormData;
  mode?: 'create' | 'edit';
}

// Form data types
/** Form data structure for new tutor lead registration */
export interface TutorLeadFormData {
  fullName: string;
  gender: Gender;
  phoneNumber: string;
  email: string;
  qualification: string;
  experience: string;
  subjects: any[];
  extracurricularActivities: string[];
  password: string;
  confirmPassword: string;
  city: string;
  preferredAreas: string[];
  preferredMode: string;
  permanentAddress?: string;
  residentialAddress?: string;
  alternatePhone?: string;
  bio?: string;
  languagesKnown?: string[];
  skills?: string[];
  verificationStatus?: string;
  daysAvailable?: string[];
  timeSlots?: string[];
}

// City-Area mapping type
export type CityAreasMap = {
  [key: string]: readonly string[];
};