<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\DashboardSummaryResource;
use App\Http\Resources\StorageAlertResource;
use App\Services\DashboardService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class DashboardController
{
    public function __construct(protected DashboardService $service) {}

    /**
     * Get dashboard summary with all KPIs
     */
    public function summary(Request $request): DashboardSummaryResource
    {
        // Check if filtering by date range
        if ($request->has('date_from') && $request->has('date_to')) {
            $from = Carbon::parse($request->input('date_from'));
            $to = Carbon::parse($request->input('date_to'));
            $summary = $this->service->getSummaryByDateRange($from, $to);
        } else {
            $summary = $this->service->getSummary();
        }

        return new DashboardSummaryResource($summary);
    }

    /**
     * Get all active storage alerts
     */
    public function alerts(Request $request): AnonymousResourceCollection
    {
        $alerts = $this->service->getAlerts();

        return StorageAlertResource::collection($alerts);
    }

    /**
     * Get health check status
     */
    public function health(): Response
    {
        $health = $this->service->getHealthStatus();

        return response()->json($health);
    }

    /**
     * Get near-deadline warnings
     */
    public function nearDeadlineWarnings(Request $request): Response
    {
        $days = $request->input('days', 7);
        $warnings = $this->service->getNearDeadlineWarnings($days);

        return response()->json([
            'days' => $days,
            'count' => count($warnings),
            'warnings' => $warnings,
        ]);
    }

    /**
     * Get expired warnings (critical)
     */
    public function expiredWarnings(): Response
    {
        $warnings = $this->service->getExpiredWarnings();

        return response()->json([
            'count' => count($warnings),
            'warnings' => $warnings,
        ]);
    }

    /**
     * Get monthly trends
     */
    public function monthlyTrends(Request $request): Response
    {
        $months = $request->input('months', 12);
        $trends = $this->service->getMonthlyTrends($months);

        return response()->json([
            'months' => $months,
            'trends' => $trends,
        ]);
    }

    /**
     * Get category breakdown
     */
    public function categoryBreakdown(): Response
    {
        $breakdown = $this->service->getCategoryBreakdown();

        return response()->json([
            'categories' => $breakdown,
        ]);
    }
}
