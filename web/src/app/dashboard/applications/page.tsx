"use client";

import { Suspense } from "react";

import { ApplicationsView } from "@/components/applications/applications-view";

export default function ApplicationsPage() {
  return (
    <Suspense fallback={null}>
      <ApplicationsView />
    </Suspense>
  );
}
