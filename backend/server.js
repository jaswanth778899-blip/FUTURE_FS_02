const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Lead = require("./models/Lead");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// =========================
// MIDDLEWARE
// =========================

app.use(cors());
app.use(express.json());

// =========================
// HOME ROUTE
// =========================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Future Interns Mini CRM Backend is running!"
    });
});

// =========================
// GET ALL LEADS
// =========================

app.get("/api/leads", async(req, res) => {
    try {
        const leads = await Lead.find().sort({ createdAt: -1 });

        res.json(leads);
    } catch (error) {
        console.error("Error fetching leads:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch leads"
        });
    }
});

// =========================
// GET SINGLE LEAD
// =========================

app.get("/api/leads/:id", async(req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found"
            });
        }

        res.json(lead);
    } catch (error) {
        console.error("Error fetching lead:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch lead"
        });
    }
});

// =========================
// CREATE LEAD
// =========================

app.post("/api/leads", async(req, res) => {
    try {
        const {
            name,
            email,
            source,
            status,
            followUp,
            notes
        } = req.body;

        if (!name || !email || !source) {
            return res.status(400).json({
                success: false,
                message: "Name, email and source are required"
            });
        }

        const lead = new Lead({
            name,
            email,
            source,
            status: status || "new",
            followUp: followUp || "",
            notes: notes || ""
        });

        const savedLead = await lead.save();

        res.status(201).json(savedLead);
    } catch (error) {
        console.error("Error creating lead:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create lead"
        });
    }
});

// =========================
// UPDATE LEAD
// =========================

app.put("/api/leads/:id", async(req, res) => {
    try {
        const allowedFields = [
            "name",
            "email",
            "source",
            "status",
            "followUp",
            "notes"
        ];

        const updateData = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        const updatedLead = await Lead.findByIdAndUpdate(
            req.params.id,
            updateData, {
                new: true,
                runValidators: true
            }
        );

        if (!updatedLead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found"
            });
        }

        res.json(updatedLead);
    } catch (error) {
        console.error("Error updating lead:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update lead"
        });
    }
});

// =========================
// DELETE LEAD
// =========================

app.delete("/api/leads/:id", async(req, res) => {
    try {
        const deletedLead = await Lead.findByIdAndDelete(req.params.id);

        if (!deletedLead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found"
            });
        }

        res.json({
            success: true,
            message: "Lead deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting lead:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete lead"
        });
    }
});

// =========================
// 404 ROUTE
// =========================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// =========================
// MONGODB CONNECTION
// =========================

async function startServer() {
    try {
        if (!MONGODB_URI) {
            console.error("MONGODB_URI is missing in .env");
            process.exit(1);
        }

        await mongoose.connect(MONGODB_URI);

        console.log("MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(
                `CRM server running at http://localhost:${PORT}`
            );
        });

    } catch (error) {
        console.error("MongoDB connection failed:");
        console.error(error.message);

        process.exit(1);
    }
}

startServer();