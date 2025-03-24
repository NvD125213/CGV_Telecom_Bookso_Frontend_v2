import { IProvider } from "../services/provider";

export const sortAndAddIndex = (data: IProvider[]) => {
  return data
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item, index) => ({
      ...item,
      stt: index + 1,
    }));
};
