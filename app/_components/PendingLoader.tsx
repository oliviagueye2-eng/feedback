"use client";

import { useFormStatus } from "react-dom";
import { Loader } from "./Loader";

/** Covers the page with the loader while the form around it is being sent. */
export function PendingLoader({ message }: { message: string }) {
  const { pending } = useFormStatus();
  return pending ? <Loader message={message} /> : null;
}
