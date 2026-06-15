import apiClient from "./client";

export interface CartItem {
  domainService: any;
  serviceCategoryId: string;
  serviceCategoryName: string;
  price: number;
  durationInMinutes: number;
  employeeCount: number;
  quantity: number;
  type: string;
  _id?: string;
}

export interface CartResponse {
  success: boolean;
  cart: {
    _id: string;
    user: string;
    items: CartItem[];
    totalPrice: number;
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface SuggestionResponse {
  success: boolean;
  suggestions: Array<{
    _id: string;
    DomainServiceId: string;
    serviceName: string;
    serviceCategory: Array<{
      _id: string;
      serviceCategoryName: string;
      description?: string;
      servicecategoryImage?: string;
      price: number;
      durationInMinutes: number;
      employeeCount: number;
    }>;
  }>;
}

export const CartAPI = {
  async addToCart(serviceCategoryId: string, type?: 'MAIN' | 'EXTRA', clearExist = false): Promise<CartResponse> {
    const res = await apiClient.post<CartResponse>("/cart/add", { serviceCategoryId, type, clearExist });
    return res.data;
  },

  async removeFromCart(serviceCategoryId: string, removeAll = false): Promise<CartResponse> {
    const res = await apiClient.post<CartResponse>("/cart/remove", { serviceCategoryId, removeAll });
    return res.data;
  },

  async getCart(): Promise<CartResponse> {
    const res = await apiClient.get<CartResponse>("/cart");
    return res.data;
  },

  async getSuggestions(): Promise<SuggestionResponse> {
    const res = await apiClient.get<SuggestionResponse>("/cart/suggestions");
    return res.data;
  },
};
