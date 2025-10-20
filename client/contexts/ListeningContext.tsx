import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ListeningContextType {
  isListening: boolean;
  setIsListening: (value: boolean) => void;
}

const ListeningContext = createContext<ListeningContextType | undefined>(undefined);

export const ListeningProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isListening, setIsListening] = useState(false);

  return (
    <ListeningContext.Provider value={{ isListening, setIsListening }}>
      {children}
    </ListeningContext.Provider>
  );
};

export const useListening = () => {
  const context = useContext(ListeningContext);
  if (context === undefined) {
    throw new Error('useListening must be used within a ListeningProvider');
  }
  return context;
};
