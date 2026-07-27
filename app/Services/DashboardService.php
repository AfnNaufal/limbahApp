<?php

namespace App\Services;

use App\Models\B3Transaction;
use App\Models\DomesticTransaction;
use App\Models\Notification;
use App\Models\StorageAlert;
use Carbon\Carbon;

class DashboardService
{
    protected B3TransactionService $b3Service;
    protected DomesticTransactionService $domesticService;

    /**
     * Constructor
     */
    public function __construct(
        B3TransactionService $b3Service,
        DomesticTransactionService $domesticService
    ) {
        $this->b3Service = $b3Service;
        $this->domesticService = $domesticService;
    }

    /**
     * Get comprehensive dashboard summary with all KPIs
     */
    public function getSummary(): array
    {
        $b3Stats = $this->b3Service->getStatistics();
        $domesticTodayStats = $this->domesticService->calculateDailyStats(today());

        return [
            // B3 Statistics
            'b3_total_weight_kg' => $b3Stats['total_weight_kg'],
            'b3_count_in' => $b3Stats['in_count'],
            'b3_count_out' => $b3Stats['out_count'],
            'b3_in_weight_kg' => $b3Stats['in_weight_kg'],
            'b3_out_weight_kg' => $b3Stats['out_weight_kg'],
            'b3_pending_count' => $b3Stats['pending_count'],

            // Domestic Statistics (Today)
            'domestic_today_organic_kg' => $domesticTodayStats['organic_kg'],
            'domestic_today_inorganic_kg' => $domesticTodayStats['inorganic_kg'],
            'domestic_today_total_kg' => $domesticTodayStats['total_kg'],

            // Alert Statistics
            'storage_alerts_active' => StorageAlert::active()->count(),
            'storage_alerts_expired' => StorageAlert::active()
                ->where('deadline_at', '<', now())
                ->count(),

            // Notification Statistics
            'notifications_unread' => Notification::unread()->count(),

            // Recent Data
            'recent_b3_transactions' => $this->b3Service->getRecentTransactions(5),
            'recent_domestic_transactions' => $this->domesticService->getRecentTransactions(5),
            'recent_alerts' => $this->getRecentAlerts(5),
        ];
    }

    /**
     * Get all active and pending alerts
     */
    public function getAlerts(): array
    {
        $alerts = StorageAlert::active()
            ->with('b3Transaction.wasteCategory')
            ->orderBy('deadline_at', 'asc')
            ->get();

        return $alerts->map(function ($alert) {
            return [
                'id' => $alert->id,
                'alert_type' => $alert->alert_type,
                'deadline_at' => $alert->deadline_at->toIso8601String(),
                'is_expired' => $alert->deadline_at->isPast(),
                'days_until_deadline' => $alert->deadline_at->diffInDays(now(), false),
                'is_triggered' => $alert->triggered_at !== null,
                'triggered_at' => $alert->triggered_at?->toIso8601String(),
                'b3_transaction' => [
                    'id' => $alert->b3Transaction->id,
                    'waste_code' => $alert->b3Transaction->waste_code,
                    'waste_name' => $alert->b3Transaction->waste_name,
                    'transaction_type' => $alert->b3Transaction->transaction_type,
                    'weight_kg' => $alert->b3Transaction->weight_kg,
                    'status' => $alert->b3Transaction->status,
                ],
            ];
        })->toArray();
    }

    /**
     * Get recent alerts
     */
    public function getRecentAlerts(int $limit = 5)
    {
        return StorageAlert::with('b3Transaction.wasteCategory')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get dashboard with date range filters
     */
    public function getSummaryByDateRange(Carbon $from, Carbon $to): array
    {
        $b3StatsRange = [
            'in_weight_kg' => $this->b3Service->calculateTotalWeightByType('IN', [$from, $to]),
            'out_weight_kg' => $this->b3Service->calculateTotalWeightByType('OUT', [$from, $to]),
            'total_transactions' => B3Transaction::byDateRange($from, $to)->count(),
        ];

        $domesticStatsRange = $this->domesticService->getStatsByDateRange($from, $to);

        return [
            'period' => [
                'from' => $from->format('Y-m-d'),
                'to' => $to->format('Y-m-d'),
            ],
            'b3' => $b3StatsRange,
            'domestic' => $domesticStatsRange,
            'alerts_count' => StorageAlert::whereHas('b3Transaction', function ($query) use ($from, $to) {
                $query->byDateRange($from, $to);
            })->count(),
        ];
    }

    /**
     * Get near-deadline alerts for warnings
     */
    public function getNearDeadlineWarnings(int $days = 7): array
    {
        $transactions = $this->b3Service->getNearDeadlineTransactions($days);

        return array_map(function ($transaction) {
            $daysRemaining = Carbon::parse($transaction['storage_deadline_at'])->diffInDays(now(), false);
            return [
                'id' => $transaction['id'],
                'waste_name' => $transaction['waste_name'],
                'storage_deadline_at' => $transaction['storage_deadline_at'],
                'days_remaining' => $daysRemaining,
                'priority' => $daysRemaining <= 2 ? 'HIGH' : ($daysRemaining <= 5 ? 'MEDIUM' : 'LOW'),
            ];
        }, $transactions);
    }

    /**
     * Get expired alerts for critical warnings
     */
    public function getExpiredWarnings(): array
    {
        $transactions = $this->b3Service->getExpiredTransactions();

        return array_map(function ($transaction) {
            $daysExpired = abs(Carbon::parse($transaction['storage_deadline_at'])->diffInDays(now(), false));
            return [
                'id' => $transaction['id'],
                'waste_name' => $transaction['waste_name'],
                'storage_deadline_at' => $transaction['storage_deadline_at'],
                'days_expired' => $daysExpired,
                'priority' => 'CRITICAL',
            ];
        }, $transactions);
    }

    /**
     * Get monthly trends
     */
    public function getMonthlyTrends(int $months = 12): array
    {
        $trends = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $from = $date->clone()->startOfMonth();
            $to = $date->clone()->endOfMonth();

            $b3Count = B3Transaction::byDateRange($from, $to)->count();
            $domesticCount = DomesticTransaction::byDateRange($from, $to)->count();
            $b3Weight = (float) B3Transaction::byDateRange($from, $to)->sum('weight_kg');
            $domesticWeight = (float) DomesticTransaction::byDateRange($from, $to)->sum('total_weight_kg');

            $trends[] = [
                'month' => $date->format('Y-m'),
                'month_name' => $date->format('F Y'),
                'b3_count' => $b3Count,
                'b3_weight_kg' => $b3Weight,
                'domestic_count' => $domesticCount,
                'domestic_weight_kg' => $domesticWeight,
            ];
        }

        return $trends;
    }

    /**
     * Get category breakdown
     */
    public function getCategoryBreakdown(): array
    {
        $categories = B3Transaction::with('wasteCategory')
            ->get()
            ->groupBy('waste_category_id');

        return $categories->map(function ($transactions, $categoryId) {
            $firstTx = $transactions->first();
            return [
                'category_id' => $categoryId,
                'category_name' => $firstTx->wasteCategory->name,
                'category_code' => $firstTx->wasteCategory->code,
                'transaction_count' => $transactions->count(),
                'total_weight_kg' => (float) $transactions->sum('weight_kg'),
                'in_count' => $transactions->where('transaction_type', 'IN')->count(),
                'out_count' => $transactions->where('transaction_type', 'OUT')->count(),
            ];
        })->values()->toArray();
    }

    /**
     * Get health check status
     */
    public function getHealthStatus(): array
    {
        $expiredCount = StorageAlert::active()
            ->where('deadline_at', '<', now())
            ->count();

        $nearDeadlineCount = $this->b3Service->getNearDeadlineTransactions(7);

        $status = 'HEALTHY';
        if ($expiredCount > 0) {
            $status = 'CRITICAL';
        } elseif (count($nearDeadlineCount) > 5) {
            $status = 'WARNING';
        }

        return [
            'status' => $status,
            'expired_alerts' => $expiredCount,
            'near_deadline_count' => count($nearDeadlineCount),
            'unread_notifications' => Notification::unread()->count(),
            'last_checked' => now()->toIso8601String(),
        ];
    }
}
