document.addEventListener("DOMContentLoaded", () => {
  const capabilitiesGrid = document.getElementById("capabilities-grid");
  const registrationModal = document.getElementById("registration-modal");
  const registerForm = document.getElementById("register-form");
  const messageDiv = document.getElementById("message");
  const closeModalBtn = document.querySelector(".close-modal");
  const cancelBtn = document.getElementById("cancel-btn");
  const emailInput = document.getElementById("email");
  const selectedCapabilityInput = document.getElementById("selected-capability");
  const capabilityPreview = document.getElementById("capability-preview");

  let capabilitiesData = {};

  // Function to get practice area badge class
  function getPracticeAreaClass(practiceArea) {
    return practiceArea.toLowerCase().replace(/\s+/g, '-');
  }

  // Function to show message
  function showMessage(text, type = 'info') {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove('hidden');

    setTimeout(() => {
      messageDiv.classList.add('hidden');
    }, 5000);
  }

  // Function to open registration modal
  function openRegistrationModal(capabilityName) {
    const capability = capabilitiesData[capabilityName];
    selectedCapabilityInput.value = capabilityName;
    
    capabilityPreview.innerHTML = `
      <strong>Registering for:</strong>
      <div style="margin-top: 8px; font-size: 1.1rem; color: #003d7a; font-weight: 600;">
        ${capabilityName}
      </div>
      <div style="margin-top: 4px; color: #666; font-size: 0.9rem;">
        ${capability.practice_area} Practice
      </div>
    `;
    
    registrationModal.classList.remove('hidden');
    emailInput.focus();
  }

  // Function to close registration modal
  function closeRegistrationModal() {
    registrationModal.classList.add('hidden');
    registerForm.reset();
  }

  // Function to fetch capabilities from API
  async function fetchCapabilities() {
    try {
      const response = await fetch("/capabilities");
      capabilitiesData = await response.json();

      // Clear loading message
      capabilitiesGrid.innerHTML = "";

      // Populate capabilities grid
      Object.entries(capabilitiesData).forEach(([name, details]) => {
        const capabilityCard = document.createElement("div");
        capabilityCard.className = "capability-card";

        const availableCapacity = details.capacity || 0;
        const currentConsultants = details.consultants ? details.consultants.length : 0;
        const practiceClass = getPracticeAreaClass(details.practice_area);

        // Create consultants HTML
        const consultantsHTML = details.consultants && details.consultants.length > 0
          ? `<div class="consultants-section">
              <h5>Registered Consultants</h5>
              <ul class="consultants-list">
                ${details.consultants
                  .map(email => `
                    <li>
                      <span class="consultant-email">${email}</span>
                      <button class="delete-btn" data-capability="${name}" data-email="${email}" 
                              aria-label="Remove ${email}">
                        Remove
                      </button>
                    </li>
                  `).join("")}
              </ul>
            </div>`
          : `<div class="empty-state">No consultants registered yet</div>`;

        capabilityCard.innerHTML = `
          <div class="capability-header">
            <h4>${name}</h4>
            <span class="practice-badge ${practiceClass}">${details.practice_area}</span>
          </div>
          
          <p class="capability-description">${details.description}</p>
          
          <div class="capability-details">
            <div class="detail-item">
              <span class="detail-label">Industry Verticals:</span>
              <span class="detail-value">${details.industry_verticals ? details.industry_verticals.join(', ') : 'Not specified'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Skill Levels:</span>
              <span class="detail-value">${details.skill_levels ? details.skill_levels.join(' • ') : 'Not specified'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Key Certifications:</span>
              <span class="detail-value">${details.certifications ? details.certifications.slice(0, 2).join(', ') : 'Various'}</span>
            </div>
          </div>

          <div class="capacity-indicator">
            <span class="capacity-icon">⏰</span>
            <div class="capacity-text">
              <div style="font-size: 0.85rem; color: #666;">Available Capacity</div>
              <div class="capacity-hours">${availableCapacity} hours/week</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.85rem; color: #666;">Team Size</div>
              <div style="font-weight: 700; font-size: 1.1rem; color: #003d7a;">${currentConsultants}</div>
            </div>
          </div>

          <div class="consultants-container">
            ${consultantsHTML}
          </div>

          <button class="register-btn" data-capability="${name}">
            Register Your Expertise
          </button>
        `;

        capabilitiesGrid.appendChild(capabilityCard);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", handleUnregister);
      });

      // Add event listeners to register buttons
      document.querySelectorAll(".register-btn").forEach(button => {
        button.addEventListener("click", (e) => {
          const capability = e.target.getAttribute("data-capability");
          openRegistrationModal(capability);
        });
      });

    } catch (error) {
      capabilitiesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
          <p style="color: #d32f2f; font-size: 1.1rem;">Failed to load capabilities. Please try again later.</p>
        </div>
      `;
      console.error("Error fetching capabilities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const capability = button.getAttribute("data-capability");
    const email = button.getAttribute("data-email");

    if (!confirm(`Remove ${email} from ${capability}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/capabilities/${encodeURIComponent(capability)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, 'success');
        fetchCapabilities();
      } else {
        showMessage(result.detail || "An error occurred", 'error');
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", 'error');
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value;
    const capability = selectedCapabilityInput.value;

    try {
      const response = await fetch(
        `/capabilities/${encodeURIComponent(capability)}/register?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, 'success');
        closeRegistrationModal();
        fetchCapabilities();
      } else {
        showMessage(result.detail || "An error occurred", 'error');
      }
    } catch (error) {
      showMessage("Failed to register. Please try again.", 'error');
      console.error("Error registering:", error);
    }
  });

  // Modal close handlers
  closeModalBtn.addEventListener("click", closeRegistrationModal);
  cancelBtn.addEventListener("click", closeRegistrationModal);
  
  // Close modal on background click
  registrationModal.addEventListener("click", (e) => {
    if (e.target === registrationModal) {
      closeRegistrationModal();
    }
  });

  // Close modal on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !registrationModal.classList.contains('hidden')) {
      closeRegistrationModal();
    }
  });

  // Initialize app
  fetchCapabilities();
});