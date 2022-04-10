import React, { useState, useEffect } from "react";
import axios from "axios";
import { akashlyticsApi } from "../../shared/constants";

const TemplatesProviderContext = React.createContext({});

export const TemplatesProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  function getTemplateByPath(path) {
    return categories.flatMap((x) => x.templates).find((x) => x.path === path);
  }

  const templates = categories.flatMap((x) => x.templates);

  useEffect(() => {
    (async () => {
      setIsLoading(true);

      const response = await axios.get(`${akashlyticsApi}/templates`);
      let categories = response.data.filter((x) => (x.templates || []).length > 0);
      categories.forEach((c) => {
        c.templates.forEach((t) => (t.category = c.title));
      });
      setCategories(categories);
      setIsLoading(false);
    })();
  }, []);

  return <TemplatesProviderContext.Provider value={{ isLoading, categories, templates, getTemplateByPath }}>{children}</TemplatesProviderContext.Provider>;
};

export const useTemplates = () => {
  return { ...React.useContext(TemplatesProviderContext) };
};
