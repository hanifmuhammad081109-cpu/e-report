const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const pageTitle = document.getElementById('pageTitle')

function changePage(pageId) {
    // 1. Sembunyikan Semua halaman terlebih dahulu
    pages.forEach(page => page.classList.remove('active'));
    navItems.forEach(item => item.classList.remove('active'))

    // 2. Mengaktifkan halaman yang dipilih
    const targetPage = document.querySelector(`.page.${pageId}-page`)
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // 3.  Update Warna menu di sidebar ketika halaman aktif
    const activeNav = document.querySelector(`[data-page="${pageId}"]`);
    if(activeNav) {
        activeNav.classList.add('active')
        pageTitle.textContent = activeNav.textContent;
    }

    renderViewTable()
}

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault(); //Mencegah Browser Agar tidak reload ketika diklick
        const pageId = item.dataset.page;
        changePage(pageId);
    });
});
//1. Database (Read From Storage)
let laporanList = JSON.parse(localStorage.getItem('laporanList')) || [];

//2. Create Database
const laporanForm = document.getElementById('laporanForm');

laporanForm.addEventListener('submit', (e) => {
    e.preventDefault();

    //Ambil semua data dari html
    const laporan = {
        id: Date.now(),
        nama: document.getElementById('nama').value.trim(),
        kelas: document.getElementById('kelas').value,
        judul: document.getElementById('judul').value.trim(),
        nilai: document.getElementById('nilai').value.trim(),
        kategori: document.getElementById('kategori').value,
        keterangan: document.getElementById('keterangan').value.trim(),

        //Format tanggal Indonesia
        tanggal: new Date().toLocaleDateString('id-ID', {
            'weekday': 'long', 'day' : 'numeric', 'month' : 'long', 'year' : 'numeric'
        })
    };

    //Validasi Sederhana
    // if(!laporan.nama || !laporan.kelas || !laporan.nilai)

    //masukkan data ke laporanList
    laporanList.push(laporan);
    console.log(laporanList)
    localStorage.setItem('laporanList', JSON.stringify(laporanList));
    laporanForm.reset();
})

function renderViewTable() {
    const tbody = document.querySelector('#viewTable tbody');
    tbody.innerHTML = "" ;

    laporanList.forEach((laporan, index) => {
        const row = document.createElement("tr")
        const status = laporan.nilai >= 75 ? 'Lulus' : 'Tidak Lulus';
        const classStatus = laporan.nilai >= 75 ? 'status-lulus' : 'status-tidak';
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${laporan.nama}</td>
            <td>${laporan.kelas}</td>
            <td>${laporan.judul}</td>
            <td>${laporan.nilai}</td>
            <td>${laporan.kategori}</td>
            <td><span class="${classStatus}">${status}</span></td>
            <td>${laporan.tanggal}</td>
            <td>
                <button class="btn btn-danger delete-btn" data-id="${laporan.id}">Hapus</button>
            </td>
        `;

        tbody.appendChild(row);
    });

    // >>> EVENT LISTENER DIPASANG DI SINI <<<
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            deleteItem(id);
        })
    });
}




function deleteItem(id) {
    if(confirm('Yakin ingin menghapus data ini?')) {
        laporanList = laporanList.filter(item => item.id !== id);

        localStorage.setItem('laporanList', JSON.stringify(laporanList));

        renderViewTable();
    }
}

const filterInput = document.getElementById('filterInput')
filterInput.addEventListener("keyup", () => {
    const keyword = filterInput.value.toLowerCase();
    const rows = document.querySelectorAll('#viewTable tbody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(keyword) ? '' : "none" ;
    })
})

function updateDashboard() {
    const totalLaporan = laporanList.length;

    const siswaUnik = [...new Set(laporanList.map(item => item.nama))].length;
    const totalLulus = laporanList.filter(item => item.nilai >= 75).length;
    const totalTidakLulus = laporanList.filter(item => item.nilai < 75).length;

    animateCounter(document.getElementById("totalLaporan"), totalLaporan);
    animateCounter(document.getElementById("totalSiswa"), siswaUnik);
    animateCounter(document.getElementById("totalLulus"), totalLulus);
    animateCounter(document.getElementById("totalTidakLulus"), totalTidakLulus);

    renderRecentTable();
}

function renderRecentTable() {
    const tbody = document.querySelector('#recentTable tbody')
    tbody.innerHTML = '';

    if(laporanList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #999;">Belum ada data</td></tr>` ;
        return;

    }

    const recent = laporanList.slice(-5).reverse();
    recent.forEach((laporan, index) => {
        const row = document.createElement("tr")
        const status = laporan.nilai >= 75 ? 'Lulus' : 'Tidak Lulus';
        const classStatus = laporan.nilai >= 75 ? 'status-lulus' : 'status-tidak';

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${laporan.nama}</td>
            <td>${laporan.kelas}</td>
            <td>${laporan.nilai}</td>
            <td><span class="${classStatus}">${status}</span></td>
            <td>${laporan.tanggal}</td>
        `
        tbody.appendChild(row)
    });
}



function animateCounter(element, target) {
    let current = 0;
    const increment = Math.ceil(target / 20);
    const interval = setInterval (() => {
       current += increment ;
       if (current >= target) {
        current = target;
        clearInterval(interval);
       } 
       element.textContent = current
    }, 30)
       

}

function updateStatistikPage() {
    const pieChart = document.getElementById('passPieChart');
    if (!pieChart) return;

    const emptyMsg = '<p style="color: #999; text-align: center;">Memuat data...</p>';

    //Kondisi awal
    if(!laporanList || laporanList.length === 0) {
        pieChart.style.background = "#e5e7eb";
        
        document.getElementById('gradeDistribution').innerHTML = emptyMsg;
        document.getElementById('topStudentList').innerHTML = emptyMsg;
        document.getElementById('classAverages').innerHTML = emptyMsg;

        document.getElementById('avgSchool').textContent = emptyMsg;
        document.getElementById('maxScore').textContent = emptyMsg;
        document.getElementById('minScore').textContentL = emptyMsg;
        return;

    }

    // A. Pie Chart (lulus vs Remedial)
    const total = laporanList.length;
    const lulusCount = laporanList.filter(item => item.nilai >= 75).length;
    const lulusPercent = (lulusCount / total) * 100;
    
    //Rumus: hijau sampai x%, merah mulai x%
    pieChart.style.background = `conic-gradient(var(--success) 0% ${lulusPercent}%, var(--danger) ${lulusPercent}% 100%)`;

    //B. Statistic Angka
    const allNilai = laporanList.map(item => parseInt(item.nilai));
    const average = (allNilai.reduce((a,b) => a + b, 0) / total).toFixed(1);
    const maxVal = Math.max(...allNilai);
    const minVal = Math.min(...allNilai);

    document.getElementById('avgSchool').textContent = average;
    document.getElementById('maxScore').textContent = maxVal;
    document.getElementById('minScore').textContent = minVal;

    const grades = {'A ( 90 - 100)': 0, 'B (80 - 89)': 0, 'C (75 - 79)': 0, 'D(<75)': 0}

    laporanList.forEach(item => {
        const val = parseInt(item.nilai);
        if(val >= 90) grades['A ( 90 - 100)']++
        else if(val >= 80) grades['B (80 - 89)']++
        else if(val >= 75) grades['C (75 - 79)']++
        else grades['D(<75)']++
    });

    const gradeContainer = document.getElementById('gradeDistribution');
    gradeContainer.innerHTML = '';

    for(const [label, count] of Object.entries(grades)) {
        const percent = (count / total) * 100;

        // Tentukan Warn Bar
        let colorVar = "var(--primary)";
        if (label.includes("A")) colorVar = "var(--success)";
        if (label.includes("D")) colorVar = "var(--danger)";

        gradeContainer.innerHTML += `
         <div class="bar-row">
            <div class="bar-label">${label.split(' ')[0]}</div>
            <div class="bar-track">
                <div class="bar-fill" style="width: ${percent}%; background-color: ${colorVar}"></div>
            </div>
            <div class="bar-count">${count}</div>
        </div>
        `;

    }

    //5. Top 5 Siswa
    //agar tidak merusak urutan asli,kita buat aray lalu sort descanding
    const sortedStudent = [...laporanList].sort((a, b) => b.nilai - a.nilai).slice(0, 5);

    const topContainer = document.getElementById('topStudentList');
    topContainer.innerHTML = '' ;

    sortedStudent.forEach((student, index) => {
        let rankClass = '';
        if (index === 0) rankClass = 'rank-1';
        else if (index === 1) rankClass = 'rank-2';
        else if (index === 2) rankClass = 'rank-3';

        topContainer.innerHTML += `
        <div class="leaderboard-item">
        <div style="display: flex; align-items: center;">
            <div class="rank-badge ${rankClass}">${index + 1}</div>
            <div>
                <div style="font-weight: 600; color: var(--text-primary);">${student.nama}</div>
                <div style="font-weight: 600; color: var(--text-secondary);">${student.kelas} . ${student.kategori}</div>
            </div>
        </div>
        <div style="font-weight: bold; color: var(--text-primary); font-size: 16px;">${student.nilai}</div>
    </div>
        `;
    })

    //E. Rata-Rata per Kelas
    const classData = {}

    //Kelompokkan data perkelas
    laporanList.forEach(item => {
        if (!classData[item.kelas]) {
            classData[item.kelas] =  {totalNilai: 0, jumlahSiswa: 0};
        }
            classData[item.kelas].totalNilai += parseInt(item.nilai)
            classData[item.kelas].jumlahSiswa += 1;
    });

    const classAverage = document.getElementById('classAverages');
    classAverage.innerHTML = '';

    Object.keys(classData).sort().forEach(className => {
        const data = classData[className];
        const avg = (data.totalNilai / data.jumlahSiswa).toFixed(1);

        classAverage.innerHTML += `
        <div class="class-stats-box">
        <div class="class-name">${className}</div>
        <div class="class-avg">${avg}</div>
    </div>
        `
    })
}

updateStatistikPage();
updateDashboard();