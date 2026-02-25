
-- Drop restrictive policies and recreate as permissive

-- CATEGORIES
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;

CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- PRODUCTS
DROP POLICY IF EXISTS "Public can view available products" ON public.products;
DROP POLICY IF EXISTS "Users can manage own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete own products" ON public.products;

CREATE POLICY "Public can view available products" ON public.products FOR SELECT USING (available = true);
CREATE POLICY "Users can view own products" ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON public.products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON public.products FOR DELETE USING (auth.uid() = user_id);

-- RESTAURANT_TABLES
DROP POLICY IF EXISTS "Public can view tables" ON public.restaurant_tables;
DROP POLICY IF EXISTS "Users can manage own tables" ON public.restaurant_tables;
DROP POLICY IF EXISTS "Users can delete own tables" ON public.restaurant_tables;

CREATE POLICY "Public can view tables" ON public.restaurant_tables FOR SELECT USING (true);
CREATE POLICY "Users can insert own tables" ON public.restaurant_tables FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tables" ON public.restaurant_tables FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tables" ON public.restaurant_tables FOR DELETE USING (auth.uid() = user_id);

-- ORDERS
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Restaurant owners can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Restaurant owners can update own orders" ON public.orders;

CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Restaurant owners can view own orders" ON public.orders FOR SELECT USING (auth.uid() = restaurant_user_id);
CREATE POLICY "Restaurant owners can update own orders" ON public.orders FOR UPDATE USING (auth.uid() = restaurant_user_id);

-- ORDER_ITEMS
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Order items viewable by restaurant owner" ON public.order_items;

CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Order items viewable by restaurant owner" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.restaurant_user_id = auth.uid())
);

-- PROFILES
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Public can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
