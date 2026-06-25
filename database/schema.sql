-- ============================================================================
-- Mardan Smart City — PostgreSQL Database Schema
-- DESC Digital Innovation Center | Cloud-Native Citizen Portal
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    cnic        VARCHAR(20) UNIQUE,
    phone       VARCHAR(20),
    role        VARCHAR(10) NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin', 'staff')),
    "isActive"  BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "failedLoginAttempts" INTEGER DEFAULT 0,
    "lockedUntil" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    head        VARCHAR(100),
    email       VARCHAR(150),
    phone       VARCHAR(20),
    "isActive"  BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "failedLoginAttempts" INTEGER DEFAULT 0,
    "lockedUntil" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaints (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "trackingId"  VARCHAR(20) NOT NULL UNIQUE,
    title         VARCHAR(200) NOT NULL,
    description   TEXT NOT NULL,
    category      VARCHAR(100) NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
    priority      VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    location      VARCHAR(255),
    "imageUrl"    TEXT,
    "adminNote"   TEXT,
    "resolvedAt"  TIMESTAMP WITH TIME ZONE,
    "userId"      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "departmentId" UUID REFERENCES departments(id) ON DELETE SET NULL,
    "createdAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title       VARCHAR(200) NOT NULL,
    message     TEXT NOT NULL,
    type        VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    "isRead"    BOOLEAN NOT NULL DEFAULT FALSE,
    "userId"    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "failedLoginAttempts" INTEGER DEFAULT 0,
    "lockedUntil" TIMESTAMP
);

CREATE INDEX idx_complaints_user      ON complaints("userId");
CREATE INDEX idx_complaints_status    ON complaints(status);
CREATE INDEX idx_complaints_tracking  ON complaints("trackingId");
CREATE INDEX idx_notifications_user   ON notifications("userId");
CREATE INDEX idx_users_email          ON users(email);
