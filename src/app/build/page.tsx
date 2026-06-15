import type { Metadata } from "next";
import { Workbench } from "@/components/simulator/Workbench";

export const metadata: Metadata = {
  title: "Bench",
  description:
    "Tune a squash racquet's shape, weight, balance, string tension and grip and read the live trade-offs.",
};

export default async function BuildPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const initialToken = typeof sp.c === "string" ? sp.c : null;
  return <Workbench initialToken={initialToken} />;
}
