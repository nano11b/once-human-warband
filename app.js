/**
 * Once Human Warband Roster Tracker
 * Manual / localStorage data — no live game API.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "once-human-warband-roster-v1";
  const SAMPLE_FLAG_KEY = "once-human-warband-sample-v1";

  const STANDARD_ROLES = ["Leader", "Officer", "Member"];

  const SAMPLE_MEMBERS = [
    {
      id: "sample-1",
      name: "Ashveil",
      role: "Leader",
      level: 52,
      status: "Active",
      classArchetype: "Power Armor",
      gearNotes: "SCAR · Blast Mag · Contaminated set",
      notes: "Raid nights Tue/Thu. Sample data.",
      updatedAt: "2026-09-28",
    },
    {
      id: "sample-2",
      name: "Rook",
      role: "Officer",
      level: 48,
      status: "Active",
      classArchetype: "Hews",
      gearNotes: "Sniper focus · Spotter kit",
      notes: "Coordinates PvE clears.",
      updatedAt: "2026-09-27",
    },
    {
      id: "sample-3",
      name: "Mire",
      role: "Officer",
      level: 45,
      status: "Away",
      classArchetype: "Magic Touch",
      gearNotes: "Support mods · Med stockpile",
      notes: "Away until weekend.",
      updatedAt: "2026-09-25",
    },
    {
      id: "sample-4",
      name: "Volt",
      role: "Member",
      level: 41,
      status: "Active",
      classArchetype: "Bounce",
      gearNotes: "SMG · Mobility build",
      notes: "",
      updatedAt: "2026-09-29",
    },
    {
      id: "sample-5",
      name: "Cinder",
      role: "Member",
      level: 38,
      status: "Inactive",
      classArchetype: "Shrapnel",
      gearNotes: "Shotgun · Close range",
      notes: "Hasn't logged in recently.",
      updatedAt: "2026-09-18",
    },
    {
      id: "sample-6",
      name: "Nox",
      role: "Scout",
      level: 36,
      status: "Active",
      classArchetype: "Ranger",
      gearNotes: "Recon optics · Light armor",
      notes: "Custom role example.",
      updatedAt: "2026-09-26",
    },
  ];

  /** @type {Array<object>} */
  let members = [];
  let isSample = false;

  // DOM
  const $ = (sel) => document.querySelector(sel);
  const rosterBody = $("#roster-body");
  const cardList = $("#card-list");
  const emptyState = $("#empty-state");
  const sampleBanner = $("#sample-banner");
  const dialog = $("#member-dialog");
  const confirmDialog = $("#confirm-dialog");
  const form = $("#member-form");
  const toastEl = $("#toast");

  function uid() {
    return "m-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const sampleFlag = localStorage.getItem(SAMPLE_FLAG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          members = parsed.map(normalizeMember);
          isSample = sampleFlag === "1";
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to load roster", e);
    }
    // First visit: seed sample
    members = SAMPLE_MEMBERS.map((m) => ({ ...m }));
    isSample = true;
    persist();
  }

  function normalizeMember(m) {
    return {
      id: String(m.id || uid()),
      name: String(m.name || "").trim() || "Unnamed",
      role: String(m.role || "Member").trim() || "Member",
      level: clampLevel(m.level),
      status: ["Active", "Inactive", "Away"].includes(m.status) ? m.status : "Active",
      classArchetype: String(m.classArchetype || m.class || "").trim(),
      gearNotes: String(m.gearNotes || "").trim(),
      notes: String(m.notes || "").trim(),
      updatedAt: String(m.updatedAt || todayISO()).slice(0, 10),
    };
  }

  function clampLevel(n) {
    const v = parseInt(n, 10);
    if (Number.isNaN(v) || v < 1) return 1;
    if (v > 999) return 999;
    return v;
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
    localStorage.setItem(SAMPLE_FLAG_KEY, isSample ? "1" : "0");
  }

  function toast(msg, isError) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("error", !!isError);
    toastEl.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.add("hidden"), 2800);
  }

  function roleClass(role) {
    const r = role.toLowerCase();
    if (r === "leader") return "leader";
    if (r === "officer") return "officer";
    return "";
  }

  function statusClass(status) {
    return String(status || "").toLowerCase();
  }

  function getFilters() {
    return {
      search: ($("#search").value || "").trim().toLowerCase(),
      status: $("#filter-status").value,
      role: $("#filter-role").value,
      sort: $("#sort-by").value,
    };
  }

  function filteredMembers() {
    const f = getFilters();
    let list = members.slice();

    if (f.status) {
      list = list.filter((m) => m.status === f.status);
    }
    if (f.role === "__custom") {
      list = list.filter((m) => !STANDARD_ROLES.includes(m.role));
    } else if (f.role) {
      list = list.filter((m) => m.role === f.role);
    }
    if (f.search) {
      list = list.filter((m) => {
        const hay = [m.name, m.role, m.classArchetype, m.gearNotes, m.notes, String(m.level)]
          .join(" ")
          .toLowerCase();
        return hay.includes(f.search);
      });
    }

    list.sort((a, b) => {
      switch (f.sort) {
        case "level-desc":
          return b.level - a.level || a.name.localeCompare(b.name);
        case "level-asc":
          return a.level - b.level || a.name.localeCompare(b.name);
        case "role": {
          const order = { Leader: 0, Officer: 1, Member: 2 };
          const ra = order[a.role] ?? 3;
          const rb = order[b.role] ?? 3;
          return ra - rb || a.name.localeCompare(b.name);
        }
        case "updated":
          return (b.updatedAt || "").localeCompare(a.updatedAt || "") || a.name.localeCompare(b.name);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return list;
  }

  function updateSummary(visible) {
    const total = members.length;
    const active = members.filter((m) => m.status === "Active").length;
    const avg =
      total === 0
        ? "—"
        : (members.reduce((s, m) => s + m.level, 0) / total).toFixed(1);

    $("#stat-total").textContent = String(total);
    $("#stat-active").textContent = String(active);
    $("#stat-avg").textContent = avg;
    $("#stat-showing").textContent = String(visible.length);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render() {
    const list = filteredMembers();
    updateSummary(list);
    sampleBanner.classList.toggle("hidden", !isSample);

    rosterBody.innerHTML = "";
    cardList.innerHTML = "";

    if (list.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }
    emptyState.classList.add("hidden");

    for (const m of list) {
      rosterBody.appendChild(buildRow(m));
      cardList.appendChild(buildCard(m));
    }
  }

  function buildRow(m) {
    const tr = document.createElement("tr");
    tr.dataset.id = m.id;
    const notesPreview = m.notes
      ? `<span class="member-notes-preview" title="${escapeHtml(m.notes)}">${escapeHtml(m.notes)}</span>`
      : "";
    tr.innerHTML = `
      <td>
        <span class="member-name">${escapeHtml(m.name)}</span>
        ${notesPreview}
      </td>
      <td><span class="role-pill ${roleClass(m.role)}">${escapeHtml(m.role)}</span></td>
      <td><span class="level-badge">${m.level}</span></td>
      <td><span class="status-pill ${statusClass(m.status)}">${escapeHtml(m.status)}</span></td>
      <td>${escapeHtml(m.classArchetype) || "—"}</td>
      <td class="gear-cell" title="${escapeHtml(m.gearNotes)}">${escapeHtml(m.gearNotes) || "—"}</td>
      <td class="date-cell">${escapeHtml(m.updatedAt)}</td>
      <td class="col-actions">
        <div class="row-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-action="edit">Edit</button>
          <button type="button" class="btn btn-ghost btn-sm" data-action="delete">Delete</button>
        </div>
      </td>
    `;
    tr.querySelector('[data-action="edit"]').addEventListener("click", () => openEdit(m.id));
    tr.querySelector('[data-action="delete"]').addEventListener("click", () => confirmDelete(m.id));
    return tr;
  }

  function buildCard(m) {
    const card = document.createElement("article");
    card.className = "member-card";
    card.dataset.id = m.id;
    card.innerHTML = `
      <div class="member-card-top">
        <h3>${escapeHtml(m.name)}</h3>
        <span class="level-badge">Lv ${m.level}</span>
      </div>
      <div class="member-card-meta">
        <span class="role-pill ${roleClass(m.role)}">${escapeHtml(m.role)}</span>
        <span class="status-pill ${statusClass(m.status)}">${escapeHtml(m.status)}</span>
      </div>
      <dl>
        <dt>Class</dt><dd>${escapeHtml(m.classArchetype) || "—"}</dd>
        <dt>Gear</dt><dd>${escapeHtml(m.gearNotes) || "—"}</dd>
        <dt>Updated</dt><dd>${escapeHtml(m.updatedAt)}</dd>
        ${m.notes ? `<dt>Notes</dt><dd>${escapeHtml(m.notes)}</dd>` : ""}
      </dl>
      <div class="row-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-action="edit">Edit</button>
        <button type="button" class="btn btn-ghost btn-sm" data-action="delete">Delete</button>
      </div>
    `;
    card.querySelector('[data-action="edit"]').addEventListener("click", () => openEdit(m.id));
    card.querySelector('[data-action="delete"]').addEventListener("click", () => confirmDelete(m.id));
    return card;
  }

  function syncRoleCustomVisibility() {
    const isCustom = $("#f-role").value === "__custom";
    $("#custom-role-wrap").classList.toggle("hidden", !isCustom);
    if (isCustom) $("#f-role-custom").focus();
  }

  function openAdd() {
    $("#modal-title").textContent = "Add Member";
    $("#member-id").value = "";
    $("#f-name").value = "";
    $("#f-role").value = "Member";
    $("#f-role-custom").value = "";
    $("#f-level").value = "1";
    $("#f-status").value = "Active";
    $("#f-class").value = "";
    $("#f-gear").value = "";
    $("#f-notes").value = "";
    syncRoleCustomVisibility();
    dialog.showModal();
    $("#f-name").focus();
  }

  function openEdit(id) {
    const m = members.find((x) => x.id === id);
    if (!m) return;
    $("#modal-title").textContent = "Edit Member";
    $("#member-id").value = m.id;
    $("#f-name").value = m.name;
    if (STANDARD_ROLES.includes(m.role)) {
      $("#f-role").value = m.role;
      $("#f-role-custom").value = "";
    } else {
      $("#f-role").value = "__custom";
      $("#f-role-custom").value = m.role;
    }
    $("#f-level").value = String(m.level);
    $("#f-status").value = m.status;
    $("#f-class").value = m.classArchetype;
    $("#f-gear").value = m.gearNotes;
    $("#f-notes").value = m.notes;
    syncRoleCustomVisibility();
    dialog.showModal();
    $("#f-name").focus();
  }

  function resolveRole() {
    if ($("#f-role").value === "__custom") {
      return ($("#f-role-custom").value || "").trim() || "Member";
    }
    return $("#f-role").value;
  }

  function saveMember(e) {
    e.preventDefault();
    const name = ($("#f-name").value || "").trim();
    if (!name) {
      toast("Name is required", true);
      return;
    }

    const id = $("#member-id").value;
    const payload = {
      name,
      role: resolveRole(),
      level: clampLevel($("#f-level").value),
      status: $("#f-status").value,
      classArchetype: ($("#f-class").value || "").trim(),
      gearNotes: ($("#f-gear").value || "").trim(),
      notes: ($("#f-notes").value || "").trim(),
      updatedAt: todayISO(),
    };

    if (id) {
      const idx = members.findIndex((x) => x.id === id);
      if (idx >= 0) {
        members[idx] = { ...members[idx], ...payload };
      }
    } else {
      members.push({ id: uid(), ...payload });
    }

    // Editing sample data converts it to "owned" data but keep banner until clear?
    // Keep sample flag until user clears — they may still want the banner.
    // Only clear sample flag when they explicitly clear sample.
    persist();
    dialog.close();
    render();
    toast(id ? "Member updated" : "Member added");
  }

  function confirmDelete(id) {
    const m = members.find((x) => x.id === id);
    if (!m) return;
    $("#confirm-title").textContent = "Delete member";
    $("#confirm-message").textContent = `Remove “${m.name}” from the roster? This cannot be undone.`;
    confirmDialog.showModal();

    const onClose = () => {
      confirmDialog.removeEventListener("close", onClose);
      if (confirmDialog.returnValue === "ok") {
        members = members.filter((x) => x.id !== id);
        persist();
        render();
        toast("Member deleted");
      }
    };
    confirmDialog.addEventListener("close", onClose);
  }

  function clearSample() {
    $("#confirm-title").textContent = "Clear sample data";
    $("#confirm-message").textContent =
      "This removes the demo roster so you can start fresh. Export first if you want a backup.";
    confirmDialog.showModal();

    const onClose = () => {
      confirmDialog.removeEventListener("close", onClose);
      if (confirmDialog.returnValue === "ok") {
        members = [];
        isSample = false;
        persist();
        render();
        toast("Sample cleared — roster empty");
      }
    };
    confirmDialog.addEventListener("close", onClose);
  }

  function exportJson() {
    const payload = {
      format: "once-human-warband-roster",
      version: 1,
      exportedAt: new Date().toISOString(),
      note: "Manual roster data for Once Human. Not connected to any live game API.",
      members: members,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `once-human-warband-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Roster exported");
  }

  function importJson(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        let list = null;
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.members)) list = data.members;
        if (!list) throw new Error("Invalid roster file");
        members = list.map(normalizeMember);
        isSample = false;
        persist();
        render();
        toast(`Imported ${members.length} member(s)`);
      } catch (err) {
        console.warn(err);
        toast("Import failed — check JSON format", true);
      }
    };
    reader.readAsText(file);
  }

  // Events
  $("#btn-add").addEventListener("click", openAdd);
  $("#btn-add-empty").addEventListener("click", openAdd);
  $("#btn-export").addEventListener("click", exportJson);
  $("#btn-clear-sample").addEventListener("click", clearSample);
  $("#btn-close-modal").addEventListener("click", () => dialog.close());
  $("#btn-cancel").addEventListener("click", () => dialog.close());
  $("#f-role").addEventListener("change", syncRoleCustomVisibility);
  form.addEventListener("submit", saveMember);

  $("#import-file").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) importJson(file);
    e.target.value = "";
  });

  ["search", "filter-status", "filter-role", "sort-by"].forEach((id) => {
    $(`#${id}`).addEventListener("input", render);
    $(`#${id}`).addEventListener("change", render);
  });

  // Init
  load();
  render();
})();
