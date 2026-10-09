import { ShieldCheck } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Identity verification" };

export default function IdentityPage() {
  return <ComingSoon icon={ShieldCheck} title="Identity verification" body="Verify your ID so hosts know who is staying." />;
}
