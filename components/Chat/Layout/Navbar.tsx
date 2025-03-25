import { FC } from "react";
import Image from "next/image";

export const Navbar: FC = () => {
  return (
    <div className="flex h-[50px] sm:h-[60px] border-b border-neutral-300 py-2 px-2 sm:px-8 items-center justify-between">
      <div className="font-bold text-3xl flex items-center">
        <a className="ml-2 flex items-center hover:opacity-50" href="https://www.facebook.com/SINNOclub/">
          <img src="https://media.discordapp.net/attachments/1353588895245406253/1353792153607995392/SINNO_and_name.png?ex=67e2f0b1&is=67e19f31&hm=a575b94457cb72218487e49a12b70548bc1e98f56aa0b85f9029d700e867c583&=&format=webp&quality=lossless&width=940&height=940" 
          alt="logo" width={40} height={40} />
          <span className="ml-2">Chatbot Sonni</span>
        </a>
      </div>
    </div>
  );
};
