// Admin-specific JavaScript for Padel Social
// Handles admin login and dashboard visibility

(function () {
  const BASE_URL = "https://padel.mavoid.com"; // Frontend base URL

  // Utility: show toast-like notifications
  function showNotification(message, type) {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 6px;
      color: #fff;
      font-weight: 600;
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      ${type === "success" ? "background-color: #4CAF50;" : "background-color: #f44336;"}
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);

    // Auto-dismiss after 3 s
    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("admin-login-form");
    const loginSection = document.getElementById("admin-login-section");
    const dashboardSection = document.getElementById("admin-dashboard-section");
    const logoutBtn = document.getElementById("logout-btn");

    if (!loginForm) return; // admin page safeguard

    // If already logged in, show dashboard immediately
    if (sessionStorage.getItem("adminLoggedIn") === "true") {
      loginSection.style.display = "none";
      dashboardSection.style.display = "block";
    }

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("admin-username").value.trim();
      const password = document.getElementById("admin-password").value.trim();

      try {
        const res = await fetch(`${BASE_URL}/api/admin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
          const { error } = await res.json();
          showNotification(error || "Login failed", "error");
          return;
        }

        const { token } = await res.json();
        sessionStorage.setItem("adminLoggedIn", "true");
        sessionStorage.setItem("adminToken", token);
        showNotification("Login successful", "success");

        // Switch UI
        loginSection.style.display = "none";
        dashboardSection.style.display = "block";

        // Fetch initial data
        fetchStats();
        refreshCourts();

        // Update nav link defined in script.js
        if (typeof checkAdminLoginState === "function") {
          checkAdminLoginState();
        }
      } catch (err) {
        console.error("Admin login error", err);
        showNotification("An error occurred. Please try again.", "error");
      }
    });

    // Logout functionality
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem("adminLoggedIn");
        sessionStorage.removeItem("adminToken");
        dashboardSection.style.display = "none";
        loginSection.style.display = "block";
        showNotification("Logged out successfully", "success");
        if (typeof checkAdminLoginState === "function") {
          checkAdminLoginState();
        }
      });
    }
  // ===== Dashboard Stats =====
  const totalBookingsEl = document.getElementById('total-bookings');
  const periodBookingsEl = document.getElementById('todays-bookings');
  const periodRevenueEl = document.getElementById('todays-revenue');
  const activeCourtsEl = document.getElementById('active-courts');
  const statsFilterBtns = document.querySelectorAll('.stats-filter-btn');
  const periodBookingsLabelEl = document.getElementById('period-bookings-label');
  const periodRevenueLabelEl = document.getElementById('period-revenue-label');
  let statsData = null;
  let currentPeriod = 'today';

  async function fetchStats() {
    const token = sessionStorage.getItem('adminToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`${BASE_URL}/api/admin/stats`, { headers });
      if (!res.ok) {
        showNotification('Failed to load stats', 'error');
        return;
      }
      statsData = await res.json();
      renderStats(currentPeriod);
    } catch (e) {
      showNotification('Network error loading stats', 'error');
    }
  }

  function renderStats(period = 'today') {
    if (!statsData) return;
    const overview = statsData.overview || {};
    if (totalBookingsEl) totalBookingsEl.textContent = overview.totalBookings ?? 0;
    if (activeCourtsEl) activeCourtsEl.textContent = overview.activeCourts ?? 0;

    const pMap = {
      today: statsData.today,
      thisWeek: statsData.thisWeek,
      thisMonth: statsData.thisMonth,
    };
    const pData = pMap[period] || {};
    if (periodBookingsEl) periodBookingsEl.textContent = pData.bookings ?? 0;
    if (periodRevenueEl) periodRevenueEl.textContent = `$${pData.revenue ?? '0.00'}`;

    // update labels
    const labelPrefixMap = {
      today: "Today's",
      thisWeek: "This Week's",
      thisMonth: "This Month's",
    };
    const labelPrefix = labelPrefixMap[period] || '';
    if (periodBookingsLabelEl) periodBookingsLabelEl.textContent = `${labelPrefix} Bookings`;
    if (periodRevenueLabelEl) periodRevenueLabelEl.textContent = `${labelPrefix} Revenue`;
  }

  // Period filter buttons
  statsFilterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      statsFilterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentPeriod = btn.dataset.period;
      fetchStats();
    });
  });

  // initial stats load if already logged in
  if (sessionStorage.getItem('adminLoggedIn') === 'true') {
    fetchStats();
  }

  // ===== Bookings Management =====
const bookingsTableBody = document.getElementById('bookings-table-body');
const dateFilterEl = document.getElementById('date-filter');
const courtFilterEl = document.getElementById('court-filter');
const resetFiltersBtn = document.getElementById('reset-filters');

let bookingsData = [];

async function fetchBookings() {
  const token = sessionStorage.getItem('adminToken');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  try {
    const res = await fetch(`${BASE_URL}/api/admin/bookings`, { headers });
    if (!res.ok) {
      showNotification('Failed to load bookings', 'error');
      return [];
    }
    const data = await res.json();
    bookingsData = Array.isArray(data) ? data : [];
    return bookingsData;
  } catch (e) {
    showNotification('Network error loading bookings', 'error');
    return [];
  }
}

function renderBookingsTable(bookings) {
  if (!bookingsTableBody) return;
  bookingsTableBody.innerHTML = '';
  bookings.forEach((b) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${b.id}</td>
      <td>${b.date}</td>
      <td>${b.time.slice(0,5)}</td>
      <td>${b.court_id}</td>
      <td>${b.player_name}</td>
      <td>${b.player_email}</td>
      <td>${b.duration}</td>
      <td>${b.price}</td>
      <td>${b.status}</td>
      <td>
        <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${b.id}">Edit</button>
        <button class="btn btn-secondary btn-sm" data-action="delete" data-id="${b.id}">Delete</button>
      </td>
    `;
    bookingsTableBody.appendChild(tr);
  });
}

function refreshBookings() {
  const dateVal = dateFilterEl ? dateFilterEl.value : '';
  const courtVal = courtFilterEl ? courtFilterEl.value : 'all';
  let filtered = [...bookingsData];
  if (dateVal) filtered = filtered.filter((b) => b.date === dateVal);
  if (courtVal && courtVal !== 'all') filtered = filtered.filter((b) => String(b.court_id) === courtVal);
  renderBookingsTable(filtered);
}

async function loadBookings() {
  await fetchBookings();
  refreshBookings();
}

if (dateFilterEl) dateFilterEl.addEventListener('change', refreshBookings);
if (courtFilterEl) courtFilterEl.addEventListener('change', refreshBookings);
if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', () => {
  if (dateFilterEl) dateFilterEl.value = '';
  if (courtFilterEl) courtFilterEl.value = 'all';
  refreshBookings();
});

if (bookingsTableBody) {
  bookingsTableBody.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    const token = sessionStorage.getItem('adminToken');
    if (!id || !action) return;

    if (action === 'edit') {
      const newDate = prompt('New date (YYYY-MM-DD):');
      const newTime = prompt('New time (HH:MM):');
      const newDuration = parseInt(prompt('Duration (minutes):'), 10) || 60;
      const newPrice = parseFloat(prompt('Price:')) || 0;
      const newStatus = prompt('Status (pending/confirmed/cancelled):');
      try {
        const res = await fetch(`${BASE_URL}/api/admin/bookings/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: newDate,
            time: newTime,
            duration: newDuration,
            price: newPrice,
            status: newStatus,
          }),
        });
        res.ok ? showNotification('Booking updated', 'success') : showNotification('Update failed', 'error');
      } catch (err) {
        showNotification('Update error', 'error');
      }
    } else if (action === 'delete') {
      if (!confirm('Delete this booking?')) return;
      try {
        const res = await fetch(`${BASE_URL}/api/admin/bookings/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        res.ok ? showNotification('Booking deleted', 'success') : showNotification('Delete failed', 'error');
      } catch (err) {
        showNotification('Delete error', 'error');
      }
    }
    await loadBookings();
  });
}

if (sessionStorage.getItem('adminLoggedIn') === 'true') {
  loadBookings();
}

// ===== Courts Management =====
  const courtsTableBody = document.getElementById("courts-table-body");
  const activeOnlyCheckbox = document.getElementById("filter-active-only");

  async function fetchCourts() {
    const token = sessionStorage.getItem("adminToken");
    const activeOnlyParam = activeOnlyCheckbox && activeOnlyCheckbox.checked ? "?active_only=true" : "";
    const url = `${BASE_URL}/api/courts${activeOnlyParam}`;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(url, { headers });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        showNotification("Failed to load courts", "error");
        return [];
      }
      const courtsArray = Array.isArray(data)
        ? data
        : data && Array.isArray(data.courts)
        ? data.courts
        : [];
      return courtsArray;
    } catch (e) {
      showNotification("Network error loading courts", "error");
      return [];
    }
  }

  function renderCourtsTable(courts) {
    if (!courtsTableBody) return;
    courtsTableBody.innerHTML = "";
    courts.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.id}</td>
        <td>${c.name}</td>
        <td>${c.hourly_price_member}</td>
        <td>${c.hourly_price_non_member}</td>
        <td>${c.is_active ? "Active" : "Inactive"}</td>
        <td>
          <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${c.id}">Edit</button>
          <button class="btn btn-secondary btn-sm" data-action="toggle" data-id="${c.id}">${c.is_active ? "Deactivate" : "Activate"}</button>
          <button class="btn btn-secondary btn-sm" data-action="delete" data-id="${c.id}">Delete</button>
        </td>
      `;
      courtsTableBody.appendChild(tr);
    });
  }

  async function refreshCourts() {
    const courts = await fetchCourts();
    renderCourtsTable(courts);
  }

  // initial load if already logged in
  if (sessionStorage.getItem("adminLoggedIn") === "true") {
    refreshCourts();
  }

  if (activeOnlyCheckbox) {
    activeOnlyCheckbox.addEventListener("change", refreshCourts);
  }



  if (courtsTableBody) {
    courtsTableBody.addEventListener("click", async (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const token = sessionStorage.getItem("adminToken");
      if (!id || !action) return;
      if (action === "edit") {
        const newName = prompt("New name:");
        if (!newName) return;
        const memberPrice = parseFloat(prompt("Hourly price (member):")) || 0;
        const nonMemberPrice = parseFloat(prompt("Hourly price (non-member):")) || 0;
        try {
          const res = await fetch(`${BASE_URL}/api/courts/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: newName,
              hourly_price_member: memberPrice,
              hourly_price_non_member: nonMemberPrice,
            }),
          });
          res.ok ? showNotification("Court updated", "success") : showNotification("Update failed", "error");
        } catch (err) {
          showNotification("Update error", "error");
        }
      } else if (action === "toggle") {
        try {
          const res = await fetch(`${BASE_URL}/api/courts/${id}/toggle-status`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
          });
          res.ok ? showNotification("Status toggled", "success") : showNotification("Toggle failed", "error");
        } catch (err) {
          showNotification("Toggle error", "error");
        }
      } else if (action === "delete") {
        if (!confirm("Are you sure you want to delete this court?")) return;
        try {
          const res = await fetch(`${BASE_URL}/api/courts/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          res.ok ? showNotification("Court deleted", "success") : showNotification("Delete failed", "error");
        } catch (err) {
          showNotification("Delete error", "error");
        }
      }
      refreshCourts();
    });
  }

  // Tab switching
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.dataset.target;
      const contentEl = document.getElementById(target);
      contentEl.classList.add("active");
      // If courts tab activated, refresh list
      if (target === "courts-tab") {
        refreshCourts();
      }
    });
  });

  const refreshDataBtn = document.getElementById("refresh-data");
  if (refreshDataBtn) {
    refreshDataBtn.addEventListener("click", () => {
      refreshCourts();
      fetchStats();
      loadBookings();
    });
  }

  });
})();
