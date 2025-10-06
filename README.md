# 🎨 Draw.Wine - Collaborative Real-time Drawing Platform

A modern, real-time collaborative drawing application built with React, TypeScript, Node.js, and Socket.IO. Draw.Wine allows multiple users to collaborate on digital canvases in real-time with a rich set of drawing tools and features.

## ✨ Features

### 🎯 Drawing Tools

- **Selection Tool**: Select, move, and resize elements
- **Basic Shapes**: Rectangle, Diamond, Circle, Arrow, Line
- **Free Drawing**: Pencil tool for hand-drawn sketches
- **Text Tool**: Add text elements with customizable fonts
- **Image Tool**: Insert and manipulate images
- **Eraser**: Remove elements with precision
- **Laser Pointer**: Temporary laser trail for presentations

### 🤝 Collaboration Features

- **Real-time Synchronization**: All drawing operations sync instantly across users
- **Live Cursors**: See other users' cursors moving in real-time
- **User Awareness**: View active collaborators with colored indicators
- **Room-based Sessions**: Join specific rooms for focused collaboration
- **User Identification**: Custom names and colors for each collaborator

### 🎨 Advanced Drawing Features

- **Rough.js Integration**: Hand-drawn, sketchy appearance for shapes
- **Customizable Styling**: Stroke colors, widths, and roughness levels
- **Element Management**: Layer-based element handling
- **Viewport Controls**: Pan and zoom functionality
- **Auto-save**: Automatic local storage of drawing progress
- **Export Capabilities**: Save drawings locally

### 🔧 Technical Features

- **WebSocket Communication**: Real-time bidirectional communication
- **Responsive Design**: Works on desktop and mobile devices
- **Performance Optimized**: Efficient rendering and state management
- **Type Safety**: Full TypeScript implementation
- **Modern UI**: Radix UI components with Tailwind CSS styling

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/pandarudra/draw.wine.git
   cd draw.wine
   ```

2. **Install backend dependencies**

   ```bash
   cd be
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd ../fe
   npm install
   ```

4. **Set up environment variables**

   Create a `.env` file in the `be` directory:

   ```env
   PORT=3001
   NODE_ENV=development
   FE_URL_PROD=https://your-frontend-domain.com
   ```

5. **Start the development servers**

   Backend (from `be` directory):

   ```bash
   npm run dev
   ```

   Frontend (from `fe` directory):

   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## 🏗️ Architecture

### Backend (`/be`)

```
be/
├── src/
│   ├── index.ts              # Express server setup
│   ├── controllers/          # Route controllers
│   ├── events/
│   │   └── socket.event.ts   # Socket.IO event handlers
│   ├── services/
│   │   └── socket.service.ts # WebSocket service
│   ├── routes/
│   │   └── rooms.routes.ts   # API routes
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   ├── utils/                # Utility functions
│   └── env/
│       └── e.ts              # Environment configuration
└── package.json
```

**Key Technologies:**

- **Express.js**: Web application framework
- **Socket.IO**: Real-time WebSocket communication
- **TypeScript**: Type-safe JavaScript development
- **Helmet**: Security middleware
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API protection

### Frontend (`/fe`)

```
fe/
├── src/
│   ├── components/
│   │   ├── custom/           # Application-specific components
│   │   │   ├── CanvasBoard.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   ├── CollabRoom.tsx
│   │   │   └── modals/
│   │   └── ui/               # Reusable UI components
│   ├── contexts/
│   │   ├── DrawingContext.tsx    # Drawing state management
│   │   └── CollabContext.tsx     # Collaboration state
│   ├── pages/
│   │   ├── Landing.tsx       # Entry point
│   │   ├── PlayGround.tsx    # Main drawing interface
│   │   └── CollabRoom.tsx    # Collaboration room
│   ├── utils/                # Utility functions
│   ├── constants/            # Application constants
│   └── types/                # TypeScript definitions
└── package.json
```

**Key Technologies:**

- **React 19**: UI library with latest features
- **TypeScript**: Type safety and better development experience
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Socket.IO Client**: Real-time communication
- **Rough.js**: Hand-drawn style graphics
- **React Router**: Client-side routing

## 🔌 API Documentation

### WebSocket Events

#### Client → Server Events

| Event               | Payload                                                                  | Description               |
| ------------------- | ------------------------------------------------------------------------ | ------------------------- |
| `join_room`         | `{ roomId: string, user: UserInfo }`                                     | Join a collaboration room |
| `drawing_operation` | `{ roomId: string, operation: DrawingOperation }`                        | Send drawing changes      |
| `cursor_update`     | `{ roomId: string, position: Position }`                                 | Update cursor position    |
| `laser_point`       | `{ roomId: string, point: Position, userId: string, timestamp: number }` | Laser pointer trail       |
| `laser_clear`       | `{ roomId: string, userId: string }`                                     | Clear laser trail         |
| `leave_room`        | `{ roomId: string }`                                                     | Leave collaboration room  |

#### Server → Client Events

| Event                   | Payload                                                          | Description                  |
| ----------------------- | ---------------------------------------------------------------- | ---------------------------- |
| `room_joined`           | `{ roomId: string, elements: Element[], collaborators: User[] }` | Confirmation of room join    |
| `operation_applied`     | `DrawingOperation`                                               | Broadcast drawing changes    |
| `collaborators_updated` | `User[]`                                                         | Updated list of active users |
| `cursor_moved`          | `{ userId: string, position: Position }`                         | Other user's cursor movement |
| `laser_point`           | `{ userId: string, point: Position, timestamp: number }`         | Other user's laser point     |
| `laser_clear`           | `{ userId: string }`                                             | Clear other user's laser     |

### REST API Endpoints

| Method | Endpoint       | Description                              |
| ------ | -------------- | ---------------------------------------- |
| `GET`  | `/health`      | Server health check and connection stats |
| `GET`  | `/api/rooms/*` | Room management endpoints (extensible)   |

## 🎮 Usage Guide

### Starting a Drawing Session

1. **Solo Drawing**: Navigate to `/board/[id]` for individual drawing
2. **Collaborative Drawing**: Go to `/collab?room=[roomId]&name=[username]`

### Using Drawing Tools

1. **Select Tool**: Click to select and manipulate existing elements
2. **Shape Tools**: Click and drag to create rectangles, circles, diamonds
3. **Line/Arrow**: Click start point, then end point
4. **Pencil**: Click and drag for freehand drawing
5. **Text**: Click to place text, then type
6. **Image**: Click to upload and place images
7. **Eraser**: Click elements to delete them
8. **Laser**: Temporary pointer for presentations

### Collaboration Features

- **Join Room**: Enter room ID and username to collaborate
- **See Collaborators**: View active users in the top-right panel
- **Live Cursors**: See where others are working
- **Real-time Sync**: All changes appear instantly for everyone

## 🛠️ Development

### Available Scripts

**Backend:**

```bash
npm run dev     # Start development server with hot reload
npm run build   # Build TypeScript to JavaScript
npm run start   # Start production server
```

**Frontend:**

```bash
npm run dev     # Start Vite development server
npm run build   # Build for production
npm run preview # Preview production build
npm run lint    # Run ESLint
```

### Project Structure Details

#### Data Models

```typescript
// User representation
interface User {
  id: string;
  name: string;
  color: string;
  cursor?: Position;
  socketId: string;
  isDrawing?: boolean;
  currentElementId?: string;
  joinedAt: number;
}

// Drawing element
interface Element {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  strokeColor: string;
  strokeWidth: number;
  roughness?: number;
  points?: Position[];
  text?: string;
  // ... other properties
}

// Room state
interface Room {
  id: string;
  users: Map<string, User>;
  elements: Element[];
  lastActivity: number;
  createdAt: number;
}
```

#### Key Components

- **CanvasBoard**: Main drawing canvas with all rendering logic
- **Toolbar**: Tool selection and drawing options
- **CollabRoom**: Collaboration room management
- **DrawingContext**: State management for drawing operations
- **CollabContext**: Real-time collaboration state

### Adding New Features

1. **New Drawing Tool**:

   - Add tool to `TOOLBAR_ITEMS` in `constants/toolbar.ts`
   - Implement tool logic in `CanvasBoard.tsx`
   - Add corresponding event handlers

2. **New Socket Event**:
   - Define event in backend `socket.event.ts`
   - Add client-side handler in `CollabContext.tsx`
   - Update TypeScript interfaces

## 🔧 Configuration

### Environment Variables

**Backend (`.env`):**

```env
PORT=3001                                    # Server port
NODE_ENV=development                         # Environment mode
FE_URL_PROD=https://your-domain.com         # Production frontend URL
```

### Build Configuration

- **Vite Config**: Frontend build settings in `vite.config.ts`
- **TypeScript**: Configurations in `tsconfig.json` files
- **Tailwind**: Styling configuration in `tailwind.config.js`

## 🚀 Deployment

### Backend Deployment

1. Build the application:

   ```bash
   npm run build
   ```

2. Set production environment variables

3. Start the server:
   ```bash
   npm start
   ```

### Frontend Deployment

1. Build for production:

   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to your hosting service

### Docker Deployment (Optional)

Create `Dockerfile` for containerized deployment:

```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Maintain consistent code formatting
- Write meaningful commit messages
- Test new features thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- **Rough.js** for hand-drawn style graphics
- **Socket.IO** for real-time communication
- **Radix UI** for accessible components
- **Tailwind CSS** for styling utilities
- **React** and **TypeScript** for the development foundation

## 📞 Support

For support, questions, or feature requests, please open an issue on GitHub.

---

Built with ❤️ by the Draw.Wine team
