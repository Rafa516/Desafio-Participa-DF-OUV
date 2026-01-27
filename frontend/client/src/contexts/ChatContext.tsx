import { createContext, useContext, useState, ReactNode } from "react";

interface ChatContextType {
  mode: "global" | "guide";
  setMode: (mode: "global" | "guide") => void;
  currentField: string | null;
  setCurrentField: (field: string | null) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ChatContext = createContext<ChatContextType>({} as ChatContextType);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<"global" | "guide">("global");
  const [currentField, setCurrentField] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ChatContext.Provider 
      value={{ mode, setMode, currentField, setCurrentField, isOpen, setIsOpen }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);