// Updated JavaScript Code for ATM Mutation Research Dashboard
document.addEventListener("DOMContentLoaded", () => {
    let inclusionKeywords = [];
    let exclusionKeywords = [];
    let originalData = [];
    let keywordWeights = {}; // Store weights for keywords
    let auditLog = [];

    // Load JSON Data
    fetch("ATM annotations.json")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch JSON data");
            }
            return response.json();
        })
        .then((data) => {
            originalData = formatData(data);
            extractKeywordWeights(data);
            populateTable(originalData);
            createChart(originalData);
        })
        .catch((error) => console.error("Error loading JSON:", error));

    function extractKeywordWeights(data) {
        Object.values(data).forEach((paper) => {
            if (paper.Keywords) {
                Object.entries(paper.Keywords).forEach(([keyword, weight]) => {
                    keywordWeights[keyword.toLowerCase()] = weight;
                });
            }
        });
    }

    // Set Criteria
    document.getElementById("setCriteriaBtn").addEventListener("click", () => {
        const inclusionInput = document.getElementById("inclusion").value.trim();
        const exclusionInput = document.getElementById("exclusion").value.trim();

        if (!inclusionInput && !exclusionInput) {
            alert("Please enter at least one inclusion or exclusion keyword.");
            return;
        }

        inclusionKeywords = inclusionInput.split(",").map((k) => k.trim().toLowerCase());
        exclusionKeywords = exclusionInput.split(",").map((k) => k.trim().toLowerCase());

        document.getElementById("recheckCriteriaBtn").disabled = false;
        alert("Criteria set successfully!");
    });

    // Recheck Criteria
    document.getElementById("recheckCriteriaBtn").addEventListener("click", () => {
        recheckCriteria();
    });

    // PDF Upload and Processing
    document.getElementById("processPdfsBtn").addEventListener("click", () => {
        const files = document.getElementById("pdfUploader").files;
        if (files.length === 0) {
            alert("Please upload at least one PDF file.");
            return;
        }

        const statusDiv = document.getElementById("upload-status");
        statusDiv.innerHTML = ""; // Clear previous results
        auditLog = []; // Reset audit log

        Array.from(files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const text = e.target.result.toLowerCase();

                // Keyword Matching
                let score = 0;
                inclusionKeywords.forEach((keyword) => {
                    if (text.includes(keyword)) {
                        score += keywordWeights[keyword] || 1; // Add weight if available
                    }
                });

                const excludes = exclusionKeywords.some((keyword) => text.includes(keyword));

                // Check against JSON Data
                const jsonMatches = checkAgainstJson(text);

                const result = document.createElement("div");
                let auditMessage;

                if (!excludes && (score > 0 || jsonMatches)) {
                    result.textContent = `File: ${file.name} - Relevant (Score: ${score}, JSON Match: ${jsonMatches})`;
                    result.style.color = "green";
                    auditMessage = `${file.name}: Relevant (Score: ${score}, JSON Match: ${jsonMatches})`;
                } else {
                    result.textContent = `File: ${file.name} - Not Relevant.`;
                    result.style.color = "red";
                    auditMessage = `${file.name}: Not Relevant.`;
                }

                auditLog.push(auditMessage);
                statusDiv.appendChild(result);
            };

            reader.onerror = function () {
                const errorResult = document.createElement("div");
                errorResult.textContent = `Error reading file: ${file.name}`;
                errorResult.style.color = "red";
                statusDiv.appendChild(errorResult);
            };

            reader.readAsText(file);
        });

        document.getElementById("viewAuditLogBtn").disabled = false;
    });

    // View Audit Log
    document.getElementById("viewAuditLogBtn").addEventListener("click", () => {
        const auditLogSection = document.getElementById("auditLogSection");
        const auditLogDiv = document.getElementById("auditLog");

        auditLogSection.style.display = "block";
        auditLogDiv.innerHTML = "<ul>" + auditLog.map((log) => `<li>${log}</li>`).join("") + "</ul>";
    });

    // OpenAI Request when "Ask AI" form is submitted
    document.getElementById("askAiForm").addEventListener("submit", (event) => {
        event.preventDefault(); // Prevent form from refreshing the page

        const userQuery = document.getElementById("askAi").value.trim();
        if (!userQuery) {
            alert("Please enter a query.");
            return;
        }

        // Call OpenAI API with the user query
        fetch("https://im-trying.onrender.com", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: userQuery
        })
        .then(response => response.json())
        .then(data => {
            const aiResponse = data.choices[0].text.trim();
            document.getElementById("aiResponse").innerText = aiResponse; // Display AI response
        })
        .catch(error => {
            console.error("Error with OpenAI request:", error);
            alert("There was an error processing your request. Please try again later.");
        });
    });

    function formatData(data) {
        const formatted = [];
        Object.entries(data).forEach(([paperId, details]) => {
            const { Title, Cancer, Risk, Keywords, Authors } = details;
            const types = Cancer?.Types || [];

            types.forEach((type) => {
                formatted.push({
                    Title,
                    Cancer: type,
                    Risk: Risk?.Percentages?.[type] || "Unknown",
                    Keywords: Keywords ? Object.keys(Keywords).join(", ") : "None",
                    Authors: Authors?.join(", ") || "Unknown",
                });
            });
        });
        return formatted;
    }

    function checkAgainstJson(text) {
        return Object.values(originalData).some((entry) => {
            return Object.values(entry).some((value) =>
                typeof value === "string" && text.includes(value.toLowerCase())
            );
        });
    }

    function populateTable(data) {
        const tbody = document.querySelector("#riskTable tbody");
        tbody.innerHTML = "";

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No matching results</td></tr>`;
            return;
        }

        data.forEach((item) => {
            const row = document.createElement("tr");
            row.innerHTML = 
                `<td>${item.Title}</td>
                <td>${item.Cancer}</td>
                <td>${item.Risk}</td>
                <td>${item.Keywords}</td>
                <td>${item.Authors}</td>
            `;
            tbody.appendChild(row);
        });
    }

    function createChart(data) {
        const ctx = document.getElementById("riskChart").getContext("2d");
        const labels = data.map((item) => item.Cancer);
        const risks = data.map((item) => parseFloat(item.Risk.match(/\d+/)?.[0]) || 0);

        new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Risk Percentage",
                    data: risks,
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1,
                }],
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
            },
        });
    }

    function recheckCriteria() {
        const statusDiv = document.getElementById("upload-status");
        statusDiv.innerHTML = "";

        auditLog.forEach((log) => {
            const result = document.createElement("div");
            result.textContent = log;
            result.style.color = log.includes("Relevant") ? "green" : "red";
            statusDiv.appendChild(result);
        });

        alert("Recheck completed. Audit log updated.");
    }
});
