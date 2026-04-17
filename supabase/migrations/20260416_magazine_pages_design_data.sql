-- Add design_data column to store Fabric.js canvas JSON for the PageDesigner
ALTER TABLE magazine_issue_pages
  ADD COLUMN IF NOT EXISTS template_data jsonb,
  ADD COLUMN IF NOT EXISTS updated_at    timestamptz NOT NULL DEFAULT now();

COMMENT ON COLUMN magazine_issue_pages.template_data IS 'Fabric.js canvas JSON for PageDesigner. { engine: "designer-v1", canvasJSON: {...} }';

-- updated_at trigger
CREATE OR REPLACE TRIGGER magazine_issue_pages_updated_at
  BEFORE UPDATE ON magazine_issue_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
