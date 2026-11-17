-- The step of the admission process (1 Консультация, 2 Выбор вуза, 3 Документы,
-- 4 Подача, 5 Оффер, 6 Виза, 7 Готово) an application is at. edu-crm sets it and
-- both systems keep it in sync (docs/student-events.md). NULL means the
-- application was never touched there; the status then implies the stage.
ALTER TABLE "partner_applications" ADD COLUMN "stage" INTEGER;

-- Republish every application so edu-crm receives its stage.
INSERT INTO "catalog_outbox" ("entity", "entityId")
SELECT 'partner_application', "id" FROM "partner_applications";
