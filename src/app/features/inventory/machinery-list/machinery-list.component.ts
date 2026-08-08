import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../inventory.service';
import { Machine } from '../inventory.model';

@Component({
    selector: 'app-machinery-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './machinery-list.component.html',
    styleUrls: ['./machinery-list.component.css']
})
export class MachineryListComponent implements OnInit {
    machines: Machine[] = [];

    constructor(private inventoryService: InventoryService) { }

    ngOnInit() {
        this.loadMachines();
    }

    loadMachines() {
        this.inventoryService.getAllMachines().subscribe({
            next: (data) => this.machines = data,
            error: (err) => {
                console.error('Failed to load machines', err);
                // Fallback mock data if service is not running yet
                this.machines = [
                    { serialNumber: 'EX-2024-001', name: 'Excavadora Cat 320', type: 'Excavator', status: 'IN_USE', currentLocation: 'Proyecto Centro' },
                    { serialNumber: 'TR-2024-055', name: 'Camión Volquete', type: 'Truck', status: 'AVAILABLE', currentLocation: 'Almacén Central' },
                    { serialNumber: 'CR-2024-012', name: 'Grúa Torre', type: 'Crane', status: 'MAINTENANCE', currentLocation: 'Taller' }
                ];
            }
        });
    }

    getCountByStatus(status: string): number {
        return this.machines.filter(m => m.status === status).length;
    }

    getIconForType(type: string): string {
        switch (type.toLowerCase()) {
            case 'excavator': return '🚜';
            case 'truck': return '🚚';
            case 'crane': return '🏗️';
            default: return '⚙️';
        }
    }

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'AVAILABLE': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
            case 'IN_USE': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
            case 'MAINTENANCE':
            case 'REPAIR_NEEDED': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
            default: return 'bg-gray-100 text-gray-700';
        }
    }
}
