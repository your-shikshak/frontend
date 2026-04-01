export interface IUser {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  dob?: string | Date;
  acceptedTerms: boolean;
  whatsappCommunityJoined?: boolean;
  preferredMode?: string;
  isProfileComplete?: boolean;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'M' | 'F';
  city?: string;
  verificationStatus?: string;
  permissions?: {
    canViewSiteLeads?: boolean;
    canVerifyTutors?: boolean;
    canCreateLeads?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}


export enum TUTOR_TIER {
  BRONZE = 'Tier 3 (BRONZE)',
  SILVER = 'Tier 2 (SILVER)',
  GOLD = 'Tier 1 (GOLD)',
}

export interface IClassLead {
  id: string;
  studentType: 'SINGLE' | 'GROUP';
  studentName: string;
  studentGender?: 'M' | 'F';
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  grade: string;
  subject: any[]; // Changed from string | string[] to any[] for OptionItem or ID
  board: string;
  mode: string;
  location?: string;
  city?: string;
  area?: string;
  address?: string;
  leadSource?: string;
  preferredTutorGender?: string;
  timing: string;
  weekdays?: string[];
  classesPerMonth?: number;
  classDurationHours?: number;
  paymentAmount?: number;
  tutorFees?: number;
  status: string;
  leadId: string;
  paymentReceived?: boolean;
  assignedTutor?: IUser;
  demoTutor?: IUser;
  demoDetails?: Record<string, any>;
  createdBy: IUser;
  numberOfStudents?: number;
  studentDetails?: Array<{
    name: string;
    gender: 'M' | 'F';
    fees: number;
    tutorFees: number;
    parentName?: string;
    parentEmail?: string;
    parentPhone?: string;
    board?: string;
    grade?: string;
    subject?: string[];
  }>;
  notes?: string;
  internalNotes?: string;
  associatedStudents?: Array<{
    name: string;
    studentId: string;
    gender?: string;
    grade?: string;
  }>;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IDocument {
  documentType: string;
  documentUrl: string;
  uploadedAt: Date;
  verifiedAt?: Date;
}

export interface ITutor {
  id: string;
  _id: string;
  user: IUser;
  teacherId?: string;
  experienceHours: number;
  subjects: any[]; // Changed from string[] to any[] for OptionItem or ID
  extracurricularActivities?: string[];
  ratings: number;
  classesAssigned: number;
  demosTaken: number;
  demosApproved: number;
  approvalRatio: number;
  verificationStatus: string;
  documents: IDocument[];
  qualifications?: string[];
  totalRatings: number;
  classesCompleted: number;
  interestCount: number;
  verificationNotes?: string;
  verifiedBy?: IUser;
  verifiedAt?: Date;
  isAvailable: boolean;
  preferredMode?: string;
  preferredLocations?: string[];
  preferredCities?: string[];
  preferredGrades?: string[];
  preferredBoards?: string[];
  permanentAddress?: string;
  residentialAddress?: string;
  alternatePhone?: string;
  whatsappCommunityJoined: boolean;
  createdAt: Date;
  updatedAt: Date;
  tier: string;
  tierUpdatedAt?: Date;
  tierUpdatedBy?: IUser;
  pendingTierChange?: IPendingTierChange;
  bio?: string;
  languagesKnown: string[];
  skills: string[];
  publicProfileEnabled: boolean;
  yearsOfExperience: number;
  verificationFeeStatus?: 'PENDING' | 'PAID' | 'DEDUCT_FROM_FIRST_MONTH';
  verificationRejectionReason?: string;
  verificationFeePaymentProof?: string;
  verificationFeePaymentDate?: Date;
  settings?: {
    availabilityPreferences?: {
      daysAvailable?: string[];
      timeSlots?: string[];
      maxClassesPerWeek?: number;
    };
    teachingModePreference?: string;
    preferredSubjects?: any[];
    preferredLocations?: string[];
    preferredGrades?: string[];
    notificationSettings?: {
      classAssignments?: boolean;
      demoRequests?: boolean;
      feedbackReceived?: boolean;
    };
  };
  monthlyStats?: {
    month: string;
    totalClasses: number;
    totalSessions: number;
    completedSessions: number;
  };
}

export interface ICoordinator {
  id: string;
  user: IUser;
  assignedClasses: any[];
  maxClassCapacity: number;
  activeClassesCount: number;
  totalClassesHandled: number;
  availableCapacity: number;
  specialization?: string[];
  verificationStatus?: string;
  joiningDate: Date;
  performanceScore: number;
  bio?: string;
  languagesKnown?: string[];
  skills?: string[];
  permanentAddress?: string;
  residentialAddress?: string;
  isProfileComplete?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICoordinatorDashboardStats {
  totalClassesAssigned: number;
  activeClassesCount: number;
  totalClassesHandled: number;
  pendingAttendanceApprovals: number;
  todaysTasksCount: number;
  performanceScore: number;
}

export interface ICoordinatorTodaysTasks {
  pendingAttendanceApprovals: IAttendance[];
  paymentReminders: any[];
  testsToSchedule: Array<{
    finalClassId: string;
    className: string;
    subject: any[];
    grade: string;
    testPerMonth: number;
    testsScheduledThisMonth: number;
  }>;
  parentComplaints: any[];
  counts: {
    pendingAttendance: number;
    paymentReminders: number;
    testsToSchedule: number;
    parentComplaints: number;
  };
}

export type TaskPriority = 'overdue' | 'today' | 'upcoming';

export interface ITaskWithPriority<T> {
  task: T;
  priority: TaskPriority;
  priorityDate: Date;
}

export interface IPaymentReminder extends Omit<IPayment, 'finalClass'> {
  finalClass: IFinalClass;
}

export interface ITutorHistory {
  tutor: IUser;
  startDate: Date;
  endDate: Date;
  reason?: string;
  replacedBy?: IUser;
}

export interface ISchedule {
  startDate?: string | Date;
  daysOfWeek?: string[];
  timeSlot?: string;
  isFixed?: boolean;
}

export interface IClassSession {
  id: string;
  finalClass: IFinalClass;
  tutor: IUser;
  coordinator?: IUser;
  sessionDate: string | Date;
  timeSlot: string;
  cycleMonth: number;
  cycleYear: number;
  sessionNumber: number;
  status: 'PLANNED' | 'COMPLETED' | 'CANCELLED' | string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IFinalClass {
  id: string;
  className: string;
  classLead: IClassLead;
  tutor: IUser;
  coordinator?: IUser | null;
  parent?: IUser;
  startDate: Date;
  endDate?: Date;
  status: string;
  schedule: ISchedule;
  classesPerMonth?: number;
  sessionsPerMonth?: number;
  totalSessions: number;
  completedSessions: number;
  studentName: string;
  subject: any[];
  grade: string;
  board: string;
  mode: string;
  location?: string;
  ratePerSession?: number;
  monthlyFee?: number;
  monthlyFees?: number;
  testPerMonth?: number;
  convertedBy: IUser;
  convertedAt: Date;
  attendanceSubmissionWindow?: number;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  tutorHistory?: ITutorHistory[];
  progressPercentage?: number;
  sheetCount?: number;
  metrics?: {
    progressPercentage: number;
    pendingAttendanceCount: number;
    overduePaymentsCount: number;
  };
}

export interface IAttendance {
  id: string;
  finalClass: IFinalClass;
  sessionDate: Date;
  sessionNumber?: number;
   topicCovered?: string;
  tutor: IUser;
  coordinator: IUser;
  parent?: IUser;
  status: string;
  submittedBy: IUser;
  submittedAt: Date;
  coordinatorApprovedBy?: IUser;
  coordinatorApprovedAt?: Date;
  parentApprovedBy?: IUser;
  parentApprovedAt?: Date;
  rejectedBy?: IUser;
  rejectedAt?: Date;
  rejectionReason?: string;
  studentAttendanceStatus?: string;
  notes?: string;
  teachingHours?: number;
  absentReason?: string;
  resources: Array<{
    name: string;
    url: string;
    type: 'QUESTION' | 'REPORT' | 'WORKSHEET';
  }>;
  swotAnalysis?: {
    strengths: string;
    weaknesses: string;
    opportunities: string;
    threats: string;
  };
  studentImprovementScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceSheet {
  id: string;
  finalClass: IFinalClass;
  coordinator: IUser;
  month: number;
  year: number;
  periodLabel?: string;
  attendanceIds?: string[];
  totalSessionsPlanned?: number;
  totalSessionsTaken?: number;
  presentCount?: number;
  absentCount?: number;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  createdBy?: IUser;
  submittedAt?: string | Date;
  approvedBy?: IUser;
  approvedAt?: string | Date;
  rejectedBy?: IUser;
  rejectedAt?: string | Date;
  rejectionReason?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface IPayment {
  id: string;
  finalClass?: IFinalClass;
  attendance?: IAttendance;
  attendanceSheet?: IAttendanceSheet;
  tutor?: IUser;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  transactionId?: string;
  paymentDate?: Date;
  dueDate: Date;
  paidBy?: IUser;
  notes?: string;
  paymentProof?: string;
  paymentType?: string;
  createdBy: IUser;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITest {
  id: string;
  finalClass: IFinalClass;
  tutor: IUser;
  coordinator: IUser;
  testDate: Date;
  testTime: string;
  status: string;
  scheduledBy: IUser;
  scheduledAt: Date;
  completedAt?: Date;
  report?: {
    feedback: string;
    strengths: string;
    areasOfImprovement: string;
    studentPerformance: string;
    recommendations: string;
  };
  reportSubmittedBy?: IUser;
  reportSubmittedAt?: Date;
  cancellationReason?: string;
  cancelledBy?: IUser;
  cancelledAt?: Date;
  notes?: string;
  topicName?: string;
  testSyllabus?: string;
  questionAnalysis?: Array<{
    topic: string;
    totalQuestions: number;
    correctedQuestions: number;
  }>;
  paperUrl?: string;
  paperName?: string;
  obtainedMarks?: number;
  totalMarks?: number;
  answerSheetUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITestReport {
  feedback: string;
  strengths: string;
  areasOfImprovement: string;
  studentPerformance: string;
  recommendations: string;
}

export interface IScheduleTestFormData {
  finalClassId: string;
  testDate: string;
  testTime: string;
  weekdays?: string[];
  notes?: string;
}

export interface IAnnouncement {
  id: string;
  classLead: IClassLead;
  postedBy: IUser;
  postedAt: Date;
  interestedTutors: Array<{
    tutor: IUser;
    interestedAt: Date;
    notes?: string;
  }>;
  interestCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITutorComparison extends ITutor {
  interestedAt: Date;
  user: IUser;
}

export interface IDemoHistory {
  id: string;
  classLead: IClassLead;
  tutor: IUser;
  demoDate: Date;
  demoTime: string;
  status: string;
  assignedBy: IUser;
  assignedAt: Date;
  completedAt?: Date;
  feedback?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: Date;
}

export interface INote {
  id: string;
  name: string;
  type: 'FOLDER' | 'FILE';
  parent?: string | null;
  owner: IUser;
  grade?: string;
  mimeType?: string;
  url?: string;
  subject?: string;
  chapter?: string;
  classId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification {
  id: string;
  recipient: IUser;
  type: string;
  title: string;
  message: string;
  relatedAnnouncement?: IAnnouncement;
  relatedClassLead?: IClassLead;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface ICoordinatorAnnouncement {
  id: string;
  coordinator: IUser;
  subject: string;
  message: string;
  recipientType: 'SPECIFIC_CLASS' | 'ALL_CLASSES' | 'SPECIFIC_TUTOR' | 'ALL_TUTORS' | 'STUDENTS_PARENTS';
  targetClass?: IFinalClass;
  targetTutor?: IUser;
  recipients: IUser[];
  recipientCount: number;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISendAnnouncementFormData {
  subject: string;
  message: string;
  recipientType: string;
  targetClassId?: string;
  targetTutorId?: string;
}

export interface ICoordinatorAnnouncementStats {
  totalAnnouncements: number;
  totalRecipients: number;
  breakdown: Array<{ recipientType: string; count: number; totalRecipients: number }>;
}

export interface ITestReportAnalytics {
  totalTests: number;
  averagePerformanceScore: number;
  testsOverTime: Array<{ date: string; count: number; averageScore: number }>;
  performanceByClass: Array<{ className: string; classId: string; testCount: number; averageScore: number }>;
  performanceByTutor: Array<{ tutorName: string; tutorId: string; testCount: number; averageScore: number }>;
  commonStrengths: Array<{ strength: string; frequency: number }>;
  commonImprovements: Array<{ improvement: string; frequency: number }>;
}

export interface ITestReportFilters {
  classId?: string;
  tutorId?: string;
  fromDate?: string;
  toDate?: string;
  status?: string;
  page: number;
  limit: number;
}

export interface ITutorFeedback {
  id: string;
  tutor: IUser;
  finalClass: IFinalClass;
  submittedBy: IUser;
  submitterRole: 'PARENT' | 'STUDENT';
  month: string;
  overallRating: number;
  teachingQuality: number;
  punctuality: number;
  communication: number;
  subjectKnowledge: number;
  comments?: string;
  strengths?: string;
  improvements?: string;
  wouldRecommend: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPublicTutorReview {
  id: string;
  studentName: string;
  submitterRole: 'PARENT' | 'STUDENT';
  overallRating: number;
  comments?: string;
  createdAt: string | Date;
}

export interface ITutorPerformanceMetrics {
  tutor: ITutor;
  classesAssigned: number;
  classesCompleted: number;
  totalClassHours: number;
  attendanceApprovalRate: number;
  averageTestScore: number;
  feedbackRatings: { overall: number; teachingQuality: number; punctuality: number; communication: number; subjectKnowledge: number };
  recommendationRate: number;
  totalFeedback: number;
}

export interface ITutorAdvancedAnalytics {
  sessions: {
    completedThisWeek: number;
    completedThisMonth: number;
  };
  earnings: {
    thisWeek: number;
    thisMonth: number;
    total: number;
  };
  totalTeachingHours: number;
  newClassesCount: number;
  demos: {
    total: number;
    approved: number;
    removed: number;
    approvalRate: number;
    removalRate: number;
  };
  classWiseEarnings: Array<{
    className: string;
    studentName: string;
    totalAmount: number;
    count: number;
  }>;
}

export interface ISubmitFeedbackFormData {
  tutorId: string;
  finalClassId: string;
  submitterRole: 'PARENT' | 'STUDENT';
  month: string;
  overallRating: number;
  teachingQuality: number;
  punctuality: number;
  communication: number;
  subjectKnowledge: number;
  comments?: string;
  strengths?: string;
  improvements?: string;
  wouldRecommend: boolean;
}

export interface IPendingTierChange {
  newTier: string;
  requestedAt: Date;
  requestedBy: IUser;
  reason?: string;
}

export type StudentType = 'SINGLE' | 'GROUP';

export interface IClassLeadFormData {
  studentType: StudentType;
  studentName: string;
  studentGender?: 'M' | 'F';
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  grade: string;
  subject: any[];
  board: string;
  mode: string;
  location?: string;
  city?: string;
  area?: string;
  address?: string;
  leadSource?: string;
  preferredTutorGender?: string;
  timing: string;
  classesPerMonth?: number;
  classDurationHours?: number;
  paymentAmount?: number;
  tutorFees?: number;
  notes?: string;
  internalNotes?: string;
  // Group specific fields
  numberOfStudents?: number;
  studentDetails?: Array<{
    name: string;
    gender: 'M' | 'F';
    fees: number;
    tutorFees: number;
    parentName?: string;
    parentEmail?: string;
    parentPhone?: string;
    board?: string;
    grade?: string;
    subject?: any[];
  }>;
}

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type PaginatedResponse<T> = ApiResponse<T> & {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export interface IAttendanceStatistics {
  totalSessions: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  approvalRate: number;
}

export interface IPaymentStatistics {
  // Admin Metrics
  totalClasses?: number;
  feesCollected?: number;
  totalPayouts?: number;
  serviceCharge?: number;

  // Generic / Tutor Metrics
  totalPayments?: number;
  totalAmount?: number;
  paidAmount?: number;
  pendingAmount?: number;
  overdueAmount?: number;
  averagePaymentAmount?: number;
  miscellaneous?: number;
  verificationFees?: number;
  finalRevenue?: number;
  netProfit?: number;
  monthly?: {
    feesCollected: number;
    tutorPayouts: number;
    miscellaneous: number;
    verificationFees: number;
    serviceCharge: number;
    finalRevenue: number;
    netProfit: number;
  };
  paymentsByStatus?: Record<string, number>;
  paymentsByMethod?: Record<string, number>;
}

export interface ICoordinatorPaymentSummary {
  payments: IPayment[];
  total: number;
  page: number;
  limit: number;
  statistics: {
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    overdueCount: number;
    upcomingCount: number;
    paidCount: number;
    totalPayoutAmount: number;
    paidPayoutAmount: number;
    pendingPayoutAmount: number;
  };
  categorized: {
    overdue: IPayment[];
    upcoming: IPayment[];
    paid: IPayment[];
  };
}

export interface ICoordinatorProfileMetrics {
  coordinator: ICoordinator;
  totalClassesHandled: number;
  activeClassesCount: number;
  completedClassesCount: number;
  pausedClassesCount: number;
  attendanceApprovalRate: number;
  performanceScore: number;
  availableCapacity: number;
  maxClassCapacity: number;
  pendingApprovalsCount: number;
  todaysTasksCount: number;
  specialization?: string[];
  joiningDate: Date;
  isActive: boolean;
}

export interface IPaymentReminderFormData {
  paymentId: string;
  reminderMessage?: string;
}

export interface IPaymentFilters {
  status?: string;
  classId?: string;
  paymentType?: string;
  fromDate?: string;
  toDate?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IDateWiseData {
  date: string;
  total: number;
  statusBreakdown: Record<string, number>;
}

export interface IStatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface IConversionFunnelStage {
  name: string;
  count: number;
  percentage: number;
}

export interface IConversionFunnel {
  stages: IConversionFunnelStage[];
  overallConversionRate: number;
}

export interface IClassProgress {
  totalClasses: number;
  activeClasses: number;
  completedClasses: number;
  pausedClasses: number;
  cancelledClasses: number;
  completionRate: number;
  averageProgress: number;
  statusDistribution: IStatusDistribution[];
}

export interface ITutorPerformance {
  tutor: ITutor;
  classesCompleted: number;
  totalRevenue: number;
  averageRating: number;
  demoApprovalRatio: number;
  attendanceApprovalRate: number;
}

export interface ICumulativeGrowth {
  date: string;
  totalClasses: number;
  activeClasses: number;
  inactiveClasses: number;
  newClasses: number;
  cumulativeClasses: number;
}

export interface IPendingApprovals {
  attendance: {
    coordinatorPending: number;
    parentPending: number;
    total: number;
  };
  demos: {
    scheduledCount: number;
  };
  totalPending: number;
}

export interface IParentDashboardStats {
  totalClasses: number;
  activeClasses: number;
  attendanceSummary: {
    totalSessions: number;
    approvedCount: number;
    pendingCount: number;
    approvalRate: number;
  };
  paymentSummary: {
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
  };
  upcomingTestsCount: number;
}

export interface IRevenueAnalytics {
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  overdueRevenue: number;
  revenueByDate: Array<{ date: string; revenue: number; paidRevenue: number }>;
  revenueTrends: Array<{ date: string; feesCollected: number; tutorPayout: number; serviceCharge: number }>;
  revenueByTutor: Array<{ tutor: ITutor; totalRevenue: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  averageRevenuePerClass: number;
}

export interface IDashboardStatistics {
  kpi?: {
    totalTeachers: number;
    verifiedTeachers: number;
    activeTeachers: number;
    totalClassLeads: number;
    activeClasses: number;
    monthlyRevenue: number;
    grossRevenue: number;
    studentChurn?: number;
    teacherChurn?: number;
    averageClassPrice?: number;
  };
  classLeads: { total: number; new: number; converted: number };
  finalClasses: { total: number; active: number; completed: number };
  tutors: { total: number; verified: number; active: number };
  payments: { total: number; totalRevenue: number; paidRevenue: number; pendingRevenue: number; feesCollected: number; tutorPayout: number };
  conversionRate: number;
  averageRevenuePerClass: number;
  pendingApprovals: number;
  crmCounts?: {
    new: number;
    announced: number;
    interested: number;
    demoScheduled: number;
    demoPending: number;
    won: number;
  };
  todaysTasks?: {
    websiteLeadsCount: number;
    coordinatorNotAssignedCount: number;
    pendingTutorVerificationCount: number;
    leadsNotClosedCount: number;
    coordinatorRequestsCount: number;
  };
}

export interface IManager {
  id: string;
  user: IUser;
  classLeadsCreated: number;
  demosScheduled: number;
  classesConverted: number;
  revenueGenerated: number;
  tutorsVerified: number;
  coordinatorsCreated: number;
  paymentsProcessed: number;
  conversionRate: number;
  averageRevenuePerClass: number;
  joiningDate: Date;
  department?: string;
  isActive: boolean;
  lastActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  permissions?: {
    canViewSiteLeads?: boolean;
    canVerifyTutors?: boolean;
    canCreateLeads?: boolean;
    canManagePayments?: boolean;
  };
  bio?: string;
  languagesKnown?: string[];
  skills?: string[];
  permanentAddress?: string;
  residentialAddress?: string;
  documents?: IDocument[];
  verificationStatus?: string;
  isProfileComplete?: boolean;
}

export interface IAdmin {
  id: string;
  user: IUser;
  usersCreated: number;
  managersCreated: number;
  coordinatorsCreated: number;
  tutorsCreated: number;
  parentsCreated: number;
  dataModifications: number;
  dataDeletes: number;
  systemActionsPerformed: number;
  joiningDate: Date;
  department?: string;
  isActive: boolean;
  lastActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  totalUsersManaged: number;
  averageActionsPerDay: number;
}

export interface IUserStatsByRole {
  ADMIN: { count: number; active: number };
  MANAGER: { count: number; active: number };
  COORDINATOR: { count: number; active: number };
  TUTOR: { count: number; active: number };
  PARENT: { count: number; active: number };
}

export interface IUserGrowthData {
  month: string;
  count: number;
}

export interface IManagerPerformanceSummary {
  activeManagers: number;
  totals: { totalLeads: number; totalClasses: number; totalRevenue: number };
  averages: { perManagerLeads: number; perManagerClasses: number; perManagerRevenue: number };
}

export interface ICoordinatorPerformanceSummary {
  activeCoordinators: number;
  totalClasses: number;
  avgScore: number;
  avgCapacityUtilization: number;
}

export type ITutorStatsByStatus = Record<
  'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'UNKNOWN',
  { count: number; totalClasses: number; avgRating: number }
>;

export interface IFinancialSummary {
  paidRevenue: number;
  pendingRevenue: number;
  overdueRevenue: number;
  grossRevenue: number;
  collectionRate: number;
  growth: Array<{ month: string; total: number }>;
  revenueTrends: Array<{ date: string; feesCollected: number; tutorPayout: number; serviceCharge: number }>;
}

export interface ISystemHealthIndicators {
  pendingApprovals: IPendingApprovals;
  overduePayments: number;
  inactiveUsersByRole: Record<string, number>;
  pendingTutorVerifications: number;
}

export interface IAdminAnalytics {
  base: IDashboardStatistics;
  users: {
    byRole: IUserStatsByRole;
    totals: { totalUsers: number; totalActiveUsers: number };
    growth: IUserGrowthData[];
  };
  managers: IManagerPerformanceSummary;
  coordinators: ICoordinatorPerformanceSummary;
  tutors: ITutorStatsByStatus & {
    growth: Array<{
      month: string;
      total: number;
      active: number;
      verified: number;
    }>;
  };
  finance: IFinancialSummary;
  classes: {
    leadsGrowth: IDateWiseData[];
    growth: ICumulativeGrowth[];
    locationGrowth: {
      data: Array<{
        month: string;
        city: string;
        area: string;
        leads: number;
        active: number;
      }>;
      cities: string[];
      areas: string[];
    };
  };
  health: ISystemHealthIndicators;
}

export interface IManagerMetrics {
  classLeadsCreated: number;
  demosScheduled: number;
  classesConverted: number;
  revenueGenerated: number;
  tutorsVerified: number;
  coordinatorsCreated: number;
  paymentsProcessed: number;
  conversionRate: number;
  averageRevenuePerClass: number;
  averageDemosPerLead: number;
  studentChurn?: number;
  teacherChurn?: number;
  averageClassPrice?: number;
  dateRange?: { from?: string; to?: string };
}

export interface IManagerPerformanceHistory {
  date: string;
  leadsCreated: number;
  classesConverted: number;
  revenue: number;
  conversionRate: number;
}

export interface IAdvancedAnalytics {
  studentLTV: number;
  studentCAC: number;
  studentChurn: number;
  teacherChurn: number;
  teacherCAC: number;
  avgTeacherEarnings: number;
  arpu: number;
  netRevenueChurn: number;
  grossMargin: number;
  conversionRate: number;
  retention: { d30: number; d60: number; d90: number; d365: number };
  coordinatorCostPerUser: number;
  refundRate: number;
  timeToValue: number;
}

// Auth related types
export interface AuthState {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
}

export type AuthResponse = ApiResponse<{
  user: IUser;
  accessToken: string;
  refreshToken: string;
}>;
