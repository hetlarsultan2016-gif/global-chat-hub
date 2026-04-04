
-- Add customization columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name_color text DEFAULT null;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS font_color text DEFAULT null;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS font_style text DEFAULT 'normal';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

-- Create profile_likes table to track who liked whom
CREATE TABLE public.profile_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  liker_id uuid NOT NULL,
  liked_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(liker_id, liked_id)
);

ALTER TABLE public.profile_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can like others" ON public.profile_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = liker_id);
CREATE POLICY "Users can unlike" ON public.profile_likes FOR DELETE TO authenticated USING (auth.uid() = liker_id);
CREATE POLICY "Likes are viewable" ON public.profile_likes FOR SELECT TO authenticated USING (true);

-- Function to update likes_count and level
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET likes_count = likes_count + 1, level = GREATEST(1, (likes_count + 1) / 10 + 1) WHERE user_id = NEW.liked_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET likes_count = GREATEST(0, likes_count - 1), level = GREATEST(1, GREATEST(0, likes_count - 1) / 10 + 1) WHERE user_id = OLD.liked_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_like_change
AFTER INSERT OR DELETE ON public.profile_likes
FOR EACH ROW EXECUTE FUNCTION public.update_likes_count();
