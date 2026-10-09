import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

/** Centred empty / error state with one primary action. */
export function StatePanel({
  icon: Icon,
  title,
  body,
  action,
  testId,
  heading: Heading = "h1",
}: {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  testId?: string;
  /** Use "h2" on pages that already have their own h1. */
  heading?: "h1" | "h2";
}) {
  const cls = "mt-8 inline-block rounded-md bg-ink px-6 py-3.5 text-md font-medium text-white transition-transform duration-200 ease-airy active:scale-[0.98]";
  return (
    <div className="mx-auto max-w-[560px] px-6 py-20 text-center" data-testid={testId}>
      {Icon && (
        <span className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-surface-control">
          <Icon size={28} />
        </span>
      )}
      <Heading className="text-2xl font-semibold">{title}</Heading>
      {body && <p className="mt-3 text-md text-ink-secondary">{body}</p>}
      {action &&
        (action.href ? (
          <Link href={action.href} className={cls}>
            {action.label}
          </Link>
        ) : (
          <button type="button" onClick={action.onClick} className={cls}>
            {action.label}
          </button>
        ))}
    </div>
  );
}

/** Shown on pages that need an account when nobody is logged in. */
export function LoginPrompt({ title, body, icon, heading }: { title: string; body: string; icon?: LucideIcon; heading?: "h1" | "h2" }) {
  const { requestLogin } = useAuth();
  return <StatePanel icon={icon} title={title} body={body} heading={heading} action={{ label: "Log in or sign up", onClick: () => requestLogin() }} testId="login-prompt" />;
}
