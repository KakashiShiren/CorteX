import { AiChatClient } from "@/components/chat/ai-chat-client";

export default function AiChatPage({
  searchParams
}: {
  searchParams: { q?: string };
}) {
  return <AiChatClient initialQuery={searchParams.q} />;
}
