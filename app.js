let originalData = [];
let displayData = [];
let chart = null;

const state = {
    totalCredits: 0,
    currentGPA10: 0,
    currentGPA10Min: 0,
    currentGPA10Max: 0,
    currentGPA4: 0,
    pendingCount: 0,
    hasGPA10Range: false,
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

const TARGET_PLANNER_DEFAULT_MIN_SCALE4 = 2.0;

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
const gpa10LabelEl = document.getElementById('gpa10Label');
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

    initExport();
    initTargetCalculator();

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
    const savedConfig = localStorage.getItem('gpa_config');
    if (savedConfig) {
        try {
            state.config = JSON.parse(savedConfig);
        } catch (e) {
            console.error("Lỗi khi load cấu hình", e);
        }
    }

    const saved = localStorage.getItem('gpa_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            originalData = data.map(item => {
                const normalized = { ...item };
                normalized.isGrade10FromScale4 = false;
                normalized.isMocked = false;
                normalized.isImproving = false;

                // Always restore baseline scores on app reload to avoid persisting stale simulations
                if (!isNaN(normalized.originalGrade10)) {
                    normalized.grade10 = normalized.originalGrade10;
                    normalized.grade4 = calculateGrade4(normalized.originalGrade10);
                    normalized.gradeLetter = calculateGradeLetter(normalized.originalGrade10);
                } else {
                    normalized.grade10 = NaN;
                    normalized.grade4 = NaN;
                }
                return normalized;
            });
            displayData = [...originalData];
            updateDashboard();
            fileInfo.classList.remove('hidden');
            fileNameSpan.textContent = "Dữ liệu đã lưu";
        } catch (e) {
            console.error("Lỗi khi load dữ liệu cũ", e);
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

function normalizeCourseKey(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '');
}

function getCourseGroupKey(item, fallbackIndex) {
    const idKey = normalizeCourseKey(item.id);
    if (idKey) return `id:${idKey}`;

    const nameKey = normalizeCourseKey(item.name);
    if (nameKey) return `name:${nameKey}`;

    return `row:${fallbackIndex}`;
}

function isBetterCourseAttempt(candidate, current) {
    const candidateHasNumericGrade = !isNaN(candidate.originalGrade10);
    const currentHasNumericGrade = !isNaN(current.originalGrade10);

    if (candidateHasNumericGrade !== currentHasNumericGrade) {
        return candidateHasNumericGrade;
    }

    if (candidateHasNumericGrade && candidate.originalGrade10 !== current.originalGrade10) {
        return candidate.originalGrade10 > current.originalGrade10;
    }

    const candidateGrade4 = !isNaN(candidate.grade4)
        ? candidate.grade4
        : calculateGrade4(candidate.originalGrade10);
    const currentGrade4 = !isNaN(current.grade4)
        ? current.grade4
        : calculateGrade4(current.originalGrade10);

    if (!isNaN(candidateGrade4) && !isNaN(currentGrade4) && candidateGrade4 !== currentGrade4) {
        return candidateGrade4 > currentGrade4;
    }

    if (candidate.isSpecialMorP !== current.isSpecialMorP) {
        return !candidate.isSpecialMorP;
    }

    return (candidate._sourceIndex || 0) > (current._sourceIndex || 0);
}

function deduplicateRetakenCourses(items) {
    const grouped = new Map();

    items.forEach((item, index) => {
        const key = getCourseGroupKey(item, item._sourceIndex ?? index);
        const existing = grouped.get(key);
        if (!existing || isBetterCourseAttempt(item, existing)) {
            grouped.set(key, item);
        }
    });

    return [...grouped.values()]
        .sort((a, b) => (a._sourceIndex || 0) - (b._sourceIndex || 0))
        .map(item => {
            const { _sourceIndex, ...cleaned } = item;
            return cleaned;
        });
}

function processExcelData(data) {
    const parsedData = data.map((row, index) => {
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
            grade4: !isNaN(parseFloat(row['Điểm'])) ? calculateGrade4(parseFloat(row['Điểm'])) : parseFloat(row['Điểm hệ 4']),
            gradeLetter: gradeLetter,
            isMocked: false,
            isImproving: false,
            isGrade10FromScale4: false,
            originalGrade10: parseFloat(row['Điểm']),
            isException: isException,
            isSpecialIorX: isSpecialIorX,
            isSpecialMorP: isSpecialMorP,
            _sourceIndex: index
        };
    }).filter(item => item.credits > 0 && !item.isSpecialIorX); // Filter out incomplete data (I, X)

    originalData = deduplicateRetakenCourses(parsedData);
    if (parsedData.length !== originalData.length) {
        console.info(`[GPA] Đã gộp ${parsedData.length - originalData.length} học phần trùng (học lại/học cải thiện), ưu tiên lần có kết quả tốt hơn.`);
    }

    displayData = [...originalData];
    updateDashboard();
}

function updateDashboard() {
    calculateStats();
    renderAllTables();
    updateChart();
    saveToStorage();
    
    if (state.config.simMode === 'scale4' && state.hasGPA10Range) {
        gpa10El.textContent = `${state.currentGPA10Min.toFixed(2)}-${state.currentGPA10Max.toFixed(2)}`;
        if (gpa10LabelEl) gpa10LabelEl.textContent = 'GPA Hệ 10 (Ước tính)';
    } else {
        gpa10El.textContent = state.currentGPA10.toFixed(2);
        if (gpa10LabelEl) {
            gpa10LabelEl.textContent = state.config.simMode === 'scale4'
                ? 'GPA Hệ 10 (Quy đổi)'
                : 'GPA Hiện Tại (Hệ 10)';
        }
    }
    gpa4El.textContent = state.currentGPA4.toFixed(2);
    totalCreditsEl.textContent = state.totalCredits;
    pendingSubjectsEl.textContent = state.pendingCount;
    document.getElementById('academicRank').textContent = state.academicRank;

    // Update dynamic labels and placeholders
    const isScale4 = state.config.simMode === 'scale4';
    document.getElementById('targetGpaLabel').textContent = `Máy tính GPA Mục tiêu (${isScale4 ? '4' : '10'})`;
    document.getElementById('recentGradeHeader').textContent = `Điểm (${isScale4 ? '4' : '10'})`;
    
    const targetGpaInput = document.getElementById('targetGpaInput');
    if (targetGpaInput) {
        targetGpaInput.placeholder = isScale4 ? "Ví dụ: 3.5" : "Ví dụ: 8.5";
    }

    // Sync Bulk Grade Input in Simulation Tab
    const bulkGradeInput = document.getElementById('bulkGradeInput');
    if (bulkGradeInput) {
        bulkGradeInput.max = isScale4 ? 4 : 10;
        bulkGradeInput.step = isScale4 ? getScale4Step() : 0.5;
        bulkGradeInput.placeholder = isScale4 ? "3.0" : "8.0";
        // Clear value if it was set to the default by previous code
        if (bulkGradeInput.value == "8.0" || bulkGradeInput.value == "3.0" || bulkGradeInput.value == "8" || bulkGradeInput.value == "3") {
            bulkGradeInput.value = "";
        }
    }
}

function calculateStats() {
    let totalWeighted10 = 0;
    let totalWeighted10Min = 0;
    let totalWeighted10Max = 0;
    let totalWeighted4 = 0;
    let creditsForAverage = 0;
    let totalCreditsPassed = 0;
    let pendingCount = 0;
    let hasGPA10Range = false;
    
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
            if (state.config.simMode === 'scale4' && item.isGrade10FromScale4 && !isNaN(item.grade4)) {
                const bounds = getGrade10BoundsFromGrade4(item.grade4);
                if (bounds) {
                    totalWeighted10Min += bounds.min * item.credits;
                    totalWeighted10Max += bounds.max * item.credits;
                    hasGPA10Range = true;
                } else {
                    totalWeighted10Min += currentGrade * item.credits;
                    totalWeighted10Max += currentGrade * item.credits;
                }
            } else {
                totalWeighted10Min += currentGrade * item.credits;
                totalWeighted10Max += currentGrade * item.credits;
            }
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
    state.currentGPA10Min = creditsForAverage > 0 ? totalWeighted10Min / creditsForAverage : 0;
    state.currentGPA10Max = creditsForAverage > 0 ? totalWeighted10Max / creditsForAverage : 0;
    state.currentGPA4 = creditsForAverage > 0 ? totalWeighted4 / creditsForAverage : 0;
    state.pendingCount = pendingCount;
    state.hasGPA10Range = hasGPA10Range && state.currentGPA10Max - state.currentGPA10Min > 0.0001;
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

function getAllowedScale4Values() {
    const levels = [...new Set(
        state.config.mapping
            .map(m => parseFloat(m.val4))
            .filter(v => !isNaN(v))
    )];
    return levels.sort((a, b) => a - b);
}

function getNearestScale4Value(rawValue) {
    const val = parseFloat(rawValue);
    const levels = getAllowedScale4Values();
    if (isNaN(val) || levels.length === 0) return NaN;

    return levels.reduce((nearest, current) => {
        return Math.abs(current - val) < Math.abs(nearest - val) ? current : nearest;
    }, levels[0]);
}

function getScale4RuleFromInput(rawValue) {
    const snappedVal4 = getNearestScale4Value(rawValue);
    if (isNaN(snappedVal4)) return null;

    const candidates = state.config.mapping
        .filter(m => !isNaN(parseFloat(m.min)) && !isNaN(parseFloat(m.val4)) && parseFloat(m.val4) === snappedVal4)
        .sort((a, b) => parseFloat(a.min) - parseFloat(b.min));

    const rule = candidates[0];
    if (!rule) return null;

    return {
        snappedVal4,
        minGrade10: parseFloat(rule.min),
        letter: rule.letter
    };
}

function getScale4Step() {
    const levels = getAllowedScale4Values();
    if (levels.length < 2) return 0.1;

    let minStep = Infinity;
    for (let i = 1; i < levels.length; i++) {
        const diff = levels[i] - levels[i - 1];
        if (diff > 0 && diff < minStep) minStep = diff;
    }

    return Number.isFinite(minStep) ? minStep : 0.1;
}

function getGrade10BoundsFromGrade4(val4) {
    const targetVal4 = parseFloat(val4);
    if (isNaN(targetVal4)) return null;

    const sorted = [...state.config.mapping]
        .map(rule => ({ min: parseFloat(rule.min), val4: parseFloat(rule.val4) }))
        .filter(rule => !isNaN(rule.min) && !isNaN(rule.val4))
        .sort((a, b) => b.min - a.min);

    if (sorted.length === 0) return null;

    const intervals = [];
    for (let i = 0; i < sorted.length; i++) {
        const current = sorted[i];
        const upper = i === 0 ? 10 : sorted[i - 1].min - 0.01;
        const lower = current.min;
        if (Math.abs(current.val4 - targetVal4) < 1e-9) {
            intervals.push({
                min: Math.max(0, lower),
                max: Math.min(10, Math.max(lower, upper))
            });
        }
    }

    if (intervals.length === 0) return null;

    return {
        min: intervals.reduce((acc, it) => Math.min(acc, it.min), Infinity),
        max: intervals.reduce((acc, it) => Math.max(acc, it.max), -Infinity)
    };
}

function getScale4Rules(minScale4 = 0) {
    const grouped = new Map();

    state.config.mapping.forEach(rule => {
        const minGrade10 = parseFloat(rule.min);
        const val4 = parseFloat(rule.val4);
        if (isNaN(minGrade10) || isNaN(val4)) return;
        if (val4 < minScale4) return;

        const existing = grouped.get(val4);
        if (!existing || minGrade10 < existing.minGrade10) {
            grouped.set(val4, {
                snappedVal4: val4,
                minGrade10: minGrade10,
                letter: rule.letter
            });
        }
    });

    return [...grouped.values()].sort((a, b) => a.snappedVal4 - b.snappedVal4);
}

function getProjectionItems() {
    return originalData.filter(item =>
        !item.isException &&
        !item.isSpecialMorP &&
        (isNaN(item.originalGrade10) || item.isImproving)
    );
}

function buildScale4TargetPlan(targetGpa, options = {}) {
    const minScale4 = !isNaN(parseFloat(options.minScale4)) ? parseFloat(options.minScale4) : 0;
    const projectionItems = getProjectionItems();
    if (projectionItems.length === 0) return null;

    const rules = getScale4Rules(minScale4);
    if (rules.length === 0) return null;

    let baseWeightedPoints = 0;
    let totalCredits = 0;

    originalData.forEach(item => {
        if (item.isException || item.isSpecialMorP) return;

        totalCredits += item.credits;
        const isProjection = isNaN(item.originalGrade10) || item.isImproving;
        if (isProjection) return;

        const grade4 = !isNaN(item.grade4) ? item.grade4 : calculateGrade4(item.originalGrade10);
        baseWeightedPoints += grade4 * item.credits;
    });

    if (totalCredits <= 0) return null;

    const SCALE = 100;
    const baseInt = Math.round(baseWeightedPoints * SCALE);
    const targetInt = Math.round(targetGpa * totalCredits * SCALE);

    let states = new Map();
    states.set(0, 0); // projectedWeightedInt -> balancePenalty
    const tracesByStep = [];
    const MAX_STATES = 30000;

    for (const item of projectionItems) {
        const nextStates = new Map(); // projectedWeightedInt -> bestPenalty
        const stepTrace = new Map();

        for (const [sum, accPenalty] of states.entries()) {
            for (const rule of rules) {
                const weightedInt = Math.round(rule.snappedVal4 * item.credits * SCALE);
                const nextSum = sum + weightedInt;
                const diffFromTarget = rule.snappedVal4 - targetGpa;
                const asymWeight = diffFromTarget < 0 ? 1.55 : 1.0;
                const tailThreshold = targetGpa - 0.8;
                const tailPenalty = rule.snappedVal4 < tailThreshold
                    ? Math.pow(tailThreshold - rule.snappedVal4, 2) * item.credits * 8
                    : 0;
                const nextPenalty = accPenalty + (Math.pow(Math.abs(diffFromTarget), 2) * item.credits * asymWeight) + tailPenalty;

                if (!nextStates.has(nextSum) || nextPenalty < nextStates.get(nextSum)) {
                    nextStates.set(nextSum, nextPenalty);
                    stepTrace.set(nextSum, { prevSum: sum, rule });
                } else if (Math.abs(nextPenalty - nextStates.get(nextSum)) < 1e-9 && Math.random() < 0.25) {
                    // keep some randomness among equivalent-quality solutions
                    stepTrace.set(nextSum, { prevSum: sum, rule });
                }
            }
        }

        if (nextStates.size > MAX_STATES) {
            const ranked = [...nextStates.entries()]
                .map(([sum, penalty]) => ({
                    sum,
                    penalty,
                    distance: Math.abs((baseInt + sum) - targetInt)
                }))
                .sort((a, b) => a.distance - b.distance || a.penalty - b.penalty)
                .slice(0, MAX_STATES);

            const prunedStates = new Map();
            const prunedTrace = new Map();
            ranked.forEach(({ sum, penalty }) => {
                prunedStates.set(sum, penalty);
                prunedTrace.set(sum, stepTrace.get(sum));
            });

            states = prunedStates;
            tracesByStep.push(prunedTrace);
        } else {
            states = nextStates;
            tracesByStep.push(stepTrace);
        }
    }

    let bestProjectedInt = null;
    let bestDistance = Infinity;
    let bestPenalty = Infinity;

    for (const [projectedInt, penalty] of states.entries()) {
        const distance = Math.abs((baseInt + projectedInt) - targetInt);
        if (
            distance < bestDistance ||
            (distance === bestDistance && penalty < bestPenalty) ||
            (distance === bestDistance && Math.abs(penalty - bestPenalty) < 1e-9 && Math.random() < 0.35)
        ) {
            bestDistance = distance;
            bestPenalty = penalty;
            bestProjectedInt = projectedInt;
        }
    }

    if (bestProjectedInt === null) return null;

    const assignments = new Array(projectionItems.length);
    let cursor = bestProjectedInt;

    for (let step = projectionItems.length - 1; step >= 0; step--) {
        const trace = tracesByStep[step].get(cursor);
        if (!trace) return null;
        assignments[step] = {
            item: projectionItems[step],
            rule: trace.rule
        };
        cursor = trace.prevSum;
    }

    const achievedGpa = (baseInt + bestProjectedInt) / SCALE / totalCredits;

    let minProjected = 0;
    let maxProjected = 0;
    projectionItems.forEach(item => {
        minProjected += rules[0].snappedVal4 * item.credits;
        maxProjected += rules[rules.length - 1].snappedVal4 * item.credits;
    });

    const minAchievable = (baseWeightedPoints + minProjected) / totalCredits;
    const maxAchievable = (baseWeightedPoints + maxProjected) / totalCredits;

    const mixMap = new Map();
    assignments.forEach(({ rule }) => {
        const key = rule.snappedVal4.toFixed(2);
        mixMap.set(key, (mixMap.get(key) || 0) + 1);
    });
    const mixSummary = [...mixMap.entries()]
        .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
        .map(([val4, count]) => `${count} môn ${parseFloat(val4).toFixed(1)}`)
        .join(', ');

    return {
        assignments,
        achievedGpa,
        minAchievable,
        maxAchievable,
        mixSummary,
        minScale4
    };
}

function applyScale4TargetPlan(plan) {
    if (!plan || !Array.isArray(plan.assignments)) return;

    plan.assignments.forEach(({ item, rule }) => {
        item.grade4 = rule.snappedVal4;
        item.grade10 = rule.minGrade10;
        item.gradeLetter = rule.letter;
        item.isGrade10FromScale4 = true;
        item.isMocked = true;
    });

    updateDashboard();
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
        const isPending = isNaN(item.grade10) || item.grade10 === null;
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
            <td>${(item.grade4 !== null && !isNaN(item.grade4)) ? item.grade4.toFixed(2) : '--'}</td>
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
    const projectedItems = originalData.filter(i =>
        (isNaN(i.originalGrade10) || i.isImproving) &&
        !i.isException &&
        !i.isSpecialMorP
    );

    if (projectedItems.length === 0) {
        recentTableBody.innerHTML = '<tr><td colspan="4" class="empty-state">Chưa có học phần nào trong diện dự phóng.</td></tr>';
        return;
    }

    const isScale4 = state.config.simMode === 'scale4';
    projectedItems.forEach(item => {
        const gradeDisplay = isScale4
            ? ((item.grade4 !== null && !isNaN(item.grade4)) ? item.grade4.toFixed(2) : '--')
            : (isNaN(item.grade10) ? '--' : item.grade10.toFixed(1));
        const statusLabel = item.isMocked ? 'Đã dự phóng' : 'Chờ nhập';
        recentTableBody.innerHTML += `<tr><td>${item.id}</td><td>${item.name}</td><td>${gradeDisplay}</td><td><span class="save-status">${statusLabel}</span></td></tr>`;
    });
}

function renderSimulationTable() {
    simulationTableBody.innerHTML = '';
    const sims = originalData.filter(i => (isNaN(i.originalGrade10) || i.isImproving) && !i.isException && !i.isSpecialMorP);
    
    if (sims.length === 0) {
        simulationTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">Không có môn học nào cần dự phóng.</td></tr>';
        return;
    }

    const isScale4 = state.config.simMode === 'scale4';

    sims.forEach((item) => {
        const originalIndex = originalData.indexOf(item);
        let displayValue = '';
        if (isScale4) {
            displayValue = !isNaN(item.grade4) ? item.grade4.toFixed(2) : '0.00';
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
                               step="${isScale4 ? getScale4Step() : '0.5'}" 
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
    item.isGrade10FromScale4 = false;
    item.isMocked = false;
    updateDashboard();
}

function updateSimulationGrade(index, value) {
    const val = parseFloat(value);
    const item = originalData[index];
    if (state.config.simMode === 'scale4') {
        const mapped = getScale4RuleFromInput(val);
        if (!mapped) {
            renderAllTables();
            return;
        }

        item.grade4 = mapped.snappedVal4;
        item.grade10 = mapped.minGrade10;
        item.gradeLetter = mapped.letter;
        item.isGrade10FromScale4 = true;
    } else {
        item.grade10 = val;
        item.grade4 = calculateGrade4(val);
        item.gradeLetter = calculateGradeLetter(val);
        item.isGrade10FromScale4 = false;
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
        item.isGrade10FromScale4 = false;
        item.isMocked = true;
        updateDashboard();
    } else { renderAllTables(); }
}

function toggleImprovement(index) {
    const item = originalData[index];
    if (item.isException || item.isSpecialMorP || isNaN(item.originalGrade10)) return;
    
    item.isImproving = !item.isImproving;
    
    if (!item.isImproving) {
        // When unselecting, reset to actual original values
        item.grade10 = item.originalGrade10;
        item.grade4 = calculateGrade4(item.grade10);
        item.gradeLetter = calculateGradeLetter(item.grade10);
        item.isGrade10FromScale4 = false;
        item.isMocked = false;
    }
    // When selecting, we just add it to Projection tab without changing current grades
    
    updateDashboard();
}

function bulkSetGrades(grade) {
    const isScale4 = state.config.simMode === 'scale4';
    const maxVal = isScale4 ? 4 : 10;
    
    if (isNaN(grade) || grade < 0 || grade > maxVal) return;
    const mappedScale4 = isScale4 ? getScale4RuleFromInput(grade) : null;
    if (isScale4 && !mappedScale4) return;

    originalData.forEach(item => {
        if (!item.isException && !item.isSpecialMorP && (isNaN(item.originalGrade10) || item.isImproving)) {
            if (isScale4) {
                item.grade4 = mappedScale4.snappedVal4;
                item.grade10 = mappedScale4.minGrade10;
                item.gradeLetter = mappedScale4.letter;
                item.isGrade10FromScale4 = true;
            } else {
                item.grade10 = grade;
                item.grade4 = calculateGrade4(grade);
                item.gradeLetter = calculateGradeLetter(grade);
                item.isGrade10FromScale4 = false;
            }
            item.isMocked = true;
        }
    });
    updateDashboard();
}

function filterAndRenderTable(query) {
    displayData = originalData.filter(item => 
        String(item.name).toLowerCase().includes(query.toLowerCase()) || 
        String(item.id).toLowerCase().includes(query.toLowerCase())
    );
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
    const isScale4 = state.config.simMode === 'scale4';
    let cw = 0, cc = 0; 
    const gpaTrend = [], labels = [];

    originalData.forEach((item, i) => {
        if (!isNaN(item.grade10) && !item.isException && !item.isSpecialMorP) {
            const grade = isScale4
                ? (!isNaN(item.grade4) ? item.grade4 : calculateGrade4(item.grade10))
                : item.grade10;
            cw += grade * item.credits; 
            cc += item.credits;
            gpaTrend.push((cw / cc).toFixed(2)); 
            labels.push(item.id);
        }
    });

    chart.data.labels = labels; 
    chart.data.datasets[0].data = gpaTrend; 
    chart.data.datasets[0].label = `GPA Tích Lũy (Hệ ${isScale4 ? '4' : '10'})`;
    chart.update();
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
function initExport() {
    const exportBtn = document.getElementById('exportBtn');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', async () => {
        const dashboard = document.querySelector('.dashboard-container');
        const originalBtnText = exportBtn.innerHTML;
        
        try {
            exportBtn.disabled = true;
            exportBtn.innerHTML = '<i data-lucide="loader"></i> Đang xử lý...';
            lucide.createIcons();

            // Small delay to ensure icons are ready
            await new Promise(r => setTimeout(r, 500));

            const canvas = await html2canvas(dashboard, {
                backgroundColor: '#020617',
                scale: 2, // Higher quality
                logging: false,
                useCORS: true,
                ignoreElements: (el) => el.classList.contains('btn-help') || el.id === 'helpModal'
            });

            const link = document.createElement('a');
            link.download = `GPA_Report_${new Date().toISOString().slice(0,10)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Lỗi khi xuất ảnh:', err);
            alert('Có lỗi xảy ra khi xuất báo cáo. Vui lòng thử lại.');
        } finally {
            exportBtn.disabled = false;
            exportBtn.innerHTML = originalBtnText;
            lucide.createIcons();
        }
    });
}

function initTargetCalculator() {
    const targetGpaInput = document.getElementById('targetGpaInput');
    const calcTargetBtn = document.getElementById('calcTargetBtn');
    const targetResult = document.getElementById('targetResult');
    const targetResultValue = document.getElementById('targetResultValue');

    if (!calcTargetBtn || !targetResult || !targetGpaInput) return;

    calcTargetBtn.addEventListener('click', () => {
        const isScale4 = state.config.simMode === 'scale4';
        const targetGpa = parseFloat(targetGpaInput.value);
        const maxVal = isScale4 ? 4 : 10;

        if (isNaN(targetGpa) || targetGpa < 0 || targetGpa > maxVal) {
            alert(`Vui lòng nhập GPA mục tiêu hợp lệ (0-${maxVal}).`);
            return;
        }

        const inverse = calculateInverseGPA(targetGpa);
        if (inverse === null) {
            alert('Không tìm thấy môn học nào để dự phóng trong danh sách.');
            return;
        }

        if (isScale4) {
            const balancedMinFloor = Math.max(TARGET_PLANNER_DEFAULT_MIN_SCALE4, targetGpa - 1.0);
            let plan = buildScale4TargetPlan(targetGpa, { minScale4: balancedMinFloor });
            let planMode = 'balanced';

            if (!plan) {
                plan = buildScale4TargetPlan(targetGpa, { minScale4: TARGET_PLANNER_DEFAULT_MIN_SCALE4 });
                if (plan) planMode = 'safe-floor';
            }

            if (!plan) {
                plan = buildScale4TargetPlan(targetGpa, { minScale4: 0 });
                if (plan) planMode = 'unrestricted';
            }

            if (!plan) {
                alert('Không thể tạo phương án phân bổ hệ 4 từ cấu hình hiện tại.');
                return;
            }

            const delta = plan.achievedGpa - targetGpa;
            const outsideRange = targetGpa < plan.minAchievable || targetGpa > plan.maxAchievable;
            const deltaLabel = `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`;

            targetResult.classList.remove('hidden');
            targetResult.innerHTML = `
                <div>Cần trung bình liên tục: <strong>${inverse.value.toFixed(2)}</strong> /tín chỉ dự phóng</div>
                <div class="${outsideRange ? 'text-destructive' : ''}">
                    GPA thực tế khả thi gần nhất: <strong>${plan.achievedGpa.toFixed(2)}</strong> (${deltaLabel} so với mục tiêu ${targetGpa.toFixed(2)})
                </div>
                <div>Phân bổ gợi ý: ${plan.mixSummary || 'Không có'}</div>
                ${planMode === 'unrestricted'
                    ? `<div class="impossible-warning"><i data-lucide="alert-octagon"></i> Không tìm thấy phương án cân bằng với ngưỡng an toàn. Đang dùng phân bổ không giới hạn.</div>`
                    : `<div>Ngưỡng cân bằng đang áp dụng: <strong>${plan.minScale4.toFixed(1)}+</strong></div>`}
                ${outsideRange ? `<div class="impossible-warning"><i data-lucide="alert-octagon"></i> Mục tiêu nằm ngoài miền khả thi (${plan.minAchievable.toFixed(2)} - ${plan.maxAchievable.toFixed(2)}).</div>` : ''}
                <button class="btn-text" id="applyTargetPlanBtn">Áp dụng phân bổ</button>
            `;

            const applyPlanBtn = document.getElementById('applyTargetPlanBtn');
            if (applyPlanBtn) {
                applyPlanBtn.addEventListener('click', () => {
                    applyScale4TargetPlan(plan);
                    alert(`Đã áp dụng phân bổ. GPA thực tế dự kiến: ${plan.achievedGpa.toFixed(2)}.`);
                });
            }

            lucide.createIcons();
            targetResult.dataset.lastCalc = inverse.value;
            targetResult.dataset.actualGpa = plan.achievedGpa;
            return;
        }

        if (targetResultValue) {
            targetResultValue.textContent = inverse.value.toFixed(2);
        }
        targetResult.classList.remove('hidden');

        if (inverse.isImpossible) {
            targetResult.innerHTML = `
                <div class="impossible-warning">
                    <i data-lucide="alert-octagon"></i> Mục tiêu vượt trần! (Cần ${inverse.value.toFixed(2)}/tín chỉ)
                </div>
                <button class="btn-text" id="closeTargetWarning">Đóng</button>
            `;
            const closeBtn = document.getElementById('closeTargetWarning');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    targetResult.classList.add('hidden');
                });
            }
            lucide.createIcons();
        } else {
            targetResult.innerHTML = `
                Cần đạt: <strong id="targetResultValue">${inverse.value.toFixed(2)}</strong> /tín chỉ dự phóng
                <button class="btn-text" id="applyTargetBtn">Tự động áp dụng</button>
            `;
            const applyBtn = document.getElementById('applyTargetBtn');
            if (applyBtn) {
                applyBtn.addEventListener('click', () => {
                    bulkSetGrades(inverse.value);
                    alert(`Đã áp dụng các môn dự phóng để hướng tới mục tiêu!`);
                });
            }
        }

        targetResult.dataset.lastCalc = inverse.value;
    });
}

function calculateInverseGPA(targetGpa) {
    const isScale4 = state.config.simMode === 'scale4';
    let currentTotalWP = 0;
    let currentTotalCredits = 0;
    let pendingCredits = 0;

    originalData.forEach(item => {
        if (item.isException || item.isSpecialMorP) return;

        const isPendingOrImproving = isNaN(item.originalGrade10) || item.isImproving;

        if (isPendingOrImproving) {
            pendingCredits += item.credits;
        } else {
            const grade = isScale4
                ? (!isNaN(item.grade4) ? item.grade4 : calculateGrade4(item.originalGrade10))
                : item.originalGrade10;
            currentTotalWP += grade * item.credits;
            currentTotalCredits += item.credits;
        }
    });

    if (pendingCredits === 0) return null;

    const requiredWP = (targetGpa * (currentTotalCredits + pendingCredits)) - currentTotalWP;
    const avgRequired = requiredWP / pendingCredits;

    const maxVal = isScale4 ? 4 : 10;
    return {
        value: avgRequired,
        isImpossible: avgRequired > maxVal
    };
}
