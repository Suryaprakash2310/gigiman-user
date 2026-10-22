import { api } from "@/src/api/client";                                        
export interface DomainService {
  _id: string;
  domainName: string;
  domainImage?: string;
  serviceImage?: string;
  status?: string;
  serviceType?: string;
  allowedRegions?: string[];
  isGlobal?: boolean;
}

export interface RegionInfo {
  name: string;
  code: string;
  isBookingAllowed: boolean;
  isRestricted?: boolean;
}

export interface ServicesResponse {
  success: boolean;
  count: number;
  services: DomainService[];
  currentRegion?: RegionInfo;
  isBookingAllowed?: boolean;
  isRegionRestricted?: boolean;
  availableRegions?: Array<{ name: string; code: string; pincodes: string[] }>;
}

export interface CategoryService {
  _id: string;
  parentServiceName: string;
  domainServiceId?: string;
  domainServiceName?: string;
  serviceCategoryName: string;
  servicecategroyImage?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  offerPrice?: number;
  durationInMinutes?: number;
  employeeCount?: number;
  status?: string;
}

export interface ShowSubServiceResponse {
  success: boolean;
  services: Array<{
    _id: string;
    DomainServiceId?: string;
    serviceName?: string;
    serviceCategory?: CategoryService[];
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
    [key: string]: any;
  }>;
  serviceNames?: string[];
  categoriesservices?: CategoryService[];
}

export interface SubServiceResponse { 
    serviceNames: string[]; 
    categoriesservices: { _id: string; parentServiceName: string; serviceCategoryName: string; servicecategroyImage?: string; description?: string; price?: number; originalPrice?: number; offerPrice?: number; durationInMinutes?: number; employeeCount?: number; }[]; 
}

export const ServiceAPI = {
  getServicesAPI: async (region?: string, pincode?: string, lat?: number, lng?: number): Promise<ServicesResponse> => {
    const params = new URLSearchParams();
    if (region) params.append("region", region);
    if (pincode) params.append("pincode", pincode);
    if (lat != null && !isNaN(lat)) params.append("lat", String(lat));
    if (lng != null && !isNaN(lng)) params.append("lng", String(lng));
    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await api.get<ServicesResponse>(`auth/services${queryString}`);
    return res.data;
  },

  getSubServicesAPI: async () => {
    const res = await api.get<SubServiceResponse>("/auth/showServices");
    return res.data;
  },

  getSubServicesByDomainId: async (domainServiceId: string) => {
    const res = await api.get<ShowSubServiceResponse>(`/auth/showsubservice/${domainServiceId}`);
    return res.data;
  },

  getServiceCategoryByIdAPI: async (domainServiceId: string) => {
    const res = await api.get(
      `/auth/service-list/${domainServiceId}`
    );
    return res.data;
  },
};

