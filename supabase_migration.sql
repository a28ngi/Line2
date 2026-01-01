-- Add node_id column to messages table to support Tree Chat
ALTER TABLE public.messages 
ADD COLUMN node_id text DEFAULT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_messages_node_id ON public.messages(node_id);

-- Force cache refresh for schema cache if needed (usually automatic)
NOTIFY pgrst, 'reload schema';
