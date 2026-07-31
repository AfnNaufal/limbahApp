<?php

use App\Services\B3TransactionService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(function (B3TransactionService $service) {
    $service->checkAndCreateStorageAlerts();
})->daily()->name('check-b3-storage-alerts');
