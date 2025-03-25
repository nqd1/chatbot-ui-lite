import { FC } from "react";
import Image from "next/image";

export const Navbar: FC = () => {
  return (
    <nav className="bg-red-600 border-b border-neutral-200">
      <div className="max-w-[800px] mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Image
              src="/Sinno_logo.png"
              alt="Sinno Logo"
              width={32}
              height={32}
              className="mr-2"
            />
            <a 
              href="https://www.facebook.com/SINNOclub/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl font-bold text-white hover:text-neutral-200 transition-colors"
            >
              Chatbot Sinno
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}; 