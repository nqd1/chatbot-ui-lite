import { FC } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import type { SyntaxHighlighterProps } from 'react-syntax-highlighter';

interface Props {
  language: string;
  value: string;
}

export const CodeBlock: FC<Props> = ({ language, value }) => {
  return (
    <div className="w-full my-2 bg-black rounded-md">
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: "0.375rem",
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}; 