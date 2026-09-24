(function () {
  "use strict";

  const STORAGE_KEY = "plotWeaselFieldLogger.v2";
  const PROJECT_INDEX_KEY = "plotWeaselFieldLogger.projects.v1";
  const ACTIVE_PROJECT_KEY = "plotWeaselFieldLogger.activeProject.v1";
  const PROJECT_STATE_PREFIX = "plotWeaselFieldLogger.project.v1.";
  const LEGACY_STORAGE_KEYS = ["plotWeaselFieldLogger.v1"];
  const APP_VERSION = "2.2.9";
  const TREE_MIN_DBH = 5;
  const TREE_MIN_HEIGHT = 8;
  const TREE_MAX_AGE = 1000;
  const GPS_CAPTURE_SECONDS = 30;
  const LEVEL_ASPECT = "Level (< 5% slope)";
  const DEFAULT_DAMAGE_AGENTS = ["None", "Tree Form", "Suppression", "Disease", "Insects", "Elements", "Broken Top"];
  const DECAY_CLASS_OPTIONS = [
    { value: "1", label: "Class 1 - Recently dead; bark and fine branches intact; wood hard." },
    { value: "2", label: "Class 2 - Some bark loss; fine branches gone; wood firm." },
    { value: "3", label: "Class 3 - Bark mostly gone; top often broken; wood starting to soften." },
    { value: "4", label: "Class 4 - No bark; wood soft; form degrading." },
    { value: "5", label: "Class 5 - Very soft, crumbling; snag collapsing or stump-like." }
  ];
  const LOOKUPS = {
    aspect: [
      "North", "Northeast", "East", "Southeast", "South", "Southwest",
      "West", "Northwest", LEVEL_ASPECT
    ],
    slopePosition: [
      "Top of Slope (convex)", "Upper Slope (convex)",
      "Mid-slope (uniform angle)", "Bench", "Lower slope (concave)",
      "Bottomland (horizontal)", "Flatland (no assoc. to slope)"
    ],
    damageAgents: DEFAULT_DAMAGE_AGENTS.slice(),
    diameterClass: ['0"', '2"', '4"'],
    decayClass: DECAY_CLASS_OPTIONS,
    heightClass: ["0-1 ft", "1-3 ft", "3-5 ft", ">5 ft"]
  };

  const FIA_SPECIES = (window.PLOTWEASEL_FIA_SPECIES || [])
    .map((row) => ({ code: clean(row.code), name: clean(row.name) }))
    .filter((row) => row.code && row.name)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const FIA_BY_CODE = indexSpeciesByCode(FIA_SPECIES);

  const DEFAULT_PROJECT_SPECIES_CODES = [];

  const SITE_FIELDS = [
    "measurementDate", "elevation", "slope", "aspect",
    "slopePosition", "soilType", "habitatType", "siteIndex", "roadAccess",
    "loggingSystem", "forestSoils", "utmEasting", "utmNorthing", "utmZone",
    "gpsAccuracy", "gpsFixCount", "gpsLatitude", "gpsLongitude",
    "siteNotes"
  ];

  const PLOT_WEASEL_COLUMNS = [
    "plot", "spp", "dbh", "ht", "actualht", "cull", "DECAYCD", "crown_ratio",
    "status", "species_name", "crew_id", "source_record_id",
    "project_name", "crew_name"
  ];

  const els = {};
  let state = null;
  let currentProjectId = "";
  let storageAvailable = true;
  let gpsCapture = null;
  let nativeGpsBridgeEnabled = false;

  document.addEventListener("DOMContentLoaded", () => {
    try {
      init();
      window.PLOTWEASEL_FIELD_APP_READY = true;
      document.documentElement.setAttribute("data-app-ready", "true");
    } catch (error) {
      window.PLOTWEASEL_FIELD_APP_READY = false;
      document.documentElement.setAttribute("data-app-ready", "false");
      showStartupError(error);
    }
  });

  function init() {
    [
      "storageStatus", "projectSwitcher", "newProjectBtn", "deleteProjectBtn",
      "projectSummary", "projectName", "crewName", "crewId", "plotSelect",
      "newPlotNumber", "addPlotBtn", "plotCount", "treeCount", "regenCount",
      "issueCount", "banner", "deletePlotBtn", "siteForm", "treeForm",
      "treeList", "regenForm", "regenList", "reviewList", "refreshReviewBtn",
      "captureGpsBtn", "gpsStatus",
      "speciesSearch", "fiaSpeciesSelect", "addProjectSpeciesBtn",
      "projectSpeciesSearch", "projectSpeciesList", "resetSpeciesBtn",
      "clearSpeciesBtn", "savedSpeciesListStatus", "saveSpeciesListBtn",
      "damageAgentInput", "addDamageAgentBtn",
      "damageAgentList", "treeSpeciesFilter", "regenSpeciesFilter",
      "clearTreeFormBtn", "clearRegenFormBtn", "exportCrewPackageBtn",
      "exportPlotWeaselBtn", "saveCsvFolderBtn", "downloadBackupBtn",
      "restoreBackupInput", "importCrewPackages", "mergeSummary",
      "exportProjectSetupBtn", "importProjectSetupInput", "projectSetupSummary",
      "clearAllBtn"
    ].forEach((id) => {
      els[id] = document.getElementById(id);
    });

    testStorage();
    clearLegacyStorage();
    state = loadState();
    populateStaticSelects();
    hydrateSettings();
    bindEvents();
    renderAll();
  }

  function testStorage() {
    try {
      localStorage.setItem("__plot_weasel_test__", "1");
      localStorage.removeItem("__plot_weasel_test__");
      storageAvailable = true;
      els.storageStatus.textContent = "Local only";
    } catch (error) {
      storageAvailable = false;
      els.storageStatus.textContent = "Memory only";
    }
  }

  function defaultState(projectId) {
    return {
      version: 2,
      projectId: clean(projectId) || makeProjectId(),
      settings: {
        projectName: "",
        crewName: "",
        crewId: "",
        projectSpeciesCodes: DEFAULT_PROJECT_SPECIES_CODES.slice(),
        savedSpeciesCodes: [],
        savedSpeciesSavedAt: "",
        damageAgents: DEFAULT_DAMAGE_AGENTS.slice()
      },
      currentPlot: "",
      plots: {},
      trees: [],
      regen: [],
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
  }

  function loadState() {
    if (!storageAvailable) return defaultState();
    try {
      migrateSingleProjectStorage();
      const requestedProject = projectIdFromUrl();
      const index = loadProjectIndex();
      const activeProject = clean(requestedProject) || clean(localStorage.getItem(ACTIVE_PROJECT_KEY));
      let projectId = hasProject(activeProject, index) ? activeProject : "";
      if (!projectId && index.length) projectId = index[0].id;
      if (projectId) {
        const loaded = loadProjectState(projectId);
        if (loaded) {
          currentProjectId = loaded.projectId;
          localStorage.setItem(ACTIVE_PROJECT_KEY, currentProjectId);
          return loaded;
        }
      }
      const fresh = defaultState();
      currentProjectId = fresh.projectId;
      return fresh;
    } catch (error) {
      const fresh = defaultState();
      currentProjectId = fresh.projectId;
      return fresh;
    }
  }

  function clearLegacyStorage() {
    if (!storageAvailable) return;
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  }

  function migrateSingleProjectStorage() {
    if (loadProjectIndex().length) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const migratedId = clean(parsed.projectId) || makeProjectId();
      parsed.projectId = migratedId;
      currentProjectId = migratedId;
      const migrated = normalizeState(parsed);
      localStorage.setItem(projectStateKey(migratedId), JSON.stringify(migrated));
      localStorage.setItem(ACTIVE_PROJECT_KEY, migratedId);
      saveProjectIndex([projectSummary(migrated)]);
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function loadProjectState(projectId) {
    if (!storageAvailable || !projectId) return null;
    try {
      const raw = localStorage.getItem(projectStateKey(projectId));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      parsed.projectId = clean(parsed.projectId) || projectId;
      return normalizeState(parsed);
    } catch (error) {
      return null;
    }
  }

  function loadProjectIndex() {
    if (!storageAvailable) return [];
    try {
      const parsed = JSON.parse(localStorage.getItem(PROJECT_INDEX_KEY) || "[]");
      return normalizeProjectIndex(parsed);
    } catch (error) {
      return [];
    }
  }

  function saveProjectIndex(index) {
    if (!storageAvailable) return;
    localStorage.setItem(PROJECT_INDEX_KEY, JSON.stringify(normalizeProjectIndex(index)));
  }

  function normalizeProjectIndex(index) {
    const source = Array.isArray(index) ? index : [];
    const byId = {};
    source.forEach((project) => {
      const id = clean(project && project.id);
      if (!id) return;
      byId[id] = {
        id,
        name: clean(project.name) || "Untitled Project",
        crewName: clean(project.crewName),
        crewId: clean(project.crewId),
        plotCount: Number(project.plotCount) || 0,
        treeCount: Number(project.treeCount) || 0,
        regenCount: Number(project.regenCount) || 0,
        updatedAt: clean(project.updatedAt),
        createdAt: clean(project.createdAt)
      };
    });
    return objectValues(byId).sort((a, b) => {
      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
      return bTime - aTime || a.name.localeCompare(b.name, undefined, { numeric: true });
    });
  }

  function hasProject(projectId, index) {
    const id = clean(projectId);
    return Boolean(id && (index || loadProjectIndex()).some((project) => project.id === id));
  }

  function upsertProjectSummary(projectState) {
    const summary = projectSummary(projectState);
    const next = loadProjectIndex().filter((project) => project.id !== summary.id);
    next.push(summary);
    saveProjectIndex(next);
  }

  function projectSummary(projectState) {
    const source = projectState || state || defaultState(currentProjectId);
    return {
      id: clean(source.projectId) || currentProjectId || makeProjectId(),
      name: clean(source.settings && source.settings.projectName) || "Untitled Project",
      crewName: clean(source.settings && source.settings.crewName),
      crewId: clean(source.settings && source.settings.crewId),
      plotCount: objectValues(source.plots || {}).length,
      treeCount: Array.isArray(source.trees) ? source.trees.length : 0,
      regenCount: Array.isArray(source.regen) ? source.regen.length : 0,
      updatedAt: clean(source.updatedAt) || nowIso(),
      createdAt: clean(source.createdAt)
    };
  }

  function projectStateKey(projectId) {
    return PROJECT_STATE_PREFIX + clean(projectId);
  }

  function projectIdFromUrl() {
    try {
      return clean(new URLSearchParams(window.location.search).get("project"));
    } catch (error) {
      return "";
    }
  }

  function normalizeState(input) {
    const base = defaultState(clean(input && input.projectId) || currentProjectId);
    const incoming = input || {};
    const normalized = mergeObjects(base, incoming, {
      projectId: clean(incoming.projectId) || base.projectId,
      settings: mergeObjects(base.settings, incoming.settings || {}),
      plots: incoming.plots && typeof incoming.plots === "object" ? incoming.plots : {},
      trees: Array.isArray(incoming.trees) ? incoming.trees : [],
      regen: Array.isArray(incoming.regen) ? incoming.regen : []
    });
    const normalizedPlots = {};
    Object.keys(normalized.plots).forEach((key) => {
      normalizedPlots[key] = normalizeRecordContext(normalized.plots[key], normalized.settings);
    });
    normalized.plots = normalizedPlots;
    normalized.settings.projectSpeciesCodes = normalizeSpeciesCodes(normalized.settings.projectSpeciesCodes);
    normalized.settings.savedSpeciesCodes = singleSavedSpeciesCodes(normalized.settings);
    normalized.settings.savedSpeciesSavedAt = clean(normalized.settings.savedSpeciesSavedAt);
    normalized.settings.savedSpeciesLists = [];
    normalized.settings.damageAgents = normalizeDamageAgents(normalized.settings.damageAgents);
    normalized.trees = normalized.trees.map((row) => normalizeTreeRecord(normalizeRecordContext(normalizeSpeciesRecord(row), normalized.settings)));
    normalized.regen = normalized.regen.map((row) => normalizeRecordContext(normalizeSpeciesRecord(row), normalized.settings));
    return normalized;
  }

  function saveState() {
    if (!state.projectId) state.projectId = currentProjectId || makeProjectId();
    currentProjectId = state.projectId;
    state.updatedAt = nowIso();
    if (storageAvailable) {
      localStorage.setItem(projectStateKey(currentProjectId), JSON.stringify(state));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem(ACTIVE_PROJECT_KEY, currentProjectId);
      upsertProjectSummary(state);
    }
  }

  function bindEvents() {
    els.projectSwitcher.addEventListener("change", () => switchProject(els.projectSwitcher.value));
    els.newProjectBtn.addEventListener("click", createProject);
    els.deleteProjectBtn.addEventListener("click", deleteCurrentProjectRecord);
    els.projectName.addEventListener("input", updateSettings);
    els.crewName.addEventListener("input", updateSettings);
    els.crewId.addEventListener("input", updateSettings);
    els.addPlotBtn.addEventListener("click", addPlotFromInput);
    els.newPlotNumber.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addPlotFromInput();
      }
    });
    els.plotSelect.addEventListener("change", () => {
      state.currentPlot = els.plotSelect.value;
      saveState();
      renderAll();
    });
    els.deletePlotBtn.addEventListener("click", deleteCurrentPlot);
    els.siteForm.addEventListener("input", updateCurrentPlot);
    els.siteForm.addEventListener("change", updateCurrentPlot);
    els.captureGpsBtn.addEventListener("click", capturePlotGps);
    els.treeForm.addEventListener("submit", saveTreeRecord);
    els.treeForm.addEventListener("input", updateTreeFormState);
    els.treeForm.addEventListener("change", updateTreeFormState);
    document.getElementById("treeDbh").addEventListener("blur", normalizeTreeDbhInput);
    els.regenForm.addEventListener("submit", saveRegenRecord);
    els.regenForm.addEventListener("input", updateRegenValidation);
    els.regenForm.addEventListener("change", updateRegenValidation);
    els.treeList.addEventListener("click", handleRecordClick);
    els.regenList.addEventListener("click", handleRecordClick);
    els.clearTreeFormBtn.addEventListener("click", clearTreeForm);
    els.clearRegenFormBtn.addEventListener("click", clearRegenForm);
    els.speciesSearch.addEventListener("input", renderFiaSpeciesSelect);
    els.projectSpeciesSearch.addEventListener("input", renderProjectSpeciesList);
    els.treeSpeciesFilter.addEventListener("input", () => populateSpeciesSelect("treeSpecies"));
    els.regenSpeciesFilter.addEventListener("input", () => populateSpeciesSelect("regenSpecies"));
    els.addProjectSpeciesBtn.addEventListener("click", addSelectedProjectSpecies);
    els.resetSpeciesBtn.addEventListener("click", resetProjectSpecies);
    els.clearSpeciesBtn.addEventListener("click", clearProjectSpecies);
    els.saveSpeciesListBtn.addEventListener("click", saveCurrentSpeciesList);
    els.projectSpeciesList.addEventListener("click", removeProjectSpecies);
    els.addDamageAgentBtn.addEventListener("click", addDamageAgent);
    els.damageAgentList.addEventListener("click", removeDamageAgent);
    els.refreshReviewBtn.addEventListener("click", renderReview);
    els.reviewList.addEventListener("click", handleReviewClick);
    els.exportCrewPackageBtn.addEventListener("click", exportCrewPackage);
    els.exportPlotWeaselBtn.addEventListener("click", exportPlotWeaselCsv);
    els.saveCsvFolderBtn.addEventListener("click", saveCsvsToFolder);
    els.downloadBackupBtn.addEventListener("click", exportBackup);
    els.restoreBackupInput.addEventListener("change", restoreBackup);
    els.importCrewPackages.addEventListener("change", importCrewPackages);
    els.exportProjectSetupBtn.addEventListener("click", exportProjectSetup);
    els.importProjectSetupInput.addEventListener("change", importProjectSetup);
    els.clearAllBtn.addEventListener("click", clearAllData);

    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => activateTab(tab.dataset.tab));
    });
  }

  function populateStaticSelects() {
    populateSelect("aspect", LOOKUPS.aspect, "");
    populateSelect("slopePosition", LOOKUPS.slopePosition, "");
    populateSpeciesDropdowns();
    renderFiaSpeciesSelect();
    populateDamageSelects();
    populateSelect("treeSnagClass", LOOKUPS.decayClass, "");
    populateSelect("regenDiameterClass", LOOKUPS.diameterClass, "");
    populateSelect("regenHeightClass", LOOKUPS.heightClass, "");
  }

  function populateSelect(id, values, placeholder) {
    const select = document.getElementById(id);
    select.innerHTML = "";
    addOption(select, "", placeholder);
    values.forEach((value) => addOption(select, optionValue(value), optionLabel(value)));
  }

  function optionValue(value) {
    return value && typeof value === "object" ? clean(value.value) : value;
  }

  function optionLabel(value) {
    return value && typeof value === "object" ? clean(value.label) : value;
  }

  function populateSpeciesDropdowns() {
    populateSpeciesSelect("treeSpecies");
    populateSpeciesSelect("regenSpecies");
  }

  function populateSpeciesSelect(id) {
    const select = document.getElementById(id);
    const current = select.value;
    const query = speciesSelectQuery(id);
    let rows = projectSpeciesRows().filter((row) => matchesSpeciesQuery(row, query));
    const currentRow = current ? speciesByCode(current) : null;
    if (currentRow && !rows.some((row) => row.code === current)) {
      rows = [currentRow].concat(rows);
    }
    select.innerHTML = "";
    addOption(select, "", rows.length ? "Select species" : "No project species match");
    rows.forEach((row) => {
      addOption(select, row.code, `${row.name} (${row.code})`);
    });
    if (current && rows.some((row) => row.code === current)) {
      select.value = current;
    }
  }

  function renderFiaSpeciesSelect() {
    const query = clean(els.speciesSearch ? els.speciesSearch.value : "").toLowerCase();
    const selected = codeLookup(state ? state.settings.projectSpeciesCodes : DEFAULT_PROJECT_SPECIES_CODES);
    const rows = FIA_SPECIES
      .filter((row) => !selected[row.code])
      .filter((row) => {
        if (!query) return true;
        return contains(row.name.toLowerCase(), query) || contains(row.code, query);
      });
    els.fiaSpeciesSelect.innerHTML = "";
    addOption(els.fiaSpeciesSelect, "", rows.length ? "Select FIA species" : "No matches");
    rows.forEach((row) => addOption(els.fiaSpeciesSelect, row.code, `${row.name} (${row.code})`));
  }

  function renderProjectSpeciesList() {
    const allRows = projectSpeciesRows();
    const query = clean(els.projectSpeciesSearch ? els.projectSpeciesSearch.value : "").toLowerCase();
    const rows = allRows.filter((row) => matchesSpeciesQuery(row, query));
    if (!allRows.length) {
      els.projectSpeciesList.innerHTML = '<div class="empty">No project species selected.</div>';
      return;
    }
    if (!rows.length) {
      els.projectSpeciesList.innerHTML = '<div class="empty">No species match that search.</div>';
      return;
    }
    els.projectSpeciesList.innerHTML = rows.map((row) => `
      <div class="species-row">
        <div>
          <strong>${escapeHtml(row.name)}</strong>
          <span>FIA ${escapeHtml(row.code)}</span>
        </div>
        <button class="danger" type="button" data-remove-species="${escapeHtml(row.code)}">Remove</button>
      </div>
    `).join("");
  }

  function renderSavedSpeciesListControls() {
    const codes = savedSpeciesCodes();
    const count = codes.length;
    els.resetSpeciesBtn.disabled = !count;
    if (!els.savedSpeciesListStatus) return;
    if (!count) {
      els.savedSpeciesListStatus.textContent = "No saved species list yet. Add species to the current list, then choose Save Species List.";
      return;
    }
    const when = state.settings.savedSpeciesSavedAt ? ` Saved ${formatProjectTime(state.settings.savedSpeciesSavedAt)}.` : "";
    els.savedSpeciesListStatus.textContent = `Saved species list: ${count} species.${when} Save again any time to overwrite it.`;
  }

  function savedSpeciesCodes() {
    return normalizeSpeciesCodes(state.settings.savedSpeciesCodes);
  }

  function saveCurrentSpeciesList() {
    const codes = normalizeSpeciesCodes(state.settings.projectSpeciesCodes);
    if (!codes.length) {
      setBanner("warn", "No species selected", "Add species to the current project dropdown before saving the species list.");
      return;
    }
    state.settings.savedSpeciesCodes = codes;
    state.settings.savedSpeciesSavedAt = nowIso();
    state.settings.savedSpeciesLists = [];
    saveState();
    renderSavedSpeciesListControls();
    setBanner("success", "Species list saved", `Saved ${codes.length} species. Edit the current list and save again to overwrite it.`);
  }

  function resetProjectSpecies() {
    const codes = savedSpeciesCodes();
    if (!codes.length) {
      setBanner("warn", "No saved species list", "Add species and choose Save Species List before restoring.");
      renderSavedSpeciesListControls();
      return;
    }
    state.settings.projectSpeciesCodes = codes;
    saveState();
    populateSpeciesDropdowns();
    renderFiaSpeciesSelect();
    renderProjectSpeciesList();
    renderSavedSpeciesListControls();
    setBanner("success", "Species list restored", "The saved species list is now the project dropdown.");
  }

  function populateDamageSelects() {
    const values = normalizeDamageAgents(state ? state.settings.damageAgents : DEFAULT_DAMAGE_AGENTS);
    populateSelect("treeDamage", values, "");
    populateSelect("regenDamage", values, "");
  }

  function renderDamageAgentList() {
    const rows = normalizeDamageAgents(state.settings.damageAgents);
    els.damageAgentList.innerHTML = rows.map((name) => {
      const removable = name !== "None" && name !== "Broken Top";
      return `
        <div class="species-row compact-row">
          <div>
            <strong>${escapeHtml(name)}</strong>
            <span>${removable ? "Project option" : "Required option"}</span>
          </div>
          <button class="danger" type="button" data-remove-damage="${escapeHtml(name)}" ${removable ? "" : "disabled"}>Remove</button>
        </div>
      `;
    }).join("");
  }

  function addDamageAgent() {
    const name = clean(els.damageAgentInput.value);
    if (!name) {
      setBanner("warn", "Damage agent needed", "Type a damage agent name first.");
      return;
    }
    const values = normalizeDamageAgents(state.settings.damageAgents.concat(name));
    state.settings.damageAgents = values;
    els.damageAgentInput.value = "";
    saveState();
    populateDamageSelects();
    renderDamageAgentList();
    updateTreeFormState();
    setBanner("success", "Damage agent added", `${name} is now available for this project.`);
  }

  function removeDamageAgent(event) {
    const name = event.target.dataset.removeDamage;
    if (!name || name === "None" || name === "Broken Top") return;
    const used = state.trees.some((row) => row.damageAgents === name) || state.regen.some((row) => row.damageAgents === name);
    if (used) {
      setBanner("warn", "Damage agent in use", "This damage agent is already used in saved records, so it stays available.");
      return;
    }
    state.settings.damageAgents = normalizeDamageAgents(state.settings.damageAgents.filter((item) => item !== name));
    saveState();
    populateDamageSelects();
    renderDamageAgentList();
  }

  function speciesSelectQuery(id) {
    const filterId = id === "treeSpecies" ? "treeSpeciesFilter" : id === "regenSpecies" ? "regenSpeciesFilter" : "";
    return filterId && els[filterId] ? clean(els[filterId].value).toLowerCase() : "";
  }

  function matchesSpeciesQuery(row, query) {
    if (!query) return true;
    return contains(row.name.toLowerCase(), query) || contains(row.code, query);
  }

  function addSelectedProjectSpecies() {
    const code = clean(els.fiaSpeciesSelect.value);
    if (!code || !hasSpeciesCode(code)) {
      setBanner("warn", "Species needed", "Search and select a FIA species first.");
      return;
    }
    addProjectSpeciesCode(code);
    setBanner("success", "Species added", speciesByCode(code).name + " is now in the project dropdown.");
  }

  function addProjectSpeciesCode(code) {
    const next = normalizeSpeciesCodes(state.settings.projectSpeciesCodes.concat(code));
    state.settings.projectSpeciesCodes = next;
    saveState();
    populateSpeciesDropdowns();
    renderFiaSpeciesSelect();
    renderProjectSpeciesList();
    renderCounts();
  }

  function removeProjectSpecies(event) {
    const code = event.target.dataset.removeSpecies;
    if (!code) return;
    state.settings.projectSpeciesCodes = normalizeSpeciesCodes(state.settings.projectSpeciesCodes.filter((item) => item !== code));
    saveState();
    populateSpeciesDropdowns();
    renderFiaSpeciesSelect();
    renderProjectSpeciesList();
  }

  function clearProjectSpecies() {
    const ok = window.confirm("Clear the project species dropdown? Saved tree and regen records will not be deleted.");
    if (!ok) return;
    state.settings.projectSpeciesCodes = [];
    saveState();
    populateSpeciesDropdowns();
    renderFiaSpeciesSelect();
    renderProjectSpeciesList();
    setBanner("success", "Species list cleared", "The project dropdown is empty. Saved tree and regen records were not deleted.");
  }

  function projectSpeciesRows() {
    return normalizeSpeciesCodes(state.settings.projectSpeciesCodes)
      .map((code) => speciesByCode(code))
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }

  function addOption(select, value, label) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  }

  function hydrateSettings() {
    els.projectName.value = state.settings.projectName || "";
    els.crewName.value = state.settings.crewName || "";
    els.crewId.value = state.settings.crewId || "";
    updateDocumentTitle();
  }

  function updateSettings() {
    const previousProjectName = clean(state.settings.projectName);
    state.settings.projectName = els.projectName.value.trim();
    state.settings.crewName = els.crewName.value.trim();
    state.settings.crewId = els.crewId.value.trim();
    applyProjectNameToExistingRecords(previousProjectName, state.settings.projectName);
    saveState();
    renderProjectManager();
    updateDocumentTitle();
    renderCounts();
  }

  function addPlotFromInput() {
    const plot = clean(els.newPlotNumber.value);
    if (!plot) {
      setBanner("warn", "Plot needed", "Enter a plot number first.");
      return;
    }
    if (!state.plots[plot]) {
      state.plots[plot] = {
        id: `plot-${plot}`,
        plot,
        measurementDate: today(),
        projectName: state.settings.projectName,
        crewName: state.settings.crewName,
        elevation: "",
        slope: "",
        aspect: "",
        slopePosition: "",
        soilType: "",
        habitatType: "",
        siteIndex: "",
        roadAccess: "",
        loggingSystem: "",
        forestSoils: "",
        utmEasting: "",
        utmNorthing: "",
        utmZone: "",
        gpsAccuracy: "",
        gpsFixCount: "",
        gpsLatitude: "",
        gpsLongitude: "",
        siteNotes: "",
        crewId: state.settings.crewId,
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
    }
    state.currentPlot = plot;
    els.newPlotNumber.value = "";
    saveState();
    renderAll();
    setBanner("success", "Plot active", `Plot ${plot} is ready.`);
  }

  function deleteCurrentPlot() {
    const plot = state.currentPlot;
    if (!plot) return;
    const count = state.trees.filter((row) => row.plot === plot).length + state.regen.filter((row) => row.plot === plot).length;
    const ok = window.confirm(`Delete plot ${plot} and ${count} related records from this device?`);
    if (!ok) return;
    delete state.plots[plot];
    state.trees = state.trees.filter((row) => row.plot !== plot);
    state.regen = state.regen.filter((row) => row.plot !== plot);
    state.currentPlot = firstPlotKey();
    saveState();
    renderAll();
    setBanner("success", "Plot deleted", `Plot ${plot} was removed from this device.`);
  }

  function updateCurrentPlot() {
    const plot = currentPlot();
    if (!plot) return;
    updateAspectOptions();
    SITE_FIELDS.forEach((field) => {
      plot[field] = document.getElementById(field).value;
    });
    plot.projectName = state.settings.projectName;
    plot.crewName = state.settings.crewName;
    plot.crewId = state.settings.crewId;
    plot.updatedAt = nowIso();
    saveState();
    validateSiteForm(false);
    renderCounts();
  }

  function currentPlot() {
    return state.currentPlot ? state.plots[state.currentPlot] : null;
  }

  function firstPlotKey() {
    return Object.keys(state.plots).sort(compareMixed)[0] || "";
  }

  function saveTreeRecord(event) {
    event.preventDefault();
    const plot = currentPlot();
    if (!plot) {
      setBanner("warn", "No plot", "Add or select a plot before saving tree records.");
      return;
    }
    normalizeTreeDbhInput();
    updateTreeFormState();
    const validation = validateTreeForm(true);
    if (!validation.valid) {
      setBanner("warn", "Tree review", validation.messages[0]);
      return;
    }
    const species = speciesFromCode(document.getElementById("treeSpecies").value);
    const dbh = clean(document.getElementById("treeDbh").value);
    const ht = clean(document.getElementById("treeHt").value);
    const actualht = clean(document.getElementById("treeActualHt").value);
    const damageAgents = clean(document.getElementById("treeDamage").value) || "None";
    const decayClass = clean(document.getElementById("treeSnagClass").value);
    const liveDead = clean(document.getElementById("treeStatus").value) || "Live";
    const isDead = liveDead === "Dead";

    const id = document.getElementById("treeRecordId").value || makeId("tree");
    const record = {
      id,
      plot: plot.plot,
      projectName: state.settings.projectName,
      crewName: state.settings.crewName,
      spp: species.name,
      sppCode: species.code,
      dbh,
      ht,
      actualht: isDead ? "" : actualht,
      cull: isDead ? "" : clean(document.getElementById("treeCull").value),
      crownRatio: isDead ? "" : clean(document.getElementById("treeCrownRatio").value),
      age: isDead ? "" : clean(document.getElementById("treeAge").value),
      damageAgents,
      decayClass: isDead ? decayClass : "",
      liveDead,
      notes: clean(document.getElementById("treeNotes").value),
      crewId: state.settings.crewId,
      updatedAt: nowIso()
    };

    const existing = state.trees.findIndex((row) => row.id === id);
    if (existing >= 0) {
      state.trees[existing] = mergeObjects(state.trees[existing], record);
    } else {
      record.createdAt = nowIso();
      state.trees.push(record);
    }
    saveState();
    clearTreeForm();
    renderAll();
    setBanner("success", "Tree saved", `${record.spp} saved for plot ${record.plot}.`);
  }

  function saveRegenRecord(event) {
    event.preventDefault();
    const plot = currentPlot();
    if (!plot) {
      setBanner("warn", "No plot", "Add or select a plot before saving regen records.");
      return;
    }
    const validation = validateRegenForm(true);
    if (!validation.valid) {
      setBanner("warn", "Regen review", validation.messages[0]);
      return;
    }
    const species = speciesFromCode(document.getElementById("regenSpecies").value);
    const stemCount = clean(document.getElementById("regenStemCount").value);

    const id = document.getElementById("regenRecordId").value || makeId("regen");
    const record = {
      id,
      plot: plot.plot,
      projectName: state.settings.projectName,
      crewName: state.settings.crewName,
      spp: species.name,
      sppCode: species.code,
      stemCount,
      diameterClass: clean(document.getElementById("regenDiameterClass").value),
      heightClass: clean(document.getElementById("regenHeightClass").value),
      damageAgents: clean(document.getElementById("regenDamage").value) || "None",
      notes: clean(document.getElementById("regenNotes").value),
      crewId: state.settings.crewId,
      updatedAt: nowIso()
    };

    const existing = state.regen.findIndex((row) => row.id === id);
    if (existing >= 0) {
      state.regen[existing] = mergeObjects(state.regen[existing], record);
    } else {
      record.createdAt = nowIso();
      state.regen.push(record);
    }
    saveState();
    clearRegenForm();
    renderAll();
    setBanner("success", "Regen saved", `${record.spp} saved for plot ${record.plot}.`);
  }

  function handleRecordClick(event) {
    const action = event.target.dataset.action;
    const id = event.target.dataset.id;
    if (!action || !id) return;
    if (action === "edit-tree") editTree(id);
    if (action === "delete-tree") deleteTree(id);
    if (action === "edit-regen") editRegen(id);
    if (action === "delete-regen") deleteRegen(id);
  }

  function editTree(id) {
    const row = findById(state.trees, id);
    if (!row) return;
    state.currentPlot = row.plot;
    renderPlotSelect();
    if (row.sppCode) addProjectSpeciesCode(row.sppCode);
    els.treeSpeciesFilter.value = "";
    populateSpeciesSelect("treeSpecies");
    document.getElementById("treeRecordId").value = row.id;
    document.getElementById("treeSpecies").value = row.sppCode || speciesCode(row.spp);
    document.getElementById("treeStatus").value = row.liveDead || "Live";
    document.getElementById("treeDbh").value = row.dbh || "";
    document.getElementById("treeHt").value = row.ht || "";
    document.getElementById("treeActualHt").value = row.actualht || "";
    document.getElementById("treeCull").value = row.cull || "0";
    document.getElementById("treeCrownRatio").value = row.crownRatio || "";
    document.getElementById("treeAge").value = row.age || "";
    document.getElementById("treeDamage").value = row.damageAgents || "";
    document.getElementById("treeSnagClass").value = row.decayClass || legacyDecayCode(row.snagClass) || "";
    document.getElementById("treeNotes").value = row.notes || "";
    activateTab("treePanel");
    updateTreeFormState();
  }

  function deleteTree(id) {
    state.trees = state.trees.filter((row) => row.id !== id);
    saveState();
    renderAll();
  }

  function editRegen(id) {
    const row = findById(state.regen, id);
    if (!row) return;
    state.currentPlot = row.plot;
    renderPlotSelect();
    if (row.sppCode) addProjectSpeciesCode(row.sppCode);
    els.regenSpeciesFilter.value = "";
    populateSpeciesSelect("regenSpecies");
    document.getElementById("regenRecordId").value = row.id;
    document.getElementById("regenSpecies").value = row.sppCode || speciesCode(row.spp);
    document.getElementById("regenStemCount").value = row.stemCount || "1";
    document.getElementById("regenDiameterClass").value = row.diameterClass || "";
    document.getElementById("regenHeightClass").value = row.heightClass || "";
    document.getElementById("regenDamage").value = row.damageAgents || "";
    document.getElementById("regenNotes").value = row.notes || "";
    activateTab("regenPanel");
    updateRegenValidation();
  }

  function deleteRegen(id) {
    state.regen = state.regen.filter((row) => row.id !== id);
    saveState();
    renderAll();
  }

  function clearTreeForm() {
    els.treeForm.reset();
    els.treeSpeciesFilter.value = "";
    document.getElementById("treeRecordId").value = "";
    document.getElementById("treeCull").value = "";
    document.getElementById("treeStatus").value = "Live";
    document.getElementById("treeDamage").value = "None";
    populateSpeciesSelect("treeSpecies");
    updateTreeFormState();
  }

  function clearRegenForm() {
    els.regenForm.reset();
    els.regenSpeciesFilter.value = "";
    document.getElementById("regenRecordId").value = "";
    document.getElementById("regenStemCount").value = "";
    populateSpeciesSelect("regenSpecies");
    updateRegenValidation();
  }

  function renderProjectManager() {
    const summaries = normalizeProjectIndex(loadProjectIndex().concat(projectSummary(state)));
    els.projectSwitcher.innerHTML = "";
    summaries.forEach((project) => addOption(els.projectSwitcher, project.id, projectOptionLabel(project)));
    els.projectSwitcher.value = currentProjectId || state.projectId || "";
    els.projectSwitcher.disabled = !storageAvailable || summaries.length < 2;
    els.deleteProjectBtn.disabled = !storageAvailable || !currentProjectId;
    const current = summaries.find((project) => project.id === (currentProjectId || state.projectId)) || projectSummary(state);
    els.projectSummary.textContent = `${current.name} - ${current.plotCount} plots, ${current.treeCount} trees, ${current.regenCount} regen. Updated ${formatProjectTime(current.updatedAt)}.`;
    updateProjectUrl();
  }

  function projectOptionLabel(project) {
    return `${project.name} - ${project.plotCount} plots, ${project.treeCount} trees, ${project.regenCount} regen`;
  }

  function switchProject(projectId) {
    const nextId = clean(projectId);
    if (!nextId || nextId === currentProjectId) return;
    saveState();
    const next = loadProjectState(nextId);
    if (!next) {
      setBanner("error", "Project not found", "That project could not be opened from this browser's local storage.");
      renderProjectManager();
      return;
    }
    state = next;
    currentProjectId = next.projectId;
    if (storageAvailable) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, currentProjectId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    clearTreeForm();
    clearRegenForm();
    renderAll();
    setBanner("success", "Project opened", `${state.settings.projectName || "Untitled Project"} is now active.`);
  }

  function createProject() {
    const previousSettings = state.settings || {};
    const name = clean(window.prompt("New project name:", ""));
    if (!name) return;
    saveState();
    const next = defaultState();
    next.settings.projectName = name;
    next.settings.crewName = clean(previousSettings.crewName);
    next.settings.crewId = clean(previousSettings.crewId);
    state = next;
    currentProjectId = next.projectId;
    saveState();
    clearTreeForm();
    clearRegenForm();
    renderAll();
    setBanner("success", "New project created", `${name} is now active. The previous project is still saved on this device.`);
  }

  function deleteCurrentProjectRecord() {
    if (!storageAvailable || !currentProjectId) return;
    const summary = projectSummary(state);
    const ok = window.confirm(`Delete "${summary.name}" from this device? This deletes its plots, tree records, regen records, and project settings from this browser.`);
    if (!ok) return;
    localStorage.removeItem(projectStateKey(currentProjectId));
    const remaining = loadProjectIndex().filter((project) => project.id !== currentProjectId);
    saveProjectIndex(remaining);
    if (remaining.length) {
      state = loadProjectState(remaining[0].id) || defaultState();
      currentProjectId = state.projectId;
      localStorage.setItem(ACTIVE_PROJECT_KEY, currentProjectId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      state = defaultState();
      currentProjectId = state.projectId;
      saveState();
    }
    clearTreeForm();
    clearRegenForm();
    renderAll();
    setBanner("success", "Project deleted", remaining.length ? "The next saved project is now active." : "A blank project is now active.");
  }

  function renderAll() {
    if (!state.currentPlot || !state.plots[state.currentPlot]) {
      state.currentPlot = firstPlotKey();
    }
    hydrateSettings();
    renderProjectManager();
    renderPlotSelect();
    populateSpeciesDropdowns();
    renderFiaSpeciesSelect();
    renderProjectSpeciesList();
    renderSavedSpeciesListControls();
    populateDamageSelects();
    renderDamageAgentList();
    renderSiteForm();
    renderTreeList();
    renderRegenList();
    renderCounts();
    renderReview();
    updateTreeFormState();
    updateRegenValidation();
  }

  function renderPlotSelect() {
    const keys = Object.keys(state.plots).sort(compareMixed);
    els.plotSelect.innerHTML = "";
    if (!keys.length) {
      addOption(els.plotSelect, "", "No plots yet");
      els.plotSelect.disabled = true;
      return;
    }
    els.plotSelect.disabled = false;
    keys.forEach((plot) => addOption(els.plotSelect, plot, `Plot ${plot}`));
    els.plotSelect.value = state.currentPlot || keys[0];
  }

  function renderSiteForm() {
    const plot = currentPlot();
    const disabled = !plot;
    SITE_FIELDS.forEach((field) => {
      const input = document.getElementById(field);
      input.disabled = disabled;
      input.value = plot ? (plot[field] || "") : "";
    });
    updateAspectOptions();
    validateSiteForm(false);
    els.deletePlotBtn.disabled = disabled;
    els.captureGpsBtn.disabled = disabled || gpsCapture !== null;
    els.gpsStatus.textContent = gpsStatusText(plot, disabled);
    if (!plot) {
      setBanner("warn", "No plot selected", "Add a plot to start entering field data.");
    }
  }

  function capturePlotGps() {
    const plot = currentPlot();
    if (!plot) {
      setBanner("warn", "No plot", "Add or select a plot before capturing GPS.");
      return;
    }
    if (!hasAppInventorBridge() && !navigator.geolocation) {
      setBanner("warn", "GPS unavailable", "This browser does not expose device location. Enter UTM values manually.");
      return;
    }
    if (gpsCapture) return;

    const started = Date.now();
    gpsCapture = {
      started,
      fixes: [],
      watchId: null,
      timerId: null,
      intervalId: null,
      plot: plot.plot,
      provider: hasAppInventorBridge() ? "appinventor" : "browser"
    };
    els.captureGpsBtn.disabled = true;
    els.gpsStatus.textContent = "Starting GPS capture. Approve the location prompt if the tablet asks.";
    setBanner("warn", "GPS capture started", `Hold the tablet at plot center for ${GPS_CAPTURE_SECONDS} seconds.`);

    const finish = () => finishGpsCapture(false);
    const tick = () => updateGpsProgress();
    gpsCapture.intervalId = window.setInterval(tick, 1000);
    gpsCapture.timerId = window.setTimeout(finish, GPS_CAPTURE_SECONDS * 1000);

    if (gpsCapture.provider === "appinventor") {
      requestAppInventorGpsStart(plot.plot);
      return;
    }

    try {
      gpsCapture.watchId = navigator.geolocation.watchPosition(
        addGpsFix,
        handleGpsError,
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 15000
        }
      );
    } catch (error) {
      finishGpsCapture(true, error.message);
    }
  }

  function addGpsFix(position) {
    if (!gpsCapture || !position || !position.coords) return;
    const coords = position.coords;
    const latitude = Number(coords.latitude);
    const longitude = Number(coords.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    gpsCapture.fixes.push({
      latitude,
      longitude,
      accuracy: Number.isFinite(Number(coords.accuracy)) ? Number(coords.accuracy) : null,
      altitude: coords.altitude == null ? null : Number(coords.altitude),
      altitudeAccuracy: coords.altitudeAccuracy == null ? null : Number(coords.altitudeAccuracy),
      timestamp: position.timestamp || Date.now()
    });
    updateGpsProgress();
  }

  function receiveNativeGpsFix(fix) {
    if (!gpsCapture || !fix) return;
    const data = typeof fix === "string" ? parseJsonSafe(fix) : fix;
    if (!data) return;
    addGpsFix({
      coords: {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        altitude: data.altitude,
        altitudeAccuracy: data.altitudeAccuracy
      },
      timestamp: data.timestamp || Date.now()
    });
  }

  function handleGpsError(error) {
    const message = gpsErrorMessage(error);
    if (gpsCapture && gpsCapture.fixes.length) {
      els.gpsStatus.textContent = `${message} Using ${gpsCapture.fixes.length} fixes already collected.`;
      return;
    }
    finishGpsCapture(true, message);
  }

  function updateGpsProgress() {
    if (!gpsCapture) return;
    const elapsed = Math.min(GPS_CAPTURE_SECONDS, Math.floor((Date.now() - gpsCapture.started) / 1000));
    const remaining = Math.max(0, GPS_CAPTURE_SECONDS - elapsed);
    const fixCount = gpsCapture.fixes.length;
    const lastAccuracy = lastGpsAccuracy(gpsCapture.fixes);
    els.gpsStatus.textContent = `Capturing GPS: ${remaining}s left, ${fixCount} fix${fixCount === 1 ? "" : "es"} collected${lastAccuracy ? ", last accuracy " + lastAccuracy + " m" : ""}.`;
  }

  function finishGpsCapture(failed, message) {
    if (!gpsCapture) return;
    const capture = gpsCapture;
    if (capture.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(capture.watchId);
    }
    if (capture.provider === "appinventor") {
      notifyAppInventorGpsStop(capture.plot);
    }
    window.clearTimeout(capture.timerId);
    window.clearInterval(capture.intervalId);
    gpsCapture = null;
    els.captureGpsBtn.disabled = !currentPlot();

    if (failed || !capture.fixes.length) {
      const detail = message || "No GPS fixes were collected.";
      els.gpsStatus.textContent = `${detail} Enter UTM values manually if needed.`;
      setBanner("warn", "GPS not saved", detail);
      return;
    }

    const target = state.plots[capture.plot] || currentPlot();
    if (!target) return;
    const averaged = averageGpsFixes(capture.fixes);
    const utm = latLonToUtm(averaged.latitude, averaged.longitude);
    target.utmEasting = formatNumber(utm.easting, 0);
    target.utmNorthing = formatNumber(utm.northing, 0);
    target.utmZone = `${utm.zoneNumber}${utm.zoneLetter}`;
    target.gpsAccuracy = formatNumber(averaged.accuracy, 1);
    target.gpsFixCount = String(capture.fixes.length);
    target.gpsLatitude = formatNumber(averaged.latitude, 6);
    target.gpsLongitude = formatNumber(averaged.longitude, 6);
    const elevationText = applyGpsElevation(target, averaged);
    target.updatedAt = nowIso();
    saveState();
    renderSiteForm();
    renderCounts();
    setBanner("success", "GPS saved", `Plot ${target.plot}: ${target.utmZone} ${target.utmEasting}E ${target.utmNorthing}N from ${capture.fixes.length} fixes${elevationText}.`);
  }

  function averageGpsFixes(fixes) {
    const good = fixes.filter((fix) => Number.isFinite(fix.latitude) && Number.isFinite(fix.longitude));
    const total = good.reduce((sum, fix) => {
      sum.latitude += fix.latitude;
      sum.longitude += fix.longitude;
      if (Number.isFinite(fix.accuracy)) {
        sum.accuracy += fix.accuracy;
        sum.accuracyCount += 1;
      }
      if (Number.isFinite(fix.altitude)) {
        sum.altitude += fix.altitude;
        sum.altitudeCount += 1;
      }
      if (Number.isFinite(fix.altitudeAccuracy)) {
        sum.altitudeAccuracy += fix.altitudeAccuracy;
        sum.altitudeAccuracyCount += 1;
      }
      return sum;
    }, {
      latitude: 0,
      longitude: 0,
      accuracy: 0,
      accuracyCount: 0,
      altitude: 0,
      altitudeCount: 0,
      altitudeAccuracy: 0,
      altitudeAccuracyCount: 0
    });
    return {
      latitude: total.latitude / good.length,
      longitude: total.longitude / good.length,
      accuracy: total.accuracyCount ? total.accuracy / total.accuracyCount : null,
      altitude: total.altitudeCount ? total.altitude / total.altitudeCount : null,
      altitudeCount: total.altitudeCount,
      altitudeAccuracy: total.altitudeAccuracyCount ? total.altitudeAccuracy / total.altitudeAccuracyCount : null
    };
  }

  function applyGpsElevation(plot, averaged) {
    if (!averaged || !Number.isFinite(averaged.altitude)) {
      return "; GPS elevation unavailable";
    }
    const feet = metersToFeet(averaged.altitude);
    plot.elevation = formatNumber(feet, 0);
    const accuracy = Number.isFinite(averaged.altitudeAccuracy)
      ? `, vertical accuracy ${formatNumber(metersToFeet(averaged.altitudeAccuracy), 0)} ft`
      : "";
    return `; elevation ${plot.elevation} ft from ${averaged.altitudeCount} altitude fix${averaged.altitudeCount === 1 ? "" : "es"}${accuracy}`;
  }

  function metersToFeet(value) {
    return Number(value) * 3.280839895;
  }

  function hasAppInventorBridge() {
    return !!(nativeGpsBridgeEnabled && window.AppInventor && typeof window.AppInventor.setWebViewString === "function");
  }

  function enableNativeGpsBridge() {
    nativeGpsBridgeEnabled = true;
    return true;
  }

  function requestAppInventorGpsStart(plot) {
    setAppInventorCommand(`PW_GPS_START|${GPS_CAPTURE_SECONDS}|${clean(plot)}`);
    els.gpsStatus.textContent = `Capturing GPS through the installed app wrapper for ${GPS_CAPTURE_SECONDS} seconds.`;
  }

  function notifyAppInventorGpsStop(plot) {
    setAppInventorCommand(`PW_GPS_STOP|${clean(plot)}`);
  }

  function setAppInventorCommand(command) {
    try {
      if (hasAppInventorBridge()) window.AppInventor.setWebViewString(command);
    } catch (error) {
      // App Inventor bridge errors should not break manual entry or browser GPS.
    }
  }

  function parseJsonSafe(value) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  function latLonToUtm(latitude, longitude) {
    const a = 6378137;
    const eccSquared = 0.00669438;
    const k0 = 0.9996;
    const latRad = degreesToRadians(latitude);
    const lonRad = degreesToRadians(longitude);
    const zoneNumber = Math.floor((longitude + 180) / 6) + 1;
    const lonOrigin = (zoneNumber - 1) * 6 - 180 + 3;
    const lonOriginRad = degreesToRadians(lonOrigin);
    const eccPrimeSquared = eccSquared / (1 - eccSquared);
    const n = a / Math.sqrt(1 - eccSquared * Math.sin(latRad) * Math.sin(latRad));
    const t = Math.tan(latRad) * Math.tan(latRad);
    const c = eccPrimeSquared * Math.cos(latRad) * Math.cos(latRad);
    const aa = Math.cos(latRad) * (lonRad - lonOriginRad);
    const m = a * (
      (1 - eccSquared / 4 - 3 * eccSquared * eccSquared / 64 - 5 * Math.pow(eccSquared, 3) / 256) * latRad
      - (3 * eccSquared / 8 + 3 * eccSquared * eccSquared / 32 + 45 * Math.pow(eccSquared, 3) / 1024) * Math.sin(2 * latRad)
      + (15 * eccSquared * eccSquared / 256 + 45 * Math.pow(eccSquared, 3) / 1024) * Math.sin(4 * latRad)
      - (35 * Math.pow(eccSquared, 3) / 3072) * Math.sin(6 * latRad)
    );
    let easting = k0 * n * (
      aa + (1 - t + c) * Math.pow(aa, 3) / 6
      + (5 - 18 * t + t * t + 72 * c - 58 * eccPrimeSquared) * Math.pow(aa, 5) / 120
    ) + 500000;
    let northing = k0 * (
      m + n * Math.tan(latRad) * (
        aa * aa / 2
        + (5 - t + 9 * c + 4 * c * c) * Math.pow(aa, 4) / 24
        + (61 - 58 * t + t * t + 600 * c - 330 * eccPrimeSquared) * Math.pow(aa, 6) / 720
      )
    );
    if (latitude < 0) northing += 10000000;
    easting = Math.max(100000, Math.min(999999, easting));
    return {
      easting,
      northing,
      zoneNumber,
      zoneLetter: utmZoneLetter(latitude)
    };
  }

  function utmZoneLetter(latitude) {
    if (latitude < -80 || latitude > 84) return "";
    const letters = "CDEFGHJKLMNPQRSTUVWX";
    const index = Math.min(letters.length - 1, Math.floor((latitude + 80) / 8));
    return letters.charAt(index);
  }

  function degreesToRadians(value) {
    return value * Math.PI / 180;
  }

  function gpsErrorMessage(error) {
    if (!error) return "Location could not be captured.";
    if (error.code === 1) return "Location permission was denied.";
    if (error.code === 2) return "The tablet could not determine its location.";
    if (error.code === 3) return "GPS timed out before a fix was returned.";
    return error.message || "Location could not be captured.";
  }

  function gpsStatusText(plot, disabled) {
    if (disabled) return "Add or select a plot before capturing GPS.";
    if (gpsCapture) return "GPS capture is running.";
    if (plot && plot.utmEasting && plot.utmNorthing && plot.utmZone) {
      const details = plot.gpsFixCount ? ` from ${plot.gpsFixCount} GPS fixes` : "";
      return `Saved: ${plot.utmZone} ${plot.utmEasting}E ${plot.utmNorthing}N${details}.`;
    }
    return "Use Capture GPS at plot center, or enter UTM values manually.";
  }

  window.PlotWeaselFieldLogger = mergeObjects(window.PlotWeaselFieldLogger || {}, {
    enableNativeGpsBridge,
    receiveNativeGpsFix
  });

  function lastGpsAccuracy(fixes) {
    for (let index = fixes.length - 1; index >= 0; index -= 1) {
      if (Number.isFinite(fixes[index].accuracy)) return formatNumber(fixes[index].accuracy, 1);
    }
    return "";
  }

  function updateAspectOptions() {
    const slopeInput = document.getElementById("slope");
    const aspectSelect = document.getElementById("aspect");
    if (!slopeInput || !aspectSelect) return;
    const current = aspectSelect.value;
    const slope = numberFromValue(slopeInput.value);
    let values = LOOKUPS.aspect.slice();
    if (slope !== null && slope <= 5) {
      values = [LEVEL_ASPECT];
    } else if (slope !== null && slope > 5) {
      values = LOOKUPS.aspect.filter((value) => value !== LEVEL_ASPECT);
    }
    aspectSelect.innerHTML = "";
    addOption(aspectSelect, "", "");
    values.forEach((value) => addOption(aspectSelect, value, value));
    if (current && values.indexOf(current) >= 0) {
      aspectSelect.value = current;
    } else if (slope !== null && slope <= 5) {
      aspectSelect.value = LEVEL_ASPECT;
    }
  }

  function validateSiteForm(showRequired) {
    clearFieldError("slope");
    clearFieldError("aspect");
    const slope = numberFromValue(document.getElementById("slope").value);
    const aspect = clean(document.getElementById("aspect").value);
    const messages = [];
    if (clean(document.getElementById("slope").value) && slope === null) {
      messages.push("Slope must be a number.");
      setFieldError("slope", "Enter a number.");
    }
    if (slope !== null && slope <= 5 && aspect && aspect !== LEVEL_ASPECT) {
      messages.push("Slope 5% or less can only use Level aspect.");
      setFieldError("aspect", "Use Level for slopes 5% or less.");
    }
    if (slope !== null && slope > 5 && aspect === LEVEL_ASPECT) {
      messages.push("Level aspect can only be used when slope is 5% or less.");
      setFieldError("aspect", "Level is only for slope 5% or less.");
    }
    return { valid: !messages.length, messages };
  }

  function siteValidationMessages(plot) {
    const out = [];
    const slope = numberFromValue(plot.slope);
    const aspect = clean(plot.aspect);
    if (clean(plot.slope) && slope === null) {
      out.push({ level: "error", field: "slope", message: "Slope must be a number." });
    }
    if (slope !== null && slope <= 5 && aspect && aspect !== LEVEL_ASPECT) {
      out.push({ level: "error", field: "aspect", message: "Slope 5% or less can only use Level aspect." });
    }
    if (slope !== null && slope > 5 && aspect === LEVEL_ASPECT) {
      out.push({ level: "error", field: "aspect", message: "Level aspect can only be used when slope is 5% or less." });
    }
    return out;
  }

  function normalizeTreeDbhInput() {
    const input = document.getElementById("treeDbh");
    const raw = clean(input.value).replace(/,/g, "");
    if (!raw) return;
    let value = null;
    if (/^\d+$/.test(raw)) {
      value = raw.length >= 3 ? Number(raw) / 10 : Number(raw);
    } else {
      value = Number(raw);
    }
    if (Number.isFinite(value)) {
      input.value = value.toFixed(1);
    }
  }

  function updateTreeFormState() {
    const statusInput = document.getElementById("treeStatus");
    const damageInput = document.getElementById("treeDamage");
    if (!clean(statusInput.value)) statusInput.value = "Live";
    if (!clean(damageInput.value)) damageInput.value = "None";
    const status = clean(statusInput.value) || "Live";
    const damage = clean(damageInput.value) || "None";
    const isDead = status === "Dead";
    const isBrokenTop = damage === "Broken Top";
    setDisabledValue("treeActualHt", isDead || !isBrokenTop);
    updateActualHeightHelp(status, damage);
    setDisabledValue("treeCull", isDead);
    setDisabledValue("treeCrownRatio", isDead);
    setDisabledValue("treeAge", isDead);
    setDisabledValue("treeSnagClass", !isDead);
    validateTreeForm(false);
  }

  function updateActualHeightHelp(status, damage) {
    const help = document.getElementById("actualHeightHelp");
    const input = document.getElementById("treeActualHt");
    if (!help || !input) return;
    const isDead = status === "Dead";
    const isBrokenTop = damage === "Broken Top";
    help.classList.toggle("important", isBrokenTop);
    if (isDead) {
      input.placeholder = "";
      help.textContent = "Dead trees do not use Actual Height. Use Decay Class instead.";
    } else if (isBrokenTop) {
      input.placeholder = "Estimated full height";
      help.textContent = "Required for live Broken Top trees. Enter the estimated full height; it must be greater than Height.";
    } else {
      input.placeholder = "Broken Top only";
      help.textContent = "Leave blank unless the live tree is Broken Top. Normal live trees export Height as Actual Height.";
    }
  }

  function validateTreeForm(showRequired) {
    const messages = [];
    [
      "treeSpecies", "treeStatus", "treeDbh", "treeHt", "treeActualHt",
      "treeCull", "treeCrownRatio", "treeAge", "treeSnagClass"
    ].forEach(clearFieldError);
    const species = speciesFromCode(document.getElementById("treeSpecies").value);
    const status = clean(document.getElementById("treeStatus").value) || "Live";
    const damage = clean(document.getElementById("treeDamage").value) || "None";
    const dbh = numberFromValue(document.getElementById("treeDbh").value);
    const ht = numberFromValue(document.getElementById("treeHt").value);
    const actualht = numberFromValue(document.getElementById("treeActualHt").value);
    const cull = numberFromValue(document.getElementById("treeCull").value);
    const crownRatio = numberFromValue(document.getElementById("treeCrownRatio").value);
    const age = numberFromValue(document.getElementById("treeAge").value);
    const decayClass = clean(document.getElementById("treeSnagClass").value);
    const raw = {
      dbh: clean(document.getElementById("treeDbh").value),
      ht: clean(document.getElementById("treeHt").value),
      actualht: clean(document.getElementById("treeActualHt").value),
      cull: clean(document.getElementById("treeCull").value),
      crownRatio: clean(document.getElementById("treeCrownRatio").value),
      age: clean(document.getElementById("treeAge").value)
    };

    if (showRequired && !species) addFieldValidation(messages, "treeSpecies", "Species is required.");
    if (showRequired && ["Live", "Dead"].indexOf(status) < 0) addFieldValidation(messages, "treeStatus", "Live/Dead is required.");
    const requiresDbhHeight = status !== "Dead";

    if (showRequired && requiresDbhHeight && dbh === null) {
      addFieldValidation(messages, "treeDbh", "Live trees require DBH, and DBH must be 5.0 inches or greater.");
    } else if (raw.dbh && dbh === null) {
      addFieldValidation(messages, "treeDbh", "DBH must be a number.");
    } else if (dbh !== null && dbh < TREE_MIN_DBH) {
      addFieldValidation(messages, "treeDbh", "DBH must be 5.0 inches or greater.");
    }

    if (showRequired && requiresDbhHeight && ht === null) {
      addFieldValidation(messages, "treeHt", `Live trees require Height, and Height must be ${TREE_MIN_HEIGHT} ft or greater.`);
    } else if (raw.ht && ht === null) {
      addFieldValidation(messages, "treeHt", "Height must be a number.");
    } else if (ht !== null && ht < TREE_MIN_HEIGHT) {
      addFieldValidation(messages, "treeHt", `Height must be ${TREE_MIN_HEIGHT} ft or greater.`);
    }

    if (status === "Dead") {
      if (showRequired && !decayClass) {
        addFieldValidation(messages, "treeSnagClass", "Dead trees require Decay Class 1-5.");
      }
    } else {
      if (decayClass) {
        addFieldValidation(messages, "treeSnagClass", "Decay Class can only be used when Live/Dead is Dead.");
      }
      if (damage === "Broken Top") {
        if (showRequired && actualht === null) {
          addFieldValidation(messages, "treeActualHt", "Broken Top requires actual height.");
        } else if (raw.actualht && actualht === null) {
          addFieldValidation(messages, "treeActualHt", "Actual Height must be a number.");
        } else if (actualht !== null && ht !== null && actualht <= ht) {
          addFieldValidation(messages, "treeActualHt", "Actual Height must be greater than measured Height.");
        }
      }
      if (raw.cull && (cull === null || cull < 0 || cull > 100)) {
        addFieldValidation(messages, "treeCull", "Cull must be 0 to 100.");
      }
      if (raw.crownRatio && (crownRatio === null || crownRatio < 0 || crownRatio > 100)) {
        addFieldValidation(messages, "treeCrownRatio", "Crown Ratio must be 0 to 100.");
      }
      if (raw.age && (age === null || age < 0 || age > TREE_MAX_AGE)) {
        addFieldValidation(messages, "treeAge", `Age must be 0 to ${TREE_MAX_AGE}.`);
      }
    }

    return { valid: !messages.length, messages };
  }

  function updateRegenValidation() {
    validateRegenForm(false);
  }

  function validateRegenForm(showRequired) {
    const messages = [];
    ["regenSpecies", "regenStemCount", "regenDiameterClass", "regenHeightClass"].forEach(clearFieldError);
    const species = speciesFromCode(document.getElementById("regenSpecies").value);
    const stemCount = numberFromValue(document.getElementById("regenStemCount").value);
    const rawStemCount = clean(document.getElementById("regenStemCount").value);
    const diameterClass = clean(document.getElementById("regenDiameterClass").value);
    const heightClass = clean(document.getElementById("regenHeightClass").value);
    if (showRequired && !species) addFieldValidation(messages, "regenSpecies", "Species is required.");
    if (showRequired && stemCount === null) {
      addFieldValidation(messages, "regenStemCount", "Stem Count is required.");
    } else if (rawStemCount && (stemCount === null || stemCount <= 0)) {
      addFieldValidation(messages, "regenStemCount", "Stem Count must be greater than 0.");
    }
    if ((diameterClass === '2"' || diameterClass === '4"') && heightClass !== ">5 ft") {
      addFieldValidation(messages, "regenHeightClass", 'Use >5 ft when Diameter Class is 2" or 4".');
    }
    return { valid: !messages.length, messages };
  }

  function addFieldValidation(messages, id, message) {
    messages.push(message);
    setFieldError(id, message);
  }

  function setDisabledValue(id, disabled) {
    const input = document.getElementById(id);
    input.disabled = disabled;
    if (disabled) {
      input.value = "";
      clearFieldError(id);
    }
  }

  function setFieldError(id, message) {
    const input = document.getElementById(id);
    if (!input) return;
    const field = input.closest(".field");
    input.classList.add("is-invalid");
    if (field) field.classList.add("has-error");
    let note = field ? field.querySelector(`[data-field-error="${id}"]`) : null;
    if (!note && field) {
      note = document.createElement("div");
      note.className = "field-message";
      note.dataset.fieldError = id;
      field.appendChild(note);
    }
    if (note) note.textContent = message;
  }

  function clearFieldError(id) {
    const input = document.getElementById(id);
    if (!input) return;
    const field = input.closest(".field");
    input.classList.remove("is-invalid");
    if (field) {
      const note = field.querySelector(`[data-field-error="${id}"]`);
      if (note) note.remove();
      if (!field.querySelector(".is-invalid")) field.classList.remove("has-error");
    }
  }

  function renderTreeList() {
    const rows = currentPlotRows(state.trees);
    if (!rows.length) {
      els.treeList.innerHTML = '<div class="empty">No tree records for this plot.</div>';
      return;
    }
    els.treeList.innerHTML = rows.map((row) => recordCard(row, "tree")).join("");
  }

  function renderRegenList() {
    const rows = currentPlotRows(state.regen);
    if (!rows.length) {
      els.regenList.innerHTML = '<div class="empty">No regen records for this plot.</div>';
      return;
    }
    els.regenList.innerHTML = rows.map((row) => recordCard(row, "regen")).join("");
  }

  function currentPlotRows(rows) {
    if (!state.currentPlot) return [];
    return rows.filter((row) => row.plot === state.currentPlot).sort(recordEntrySort);
  }

  function recordCard(row, type) {
    const isTree = type === "tree";
    const label = recordDisplayLabel(type, row);
    const title = isTree
      ? `${label} - ${row.spp} | DBH ${blank(row.dbh)} | HT ${blank(row.ht)}`
      : `${label} - ${row.spp} | ${blank(row.stemCount)} stems`;
    const chips = isTree
      ? [
        `Status ${blank(row.liveDead)}`, `Code ${blank(row.sppCode)}`,
        `Cull ${blank(row.cull || "0")}%`, row.damageAgents || "", row.decayClass ? `Decay ${row.decayClass}` : ""
      ]
      : [
        `Code ${blank(row.sppCode)}`, row.diameterClass || "",
        row.heightClass || "", row.damageAgents || ""
      ];
    const actionPrefix = isTree ? "tree" : "regen";
    return `
      <article class="record-card">
        <div>
          <div class="record-title">${escapeHtml(title)}</div>
          <div class="record-meta">${chips.filter(Boolean).map((chip) => `<span class="chip">${escapeHtml(chip)}</span>`).join("")}</div>
        </div>
        <div class="record-actions">
          <button type="button" class="secondary" data-action="edit-${actionPrefix}" data-id="${escapeHtml(row.id)}">Edit</button>
          <button type="button" class="danger" data-action="delete-${actionPrefix}" data-id="${escapeHtml(row.id)}">Delete</button>
        </div>
      </article>
    `;
  }

  function renderCounts() {
    els.plotCount.textContent = String(Object.keys(state.plots).length);
    els.treeCount.textContent = String(state.trees.length);
    els.regenCount.textContent = String(state.regen.length);
    els.issueCount.textContent = String(buildReviewItems().filter((row) => row.level === "error").length);
  }

  function renderReview() {
    const items = buildReviewItems();
    if (!items.length) {
      els.reviewList.innerHTML = '<div class="empty">No blocking review items.</div>';
      return;
    }
    els.reviewList.innerHTML = items.map((item) => `
      <button class="review-item ${escapeHtml(item.level)}" type="button"
        data-review-type="${escapeHtml(item.recordType || "")}"
        data-id="${escapeHtml(item.id || "")}"
        data-plot="${escapeHtml(item.plot || "")}"
        data-field="${escapeHtml(item.field || "")}">
        <strong><span class="review-level">${escapeHtml(item.level.toUpperCase())}</span> ${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.message)}</span>
      </button>
    `).join("");
  }

  function buildReviewItems() {
    const items = [];
    if (!Object.keys(state.plots).length) {
      items.push({ level: "error", title: "No plots", message: "Add at least one plot before exporting." });
    }
    objectValues(state.plots).forEach((plot) => {
      if (!plot.measurementDate) addReviewItem(items, "warning", "plot", plot, "Measurement date is blank.", "measurementDate");
      if (!plot.crewName && !state.settings.crewName) addReviewItem(items, "warning", "plot", plot, "Crew name is blank.", "crewName");
      const siteIssues = siteValidationMessages(plot);
      siteIssues.forEach((issue) => addReviewItem(items, issue.level, "plot", plot, issue.message, issue.field));
    });
    state.trees.forEach((row) => {
      if (!recordSpeciesCode(row)) addReviewItem(items, "error", "tree", row, `${row.spp || "Species"} has no FIA species code.`, "treeSpecies");
      const treeIsDead = row.liveDead === "Dead";
      const rowDbh = clean(row.dbh);
      const rowHt = clean(row.ht);
      if (!treeIsDead && !positiveNumber(row.dbh)) {
        addReviewItem(items, "error", "tree", row, "Live tree DBH is missing or invalid.", "treeDbh");
      } else if (treeIsDead && rowDbh && !positiveNumber(row.dbh)) {
        addReviewItem(items, "error", "tree", row, "DBH is invalid.", "treeDbh");
      } else if (positiveNumber(row.dbh) && Number(row.dbh) < TREE_MIN_DBH) {
        addReviewItem(items, "error", "tree", row, "DBH must be 5.0 inches or greater.", "treeDbh");
      }
      if (!treeIsDead && !positiveNumber(row.ht)) {
        addReviewItem(items, "error", "tree", row, "Live tree height is missing or invalid.", "treeHt");
      } else if (treeIsDead && rowHt && !positiveNumber(row.ht)) {
        addReviewItem(items, "error", "tree", row, "Height is invalid.", "treeHt");
      } else if (positiveNumber(row.ht) && Number(row.ht) < TREE_MIN_HEIGHT) {
        addReviewItem(items, "error", "tree", row, `Height must be ${TREE_MIN_HEIGHT} ft or greater.`, "treeHt");
      }
      if (["Live", "Dead"].indexOf(row.liveDead) < 0) addReviewItem(items, "error", "tree", row, "Live/Dead is missing.", "treeStatus");
      const rawDecayClass = clean(row.decayClass) || legacyDecayCode(row.snagClass);
      if (rawDecayClass && row.liveDead !== "Dead") {
        addReviewItem(items, "error", "tree", row, "Decay Class codes 1-5 can only be used when Live/Dead is Dead.", "treeSnagClass");
      }
      if (row.liveDead === "Dead" && !rawDecayClass) {
        addReviewItem(items, "error", "tree", row, "Dead trees require a Decay Class code from 1 to 5.", "treeSnagClass");
      }
      if (row.liveDead !== "Dead" && row.damageAgents === "Broken Top" && (!positiveNumber(row.ht) || !positiveNumber(row.actualht))) {
        addReviewItem(items, "error", "tree", row, "Broken Top requires both height and actual height.", "treeActualHt");
      } else if (row.liveDead !== "Dead" && row.damageAgents === "Broken Top" && Number(row.actualht) <= Number(row.ht)) {
        addReviewItem(items, "error", "tree", row, "Broken Top actual height must be greater than measured height.", "treeActualHt");
      }
      const cull = Number(row.cull || 0);
      if (cull < 0 || cull > 100) addReviewItem(items, "error", "tree", row, "Cull must be between 0 and 100.", "treeCull");
      const crownRatio = clean(row.crownRatio);
      if (crownRatio && (Number(crownRatio) < 0 || Number(crownRatio) > 100 || numberFromValue(crownRatio) === null)) {
        addReviewItem(items, "error", "tree", row, "Crown Ratio must be between 0 and 100.", "treeCrownRatio");
      }
      const age = clean(row.age);
      if (age && (numberFromValue(age) === null || Number(age) < 0 || Number(age) > TREE_MAX_AGE)) {
        addReviewItem(items, "error", "tree", row, `Age must be between 0 and ${TREE_MAX_AGE} years.`, "treeAge");
      }
    });
    state.regen.forEach((row) => {
      if (!row.spp) addReviewItem(items, "warning", "regen", row, "Species is blank.", "regenSpecies");
      if (!positiveNumber(row.stemCount)) addReviewItem(items, "warning", "regen", row, "Stem count is missing or invalid.", "regenStemCount");
      if ((row.diameterClass === '2"' || row.diameterClass === '4"') && row.heightClass !== ">5 ft") {
        addReviewItem(items, "error", "regen", row, 'Regeneration with 2" or 4" DBH must use the >5 ft height class.', "regenHeightClass");
      }
    });
    return items;
  }

  function addReviewItem(items, level, recordType, row, message, field) {
    items.push({
      level,
      recordType,
      id: row.id || "",
      plot: row.plot || "",
      field: field || "",
      title: recordDisplayLabel(recordType, row),
      message
    });
  }

  function handleReviewClick(event) {
    const item = event.target.closest(".review-item");
    if (!item) return;
    const type = item.dataset.reviewType;
    const id = item.dataset.id;
    const plot = item.dataset.plot;
    const field = item.dataset.field;
    if (type === "tree" && id) {
      editTree(id);
    } else if (type === "regen" && id) {
      editRegen(id);
    } else if (type === "plot" && plot) {
      state.currentPlot = plot;
      saveState();
      renderAll();
      activateTab("sitePanel");
    }
    focusField(field);
  }

  function focusField(id) {
    if (!id) return;
    const input = document.getElementById(id);
    if (!input || input.disabled) return;
    window.setTimeout(() => {
      input.focus({ preventScroll: false });
      input.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 60);
  }

  function recordDisplayLabel(type, row) {
    if (type === "tree") return `${plotLabel(row)} Tree ${recordSequence("tree", row)}`;
    if (type === "regen") return `${plotLabel(row)} Regen ${recordSequence("regen", row)}`;
    if (type === "plot") return plotLabel(row);
    return clean(row.id) || "Record";
  }

  function plotLabel(row) {
    return `Plot ${blank(row.plot)}`;
  }

  function recordSequence(type, row) {
    const rows = (type === "tree" ? state.trees : state.regen)
      .filter((candidate) => candidate.plot === row.plot)
      .sort(recordEntrySort);
    const index = rows.findIndex((candidate) => candidate.id === row.id);
    return index >= 0 ? index + 1 : "?";
  }

  function exportProjectSetup() {
    const setup = projectSetupFromState();
    const payload = {
      packageType: "PlotWeaselFieldProjectSetup",
      formatVersion: 1,
      appVersion: APP_VERSION,
      exportedAt: nowIso(),
      settings: setup
    };
    downloadText(JSON.stringify(payload, null, 2), projectSetupFileBase("project-setup") + ".json", "application/json");
    setBanner("success", "Project setup exported", "Share this setup JSON with each crew tablet before field data entry.");
  }

  async function importProjectSetup(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const setup = extractProjectSetup(parsed);
      if (!setup) throw new Error("This file does not contain Plot Weasel Field Logger project settings.");
      const ok = window.confirm(
        "Import this project setup? Project name, species pick list, saved species list, and damage agents will be updated. Existing plots, tree records, regen records, crew name, and crew ID will stay on this device."
      );
      if (!ok) return;
      const summary = applyProjectSetup(setup);
      saveState();
      hydrateSettings();
      clearTreeForm();
      clearRegenForm();
      renderAll();
      els.projectSetupSummary.textContent = summary;
      setBanner("success", "Project setup imported", summary);
    } catch (error) {
      els.projectSetupSummary.textContent = `Import failed: ${error.message}`;
      setBanner("error", "Project setup import failed", error.message);
    } finally {
      event.target.value = "";
    }
  }

  function projectSetupFromState() {
    const settings = state.settings || {};
    return {
      projectName: clean(settings.projectName),
      projectSpeciesCodes: normalizeSpeciesCodes(settings.projectSpeciesCodes),
      savedSpeciesCodes: savedSpeciesCodes(),
      damageAgents: normalizeDamageAgents(settings.damageAgents)
    };
  }

  function extractProjectSetup(parsed) {
    if (!parsed || typeof parsed !== "object") return null;
    const source = parsed.settings ||
      (parsed.projectSetup && parsed.projectSetup.settings) ||
      parsed.projectSetup ||
      (parsed.data && parsed.data.settings);
    if (!source || typeof source !== "object") return null;
    return {
      projectName: clean(source.projectName),
      projectSpeciesCodes: normalizeSpeciesCodes(source.projectSpeciesCodes || source.speciesCodes),
      savedSpeciesCodes: singleSavedSpeciesCodes(source),
      damageAgents: normalizeDamageAgents(source.damageAgents)
    };
  }

  function applyProjectSetup(setup) {
    const previousProjectName = clean(state.settings.projectName);
    const nextProjectName = clean(setup.projectName);
    state.settings.projectName = nextProjectName;
    state.settings.projectSpeciesCodes = normalizeSpeciesCodes(setup.projectSpeciesCodes);
    state.settings.savedSpeciesCodes = normalizeSpeciesCodes(setup.savedSpeciesCodes);
    state.settings.savedSpeciesSavedAt = state.settings.savedSpeciesCodes.length ? nowIso() : "";
    state.settings.savedSpeciesLists = [];
    state.settings.damageAgents = normalizeDamageAgents(setup.damageAgents);
    applyProjectNameToExistingRecords(previousProjectName, nextProjectName);
    return `${state.settings.projectName || "Blank project"} loaded with ${state.settings.projectSpeciesCodes.length} project species and ${state.settings.damageAgents.length} damage agents. Crew name and Crew ID were not changed.`;
  }

  function applyProjectNameToExistingRecords(previousProjectName, nextProjectName) {
    if (!nextProjectName || previousProjectName === nextProjectName) return;
    const shouldUpdate = (value) => !clean(value) || clean(value) === previousProjectName;
    objectValues(state.plots).forEach((row) => {
      if (row && shouldUpdate(row.projectName)) row.projectName = nextProjectName;
    });
    state.trees.forEach((row) => {
      if (row && shouldUpdate(row.projectName)) row.projectName = nextProjectName;
    });
    state.regen.forEach((row) => {
      if (row && shouldUpdate(row.projectName)) row.projectName = nextProjectName;
    });
  }

  function exportCrewPackage() {
    const name = fileBase("crew-package") + ".json";
    const payload = {
      packageType: "PlotWeaselFieldCrewPackage",
      exportedAt: nowIso(),
      data: state
    };
    downloadText(JSON.stringify(payload, null, 2), name, "application/json");
  }

  function exportBackup() {
    downloadText(JSON.stringify(state, null, 2), fileBase("device-backup") + ".json", "application/json");
  }

  function exportPlotWeaselCsv() {
    const rows = buildPlotWeaselRows();
    if (!rows.length) {
      setBanner("warn", "No Plot Weasel Desktop rows", "Add at least one plot before exporting for Plot Weasel Desktop.");
      return;
    }
    downloadText(toCsv(rows, PLOT_WEASEL_COLUMNS), fileBase("PlotWeasel_upload") + ".csv", "text/csv");
  }

  async function saveCsvsToFolder() {
    if (!window.showDirectoryPicker) {
      setBanner("warn", "Folder save unavailable", "This browser cannot save directly to a folder. Open Field Logger in Microsoft Edge on Windows and try again.");
      return;
    }
    const folderName = fileBase("site-tree-regen-csvs");
    try {
      const rootHandle = await window.showDirectoryPicker({ mode: "readwrite" });
      const folderHandle = await rootHandle.getDirectoryHandle(folderName, { create: true });
      const files = buildCsvFiles();
      for (const file of files) {
        await writeTextFile(folderHandle, file.name, file.content);
      }
      setBanner("success", "CSVs saved", `Saved Site.csv, Tree.csv, Regen.csv, and Review.txt to ${folderName}.`);
    } catch (error) {
      if (error && error.name === "AbortError") {
        setBanner("warn", "Folder save cancelled", "No files were written.");
      } else {
        setBanner("error", "Folder save failed", error && error.message ? error.message : "The browser could not write the CSV files.");
      }
    }
  }

  async function writeTextFile(folderHandle, name, content) {
    const fileHandle = await folderHandle.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  function buildCsvFiles() {
    const siteRows = objectValues(state.plots).sort((a, b) => compareMixed(a.plot, b.plot)).map(siteExportRow);
    const treeRows = buildTreeExportRows();
    const regenRows = state.regen.slice().sort(recordSort).map(regenExportRow);
    const reviewItems = buildReviewItems();
    const reviewRows = reviewItems.length
      ? reviewItems.map((row) => `${row.level.toUpperCase()}: ${row.title} - ${row.message}`).join("\r\n") + "\r\n"
      : "No review items.\r\n";
    return [
      { name: "Site.csv", content: toCsv(siteRows, siteColumns(), { excelSafe: true, bom: true }) },
      { name: "Tree.csv", content: toCsv(treeRows, treeColumns(), { excelSafe: true, bom: true }) },
      { name: "Regen.csv", content: toCsv(regenRows, regenColumns(), { excelSafe: true, bom: true }) },
      { name: "Review.txt", content: reviewRows }
    ];
  }

  function buildTreeExportRows() {
    const plotsWithTrees = codeLookup(state.trees.map((row) => clean(row.plot)).filter(Boolean));
    const measuredRows = state.trees.slice().sort(recordSort).map(treeExportRow);
    const nullRows = objectValues(state.plots)
      .filter((plotRow) => {
        const plot = clean(plotRow.plot);
        return plot && !plotsWithTrees[plot];
      })
      .sort((a, b) => compareMixed(a.plot, b.plot))
      .map(nullTreeExportRow);
    return measuredRows.concat(nullRows).sort(recordSort);
  }

  function siteExportRow(row) {
    return {
      plot: row.plot,
      Project: projectNameFor(row),
      "Elevation (ft)": row.elevation,
      "Slope (%)": row.slope,
      Aspect: row.aspect,
      "Slope Position": row.slopePosition,
      "Soil Type": row.soilType,
      "Habitat Type": row.habitatType,
      "Site Index": row.siteIndex,
      "UTM Easting": row.utmEasting,
      "UTM Northing": row.utmNorthing,
      "UTM Zone": row.utmZone,
      "GPS Accuracy (m)": row.gpsAccuracy,
      "GPS Fix Count": row.gpsFixCount,
      "GPS Latitude": row.gpsLatitude,
      "GPS Longitude": row.gpsLongitude,
      "Measurement Date": row.measurementDate,
      "Crew Name": row.crewName || state.settings.crewName,
      "Road Access": row.roadAccess,
      "Proposed Logging System": row.loggingSystem,
      "Forest Soils": row.forestSoils,
      Notes: row.siteNotes,
      record_id: row.id,
      crew_id: row.crewId || state.settings.crewId,
      updated_at: row.updatedAt
    };
  }

  function treeExportRow(row) {
    const isDead = row.liveDead === "Dead";
    return {
      plot: row.plot,
      Project: projectNameFor(row),
      spp: row.spp,
      spp_code: recordSpeciesCode(row),
      dbh: row.dbh,
      ht: row.ht,
      actualht: isDead ? "" : (row.actualht || row.ht),
      cull: isDead ? "" : (row.cull || "0"),
      "Crown Ratio (%)": isDead ? "" : row.crownRatio,
      "Age (years)": isDead ? "" : row.age,
      "Damage Agents": row.damageAgents,
      DECAYCD: treeDecayCode(row),
      "Live/Dead": row.liveDead,
      notes: row.notes,
      "Crew Name": crewNameFor(row),
      record_id: row.id,
      crew_id: crewIdFor(row),
      updated_at: row.updatedAt
    };
  }

  function nullTreeExportRow(plotRow) {
    return {
      plot: plotRow.plot,
      Project: projectNameFor(plotRow),
      spp: "",
      spp_code: "",
      dbh: "",
      ht: "",
      actualht: "",
      cull: "",
      "Crown Ratio (%)": "",
      "Age (years)": "",
      "Damage Agents": "",
      DECAYCD: "",
      "Live/Dead": "",
      notes: "Null plot - no tree records",
      "Crew Name": crewNameFor(plotRow),
      record_id: `${plotRow.id || plotRow.plot}-tree-null`,
      crew_id: crewIdFor(plotRow),
      updated_at: plotRow.updatedAt
    };
  }

  function regenExportRow(row) {
    return {
      plot: row.plot,
      Project: projectNameFor(row),
      spp: row.spp,
      spp_code: recordSpeciesCode(row),
      "Stem Count": row.stemCount,
      "Diameter Class": row.diameterClass,
      "Height Class": row.heightClass,
      "Damage Agents": row.damageAgents,
      notes: row.notes,
      "Crew Name": crewNameFor(row),
      record_id: row.id,
      crew_id: crewIdFor(row),
      updated_at: row.updatedAt
    };
  }

  function buildPlotWeaselRows() {
    const out = [];
    const exportedPlots = {};
    state.trees.forEach((row) => {
      const code = recordSpeciesCode(row);
      if (!code || !positiveNumber(row.dbh) || Number(row.dbh) < 5 || !positiveNumber(row.ht)) return;
      if (row.liveDead !== "Dead" && row.damageAgents === "Broken Top" && !positiveNumber(row.actualht)) return;
      const plot = clean(row.plot);
      out.push({
        plot,
        spp: code,
        dbh: row.dbh,
        ht: row.ht,
        actualht: row.actualht || row.ht,
        cull: row.cull || "0",
        DECAYCD: treeDecayCode(row),
        crown_ratio: row.crownRatio || "",
        status: clean(row.liveDead).toLowerCase(),
        species_name: row.spp,
        crew_id: crewIdFor(row),
        source_record_id: row.id,
        project_name: projectNameFor(row),
        crew_name: crewNameFor(row)
      });
      exportedPlots[plot] = true;
    });
    objectValues(state.plots).forEach((plotRow) => {
      const plot = clean(plotRow.plot);
      if (!plot || exportedPlots[plot]) return;
      out.push(nullPlotWeaselRow(plot));
    });
    return out.sort(recordSort);
  }

  function nullPlotWeaselRow(plot) {
    const row = {};
    PLOT_WEASEL_COLUMNS.forEach((column) => {
      row[column] = "";
    });
    row.plot = plot;
    return row;
  }

  function projectNameFor(row) {
    const plot = row && row.plot ? state.plots[row.plot] : null;
    return clean(row && row.projectName) || clean(plot && plot.projectName) || clean(state.settings.projectName);
  }

  function crewNameFor(row) {
    return clean(row && row.crewName) || clean(state.settings.crewName);
  }

  function crewIdFor(row) {
    return clean(row && row.crewId) || clean(state.settings.crewId);
  }

  async function restoreBackup(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      state = normalizeState(json.data || json);
      saveState();
      renderAll();
      setBanner("success", "Backup restored", `${file.name} loaded on this device.`);
    } catch (error) {
      setBanner("error", "Restore failed", error.message);
    } finally {
      event.target.value = "";
    }
  }

  async function importCrewPackages(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    let added = 0;
    let updated = 0;
    let skipped = 0;
    let projectIdentityMessage = "";
    let crewIdentityMessage = "";
    const errors = [];
    for (const file of files) {
      try {
        const parsed = JSON.parse(await file.text());
        const incoming = normalizeState(parsed.data || parsed);
        const result = mergeIncoming(incoming);
        added += result.added;
        updated += result.updated;
        skipped += result.skipped;
        if (files.length === 1) {
          projectIdentityMessage = applyImportedProjectIdentity(incoming.settings || {});
          crewIdentityMessage = applyImportedCrewIdentity(incoming.settings || {});
        }
      } catch (error) {
        errors.push(`${file.name}: ${error.message}`);
      }
    }
    saveState();
    hydrateSettings();
    renderAll();
    const identityMessage = [projectIdentityMessage, crewIdentityMessage].filter(Boolean).join(" ");
    els.mergeSummary.textContent = `Added ${added}, updated ${updated}, skipped ${skipped}${identityMessage ? ". " + identityMessage : ""}${errors.length ? ". Errors: " + errors.join("; ") : "."}`;
    setBanner(errors.length ? "warn" : "success", "Import complete", els.mergeSummary.textContent);
    event.target.value = "";
  }

  function applyImportedProjectIdentity(settings) {
    const incomingProjectName = clean(settings.projectName);
    if (!incomingProjectName) return "";

    const currentProjectName = clean(state.settings.projectName);
    if (incomingProjectName === currentProjectName) return "Project Name already matched the imported package.";

    let adopt = !currentProjectName;
    if (currentProjectName) {
      adopt = window.confirm(
        `This crew package is for project "${incomingProjectName}". Update this tablet's Project Name to match it?`
      );
    }
    if (!adopt) return "Project Name was left unchanged.";

    state.settings.projectName = incomingProjectName;
    applyProjectNameToExistingRecords(currentProjectName, incomingProjectName);
    return `Project Name set from the imported package: ${incomingProjectName}.`;
  }

  function applyImportedCrewIdentity(settings) {
    const incomingCrewName = clean(settings.crewName);
    const incomingCrewId = clean(settings.crewId);
    if (!incomingCrewName && !incomingCrewId) return "";

    const currentCrewName = clean(state.settings.crewName);
    const currentCrewId = clean(state.settings.crewId);
    const sameCrewName = !incomingCrewName || incomingCrewName === currentCrewName;
    const sameCrewId = !incomingCrewId || incomingCrewId === currentCrewId;
    if (sameCrewName && sameCrewId) return "Crew Name and Crew ID already matched the imported package.";

    const hasCurrentCrew = currentCrewName || currentCrewId;
    let adopt = !hasCurrentCrew;
    if (hasCurrentCrew) {
      adopt = window.confirm(
        `This crew package is from ${incomingCrewName || "blank crew name"} / ${incomingCrewId || "blank crew ID"}. Update this tablet's Crew Name and Crew ID to match it?`
      );
    }
    if (!adopt) return "Crew Name and Crew ID were left unchanged.";

    if (incomingCrewName) state.settings.crewName = incomingCrewName;
    if (incomingCrewId) state.settings.crewId = incomingCrewId;
    return `Crew Name and Crew ID set from the imported package: ${state.settings.crewName || "blank"} / ${state.settings.crewId || "blank"}.`;
  }

  function mergeIncoming(incoming) {
    let added = 0;
    let updated = 0;
    let skipped = 0;

    state.settings.projectSpeciesCodes = normalizeSpeciesCodes(
      state.settings.projectSpeciesCodes.concat(incoming.settings ? incoming.settings.projectSpeciesCodes || [] : [])
    );
    const incomingSavedCodes = incoming.settings ? singleSavedSpeciesCodes(incoming.settings) : [];
    if (!savedSpeciesCodes().length && incomingSavedCodes.length) {
      state.settings.savedSpeciesCodes = incomingSavedCodes;
      state.settings.savedSpeciesSavedAt = clean(incoming.settings.savedSpeciesSavedAt) || nowIso();
    }
    state.settings.savedSpeciesLists = [];
    state.settings.damageAgents = normalizeDamageAgents(
      (state.settings.damageAgents || []).concat(incoming.settings ? incoming.settings.damageAgents || [] : [])
    );

    objectValues(incoming.plots || {}).forEach((plot) => {
      if (!plot || !plot.plot) return;
      const existing = state.plots[plot.plot];
      if (!existing) {
        state.plots[plot.plot] = plot;
        added += 1;
      } else if (isNewer(plot.updatedAt, existing.updatedAt)) {
        state.plots[plot.plot] = mergeObjects(existing, plot);
        updated += 1;
      } else {
        skipped += 1;
      }
    });

    const treeResult = mergeArrayById(state.trees, incoming.trees || []);
    state.trees = treeResult.rows;
    added += treeResult.added;
    updated += treeResult.updated;
    skipped += treeResult.skipped;

    const regenResult = mergeArrayById(state.regen, incoming.regen || []);
    state.regen = regenResult.rows;
    added += regenResult.added;
    updated += regenResult.updated;
    skipped += regenResult.skipped;

    if (!state.currentPlot) state.currentPlot = firstPlotKey();
    return { added, updated, skipped };
  }

  function mergeArrayById(existingRows, incomingRows) {
    const byId = {};
    const order = [];
    let added = 0;
    let updated = 0;
    let skipped = 0;
    existingRows.forEach((row) => {
      if (!row || !row.id) return;
      byId[row.id] = row;
      order.push(row.id);
    });
    incomingRows.forEach((row) => {
      if (!row || !row.id) return;
      const existing = byId[row.id];
      if (!existing) {
        byId[row.id] = row;
        order.push(row.id);
        added += 1;
      } else if (isNewer(row.updatedAt, existing.updatedAt)) {
        byId[row.id] = mergeObjects(existing, row);
        updated += 1;
      } else {
        skipped += 1;
      }
    });
    return { rows: order.map((id) => byId[id]), added, updated, skipped };
  }

  function clearAllData() {
    const ok = window.confirm("Clear all projects and field data from this browser on this device?");
    if (!ok) return;
    if (storageAvailable) {
      loadProjectIndex().forEach((project) => localStorage.removeItem(projectStateKey(project.id)));
      localStorage.removeItem(PROJECT_INDEX_KEY);
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
      localStorage.removeItem(STORAGE_KEY);
    }
    state = defaultState();
    currentProjectId = state.projectId;
    saveState();
    hydrateSettings();
    clearTreeForm();
    clearRegenForm();
    renderAll();
    setBanner("success", "Device data cleared", "This browser has a fresh field logger state.");
  }

  function activateTab(panelId) {
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.tab === panelId);
    });
    document.querySelectorAll(".tab-panel").forEach((panel) => {
      const active = panel.id === panelId;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
  }

  function setBanner(type, title, message) {
    els.banner.className = `banner ${type || ""}`.trim();
    els.banner.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span>`;
  }

  function showStartupError(error) {
    const banner = document.getElementById("banner");
    const storageStatus = document.getElementById("storageStatus");
    const detail = error && error.message ? error.message : String(error || "Unknown startup issue");
    if (storageStatus) storageStatus.textContent = "Startup issue";
    if (banner) {
      banner.className = "banner error";
      banner.innerHTML = `<strong>App startup issue</strong><span>${escapeHtml(detail)}. Use the single-file Field Logger HTML on tablets, and keep the file out of cloud-only storage.</span>`;
    }
  }

  function indexSpeciesByCode(rows) {
    const out = {};
    rows.forEach((row) => {
      out[row.code] = row;
    });
    return out;
  }

  function hasSpeciesCode(code) {
    return !!speciesByCode(code);
  }

  function speciesByCode(code) {
    return FIA_BY_CODE[clean(code)] || null;
  }

  function codeLookup(values) {
    const out = {};
    (values || []).forEach((value) => {
      const key = clean(value);
      if (key) out[key] = true;
    });
    return out;
  }

  function contains(text, query) {
    return String(text).indexOf(String(query)) >= 0;
  }

  function objectValues(object) {
    return Object.keys(object || {}).map((key) => object[key]);
  }

  function mergeObjects() {
    const out = {};
    Array.prototype.forEach.call(arguments, (source) => {
      if (!source) return;
      Object.keys(source).forEach((key) => {
        out[key] = source[key];
      });
    });
    return out;
  }

  function findById(rows, id) {
    for (let index = 0; index < rows.length; index += 1) {
      if (rows[index].id === id) return rows[index];
    }
    return null;
  }

  function findSpeciesByName(value, relaxed) {
    for (let index = 0; index < FIA_SPECIES.length; index += 1) {
      const name = FIA_SPECIES[index].name.toLowerCase();
      const comparable = relaxed ? name.replace(/[^a-z0-9]+/g, "") : name;
      if (comparable === value) return FIA_SPECIES[index];
    }
    return null;
  }

  function speciesFromCode(code) {
    return speciesByCode(clean(code));
  }

  function recordSpeciesCode(row) {
    return clean(row.sppCode) || speciesCode(row.spp);
  }

  function speciesCode(name) {
    const normalized = clean(name).toLowerCase();
    if (!normalized) return "";
    const exact = findSpeciesByName(normalized, false);
    if (exact) return exact.code;
    const relaxed = normalized.replace(/[^a-z0-9]+/g, "");
    const fuzzy = findSpeciesByName(relaxed, true);
    return fuzzy ? fuzzy.code : "";
  }

  function normalizeSpeciesRecord(row) {
    const copy = mergeObjects(row);
    const code = recordSpeciesCode(copy);
    if (code && hasSpeciesCode(code)) {
      copy.sppCode = code;
      copy.spp = copy.spp || speciesByCode(code).name;
    }
    return copy;
  }

  function normalizeTreeRecord(row) {
    const copy = mergeObjects(row);
    copy.decayClass = clean(copy.decayClass) || legacyDecayCode(copy.snagClass);
    delete copy.stemCount;
    delete copy.snagClass;
    return copy;
  }

  function treeDecayCode(row) {
    if (!row || row.liveDead !== "Dead") return "";
    return clean(row.decayClass) || legacyDecayCode(row.snagClass);
  }

  function legacyDecayCode(value) {
    const text = clean(value);
    if (!text) return "";
    if (/^[1-5]$/.test(text)) return text;
    const match = text.match(/\b(I|II|III|IV|V)\b/i);
    if (!match) return "";
    return { I: "1", II: "2", III: "3", IV: "4", V: "5" }[match[1].toUpperCase()] || "";
  }

  function normalizeRecordContext(row, settings) {
    const source = row || {};
    const contextSettings = settings || {};
    return mergeObjects(source, {
      projectName: clean(source.projectName) || clean(contextSettings.projectName),
      crewName: clean(source.crewName) || clean(contextSettings.crewName),
      crewId: clean(source.crewId) || clean(contextSettings.crewId)
    });
  }

  function normalizeSpeciesCodes(codes) {
    const source = Array.isArray(codes) ? codes : DEFAULT_PROJECT_SPECIES_CODES;
    const out = [];
    source.forEach((code) => {
      const cleanCode = clean(code);
      if (cleanCode && hasSpeciesCode(cleanCode) && out.indexOf(cleanCode) < 0) {
        out.push(cleanCode);
      }
    });
    return out;
  }

  function normalizeSpeciesLists(lists) {
    const source = Array.isArray(lists) ? lists : [];
    const byName = {};
    source.forEach((list) => {
      const name = clean(list && list.name);
      const codes = normalizeSpeciesCodes(list && list.codes);
      if (name && codes.length) byName[name.toLowerCase()] = { name, codes };
    });
    return objectValues(byName).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }

  function singleSavedSpeciesCodes(settings) {
    const direct = normalizeSpeciesCodes(settings && settings.savedSpeciesCodes);
    if (direct.length) return direct;
    const legacyLists = normalizeSpeciesLists(settings && settings.savedSpeciesLists);
    return legacyLists.length ? normalizeSpeciesCodes(legacyLists[0].codes) : [];
  }

  function normalizeDamageAgents(values) {
    const source = Array.isArray(values) ? values : [];
    const out = [];
    DEFAULT_DAMAGE_AGENTS.concat(source).forEach((value) => {
      const name = clean(value);
      if (name && !out.some((item) => item.toLowerCase() === name.toLowerCase())) out.push(name);
    });
    return out;
  }

  function siteColumns() {
    return [
      "plot", "Project", "Elevation (ft)", "Slope (%)", "Aspect",
      "Slope Position", "Soil Type", "Habitat Type", "Site Index",
      "UTM Easting", "UTM Northing", "UTM Zone", "GPS Accuracy (m)",
      "GPS Fix Count", "GPS Latitude", "GPS Longitude",
      "Measurement Date", "Crew Name", "Road Access", "Proposed Logging System",
      "Forest Soils", "Notes", "record_id", "crew_id", "updated_at"
    ];
  }

  function treeColumns() {
    return [
      "plot", "Project", "spp", "spp_code", "dbh", "ht", "actualht", "cull",
      "Crown Ratio (%)", "Age (years)", "Damage Agents", "DECAYCD",
      "Live/Dead", "notes", "Crew Name", "record_id", "crew_id", "updated_at"
    ];
  }

  function regenColumns() {
    return [
      "plot", "Project", "spp", "spp_code", "Stem Count", "Diameter Class", "Height Class",
      "Damage Agents", "notes", "Crew Name", "record_id", "crew_id", "updated_at"
    ];
  }

  function toCsv(rows, columns, options) {
    const csvOptions = options || {};
    const lines = [columns.map(csvEscape).join(",")];
    rows.forEach((row) => {
      lines.push(columns.map((column) => csvEscape(row[column] == null ? "" : row[column], csvOptions)).join(","));
    });
    return (csvOptions.bom ? "\ufeff" : "") + lines.join("\r\n") + "\r\n";
  }

  function csvEscape(value, options) {
    let text = String(value == null ? "" : value);
    if (options && options.excelSafe) text = neutralizeCsvFormula(text);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function neutralizeCsvFormula(text) {
    if (!text) return text;
    const trimmed = text.replace(/^\s+/, "");
    return /^[=+\-@]/.test(trimmed) || /^[\t\r\n]/.test(text) ? `'${text}` : text;
  }

  function downloadText(text, name, type) {
    downloadBlob(new Blob([text], { type: type || "text/plain" }), name);
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function fileBase(kind) {
    const project = sanitizeFilePart(state.settings.projectName || "PlotWeasel");
    const crew = sanitizeFilePart(state.settings.crewId || "Crew");
    return `${project}_${crew}_${kind}_${today().replace(/-/g, "")}`;
  }

  function projectSetupFileBase(kind) {
    const project = sanitizeFilePart(state.settings.projectName || "PlotWeasel");
    return `${project}_${kind}_${today().replace(/-/g, "")}`;
  }

  function sanitizeFilePart(value) {
    return clean(value).replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "") || "Field";
  }

  function makeId(prefix) {
    const rand = Math.random().toString(36).slice(2, 8);
    return `${state.settings.crewId || "crew"}-${prefix}-${Date.now()}-${rand}`;
  }

  function makeProjectId() {
    const rand = Math.random().toString(36).slice(2, 8);
    return `project-${Date.now()}-${rand}`;
  }

  function updateDocumentTitle() {
    const project = clean(state && state.settings && state.settings.projectName);
    document.title = project
      ? `Plot Weasel Field Logger v${APP_VERSION} - ${project}`
      : `Plot Weasel Field Logger v${APP_VERSION}`;
  }

  function updateProjectUrl() {
    try {
      if (!currentProjectId || !window.history || !window.location) return;
      const url = new URL(window.location.href);
      if (url.searchParams.get("project") === currentProjectId) return;
      url.searchParams.set("project", currentProjectId);
      window.history.replaceState(null, "", url.toString());
    } catch (error) {
      // Some file viewers do not allow address changes. The project still opens from local storage.
    }
  }

  function formatProjectTime(value) {
    const text = clean(value);
    if (!text) return "not saved yet";
    const date = new Date(text);
    if (!Number.isFinite(date.getTime())) return text;
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function isNewer(a, b) {
    return new Date(a || 0).getTime() > new Date(b || 0).getTime();
  }

  function positiveNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0;
  }

  function numberFromValue(value) {
    const text = clean(value).replace(/,/g, "");
    if (!text) return null;
    const n = Number(text);
    return Number.isFinite(n) ? n : null;
  }

  function formatNumber(value, decimals) {
    const n = Number(value);
    return Number.isFinite(n) ? n.toFixed(decimals) : "";
  }

  function clean(value) {
    return value == null ? "" : String(value).trim();
  }

  function blank(value) {
    return clean(value) || "NA";
  }

  function compareMixed(a, b) {
    const an = Number(a);
    const bn = Number(b);
    if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
    return clean(a).localeCompare(clean(b), undefined, { numeric: true });
  }

  function recordSort(a, b) {
    return compareMixed(a.plot, b.plot) || clean(a.spp).localeCompare(clean(b.spp)) || clean(a.id).localeCompare(clean(b.id));
  }

  function recordEntrySort(a, b) {
    return compareMixed(a.plot, b.plot)
      || clean(a.createdAt).localeCompare(clean(b.createdAt))
      || clean(a.id).localeCompare(clean(b.id));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();



