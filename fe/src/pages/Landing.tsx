import { getLocalPath } from "@/utils/landing";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const Landing = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const path: string = getLocalPath();
    if (path) {
      navigate(path);
    }
  }, [navigate]);
  return <> </>;
};
