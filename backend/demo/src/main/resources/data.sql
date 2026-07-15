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
SELECT 'Little interest or pleasure in doing things', 'DEPRESSION', 3, true, NOW() FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Little interest or pleasure in doing things');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Feeling down, depressed, or hopeless', 'DEPRESSION', 3, true, NOW() FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Feeling down, depressed, or hopeless');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Trouble falling or staying asleep, or sleeping too much', 'DEPRESSION', 3, true, NOW() FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Trouble falling or staying asleep, or sleeping too much');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Feeling tired or having little energy', 'DEPRESSION', 3, true, NOW() FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Feeling tired or having little energy');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Poor appetite or overeating', 'DEPRESSION', 3, true, NOW() FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Poor appetite or overeating');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down', 'DEPRESSION', 3, true, NOW() FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Trouble concentrating on things, such as reading the newspaper or watching television', 'DEPRESSION', 3, true, NOW() FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Trouble concentrating on things, such as reading the newspaper or watching television');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual', 'DEPRESSION', 3, true, NOW() FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Thoughts that you would be better off dead or of hurting yourself in some way', 'DEPRESSION', 3, true, NOW() FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Thoughts that you would be better off dead or of hurting yourself in some way');

-- GAD-7: Anxiety
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Feeling nervous, anxious or on edge', 'ANXIETY', 3, true, NOW() FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Feeling nervous, anxious or on edge');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Not being able to stop or control worrying', 'ANXIETY', 3, true, NOW() FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Not being able to stop or control worrying');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Worrying too much about different things', 'ANXIETY', 3, true, NOW() FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Worrying too much about different things');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Trouble relaxing', 'ANXIETY', 3, true, NOW() FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Trouble relaxing');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Being so restless that it is hard to sit still', 'ANXIETY', 3, true, NOW() FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Being so restless that it is hard to sit still');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Becoming easily annoyed or irritable', 'ANXIETY', 3, true, NOW() FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Becoming easily annoyed or irritable');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'Feeling afraid as if something awful might happen', 'ANXIETY', 3, true, NOW() FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'Feeling afraid as if something awful might happen');

-- Stress Scale
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'In the last month, how often have you felt that you were unable to control the important things in your life?', 'STRESS', 4, true, NOW() FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'In the last month, how often have you felt that you were unable to control the important things in your life?');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'In the last month, how often have you felt confident about your ability to handle your personal problems?', 'STRESS', 4, true, NOW() FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'In the last month, how often have you felt confident about your ability to handle your personal problems?');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'In the last month, how often have you felt that things were going your way?', 'STRESS', 4, true, NOW() FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'In the last month, how often have you felt that things were going your way?');
INSERT INTO questions (question_text, category, max_score, active, created_at)
SELECT 'In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?', 'STRESS', 4, true, NOW() FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question_text = 'In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?');

-- ============================================================
-- Step 3: Seed sample personalized variations for TWO master questions only
-- Scoring still uses question_id from the master questions table.
-- ============================================================

INSERT INTO question_variations (question_id, age_group, variation_text, version, active)
SELECT q.id, 'ADOLESCENT', 'Have you recently stopped enjoying things you usually like doing?', 1, true
FROM questions q
WHERE q.question_text = 'Little interest or pleasure in doing things'
  AND NOT EXISTS (
    SELECT 1 FROM question_variations v
    WHERE v.question_id = q.id
      AND v.age_group = 'ADOLESCENT'
      AND v.variation_text = 'Have you recently stopped enjoying things you usually like doing?'
  );

INSERT INTO question_variations (question_id, age_group, variation_text, version, active)
SELECT q.id, 'ADOLESCENT', 'Do your usual hobbies or activities feel less fun lately?', 2, true
FROM questions q
WHERE q.question_text = 'Little interest or pleasure in doing things'
  AND NOT EXISTS (
    SELECT 1 FROM question_variations v
    WHERE v.question_id = q.id
      AND v.age_group = 'ADOLESCENT'
      AND v.variation_text = 'Do your usual hobbies or activities feel less fun lately?'
  );

INSERT INTO question_variations (question_id, age_group, variation_text, version, active)
SELECT q.id, 'YOUNG_ADULT', 'Have you recently stopped enjoying activities you usually like?', 1, true
FROM questions q
WHERE q.question_text = 'Little interest or pleasure in doing things'
  AND NOT EXISTS (
    SELECT 1 FROM question_variations v
    WHERE v.question_id = q.id
      AND v.age_group = 'YOUNG_ADULT'
      AND v.variation_text = 'Have you recently stopped enjoying activities you usually like?'
  );

INSERT INTO question_variations (question_id, age_group, variation_text, version, active)
SELECT q.id, 'YOUNG_ADULT', 'Do your hobbies feel less interesting than before?', 2, true
FROM questions q
WHERE q.question_text = 'Little interest or pleasure in doing things'
  AND NOT EXISTS (
    SELECT 1 FROM question_variations v
    WHERE v.question_id = q.id
      AND v.age_group = 'YOUNG_ADULT'
      AND v.variation_text = 'Do your hobbies feel less interesting than before?'
  );

INSERT INTO question_variations (question_id, age_group, variation_text, version, active)
SELECT q.id, 'ADULT', 'Have you lost interest in activities that normally feel worthwhile?', 1, true
FROM questions q
WHERE q.question_text = 'Little interest or pleasure in doing things'
  AND NOT EXISTS (
    SELECT 1 FROM question_variations v
    WHERE v.question_id = q.id
      AND v.age_group = 'ADULT'
      AND v.variation_text = 'Have you lost interest in activities that normally feel worthwhile?'
  );

INSERT INTO question_variations (question_id, age_group, variation_text, version, active)
SELECT q.id, 'MIDDLE_AGED', 'Have your regular interests or routines felt less enjoyable recently?', 1, true
FROM questions q
WHERE q.question_text = 'Little interest or pleasure in doing things'
  AND NOT EXISTS (
    SELECT 1 FROM question_variations v
    WHERE v.question_id = q.id
      AND v.age_group = 'MIDDLE_AGED'
      AND v.variation_text = 'Have your regular interests or routines felt less enjoyable recently?'
  );

INSERT INTO question_variations (question_id, age_group, variation_text, version, active)
SELECT q.id, 'OLDER_ADULT', 'Have activities you usually value felt less enjoyable lately?', 1, true
FROM questions q
WHERE q.question_text = 'Little interest or pleasure in doing things'
  AND NOT EXISTS (
    SELECT 1 FROM question_variations v
    WHERE v.question_id = q.id
      AND v.age_group = 'OLDER_ADULT'
      AND v.variation_text = 'Have activities you usually value felt less enjoyable lately?'
  );

INSERT INTO question_variations (question_id, age_group, variation_text, version, active)
SELECT q.id, 'ADOLESCENT', 'Have you been feeling sad, low, or hopeless recently?', 1, true
FROM questions q
WHERE q.question_text = 'Feeling down, depressed, or hopeless'
  AND NOT EXISTS (
    SELECT 1 FROM question_variations v
    WHERE v.question_id = q.id
      AND v.age_group = 'ADOLESCENT'
      AND v.variation_text = 'Have you been feeling sad, low, or hopeless recently?'
  );

INSERT INTO question_variations (question_id, age_group, variation_text, version, active)
SELECT q.id, 'ADOLESCENT', 'Have your moods felt heavy or hard to shake lately?', 2, true
FROM questions q
WHERE q.question_text = 'Feeling down, depressed, or hopeless'
  AND NOT EXISTS (
    SELECT 1 FROM question_variations v
    WHERE v.question_id = q.id
      AND v.age_group = 'ADOLESCENT'
      AND v.variation_text = 'Have your moods felt heavy or hard to shake lately?'
  );

INSERT INTO question_variations (question_id, age_group, variation_text, version, active)
SELECT q.id, 'YOUNG_ADULT', 'Have you been feeling down, depressed, or hopeless lately?', 1, true
FROM questions q
WHERE q.question_text = 'Feeling down, depressed, or hopeless'
  AND NOT EXISTS (
    SELECT 1 FROM question_variations v
    WHERE v.question_id = q.id
      AND v.age_group = 'YOUNG_ADULT'
      AND v.variation_text = 'Have you been feeling down, depressed, or hopeless lately?'
  );

INSERT INTO question_variations (question_id, age_group, variation_text, version, active)
SELECT q.id, 'YOUNG_ADULT', 'Have things felt emotionally heavy or discouraging recently?', 2, true
FROM questions q
WHERE q.question_text = 'Feeling down, depressed, or hopeless'
  AND NOT EXISTS (
    SELECT 1 FROM question_variations v
    WHERE v.question_id = q.id
      AND v.age_group = 'YOUNG_ADULT'
      AND v.variation_text = 'Have things felt emotionally heavy or discouraging recently?'
  );

INSERT INTO question_variations (question_id, age_group, variation_text, version, active)
SELECT q.id, 'ADULT', 'Have you recently felt low, depressed, or without hope?', 1, true
FROM questions q
WHERE q.question_text = 'Feeling down, depressed, or hopeless'
  AND NOT EXISTS (
    SELECT 1 FROM question_variations v
    WHERE v.question_id = q.id
      AND v.age_group = 'ADULT'
      AND v.variation_text = 'Have you recently felt low, depressed, or without hope?'
  );

INSERT INTO question_variations (question_id, age_group, variation_text, version, active)
SELECT q.id, 'MIDDLE_AGED', 'Have you been feeling persistently low or discouraged recently?', 1, true
FROM questions q
WHERE q.question_text = 'Feeling down, depressed, or hopeless'
  AND NOT EXISTS (
    SELECT 1 FROM question_variations v
    WHERE v.question_id = q.id
      AND v.age_group = 'MIDDLE_AGED'
      AND v.variation_text = 'Have you been feeling persistently low or discouraged recently?'
  );

INSERT INTO question_variations (question_id, age_group, variation_text, version, active)
SELECT q.id, 'OLDER_ADULT', 'Have you felt low, discouraged, or hopeless in recent days?', 1, true
FROM questions q
WHERE q.question_text = 'Feeling down, depressed, or hopeless'
  AND NOT EXISTS (
    SELECT 1 FROM question_variations v
    WHERE v.question_id = q.id
      AND v.age_group = 'OLDER_ADULT'
      AND v.variation_text = 'Have you felt low, discouraged, or hopeless in recent days?'
  );

