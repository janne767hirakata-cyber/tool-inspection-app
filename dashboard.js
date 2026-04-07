// js/dashboard.js

const DashboardView = {
    render() {
        const templateEl = document.getElementById('tmpl-dashboard');
        if (!templateEl) {
            console.error('Dashboard template not found');
            return;
        }
        const template = templateEl.content.cloneNode(true);
        const container = document.getElementById('view-container');
        if (!container) return;
        container.innerHTML = '';
        container.appendChild(template);

        this.updateStats();
        this.renderLists();
    },

    updateStats() {
        const items = StorageManager.getItems();
        
        const lowStockItems = items.filter(i => i.type === 'consumable' && i.currentQty < i.requiredQty);
        const maintenanceItems = items.filter(i => i.status === 'borrowed' || i.status === 'calibration');
        
        document.getElementById('dash-low-stock').textContent = lowStockItems.length;
        document.getElementById('dash-maintenance').textContent = maintenanceItems.length;
        document.getElementById('dash-total-items').textContent = items.length;
    },

    renderLists() {
        const items = StorageManager.getItems();
        
        // アラートリスト（規定量未満の消耗品）
        const alertList = document.getElementById('alert-list');
        const lowStockItems = items.filter(i => i.type === 'consumable' && i.currentQty < i.requiredQty);
        
        if (lowStockItems.length === 0) {
            alertList.innerHTML = '<li class="list-item"><p class="text-muted">現在アラートはありません。</p></li>';
        } else {
            alertList.innerHTML = lowStockItems.map(i => `
                <li class="list-item danger">
                    <div class="list-item-icon"><i class="ph ph-warning-circle"></i></div>
                    <div class="list-item-content">
                        <h4>${i.name} の在庫が不足しています</h4>
                        <p>現在: ${i.currentQty} / 規定: ${i.requiredQty}</p>
                    </div>
                </li>
            `).join('');
        }

        // 校正・貸出リスト
        const mainList = document.getElementById('maintenance-list');
        const maintenanceItems = items.filter(i => i.status === 'borrowed' || i.status === 'calibration');
        
        if (maintenanceItems.length === 0) {
            mainList.innerHTML = '<li class="list-item"><p class="text-muted">現在貸出・校正中の工具はありません。</p></li>';
        } else {
            mainList.innerHTML = maintenanceItems.map(i => {
                const isCalibration = i.status === 'calibration';
                const statusText = isCalibration ? '校正中' : '貸出中';
                const iconClass = isCalibration ? 'warning' : '';
                const icon = isCalibration ? '<i class="ph ph-wrench"></i>' : '<i class="ph ph-hand-coins"></i>';
                const dateText = isCalibration && i.calibrationDate ? ` (次回予定: ${i.calibrationDate})` : '';

                return `
                <li class="list-item ${iconClass}">
                    <div class="list-item-icon">${icon}</div>
                    <div class="list-item-content">
                        <h4>${i.name}</h4>
                        <p>状態: ${statusText}${dateText}</p>
                    </div>
                </li>
                `;
            }).join('');
        }
    }
};
