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
            $tx = data_get($alert, 'b3Transaction') ?? data_get($alert, 'b3_transaction');
            $deadline = data_get($alert, 'deadline_at');
            $deadlineCarbon = $deadline ? (is_string($deadline) ? Carbon::parse($deadline) : $deadline) : null;
            $triggered = data_get($alert, 'triggered_at');

            return [
                'id' => data_get($alert, 'id'),
                'alert_type' => data_get($alert, 'alert_type'),
                'is_active' => (bool) (data_get($alert, 'is_active') ?? true),
                'deadline_at' => $deadlineCarbon?->toIso8601String(),
                'is_expired' => $deadlineCarbon?->isPast() ?? false,
                'days_until_deadline' => $deadlineCarbon ? $deadlineCarbon->diffInDays(now(), false) : 0,
                'is_triggered' => $triggered !== null,
                'triggered_at' => $triggered ? (is_string($triggered) ? Carbon::parse($triggered)->toIso8601String() : $triggered->toIso8601String()) : null,
                'b3_transaction' => $tx ? [
                    'id' => data_get($tx, 'id'),
                    'waste_code' => data_get($tx, 'waste_code'),
                    'waste_name' => data_get($tx, 'waste_name'),
                    'transaction_type' => data_get($tx, 'transaction_type'),
                    'weight_kg' => data_get($tx, 'weight_kg'),
                    'status' => data_get($tx, 'status'),
                ] : null,
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

            $b3Stats = B3Transaction::byDateRange($from, $to)
                ->selectRaw('COUNT(*) as agg_count, COALESCE(SUM(weight_kg), 0) as total_weight')
                ->first();

            $domesticStats = DomesticTransaction::byDateRange($from, $to)
                ->selectRaw('COUNT(*) as agg_count, COALESCE(SUM(total_weight_kg), 0) as total_weight')
                ->first();

            $trends[] = [
                'month' => $date->format('Y-m'),
                'month_name' => $date->format('F Y'),
                'b3_count' => (int) ($b3Stats->agg_count ?? 0),
                'b3_weight_kg' => (float) ($b3Stats->total_weight ?? 0),
                'domestic_count' => (int) ($domesticStats->agg_count ?? 0),
                'domestic_weight_kg' => (float) ($domesticStats->total_weight ?? 0),
            ];
        }

        return $trends;
    }

    /**
     * Get category breakdown
     */
    public function getCategoryBreakdown(): array
    {
        return B3Transaction::join('waste_categories', 'b3_transactions.waste_category_id', '=', 'waste_categories.id')
            ->selectRaw('
                waste_categories.id as category_id,
                waste_categories.name as category_name,
                waste_categories.code as category_code,
                COUNT(*) as transaction_count,
                COALESCE(SUM(b3_transactions.weight_kg), 0) as total_weight_kg,
                SUM(CASE WHEN b3_transactions.transaction_type = "IN" THEN 1 ELSE 0 END) as in_count,
                SUM(CASE WHEN b3_transactions.transaction_type = "OUT" THEN 1 ELSE 0 END) as out_count
            ')
            ->groupBy('waste_categories.id', 'waste_categories.name', 'waste_categories.code')
            ->get()
            ->map(function ($row) {
                return [
                    'category_id' => (int) $row->category_id,
                    'category_name' => $row->category_name,
                    'category_code' => $row->category_code,
                    'transaction_count' => (int) $row->transaction_count,
                    'total_weight_kg' => (float) $row->total_weight_kg,
                    'in_count' => (int) $row->in_count,
                    'out_count' => (int) $row->out_count,
                ];
            })
            ->toArray();
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
