import { createContext, useContext, useState } from "react";

export type GCType = {
  currentStage: "lobby" | "cg";
  setCurrentStage: (stage: string) => void;
};

// cg => collaborative ground

const GeneralContext = createContext<GCType | null>(null);

export const GeneralProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [currentStage, setCurrentStage] = useState<"lobby" | "cg">("lobby");

  const setCurrentStageWrapper = (stage: string) => {
    if (stage === "lobby" || stage === "cg") {
      setCurrentStage(stage);
    } else {
      console.warn(`Invalid stage: ${stage}`);
    }
  };
  return (
    <GeneralContext.Provider
      value={{
        currentStage,
        setCurrentStage: setCurrentStageWrapper,
      }}
    >
      {children}
    </GeneralContext.Provider>
  );
};

export const useGeneral = () => {
  const context = useContext(GeneralContext);
  if (!context) {
    throw new Error("useGeneral must be used within a GeneralProvider");
  }
  return context;
};
