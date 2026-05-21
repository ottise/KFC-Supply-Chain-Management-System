# Release Notes: v0.9.3
**Released**: March 26, 2026

## 🎉 Infrastructure & Stability Milestone

This release focuses on hardening the system's infrastructure, ensuring production-ready Docker deployment, and enhancing high-level user/stock management.

### 🚀 Key Highlights

- **Manager-Scoped Control**: New filtering for **Stock Documents** and **Stock Transactions** based on manager permissions.
- **Enhanced User Management**: New endpoints for Manager Listing, Staff Assignment, and Bulk Unassign in `UserController`.
- **System Stability**: Implemented service-wide **Healthchecks** and **Resource Limits** (CPU/Memory).
- **Production-Ready Docker**: Optimized images with multi-platform support (`linux/amd64`) and refined `.dockerignore`.
- **Database Standardization**: Idempotent SQL initialization with automatic schema reset and sample data seeding.
- **Identity & Auth Fixes**: Resolved persistent 500 errors by synchronizing the database schema with Authentication service entities.

## ✨ Improvements

- **Deployment Guide**: New comprehensive `DEPLOYMENT_GUIDE.md` for Docker Hub and VPS staging.
- **Changelog**: Exhaustive transition to "Keep a Changelog" format covering 300+ commits.

## 📝 Full Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed list of changes.

