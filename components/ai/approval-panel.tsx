"use client";

import { Button } from "@/components/ui/button";

export function ApprovalPanel({
  onApprove,
  onReject,
  onEdit,
  onSaveEdits,
  busy,
  editing,
}: {
  onApprove: () => void;
  onReject: () => void;
  onEdit?: () => void;
  onSaveEdits?: () => void;
  busy?: boolean;
  editing?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {editing ? (
        <Button size="sm" onClick={onSaveEdits} loading={busy} loadingLabel="Revalidating…">
          Save edits
        </Button>
      ) : (
        <Button size="sm" onClick={onApprove} loading={busy} loadingLabel="Applying…">
          Approve all
        </Button>
      )}
      {!editing && onEdit && (
        <Button size="sm" variant="outline" onClick={onEdit} disabled={busy}>
          Edit
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={onReject} disabled={busy}>
        Reject
      </Button>
    </div>
  );
}
