# BailReckoner

AI-powered bail assessment and case management system for legal proceedings.

## 🎯 Features

- 🔐 **Secure Authentication** for Judges, Lawyers, Prisoners, and Police
- ⚖️ **AI-based Bail Assessment** using machine learning models
- 📊 **Case Management** and tracking system
- 🗺️ **FIR Heatmap Visualization** by area
- 🧠 **AI Investigation Mind Map** generator
- 📄 **PDF and Image Processing** for case files
- 📝 **MCQ-based Bail Questionnaire**

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- React Flow (Mind Map visualization)
- PDF.js (Document viewer)

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication

### ML/AI Services
- Python Flask APIs
- Groq API (GPT-OSS-120B) for mind-map LLM generation
- PDF/Image processing
- Prisoner dataset analysis

## 📋 Prerequisites

- Node.js (v16 or higher)
- Python (3.8 or higher)
- MongoDB Atlas account
- npm or yarn package manager

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Arun-Prasad2004/Bail-Reckoner25.git
cd Bail-Reckoner25
```

### 2. Install Server Dependencies

```bash
cd server
npm install
```

### 3. Install Client Dependencies

```bash
cd ../client
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the `server` directory:

```bash
cd ../server
cp .env.example .env
```

Edit the `.env` file with your credentials:

```env
MONGO_URI=your-mongodb-connection-string
API_KEY=your-api-key
PORT=5000
```

### 5. Install Python Dependencies for ML APIs

```bash
# For model2-api
cd ../ml-api/model2-api
pip install -r requirements.txt

# For model3-api
cd ../model3-api
pip install -r requirements.txt
```

## 🏃‍♂️ Running the Application

### Start the Backend Server

```bash
cd server
node server.js
```

The server will run on `http://localhost:5000`

### Start the Frontend

```bash
cd client
npm run dev
```

The client will run on `http://localhost:5173` (or another port specified by Vite)

### Start ML API Services

**Model 1 API:**
```bash
cd ml-api/model1-api
python server.py
```

**Model 2 API (Prisoner Dataset):**
```bash
cd ml-api/model2-api
python server.py
```

**Model 3 API (Groq GPT-OSS-120B):**
```bash
cd ml-api/model3-api
set GROQ_API_KEY=your-groq-api-key
set GROQ_MODEL=openai/gpt-oss-120b
python server.py
```

## 📁 Project Structure

```
BailReckoner/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── App.jsx        # Main app component
│   │   ├── Login.jsx      # Login page
│   │   ├── JudgeLogin.jsx # Judge authentication
│   │   ├── LawyerLogin.jsx # Lawyer authentication
│   │   ├── PrisonerLogin.jsx # Prisoner authentication
│   │   ├── PoliceLogin.jsx # Police authentication
│   │   ├── MCQ.jsx        # Bail assessment questionnaire
│   │   ├── mindmap.jsx    # AI investigation mind map
│   │   └── ...
│   ├── public/
│   │   ├── pdfjs-5.4.54-dist/ # PDF.js library
│   │   └── mock_jurisdictions.geojson
│   └── package.json
│
├── server/                 # Express backend
│   ├── server.js          # Main server file
│   ├── .env.example       # Environment variables template
│   └── package.json
│
├── ml-api/                 # Python ML services
│   ├── model1-api/        # First ML model
│   ├── model2-api/        # Prisoner dataset analysis
│   │   ├── server.py
│   │   ├── prisonar_dataset.csv
│   │   └── requirements.txt
│   └── model3-api/        # Phi-3 fine-tuned model
│       ├── server.py
│       ├── check.py
│       ├── requirements.txt
│       └── phi 3 mini fine tuned/
│
└── README.md
```

## 🔌 API Endpoints

### Authentication
All endpoints require `x-api-key` header authentication.

### Case Management
- `GET /cases/:caseNumber` - Fetch case details by case number
- `GET /cases/getByNumber/:caseNumber` - Alternative case fetch endpoint
- `PUT /cases/:caseNumber` - Update case information
- `POST /bail-assessment` - Submit bail assessment
- `GET /bail-assessment/check/:caseNumber` - Check if assessment exists

### User Management
- `GET /Prisoner/:id` - Fetch prisoner details
- `GET /lawyers/:id` - Fetch lawyer details
- `GET /judge/:id` - Fetch judge details

### MCQ Assessment
- `POST /mcq/submit` - Submit MCQ responses
- `GET /mcq/:caseId` - Fetch MCQ responses for a case

### Analytics
- `GET /fir/areaCounts` - Get FIR counts by area for heatmap

### System
- `GET /status` - Check MongoDB connection status

## 🔐 Security

- API key authentication on all routes
- MongoDB credentials stored in environment variables
- CORS enabled for frontend communication
- Sensitive data excluded via `.gitignore`

## 🗄️ Database Collections

- `cases` - Case information and details
- `Prisoner` - Prisoner records
- `lawyers` - Lawyer profiles
- `judge` - Judge information
- `FIR` - First Information Reports

## 📦 Dependencies

### Backend (Node.js)
- express
- mongoose
- cors
- dotenv

### Frontend (React)
- react
- react-dom
- react-router-dom
- reactflow
- vite

### ML APIs (Python)
- flask
- transformers
- torch
- pandas
- numpy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

**TechnoCelestials Team**

## 📞 Support

For support, please open an issue in the GitHub repository.

---

Made with ❤️ by TechnoCelestials
