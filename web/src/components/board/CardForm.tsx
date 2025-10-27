import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { CardInput } from "../../lib/api";
import { STATUS_LABELS, STATUSES, Status, cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { DialogClose } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

const schema = z.object({
  title: z.string().max(120).optional().or(z.literal("")),
  description: z.string().min(1, "Description is required"),
  status: z.enum(STATUSES)
});

type CardFormValues = z.infer<typeof schema>;

type Props = {
  defaultValues?: {
    title?: string | null;
    description?: string;
    status?: Status;
  };
  submitLabel: string;
  onSubmit: (values: CardInput) => void;
  onDelete?: () => void;
  isSubmitting?: boolean;
  isDeleting?: boolean;
};

export function CardForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onDelete,
  isSubmitting,
  isDeleting
}: Props) {
  const form = useForm<CardFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      status: defaultValues?.status ?? "todo"
    }
  });

  const statusValue = form.watch("status");

  const handleSubmit = form.handleSubmit((values) => {
    const payload: CardInput = {
      title: values.title?.trim() ? values.title.trim() : null,
      description: values.description.trim(),
      status: values.status
    };
    onSubmit(payload);
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" placeholder="Optional" {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-sm text-rose-400">{form.formState.errors.title.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="What needs to be done?" {...form.register("description")} />
        {form.formState.errors.description && (
          <p className="text-sm text-rose-400">{form.formState.errors.description.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label>Status</Label>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => form.setValue("status", status)}
              className={cn(
                "h-10 rounded-full border border-transparent px-4 text-sm font-medium transition-colors",
                statusValue === status
                  ? "bg-brand-500 text-white"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
              )}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
        <DialogClose asChild>
          <Button type="button" variant="ghost">
            Close
          </Button>
        </DialogClose>
        {onDelete && (
          <Button type="button" variant="danger" disabled={isDeleting} onClick={onDelete}>
            {isDeleting ? "Removing..." : "Delete"}
          </Button>
        )}
      </div>
    </form>
  );
}
