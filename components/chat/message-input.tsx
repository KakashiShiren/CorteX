"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function MessageInput({
  isLoading,
  onSubmit
}: {
  isLoading: boolean;
  onSubmit: (message: string) => Promise<void>;
}) {
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim() || isLoading) {
      return;
    }

    const current = message;
    setMessage("");
    await onSubmit(current);
  };

  return (
    <form onSubmit={submit} className="cortex-panel p-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Ask anything about Clark..."
          className="min-h-[72px] border-0 bg-transparent px-2 py-2 shadow-none focus:ring-0 sm:min-h-[64px]"
        />
        <Button type="submit" disabled={isLoading} className="sm:self-end">
          <Send className="mr-2 h-4 w-4" />
          {isLoading ? "Thinking..." : "Send"}
        </Button>
      </div>
    </form>
  );
}
