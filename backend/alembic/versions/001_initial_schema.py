"""Initial migration - Create all SmartSeat AI tables

Revision ID: 001_initial
Revises: 
Create Date: 2026-07-10

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # =========================================================
    # ROLES
    # =========================================================
    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(50), nullable=False),
        sa.Column("permissions", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_roles_name"),
    )

    # =========================================================
    # USERS
    # =========================================================
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
        sa.Column("refresh_token_hash", sa.String(255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    # =========================================================
    # DEPARTMENTS
    # =========================================================
    op.create_table(
        "departments",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("code", sa.String(20), nullable=False),
        sa.Column("manager_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_dept_name"),
        sa.UniqueConstraint("code", name="uq_dept_code"),
    )

    # =========================================================
    # DESIGNATIONS
    # =========================================================
    op.create_table(
        "designations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("title", sa.String(100), nullable=False),
        sa.Column("level", sa.Integer(), nullable=True),
        sa.Column("department_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["department_id"], ["departments.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("title", name="uq_desig_title"),
    )

    # =========================================================
    # EMPLOYEES
    # =========================================================
    op.create_table(
        "employees",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("employee_id", sa.String(20), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("department_id", sa.Integer(), nullable=True),
        sa.Column("designation_id", sa.Integer(), nullable=True),
        sa.Column("manager_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("location", sa.String(100), nullable=True),
        sa.Column("joining_date", sa.Date(), nullable=False),
        sa.Column(
            "employment_status",
            sa.String(20),
            server_default="active",
            nullable=False,
        ),
        sa.Column("is_new_joiner", sa.Boolean(), server_default="false", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["department_id"], ["departments.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["designation_id"], ["designations.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["manager_id"],
            ["employees.id"],
            ondelete="SET NULL",
            use_alter=True,
            name="fk_employee_manager",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("employee_id", name="uq_emp_employee_id"),
        sa.UniqueConstraint("email", name="uq_emp_email"),
        sa.UniqueConstraint("user_id", name="uq_emp_user_id"),
    )
    op.create_index("ix_employees_employee_id", "employees", ["employee_id"])
    op.create_index("ix_employees_email", "employees", ["email"])
    op.create_index("ix_employees_department_id", "employees", ["department_id"])

    # Add deferred FK for department.manager_id
    op.create_foreign_key(
        "fk_dept_manager",
        "departments",
        "employees",
        ["manager_id"],
        ["id"],
        ondelete="SET NULL",
        use_alter=True,
    )

    # =========================================================
    # PROJECTS
    # =========================================================
    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_code", sa.String(20), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("client_name", sa.String(200), nullable=True),
        sa.Column("project_manager_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", sa.String(20), server_default="active", nullable=False),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("budget", sa.Numeric(15, 2), nullable=True),
        sa.Column("resource_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["project_manager_id"], ["employees.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("project_code", name="uq_project_code"),
    )
    op.create_index("ix_projects_project_code", "projects", ["project_code"])

    # =========================================================
    # EMPLOYEE_PROJECTS
    # =========================================================
    op.create_table(
        "employee_projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("employee_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role_in_project", sa.String(100), nullable=True),
        sa.Column(
            "allocation_percentage", sa.Integer(), server_default="100", nullable=False
        ),
        sa.Column("is_primary", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("allocated_date", sa.Date(), server_default=sa.text("CURRENT_DATE")),
        sa.Column("deallocated_date", sa.Date(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "employee_id",
            "project_id",
            "deallocated_date",
            name="uq_emp_proj_dealloc",
        ),
    )
    op.create_index("ix_employee_projects_employee_id", "employee_projects", ["employee_id"])
    op.create_index("ix_employee_projects_project_id", "employee_projects", ["project_id"])

    # =========================================================
    # BUILDINGS
    # =========================================================
    op.create_table(
        "buildings",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("total_floors", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # =========================================================
    # FLOORS
    # =========================================================
    op.create_table(
        "floors",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("building_id", sa.Integer(), nullable=False),
        sa.Column("floor_number", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(100), nullable=True),
        sa.Column("total_seats", sa.Integer(), server_default="0", nullable=False),
        sa.ForeignKeyConstraint(["building_id"], ["buildings.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("building_id", "floor_number", name="uq_building_floor"),
    )
    op.create_index("ix_floors_building_id", "floors", ["building_id"])

    # =========================================================
    # ZONES
    # =========================================================
    op.create_table(
        "zones",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("floor_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["floor_id"], ["floors.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_zones_floor_id", "zones", ["floor_id"])

    # =========================================================
    # SEATS
    # =========================================================
    op.create_table(
        "seats",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("seat_number", sa.String(20), nullable=False),
        sa.Column("zone_id", sa.Integer(), nullable=False),
        sa.Column("seat_type", sa.String(20), server_default="standard", nullable=False),
        sa.Column("status", sa.String(20), server_default="available", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["zone_id"], ["zones.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("zone_id", "seat_number", name="uq_zone_seat"),
    )
    op.create_index("ix_seats_zone_id", "seats", ["zone_id"])
    op.create_index("ix_seats_status", "seats", ["status"])

    # =========================================================
    # SEAT_ALLOCATIONS
    # =========================================================
    op.create_table(
        "seat_allocations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("employee_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("seat_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("allocated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("allocated_date", sa.Date(), server_default=sa.text("CURRENT_DATE")),
        sa.Column("released_date", sa.Date(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["allocated_by"], ["users.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["seat_id"], ["seats.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_seat_alloc_employee_id", "seat_allocations", ["employee_id"])
    op.create_index("ix_seat_alloc_seat_id", "seat_allocations", ["seat_id"])
    op.create_index("ix_seat_alloc_is_active", "seat_allocations", ["is_active"])

    # Partial unique indexes — one active allocation per employee and per seat
    op.execute(
        """
        CREATE UNIQUE INDEX uq_active_employee_seat
        ON seat_allocations (employee_id)
        WHERE is_active = true
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX uq_active_seat_employee
        ON seat_allocations (seat_id)
        WHERE is_active = true
        """
    )

    # =========================================================
    # NEW_JOINERS
    # =========================================================
    op.create_table(
        "new_joiners",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("employee_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("expected_joining_date", sa.Date(), nullable=True),
        sa.Column("preferred_floor_id", sa.Integer(), nullable=True),
        sa.Column("preferred_zone", sa.String(100), nullable=True),
        sa.Column("seat_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", sa.String(20), server_default="pending", nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["preferred_floor_id"], ["floors.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(["seat_id"], ["seats.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("employee_id", name="uq_new_joiner_employee"),
    )
    op.create_index("ix_new_joiners_employee_id", "new_joiners", ["employee_id"])

    # =========================================================
    # AUDIT_LOGS
    # =========================================================
    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.String(100), nullable=True),
        sa.Column("old_values", postgresql.JSONB(), nullable=True),
        sa.Column("new_values", postgresql.JSONB(), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"])
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])
    op.create_index("ix_audit_logs_entity_type", "audit_logs", ["entity_type"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])

    # =========================================================
    # AI_QUERIES
    # =========================================================
    op.create_table(
        "ai_queries",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("natural_language_query", sa.Text(), nullable=False),
        sa.Column("generated_sql", sa.Text(), nullable=True),
        sa.Column("query_result", postgresql.JSONB(), nullable=True),
        sa.Column("execution_time_ms", sa.Integer(), nullable=True),
        sa.Column("is_safe", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("provider", sa.String(20), server_default="mock", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ai_queries_user_id", "ai_queries", ["user_id"])
    op.create_index("ix_ai_queries_created_at", "ai_queries", ["created_at"])

    # =========================================================
    # NOTIFICATIONS
    # =========================================================
    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("type", sa.String(20), server_default="info", nullable=False),
        sa.Column("is_read", sa.Boolean(), server_default="false", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    op.create_index("ix_notifications_is_read", "notifications", ["is_read"])

    # =========================================================
    # DEFAULT DATA — Roles
    # =========================================================
    op.execute(
        """
        INSERT INTO roles (name, permissions) VALUES
        ('super_admin', '{"all": true}'::jsonb),
        ('hr_admin', '{"employees": ["read","write","delete"], "projects": ["read","write"], "seats": ["read"], "analytics": ["read"]}'::jsonb),
        ('project_manager', '{"employees": ["read"], "projects": ["read","write"], "seats": ["read","write"], "analytics": ["read"]}'::jsonb),
        ('employee', '{"employees": ["read_self"], "projects": ["read_self"], "seats": ["read_self"]}'::jsonb)
        """
    )


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("ai_queries")
    op.drop_table("audit_logs")
    op.drop_table("new_joiners")
    op.drop_table("seat_allocations")
    op.drop_table("seats")
    op.drop_table("zones")
    op.drop_table("floors")
    op.drop_table("buildings")
    op.drop_table("employee_projects")
    op.drop_table("projects")
    op.drop_constraint("fk_dept_manager", "departments", type_="foreignkey")
    op.drop_table("employees")
    op.drop_table("designations")
    op.drop_table("departments")
    op.drop_table("users")
    op.drop_table("roles")
