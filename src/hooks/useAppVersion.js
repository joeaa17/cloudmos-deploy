import { useState, useEffect } from "react";

export const useAppVersion = () => {
  const [appVersion, setAppVersion] = useState(null);

  useEffect(() => {
    setAppVersion("1.0.0");
  }, []);

  return {
    appVersion
  };
};
