import { ITutor, ITutorAdvancedAnalytics, IFinalClass, IAttendance, IPayment } from '../types';
import { USER_ROLES, ATTENDANCE_STATUS, PAYMENT_STATUS, VERIFICATION_STATUS } from '../constants';



export const DEMO_TUTOR_PROFILE: Partial<ITutor> = {
  teacherId: 'TUT-GOLD-889',
  tier: 'Tier 1 (GOLD)',
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
    id: 'demo-tutor-123',
    name: 'Dr. Aditi Sharma',
    email: 'aditi.sharma.demo@shikshak.com',
    phone: '+91 98765 43210',
    city: 'Mumbai',
    gender: 'FEMALE',
    role: USER_ROLES.TUTOR,
    verificationStatus: 'VERIFIED',
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

export const DEMO_ANALYTICS: ITutorAdvancedAnalytics = {
  sessions: {
    completedThisWeek: 8,
    completedThisMonth: 34,
  },
  earnings: {
    thisWeek: 12500,
    thisMonth: 48600,
    total: 425000,
  },
  totalTeachingHours: 156,
  newClassesCount: 2,
  demos: {
    total: 12,
    approved: 10,
    removed: 2,
    approvalRate: 83.33,
    removalRate: 16.67,
  },
  classWiseEarnings: [
    { className: 'IB Physics DP1', studentName: 'Rahul Malhotra', totalAmount: 18500, count: 12 },
    { className: 'IGCSE Mathematics', studentName: 'Sara Khan', totalAmount: 15000, count: 10 },
    { className: 'Vedic Maths', studentName: 'Aryan Joshi', totalAmount: 15100, count: 12 },
  ],
};

export const DEMO_CLASSES: IFinalClass[] = [
  {
    id: 'class-demo-1',
    className: 'IB Physics DP1 - Rahul',
    studentName: 'Rahul Malhotra',
    subject: ['Physics', 'Mathematics'],
    grade: 'GRADE_11',
    board: 'IB',
    mode: 'ONLINE',
    status: 'ACTIVE',
    totalSessions: 48,
    completedSessions: 12,
    schedule: {
      daysOfWeek: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
      timeSlot: '05:00 PM - 06:30 PM',
    },
    tutor: DEMO_TUTOR_PROFILE.user,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any,
  {
    id: 'class-demo-2',
    className: 'IGCSE Maths - Sara',
    studentName: 'Sara Khan',
    subject: ['Mathematics'],
    grade: 'GRADE_10',
    board: 'IGCSE',
    mode: 'ONLINE',
    status: 'ACTIVE',
    totalSessions: 36,
    completedSessions: 10,
    schedule: {
      daysOfWeek: ['TUESDAY', 'THURSDAY'],
      timeSlot: '07:00 PM - 08:30 PM',
    },
    tutor: DEMO_TUTOR_PROFILE.user,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any,
  {
    id: 'class-demo-3',
    className: 'Speed Coding - Aryan',
    studentName: 'Aryan Joshi',
    subject: ['Computer Science'],
    grade: 'GRADE_8',
    board: 'CBSE',
    mode: 'ONLINE',
    status: 'ACTIVE',
    totalSessions: 24,
    completedSessions: 8,
    schedule: {
      daysOfWeek: ['SATURDAY', 'SUNDAY'],
      timeSlot: '11:00 AM - 12:30 PM',
    },
    tutor: DEMO_TUTOR_PROFILE.user,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any,
];

export const DEMO_PAYMENTS: IPayment[] = [
  {
    id: 'pay-demo-1',
    amount: 15200,
    currency: 'INR',
    status: 'PAID',
    paymentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    paymentType: 'TUTOR_PAYOUT',
    notes: 'Payout for March Week 3',
    createdAt: new Date(),
  } as any,
  {
    id: 'pay-demo-2',
    amount: 12500,
    currency: 'INR',
    status: 'PENDING',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    paymentType: 'TUTOR_PAYOUT',
    notes: 'Upcoming payout for March Week 4',
    createdAt: new Date(),
  } as any,
];

export const DEMO_ATTENDANCE: IAttendance[] = [
  {
    id: 'att-demo-1',
    sessionDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: 'APPROVED',
    topicCovered: 'Quantum Mechanics - Introduction',
    studentAttendanceStatus: 'PRESENT',
    submittedAt: new Date(),
    finalClass: DEMO_CLASSES[0],
  } as any,
  {
    id: 'att-demo-2',
    sessionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'PENDING',
    topicCovered: 'Calculus - Integration by parts',
    studentAttendanceStatus: 'PRESENT',
    submittedAt: new Date(),
    finalClass: DEMO_CLASSES[1],
  } as any,
];
