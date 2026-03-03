/* admin.js */
const file = 'data/movies.json';

window.onload = async () => {
  // Load movies JSON (if needed)
  const res = await fetch(`/api/json/read?file=${file}`);
  const data = await res.json();
  if (document.getElementById("jsonEditor")) {
    document.getElementById("jsonEditor").value = JSON.stringify(data, null, 2);
  }
  // Load users for admin table
  if (document.getElementById("userTable")) {
    const userRes = await fetch("/api/admin/users");
    const users = await userRes.json();
    renderUsers(users);
  }
};

async function saveJSON() {
  const updatedData = JSON.parse(document.getElementById("jsonEditor").value);
  const res = await fetch(`/api/json/update?file=${file}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedData)
  });

  if (res.ok) {
    alert("File saved successfully");
  } else {
    alert("Error saving file");
  }
}

function renderUsers(users) {
  const tbody = document.getElementById("userTable").querySelector("tbody");
  tbody.innerHTML = "";
  users.forEach(user => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${user.username}</td>
      <td>${user.isActive ? "✅ Active" : "🚫 Inactive"}</td>
      <td>
        <button class="btn-deactivate" onclick="deactivateUser('${user._id}')">Deactivate</button>
        ${!user.isActive ? `<button class="btn-activate" onclick="activateUser('${user._id}')">Activate</button>` : ""}
      </td>
      <td><button class="btn-delete" onclick="deleteUser('${user._id}')">Delete</button></td>
    `;
    tbody.appendChild(row);
  });
}

async function deactivateUser(id) {
  const res = await fetch(`/api/admin/users/${id}/deactivate`, { method: "PUT" });
  if (res.ok) {
    alert("User deactivated.");
    location.reload();
  } else {
    alert("Error deactivating user.");
  }
}

async function deleteUser(id) {
  if (!confirm("Are you sure you want to delete this user?")) return;
  const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
  if (res.ok) {
    alert("User deleted.");
    location.reload();
  } else {
    alert("Error deleting user.");
  }
}

async function activateUser(id) {
  const res = await fetch(`/api/admin/users/${id}/activate`, { method: "PUT" });
  if (res.ok) {
    alert("User activated.");
    location.reload();
  } else {
    alert("Error activating user.");
  }
}

/* Optional script.js addition (logout check) */
(function () {
  if (!localStorage.getItem("adminUsername")) {
    window.location.href = "adminlogin.html";
  }
})();
