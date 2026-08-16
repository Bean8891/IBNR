// =========================================================
// AUG'26 PLAN - Live Operations & Delivery Dashboard
// Automatic Google Sheets Sync & Visible Visual DataLabels
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  // Register Chart.js DataLabels Plugin Globally
  if (typeof ChartDataLabels !== "undefined") {
    Chart.register(ChartDataLabels);
  }

  // Initialize Store
  window.AUG26_STORE.init();

  // State Management
  const state = {
    currentTab: "overview",
    currentStageDrilldown: "IBNR",
    autoRefreshInterval: null,
    lastSyncTimestamp: null,
    isSyncing: false,
    filters: {
      location: "ALL",
      fuel: "ALL",
      model: "ALL",
      stage: "ALL",
      search: ""
    },
    ibnrTable: {
      page: 1,
      pageSize: 20,
      search: "",
      location: "ALL",
      subFilter: "ALL"
    },
    stageTable: {
      page: 1,
      pageSize: 20,
      search: "",
      location: "ALL",
      fuel: "ALL"
    },
    locationTableSort: {
      column: "delivered",
      direction: "desc"
    },
    charts: {}
  };

  // DOM Elements
  const DOM = {
    // Nav & Tabs
    navItems: document.querySelectorAll(".sidebar-nav .nav-item"),
    tabViews: document.querySelectorAll(".tab-view"),
    pageTitle: document.getElementById("pageTitle"),
    sidebar: document.getElementById("sidebar"),
    mobileMenuBtn: document.getElementById("mobileMenuBtn"),
    sidebarCloseBtn: document.getElementById("sidebarCloseBtn"),
    themeToggleBtn: document.getElementById("themeToggleBtn"),
    
    // Live Sync Indicators
    topSyncTime: document.getElementById("topSyncTime"),
    lastUpdatedText: document.getElementById("lastUpdatedText"),
    manualSyncBtn: document.getElementById("manualSyncBtn"),
    quickSyncBtn: document.getElementById("quickSyncBtn"),
    openHostingGuideBtn: document.getElementById("openHostingGuideBtn"),

    // Filters
    filterLocation: document.getElementById("filterLocation"),
    fuelSegmentControl: document.getElementById("fuelSegmentControl"),
    filterModel: document.getElementById("filterModel"),
    filterStage: document.getElementById("filterStage"),
    globalSearchInput: document.getElementById("globalSearchInput"),
    clearSearchBtn: document.getElementById("clearSearchBtn"),
    resetFiltersBtn: document.getElementById("resetFiltersBtn"),
    filterSummaryText: document.getElementById("filterSummaryText"),
    
    // Badges & KPIs
    locCountBadge: document.getElementById("locCountBadge"),
    evShareBadge: document.getElementById("evShareBadge"),
    badgeIBNR: document.getElementById("badgeIBNR"),
    badgeEPAYMENT: document.getElementById("badgeEPAYMENT"),
    badgeRTO: document.getElementById("badgeRTO"),
    badgeINS: document.getElementById("badgeINS"),
    badgeDELIVERED: document.getElementById("badgeDELIVERED"),

    // 5 Core Stage KPI Cards
    kpiIBNR: document.getElementById("kpiIBNR"),
    kpiIBNRPhysical: document.getElementById("kpiIBNRPhysical"),
    kpiIBNRPV: document.getElementById("kpiIBNRPV"),
    kpiIBNREV: document.getElementById("kpiIBNREV"),

    kpiEPAY: document.getElementById("kpiEPAY"),
    kpiEPAYAmount: document.getElementById("kpiEPAYAmount"),
    kpiEPAYPV: document.getElementById("kpiEPAYPV"),
    kpiEPAYEV: document.getElementById("kpiEPAYEV"),

    kpiRTO: document.getElementById("kpiRTO"),
    kpiRTOPV: document.getElementById("kpiRTOPV"),
    kpiRTOEV: document.getElementById("kpiRTOEV"),

    kpiINS: document.getElementById("kpiINS"),
    kpiINSPV: document.getElementById("kpiINSPV"),
    kpiINSEV: document.getElementById("kpiINSEV"),

    kpiDEL: document.getElementById("kpiDEL"),
    kpiDELPV: document.getElementById("kpiDELPV"),
    kpiDELEV: document.getElementById("kpiDELEV"),

    // IBNR Specific View Elements
    ibnrKpiPhysical: document.getElementById("ibnrKpiPhysical"),
    ibnrKpiTransit: document.getElementById("ibnrKpiTransit"),
    ibnrKpiInsDone: document.getElementById("ibnrKpiInsDone"),
    ibnrKpiInsPending: document.getElementById("ibnrKpiInsPending"),
    ibnrKpiEpayDone: document.getElementById("ibnrKpiEpayDone"),
    ibnrKpiEpayPending: document.getElementById("ibnrKpiEpayPending"),
    ibnrKpiRtoDone: document.getElementById("ibnrKpiRtoDone"),
    ibnrKpiRtoPending: document.getElementById("ibnrKpiRtoPending"),

    chipAllCount: document.getElementById("chipAllCount"),
    chipPhysCount: document.getElementById("chipPhysCount"),
    chipTransCount: document.getElementById("chipTransCount"),
    chipForm20PendCount: document.getElementById("chipForm20PendCount"),
    chipEpayPendCount: document.getElementById("chipEpayPendCount"),
    chipRtoPendCount: document.getElementById("chipRtoPendCount"),

    ibnrDetailedBody: document.getElementById("ibnrDetailedBody"),
    ibnrTableCount: document.getElementById("ibnrTableCount"),
    ibnrTableSearch: document.getElementById("ibnrTableSearch"),
    ibnrLocFilter: document.getElementById("ibnrLocFilter"),
    ibnrPaginationInfo: document.getElementById("ibnrPaginationInfo"),
    ibnrPaginationControls: document.getElementById("ibnrPaginationControls"),

    // Tables
    stageMatrixBody: document.getElementById("stageMatrixBody"),
    locationDetailedBody: document.getElementById("locationDetailedBody"),
    locationDetailedFooter: document.getElementById("locationDetailedFooter"),
    locationTableSearch: document.getElementById("locationTableSearch"),
    pvevModelMatrixBody: document.getElementById("pvevModelMatrixBody"),
    
    // PV vs EV stats
    pvevPVTotal: document.getElementById("pvevPVTotal"),
    pvevPVPercent: document.getElementById("pvevPVPercent"),
    pvevEVTotal: document.getElementById("pvevEVTotal"),
    pvevEVPercent: document.getElementById("pvevEVPercent"),
    pvevPVDeliveryCount: document.getElementById("pvevPVDeliveryCount"),
    pvevEVDeliveryCount: document.getElementById("pvevEVDeliveryCount"),

    // Location Highlights
    topVolumeLocName: document.getElementById("topVolumeLocName"),
    topVolumeLocCount: document.getElementById("topVolumeLocCount"),
    topEvLocName: document.getElementById("topEvLocName"),
    topEvLocPercent: document.getElementById("topEvLocPercent"),
    topDelLocName: document.getElementById("topDelLocName"),
    topDelLocRate: document.getElementById("topDelLocRate"),

    // Stage Drilldown
    currentStageBadge: document.getElementById("currentStageBadge"),
    currentStageHeading: document.getElementById("currentStageHeading"),
    currentStageDescription: document.getElementById("currentStageDescription"),
    stageTotalCount: document.getElementById("stageTotalCount"),
    stagePVCount: document.getElementById("stagePVCount"),
    stageEVCount: document.getElementById("stageEVCount"),
    stageLocCount: document.getElementById("stageLocCount"),
    stageRecordsBody: document.getElementById("stageRecordsBody"),
    stageTableRecordCount: document.getElementById("stageTableRecordCount"),
    stageTableSearch: document.getElementById("stageTableSearch"),
    stageLocFilter: document.getElementById("stageLocFilter"),
    stageFuelFilter: document.getElementById("stageFuelFilter"),
    paginationInfo: document.getElementById("paginationInfo"),
    paginationControls: document.getElementById("paginationControls"),

    // Data Sources & Sync
    gSheetUrlInput: document.getElementById("gSheetUrlInput"),
    fetchSheetBtn: document.getElementById("fetchSheetBtn"),
    loadSampleDataBtn: document.getElementById("loadSampleDataBtn"),
    exportDataBtn: document.getElementById("exportDataBtn"),
    exportLocationSummaryBtn: document.getElementById("exportLocationSummaryBtn"),
    exportStageTableBtn: document.getElementById("exportStageTableBtn"),
    exportIbnrBtn: document.getElementById("exportIbnrBtn"),

    // Detail Modal
    detailModal: document.getElementById("detailModal"),
    closeDetailModalBtn: document.getElementById("closeDetailModalBtn"),
    modalStageBadge: document.getElementById("modalStageBadge"),
    modalCustomerName: document.getElementById("modalCustomerName"),
    modalDetailContent: document.getElementById("modalDetailContent")
  };

  // Helper: Normalize Stage Name
  function normalizeStage(stageStr) {
    if (!stageStr) return "IBNR";
    const s = stageStr.toUpperCase().trim();
    if (s.includes("DELIVER")) return "DELIVERED";
    if (s.includes("INS") || s.includes("FORM20") || s.includes("FORM 20")) return "INS /FORM20";
    if (s.includes("RTO")) return "RTO";
    if (s.includes("E-PAY") || s.includes("EPAY") || s.includes("PAYMENT")) return "E-PAYMENT";
    if (s.includes("IBNR") || s.includes("BOOKING") || s.includes("INVOIC")) return "IBNR";
    return s;
  }

  function normalizeLoc(loc) {
    if (!loc) return "VADAPALANI";
    const u = loc.toUpperCase().trim();
    if (u === "THIRUVALLUR" || u === "TIRUVALLUR") return "TIRUVALLUR";
    if (u.includes("RED")) return "REDHILLS";
    if (u.includes("VADA")) return "VADAPALANI";
    if (u.includes("AMB")) return "AMBATTUR";
    if (u.includes("GUIN")) return "GUINDY";
    if (u.includes("TAMB")) return "TAMBARAM";
    if (u.includes("ANNA")) return "ANNA NAGAR";
    if (u.includes("PORUR")) return "PORUR";
    return u;
  }

  function normalizeFuel(fuel, model) {
    let f = fuel ? fuel.toUpperCase().trim() : "";
    if (f === "EV" || f === "ELECTRIC") return "EV";
    if (f === "PV" || f === "ICE" || f === "PETROL" || f === "DIESEL" || f === "CNG") return "PV";
    if (model) {
      const m = model.toUpperCase();
      if (m.includes("EV") || m.includes("ELECTRIC") || m.includes("XPRES T EV")) return "EV";
    }
    return "PV";
  }

  // Populate Filter Dropdowns
  function populateFilterDropdowns() {
    const records = window.AUG26_STORE.records;
    
    // Unique Locations
    const locations = Array.from(new Set(records.map(r => normalizeLoc(r.location)).filter(Boolean))).sort();
    DOM.filterLocation.innerHTML = `<option value="ALL">All Locations (${locations.length})</option>`;
    DOM.stageLocFilter.innerHTML = `<option value="ALL">All Locations</option>`;
    DOM.ibnrLocFilter.innerHTML = `<option value="ALL">All Locations</option>`;
    locations.forEach(loc => {
      DOM.filterLocation.innerHTML += `<option value="${loc}">${loc}</option>`;
      DOM.stageLocFilter.innerHTML += `<option value="${loc}">${loc}</option>`;
      DOM.ibnrLocFilter.innerHTML += `<option value="${loc}">${loc}</option>`;
    });

    // Unique Models
    const models = Array.from(new Set(records.map(r => r.model).filter(Boolean))).sort();
    DOM.filterModel.innerHTML = `<option value="ALL">All Models (${models.length})</option>`;
    models.forEach(model => {
      DOM.filterModel.innerHTML += `<option value="${model}">${model}</option>`;
    });

    DOM.locCountBadge.textContent = locations.length;
  }

  // Get Global Filtered Records
  function getFilteredRecords() {
    return window.AUG26_STORE.records.filter(item => {
      // Global Search
      if (state.filters.search) {
        const q = state.filters.search.toLowerCase();
        const match = 
          (item.customerName && item.customerName.toLowerCase().includes(q)) ||
          (item.mobile && item.mobile.toLowerCase().includes(q)) ||
          (item.model && item.model.toLowerCase().includes(q)) ||
          (item.location && item.location.toLowerCase().includes(q)) ||
          (item.chassisNo && item.chassisNo.toLowerCase().includes(q)) ||
          (item.bookingId && item.bookingId.toLowerCase().includes(q)) ||
          (item.salesAdvisor && item.salesAdvisor.toLowerCase().includes(q)) ||
          (item.teamLead && item.teamLead.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Location
      if (state.filters.location !== "ALL" && normalizeLoc(item.location) !== normalizeLoc(state.filters.location)) {
        return false;
      }

      // Fuel Type
      if (state.filters.fuel !== "ALL" && item.fuelType !== state.filters.fuel) {
        return false;
      }

      // Model
      if (state.filters.model !== "ALL" && item.model !== state.filters.model) {
        return false;
      }

      // Stage
      if (state.filters.stage !== "ALL" && normalizeStage(item.stage) !== normalizeStage(state.filters.stage)) {
        return false;
      }

      return true;
    });
  }

  // Update Core 5 Stage KPIs
  function updateKPIs(filtered) {
    const total = filtered.length;
    const pvCount = filtered.filter(r => r.fuelType === "PV").length;
    const evCount = filtered.filter(r => r.fuelType === "EV").length;
    const evShare = total > 0 ? ((evCount / total) * 100).toFixed(1) : 0;

    DOM.evShareBadge.textContent = `${evShare}% EV`;

    // Counts per stage
    const stages = ["IBNR", "E-PAYMENT", "RTO", "INS /FORM20", "DELIVERED"];
    const stageCounts = {};

    stages.forEach(st => {
      const recs = filtered.filter(r => normalizeStage(r.stage) === st);
      const stTotal = recs.length;
      const stPV = recs.filter(r => r.fuelType === "PV").length;
      const stEV = recs.filter(r => r.fuelType === "EV").length;
      stageCounts[st] = { total: stTotal, pv: stPV, ev: stEV, recs };
    });

    // Update Sidebar Badges
    DOM.badgeIBNR.textContent = stageCounts["IBNR"].total;
    DOM.badgeEPAYMENT.textContent = stageCounts["E-PAYMENT"].total;
    DOM.badgeRTO.textContent = stageCounts["RTO"].total;
    DOM.badgeINS.textContent = stageCounts["INS /FORM20"].total;
    DOM.badgeDELIVERED.textContent = stageCounts["DELIVERED"].total;

    // 1. IBNR Details
    const ibnrRecs = stageCounts["IBNR"].recs;
    const ibnrPhysical = ibnrRecs.filter(r => (r.stockStatus || "").toUpperCase().includes("PHYSICAL")).length;
    const ibnrTransit = ibnrRecs.filter(r => (r.stockStatus || "").toUpperCase().includes("TRANSIT")).length;

    DOM.kpiIBNR.textContent = stageCounts["IBNR"].total;
    DOM.kpiIBNRPhysical.textContent = `${ibnrPhysical} Phys / ${ibnrTransit} Tr`;
    DOM.kpiIBNRPV.textContent = stageCounts["IBNR"].pv;
    DOM.kpiIBNREV.textContent = stageCounts["IBNR"].ev;

    // 2. E-PAYMENT Details
    const epayRecs = stageCounts["E-PAYMENT"].recs;
    let totalEpayAmt = 0;
    epayRecs.forEach(r => {
      const num = Number(String(r.amount || "").replace(/[^0-9.]/g, ''));
      if (!isNaN(num)) totalEpayAmt += num;
    });
    const epayAmtFormatted = totalEpayAmt > 100000 
      ? `₹${(totalEpayAmt / 100000).toFixed(1)}L` 
      : `₹${totalEpayAmt.toLocaleString('en-IN')}`;

    DOM.kpiEPAY.textContent = stageCounts["E-PAYMENT"].total;
    DOM.kpiEPAYAmount.textContent = epayAmtFormatted;
    DOM.kpiEPAYPV.textContent = stageCounts["E-PAYMENT"].pv;
    DOM.kpiEPAYEV.textContent = stageCounts["E-PAYMENT"].ev;

    // 3. RTO COMPLETED Details
    DOM.kpiRTO.textContent = stageCounts["RTO"].total;
    DOM.kpiRTOPV.textContent = stageCounts["RTO"].pv;
    DOM.kpiRTOEV.textContent = stageCounts["RTO"].ev;

    // 4. INS / FORM 20 Details
    DOM.kpiINS.textContent = stageCounts["INS /FORM20"].total;
    DOM.kpiINSPV.textContent = stageCounts["INS /FORM20"].pv;
    DOM.kpiINSEV.textContent = stageCounts["INS /FORM20"].ev;

    // 5. DELIVERED Details
    DOM.kpiDEL.textContent = stageCounts["DELIVERED"].total;
    DOM.kpiDELPV.textContent = stageCounts["DELIVERED"].pv;
    DOM.kpiDELEV.textContent = stageCounts["DELIVERED"].ev;

    // Filter Summary text
    let summaryParts = [`${total} record${total === 1 ? '' : 's'}`];
    if (state.filters.location !== "ALL") summaryParts.push(`Location: ${state.filters.location}`);
    if (state.filters.fuel !== "ALL") summaryParts.push(`Fuel: ${state.filters.fuel}`);
    if (state.filters.model !== "ALL") summaryParts.push(`Model: ${state.filters.model}`);
    if (state.filters.stage !== "ALL") summaryParts.push(`Stage: ${state.filters.stage}`);
    if (state.filters.search) summaryParts.push(`Search: "${state.filters.search}"`);
    DOM.filterSummaryText.textContent = summaryParts.join(" • ");

    // Render Stage Matrix Table in Overview
    renderStageMatrixTable(stageCounts, total);

    // Update PV vs EV Tab Cards
    updatePvEvStats(filtered, pvCount, evCount, total);

    // Render IBNR Specialized View
    renderIbnrView(ibnrRecs);
  }

  // Render Stage Breakdown Matrix
  function renderStageMatrixTable(stageCounts, grandTotal) {
    const stageMeta = [
      { name: "IBNR", focus: "Invoiced Stock Awaiting RTO & Delivery", colorClass: "ibnr" },
      { name: "E-PAYMENT", focus: "Payment Gateway Clearance & Receipts", colorClass: "epayment" },
      { name: "RTO", focus: "RTO Tax & Registration Completed", colorClass: "rto" },
      { name: "INS /FORM20", focus: "Insurance Policy Bound & Form 20 Verification", colorClass: "ins" },
      { name: "DELIVERED", focus: "Customer Handover Completed", colorClass: "delivered" }
    ];

    DOM.stageMatrixBody.innerHTML = stageMeta.map(st => {
      const data = stageCounts[st.name] || { total: 0, pv: 0, ev: 0 };
      const evShare = data.total > 0 ? ((data.ev / data.total) * 100).toFixed(1) : "0.0";
      return `
        <tr>
          <td><span class="stage-tag ${st.colorClass}">${st.name === 'RTO' ? 'RTO COMPLETED' : st.name}</span></td>
          <td style="color: var(--text-muted);">${st.focus}</td>
          <td class="text-right"><strong>${data.total.toLocaleString()}</strong></td>
          <td class="text-right"><span class="tag-pv"><i class="fa-solid fa-gas-pump"></i> ${data.pv}</span></td>
          <td class="text-right"><span class="tag-ev"><i class="fa-solid fa-bolt"></i> ${data.ev}</span></td>
          <td class="text-right">
            <div class="cell-progress" style="justify-content: flex-end;">
              <span>${evShare}%</span>
              <div class="progress-bar-bg"><div class="progress-bar-fill ev" style="width: ${Math.min(100, evShare)}%"></div></div>
            </div>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="window.navigateToStage('${st.name}')">
              <i class="fa-solid fa-arrow-right"></i> View Tab
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  // ================= IBNR SPECIALIZED VIEW =================
  function renderIbnrView(allIbnrRecs) {
    const physCount = allIbnrRecs.filter(r => (r.stockStatus || "").toUpperCase().includes("PHYSICAL")).length;
    const transCount = allIbnrRecs.filter(r => (r.stockStatus || "").toUpperCase().includes("TRANSIT")).length;

    const insDone = allIbnrRecs.filter(r => (r.insStatus || "").toUpperCase().includes("DONE") && !(r.insStatus || "").toUpperCase().includes("NOT DONE")).length;
    const insPend = allIbnrRecs.length - insDone;

    const epayDone = allIbnrRecs.filter(r => (r.epayStatus || "").toUpperCase().includes("DONE") && !(r.epayStatus || "").toUpperCase().includes("NOT DONE")).length;
    const epayPend = allIbnrRecs.length - epayDone;

    const rtoDone = allIbnrRecs.filter(r => (r.rtoStatus || "").toUpperCase().includes("DONE") && !(r.rtoStatus || "").toUpperCase().includes("NOT DONE")).length;
    const rtoPend = allIbnrRecs.length - rtoDone;

    // Update KPI cards
    DOM.ibnrKpiPhysical.textContent = `${physCount} Physical`;
    DOM.ibnrKpiTransit.textContent = `${transCount} in Transit`;
    DOM.ibnrKpiInsDone.textContent = `${insDone} Done`;
    DOM.ibnrKpiInsPending.textContent = `${insPend} Pending`;
    DOM.ibnrKpiEpayDone.textContent = `${epayDone} Done`;
    DOM.ibnrKpiEpayPending.textContent = `${epayPend} Pending`;
    DOM.ibnrKpiRtoDone.textContent = `${rtoDone} Done`;
    DOM.ibnrKpiRtoPending.textContent = `${rtoPend} Pending`;

    // Chip counts
    DOM.chipAllCount.textContent = allIbnrRecs.length;
    DOM.chipPhysCount.textContent = physCount;
    DOM.chipTransCount.textContent = transCount;
    DOM.chipForm20PendCount.textContent = insPend;
    DOM.chipEpayPendCount.textContent = epayPend;
    DOM.chipRtoPendCount.textContent = rtoPend;

    // Filter Table
    let filtered = allIbnrRecs.filter(r => {
      if (state.ibnrTable.location !== "ALL" && normalizeLoc(r.location) !== normalizeLoc(state.ibnrTable.location)) return false;
      
      // Sub Filters
      if (state.ibnrTable.subFilter === "PHYSICAL" && !(r.stockStatus || "").toUpperCase().includes("PHYSICAL")) return false;
      if (state.ibnrTable.subFilter === "TRANSIT" && !(r.stockStatus || "").toUpperCase().includes("TRANSIT")) return false;
      if (state.ibnrTable.subFilter === "FORM20_PENDING" && (r.insStatus || "").toUpperCase().includes("DONE") && !(r.insStatus || "").toUpperCase().includes("NOT DONE")) return false;
      if (state.ibnrTable.subFilter === "EPAY_PENDING" && (r.epayStatus || "").toUpperCase().includes("DONE") && !(r.epayStatus || "").toUpperCase().includes("NOT DONE")) return false;
      if (state.ibnrTable.subFilter === "RTO_PENDING" && (r.rtoStatus || "").toUpperCase().includes("DONE") && !(r.rtoStatus || "").toUpperCase().includes("NOT DONE")) return false;

      if (state.ibnrTable.search) {
        const q = state.ibnrTable.search.toLowerCase();
        const match = 
          (r.customerName && r.customerName.toLowerCase().includes(q)) ||
          (r.model && r.model.toLowerCase().includes(q)) ||
          (r.chassisNo && r.chassisNo.toLowerCase().includes(q)) ||
          (r.bookingId && r.bookingId.toLowerCase().includes(q)) ||
          (r.location && r.location.toLowerCase().includes(q)) ||
          (r.salesAdvisor && r.salesAdvisor.toLowerCase().includes(q)) ||
          (r.remarks && r.remarks.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });

    DOM.ibnrTableCount.textContent = `${filtered.length} records`;

    // Pagination
    const totalPages = Math.ceil(filtered.length / state.ibnrTable.pageSize) || 1;
    if (state.ibnrTable.page > totalPages) state.ibnrTable.page = totalPages;
    if (state.ibnrTable.page < 1) state.ibnrTable.page = 1;

    const startIdx = (state.ibnrTable.page - 1) * state.ibnrTable.pageSize;
    const pageRecords = filtered.slice(startIdx, startIdx + state.ibnrTable.pageSize);

    DOM.ibnrDetailedBody.innerHTML = pageRecords.map((r, i) => {
      const isPhys = (r.stockStatus || "").toUpperCase().includes("PHYSICAL");
      const isForm20Done = (r.insStatus || "").toUpperCase().includes("DONE") && !(r.insStatus || "").toUpperCase().includes("NOT DONE");
      const isEpayDone = (r.epayStatus || "").toUpperCase().includes("DONE") && !(r.epayStatus || "").toUpperCase().includes("NOT DONE");
      const isRtoDone = (r.rtoStatus || "").toUpperCase().includes("DONE") && !(r.rtoStatus || "").toUpperCase().includes("NOT DONE");
      const isEv = r.fuelType === "EV";

      return `
        <tr>
          <td style="color: var(--text-muted); font-size: 0.75rem;">${startIdx + i + 1}</td>
          <td><span style="font-size: 0.75rem;">${r.date || '-'}</span></td>
          <td><span style="font-family: var(--font-mono); font-size: 0.75rem;">${r.bookingId || '-'}</span></td>
          <td><strong>${r.customerName}</strong></td>
          <td><strong>${r.model}</strong></td>
          <td><span class="${isEv ? 'tag-ev' : 'tag-pv'}">${r.fuelType}</span></td>
          <td><span style="font-family: var(--font-mono); font-size: 0.75rem;">${r.chassisNo || '-'}</span></td>
          <td><span class="status-pill ${isPhys ? 'physical' : 'transit'}">${r.stockStatus || 'PHYSICAL'}</span></td>
          <td><span class="status-pill ${isForm20Done ? 'done' : 'pending'}"><i class="fa-solid ${isForm20Done ? 'fa-check' : 'fa-clock'}"></i> ${isForm20Done ? 'Done' : 'Pending'}</span></td>
          <td><span class="status-pill ${isEpayDone ? 'done' : 'pending'}"><i class="fa-solid ${isEpayDone ? 'fa-check' : 'fa-clock'}"></i> ${isEpayDone ? 'Done' : 'Pending'}</span></td>
          <td><span class="status-pill ${isRtoDone ? 'done' : 'pending'}"><i class="fa-solid ${isRtoDone ? 'fa-check' : 'fa-clock'}"></i> ${isRtoDone ? 'Done' : 'Pending'}</span></td>
          <td>${r.salesAdvisor || '-'}</td>
          <td><span class="badge-tag">${r.location}</span></td>
          <td style="font-size: 0.75rem; color: var(--text-muted); max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${r.remarks || '-'}">${r.remarks || '-'}</td>
          <td><span style="font-size: 0.75rem;">${r.rtoPlanDate || '-'}</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="window.openDetailModal('${r.id}')">
              <i class="fa-solid fa-eye"></i>
            </button>
          </td>
        </tr>
      `;
    }).join("");

    if (pageRecords.length === 0) {
      DOM.ibnrDetailedBody.innerHTML = `
        <tr>
          <td colspan="16" class="text-center" style="padding: 2rem; color: var(--text-muted);">
            <i class="fa-solid fa-inbox" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
            No IBNR records found matching current filters.
          </td>
        </tr>
      `;
    }

    const endIdx = Math.min(startIdx + state.ibnrTable.pageSize, filtered.length);
    DOM.ibnrPaginationInfo.textContent = filtered.length > 0 
      ? `Showing ${startIdx + 1}-${endIdx} of ${filtered.length} records`
      : `0 records`;

    renderIbnrPaginationControls(totalPages);
  }

  function renderIbnrPaginationControls(totalPages) {
    let html = `
      <button class="page-btn" ${state.ibnrTable.page === 1 ? 'disabled' : ''} onclick="window.changeIbnrPage(${state.ibnrTable.page - 1})">
        <i class="fa-solid fa-chevron-left"></i>
      </button>
    `;
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || (p >= state.ibnrTable.page - 1 && p <= state.ibnrTable.page + 1)) {
        html += `<button class="page-btn ${p === state.ibnrTable.page ? 'active' : ''}" onclick="window.changeIbnrPage(${p})">${p}</button>`;
      }
    }
    html += `
      <button class="page-btn" ${state.ibnrTable.page === totalPages ? 'disabled' : ''} onclick="window.changeIbnrPage(${state.ibnrTable.page + 1})">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    `;
    DOM.ibnrPaginationControls.innerHTML = html;
  }

  // IBNR Filter Chips Listener
  document.querySelectorAll(".ibnr-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".ibnr-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      state.ibnrTable.subFilter = chip.getAttribute("data-ibnr-filter");
      state.ibnrTable.page = 1;
      const ibnrRecs = window.AUG26_STORE.records.filter(r => normalizeStage(r.stage) === "IBNR");
      renderIbnrView(ibnrRecs);
    });
  });

  DOM.ibnrTableSearch.addEventListener("input", (e) => {
    state.ibnrTable.search = e.target.value.trim();
    state.ibnrTable.page = 1;
    const ibnrRecs = window.AUG26_STORE.records.filter(r => normalizeStage(r.stage) === "IBNR");
    renderIbnrView(ibnrRecs);
  });

  DOM.ibnrLocFilter.addEventListener("change", (e) => {
    state.ibnrTable.location = e.target.value;
    state.ibnrTable.page = 1;
    const ibnrRecs = window.AUG26_STORE.records.filter(r => normalizeStage(r.stage) === "IBNR");
    renderIbnrView(ibnrRecs);
  });

  window.changeIbnrPage = function(page) {
    state.ibnrTable.page = page;
    const ibnrRecs = window.AUG26_STORE.records.filter(r => normalizeStage(r.stage) === "IBNR");
    renderIbnrView(ibnrRecs);
  };

  // Update PV vs EV Tab Metrics
  function updatePvEvStats(filtered, pvCount, evCount, total) {
    const pvDelivered = filtered.filter(r => r.fuelType === "PV" && normalizeStage(r.stage) === "DELIVERED").length;
    const evDelivered = filtered.filter(r => r.fuelType === "EV" && normalizeStage(r.stage) === "DELIVERED").length;

    const pvPct = total > 0 ? ((pvCount / total) * 100).toFixed(1) : "0.0";
    const evPct = total > 0 ? ((evCount / total) * 100).toFixed(1) : "0.0";

    DOM.pvevPVTotal.textContent = pvCount.toLocaleString();
    DOM.pvevPVPercent.textContent = `${pvPct}% share`;

    DOM.pvevEVTotal.textContent = evCount.toLocaleString();
    DOM.pvevEVPercent.textContent = `${evPct}% share`;

    DOM.pvevPVDeliveryCount.textContent = `${pvDelivered} delivered`;
    DOM.pvevEVDeliveryCount.textContent = `${evDelivered} delivered`;

    // Render PV vs EV Model Matrix
    renderPvEvModelMatrix(filtered);
  }

  // Render PV vs EV Model Matrix
  function renderPvEvModelMatrix(filtered) {
    const modelMap = {};

    filtered.forEach(r => {
      const model = r.model || "Unknown";
      if (!modelMap[model]) {
        modelMap[model] = {
          model,
          fuelType: r.fuelType || "PV",
          total: 0,
          ibnr: 0,
          epayment: 0,
          rto: 0,
          ins: 0,
          delivered: 0
        };
      }
      modelMap[model].total++;
      const stage = normalizeStage(r.stage);
      if (stage === "IBNR") modelMap[model].ibnr++;
      else if (stage === "E-PAYMENT") modelMap[model].epayment++;
      else if (stage === "RTO") modelMap[model].rto++;
      else if (stage === "INS /FORM20") modelMap[model].ins++;
      else if (stage === "DELIVERED") modelMap[model].delivered++;
    });

    const list = Object.values(modelMap).sort((a, b) => b.total - a.total);

    DOM.pvevModelMatrixBody.innerHTML = list.map(item => {
      const isEv = item.fuelType === "EV";
      return `
        <tr>
          <td><strong>${item.model}</strong></td>
          <td><span class="${isEv ? 'tag-ev' : 'tag-pv'}"><i class="fa-solid ${isEv ? 'fa-bolt' : 'fa-gas-pump'}"></i> ${item.fuelType}</span></td>
          <td class="text-right text-success"><strong>${item.delivered}</strong></td>
          <td class="text-right">${item.rto}</td>
          <td class="text-right">${item.epayment}</td>
          <td class="text-right">${item.ins}</td>
          <td class="text-right">${item.ibnr}</td>
          <td class="text-right"><strong>${item.total}</strong></td>
        </tr>
      `;
    }).join("");
  }

  // Location Wise Summary Calculation & Table
  function updateLocationSummary(filtered) {
    const locMap = {};

    filtered.forEach(r => {
      const loc = normalizeLoc(r.location) || "Unspecified";
      if (!locMap[loc]) {
        locMap[loc] = {
          location: loc,
          total: 0,
          pv: 0,
          ev: 0,
          ibnr: 0,
          epayment: 0,
          rto: 0,
          ins: 0,
          delivered: 0
        };
      }
      const data = locMap[loc];
      data.total++;
      if (r.fuelType === "EV") data.ev++;
      else data.pv++;

      const st = normalizeStage(r.stage);
      if (st === "IBNR") data.ibnr++;
      else if (st === "E-PAYMENT") data.epayment++;
      else if (st === "RTO") data.rto++;
      else if (st === "INS /FORM20") data.ins++;
      else if (st === "DELIVERED") data.delivered++;
    });

    let locList = Object.values(locMap);

    // Compute Rates
    locList.forEach(l => {
      l.evShare = l.total > 0 ? (l.ev / l.total) * 100 : 0;
      l.delRate = l.total > 0 ? (l.delivered / l.total) * 100 : 0;
    });

    // Update Highlights
    if (locList.length > 0) {
      const topDel = [...locList].sort((a, b) => b.delivered - a.delivered)[0];
      DOM.topVolumeLocName.textContent = topDel.location;
      DOM.topVolumeLocCount.textContent = `${topDel.delivered} Units Delivered`;

      const topEv = [...locList].sort((a, b) => b.evShare - a.evShare)[0];
      DOM.topEvLocName.textContent = topEv.location;
      DOM.topEvLocPercent.textContent = `${topEv.evShare.toFixed(1)}% EV Share (${topEv.ev} EVs)`;

      const topRto = [...locList].sort((a, b) => b.rto - a.rto)[0];
      DOM.topDelLocName.textContent = topRto.location;
      DOM.topDelLocRate.textContent = `${topRto.rto} RTO Completed`;
    }

    // Filter by table search
    const searchQuery = (DOM.locationTableSearch.value || "").toLowerCase().trim();
    if (searchQuery) {
      locList = locList.filter(l => l.location.toLowerCase().includes(searchQuery));
    }

    // Sort
    const { column, direction } = state.locationTableSort;
    locList.sort((a, b) => {
      let valA = a[column];
      let valB = b[column];
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });

    // Render Table Rows
    DOM.locationDetailedBody.innerHTML = locList.map(l => {
      return `
        <tr>
          <td>
            <a class="loc-link" href="#" onclick="window.filterByLocation('${l.location}'); return false;">
              <i class="fa-solid fa-location-dot" style="font-size: 0.75rem; margin-right: 4px;"></i> ${l.location}
            </a>
          </td>
          <td class="text-right text-success"><strong>${l.delivered}</strong></td>
          <td class="text-right"><strong>${l.rto}</strong></td>
          <td class="text-right">${l.epayment}</td>
          <td class="text-right">${l.ins}</td>
          <td class="text-right">${l.ibnr}</td>
          <td class="text-right"><span class="tag-pv">${l.pv}</span></td>
          <td class="text-right"><span class="tag-ev">${l.ev}</span></td>
          <td class="text-right">
            <div class="cell-progress" style="justify-content: flex-end;">
              <span>${l.evShare.toFixed(1)}%</span>
              <div class="progress-bar-bg"><div class="progress-bar-fill ev" style="width: ${Math.min(100, l.evShare)}%"></div></div>
            </div>
          </td>
          <td>
            <button class="btn btn-ghost btn-sm" onclick="window.filterByLocation('${l.location}')" title="Filter by this location">
              <i class="fa-solid fa-filter"></i>
            </button>
          </td>
        </tr>
      `;
    }).join("");

    // Footer Totals
    const tot = locList.reduce((acc, curr) => {
      acc.total += curr.total;
      acc.pv += curr.pv;
      acc.ev += curr.ev;
      acc.ibnr += curr.ibnr;
      acc.epayment += curr.epayment;
      acc.rto += curr.rto;
      acc.ins += curr.ins;
      acc.delivered += curr.delivered;
      return acc;
    }, { total: 0, pv: 0, ev: 0, ibnr: 0, epayment: 0, rto: 0, ins: 0, delivered: 0 });

    const totEvShare = tot.total > 0 ? ((tot.ev / tot.total) * 100).toFixed(1) : "0.0";

    DOM.locationDetailedFooter.innerHTML = `
      <tr>
        <td>TOTAL (${locList.length} Locations)</td>
        <td class="text-right text-success">${tot.delivered.toLocaleString()}</td>
        <td class="text-right">${tot.rto.toLocaleString()}</td>
        <td class="text-right">${tot.epayment.toLocaleString()}</td>
        <td class="text-right">${tot.ins.toLocaleString()}</td>
        <td class="text-right">${tot.ibnr.toLocaleString()}</td>
        <td class="text-right">${tot.pv.toLocaleString()}</td>
        <td class="text-right">${tot.ev.toLocaleString()}</td>
        <td class="text-right">${totEvShare}%</td>
        <td></td>
      </tr>
    `;
  }

  // Update General Stage Drilldown (E-Payment, RTO, INS/Form20, Delivered)
  function updateStageDrilldown() {
    const stage = state.currentStageDrilldown;
    const stageClass = stage === "INS /FORM20" ? "ins" : stage.toLowerCase().replace(/[^a-z]/g, '');

    DOM.currentStageBadge.className = `stage-badge-large ${stageClass}`;
    DOM.currentStageBadge.textContent = stage === "RTO" ? "RTO COMPLETED" : stage;
    DOM.currentStageHeading.textContent = `${stage === 'RTO' ? 'RTO Completed' : stage} Customer & Vehicle Register`;

    const descriptions = {
      "IBNR": "Invoiced & booked vehicles awaiting registration, physical arrival, or gate dispatch.",
      "E-PAYMENT": "E-Payment transaction clearance, receipt number tracking, and dealer accounts confirmation.",
      "RTO": "RTO tax filing and permanent vehicle registration numbers completed.",
      "INS /FORM20": "Insurance policy binding and Form 20 RTO registration document completion.",
      "DELIVERED": "Successfully delivered vehicles with customer gate-pass clearance and handover sign-off."
    };
    DOM.currentStageDescription.textContent = descriptions[stage] || "Detailed tracking records for this operational stage.";

    // Get all records in this stage
    const stageAllRecords = window.AUG26_STORE.records.filter(r => normalizeStage(r.stage) === stage);
    
    // Filter by Stage local filters + global search
    let filtered = stageAllRecords.filter(r => {
      if (state.stageTable.location !== "ALL" && normalizeLoc(r.location) !== normalizeLoc(state.stageTable.location)) return false;
      if (state.stageTable.fuel !== "ALL" && r.fuelType !== state.stageTable.fuel) return false;
      if (state.stageTable.search) {
        const q = state.stageTable.search.toLowerCase();
        const match = 
          (r.customerName && r.customerName.toLowerCase().includes(q)) ||
          (r.mobile && r.mobile.toLowerCase().includes(q)) ||
          (r.model && r.model.toLowerCase().includes(q)) ||
          (r.location && r.location.toLowerCase().includes(q)) ||
          (r.chassisNo && r.chassisNo.toLowerCase().includes(q)) ||
          (r.bookingId && r.bookingId.toLowerCase().includes(q)) ||
          (r.salesAdvisor && r.salesAdvisor.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });

    const pvCount = stageAllRecords.filter(r => r.fuelType === "PV").length;
    const evCount = stageAllRecords.filter(r => r.fuelType === "EV").length;
    const locSet = new Set(stageAllRecords.map(r => normalizeLoc(r.location)).filter(Boolean));

    DOM.stageTotalCount.textContent = stageAllRecords.length.toLocaleString();
    DOM.stagePVCount.textContent = pvCount.toLocaleString();
    DOM.stageEVCount.textContent = evCount.toLocaleString();
    DOM.stageLocCount.textContent = locSet.size;

    DOM.stageTableRecordCount.textContent = `${filtered.length} records`;

    // Pagination
    const totalPages = Math.ceil(filtered.length / state.stageTable.pageSize) || 1;
    if (state.stageTable.page > totalPages) state.stageTable.page = totalPages;
    if (state.stageTable.page < 1) state.stageTable.page = 1;

    const startIdx = (state.stageTable.page - 1) * state.stageTable.pageSize;
    const pageRecords = filtered.slice(startIdx, startIdx + state.stageTable.pageSize);

    DOM.stageRecordsBody.innerHTML = pageRecords.map((r, i) => {
      const isEv = r.fuelType === "EV";
      return `
        <tr>
          <td style="color: var(--text-muted); font-size: 0.75rem;">${startIdx + i + 1}</td>
          <td><span style="font-size: 0.75rem;">${r.date || '-'}</span></td>
          <td><strong>${r.customerName}</strong></td>
          <td><span style="font-family: var(--font-mono); font-size: 0.75rem;">${r.chassisNo || '-'}</span></td>
          <td><strong>${r.model}</strong></td>
          <td><span class="${isEv ? 'tag-ev' : 'tag-pv'}"><i class="fa-solid ${isEv ? 'fa-bolt' : 'fa-gas-pump'}"></i> ${r.fuelType}</span></td>
          <td><span class="badge-tag">${r.location}</span></td>
          <td>${r.salesAdvisor || '-'}</td>
          <td>${r.amount ? `<strong>₹${Number(r.amount).toLocaleString('en-IN')}</strong>` : (r.bookingId || '-')}</td>
          <td><span class="stage-tag ${stageClass}">${stage === 'RTO' ? 'RTO COMPLETED' : stage}</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="window.openDetailModal('${r.id}')">
              <i class="fa-solid fa-eye"></i> View
            </button>
          </td>
        </tr>
      `;
    }).join("");

    if (pageRecords.length === 0) {
      DOM.stageRecordsBody.innerHTML = `
        <tr>
          <td colspan="11" class="text-center" style="padding: 2rem; color: var(--text-muted);">
            <i class="fa-solid fa-inbox" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
            No records found matching current stage filters.
          </td>
        </tr>
      `;
    }

    // Pagination info & controls
    const endIdx = Math.min(startIdx + state.stageTable.pageSize, filtered.length);
    DOM.paginationInfo.textContent = filtered.length > 0 
      ? `Showing ${startIdx + 1}-${endIdx} of ${filtered.length} records`
      : `0 records`;

    renderPaginationControls(totalPages);
  }

  function renderPaginationControls(totalPages) {
    let html = `
      <button class="page-btn" ${state.stageTable.page === 1 ? 'disabled' : ''} onclick="window.changeStagePage(${state.stageTable.page - 1})">
        <i class="fa-solid fa-chevron-left"></i>
      </button>
    `;

    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || (p >= state.stageTable.page - 1 && p <= state.stageTable.page + 1)) {
        html += `<button class="page-btn ${p === state.stageTable.page ? 'active' : ''}" onclick="window.changeStagePage(${p})">${p}</button>`;
      } else if (p === state.stageTable.page - 2 || p === state.stageTable.page + 2) {
        html += `<span style="padding: 4px;">...</span>`;
      }
    }

    html += `
      <button class="page-btn" ${state.stageTable.page === totalPages ? 'disabled' : ''} onclick="window.changeStagePage(${state.stageTable.page + 1})">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    `;

    DOM.paginationControls.innerHTML = html;
  }

  // ================= CHARTS ENGINE WITH DIRECT DATALABELS =================
  function renderAllCharts(filtered) {
    const isDark = document.body.classList.contains("theme-dark");
    const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    const textColor = isDark ? "#94a3b8" : "#64748b";

    // 1. Stage Distribution Chart (Overview)
    renderPipelineFunnelChart(filtered, gridColor, textColor);

    // 2. PV vs EV Stage Chart (Overview)
    renderPvEvStageChart(filtered, gridColor, textColor);

    // 3. Location Performance Chart (Overview)
    renderLocationPerformanceChart(filtered, gridColor, textColor);

    // 4. Model Performance Chart (Overview)
    renderModelPerformanceChart(filtered, gridColor, textColor);

    // 5. Location PV vs EV Bar Chart (Location Tab)
    renderLocPvEvBarChart(filtered, gridColor, textColor);

    // 6. Location Stage Stack Chart (Location Tab)
    renderLocStageStackChart(filtered, gridColor, textColor);

    // 7. PV vs EV Donut Chart (PV vs EV Tab)
    renderPvEvDonutChart(filtered, textColor);

    // 8. PV vs EV Model Split Chart (PV vs EV Tab)
    renderPvEvModelSplitChart(filtered, gridColor, textColor);
  }

  function destroyChart(key) {
    if (state.charts[key]) {
      state.charts[key].destroy();
      state.charts[key] = null;
    }
  }

  // 1. Stage Volume Distribution Chart (Visible DataLabels)
  function renderPipelineFunnelChart(filtered, gridColor, textColor) {
    const ctx = document.getElementById("pipelineFunnelChart");
    if (!ctx) return;
    destroyChart("pipelineFunnel");

    const stages = ["IBNR", "E-PAYMENT", "RTO", "INS /FORM20", "DELIVERED"];
    const labels = ["IBNR", "E-PAYMENT", "RTO COMPLETED", "INS / FORM20", "DELIVERED"];
    const counts = stages.map(st => filtered.filter(r => normalizeStage(r.stage) === st).length);

    state.charts.pipelineFunnel = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Units",
          data: counts,
          backgroundColor: [
            "#a855f7", // IBNR
            "#38bdf8", // E-PAYMENT
            "#fbbf24", // RTO
            "#2dd4bf", // INS
            "#10b981"  // DELIVERED
          ],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 20 } },
        plugins: {
          legend: { display: false },
          datalabels: {
            display: true,
            color: '#ffffff',
            anchor: 'end',
            align: 'top',
            offset: 2,
            font: { weight: 'bold', size: 12, family: 'JetBrains Mono' },
            formatter: (value) => value > 0 ? value : ''
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor, font: { weight: 'bold', size: 11 } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor } }
        }
      }
    });
  }

  // 2. PV vs EV Stage Chart (Visible DataLabels)
  function renderPvEvStageChart(filtered, gridColor, textColor) {
    const ctx = document.getElementById("pvevStageChart");
    if (!ctx) return;
    destroyChart("pvevStage");

    const stages = ["IBNR", "E-PAYMENT", "RTO", "INS /FORM20", "DELIVERED"];
    const labels = ["IBNR", "E-PAYMENT", "RTO COMPLETED", "INS / FORM20", "DELIVERED"];
    const pvCounts = stages.map(st => filtered.filter(r => normalizeStage(r.stage) === st && r.fuelType === "PV").length);
    const evCounts = stages.map(st => filtered.filter(r => normalizeStage(r.stage) === st && r.fuelType === "EV").length);

    state.charts.pvevStage = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "PV (Passenger)",
            data: pvCounts,
            backgroundColor: "#3b82f6",
            borderRadius: 4
          },
          {
            label: "EV (Electric)",
            data: evCounts,
            backgroundColor: "#10b981",
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 20 } },
        plugins: {
          legend: { position: 'top', labels: { color: textColor, font: { weight: 'bold' } } },
          datalabels: {
            display: true,
            color: '#ffffff',
            anchor: 'end',
            align: 'top',
            font: { weight: 'bold', size: 11, family: 'JetBrains Mono' },
            formatter: (value) => value > 0 ? value : ''
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor, font: { weight: 'bold', size: 10 } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor } }
        }
      }
    });
  }

  // 3. Location Performance Chart (Visible DataLabels)
  function renderLocationPerformanceChart(filtered, gridColor, textColor) {
    const ctx = document.getElementById("locationPerformanceChart");
    if (!ctx) return;
    destroyChart("locationPerformance");

    const locMap = {};
    filtered.forEach(r => {
      const loc = normalizeLoc(r.location) || "Other";
      if (!locMap[loc]) locMap[loc] = { delivered: 0, rto: 0 };
      if (normalizeStage(r.stage) === "DELIVERED") locMap[loc].delivered++;
      if (normalizeStage(r.stage) === "RTO") locMap[loc].rto++;
    });

    const locations = Object.keys(locMap).sort((a, b) => locMap[b].delivered - locMap[a].delivered).slice(0, 8);
    const delData = locations.map(l => locMap[l].delivered);
    const rtoData = locations.map(l => locMap[l].rto);

    state.charts.locationPerformance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: locations,
        datasets: [
          {
            label: "Delivered",
            data: delData,
            backgroundColor: "#10b981",
            borderRadius: 4
          },
          {
            label: "RTO Completed",
            data: rtoData,
            backgroundColor: "#fbbf24",
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 20 } },
        plugins: {
          legend: { position: 'top', labels: { color: textColor, font: { weight: 'bold' } } },
          datalabels: {
            display: true,
            color: '#ffffff',
            anchor: 'end',
            align: 'top',
            font: { weight: 'bold', size: 11, family: 'JetBrains Mono' },
            formatter: (value) => value > 0 ? value : ''
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor, font: { weight: 'bold' } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor } }
        }
      }
    });
  }

  // 4. Model Performance Chart (Visible DataLabels)
  function renderModelPerformanceChart(filtered, gridColor, textColor) {
    const ctx = document.getElementById("modelPerformanceChart");
    if (!ctx) return;
    destroyChart("modelPerformance");

    const modelMap = {};
    filtered.forEach(r => {
      const m = r.model || "Other";
      if (!modelMap[m]) modelMap[m] = 0;
      modelMap[m]++;
    });

    const topModels = Object.keys(modelMap).sort((a, b) => modelMap[b] - modelMap[a]).slice(0, 7);
    const counts = topModels.map(m => modelMap[m]);

    state.charts.modelPerformance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: topModels,
        datasets: [{
          label: "Units",
          data: counts,
          backgroundColor: "#0ea5e9",
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { right: 30 } },
        plugins: {
          legend: { display: false },
          datalabels: {
            display: true,
            color: '#ffffff',
            anchor: 'end',
            align: 'right',
            font: { weight: 'bold', size: 11, family: 'JetBrains Mono' },
            formatter: (value) => value > 0 ? value : ''
          }
        },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor } },
          y: { grid: { display: false }, ticks: { color: textColor, font: { weight: 'bold' } } }
        }
      }
    });
  }

  // 5. Location PV vs EV Bar Chart (Visible DataLabels)
  function renderLocPvEvBarChart(filtered, gridColor, textColor) {
    const ctx = document.getElementById("locPvEvBarChart");
    if (!ctx) return;
    destroyChart("locPvEvBar");

    const locMap = {};
    filtered.forEach(r => {
      const loc = normalizeLoc(r.location) || "Other";
      if (!locMap[loc]) locMap[loc] = { pv: 0, ev: 0 };
      if (r.fuelType === "EV") locMap[loc].ev++;
      else locMap[loc].pv++;
    });

    const locations = Object.keys(locMap);
    const pvData = locations.map(l => locMap[l].pv);
    const evData = locations.map(l => locMap[l].ev);

    state.charts.locPvEvBar = new Chart(ctx, {
      type: "bar",
      data: {
        labels: locations,
        datasets: [
          { label: "PV (ICE)", data: pvData, backgroundColor: "#3b82f6", borderRadius: 4 },
          { label: "EV (Electric)", data: evData, backgroundColor: "#10b981", borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 20 } },
        plugins: {
          legend: { position: "top", labels: { color: textColor, font: { weight: 'bold' } } },
          datalabels: {
            display: true,
            color: '#ffffff',
            anchor: 'end',
            align: 'top',
            font: { weight: 'bold', size: 11, family: 'JetBrains Mono' },
            formatter: (value) => value > 0 ? value : ''
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor, font: { weight: 'bold' } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor } }
        }
      }
    });
  }

  // 6. Location Stage Stack Chart (Visible DataLabels)
  function renderLocStageStackChart(filtered, gridColor, textColor) {
    const ctx = document.getElementById("locStageStackChart");
    if (!ctx) return;
    destroyChart("locStageStack");

    const locMap = {};
    const stages = ["IBNR", "E-PAYMENT", "RTO", "INS /FORM20", "DELIVERED"];

    filtered.forEach(r => {
      const loc = normalizeLoc(r.location) || "Other";
      if (!locMap[loc]) locMap[loc] = { "IBNR": 0, "E-PAYMENT": 0, "RTO": 0, "INS /FORM20": 0, "DELIVERED": 0 };
      const st = normalizeStage(r.stage);
      if (locMap[loc][st] !== undefined) locMap[loc][st]++;
    });

    const locations = Object.keys(locMap).slice(0, 8);
    const colors = {
      "IBNR": "#a855f7",
      "E-PAYMENT": "#38bdf8",
      "RTO": "#fbbf24",
      "INS /FORM20": "#2dd4bf",
      "DELIVERED": "#10b981"
    };

    const datasets = stages.map(st => ({
      label: st === "RTO" ? "RTO COMPLETED" : st,
      data: locations.map(l => locMap[l][st]),
      backgroundColor: colors[st]
    }));

    state.charts.locStageStack = new Chart(ctx, {
      type: "bar",
      data: { labels: locations, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { color: textColor, font: { weight: 'bold' } } },
          y: { stacked: true, grid: { color: gridColor }, ticks: { color: textColor } }
        },
        plugins: {
          legend: { position: "top", labels: { color: textColor } },
          datalabels: {
            display: true,
            color: '#ffffff',
            anchor: 'center',
            align: 'center',
            font: { weight: 'bold', size: 10, family: 'JetBrains Mono' },
            formatter: (value) => value >= 3 ? value : ''
          }
        }
      }
    });
  }

  // 7. PV vs EV Donut Chart (Visible DataLabels)
  function renderPvEvDonutChart(filtered, textColor) {
    const ctx = document.getElementById("pvevDonutChart");
    if (!ctx) return;
    destroyChart("pvevDonut");

    const pvCount = filtered.filter(r => r.fuelType === "PV").length;
    const evCount = filtered.filter(r => r.fuelType === "EV").length;
    const total = pvCount + evCount;

    state.charts.pvevDonut = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["PV (Passenger Vehicles)", "EV (Electric Vehicles)"],
        datasets: [{
          data: [pvCount, evCount],
          backgroundColor: ["#3b82f6", "#10b981"],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: {
          legend: { position: "bottom", labels: { color: textColor, font: { weight: 'bold' } } },
          datalabels: {
            display: true,
            color: '#ffffff',
            font: { weight: 'bold', size: 13, family: 'JetBrains Mono' },
            formatter: (value) => {
              if (value === 0 || total === 0) return '';
              const pct = ((value / total) * 100).toFixed(1);
              return `${value}\n(${pct}%)`;
            }
          }
        }
      }
    });
  }

  // 8. PV vs EV Model Split Chart (Visible DataLabels)
  function renderPvEvModelSplitChart(filtered, gridColor, textColor) {
    const ctx = document.getElementById("pvevModelSplitChart");
    if (!ctx) return;
    destroyChart("pvevModelSplit");

    const pvMap = {};
    const evMap = {};

    filtered.forEach(r => {
      const m = r.model || "Other";
      if (r.fuelType === "EV") {
        evMap[m] = (evMap[m] || 0) + 1;
      } else {
        pvMap[m] = (pvMap[m] || 0) + 1;
      }
    });

    const topPv = Object.keys(pvMap).sort((a, b) => pvMap[b] - pvMap[a]).slice(0, 4);
    const topEv = Object.keys(evMap).sort((a, b) => evMap[b] - evMap[a]).slice(0, 4);
    const combinedLabels = Array.from(new Set([...topPv, ...topEv]));

    const pvData = combinedLabels.map(m => pvMap[m] || 0);
    const evData = combinedLabels.map(m => evMap[m] || 0);

    state.charts.pvevModelSplit = new Chart(ctx, {
      type: "bar",
      data: {
        labels: combinedLabels,
        datasets: [
          { label: "PV Units", data: pvData, backgroundColor: "#3b82f6", borderRadius: 4 },
          { label: "EV Units", data: evData, backgroundColor: "#10b981", borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 20 } },
        plugins: {
          legend: { position: "top", labels: { color: textColor, font: { weight: 'bold' } } },
          datalabels: {
            display: true,
            color: '#ffffff',
            anchor: 'end',
            align: 'top',
            font: { weight: 'bold', size: 11, family: 'JetBrains Mono' },
            formatter: (value) => value > 0 ? value : ''
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor, font: { weight: 'bold' } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor } }
        }
      }
    });
  }

  // Master Render Function
  function renderApp() {
    const filtered = getFilteredRecords();
    updateKPIs(filtered);
    updateLocationSummary(filtered);
    updateStageDrilldown();
    renderAllCharts(filtered);
  }

  // ================= TAB NAVIGATION =================
  function switchTab(tabId) {
    state.currentTab = tabId;

    DOM.navItems.forEach(btn => {
      if (btn.getAttribute("data-tab") === tabId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    DOM.tabViews.forEach(view => {
      if (view.id === `view-${tabId}`) {
        view.classList.add("active");
      } else if (tabId === "stage-ibnr" && view.id === "view-ibnr-specialized") {
        view.classList.add("active");
      } else if (tabId.startsWith("stage-") && tabId !== "stage-ibnr" && view.id === "view-stage-drilldown") {
        view.classList.add("active");
      } else {
        view.classList.remove("active");
      }
    });

    if (tabId === "stage-ibnr") {
      state.currentStageDrilldown = "IBNR";
      state.ibnrTable.page = 1;
      DOM.pageTitle.textContent = `IBNR Detailed Register & Status Tracking`;
      const ibnrRecs = window.AUG26_STORE.records.filter(r => normalizeStage(r.stage) === "IBNR");
      renderIbnrView(ibnrRecs);
    } else if (tabId.startsWith("stage-")) {
      const stageName = tabId.replace("stage-", "").toUpperCase();
      const map = {
        "EPAYMENT": "E-PAYMENT",
        "RTO": "RTO",
        "INSFORM20": "INS /FORM20",
        "DELIVERED": "DELIVERED"
      };
      state.currentStageDrilldown = map[stageName] || "E-PAYMENT";
      state.stageTable.page = 1;
      DOM.pageTitle.textContent = `${state.currentStageDrilldown === 'RTO' ? 'RTO Completed' : state.currentStageDrilldown} Stage Register`;
      updateStageDrilldown();
    } else {
      const titles = {
        "overview": "Operations Overview & Stage Summary",
        "location-summary": "Location-Wise Operations & Delivery Matrix",
        "pvev-split": "PV vs EV Propulsion Breakdown",
        "datasources": "Live Sync & Online Deployment Guide"
      };
      DOM.pageTitle.textContent = titles[tabId] || "Operations & Delivery Dashboard";
    }

    setTimeout(() => {
      const filtered = getFilteredRecords();
      renderAllCharts(filtered);
    }, 100);
  }

  // Event Listeners for Nav
  DOM.navItems.forEach(item => {
    item.addEventListener("click", () => {
      const tab = item.getAttribute("data-tab");
      switchTab(tab);
      if (window.innerWidth <= 860) {
        DOM.sidebar.classList.remove("mobile-open");
      }
    });
  });

  // Global Functions
  window.navigateToStage = function(stageName) {
    const map = {
      "IBNR": "stage-ibnr",
      "E-PAYMENT": "stage-epayment",
      "RTO": "stage-rto",
      "INS /FORM20": "stage-insform20",
      "DELIVERED": "stage-delivered"
    };
    const tab = map[stageName] || "stage-ibnr";
    switchTab(tab);
  };

  window.filterByLocation = function(loc) {
    state.filters.location = loc;
    DOM.filterLocation.value = loc;
    renderApp();
  };

  window.changeStagePage = function(page) {
    state.stageTable.page = page;
    updateStageDrilldown();
  };

  window.openDetailModal = function(id) {
    const record = window.AUG26_STORE.records.find(r => r.id === id);
    if (!record) return;

    DOM.modalStageBadge.textContent = record.stage === "RTO" ? "RTO COMPLETED" : record.stage;
    DOM.modalCustomerName.textContent = record.customerName;

    DOM.modalDetailContent.innerHTML = `
      <div class="detail-grid">
        <div class="detail-field">
          <label>Record / Order ID</label>
          <span>${record.bookingId || record.id}</span>
        </div>
        <div class="detail-field">
          <label>Date</label>
          <span>${record.date}</span>
        </div>
        <div class="detail-field">
          <label>Location / Branch</label>
          <span>${record.location}</span>
        </div>
        <div class="detail-field">
          <label>Vehicle Model</label>
          <span><strong>${record.model}</strong></span>
        </div>
        <div class="detail-field">
          <label>Fuel Propulsion</label>
          <span><span class="${record.fuelType === 'EV' ? 'tag-ev' : 'tag-pv'}">${record.fuelType}</span></span>
        </div>
        <div class="detail-field">
          <label>Chassis / VIN</label>
          <span style="font-family: var(--font-mono); font-size: 0.8rem;">${record.chassisNo || 'In-Process'}</span>
        </div>
        <div class="detail-field">
          <label>Current Stage</label>
          <span><strong style="color: var(--primary);">${record.stage === 'RTO' ? 'RTO Completed' : record.stage}</strong></span>
        </div>
        <div class="detail-field">
          <label>Stock Status</label>
          <span>${record.stockStatus || 'PHYSICAL'}</span>
        </div>
        <div class="detail-field">
          <label>INS / Form 20 Status</label>
          <span>${record.insStatus || 'Done'}</span>
        </div>
        <div class="detail-field">
          <label>E-Payment Status</label>
          <span>${record.epayStatus || 'Done'}</span>
        </div>
        <div class="detail-field">
          <label>RTO Status</label>
          <span>${record.rtoStatus || 'Done'}</span>
        </div>
        <div class="detail-field">
          <label>Sales Advisor / TL</label>
          <span>${record.salesAdvisor || '-'} / ${record.teamLead || '-'}</span>
        </div>
        ${record.remarks ? `
        <div class="detail-field" style="grid-column: span 2;">
          <label>Remarks</label>
          <span style="color: #f59e0b;">${record.remarks}</span>
        </div>` : ''}
      </div>
    `;

    DOM.detailModal.classList.add("active");
  };

  DOM.closeDetailModalBtn.addEventListener("click", () => {
    DOM.detailModal.classList.remove("active");
  });

  DOM.detailModal.addEventListener("click", (e) => {
    if (e.target === DOM.detailModal) DOM.detailModal.classList.remove("active");
  });

  // Mobile Menu Toggle
  DOM.mobileMenuBtn.addEventListener("click", () => {
    DOM.sidebar.classList.toggle("mobile-open");
  });
  DOM.sidebarCloseBtn.addEventListener("click", () => {
    DOM.sidebar.classList.remove("mobile-open");
  });

  // Theme Toggle
  DOM.themeToggleBtn.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("theme-dark");
    document.body.classList.toggle("theme-light", !isDark);
    DOM.themeToggleBtn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    localStorage.setItem("AUG26_THEME", isDark ? "dark" : "light");
    const filtered = getFilteredRecords();
    renderAllCharts(filtered);
  });

  // Filter Listeners
  DOM.filterLocation.addEventListener("change", (e) => {
    state.filters.location = e.target.value;
    renderApp();
  });

  DOM.fuelSegmentControl.querySelectorAll(".segment-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      DOM.fuelSegmentControl.querySelectorAll(".segment-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.filters.fuel = btn.getAttribute("data-fuel");
      renderApp();
    });
  });

  DOM.filterModel.addEventListener("change", (e) => {
    state.filters.model = e.target.value;
    renderApp();
  });

  DOM.filterStage.addEventListener("change", (e) => {
    state.filters.stage = e.target.value;
    renderApp();
  });

  // Global Search with debounce
  let searchTimer;
  DOM.globalSearchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    const val = e.target.value.trim();
    DOM.clearSearchBtn.classList.toggle("hidden", val === "");
    searchTimer = setTimeout(() => {
      state.filters.search = val;
      renderApp();
    }, 200);
  });

  DOM.clearSearchBtn.addEventListener("click", () => {
    DOM.globalSearchInput.value = "";
    DOM.clearSearchBtn.classList.add("hidden");
    state.filters.search = "";
    renderApp();
  });

  DOM.resetFiltersBtn.addEventListener("click", () => {
    state.filters = { location: "ALL", fuel: "ALL", model: "ALL", stage: "ALL", search: "" };
    DOM.filterLocation.value = "ALL";
    DOM.filterModel.value = "ALL";
    DOM.filterStage.value = "ALL";
    DOM.globalSearchInput.value = "";
    DOM.clearSearchBtn.classList.add("hidden");
    DOM.fuelSegmentControl.querySelectorAll(".segment-btn").forEach(b => {
      b.classList.toggle("active", b.getAttribute("data-fuel") === "ALL");
    });
    renderApp();
  });

  // Location Table Search & Sorting
  DOM.locationTableSearch.addEventListener("input", () => {
    const filtered = getFilteredRecords();
    updateLocationSummary(filtered);
  });

  document.querySelectorAll("#locationDetailedTable th[data-sort]").forEach(th => {
    th.addEventListener("click", () => {
      const col = th.getAttribute("data-sort");
      if (state.locationTableSort.column === col) {
        state.locationTableSort.direction = state.locationTableSort.direction === "asc" ? "desc" : "asc";
      } else {
        state.locationTableSort.column = col;
        state.locationTableSort.direction = "desc";
      }
      const filtered = getFilteredRecords();
      updateLocationSummary(filtered);
    });
  });

  // Stage Table Filter Listeners
  DOM.stageTableSearch.addEventListener("input", (e) => {
    state.stageTable.search = e.target.value.trim();
    state.stageTable.page = 1;
    updateStageDrilldown();
  });
  DOM.stageLocFilter.addEventListener("change", (e) => {
    state.stageTable.location = e.target.value;
    state.stageTable.page = 1;
    updateStageDrilldown();
  });
  DOM.stageFuelFilter.addEventListener("change", (e) => {
    state.stageTable.fuel = e.target.value;
    state.stageTable.page = 1;
    updateStageDrilldown();
  });

  // ================= AUTOMATIC LIVE GOOGLE SHEETS SYNC =================
  async function fetchLiveGoogleSheet(silent = false) {
    if (state.isSyncing) return;
    state.isSyncing = true;

    if (!silent) {
      DOM.manualSyncBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Syncing...</span>`;
      DOM.manualSyncBtn.disabled = true;
    }

    const sheetId = "1XjhjiG6mIPXmOOykL4iq4TaSjpr2IPDgZjvPNscNmrg";
    const tabs = ["IBNR", "E-PAYMENT", "RTO", "INS /FORM20", "DELIVERED"];
    let fetchedTotal = 0;
    const allRecords = [];

    for (const tab of tabs) {
      try {
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const csvText = await res.text();
        const records = parseSpecificTabCsv(csvText, tab);
        if (records.length > 0) {
          allRecords.push(...records);
          fetchedTotal += records.length;
        }
      } catch (err) {
        console.warn(`Tab ${tab} live poll:`, err);
      }
    }

    state.isSyncing = false;
    if (!silent) {
      DOM.manualSyncBtn.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> <span>Sync Live</span>`;
      DOM.manualSyncBtn.disabled = false;
    }

    if (fetchedTotal > 0) {
      window.AUG26_STORE.setRecords(allRecords);
      populateFilterDropdowns();
      renderApp();

      const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      state.lastSyncTimestamp = timeStr;
      DOM.topSyncTime.textContent = `Synced at ${timeStr}`;
      DOM.lastUpdatedText.textContent = `Live: ${timeStr} (60s poll)`;

      if (!silent) {
        alert(`✅ Live Sync Successful! Loaded ${fetchedTotal} real-time records from Google Sheets.`);
      }
    }
  }

  // Attach sync triggers
  DOM.manualSyncBtn.addEventListener("click", () => fetchLiveGoogleSheet(false));
  DOM.quickSyncBtn.addEventListener("click", () => fetchLiveGoogleSheet(false));
  DOM.fetchSheetBtn.addEventListener("click", () => fetchLiveGoogleSheet(false));
  DOM.openHostingGuideBtn.addEventListener("click", () => switchTab("datasources"));

  // Auto-sync polling every 60 seconds
  state.autoRefreshInterval = setInterval(() => {
    fetchLiveGoogleSheet(true); // background silent poll
  }, 60000);

  DOM.loadSampleDataBtn.addEventListener("click", () => {
    window.AUG26_STORE.resetToDefault();
    populateFilterDropdowns();
    renderApp();
    alert("Cached dataset reloaded!");
  });

  // Robust Specific Tab Parser
  function parseSpecificTabCsv(csvText, tabName) {
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length <= 1) return [];

    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
      if (cols.length < 2) continue;

      if (tabName === "IBNR") {
        if (cols[4] && cols[4] !== "Chassis No") {
          records.push({
            id: `IBNR-${i}`,
            date: cols[2] || "Aug'26",
            customerName: cols[11] || `Customer ${i}`,
            mobile: "",
            model: cols[8] || cols[9] || "Nexon",
            fuelType: normalizeFuel(cols[7], cols[8] || cols[9]),
            location: normalizeLoc(cols[22]),
            salesAdvisor: cols[20] || "-",
            teamLead: cols[21] || "-",
            chassisNo: cols[4],
            bookingId: cols[10] || `BK-${i}`,
            stage: "IBNR",
            amount: "",
            stockStatus: cols[5] || "PHYSICAL",
            insStatus: cols[17] || "INS/FORM20 Not Done",
            epayStatus: cols[18] || "E-Payment Not Done",
            rtoStatus: cols[19] || "RTO Not Done",
            remarks: cols[23] || "",
            rtoPlanDate: cols[24] || ""
          });
        }
      } else if (tabName === "E-PAYMENT") {
        if (cols[1] && cols[1] !== "Chassis No") {
          records.push({
            id: `EPAY-${i}`,
            date: cols[5] || "Aug'26",
            customerName: cols[7] || `Customer ${i}`,
            mobile: "",
            model: cols[10] === "EV" ? "Tata EV" : "Tata PV",
            fuelType: normalizeFuel(cols[10], ""),
            location: normalizeLoc(cols[9]),
            salesAdvisor: "-",
            teamLead: "-",
            chassisNo: cols[1],
            bookingId: cols[3] || `REG-${i}`,
            stage: "E-PAYMENT",
            amount: cols[8] || "",
            stockStatus: "PHYSICAL",
            insStatus: "INS/FORM20 Done",
            epayStatus: "E-Payment Done",
            rtoStatus: "RTO Pending"
          });
        }
      } else if (tabName === "RTO") {
        if (cols[2] && cols[2] !== "CHASSIS NO") {
          records.push({
            id: `RTO-${i}`,
            date: cols[4] || "Aug'26",
            customerName: cols[5] || `Customer ${i}`,
            mobile: "",
            model: cols[10] || "Nexon",
            fuelType: normalizeFuel(cols[6], cols[10]),
            location: normalizeLoc(cols[7]),
            salesAdvisor: "-",
            teamLead: "-",
            chassisNo: cols[2],
            bookingId: cols[3] || `RTO-${i}`,
            stage: "RTO",
            amount: cols[11] || "",
            stockStatus: "PHYSICAL",
            insStatus: "INS/FORM20 Done",
            epayStatus: "E-Payment Done",
            rtoStatus: "RTO Done"
          });
        }
      } else if (tabName === "INS /FORM20") {
        if (cols[1] && cols[1] !== "CHASSIS NUMBER") {
          records.push({
            id: `INS-${i}`,
            date: cols[0] || "Aug'26",
            customerName: `Customer ${i}`,
            mobile: "",
            model: cols[2] || "Tata Vehicle",
            fuelType: normalizeFuel("", cols[2]),
            location: normalizeLoc(cols[3]),
            salesAdvisor: "-",
            teamLead: "-",
            chassisNo: cols[1],
            bookingId: `INS-${i}`,
            stage: "INS /FORM20",
            amount: "",
            stockStatus: "PHYSICAL",
            insStatus: "INS/FORM20 Done",
            epayStatus: "Pending",
            rtoStatus: "Pending"
          });
        }
      } else if (tabName === "DELIVERED") {
        if (cols[3] && cols[3].startsWith("MAT")) {
          records.push({
            id: `DEL-${i}`,
            date: cols[4] || "Aug'26",
            customerName: cols[2] || `Customer ${i}`,
            mobile: "",
            model: cols[6] || "Tata Vehicle",
            fuelType: normalizeFuel(cols[9], cols[6]),
            location: normalizeLoc(cols[1]),
            salesAdvisor: cols[12] || "-",
            teamLead: cols[13] || "-",
            chassisNo: cols[3],
            bookingId: cols[11] || `DEL-${i}`,
            stage: "DELIVERED",
            amount: "",
            stockStatus: "DELIVERED",
            insStatus: "INS/FORM20 Done",
            epayStatus: "E-Payment Done",
            rtoStatus: "RTO Done"
          });
        }
      }
    }

    return records;
  }

  // Export Table to CSV
  function downloadCsv(filename, rows) {
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  DOM.exportDataBtn.addEventListener("click", () => {
    const filtered = getFilteredRecords();
    const rows = [
      ["Record ID", "Stage", "Customer Name", "Chassis No", "Model", "Fuel Type", "Location", "Sales Advisor", "Team Lead", "Date"]
    ];
    filtered.forEach(r => {
      rows.push([
        `"${r.id}"`,
        `"${r.stage}"`,
        `"${r.customerName}"`,
        `"${r.chassisNo}"`,
        `"${r.model}"`,
        `"${r.fuelType}"`,
        `"${r.location}"`,
        `"${r.salesAdvisor}"`,
        `"${r.teamLead}"`,
        `"${r.date}"`
      ]);
    });
    downloadCsv("AUG26_Operations_Data.csv", rows);
  });

  DOM.exportLocationSummaryBtn.addEventListener("click", () => {
    const filtered = getFilteredRecords();
    const locMap = {};
    filtered.forEach(r => {
      const loc = normalizeLoc(r.location) || "Other";
      if (!locMap[loc]) locMap[loc] = { total: 0, pv: 0, ev: 0, ibnr: 0, epayment: 0, rto: 0, ins: 0, delivered: 0 };
      locMap[loc].total++;
      if (r.fuelType === "EV") locMap[loc].ev++;
      else locMap[loc].pv++;
      const st = normalizeStage(r.stage);
      if (st === "IBNR") locMap[loc].ibnr++;
      else if (st === "E-PAYMENT") locMap[loc].epayment++;
      else if (st === "RTO") locMap[loc].rto++;
      else if (st === "INS /FORM20") locMap[loc].ins++;
      else if (st === "DELIVERED") locMap[loc].delivered++;
    });

    const rows = [
      ["Location", "Delivered", "RTO Completed", "E-Payment", "INS / Form20", "IBNR", "PV Units", "EV Units", "EV Share %"]
    ];

    Object.keys(locMap).forEach(loc => {
      const l = locMap[loc];
      const evShare = l.total > 0 ? ((l.ev / l.total) * 100).toFixed(1) : "0";
      rows.push([
        `"${loc}"`,
        l.delivered,
        l.rto,
        l.epayment,
        l.ins,
        l.ibnr,
        l.pv,
        l.ev,
        `"${evShare}%"`
      ]);
    });

    downloadCsv("AUG26_Location_Wise_Summary.csv", rows);
  });

  DOM.exportIbnrBtn.addEventListener("click", () => {
    const records = window.AUG26_STORE.records.filter(r => normalizeStage(r.stage) === "IBNR");
    const rows = [
      ["Date", "Order No", "Customer Name", "Model", "Fuel", "Chassis No", "Stock Status", "INS/Form20 Status", "E-Payment Status", "RTO Status", "CA Name", "Location", "SM Remarks", "RTO Plan Date"]
    ];
    records.forEach(r => {
      rows.push([
        `"${r.date}"`,
        `"${r.bookingId}"`,
        `"${r.customerName}"`,
        `"${r.model}"`,
        `"${r.fuelType}"`,
        `"${r.chassisNo}"`,
        `"${r.stockStatus}"`,
        `"${r.insStatus}"`,
        `"${r.epayStatus}"`,
        `"${r.rtoStatus}"`,
        `"${r.salesAdvisor}"`,
        `"${r.location}"`,
        `"${r.remarks}"`,
        `"${r.rtoPlanDate}"`
      ]);
    });
    downloadCsv("AUG26_IBNR_Detailed_Register.csv", rows);
  });

  DOM.exportStageTableBtn.addEventListener("click", () => {
    const stage = state.currentStageDrilldown;
    const records = window.AUG26_STORE.records.filter(r => normalizeStage(r.stage) === stage);
    const rows = [
      ["Stage", "Customer Name", "Chassis No", "Model", "Fuel Type", "Location", "Sales Advisor", "Team Lead", "Date"]
    ];
    records.forEach(r => {
      rows.push([
        `"${r.stage}"`,
        `"${r.customerName}"`,
        `"${r.chassisNo}"`,
        `"${r.model}"`,
        `"${r.fuelType}"`,
        `"${r.location}"`,
        `"${r.salesAdvisor}"`,
        `"${r.teamLead}"`,
        `"${r.date}"`
      ]);
    });
    downloadCsv(`AUG26_${stage.replace(/[^a-zA-Z0-9]/g, '_')}_Data.csv`, rows);
  });

  // Initial Boot
  populateFilterDropdowns();
  renderApp();

  // Try live fetch immediately on page load
  fetchLiveGoogleSheet(true);
});
