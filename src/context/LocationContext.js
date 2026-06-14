"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const defaultLocation = { 
  governorate: "Amman", 
  updateGovernorate: () => {} 
};

const LocationContext = createContext(defaultLocation);

export function LocationProvider({ children }) {
  const [governorate, setGovernorate] = useState("Amman"); // Default to Amman

  useEffect(() => {
    const saved = localStorage.getItem("mahally_governorate");
    if (saved) setGovernorate(saved);
  }, []);

  const updateGovernorate = (gov) => {
    setGovernorate(gov);
    localStorage.setItem("mahally_governorate", gov);
  };

  return (
    <LocationContext.Provider value={{ governorate, updateGovernorate }}>
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => {
  const context = useContext(LocationContext);
  return context || defaultLocation;
};
