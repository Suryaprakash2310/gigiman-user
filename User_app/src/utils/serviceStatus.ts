export type ServiceStatus = 'available' | 'coming_soon' | 'new_service';

export const getServiceStatus = (status?: string | null): ServiceStatus => {
  if (!status) return 'available';
  const clean = status.toString().trim().toLowerCase().replace(/[\s_-]+/g, '_');
  
  if (clean === 'coming_soon' || clean === 'comingsoon') {
    return 'coming_soon';
  }
  if (clean === 'new_service' || clean === 'new' || clean === 'newservice') {
    return 'new_service';
  }
  return 'available';
};

export const isComingSoon = (status?: string | null): boolean => {
  return getServiceStatus(status) === 'coming_soon';
};

export const isNewService = (status?: string | null): boolean => {
  return getServiceStatus(status) === 'new_service';
};

export interface StatusBadgeConfig {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export const getStatusBadgeConfig = (status?: string | null): StatusBadgeConfig | null => {
  const serviceStatus = getServiceStatus(status);
  
  if (serviceStatus === 'coming_soon') {
    return {
      label: 'Coming Soon',
      bgColor: '#FFF7ED', // Soft Warm Orange / Amber
      textColor: '#EA580C', // Deep Orange
      borderColor: '#FFEDD5',
    };
  }
  
  if (serviceStatus === 'new_service') {
    return {
      label: 'New Service',
      bgColor: '#ECFDF5', // Soft Emerald Green
      textColor: '#059669', // Emerald Text
      borderColor: '#A7F3D0',
    };
  }
  
  return null; // 'available' has no tag by default
};
