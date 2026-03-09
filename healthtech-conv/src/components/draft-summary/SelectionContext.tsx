import { createContext, useContext } from "react";

interface SelectionContextType {
    selectedSectionId: string | null;
    setSelectedSectionId: (id: string | null) => void;
}

export const SelectionContext = createContext<SelectionContextType>({
    selectedSectionId: null,
    setSelectedSectionId: () => { },
});

export const useSelection = () => useContext(SelectionContext);
