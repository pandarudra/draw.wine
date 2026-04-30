import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLocalPath } from "@/helpers/landing.h";

export const useLandingRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const path = getLocalPath();
    if (path) {
      navigate(path);
    }
  }, [navigate]);
};
