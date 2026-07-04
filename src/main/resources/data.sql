-- ============================================================
-- Step 1: Remove any duplicate questions (keeps lowest id per text)
-- This runs safely on every restart; no-op if no duplicates exist
-- ============================================================
DELETE q1 FROM questions q1
INNER JOIN questions q2
  ON q1.question_text = q2.question_text
  AND q1.id > q2.id;

-- ============================================================
-- Step 2: Seed questions only if they don't already exist
-- Uses WHERE NOT EXISTS to avoid duplicates without needing a unique index
-- ============================================================

-- PHQ-9: Depression
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Little interest or pleasure in doing things', 'DEPRESSION', 3, true, NOW() WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Little interest or pleasure in doing things');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Feeling down, depressed, or hopeless', 'DEPRESSION', 3, true, NOW() WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Feeling down, depressed, or hopeless');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Trouble falling or staying asleep, or sleeping too much', 'DEPRESSION', 3, true, NOW() WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Trouble falling or staying asleep, or sleeping too much');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Feeling tired or having little energy', 'DEPRESSION', 3, true, NOW() WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Feeling tired or having little energy');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Poor appetite or overeating', 'DEPRESSION', 3, true, NOW() WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Poor appetite or overeating');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down', 'DEPRESSION', 3, true, NOW() WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Trouble concentrating on things, such as reading the newspaper or watching television', 'DEPRESSION', 3, true, NOW() WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Trouble concentrating on things, such as reading the newspaper or watching television');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual', 'DEPRESSION', 3, true, NOW() WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Thoughts that you would be better off dead or of hurting yourself in some way', 'DEPRESSION', 3, true, NOW() WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Thoughts that you would be better off dead or of hurting yourself in some way');

-- GAD-7: Anxiety
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Feeling nervous, anxious or on edge', 'ANXIETY', 3, true, NOW() WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Feeling nervous, anxious or on edge');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Not being able to stop or control worrying', 'ANXIETY', 3, true, NOW() WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Not being able to stop or control worrying');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Worrying too much about different things', 'ANXIETY', 3, true, NOW() WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Worrying too much about different things');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Trouble relaxing', 'ANXIETY', 3, true, NOW() WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Trouble relaxing');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Being so restless that it is hard to sit still', 'ANXIETY', 3, true, NOW() WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Being so restless that it is hard to sit still');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Becoming easily annoyed or irritable', 'ANXIETY', 3, true, NOW() WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Becoming easily annoyed or irritable');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Feeling afraid as if something awful might happen', 'ANXIETY', 3, true, NOW() WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Feeling afraid as if something awful might happen');

-- Stress Scale
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'In the last month, how often have you felt that you were unable to control the important things in your life?', 'STRESS', 4, true, NOW() WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'In the last month, how often have you felt that you were unable to control the important things in your life?');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'In the last month, how often have you felt confident about your ability to handle your personal problems?', 'STRESS', 4, true, NOW() WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'In the last month, how often have you felt confident about your ability to handle your personal problems?');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'In the last month, how often have you felt that things were going your way?', 'STRESS', 4, true, NOW() WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'In the last month, how often have you felt that things were going your way?');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?', 'STRESS', 4, true, NOW() WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?');

