"use client";

import { useRef, useState } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function MessageInput({
  isLoading,
  onSubmit,
  placeholder = "Ask anything about your campus... (Enter to send)"
}: {
  isLoading: boolean;
  onSubmit: (message: string) => Promise<void>;
  placeholder?: string;
}) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const resetTextareaHeight = () => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "";
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
    resizeTextarea(event.target);
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading) {
      return;
    }

    setMessage("");
    resetTextareaHeight();

    try {
      await onSubmit(trimmedMessage);
    } catch (error) {
      console.error("[ai-chat] Unable to send message.", error);
      setMessage(trimmedMessage);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          resizeTextarea(textareaRef.current);
        }
      });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (message.trim() && !isLoading) {
        void handleSend();
      }
    }
  };

  return (
    <div className="cortex-panel p-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[72px] border-0 bg-transparent px-2 py-2 shadow-none focus:ring-0 sm:min-h-[64px]"
        />
        <Button
          type="button"
          onClick={() => void handleSend()}
          disabled={message.trim() === "" || isLoading}
          className="sm:self-end"
        >
          <Send className="mr-2 h-4 w-4" />
          {isLoading ? "Thinking..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
