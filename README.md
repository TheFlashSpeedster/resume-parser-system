# Resume Parsing System using Natural Language Processing (NLP)

A full-stack academic project built with:

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- File Upload: Multer
- Text Extraction: `pdf-parse` (PDF), `mammoth` (DOCX), safe fallback rejection for DOC
- Parsing Engine: hybrid regex + keyword dictionary + section detection
- Admin Auth: fixed admin account with session-based login

## Project Overview

This system implements the full SRS-aligned flow:

1.0 Upload Resume  
2.0 Extract Text  
3.0 Parse Resume  
4.0 Store Data  
5.0 Display Results  
6.0 Admin Management

### User Flow

- Upload a resume without login
- Extract and parse key fields (name, email, phone, location, skills, education, experience, projects, certifications)
- View parsed output and confidence scores
- Download parsed JSON
- Get readable parsing errors/status

### Admin Flow

- Login/logout via session-based auth
- View dashboard metrics and logs
- View all resumes with pagination
- Search/filter/sort resumes
- View and edit parsed fields
- Duplicate detection by email/phone
- Export all resumes as CSV
- Export individual resume as JSON
- Delete records

## Folder Structure

```txt
resume-parser-system/
├── client/
│   ├── admin-dashboard.html
│   ├── admin-login.html
│   ├── admin-resume-detail.html
│   ├── admin-resumes.html
│   ├── index.html
│   ├── result.html
│   ├── upload.html
│   ├── assets/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── admin-common.js
│       ├── admin-dashboard.js
│       ├── admin-login.js
│       ├── admin-resume-detail.js
│       ├── admin-resumes.js
│       ├── api.js
│       ├── common.js
│       ├── result.js
│       └── upload.js
├── server/
│   ├── app.js
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── adminAuthController.js
│   │   ├── adminDashboardController.js
│   │   ├── adminResumeController.js
│   │   └── publicResumeController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   └── uploadMiddleware.js
│   ├── models/
│   │   ├── Admin.js
│   │   ├── Log.js
│   │   └── Resume.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   └── publicRoutes.js
│   ├── services/
│   │   ├── duplicateChecker.js
│   │   ├── resumeParser.js
│   │   ├── sectionDetector.js
│   │   └── textExtractor.js
│   ├── utils/
│   │   ├── csvExporter.js
│   │   ├── logger.js
│   │   ├── sanitize.js
│   │   └── seedAdmin.js
│   ├── uploads/
│   └── exports/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Setup Instructions (Step-by-Step)

### 1) Prerequisites

- Node.js (v18+ recommended)
- npm
- MongoDB local server or MongoDB Atlas URI

### 2) Install dependencies

```bash
cd resume-parser-system
npm install
```

### 3) Configure environment

```bash
cp .env.example .env
```

Edit `.env` values if needed:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/resume_parser_system
SESSION_SECRET=replace_with_strong_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
MAX_FILE_SIZE_MB=5
NODE_ENV=development
```

### 4) Start MongoDB

If using local MongoDB:

```bash
mongod
```

or start MongoDB service from your OS/service manager.

### 5) Seed/Create default admin

```bash
npm run seed:admin
```

### 6) Run the app

```bash
npm run dev
```

or

```bash
npm start
```

### 7) Open in browser

- Public: `http://localhost:5000/`
- Upload: `http://localhost:5000/upload`
- Admin login: `http://localhost:5000/admin-login`

## MongoDB Database Creation

Database will be auto-created on first write using the `MONGO_URI` database name (`resume_parser_system` by default).

## API Endpoints

### Public APIs

- `POST /api/resumes/upload`
- `GET /api/resumes/:id`
- `GET /api/resumes/:id/export/json`

### Admin APIs

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/session`
- `GET /api/admin/dashboard`
- `GET /api/admin/resumes`
- `GET /api/admin/resumes/:id`
- `PUT /api/admin/resumes/:id`
- `DELETE /api/admin/resumes/:id`
- `GET /api/admin/resumes/:id/export/json`
- `GET /api/admin/export/csv`
- `GET /api/admin/export/json`
- `GET /api/admin/logs`

## Sample Admin Credentials

Use values from `.env`:

- Username: `admin`
- Password: `admin123`

## Sample Parsed Resume JSON Result

A sample output is provided at:

- `server/exports/sample-parsed-result.json`

## Business Rules Implemented

- Duplicate flag when email or phone matches existing resume
- Manual admin edits override extracted values
- `updatedAt` and `updatedBy` retained on edits
- Export is blocked if name/email/phone are all missing
- Parse failures are logged and user gets readable error messages

## Notes

- DOC files are accepted at upload level but currently rejected during extraction when reliability is low.
- This is intentional fallback behavior aligned with your requirement.

## Future Improvements

1. Add advanced NLP models (spaCy/BERT-based extraction)
2. Better name/education/entity extraction with NER
3. ATS score + resume quality analytics
4. Role-specific skill gap matching
5. Background job queue for large-volume parsing
6. Audit trail UI with diff view for manual edits
7. Role-based auth with multiple admin users
