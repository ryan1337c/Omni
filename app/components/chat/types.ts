import type { RecentChat } from "@/app/components/home";

export type MessageImage = {
  id: string;
  public_url: string;
  storage_path: string;
  order_index: number;
};

export interface ChatMessage {
  role: string;
  content: string;
  imagesData: MessageImage[];
  loading: boolean;
  isNew: boolean;
}

export type FileWithPreview = File & {
  preview: string;
};

export type ChatModel = {
  id: string;
  name: string;
  description: string;
  tier: string;
};

export type CreditNotice = {
  message: string;
  showUpgrade: boolean;
};

export type ChatProps = {
  setRecents: React.Dispatch<React.SetStateAction<RecentChat[]>>;
  currChatId: string | null;
  setCurrChatId: (id: string) => void;
  isProcessing: boolean;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
};
