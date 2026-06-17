import { useState } from "react";
import {
  NodeViewContent,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";
import { Check, Copy } from "lucide-react";

function CodeBlockComponent({ node }: NodeViewProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    const codeContent = node.textContent || "";

    if (codeContent) {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);

      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    // <NodeViewWrapper className="rounded-[5px] bg-[#2e2b29] px-2 pt-2 pb-4 text-white  my-4 flex flex-col ">
    <NodeViewWrapper data-tiptap-code-block="" className="rounded-[5px] bg-[#2e2b29] text-white relative my-[24px] overflow-hidden">
      <button
        tabIndex={-0}
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={copyToClipboard}
        className="absolute top-1 right-1 w-fit self-end cursor-pointer rounded-[3px] border-none bg-[#444] p-1.25 text-white transition hover:bg-[#666] z-50"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>

      <pre className="text-sm overflow-x-auto rounded-lg mx-3 py-6 bg-[#2e2b29] ">
        <NodeViewContent className="whitespace-pre " />
      </pre>
    </NodeViewWrapper>
  );
}

export default CodeBlockComponent;
