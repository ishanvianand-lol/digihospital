-- Create medicine_reminders table
CREATE TABLE IF NOT EXISTS medicine_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  medicine TEXT NOT NULL,
  time TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE medicine_reminders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see and manage their own reminders
CREATE POLICY "Users can manage their own reminders"
ON medicine_reminders
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_medicine_reminders_user_id ON medicine_reminders(user_id);
CREATE INDEX idx_medicine_reminders_active ON medicine_reminders(is_active);