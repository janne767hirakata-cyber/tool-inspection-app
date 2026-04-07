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
            alertList.innerHTML = '<li class="text-muted" style="padding:20px; text-align:center;">現在アラートはありません。</li>';
        } else {
            alertList.innerHTML = lowStockItems.map(i => {
                const thumb = i.image ? `<img src="${i.image}" class="tool-thumb" style="width:40px;height:40px;">` : `<div class="tool-thumb-placeholder" style="width:40px;height:40px;"><i class="ph ph-warning"></i></div>`;
                return `
                <li style="display:flex; align-items:center; gap:16px; padding:16px; border-bottom:1px solid var(--border-color);">
                    ${thumb}
                    <div style="flex:1;">
                        <div style="font-weight:700; color:var(--danger-color);">${i.name} の在庫不足</div>
                        <div style="font-size:13px; color:var(--text-muted);">現在数: ${i.currentQty} / 規定数: ${i.requiredQty}</div>
                    </div>
                    <button class="btn btn-icon" onclick="InventoryView.editItem('${i.id}')"><i class="ph ph-pencil"></i></button>
                </li>
                `;
            }).join('');
        }

        // 校正・貸出リスト
        const mainList = document.getElementById('maintenance-list');
        const maintenanceItems = items.filter(i => i.status === 'borrowed' || i.status === 'calibration');
        
        if (maintenanceItems.length === 0) {
            mainList.innerHTML = '<li class="text-muted" style="padding:20px; text-align:center;">現在貸出・校正中の工具はありません。</li>';
        } else {
            mainList.innerHTML = maintenanceItems.map(i => {
                const isCalibration = i.status === 'calibration';
                const statusText = isCalibration ? '校正中' : '貸出中';
                const dateText = isCalibration && i.calibrationDate ? `<br><span style="font-size:11px; color:var(--primary-color);">次回: ${i.calibrationDate}</span>` : '';
                const thumb = i.image ? `<img src="${i.image}" class="tool-thumb" style="width:40px;height:40px;">` : `<div class="tool-thumb-placeholder" style="width:40px;height:40px;"><i class="ph ph-wrench"></i></div>`;

                return `
                <li style="display:flex; align-items:center; gap:16px; padding:16px; border-bottom:1px solid var(--border-color);">
                    ${thumb}
                    <div style="flex:1;">
                        <div style="font-weight:700;">${i.name}</div>
                        <div style="font-size:13px; color:var(--text-muted);">${statusText}${dateText}</div>
                    </div>
                    <button class="btn btn-icon" onclick="InventoryView.editItem('${i.id}')"><i class="ph ph-pencil"></i></button>
                </li>
                `;
            }).join('');
        }
    }
};
