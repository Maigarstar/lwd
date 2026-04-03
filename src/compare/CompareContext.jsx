import { createContext, useContext, useState, useEffect } from "react";

const CompareContext = createContext();

export function CompareProvider({ children }) {
  const [compareItems, setCompareItems] = useState([]);

  useEffect(() => {
    const handleCompareEvent = (e) => {
      const { itemId, state, item } = e.detail;
      setCompareItems((prev) => {
        if (state) {
          // Add to compare
          const exists = prev.some((i) => i.id === itemId);
          return exists ? prev : [...prev, { id: itemId, ...item }];
        } else {
          // Remove from compare
          return prev.filter((i) => i.id !== itemId);
        }
      });
    };

    window.addEventListener("lwd:compare-bar", handleCompareEvent);
    return () => window.removeEventListener("lwd:compare-bar", handleCompareEvent);
  }, []);

  const toggleCompareItem = (itemId, item) => {
    setCompareItems((prev) => {
      const exists = prev.some((i) => i.id === itemId);
      return exists
        ? prev.filter((i) => i.id !== itemId)
        : [...prev, { id: itemId, ...item }];
    });
  };

  const isCompared = (itemId) => compareItems.some((i) => i.id === itemId);
  const clearCompare = () => setCompareItems([]);

  return (
    <CompareContext.Provider
      value={{ compareItems, toggleCompareItem, isCompared, clearCompare }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within CompareProvider");
  }
  return context;
}
