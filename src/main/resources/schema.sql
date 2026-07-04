-- ============================================================
-- SCHEMA CLEANUP: Remove duplicate questions before seeding.
-- Keeps the oldest row (lowest id) per question_text.
-- The unique index is managed by Hibernate via @UniqueConstraint.
-- ============================================================

DELETE q1 FROM questions q1
INNER JOIN questions q2
  ON q1.question_text = q2.question_text
  AND q1.id > q2.id;

