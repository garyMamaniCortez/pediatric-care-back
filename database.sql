-- 1. TABLA DE USUARIOS (para autenticación)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'medico' CHECK (role IN ('admin', 'medico', 'recepcionista'))
);

COMMENT ON TABLE users IS 'Usuarios del sistema para autenticación';
COMMENT ON COLUMN users.username IS 'Nombre de usuario para login';
COMMENT ON COLUMN users.password_hash IS 'Hash de la contraseña (ej. bcrypt)';

-- 2. TABLA DE PACIENTES (Niños/as)
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('masculino', 'femenino')),
    blood_type VARCHAR(3),
    allergies TEXT DEFAULT 'Ninguna',
    base_condition TEXT DEFAULT 'Ninguna'
);

COMMENT ON TABLE patients IS 'Información demográfica y médica base del paciente';
COMMENT ON COLUMN patients.blood_type IS 'Tipo de sangre (Ej: O+, A-, etc.)';

-- 3. TABLA DE APODERADOS (Padres/Tutores)
CREATE TABLE guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    relationship VARCHAR(20) NOT NULL CHECK (relationship IN ('padre', 'madre', 'abuelo', 'abuela', 'tio', 'tia', 'otro')),
    relationship_other VARCHAR(50)
);

COMMENT ON TABLE guardians IS 'Responsables legales o contacto de emergencia del paciente';

-- 4. TABLA PUENTE PACIENTES-APODERADOS (Relación Muchos a Muchos)
CREATE TABLE patient_guardians (
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
    PRIMARY KEY (patient_id, guardian_id)
);

COMMENT ON TABLE patient_guardians IS 'Asocia pacientes con sus apoderados. Un paciente puede tener varios apoderados y un apoderado varios pacientes.';

-- 5. TABLA DE SERVICIOS (Lista de precios)
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    active BOOLEAN DEFAULT true,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0)
);

COMMENT ON TABLE services IS 'Catálogo de servicios médicos y sus precios';

-- 6. TABLA DE CITAS
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    time TIME NOT NULL, -- Se recomienda TIME, pero el frontend usa string "HH:MM"
    status VARCHAR(15) NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'completada', 'cancelada')),
    UNIQUE(date, time)
);

COMMENT ON TABLE appointments IS 'Agenda de citas médicas';
COMMENT ON COLUMN appointments.status IS 'Estado de la cita: pendiente, completada, cancelada';

-- 7. TABLA DE REGISTROS CLÍNICOS (Evolución)
CREATE TABLE clinical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    weight DECIMAL(5, 2) NOT NULL CHECK (weight > 0 AND weight < 300), -- Peso en kg
    height DECIMAL(5, 2) NOT NULL CHECK (height > 0 AND height < 300), -- Talla en cm
    notes TEXT,
    diagnosis TEXT
);

COMMENT ON TABLE clinical_records IS 'Datos de la consulta médica: antropometría, diagnóstico y notas.';
COMMENT ON COLUMN clinical_records.appointment_id IS 'Relación 1:1 con la cita';

-- 8. TABLA DE RECETAS (Cabecera)
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinical_record_id UUID NOT NULL REFERENCES clinical_records(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    date DATE NOT NULL
);

COMMENT ON TABLE prescriptions IS 'Cabecera de la receta médica';

-- 9. TABLA DE DETALLE DE RECETAS (Medicamentos)
CREATE TABLE prescription_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medication_name VARCHAR(150) NOT NULL,
    presentation VARCHAR(100) NOT NULL,
    instructions TEXT NOT NULL
);

COMMENT ON TABLE prescription_details IS 'Lista de medicamentos prescritos en una receta';

-- 10. TABLA DE CERTIFICADOS MÉDICOS
CREATE TABLE medical_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinical_record_id UUID NOT NULL REFERENCES clinical_records(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    content TEXT NOT NULL
);

COMMENT ON TABLE medical_certificates IS 'Certificados médicos emitidos para el paciente';

-- 11. TABLA DE INDICACIONES MÉDICAS
CREATE TABLE indications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinical_record_id UUID NOT NULL REFERENCES clinical_records(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    content TEXT NOT NULL
);

COMMENT ON TABLE indications IS 'Indicaciones médicas adicionales (reposo, dieta, etc.)';

-- 12. TABLA DE PAGOS
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    concept VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    method VARCHAR(10) NOT NULL CHECK (method IN ('efectivo', 'qr'))
);

COMMENT ON TABLE payments IS 'Registro de pagos realizados por los pacientes';

-- ====================================================================
-- ÍNDICES PARA OPTIMIZAR LAS CONSULTAS MÁS FRECUENTES
-- Basado en los filtros y búsquedas del frontend.
-- ====================================================================

-- Para búsquedas en AppointmentList y PatientList
CREATE INDEX idx_patients_name ON patients USING GIN (to_tsvector('spanish', name));
CREATE INDEX idx_guardians_name ON guardians USING GIN (to_tsvector('spanish', name));
CREATE INDEX idx_guardians_phone ON guardians(phone);

-- Para filtros en PatientList
CREATE INDEX idx_patients_birth_date ON patients(birth_date);
CREATE INDEX idx_patients_gender ON patients(gender);

-- Para la agenda de citas
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_service_id ON appointments(service_id);

-- Para el historial de pagos y cobros pendientes
CREATE INDEX idx_payments_date ON payments(date);
CREATE INDEX idx_payments_patient_id ON payments(patient_id);
CREATE INDEX idx_payments_method ON payments(method);

-- Para la búsqueda rápida por rango de fechas en pagos
CREATE INDEX idx_payments_date_range ON payments(date, amount);

-- Para el historial clínico (muy importante)
CREATE INDEX idx_clinical_records_patient_id ON clinical_records(patient_id);
CREATE INDEX idx_clinical_records_date ON clinical_records(date);
CREATE INDEX idx_clinical_records_appointment_id ON clinical_records(appointment_id);

-- Para las relaciones paciente-apoderado
CREATE INDEX idx_patient_guardians_patient_id ON patient_guardians(patient_id);
CREATE INDEX idx_patient_guardians_guardian_id ON patient_guardians(guardian_id);