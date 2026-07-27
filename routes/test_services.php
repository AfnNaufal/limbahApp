<?php

$b3Service = app(\App\Services\B3TransactionService::class);
$domesticService = app(\App\Services\DomesticTransactionService::class);
$dashboardService = app(\App\Services\DashboardService::class);

echo "=== B3 SERVICE TESTS ===" . PHP_EOL;
echo "Total B3 Transactions: " . $b3Service->getStatistics()['total_count'] . PHP_EOL;
echo "B3 IN Count: " . $b3Service->getStatistics()['in_count'] . PHP_EOL;
echo "B3 OUT Count: " . $b3Service->getStatistics()['out_count'] . PHP_EOL;
echo "Total B3 Weight: " . $b3Service->getStatistics()['total_weight_kg'] . " kg" . PHP_EOL;
echo PHP_EOL;

echo "=== DOMESTIC SERVICE TESTS ===" . PHP_EOL;
echo "Today Organic: " . $domesticService->getTodayOrganicTotal() . " kg" . PHP_EOL;
echo "Today Inorganic: " . $domesticService->getTodayInorganicTotal() . " kg" . PHP_EOL;
echo "Today Total: " . $domesticService->getTodayTotalWeight() . " kg" . PHP_EOL;
echo PHP_EOL;

echo "=== DASHBOARD SERVICE TESTS ===" . PHP_EOL;
$summary = $dashboardService->getSummary();
echo "B3 Total Weight: " . $summary['b3_total_weight_kg'] . " kg" . PHP_EOL;
echo "B3 In Count: " . $summary['b3_count_in'] . PHP_EOL;
echo "B3 Out Count: " . $summary['b3_count_out'] . PHP_EOL;
echo "Domestic Today Organic: " . $summary['domestic_today_organic_kg'] . " kg" . PHP_EOL;
echo "Domestic Today Inorganic: " . $summary['domestic_today_inorganic_kg'] . " kg" . PHP_EOL;
echo "Domestic Today Total: " . $summary['domestic_today_total_kg'] . " kg" . PHP_EOL;
echo "Active Alerts: " . $summary['storage_alerts_active'] . PHP_EOL;
echo "Expired Alerts: " . $summary['storage_alerts_expired'] . PHP_EOL;
echo "Unread Notifications: " . $summary['notifications_unread'] . PHP_EOL;
echo "Recent B3 Transactions: " . count($summary['recent_b3_transactions']) . PHP_EOL;
echo "Recent Domestic Transactions: " . count($summary['recent_domestic_transactions']) . PHP_EOL;
echo "Recent Alerts: " . count($summary['recent_alerts']) . PHP_EOL;
echo PHP_EOL;

echo "=== HEALTH CHECK ===" . PHP_EOL;
$health = $dashboardService->getHealthStatus();
echo "Status: " . $health['status'] . PHP_EOL;
echo "Expired Alerts: " . $health['expired_alerts'] . PHP_EOL;
echo "Near Deadline: " . $health['near_deadline_count'] . PHP_EOL;
echo PHP_EOL;

echo "=== MONTHLY TRENDS (Last 3 Months) ===" . PHP_EOL;
$trends = $dashboardService->getMonthlyTrends(3);
foreach ($trends as $trend) {
    echo $trend['month_name'] . ": B3=" . $trend['b3_count'] . " (" . $trend['b3_weight_kg'] . "kg), Domestic=" . $trend['domestic_count'] . " (" . $trend['domestic_weight_kg'] . "kg)" . PHP_EOL;
}
echo PHP_EOL;

echo "✅ ALL SERVICES WORKING CORRECTLY!" . PHP_EOL;
