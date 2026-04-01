import { useState, useCallback, useEffect } from 'react';
import { 
  DEMO_TUTOR_PROFILE, 
  DEMO_ANALYTICS, 
  DEMO_CLASSES, 
  DEMO_PAYMENTS, 
  DEMO_ATTENDANCE 
} from '../constants/demoData';
import { ITutor, ITutorAdvancedAnalytics, IFinalClass, IPayment, IAttendance } from '../types';

export const useDemoMode = () => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('shikshak_demo_mode') === 'true';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setIsDemoMode(localStorage.getItem('shikshak_demo_mode') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode((prev) => {
      const next = !prev;
      localStorage.setItem('shikshak_demo_mode', String(next));
      // Dispatch a storage event to sync across components if needed
      window.dispatchEvent(new Event('storage'));
      return next;
    });
  }, []);

  const getDemoTutor = useCallback((realData: ITutor | null): ITutor | null => {
    if (!isDemoMode) return realData;
    return { ...realData, ...DEMO_TUTOR_PROFILE } as ITutor;
  }, [isDemoMode]);

  const getDemoAnalytics = useCallback((realData: ITutorAdvancedAnalytics | null): ITutorAdvancedAnalytics | null => {
    if (!isDemoMode) return realData;
    return DEMO_ANALYTICS;
  }, [isDemoMode]);

  const getDemoClasses = useCallback((realData: IFinalClass[]): IFinalClass[] => {
    if (!isDemoMode) return realData;
    return DEMO_CLASSES;
  }, [isDemoMode]);

  const getDemoPayments = useCallback((realData: IPayment[]): IPayment[] => {
    if (!isDemoMode) return realData;
    return DEMO_PAYMENTS;
  }, [isDemoMode]);

  const getDemoAttendance = useCallback((realData: IAttendance[]): IAttendance[] => {
    if (!isDemoMode) return realData;
    return DEMO_ATTENDANCE;
  }, [isDemoMode]);

  return { 
    isDemoMode, 
    toggleDemoMode, 
    getDemoTutor, 
    getDemoAnalytics, 
    getDemoClasses, 
    getDemoPayments, 
    getDemoAttendance 
  };
};
