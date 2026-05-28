import { MessagesPageClient } from "@/components/messages/messages-page-client";

export default function ConversationPage({
  params
}: {
  params: {
    conversationId: string;
  };
}) {
  return <MessagesPageClient activeConversationId={params.conversationId} />;
}
