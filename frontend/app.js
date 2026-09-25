const API_URL = "http://localhost:5000/api/leads";

const leadModal = document.getElementById("leadModal");
const openLeadModalBtn = document.getElementById("openLeadModal");
const emptyAddLeadBtn = document.getElementById("emptyAddLeadBtn");
const closeLeadModalBtn = document.getElementById("closeLeadModal");
const cancelLeadBtn = document.getElementById("cancelLeadBtn");
const leadForm = document.getElementById("leadForm");

const leadsTableBody = document.getElementById("leadsTableBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

const totalLeads = document.getElementById("totalLeads");
const newLeads = document.getElementById("newLeads");
const contactedLeads = document.getElementById("contactedLeads");
const convertedLeads = document.getElementById("convertedLeads");

const followupsList = document.getElementById("followupsList");

let leads = [];

/* =========================
   MODAL FUNCTIONS
========================= */

function openModal() {
    leadModal.classList.add("show");
}

function closeModal() {
    leadModal.classList.remove("show");
    leadForm.reset();
}

openLeadModalBtn.addEventListener("click", openModal);
emptyAddLeadBtn.addEventListener("click", openModal);

closeLeadModalBtn.addEventListener("click", closeModal);
cancelLeadBtn.addEventListener("click", closeModal);

leadModal.addEventListener("click", function(event) {
    if (event.target === leadModal) {
        closeModal();
    }
});

/* =========================
   LOAD LEADS
========================= */

async function loadLeads() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to fetch leads");
        }

        leads = await response.json();

        renderLeads();
        updateStatistics();
        renderFollowUps();

    } catch (error) {
        console.error("Error loading leads:", error);

        leads = [];

        renderLeads();
        updateStatistics();
        renderFollowUps();
    }
}

/* =========================
   ADD LEAD
========================= */

leadForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const leadData = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        source: document.getElementById("source").value,
        followUp: document.getElementById("followUp").value,
        notes: document.getElementById("notes").value.trim(),
        status: "new"
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(leadData)
        });

        if (!response.ok) {
            throw new Error("Failed to add lead");
        }

        closeModal();

        await loadLeads();

        alert("Lead added successfully!");

    } catch (error) {
        console.error("Error adding lead:", error);
        alert("Unable to add lead. Make sure the backend is running.");
    }
});

/* =========================
   RENDER LEADS
========================= */

function renderLeads() {
    const searchText = searchInput.value.toLowerCase().trim();
    const selectedStatus = statusFilter.value;

    const filteredLeads = leads.filter((lead) => {

        const matchesSearch =
            lead.name.toLowerCase().includes(searchText) ||
            lead.email.toLowerCase().includes(searchText) ||
            lead.source.toLowerCase().includes(searchText);

        const matchesStatus =
            selectedStatus === "all" ||
            lead.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    if (filteredLeads.length === 0) {
        leadsTableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-icon">📋</div>
                        <h3>No leads found</h3>
                        <p>
                            Add a new lead or change your search/filter.
                        </p>
                        <button
                            class="secondary-btn"
                            onclick="openModal()"
                        >
                            + Add Lead
                        </button>
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    leadsTableBody.innerHTML = filteredLeads.map((lead) => {

        const statusClass = `status-${lead.status}`;

        const followUpText =
            lead.followUp ?
            formatDate(lead.followUp) :
            "Not scheduled";

        return `
            <tr>

                <td>
                    <div class="lead-name">${escapeHTML(lead.name)}</div>
                </td>

                <td>
                    <div class="lead-email">${escapeHTML(lead.email)}</div>
                </td>

                <td>
                    <div class="source-text">
                        ${escapeHTML(lead.source)}
                    </div>
                </td>

                <td>
                    <span class="status-badge ${statusClass}">
                        ${escapeHTML(lead.status)}
                    </span>
                </td>

                <td>
                    ${followUpText}
                </td>

                <td>
                    <div class="action-group">

                        <button
                            class="action-btn"
                            onclick="changeStatus(${lead.id})"
                        >
                            Status
                        </button>

                        <button
                            class="action-btn"
                            onclick="viewNotes(${lead.id})"
                        >
                            Notes
                        </button>

                        <button
                            class="action-btn delete"
                            onclick="deleteLead(${lead.id})"
                        >
                            Delete
                        </button>

                    </div>
                </td>

            </tr>
        `;
    }).join("");
}

/* =========================
   SEARCH + FILTER
========================= */

searchInput.addEventListener("input", renderLeads);
statusFilter.addEventListener("change", renderLeads);

/* =========================
   UPDATE STATUS
========================= */

async function changeStatus(id) {

    const lead = leads.find((item) => item.id === id);

    if (!lead) {
        return;
    }

    const statuses = ["new", "contacted", "converted"];

    const currentIndex = statuses.indexOf(lead.status);

    const nextStatus =
        statuses[(currentIndex + 1) % statuses.length];

    try {

        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status: nextStatus
            })
        });

        if (!response.ok) {
            throw new Error("Failed to update status");
        }

        await loadLeads();

    } catch (error) {
        console.error("Error updating status:", error);
        alert("Unable to update lead status.");
    }
}

/* =========================
   VIEW NOTES
========================= */

function viewNotes(id) {

    const lead = leads.find((item) => item.id === id);

    if (!lead) {
        return;
    }

    const notes = lead.notes || "No notes available.";

    alert(
        `Lead: ${lead.name}\n\nNotes:\n${notes}`
    );
}

/* =========================
   DELETE LEAD
========================= */

async function deleteLead(id) {

    const lead = leads.find((item) => item.id === id);

    if (!lead) {
        return;
    }

    const confirmed = confirm(
        `Delete lead "${lead.name}"?`
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Failed to delete lead");
        }

        await loadLeads();

    } catch (error) {
        console.error("Error deleting lead:", error);
        alert("Unable to delete lead.");
    }
}

/* =========================
   STATISTICS
========================= */

function updateStatistics() {

    const total = leads.length;

    const newCount = leads.filter(
        lead => lead.status === "new"
    ).length;

    const contactedCount = leads.filter(
        lead => lead.status === "contacted"
    ).length;

    const convertedCount = leads.filter(
        lead => lead.status === "converted"
    ).length;

    totalLeads.textContent = total;
    newLeads.textContent = newCount;
    contactedLeads.textContent = contactedCount;
    convertedLeads.textContent = convertedCount;
}

/* =========================
   FOLLOW-UPS
========================= */

function renderFollowUps() {

    const followUps = leads
        .filter(lead => lead.followUp)
        .sort((a, b) => {
            return new Date(a.followUp) - new Date(b.followUp);
        });

    if (followUps.length === 0) {

        followupsList.innerHTML = `
            <div class="followup-empty">
                No follow-ups scheduled yet.
            </div>
        `;

        return;
    }

    followupsList.innerHTML = followUps.map((lead) => {

        return `
            <div class="followup-item">

                <div class="followup-info">

                    <strong>
                        ${escapeHTML(lead.name)}
                    </strong>

                    <span>
                        ${escapeHTML(lead.email)}
                    </span>

                </div>

                <div class="followup-date">
                    ${formatDate(lead.followUp)}
                </div>

            </div>
        `;

    }).join("");
}

/* =========================
   DATE FORMAT
========================= */

function formatDate(dateString) {

    if (!dateString) {
        return "Not scheduled";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

/* =========================
   HTML SECURITY
========================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================
   INITIAL LOAD
========================= */

loadLeads();