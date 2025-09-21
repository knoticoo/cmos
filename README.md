# Management Web App

A comprehensive web application for managing players, events, and alliances with MVP rotation system.

## Features

### Phase 1: Authentication & User Management
- Admin authentication system
- User registration (admin only)
- Separate database per user
- Secure JWT-based authentication

### Phase 2: Core Data Management
- **Players Management**
  - Add, edit, delete players
  - Assign MVP to events
  - Track MVP count and last MVP date

- **Events Management**
  - Add, edit, delete events
  - Assign MVP players to events
  - Assign alliances to events

- **Alliances Management**
  - Add, edit, delete alliances
  - Assign alliances to events

### Phase 3: MVP Rotation System
- Automatic MVP rotation tracking
- Reset functionality when all players have been assigned
- Visual indicators for rotation status

### Phase 4: UI/UX
- Mobile-responsive design
- Clean, professional interface
- Intuitive navigation
- Real-time feedback

## Technology Stack

### Backend
- Node.js with Express.js
- SQLite database
- JWT authentication
- bcryptjs for password hashing
- CORS enabled

### Frontend
- React 18
- React Router for navigation
- Axios for API calls
- CSS3 with responsive design
- Context API for state management

## Project Structure

```
management-web-app/
├── server/                 # Backend API
│   ├── config/            # Database configuration
│   ├── middleware/        # Authentication middleware
│   ├── routes/           # API routes
│   ├── data/             # SQLite database files
│   └── index.js          # Server entry point
├── client/               # Frontend React app
│   ├── public/           # Static files
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── auth/     # Authentication components
│   │   │   ├── players/  # Player management
│   │   │   ├── events/   # Event management
│   │   │   ├── alliances/ # Alliance management
│   │   │   └── layout/   # Layout components
│   │   ├── contexts/     # React contexts
│   │   └── App.js        # Main app component
│   └── package.json
├── package.json          # Root package.json
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd management-web-app
   npm run install-all
   ```

2. **Environment Setup:**
   ```bash
   cd server
   cp env.example .env
   # Edit .env file with your settings
   ```

3. **Start Development Servers:**
   ```bash
   # From root directory
   npm run dev
   ```

   This will start both backend (port 5000) and frontend (port 3000) servers.

### Default Admin Credentials
- Username: `admin`
- Password: `admin123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (admin only)
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/users` - Get all users (admin only)

### Players
- `GET /api/players` - Get all players
- `POST /api/players` - Create new player
- `PUT /api/players/:id` - Update player
- `DELETE /api/players/:id` - Delete player
- `POST /api/players/:id/mvp` - Assign MVP to player
- `GET /api/players/mvp/rotation` - Get MVP rotation status
- `POST /api/players/mvp/reset` - Reset MVP rotation

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/:id/alliances` - Assign alliance to event
- `DELETE /api/events/:id/alliances/:allianceId` - Remove alliance from event
- `GET /api/events/:id/alliances` - Get event alliances

### Alliances
- `GET /api/alliances` - Get all alliances
- `POST /api/alliances` - Create new alliance
- `PUT /api/alliances/:id` - Update alliance
- `DELETE /api/alliances/:id` - Delete alliance
- `GET /api/alliances/:id/events` - Get alliance events

## Usage

1. **Login** with admin credentials
2. **Register new users** (admin only)
3. **Add players** to the system
4. **Create events** and assign MVPs/alliances
5. **Create alliances** and assign to events
6. **Monitor MVP rotation** and reset when needed

## Development

### Backend Development
```bash
cd server
npm run dev
```

### Frontend Development
```bash
cd client
npm start
```

### Building for Production
```bash
npm run build
```

## Database Schema

The application uses SQLite with the following main tables:
- `users` - User accounts and admin status
- `user_databases` - Links users to their database
- `players` - Player information and MVP tracking
- `events` - Event information and MVP assignments
- `alliances` - Alliance information
- `event_alliances` - Many-to-many relationship between events and alliances

## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Input validation and sanitization
- CORS protection
- Separate user databases for data isolation

## Mobile Responsiveness

The application is fully responsive and optimized for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## Future Enhancements

- Advanced reporting and analytics
- Data export/import functionality
- Real-time notifications
- Advanced user management
- API rate limiting
- Database backup/restore
