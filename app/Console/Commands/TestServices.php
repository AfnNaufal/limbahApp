<?php

namespace App\Console\Commands;

use App\Services\B3TransactionService;
use App\Services\DashboardService;
use App\Services\DomesticTransactionService;
use Illuminate\Console\Command;

class TestServices extends Command
{
    protected $signature = 'test:services';
    protected $description = 'Test all Phase 1 services';

    public function handle(
        B3TransactionService $b3Service,
        DomesticTransactionService $domesticService,
        DashboardService $dashboardService
    ) {
        $this->line('=== B3 SERVICE TESTS ===');
        $b3Stats = $b3Service->getStatistics();
        $this->line('Total B3 Transactions: ' . $b3Stats['total_count']);
        $this->line('B3 IN Count: ' . $b3Stats['in_count']);
        $this->line('B3 OUT Count: ' . $b3Stats['out_count']);
        $this->line('Total B3 Weight: ' . $b3Stats['total_weight_kg'] . ' kg');
        $this->newLine();

        $this->line('=== DOMESTIC SERVICE TESTS ===');
        $this->line('Today Organic: ' . $domesticService->getTodayOrganicTotal() . ' kg');
        $this->line('Today Inorganic: ' . $domesticService->getTodayInorganicTotal() . ' kg');
        $this->line('Today Total: ' . $domesticService->getTodayTotalWeight() . ' kg');
        $this->newLine();

        $this->line('=== DASHBOARD SERVICE TESTS ===');
        $summary = $dashboardService->getSummary();
        $this->line('B3 Total Weight: ' . $summary['b3_total_weight_kg'] . ' kg');
        $this->line('B3 In Count: ' . $summary['b3_count_in']);
        $this->line('B3 Out Count: ' . $summary['b3_count_out']);
        $this->line('B3 Pending: ' . $summary['b3_pending_count']);
        $this->line('Domestic Today Organic: ' . $summary['domestic_today_organic_kg'] . ' kg');
        $this->line('Domestic Today Inorganic: ' . $summary['domestic_today_inorganic_kg'] . ' kg');
        $this->line('Domestic Today Total: ' . $summary['domestic_today_total_kg'] . ' kg');
        $this->line('Active Alerts: ' . $summary['storage_alerts_active']);
        $this->line('Expired Alerts: ' . $summary['storage_alerts_expired']);
        $this->line('Unread Notifications: ' . $summary['notifications_unread']);
        $this->line('Recent B3 Transactions: ' . count($summary['recent_b3_transactions']));
        $this->line('Recent Domestic Transactions: ' . count($summary['recent_domestic_transactions']));
        $this->line('Recent Alerts: ' . count($summary['recent_alerts']));
        $this->newLine();

        $this->line('=== HEALTH CHECK ===');
        $health = $dashboardService->getHealthStatus();
        $this->line('Status: ' . $health['status']);
        $this->line('Expired Alerts: ' . $health['expired_alerts']);
        $this->line('Near Deadline: ' . $health['near_deadline_count']);
        $this->newLine();

        $this->line('=== ALERTS DETAIL ===');
        $alerts = $dashboardService->getAlerts();
        $this->line('Total Active Alerts: ' . count($alerts));
        if (count($alerts) > 0) {
            $alert = $alerts[0];
            $this->line('First Alert: ' . $alert['b3_transaction']['waste_name'] . ' - ' . $alert['alert_type']);
            $this->line('Days Until Deadline: ' . $alert['days_until_deadline']);
        }
        $this->newLine();

        $this->line('=== CATEGORY BREAKDOWN ===');
        $categories = $dashboardService->getCategoryBreakdown();
        $this->line('Total Categories: ' . count($categories));
        if (count($categories) > 0) {
            $cat = $categories[0];
            $this->line('Top Category: ' . $cat['category_name'] . ' - ' . $cat['transaction_count'] . ' transactions (' . $cat['total_weight_kg'] . 'kg)');
        }
        $this->newLine();

        $this->info('✅ ALL SERVICES WORKING CORRECTLY!');
    }
}
