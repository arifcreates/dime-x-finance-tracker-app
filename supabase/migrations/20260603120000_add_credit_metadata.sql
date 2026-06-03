/*
  # Add borrowed credit metadata

  Adds optional metadata to loan/EMI records so borrowed credits can store
  when the credit was taken and which account received the funds.
*/

ALTER TABLE emis
  ADD COLUMN IF NOT EXISTS debt_type text DEFAULT 'emi' CHECK (debt_type IN ('emi', 'credit')),
  ADD COLUMN IF NOT EXISTS credit_taken_date date,
  ADD COLUMN IF NOT EXISTS credited_account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS credited_account_name text;
