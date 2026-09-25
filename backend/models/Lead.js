const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },

    source: {
        type: String,
        required: true,
        trim: true
    },

    status: {
        type: String,
        enum: ["new", "contacted", "converted"],
        default: "new"
    },

    followUp: {
        type: String,
        default: ""
    },

    notes: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Lead", leadSchema);