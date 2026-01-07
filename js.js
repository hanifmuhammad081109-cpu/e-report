const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const pageTitle = document.querySelector('#pageTitle');

function changePage(pageId) {
    // Hide all pages
    pages.forEach(page => page.classList.remove('active'));
    navItems.forEach(item => item.classList.remove('active'));

    // Show the selected page
    const targetPage = document.querySelector(`.${pageId}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    // Update colour
    const activeNavItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
        if (pageTitle) pageTitle.textContent = activeNavItem.textContent;
    }

    renderViewTable()
}

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = item.dataset.page;
        changePage(pageId);
    });
});

// 1.Database 
let laporanList = JSON.parse(localStorage.getItem('laporanList')) || [];
// render stored data once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    renderViewTable();
});

const laporanForm = document.getElementById('laporanForm');
if (laporanForm) {
    laporanForm.addEventListener('submit',(e) =>  {
        e.preventDefault();

        const laporan = {
            id:Date.now(),
            nama: (document.getElementById('nama')?.value || '').trim(),
            kelas: document.getElementById('kelas')?.value || '',
            judul: (document.getElementById('judul')?.value || '').trim(),
            nilai: Number(document.getElementById('nilai')?.value || 0),
            kategori: document.getElementById('kategori')?.value || '',
            keterangan: document.getElementById('keterangan')?.value || '',
            //Tanggal
            tanggal: new Date().toLocaleDateString('id-ID', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            })
        };

        laporanList.push(laporan);
        localStorage.setItem('laporanList', JSON.stringify(laporanList));
        renderViewTable();
        laporanForm.reset();
    });
}
function renderViewTable() {
    const tbody = document.querySelector('#viewTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    laporanList.forEach((laporan, index) => {
        const status = laporan.nilai >= 75 ? 'Lulus' : 'Tidak Lulus';
        const classStatus = laporan.nilai >= 75 ? 'status-lulus' : 'status-tidak';
        const row = document.createElement('tr');
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

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            deleteItem(id);
        });
    });
}

function deleteItem(id) {
    if (confirm('Yakin ingin menghapus data ini?')) {
        laporanList = laporanList.filter(item => item.id !== id);
        localStorage.setItem('laporanList', JSON.stringify(laporanList));
        renderViewTable();
    }
}

const filterInput = document.getElementById('filterInput');
filterInput.addEventListener('keyup', () => {
    const keyword = filterInput.value.toLowerCase();
    const rows = document.querySelectorAll('#viewTable tbody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(keyword) ? '' : 'none';
    });
});

function updateDashboard(){
    const totalLaporan = laporanList.length;

    const siswaUnik = [...new Set(laporanList.map(item => item.nama))].length;
    const totalLulus = laporanList.filter(item => item.nilai >= 75).length;
    const totalTidakLulus = laporanList.filter(item => item.nilai < 75).length;

    animateCounter(document.getElementById('totalLaporan'), totalLaporan);
    animateCounter(document.getElementById('totalSiswa'), siswaUnik);
    animateCounter(document.getElementById('totalLulus'), totalLulus);
    animateCounter(document.getElementById('totalTidakLulus'), totalTidakLulus);

    renderRecentTable();
}

function renderRecentTable(){
    const tbody = document.querySelector('#recentTable tbody');
    tbody.innerHTML = '';

    if(laporanList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #999;">Belum ada data</td></tr>';
        return;
    }

    const recent = laporanList.slice(-5).reverse();
    recent.forEach((laporan, index) => {
        const status = laporan.nilai >= 75 ? 'Lulus' : 'Tidak Lulus';
        const classStatus = laporan.nilai >= 75 ? 'status-lulus' : 'status-tidak';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${laporan.nama}</td>
            <td>${laporan.kelas}</td>
            <td>${laporan.nilai}</td>
            <td><span class="${classStatus}">${status}</span></td>
            <td>${laporan.tanggal}</td>
            <td>
                <button class="btn btn-danger delete-btn" data-id="${laporan.id}">Hapus</button>
            </td>
        `;
        tbody.appendChild(row);

    });
}

function animateCounter(element, target) {
    let current = 0;
    const increment = Math.ceil(target / 20)
    const interval = setInterval(() => {
        current += increment;
        if(current >= target) {
            current = target;
            clearInterval(interval);
        }
        element.textContent = current;
    }, 30)
}

function updateStatistikPage() {
     const pieChart = document.getElementById('passPieChart');
     if(!pieChart) return;

     //kondisi Awal
     if (!laporanList || laporanList.length === 0) {
        pieChart.style.background = "#e5e7eb";

        const emptyMsg = '<p style="color: #999; text-align: center; padding: 10px">Memuat data...</p>';
        document.getElementById('gradeDistribution').innerHTML = emptyMsg;
        document.getElementById('topStudentList').innerHTML = emptyMsg;
        document.getElementById('classAverages').innerHTML = emptyMsg;

        document.getElementById('avgSchool').textContent = average.toFixed(2);
        document.getElementById('maxScore').textContent = max;
        document.getElementById('minScore').textContent = min;
        return;
    }

    const total = laporanList.length;
    const lulusCount = laporanList.filter(item => item.nilai >= 75).length;
    const lulusPercent = (lulusCount / total ) * 100;

    //Rumus: Hijau sampai X%, Merah mulai X% 
    pieChart.style.background = `conic-gradient(var(--success) 0% ${lulusPercent}%, var(--danger) ${lulusPercent}% 100%);`

    // B. Statistik Detail
    const allNilai = laporanList.map(item => parseInt(item.nilai));
    const average = (allNilai.reduce((a, b) => a + b, 0) / allNilai.length) || 0;
    const max = Math.max(...allNilai) || 0;
    const min = Math.min(...allNilai) || 0;

    document.getElementById('avgClass').textContent = average.toFixed(2);
    document.getElementById('maxScore').textContent = max;
    document.getElementById('minScore').textContent = min;
}

updateDashboard();
updateStatistikPage();
