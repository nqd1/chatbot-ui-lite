import { FC } from "react";
import Image from "next/image";

export const Navbar: FC = () => {
  return (
    <div className="flex h-[50px] sm:h-[60px] border-b border-neutral-300 py-2 px-2 sm:px-8 items-center justify-between">
      <div className="font-bold text-3xl flex items-center">
        <a className="ml-2 flex items-center hover:opacity-50" href="https://www.facebook.com/SINNOclub/">
          <Image src="/media/Sinno_logo.png" alt="logo" width={32} height={32} />
          <span className="ml-2">Chatbot Sonni</span>
        </a>
      </div>
    </div>
  );
};
