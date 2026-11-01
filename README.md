# 🚀 TeamNova - B2B Team & Project Management SaaS

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green.svg)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8.svg)](https://tailwindcss.com/)

**TeamNova** is an enterprise-grade B2B multi-tenant team and project management SaaS platform built with the MERN stack and TypeScript. It empowers organizations to manage workspaces, projects, task lifecycles, and team members with granular Role-Based Access Control (RBAC).

---

## ✨ Features

- 🏢 **Multi-Tenant Workspaces**: Create, customize, and switch between multiple isolated team workspaces.
- 👥 **Team & Member Management**:
  - Secure link-based and email-based workspace invitations.
  - Granular Role-Based Access Control (RBAC) with predefined permissions (`Owner`, `Admin`, `Member`).
  - Dynamic member role reassignment.
- 📋 **Project & Task Lifecycle**:
  - Organized project spaces within each workspace.
  - Task status tracking (Backlog, Todo, In Progress, In Review, Done).
  - Task priority management, due dates, and assignee delegation.
- 📊 **Workspace & Project Analytics**: Overview dashboards tracking task completion, overdue milestones, and team activity.
- 🔐 **Secure Authentication**: JWT-based authentication using short-lived Access Tokens and rotating Refresh Tokens with HTTP-only cookies and Bearer token support.
- 📧 **Transactional Email Notifications**: Nodemailer SMTP integration for invite delivery and alerts.

---

## 🛠️ Tech Stack

### Frontend (`client/`)
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Radix UI primitives
- **State & Data Fetching**: TanStack React Query & React Context
- **Routing**: React Router v6

### Backend (`backend/`)
- **Runtime**: Node.js & Express
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (Access & Refresh Tokens) with HTTP-only cookies
- **Email Service**: Nodemailer
- **Validation**: Zod schema validation

---

## 📁 Repository Structure

```text
TeamNova/
├── backend/                  # Express + TypeScript REST API
│   ├── src/
│   │   ├── common/           # Enums, middlewares, and utilities
│   │   ├── config/           # Database, mail, and app configs
│   │   ├── modules/          # Auth, User, Workspace, Member, Project, Task modules
│   │   ├── seeders/          # Role and permission seeder scripts
│   │   └── index.ts          # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── client/                   # Vite + React + Tailwind frontend
│   ├── src/
│   │   ├── components/       # UI library & feature components
│   │   ├── context/          # Auth & query providers
│   │   ├── hooks/            # Custom hooks & API hooks
│   │   ├── page/             # Application routes & screens
│   │   └── routes/           # Protected and auth route tree
│   ├── package.json
│   └── vite.config.ts
├── ARCHITECTURE.md           # System architecture & data flow
├── INVITE_FLOW.md            # Detailed invite flow documentation
└── README.md
```

---

## 🚦 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (running locally or a MongoDB Atlas URI)

### 2. Backend Setup
```bash
cd backend
npm install

# Create and configure .env
cp .env.example .env  # or populate with PORT, MONGO_URI, SESSION_SECRET, etc.

# Seed default roles and permissions
npm run seed

# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
cd ../client
npm install

# Start Vite client
npm run dev
```

---

## 📖 Documentation
- [System Architecture](ARCHITECTURE.md)
- [Workspace Invite Flow](INVITE_FLOW.md)

---

## 📄 License
This project is licensed under the [ISC License](LICENSE).
