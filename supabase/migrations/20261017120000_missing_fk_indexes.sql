-- ═══════════════════════════════════════════════════════════════════════
-- Missing foreign-key indexes
-- ═══════════════════════════════════════════════════════════════════════
--
-- Why
--   Every foreign key in a Postgres schema should have an index on the
--   referencing column. Without one, deleting or updating a parent row makes
--   Postgres sequentially scan the child table to enforce the constraint, and
--   joins on the column fall back to a scan.
--
--   These six keys had no index. They are harmless while the tables are near
--   empty, which is exactly why they are worth adding now rather than after
--   Pulse and My Sanvic have real traffic.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- Pulse: a post's comments, and a user's own posts and likes.
CREATE INDEX IF NOT EXISTS pulse_comments_post_id_idx
  ON public.pulse_comments (post_id);

CREATE INDEX IF NOT EXISTS pulse_posts_user_id_idx
  ON public.pulse_posts (user_id);

CREATE INDEX IF NOT EXISTS pulse_likes_user_id_idx
  ON public.pulse_likes (user_id);

-- My Sanvic: saved places point at a destination.
CREATE INDEX IF NOT EXISTS saved_places_destination_id_idx
  ON public.saved_places (destination_id);

-- Notifications point at a user and (optionally) the post they are about.
CREATE INDEX IF NOT EXISTS notifications_user_id_idx
  ON public.notifications (user_id);

CREATE INDEX IF NOT EXISTS notifications_related_post_id_idx
  ON public.notifications (related_post_id);

COMMIT;
