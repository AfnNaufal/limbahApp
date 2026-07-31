<?php

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
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Health check endpoint
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

// Waste Categories (read-only for now)
Route::apiResource('waste-categories', WasteCategoryController::class)
    ->only(['index', 'show']);

// B3 Transactions (full CRUD)
Route::apiResource('b3-transactions', B3TransactionController::class);

// Domestic Transactions (full CRUD)
Route::apiResource('domestic-transactions', DomesticTransactionController::class);

// Notifications
Route::prefix('notifications')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::post('{notification}/read', [NotificationController::class, 'markAsRead']);
});

// System Settings
Route::prefix('settings')->group(function () {
    Route::get('/', [SystemSettingController::class, 'index']);
    Route::post('/', [SystemSettingController::class, 'update']);
});

// Dashboard & Analytics
Route::prefix('dashboard')->group(function () {
    Route::get('/summary', [DashboardController::class, 'summary']);
    Route::get('/alerts', [DashboardController::class, 'alerts']);
    Route::get('/health', [DashboardController::class, 'health']);
    Route::get('/near-deadline-warnings', [DashboardController::class, 'nearDeadlineWarnings']);
    Route::get('/expired-warnings', [DashboardController::class, 'expiredWarnings']);
    Route::get('/monthly-trends', [DashboardController::class, 'monthlyTrends']);
    Route::get('/category-breakdown', [DashboardController::class, 'categoryBreakdown']);
});

// Catch-all for undefined routes
Route::fallback(function () {
    return response()->json([
        'message' => 'Route not found',
        'status' => 404,
    ], 404);
});
