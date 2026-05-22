-- Sample order data for outlets with dine-in capability
-- Creates realistic orders with "pending", "preparing", "completed" statuses

DO $$
DECLARE
  o_id uuid;
  p_id uuid;
  item_id uuid;
  ord_id uuid;
  code text;
  cust text;
  order_total numeric;
  statuses text[] := ARRAY['pending', 'preparing', 'completed'];
  st text;
  rand_offset interval;
  num_items int;
  i int;
BEGIN
  FOR o_id IN SELECT id FROM outlets LOOP
    -- 3-5 random orders per outlet
    FOR i IN 1..(3 + floor(random() * 3)::int) LOOP
      code := upper(substr(md5(random()::text), 1, 6));
      cust := (ARRAY['Ahmad', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fitri', 'Gilang', 'Hana', 'Intan', 'Joko'])[floor(random() * 10 + 1)::int];
      st := statuses[floor(random() * 3 + 1)::int];
    rand_offset := (random() * interval '6 hours') + (i * interval '-30 minutes');
      order_total := 0;

      INSERT INTO orders (outlet_id, order_code, order_type, table_number, customer_name, customer_phone, status, payment_method, payment_status, total_amount, created_at)
      VALUES (o_id, code,
        CASE WHEN random() < 0.5 THEN 'dinein' ELSE 'takeaway' END,
        CASE WHEN random() < 0.5 THEN floor(random() * 20 + 1)::text ELSE NULL END,
        cust,
        '08' || lpad(floor(random() * 100000000)::text, 8, '0'),
        st,
        CASE WHEN random() < 0.5 THEN 'cash' ELSE 'qris' END,
        CASE WHEN random() < 0.3 THEN 'pending' ELSE 'paid' END,
        0,
        now() - rand_offset
      ) RETURNING orders.id INTO ord_id;

      -- 1-5 order items
      num_items := 1 + floor(random() * 4)::int;
      order_total := 0;

    FOR j IN 1..num_items LOOP
        SELECT id INTO p_id FROM products WHERE outlet_id = o_id ORDER BY random() LIMIT 1;
        IF p_id IS NOT NULL THEN
          INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
          VALUES (ord_id, p_id, 1 + floor(random() * 2)::int, (SELECT price FROM products WHERE id = p_id), (SELECT price FROM products WHERE id = p_id) * (1 + floor(random() * 2)::int))
          RETURNING id INTO item_id;
        END IF;
      END LOOP;

      SELECT COALESCE(SUM(total_price), 0) INTO order_total FROM order_items WHERE order_items.order_id = ord_id;
      UPDATE orders SET total_amount = order_total WHERE orders.id = ord_id;
    END LOOP;
  END LOOP;
END $$;
