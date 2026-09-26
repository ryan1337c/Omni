"use client";

import icon from "@/public/omni-logo.png";

type EmptyChatStateProps = {
  children: React.ReactNode;
};

export function EmptyChatState({ children }: EmptyChatStateProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 -mt-16 animate-fade-in-up">
      <div className="min-h-full flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <img
              src={icon.src}
              alt="Custom Icon"
              className="text-white w-24 h-24 sm:w-[150px] sm:h-[150px]"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-700 dark:text-textDark">
            What can I help you with today?
          </h1>
        </div>
        <div className="w-full mt-8">{children}</div>
      </div>
    </div>
  );
}
