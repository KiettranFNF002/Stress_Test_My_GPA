const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createElementStub() {
    return {
        addEventListener() {},
        appendChild() {},
        setAttribute() {},
        getContext() { return {}; },
        querySelector() { return createElementStub(); },
        querySelectorAll() { return []; },
        classList: {
            add() {},
            remove() {}
        },
        style: {},
        innerHTML: '',
        textContent: '',
        value: ''
    };
}

function loadAppApi() {
    const appPath = path.join(__dirname, '..', 'app.js');
    const code = fs.readFileSync(appPath, 'utf8');
    const context = {
        console,
        setTimeout() {},
        confirm() { return false; },
        location: { reload() {} },
        localStorage: {
            getItem() { return null; },
            setItem() {},
            removeItem() {}
        },
        document: {
            body: createElementStub(),
            addEventListener() {},
            createElement: createElementStub,
            getElementById: createElementStub,
            querySelector: createElementStub,
            querySelectorAll() { return []; }
        },
        Chart: function Chart() {},
        lucide: { createIcons() {} },
        XLSX: {}
    };

    vm.runInNewContext(`${code}\nthis.__api = { deduplicateRetakenCourses, getCourseGroupKey };`, context);
    return context.__api;
}

function makeCourse(id, name, grade, sourceIndex) {
    return {
        id,
        name,
        credits: 3,
        grade10: grade,
        grade4: grade >= 8 ? 3.5 : 2.0,
        originalGrade10: grade,
        gradeLetter: grade >= 8 ? 'B+' : 'C',
        isException: false,
        isSpecialMorP: false,
        isSpecialIorX: false,
        isMocked: false,
        isImproving: false,
        isGrade10FromScale4: false,
        _sourceIndex: sourceIndex
    };
}

const { deduplicateRetakenCourses, getCourseGroupKey } = loadAppApi();

{
    const matStats = makeCourse('MAT508135', 'Thống kê ứng dụng', 6.0, 0);
    const staStats = makeCourse('STA508029', 'Thống kê ứng dụng trong kinh tế và kinh doanh', 8.0, 1);

    const deduped = deduplicateRetakenCourses([matStats, staStats]);

    assert.strictEqual(deduped.length, 1, 'equivalent course IDs should be grouped as one course');
    assert.strictEqual(deduped[0].id, 'STA508029', 'best equivalent attempt should be kept');
}

{
    const leftToRight = getCourseGroupKey(makeCourse('ENG513159', 'Tiếng Anh chuyên ngành 1 [COB]', 7.0, 0), 0);
    const rightToLeft = getCourseGroupKey(makeCourse('ENG513197', 'Tiếng Anh lĩnh vực Kinh doanh (HP1)', 8.0, 1), 1);

    assert.strictEqual(leftToRight, rightToLeft, 'bidirectional equivalent rows should resolve to the same group key');
}

console.log('course dedup tests passed');
