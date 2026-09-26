"use client";
import { FiPlus } from 'react-icons/fi';
import { Search, Trash2} from 'lucide-react';
import { useState } from 'react';
import type { RecentChat } from "@/app/components/home"; 
import { formatDistanceToNow } from 'date-fns'; 

// Define the props for the component
interface ChatsViewProps {
  recents: RecentChat[];
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  isProcessing: boolean;
  onDeleteChat: (id: string) => void;
}

export default function ChatsView({ 
  recents, 
  onNewChat, 
  onSelectChat, 
  isProcessing,
  onDeleteChat
}: ChatsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter the chats based on the search term
  const filteredRecents = recents.filter(chat => {
    const title = chat.chat_title;
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Get the total number of chats for the counter
  const totalChats = recents.length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full animate-fade-in-sm">
      <div className="max-w-4xl mx-auto w-full flex flex-col h-full py-4 px-6 md:p-10 ">
        
        {/* --- Header (Theme-Aware) --- */}
        <div className="flex-shrink-0">
            <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <h1 className="text-3xl font-bold text-slate-700 dark:text-gray-300 tracking-tight mb-4 sm:mb-0">
                    Your Chat History
                </h1>
                <button
                    onClick={onNewChat}
                    disabled={isProcessing}
                    className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium shadow-md hover:shadow-lg text-white bg-violet-600 hover:bg-violet-700 dark:bg-btnDark dark:hover:brightness-[.9] disabled:opacity-50 transition-all rounded-lg"
                >
                    <FiPlus size={20} />
                    <span>New Chat</span>
                </button>
            </div>

            {/* --- Search Bar (Theme-Aware) --- */}
            <div className="relative mb-8 flex-shrink-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={20} className="text-slate-400 dark:text-gray-500" />
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search your chats..."
                    className="
                        w-full pl-12 pr-4 py-3 rounded-xl transition-all 
                        bg-white dark:bg-slate-800
                        text-slate-800 dark:text-slate-100
                        border border-slate-200 dark:border-slate-700
                        focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500
                        focus:border-transparent dark:focus:border-transparent shadow-sm
                    "
                />
            </div>
            <div className="flex-shrink-0 text-sm text-slate-500 dark:text-gray-500 mb-4 px-1">
                <p>{totalChats} {totalChats === 1 ? 'chat' : 'chats'} with Omni</p>
            </div>
        </div>

        {/* --- Chat List (Theme-Aware) --- */}
        <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
                <div className="space-y-3 pb-4">
                    {filteredRecents.length > 0 ? (
                        filteredRecents.map((chat) => {
                        const chatTitle = chat.chat_title;
                        const timeAgo = formatDistanceToNow(new Date(chat.created_at), { addSuffix: true });
                        
                        return (
                            <div
                                key={chat.chat_id}
                                className="w-full flex items-center gap-2 p-4 rounded-lg transition-colors group disabled:opacity-50
                                            border border-slate-200 dark:border-slate-700
                                            hover:bg-slate-50 dark:hover:bg-slate-700/50
                                            hover:border-violet-500 dark:hover:border-white/15"
                            >
                                <button
                                    key={chat.chat_id}
                                    onClick={() => onSelectChat(chat.chat_id)}
                                    disabled={isProcessing}
                                    className="flex-1 text-left min-w-0"
                                >
                                    <h2 className="font-semibold truncate mb-1 
                                                text-slate-800 dark:text-gray-200 
                                                group-hover:text-violet-600 dark:group-hover:text-white">
                                        {chatTitle}
                                    </h2>
                                    <p className="text-sm truncate capitalize text-slate-500 dark:text-gray-400">
                                        {`Created ${timeAgo}`}
                                    </p>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.chat_id); }}
                                    disabled={isProcessing}
                                    className="flex-shrink-0 p-2 rounded-full text-gray-400 
                                                hover:bg-red-100 hover:text-red-600 
                                                dark:hover:bg-red-500/20 dark:hover:text-red-400 transition-colors"
                                    aria-label="Delete chat"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        );
                        })
                    ) : (
                        <div className="text-center py-12 text-slate-500 dark:text-gray-500">
                            <p>No chats found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}