"use client";
import { AppProvider } from "@/lib/store";
import { DataProvider } from "@/components/data";
import { Shell } from "@/components/Shell";

export default function Page() {
  return (
    <AppProvider>
      <DataProvider>
        <Shell />
      </DataProvider>
    </AppProvider>
  );
}
