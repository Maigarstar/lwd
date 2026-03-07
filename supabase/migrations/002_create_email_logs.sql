-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 2.2: Email Logs Table (for SendGrid integration)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_type TEXT, -- 'vendor'|'couple'
  inquiry_id UUID REFERENCES vendor_inquiries(id) ON DELETE CASCADE,
  email_type TEXT, -- 'inquiry_notification'|'vendor_reply'|'inquiry_received'
  subject TEXT,
  status TEXT DEFAULT 'pending', -- pending|sent|failed
  error_message TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_email_logs_inquiry_id ON email_logs(inquiry_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at DESC);
