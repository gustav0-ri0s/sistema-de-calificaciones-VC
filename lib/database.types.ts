export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            academic_years: {
                Row: {
                    id: number
                    year: number
                    status: 'abierto' | 'cerrado' | 'planificación'
                    is_active: boolean | null
                    created_at: string | null
                    start_date: string | null
                    end_date: string | null
                }
                Insert: {
                    id?: number
                    year: number
                    status?: 'abierto' | 'cerrado' | 'planificación'
                    is_active?: boolean | null
                    created_at?: string | null
                    start_date?: string | null
                    end_date?: string | null
                }
                Update: {
                    id?: number
                    year?: number
                    status?: 'abierto' | 'cerrado' | 'planificación'
                    is_active?: boolean | null
                    created_at?: string | null
                    start_date?: string | null
                    end_date?: string | null
                }
            }
            attendance: {
                Row: {
                    id: string
                    student_id: string
                    classroom_id: number
                    date: string
                    status: string
                    attendance_type_id: number | null
                    notes: string | null
                    created_at: string | null
                    created_by: string | null
                }
                Insert: {
                    id?: string
                    student_id: string
                    classroom_id: number
                    date?: string
                    status: string
                    attendance_type_id?: number | null
                    notes?: string | null
                    created_at?: string | null
                    created_by?: string | null
                }
                Update: {
                    id?: string
                    student_id?: string
                    classroom_id?: number
                    date?: string
                    status?: string
                    attendance_type_id?: number | null
                    notes?: string | null
                    created_at?: string | null
                    created_by?: string | null
                }
            }
            attendance_types: {
                Row: {
                    id: number
                    name: string
                    color: string
                    active: boolean | null
                    created_at: string | null
                }
                Insert: {
                    id?: number
                    name: string
                    color: string
                    active?: boolean | null
                    created_at?: string | null
                }
                Update: {
                    id?: number
                    name?: string
                    color?: string
                    active?: boolean | null
                    created_at?: string | null
                }
            }
            behavior_criteria: {
                Row: {
                    id: number
                    name: string
                    weight: string
                    active: boolean | null
                    created_at: string | null
                }
                Insert: {
                    id?: number
                    name: string
                    weight?: string
                    active?: boolean | null
                    created_at?: string | null
                }
                Update: {
                    id?: number
                    name?: string
                    weight?: string
                    active?: boolean | null
                    created_at?: string | null
                }
            }
            bimestres: {
                Row: {
                    id: number
                    academic_year_id: number | null
                    name: string
                    start_date: string
                    end_date: string
                    is_locked: boolean | null
                    created_at: string | null
                }
                Insert: {
                    id?: number
                    academic_year_id?: number | null
                    name: string
                    start_date: string
                    end_date: string
                    is_locked?: boolean | null
                    created_at?: string | null
                }
                Update: {
                    id?: number
                    academic_year_id?: number | null
                    name?: string
                    start_date?: string
                    end_date?: string
                    is_locked?: boolean | null
                    created_at?: string | null
                }
            }
            classrooms: {
                Row: {
                    id: number
                    level: 'inicial' | 'primaria' | 'secundaria'
                    grade: string
                    section: string
                    active: boolean | null
                    created_at: string | null
                    name: string | null
                    capacity: number | null
                }
                Insert: {
                    id?: number
                    level: 'inicial' | 'primaria' | 'secundaria'
                    grade: string
                    section: string
                    active?: boolean | null
                    created_at?: string | null
                    name?: string | null
                    capacity?: number | null
                }
                Update: {
                    id?: number
                    level?: 'inicial' | 'primaria' | 'secundaria'
                    grade?: string
                    section?: string
                    active?: boolean | null
                    created_at?: string | null
                    name?: string | null
                    capacity?: number | null
                }
            }
            competencies: {
                Row: {
                    id: number
                    area_id: number | null
                    name: string
                    description: string | null
                    is_evaluated: boolean | null
                    created_at: string | null
                }
                Insert: {
                    id?: number
                    area_id?: number | null
                    name: string
                    description?: string | null
                    is_evaluated?: boolean | null
                    created_at?: string | null
                }
                Update: {
                    id?: number
                    area_id?: number | null
                    name?: string
                    description?: string | null
                    is_evaluated?: boolean | null
                    created_at?: string | null
                }
            }
            course_assignments: {
                Row: {
                    id: number
                    area_id: number | null
                    profile_id: string | null
                    classroom_id: number | null
                    hours_per_week: number | null
                    created_at: string | null
                }
                Insert: {
                    id?: number
                    area_id?: number | null
                    profile_id?: string | null
                    classroom_id?: number | null
                    hours_per_week?: number | null
                    created_at?: string | null
                }
                Update: {
                    id?: number
                    area_id?: number | null
                    profile_id?: string | null
                    classroom_id?: number | null
                    hours_per_week?: number | null
                    created_at?: string | null
                }
            }
            curricular_areas: {
                Row: {
                    id: number
                    name: string
                    level: 'inicial' | 'primaria' | 'secundaria'
                    order: number | null
                    created_at: string | null
                }
                Insert: {
                    id?: number
                    name: string
                    level: 'inicial' | 'primaria' | 'secundaria'
                    order?: number | null
                    created_at?: string | null
                }
                Update: {
                    id?: number
                    name?: string
                    level?: 'inicial' | 'primaria' | 'secundaria'
                    order?: number | null
                    created_at?: string | null
                }
            }
            family_commitments: {
                Row: {
                    id: number
                    description: string
                    active: boolean | null
                    created_at: string | null
                }
                Insert: {
                    id?: number
                    description: string
                    active?: boolean | null
                    created_at?: string | null
                }
                Update: {
                    id?: number
                    description?: string
                    active?: boolean | null
                    created_at?: string | null
                }
            }
            incident_categories: {
                Row: {
                    id: number
                    name: string
                    active: boolean | null
                    created_at: string | null
                }
                Insert: {
                    id?: number
                    name: string
                    active?: boolean | null
                    created_at?: string | null
                }
                Update: {
                    id?: number
                    name?: string
                    active?: boolean | null
                    created_at?: string | null
                }
            }
            incident_logs: {
                Row: {
                    id: string
                    incident_id: string | null
                    status: 'registrada' | 'leída' | 'atención' | 'resuelta'
                    comment: string
                    created_by: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    incident_id?: string | null
                    status: 'registrada' | 'leída' | 'atención' | 'resuelta'
                    comment: string
                    created_by?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    incident_id?: string | null
                    status?: 'registrada' | 'leída' | 'atención' | 'resuelta'
                    comment?: string
                    created_by?: string | null
                    created_at?: string | null
                }
            }
            incident_participants: {
                Row: {
                    id: string
                    incident_id: string | null
                    student_id: string | null
                    role: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    incident_id?: string | null
                    student_id?: string | null
                    role?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    incident_id?: string | null
                    student_id?: string | null
                    role?: string | null
                    created_at?: string | null
                }
            }
            incidents: {
                Row: {
                    id: string
                    correlative: string | null
                    incident_date: string
                    type: 'estudiante' | 'aula' | 'general'
                    level: 'inicial' | 'primaria' | 'secundaria' | null
                    grade: string | null
                    section: string | null
                    room_name: string | null
                    category_id: number | null
                    other_category_suggestion: string | null
                    description: string
                    teacher_id: string
                    image_url: string | null
                    involved_students: Json | null
                    status: 'registrada' | 'leída' | 'atención' | 'resuelta' | null
                    created_at: string | null
                    classroom_id: number | null
                    resolution_details: string | null
                }
                Insert: {
                    id?: string
                    correlative?: string | null
                    incident_date?: string
                    type: 'estudiante' | 'aula' | 'general'
                    level?: 'inicial' | 'primaria' | 'secundaria' | null
                    grade?: string | null
                    section?: string | null
                    room_name?: string | null
                    category_id?: number | null
                    other_category_suggestion?: string | null
                    description: string
                    teacher_id: string
                    image_url?: string | null
                    involved_students?: Json | null
                    status?: 'registrada' | 'leída' | 'atención' | 'resuelta' | null
                    created_at?: string | null
                    classroom_id?: number | null
                    resolution_details?: string | null
                }
                Update: {
                    id?: string
                    correlative?: string | null
                    incident_date?: string
                    type?: 'estudiante' | 'aula' | 'general'
                    level?: 'inicial' | 'primaria' | 'secundaria' | null
                    grade?: string | null
                    section?: string | null
                    room_name?: string | null
                    category_id?: number | null
                    other_category_suggestion?: string | null
                    description?: string
                    teacher_id?: string
                    image_url?: string | null
                    involved_students?: Json | null
                    status?: 'registrada' | 'leída' | 'atención' | 'resuelta' | null
                    created_at?: string | null
                    classroom_id?: number | null
                    resolution_details?: string | null
                }
            }
            institutional_settings: {
                Row: {
                    id: number
                    name: string
                    slogan: string | null
                    address: string | null
                    city: string | null
                    phones: string | null
                    director_name: string | null
                    updated_at: string | null
                    attendance_tolerance: number | null
                    logo_url: string | null
                }
                Insert: {
                    id?: number
                    name: string
                    slogan?: string | null
                    address?: string | null
                    city?: string | null
                    phones?: string | null
                    director_name?: string | null
                    updated_at?: string | null
                    attendance_tolerance?: number | null
                    logo_url?: string | null
                }
                Update: {
                    id?: number
                    name?: string
                    slogan?: string | null
                    address?: string | null
                    city?: string | null
                    phones?: string | null
                    director_name?: string | null
                    updated_at?: string | null
                    attendance_tolerance?: number | null
                    logo_url?: string | null
                }
            }
            meeting_attendance: {
                Row: {
                    id: number
                    meeting_id: number
                    student_id: string
                    family_member_type: string
                    attended_at: string | null
                    created_at: string | null
                    other_family_member_name: string | null
                }
                Insert: {
                    id?: number
                    meeting_id: number
                    student_id: string
                    family_member_type: string
                    attended_at?: string | null
                    created_at?: string | null
                    other_family_member_name?: string | null
                }
                Update: {
                    id?: number
                    meeting_id?: number
                    student_id?: string
                    family_member_type?: string
                    attended_at?: string | null
                    created_at?: string | null
                    other_family_member_name?: string | null
                }
            }
            meetings: {
                Row: {
                    id: number
                    title: string
                    date: string
                    classroom_id: number
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: number
                    title: string
                    date: string
                    classroom_id: number
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: number
                    title?: string
                    date?: string
                    classroom_id?: number
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            parents: {
                Row: {
                    id: string
                    dni: string
                    full_name: string
                    phone: string | null
                    occupation: string | null
                    created_at: string | null
                    address: string | null
                }
                Insert: {
                    id?: string
                    dni: string
                    full_name: string
                    phone?: string | null
                    occupation?: string | null
                    created_at?: string | null
                    address?: string | null
                }
                Update: {
                    id?: string
                    dni?: string
                    full_name?: string
                    phone?: string | null
                    occupation?: string | null
                    created_at?: string | null
                    address?: string | null
                }
            }
            profiles: {
                Row: {
                    id: string
                    full_name: string
                    role: 'docente' | 'supervisor' | 'admin' | 'subdirector' | 'auxiliar' | 'secretaria'
                    active: boolean | null
                    created_at: string | null
                    email: string | null
                    dni: string | null
                    gender: string | null
                    personal_email: string | null
                    phone: string | null
                    password: string | null
                    birth_date: string | null
                    address: string | null
                    force_password_change: boolean | null
                    is_tutor: boolean | null
                    tutor_classroom_id: number | null
                }
                Insert: {
                    id?: string
                    full_name: string
                    role?: 'docente' | 'supervisor' | 'admin' | 'subdirector' | 'auxiliar' | 'secretaria'
                    active?: boolean | null
                    created_at?: string | null
                    email?: string | null
                    dni?: string | null
                    gender?: string | null
                    personal_email?: string | null
                    phone?: string | null
                    password?: string | null
                    birth_date?: string | null
                    address?: string | null
                    force_password_change?: boolean | null
                    is_tutor?: boolean | null
                    tutor_classroom_id?: number | null
                }
                Update: {
                    id?: string
                    full_name?: string
                    role?: 'docente' | 'supervisor' | 'admin' | 'subdirector' | 'auxiliar' | 'secretaria'
                    active?: boolean | null
                    created_at?: string | null
                    email?: string | null
                    dni?: string | null
                    gender?: string | null
                    personal_email?: string | null
                    phone?: string | null
                    password?: string | null
                    birth_date?: string | null
                    address?: string | null
                    force_password_change?: boolean | null
                    is_tutor?: boolean | null
                    tutor_classroom_id?: number | null
                }
            }
            role_permissions: {
                Row: {
                    role: 'docente' | 'supervisor' | 'admin' | 'subdirector' | 'auxiliar' | 'secretaria'
                    modules: string[]
                    updated_at: string | null
                }
                Insert: {
                    role: 'docente' | 'supervisor' | 'admin' | 'subdirector' | 'auxiliar' | 'secretaria'
                    modules?: string[]
                    updated_at?: string | null
                }
                Update: {
                    role?: 'docente' | 'supervisor' | 'admin' | 'subdirector' | 'auxiliar' | 'secretaria'
                    modules?: string[]
                    updated_at?: string | null
                }
            }
            student_appreciations: {
                Row: {
                    id: string
                    student_id: string
                    bimestre_id: number
                    tutor_id: string | null
                    comment: string | null
                    is_approved: boolean | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    student_id: string
                    bimestre_id: number
                    tutor_id?: string | null
                    comment?: string | null
                    is_approved?: boolean | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    student_id?: string
                    bimestre_id?: number
                    tutor_id?: string | null
                    comment?: string | null
                    is_approved?: boolean | null
                    created_at?: string
                    updated_at?: string
                }
            }
            student_behavior_grades: {
                Row: {
                    id: string
                    student_id: string
                    bimestre_id: number
                    behavior_grade: string | null
                    values_grade: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    student_id: string
                    bimestre_id: number
                    behavior_grade?: string | null
                    values_grade?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    student_id?: string
                    bimestre_id?: number
                    behavior_grade?: string | null
                    values_grade?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            student_parents: {
                Row: {
                    id: string
                    student_id: string | null
                    parent_id: string | null
                    relationship: string
                    is_guardian: boolean | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    student_id?: string | null
                    parent_id?: string | null
                    relationship: string
                    is_guardian?: boolean | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    student_id?: string | null
                    parent_id?: string | null
                    relationship?: string
                    is_guardian?: boolean | null
                    created_at?: string | null
                }
            }
            students: {
                Row: {
                    id: string
                    first_name: string
                    last_name: string
                    created_at: string | null
                    dni: string | null
                    email: string | null
                    birth_date: string | null
                    gender: string | null
                    address: string | null
                    academic_status: 'activo' | 'trasladado' | 'retirado' | 'reserva' | 'matriculado' | 'sin_matricula' | null
                    academic_year_id: number | null
                    classroom_id: number | null
                }
                Insert: {
                    id?: string
                    first_name: string
                    last_name: string
                    created_at?: string | null
                    dni?: string | null
                    email?: string | null
                    birth_date?: string | null
                    gender?: string | null
                    address?: string | null
                    academic_status?: 'activo' | 'trasladado' | 'retirado' | 'reserva' | 'matriculado' | 'sin_matricula' | null
                    academic_year_id?: number | null
                    classroom_id?: number | null
                }
                Update: {
                    id?: string
                    first_name?: string
                    last_name?: string
                    created_at?: string | null
                    dni?: string | null
                    email?: string | null
                    birth_date?: string | null
                    gender?: string | null
                    address?: string | null
                    academic_status?: 'activo' | 'trasladado' | 'retirado' | 'reserva' | 'matriculado' | 'sin_matricula' | null
                    academic_year_id?: number | null
                    classroom_id?: number | null
                }
            }
        }
        Views: {
        }
        Functions: {
        }
        Enums: {
            academic_status: 'activo' | 'trasladado' | 'retirado' | 'reserva' | 'matriculado' | 'sin_matricula'
            incident_status: 'registrada' | 'leída' | 'atención' | 'resuelta'
            incident_type: 'estudiante' | 'aula' | 'general'
            school_level: 'inicial' | 'primaria' | 'secundaria'
            user_role: 'docente' | 'supervisor' | 'admin' | 'subdirector' | 'auxiliar' | 'secretaria'
            year_status: 'abierto' | 'cerrado' | 'planificación'
        }
    }
}
