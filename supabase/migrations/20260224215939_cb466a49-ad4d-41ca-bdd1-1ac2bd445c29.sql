
-- Allow public to view categories (needed for public menu)
CREATE POLICY "Public can view categories"
ON public.categories FOR SELECT
USING (true);

-- Allow public to view restaurant profiles (needed for public menu)
CREATE POLICY "Public can view profiles"
ON public.profiles FOR SELECT
USING (true);

-- Allow anonymous users to create orders
DROP POLICY IF EXISTS "Anyone can create orders for valid restaurants" ON public.orders;
CREATE POLICY "Anyone can create orders"
ON public.orders FOR INSERT
WITH CHECK (true);

-- Allow anonymous users to create order items
DROP POLICY IF EXISTS "Anyone can create items for valid orders" ON public.order_items;
CREATE POLICY "Anyone can create order items"
ON public.order_items FOR INSERT
WITH CHECK (true);
