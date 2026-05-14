import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/renstra")({
  beforeLoad: () => {
    throw redirect({ to: "/guest-table" });
  },
});
