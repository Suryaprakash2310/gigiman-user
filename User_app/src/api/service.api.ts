import { api } from "@/src/api/client";                                        
export interface DomainService {
  _id: string;
  domainName: string;
  domainImage?: string;
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
  durationInMinutes?: number;
  employeeCount?: number;
}

export interface ShowSubServiceResponse {
  success: boolean;
  // backend returns `services: [...]` where each item contains a `serviceName` and `serviceCategory`
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
  // optional legacy shapes
  serviceNames?: string[];
  categoriesservices?: CategoryService[];
}

export interface SubServiceResponse { 
    serviceNames: string[]; 
    categoriesservices: { _id: string; parentServiceName: string; serviceCategoryName: string; servicecategroyImage?: string; description?: string; price?: number; durationInMinutes?: number; employeeCount?: number; }[]; }

export const ServiceAPI = {
  getServicesAPI: async () => {
    const res = await api.get("auth/services");
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
