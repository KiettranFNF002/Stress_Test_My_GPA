let originalData = [];
let displayData = [];
let chart = null;

const state = {
    totalCredits: 0,
    currentGPA10: 0,
    currentGPA4: 0,
    pendingCount: 0,
    activeTab: 'overview',
    config: {
        simMode: 'scale10', // 'scale10' or 'scale4'
        mapping: [
            { min: 9.0, val4: 4.0, letter: 'A+' },
            { min: 8.5, val4: 4.0, letter: 'A' },
            { min: 8.0, val4: 3.5, letter: 'B+' },
            { min: 7.0, val4: 3.0, letter: 'B' },
            { min: 6.5, val4: 2.5, letter: 'C+' },
            { min: 5.5, val4: 2.0, letter: 'C' },
            { min: 5.0, val4: 1.5, letter: 'D+' },
            { min: 4.0, val4: 1.0, letter: 'D' },
            { min: 3.0, val4: 0.5, letter: 'F+' },
            { min: 0.0, val4: 0.0, letter: 'F' }
        ],
        ranks: [
            { min: 3.6, label: 'Xuất sắc' },
            { min: 3.2, label: 'Giỏi' },
            { min: 2.5, label: 'Khá' },
            { min: 2.0, label: 'Trung bình' },
            { min: 1.0, label: 'Yếu' },
            { min: 0.0, label: 'Kém' }
        ]
    }
};

// Elements
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileNameSpan = document.getElementById('fileName');
const subjectTableBody = document.querySelector('#subjectTable tbody');
const recentTableBody = document.querySelector('#recentTable tbody');
const simulationTableBody = document.querySelector('#simulationTable tbody');
const searchInput = document.getElementById('searchInput');
const resetBtn = document.getElementById('resetBtn');
const saveStatus = document.getElementById('saveStatus');

// Nav Elements
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');

// KPI Elements
const gpa10El = document.getElementById('gpa10');
const gpa4El = document.getElementById('gpa4');
const totalCreditsEl = document.getElementById('totalCredits');
const pendingSubjectsEl = document.getElementById('pendingSubjects');

// Bulk Elements
const bulkGradeInput = document.getElementById('bulkGradeInput');
const applyBulkBtn = document.getElementById('applyBulkBtn');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initDropzone();
    initChart();
    initNavigation();
    initPersistence();
    initSettings();
    initHelp();
    
    searchInput.addEventListener('input', (e) => {
        filterAndRenderTable(e.target.value);
    });

    applyBulkBtn.addEventListener('click', () => {
        bulkSetGrades(parseFloat(bulkGradeInput.value));
    });

    resetBtn.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu? Thao tác này sẽ xóa cả dữ liệu đã lưu.')) {
            localStorage.removeItem('gpa_data');
            location.reload();
        }
    });

    // Start with overview
    switchTab('overview');
});

function initNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.innerText.toLowerCase();
            if (tabId.includes('quan')) switchTab('overview');
            else if (tabId.includes('phần')) switchTab('subjects');
            else if (tabId.includes('phóng')) switchTab('simulation');
            else if (tabId.includes('hình')) switchTab('settings');
        });
    });
}

function switchTab(tabName) {
    state.activeTab = tabName;
    
    // Update Sidebar UI
    navItems.forEach(item => {
        const text = item.innerText.toLowerCase();
        item.classList.remove('active');
        if (tabName === 'overview' && text.includes('quan')) item.classList.add('active');
        if (tabName === 'subjects' && text.includes('phần')) item.classList.add('active');
        if (tabName === 'simulation' && text.includes('phóng')) item.classList.add('active');
        if (tabName === 'settings' && text.includes('hình')) item.classList.add('active');
    });

    // Update Content Visibility
    tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabName}-tab`) content.classList.add('active');
    });

    renderAllTables();
}

function initPersistence() {
    const saved = localStorage.getItem('gpa_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            originalData = data;
            displayData = [...originalData];
            updateDashboard();
            fileInfo.classList.remove('hidden');
            fileNameSpan.textContent = "Dữ liệu đã lưu";
        } catch (e) {
            console.error("Lỗi khi load dữ liệu cũ", e);
        }
    }

    const savedConfig = localStorage.getItem('gpa_config');
    if (savedConfig) {
        try {
            state.config = JSON.parse(savedConfig);
        } catch (e) {
            console.error("Lỗi khi load cấu hình", e);
        }
    }
}

function saveConfig() {
    localStorage.setItem('gpa_config', JSON.stringify(state.config));
}

function saveToStorage() {
    localStorage.setItem('gpa_data', JSON.stringify(originalData));
    saveStatus.textContent = "Đã lưu: " + new Date().toLocaleTimeString();
    saveStatus.style.opacity = "1";
    setTimeout(() => { saveStatus.style.opacity = "0.7"; }, 2000);
}

function initDropzone() {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('active'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('active'));
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('active');
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    });
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
    });
}

function handleFile(file) {
    fileNameSpan.textContent = file.name;
    fileInfo.classList.remove('hidden');
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);
        processExcelData(jsonData);
    };
    reader.readAsArrayBuffer(file);
}

function processExcelData(data) {
    originalData = data.map(row => {
        const name = row['Tên học phần'] || 'Không rõ';
        const gradeLetter = (row['Điểm chữ'] || '').toString().trim().toUpperCase();
        
        // Exceptions: Physical Ed, Military Ed, or specific (*)
        const isException = name.includes('(*)') || 
                            name.toLowerCase().includes('giáo dục thể chất') || 
                            name.toLowerCase().includes('gdtc') || 
                            name.toLowerCase().includes('thể dục') || 
                            name.toLowerCase().includes('giáo dục quốc phòng') || 
                            name.toLowerCase().includes('gdqp');

        // Special UEH grades
        const isSpecialIorX = gradeLetter === 'I' || gradeLetter === 'X';
        const isSpecialMorP = gradeLetter === 'M' || gradeLetter === 'P';

        return {
            id: row['Mã học phần'] || 'N/A',
            name: name,
            credits: parseFloat(row['Số TC']) || 0,
            grade10: parseFloat(row['Điểm']),
            grade4: parseFloat(row['Điểm hệ 4']),
            gradeLetter: gradeLetter,
            isMocked: false,
            isImproving: false,
            originalGrade10: parseFloat(row['Điểm']),
            isException: isException,
            isSpecialIorX: isSpecialIorX,
            isSpecialMorP: isSpecialMorP
        };
    }).filter(item => item.credits > 0 && !item.isSpecialIorX); // Filter out incomplete data (I, X)
    displayData = [...originalData];
    updateDashboard();
}

function updateDashboard() {
    calculateStats();
    renderAllTables();
    updateChart();
    saveToStorage();
    
    gpa10El.textContent = state.currentGPA10.toFixed(2);
    gpa4El.textContent = state.currentGPA4.toFixed(2);
    totalCreditsEl.textContent = state.totalCredits;
    pendingSubjectsEl.textContent = state.pendingCount;
    document.getElementById('academicRank').textContent = state.academicRank;
}

function calculateStats() {
    let totalWeighted10 = 0, totalWeighted4 = 0, creditsForAverage = 0, totalCreditsPassed = 0, pendingCount = 0;
    
    originalData.forEach(item => {
        // Exclude exceptions and M/P from GPA calculation avg
        if (item.isException || item.isSpecialMorP) {
            if (item.isSpecialMorP || calculateGrade4(item.grade10) >= 1.0) {
                totalCreditsPassed += item.credits;
            }
            return;
        }

        const currentGrade = item.isMocked || item.isImproving ? item.grade10 : item.originalGrade10;

        if (!isNaN(currentGrade)) {
            totalWeighted10 += currentGrade * item.credits;
            totalWeighted4 += calculateGrade4(currentGrade) * item.credits;
            creditsForAverage += item.credits;
            if (calculateGrade4(currentGrade) >= 1.0) {
                totalCreditsPassed += item.credits;
            }
        } else {
            pendingCount++;
        }
    });

    state.totalCredits = totalCreditsPassed;
    state.currentGPA10 = creditsForAverage > 0 ? totalWeighted10 / creditsForAverage : 0;
    state.currentGPA4 = creditsForAverage > 0 ? totalWeighted4 / creditsForAverage : 0;
    state.pendingCount = pendingCount;
    state.academicRank = calculateAcademicRank(state.currentGPA4);
}

function calculateAcademicRank(gpa4) {
    const sortedRanks = [...state.config.ranks].sort((a, b) => b.min - a.min);
    const found = sortedRanks.find(r => gpa4 >= r.min);
    return found ? found.label : "Kém";
}

function calculateGrade4(grade10) {
    const sortedMap = [...state.config.mapping].sort((a, b) => b.min - a.min);
    const found = sortedMap.find(m => grade10 >= m.min);
    return found ? found.val4 : 0;
}

function calculateGradeLetter(grade10) {
    const sortedMap = [...state.config.mapping].sort((a, b) => b.min - a.min);
    const found = sortedMap.find(m => grade10 >= m.min);
    return found ? found.letter : "F";
}

function renderAllTables() {
    renderSubjectTable();
    renderRecentTable();
    renderSimulationTable();
    lucide.createIcons();
}

function renderSubjectTable() {
    subjectTableBody.innerHTML = '';
    if (displayData.length === 0) {
        subjectTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">Vui lòng tải file Excel.</td></tr>';
        return;
    }
    displayData.forEach((item) => {
        // Use the index in originalData for stable event handling
        const originalIndex = originalData.indexOf(item);
        const isPending = isNaN(item.grade10);
        const displayGrade = isPending ? 'Trống' : item.grade10.toFixed(1);
        const row = document.createElement('tr');
        if (item.isImproving) row.classList.add('improved-row');
        if (item.isException) row.classList.add('exception-row');
        const canImprove = !item.isException && !isNaN(item.originalGrade10);
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.name} ${item.isException ? '<span class="badge-exception">Ngoại lệ</span>' : ''}</td>
            <td>${item.credits}</td>
            <td>${item.isException ? displayGrade : `<span class="editable ${isPending ? 'pending' : ''}" contenteditable="true" onblur="updateGrade(${originalIndex}, this.innerText)">${displayGrade}</span>`}</td>
            <td>${item.grade4 ? item.grade4.toFixed(2) : '--'}</td>
            <td>${item.gradeLetter || '--'}</td>
            <td>${canImprove ? `<button class="btn-mock ${item.isImproving ? 'active' : ''}" onclick="toggleImprovement(${originalIndex})">
                ${item.isImproving ? 'Hủy' : 'Thêm'}
            </button>` : ''}</td>
        `;
        subjectTableBody.appendChild(row);
    });
}

function renderRecentTable() {
    recentTableBody.innerHTML = '';
    const recent = originalData.filter(i => i.isMocked || i.isImproving).slice(-5);
    if (recent.length === 0) {
        recentTableBody.innerHTML = '<tr><td colspan="4" class="empty-state">Chưa có thay đổi nào.</td></tr>';
        return;
    }
    recent.forEach(item => {
        recentTableBody.innerHTML += `<tr><td>${item.id}</td><td>${item.name}</td><td>${item.grade10.toFixed(1)}</td><td><span class="save-status">Đã sửa</span></td></tr>`;
    });
}

function renderSimulationTable() {
    simulationTableBody.innerHTML = '';
    const sims = originalData.filter(i => (isNaN(i.originalGrade10) || i.isImproving) && !i.isException);
    
    if (sims.length === 0) {
        simulationTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">Không có môn học nào cần dự phóng.</td></tr>';
        return;
    }

    const isScale4 = state.config.simMode === 'scale4';

    sims.forEach((item) => {
        const originalIndex = originalData.indexOf(item);
        let displayValue = '';
        if (isScale4) {
            displayValue = item.grade4 ? item.grade4.toFixed(2) : '0.00';
        } else {
            displayValue = isNaN(item.grade10) ? '0' : item.grade10.toFixed(1);
        }
        
        // Determine Label
        let typeLabel = '';
        if (item.isImproving) {
            typeLabel = '<span class="badge-accent">Cải thiện</span>';
        } else if (isNaN(item.originalGrade10)) {
            typeLabel = '<span class="badge-highlight">Dự học</span>';
        }

        simulationTableBody.innerHTML += `
            <tr class="${item.isImproving ? 'improved-row' : ''}">
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.credits}</td>
                <td>${typeLabel}</td>
                <td>
                    <div class="bulk-input-group">
                        <input type="number" 
                               step="${isScale4 ? '0.1' : '0.5'}" 
                               min="0" 
                               max="${isScale4 ? '4.0' : '10'}" 
                               value="${displayValue}" 
                               onchange="updateSimulationGrade(${originalIndex}, this.value)"
                               class="inline-input">
                    </div>
                </td>
                <td>
                    <div class="action-group">
                        <button class="btn-mock" onclick="resetGrade(${originalIndex})">Reset</button>
                        ${item.isImproving ? `<button class="btn-icon-delete" onclick="toggleImprovement(${originalIndex})" title="Xóa khỏi dự phóng">×</button>` : ''}
                    </div>
                </td>
            </tr>`;
    });
}

function resetGrade(index) {
    const item = originalData[index];
    item.grade10 = item.originalGrade10;
    item.grade4 = calculateGrade4(item.grade10);
    item.gradeLetter = calculateGradeLetter(item.grade10);
    item.isMocked = false;
    updateDashboard();
}

function updateSimulationGrade(index, value) {
    const val = parseFloat(value);
    const item = originalData[index];
    if (state.config.simMode === 'scale4') {
        item.grade4 = val;
        // Approximation back to scale 10 for chart consistency, 
        // find best matching min from config
        const found = [...state.config.mapping].sort((a,b) => b.val4 - a.val4).find(m => val >= m.val4);
        item.grade10 = found ? found.min : (val * 2.5); // Fallback
        item.gradeLetter = found ? found.letter : 'F';
    } else {
        item.grade10 = val;
        item.grade4 = calculateGrade4(val);
        item.gradeLetter = calculateGradeLetter(val);
    }
    item.isMocked = true;
    updateDashboard();
}

function initSettings() {
    const mappingTableBody = document.getElementById('mappingTableBody');
    const addMappingBtn = document.getElementById('addMappingBtn');
    const saveConfigBtn = document.getElementById('saveConfigBtn');
    const simModeSelect = document.getElementById('simModeSelect');

    function renderMappingRows() {
        mappingTableBody.innerHTML = '';
        state.config.mapping.forEach((m, i) => {
            mappingTableBody.innerHTML += `
                <tr>
                    <td><input type="number" step="0.1" value="${m.min}" onchange="updateMappingRule(${i}, 'min', this.value)"></td>
                    <td><input type="number" step="0.1" value="${m.val4}" onchange="updateMappingRule(${i}, 'val4', this.value)"></td>
                    <td><input type="text" value="${m.letter}" onchange="updateMappingRule(${i}, 'letter', this.value)"></td>
                    <td><button class="btn-icon-delete" onclick="deleteMappingRule(${i})">×</button></td>
                </tr>
            `;
        });
    }

    window.updateMappingRule = (idx, key, val) => {
        state.config.mapping[idx][key] = key === 'letter' ? val : parseFloat(val);
    };

    window.deleteMappingRule = (idx) => {
        state.config.mapping.splice(idx, 1);
        renderMappingRows();
    };

    addMappingBtn.addEventListener('click', () => {
        state.config.mapping.push({ min: 0, val4: 0, letter: '?' });
        renderMappingRows();
    });

    saveConfigBtn.addEventListener('click', () => {
        state.config.simMode = simModeSelect.value;
        saveConfig();
        updateDashboard();
        alert('Đã lưu cấu hình và áp dụng cho toàn bộ bảng điểm!');
    });

    simModeSelect.value = state.config.simMode;
    renderMappingRows();
}

function updateGrade(index, newGrade) {
    const val = parseFloat(newGrade);
    if (!isNaN(val) && val >= 0 && val <= 10) {
        const item = originalData[index];
        item.grade10 = val;
        item.grade4 = calculateGrade4(val);
        item.gradeLetter = calculateGradeLetter(val);
        item.isMocked = true;
        updateDashboard();
    } else { renderAllTables(); }
}

function toggleImprovement(index) {
    const item = originalData[index];
    if (item.isException || isNaN(item.originalGrade10)) return;
    
    item.isImproving = !item.isImproving;
    
    if (!item.isImproving) {
        // When unselecting, reset to actual original values
        item.grade10 = item.originalGrade10;
        item.grade4 = calculateGrade4(item.grade10);
        item.gradeLetter = calculateGradeLetter(item.grade10);
        item.isMocked = false;
    }
    // When selecting, we just add it to Projection tab without changing current grades
    
    updateDashboard();
}

function bulkSetGrades(grade) {
    if (isNaN(grade) || grade < 0 || grade > 10) return;
    originalData.forEach(item => {
        if (!item.isException && (isNaN(item.originalGrade10) || item.isImproving)) {
            item.grade10 = grade;
            item.isMocked = true;
            item.grade4 = calculateGrade4(grade);
            item.gradeLetter = calculateGradeLetter(grade);
        }
    });
    updateDashboard();
}

function filterAndRenderTable(query) {
    displayData = originalData.filter(item => item.name.toLowerCase().includes(query.toLowerCase()) || item.id.toLowerCase().includes(query.toLowerCase()));
    renderSubjectTable();
}

function initChart() {
    const ctx = document.getElementById('gpaChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'GPA Tích Lũy', data: [], borderColor: '#22C55E', backgroundColor: 'rgba(34, 197, 94, 0.1)', fill: true, tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: false, grid: { color: '#334155' }, ticks: { color: '#94A3B8' } }, x: { grid: { color: 'transparent' }, ticks: { color: '#94A3B8' } } }, plugins: { legend: { display: false } } }
    });
}

function updateChart() {
    if (!chart) return;
    let cw = 0, cc = 0; const gpaTrend = [], labels = [];
    originalData.forEach((item, i) => {
        if (!isNaN(item.grade10)) {
            cw += item.grade10 * item.credits; cc += item.credits;
            gpaTrend.push((cw / cc).toFixed(2)); labels.push(item.id);
        }
    });
    chart.data.labels = labels; chart.data.datasets[0].data = gpaTrend; chart.update();
}

function initHelp() {
    const helpBtn = document.getElementById('helpBtn');
    const helpModal = document.getElementById('helpModal');
    const closeHelpBtn = document.getElementById('closeHelpBtn');

    if (!helpBtn || !helpModal || !closeHelpBtn) return;

    helpBtn.addEventListener('click', () => {
        helpModal.classList.remove('hidden');
    });

    closeHelpBtn.addEventListener('click', () => {
        helpModal.classList.add('hidden');
    });

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.classList.add('hidden');
        }
    });
}
