// js/storage.js

const STORAGE_KEYS = {
    ITEMS: 'app_inventory_items',
    INSPECTIONS: 'app_inspection_records',
    SETTINGS: 'app_settings'
};

const DEFAULT_ITEMS = [
    { id: 'item-1', name: 'トルクレンチ', location: 'A', type: 'equipment', requiredQty: 1, currentQty: 1, needPaintCheck: false, status: 'calibration', calibrationDate: '2026-05-10' },
    { id: 'item-2', name: '絶縁ドライバーセット', location: 'B', type: 'equipment', requiredQty: 1, currentQty: 1, needPaintCheck: true, status: 'normal', calibrationDate: '' },
    { id: 'item-3', name: '保護メガネ', location: 'C', type: 'consumable', requiredQty: 5, currentQty: 2, needPaintCheck: false, status: 'normal', calibrationDate: '' },
    { id: 'item-4', name: 'デジタルテスター', location: 'A', type: 'equipment', requiredQty: 2, currentQty: 1, needPaintCheck: false, status: 'borrowed', calibrationDate: '2026-12-01' },
];

class StorageManager {
    static init() {
        if (!localStorage.getItem(STORAGE_KEYS.ITEMS)) {
            localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(DEFAULT_ITEMS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.INSPECTIONS)) {
            localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ webhookUrl: "", supervisorEmail: "" }));
        }
    }

    // --- Items (Inventory) ---
    static getItems() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.ITEMS);
            if (!data) return [];
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Storage Error: Failed to parse items', e);
            return [];
        }
    }

    static saveItem(itemData) {
        const items = this.getItems();
        if (itemData.id) {
            // Update
            const index = items.findIndex(i => i.id === itemData.id);
            if (index !== -1) items[index] = { ...items[index], ...itemData };
        } else {
            // Create
            itemData.id = 'item-' + Date.now();
            items.push(itemData);
        }
        localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
        return itemData;
    }

    static deleteItem(id) {
        let items = this.getItems();
        items = items.filter(i => i.id !== id);
        localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    }

    // --- Inspections ---
    static getInspections() {
        const data = localStorage.getItem(STORAGE_KEYS.INSPECTIONS);
        return data ? JSON.parse(data) : [];
    }

    static saveInspection(record) {
        const inspections = this.getInspections();
        record.id = 'insp-' + Date.now();
        record.date = new Date().toISOString();
        inspections.unshift(record); // 最新を先頭に
        localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(inspections));
        return record;
    }

    // --- Settings / Config ---
    static getSettings() {
        const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        return data ? JSON.parse(data) : { webhookUrl: "" };
    }

    static saveSettings(settings) {
        const current = this.getSettings();
        const updated = { ...current, ...settings };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
        return updated;
    }

    // --- Backup & Restore ---
    static exportData() {
        return {
            items: this.getItems(),
            inspections: this.getInspections(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString()
        };
    }

    static importData(jsonData) {
        if(jsonData && jsonData.items && jsonData.inspections) {
            localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(jsonData.items));
            localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(jsonData.inspections));
            
            if(jsonData.settings) {
               localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(jsonData.settings));
            }
            return true;
        }
        return false;
    }
}

// ページ読み込み時に初期化
StorageManager.init();
