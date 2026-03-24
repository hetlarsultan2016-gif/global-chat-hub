
CREATE TABLE public.friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friendships" ON public.friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can send friend requests" ON public.friends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their friendships" ON public.friends FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can delete their friendships" ON public.friends FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);
