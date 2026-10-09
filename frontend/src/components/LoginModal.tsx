"use client";

import { LoginForm } from "./LoginForm";
import { Modal } from "./ui/Modal";

/** Desktop login: a centred modal. Phones use the `/login` page instead. */
export function LoginModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Log in or sign up" hideTitle className="md:w-[480px]">
      <LoginForm onDone={onDone} />
    </Modal>
  );
}
