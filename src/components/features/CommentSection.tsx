import { addComment } from "@/app/actions/comments";
import type { CommentRow } from "@/lib/queries/comments";
import { GlassCard } from "../ui/GlassCard";
import { FormSubmitButton } from "../ui/FormSubmitButton";
import { TextArea } from "../ui/TextArea";
import { Avatar } from "../ui/Avatar";

export type CommentSectionProps = {
  postId: string;
  canComment: boolean;
  comments: CommentRow[];
  redirectTo: string;
  className?: string;
};

export function CommentSection({ postId, canComment, comments, redirectTo, className }: CommentSectionProps) {
  return (
    <GlassCard className={"p-6 md:p-8 " + (className ?? "")}>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-black tracking-tight">Comments</h3>
        <div className="text-xs font-mono text-foreground/50">{comments.length}</div>
      </div>

      <div className="mt-6 space-y-4">
        {!canComment ? (
          <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-4 text-sm text-foreground/60">
            Sign in to join the conversation.
          </div>
        ) : (
          <form action={addComment} className="space-y-3">
            <input type="hidden" name="postId" value={postId} />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <TextArea name="body" placeholder="Write a comment..." className="min-h-28" required />
            <div className="flex justify-end">
              <FormSubmitButton variant="primary" pendingText="Posting…">
                Post Comment
              </FormSubmitButton>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="rounded-xl border border-foreground/10 bg-foreground/5 p-4">
              <div className="flex items-center gap-3">
                <Avatar name={c.authorEmail} size={34} />
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate">{c.authorEmail}</div>
                  <div className="text-xs font-mono text-foreground/50">{new Date(c.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-foreground/70 whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}

          {comments.length === 0 ? <div className="text-sm text-foreground/50">No comments yet.</div> : null}
        </div>
      </div>
    </GlassCard>
  );
}
