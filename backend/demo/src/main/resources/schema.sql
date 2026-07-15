-- ============================================================
-- SCHEMA CLEANUP: Remove duplicate questions before seeding.
-- Keeps the oldest row (lowest id) per question_text.
-- The unique index is managed by Hibernate via @UniqueConstraint.
-- ============================================================

DELETE q1 FROM questions q1
INNER JOIN questions q2
  ON q1.question_text = q2.question_text
  AND q1.id > q2.id;

-- ============================================================
-- QUESTION PERSONALIZATION: Stores approved wording variations.
-- Scoring continues to use the master question_id.
-- ============================================================

CREATE TABLE IF NOT EXISTS question_variations (
  id BIGINT NOT NULL AUTO_INCREMENT,
  question_id BIGINT NOT NULL,
  age_group VARCHAR(20) NOT NULL,
  variation_text TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  active BIT(1) NOT NULL DEFAULT b'1',
  PRIMARY KEY (id),
  INDEX idx_question_variations_age_group (age_group),
  INDEX idx_question_variations_question (question_id),
  CONSTRAINT fk_question_variations_question
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

