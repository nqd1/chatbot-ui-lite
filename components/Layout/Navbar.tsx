import { FC } from "react";
import Image from "next/image";

export const Navbar: FC = () => {
  return (
    <nav className="bg-{b01c2c] border-b border-neutral-200">
      <div className="max-w-[800px] mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2">
              <Image
                src="/logo.png"
                alt="Sinno Logo"
                width={32}
                height={32}
                className="p-1"
              />
            </div>
            <a 
              href="https://www.facebook.com/SINNOclub/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl font-bold text-[FFF5F5] hover:text-neutral-200 transition-colors"
            >
              Chatbot Sinno
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}; 