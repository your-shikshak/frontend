import { ITutor } from './types';

export const MOCK_TUTOR_DATA: Partial<ITutor> = {
  teacherId: 'TUT-GOLD-889',
  tier: 'GOLD (PREMIUM)',
  verificationStatus: 'VERIFIED',
  isAvailable: true,
  experienceHours: 1240,
  classesAssigned: 12,
  classesCompleted: 450,
  demosTaken: 85,
  interestCount: 124,
  yearsOfExperience: 8,
  bio: "Senior Mathematics Specialist with over 8 years of experience in competitive exam preparation (IIT-JEE/Olympiads). Achieving a 95% student satisfaction rate through personalized digital learning strategies.",
  qualifications: ['M.Sc. Mathematics', 'B.Ed', 'GATE Qualified'],
  languagesKnown: ['English', 'Hindi', 'Marathi'],
  skills: ['Vedic Maths', 'Calculus', 'Trigonometry', 'Speed Coding'],
  preferredMode: 'ONLINE_ONLY',
  verificationFeeStatus: 'PAID',
  whatsappCommunityJoined: true,
  user: {
    name: 'Dr. Aditi Sharma',
    email: 'aditi.sharma.demo@shikshak.com',
    phone: '+91 98765 43210',
    city: 'Mumbai',
    gender: 'FEMALE',
  } as any,
  settings: {
    availabilityPreferences: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      timeSlots: ['04:00 PM - 06:00 PM', '07:00 PM - 09:00 PM']
    }
  } as any,
  permanentAddress: 'Penthouse 402, Sky Towers, Worli, Mumbai - 400018',
  residentialAddress: 'Same as permanent',
};
