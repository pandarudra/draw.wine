# Draw.Wine

A modern, web-based drawing application built with React, TypeScript, and Vite. Draw.Wine provides an intuitive interface for creating digital artwork with a rich set of tools and features.

## Features

- Interactive canvas board for drawing
- Custom toolbar with drawing tools
- Responsive design with mobile support
- Modern UI components using Radix UI
- Real-time drawing capabilities
- Save and restore drawing progress
- Keyboard shortcuts for quick tool selection
- Multiple shape tools (Rectangle, Circle, Diamond, Line, Arrow)
- Freehand drawing with Pencil tool
- Text tool with custom font support
- Image upload and manipulation
- Selection tool for moving and resizing elements
- Eraser tool for precise corrections
- Delete functionality for selected elements
- Zoom and pan capabilities

### Keyboard Shortcuts

- `s` - Select tool
- `p` - Pencil tool
- `t` - Text tool
- `r` - Rectangle tool
- `c` - Circle tool
- `l` - Line tool
- `a` - Arrow tool
- `d` - Diamond tool
- `e` - Eraser tool
- `Delete/Backspace` - Delete selected element

## Tech Stack

- **Frontend Framework:** React with TypeScript
- **Build Tool:** Vite
- **UI Components:**
  - Radix UI
  - Class Variance Authority (for styling)
  - Lucide Icons
- **State Management:** React Context
- **Styling:** Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/pandarudra/draw.wine.git
cd draw.wine/fe
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

To create a production build:

```bash
npm run build
```

## Project Structure

```
fe/
├── src/
│   ├── components/
│   │   ├── custom/       # Custom components for drawing
│   │   └── ui/          # Reusable UI components
│   ├── contexts/        # React contexts
│   ├── hooks/          # Custom React hooks
│   ├── lib/           # Utility functions
│   ├── pages/         # Main application pages
│   └── types/         # TypeScript type definitions
└── public/           # Static assets
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)

## Author

[pandarudra](https://github.com/pandarudra)
