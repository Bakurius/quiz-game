const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");
const User = require("./models/User");
const Score = require("./models/Score");
const Question = require("./models/Question");
const Topic = require("./models/Topic");
const ExerciseScore = require("./models/ExerciseScore");

dotenv.config();
const app = express();

// Rate limiter for signup endpoint
const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit to 5 requests per IP
  message:
    "Too many signup attempts from this IP, please try again after 15 minutes",
});

// Serve static files from frontend/
app.use(express.static(path.join(__dirname, "../frontend")));

// Redirect root URL to index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// CORS setup for Render
app.use(
  cors({
    credentials: true,
    origin: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// MongoDB connection
if (!process.env.MONGO_URI) {
  console.error("Error: MONGO_URI is not defined in environment variables.");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "my-super-secret-key-123";

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token)
    return res.status(401).json({ message: "Authentication required" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err)
      return res.status(403).json({ message: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

// Seed Questions for Quiz Game (unchanged)
async function seedQuestions() {
  try {
    await Question.deleteMany({});
    console.log("Existing questions cleared");
    const sampleQuestions = [
      {
        category: "Math",
        question: "What is 12 + 15?",
        options: ["25", "27", "28", "30"],
        answer: "27",
      },
      {
        category: "Math",
        question: "What is 9 x 8?",
        options: ["72", "64", "80", "60"],
        answer: "72",
      },
      {
        category: "Math",
        question: "What is the value of pi?",
        options: ["3.141", "3.14", "3.145", "3.142"],
        answer: "3.14",
      },
      {
        category: "Math",
        question: "What is 5²?",
        options: ["25", "30", "35", "20"],
        answer: "25",
      },
      {
        category: "Math",
        question: "What is the perimeter of a square with side length 6?",
        options: ["24", "36", "30", "12"],
        answer: "24",
      },
      {
        category: "Math",
        question: "What is 15 ÷ 3?",
        options: ["5", "6", "7", "4"],
        answer: "5",
      },
      {
        category: "Math",
        question: "What is the square root of 49?",
        options: ["5", "7", "8", "6"],
        answer: "7",
      },
      {
        category: "Math",
        question: "What is 3 raised to the power of 4?",
        options: ["81", "64", "243", "72"],
        answer: "81",
      },
      {
        category: "Math",
        question: "What is 100 ÷ 4?",
        options: ["24", "20", "25", "30"],
        answer: "25",
      },
      {
        category: "Math",
        question: "What is 14 x 15?",
        options: ["210", "220", "240", "225"],
        answer: "210",
      },

      // Science Questions
      {
        category: "Science",
        question: "What is the chemical formula for water?",
        options: ["H2O", "O2", "H2O2", "CO2"],
        answer: "H2O",
      },
      {
        category: "Science",
        question: "Which element has the chemical symbol O?",
        options: ["Oxygen", "Osmium", "Ozone", "Olafium"],
        answer: "Oxygen",
      },
      {
        category: "Science",
        question: "What is the process by which plants make their own food?",
        options: [
          "Respiration",
          "Transpiration",
          "Photosynthesis",
          "Fermentation",
        ],
        answer: "Photosynthesis",
      },
      {
        category: "Science",
        question: "How many planets are there in our solar system?",
        options: ["7", "8", "9", "10"],
        answer: "8",
      },
      {
        category: "Science",
        question: "What is the hardest natural substance on Earth?",
        options: ["Gold", "Iron", "Diamond", "Platinum"],
        answer: "Diamond",
      },
      {
        category: "Science",
        question: "What gas do plants use in photosynthesis?",
        options: ["Oxygen", "Hydrogen", "Carbon Dioxide", "Nitrogen"],
        answer: "Carbon Dioxide",
      },
      {
        category: "Science",
        question: "What is the atomic number of Carbon?",
        options: ["6", "8", "12", "16"],
        answer: "6",
      },
      {
        category: "Science",
        question: "What is the boiling point of water?",
        options: ["50°C", "75°C", "100°C", "120°C"],
        answer: "100°C",
      },
      {
        category: "Science",
        question: "What is the most abundant gas in the Earth's atmosphere?",
        options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
        answer: "Nitrogen",
      },
      {
        category: "Science",
        question: "What is the chemical symbol for Sodium?",
        options: ["Na", "S", "So", "Sn"],
        answer: "Na",
      },

      // History Questions
      {
        category: "History",
        question: "Who was the first man to walk on the moon?",
        options: [
          "Buzz Aldrin",
          "Neil Armstrong",
          "Yuri Gagarin",
          "John Glenn",
        ],
        answer: "Neil Armstrong",
      },
      {
        category: "History",
        question: "Who was the first President of the United States?",
        options: [
          "Abraham Lincoln",
          "George Washington",
          "Thomas Jefferson",
          "Andrew Jackson",
        ],
        answer: "George Washington",
      },
      {
        category: "History",
        question: "What year did World War I begin?",
        options: ["1912", "1914", "1916", "1918"],
        answer: "1914",
      },
      {
        category: "History",
        question: "Who invented the telephone?",
        options: [
          "Nikola Tesla",
          "Alexander Graham Bell",
          "Thomas Edison",
          "Michael Faraday",
        ],
        answer: "Alexander Graham Bell",
      },
      {
        category: "History",
        question: "When did the Titanic sink?",
        options: ["1912", "1905", "1898", "1920"],
        answer: "1912",
      },
      {
        category: "History",
        question: "Who wrote the 'I Have a Dream' speech?",
        options: [
          "Malcolm X",
          "Martin Luther King Jr.",
          "Barack Obama",
          "Nelson Mandela",
        ],
        answer: "Martin Luther King Jr.",
      },
      {
        category: "History",
        question: "When did the French Revolution begin?",
        options: ["1789", "1800", "1776", "1799"],
        answer: "1789",
      },
      {
        category: "History",
        question: "Who was the first emperor of China?",
        options: ["Qin Shi Huang", "Emperor Wu", "Li Shimin", "Zhao Kuangyin"],
        answer: "Qin Shi Huang",
      },
      {
        category: "History",
        question: "Which event triggered World War II?",
        options: [
          "The bombing of Pearl Harbor",
          "The invasion of Poland",
          "The signing of the Treaty of Versailles",
          "The assassination of Archduke Franz Ferdinand",
        ],
        answer: "The invasion of Poland",
      },
      {
        category: "History",
        question: "Who was the Queen of England during the Spanish Armada?",
        options: [
          "Queen Victoria",
          "Queen Elizabeth I",
          "Queen Mary I",
          "Queen Anne",
        ],
        answer: "Queen Elizabeth I",
      },

      // Sports Questions
      {
        category: "Sports",
        question: "Which sport is known as the 'King of Sports'?",
        options: ["Football", "Basketball", "Cricket", "Tennis"],
        answer: "Football",
      },
      {
        category: "Sports",
        question: "Which country won the FIFA World Cup in 2014?",
        options: ["Germany", "Brazil", "Argentina", "Spain"],
        answer: "Germany",
      },
      {
        category: "Sports",
        question: "How long is a standard Olympic swimming pool?",
        options: ["50 meters", "100 meters", "200 meters", "25 meters"],
        answer: "50 meters",
      },
      {
        category: "Sports",
        question: "Which country has won the most Olympic gold medals?",
        options: ["USA", "Russia", "China", "Germany"],
        answer: "USA",
      },
      {
        category: "Sports",
        question:
          "What is the maximum number of players allowed on a basketball team?",
        options: ["10", "12", "15", "20"],
        answer: "15",
      },
      {
        category: "Sports",
        question: "In which year was the first modern Olympic Games held?",
        options: ["1896", "1900", "1924", "1948"],
        answer: "1896",
      },
      {
        category: "Sports",
        question: "Which sport uses a shuttlecock?",
        options: ["Tennis", "Badminton", "Table Tennis", "Squash"],
        answer: "Badminton",
      },
      {
        category: "Sports",
        question: "Which country is known for inventing cricket?",
        options: ["England", "India", "Australia", "South Africa"],
        answer: "England",
      },
      {
        category: "Sports",
        question:
          "Who holds the record for the most goals in a single World Cup?",
        options: ["Pele", "Marta", "Miroslav Klose", "Ronaldo"],
        answer: "Miroslav Klose",
      },
      {
        category: "Sports",
        question: "What is the fastest sport on grass?",
        options: ["Tennis", "Cricket", "Rugby", "Polo"],
        answer: "Polo",
      },

      // Geography Questions
      {
        category: "Geography",
        question: "What is the largest country by area?",
        options: ["Canada", "United States", "Russia", "China"],
        answer: "Russia",
      },
      {
        category: "Geography",
        question: "Which ocean is the smallest?",
        options: [
          "Indian Ocean",
          "Atlantic Ocean",
          "Arctic Ocean",
          "Pacific Ocean",
        ],
        answer: "Arctic Ocean",
      },
      {
        category: "Geography",
        question: "Which country has the most number of islands?",
        options: ["Indonesia", "Sweden", "Australia", "Philippines"],
        answer: "Sweden",
      },
      {
        category: "Geography",
        question: "What is the longest river in the world?",
        options: [
          "Amazon River",
          "Nile River",
          "Yangtze River",
          "Mississippi River",
        ],
        answer: "Nile River",
      },
      {
        category: "Geography",
        question: "What is the capital of France?",
        options: ["Berlin", "London", "Paris", "Rome"],
        answer: "Paris",
      },
      {
        category: "Geography",
        question: "Which continent is known as the 'Dark Continent'?",
        options: ["Africa", "Asia", "Australia", "Antarctica"],
        answer: "Africa",
      },
      {
        category: "Geography",
        question: "Which is the largest desert in the world?",
        options: ["Sahara", "Gobi", "Kalahari", "Antarctic Desert"],
        answer: "Antarctic Desert",
      },
      {
        category: "Geography",
        question: "What is the smallest country in the world?",
        options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
        answer: "Vatican City",
      },
      {
        category: "Geography",
        question: "Which country is known as the Land of the Rising Sun?",
        options: ["South Korea", "China", "Japan", "India"],
        answer: "Japan",
      },
      {
        category: "Geography",
        question: "What is the capital of Canada?",
        options: ["Ottawa", "Toronto", "Vancouver", "Montreal"],
        answer: "Ottawa",
      },

      // Technology Questions
      {
        category: "Technology",
        question: "Who is the CEO of Tesla?",
        options: ["Jeff Bezos", "Bill Gates", "Elon Musk", "Steve Jobs"],
        answer: "Elon Musk",
      },
      {
        category: "Technology",
        question: "What does HTML stand for?",
        options: [
          "HyperText Markup Language",
          "HighText Machine Language",
          "HyperText Managing Language",
          "HighText Markup Language",
        ],
        answer: "HyperText Markup Language",
      },
      {
        category: "Technology",
        question: "What is the most popular search engine?",
        options: ["Yahoo", "Bing", "Google", "DuckDuckGo"],
        answer: "Google",
      },
      {
        category: "Technology",
        question: "Who invented the World Wide Web?",
        options: [
          "Mark Zuckerberg",
          "Bill Gates",
          "Tim Berners-Lee",
          "Larry Page",
        ],
        answer: "Tim Berners-Lee",
      },
      {
        category: "Technology",
        question: "What does 'HTTP' stand for?",
        options: [
          "HyperText Transport Protocol",
          "HyperText Transfer Protocol",
          "HighText Transfer Protocol",
          "Hyper Transfer Text Protocol",
        ],
        answer: "HyperText Transfer Protocol",
      },
      {
        category: "Technology",
        question: "What does 'CSS' stand for?",
        options: [
          "Cascading Style Sheets",
          "Computer Style Sheets",
          "Creative Style Sheets",
          "Coded Style Sheets",
        ],
        answer: "Cascading Style Sheets",
      },
      {
        category: "Technology",
        question:
          "What programming language is primarily used for Android app development?",
        options: ["Swift", "Java", "Python", "Ruby"],
        answer: "Java",
      },
      {
        category: "Technology",
        question: "What does 'GPU' stand for?",
        options: [
          "General Processing Unit",
          "Graphics Processing Unit",
          "Graphical Processing Unit",
          "General Purpose Unit",
        ],
        answer: "Graphics Processing Unit",
      },
      {
        category: "Technology",
        question: "What year was the first iPhone released?",
        options: ["2005", "2007", "2009", "2010"],
        answer: "2007",
      },
      {
        category: "Technology",
        question: "What does 'API' stand for in technology?",
        options: [
          "Application Programming Interface",
          "Active Program Integration",
          "Automated Program Integration",
          "Automatic Processing Interface",
        ],
        answer: "Application Programming Interface",
      },
      {
        category: "Technology",
        question: "Which company developed the first personal computer?",
        options: ["Apple", "IBM", "Microsoft", "Compaq"],
        answer: "IBM",
      },
      {
        category: "Technology",
        question: "What was the first video game console released by Sony?",
        options: [
          "PlayStation",
          "PlayStation 2",
          "PlayStation 3",
          "PlayStation 4",
        ],
        answer: "PlayStation",
      },
      {
        category: "Technology",
        question: "Which of these is a popular cloud storage service?",
        options: ["Dropbox", "Google Docs", "Photoshop", "WordPress"],
        answer: "Dropbox",
      },
      {
        category: "Technology",
        question: "What does 'HTTP' stand for?",
        options: [
          "HyperText Transfer Protocol",
          "HyperText Transport Protocol",
          "HighText Transfer Protocol",
          "Hyper Transfer Protocol",
        ],
        answer: "HyperText Transfer Protocol",
      },
      {
        category: "Technology",
        question:
          "What programming language is known for its use in web development, alongside HTML and CSS?",
        options: ["JavaScript", "Java", "C#", "Swift"],
        answer: "JavaScript",
      },
      {
        category: "Technology",
        question: "Which company created the Android operating system?",
        options: ["Google", "Apple", "Microsoft", "Samsung"],
        answer: "Google",
      },
      {
        category: "Technology",
        question: "What is the main function of an operating system?",
        options: [
          "Manage hardware and software resources",
          "Run applications",
          "Create documents",
          "Browse the internet",
        ],
        answer: "Manage hardware and software resources",
      },
      {
        category: "Technology",
        question: "What does 'RAM' stand for?",
        options: [
          "Random Access Memory",
          "Read Access Memory",
          "Rapid Access Memory",
          "Remote Access Memory",
        ],
        answer: "Random Access Memory",
      },
      {
        category: "Technology",
        question: "What is the name of the first successful web browser?",
        options: [
          "Internet Explorer",
          "Netscape Navigator",
          "Mozilla Firefox",
          "Google Chrome",
        ],
        answer: "Netscape Navigator",
      },
      {
        category: "Technology",
        question:
          "Which company is the creator of the Windows operating system?",
        options: ["Google", "Apple", "Microsoft", "Linux"],
        answer: "Microsoft",
      },
      {
        category: "Technology",
        question: "Which social media platform is known for its 'tweets'?",
        options: ["Facebook", "Instagram", "Twitter", "Snapchat"],
        answer: "Twitter",
      },
      {
        category: "Technology",
        question:
          "Which programming language was developed by Guido van Rossum?",
        options: ["Python", "Java", "C", "Ruby"],
        answer: "Python",
      },
      {
        category: "Technology",
        question: "What is the primary function of a 'router' in networking?",
        options: [
          "Route internet traffic",
          "Provide Wi-Fi",
          "Encrypt data",
          "Store files",
        ],
        answer: "Route internet traffic",
      },
      {
        category: "Technology",
        question:
          "Which of the following is a free open-source software used for version control?",
        options: ["Git", "Adobe Photoshop", "Microsoft Word", "Excel"],
        answer: "Git",
      },
      {
        category: "Technology",
        question: "Which company acquired Instagram in 2012?",
        options: ["Google", "Microsoft", "Apple", "Facebook"],
        answer: "Facebook",
      },
      {
        category: "Technology",
        question: "What does 'URL' stand for?",
        options: [
          "Universal Resource Locator",
          "Uniform Resource Locator",
          "Uniform Retrieval Locator",
          "Universal Retrieval Locator",
        ],
        answer: "Uniform Resource Locator",
      },
      {
        category: "Technology",
        question:
          "Which programming language is known for its use in data science and machine learning?",
        options: ["Java", "Python", "C#", "Swift"],
        answer: "Python",
      },
      {
        category: "Technology",
        question:
          "What is the main programming language used for iOS development?",
        options: ["Java", "Swift", "Python", "Ruby"],
        answer: "Swift",
      },
      {
        category: "Technology",
        question: "What is the main purpose of 'Bluetooth' technology?",
        options: [
          "Wireless communication between devices",
          "Internet access",
          "Data encryption",
          "Charging devices wirelessly",
        ],
        answer: "Wireless communication between devices",
      },
      {
        category: "Technology",
        question:
          "What company developed the first successful personal computer, the IBM PC?",
        options: ["Microsoft", "Apple", "IBM", "Compaq"],
        answer: "IBM",
      },
      {
        category: "Technology",
        question: "What does the 'HTTPS' protocol indicate?",
        options: [
          "The website is hosted on a private server",
          "The website uses a secure connection",
          "The website is hosted in the United States",
          "The website is part of the internet of things",
        ],
        answer: "The website uses a secure connection",
      },
      {
        category: "Technology",
        question:
          "Which of these devices is primarily used for virtual reality experiences?",
        options: ["Smartphone", "Oculus Rift", "Laptop", "Tablet"],
        answer: "Oculus Rift",
      },
      {
        category: "Technology",
        question: "What does 'SEO' stand for?",
        options: [
          "Search Engine Optimization",
          "Software Encryption Operator",
          "Social Engineering Optimization",
          "Search Encoding Operator",
        ],
        answer: "Search Engine Optimization",
      },
      {
        category: "Technology",
        question:
          "Which of the following is a cloud computing service provider?",
        options: [
          "Dropbox",
          "Google Drive",
          "Amazon Web Services (AWS)",
          "All of the above",
        ],
        answer: "All of the above",
      },
      {
        category: "Technology",
        question: "What is the name of Apple's digital voice assistant?",
        options: ["Alexa", "Siri", "Cortana", "Google Assistant"],
        answer: "Siri",
      },
      {
        category: "Technology",
        question:
          "Which programming language is used for web development on both the front-end and back-end?",
        options: ["JavaScript", "Java", "C++", "Swift"],
        answer: "JavaScript",
      },
      {
        category: "Technology",
        question: "What does the 'IoT' acronym stand for?",
        options: [
          "Internet of Technology",
          "Internet of Things",
          "Input or Output Technology",
          "Information of Technology",
        ],
        answer: "Internet of Things",
      },
      {
        category: "Technology",
        question: "What is the first search engine created?",
        options: ["Google", "Yahoo", "AltaVista", "Bing"],
        answer: "AltaVista",
      },
    ];
    await Question.insertMany(sampleQuestions);
    console.log(`Seeded ${sampleQuestions.length} questions successfully`);
  } catch (error) {
    console.error("Error seeding questions:", error);
  }
}

async function seedTopics() {
  try {
    await Topic.deleteMany({});
    console.log("Existing topics cleared");
    const sampleTopics = [
      {
        subject: "მათემატიკა",
        topicName: "საკითხი 1: Solve Quadratic Functions",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Example YouTube video
        exercises: [
          {
            question: "Solve: x² - 5x + 6 = 0",
            options: [
              "x = 2, x = 3",
              "x = 1, x = 6",
              "x = -2, x = -3",
              "x = 0, x = 5",
            ],
            answer: "x = 2, x = 3",
          },
          {
            question: "Solve: x² + 2x - 8 = 0",
            options: [
              "x = 2, x = -4",
              "x = 1, x = -8",
              "x = -2, x = 4",
              "x = 0, x = 8",
            ],
            answer: "x = 2, x = -4",
          },
        ],
      },
      {
        subject: "ქართული",
        topicName: "საკითხი 1: ქართული გრამატიკა: ზმნები",
        videoUrl: "https://www.youtube.com/embed/sample-video", // Replace with real video
        exercises: [
          {
            question: "რა არის ზმნის ფუძე სიტყვაში 'ვწერ'?",
            options: ["წერ", "ვწ", "ერ", "ვწერ"],
            answer: "წერ",
          },
        ],
      },
      {
        subject: "ინგლისური",
        topicName: "საკითხი 1: Basic Grammar",
        videoUrl: "https://www.youtube.com/embed/sample-video", // Replace with real video
        exercises: [
          {
            question: "Choose the correct form: I ___ to school every day.",
            options: ["go", "goes", "going", "went"],
            answer: "go",
          },
        ],
      },
      {
        subject: "ბიოლოგია",
        topicName: "საკითხი 1: Cell Structure",
        videoUrl: "https://www.youtube.com/embed/sample-video", // Replace with real video
        exercises: [
          {
            question: "What is the powerhouse of the cell?",
            options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi Apparatus"],
            answer: "Mitochondria",
          },
        ],
      },
      {
        subject: "ქიმია",
        topicName: "საკითხი 1: Periodic Table",
        videoUrl: "https://www.youtube.com/embed/sample-video", // Replace with real video
        exercises: [
          {
            question: "What is the symbol for Gold?",
            options: ["Au", "Ag", "Fe", "Cu"],
            answer: "Au",
          },
        ],
      },
      {
        subject: "ისტორია",
        topicName: "საკითხი 1: World War I",
        videoUrl: "https://www.youtube.com/embed/sample-video", // Replace with real video
        exercises: [
          {
            question: "What year did World War I begin?",
            options: ["1914", "1918", "1939", "1945"],
            answer: "1914",
          },
        ],
      },
      {
        subject: "ფიზიკა",
        topicName: "საკითხი 1: Newton’s Laws",
        videoUrl: "https://www.youtube.com/embed/sample-video", // Replace with real video
        exercises: [
          {
            question: "What is Newton’s First Law also known as?",
            options: [
              "Law of Gravity",
              "Law of Inertia",
              "Law of Motion",
              "Law of Force",
            ],
            answer: "Law of Inertia",
          },
        ],
      },
    ];
    await Topic.insertMany(sampleTopics);
    console.log(`Seeded ${sampleTopics.length} topics successfully`);
  } catch (error) {
    console.error("Error seeding topics:", error);
  }
}

// Signup
app.post("/api/signup", signupLimiter, async (req, res) => {
  const { username, email, password, isAdmin } = req.body || {};
  try {
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Username, email, and password are required" });
    }

    const usernameRegex = /^[a-zA-Z0-9]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        message: "Username must be 3-20 characters, alphanumeric only",
      });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,50}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be 8-50 characters with 1 upper, 1 lower, 1 number, 1 special (!@#$%)",
      });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.username === username
            ? "Username already exists"
            : "Email already in use",
      });
    }

    const user = new User({
      username,
      email,
      password,
      isAdmin: isAdmin || false,
    });
    await user.save();
    res.status(201).json({ message: "Signup successful" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Error signing up", error });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};
  try {
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id, username: user.username, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600000,
    });

    res.json({
      message: "Login successful",
      userId: user._id,
      username: user.username,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in", error });
  }
});

// Logout
app.post("/api/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

// Save Quiz Game Score
app.post("/api/score", authenticateToken, async (req, res) => {
  const { score, date } = req.body;
  const userId = req.user.userId;
  try {
    const newScore = new Score({ userId, score, date });
    await newScore.save();
    const userScores = await Score.find({ userId });
    const userExerciseScores = await ExerciseScore.find({ userId });
    const totalScore =
      userScores.reduce((sum, entry) => sum + entry.score, 0) +
      userExerciseScores.reduce((sum, entry) => sum + entry.score, 0);
    await User.updateOne({ _id: userId }, { $set: { totalScore } });
    res.status(201).json({ message: "Score saved", totalScore });
  } catch (error) {
    res.status(500).json({ message: "Error saving score", error });
  }
});

// Save Exercise Score
app.post("/api/exercise-score", authenticateToken, async (req, res) => {
  const { topicId, score, date } = req.body;
  const userId = req.user.userId;
  try {
    const newExerciseScore = new ExerciseScore({
      userId,
      topicId,
      score,
      date,
    });
    await newExerciseScore.save();
    const userScores = await Score.find({ userId });
    const userExerciseScores = await ExerciseScore.find({ userId });
    const totalScore =
      userScores.reduce((sum, entry) => sum + entry.score, 0) +
      userExerciseScores.reduce((sum, entry) => sum + entry.score, 0);
    await User.updateOne({ _id: userId }, { $set: { totalScore } });
    res.status(201).json({ message: "Exercise score saved", totalScore });
  } catch (error) {
    res.status(500).json({ message: "Error saving exercise score", error });
  }
});

// Get Scores for a User (Quiz Game)
app.get("/api/scores/:userId", authenticateToken, async (req, res) => {
  const { userId } = req.params;
  if (req.user.userId !== userId && !req.user.isAdmin) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  try {
    const scores = await Score.find({ userId });
    const totalScore = scores.reduce((sum, entry) => sum + entry.score, 0);
    res.json({ scores, totalScore });
  } catch (error) {
    res.status(500).json({ message: "Error fetching scores", error });
  }
});

// Get Exercise Scores for a User
app.get("/api/exercise-scores/:userId", authenticateToken, async (req, res) => {
  const { userId } = req.params;
  if (req.user.userId !== userId && !req.user.isAdmin) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  try {
    const exerciseScores = await ExerciseScore.find({ userId });
    const totalScore = exerciseScores.reduce(
      (sum, entry) => sum + entry.score,
      0
    );
    res.json({ exerciseScores, totalScore });
  } catch (error) {
    res.status(500).json({ message: "Error fetching exercise scores", error });
  }
});

// Get Rankings (Separate Quiz and Exercise Scores)
app.get("/api/rankings", async (req, res) => {
  try {
    const users = await User.find().select("username totalScore");
    const rankings = await Promise.all(
      users.map(async (user) => {
        const quizScores = await Score.find({ userId: user._id });
        const exerciseScores = await ExerciseScore.find({ userId: user._id });
        const quizTotal = quizScores.reduce(
          (sum, entry) => sum + entry.score,
          0
        );
        const exerciseTotal = exerciseScores.reduce(
          (sum, entry) => sum + entry.score,
          0
        );
        return {
          username: user.username,
          quizScore: quizTotal || 0,
          exerciseScore: exerciseTotal || 0,
          totalScore: user.totalScore || 0,
        };
      })
    );
    res.json(rankings.sort((a, b) => b.totalScore - a.totalScore));
  } catch (error) {
    res.status(500).json({ message: "Error fetching rankings", error });
  }
});

// Get Questions by Category (Quiz Game)
app.get("/api/questions/:category", async (req, res) => {
  try {
    const questions = await Question.find({ category: req.params.category });
    if (questions.length < 10) {
      return res
        .status(400)
        .json({ message: "Not enough questions in this category" });
    }
    const shuffled = questions.sort(() => 0.5 - Math.random()).slice(0, 10);
    res.json(shuffled);
  } catch (error) {
    res.status(500).json({ message: "Error fetching questions", error });
  }
});

// Add New Questions (Quiz Game)
app.post("/api/questions/add", authenticateToken, async (req, res) => {
  const { category, question, options, answer } = req.body;
  try {
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }

    if (
      !category ||
      !question ||
      !options ||
      !answer ||
      !Array.isArray(options) ||
      options.length !== 4 ||
      !options.includes(answer)
    ) {
      return res.status(400).json({
        message:
          "Invalid question data. Must include category, question, 4 options, and a valid answer.",
      });
    }

    const existingQuestion = await Question.findOne({ question });
    if (existingQuestion) {
      return res.status(400).json({ message: "Question already exists" });
    }

    const newQuestion = new Question({ category, question, options, answer });
    await newQuestion.save();
    res
      .status(201)
      .json({ message: "Question added successfully", question: newQuestion });
  } catch (error) {
    res.status(500).json({ message: "Error adding question", error });
  }
});

// Get Subjects (Learn Section)
app.get("/api/subjects", async (req, res) => {
  try {
    const subjects = await Topic.distinct("subject");
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: "Error fetching subjects", error });
  }
});

// Get Topics by Subject (Learn Section)
app.get("/api/topics/:subject", async (req, res) => {
  try {
    const topics = await Topic.find({ subject: req.params.subject }).select(
      "topicName"
    );
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: "Error fetching topics", error });
  }
});

// Get Topic Details (Learn Section)
app.get("/api/topic/:topicId", async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.topicId);
    if (!topic) return res.status(404).json({ message: "Topic not found" });
    res.json(topic);
  } catch (error) {
    res.status(500).json({ message: "Error fetching topic", error });
  }
});

// Check Auth Status
app.get("/api/check-auth", authenticateToken, (req, res) => {
  res.json({
    userId: req.user.userId,
    username: req.user.username,
    isAdmin: req.user.isAdmin,
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // seedQuestions(); // Uncomment to seed Quiz Game questions
  seedTopics(); // Uncomment to seed Learn topics
});
