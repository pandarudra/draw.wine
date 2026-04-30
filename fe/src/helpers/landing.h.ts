import { BOARD_LOCAL_STORAGE_KEY } from "@/constants/landing";
import { v4 as random_id } from "uuid";

export const getLocalPath: () => string = () => {
  let id = localStorage.getItem(BOARD_LOCAL_STORAGE_KEY);
  if (!id) {
    id = random_id();
    localStorage.setItem(BOARD_LOCAL_STORAGE_KEY, id);
  }
  return `/board/${id}`;
};
