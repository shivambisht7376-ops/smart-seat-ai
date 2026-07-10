-- ============================================================
-- SmartSeat AI — Complete PostgreSQL Schema
-- Database: Neon PostgreSQL
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    permissions JSONB        DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(255) NOT NULL UNIQUE,
    hashed_password     VARCHAR(255) NOT NULL,
    role_id             INTEGER      REFERENCES roles(id) ON DELETE SET NULL,
    is_active           BOOLEAN      NOT NULL DEFAULT true,
    last_login          TIMESTAMPTZ,
    refresh_token_hash  VARCHAR(255),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);
CREATE INDEX ix_users_email ON users(email);

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
    id          SERIAL       PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    code        VARCHAR(20)  NOT NULL UNIQUE,
    manager_id  UUID,        -- FK added after employees
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ============================================================
-- DESIGNATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS designations (
    id              SERIAL       PRIMARY KEY,
    title           VARCHAR(100) NOT NULL UNIQUE,
    level           INTEGER      CHECK (level BETWEEN 1 AND 10),
    department_id   INTEGER      REFERENCES departments(id) ON DELETE SET NULL
);

-- ============================================================
-- EMPLOYEES
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id         VARCHAR(20)  NOT NULL UNIQUE,
    user_id             UUID         UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    phone               VARCHAR(20),
    department_id       INTEGER      REFERENCES departments(id) ON DELETE SET NULL,
    designation_id      INTEGER      REFERENCES designations(id) ON DELETE SET NULL,
    manager_id          UUID         REFERENCES employees(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED,
    location            VARCHAR(100),
    joining_date        DATE         NOT NULL,
    employment_status   VARCHAR(20)  NOT NULL DEFAULT 'active'
                        CHECK (employment_status IN ('active','inactive','on_leave','terminated')),
    is_new_joiner       BOOLEAN      NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);
CREATE INDEX ix_employees_employee_id   ON employees(employee_id);
CREATE INDEX ix_employees_email         ON employees(email);
CREATE INDEX ix_employees_department_id ON employees(department_id);
CREATE INDEX ix_employees_status        ON employees(employment_status) WHERE deleted_at IS NULL;

-- Add deferred FK for department manager
ALTER TABLE departments
    ADD CONSTRAINT fk_dept_manager
    FOREIGN KEY (manager_id) REFERENCES employees(id)
    ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
    id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code        VARCHAR(20)   NOT NULL UNIQUE,
    name                VARCHAR(200)  NOT NULL,
    client_name         VARCHAR(200),
    project_manager_id  UUID          REFERENCES employees(id) ON DELETE SET NULL,
    status              VARCHAR(20)   NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','completed','on_hold','cancelled','archived')),
    start_date          DATE,
    end_date            DATE,
    budget              NUMERIC(15,2),
    resource_count      INTEGER       NOT NULL DEFAULT 0,
    description         TEXT,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);
CREATE INDEX ix_projects_project_code ON projects(project_code);
CREATE INDEX ix_projects_status       ON projects(status) WHERE deleted_at IS NULL;

-- ============================================================
-- EMPLOYEE_PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS employee_projects (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id             UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    project_id              UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role_in_project         VARCHAR(100),
    allocation_percentage   INTEGER     NOT NULL DEFAULT 100
                            CHECK (allocation_percentage BETWEEN 1 AND 100),
    is_primary              BOOLEAN     NOT NULL DEFAULT true,
    allocated_date          DATE        NOT NULL DEFAULT CURRENT_DATE,
    deallocated_date        DATE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (employee_id, project_id, deallocated_date)
);
CREATE INDEX ix_emp_proj_employee_id ON employee_projects(employee_id);
CREATE INDEX ix_emp_proj_project_id  ON employee_projects(project_id);

-- ============================================================
-- BUILDINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS buildings (
    id           SERIAL       PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    address      TEXT,
    city         VARCHAR(100),
    total_floors INTEGER,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ============================================================
-- FLOORS
-- ============================================================
CREATE TABLE IF NOT EXISTS floors (
    id           SERIAL      PRIMARY KEY,
    building_id  INTEGER     NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    floor_number INTEGER     NOT NULL,
    name         VARCHAR(100),
    total_seats  INTEGER     NOT NULL DEFAULT 0,
    UNIQUE (building_id, floor_number)
);
CREATE INDEX ix_floors_building_id ON floors(building_id);

-- ============================================================
-- ZONES
-- ============================================================
CREATE TABLE IF NOT EXISTS zones (
    id        SERIAL      PRIMARY KEY,
    floor_id  INTEGER     NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    name      VARCHAR(100) NOT NULL,
    capacity  INTEGER
);
CREATE INDEX ix_zones_floor_id ON zones(floor_id);

-- ============================================================
-- SEATS
-- ============================================================
CREATE TABLE IF NOT EXISTS seats (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    seat_number VARCHAR(20) NOT NULL,
    zone_id     INTEGER     NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    seat_type   VARCHAR(20) NOT NULL DEFAULT 'standard'
                CHECK (seat_type IN ('standard','standing','cabin','hot_desk')),
    status      VARCHAR(20) NOT NULL DEFAULT 'available'
                CHECK (status IN ('available','occupied','reserved','maintenance')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (zone_id, seat_number)
);
CREATE INDEX ix_seats_zone_id ON seats(zone_id);
CREATE INDEX ix_seats_status  ON seats(status);

-- ============================================================
-- SEAT_ALLOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS seat_allocations (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    seat_id         UUID        NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    allocated_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
    allocated_date  DATE        NOT NULL DEFAULT CURRENT_DATE,
    released_date   DATE,
    is_active       BOOLEAN     NOT NULL DEFAULT true,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_seat_alloc_employee_id ON seat_allocations(employee_id);
CREATE INDEX ix_seat_alloc_seat_id     ON seat_allocations(seat_id);
CREATE INDEX ix_seat_alloc_is_active   ON seat_allocations(is_active);

-- Partial unique indexes: one active allocation per employee / per seat
CREATE UNIQUE INDEX uq_active_employee_seat ON seat_allocations (employee_id) WHERE is_active = true;
CREATE UNIQUE INDEX uq_active_seat_employee ON seat_allocations (seat_id)     WHERE is_active = true;

-- ============================================================
-- NEW_JOINERS
-- ============================================================
CREATE TABLE IF NOT EXISTS new_joiners (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id           UUID        NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
    expected_joining_date DATE,
    preferred_floor_id    INTEGER     REFERENCES floors(id) ON DELETE SET NULL,
    preferred_zone        VARCHAR(100),
    seat_id               UUID        REFERENCES seats(id) ON DELETE SET NULL,
    status                VARCHAR(20) NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','allocated','cancelled')),
    notes                 TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_new_joiners_status ON new_joiners(status);

-- ============================================================
-- AUDIT_LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        REFERENCES users(id) ON DELETE SET NULL,
    action       VARCHAR(50) NOT NULL,
    entity_type  VARCHAR(50) NOT NULL,
    entity_id    VARCHAR(100),
    old_values   JSONB,
    new_values   JSONB,
    ip_address   VARCHAR(45),
    user_agent   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_audit_logs_user_id     ON audit_logs(user_id);
CREATE INDEX ix_audit_logs_action      ON audit_logs(action);
CREATE INDEX ix_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX ix_audit_logs_created_at  ON audit_logs(created_at);

-- ============================================================
-- AI_QUERIES
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_queries (
    id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID        REFERENCES users(id) ON DELETE SET NULL,
    natural_language_query   TEXT        NOT NULL,
    generated_sql            TEXT,
    query_result             JSONB,
    execution_time_ms        INTEGER,
    is_safe                  BOOLEAN     NOT NULL DEFAULT true,
    provider                 VARCHAR(20) NOT NULL DEFAULT 'mock',
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_ai_queries_user_id    ON ai_queries(user_id);
CREATE INDEX ix_ai_queries_created_at ON ai_queries(created_at);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(200) NOT NULL,
    message    TEXT,
    type       VARCHAR(20)  NOT NULL DEFAULT 'info'
               CHECK (type IN ('info','warning','success','error')),
    is_read    BOOLEAN      NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_notifications_user_id ON notifications(user_id);
CREATE INDEX ix_notifications_is_read ON notifications(is_read);

-- ============================================================
-- DEFAULT ROLES
-- ============================================================
INSERT INTO roles (name, permissions) VALUES
('super_admin',     '{"all": true}'::jsonb),
('hr_admin',        '{"employees": ["read","write","delete"], "projects": ["read","write"], "seats": ["read"], "analytics": ["read"]}'::jsonb),
('project_manager', '{"employees": ["read"], "projects": ["read","write"], "seats": ["read","write"], "analytics": ["read"]}'::jsonb),
('employee',        '{"employees": ["read_self"], "projects": ["read_self"], "seats": ["read_self"]}'::jsonb)
ON CONFLICT (name) DO NOTHING;
