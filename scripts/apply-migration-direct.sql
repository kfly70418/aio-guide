-- Direct SQL execution to add provider display fields
ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS stability_score INTEGER,
  ADD COLUMN IF NOT EXISTS price_level TEXT,
  ADD COLUMN IF NOT EXISTS payment_methods TEXT,
  ADD COLUMN IF NOT EXISTS refund_policy TEXT,
  ADD COLUMN IF NOT EXISTS invoice_policy TEXT,
  ADD COLUMN IF NOT EXISTS free_credits DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS min_recharge INTEGER,
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS coupon_note TEXT,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
