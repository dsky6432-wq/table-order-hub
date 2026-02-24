
-- Replace overly permissive INSERT policies with slightly scoped ones
-- Orders: anyone can insert but must provide a valid restaurant_user_id
DROP POLICY "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders for valid restaurants" ON public.orders 
  FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = restaurant_user_id)
  );

-- Order items: anyone can insert but must reference a valid order
DROP POLICY "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create items for valid orders" ON public.order_items 
  FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id)
  );
