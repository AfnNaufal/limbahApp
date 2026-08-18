<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\B3TransactionController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DomesticTransactionController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\SystemSettingController;
use App\Http\Controllers\Api\WasteCategoryController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Authentication Routes (Rate Limited)
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

// Health check endpoint (Public)
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth profile & session
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Waste Categories (read-only)
    Route::apiResource('waste-categories', WasteCategoryController::class)
        ->only(['index', 'show']);

    // B3 Transactions (Delete restricted to ADMIN_EHS)
    Route::delete('b3-transactions/{b3_transaction}', [B3TransactionController::class, 'destroy'])
        ->middleware('role:ADMIN_EHS');
    Route::apiResource('b3-transactions', B3TransactionController::class);

    // Domestic Transactions (Delete restricted to ADMIN_EHS)
    Route::delete('domestic-transactions/{domestic_transaction}', [DomesticTransactionController::class, 'destroy'])
        ->middleware('role:ADMIN_EHS');
    Route::apiResource('domestic-transactions', DomesticTransactionController::class);

    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::post('{notification}/read', [NotificationController::class, 'markAsRead']);
    });

    // System Settings (Restricted to ADMIN_EHS)
    Route::prefix('settings')->group(function () {
        Route::get('/', [SystemSettingController::class, 'index']);
        Route::post('/', [SystemSettingController::class, 'update'])->middleware('role:ADMIN_EHS');
    });

    // Dashboard & Analytics
    Route::prefix('dashboard')->group(function () {
        Route::get('/summary', [DashboardController::class, 'summary']);
        Route::get('/alerts', [DashboardController::class, 'alerts']);
        Route::post('/alerts/{alert}/acknowledge', [DashboardController::class, 'acknowledgeAlert']);
        Route::get('/health', [DashboardController::class, 'health']);
        Route::get('/near-deadline-warnings', [DashboardController::class, 'nearDeadlineWarnings']);
        Route::get('/expired-warnings', [DashboardController::class, 'expiredWarnings']);
        Route::get('/monthly-trends', [DashboardController::class, 'monthlyTrends']);
        Route::get('/trends', [DashboardController::class, 'monthlyTrends']); // Alias for compatibility
        Route::get('/category-breakdown', [DashboardController::class, 'categoryBreakdown']);
    });
});

// Catch-all for undefined routes
Route::fallback(function () {
    return response()->json([
        'message' => 'Route not found',
        'status' => 404,
    ], 404);
});
