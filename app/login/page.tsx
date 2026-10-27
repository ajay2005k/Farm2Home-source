import type { Metadata } from "next";
import LoginPage from "../LoginPage";

export const metadata: Metadata = {
  title: "Log in — Farm2Home",
  description: "Sign in to Farm2Home using the demo credentials.",
};

export default function Page() {
  return <LoginPage />;
}
