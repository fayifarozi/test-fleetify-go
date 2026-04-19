import { useEffect } from "react";
import { useRouter } from "next/router";
import { useStore } from "@/store/useStore";

export default function Home() {
  const router = useRouter();
  const token = useStore((s) => s.token);

  useEffect(() => {
    if (token) {
      router.replace("/invoices");
    } else {
      router.replace("/login");
    }
  }, [token, router]);

  return null;
}
