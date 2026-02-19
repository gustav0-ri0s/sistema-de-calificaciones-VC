
-- Function to calculate teacher progress with competency-level assignment support
CREATE OR REPLACE FUNCTION get_teacher_completion_stats(p_teacher_id UUID, p_bimestre_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    -- Counters
    total_expected_grades INTEGER := 0;
    current_filled_grades INTEGER := 0;
    
    total_expected_tutor_grades INTEGER := 0;
    current_filled_tutor_grades INTEGER := 0;
    
    total_expected_family_grades INTEGER := 0;
    current_filled_family_grades INTEGER := 0;
    
    total_students_for_appreciation INTEGER := 0;
    approved_appreciations_count INTEGER := 0;
    
    missing_mandatory_conclusions INTEGER := 0;
    
    -- Loop vars
    course_rec RECORD;
    t_classroom_id BIGINT;
    student_count INTEGER;
    competency_count INTEGER;
    commitment_count INTEGER;
    temp_filled INTEGER;
    temp_missing INTEGER;
    
BEGIN
    -- 1. REGULAR COURSES PROGRESS
    FOR course_rec IN (
        -- Select assignments from the actual table
        SELECT id, classroom_id, area_id, competency_id
        FROM course_assignments
        WHERE profile_id = p_teacher_id
    ) LOOP
        -- Count students in this classroom
        SELECT count(*) INTO student_count FROM students s WHERE s.classroom_id = course_rec.classroom_id;
        
        -- Count assigned competencies (all area competencies if null, or just 1 if specified)
        IF course_rec.competency_id IS NULL THEN
            SELECT count(*) INTO competency_count FROM competencies c WHERE c.area_id = course_rec.area_id;
        ELSE
            competency_count := 1;
        END IF;
        
        -- Add to total expected
        total_expected_grades := total_expected_grades + (student_count * competency_count);
        
        -- Count actual filled grades for the assigned scope
        IF course_rec.competency_id IS NULL THEN
            SELECT count(*) INTO temp_filled
            FROM student_grades sg
            JOIN students s ON sg.student_id = s.id
            WHERE s.classroom_id = course_rec.classroom_id
            AND sg.competency_id IN (SELECT id FROM competencies WHERE area_id = course_rec.area_id)
            AND sg.bimestre_id = p_bimestre_id
            AND sg.grade IS NOT NULL AND sg.grade != '';
            
            -- Check for missing mandatory C conclusions
            SELECT count(*) INTO temp_missing
            FROM student_grades sg
            JOIN students s ON sg.student_id = s.id
            WHERE s.classroom_id = course_rec.classroom_id
            AND sg.competency_id IN (SELECT id FROM competencies WHERE area_id = course_rec.area_id)
            AND sg.bimestre_id = p_bimestre_id
            AND sg.grade = 'C'
            AND (sg.descriptive_conclusion IS NULL OR trim(sg.descriptive_conclusion) = '');
        ELSE
            SELECT count(*) INTO temp_filled
            FROM student_grades sg
            JOIN students s ON sg.student_id = s.id
            WHERE s.classroom_id = course_rec.classroom_id
            AND sg.competency_id = course_rec.competency_id
            AND sg.bimestre_id = p_bimestre_id
            AND sg.grade IS NOT NULL AND sg.grade != '';
            
            -- Check for missing mandatory C conclusions
            SELECT count(*) INTO temp_missing
            FROM student_grades sg
            JOIN students s ON sg.student_id = s.id
            WHERE s.classroom_id = course_rec.classroom_id
            AND sg.competency_id = course_rec.competency_id
            AND sg.bimestre_id = p_bimestre_id
            AND sg.grade = 'C'
            AND (sg.descriptive_conclusion IS NULL OR trim(sg.descriptive_conclusion) = '');
        END IF;
        
        current_filled_grades := current_filled_grades + temp_filled;
        missing_mandatory_conclusions := missing_mandatory_conclusions + temp_missing;
    END LOOP;

    -- 2. TUTOR PROGRESS
    -- Identify the tutor classroom from profiles table (matching App.tsx logic)
    SELECT tutor_classroom_id INTO t_classroom_id 
    FROM profiles 
    WHERE id = p_teacher_id;

    IF t_classroom_id IS NOT NULL THEN
        SELECT count(*) INTO student_count FROM students WHERE classroom_id = t_classroom_id;
        
        -- 2A. Behavior and Values (2 per student)
        total_expected_tutor_grades := student_count * 2;
        SELECT (
            count(CASE WHEN behavior_grade IS NOT NULL AND behavior_grade != '' THEN 1 END) +
            count(CASE WHEN values_grade IS NOT NULL AND values_grade != '' THEN 1 END)
        ) INTO current_filled_tutor_grades
        FROM student_behavior_grades sbg
        WHERE sbg.student_id IN (SELECT id FROM students WHERE classroom_id = t_classroom_id)
        AND sbg.bimestre_id = p_bimestre_id;
        
        -- 2B. Family Commitments
        SELECT count(*) INTO commitment_count FROM family_commitments WHERE active = true;
        total_expected_family_grades := student_count * (CASE WHEN commitment_count > 0 THEN commitment_count ELSE 0 END);
        
        SELECT count(*) INTO current_filled_family_grades
        FROM family_evaluations fe
        WHERE fe.student_id IN (SELECT id FROM students WHERE classroom_id = t_classroom_id)
        AND fe.bimestre_id = p_bimestre_id
        AND fe.grade IS NOT NULL AND fe.grade != '';
        
        -- 2C. Appreciations (requires approval)
        total_students_for_appreciation := student_count;
        SELECT count(*) INTO approved_appreciations_count
        FROM student_appreciations sa
        WHERE sa.student_id IN (SELECT id FROM students WHERE classroom_id = t_classroom_id)
        AND sa.bimestre_id = p_bimestre_id
        AND sa.is_approved = true;
    END IF;

    -- 3. Consolidated Result for Frontend Consumption
    RETURN jsonb_build_object(
        'course_stats', jsonb_build_object(
            'total_needed', total_expected_grades,
            'total_filled', current_filled_grades,
            'missing_conclusions', missing_mandatory_conclusions
        ),
        'tutor_stats', jsonb_build_object(
            'behavior_needed', total_expected_tutor_grades,
            'behavior_filled', current_filled_tutor_grades,
            'family_needed', total_expected_family_grades,
            'family_filled', current_filled_family_grades,
            'appreciations_needed', total_students_for_appreciation,
            'appreciations_approved', approved_appreciations_count
        )
    );
END;
$$;
