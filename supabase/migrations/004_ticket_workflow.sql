-- Add assignment status to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assignment_status TEXT 
  CHECK (assignment_status IN ('unassigned', 'assigned', 'accepted', 'rejected'))
  DEFAULT 'unassigned';

-- Set assignment status for existing tickets
UPDATE tickets SET assignment_status = 
  CASE 
    WHEN assigned_to IS NULL THEN 'unassigned'
    ELSE 'assigned'
  END
WHERE assignment_status = 'unassigned';

-- Create index for assignment status
CREATE INDEX IF NOT EXISTS idx_tickets_assignment_status ON tickets(assignment_status);

-- Add rejection reason field
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update activity log to track acceptance/rejection
-- (activity_log table already exists from migration 001)

-- Add comment
COMMENT ON COLUMN tickets.assignment_status IS 'Tracks whether ticket assignment has been accepted or rejected';
COMMENT ON COLUMN tickets.rejection_reason IS 'Optional reason provided when technician rejects assignment';
