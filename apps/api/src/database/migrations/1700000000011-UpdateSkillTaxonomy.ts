import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Remap old skill IDs to new Digital SAT taxonomy.
 *
 * Mapping:
 *   information_ideas.command_of_evidence → information_ideas.command_of_evidence_textual
 *   rhetoric → craft_structure
 *   rhetoric.words_in_context → craft_structure.words_in_context
 *   rhetoric.text_structure → craft_structure.text_structure
 *   rhetoric.purpose → craft_structure.text_structure  (merged)
 *   rhetoric.arguments → craft_structure.cross_text_connections
 *   synthesis → expression_of_ideas
 *   synthesis.multiple_texts → expression_of_ideas.rhetorical_synthesis
 *   synthesis.quantitative_information → information_ideas.command_of_evidence_quantitative
 *
 * New skills (no old equivalent):
 *   expression_of_ideas.transitions
 *   standard_english (domain)
 *   standard_english.boundaries
 *   standard_english.form_structure_sense
 *   information_ideas.command_of_evidence_quantitative
 */
export class UpdateSkillTaxonomy1700000000011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Ensure parent domain skills exist (they may not if DB was freshly created)
    await queryRunner.query(`
      INSERT INTO skills (id, name, parent_id, level, mastery_threshold, sort_order)
      VALUES
        ('information_ideas', 'Information and Ideas', NULL, 'domain', 0.7, 1),
        ('passage_type_proficiency', 'Passage Type Proficiency', NULL, 'domain', 0.7, 16)
      ON CONFLICT (id) DO NOTHING
    `);

    // 2. Insert new skills for the Digital SAT taxonomy
    await queryRunner.query(`
      INSERT INTO skills (id, name, parent_id, level, mastery_threshold, sort_order)
      VALUES
        ('craft_structure', 'Craft and Structure', NULL, 'domain', 0.7, 6),
        ('craft_structure.words_in_context', 'Words in Context', 'craft_structure', 'skill', 0.65, 7),
        ('craft_structure.text_structure', 'Text Structure and Purpose', 'craft_structure', 'skill', 0.65, 8),
        ('craft_structure.cross_text_connections', 'Cross-Text Connections', 'craft_structure', 'skill', 0.65, 9),
        ('expression_of_ideas', 'Expression of Ideas', NULL, 'domain', 0.7, 10),
        ('expression_of_ideas.rhetorical_synthesis', 'Rhetorical Synthesis', 'expression_of_ideas', 'skill', 0.65, 11),
        ('expression_of_ideas.transitions', 'Transitions', 'expression_of_ideas', 'skill', 0.65, 12),
        ('standard_english', 'Standard English Conventions', NULL, 'domain', 0.7, 13),
        ('standard_english.boundaries', 'Boundaries', 'standard_english', 'skill', 0.65, 14),
        ('standard_english.form_structure_sense', 'Form, Structure, and Sense', 'standard_english', 'skill', 0.65, 15),
        ('information_ideas.command_of_evidence_textual', 'Command of Evidence (Textual)', 'information_ideas', 'skill', 0.65, 3),
        ('information_ideas.command_of_evidence_quantitative', 'Command of Evidence (Quantitative)', 'information_ideas', 'skill', 0.65, 4)
      ON CONFLICT (id) DO NOTHING
    `);

    // 2. Remap question_skills junction table
    const mappings: [string, string][] = [
      ['information_ideas.command_of_evidence', 'information_ideas.command_of_evidence_textual'],
      ['rhetoric.words_in_context', 'craft_structure.words_in_context'],
      ['rhetoric.text_structure', 'craft_structure.text_structure'],
      ['rhetoric.purpose', 'craft_structure.text_structure'],
      ['rhetoric.arguments', 'craft_structure.cross_text_connections'],
      ['synthesis.multiple_texts', 'expression_of_ideas.rhetorical_synthesis'],
      ['synthesis.quantitative_information', 'information_ideas.command_of_evidence_quantitative'],
    ];

    for (const [oldId, newId] of mappings) {
      // Avoid duplicate constraint violations: delete if new already exists for that question
      await queryRunner.query(`
        DELETE FROM question_skills qs1
        WHERE qs1.skill_id = $1
          AND EXISTS (SELECT 1 FROM question_skills qs2 WHERE qs2.question_id = qs1.question_id AND qs2.skill_id = $2)
      `, [oldId, newId]);
      // Now update remaining
      await queryRunner.query(`
        UPDATE question_skills SET skill_id = $2 WHERE skill_id = $1
      `, [oldId, newId]);
    }

    // 3. Remap student_skill_estimates
    for (const [oldId, newId] of mappings) {
      // Avoid unique constraint violation: if student already has new skill estimate, just delete old
      await queryRunner.query(`
        DELETE FROM student_skill_estimates
        WHERE skill_id = $1
          AND student_id IN (SELECT student_id FROM student_skill_estimates WHERE skill_id = $2)
      `, [oldId, newId]);
      await queryRunner.query(`
        UPDATE student_skill_estimates SET skill_id = $2 WHERE skill_id = $1
      `, [oldId, newId]);
    }

    // Also remap domain-level IDs in student_skill_estimates
    const domainMappings: [string, string][] = [
      ['rhetoric', 'craft_structure'],
      ['synthesis', 'expression_of_ideas'],
    ];
    for (const [oldId, newId] of domainMappings) {
      await queryRunner.query(`
        DELETE FROM student_skill_estimates
        WHERE skill_id = $1
          AND student_id IN (SELECT student_id FROM student_skill_estimates WHERE skill_id = $2)
      `, [oldId, newId]);
      await queryRunner.query(`
        UPDATE student_skill_estimates SET skill_id = $2 WHERE skill_id = $1
      `, [oldId, newId]);
    }

    // 4. Remap exercises.skills_focus (JSONB array of skill ID strings)
    // Replace old IDs with new IDs in the JSON array
    const allMappings: [string, string][] = [...mappings, ...domainMappings];
    for (const [oldId, newId] of allMappings) {
      await queryRunner.query(`
        UPDATE exercises
        SET skills_focus = (
          SELECT jsonb_agg(DISTINCT CASE WHEN elem::text = $1 THEN $2::jsonb ELSE elem END)
          FROM jsonb_array_elements(skills_focus) AS elem
        )
        WHERE skills_focus @> $3::jsonb
      `, [JSON.stringify(oldId), JSON.stringify(newId), JSON.stringify([oldId])]);
    }

    // 5. Update existing skill rows that changed names
    await queryRunner.query(`
      UPDATE skills SET name = 'Information and Ideas' WHERE id = 'information_ideas'
    `);
    await queryRunner.query(`
      UPDATE skills SET name = 'Central Ideas and Details' WHERE id = 'information_ideas.central_ideas'
    `);

    // 6. Update sort_order for retained skills
    await queryRunner.query(`UPDATE skills SET sort_order = 5 WHERE id = 'information_ideas.inferences'`);
    await queryRunner.query(`UPDATE skills SET sort_order = 16 WHERE id = 'passage_type_proficiency'`);
    await queryRunner.query(`UPDATE skills SET sort_order = 17 WHERE id = 'passage_type_proficiency.literature_passages'`);
    await queryRunner.query(`UPDATE skills SET sort_order = 18 WHERE id = 'passage_type_proficiency.history_passages'`);
    await queryRunner.query(`UPDATE skills SET sort_order = 19 WHERE id = 'passage_type_proficiency.science_passages'`);

    // 7. Delete old skills that have been remapped (no more FK references)
    const oldSkillIds = [
      'information_ideas.command_of_evidence',
      'rhetoric.words_in_context',
      'rhetoric.text_structure',
      'rhetoric.purpose',
      'rhetoric.arguments',
      'rhetoric',
      'synthesis.multiple_texts',
      'synthesis.quantitative_information',
      'synthesis',
    ];
    for (const id of oldSkillIds) {
      await queryRunner.query(`DELETE FROM skills WHERE id = $1`, [id]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse mapping is lossy (rhetoric.purpose merged into craft_structure.text_structure)
    // This is a best-effort rollback

    // Re-insert old skills
    await queryRunner.query(`
      INSERT INTO skills (id, name, parent_id, level, mastery_threshold, sort_order)
      VALUES
        ('rhetoric', 'Rhetoric', NULL, 'domain', 0.7, 5),
        ('rhetoric.words_in_context', 'Words in Context', 'rhetoric', 'skill', 0.65, 6),
        ('rhetoric.text_structure', 'Text Structure & Purpose', 'rhetoric', 'skill', 0.65, 7),
        ('rhetoric.purpose', 'Purpose', 'rhetoric', 'skill', 0.65, 8),
        ('rhetoric.arguments', 'Arguments', 'rhetoric', 'skill', 0.65, 9),
        ('synthesis', 'Synthesis', NULL, 'domain', 0.7, 10),
        ('synthesis.multiple_texts', 'Multiple Texts', 'synthesis', 'skill', 0.65, 11),
        ('synthesis.quantitative_information', 'Quantitative Information', 'synthesis', 'skill', 0.65, 12),
        ('information_ideas.command_of_evidence', 'Command of Evidence', 'information_ideas', 'skill', 0.65, 3)
      ON CONFLICT (id) DO NOTHING
    `);

    // Reverse remap
    const reverseMappings: [string, string][] = [
      ['information_ideas.command_of_evidence_textual', 'information_ideas.command_of_evidence'],
      ['craft_structure.words_in_context', 'rhetoric.words_in_context'],
      ['craft_structure.text_structure', 'rhetoric.text_structure'],
      ['craft_structure.cross_text_connections', 'rhetoric.arguments'],
      ['expression_of_ideas.rhetorical_synthesis', 'synthesis.multiple_texts'],
      ['information_ideas.command_of_evidence_quantitative', 'synthesis.quantitative_information'],
    ];

    for (const [newId, oldId] of reverseMappings) {
      await queryRunner.query(`UPDATE question_skills SET skill_id = $2 WHERE skill_id = $1`, [newId, oldId]);
      await queryRunner.query(`UPDATE student_skill_estimates SET skill_id = $2 WHERE skill_id = $1`, [newId, oldId]);
    }

    // Delete new skills
    const newSkillIds = [
      'craft_structure.words_in_context', 'craft_structure.text_structure',
      'craft_structure.cross_text_connections', 'craft_structure',
      'expression_of_ideas.rhetorical_synthesis', 'expression_of_ideas.transitions', 'expression_of_ideas',
      'standard_english.boundaries', 'standard_english.form_structure_sense', 'standard_english',
      'information_ideas.command_of_evidence_textual', 'information_ideas.command_of_evidence_quantitative',
    ];
    for (const id of newSkillIds) {
      await queryRunner.query(`DELETE FROM skills WHERE id = $1`, [id]);
    }
  }
}
