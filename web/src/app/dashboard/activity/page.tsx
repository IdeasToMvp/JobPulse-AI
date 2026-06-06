import { Card } from "@/components/ui/card";

export default function ActivityPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recent sync events and status changes.
        </p>
      </div>

      <Card>
        <p className="text-sm text-muted-foreground">
          Activity feed will appear here after your first sync.
        </p>
      </Card>
    </div>
  );
}
