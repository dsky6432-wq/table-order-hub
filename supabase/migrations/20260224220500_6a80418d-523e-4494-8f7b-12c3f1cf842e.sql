
-- Add subscription_plan to profiles
ALTER TABLE public.profiles
ADD COLUMN subscription_plan text NOT NULL DEFAULT 'basic';

-- Add menu_theme to profiles (premium feature)
ALTER TABLE public.profiles
ADD COLUMN menu_theme text NOT NULL DEFAULT 'default';

-- Allow restaurant owners to delete their own tables
CREATE POLICY "Users can delete own tables"
ON public.restaurant_tables FOR DELETE
USING (auth.uid() = user_id);

-- Allow restaurant owners to delete their own categories
CREATE POLICY "Users can delete own categories"
ON public.categories FOR DELETE
USING (auth.uid() = user_id);

-- Allow restaurant owners to delete their own products
CREATE POLICY "Users can delete own products"
ON public.products FOR DELETE
USING (auth.uid() = user_id);
