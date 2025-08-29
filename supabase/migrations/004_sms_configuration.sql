-- SMS Configuration Tables

-- Table for storing SMS forwarding configuration
CREATE TABLE IF NOT EXISTS public.sms_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchased_number_id UUID NOT NULL REFERENCES public.purchased_numbers(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT false,
    forward_to_emails TEXT[] DEFAULT '{}',
    auto_reply_enabled BOOLEAN DEFAULT false,
    auto_reply_message TEXT,
    filter_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(purchased_number_id)
);

-- Table for SMS filter rules
CREATE TABLE IF NOT EXISTS public.sms_filter_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sms_configuration_id UUID NOT NULL REFERENCES public.sms_configurations(id) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('keyword', 'sender', 'blacklist')),
    pattern TEXT NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('forward', 'block', 'auto_reply')),
    priority INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for SMS forwarding logs
CREATE TABLE IF NOT EXISTS public.sms_forwarding_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sms_record_id UUID NOT NULL REFERENCES public.sms_records(id) ON DELETE CASCADE,
    email_recipient TEXT NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for auto-reply logs
CREATE TABLE IF NOT EXISTS public.sms_auto_reply_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sms_record_id UUID NOT NULL REFERENCES public.sms_records(id) ON DELETE CASCADE,
    reply_message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_sms_configurations_purchased_number_id ON public.sms_configurations(purchased_number_id);
CREATE INDEX idx_sms_filter_rules_configuration_id ON public.sms_filter_rules(sms_configuration_id);
CREATE INDEX idx_sms_filter_rules_enabled ON public.sms_filter_rules(enabled);
CREATE INDEX idx_sms_forwarding_logs_sms_record_id ON public.sms_forwarding_logs(sms_record_id);
CREATE INDEX idx_sms_forwarding_logs_status ON public.sms_forwarding_logs(status);
CREATE INDEX idx_sms_auto_reply_logs_sms_record_id ON public.sms_auto_reply_logs(sms_record_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sms_configurations_updated_at BEFORE UPDATE ON public.sms_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_filter_rules_updated_at BEFORE UPDATE ON public.sms_filter_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE public.sms_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_filter_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_forwarding_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_auto_reply_logs ENABLE ROW LEVEL SECURITY;

-- Policies for sms_configurations
CREATE POLICY "Users can view their own SMS configurations"
    ON public.sms_configurations FOR SELECT
    USING (purchased_number_id IN (
        SELECT id FROM public.purchased_numbers WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own SMS configurations"
    ON public.sms_configurations FOR INSERT
    WITH CHECK (purchased_number_id IN (
        SELECT id FROM public.purchased_numbers WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own SMS configurations"
    ON public.sms_configurations FOR UPDATE
    USING (purchased_number_id IN (
        SELECT id FROM public.purchased_numbers WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own SMS configurations"
    ON public.sms_configurations FOR DELETE
    USING (purchased_number_id IN (
        SELECT id FROM public.purchased_numbers WHERE user_id = auth.uid()
    ));

-- Policies for sms_filter_rules
CREATE POLICY "Users can view their own SMS filter rules"
    ON public.sms_filter_rules FOR SELECT
    USING (sms_configuration_id IN (
        SELECT sc.id FROM public.sms_configurations sc
        JOIN public.purchased_numbers pn ON sc.purchased_number_id = pn.id
        WHERE pn.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own SMS filter rules"
    ON public.sms_filter_rules FOR INSERT
    WITH CHECK (sms_configuration_id IN (
        SELECT sc.id FROM public.sms_configurations sc
        JOIN public.purchased_numbers pn ON sc.purchased_number_id = pn.id
        WHERE pn.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own SMS filter rules"
    ON public.sms_filter_rules FOR UPDATE
    USING (sms_configuration_id IN (
        SELECT sc.id FROM public.sms_configurations sc
        JOIN public.purchased_numbers pn ON sc.purchased_number_id = pn.id
        WHERE pn.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own SMS filter rules"
    ON public.sms_filter_rules FOR DELETE
    USING (sms_configuration_id IN (
        SELECT sc.id FROM public.sms_configurations sc
        JOIN public.purchased_numbers pn ON sc.purchased_number_id = pn.id
        WHERE pn.user_id = auth.uid()
    ));

-- Policies for sms_forwarding_logs
CREATE POLICY "Users can view their own SMS forwarding logs"
    ON public.sms_forwarding_logs FOR SELECT
    USING (sms_record_id IN (
        SELECT sr.id FROM public.sms_records sr
        JOIN public.purchased_numbers pn ON sr.purchased_number_id = pn.id
        WHERE pn.user_id = auth.uid()
    ));

-- Policies for sms_auto_reply_logs
CREATE POLICY "Users can view their own SMS auto-reply logs"
    ON public.sms_auto_reply_logs FOR SELECT
    USING (sms_record_id IN (
        SELECT sr.id FROM public.sms_records sr
        JOIN public.purchased_numbers pn ON sr.purchased_number_id = pn.id
        WHERE pn.user_id = auth.uid()
    ));