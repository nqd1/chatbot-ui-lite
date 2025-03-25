import { FC } from "react";
import Image from "next/image";

export const Navbar: FC = () => {
  return (
    <nav className="bg-white border-b border-neutral-200">
      <div className="max-w-[800px] mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="mr-2"
            />
            <span className="text-xl font-bold text-neutral-900">AI Chatbot</span>
          </div>
        </div>
      </div>
    </nav>
  );
}; 