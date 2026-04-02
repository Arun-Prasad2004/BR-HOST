const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require('dotenv').config();
// const { ObjectId } = require('mongodb'); // No longer needed, so it can be removed

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection URI
const MONGO_URI = process.env.MONGO_URI || "your-mongodb-uri-here";

// Secure API Key
const API_KEY = process.env.API_KEY || "your-api-key-here";

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
})
  .then(() => console.log("✅ MongoDB Connected to BailReckoner"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Middleware for API Key Authentication
const authenticate = (req, res, next) => {
  if (!req.headers["x-api-key"] || req.headers["x-api-key"] !== API_KEY) {
    return res.status(403).json({ message: "Unauthorized access" });
  }
  next();
};


// Case Schema and Model
const caseSchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ["Open", "Closed"], default: "Open" },
  assignedLawyer: { type: mongoose.Schema.Types.ObjectId, ref: "Lawyer" },
}, { timestamps: true });

const Case = mongoose.model("Case", caseSchema);




// Fetch Prisoner by ID
app.get("/Prisoner/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const db = mongoose.connection.db;
    const prisoner = await db.collection("Prisoner").findOne({ prisoner_id: id });

    if (!prisoner) {
      return res.status(404).json({ message: "Prisoner not found" });
    }

    res.json(prisoner);
  } catch (error) {
    console.error("❌ Error fetching prisoner:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// =======================================================================
// ==================== [LAWYER ROUTE FIXED HERE] ========================
// =======================================================================

// Fetch Lawyer by ID
app.get("/lawyers/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const db = mongoose.connection.db;
    // ✅ CORRECTED: Reverted to your original code that treats _id as a string
    const lawyer = await db.collection("lawyers").findOne({ _id: id });

    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }

    res.json(lawyer);
  } catch (error) {
    console.error("❌ Error fetching lawyer:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// =======================================================================
// =======================================================================
// =======================================================================


// Fetch Judge by ID
app.get("/judge/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const db = mongoose.connection.db;
    const judge = await db.collection("judge").findOne({ judge_id: id });

    if (!judge) {
      return res.status(404).json({ message: "Judge not found" });
    }

    res.json(judge);
  } catch (error) {
    console.error("❌ Error fetching judge:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

app.get('/cases/getByNumber/:caseNumber', async (req, res) => {
  const { caseNumber } = req.params;
  try {
    const db = mongoose.connection.db;
    const caseData = await db.collection("cases").findOne({ case_number: caseNumber });
    if (caseData) {
      res.json(caseData);
    } else {
      res.status(404).send('Case not found');
    }
  } catch (error) {
    console.error("❌ Error fetching case by number:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Backend - Fetch Case by Case Number
app.get("/cases/:caseNumber", authenticate, async (req, res) => {
  const { caseNumber } = req.params;
  try {
    const db = mongoose.connection.db;
    const caseDetails = await db.collection("cases").findOne({ case_number: caseNumber });

    if (!caseDetails) {
      return res.status(404).json({ message: "Case not found" });
    }

    res.json(caseDetails);
  } catch (error) {
    console.error("❌ Error fetching case:", error);
    res.status(500).json({ message: "Server error", error });
  }
});


// ✅ UPDATE a case by its case_number
app.put("/cases/:caseNumber", authenticate, async (req, res) => {
  const { caseNumber } = req.params;
  const updateData = req.body;

  try {
    const db = mongoose.connection.db;
    const casesCollection = db.collection("cases");

    delete updateData._id;
    delete updateData.case_number;

    const result = await casesCollection.updateOne(
      { case_number: caseNumber },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Case not found" });
    }

    const updatedDocument = await casesCollection.findOne({ case_number: caseNumber });
    res.status(200).json(updatedDocument);

  } catch (error) {
    console.error("❌ Error updating case:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// 📌 [NEW] MCQ Submission API (Added Without Changing Old Code)
app.post("/mcq/submit", authenticate, async (req, res) => {
  try {
    const { caseId, mcqResponses } = req.body;

    if (!caseId || !mcqResponses) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const db = mongoose.connection.db;
    const casesCollection = db.collection("cases");

    const result = await casesCollection.updateOne(
      { case_number: caseId },
      { $set: { bail_assessment: mcqResponses } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Case not found" });
    }

    res.status(200).json({ message: "MCQ responses saved successfully" });
  } catch (error) {
    console.error("❌ Error saving MCQ responses:", error);
    res.status(500).json({ message: "Server error", error });
  }
});
// 📌 [NEW] Fetch MCQ Responses for a Case
app.get("/mcq/:caseId", authenticate, async (req, res) => {
  try {
    const { caseId } = req.params;
    const db = mongoose.connection.db;
    const casesCollection = db.collection("cases");

    const caseData = await casesCollection.findOne(
      { case_number: caseId },
      { projection: { bail_assessment: 1, _id: 0 } }
    );

    if (!caseData || !caseData.bail_assessment) {
      return res.status(404).json({ message: "MCQ responses not found for this case" });
    }

    res.json(caseData.bail_assessment);
  } catch (error) {
    console.error("❌ Error fetching MCQ responses:", error);
    res.status(500).json({ message: "Server error", error });
  }
});
// Add Bail Assessment Submission (no changes to existing code above)
// ✅ Add Bail Assessment (as Array)
app.post("/bail-assessment", authenticate, async (req, res) => {
  try {
    const { caseNumber, assessment } = req.body;

    if (!Array.isArray(assessment) || assessment.length !== 9) {
      return res.status(400).json({ message: "Invalid assessment format" });
    }

    const db = mongoose.connection.db;
    await db.collection("cases").updateOne(
      { case_number: caseNumber },
      { $set: { bail_assessment: assessment } },
      { upsert: true }
    );

    res.status(200).json({ message: "Bail assessment saved successfully" });
  } catch (err) {
    console.error("❌ Error saving assessment:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
});


// ✅ Check if Bail Assessment Exists for a Case
app.get("/bail-assessment/check/:caseNumber", authenticate, async (req, res) => {
  const { caseNumber } = req.params;

  try {
    const db = mongoose.connection.db;
    const casesCollection = db.collection("cases");

    const caseData = await casesCollection.findOne(
      { case_number: caseNumber, bail_assessment: { $exists: true, $ne: null } },
      { projection: { _id: 1 } }
    );

    res.json({ exists: !!caseData });
  } catch (err) {
    console.error("❌ Error checking bail assessment:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// 🔥 FIR Heatmap Endpoint by Area
app.get("/fir/areaCounts", authenticate, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const pipeline = [
      { $group: { _id: "$area", count: { $sum: 1 } } },
      { $project: { area: "$_id", count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ];

    const areaCounts = await db.collection("FIR").aggregate(pipeline).toArray();
    res.json({ areaCounts });
  } catch (err) {
    console.error("❌ Error fetching area FIR counts:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Check MongoDB Connection Status
app.get("/status", (req, res) => {
  const status = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
  res.json({ message: `MongoDB Status: ${status}` });
});

// Start the Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});