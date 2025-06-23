import axiosInstance from "../config/apiToken";

export interface ResponsePagination {
  current_page?: number;
  per_page?: number;
  total_pages?: number;
  total_results?: number;
}

export interface GvoiceGtelDataType {
  phone_number: string;
  number_type: string;
  commitment_fee: string;
  subscription_fee: string;
  vtl_fee: string;
  vms_fee: string;
  vnpt_fee: string;
  other_fee: string;
  status: string;
}

export interface DigitelDataType {
  phone_number: string;
  number_type: string;
  commitment_fee: string;
  subscription_fee: string;
  vtl_fee: string;
  vms_fee: string;
  vnpt_fee: string;
  vnm_fee: string;
  other_fee: string;
}

export interface GigaforeDataType {
  phone_number: string;
  number_type: string;
  valuation: string;
  commitment_fee: string;
  commitment_time: string;
  subscription_fee: string;
  call_fee: string;
  status: string;
}

export interface VPBXDataType {
  phone_number: string;
  subscription_fee: string;
  call_fee: string;
}

export interface ResponseType {
  status: string;
  data:
    | DigitelDataType[]
    | GvoiceGtelDataType[]
    | VPBXDataType[]
    | GigaforeDataType[];
  pagination: ResponsePagination;
  timestamp: string;
}

export interface RequestParamsType {
  page: number;
  per_page: number;
  search?: string;
  option?: "ListPublicDVGTGT.aspx" | "ListPublicDVGTGT1800.aspx";
}

export const getPublicNumber1900 = async (params: RequestParamsType) => {
  const defaultedParams: RequestParamsType = {
    page: 1,
    per_page: 10,
    search: params.search,
  };

  const filteredParams = Object.fromEntries(
    Object.entries(defaultedParams).filter(([_, value]) => value !== undefined)
  );
  const res = await axiosInstance.get<ResponseType>(
    "/api/v2/public-numbers-billing-digitel",
    {
      params: filteredParams,
    }
  );
  return res;
};

export const getPublicNumberVoiceGTel = async (params: RequestParamsType) => {
  const defaultedParams: RequestParamsType = {
    page: params.page || 1,
    per_page: 10,
    search: params.search,
    option: params.option || "ListPublicDVGTGT.aspx",
  };

  const filteredParams = Object.fromEntries(
    Object.entries(defaultedParams).filter(([_, value]) => value !== undefined)
  );

  const res = await axiosInstance.get<ResponseType>(
    "/api/v2/public-number-gvoice-gtel",
    {
      params: filteredParams,
    }
  );
  return res;
};

export const getPublicNumberVPBX = async () => {
  const res = await axiosInstance.get<ResponseType>(
    "/api/v2/public-number-vpbx"
  );
  return res;
};

export const getPublicNumberGigafore = async (params: RequestParamsType) => {
  const res = await axiosInstance.get<ResponseType>(
    "/api/v2/gigafore-numbers",
    {
      params: params,
    }
  );
  return res;
};
