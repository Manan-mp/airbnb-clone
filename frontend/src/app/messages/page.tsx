import { MessageSquare } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Messages" };

export default function MessagesPage() {
  return <ComingSoon icon={MessageSquare} title="Messages" body="Chat with your hosts and guests in one place." />;
}
