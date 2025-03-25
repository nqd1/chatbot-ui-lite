import { FC } from "react";
import Image from "next/image";

export const Navbar: FC = () => {
  return (
    <div className="flex h-[50px] sm:h-[60px] border-b border-neutral-300 py-2 px-2 sm:px-8 items-center justify-between">
      <div className="font-bold text-3xl flex items-center">
        <a className="ml-2 flex items-center hover:opacity-50" href="https://www.facebook.com/SINNOclub/">
          <img src="https://media.discordapp.net/attachments/1353588895245406253/1353792153607995392/SINNO_and_name.png?ex=67e39971&is=67e247f1&hm=0ffc9781d02410abe43294dd3e79d9df83aae639a364a85a4360811fd5dd59fb&=&format=webp&quality=lossless&width=940&height=940"
           alt="logo" width={50} height={50} />
          <span className="ml-2">Chatbot Sonni</span>
        </a>
      </div>
    </div>
  );
};
