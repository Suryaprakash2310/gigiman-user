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
  serviceNames: string[];
  categoriesservices: CategoryService[];
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
    console.log(res.data);
    return res.data;
  },

  getServiceCategoryByIdAPI: async (domainServiceId: string) => {
    const res = await api.get(
      `/auth/service-list/${domainServiceId}`
    );
    console.log(res.data);
    return res.data;
  },




};
